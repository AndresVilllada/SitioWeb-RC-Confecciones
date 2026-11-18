import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { PRODUCTOS_INICIALES } from "../data/productos";
import { SERVICIOS_INICIALES } from "../data/servicios";
import { CONTACTO_INICIAL } from "../data/contacto";

/* Aquí viven los datos que se pueden editar desde el panel de administración:
   productos, servicios del catálogo, galería de fotos y datos de contacto.
   Se guardan en el navegador (localStorage). Si no hay nada guardado, se usan los datos iniciales. */

const CLAVE = "rc-datos";
export const MAX_FOTOS = 8;
export const MAX_FOTOS_GALERIA = 12;

const INICIALES = {
  productos: PRODUCTOS_INICIALES,
  servicios: SERVICIOS_INICIALES,
  galeria: [],
  contacto: CONTACTO_INICIAL,
};

/* ---------- Limpieza de datos (por si el archivo importado o lo guardado viene dañado) ---------- */
const texto = (valor, max) => (typeof valor === "string" ? valor.slice(0, max) : "");

function fotosValidas(valor, max) {
  return Array.isArray(valor)
    ? valor.filter((f) => typeof f === "string" && f.length > 0).slice(0, max)
    : [];
}

function idsUnicos(lista) {
  const vistos = new Set();
  return lista.map((item) => {
    let id = item.id;
    let n = 2;
    while (vistos.has(id)) {
      id = item.id + "-" + n;
      n++;
    }
    vistos.add(id);
    return { ...item, id };
  });
}

function normalizarProducto(p, i) {
  if (!p || typeof p !== "object") return null;
  const nombre = texto(p.nombre, 80).trim();
  if (!nombre) return null;
  return {
    id: texto(p.id, 60) || "producto-" + i,
    nombre,
    descripcion: texto(p.descripcion, 300),
    precio: Number.isFinite(p.precio) && p.precio >= 0 ? Math.round(p.precio) : null,
    fotos: fotosValidas(p.fotos, MAX_FOTOS),
  };
}

function normalizarServicio(s, i) {
  if (!s || typeof s !== "object") return null;
  const titulo = texto(s.titulo, 80).trim();
  if (!titulo) return null;
  return {
    id: texto(s.id, 60) || "servicio-" + i,
    titulo,
    texto: texto(s.texto, 400),
    fotos: fotosValidas(s.fotos, MAX_FOTOS),
  };
}

function normalizarContacto(c) {
  const base = { ...CONTACTO_INICIAL, ...(c && typeof c === "object" ? c : {}) };
  return {
    whatsapp: texto(base.whatsapp, 20).replace(/\D/g, ""),
    instagram: texto(base.instagram, 40).replace(/^@/, "").replace(/[^\w.]/g, ""),
    correo: texto(base.correo, 80).trim(),
    ubicacion: texto(base.ubicacion, 120).trim(),
  };
}

export function normalizar(datos) {
  const d = datos && typeof datos === "object" ? datos : {};
  return {
    productos: Array.isArray(d.productos)
      ? idsUnicos(d.productos.map(normalizarProducto).filter(Boolean))
      : INICIALES.productos,
    servicios: Array.isArray(d.servicios)
      ? idsUnicos(d.servicios.map(normalizarServicio).filter(Boolean))
      : INICIALES.servicios,
    galeria: Array.isArray(d.galeria) ? fotosValidas(d.galeria, MAX_FOTOS_GALERIA) : INICIALES.galeria,
    contacto: normalizarContacto(d.contacto),
  };
}

function leer() {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado) return normalizar(JSON.parse(guardado));
  } catch {
    /* sin acceso al almacenamiento: se usan los datos iniciales */
  }
  return normalizar(INICIALES);
}

/* ---------- Contexto ---------- */
const Contexto = createContext(null);

export function DatosProvider({ children }) {
  const [datos, setDatos] = useState(leer);

  // Guarda en el navegador y actualiza la pantalla. Devuelve false si no hay espacio.
  const aplicar = useCallback((nuevos) => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(nuevos));
    } catch {
      return false;
    }
    setDatos(nuevos);
    return true;
  }, []);

  const valor = useMemo(() => {
    // Cada "guardar..." devuelve los datos ya limpios, o null si no se pudo guardar
    const guardarParte = (clave) => (nuevo) => {
      const todo = normalizar({ ...datos, [clave]: nuevo });
      return aplicar(todo) ? todo[clave] : null;
    };

    return {
      ...datos,
      guardarProductos: guardarParte("productos"),
      guardarServicios: guardarParte("servicios"),
      guardarGaleria: guardarParte("galeria"),
      guardarContacto: guardarParte("contacto"),

      exportar: () => JSON.stringify({ version: 1, ...datos }, null, 2),

      importar: (textoJson) => {
        try {
          const crudo = JSON.parse(textoJson);
          if (!crudo || typeof crudo !== "object" || Array.isArray(crudo)) {
            return { ok: false, error: "El archivo no tiene el formato esperado." };
          }
          if (!aplicar(normalizar(crudo))) {
            return { ok: false, error: "No hay espacio suficiente en este navegador para esa copia." };
          }
          return { ok: true };
        } catch {
          return { ok: false, error: "El archivo no es una copia de seguridad válida." };
        }
      },

      restaurar: () => {
        try {
          localStorage.removeItem(CLAVE);
        } catch {
          /* nada que hacer */
        }
        setDatos(normalizar(INICIALES));
      },
    };
  }, [datos, aplicar]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useDatos() {
  return useContext(Contexto);
}
