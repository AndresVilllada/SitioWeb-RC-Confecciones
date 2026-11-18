import { useState } from "react";
import { useAdmin } from "../../context/AdminContext";

export default function AccesoAdmin() {
  const { entrar, registrar } = useAdmin();
  const [modo, setModo] = useState("entrar");   // "entrar" o "registro"
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  function cambiarModo(nuevo) {
    setModo(nuevo);
    setError("");
  }

  async function enviar(evento) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const datos = Object.fromEntries(new FormData(formulario).entries());
    setError("");

    if (modo === "registro" && datos.clave !== datos.repetir) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setOcupado(true);
    const resultado = modo === "registro" ? await registrar(datos) : await entrar(datos);
    setOcupado(false);
    if (!resultado.ok) setError(resultado.error);
    // Si salió bien, el contexto abre la sesión y la página muestra el panel
  }

  return (
    <>
      <h1 className="titulo-seccion">Administración</h1>
      <p className="subtitulo">
        Acceso para las personas que administran el sitio y pueden modificar productos, catálogo, fotos y contacto.
      </p>

      <div className="pestanas acceso-pestanas" role="tablist" aria-label="Acceso">
        <button type="button" role="tab" className="pestana" aria-selected={modo === "entrar"} onClick={() => cambiarModo("entrar")}>
          Iniciar sesión
        </button>
        <button type="button" role="tab" className="pestana" aria-selected={modo === "registro"} onClick={() => cambiarModo("registro")}>
          Crear cuenta
        </button>
      </div>

      <form className="formulario acceso" onSubmit={enviar} key={modo}>
        {modo === "registro" && (
          <div className="campo">
            <label htmlFor="acc-nombre" className="requerido">Nombre</label>
            <input type="text" id="acc-nombre" name="nombre" required minLength={3} maxLength={60} autoComplete="name" />
          </div>
        )}

        <div className="campo">
          <label htmlFor="acc-correo" className="requerido">Correo electrónico</label>
          <input type="email" id="acc-correo" name="correo" required autoComplete="email" />
        </div>

        <div className="campo">
          <label htmlFor="acc-clave" className="requerido">Contraseña</label>
          <input
            type="password" id="acc-clave" name="clave" required minLength={modo === "registro" ? 8 : undefined}
            autoComplete={modo === "registro" ? "new-password" : "current-password"}
          />
          {modo === "registro" && <p className="ayuda-campo">Mínimo 8 caracteres.</p>}
        </div>

        {modo === "registro" && (
          <>
            <div className="campo">
              <label htmlFor="acc-repetir" className="requerido">Repite la contraseña</label>
              <input type="password" id="acc-repetir" name="repetir" required minLength={8} autoComplete="new-password" />
            </div>
            <div className="campo">
              <label htmlFor="acc-codigo" className="requerido">Código de invitación</label>
              <input type="text" id="acc-codigo" name="codigo" required autoComplete="off" />
              <p className="ayuda-campo">Lo entrega la empresa a quien va a administrar la página.</p>
            </div>
          </>
        )}

        {error && <p className="mensaje error" role="alert">{error}</p>}

        <button type="submit" className="boton boton-solido" disabled={ocupado}>
          {ocupado ? "Un momento…" : modo === "registro" ? "Crear cuenta" : "Entrar"}
        </button>
      </form>

      <p className="aviso-prototipo">
        <strong>Prototipo:</strong> las cuentas y los cambios se guardan solo en este navegador. Para que todos los
        visitantes vean los cambios hace falta un servidor con base de datos (siguiente etapa del proyecto).
      </p>
    </>
  );
}
