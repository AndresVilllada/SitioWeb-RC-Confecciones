import { useState } from "react";
import { useDatos } from "../context/DatosContext";
import { useTituloPagina } from "../hooks/useTituloPagina";
import SelectorFecha from "../components/SelectorFecha";
import { enlaceWhatsApp, mensajeCotizacion } from "../utils/whatsapp";

const MAX_MENSAJE = 500;

/* Fecha de hoy en formato AAAA-MM-DD (el calendario no deja elegir días anteriores) */
function fechaDeHoy() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return hoy.getFullYear() + "-" + mes + "-" + dia;
}

export default function Cotizaciones() {
  useTituloPagina("Cotizaciones");
  const { contacto } = useDatos();

  // Estado: lo que la pantalla necesita recordar
  const [texto, setTexto] = useState("");                  // el mensaje (para el contador)
  const [confirmacion, setConfirmacion] = useState(null);  // { nombre }
  const [fallo, setFallo] = useState(null);                // { texto, enlace }: por qué no se pudo enviar
  const [enviando, setEnviando] = useState(false);         // true mientras se espera al servidor
  const [fecha, setFecha] = useState("");                  // "AAAA-MM-DD" elegida en el calendario

  // Solo llega aquí si todos los campos son válidos (el navegador ya los revisó)
  async function enviar(evento) {
    evento.preventDefault();   // evita que la página se recargue
    if (enviando) return;
    const formulario = evento.currentTarget;
    const datos = Object.fromEntries(new FormData(formulario).entries());
    setConfirmacion(null);
    setFallo(null);
    setEnviando(true);

    // La solicitud se guarda en el servidor, que además la envía por correo a la empresa.
    // Si el servidor no responde, se ofrece el respaldo por WhatsApp (el enlace NO se abre solo).
    const respaldo = enlaceWhatsApp(contacto.whatsapp, mensajeCotizacion(datos, []));
    try {
      const respuesta = await fetch("/api/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: datos.nombre,
          organizacion: datos.organizacion,
          correo: datos.correo,
          telefono: datos.telefono,
          tipoCliente: datos["tipo-cliente"],
          prenda: datos.prenda,
          cantidad: Number(datos.cantidad),
          fecha: datos.fecha || "",
          diseno: datos.diseno,
          mensaje: datos.mensaje,
          acepto: formulario.elements.acepto.checked,
        }),
      });
      let cuerpo = null;
      try { cuerpo = await respuesta.json(); } catch { /* no era JSON: no hay servidor de verdad detrás */ }

      if (respuesta.status === 201 && cuerpo) {
        setConfirmacion({ nombre: String(datos.nombre).split(" ")[0] });
        formulario.reset();
        setTexto("");
        setFecha("");
      } else if (cuerpo?.error && (respuesta.status === 422 || respuesta.status === 429)) {
        // Mensajes del servidor, ya escritos para el usuario (validación o demasiados envíos)
        const detalle = cuerpo.campos ? Object.values(cuerpo.campos).join(" ") : cuerpo.error;
        setFallo({ texto: detalle, enlace: null });
      } else {
        setFallo({ texto: "No pudimos enviar tu solicitud en este momento.", enlace: respaldo });
      }
    } catch {
      setFallo({ texto: "No pudimos enviar tu solicitud: parece que no hay conexión con el servidor.", enlace: respaldo });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="seccion fondo-grafito">
      <div className="contenedor">
        <h1 className="titulo-seccion">Cotizaciones</h1>
        <p className="subtitulo">
          Cuéntanos qué necesitas y te respondemos con una propuesta a la medida de tu proyecto.
        </p>

        <form className="formulario" id="form-cotizacion" onSubmit={enviar}>
          <div className="campo">
            <label htmlFor="nombre" className="requerido">Nombre completo</label>
            <input type="text" id="nombre" name="nombre" placeholder="María Pérez" required minLength={3} maxLength={60} autoComplete="name" />
          </div>

          <div className="campo">
            <label htmlFor="organizacion">Empresa u organización</label>
            <input type="text" id="organizacion" name="organizacion" placeholder="Mi Empresa S.A.S." maxLength={80} autoComplete="organization" />
          </div>

          <div className="campo">
            <label htmlFor="correo" className="requerido">Correo electrónico</label>
            <input type="email" id="correo" name="correo" placeholder="nombre@correo.com" required autoComplete="email" />
          </div>

          <div className="campo">
            <label htmlFor="telefono" className="requerido">Teléfono / WhatsApp</label>
            <input
              type="tel" id="telefono" name="telefono" placeholder="3001234567" required autoComplete="tel"
              pattern="3[0-9]{9}" title="Celular colombiano de 10 dígitos, empezando por 3"
            />
          </div>

          <div className="campo">
            <label htmlFor="tipo-cliente" className="requerido">Tipo de cliente</label>
            <select id="tipo-cliente" name="tipo-cliente" required defaultValue="">
              <option value="" disabled>Selecciona una opción</option>
              <option value="empresa">Empresa</option>
              <option value="club">Club deportivo</option>
              <option value="restaurante">Restaurante</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="campo">
            <label htmlFor="prenda" className="requerido">Tipo de prenda</label>
            <input list="lista-prendas" id="prenda" name="prenda" placeholder="Escribe o elige una" required />
            <datalist id="lista-prendas">
              {["Chaleco", "Chaqueta", "Camiseta deportiva", "Polo", "Buzo"].map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          <div className="campo">
            <label htmlFor="cantidad" className="requerido">Cantidad aproximada</label>
            <input type="number" id="cantidad" name="cantidad" min={1} max={10000} placeholder="50" required />
          </div>

          <div className="campo">
            <label htmlFor="fecha">Fecha en que las necesitas</label>
            <SelectorFecha id="fecha" nombre="fecha" valor={fecha} onCambiar={setFecha} minimo={fechaDeHoy()} />
          </div>

          <fieldset className="campo campo-completo">
            <legend>¿Ya tienes un diseño o logo?</legend>
            <div className="opciones">
              <label htmlFor="diseno-si">
                <input type="radio" id="diseno-si" name="diseno" value="si" /> Sí, ya lo tengo
              </label>
              <label htmlFor="diseno-no">
                <input type="radio" id="diseno-no" name="diseno" value="no" defaultChecked /> No, necesito ayuda
              </label>
            </div>
          </fieldset>

          <div className="campo campo-completo">
            <label htmlFor="mensaje">Cuéntanos más sobre tu proyecto</label>
            <textarea
              id="mensaje" name="mensaje" rows={6} maxLength={MAX_MENSAJE}
              placeholder="Colores, tallas, uso de las prendas, detalles del diseño…"
              value={texto} onChange={(e) => setTexto(e.target.value)}
            ></textarea>
            <p className="ayuda">{texto.length}/{MAX_MENSAJE} caracteres</p>
          </div>

          <div className="campo campo-completo">
            <label htmlFor="acepto" className="casilla">
              <input type="checkbox" id="acepto" name="acepto" required />
              Acepto el tratamiento de mis datos para recibir la cotización.
            </label>
          </div>

          <div className="campo-completo">
            <button type="submit" className="boton boton-solido" disabled={enviando}>
              {enviando ? "Enviando…" : "Enviar solicitud"}
            </button>
            <p className="ayuda-campo">
              Si tienes un logo o referencias, envíalos respondiendo cuando te escribamos: así los recibimos con la mejor calidad.
            </p>
            {confirmacion && (
              <p className="mensaje" role="status">
                ¡Gracias, {confirmacion.nombre}! Recibimos tu solicitud y te responderemos con la cotización
                al correo o teléfono que nos dejaste.
              </p>
            )}
            {fallo && (
              <p className="mensaje error" role="alert">
                {fallo.texto}{" "}
                {fallo.enlace && (
                  <>
                    Puedes enviarla por WhatsApp:{" "}
                    <a href={fallo.enlace} target="_blank" rel="noopener noreferrer">abrir WhatsApp con tu solicitud</a>.
                  </>
                )}
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
