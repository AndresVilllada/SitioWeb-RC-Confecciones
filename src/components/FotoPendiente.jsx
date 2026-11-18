/* Recuadro que se muestra mientras no haya fotos reales. */
export default function FotoPendiente({ descripcion }) {
  return (
    <figure
      className="foto-pendiente"
      role="img"
      aria-label={"Foto pendiente: " + descripcion.toLowerCase()}
    ></figure>
  );
}
