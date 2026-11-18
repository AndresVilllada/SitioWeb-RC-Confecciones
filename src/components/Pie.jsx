export default function Pie() {
  return (
    <footer className="pie">
      <p className="pie-marca">RC Confecciones</p>
      <p>Diseño, creación y confección de prendas desde 2022.</p>
      <p className="pie-derechos">
        © {new Date().getFullYear()} RC Confecciones. Todos los derechos reservados.
      </p>
    </footer>
  );
}
