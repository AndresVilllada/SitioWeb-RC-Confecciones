// Validación en el servidor. Lo que valida el formulario de la página NO basta: cualquiera puede
// enviar peticiones sin pasar por la página, así que el servidor revisa todo otra vez.
import { ErrorHttp } from "./util.js";

const CORREO = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

export class Validador {
  constructor() {
    this.errores = {};
  }
  error(campo, mensaje) {
    if (!this.errores[campo]) this.errores[campo] = mensaje;
  }
  /** Texto con límites. Devuelve el texto limpio (sin espacios sobrantes en los bordes). */
  texto(obj, campo, etiqueta, { min = 0, max, requerido = false } = {}) {
    let v = obj?.[campo];
    if (v === undefined || v === null) v = "";
    if (typeof v !== "string") {
      this.error(campo, `${etiqueta} debe ser texto.`);
      return "";
    }
    v = v.trim();
    if (requerido && v.length === 0) this.error(campo, `${etiqueta} es obligatorio.`);
    else if (v.length > 0 && v.length < min) this.error(campo, `${etiqueta} debe tener al menos ${min} caracteres.`);
    if (v.length > max) this.error(campo, `${etiqueta} no puede pasar de ${max} caracteres.`);
    return v;
  }
  correo(obj, campo, etiqueta, { requerido = false } = {}) {
    const v = this.texto(obj, campo, etiqueta, { max: 254, requerido });
    if (v && !CORREO.test(v)) this.error(campo, `${etiqueta} no tiene un formato válido.`);
    return v.toLowerCase();
  }
  entero(obj, campo, etiqueta, { min, max, requerido = true } = {}) {
    const v = obj?.[campo];
    if (v === undefined || v === null || v === "") {
      if (requerido) this.error(campo, `${etiqueta} es obligatorio.`);
      return null;
    }
    if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > max) {
      this.error(campo, `${etiqueta} debe ser un número entero entre ${min} y ${max}.`);
      return null;
    }
    return v;
  }
  opcion(obj, campo, etiqueta, permitidas, { requerido = true, porDefecto = null } = {}) {
    const v = obj?.[campo];
    if (v === undefined || v === null || v === "") {
      if (requerido) this.error(campo, `${etiqueta} es obligatorio.`);
      return porDefecto;
    }
    if (typeof v !== "string" || !permitidas.includes(v)) {
      this.error(campo, `${etiqueta} debe ser una de estas opciones: ${permitidas.join(", ")}.`);
      return porDefecto;
    }
    return v;
  }
  /** Lanza el error 422 con el detalle de cada campo, si hubo alguno. */
  terminar() {
    if (Object.keys(this.errores).length) throw new ErrorHttp(422, "Revisa los datos enviados.", this.errores);
  }
}

// ---------- Fecha ----------
/** Hoy en Colombia (UTC-5) como AAAA-MM-DD. */
export function hoyColombia() {
  return new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10);
}
export function fechaValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const d = new Date(texto + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === texto;
}

// ---------- Cotización ----------
export const TIPOS_CLIENTE = ["empresa", "club", "restaurante", "otro"];

export function validarCotizacion(c) {
  const v = new Validador();
  const out = {
    nombre: v.texto(c, "nombre", "El nombre", { min: 3, max: 60, requerido: true }),
    organizacion: v.texto(c, "organizacion", "La empresa u organización", { max: 80 }),
    correo: v.correo(c, "correo", "El correo", { requerido: true }),
    telefono: v.texto(c, "telefono", "El teléfono", { requerido: true, max: 10 }),
    tipoCliente: v.opcion(c, "tipoCliente", "El tipo de cliente", TIPOS_CLIENTE),
    prenda: v.texto(c, "prenda", "El tipo de prenda", { max: 60, requerido: true }),
    cantidad: v.entero(c, "cantidad", "La cantidad", { min: 1, max: 10000 }),
    fecha: v.texto(c, "fecha", "La fecha", { max: 10 }),
    diseno: v.opcion(c, "diseno", "El campo de diseño", ["si", "no"], { requerido: false, porDefecto: "no" }),
    mensaje: v.texto(c, "mensaje", "El mensaje", { max: 500 }),
  };
  if (out.telefono && !/^3\d{9}$/.test(out.telefono)) v.error("telefono", "El teléfono debe ser un celular colombiano de 10 dígitos que empiece por 3.");
  if (out.fecha) {
    if (!fechaValida(out.fecha)) v.error("fecha", "La fecha debe tener el formato AAAA-MM-DD.");
    else if (out.fecha < hoyColombia()) v.error("fecha", "La fecha no puede ser anterior a hoy.");
  }
  if (c?.acepto !== true) v.error("acepto", "Debes aceptar el tratamiento de datos.");
  v.terminar();
  return { ...out, fecha: out.fecha || null };
}

// ---------- Pedido ----------
export function validarPedido(p) {
  const v = new Validador();
  const lista = p?.items;
  if (!Array.isArray(lista) || lista.length === 0) {
    v.error("items", "El pedido debe tener al menos una prenda.");
    v.terminar();
  }
  if (lista.length > 30) v.error("items", "El pedido no puede tener más de 30 prendas distintas.");
  const unidas = new Map(); // si una prenda viene repetida, se suman las cantidades
  lista.forEach((it, i) => {
    const id = typeof it?.id === "string" ? it.id.trim() : "";
    if (!/^[\w-]{1,60}$/.test(id)) return v.error("items", `La prenda #${i + 1} no es válida.`);
    if (!Number.isInteger(it.cantidad) || it.cantidad < 1 || it.cantidad > 99) return v.error("items", `La cantidad de la prenda #${i + 1} debe ser un entero entre 1 y 99.`);
    unidas.set(id, (unidas.get(id) || 0) + it.cantidad);
  });
  for (const [id, n] of unidas) if (n > 99) v.error("items", `No se pueden pedir más de 99 unidades de «${id}».`);
  v.terminar();
  return [...unidas].map(([id, cantidad]) => ({ id, cantidad }));
}

// ---------- Cuentas ----------
export function validarRegistro(r) {
  const v = new Validador();
  const out = {
    nombre: v.texto(r, "nombre", "El nombre", { min: 2, max: 60, requerido: true }),
    correo: v.correo(r, "correo", "El correo", { requerido: true }),
    clave: typeof r?.clave === "string" ? r.clave : "",
    codigo: typeof r?.codigo === "string" ? r.codigo : "",
  };
  if (out.clave.length < 8) v.error("clave", "La contraseña debe tener al menos 8 caracteres.");
  if (out.clave.length > 100) v.error("clave", "La contraseña no puede pasar de 100 caracteres.");
  if (!out.codigo) v.error("codigo", "El código de invitación es obligatorio.");
  v.terminar();
  return out;
}
export function validarLogin(l) {
  const v = new Validador();
  const out = {
    correo: v.correo(l, "correo", "El correo", { requerido: true }),
    clave: typeof l?.clave === "string" ? l.clave : "",
  };
  if (!out.clave || out.clave.length > 100) v.error("clave", "Escribe tu contraseña.");
  v.terminar();
  return out;
}

// ---------- Contenido del panel (productos, servicios, galería, contacto) ----------
const RUTA_ARCHIVO = /^imagenes\/[A-Za-z0-9_\-./]{1,150}$/;
const RUTA_SUBIDA = /^\/api\/fotos\/[a-f0-9]{32}$/;
const DATA_URL = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
const ID = /^[\w-]{1,60}$/;

export function esDataUrl(f) {
  return typeof f === "string" && f.startsWith("data:");
}

/** Revisa una lista de fotos (rutas o imágenes en data URL). No toca la base de datos. */
function validarFotos(v, campo, etiqueta, lista, max) {
  if (lista === undefined || lista === null) return [];
  if (!Array.isArray(lista)) {
    v.error(campo, `${etiqueta}: las fotos deben ser una lista.`);
    return [];
  }
  if (lista.length > max) v.error(campo, `${etiqueta}: máximo ${max} fotos.`);
  const limpias = [];
  for (const f of lista.slice(0, max)) {
    if (typeof f !== "string") { v.error(campo, `${etiqueta}: una foto no es válida.`); continue; }
    if (esDataUrl(f)) {
      if (!DATA_URL.test(f)) v.error(campo, `${etiqueta}: solo se aceptan imágenes JPG, PNG o WebP.`);
      else limpias.push(f);
    } else if ((RUTA_ARCHIVO.test(f) && !f.includes("..") && !f.includes("//")) || RUTA_SUBIDA.test(f)) {
      limpias.push(f);
    } else {
      v.error(campo, `${etiqueta}: la ruta de foto «${f.slice(0, 40)}» no es válida.`);
    }
  }
  return limpias;
}

function crearId(base, usados) {
  let b = base.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "item";
  let id = b, n = 2;
  while (usados.has(id)) id = `${b}-${n++}`;
  return id;
}

export function validarContenido(c) {
  const v = new Validador();
  const productos = [];
  const servicios = [];
  const usados = new Set();

  if (!Array.isArray(c?.productos)) v.error("productos", "Los productos deben ser una lista.");
  else if (c.productos.length > 100) v.error("productos", "Máximo 100 productos.");
  else c.productos.forEach((p, i) => {
    const et = `Producto #${i + 1}`;
    const nombre = v.texto(p, "nombre", `${et}: el nombre`, { max: 80, requerido: true });
    const descripcion = v.texto(p, "descripcion", `${et}: la descripción`, { max: 300 });
    let precio = null;
    if (p?.precio !== null && p?.precio !== undefined) precio = v.entero(p, "precio", `${et}: el precio`, { min: 0, max: 100_000_000 });
    let id = typeof p?.id === "string" ? p.id.trim() : "";
    if (id && !ID.test(id)) { v.error("productos", `${et}: el id no es válido.`); id = ""; }
    if (id && usados.has("p:" + id)) v.error("productos", `${et}: el id «${id}» está repetido.`);
    if (!id) id = crearId(nombre || "producto", new Set([...usados].filter((x) => x.startsWith("p:")).map((x) => x.slice(2))));
    usados.add("p:" + id);
    productos.push({ id, nombre, descripcion, precio, fotos: validarFotos(v, "productos", et, p?.fotos, 8) });
  });

  if (!Array.isArray(c?.servicios)) v.error("servicios", "Los servicios deben ser una lista.");
  else if (c.servicios.length > 30) v.error("servicios", "Máximo 30 servicios.");
  else c.servicios.forEach((s, i) => {
    const et = `Servicio #${i + 1}`;
    const titulo = v.texto(s, "titulo", `${et}: el título`, { max: 80, requerido: true });
    const texto = v.texto(s, "texto", `${et}: la descripción`, { max: 400 });
    let id = typeof s?.id === "string" ? s.id.trim() : "";
    if (id && !ID.test(id)) { v.error("servicios", `${et}: el id no es válido.`); id = ""; }
    if (id && usados.has("s:" + id)) v.error("servicios", `${et}: el id «${id}» está repetido.`);
    if (!id) id = crearId(titulo || "servicio", new Set([...usados].filter((x) => x.startsWith("s:")).map((x) => x.slice(2))));
    usados.add("s:" + id);
    servicios.push({ id, titulo, texto, fotos: validarFotos(v, "servicios", et, s?.fotos, 8) });
  });

  const galeria = validarFotos(v, "galeria", "Galería", c?.galeria, 12);

  const ct = c?.contacto ?? {};
  const contacto = {
    whatsapp: v.texto(ct, "whatsapp", "El WhatsApp", { max: 20 }).replace(/\D/g, ""),
    instagram: v.texto(ct, "instagram", "El Instagram", { max: 40 }).replace(/^@/, ""),
    correo: v.correo(ct, "correo", "El correo de contacto"),
    ubicacion: v.texto(ct, "ubicacion", "La ubicación", { max: 120 }),
  };
  if (contacto.whatsapp && !/^57\d{10}$/.test(contacto.whatsapp)) v.error("whatsapp", "El WhatsApp debe empezar por 57 y tener 12 dígitos (ej. 573001234567).");
  if (contacto.instagram && !/^[\w.]{1,40}$/.test(contacto.instagram)) v.error("instagram", "El Instagram solo puede tener letras, números, punto y guion bajo.");

  v.terminar();
  return { productos, servicios, galeria, contacto };
}

export { DATA_URL, RUTA_SUBIDA };
