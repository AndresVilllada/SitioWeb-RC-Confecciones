import Carrusel from "../components/Carrusel";
import { useDatos } from "../context/DatosContext";
import { useTituloPagina } from "../hooks/useTituloPagina";

export default function Catalogo() {
  useTituloPagina("Catálogo");
  const { servicios } = useDatos();
  // Con 2 o 4 tarjetas quedan en 2 columnas (2 × 2); con otras cantidades se acomodan solas
  const enPares = servicios.length === 2 || servicios.length === 4;

  return (
    <section className="seccion fondo-grafito">
      <div className="contenedor">
        <h1 className="titulo-seccion">Catálogo</h1>
        <p className="subtitulo">
          Estas son las prendas y servicios que desarrollamos para cada tipo de cliente.
        </p>

        <div className={"rejilla-servicios" + (enPares ? " en-pares" : "")}>
          {servicios.map((servicio) => (
            <article key={servicio.id} className="tarjeta servicio">
              <Carrusel fotos={servicio.fotos} descripcion={servicio.titulo} />
              <h2>{servicio.titulo}</h2>
              <p>{servicio.texto}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
