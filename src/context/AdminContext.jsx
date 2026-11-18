import { createContext, useContext, useMemo, useState } from "react";
import { CODIGO_INVITACION } from "../config";
import { hashClave, nuevaSal } from "../utils/claves";

/* Cuentas de administrador (PROTOTIPO).
   Las cuentas y la sesión se guardan en el navegador. Para una página real, esto se haría
   en un servidor con base de datos; aquí sirve para mostrar cómo funcionaría. */

const CLAVE_ADMINS = "rc-admins";
const CLAVE_SESION = "rc-sesion";

function leerAdmins() {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE_ADMINS));
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function guardarAdmins(lista) {
  try {
    localStorage.setItem(CLAVE_ADMINS, JSON.stringify(lista));
    return true;
  } catch {
    return false;
  }
}

function leerSesion() {
  try {
    const sesion = JSON.parse(sessionStorage.getItem(CLAVE_SESION));
    if (sesion && leerAdmins().some((a) => a.correo === sesion.correo)) {
      return { nombre: String(sesion.nombre), correo: String(sesion.correo) };
    }
  } catch {
    /* sin sesión */
  }
  return null;
}

const Contexto = createContext(null);

export function AdminProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesion);

  const valor = useMemo(() => {
    function abrirSesion(admin) {
      const datos = { nombre: admin.nombre, correo: admin.correo };
      try {
        sessionStorage.setItem(CLAVE_SESION, JSON.stringify(datos));
      } catch {
        /* la sesión dura mientras la página siga abierta */
      }
      setSesion(datos);
    }

    return {
      sesion,

      async registrar({ nombre, correo, clave, codigo }) {
        if (codigo.trim() !== CODIGO_INVITACION) {
          return { ok: false, error: "El código de invitación no es correcto." };
        }
        const mail = correo.trim().toLowerCase();
        const admins = leerAdmins();
        if (admins.some((a) => a.correo === mail)) {
          return { ok: false, error: "Ya existe una cuenta con ese correo." };
        }
        const sal = nuevaSal();
        const nuevo = { nombre: nombre.trim(), correo: mail, sal, hash: await hashClave(sal, clave) };
        if (!guardarAdmins([...admins, nuevo])) {
          return { ok: false, error: "No se pudo guardar la cuenta en este navegador." };
        }
        abrirSesion(nuevo);
        return { ok: true };
      },

      async entrar({ correo, clave }) {
        const mail = correo.trim().toLowerCase();
        const admin = leerAdmins().find((a) => a.correo === mail);
        const hash = admin ? await hashClave(admin.sal, clave) : null;
        if (!admin || hash !== admin.hash) {
          return { ok: false, error: "Correo o contraseña incorrectos." };
        }
        abrirSesion(admin);
        return { ok: true };
      },

      salir() {
        try {
          sessionStorage.removeItem(CLAVE_SESION);
        } catch {
          /* nada que hacer */
        }
        setSesion(null);
      },
    };
  }, [sesion]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAdmin() {
  return useContext(Contexto);
}
