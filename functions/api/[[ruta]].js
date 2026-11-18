// Punto de entrada de Cloudflare Pages Functions: toda petición a /api/... llega aquí.
// La lógica está en /servidor (fuera de /functions para que Cloudflare no la tome como rutas sueltas).
import { manejar } from "../../servidor/enrutador.js";

export const onRequest = (contexto) => manejar(contexto);
