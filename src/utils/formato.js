/* Formato de dinero colombiano: $ 45.000 */
const formatoPesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatearPesos(valor) {
  return formatoPesos.format(valor);
}

export function textoPrecio(precio) {
  return typeof precio === "number" ? formatearPesos(precio) : "Precio por definir";
}

/* "2026-11-20" -> "20/11/2026" */
export function formatoFecha(aaaammdd) {
  const [anio, mes, dia] = String(aaaammdd).split("-");
  return anio && mes && dia ? dia + "/" + mes + "/" + anio : String(aaaammdd);
}
