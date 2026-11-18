import { useEffect, useRef, useState } from "react";

/* Calendario desplegable para elegir una fecha (sin librerías).
   - El valor se guarda como texto "AAAA-MM-DD" en un campo oculto con el nombre indicado,
     así el formulario lo lee igual que si fuera un <input type="date">.
   - No deja elegir días anteriores a "minimo".
   - Teclado: flechas para moverse por los días, Re Pág / Av Pág para cambiar de mes,
     Enter para elegir y Esc para cerrar. */

const NOMBRES_DIAS = ["L", "M", "X", "J", "V", "S", "D"];   // la semana empieza el lunes
const formatoMes = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" });
const formatoLargo = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const conMayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const aTexto = (f) => f.getFullYear() + "-" + String(f.getMonth() + 1).padStart(2, "0") + "-" + String(f.getDate()).padStart(2, "0");
const deTexto = (t) => {
  const [a, m, d] = String(t || "").split("-").map(Number);
  return a && m && d ? new Date(a, m - 1, d) : null;
};
const mismoDia = (a, b) => a && b && aTexto(a) === aTexto(b);
const sumarDias = (f, n) => new Date(f.getFullYear(), f.getMonth(), f.getDate() + n);
const sumarMeses = (f, n) => {
  const destino = new Date(f.getFullYear(), f.getMonth() + n, 1);
  const ultimo = new Date(destino.getFullYear(), destino.getMonth() + 1, 0).getDate();
  return new Date(destino.getFullYear(), destino.getMonth(), Math.min(f.getDate(), ultimo));
};

export function fechaLarga(texto) {
  const f = deTexto(texto);
  return f ? conMayuscula(formatoLargo.format(f)) : "";
}

export default function SelectorFecha({ id, nombre, valor, onCambiar, minimo }) {
  const fechaMinima = deTexto(minimo);
  const elegida = deTexto(valor);
  const [abierto, setAbierto] = useState(false);
  const [enfocada, setEnfocada] = useState(() => elegida || fechaMinima || new Date());
  const caja = useRef(null);
  const boton = useRef(null);
  const calendario = useRef(null);
  const moverFoco = useRef(false);   // solo se mueve el foco al abrir o al navegar con el teclado

  const anterior = (f) => fechaMinima && aTexto(f) < aTexto(fechaMinima);

  function abrir() {
    moverFoco.current = true;
    setEnfocada(elegida || fechaMinima || new Date());
    setAbierto(true);
  }

  function cerrar(devolverFoco) {
    setAbierto(false);
    if (devolverFoco) boton.current?.focus({ preventScroll: true });
  }

  function elegir(f) {
    if (anterior(f)) return;
    onCambiar(aTexto(f));
    cerrar(true);
  }

  // Al abrir o moverse con el teclado, el foco va al día marcado
  useEffect(() => {
    if (!abierto || !moverFoco.current) return;
    moverFoco.current = false;
    calendario.current?.querySelector('[data-enfocada="si"]')?.focus({ preventScroll: true });
  }, [abierto, enfocada]);

  // Un clic fuera del calendario lo cierra
  useEffect(() => {
    if (!abierto) return;
    const alClic = (e) => { if (!caja.current?.contains(e.target)) setAbierto(false); };
    document.addEventListener("mousedown", alClic);
    document.addEventListener("touchstart", alClic, { passive: true });
    return () => {
      document.removeEventListener("mousedown", alClic);
      document.removeEventListener("touchstart", alClic);
    };
  }, [abierto]);

  function teclaEnDia(e) {
    const movimientos = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let nueva = null;
    if (e.key in movimientos) nueva = sumarDias(enfocada, movimientos[e.key]);
    else if (e.key === "PageUp") nueva = sumarMeses(enfocada, -1);
    else if (e.key === "PageDown") nueva = sumarMeses(enfocada, 1);
    else if (e.key === "Home") nueva = sumarDias(enfocada, -((enfocada.getDay() + 6) % 7));
    else if (e.key === "End") nueva = sumarDias(enfocada, 6 - ((enfocada.getDay() + 6) % 7));
    if (!nueva) return;
    e.preventDefault();
    if (anterior(nueva)) nueva = fechaMinima;
    moverFoco.current = true;
    setEnfocada(nueva);
  }

  function teclaEnCalendario(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      cerrar(true);
    }
  }

  // Si el foco sale del calendario (por ejemplo con Tab), se cierra
  function alPerderFoco(e) {
    if (abierto && e.relatedTarget && !caja.current?.contains(e.relatedTarget)) setAbierto(false);
  }

  // Días que se muestran: semanas completas (de lunes a domingo) que cubren el mes
  const primeroMes = new Date(enfocada.getFullYear(), enfocada.getMonth(), 1);
  const inicio = sumarDias(primeroMes, -((primeroMes.getDay() + 6) % 7));
  const ultimoMes = new Date(enfocada.getFullYear(), enfocada.getMonth() + 1, 0);
  const semanas = Math.ceil((((primeroMes.getDay() + 6) % 7) + ultimoMes.getDate()) / 7);
  const dias = Array.from({ length: semanas * 7 }, (_, i) => sumarDias(inicio, i));
  const hoy = new Date();
  const sinMesAnterior = fechaMinima && primeroMes <= fechaMinima;
  const tituloMes = conMayuscula(formatoMes.format(primeroMes));

  return (
    <div className="selector-fecha" ref={caja} onBlur={alPerderFoco}>
      <button
        type="button" id={id} ref={boton}
        className={"fecha-boton" + (valor ? " con-valor" : "")}
        onClick={() => (abierto ? cerrar(false) : abrir())}
        aria-haspopup="dialog" aria-expanded={abierto}
      >
        <span>{valor ? fechaLarga(valor) : "Elige una fecha"}</span>
        <svg className="fecha-icono" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
      </button>
      <input type="hidden" name={nombre} value={valor} />

      {abierto && (
        <div className="calendario" role="dialog" aria-label="Elegir fecha" ref={calendario} onKeyDown={teclaEnCalendario}>
          <div className="calendario-cabecera">
            <button type="button" className="calendario-mes-boton" onClick={() => { const f = sumarMeses(enfocada, -1); setEnfocada(anterior(f) ? fechaMinima : f); }}
              disabled={sinMesAnterior} aria-label="Mes anterior">‹</button>
            <p className="calendario-titulo" aria-live="polite">{tituloMes}</p>
            <button type="button" className="calendario-mes-boton" onClick={() => setEnfocada(sumarMeses(enfocada, 1))} aria-label="Mes siguiente">›</button>
          </div>

          <div className="calendario-rejilla" role="grid" aria-label={tituloMes}>
            {NOMBRES_DIAS.map((d, i) => (
              <span key={"n" + i} className="calendario-nombre-dia" aria-hidden="true">{d}</span>
            ))}
            {dias.map((f) => {
              const fuera = f.getMonth() !== primeroMes.getMonth();
              const bloqueado = anterior(f);
              const esEnfocada = mismoDia(f, enfocada);
              const clases = ["calendario-dia"];
              if (fuera) clases.push("fuera-de-mes");
              if (mismoDia(f, hoy)) clases.push("hoy");
              if (mismoDia(f, elegida)) clases.push("elegido");
              return (
                <button
                  key={aTexto(f)} type="button" className={clases.join(" ")}
                  disabled={bloqueado}
                  tabIndex={esEnfocada ? 0 : -1}
                  data-enfocada={esEnfocada ? "si" : undefined}
                  data-fecha={aTexto(f)}
                  aria-label={fechaLarga(aTexto(f)) + (mismoDia(f, hoy) ? " (hoy)" : "")}
                  aria-pressed={mismoDia(f, elegida)}
                  onClick={() => elegir(f)}
                  onKeyDown={teclaEnDia}
                >
                  {f.getDate()}
                </button>
              );
            })}
          </div>

          <div className="calendario-pie">
            <button type="button" className="calendario-enlace" onClick={() => elegir(fechaMinima && anterior(hoy) ? fechaMinima : hoy)}>Hoy</button>
            {valor && (
              <button type="button" className="calendario-enlace" onClick={() => { onCambiar(""); cerrar(true); }}>Borrar fecha</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
