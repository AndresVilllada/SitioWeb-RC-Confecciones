// Lectura y escritura del contenido editable (productos, servicios, galería, contacto) y de las fotos.
//
// NOTA SOBRE LOS LÍMITES DEL PLAN GRATIS DE CLOUDFLARE: cada petición puede hacer pocas consultas
// a la base de datos (50). Por eso guardar el contenido se hace con UNA consulta por tabla usando
// json_each (la lista completa viaja como un solo parámetro JSON) y no con una consulta por fila.
import { ErrorHttp } from "./util.js";
import { aHex, deBase64, sha256Hex } from "./seguridad.js";
import { DATA_URL, RUTA_SUBIDA, esDataUrl } from "./validar.js";

export const MAX_FOTO_BYTES = 1_000_000;   // una fila de D1 no puede pasar de ~2 MB; en base64 pesa 1/3 más
export const MAX_FOTOS_NUEVAS = 20;        // por guardado (para no pasar el límite de consultas)

// ---------- Leer ----------
export async function leerContenido(db) {
  const [productos, servicios, galeria, contacto] = await db.batch([
    db.prepare(`SELECT p.id, p.nombre, p.descripcion, p.precio,
                  (SELECT json_group_array(ruta) FROM (SELECT ruta FROM producto_fotos WHERE producto_id = p.id ORDER BY orden)) AS fotos
                FROM productos p ORDER BY p.orden`),
    db.prepare(`SELECT s.id, s.titulo, s.texto,
                  (SELECT json_group_array(ruta) FROM (SELECT ruta FROM servicio_fotos WHERE servicio_id = s.id ORDER BY orden)) AS fotos
                FROM servicios s ORDER BY s.orden`),
    db.prepare("SELECT ruta FROM galeria ORDER BY orden"),
    db.prepare("SELECT whatsapp, instagram, correo, ubicacion FROM contacto WHERE id = 1"),
  ]);
  return {
    productos: productos.results.map((p) => ({ id: p.id, nombre: p.nombre, descripcion: p.descripcion, precio: p.precio, fotos: JSON.parse(p.fotos || "[]") })),
    servicios: servicios.results.map((s) => ({ id: s.id, titulo: s.titulo, texto: s.texto, fotos: JSON.parse(s.fotos || "[]") })),
    galeria: galeria.results.map((g) => g.ruta),
    contacto: contacto.results[0] ?? { whatsapp: "", instagram: "", correo: "", ubicacion: "" },
  };
}

// ---------- Versión del contenido (control de ediciones simultáneas) ----------
/** Número de versión actual. Sube en 1 con cada guardado del panel. */
export async function leerVersion(db) {
  const f = await db.prepare("SELECT version FROM contenido_version WHERE id = 1").first();
  return f?.version ?? 1;
}

const MSJ_VERSION = "Otra persona guardó cambios mientras editabas. Recarga el panel para ver lo último y vuelve a hacer tu cambio.";

// ---------- Fotos ----------
function decodificarImagen(dataUrl) {
  const m = DATA_URL.exec(dataUrl);
  if (!m) throw new ErrorHttp(422, "Una foto no es una imagen JPG, PNG o WebP válida.");
  let bytes;
  try { bytes = deBase64(m[2]); } catch { throw new ErrorHttp(422, "Una foto está dañada."); }
  if (bytes.length > MAX_FOTO_BYTES) throw new ErrorHttp(413, `Una foto pesa más de ${Math.round(MAX_FOTO_BYTES / 1000)} KB. Redúcela antes de subirla.`);
  // El tipo se confirma mirando los primeros bytes (no basta con lo que diga la cabecera data:)
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const webp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  const mime = jpeg ? "image/jpeg" : png ? "image/png" : webp ? "image/webp" : null;
  if (!mime || mime !== "image/" + m[1].replace("jpg", "jpeg")) throw new ErrorHttp(422, "Una foto no es realmente una imagen del tipo que dice ser.");
  return { mime, bytes, b64: m[2] };
}

/**
 * Recorre todas las listas de fotos: las imágenes enviadas como data URL se convierten en
 * "/api/fotos/<id>" (id = hash de la imagen, así la misma foto no se guarda dos veces).
 * Devuelve el contenido con rutas y las imágenes nuevas por insertar.
 */
export async function procesarFotos(contenido) {
  const nuevas = new Map(); // id -> { mime, b64, bytes }
  const convertir = async (lista) => {
    const salida = [];
    for (const f of lista) {
      if (!esDataUrl(f)) { salida.push(f); continue; }
      const img = decodificarImagen(f);
      const id = (await sha256Hex(img.bytes)).slice(0, 32);
      if (!nuevas.has(id)) nuevas.set(id, { mime: img.mime, b64: img.b64, bytes: img.bytes.length });
      salida.push(`/api/fotos/${id}`);
    }
    return salida;
  };
  const resultado = {
    productos: [], servicios: [], galeria: await convertir(contenido.galeria), contacto: contenido.contacto,
  };
  for (const p of contenido.productos) resultado.productos.push({ ...p, fotos: await convertir(p.fotos) });
  for (const s of contenido.servicios) resultado.servicios.push({ ...s, fotos: await convertir(s.fotos) });
  if (nuevas.size > MAX_FOTOS_NUEVAS) throw new ErrorHttp(422, `Sube las fotos en tandas de ${MAX_FOTOS_NUEVAS} o menos y guarda entre tanda y tanda.`);
  return { contenido: resultado, nuevas };
}

/** Las rutas /api/fotos/<id> que ya vienen en el contenido deben existir (o estar entre las nuevas). */
async function verificarFotosExistentes(db, contenido, nuevas) {
  const pedidas = new Set();
  const revisar = (lista) => lista.forEach((r) => RUTA_SUBIDA.test(r) && !nuevas.has(r.slice(11)) && pedidas.add(r.slice(11)));
  revisar(contenido.galeria);
  contenido.productos.forEach((p) => revisar(p.fotos));
  contenido.servicios.forEach((s) => revisar(s.fotos));
  if (pedidas.size === 0) return;
  const { results } = await db.prepare("SELECT id FROM fotos WHERE id IN (SELECT value FROM json_each(?1))").bind(JSON.stringify([...pedidas])).all();
  const existen = new Set(results.map((r) => r.id));
  const faltan = [...pedidas].filter((id) => !existen.has(id));
  if (faltan.length) throw new ErrorHttp(422, "Una de las fotos indicadas ya no existe en el servidor. Vuelve a subirla.");
}

// ---------- Guardar (todo o nada) ----------
export async function guardarContenido(db, contenidoValidado, versionEsperada) {
  // Comprobación rápida (da el aviso antes de procesar fotos). La que de verdad protege es la "guardia" de abajo.
  if ((await leerVersion(db)) !== versionEsperada) throw new ErrorHttp(412, MSJ_VERSION);

  const { contenido, nuevas } = await procesarFotos(contenidoValidado);
  await verificarFotosExistentes(db, contenido, nuevas);

  const sentencias = [
    // GUARDIA DE VERSIÓN. Va primero y en el mismo lote (transacción) que el resto:
    //  1) sube la versión solo si sigue siendo la que el administrador vio;
    //  2) si no hubo fila afectada (otro guardó justo antes), pone version = NULL, que está prohibido (NOT NULL)
    //     y por eso D1 deshace TODO el lote. Así dos guardados simultáneos nunca se mezclan ni se pierde uno sin aviso.
    db.prepare("UPDATE contenido_version SET version = version + 1, actualizado = datetime('now') WHERE id = 1 AND version = ?1").bind(versionEsperada),
    db.prepare("UPDATE contenido_version SET version = NULL WHERE id = 1 AND changes() = 0"),
  ];
  for (const [id, f] of nuevas) {
    sentencias.push(db.prepare("INSERT OR IGNORE INTO fotos (id, mime, datos_b64, bytes) VALUES (?1, ?2, ?3, ?4)").bind(id, f.mime, f.b64, f.bytes));
  }
  // Se borra y se vuelve a escribir el contenido (más simple que comparar fila por fila).
  // db.batch() las ejecuta como una sola transacción: si algo falla, no queda nada a medias.
  sentencias.push(
    db.prepare("DELETE FROM producto_fotos"),
    db.prepare("DELETE FROM servicio_fotos"),
    db.prepare("DELETE FROM galeria"),
    db.prepare("DELETE FROM productos"),
    db.prepare("DELETE FROM servicios"),
    db.prepare(`INSERT INTO productos (id, nombre, descripcion, precio, orden)
                SELECT json_extract(value, '$.id'), json_extract(value, '$.nombre'), json_extract(value, '$.descripcion'), json_extract(value, '$.precio'), key
                FROM json_each(?1)`).bind(JSON.stringify(contenido.productos)),
    db.prepare(`INSERT INTO producto_fotos (producto_id, orden, ruta)
                SELECT json_extract(p.value, '$.id'), f.key, f.value FROM json_each(?1) AS p, json_each(p.value, '$.fotos') AS f`).bind(JSON.stringify(contenido.productos)),
    db.prepare(`INSERT INTO servicios (id, titulo, texto, orden)
                SELECT json_extract(value, '$.id'), json_extract(value, '$.titulo'), json_extract(value, '$.texto'), key
                FROM json_each(?1)`).bind(JSON.stringify(contenido.servicios)),
    db.prepare(`INSERT INTO servicio_fotos (servicio_id, orden, ruta)
                SELECT json_extract(s.value, '$.id'), f.key, f.value FROM json_each(?1) AS s, json_each(s.value, '$.fotos') AS f`).bind(JSON.stringify(contenido.servicios)),
    db.prepare("INSERT INTO galeria (orden, ruta) SELECT key, value FROM json_each(?1)").bind(JSON.stringify(contenido.galeria)),
    db.prepare("INSERT OR REPLACE INTO contacto (id, whatsapp, instagram, correo, ubicacion) VALUES (1, ?1, ?2, ?3, ?4)")
      .bind(contenido.contacto.whatsapp, contenido.contacto.instagram, contenido.contacto.correo, contenido.contacto.ubicacion),
    // Limpieza: se borran las fotos subidas que ya no usa ningún producto, servicio ni la galería
    db.prepare(`DELETE FROM fotos WHERE '/api/fotos/' || id NOT IN (
                  SELECT ruta FROM producto_fotos UNION SELECT ruta FROM servicio_fotos UNION SELECT ruta FROM galeria)`),
  );
  try {
    await db.batch(sentencias);
  } catch (e) {
    if (/contenido_version/.test(String(e?.message) + String(e?.cause?.message))) throw new ErrorHttp(412, MSJ_VERSION);
    throw e;
  }
  return leerContenido(db);
}

// ---------- Servir una foto ----------
export async function leerFoto(db, id) {
  const f = await db.prepare("SELECT mime, datos_b64 FROM fotos WHERE id = ?1").bind(id).first();
  if (!f) return null;
  return { mime: f.mime, bytes: deBase64(f.datos_b64) };
}

export { aHex };
