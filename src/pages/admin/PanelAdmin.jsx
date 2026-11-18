import { useState } from "react";
import { useAdmin } from "../../context/AdminContext";
import { useDatos } from "../../context/DatosContext";
import EditorLista from "./EditorLista";
import EditorGaleria from "./EditorGaleria";
import EditorContacto from "./EditorContacto";
import CopiaSeguridad from "./CopiaSeguridad";

const PESTANAS = [
  { id: "productos", texto: "Productos" },
  { id: "catalogo", texto: "Catálogo" },
  { id: "galeria", texto: "Galería" },
  { id: "contacto", texto: "Contacto" },
  { id: "copia", texto: "Copia de seguridad" },
];

/* Campos que se editan de cada producto y de cada servicio del catálogo */
const CAMPOS_PRODUCTO = [
  { clave: "nombre", etiqueta: "Nombre", requerido: true, max: 80 },
  { clave: "precio", etiqueta: "Precio (COP)", tipo: "precio", ayuda: "Déjalo vacío para mostrar «Precio por definir»." },
  { clave: "descripcion", etiqueta: "Descripción", tipo: "area", max: 300, ancho: true },
];

const CAMPOS_SERVICIO = [
  { clave: "titulo", etiqueta: "Título", requerido: true, max: 80, ancho: true },
  { clave: "texto", etiqueta: "Descripción", tipo: "area", max: 400, ancho: true },
];

export default function PanelAdmin() {
  const { sesion, salir } = useAdmin();
  const datos = useDatos();
  const [pestana, setPestana] = useState("productos");

  return (
    <>
      <h1 className="titulo-seccion">Panel de administración</h1>
      <div className="panel-saludo">
        <p>Hola, <strong>{sesion.nombre}</strong>. Los cambios que guardes se ven de inmediato en la página.</p>
        <button type="button" className="boton" onClick={salir}>Cerrar sesión</button>
      </div>

      <div className="pestanas" role="tablist" aria-label="Secciones del panel">
        {PESTANAS.map((p) => (
          <button
            key={p.id} type="button" role="tab" className="pestana"
            aria-selected={pestana === p.id} onClick={() => setPestana(p.id)}
          >
            {p.texto}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {pestana === "productos" && (
          <EditorLista
            titulo="Productos de la tienda"
            items={datos.productos}
            campos={CAMPOS_PRODUCTO}
            nombreDe={(p) => p.nombre}
            crearNuevo={() => ({ id: "producto-" + Date.now(), nombre: "", descripcion: "", precio: null, fotos: [] })}
            etiquetaNuevo="Añadir producto"
            onGuardar={datos.guardarProductos}
          />
        )}

        {pestana === "catalogo" && (
          <EditorLista
            titulo="Servicios del catálogo"
            items={datos.servicios}
            campos={CAMPOS_SERVICIO}
            nombreDe={(s) => s.titulo}
            crearNuevo={() => ({ id: "servicio-" + Date.now(), titulo: "", texto: "", fotos: [] })}
            etiquetaNuevo="Añadir servicio"
            onGuardar={datos.guardarServicios}
          />
        )}

        {pestana === "galeria" && <EditorGaleria />}
        {pestana === "contacto" && <EditorContacto />}
        {pestana === "copia" && <CopiaSeguridad />}
      </div>
    </>
  );
}
