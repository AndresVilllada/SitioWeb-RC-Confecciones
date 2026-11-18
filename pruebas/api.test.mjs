// Pruebas automáticas de la API. Con el servidor corriendo (npm run api:dev) ejecuta:
//     npm run api:probar
// Usan una IP inventada distinta en cada prueba para que los límites de intentos no se mezclen,
// y al final dejan los datos como estaban.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";

const BASE = process.env.API || "http://localhost:8788";
const CODIGO = process.env.CODIGO_INVITACION || "RC-ADMIN-2026";
const EJECUCION = Date.now().toString(36);
let contadorIp = 0;
const ipNueva = () => `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${++contadorIp % 250}`;

/** Cliente con "cookie jar": recuerda la cookie de sesión como lo hace el navegador. */
function cliente(ip = ipNueva()) {
  let cookie = "";
  async function llamar(metodo, ruta, cuerpo, extra = {}) {
    const cab = { "CF-Connecting-IP": ip, ...extra };
    // Como hará el panel: al guardar el contenido manda la versión que leyó. Las pruebas la piden sola,
    // salvo que la prueba pase su propio "If-Match" (o null para no mandar ninguno).
    if (metodo === "PUT" && ruta === "/api/admin/datos" && !("If-Match" in cab)) {
      cab["If-Match"] = (await fetch(BASE + "/api/datos")).headers.get("ETag");
    }
    if (cab["If-Match"] === null) delete cab["If-Match"];
    let body;
    if (cuerpo !== undefined) {
      cab["Content-Type"] = cab["Content-Type"] ?? "application/json";
      body = typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo);
    }
    if (cookie) cab.Cookie = cookie;
    const r = await fetch(BASE + ruta, { method: metodo, headers: cab, body });
    const sc = r.headers.get("set-cookie");
    if (sc) cookie = sc.split(";")[0].endsWith("=") ? "" : sc.split(";")[0];
    const texto = await r.text();
    let datos = null;
    try { datos = JSON.parse(texto); } catch { /* respuesta que no es JSON (p. ej. una imagen) */ }
    return { estado: r.status, datos, cabeceras: r.headers, texto };
  }
  return {
    ip,
    get: (ruta, extra) => llamar("GET", ruta, undefined, extra),
    post: (ruta, cuerpo, extra) => llamar("POST", ruta, cuerpo ?? {}, extra),
    put: (ruta, cuerpo, extra) => llamar("PUT", ruta, cuerpo, extra),
    patch: (ruta, cuerpo, extra) => llamar("PATCH", ruta, cuerpo, extra),
    delete: (ruta) => llamar("DELETE", ruta),
    tieneCookie: () => cookie !== "",
    fijarCookie: (c) => { cookie = c; },
    verCookie: () => cookie,
  };
}

const PNG_1X1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const JPG_REAL = "data:image/jpeg;base64," + readFileSync(new URL("../public/imagenes/empresarial/logochaqueta.jpeg", import.meta.url)).toString("base64");
const hoy = () => new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);
const futuro = (dias) => new Date(Date.now() - 5 * 3600e3 + dias * 86400e3).toISOString().slice(0, 10);

const cotizacionValida = (extra = {}) => ({
  nombre: "María Pérez", organizacion: "Mi Empresa S.A.S.", correo: "Maria@Correo.com", telefono: "3001234567",
  tipoCliente: "empresa", prenda: "Uniforme corporativo", cantidad: 50, fecha: futuro(30), diseno: "no", mensaje: "Colores azul y blanco", acepto: true, ...extra,
});

let admin; // cliente con sesión de administrador
let original; // contenido de partida, para dejarlo igual al terminar

before(async () => {
  const salud = await cliente().get("/api/salud");
  assert.equal(salud.estado, 200, "¿Está corriendo el servidor? (npm run api:dev)");
  admin = cliente();
  const r = await admin.post("/api/auth/registro", { nombre: "Admin Prueba", correo: `admin.${EJECUCION}@rc.co`, clave: "clave-segura-123", codigo: CODIGO });
  assert.equal(r.estado, 201, "no se pudo crear el administrador de prueba: " + r.texto);
  original = (await cliente().get("/api/datos")).datos;
});

after(async () => {
  // deja el contenido como estaba antes de las pruebas
  if (admin && original) await admin.put("/api/admin/datos", original);
});

// ======================================================================
describe("Públicas: datos, rutas y errores generales", () => {
  test("GET /api/datos devuelve productos, servicios, galería y contacto con la forma que usa la página", async () => {
    const r = await cliente().get("/api/datos");
    assert.equal(r.estado, 200);
    assert.ok(Array.isArray(r.datos.productos) && Array.isArray(r.datos.servicios) && Array.isArray(r.datos.galeria));
    assert.deepEqual(Object.keys(r.datos.contacto).sort(), ["correo", "instagram", "ubicacion", "whatsapp"]);
    const p = r.datos.productos[0];
    assert.deepEqual(Object.keys(p).sort(), ["descripcion", "fotos", "id", "nombre", "precio"]);
    assert.ok(Array.isArray(p.fotos));
    assert.deepEqual(Object.keys(r.datos.servicios[0]).sort(), ["fotos", "id", "texto", "titulo"]);
  });

  test("las respuestas JSON no se guardan en caché y traen cabeceras de seguridad", async () => {
    const r = await cliente().get("/api/datos");
    assert.equal(r.cabeceras.get("cache-control"), "no-store");
    assert.equal(r.cabeceras.get("x-content-type-options"), "nosniff");
    assert.match(r.cabeceras.get("content-type"), /application\/json/);
  });

  test("ruta inexistente -> 404 en JSON", async () => {
    const r = await cliente().get("/api/no-existe");
    assert.equal(r.estado, 404);
    assert.ok(r.datos.error);
  });

  test("método equivocado -> 405 con la cabecera Allow", async () => {
    const r = await cliente().delete("/api/datos");
    assert.equal(r.estado, 405);
    assert.equal(r.cabeceras.get("allow"), "GET");
  });

  test("foto con id inválido o inexistente -> 404", async () => {
    const c = cliente();
    assert.equal((await c.get("/api/fotos/xyz")).estado, 404);
    assert.equal((await c.get("/api/fotos/" + "a".repeat(32))).estado, 404);
    assert.equal((await c.get("/api/fotos/..%2F..%2Fetc")).estado, 404);
  });
});

// ======================================================================
describe("Cotizaciones", () => {
  test("una cotización válida se guarda (201 con id)", async () => {
    const r = await cliente().post("/api/cotizaciones", cotizacionValida());
    assert.equal(r.estado, 201, r.texto);
    assert.ok(Number.isInteger(r.datos.id));
  });

  test("lo opcional puede ir vacío (organización, fecha, mensaje, diseño)", async () => {
    const r = await cliente().post("/api/cotizaciones", cotizacionValida({ organizacion: "", fecha: "", mensaje: "", diseno: undefined }));
    assert.equal(r.estado, 201, r.texto);
  });

  const invalidas = [
    ["sin nombre", { nombre: "" }, "nombre"],
    ["nombre muy corto", { nombre: "ab" }, "nombre"],
    ["nombre muy largo", { nombre: "x".repeat(61) }, "nombre"],
    ["correo inválido", { correo: "no-es-correo" }, "correo"],
    ["teléfono que no empieza por 3", { telefono: "2001234567" }, "telefono"],
    ["teléfono con letras", { telefono: "30012345ab" }, "telefono"],
    ["teléfono corto", { telefono: "300123" }, "telefono"],
    ["tipo de cliente desconocido", { tipoCliente: "alienígena" }, "tipoCliente"],
    ["el tipo «colegio» ya no existe", { tipoCliente: "colegio" }, "tipoCliente"],
    ["sin prenda", { prenda: "  " }, "prenda"],
    ["cantidad cero", { cantidad: 0 }, "cantidad"],
    ["cantidad enorme", { cantidad: 10001 }, "cantidad"],
    ["cantidad decimal", { cantidad: 2.5 }, "cantidad"],
    ["cantidad como texto", { cantidad: "50" }, "cantidad"],
    ["fecha pasada", { fecha: "2020-01-01" }, "fecha"],
    ["fecha imposible", { fecha: "2026-02-31" }, "fecha"],
    ["fecha en otro formato", { fecha: "14/11/2026" }, "fecha"],
    ["diseño desconocido", { diseno: "quizás" }, "diseno"],
    ["mensaje de más de 500", { mensaje: "x".repeat(501) }, "mensaje"],
    ["sin aceptar el tratamiento de datos", { acepto: false }, "acepto"],
    ["aceptación como texto", { acepto: "true" }, "acepto"],
  ];
  for (const [nombre, cambio, campo] of invalidas) {
    test(`rechaza: ${nombre} -> 422 señalando «${campo}»`, async () => {
      const r = await cliente().post("/api/cotizaciones", cotizacionValida(cambio));
      assert.equal(r.estado, 422, r.texto);
      assert.ok(r.datos.campos?.[campo], `faltó el error del campo ${campo}: ${r.texto}`);
    });
  }

  test("hoy es una fecha válida (no se rechaza el mismo día)", async () => {
    assert.equal((await cliente().post("/api/cotizaciones", cotizacionValida({ fecha: hoy() }))).estado, 201);
  });

  test("el servidor reporta varios errores a la vez", async () => {
    const r = await cliente().post("/api/cotizaciones", cotizacionValida({ nombre: "", correo: "x", cantidad: 0 }));
    assert.equal(r.estado, 422);
    assert.ok(Object.keys(r.datos.campos).length >= 3);
  });

  test("JSON dañado -> 400; sin tipo JSON -> 415; arreglo en vez de objeto -> 400", async () => {
    const c = cliente();
    assert.equal((await c.post("/api/cotizaciones", "{no es json")).estado, 400);
    assert.equal((await c.post("/api/cotizaciones", "nombre=ana", { "Content-Type": "text/plain" })).estado, 415);
    assert.equal((await c.post("/api/cotizaciones", "[1,2,3]")).estado, 400);
  });

  test("cuerpo de más de 3 MB -> 413", async () => {
    const r = await cliente().post("/api/cotizaciones", JSON.stringify({ mensaje: "x".repeat(3_200_000) }));
    assert.equal(r.estado, 413);
  });

  test("límite: la 11.ª cotización en una hora desde la misma IP -> 429", async () => {
    const c = cliente();
    for (let i = 0; i < 10; i++) assert.equal((await c.post("/api/cotizaciones", cotizacionValida())).estado, 201);
    assert.equal((await c.post("/api/cotizaciones", cotizacionValida())).estado, 429);
    // otra IP no se ve afectada
    assert.equal((await cliente().post("/api/cotizaciones", cotizacionValida())).estado, 201);
  });

  test("se guarda tal cual (sin ejecutarse): texto con comillas, HTML y SQL", async () => {
    const raro = `'); DROP TABLE cotizaciones;-- <script>alert(1)</script>`;
    const r = await cliente().post("/api/cotizaciones", cotizacionValida({ mensaje: raro, organizacion: raro.slice(0, 70) }));
    assert.equal(r.estado, 201);
    const lista = await admin.get("/api/admin/cotizaciones");
    assert.equal(lista.estado, 200, "la tabla de cotizaciones debe seguir existiendo");
    assert.ok(lista.datos.cotizaciones.some((c) => c.mensaje === raro));
  });
});

// ======================================================================
describe("Pedidos", () => {
  test("un pedido válido calcula el total con los precios del SERVIDOR (ignora los que mande el cliente)", async () => {
    const datos = (await cliente().get("/api/datos")).datos;
    // se ponen precios conocidos en los dos primeros productos
    const mod = structuredClone(datos);
    mod.productos[0].precio = 45000;
    mod.productos[1].precio = 80000;
    assert.equal((await admin.put("/api/admin/datos", mod)).estado, 200);
    const [a, b] = mod.productos;
    const r = await cliente().post("/api/pedidos", { items: [{ id: a.id, cantidad: 2, precio: 1 }, { id: b.id, cantidad: 1, precio: 1, nombre: "Hackeado" }] });
    assert.equal(r.estado, 201, r.texto);
    assert.equal(r.datos.total, 45000 * 2 + 80000);
    assert.equal(r.datos.items[0].nombre, a.nombre);
    assert.equal(r.datos.items[0].precio, 45000);
    assert.ok(Number.isInteger(r.datos.id));
  });

  test("si algún producto no tiene precio, el total queda en null", async () => {
    const datos = (await cliente().get("/api/datos")).datos;
    const mod = structuredClone(datos);
    mod.productos[0].precio = 10000;
    mod.productos[1].precio = null;
    await admin.put("/api/admin/datos", mod);
    const r = await cliente().post("/api/pedidos", { items: [{ id: mod.productos[0].id, cantidad: 1 }, { id: mod.productos[1].id, cantidad: 1 }] });
    assert.equal(r.estado, 201);
    assert.equal(r.datos.total, null);
  });

  test("un pedido con VARIAS prendas guarda cada una en SU pedido (dos pedidos seguidos no se mezclan)", async () => {
    const prods = (await cliente().get("/api/datos")).datos.productos;
    assert.ok(prods.length >= 3, "se necesitan al menos 3 productos para esta prueba");
    const c = cliente();
    const p1 = await c.post("/api/pedidos", { items: [{ id: prods[0].id, cantidad: 1 }, { id: prods[1].id, cantidad: 2 }, { id: prods[2].id, cantidad: 3 }] });
    const p2 = await c.post("/api/pedidos", { items: [{ id: prods[2].id, cantidad: 5 }, { id: prods[0].id, cantidad: 4 }] });
    assert.equal(p1.estado, 201, p1.texto);
    assert.equal(p2.estado, 201, p2.texto);
    const lista = (await admin.get("/api/admin/pedidos")).datos.pedidos;
    const a = lista.find((x) => x.id === p1.datos.id);
    const b = lista.find((x) => x.id === p2.datos.id);
    assert.deepEqual(a.items.map((i) => [i.id, i.cantidad]), [[prods[0].id, 1], [prods[1].id, 2], [prods[2].id, 3]]);
    assert.deepEqual(b.items.map((i) => [i.id, i.cantidad]), [[prods[2].id, 5], [prods[0].id, 4]]);
  });

  test("una prenda repetida se suma", async () => {
    const id = (await cliente().get("/api/datos")).datos.productos[0].id;
    const r = await cliente().post("/api/pedidos", { items: [{ id, cantidad: 3 }, { id, cantidad: 4 }] });
    assert.equal(r.estado, 201);
    assert.equal(r.datos.items.length, 1);
    assert.equal(r.datos.items[0].cantidad, 7);
  });

  const malos = [
    ["sin items", {}],
    ["items vacío", { items: [] }],
    ["items no es lista", { items: "x" }],
    ["id con caracteres raros", { items: [{ id: "../x", cantidad: 1 }] }],
    ["cantidad cero", { items: [{ id: "a", cantidad: 0 }] }],
    ["cantidad negativa", { items: [{ id: "a", cantidad: -1 }] }],
    ["cantidad 100", { items: [{ id: "a", cantidad: 100 }] }],
    ["cantidad decimal", { items: [{ id: "a", cantidad: 1.5 }] }],
    ["más de 30 prendas distintas", { items: Array.from({ length: 31 }, (_, i) => ({ id: "p" + i, cantidad: 1 })) }],
  ];
  for (const [nombre, cuerpo] of malos) {
    test(`rechaza: ${nombre} -> 422`, async () => {
      const r = await cliente().post("/api/pedidos", cuerpo);
      assert.equal(r.estado, 422, r.texto);
    });
  }

  test("un producto que no existe -> 422 diciendo cuál", async () => {
    const r = await cliente().post("/api/pedidos", { items: [{ id: "no-existe-ese-producto", cantidad: 1 }] });
    assert.equal(r.estado, 422);
    assert.match(r.datos.campos.items, /no-existe-ese-producto/);
  });

  test("límite: el pedido 21 en una hora desde la misma IP -> 429", async () => {
    const id = (await cliente().get("/api/datos")).datos.productos[0].id;
    const c = cliente();
    for (let i = 0; i < 20; i++) assert.equal((await c.post("/api/pedidos", { items: [{ id, cantidad: 1 }] })).estado, 201);
    assert.equal((await c.post("/api/pedidos", { items: [{ id, cantidad: 1 }] })).estado, 429);
  });
});

// ======================================================================
describe("Cuenta de administrador", () => {
  test("sin sesión, /auth/yo responde admin: null (200)", async () => {
    const r = await cliente().get("/api/auth/yo");
    assert.equal(r.estado, 200);
    assert.equal(r.datos.admin, null);
  });

  test("registro con código incorrecto -> 403", async () => {
    const r = await cliente().post("/api/auth/registro", { nombre: "Intruso", correo: `x.${EJECUCION}@rc.co`, clave: "clave-segura-123", codigo: "ADIVINANDO" });
    assert.equal(r.estado, 403);
  });

  test("registro con datos inválidos -> 422 (clave corta, correo malo, sin código)", async () => {
    const c = cliente();
    assert.equal((await c.post("/api/auth/registro", { nombre: "Ana", correo: "a@rc.co", clave: "corta", codigo: CODIGO })).datos?.campos?.clave !== undefined, true);
    assert.ok((await c.post("/api/auth/registro", { nombre: "Ana", correo: "no-correo", clave: "clave-segura-123", codigo: CODIGO })).datos.campos.correo);
    assert.ok((await c.post("/api/auth/registro", { nombre: "Ana", correo: "a@rc.co", clave: "clave-segura-123" })).datos.campos.codigo);
    assert.ok((await c.post("/api/auth/registro", { nombre: "Ana", correo: "a@rc.co", clave: "x".repeat(101), codigo: CODIGO })).datos.campos.clave);
  });

  test("registro correcto: 201, cookie HttpOnly + SameSite=Strict + Path=/api, y la contraseña no vuelve en la respuesta", async () => {
    const c = cliente();
    const r = await c.post("/api/auth/registro", { nombre: "Ana Admin", correo: `Ana.${EJECUCION}@RC.co`, clave: "otra-clave-123", codigo: CODIGO });
    assert.equal(r.estado, 201, r.texto);
    const sc = r.cabeceras.get("set-cookie");
    assert.match(sc, /rc_sesion=/);
    assert.match(sc, /HttpOnly/i);
    assert.match(sc, /SameSite=Strict/i);
    assert.match(sc, /Path=\/api/);
    assert.doesNotMatch(r.texto, /clave|pbkdf2/i);
    assert.equal(r.datos.admin.correo, `ana.${EJECUCION}@rc.co`, "el correo se guarda en minúsculas");
    const yo = await c.get("/api/auth/yo");
    assert.equal(yo.datos.admin.nombre, "Ana Admin");
  });

  test("correo repetido (aunque cambien las mayúsculas) -> 409", async () => {
    const correo = `dup.${EJECUCION}@rc.co`;
    assert.equal((await cliente().post("/api/auth/registro", { nombre: "Uno", correo, clave: "clave-segura-123", codigo: CODIGO })).estado, 201);
    assert.equal((await cliente().post("/api/auth/registro", { nombre: "Dos", correo: correo.toUpperCase(), clave: "clave-segura-123", codigo: CODIGO })).estado, 409);
  });

  test("límite: tras 5 códigos incorrectos desde una IP, hasta el correcto queda bloqueado (429)", async () => {
    const c = cliente();
    for (let i = 0; i < 5; i++) assert.equal((await c.post("/api/auth/registro", { nombre: "Bot", correo: `bot${i}.${EJECUCION}@rc.co`, clave: "clave-segura-123", codigo: "MAL" + i })).estado, 403);
    assert.equal((await c.post("/api/auth/registro", { nombre: "Bot", correo: `bot9.${EJECUCION}@rc.co`, clave: "clave-segura-123", codigo: CODIGO })).estado, 429);
  });

  test("login correcto -> 200 y sesión; /auth/yo la reconoce", async () => {
    const correo = `login.${EJECUCION}@rc.co`;
    await cliente().post("/api/auth/registro", { nombre: "Luis Login", correo, clave: "mi-clave-12345", codigo: CODIGO });
    const c = cliente();
    const r = await c.post("/api/auth/login", { correo: correo.toUpperCase(), clave: "mi-clave-12345" });
    assert.equal(r.estado, 200, r.texto);
    assert.ok(c.tieneCookie());
    assert.equal((await c.get("/api/auth/yo")).datos.admin.nombre, "Luis Login");
  });

  test("contraseña mala y correo inexistente dan EXACTAMENTE el mismo mensaje (no revelan qué correos existen)", async () => {
    const correo = `mismo.${EJECUCION}@rc.co`;
    await cliente().post("/api/auth/registro", { nombre: "Mismo", correo, clave: "mi-clave-12345", codigo: CODIGO });
    const a = await cliente().post("/api/auth/login", { correo, clave: "otra-equivocada" });
    const b = await cliente().post("/api/auth/login", { correo: `nadie.${EJECUCION}@rc.co`, clave: "otra-equivocada" });
    assert.equal(a.estado, 401);
    assert.equal(b.estado, 401);
    assert.equal(a.datos.error, b.datos.error);
  });

  test("límite: 5 fallos seguidos bloquean ese correo 15 minutos (429), incluso con la clave correcta", async () => {
    const correo = `bloq.${EJECUCION}@rc.co`;
    await cliente().post("/api/auth/registro", { nombre: "Bloq", correo, clave: "mi-clave-12345", codigo: CODIGO });
    const c = cliente();
    for (let i = 0; i < 5; i++) assert.equal((await c.post("/api/auth/login", { correo, clave: "mala" + i })).estado, 401);
    assert.equal((await c.post("/api/auth/login", { correo, clave: "mi-clave-12345" })).estado, 429);
    // desde otra IP también está bloqueado ese correo (protege contra ataques repartidos)
    assert.equal((await cliente().post("/api/auth/login", { correo, clave: "mi-clave-12345" })).estado, 429);
  });

  test("un login correcto borra los fallos previos de ese correo", async () => {
    const correo = `reset.${EJECUCION}@rc.co`;
    await cliente().post("/api/auth/registro", { nombre: "Reset", correo, clave: "mi-clave-12345", codigo: CODIGO });
    const c = cliente();
    for (let i = 0; i < 4; i++) await c.post("/api/auth/login", { correo, clave: "mala" });
    assert.equal((await c.post("/api/auth/login", { correo, clave: "mi-clave-12345" })).estado, 200);
    for (let i = 0; i < 4; i++) assert.equal((await c.post("/api/auth/login", { correo, clave: "mala" })).estado, 401);
  });

  test("logout cierra la sesión y la cookie vieja deja de servir", async () => {
    const correo = `salir.${EJECUCION}@rc.co`;
    const c = cliente();
    await c.post("/api/auth/registro", { nombre: "Salir", correo, clave: "mi-clave-12345", codigo: CODIGO });
    const vieja = c.verCookie();
    assert.equal((await c.get("/api/admin/pedidos")).estado, 200);
    const r = await c.post("/api/auth/logout");
    assert.equal(r.estado, 200);
    assert.match(r.cabeceras.get("set-cookie"), /Max-Age=0/);
    const otro = cliente(); otro.fijarCookie(vieja);
    assert.equal((await otro.get("/api/admin/pedidos")).estado, 401, "el token viejo no debe funcionar");
  });

  test("una cookie inventada no abre nada", async () => {
    const c = cliente(); c.fijarCookie("rc_sesion=" + randomBytes(32).toString("base64url"));
    assert.equal((await c.get("/api/auth/yo")).datos.admin, null);
    assert.equal((await c.get("/api/admin/cotizaciones")).estado, 401);
    c.fijarCookie("rc_sesion=' OR 1=1 --");
    assert.equal((await c.get("/api/admin/cotizaciones")).estado, 401);
  });

  test("login con cuerpo inválido -> 422", async () => {
    assert.equal((await cliente().post("/api/auth/login", {})).estado, 422);
    assert.equal((await cliente().post("/api/auth/login", { correo: "x", clave: "y" })).estado, 422);
  });
});

// ======================================================================
describe("Protección de las rutas de administración", () => {
  const rutas = [
    ["PUT", "/api/admin/datos", {}],
    ["GET", "/api/admin/cotizaciones"],
    ["PATCH", "/api/admin/cotizaciones/1", { estado: "cerrada" }],
    ["GET", "/api/admin/pedidos"],
    ["PATCH", "/api/admin/pedidos/1", { estado: "entregado" }],
  ];
  for (const [metodo, ruta, cuerpo] of rutas) {
    test(`sin sesión: ${metodo} ${ruta} -> 401`, async () => {
      const c = cliente();
      const r = await { GET: c.get, PUT: c.put, PATCH: c.patch }[metodo](ruta, cuerpo);
      assert.equal(r.estado, 401);
    });
  }

  test("CSRF: una petición que cambia datos con Origin de otro sitio -> 403, aunque lleve la cookie", async () => {
    const r = await admin.put("/api/admin/datos", original, { Origin: "https://sitio-malicioso.example" });
    assert.equal(r.estado, 403);
    const r2 = await admin.patch("/api/admin/pedidos/1", { estado: "cancelado" }, { "Sec-Fetch-Site": "cross-site" });
    assert.equal(r2.estado, 403);
    const r3 = await cliente().post("/api/cotizaciones", cotizacionValida(), { Origin: "https://sitio-malicioso.example" });
    assert.equal(r3.estado, 403);
  });

  test("el mismo Origin del sitio sí se acepta", async () => {
    const r = await admin.put("/api/admin/datos", original, { Origin: BASE, "Sec-Fetch-Site": "same-origin" });
    assert.equal(r.estado, 200, r.texto);
  });
});

// ======================================================================
describe("Panel: guardar productos, servicios, galería y contacto", () => {
  const base = () => structuredClone(original);

  test("guardar cambios los devuelve y GET /datos los refleja", async () => {
    const d = base();
    d.productos[0].nombre = "Chaleco ejecutivo";
    d.productos[0].precio = 45000;
    d.productos.push({ nombre: "Gorra bordada", descripcion: "Con logo", precio: 22000, fotos: [] });
    d.servicios[0].titulo = "Confección corporativa";
    d.contacto = { whatsapp: "573001234567", instagram: "@rcconfecciones", correo: "Ventas@RC.co", ubicacion: "Bogotá" };
    const r = await admin.put("/api/admin/datos", d);
    assert.equal(r.estado, 200, r.texto);
    assert.equal(r.datos.productos[0].nombre, "Chaleco ejecutivo");
    assert.equal(r.datos.productos[0].precio, 45000);
    assert.equal(r.datos.productos.at(-1).id, "gorra-bordada", "el servidor genera el id a partir del nombre");
    assert.equal(r.datos.contacto.instagram, "rcconfecciones", "se quita la @");
    assert.equal(r.datos.contacto.correo, "ventas@rc.co");
    const lectura = (await cliente().get("/api/datos")).datos;
    assert.deepEqual(lectura, r.datos);
  });

  test("el orden de productos y de fotos se conserva", async () => {
    const d = base();
    d.productos.reverse();
    d.productos[0].fotos = ["imagenes/a/3.jpg", "imagenes/a/1.jpg", "imagenes/a/2.jpg"];
    const r = await admin.put("/api/admin/datos", d);
    assert.deepEqual(r.datos.productos.map((p) => p.id), d.productos.map((p) => p.id));
    assert.deepEqual(r.datos.productos[0].fotos, ["imagenes/a/3.jpg", "imagenes/a/1.jpg", "imagenes/a/2.jpg"]);
  });

  test("se pueden dejar listas vacías (borrar todo) y volver a llenarlas", async () => {
    const r = await admin.put("/api/admin/datos", { productos: [], servicios: [], galeria: [], contacto: {} });
    assert.equal(r.estado, 200, r.texto);
    assert.equal(r.datos.productos.length, 0);
    assert.equal((await admin.put("/api/admin/datos", original)).estado, 200);
  });

  const invalidos = [
    ["productos que no es lista", (d) => (d.productos = "x"), "productos"],
    ["producto sin nombre", (d) => (d.productos[0].nombre = " "), "nombre"],
    ["precio negativo", (d) => (d.productos[0].precio = -5), "precio"],
    ["precio decimal", (d) => (d.productos[0].precio = 10.5), "precio"],
    ["precio como texto", (d) => (d.productos[0].precio = "10000"), "precio"],
    ["id con caracteres raros", (d) => (d.productos[0].id = "a/b"), "productos"],
    ["ids repetidos", (d) => d.productos.push({ ...d.productos[0] }), "productos"],
    ["descripción demasiado larga", (d) => (d.productos[0].descripcion = "x".repeat(301)), "descripcion"],
    ["servicio sin título", (d) => (d.servicios[0].titulo = ""), "titulo"],
    ["más de 8 fotos", (d) => (d.productos[0].fotos = Array.from({ length: 9 }, (_, i) => `imagenes/x/${i}.jpg`)), "productos"],
    ["más de 12 fotos en la galería", (d) => (d.galeria = Array.from({ length: 13 }, (_, i) => `imagenes/x/${i}.jpg`)), "galeria"],
    ["ruta de foto con ..", (d) => (d.productos[0].fotos = ["imagenes/../secreto.txt"]), "productos"],
    ["ruta de foto externa (http)", (d) => (d.productos[0].fotos = ["http://sitio-malo.example/x.jpg"]), "productos"],
    ["ruta de foto con javascript:", (d) => (d.galeria = ["javascript:alert(1)"]), "galeria"],
    ["foto que es SVG (puede traer scripts)", (d) => (d.galeria = ["data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="]), "galeria"],
    ["WhatsApp mal formado", (d) => (d.contacto.whatsapp = "12345"), "whatsapp"],
    ["Instagram con caracteres raros", (d) => (d.contacto.instagram = "mal nombre!"), "instagram"],
    ["correo de contacto malo", (d) => (d.contacto.correo = "no-correo"), "correo"],
  ];
  for (const [nombre, cambiar, campo] of invalidos) {
    test(`rechaza: ${nombre} -> 422 y NO modifica nada`, async () => {
      const antes = (await cliente().get("/api/datos")).datos;
      const d = base(); cambiar(d);
      const r = await admin.put("/api/admin/datos", d);
      assert.equal(r.estado, 422, r.texto);
      assert.ok(r.datos.campos?.[campo], `faltó el error de «${campo}»: ${r.texto}`);
      assert.deepEqual((await cliente().get("/api/datos")).datos, antes, "los datos no debieron cambiar");
    });
  }

  test("textos con comillas, HTML y SQL se guardan como texto y las tablas siguen intactas", async () => {
    const d = base();
    const raro = `Robert'); DROP TABLE productos;-- <img src=x onerror=alert(1)>`;
    d.productos[0].nombre = raro.slice(0, 80);
    d.productos[0].id = "id-raro-1";
    const r = await admin.put("/api/admin/datos", d);
    assert.equal(r.estado, 200, r.texto);
    assert.equal(r.datos.productos[0].nombre, raro.slice(0, 80));
    assert.ok((await cliente().get("/api/datos")).datos.productos.length > 0);
  });

  test("subir una imagen (data URL): el servidor la guarda y la entrega por /api/fotos/<id> con los encabezados correctos", async () => {
    const d = base();
    d.productos[0].fotos = [JPG_REAL, "imagenes/empresarial/chaleco1.jpeg"];
    const r = await admin.put("/api/admin/datos", d);
    assert.equal(r.estado, 200, r.texto);
    const [ruta, estatica] = r.datos.productos[0].fotos;
    assert.match(ruta, /^\/api\/fotos\/[a-f0-9]{32}$/);
    assert.equal(estatica, "imagenes/empresarial/chaleco1.jpeg", "las rutas de archivos del sitio se respetan");
    const foto = await fetch(BASE + ruta);
    assert.equal(foto.status, 200);
    assert.equal(foto.headers.get("content-type"), "image/jpeg");
    assert.match(foto.headers.get("cache-control"), /immutable/);
    assert.equal(foto.headers.get("x-content-type-options"), "nosniff");
    assert.match(foto.headers.get("content-security-policy"), /default-src 'none'/);
    const bytes = Buffer.from(await foto.arrayBuffer());
    const original64 = JPG_REAL.split(",")[1];
    assert.equal(bytes.toString("base64"), original64, "la imagen devuelta es idéntica a la subida");
  });

  test("la misma imagen subida dos veces recibe el mismo id (no se duplica)", async () => {
    const d = base();
    d.productos[0].fotos = [PNG_1X1];
    d.galeria = [PNG_1X1, PNG_1X1];
    const r = await admin.put("/api/admin/datos", d);
    assert.equal(r.estado, 200, r.texto);
    assert.equal(r.datos.productos[0].fotos[0], r.datos.galeria[0]);
    assert.equal(r.datos.galeria[0], r.datos.galeria[1]);
  });

  test("al guardar de nuevo con la ruta ya subida, la foto se conserva", async () => {
    const d = base(); d.productos[0].fotos = [PNG_1X1];
    const r1 = await admin.put("/api/admin/datos", d);
    const d2 = structuredClone(r1.datos); d2.productos[0].nombre = "Renombrado";
    const r2 = await admin.put("/api/admin/datos", d2);
    assert.equal(r2.estado, 200, r2.texto);
    assert.equal((await fetch(BASE + r2.datos.productos[0].fotos[0])).status, 200);
  });

  test("las fotos que ya nadie usa se borran de la base de datos (limpieza)", async () => {
    const d = base(); d.productos[0].fotos = [PNG_1X1];
    const r1 = await admin.put("/api/admin/datos", d);
    const ruta = r1.datos.productos[0].fotos[0];
    assert.equal((await fetch(BASE + ruta)).status, 200);
    const d2 = base(); d2.productos[0].fotos = [];
    await admin.put("/api/admin/datos", d2);
    assert.equal((await fetch(BASE + ruta)).status, 404, "la foto huérfana debe haberse borrado");
  });

  test("una ruta /api/fotos/<id> que no existe -> 422", async () => {
    const d = base(); d.productos[0].fotos = ["/api/fotos/" + "b".repeat(32)];
    const r = await admin.put("/api/admin/datos", d);
    assert.equal(r.estado, 422, r.texto);
  });

  test("un archivo que dice ser PNG pero no lo es -> 422", async () => {
    const d = base(); d.galeria = ["data:image/png;base64," + Buffer.from("esto es solo texto, no una imagen").toString("base64")];
    const r = await admin.put("/api/admin/datos", d);
    assert.equal(r.estado, 422, r.texto);
  });

  test("una imagen JPG declarada como PNG -> 422", async () => {
    const d = base(); d.galeria = [JPG_REAL.replace("image/jpeg", "image/png")];
    assert.equal((await admin.put("/api/admin/datos", d)).estado, 422);
  });

  test("una foto de más de 1 MB -> 413 con mensaje claro", async () => {
    const grande = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), randomBytes(1_100_000)]);
    const d = base(); d.galeria = ["data:image/png;base64," + grande.toString("base64")];
    const r = await admin.put("/api/admin/datos", d);
    assert.equal(r.estado, 413, r.texto);
    assert.match(r.datos.error, /pesa más de/);
  });

  test("más de 20 fotos NUEVAS en un guardado -> 422 (pide subirlas en tandas)", async () => {
    const d = base();
    d.galeria = [];
    for (let i = 0; i < 12; i++) d.galeria.push(pngDistinto(i));
    d.productos[0].fotos = Array.from({ length: 8 }, (_, i) => pngDistinto(100 + i));
    d.servicios[0].fotos = Array.from({ length: 8 }, (_, i) => pngDistinto(200 + i));
    const r = await admin.put("/api/admin/datos", d);
    assert.equal(r.estado, 422, r.texto);
    assert.match(r.datos.error, /tandas/);
  });

  test("atomicidad: si el guardado falla a mitad (foto inexistente al final), no queda nada cambiado", async () => {
    const antes = (await cliente().get("/api/datos")).datos;
    const d = base();
    d.productos[0].nombre = "NO DEBE GUARDARSE";
    d.galeria = ["/api/fotos/" + "c".repeat(32)];
    assert.equal((await admin.put("/api/admin/datos", d)).estado, 422);
    assert.deepEqual((await cliente().get("/api/datos")).datos, antes);
  });

  test("el cuerpo debe ser JSON", async () => {
    assert.equal((await admin.put("/api/admin/datos", "texto", { "Content-Type": "text/plain" })).estado, 415);
  });
});

// ======================================================================
describe("Panel: cotizaciones y pedidos recibidos", () => {
  test("lista de cotizaciones con paginación y filtro por estado", async () => {
    await cliente().post("/api/cotizaciones", cotizacionValida({ nombre: "Para Filtrar" }));
    const r = await admin.get("/api/admin/cotizaciones");
    assert.equal(r.estado, 200);
    assert.ok(r.datos.total >= 1 && r.datos.cotizaciones.length >= 1 && r.datos.cotizaciones.length <= 50);
    const c = r.datos.cotizaciones[0];
    assert.deepEqual(Object.keys(c).sort(), ["aceptoDatos", "cantidad", "correo", "correoEnviado", "creado", "diseno", "estado", "fecha", "id", "mensaje", "nombre", "organizacion", "prenda", "telefono", "tipoCliente"]);
    assert.equal(c.correo, c.correo.toLowerCase());
    assert.ok(r.datos.cotizaciones[0].id > r.datos.cotizaciones.at(-1).id || r.datos.cotizaciones.length === 1, "las más nuevas primero");
    const nuevas = await admin.get("/api/admin/cotizaciones?estado=nueva");
    assert.ok(nuevas.datos.cotizaciones.every((x) => x.estado === "nueva"));
    assert.equal((await admin.get("/api/admin/cotizaciones?estado=raro")).estado, 422);
  });

  test("cambiar el estado de una cotización", async () => {
    const id = (await admin.get("/api/admin/cotizaciones")).datos.cotizaciones[0].id;
    const r = await admin.patch(`/api/admin/cotizaciones/${id}`, { estado: "contactada" });
    assert.equal(r.estado, 200, r.texto);
    const lista = (await admin.get("/api/admin/cotizaciones?estado=contactada")).datos.cotizaciones;
    assert.ok(lista.some((c) => c.id === id));
    assert.equal((await admin.patch(`/api/admin/cotizaciones/${id}`, { estado: "inventado" })).estado, 422);
    assert.equal((await admin.patch(`/api/admin/cotizaciones/999999999`, { estado: "cerrada" })).estado, 404);
    assert.equal((await admin.patch(`/api/admin/cotizaciones/abc`, { estado: "cerrada" })).estado, 404);
  });

  test("lista de pedidos con sus prendas; y cambio de estado", async () => {
    const prod = (await cliente().get("/api/datos")).datos.productos[0];
    const p = await cliente().post("/api/pedidos", { items: [{ id: prod.id, cantidad: 2 }] });
    const r = await admin.get("/api/admin/pedidos");
    assert.equal(r.estado, 200);
    const mio = r.datos.pedidos.find((x) => x.id === p.datos.id);
    assert.ok(mio, "el pedido recién hecho debe aparecer");
    assert.equal(mio.items[0].cantidad, 2);
    assert.equal(mio.estado, "nuevo");
    assert.equal((await admin.patch(`/api/admin/pedidos/${p.datos.id}`, { estado: "confirmado" })).estado, 200);
    assert.equal((await admin.patch(`/api/admin/pedidos/${p.datos.id}`, { estado: "xx" })).estado, 422);
    assert.equal((await admin.patch(`/api/admin/pedidos/999999999`, { estado: "entregado" })).estado, 404);
  });

  test("el pedido conserva el nombre y precio del momento aunque el producto cambie o se borre después", async () => {
    const d = structuredClone(original);
    d.productos[0] = { id: "producto-temporal", nombre: "Producto temporal", descripcion: "", precio: 12345, fotos: [] };
    await admin.put("/api/admin/datos", d);
    const p = await cliente().post("/api/pedidos", { items: [{ id: "producto-temporal", cantidad: 1 }] });
    assert.equal(p.estado, 201, p.texto);
    d.productos.shift();
    await admin.put("/api/admin/datos", d);
    const mio = (await admin.get("/api/admin/pedidos")).datos.pedidos.find((x) => x.id === p.datos.id);
    assert.equal(mio.items[0].nombre, "Producto temporal");
    assert.equal(mio.items[0].precio, 12345);
    assert.equal(mio.total, 12345);
  });
});

// Imágenes PNG mínimas pero distintas entre sí (para probar el límite de fotos nuevas)
function pngDistinto(n) {
  const base = Buffer.from(PNG_1X1.split(",")[1], "base64");
  return "data:image/png;base64," + Buffer.concat([base, Buffer.from(`-${n}-${EJECUCION}`)]).toString("base64");
}

// ======================================================================
describe("Ediciones simultáneas: versión del contenido (ETag / If-Match)", () => {
  const versionActual = async () => (await cliente().get("/api/datos")).cabeceras.get("ETag");
  const num = (etag) => Number(etag.replace(/\D/g, ""));

  test("GET /api/datos entrega la versión en la cabecera ETag", async () => {
    const etag = await versionActual();
    assert.match(etag, /^"\d+"$/);
  });

  test("guardar con la versión correcta sube la versión en 1 y la devuelve en ETag", async () => {
    const antes = num(await versionActual());
    const r = await admin.put("/api/admin/datos", original, { "If-Match": `"${antes}"` });
    assert.equal(r.estado, 200, r.texto);
    assert.equal(num(r.cabeceras.get("ETag")), antes + 1);
    assert.equal(num(await versionActual()), antes + 1);
  });

  test("sin If-Match -> 428 y no cambia nada", async () => {
    const antes = await versionActual();
    const r = await admin.put("/api/admin/datos", original, { "If-Match": null });
    assert.equal(r.estado, 428, r.texto);
    assert.equal(await versionActual(), antes);
  });

  test("If-Match mal escrito -> 400", async () => {
    for (const malo of ["abc", "-1", '"1; DROP TABLE x"', "99999999999"]) {
      assert.equal((await admin.put("/api/admin/datos", original, { "If-Match": malo })).estado, 400, malo);
    }
  });

  test("guardar con una versión vieja -> 412 con aviso claro, y el contenido NO se toca", async () => {
    const vieja = num(await versionActual());
    assert.equal((await admin.put("/api/admin/datos", original, { "If-Match": `"${vieja}"` })).estado, 200);
    const antes = (await cliente().get("/api/datos")).datos;
    const intento = structuredClone(original);
    intento.productos[0].nombre = "NO DEBE GUARDARSE";
    const r = await admin.put("/api/admin/datos", intento, { "If-Match": `"${vieja}"` });
    assert.equal(r.estado, 412, r.texto);
    assert.match(r.datos.error, /Recarga/);
    assert.deepEqual((await cliente().get("/api/datos")).datos, antes);
  });

  test("se acepta el formato débil W/\"n\" que puede poner un intermediario", async () => {
    const v = num(await versionActual());
    assert.equal((await admin.put("/api/admin/datos", original, { "If-Match": `W/"${v}"` })).estado, 200);
  });

  test("un guardado inválido (422) no sube la versión", async () => {
    const antes = await versionActual();
    const malo = structuredClone(original);
    malo.productos[0].nombre = "";
    assert.equal((await admin.put("/api/admin/datos", malo, { "If-Match": antes })).estado, 422);
    assert.equal(await versionActual(), antes);
  });

  test("dos administradores guardando AL MISMO TIEMPO con la misma versión: uno gana (200) y el otro recibe 412", async () => {
    const otro = cliente();
    const reg = await otro.post("/api/auth/registro", { nombre: "Otro Admin", correo: `otro.${EJECUCION}@rc.co`, clave: "clave-segura-456", codigo: CODIGO });
    assert.equal(reg.estado, 201, reg.texto);
    const etag = await versionActual();
    const A = structuredClone(original); A.productos[0].precio = 11111;
    const B = structuredClone(original); B.productos[0].precio = 22222;
    const [ra, rb] = await Promise.all([
      admin.put("/api/admin/datos", A, { "If-Match": etag }),
      otro.put("/api/admin/datos", B, { "If-Match": etag }),
    ]);
    assert.deepEqual([ra.estado, rb.estado].sort(), [200, 412], `${ra.texto} | ${rb.texto}`);
    const ganador = ra.estado === 200 ? 11111 : 22222;
    const final = (await cliente().get("/api/datos")).datos;
    assert.equal(final.productos[0].precio, ganador, "el contenido final es el del que ganó, completo");
    assert.equal(num(await versionActual()), num(etag) + 1, "la versión subió solo una vez");
  });
});

describe("Consentimiento de datos en cotizaciones", () => {
  test("la cotización guarda cuándo se aceptó el tratamiento de datos", async () => {
    const c = cliente();
    const r = await c.post("/api/cotizaciones", cotizacionValida({ nombre: "Con Consentimiento" }));
    assert.equal(r.estado, 201, r.texto);
    const mia = (await admin.get("/api/admin/cotizaciones")).datos.cotizaciones.find((x) => x.id === r.datos.id);
    assert.match(mia.aceptoDatos, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  test("sin aceptar no se guarda nada (y no queda cotización a medias)", async () => {
    const antes = (await admin.get("/api/admin/cotizaciones")).datos.total;
    for (const acepto of [false, undefined, "true", 1, null]) {
      assert.equal((await cliente().post("/api/cotizaciones", cotizacionValida({ acepto }))).estado, 422);
    }
    assert.equal((await admin.get("/api/admin/cotizaciones")).datos.total, antes);
  });
});

describe("Límite de tamaño al guardar fotos", () => {
  const foto = (kb, marca) => "data:image/jpeg;base64," + Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(kb * 1000, marca)]).toString("base64");

  test("2 fotos de 800 KB juntas (≈2,2 MB en base64) sí se guardan", async () => {
    const d = structuredClone(original);
    d.productos[0].fotos = [foto(800, 1), foto(800, 2)];
    const r = await admin.put("/api/admin/datos", d);
    assert.equal(r.estado, 200, r.texto.slice(0, 200));
  });

  test("4 fotos de 800 KB en un solo guardado pasan los 3 MB de la petición -> 413 (por eso la página debe reducirlas)", async () => {
    const antes = (await cliente().get("/api/datos")).datos;
    const d = structuredClone(original);
    d.productos[0].fotos = [foto(800, 1), foto(800, 2), foto(800, 3), foto(800, 4)];
    const r = await admin.put("/api/admin/datos", d);
    assert.equal(r.estado, 413, r.texto.slice(0, 200));
    assert.match(r.datos.error, /demasiado grande/);
    assert.deepEqual((await cliente().get("/api/datos")).datos, antes);
  });
});

// ======================================================================
// Aviso por correo. El servidor de pruebas (npm run api:dev) usa RESEND_API_KEY, CORREO_EMPRESA y
// URL_API_CORREO del archivo .dev.vars. Aquí se levanta un "Resend falso" en el puerto 8790 que anota
// lo que recibe, para comprobar el correo SIN enviar nada real.
describe("Cotizaciones: aviso por correo a la empresa", () => {
  const PUERTO_CORREO = 8790;
  let recibidos = [];
  let modo = "ok"; // ok | rechazar | lento
  let servidorFalso;

  before(async () => {
    servidorFalso = createServer((req, res) => {
      let cuerpo = "";
      req.on("data", (d) => (cuerpo += d));
      req.on("end", () => {
        let json = null; try { json = JSON.parse(cuerpo); } catch { /* ignorar */ }
        recibidos.push({ url: req.url, metodo: req.method, auth: req.headers.authorization, json });
        if (modo === "rechazar") { res.writeHead(403, { "Content-Type": "application/json" }); return res.end('{"message":"no permitido"}'); }
        if (modo === "lento") return setTimeout(() => { try { res.writeHead(200); res.end("{}"); } catch { /* conexión ya cerrada */ } }, 7000);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end('{"id":"falso-1"}');
      });
    });
    await new Promise((ok, fallo) => { servidorFalso.once("error", fallo); servidorFalso.listen(PUERTO_CORREO, "127.0.0.1", ok); });
  });
  after(() => servidorFalso?.close());

  const enviar = async (extra) => {
    recibidos = [];
    const r = await cliente().post("/api/cotizaciones", cotizacionValida(extra));
    return r;
  };

  test("el servidor está configurado para las pruebas de correo (.dev.vars)", async () => {
    modo = "ok";
    const r = await enviar({ nombre: "Prueba Configuracion" });
    assert.equal(r.estado, 201, r.texto);
    assert.equal(r.datos.correoEnviado, true,
      "El correo no salió hacia el servidor falso. Agrega a .dev.vars las 3 líneas de .dev.vars.example (RESEND_API_KEY, CORREO_EMPRESA, URL_API_CORREO) y reinicia npm run api:dev.");
  });

  test("manda UN correo a la empresa, con la clave, el cliente como reply_to y todos los datos", async () => {
    modo = "ok";
    const r = await enviar({ nombre: "Laura Gómez", correo: "Laura@Correo.com", prenda: "Chaleco", cantidad: 40, mensaje: "Logo bordado en el pecho" });
    assert.equal(r.estado, 201, r.texto);
    assert.equal(recibidos.length, 1);
    const m = recibidos[0];
    assert.equal(m.metodo, "POST");
    assert.match(m.auth, /^Bearer .+/);
    assert.deepEqual(m.json.to, ["empresa@ejemplo.com"]);
    assert.equal(m.json.reply_to, "laura@correo.com");
    assert.match(m.json.from, /<onboarding@resend\.dev>|@/);
    assert.match(m.json.subject, new RegExp(`#${r.datos.id}.*Chaleco x40.*Laura Gómez`));
    for (const dato of ["Laura Gómez", "laura@correo.com", "3001234567", "Chaleco", "40", "Logo bordado en el pecho", "Mi Empresa S.A.S.", "Empresa"]) {
      assert.ok(m.json.text.includes(dato), "el texto debe incluir: " + dato);
    }
  });

  test("la cotización queda marcada como correoEnviado = true en el panel", async () => {
    modo = "ok";
    const r = await enviar({ nombre: "Marcada Enviada" });
    const mia = (await admin.get("/api/admin/cotizaciones")).datos.cotizaciones.find((x) => x.id === r.datos.id);
    assert.equal(mia.correoEnviado, true);
  });

  test("lo que escribe el cliente se escapa en el HTML y no puede alterar el asunto", async () => {
    modo = "ok";
    const r = await enviar({ nombre: "Ana <b>Negrita</b>", mensaje: '<script>alert("x")</script> & más', prenda: "Chaleco\r\nBcc: otro@x.com" });
    assert.equal(r.estado, 201, r.texto);
    const { html, subject } = recibidos[0].json;
    assert.ok(!html.includes("<script>") && !html.includes("<b>Negrita"), "el HTML no debe llevar etiquetas del cliente");
    assert.ok(html.includes("&lt;script&gt;") && html.includes("&amp; más"));
    assert.ok(!/[\r\n]/.test(subject), "el asunto no puede tener saltos de línea");
  });

  test("si el proveedor rechaza el correo (403), la cotización IGUAL se guarda, con correoEnviado = false", async () => {
    modo = "rechazar";
    const r = await enviar({ nombre: "Sin Correo Rechazado" });
    modo = "ok";
    assert.equal(r.estado, 201, r.texto);
    assert.equal(r.datos.correoEnviado, false);
    const mia = (await admin.get("/api/admin/cotizaciones")).datos.cotizaciones.find((x) => x.id === r.datos.id);
    assert.ok(mia, "la cotización debe estar guardada");
    assert.equal(mia.correoEnviado, false);
    assert.equal(mia.nombre, "Sin Correo Rechazado");
  });

  test("si el proveedor tarda demasiado, se corta a los ~5 s y la cotización se guarda igual", async () => {
    modo = "lento";
    const inicio = Date.now();
    const r = await enviar({ nombre: "Sin Correo Lento" });
    const duracion = Date.now() - inicio;
    modo = "ok";
    assert.equal(r.estado, 201, r.texto);
    assert.equal(r.datos.correoEnviado, false);
    assert.ok(duracion < 6500, `debió cortar a los 5 s, tardó ${duracion} ms`);
  });

  test("una cotización inválida (422) NO manda correo ni se guarda", async () => {
    modo = "ok";
    recibidos = [];
    const r = await cliente().post("/api/cotizaciones", cotizacionValida({ telefono: "123" }));
    assert.equal(r.estado, 422);
    assert.equal(recibidos.length, 0);
  });

  test("los pedidos NO mandan correo (siguen yendo por WhatsApp)", async () => {
    modo = "ok";
    recibidos = [];
    const id = (await cliente().get("/api/datos")).datos.productos[0].id;
    const r = await cliente().post("/api/pedidos", { items: [{ id, cantidad: 1 }] });
    assert.equal(r.estado, 201, r.texto);
    assert.equal(recibidos.length, 0);
  });
});
