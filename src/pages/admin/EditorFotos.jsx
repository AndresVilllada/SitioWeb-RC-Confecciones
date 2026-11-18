import { useState } from "react";
import { reducirImagen } from "../../utils/imagenes";

/* Lista de fotos con miniaturas: subir archivos, añadir por ruta, mover y quitar.
   "fotos" es una lista de textos (rutas como "imagenes/foto.jpg" o fotos subidas). */
export default function EditorFotos({ fotos, onCambiar, max = 8, idBase }) {
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [ruta, setRuta] = useState("");

  async function subir(evento) {
    const archivos = Array.from(evento.target.files);
    evento.target.value = "";   // permite volver a elegir el mismo archivo
    if (archivos.length === 0) return;

    const cupo = max - fotos.length;
    if (cupo <= 0) {
      setError("Ya hay " + max + " fotos, que es el máximo. Quita alguna para añadir otra.");
      return;
    }

    setOcupado(true);
    const nuevas = [];
    const problemas = [];
    for (const archivo of archivos.slice(0, cupo)) {
      try {
        nuevas.push(await reducirImagen(archivo));
      } catch (e) {
        problemas.push(archivo.name + " (" + e.message + ")");
      }
    }
    if (archivos.length > cupo) problemas.push("solo caben " + max + " fotos, se ignoraron las demás");
    if (nuevas.length > 0) onCambiar([...fotos, ...nuevas]);
    setOcupado(false);
    setError(problemas.length > 0 ? "No se añadió: " + problemas.join("; ") + "." : "");
  }

  function anadirRuta() {
    const limpia = ruta.trim();
    if (!limpia) return;
    if (fotos.length >= max) {
      setError("Ya hay " + max + " fotos, que es el máximo.");
      return;
    }
    onCambiar([...fotos, limpia]);
    setRuta("");
    setError("");
  }

  function quitar(indice) {
    onCambiar(fotos.filter((_, i) => i !== indice));
  }

  function mover(indice, delta) {
    const destino = indice + delta;
    if (destino < 0 || destino >= fotos.length) return;
    const copia = [...fotos];
    [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
    onCambiar(copia);
  }

  return (
    <div className="editor-fotos">
      <p className="editor-fotos-titulo">Fotos ({fotos.length}/{max})</p>

      {fotos.length === 0 ? (
        <p className="ayuda-campo">Sin fotos: en la página se ve el recuadro «foto pendiente».</p>
      ) : (
        <ul className="miniaturas">
          {fotos.map((src, i) => (
            <li key={i} className="miniatura">
              <img src={src} alt={"Foto " + (i + 1)} />
              <div className="miniatura-botones">
                <button type="button" className="boton-mini" onClick={() => mover(i, -1)} disabled={i === 0} aria-label={"Mover foto " + (i + 1) + " a la izquierda"}>←</button>
                <button type="button" className="boton-mini" onClick={() => mover(i, 1)} disabled={i === fotos.length - 1} aria-label={"Mover foto " + (i + 1) + " a la derecha"}>→</button>
                <button type="button" className="boton-mini" onClick={() => quitar(i)} aria-label={"Quitar foto " + (i + 1)}>Quitar</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="editor-fotos-subir">
        <input
          type="file" id={idBase + "-subir"} className="oculto-visual" accept="image/*" multiple
          onChange={subir} disabled={ocupado}
        />
        <label className="boton boton-mini-etiqueta" htmlFor={idBase + "-subir"}>
          {ocupado ? "Cargando…" : "Subir fotos"}
        </label>
        <span className="o-separador">o</span>
        <input
          type="text" className="ruta-foto" value={ruta} onChange={(e) => setRuta(e.target.value)}
          placeholder="imagenes/mi-foto.jpg" aria-label="Ruta de una foto" maxLength={200}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); anadirRuta(); } }}
        />
        <button type="button" className="boton boton-mini-etiqueta" onClick={anadirRuta}>Añadir ruta</button>
      </div>

      {error && <p className="mensaje error" role="alert">{error}</p>}
    </div>
  );
}
