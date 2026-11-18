// Aviso por correo a la empresa cuando llega una cotización.
//
// Proveedor: Resend (https://resend.com), plan gratis: 3.000 correos al mes y 100 al día.
// Con el remitente de pruebas "onboarding@resend.dev" SOLO se puede enviar al correo con el que se
// registró la cuenta de Resend. Por eso la cuenta debe crearse con el correo de la empresa.
// (Para enviar a otros correos hay que verificar un dominio propio en Resend.)
//
// Configuración (secretos, NO van en el código; ver docs/BACKEND.md):
//   RESEND_API_KEY   clave de la API de Resend
//   CORREO_EMPRESA   correo que recibe las cotizaciones
//   CORREO_REMITENTE (opcional) "Nombre <correo@tu-dominio.com>"; por defecto el de pruebas de Resend
//   URL_API_CORREO   (solo pruebas) dirección local que reemplaza a Resend; se ignora si no es localhost
//
// Si algo falla, la cotización YA está guardada en la base de datos: este módulo nunca lanza errores hacia
// afuera, solo devuelve false (y deja el motivo en los registros de Cloudflare, sin mostrar la clave).

const URL_RESEND = "https://api.resend.com/emails";
const REMITENTE_POR_DEFECTO = "RC Confecciones <onboarding@resend.dev>";
const ESPERA_MAXIMA_MS = 5000;

const TIPOS = { empresa: "Empresa", club: "Club deportivo", restaurante: "Restaurante", otro: "Otro" };

const sinSaltos = (t) => String(t).replace(/[\r\n\t]+/g, " ").trim();
const escaparHtml = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function correoConfigurado(env) {
  return Boolean(env.RESEND_API_KEY && env.CORREO_EMPRESA);
}

/** Solo se acepta cambiar la dirección de la API si apunta a esta misma máquina (pruebas). */
function direccionApi(env) {
  const alternativa = env.URL_API_CORREO;
  if (alternativa && /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(alternativa)) return alternativa;
  return URL_RESEND;
}

/** Arma el asunto y el cuerpo (texto y HTML) del correo. Todo lo que escribió el cliente se escapa. */
export function armarCorreo(c, id) {
  const filas = [
    ["Nombre", c.nombre],
    ["Empresa u organización", c.organizacion || "—"],
    ["Correo", c.correo],
    ["Teléfono / WhatsApp", c.telefono],
    ["Tipo de cliente", TIPOS[c.tipoCliente] || c.tipoCliente],
    ["Prenda", c.prenda],
    ["Cantidad aproximada", String(c.cantidad)],
    ["Fecha en que las necesita", c.fecha || "—"],
    ["¿Ya tiene diseño o logo?", c.diseno === "si" ? "Sí" : "No, necesita ayuda"],
    ["Detalles", c.mensaje || "—"],
  ];
  const texto =
    `Nueva solicitud de cotización (#${id})\n\n` +
    filas.map(([k, v]) => `${k}: ${v}`).join("\n") +
    `\n\nPara responder, contesta este correo: le llegará directamente al cliente.\n` +
    `También queda guardada en el panel de administración.`;
  const html =
    `<h2>Nueva solicitud de cotización (#${id})</h2>` +
    `<table cellpadding="6" style="border-collapse:collapse">` +
    filas.map(([k, v]) => `<tr><td><strong>${escaparHtml(k)}</strong></td><td>${escaparHtml(v).replace(/\n/g, "<br>")}</td></tr>`).join("") +
    `</table>` +
    `<p>Para responder, contesta este correo: le llegará directamente al cliente.<br>También queda guardada en el panel de administración.</p>`;
  return { asunto: sinSaltos(`Nueva cotización #${id}: ${c.prenda} x${c.cantidad} (${c.nombre})`).slice(0, 150), texto, html };
}

/** Envía el aviso. Devuelve true si el proveedor lo aceptó; false en cualquier otro caso. */
export async function enviarCotizacionPorCorreo(env, cotizacion, id) {
  if (!correoConfigurado(env)) {
    console.error("Correo no configurado (faltan RESEND_API_KEY o CORREO_EMPRESA): la cotización #" + id + " quedó solo en el panel.");
    return false;
  }
  const { asunto, texto, html } = armarCorreo(cotizacion, id);
  try {
    const r = await fetch(direccionApi(env), {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.CORREO_REMITENTE || REMITENTE_POR_DEFECTO,
        to: [env.CORREO_EMPRESA],
        reply_to: cotizacion.correo,     // al contestar, el correo va al cliente
        subject: asunto,
        text: texto,
        html,
      }),
      signal: AbortSignal.timeout(ESPERA_MAXIMA_MS),
    });
    if (!r.ok) {
      console.error(`El proveedor de correo rechazó la cotización #${id}: HTTP ${r.status} ${(await r.text()).slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`No se pudo enviar el correo de la cotización #${id}:`, e?.name || e);
    return false;
  }
}
