/* Productos iniciales de la tienda (los que se ven si nadie ha editado nada desde el panel de administración).
   Son de ejemplo: las fotos salen de los trabajos reales de la empresa. Se pueden añadir, quitar o editar
   desde el panel de administración (pestaña Productos).
   - precio: null  -> se muestra "Precio por definir". Cuando sepan el precio, escriban el número (ej. 45000).
   - fotos: []    -> se muestra el recuadro "foto pendiente". Cuando haya fotos, pongan las rutas
                     (ej. ["imagenes/chaleco-1.jpg", "imagenes/chaleco-2.jpg"], con los archivos en public/imagenes).
                     Con 2 o más fotos aparece el carrusel con flechas. */
export const PRODUCTOS_INICIALES = [
  { id: "chaleco-empresarial",    nombre: "Chaleco empresarial",         descripcion: "Ideal para equipos de trabajo, con logo bordado.",                      precio: null, fotos: ["imagenes/empresarial/chaleco1.jpeg", "imagenes/empresarial/chaleco2.jpeg"] },
  { id: "chaqueta-universitaria", nombre: "Chaqueta tipo universitaria", descripcion: "Para clubes, grupos y promociones, con escudo personalizado.",          precio: null, fotos: ["imagenes/personalizado/diseno4.jpeg"] },
  { id: "camiseta-deportiva",     nombre: "Camiseta deportiva",          descripcion: "Cómoda y funcional, con diseño y colores del equipo.",                  precio: null, fotos: ["imagenes/deportiva/disenoscamisetas.jpeg", "imagenes/deportiva/uniforme1.jpeg", "imagenes/deportiva/uniforme2.jpeg"] },
];
