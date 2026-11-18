import { useOutletContext } from "react-router-dom";
import ProductoTarjeta from "../components/ProductoTarjeta";
import { useDatos } from "../context/DatosContext";
import { useTituloPagina } from "../hooks/useTituloPagina";

export default function Tienda() {
  useTituloPagina("Tienda");
  const { productos } = useDatos();
  const { carrito } = useOutletContext();

  return (
    <section className="seccion">
      <div className="contenedor">
        <h1 className="titulo-seccion">Tienda</h1>
        <p className="subtitulo">Prendas disponibles para compra directa. Arma tu carrito y envía el pedido por WhatsApp.</p>

        <div className="productos" id="productos">
          {productos.length === 0 && <p>Pronto tendremos prendas disponibles en la tienda.</p>}
          {productos.map((producto) => (
            <ProductoTarjeta key={producto.id} producto={producto} onAnadir={carrito.anadir} />
          ))}
        </div>
      </div>
    </section>
  );
}
