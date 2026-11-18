import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

/* Versión "para presentar sin servidor".
   Genera la carpeta dist-demo/ con UN solo index.html (el JavaScript y el CSS van adentro)
   y la carpeta imagenes/. Se abre con doble clic: no necesita Node, servidor ni puertos.
   Se crea con:  npm run build:demo */
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: "./",
  build: { outDir: "dist-demo", emptyOutDir: true },
});
