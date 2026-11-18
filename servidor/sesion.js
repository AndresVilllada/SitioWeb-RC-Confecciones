// Sesiones de administrador: la cookie guarda un token al azar; la base de datos guarda solo su hash.
// Así, si alguien viera la base de datos, no podría usar las sesiones para entrar.
import { ErrorHttp, ahoraSeg } from "./util.js";
import { NOMBRE_COOKIE, cookieSesion, crearToken, leerCookie, sha256Hex } from "./seguridad.js";

export const DURACION_SESION_SEG = 7 * 24 * 3600; // 7 días

export async function crearSesion(env, adminId, https) {
  const token = crearToken();
  const id = await sha256Hex(token);
  const ahora = ahoraSeg();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO sesiones (id, admin_id, expira) VALUES (?1, ?2, ?3)").bind(id, adminId, ahora + DURACION_SESION_SEG),
    env.DB.prepare("DELETE FROM sesiones WHERE expira < ?1").bind(ahora),            // limpieza de sesiones vencidas
    env.DB.prepare("DELETE FROM intentos WHERE creado < ?1").bind(ahora - 86400),    // y de intentos de hace más de un día
  ]);
  return cookieSesion(token, DURACION_SESION_SEG, https);
}

/** Devuelve el administrador de la sesión actual, o null si no hay sesión válida. */
export async function adminActual(request, env) {
  const token = leerCookie(request, NOMBRE_COOKIE);
  if (!token || token.length > 100) return null;
  const fila = await env.DB.prepare(
    `SELECT a.id, a.nombre, a.correo FROM sesiones s JOIN administradores a ON a.id = s.admin_id
     WHERE s.id = ?1 AND s.expira > ?2`
  ).bind(await sha256Hex(token), ahoraSeg()).first();
  return fila ?? null;
}

export async function exigirAdmin(request, env) {
  const admin = await adminActual(request, env);
  if (!admin) throw new ErrorHttp(401, "Debes iniciar sesión como administrador.");
  return admin;
}

export async function cerrarSesion(request, env) {
  const token = leerCookie(request, NOMBRE_COOKIE);
  if (token) await env.DB.prepare("DELETE FROM sesiones WHERE id = ?1").bind(await sha256Hex(token)).run();
}

// ---------- Límite de intentos ----------
/** Cuenta cuántos intentos de ese tipo hubo en la ventana de tiempo. */
export async function contarIntentos(env, tipo, clave, ventanaSeg) {
  const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM intentos WHERE tipo = ?1 AND clave = ?2 AND creado > ?3")
    .bind(tipo, clave, ahoraSeg() - ventanaSeg).first();
  return r?.n ?? 0;
}
export async function registrarIntento(env, tipo, clave) {
  await env.DB.prepare("INSERT INTO intentos (tipo, clave, creado) VALUES (?1, ?2, ?3)").bind(tipo, clave, ahoraSeg()).run();
}
export async function limpiarIntentos(env, tipo, clave) {
  await env.DB.prepare("DELETE FROM intentos WHERE tipo = ?1 AND clave = ?2").bind(tipo, clave).run();
}
