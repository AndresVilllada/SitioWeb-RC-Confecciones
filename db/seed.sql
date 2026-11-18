-- Generado por scripts/generar-seed.mjs. No editar a mano: edita src/data/ y vuelve a generarlo.
-- Seguro de repetir: no borra ni modifica lo que ya existe.

INSERT OR IGNORE INTO productos (id, nombre, descripcion, precio, orden) VALUES ('chaleco-empresarial', 'Chaleco empresarial', 'Ideal para equipos de trabajo, con logo bordado.', NULL, 0);
INSERT OR IGNORE INTO producto_fotos (producto_id, orden, ruta) VALUES ('chaleco-empresarial', 0, 'imagenes/empresarial/chaleco1.jpeg');
INSERT OR IGNORE INTO producto_fotos (producto_id, orden, ruta) VALUES ('chaleco-empresarial', 1, 'imagenes/empresarial/chaleco2.jpeg');
INSERT OR IGNORE INTO productos (id, nombre, descripcion, precio, orden) VALUES ('chaqueta-universitaria', 'Chaqueta tipo universitaria', 'Para clubes, grupos y promociones, con escudo personalizado.', NULL, 1);
INSERT OR IGNORE INTO producto_fotos (producto_id, orden, ruta) VALUES ('chaqueta-universitaria', 0, 'imagenes/personalizado/diseno4.jpeg');
INSERT OR IGNORE INTO productos (id, nombre, descripcion, precio, orden) VALUES ('camiseta-deportiva', 'Camiseta deportiva', 'Cómoda y funcional, con diseño y colores del equipo.', NULL, 2);
INSERT OR IGNORE INTO producto_fotos (producto_id, orden, ruta) VALUES ('camiseta-deportiva', 0, 'imagenes/deportiva/disenoscamisetas.jpeg');
INSERT OR IGNORE INTO producto_fotos (producto_id, orden, ruta) VALUES ('camiseta-deportiva', 1, 'imagenes/deportiva/uniforme1.jpeg');
INSERT OR IGNORE INTO producto_fotos (producto_id, orden, ruta) VALUES ('camiseta-deportiva', 2, 'imagenes/deportiva/uniforme2.jpeg');

INSERT OR IGNORE INTO servicios (id, titulo, texto, orden) VALUES ('confeccion-empresarial', 'Confección empresarial', 'Prendas para empresas y equipos de trabajo, diseñadas de acuerdo con la identidad y necesidades de cada organización.', 0);
INSERT OR IGNORE INTO servicio_fotos (servicio_id, orden, ruta) VALUES ('confeccion-empresarial', 0, 'imagenes/empresarial/chaquetafrente.jpeg');
INSERT OR IGNORE INTO servicio_fotos (servicio_id, orden, ruta) VALUES ('confeccion-empresarial', 1, 'imagenes/empresarial/chaquetaatras.jpeg');
INSERT OR IGNORE INTO servicio_fotos (servicio_id, orden, ruta) VALUES ('confeccion-empresarial', 2, 'imagenes/empresarial/logochaqueta.jpeg');
INSERT OR IGNORE INTO servicio_fotos (servicio_id, orden, ruta) VALUES ('confeccion-empresarial', 3, 'imagenes/empresarial/chaleco1.jpeg');
INSERT OR IGNORE INTO servicio_fotos (servicio_id, orden, ruta) VALUES ('confeccion-empresarial', 4, 'imagenes/empresarial/chaleco2.jpeg');
INSERT OR IGNORE INTO servicios (id, titulo, texto, orden) VALUES ('ropa-deportiva', 'Ropa deportiva', 'Prendas para clubes, equipos y grupos deportivos, combinando diseño, comodidad y funcionalidad.', 1);
INSERT OR IGNORE INTO servicio_fotos (servicio_id, orden, ruta) VALUES ('ropa-deportiva', 0, 'imagenes/deportiva/disenoscamisetas.jpeg');
INSERT OR IGNORE INTO servicio_fotos (servicio_id, orden, ruta) VALUES ('ropa-deportiva', 1, 'imagenes/deportiva/uniforme1.jpeg');
INSERT OR IGNORE INTO servicio_fotos (servicio_id, orden, ruta) VALUES ('ropa-deportiva', 2, 'imagenes/deportiva/uniforme2.jpeg');
INSERT OR IGNORE INTO servicio_fotos (servicio_id, orden, ruta) VALUES ('ropa-deportiva', 3, 'imagenes/deportiva/uniforme3.jpeg');
INSERT OR IGNORE INTO servicio_fotos (servicio_id, orden, ruta) VALUES ('ropa-deportiva', 4, 'imagenes/deportiva/chaquetadeportiva.jpeg');
INSERT OR IGNORE INTO servicios (id, titulo, texto, orden) VALUES ('diseno-personalizado', 'Diseño personalizado', 'Trabajamos junto a nuestros clientes para desarrollar prendas que respondan a sus ideas, colores, diseños y requerimientos.', 2);
INSERT OR IGNORE INTO servicio_fotos (servicio_id, orden, ruta) VALUES ('diseno-personalizado', 0, 'imagenes/personalizado/diseno1.jpeg');
INSERT OR IGNORE INTO servicio_fotos (servicio_id, orden, ruta) VALUES ('diseno-personalizado', 1, 'imagenes/personalizado/diseno2.jpeg');
INSERT OR IGNORE INTO servicio_fotos (servicio_id, orden, ruta) VALUES ('diseno-personalizado', 2, 'imagenes/personalizado/diseno3.jpeg');
INSERT OR IGNORE INTO servicio_fotos (servicio_id, orden, ruta) VALUES ('diseno-personalizado', 3, 'imagenes/personalizado/diseno4.jpeg');
INSERT OR IGNORE INTO servicio_fotos (servicio_id, orden, ruta) VALUES ('diseno-personalizado', 4, 'imagenes/personalizado/diseno5.jpeg');
INSERT OR IGNORE INTO servicios (id, titulo, texto, orden) VALUES ('prendas-eventos', 'Prendas para eventos nacionales e internacionales', 'Atendemos pedidos para grupos y organizaciones que participan en eventos nacionales e internacionales, con acompañamiento durante todo el proceso de creación y confección.', 3);
INSERT OR IGNORE INTO servicio_fotos (servicio_id, orden, ruta) VALUES ('prendas-eventos', 0, 'imagenes/eventos/foto1.jpeg');
INSERT OR IGNORE INTO servicio_fotos (servicio_id, orden, ruta) VALUES ('prendas-eventos', 1, 'imagenes/eventos/foto2.jpeg');
INSERT OR IGNORE INTO servicio_fotos (servicio_id, orden, ruta) VALUES ('prendas-eventos', 2, 'imagenes/eventos/foto3.jpeg');
INSERT OR IGNORE INTO servicio_fotos (servicio_id, orden, ruta) VALUES ('prendas-eventos', 3, 'imagenes/eventos/foto4.jpeg');
INSERT OR IGNORE INTO servicio_fotos (servicio_id, orden, ruta) VALUES ('prendas-eventos', 4, 'imagenes/eventos/foto5.jpeg');
INSERT OR IGNORE INTO servicio_fotos (servicio_id, orden, ruta) VALUES ('prendas-eventos', 5, 'imagenes/eventos/foto6.jpeg');

INSERT OR IGNORE INTO contacto (id, whatsapp, instagram, correo, ubicacion) VALUES (1, '', 'rcconfeccionescolombia', '', '');
