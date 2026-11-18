/* Reduce una foto elegida por la persona para que ocupe poco espacio en el navegador.
   Devuelve una promesa con la imagen como texto ("data URL") en JPG de máximo 900 px. */
export function reducirImagen(archivo, maxLado = 900, calidad = 0.82) {
  return new Promise((resolver, rechazar) => {
    if (!archivo.type.startsWith("image/")) {
      rechazar(new Error("no es una imagen"));
      return;
    }
    const lector = new FileReader();
    lector.onerror = () => rechazar(new Error("no se pudo leer"));
    lector.onload = () => {
      const imagen = new Image();
      imagen.onerror = () => rechazar(new Error("no se pudo abrir"));
      imagen.onload = () => {
        const escala = Math.min(1, maxLado / Math.max(imagen.width, imagen.height));
        const lienzo = document.createElement("canvas");
        lienzo.width = Math.round(imagen.width * escala);
        lienzo.height = Math.round(imagen.height * escala);
        const contexto = lienzo.getContext("2d");
        contexto.fillStyle = "#0B0F17";   // fondo para imágenes con transparencia
        contexto.fillRect(0, 0, lienzo.width, lienzo.height);
        contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
        resolver(lienzo.toDataURL("image/jpeg", calidad));
      };
      imagen.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });
}
