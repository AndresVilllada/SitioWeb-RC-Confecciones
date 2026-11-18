import { Link, Outlet } from "react-router-dom";

/* Estructura de la página de administración (/admin): es una página aparte del sitio público.
   No lleva el menú, el carrito, el botón de WhatsApp ni el pie de la página; solo una barra
   sencilla con el logo y el enlace para volver al sitio. */
export default function LayoutAdmin() {
  return (
    <>
      <header className="encabezado admin-barra">
        <Link to="/" className="logo">
          <img src="imagenes/logo.jpg" alt="RC Confecciones" width="120" />
        </Link>
        <span className="admin-barra-titulo">Administración del sitio</span>
        <Link to="/" className="nav-bar">← Volver al sitio</Link>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
