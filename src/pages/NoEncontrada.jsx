import { Link } from "react-router-dom";
import { useTituloPagina } from "../hooks/useTituloPagina";

export default function NoEncontrada() {
  useTituloPagina("Página no encontrada");

  return (
    <section className="seccion">
      <div className="contenedor pagina-vacia">
        <h1 className="titulo-seccion">Página no encontrada</h1>
        <p className="subtitulo">La página que buscas no existe o cambió de lugar.</p>
        <Link to="/" className="boton">Volver al inicio</Link>
      </div>
    </section>
  );
}
