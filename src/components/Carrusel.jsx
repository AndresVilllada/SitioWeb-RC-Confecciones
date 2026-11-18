import { useRef, useState } from "react";
import FotoPendiente from "./FotoPendiente";
import VisorFotos from "./VisorFotos";

/* Carrusel de fotos con flechas, puntos y deslizar con el dedo.
   - Sin fotos  -> muestra el recuadro "foto pendiente".
   - Con 1 foto -> la muestra sola.
   - Con 2 o más -> carrusel. Se usa igual en el Catálogo y en la Tienda.
   Al tocar una foto se abre en grande (VisorFotos). */
export default function Carrusel({ fotos = [], descripcion }) {
  const pista = useRef(null);          // la tira de fotos que se desplaza
  const [indice, setIndice] = useState(0);   // foto que se está viendo
  const [enGrande, setEnGrande] = useState(null);   // número de la foto abierta en el visor, o null

  const visor = enGrande !== null && (
    <VisorFotos fotos={fotos} inicio={enGrande} descripcion={descripcion} onCerrar={() => setEnGrande(null)} />
  );

  if (fotos.length === 0) return <FotoPendiente descripcion={descripcion} />;
  if (fotos.length === 1) {
    return (
      <>
        <button type="button" className="foto-unica-boton" onClick={() => setEnGrande(0)} aria-label={"Ver en grande: " + descripcion}>
          <img className="foto-unica" src={fotos[0]} alt={descripcion} />
        </button>
        {visor}
      </>
    );
  }

  // Mueve la tira una foto a la izquierda (-1) o a la derecha (+1)
  function mover(direccion) {
    const el = pista.current;
    el.scrollBy({ left: direccion * el.clientWidth, behavior: "smooth" });
  }

  // Al desplazarse (con flechas o con el dedo), calcula qué foto quedó a la vista
  function alDesplazar() {
    const el = pista.current;
    setIndice(Math.round(el.scrollLeft / el.clientWidth));
  }

  // Flechas del teclado cuando el carrusel tiene el foco
  function alPresionarTecla(evento) {
    if (evento.key === "ArrowLeft") { evento.preventDefault(); mover(-1); }
    if (evento.key === "ArrowRight") { evento.preventDefault(); mover(1); }
    if (evento.key === "Enter" || evento.key === " ") { evento.preventDefault(); setEnGrande(indice); }
  }

  return (
    <div className="carrusel" role="group" aria-roledescription="carrusel" aria-label={descripcion}>
      <div className="carrusel-pista" ref={pista} onScroll={alDesplazar} onKeyDown={alPresionarTecla} tabIndex={0}
           aria-description="Flechas para cambiar de foto, Enter para verla en grande">
        {fotos.map((src, i) => (
          <img key={i} src={src} alt={descripcion + ", foto " + (i + 1) + " de " + fotos.length} onClick={() => setEnGrande(i)} />
        ))}
      </div>

      <button type="button" className="carrusel-flecha izquierda" aria-label="Foto anterior"
              onClick={() => mover(-1)} disabled={indice === 0}>‹</button>
      <button type="button" className="carrusel-flecha derecha" aria-label="Foto siguiente"
              onClick={() => mover(1)} disabled={indice === fotos.length - 1}>›</button>

      <div className="carrusel-puntos" aria-hidden="true">
        {fotos.map((src, i) => (
          <span key={i} className={i === indice ? "punto activo" : "punto"}></span>
        ))}
      </div>
      {visor}
    </div>
  );
}
