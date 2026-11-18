// Rutas del panel de administración. TODAS exigen sesión iniciada (admin: true).
import { ErrorHttp, json, leerJson } from "../util.js";
import { guardarContenido } from "../datos.js";
import { Validador, validarContenido } from "../validar.js";

const ESTADOS_COTIZACION = ["nueva", "contactada", "cerrada", "descartada"];
const ESTADOS_PEDIDO = ["nuevo", "confirmado", "entregado", "cancelado"];
const POR_PAGINA = 50;

function paginacion(url) {
  const pagina = Math.max(1, Math.min(1000, parseInt(url.searchParams.get("pagina") || "1", 10) || 1));
  return { pagina, limite: POR_PAGINA, desde: (pagina - 1) * POR_PAGINA };
}

/** Lee la versión que el panel vio al cargar (cabecera If-Match: "7"). Es obligatoria al guardar. */
function versionDeLaPeticion(request) {
  const crudo = request.headers.get("If-Match");
  if (!crudo) throw new ErrorHttp(428, "Falta la versión del contenido (cabecera If-Match). Carga los datos antes de guardar.");
  const m = /^(?:W\/)?"?(\d{1,9})"?$/.exec(crudo.trim());
  if (!m) throw new ErrorHttp(400, "La versión enviada en If-Match no es válida.");
  return Number(m[1]);
}

function idDe(params) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) throw new ErrorHttp(404, "No encontrado.");
  return id;
}

export const rutasAdmin = [
  // Guarda productos, servicios, galería y contacto (reemplaza todo, como el botón «Guardar cambios» del panel).
  // Las fotos pueden venir como rutas o como imagen en data URL: el servidor guarda estas últimas y devuelve su ruta.
  {
    metodo: "PUT", patron: "/admin/datos", admin: true,
    async fn({ request, env }) {
      const version = versionDeLaPeticion(request);
      const contenido = validarContenido(await leerJson(request));
      const guardado = await guardarContenido(env.DB, contenido, version);
      return json(guardado, 200, { ETag: `"${version + 1}"` });
    },
  },

  {
    metodo: "GET", patron: "/admin/cotizaciones", admin: true,
    async fn({ env, url }) {
      const { pagina, limite, desde } = paginacion(url);
      const estado = url.searchParams.get("estado");
      if (estado && !ESTADOS_COTIZACION.includes(estado)) throw new ErrorHttp(422, "Estado no válido.");
      const [lista, total] = await env.DB.batch([
        env.DB.prepare(
          `SELECT id, creado, estado, nombre, organizacion, correo, telefono, tipo_cliente, prenda, cantidad, fecha_requerida, tiene_diseno, mensaje, acepto_datos_en, correo_enviado
           FROM cotizaciones WHERE (?1 IS NULL OR estado = ?1) ORDER BY id DESC LIMIT ?2 OFFSET ?3`
        ).bind(estado, limite, desde),
        env.DB.prepare("SELECT COUNT(*) AS n FROM cotizaciones WHERE (?1 IS NULL OR estado = ?1)").bind(estado),
      ]);
      return json({
        pagina, porPagina: limite, total: total.results[0].n,
        cotizaciones: lista.results.map((c) => ({
          id: c.id, creado: c.creado, estado: c.estado, nombre: c.nombre, organizacion: c.organizacion, correo: c.correo,
          telefono: c.telefono, tipoCliente: c.tipo_cliente, prenda: c.prenda, cantidad: c.cantidad,
          fecha: c.fecha_requerida, diseno: c.tiene_diseno, mensaje: c.mensaje, aceptoDatos: c.acepto_datos_en, correoEnviado: c.correo_enviado === 1,
        })),
      });
    },
  },

  {
    metodo: "PATCH", patron: "/admin/cotizaciones/:id", admin: true,
    async fn({ request, env, params }) {
      const id = idDe(params);
      const v = new Validador();
      const estado = v.opcion(await leerJson(request), "estado", "El estado", ESTADOS_COTIZACION);
      v.terminar();
      const r = await env.DB.prepare("UPDATE cotizaciones SET estado = ?1 WHERE id = ?2").bind(estado, id).run();
      if (!r.meta.changes) throw new ErrorHttp(404, "Cotización no encontrada.");
      return json({ id, estado });
    },
  },

  {
    metodo: "GET", patron: "/admin/pedidos", admin: true,
    async fn({ env, url }) {
      const { pagina, limite, desde } = paginacion(url);
      const estado = url.searchParams.get("estado");
      if (estado && !ESTADOS_PEDIDO.includes(estado)) throw new ErrorHttp(422, "Estado no válido.");
      const [lista, total] = await env.DB.batch([
        env.DB.prepare("SELECT id, creado, estado, total FROM pedidos WHERE (?1 IS NULL OR estado = ?1) ORDER BY id DESC LIMIT ?2 OFFSET ?3").bind(estado, limite, desde),
        env.DB.prepare("SELECT COUNT(*) AS n FROM pedidos WHERE (?1 IS NULL OR estado = ?1)").bind(estado),
      ]);
      const ids = lista.results.map((p) => p.id);
      const items = ids.length
        ? (await env.DB.prepare("SELECT pedido_id, producto_id, nombre, precio, cantidad FROM pedido_items WHERE pedido_id IN (SELECT value FROM json_each(?1)) ORDER BY id")
            .bind(JSON.stringify(ids)).all()).results
        : [];
      return json({
        pagina, porPagina: limite, total: total.results[0].n,
        pedidos: lista.results.map((p) => ({
          ...p,
          items: items.filter((i) => i.pedido_id === p.id).map((i) => ({ id: i.producto_id, nombre: i.nombre, precio: i.precio, cantidad: i.cantidad })),
        })),
      });
    },
  },

  {
    metodo: "PATCH", patron: "/admin/pedidos/:id", admin: true,
    async fn({ request, env, params }) {
      const id = idDe(params);
      const v = new Validador();
      const estado = v.opcion(await leerJson(request), "estado", "El estado", ESTADOS_PEDIDO);
      v.terminar();
      const r = await env.DB.prepare("UPDATE pedidos SET estado = ?1 WHERE id = ?2").bind(estado, id).run();
      if (!r.meta.changes) throw new ErrorHttp(404, "Pedido no encontrado.");
      return json({ id, estado });
    },
  },
];
