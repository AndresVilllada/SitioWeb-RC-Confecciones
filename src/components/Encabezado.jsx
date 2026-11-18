import { Link, NavLink, useLocation } from "react-router-dom";

const ENLACES = [
  { a: "/", texto: "Inicio", exacto: true },
  { a: "/nosotros", texto: "Nosotros" },
  { a: "/catalogo", texto: "Catálogo" },
  { a: "/tienda", texto: "Tienda" },
  { a: "/cotizaciones", texto: "Cotizaciones" },
  { a: "/contacto", texto: "Contacto" },
];

export default function Encabezado({ unidades, panelAbierto, onAbrirCarrito }) {
  // En el Inicio el logo va grande en la portada; en las demás páginas queda en la esquina izquierda.
  const enInicio = useLocation().pathname === "/";

  return (
    <header className={"encabezado" + (enInicio ? " encabezado-inicio" : "")}>
      {!enInicio && (
        <Link to="/" className="logo">
          <img src="imagenes/logo.jpg" alt="RC Confecciones, ir al inicio" width="120" />
        </Link>
      )}

      <nav className="menu" aria-label="Navegación principal">
        {ENLACES.map((enlace) => (
          <NavLink
            key={enlace.a}
            to={enlace.a}
            end={enlace.exacto}
            className={({ isActive }) => "nav-bar" + (isActive ? " activo" : "")}
          >
            {enlace.texto}
          </NavLink>
        ))}

        {/* No cambia de página: abre el panel del carrito (ver PanelCarrito.jsx) */}
        <button
          type="button"
          className="nav-bar nav-carrito"
          onClick={onAbrirCarrito}
          aria-haspopup="dialog"
          aria-expanded={panelAbierto}
          aria-controls="panel-carrito"
        >
          Carrito ({unidades})
        </button>
      </nav>
    </header>
  );
}
