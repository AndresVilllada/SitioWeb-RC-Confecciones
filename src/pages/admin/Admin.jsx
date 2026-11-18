import { useAdmin } from "../../context/AdminContext";
import { useTituloPagina } from "../../hooks/useTituloPagina";
import AccesoAdmin from "./AccesoAdmin";
import PanelAdmin from "./PanelAdmin";

/* /admin: si no hay sesión muestra el acceso (entrar o crear cuenta); si hay sesión, el panel */
export default function Admin() {
  useTituloPagina("Administración");
  const { sesion } = useAdmin();

  return (
    <section className="seccion">
      <div className="contenedor admin">
        {sesion ? <PanelAdmin /> : <AccesoAdmin />}
      </div>
    </section>
  );
}
