/* Servicios iniciales del Catálogo (lo que hace la empresa). Textos y fotos de la versión del equipo.
   fotos: ["imagenes/carpeta/foto.jpeg", ...]  (archivos en public/imagenes/<carpeta>/).
   Con 2 o más fotos aparece el carrusel; con 1 solo la foto; con [] el recuadro "foto pendiente".
   Consejo: nombres de archivo sin tildes, sin espacios y en minúsculas.
   Los servicios se pueden cambiar, agregar o quitar desde el panel de administración (pestaña Catálogo). */
export const SERVICIOS_INICIALES = [
  {
    id: "confeccion-empresarial",
    titulo: "Confección empresarial",
    texto: "Prendas para empresas y equipos de trabajo, diseñadas de acuerdo con la identidad y necesidades de cada organización.",
    fotos: [
      "imagenes/empresarial/chaquetafrente.jpeg",
      "imagenes/empresarial/chaquetaatras.jpeg",
      "imagenes/empresarial/logochaqueta.jpeg",
      "imagenes/empresarial/chaleco1.jpeg",
      "imagenes/empresarial/chaleco2.jpeg",
    ],
  },
  {
    id: "ropa-deportiva",
    titulo: "Ropa deportiva",
    texto: "Prendas para clubes, equipos y grupos deportivos, combinando diseño, comodidad y funcionalidad.",
    fotos: [
      "imagenes/deportiva/disenoscamisetas.jpeg",
      "imagenes/deportiva/uniforme1.jpeg",
      "imagenes/deportiva/uniforme2.jpeg",
      "imagenes/deportiva/uniforme3.jpeg",
      "imagenes/deportiva/chaquetadeportiva.jpeg",
    ],
  },
  {
    id: "diseno-personalizado",
    titulo: "Diseño personalizado",
    texto: "Trabajamos junto a nuestros clientes para desarrollar prendas que respondan a sus ideas, colores, diseños y requerimientos.",
    fotos: [
      "imagenes/personalizado/diseno1.jpeg",
      "imagenes/personalizado/diseno2.jpeg",
      "imagenes/personalizado/diseno3.jpeg",
      "imagenes/personalizado/diseno4.jpeg",
      "imagenes/personalizado/diseno5.jpeg",
    ],
  },
  {
    id: "prendas-eventos",
    titulo: "Prendas para eventos nacionales e internacionales",
    texto: "Atendemos pedidos para grupos y organizaciones que participan en eventos nacionales e internacionales, con acompañamiento durante todo el proceso de creación y confección.",
    fotos: [
      "imagenes/eventos/foto1.jpeg",
      "imagenes/eventos/foto2.jpeg",
      "imagenes/eventos/foto3.jpeg",
      "imagenes/eventos/foto4.jpeg",
      "imagenes/eventos/foto5.jpeg",
      "imagenes/eventos/foto6.jpeg",
    ],
  },
];
