import { useEffect, useMemo, useReducer } from "react";

const CLAVE = "rc-carrito";   // nombre con el que se guarda el carrito en el navegador

/* Lee el carrito guardado. Si no hay, o el navegador no deja leer, empieza vacío. */
function leerGuardado() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE));
    if (Array.isArray(guardado)) {
      return guardado.filter((i) => typeof i.id === "string" && Number.isInteger(i.cantidad) && i.cantidad > 0);
    }
  } catch {
    /* sin acceso al almacenamiento */
  }
  return [];
}

/* El "reductor" decide cómo cambia el carrito según la acción recibida.
   El carrito es una lista: [{ id: "chaleco-empresarial", cantidad: 2 }, ...] */
function reductor(items, accion) {
  switch (accion.tipo) {
    case "anadir": {
      const existe = items.some((i) => i.id === accion.id);
      return existe
        ? items.map((i) => (i.id === accion.id ? { ...i, cantidad: i.cantidad + 1 } : i))
        : [...items, { id: accion.id, cantidad: 1 }];
    }
    case "cambiar":
      return items
        .map((i) => (i.id === accion.id ? { ...i, cantidad: i.cantidad + accion.cambio } : i))
        .filter((i) => i.cantidad > 0);   // si llega a 0, se quita
    case "quitar":
      return items.filter((i) => i.id !== accion.id);
    case "vaciar":
      return [];
    default:
      return items;
  }
}

/* "productos" es la lista actual de la tienda. Si un producto se elimina desde el panel
   de administración, deja de contar en el carrito. */
export function useCarrito(productos) {
  const [guardados, dispatch] = useReducer(reductor, undefined, leerGuardado);

  const items = useMemo(
    () => guardados.filter((i) => productos.some((p) => p.id === i.id)),
    [guardados, productos]
  );

  // Cada vez que cambia el carrito, se guarda
  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(items));
    } catch {
      /* si no se puede guardar, el carrito sigue funcionando en esta visita */
    }
  }, [items]);

  // Valores calculados a partir de la lista
  const precioDe = (id) => productos.find((p) => p.id === id)?.precio;
  const unidades = items.reduce((suma, i) => suma + i.cantidad, 0);
  const hayPrecioPendiente = items.some((i) => typeof precioDe(i.id) !== "number");
  const total = items.reduce((suma, i) => suma + (precioDe(i.id) ?? 0) * i.cantidad, 0);

  return {
    items,
    unidades,
    total,
    hayPrecioPendiente,
    anadir: (id) => dispatch({ tipo: "anadir", id }),
    cambiar: (id, cambio) => dispatch({ tipo: "cambiar", id, cambio }),
    quitar: (id) => dispatch({ tipo: "quitar", id }),
    vaciar: () => dispatch({ tipo: "vaciar" }),
  };
}
