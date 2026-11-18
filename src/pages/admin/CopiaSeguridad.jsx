import { useState } from "react";
import { useDatos } from "../../context/DatosContext";

/* Los cambios del panel viven en este navegador. Con la copia de seguridad se pueden
   llevar a otro computador (por ejemplo, el de la presentación) o recuperar si se borran. */
export default function CopiaSeguridad() {
  const { exportar, importar, restaurar } = useDatos();
  const [aviso, setAviso] = useState(null);

  function descargar() {
    const blob = new Blob([exportar()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "rc-confecciones-copia.json";
    enlace.click();
    URL.revokeObjectURL(url);
    setAviso({ texto: "Copia descargada: rc-confecciones-copia.json" });
  }

  async function cargar(evento) {
    const archivo = evento.target.files[0];
    evento.target.value = "";
    if (!archivo) return;
    const resultado = importar(await archivo.text());
    setAviso(
      resultado.ok
        ? { texto: "Copia cargada. Ya se ve en la página." }
        : { texto: resultado.error, error: true }
    );
  }

  function volverAOriginales() {
    if (!window.confirm("¿Volver a los productos, servicios y datos originales? Se pierden los cambios hechos desde el panel.")) return;
    restaurar();
    setAviso({ texto: "Se restauraron los datos originales." });
  }

  return (
    <div className="editor">
      <h2 className="editor-titulo">Copia de seguridad</h2>
      <p className="ayuda-campo">
        Los cambios se guardan en este navegador. Descarga una copia para llevarlos a otro computador o para
        recuperarlos si se borran los datos del navegador.
      </p>

      <fieldset className="admin-item">
        <legend className="admin-item-nombre">Copia de los datos del sitio</legend>
        <div className="barra-acciones">
          <button type="button" className="boton" onClick={descargar}>Descargar copia</button>
          <input type="file" id="cargar-copia" className="oculto-visual" accept="application/json,.json" onChange={cargar} />
          <label className="boton" htmlFor="cargar-copia">Cargar copia</label>
          <button type="button" className="boton boton-peligro" onClick={volverAOriginales}>Volver a los datos originales</button>
        </div>
      </fieldset>

      {aviso && <p className={"mensaje" + (aviso.error ? " error" : "")} role="status">{aviso.texto}</p>}
    </div>
  );
}
