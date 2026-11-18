import { useDatos } from "../context/DatosContext";
import { enlaceWhatsApp } from "../utils/whatsapp";

/* Botón redondo fijo en la esquina que abre el chat de WhatsApp de la empresa desde cualquier página.
   Usa el número de la pestaña Contacto del panel de administración. */
export default function BotonWhatsApp() {
  const { contacto } = useDatos();
  const enlace = enlaceWhatsApp(contacto.whatsapp, "Hola RC Confecciones, quiero más información.");

  return (
    <a className="boton-flotante-whatsapp" href={enlace} target="_blank" rel="noopener noreferrer" aria-label="Escríbenos por WhatsApp">
      <span className="flotante-etiqueta" aria-hidden="true">¿Hablamos por WhatsApp?</span>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="flotante-icono">
        {/* globo de conversación con tres puntos */}
        <path d="M12 3.2c-4.9 0-8.8 3.5-8.8 7.9 0 2.3 1.1 4.4 2.9 5.8l-.7 3.6 3.6-1.9c.9.3 2 .4 3 .4 4.9 0 8.8-3.5 8.8-7.9S16.9 3.2 12 3.2z" />
        <circle cx="8.2" cy="11.2" r="1.15" className="punto-chat" />
        <circle cx="12" cy="11.2" r="1.15" className="punto-chat" />
        <circle cx="15.8" cy="11.2" r="1.15" className="punto-chat" />
      </svg>
    </a>
  );
}
