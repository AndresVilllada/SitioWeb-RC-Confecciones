/* Utilidades para guardar contraseñas sin escribirlas en claro.
   Se guarda una "sal" aleatoria y el resultado de mezclarla con la contraseña (hash). */

export function nuevaSal() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/* Respaldo simple para navegadores donde crypto.subtle no existe (páginas http fuera de localhost) */
function cyrb53(texto) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < texto.length; i++) {
    const c = texto.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

export async function hashClave(sal, clave) {
  const texto = sal + ":" + clave;
  if (window.crypto && window.crypto.subtle) {
    const buffer = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
    return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return cyrb53(texto);
}
