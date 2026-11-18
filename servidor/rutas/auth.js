// Cuenta del administrador: registro (con código de invitación), inicio y cierre de sesión.
import { ErrorHttp, json, leerJson } from "../util.js";
import { cifrarClave, cookieBorrada, iguales, iteracionesConfiguradas, verificarClave } from "../seguridad.js";
import { adminActual, cerrarSesion, contarIntentos, crearSesion, limpiarIntentos, registrarIntento } from "../sesion.js";
import { validarLogin, validarRegistro } from "../validar.js";

const QUINCE_MIN = 900;
const MAX_FALLOS_CORREO = 5;
const MAX_FALLOS_IP = 20;
const MAX_REGISTRO_IP = 5;

export const rutasAuth = [
  // ¿Hay sesión iniciada? Responde 200 siempre (admin: null si no la hay), para no llenar la consola de errores 401.
  {
    metodo: "GET", patron: "/auth/yo",
    async fn({ request, env }) {
      const admin = await adminActual(request, env);
      return json({ admin: admin ? { nombre: admin.nombre, correo: admin.correo } : null });
    },
  },

  {
    metodo: "POST", patron: "/auth/registro",
    async fn({ request, env, ip, https }) {
      const d = validarRegistro(await leerJson(request));
      if (!env.CODIGO_INVITACION) throw new ErrorHttp(503, "El registro de administradores no está configurado en el servidor.");
      if ((await contarIntentos(env, "registro-ip", ip, QUINCE_MIN)) >= MAX_REGISTRO_IP) {
        throw new ErrorHttp(429, "Demasiados intentos. Espera unos minutos.");
      }
      if (!iguales(d.codigo, env.CODIGO_INVITACION)) {
        await registrarIntento(env, "registro-ip", ip);
        throw new ErrorHttp(403, "El código de invitación no es correcto.");
      }
      const clave = await cifrarClave(d.clave, iteracionesConfiguradas(env));
      let fila;
      try {
        fila = await env.DB.prepare("INSERT INTO administradores (nombre, correo, clave) VALUES (?1, ?2, ?3) RETURNING id")
          .bind(d.nombre, d.correo, clave).first();
      } catch (e) {
        if (String(e?.message || e).includes("UNIQUE")) throw new ErrorHttp(409, "Ya existe una cuenta con ese correo.");
        throw e;
      }
      const cookie = await crearSesion(env, fila.id, https);
      return json({ admin: { nombre: d.nombre, correo: d.correo } }, 201, { "Set-Cookie": cookie });
    },
  },

  {
    metodo: "POST", patron: "/auth/login",
    async fn({ request, env, ip, https }) {
      const d = validarLogin(await leerJson(request));
      const [porCorreo, porIp] = await Promise.all([
        contarIntentos(env, "login-correo", d.correo, QUINCE_MIN),
        contarIntentos(env, "login-ip", ip, QUINCE_MIN),
      ]);
      if (porCorreo >= MAX_FALLOS_CORREO || porIp >= MAX_FALLOS_IP) {
        throw new ErrorHttp(429, "Demasiados intentos fallidos. Espera 15 minutos e intenta de nuevo.");
      }
      const admin = await env.DB.prepare("SELECT id, nombre, correo, clave FROM administradores WHERE correo = ?1").bind(d.correo).first();
      // Si el correo no existe se calcula igual un cifrado de relleno: así no se nota por el tiempo de respuesta
      const relleno = `pbkdf2-sha256$${iteracionesConfiguradas(env)}$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=`;
      const correcta = await verificarClave(d.clave, admin ? admin.clave : relleno);
      if (!admin || !correcta) {
        await Promise.all([registrarIntento(env, "login-correo", d.correo), registrarIntento(env, "login-ip", ip)]);
        throw new ErrorHttp(401, "Correo o contraseña incorrectos.");   // mismo mensaje en ambos casos, a propósito
      }
      await limpiarIntentos(env, "login-correo", d.correo);
      const cookie = await crearSesion(env, admin.id, https);
      return json({ admin: { nombre: admin.nombre, correo: admin.correo } }, 200, { "Set-Cookie": cookie });
    },
  },

  {
    metodo: "POST", patron: "/auth/logout",
    async fn({ request, env, https }) {
      await cerrarSesion(request, env);
      return json({ ok: true }, 200, { "Set-Cookie": cookieBorrada(https) });
    },
  },
];
