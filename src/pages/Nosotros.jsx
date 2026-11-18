import { PRINCIPIOS } from "../data/principios";
import { useTituloPagina } from "../hooks/useTituloPagina";

export default function Nosotros() {
  useTituloPagina("Nosotros");

  return (
    <section className="seccion nosotros">
      <div className="contenedor">
        <h1 className="titulo-seccion">¿Quiénes somos?</h1>

        <article className="quienes-somos">
          <p>
            En RC Confecciones somos una empresa dedicada al diseño, creación y confección de prendas para empresas, clubes deportivos, restaurantes y diferentes organizaciones.
          </p>
          <p>
            Desde 2022, trabajamos con dedicación y compromiso para convertir las ideas y necesidades de nuestros clientes en prendas funcionales, cómodas y de excelente calidad.
          </p>
          <p>
            Nos caracteriza la atención personalizada, el cuidado en cada detalle y el compromiso de ofrecer soluciones que se adapten a cada proyecto. Para nosotros, cada cliente es único y cada prenda representa la confianza que depositan en nuestro trabajo.
          </p>
          <p>
            En RC Confecciones no solo confeccionamos prendas; ayudamos a nuestros clientes a llevar su identidad con orgullo.
          </p>
        </article>

        <div className="mision-vision">
          <article className="tarjeta">
            <h2>Nuestra misión</h2>
            <p>
              En RC Confecciones nos dedicamos al diseño, creación y confección de prendas de vestir para empresas, clubes deportivos, restaurantes y diferentes organizaciones. Trabajamos para ofrecer productos de excelente calidad, adaptados a las necesidades de cada cliente, combinando diseño, funcionalidad y compromiso en cada prenda.
            </p>
            <p>
              Desde 2022 construimos relaciones basadas en la confianza, el cumplimiento y la satisfacción de nuestros clientes.
            </p>
          </article>

          <article className="tarjeta">
            <h2>Nuestra visión</h2>
            <p>
              Ser una empresa reconocida a nivel nacional por la calidad, innovación y compromiso en la confección de prendas para diferentes sectores, consolidándonos como un aliado confiable para nuestros clientes y ampliando nuestro alcance mediante un servicio cada vez más eficiente y personalizado.
            </p>
          </article>

          <article className="tarjeta tarjeta-ancha">
            <h2>Nuestros principios</h2>
            <ul className="principios">
              {PRINCIPIOS.map((p) => (
                <li key={p.nombre}>
                  <strong>{p.nombre}.</strong> {p.texto}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
