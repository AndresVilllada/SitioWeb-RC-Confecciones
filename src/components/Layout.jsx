import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Encabezado from "./Encabezado";
import Pie from "./Pie";
import PanelCarrito from "./PanelCarrito";
import BotonWhatsApp from "./BotonWhatsApp";
import { useAparecerAlBajar } from "../hooks/useAparecerAlBajar";
import { useCarrito } from "../hooks/useCarrito";
import { useDatos } from "../context/DatosContext";

/* Estructura común de todas las páginas: encabezado arriba, la página en el medio y pie abajo.
   El carrito vive aquí porque lo usan tres partes: el menú (contador y botón "Carrito"),
   la tienda (botón "Añadir al carrito") y el panel que se desliza desde la derecha. */
export default function Layout() {
  const { productos } = useDatos();
  const carrito = useCarrito(productos);
  const { pathname } = useLocation();
  const [panelAbierto, setPanelAbierto] = useState(false);

  // Títulos, tarjetas y fotos aparecen suavemente al bajar
  useAparecerAlBajar(pathname);

  const abrirPanel = useCallback(() => setPanelAbierto(true), []);
  const cerrarPanel = useCallback(() => setPanelAbierto(false), []);

  // Al cambiar de página: se cierra el panel y se vuelve arriba
  useEffect(() => {
    setPanelAbierto(false);
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  // Al añadir una prenda, además de sumarla, se muestra el panel con el carrito
  function anadir(id) {
    carrito.anadir(id);
    abrirPanel();
  }

  return (
    <>
      <Encabezado unidades={carrito.unidades} panelAbierto={panelAbierto} onAbrirCarrito={abrirPanel} />
      <main>
        <Outlet context={{ carrito: { ...carrito, anadir } }} />
      </main>
      <Pie />
      <PanelCarrito abierto={panelAbierto} onCerrar={cerrarPanel} carrito={carrito} />
      <BotonWhatsApp />
    </>
  );
}
