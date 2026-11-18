import { useEffect } from "react";

/* Hace que títulos, tarjetas y fotos aparezcan suavemente cuando llegan a la pantalla al bajar.
   Cómo funciona:
   1. Busca esos elementos dentro de <main> y les pone la clase "revelar" (empiezan transparentes).
   2. Un IntersectionObserver avisa cuando cada uno entra en la pantalla y le pone "visible"
      (el CSS hace la animación).
   3. Un MutationObserver revisa los elementos que aparezcan después (por ejemplo, prendas nuevas).
   Si el equipo tiene activado "reducir movimiento", solo se desvanecen (sin moverse). */

const SELECTORES = [
  ".seccion .titulo-seccion",
  ".seccion .subtitulo",
  ".quienes-somos > p",
  ".tarjeta",
  ".galeria",
  ".formulario",
  ".datos-contacto",
].join(", ");

export function useAparecerAlBajar(ruta, activo = true) {
  useEffect(() => {
    if (!activo) return undefined;
    // (Si el equipo pide "reducir movimiento", el CSS deja solo un desvanecido suave, sin desplazamientos)
    if (!("IntersectionObserver" in window)) return undefined;

    const principal = document.querySelector("main");
    if (!principal) return undefined;

    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          // Lo que ya quedó por encima de la pantalla (por ejemplo, al recargar a mitad de página)
          // se muestra de una vez, sin esperar a que el visitante suba.
          const yaPasoArriba = !entrada.isIntersecting && entrada.boundingClientRect.bottom <= (entrada.rootBounds?.top ?? 0);
          if (!entrada.isIntersecting && !yaPasoArriba) return;
          entrada.target.classList.add("visible");
          observador.unobserve(entrada.target);   // solo se anima la primera vez
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    function preparar() {
      principal.querySelectorAll(SELECTORES).forEach((el) => {
        if (el.classList.contains("visible")) return;          // ya apareció
        if (el.classList.contains("revelar")) {                // ya preparado: solo se vuelve a vigilar
          observador.observe(el);
          return;
        }
        // En una rejilla, cada tarjeta sale un poquito después que la anterior (efecto cascada)
        const hermanos = el.parentElement ? Array.from(el.parentElement.children) : [el];
        const posicion = Math.max(0, hermanos.indexOf(el)) % 4;
        el.style.setProperty("--retraso", posicion * 0.09 + "s");
        el.classList.add("revelar");
        observador.observe(el);
      });
    }

    preparar();
    const vigilante = new MutationObserver(preparar);
    vigilante.observe(principal, { childList: true, subtree: true });

    return () => {
      vigilante.disconnect();
      observador.disconnect();
    };
  }, [ruta, activo]);
}
