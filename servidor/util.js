// Utilidades comunes de la API: errores, respuestas JSON y lectura segura del cuerpo de la petición.

/** Error "esperado": se convierte en una respuesta JSON con su código HTTP (400, 401, 404, 422, 429...). */
export class ErrorHttp extends Error {
  constructor(estado, mensaje, campos) {
    super(mensaje);
    this.estado = estado;
    this.campos = campos; // opcional: { nombreDelCampo: "qué está mal" }
  }
}

const CABECERAS_BASE = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "same-origin",
};

export function json(datos, estado = 200, extra = {}) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...CABECERAS_BASE, ...extra },
  });
}

export function cabecerasBase() {
  return CABECERAS_BASE;
}

export const TAMANO_MAXIMO_CUERPO = 3_000_000; // ~3 MB: alcanza para guardar varias fotos ya reducidas

/** Lee y valida el cuerpo JSON. Rechaza lo que no sea JSON, sea demasiado grande o no sea un objeto. */
export async function leerJson(request, maximo = TAMANO_MAXIMO_CUERPO) {
  const tipo = (request.headers.get("Content-Type") || "").toLowerCase();
  if (!tipo.startsWith("application/json")) throw new ErrorHttp(415, "El contenido debe enviarse como JSON.");
  const declarado = Number(request.headers.get("Content-Length") || 0);
  if (declarado > maximo) throw new ErrorHttp(413, "La solicitud es demasiado grande.");
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > maximo) throw new ErrorHttp(413, "La solicitud es demasiado grande.");
  let datos;
  try {
    datos = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ErrorHttp(400, "El JSON enviado no es válido.");
  }
  if (datos === null || typeof datos !== "object" || Array.isArray(datos)) {
    throw new ErrorHttp(400, "Se esperaba un objeto JSON.");
  }
  return datos;
}

export const ahoraSeg = () => Math.floor(Date.now() / 1000);

/** IP del visitante (Cloudflare la entrega en CF-Connecting-IP). En local no existe: se usa "local". */
export function ipDe(request) {
  return (request.headers.get("CF-Connecting-IP") || "local").slice(0, 64);
}
