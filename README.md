# RC Confecciones — sitio web en React

Sitio de RC Confecciones hecho con **React + Vite** (JavaScript). Cada módulo es una página, con el diseño de la paleta «Noche y acero».

## Requisitos del documento y dónde está cada uno

| Requisito | Dónde está |
|---|---|
| Catálogo detallado de lo que hace la empresa | Página **Catálogo** (`/catalogo`) con carrusel de fotos por servicio |
| Cotizaciones con formulario | Página **Cotizaciones** (`/cotizaciones`): validación y envío al **correo de la empresa** (con el servidor); si el servidor no responde, ofrece WhatsApp como respaldo |
| Carrito para añadir compras | **Panel del carrito**: se desliza desde la derecha sobre cualquier página (botón «Carrito» del menú o al pulsar «Añadir al carrito»), con fotos, cantidades y total; el pedido se envía por WhatsApp |
| Sección donde se venden las prendas | Página **Tienda** (`/tienda`) |
| Usuario para que los administradores se registren y modifiquen la página | **Panel de administración** (`/admin`): crear cuenta, iniciar sesión y editar productos, catálogo, galería y contacto |

## Cómo ejecutarlo

Necesitas [Node.js](https://nodejs.org) 18 o superior.

```bash
npm install        # solo la primera vez: descarga las dependencias
npm run dev        # abre el sitio en http://localhost:5173
```

Para generar la versión final que se sube a un hosting:

```bash
npm run build      # crea la carpeta dist/
```

Sube el **contenido de la carpeta `dist/`** a Netlify (arrastrándola en netlify.com/drop), GitHub Pages o cualquier hosting estático. No necesita configuración extra.

> No abras el `index.html` de la raíz del proyecto con doble clic: en React hay que usar `npm run dev` (o subir `dist/`). La excepción es la carpeta `dist-demo/`, que sí se abre con doble clic (ver «Presentar sin servidor»).
> Abre siempre la **misma dirección** (por ejemplo `http://localhost:5173`): los datos del panel de administración quedan guardados por dirección.

## Presentar sin servidor (doble clic)

Si el computador de la presentación no tiene Node, o no se pueden abrir puertos, usa la versión de un solo archivo:

```bash
npm run build:demo     # crea la carpeta dist-demo/
```

`dist-demo/` tiene un `index.html` (el JavaScript y el CSS van adentro) y la carpeta `imagenes/`. Cópiala completa al computador de la presentación (USB, correo o nube) y abre `index.html` con doble clic en Chrome, Edge o Firefox.

- Extrae la carpeta antes de abrirla: si abres el `index.html` desde dentro de un zip, el logo no aparece.
- No necesita Node, servidor ni puertos. Solo los botones de WhatsApp necesitan internet, para abrir WhatsApp.
- Lo que se edite en el panel queda guardado en ese navegador de ese computador. Para llevarlo a otro: **Copia de seguridad → Descargar copia**, y en el otro **Cargar copia**.
- Si cambias fotos, datos o código, vuelve a correr `npm run build:demo` y copia la carpeta otra vez.

## Probar en celular

- **Sin celular, desde el computador:** abre el sitio, pulsa `F12` y luego el icono del celular (o `Ctrl+Shift+M`). Simula una pantalla táctil y las fotos se deslizan arrastrando con el mouse.
- **En tu celular, con la misma red Wi-Fi** (por ejemplo, en casa): corre `npm run dev -- --host` y abre en el celular la dirección «Network» que muestra la terminal. Las redes de las universidades suelen bloquearlo.
- **Con un enlace público:** sube la carpeta `dist/` (resultado de `npm run build`) a netlify.com/drop o a GitHub Pages. En Netlify Drop, para que el enlace quede público y no caduque, hay que reclamar el sitio iniciando sesión.

## Páginas

| Dirección | Página |
|---|---|
| `#/` | Inicio: portada con el logo grande (y galería «Nuestros trabajos» cuando hay fotos) |
| `#/nosotros` | Quiénes somos, misión, visión y principios |
| `#/catalogo` | Catálogo |
| `#/tienda` | Tienda (el carrito es un panel que se abre sobre cualquier página, no tiene dirección propia) |
| `#/cotizaciones` | Formulario de cotización |
| `#/contacto` | Datos de contacto |
| `#/admin` | Administración: página aparte, sin menú ni pie del sitio. No hay enlace público a ella: se entra escribiendo la dirección (`.../#/admin`) |

## Panel de administración

1. Entra a la dirección `#/admin` (por ejemplo `http://localhost:5173/#/admin`). Es una página aparte del sitio y no tiene enlace público.
2. **Crear cuenta**: nombre, correo, contraseña (mínimo 8 caracteres) y el **código de invitación**.
   El código está en `src/config.js` (por defecto `RC-ADMIN-2026`). **Cámbialo** y entrégaselo solo a quien administre la página.
3. Dentro del panel:
   - **Productos**: nombre, precio, descripción y fotos; añadir, eliminar y ordenar.
   - **Catálogo**: título, descripción y fotos de cada servicio.
   - **Galería**: fotos del carrusel «Nuestros trabajos» de la página de inicio.
   - **Contacto**: WhatsApp, Instagram, correo y ubicación.
   - **Copia de seguridad**: descargar y cargar los datos, o volver a los originales.

### Importante: es un prototipo

- Las cuentas y los cambios se guardan **en el navegador** (localStorage), no en un servidor. Otro computador, o los visitantes de la página, **no ven** los cambios hechos desde el panel.
- Para llevar los cambios a otro computador (por ejemplo, el de la presentación): **Copia de seguridad → Descargar copia**, y en el otro computador **Cargar copia**.
- Las contraseñas se guardan con sal y hash, pero el código de invitación está dentro del código de la página, así que no es seguridad real. Un sistema de verdad necesita **servidor y base de datos** (siguiente etapa).

## Efectos de la página

- **Portada animada (Inicio):** el título entra «cerrándose», el lema aparece palabra por palabra, el fondo tiene un brillo que se mueve despacio y una flecha invita a bajar.
- **Aparecer al bajar:** títulos, tarjetas, galería y formularios aparecen suavemente (en cascada) cuando llegan a la pantalla. Lo hace el hook `src/hooks/useAparecerAlBajar.js` con `IntersectionObserver`; no se aplica en Administración.
- **Fotos en grande:** al tocar una foto de cualquier carrusel se abre a pantalla completa (`VisorFotos.jsx`), con flechas, miniaturas, contador, deslizar con el dedo (y hacia abajo para cerrar), teclado (flechas, Esc) y cierre con la X o tocando el fondo.
- **Botón flotante de WhatsApp:** en la esquina de todas las páginas públicas, con un pulso suave; usa el número de la pestaña Contacto.
- **Calendario en Cotizaciones:** `SelectorFecha.jsx`, sin librerías; bloquea días pasados.
- Si el equipo tiene activado «reducir movimiento», todo se muestra sin animaciones.

## El carrito (panel que se desliza)

- Se abre con el botón **Carrito (n)** del menú, desde cualquier página, y también solo al pulsar **Añadir al carrito** en la Tienda.
- Se cierra con la **X**, la tecla **Esc**, un clic en el fondo oscuro o **Seguir comprando**. Si se cambia de página (o con el botón «Atrás») también se cierra.
- Muestra la foto, el nombre y el precio de cada prenda, con botones para cambiar la cantidad o quitarla, el total y **Pedir por WhatsApp**. Vacío, ofrece un botón para ir a la Tienda.
- Mientras está abierto la página de atrás no se desplaza, el teclado (Tab) se queda dentro del panel y al cerrarlo el foco vuelve al botón que lo abrió. En celular ocupa todo el ancho.
- Si prefieres que se abra **solo** con el botón «Carrito» (y no al añadir una prenda), en `src/components/Layout.jsx` la función `anadir` deja de llamar a `abrirPanel()`.
- El carrito se guarda en el navegador: sigue ahí al recargar o cambiar de página.

## Pedidos por WhatsApp y cotizaciones por correo

- **Pedidos (carrito):** **«Pedir por WhatsApp»** abre WhatsApp con el mensaje ya escrito, y la empresa lo confirma por ahí. No se cobra ni se necesita servidor.
- **Cotizaciones:** **«Enviar solicitud»** manda los datos al servidor, que los guarda y avisa por **correo a la empresa** (ver `docs/BACKEND.md`, sección «Correo de las cotizaciones»). Si el servidor no responde (por ejemplo en la versión de demostración sin servidor), la página lo dice y ofrece abrir WhatsApp como respaldo.

Para que los pedidos lleguen al WhatsApp de la empresa, escribe el número en el panel (**Contacto → WhatsApp**, con el 57 al inicio y sin espacios, ej. `573001234567`) o en `src/data/contacto.js`. Mientras esté vacío, WhatsApp deja elegir a quién enviarlo (sirve para probar).

El formulario de cotización ya no pide archivos: el logo o las referencias se reciben respondiendo el correo al cliente.

## Cómo agregar fotos

**Opción 1: desde el panel (rápido).** En Productos, Catálogo o Galería pulsa **Subir fotos**. Se reducen automáticamente y se guardan en este navegador (máximo 8 por producto o servicio, y 12 en la galería). Con 2 o más fotos aparece el carrusel con flechas.

**Cómo se ven las fotos.** Se muestran **completas, sin recortar**, dentro de una caja cuadrada (la galería del Inicio es horizontal, 4:3); si la foto no tiene esa proporción queda un fondo oscuro a los lados o arriba y abajo. Funcionan bien las fotos verticales o cuadradas de prendas. En el Catálogo, con 2 o 4 servicios las tarjetas se acomodan en 2 columnas (2 × 2); con 3, 5 o 6, en 3 columnas; en celular, en una.

**Opción 2: en el código (para que las vean todos).**
1. Copia las fotos a `public/imagenes/`.
2. Pon las rutas en `src/data/productos.js` o `src/data/servicios.js`:
   ```js
   fotos: ["imagenes/chaleco-1.jpg", "imagenes/chaleco-2.jpg"]
   ```
   (también sirve **Añadir ruta** en el panel).

### Fotos que ya trae el sitio (versión unida con la de Andrés)

El sitio ya incluye **21 fotos reales** de la empresa en `public/imagenes/`, una carpeta por servicio:

| Carpeta | Fotos | Se ven en |
|---|---|---|
| `empresarial/` | chaquetas con logo y chalecos | Catálogo · *Confección empresarial*; los chalecos también en la Tienda |
| `deportiva/` | camisetas, uniformes de fútbol, chaqueta | Catálogo · *Ropa deportiva*; las camisetas también en la Tienda |
| `personalizado/` | vitrinas, hoodies, chaqueta universitaria | Catálogo · *Diseño personalizado*; la chaqueta universitaria también en la Tienda |
| `eventos/` | hoodies, camisetas y chaquetas de eventos | Catálogo · *Prendas para eventos nacionales e internacionales* |

- El **Catálogo** trae los 4 servicios de la versión del equipo (2 × 2). Los textos y las rutas están en `src/data/servicios.js`.
- Los nombres de archivo van **sin ñ ni tildes** (`diseno1.jpeg`, no `diseño1.jpeg`): con ñ pueden dañarse al comprimir el proyecto o abrirlo en otro computador.
- La **Tienda** trae 3 prendas de ejemplo (chaleco, chaqueta universitaria y camiseta deportiva), todas con foto. Se agregan o quitan desde el panel (pestaña Productos) o en `src/data/productos.js`.
- **Logo:** en el **Inicio** va grande en la portada (`public/imagenes/logo-transparente.png`, versión sin fondo del logo) y el encabezado no lo repite; en las demás páginas queda pequeño en la esquina izquierda (`logo.jpg`). Está en `Encabezado.jsx` (esquina) e `Inicio.jsx` (portada).
- **Si ya habías guardado cambios desde el panel en tu navegador**, esos datos viejos tienen prioridad sobre los iniciales y no verás las fotos nuevas. Solución: Administración → **Copia de seguridad** → **Volver a los datos originales**. (Si quieres conservar lo que tenías, descarga antes la copia.)

## Backend y base de datos (base del servidor)

El proyecto incluye la **base de un servidor real** con base de datos SQL: Cloudflare Pages Functions + D1, con cuentas de administrador, productos, catálogo, fotos, cotizaciones y pedidos. Funciona en tu computador y tiene **126 pruebas automáticas**; todavía **no está conectado a la página** ni publicado.

```bash
cp .dev.vars.example .dev.vars && npm run build
npm run api:crear-tablas && npm run api:sembrar
npm run api:dev        # servidor en http://localhost:8788
npm run api:probar     # en otra terminal: pruebas automáticas
```

Todo el detalle (tablas, API, seguridad, límites del plan gratis, cómo publicarlo y cómo conectar la página) está en **`docs/BACKEND.md`**.

## Estructura del proyecto

```
db/ servidor/ functions/  base de datos y API (ver docs/BACKEND.md)
pruebas/                  pruebas automáticas de la API
public/imagenes/          logo y fotos (se sirven tal cual)
src/
  main.jsx                arranque: monta <App /> en la página
  App.jsx                 define las rutas (una por página)
  config.js               código de invitación para administradores
  estilos.css             el CSS del proyecto (colores en :root, al inicio)
  components/             piezas que se reutilizan
    Layout, Encabezado, Pie, Carrusel, VisorFotos, FotoPendiente, ProductoTarjeta, PanelCarrito,
    SelectorFecha, BotonWhatsApp
  pages/                  una página por archivo
    Inicio, Nosotros, Catalogo, Tienda, Cotizaciones, Contacto, NoEncontrada
    admin/                Admin, AccesoAdmin, PanelAdmin, EditorLista,
                          EditorFotos, EditorGaleria, EditorContacto, CopiaSeguridad
  context/
    DatosContext.jsx      productos, servicios, galería y contacto (editables y guardados)
    AdminContext.jsx      cuentas y sesión de administrador
  hooks/
    useCarrito.js         lógica del carrito (añadir, cantidades, total, guardado)
    useTituloPagina.js    título de la pestaña según la página
  data/                   datos iniciales (productos, servicios, principios, contacto)
  utils/                  formato de precios, mensajes de WhatsApp, contraseñas, imágenes
```

## Equivalencias HTML + JavaScript → React

| Antes (HTML + JS) | Ahora (React) |
|---|---|
| Una página `index.html` con anclas (`#catalogo`) | Una ruta por página (`react-router-dom`) |
| `class="..."` | `className="..."` |
| `for="..."` en `<label>` | `htmlFor="..."` |
| `maxlength`, `minlength` | `maxLength`, `minLength` |
| Tarjetas escritas a mano en el HTML | `.map()` sobre una lista de datos |
| `document.getElementById(...)` y `createElement` | Ya no hacen falta: React dibuja según el **estado** |
| Variable `carrito` + `actualizarCarrito()` | Hook `useCarrito` (`useReducer`) y el componente `PanelCarrito` |
| Mostrar/ocultar el carrito con `classList.add("abierto")` | Estado `panelAbierto` en `Layout`; el panel recibe `abierto` y React pone o quita la clase |
| `addEventListener("click", ...)` | `onClick={...}` en el botón |
| Contador de caracteres con evento `input` | `useState` + `onChange` en el textarea |
| Misma tarjeta copiada en varios lugares | Un componente (`Carrusel`, `ProductoTarjeta`) que se reutiliza |

La idea de React: cuando cambia el **estado** (el carrito, lo que se escribe, la sesión), la pantalla se vuelve a dibujar sola.

## Siguiente etapa: base de datos (no es para la presentación de avances)

Hoy los datos del panel (productos, fotos, contacto y cuentas de administrador) y el carrito se guardan en el navegador. Para que todos los visitantes vean los cambios, y para guardar el resumen de las cotizaciones y los pedidos, hace falta:

- **Un servidor** que hable con la base de datos (el navegador no puede hacerlo directamente). En este proyecto ya existe: Cloudflare Pages Functions + D1 (SQL), en `servidor/` y `migrations/`.
- **Tablas sugeridas:** administradores, productos, servicios, fotos, cotizaciones, pedidos y los ítems de cada pedido.
- **Cambios en el sitio:** `DatosContext` y `AdminContext` pasan de `localStorage` a llamadas al servidor. «Pedir por WhatsApp» guardará primero el resumen en la base de datos y luego abrirá WhatsApp (las cotizaciones ya se guardan y se avisan por correo).
- **Seguridad:** contraseñas con hash en el servidor (PBKDF2) y registro de administradores controlado por el servidor, de modo que el código de invitación ya no quede dentro de la página.
- **Dónde se aloja:** Cloudflare (Pages + D1), plan gratuito; ver `docs/BACKEND.md`.

## Pendiente

- Precios reales, datos de contacto reales (WhatsApp, correo) y más productos con sus fotos (se cargan desde el panel).
- Entregables en documento, según el documento de instrucciones: requisitos funcionales y no funcionales, y propuesta del sitio web.
- Plan de demostración en `GUION_DEMO.md`.
