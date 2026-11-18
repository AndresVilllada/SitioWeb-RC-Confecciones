import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/* Visor de fotos a pantalla completa (como en Instagram o en una tienda grande).
   - Flechas en pantalla y del teclado, deslizar con el dedo, contador "2 / 5".
   - Se cierra con la X, la tecla Esc o un clic en el fondo oscuro.
   - Se dibuja directamente en <body> (createPortal) para quedar encima de todo. */
export default function VisorFotos({ fotos, inicio = 0, descripcion, onCerrar }) {
  const [indice, setIndice] = useState(inicio);
  const visor = useRef(null);
  const botonCerrar = useRef(null);
  const toque = useRef(null);   // dónde empezó el dedo, para saber si deslizó
  const total = fotos.length;

  const ir = (n) => setIndice((actual) => Math.min(total - 1, Math.max(0, actual + n)));

  // Al abrir: foco en la X y la página de atrás quieta. Al cerrar: todo vuelve como estaba.
  useEffect(() => {
    const anterior = document.activeElement;
    const { overflow, paddingRight } = document.body.style;
    const barra = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (barra > 0) document.body.style.paddingRight = barra + "px";
    botonCerrar.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      if (anterior?.isConnected) anterior.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    function alTeclear(e) {
      if (e.key === "Escape") { e.preventDefault(); onCerrar(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); ir(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); ir(1); }
      else if (e.key === "Tab") {
        // El foco se queda dentro del visor
        const botones = Array.from(visor.current.querySelectorAll("button:not([disabled])"));
        if (botones.length === 0) return;
        const i = botones.indexOf(document.activeElement);
        const siguiente = e.shiftKey ? (i <= 0 ? botones.length - 1 : i - 1) : (i === botones.length - 1 ? 0 : i + 1);
        e.preventDefault();
        botones[siguiente].focus();
      }
    }
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  });

  function alEmpezarToque(e) {
    const t = e.touches[0];
    toque.current = { x: t.clientX, y: t.clientY };
  }

  function alTerminarToque(e) {
    if (!toque.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - toque.current.x;
    const dy = t.clientY - toque.current.y;
    toque.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) ir(dx < 0 ? 1 : -1);   // deslizar a la izquierda = siguiente
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) onCerrar();                  // deslizar hacia abajo = cerrar
  }

  return createPortal(
    <div
      className="visor" ref={visor} role="dialog" aria-modal="true" aria-label={"Fotos: " + descripcion}
      onClick={(e) => { if (e.target === e.currentTarget || e.target.classList.contains("visor-escena") || e.target.classList.contains("visor-barra")) onCerrar(); }}
      onTouchStart={alEmpezarToque} onTouchEnd={alTerminarToque}
    >
      <div className="visor-barra">
        <p className="visor-contador" aria-live="polite">{total > 1 ? indice + 1 + " / " + total : ""}</p>
        <button type="button" className="visor-cerrar" ref={botonCerrar} onClick={onCerrar} aria-label="Cerrar las fotos">✕</button>
      </div>

      <div className="visor-escena">
        <img key={indice} className="visor-foto" src={fotos[indice]} alt={descripcion + ", foto " + (indice + 1) + " de " + total} />
      </div>

      {total > 1 && (
        <>
          <button type="button" className="visor-flecha izquierda" onClick={() => ir(-1)} disabled={indice === 0} aria-label="Foto anterior">‹</button>
          <button type="button" className="visor-flecha derecha" onClick={() => ir(1)} disabled={indice === total - 1} aria-label="Foto siguiente">›</button>
          <div className="visor-miniaturas">
            {fotos.map((src, i) => (
              <button
                key={i} type="button" className={"visor-miniatura" + (i === indice ? " activa" : "")}
                onClick={() => setIndice(i)} aria-label={"Ver foto " + (i + 1)} aria-current={i === indice}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        </>
      )}

      <p className="visor-descripcion">{descripcion}</p>
    </div>,
    document.body
  );
}
