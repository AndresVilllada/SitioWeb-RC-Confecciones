import { Fragment } from "react";
import { Link } from "react-router-dom";
import Carrusel from "../components/Carrusel";
import { useDatos } from "../context/DatosContext";
import { useTituloPagina } from "../hooks/useTituloPagina";

const LEMA = "Calidad y estilo en cada prenda.";

export default function Inicio() {
  useTituloPagina("");
  const { galeria } = useDatos();

  return (
    <>
      <section className="pantalla-inicio">
        <div className="portada-brillo" aria-hidden="true"></div>
        <p className="etiqueta">Desde 2022</p>
        {/* El logo grande ocupa el lugar del título; el texto sigue ahí para lectores de pantalla y buscadores */}
        <h1 className="portada-logo">
          <span className="solo-lectores">Bienvenidos a RC Confecciones</span>
          <img src="imagenes/logo-transparente.png" alt="" width="1269" height="752" />
        </h1>
        {/* El lema aparece palabra por palabra (cada una con un pequeño retraso) */}
        <p className="lema" aria-label={LEMA}>
          {LEMA.split(" ").map((palabra, i, todas) => (
            <Fragment key={i}>
              <span className="lema-palabra" style={{ "--orden": i }} aria-hidden="true">{palabra}</span>
              {i < todas.length - 1 && " "}
            </Fragment>
          ))}
        </p>
        <div className="acciones">
          <Link to="/catalogo" className="boton">Ver catálogo</Link>
          <Link to="/cotizaciones" className="boton boton-solido">Solicitar cotización</Link>
        </div>
        <a href="#que-necesitas" className="indicador-bajar" aria-label="Bajar a las opciones"
           onClick={(e) => { e.preventDefault(); document.getElementById("que-necesitas")?.scrollIntoView({ behavior: "smooth" }); }}>
          <span aria-hidden="true"></span>
        </a>
      </section>

      {/* La galería solo aparece cuando ya hay fotos cargadas (desde el panel de administración) */}
      {galeria.length > 0 && (
        <section className="seccion fondo-grafito">
          <div className="contenedor">
            <h2 className="titulo-seccion">Nuestros trabajos</h2>
            <p className="subtitulo">Algunas de las prendas que hemos confeccionado.</p>
            <div className="galeria">
              <Carrusel fotos={galeria} descripcion="Trabajos de RC Confecciones" />
            </div>
          </div>
        </section>
      )}

      <section className="seccion" id="que-necesitas">
        <div className="contenedor">
          <h2 className="titulo-seccion">¿Qué necesitas?</h2>
          <div className="accesos">
            <article className="tarjeta">
              <h3>Conoce lo que hacemos</h3>
              <p>Uniformes empresariales, deportivos y para restaurantes, con diseño a tu medida.</p>
              <Link to="/catalogo" className="boton">Ver catálogo</Link>
            </article>
            <article className="tarjeta">
              <h3>Compra directa</h3>
              <p>Elige las prendas, arma tu carrito y envía el pedido por WhatsApp.</p>
              <Link to="/tienda" className="boton">Ir a la tienda</Link>
            </article>
            <article className="tarjeta">
              <h3>Pedidos para tu organización</h3>
              <p>Cuéntanos tu proyecto y te respondemos con una propuesta a la medida.</p>
              <Link to="/cotizaciones" className="boton">Solicitar cotización</Link>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
