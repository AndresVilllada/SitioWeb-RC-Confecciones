import { useDatos } from "../context/DatosContext";
import { useTituloPagina } from "../hooks/useTituloPagina";

export default function Contacto() {
  useTituloPagina("Contacto");
  const { contacto } = useDatos();

  return (
    <section className="seccion">
      <div className="contenedor">
        <h1 className="titulo-seccion">Contacto</h1>
        <p className="subtitulo">
          Escríbenos y cuéntanos cómo podemos ayudarte a llevar tu identidad con orgullo.
        </p>

        <address className="datos-contacto">
          <p>
            <strong>Instagram</strong><br />
            {contacto.instagram ? (
              <a href={"https://www.instagram.com/" + contacto.instagram} target="_blank" rel="noopener noreferrer">
                @{contacto.instagram}
              </a>
            ) : (
              "[Pendiente]"
            )}
          </p>
          <p>
            <strong>WhatsApp</strong><br />
            {contacto.whatsapp ? (
              <a href={"https://wa.me/" + contacto.whatsapp} target="_blank" rel="noopener noreferrer">
                +{contacto.whatsapp}
              </a>
            ) : (
              "[Pendiente: número]"
            )}
          </p>
          <p>
            <strong>Correo</strong><br />
            {contacto.correo ? <a href={"mailto:" + contacto.correo}>{contacto.correo}</a> : "[Pendiente: correo]"}
          </p>
          <p>
            <strong>Ubicación</strong><br />
            {contacto.ubicacion || "[Pendiente: ciudad y dirección]"}
          </p>
        </address>
      </div>
    </section>
  );
}
