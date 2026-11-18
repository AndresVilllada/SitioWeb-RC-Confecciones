import { useEffect } from "react";

/* Cambia el título de la pestaña del navegador según la página */
export function useTituloPagina(titulo) {
  useEffect(() => {
    document.title = titulo
      ? titulo + " | RC Confecciones"
      : "RC Confecciones | Prendas para empresas y clubes";
  }, [titulo]);
}
