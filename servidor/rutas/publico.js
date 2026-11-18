// Rutas que usa cualquier visitante de la página (no piden iniciar sesión).
import { ErrorHttp, cabecerasBase, json, leerJson } from "../util.js";
import { leerContenido, leerFoto, leerVersion } from "../datos.js";
import { contarIntentos, registrarIntento } from "../sesion.js";
import { enviarCotizacionPorCorreo } from "../correo.js";
import { validarCotizacion, validarPedido } from "../validar.js";

const UNA_HORA = 3600;

export const rutasPublicas = [
  // Comprueba que el servidor y la base de datos responden
  {
    metodo: "GET", patron: "/salud",
    async fn({ env }) {
      await env.DB.prepare("SELECT 1").first();
      return json({ ok: true });
    },
  },

  // Todo lo que la página necesita para dibujarse (mismo formato que hoy guarda el navegador)
  {
    metodo: "GET", patron: "/datos",
    // La cabecera ETag trae la versión del contenido: el panel la devuelve en If-Match al guardar (ver admin.js).
    async fn({ env }) {
      // La versión se lee ANTES que el contenido: si alguien guarda justo en medio, lo peor que pasa es un aviso
      // de "recarga" innecesario; nunca se acepta un guardado hecho sobre contenido más viejo que su versión.
      const version = await leerVersion(env.DB);
      return json(await leerContenido(env.DB), 200, { ETag: `"${version}"` });
    },
  },

  // Foto subida desde el panel. El id es el hash de la imagen, por eso se puede guardar en caché para siempre.
  {
    metodo: "GET", patron: "/fotos/:id",
    async fn({ env, params }) {
      if (!/^[a-f0-9]{32}$/.test(params.id)) throw new ErrorHttp(404, "Foto no encontrada.");
      const foto = await leerFoto(env.DB, params.id);
      if (!foto) throw new ErrorHttp(404, "Foto no encontrada.");
      return new Response(foto.bytes, {
        headers: {
          ...cabecerasBase(),
          "Content-Type": foto.mime,
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Security-Policy": "default-src 'none'; sandbox",
        },
      });
    },
  },

  // Solicitud de cotización
  {
    metodo: "POST", patron: "/cotizaciones",
    async fn({ request, env, ip }) {
      const c = validarCotizacion(await leerJson(request));
      if ((await contarIntentos(env, "cotizacion-ip", ip, UNA_HORA)) >= 10) {
        throw new ErrorHttp(429, "Enviaste muchas solicitudes seguidas. Intenta de nuevo en un rato.");
      }
      const r = await env.DB.prepare(
        `INSERT INTO cotizaciones (nombre, organizacion, correo, telefono, tipo_cliente, prenda, cantidad, fecha_requerida, tiene_diseno, mensaje, acepto_datos_en)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, datetime('now')) RETURNING id`
      ).bind(c.nombre, c.organizacion, c.correo, c.telefono, c.tipoCliente, c.prenda, c.cantidad, c.fecha, c.diseno, c.mensaje).first();
      await registrarIntento(env, "cotizacion-ip", ip);
      // La cotización ya está guardada. Ahora se avisa por correo a la empresa; si el correo falla, no se pierde nada:
      // queda en el panel con correoEnviado = false.
      const correoEnviado = await enviarCotizacionPorCorreo(env, c, r.id);
      if (correoEnviado) await env.DB.prepare("UPDATE cotizaciones SET correo_enviado = 1 WHERE id = ?1").bind(r.id).run();
      return json({ id: r.id, correoEnviado }, 201);
    },
  },

  // Pedido de la tienda. El servidor NO confía en los precios que manda la página: los lee de la base de datos.
  {
    metodo: "POST", patron: "/pedidos",
    async fn({ request, env, ip }) {
      const items = validarPedido(await leerJson(request));
      if ((await contarIntentos(env, "pedido-ip", ip, UNA_HORA)) >= 20) {
        throw new ErrorHttp(429, "Enviaste muchos pedidos seguidos. Intenta de nuevo en un rato.");
      }
      const { results } = await env.DB.prepare("SELECT id, nombre, precio FROM productos WHERE id IN (SELECT value FROM json_each(?1))")
        .bind(JSON.stringify(items.map((i) => i.id))).all();
      const porId = new Map(results.map((p) => [p.id, p]));
      const faltan = items.filter((i) => !porId.has(i.id)).map((i) => i.id);
      if (faltan.length) throw new ErrorHttp(422, "Algunas prendas ya no están disponibles.", { items: "Ya no están disponibles: " + faltan.join(", ") });

      const lineas = items.map((i) => ({ id: i.id, nombre: porId.get(i.id).nombre, precio: porId.get(i.id).precio, cantidad: i.cantidad }));
      const total = lineas.every((l) => l.precio !== null) ? lineas.reduce((s, l) => s + l.precio * l.cantidad, 0) : null;

      // 1) se crea el pedido y se obtiene su número; 2) se guardan sus ítems con ESE número.
      // (No se usa last_insert_rowid() dentro del INSERT de ítems: cambia con cada fila insertada
      // y los ítems siguientes quedarían asociados a otro pedido.)
      const pedido = await env.DB.prepare("INSERT INTO pedidos (total) VALUES (?1) RETURNING id").bind(total).first();
      try {
        await env.DB.prepare(
          `INSERT INTO pedido_items (pedido_id, producto_id, nombre, precio, cantidad)
           SELECT ?1, json_extract(value, '$.id'), json_extract(value, '$.nombre'), json_extract(value, '$.precio'), json_extract(value, '$.cantidad')
           FROM json_each(?2)`
        ).bind(pedido.id, JSON.stringify(lineas)).run();
      } catch (e) {
        await env.DB.prepare("DELETE FROM pedidos WHERE id = ?1").bind(pedido.id).run(); // no dejar un pedido vacío
        throw e;
      }
      await registrarIntento(env, "pedido-ip", ip);
      return json({ id: pedido.id, total, items: lineas }, 201);
    },
  },
];
