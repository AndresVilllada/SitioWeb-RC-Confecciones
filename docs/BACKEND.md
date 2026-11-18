# Backend y base de datos de RC Confecciones

Este documento explica la **base del servidor**: qué hay, cómo correrlo, cómo está diseñada la base de datos, qué ofrece la API y qué falta para conectarlo con la página.

**Estado:** el servidor y la base de datos funcionan en tu computador y tienen **126 pruebas automáticas que pasan**. Todavía **no está conectado a la página** (la página sigue guardando todo en el navegador) y **no se ha publicado** en Cloudflare.

## 1. Tecnología elegida

| Pieza | Qué usamos | Por qué |
|---|---|---|
| Servidor (API) | **Cloudflare Pages Functions** (JavaScript) | Corre en el mismo sitio donde se publica la página; gratis y sin tarjeta |
| Base de datos | **Cloudflare D1** (SQLite, es **SQL**) | Tablas, llaves y consultas como las de clase; incluida en el plan gratis |
| Contraseñas | **PBKDF2-SHA256** con sal | Viene en el navegador/servidor (Web Crypto), sin librerías externas |
| Simulador local | **Wrangler** | Corre el mismo servidor y la misma base de datos en tu computador |

> **Pregunta pendiente para la profesora:** ¿exige MySQL o una base de datos en particular? Si la respuesta es MySQL, **el diseño de tablas de la sección 3 se traslada casi igual**; lo que cambia es el código de `servidor/` (otro lenguaje o librería para conectarse) y dónde se publica.

## 2. Cómo correrlo en tu computador

Requisitos: Node.js 20 o superior. Desde la carpeta del proyecto:

```bash
npm install                      # la primera vez
cp .dev.vars.example .dev.vars   # secretos del servidor (en Windows: copia y renombra el archivo)
npm run build                    # el servidor entrega la página desde dist/
npm run api:crear-tablas         # aplica las migraciones (migrations/) a una base de datos local
npm run api:sembrar              # carga los productos y servicios iniciales
npm run api:dev                  # servidor en http://localhost:8788
```

En otra terminal, para probarlo:

```bash
npm run api:probar               # 126 pruebas automáticas (con el servidor encendido)
```

Para trabajar la página y el servidor a la vez: `npm run api:dev` en una terminal y `npm run dev` en otra. La página (puerto 5173) reenvía las llamadas `/api` al servidor (puerto 8788).

La base de datos local vive en la carpeta `.wrangler/` (no se sube a GitHub). Para empezar de cero, bórrala y repite `api:crear-tablas` y `api:sembrar`.

## 3. Base de datos

Las tablas se crean con **migraciones**: archivos numerados en `migrations/` que se aplican en orden y una sola vez (D1 apunta en la tabla `d1_migrations` cuáles ya corrieron). Datos iniciales: `db/seed.sql` (se genera con `npm run api:sembrar` a partir de `src/data/`, y **no borra nada** si se repite).

### Migraciones (cómo cambiar las tablas)

| Archivo | Qué hace |
|---|---|
| `migrations/0001_inicial.sql` | Todas las tablas |
| `migrations/0002_version_y_consentimiento.sql` | Tabla `contenido_version` y columna `cotizaciones.acepto_datos_en` |
| `migrations/0003_correo_enviado.sql` | Columna `cotizaciones.correo_enviado` (si el aviso por correo salió) |

- **Nunca se edita una migración ya aplicada** (en tu computador o en la base real). Para cambiar algo: `npm run api:nueva-migracion -- nombre_del_cambio` crea el siguiente archivo (`0003_...`) y ahí se escribe el `ALTER TABLE` / `CREATE TABLE`.
- Local: `npm run api:crear-tablas`. Base real: `npm run nube:tablas`. Las dos solo aplican las que faltan.
- SQLite/D1 no puede modificar un `CHECK` existente: cambiarlo exige crear una tabla nueva, copiar y renombrar (por eso conviene pensar bien los valores antes de publicar).

### Tablas

| Tabla | Para qué sirve | Notas |
|---|---|---|
| `administradores` | Cuentas del panel | `correo` único y en minúsculas; `clave` guarda el cifrado, nunca la contraseña |
| `sesiones` | Quién tiene la sesión iniciada | Guarda el **hash** del token; vencen a los 7 días |
| `intentos` | Límites contra abusos | Registra inicios de sesión fallidos y envíos repetidos por correo/IP |
| `productos` | Tienda | `precio` NULL = «Precio por definir»; `orden` define cómo se muestran |
| `servicios` | Catálogo | Igual que productos |
| `producto_fotos`, `servicio_fotos`, `galeria` | Lista ordenada de fotos de cada cosa | Cada ruta es `imagenes/...` (archivo del sitio) o `/api/fotos/<id>` (subida desde el panel) |
| `fotos` | Imágenes subidas desde el panel | Texto en base64; el `id` es el hash de la imagen (no se duplican) |
| `contacto` | WhatsApp, Instagram, correo, ubicación | Una sola fila (`id = 1`) |
| `contenido_version` | Número de versión del contenido del panel | Una sola fila; sube en 1 con cada guardado (ver «Ediciones simultáneas») |
| `cotizaciones` | Lo que envían los clientes | `estado`: nueva, contactada, cerrada, descartada. `acepto_datos_en` = momento en que aceptó el tratamiento de datos (vacío solo en filas anteriores a la migración 0002). `correo_enviado` = 1 si el aviso por correo a la empresa salió |
| `pedidos` y `pedido_items` | Pedidos de la tienda | Cada ítem guarda **nombre y precio del momento**; si el producto se borra o cambia, el pedido histórico no se altera |

### Relaciones

```
administradores 1───* sesiones
productos       1───* producto_fotos          servicios 1───* servicio_fotos
pedidos         1───* pedido_items            (pedido_items.producto_id NO es llave foránea, a propósito)
```

### Decisiones de diseño (por si te las preguntan)

- **Fotos en la base de datos, en texto base64.** Cloudflare R2 (almacén de archivos) es la alternativa «de verdad», pero tengo entendido que exige registrar una tarjeta aunque no se use (no lo verifiqué); D1 no. Las fotos del panel ya se reducen a ~100–250 KB, caben bien (una fila de D1 admite ~2 MB). Se guardan como texto base64 y no como BLOB porque es más simple y funciona igual en el computador y en Cloudflare. Límite: **1 MB por foto**. Si la página crece mucho, lo correcto es pasar las fotos a R2.
- **Guardar el contenido con una consulta por tabla.** El plan gratis permite pocas consultas por petición (50), así que el panel envía la lista completa en un solo JSON y la base la inserta con `json_each`, en una sola transacción: **o se guarda todo o no se guarda nada**.
- **Precios del servidor.** Cuando alguien hace un pedido, el servidor lee los precios de la base de datos; ignora los que mande el navegador.

## 4. API

Todas las respuestas son JSON. Los errores traen `{ "error": "mensaje en español" }` y, en validaciones, `{ "campos": { "campo": "qué está mal" } }`.

### Públicas (cualquier visitante)

| Método y ruta | Qué hace | Respuestas |
|---|---|---|
| `GET /api/salud` | Comprueba servidor y base de datos | 200 |
| `GET /api/datos` | Productos, servicios, galería y contacto, **en el mismo formato que hoy usa la página**. La cabecera `ETag` trae la **versión** del contenido | 200 |
| `GET /api/fotos/:id` | Foto subida desde el panel | 200 imagen · 404 |
| `POST /api/cotizaciones` | Guarda una cotización. Cuerpo: `nombre, organizacion, correo, telefono, tipoCliente, prenda, cantidad, fecha, diseno, mensaje, acepto` | 201 `{id, correoEnviado}` · 422 · 429 (más de 10 por hora por IP) |
| `POST /api/pedidos` | Guarda un pedido. Cuerpo: `{ items: [{ id, cantidad }] }`. Devuelve `{ id, total, items }` con precios del servidor | 201 · 422 · 429 (más de 20 por hora por IP) |

### Cuenta de administrador

| Método y ruta | Qué hace | Respuestas |
|---|---|---|
| `GET /api/auth/yo` | ¿Hay sesión? Devuelve `{ admin: {nombre, correo} }` o `{ admin: null }` | 200 |
| `POST /api/auth/registro` | Crea cuenta. Cuerpo: `nombre, correo, clave, codigo` (el código de invitación) | 201 + cookie · 403 código incorrecto · 409 correo repetido · 422 · 429 |
| `POST /api/auth/login` | Inicia sesión. Cuerpo: `correo, clave` | 200 + cookie · 401 · 429 (5 fallos por correo en 15 min) |
| `POST /api/auth/logout` | Cierra la sesión | 200 |

### Panel (exigen sesión; sin ella responden 401)

| Método y ruta | Qué hace |
|---|---|
| `PUT /api/admin/datos` | Guarda productos, servicios, galería y contacto (reemplaza todo, como «Guardar cambios»). Las fotos pueden venir como ruta o como imagen `data:image/...;base64,...`: el servidor las guarda y devuelve su ruta `/api/fotos/<id>`. Máximo 20 fotos **nuevas** por guardado. **Exige la cabecera `If-Match`** con la versión que se leyó en `GET /api/datos` (p. ej. `If-Match: "7"`). Respuestas: 200 (devuelve el contenido y el `ETag` nuevo) · 412 si otra persona guardó antes (hay que recargar) · 428 si falta `If-Match` · 413 si la petición pasa de 3 MB |
| `GET /api/admin/cotizaciones?estado=&pagina=` | Lista de cotizaciones (50 por página, las más nuevas primero), con `aceptoDatos` y `correoEnviado` |
| `PATCH /api/admin/cotizaciones/:id` | Cambia el estado. Cuerpo: `{ "estado": "contactada" }` |
| `GET /api/admin/pedidos?estado=&pagina=` | Lista de pedidos con sus prendas |
| `PATCH /api/admin/pedidos/:id` | Cambia el estado: nuevo, confirmado, entregado, cancelado |

### Ediciones simultáneas (versión del contenido)

El panel guarda **todo** de una vez, así que sin control, si dos administradores editan a la vez, el que guarda último borraría en silencio los cambios del otro. Para evitarlo:

1. Al cargar, la página lee la versión en la cabecera `ETag` de `GET /api/datos`.
2. Al guardar, la devuelve en `If-Match`.
3. El servidor guarda **solo si esa versión sigue siendo la actual** y la sube en 1. Si no, responde 412 y no cambia nada; la página debe avisar «Otra persona guardó cambios, recarga» y volver a cargar.

La comprobación final es atómica: va dentro del mismo lote (transacción) que el guardado (`guardarContenido` en `servidor/datos.js`), así que dos guardados simultáneos con la misma versión nunca se mezclan: uno gana y el otro recibe 412 (hay una prueba que los lanza a la vez).

### Fotos: tamaño máximo
Cada foto puede pesar hasta ~1 MB y la **petición completa** hasta 3 MB (el base64 aumenta el tamaño ~33 %). Cuatro fotos de 800 KB en un solo guardado ya fallan con 413. Por eso, **al conectar la página, las fotos se deben reducir en el navegador** (por ejemplo a ~1200 px de ancho en WebP) antes de enviarlas.

### Correo de las cotizaciones

Las **cotizaciones se guardan siempre** en la base de datos y **además se avisa por correo** a la empresa; los **pedidos del carrito siguen yendo por WhatsApp** (no mandan correo). Si el correo falla, la cotización no se pierde: queda en el panel con `correoEnviado: false` (`GET /api/admin/cotizaciones`). `POST /api/cotizaciones` responde `201 { id, correoEnviado }`.

- **Proveedor:** [Resend](https://resend.com), plan gratis: 3.000 correos al mes y 100 al día (cifras de su documentación; confirmar en resend.com/pricing).
- **Limitación importante:** con el remitente de pruebas `onboarding@resend.dev`, Resend **solo entrega al correo con el que se registró la cuenta**. Por eso **la cuenta de Resend debe crearse con el correo de la empresa** (el mismo que va en `CORREO_EMPRESA`). Para enviar a otros correos o usar un remitente propio hace falta un dominio verificado en Resend.
- **Cómo funciona:** el correo llega a la empresa con el asunto `Nueva cotización #N: prenda xCantidad (nombre)` y todos los datos; el campo *Reply-To* es el correo del cliente, así que **al pulsar «Responder» la respuesta va al cliente**. El texto escrito por el cliente se escapa en el HTML y no puede alterar el asunto.
- **Si Resend tarda más de 5 s o rechaza el envío,** se registra el error en los registros de Cloudflare (sin mostrar la clave) y se responde igual 201.
- **Límite de abuso:** 10 cotizaciones por hora por IP (ya existía). Un ataque coordinado podría agotar los 100 correos diarios; las cotizaciones seguirían guardándose en el panel.

**Configuración real** (después de crear la base y el proyecto en Cloudflare):
1. Crear cuenta en resend.com **con el correo de la empresa** y crear una *API key* con permiso de envío.
2. `npm run nube:correo-clave` (pega la clave de Resend) y `npm run nube:correo-destino` (escribe el correo de la empresa). Son secretos: no van en el código ni en GitHub.
3. Probar enviando una cotización desde el sitio publicado y mirando la bandeja (y spam) de la empresa.

**En tu computador no se envían correos reales:** `.dev.vars.example` trae `RESEND_API_KEY`, `CORREO_EMPRESA` y `URL_API_CORREO` apuntando a un servidor falso que levantan las pruebas (puerto 8790). Si tu `.dev.vars` es anterior a este cambio, copia esas 3 líneas y reinicia `npm run api:dev`. `URL_API_CORREO` solo se acepta si apunta a `localhost`; en producción no se configura.

## 5. Seguridad

Lo que está hecho y probado:

- Contraseñas cifradas con **PBKDF2-SHA256 + sal aleatoria** (15 000 iteraciones, ajustadas al plan gratis, ver sección 6); nunca se guardan ni se devuelven en claro.
- Sesión con **cookie `HttpOnly` + `SameSite=Strict`**: JavaScript no puede leerla y no viaja desde otros sitios. En la base de datos solo se guarda el hash del token.
- **Código de invitación en el servidor** (`CODIGO_INVITACION`), no dentro de la página como hoy.
- **Mismo mensaje** para «correo no existe» y «contraseña incorrecta», y se calcula un cifrado de relleno para que el tiempo de respuesta tampoco delate qué correos existen.
- **Límites de intentos:** 5 fallos de login por correo y 20 por IP cada 15 minutos; 5 intentos de registro por IP; 10 cotizaciones y 20 pedidos por hora por IP.
- **Defensa contra CSRF:** se rechazan las peticiones que cambian datos y vienen de otro sitio.
- **Todo se valida otra vez en el servidor** (el formulario de la página no basta).
- Consultas **parametrizadas**: un nombre como `'); DROP TABLE productos;--` se guarda como texto y no hace nada (hay una prueba).
- Fotos: solo JPG/PNG/WebP, confirmadas por los primeros bytes (no por lo que diga el archivo); **no se acepta SVG** (puede traer scripts); se sirven con `nosniff` y una política que impide ejecutar nada.

Lo que **falta** (para una etapa posterior): cambiar la contraseña, recuperar contraseña por correo, borrar cuentas de administrador, registro de auditoría de cambios, y las comprobaciones de seguridad de un hosting real (HTTPS, dominio propio).

## 6. Configuración para el plan gratis de Cloudflare

Según la documentación de Cloudflare (consultada el 16/11/2026):

- **Pages Functions:** 100 000 peticiones por día, compartidas con Workers ([fuente](https://developers.cloudflare.com/pages/functions/pricing/)).
- **D1:** 5 millones de filas leídas por día, 100 000 filas escritas por día y 5 GB en total ([fuente](https://developers.cloudflare.com/d1/platform/pricing/)).
- **CPU por petición:** **10 ms** en el plan gratis de Workers; esperar a la base de datos no cuenta, pero el cálculo (por ejemplo cifrar) sí ([fuente](https://developers.cloudflare.com/workers/platform/limits/)).

### Lo que ya está ajustado

El cálculo más pesado es cifrar la contraseña (PBKDF2). Se midió el tiempo de CPU de una operación en este equipo (no en Cloudflare):

| Iteraciones | CPU por cifrado |
|---|---|
| 100 000 | ~20 ms (**se pasa de los 10 ms**) |
| 50 000 | ~12 ms (se pasa) |
| 20 000 | ~4 ms |
| **15 000 (configurado)** | **~3 ms** |

Por eso `wrangler.toml` trae `ITERACIONES_CLAVE = "15000"`. Cada contraseña guarda las iteraciones con las que se cifró, así que si algún día se pasa al plan de pago se sube el número (p. ej. 100 000) y las cuentas viejas siguen funcionando. Las cuentas nuevas usarían el valor nuevo; las viejas conservan el suyo.

Otros puntos que cuidan el límite:

- La API no usa librerías externas: el servidor compilado pesa ~56 KB.
- Ver una foto cuesta ~1–3 ms de CPU (decodificar hasta 1 MB). Por eso las fotos se limitan a 1 MB; lo ideal son fotos de unos 300 KB.
- Guardar desde el panel con varias fotos grandes a la vez es lo más pesado después del login. Se recomienda subir las fotos en tandas pequeñas.
- Cada petición usa pocas consultas a la base (el guardado del panel usa una por tabla), lejos del tope de 50 por petición del plan gratis.

### Qué NO está comprobado

- **No se ha probado en Cloudflare real.** El simulador local no aplica el límite de 10 ms y las medidas de arriba son de este equipo. **Al publicar, crea la cuenta de administrador y entra**; si Cloudflare responde «Worker exceeded resource limits» (error 1102), baja `ITERACIONES_CLAVE` a 10000 en `wrangler.toml` y vuelve a publicar.
- Con 15 000 iteraciones las contraseñas quedan menos protegidas que con las 600 000 que recomienda OWASP. Para este proyecto se compensa con el código de invitación, los límites de intentos y que habrá 1–2 administradores. Una contraseña larga ayuda mucho.

## 7. Cómo publicarlo en Cloudflare (plan gratuito)

> Estos pasos siguen la documentación de Cloudflare y se verificó que el proyecto compila (`npm run nube:verificar`), pero **no se han ejecutado en tu cuenta**; pueden requerir ajustes.

Una sola vez:

1. Crea una cuenta gratuita en [cloudflare.com](https://www.cloudflare.com).
2. `npm run nube:iniciar-sesion` (abre el navegador para autorizar).
3. `npm run nube:crear-bd`: crea la base. Copia el `database_id` que muestra y pégalo en `wrangler.toml`.
4. `npm run nube:tablas` y `npm run nube:sembrar`: crean las tablas y cargan los datos en la base **real**.
5. `npm run nube:crear-proyecto`: crea el proyecto de Pages (rama de producción `main`).
6. `npm run nube:codigo`: pide el código de invitación (elige uno propio y largo) y lo guarda como secreto.

Cada vez que quieras publicar cambios: `npm run nube:publicar`. Te da una dirección tipo `https://rc-confecciones.pages.dev`; ábrela, crea la cuenta de administrador con tu código y prueba.

Comprobación previa sin subir nada: `npm run nube:verificar` (compila la página y la API).

## 8. Siguiente paso: conectar la página

La página sigue guardando todo en el navegador. El plan para conectarla (aún sin hacer):

1. **`DatosContext`**: en vez de leer `localStorage`, pedir `GET /api/datos` al cargar; al guardar desde el panel, enviar `PUT /api/admin/datos` con la versión en `If-Match` (y manejar el 412). El formato ya es el mismo, así que las páginas no cambian.
2. **`AdminContext`**: reemplazar el registro/login del navegador por `/api/auth/*`. El código de invitación sale de `src/config.js`.
3. **Cotizaciones** (ya hecho en la página): `POST /api/cotizaciones`; el servidor avisa por correo. **Pedido por WhatsApp** (pendiente): primero `POST /api/pedidos` y con el número devuelto se arma el mensaje de WhatsApp (por ejemplo «Pedido #123»).
4. **Mantener la versión de demostración** (doble clic, sin servidor): si `/api` no responde, la página puede seguir usando el navegador como hoy.

## 9. Mapa de archivos

```
migrations/             0001_inicial.sql · 0002_version_y_consentimiento.sql · 0003_correo_enviado.sql
servidor/correo.js       aviso por correo de las cotizaciones (Resend)
db/seed.sql              datos iniciales (generado)
scripts/generar-seed.mjs genera seed.sql desde src/data/
functions/api/[[ruta]].js  punto de entrada de la API en Cloudflare
servidor/enrutador.js    recibe cada petición /api y la dirige (CSRF, errores, permisos)
servidor/rutas/          publico.js · auth.js · admin.js
servidor/datos.js        leer/guardar contenido y fotos
servidor/sesion.js       sesiones y límites de intentos
servidor/seguridad.js    cifrado de contraseñas, tokens, cookies
servidor/validar.js      validación de todo lo que llega
pruebas/api.test.mjs     126 pruebas automáticas
wrangler.toml            configuración de Cloudflare y de la base de datos
.dev.vars.example        modelo de los secretos (copiar como .dev.vars; ese archivo NO se sube)
```
