import { useState } from "react";
import { MAX_FOTOS_GALERIA, useDatos } from "../../context/DatosContext";
import EditorFotos from "./EditorFotos";

/* Fotos de «Nuestros trabajos» (carrusel de la página de inicio) */
export default function EditorGaleria() {
  const { galeria, guardarGaleria } = useDatos();
  const [borrador, setBorrador] = useState(galeria);
  const [aviso, setAviso] = useState(null);

  function guardar(evento) {
    evento.preventDefault();
    const guardadas = guardarGaleria(borrador);
    if (guardadas) {
      setBorrador(guardadas);
      setAviso({ texto: "Cambios guardados. La galería ya se ve en la página de inicio." });
    } else {
      setAviso({ texto: "No se pudo guardar: el navegador no tiene más espacio. Prueba con menos fotos.", error: true });
    }
  }

  return (
    <form className="editor" onSubmit={guardar}>
      <h2 className="editor-titulo">Galería de trabajos</h2>
      <p className="ayuda-campo">
        Estas fotos aparecen como carrusel en la página de inicio. Si no hay fotos, la sección no se muestra.
      </p>

      <fieldset className="admin-item">
        <legend className="admin-item-nombre">Fotos de la galería</legend>
        <EditorFotos idBase="galeria" fotos={borrador} max={MAX_FOTOS_GALERIA} onCambiar={(f) => { setBorrador(f); setAviso(null); }} />
      </fieldset>

      <div className="barra-acciones">
        <button type="submit" className="boton boton-solido">Guardar cambios</button>
        <button type="button" className="boton" onClick={() => { setBorrador(galeria); setAviso(null); }}>Descartar cambios</button>
      </div>

      {aviso && <p className={"mensaje" + (aviso.error ? " error" : "")} role="status">{aviso.texto}</p>}
    </form>
  );
}
