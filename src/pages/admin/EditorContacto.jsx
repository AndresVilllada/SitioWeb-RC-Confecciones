import { useState } from "react";
import { useDatos } from "../../context/DatosContext";

export default function EditorContacto() {
  const { contacto, guardarContacto } = useDatos();
  const [aviso, setAviso] = useState(null);

  function guardar(evento) {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(evento.currentTarget).entries());
    const guardado = guardarContacto(datos);
    setAviso(
      guardado
        ? { texto: "Datos de contacto guardados. El botón «Pedir por WhatsApp» ya usa este número." }
        : { texto: "No se pudo guardar en este navegador.", error: true }
    );
  }

  return (
    <form className="editor" onSubmit={guardar}>
      <h2 className="editor-titulo">Datos de contacto</h2>

      <fieldset className="admin-item">
        <legend className="admin-item-nombre">Contacto de la empresa</legend>
        <div className="formulario admin-campos">
          <div className="campo">
            <label htmlFor="ct-whatsapp">WhatsApp</label>
            <input
              type="text" id="ct-whatsapp" name="whatsapp" defaultValue={contacto.whatsapp}
              inputMode="numeric" pattern="57[0-9]{10}" placeholder="573001234567"
              title="Indicativo 57 y 10 dígitos, sin espacios ni signos. Ejemplo: 573001234567"
            />
            <p className="ayuda-campo">Con el 57 al inicio y sin espacios. Es el número que recibe los pedidos de la tienda. Las cotizaciones llegan por correo.</p>
          </div>

          <div className="campo">
            <label htmlFor="ct-instagram">Instagram</label>
            <input type="text" id="ct-instagram" name="instagram" defaultValue={contacto.instagram} maxLength={40} placeholder="rcconfeccionescolombia" />
            <p className="ayuda-campo">Solo el usuario, sin @.</p>
          </div>

          <div className="campo">
            <label htmlFor="ct-correo">Correo</label>
            <input type="email" id="ct-correo" name="correo" defaultValue={contacto.correo} maxLength={80} />
          </div>

          <div className="campo">
            <label htmlFor="ct-ubicacion">Ubicación</label>
            <input type="text" id="ct-ubicacion" name="ubicacion" defaultValue={contacto.ubicacion} maxLength={120} placeholder="Ciudad y dirección" />
          </div>
        </div>
      </fieldset>

      <div className="barra-acciones">
        <button type="submit" className="boton boton-solido">Guardar cambios</button>
      </div>

      {aviso && <p className={"mensaje" + (aviso.error ? " error" : "")} role="status">{aviso.texto}</p>}
    </form>
  );
}
