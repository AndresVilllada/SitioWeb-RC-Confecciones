import { useState } from "react";
import EditorFotos from "./EditorFotos";

/* Editor genérico para una lista (productos o servicios del catálogo).
   Se trabaja sobre un "borrador": nada cambia en la página hasta que se pulsa "Guardar cambios". */
export default function EditorLista({ titulo, items, campos, nombreDe, crearNuevo, etiquetaNuevo, onGuardar }) {
  const [borrador, setBorrador] = useState(items);
  const [aviso, setAviso] = useState(null);   // { texto, error } o null

  function cambiar(indice, cambios) {
    setBorrador((lista) => lista.map((it, i) => (i === indice ? { ...it, ...cambios } : it)));
    setAviso(null);
  }

  function eliminar(indice) {
    const nombre = nombreDe(borrador[indice]) || "este elemento";
    if (!window.confirm("¿Eliminar «" + nombre + "»? Se borra al guardar los cambios.")) return;
    setBorrador((lista) => lista.filter((_, i) => i !== indice));
    setAviso(null);
  }

  function mover(indice, delta) {
    const destino = indice + delta;
    if (destino < 0 || destino >= borrador.length) return;
    setBorrador((lista) => {
      const copia = [...lista];
      [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
      return copia;
    });
    setAviso(null);
  }

  function agregar() {
    setBorrador((lista) => [...lista, crearNuevo()]);
    setAviso(null);
  }

  function guardar(evento) {
    evento.preventDefault();
    const guardados = onGuardar(borrador);   // devuelve la lista ya limpia, o null si no hubo espacio
    if (guardados) {
      setBorrador(guardados);
      setAviso({ texto: "Cambios guardados. Ya se ven en la página." });
    } else {
      setAviso({
        texto: "No se pudo guardar: el navegador no tiene más espacio. Prueba con menos fotos.",
        error: true,
      });
    }
  }

  function descartar() {
    setBorrador(items);
    setAviso(null);
  }

  return (
    <form className="editor" onSubmit={guardar}>
      <h2 className="editor-titulo">{titulo}</h2>

      {borrador.length === 0 && <p className="ayuda-campo">No hay elementos. Usa «{etiquetaNuevo}».</p>}

      {borrador.map((item, i) => (
        <fieldset key={item.id} className="admin-item">
          <legend className="admin-item-nombre">{nombreDe(item) || "Elemento nuevo"}</legend>

          <div className="formulario admin-campos">
            {campos.map((c) => {
              const id = item.id + "-" + c.clave;
              return (
                <div key={c.clave} className={"campo" + (c.ancho ? " campo-completo" : "")}>
                  <label htmlFor={id} className={c.requerido ? "requerido" : undefined}>{c.etiqueta}</label>
                  {c.tipo === "area" ? (
                    <textarea
                      id={id} rows={3} maxLength={c.max} value={item[c.clave]}
                      onChange={(e) => cambiar(i, { [c.clave]: e.target.value })}
                    ></textarea>
                  ) : c.tipo === "precio" ? (
                    <input
                      type="number" id={id} min={0} step={1} placeholder="Ej. 45000"
                      value={item[c.clave] ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        cambiar(i, { [c.clave]: v === "" ? null : Math.max(0, Math.round(Number(v))) });
                      }}
                    />
                  ) : (
                    <input
                      type="text" id={id} required={c.requerido} maxLength={c.max} value={item[c.clave]}
                      onChange={(e) => cambiar(i, { [c.clave]: e.target.value })}
                    />
                  )}
                  {c.ayuda && <p className="ayuda-campo">{c.ayuda}</p>}
                </div>
              );
            })}
          </div>

          <EditorFotos
            idBase={item.id}
            fotos={item.fotos}
            onCambiar={(fotos) => cambiar(i, { fotos })}
          />

          <div className="admin-item-acciones">
            <button type="button" className="boton-mini" onClick={() => mover(i, -1)} disabled={i === 0}>Subir ↑</button>
            <button type="button" className="boton-mini" onClick={() => mover(i, 1)} disabled={i === borrador.length - 1}>Bajar ↓</button>
            <button type="button" className="boton-mini boton-peligro" onClick={() => eliminar(i)}>Eliminar</button>
          </div>
        </fieldset>
      ))}

      <div className="barra-acciones">
        <button type="button" className="boton" onClick={agregar}>{etiquetaNuevo}</button>
        <button type="submit" className="boton boton-solido">Guardar cambios</button>
        <button type="button" className="boton" onClick={descartar}>Descartar cambios</button>
      </div>

      {aviso && <p className={"mensaje" + (aviso.error ? " error" : "")} role="status">{aviso.texto}</p>}
    </form>
  );
}
