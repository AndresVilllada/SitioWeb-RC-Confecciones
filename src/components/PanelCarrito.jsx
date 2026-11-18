import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDatos } from "../context/DatosContext";
import { textoPrecio, formatearPesos } from "../utils/formato";
import { enlaceWhatsApp, mensajePedido } from "../utils/whatsapp";

// Elementos a los que se puede llegar con la tecla Tab
const FOCALIZABLES = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/* Panel del carrito: se desliza desde la derecha sobre cualquier página.
   Se cierra con la X, la tecla Esc, "Seguir comprando" o haciendo clic en el fondo oscuro.
   Layout decide cuándo está abierto; aquí solo se dibuja y se cuida el teclado. */
export default function PanelCarrito({ abierto, onCerrar, carrito }) {
  const { productos, contacto } = useDatos();
  const { items, total, hayPrecioPendiente, cambiar, quitar, vaciar } = carrito;

  const panel = useRef(null);
  const botonCerrar = useRef(null);

  // Mensaje de confirmación o error: { texto, error } o null si no hay
  const [mensaje, setMensaje] = useState(null);

  // Al abrir: el foco pasa al panel y se bloquea el desplazamiento de la página de atrás.
  // Al cerrar: todo vuelve a como estaba (el foco regresa al botón que lo abrió).
  useEffect(() => {
    if (!abierto) return undefined;

    const anterior = document.activeElement;
    botonCerrar.current?.focus({ preventScroll: true });

    const estilo = document.body.style;
    const guardado = { overflow: estilo.overflow, relleno: estilo.paddingRight };
    const barra = window.innerWidth - document.documentElement.clientWidth;   // ancho de la barra de desplazamiento
    estilo.overflow = "hidden";
    if (barra > 0) estilo.paddingRight = barra + "px";   // evita que la página "salte" al ocultar la barra

    return () => {
      estilo.overflow = guardado.overflow;
      estilo.paddingRight = guardado.relleno;
      setMensaje(null);
      // preventScroll: el menú de arriba es "pegajoso"; sin esto el navegador subiría la página al devolverle el foco
      if (anterior && anterior.isConnected && typeof anterior.focus === "function") anterior.focus({ preventScroll: true });
    };
  }, [abierto]);

  // Teclado mientras está abierto: Esc cierra y Tab se queda dentro del panel
  useEffect(() => {
    if (!abierto) return undefined;

    function alTeclear(evento) {
      if (evento.key === "Escape") {
        onCerrar();
        return;
      }
      if (evento.key !== "Tab" || !panel.current) return;

      const elementos = [...panel.current.querySelectorAll(FOCALIZABLES)].filter((el) => el.getClientRects().length > 0);
      if (elementos.length === 0) return;
      const primero = elementos[0];
      const ultimo = elementos[elementos.length - 1];
      const dentro = panel.current.contains(document.activeElement);

      if (!dentro || (evento.shiftKey && document.activeElement === primero)) {
        evento.preventDefault();
        (evento.shiftKey ? ultimo : primero).focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [abierto, onCerrar]);

  // El botón es un enlace a WhatsApp con el pedido ya escrito.
  // Si el carrito está vacío, no se abre nada y se avisa.
  function alPedir(evento) {
    if (items.length === 0) {
      evento.preventDefault();
      setMensaje({ texto: "Añade al menos una prenda antes de enviar el pedido.", error: true });
      return;
    }
    setMensaje({ texto: "Se abrió WhatsApp con tu pedido. Envía el mensaje para que lo confirmemos contigo." });
  }

  function vaciarCarrito() {
    vaciar();
    setMensaje(null);
  }

  return (
    <>
      {/* Fondo oscuro: al hacer clic fuera del panel, se cierra */}
      <div className={"panel-fondo" + (abierto ? " abierto" : "")} onClick={onCerrar} aria-hidden="true" />

      <div
        ref={panel}
        id="panel-carrito"
        className={"panel-carrito" + (abierto ? " abierto" : "")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-carrito"
      >
        <div className="panel-cabecera">
          <h2 id="titulo-carrito">Tu carrito</h2>
          <button ref={botonCerrar} type="button" className="panel-cerrar" aria-label="Cerrar el carrito" onClick={onCerrar}>
            ✕
          </button>
        </div>

        <div className="panel-cuerpo">
          {items.length === 0 ? (
            <div className="carrito-vacio">
              <p>Aún no has añadido prendas.</p>
              <Link to="/tienda" className="boton" onClick={onCerrar}>Ver prendas</Link>
            </div>
          ) : (
            <ul id="lista-carrito">
              {items.map((item) => {
                const producto = productos.find((p) => p.id === item.id);
                const foto = producto.fotos?.[0];
                return (
                  <li key={item.id} className="carrito-item">
                    {foto ? (
                      <img className="carrito-item-foto" src={foto} alt="" />
                    ) : (
                      <span className="carrito-item-foto carrito-item-foto-vacia" aria-hidden="true">◇</span>
                    )}
                    <div className="carrito-item-info">
                      <span className="carrito-item-nombre">{producto.nombre}</span>
                      <span className="carrito-item-precio">{textoPrecio(producto.precio)}</span>
                      <div className="carrito-item-fila">
                        <div className="cantidad">
                          <button type="button" aria-label="Quitar una unidad" onClick={() => cambiar(item.id, -1)}>−</button>
                          <span aria-live="polite">{item.cantidad}</span>
                          <button type="button" aria-label="Añadir una unidad" onClick={() => cambiar(item.id, 1)}>+</button>
                        </div>
                        <button type="button" className="quitar" onClick={() => quitar(item.id)}>Quitar</button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="panel-pie">
            {/* Si algún producto aún no tiene precio, el total no se puede calcular */}
            <p className="carrito-total">
              Total: <span id="total-carrito">{hayPrecioPendiente ? "Por definir" : formatearPesos(total)}</span>
            </p>

            <a
              className="boton boton-solido boton-whatsapp"
              href={enlaceWhatsApp(contacto.whatsapp, mensajePedido(items, productos))}
              target="_blank"
              rel="noopener noreferrer"
              onClick={alPedir}
            >
              Pedir por WhatsApp
            </a>

            <div className="panel-enlaces">
              <button type="button" className="quitar" onClick={onCerrar}>Seguir comprando</button>
              <button type="button" className="quitar" onClick={vaciarCarrito}>Vaciar carrito</button>
            </div>

            {mensaje && (
              <p className={"mensaje" + (mensaje.error ? " error" : "")} role="status">{mensaje.texto}</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
