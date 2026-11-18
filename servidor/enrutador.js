// Enrutador: recibe TODA petición que empiece por /api, busca la ruta que corresponde y la ejecuta.
// Un solo punto de entrada = un solo lugar para revisar seguridad, errores y cabeceras.
import { ErrorHttp, json } from "./util.js";
import { exigirAdmin } from "./sesion.js";
import { ipDe } from "./util.js";
import { rutasAdmin } from "./rutas/admin.js";
import { rutasAuth } from "./rutas/auth.js";
import { rutasPublicas } from "./rutas/publico.js";

// "/fotos/:id" -> expresión regular con el parámetro "id"
function compilar(ruta) {
  const nombres = [];
  const patron = ruta.patron.replace(/:([a-z]+)/g, (_, n) => (nombres.push(n), "([^/]+)"));
  return { ...ruta, regex: new RegExp("^" + patron + "$"), nombres };
}
const RUTAS = [...rutasPublicas, ...rutasAuth, ...rutasAdmin].map(compilar);

/**
 * Defensa contra CSRF (que otra página haga peticiones en nombre del administrador).
 * Además de la cookie SameSite=Strict, se rechaza cualquier petición que cambie datos
 * y venga de otro sitio.
 */
function verificarOrigen(request, url) {
  if (request.headers.get("Sec-Fetch-Site") === "cross-site") throw new ErrorHttp(403, "Origen no permitido.");
  const origen = request.headers.get("Origin");
  if (!origen) return;
  let host;
  try { host = new URL(origen).host; } catch { throw new ErrorHttp(403, "Origen no permitido."); }
  const validos = [url.host, request.headers.get("Host")].filter(Boolean);
  if (!validos.includes(host)) throw new ErrorHttp(403, "Origen no permitido.");
}

export async function manejar({ request, env }) {
  const url = new URL(request.url);
  const ruta = url.pathname.replace(/^\/api/, "").replace(/\/+$/, "") || "/";
  try {
    if (!env.DB) throw new ErrorHttp(500, "La base de datos no está configurada en el servidor.");

    const candidatas = RUTAS.filter((r) => r.regex.test(ruta));
    if (candidatas.length === 0) throw new ErrorHttp(404, "Ruta no encontrada.");

    const metodo = request.method === "HEAD" ? "GET" : request.method;
    const elegida = candidatas.find((r) => r.metodo === metodo);
    if (!elegida) {
      return json({ error: "Método no permitido." }, 405, { Allow: candidatas.map((r) => r.metodo).join(", ") });
    }

    if (metodo !== "GET") verificarOrigen(request, url);
    const admin = elegida.admin ? await exigirAdmin(request, env) : null;

    const m = elegida.regex.exec(ruta);
    const params = Object.fromEntries(elegida.nombres.map((n, i) => [n, decodeURIComponent(m[i + 1])]));
    return await elegida.fn({ request, env, url, params, admin, ip: ipDe(request), https: url.protocol === "https:" });
  } catch (e) {
    if (e instanceof ErrorHttp) {
      return json(e.campos ? { error: e.message, campos: e.campos } : { error: e.message }, e.estado);
    }
    console.error("Error no controlado en la API:", e); // se ve en los registros de Cloudflare
    return json({ error: "Error interno del servidor." }, 500);
  }
}
