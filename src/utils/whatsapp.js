import { formatearPesos, formatoFecha } from "./formato";

/* Enlace que abre WhatsApp con el mensaje ya escrito.
   Si no hay número, WhatsApp deja elegir a quién enviarlo. */
export function enlaceWhatsApp(numero, texto) {
  return "https://wa.me/" + (numero || "") + "?text=" + encodeURIComponent(texto);
}

/* Texto del pedido del carrito. Ejemplo:
     Hola RC Confecciones, quiero hacer este pedido:

     • 2 x Chaleco empresarial ($ 45.000 c/u)
     • 1 x Camiseta deportiva (precio por definir)

     Total: por confirmar */
export function mensajePedido(items, productos) {
  const lineas = [];
  let hayPrecioPendiente = false;
  let total = 0;

  items.forEach((item) => {
    const producto = productos.find((p) => p.id === item.id);
    if (!producto) return;
    if (typeof producto.precio === "number") {
      total += producto.precio * item.cantidad;
      lineas.push("• " + item.cantidad + " x " + producto.nombre + " (" + formatearPesos(producto.precio) + " c/u)");
    } else {
      hayPrecioPendiente = true;
      lineas.push("• " + item.cantidad + " x " + producto.nombre + " (precio por definir)");
    }
  });

  return (
    "Hola RC Confecciones, quiero hacer este pedido:\n\n" +
    lineas.join("\n") +
    "\n\nTotal: " + (hayPrecioPendiente ? "por confirmar" : formatearPesos(total)) +
    "\n\n¿Me confirman disponibilidad, tiempo de entrega y forma de pago? Gracias."
  );
}

const TIPOS_CLIENTE = {
  empresa: "Empresa",
  club: "Club deportivo",
  restaurante: "Restaurante",
  otro: "Otro",
};

/* Texto de la solicitud de cotización (los datos del formulario).
   Ya no es la vía principal (las cotizaciones se envían por correo desde el servidor):
   solo se usa como respaldo cuando el servidor no responde. */
export function mensajeCotizacion(datos) {
  const lineas = ["Hola RC Confecciones, quiero solicitar una cotización:", ""];
  lineas.push("Nombre: " + datos.nombre);
  if (datos.organizacion) lineas.push("Empresa u organización: " + datos.organizacion);
  lineas.push("Correo: " + datos.correo);
  lineas.push("Teléfono: " + datos.telefono);
  lineas.push("Tipo de cliente: " + (TIPOS_CLIENTE[datos["tipo-cliente"]] || datos["tipo-cliente"]));
  lineas.push("Prenda: " + datos.prenda);
  lineas.push("Cantidad aproximada: " + datos.cantidad);
  if (datos.fecha) lineas.push("Fecha en que las necesita: " + formatoFecha(datos.fecha));
  lineas.push("¿Ya tiene diseño o logo?: " + (datos.diseno === "si" ? "Sí" : "No, necesita ayuda"));
  if (datos.mensaje) {
    lineas.push("", "Detalles: " + datos.mensaje);
  }
  return lineas.join("\n");
}
