import { textoPrecio } from "../utils/formato";
import Carrusel from "./Carrusel";

export default function ProductoTarjeta({ producto, onAnadir }) {
  return (
    <article className="tarjeta producto">
      <Carrusel fotos={producto.fotos} descripcion={producto.nombre} />
      <h2>{producto.nombre}</h2>
      <p>{producto.descripcion}</p>
      <p className="precio">{textoPrecio(producto.precio)}</p>
      <button type="button" className="boton boton-carrito" onClick={() => onAnadir(producto.id)}>
        Añadir al carrito
      </button>
    </article>
  );
}
