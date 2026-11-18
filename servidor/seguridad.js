// Seguridad: cifrado de contraseñas, tokens de sesión, cookies y comparaciones seguras.
// Todo con la API Web Crypto que ya trae Cloudflare (no hay librerías externas).

const codificador = new TextEncoder();

// ---------- Base64 ----------
export function aBase64(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
export function deBase64(texto) {
  const s = atob(texto);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}
const aBase64Url = (bytes) => aBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");

export function aHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(datos) {
  const entrada = typeof datos === "string" ? codificador.encode(datos) : datos;
  return aHex(new Uint8Array(await crypto.subtle.digest("SHA-256", entrada)));
}

/** Comparación en tiempo constante (no revela cuántos caracteres coinciden). */
export function iguales(a, b) {
  const x = codificador.encode(String(a));
  const y = codificador.encode(String(b));
  let diferencia = x.length ^ y.length;
  const largo = Math.max(x.length, y.length);
  for (let i = 0; i < largo; i++) diferencia |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diferencia === 0;
}

// ---------- Contraseñas (PBKDF2-SHA256) ----------
// Formato guardado:  pbkdf2-sha256$<iteraciones>$<sal base64>$<hash base64>
// Guardar las iteraciones junto al hash permite subirlas más adelante sin invalidar las cuentas existentes.
export const ITERACIONES_POR_DEFECTO = 100_000;

async function derivar(clave, sal, iteraciones) {
  const material = await crypto.subtle.importKey("raw", codificador.encode(clave), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: sal, iterations: iteraciones }, material, 256);
  return new Uint8Array(bits);
}

export function iteracionesConfiguradas(env) {
  const n = Number(env?.ITERACIONES_CLAVE);
  return Number.isInteger(n) && n >= 1000 && n <= 1_000_000 ? n : ITERACIONES_POR_DEFECTO;
}

export async function cifrarClave(clave, iteraciones) {
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivar(clave, sal, iteraciones);
  return `pbkdf2-sha256$${iteraciones}$${aBase64(sal)}$${aBase64(hash)}`;
}

export async function verificarClave(clave, guardada) {
  const partes = String(guardada).split("$");
  if (partes.length !== 4 || partes[0] !== "pbkdf2-sha256") return false;
  const iteraciones = Number(partes[1]);
  if (!Number.isInteger(iteraciones) || iteraciones < 1000) return false;
  try {
    const hash = await derivar(clave, deBase64(partes[2]), iteraciones);
    return iguales(aBase64(hash), partes[3]);
  } catch {
    return false;
  }
}

// ---------- Tokens de sesión ----------
export function crearToken() {
  return aBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

// ---------- Cookies ----------
export const NOMBRE_COOKIE = "rc_sesion";

export function leerCookie(request, nombre) {
  const cabecera = request.headers.get("Cookie") || "";
  for (const trozo of cabecera.split(";")) {
    const i = trozo.indexOf("=");
    if (i > 0 && trozo.slice(0, i).trim() === nombre) return trozo.slice(i + 1).trim();
  }
  return null;
}

/** Cookie de sesión: HttpOnly (JavaScript no puede leerla), SameSite=Strict (no viaja desde otros sitios). */
export function cookieSesion(token, segundos, https) {
  return `${NOMBRE_COOKIE}=${token}; Path=/api; Max-Age=${segundos}; HttpOnly; SameSite=Strict${https ? "; Secure" : ""}`;
}
export function cookieBorrada(https) {
  return `${NOMBRE_COOKIE}=; Path=/api; Max-Age=0; HttpOnly; SameSite=Strict${https ? "; Secure" : ""}`;
}
