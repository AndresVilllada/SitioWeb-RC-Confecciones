import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" hace que la carpeta dist funcione en cualquier hosting o subcarpeta
export default defineConfig({
  plugins: [react()],
  base: "./",
  // Con "npm run dev" (página) y "npm run api:dev" (servidor) corriendo a la vez, las llamadas a /api
  // que hace la página se reenvían al servidor local.
  // (El servidor rechaza peticiones cuyo origen no sea el suyo, como defensa contra otros sitios: en desarrollo
  // el navegador está en el puerto 5173 y el servidor en el 8788, así que el proxy ajusta el origen.)
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8788",
        changeOrigin: true,   // el Host también pasa a ser el del servidor
        configure: (proxy) => proxy.on("proxyReq", (req) => { if (req.getHeader("origin")) req.setHeader("origin", "http://localhost:8788"); }),
      },
    },
  },
});
