// Genera db/seed.sql con los datos iniciales, leyéndolos de src/data/ (la misma fuente que usa la página).
// Así hay un solo lugar donde editar los productos y servicios iniciales.
//   Uso: node scripts/generar-seed.mjs
import { writeFileSync } from "node:fs";
import { PRODUCTOS_INICIALES } from "../src/data/productos.js";
import { SERVICIOS_INICIALES } from "../src/data/servicios.js";
import { CONTACTO_INICIAL } from "../src/data/contacto.js";

const q = (v) => (v === null || v === undefined ? "NULL" : typeof v === "number" ? String(v) : "'" + String(v).replaceAll("'", "''") + "'");
// NO borra nada: usa INSERT OR IGNORE, así que correrlo de nuevo nunca pisa lo que el administrador ya editó.
const lineas = ["-- Generado por scripts/generar-seed.mjs. No editar a mano: edita src/data/ y vuelve a generarlo.", "-- Seguro de repetir: no borra ni modifica lo que ya existe.", ""];

PRODUCTOS_INICIALES.forEach((p, i) => {
  lineas.push(`INSERT OR IGNORE INTO productos (id, nombre, descripcion, precio, orden) VALUES (${q(p.id)}, ${q(p.nombre)}, ${q(p.descripcion)}, ${q(p.precio)}, ${i});`);
  (p.fotos || []).forEach((f, j) => lineas.push(`INSERT OR IGNORE INTO producto_fotos (producto_id, orden, ruta) VALUES (${q(p.id)}, ${j}, ${q(f)});`));
});
lineas.push("");
SERVICIOS_INICIALES.forEach((s, i) => {
  lineas.push(`INSERT OR IGNORE INTO servicios (id, titulo, texto, orden) VALUES (${q(s.id)}, ${q(s.titulo)}, ${q(s.texto)}, ${i});`);
  (s.fotos || []).forEach((f, j) => lineas.push(`INSERT OR IGNORE INTO servicio_fotos (servicio_id, orden, ruta) VALUES (${q(s.id)}, ${j}, ${q(f)});`));
});
lineas.push("");
const c = CONTACTO_INICIAL;
lineas.push(`INSERT OR IGNORE INTO contacto (id, whatsapp, instagram, correo, ubicacion) VALUES (1, ${q(c.whatsapp)}, ${q(c.instagram)}, ${q(c.correo)}, ${q(c.ubicacion)});`);

writeFileSync(new URL("../db/seed.sql", import.meta.url), lineas.join("\n") + "\n");
console.log(`db/seed.sql listo: ${PRODUCTOS_INICIALES.length} productos, ${SERVICIOS_INICIALES.length} servicios.`);
