# Guion de la demostración (4 a 5 minutos)

## Antes de presentar (hazlo hoy, 10 minutos)

1. `npm install` y luego `npm run dev`. Anota la dirección que muestra la terminal (normalmente `http://localhost:5173`) y **abre siempre esa misma**.
2. Entra a la dirección `#/admin` (página aparte, sin enlace en el sitio) → **Crear cuenta** (código en `src/config.js`).
3. En **Contacto** del panel pon el número de WhatsApp real (con el 57) o uno de prueba.
4. Las fotos reales del catálogo y de las tres prendas de la tienda **ya vienen incluidas**. Si quieren, suban fotos a la galería («Nuestros trabajos» del Inicio) o agreguen más productos desde el panel. Si antes guardaron cambios en este navegador, usen **Copia de seguridad → Volver a los datos originales** para ver las fotos incluidas.
5. En **Copia de seguridad** descarga la copia. Si mañana usan otro computador, cargan esa copia allí.
6. Prueba un pedido y una cotización desde el celular o WhatsApp Web, para confirmar que el mensaje llega bien.
7. **Plan B** por si el computador de la universidad no deja usar Node ni abrir puertos: corre `npm run build:demo` y copia la carpeta `dist-demo/` a una USB o a tu correo. Se abre con doble clic en el `index.html`. Pruébala hoy en el navegador que van a usar (Chrome, Edge o Firefox).
8. Para ver cómo queda en celular sin celular: `F12` y el icono del celular en el navegador.

## Orden de la demo

| Minuto | Qué mostrar | Qué decir |
|---|---|---|
| 0:00 | **Inicio** | Recargar la página para que vean la portada animada (el logo grande se enfoca y el lema aparece palabra por palabra). En las demás páginas el logo queda pequeño en la esquina. La paleta sale del logo (negro, grafito, azul glaciar). Bajar despacio: las secciones aparecen solas. Señalar el botón flotante de WhatsApp. Cada módulo es su propia página. |
| 0:30 | **Catálogo** | Los 4 servicios de la empresa en 2 × 2, cada uno con su carrusel de **fotos reales** (flechas, puntos y deslizar en el celular). Tocar una foto: se abre en grande con flechas y miniaturas; cerrar con Esc. |
| 1:15 | **Tienda** | Pulsar **Añadir al carrito**: el panel del carrito se desliza desde la derecha, con la foto, la cantidad y el total. Cambiar cantidades, cerrar con **Seguir comprando** (o la X, o Esc) y añadir otra prenda; el contador del menú se actualiza solo. Abrir el carrito otra vez con **Carrito (n)** del menú, desde cualquier página, y pulsar **Pedir por WhatsApp** para mostrar el mensaje ya armado. |
| 2:15 | **Cotizaciones** | Probar enviar vacío y con un teléfono mal puesto (la validación avisa). Luego llenarlo bien y enviar: abre WhatsApp. |
| 3:00 | **Administración** | Iniciar sesión, cambiar un precio y subir una foto, guardar. Volver a la tienda: el cambio ya se ve. |
| 4:00 | **Código** | Mostrar `App.jsx` (rutas), `useCarrito.js` (la lógica del carrito), `PanelCarrito.jsx` (el panel) y `Carrusel.jsx`. |

## Cómo explicar JavaScript y React

- **JavaScript** lo usamos para dar comportamiento: validar el formulario, calcular el carrito, armar el mensaje de WhatsApp, guardar datos y fotos en el navegador.
- **React** es una librería de JavaScript. Dividimos la página en **componentes** que se reutilizan: el carrusel es uno solo y se usa en el catálogo, la tienda y la galería; la tarjeta de producto también.
- En React no manipulamos la página a mano: cambiamos el **estado** (por ejemplo, la lista del carrito, o si el panel está abierto) y la pantalla se vuelve a dibujar sola. El panel del carrito se desliza porque su clase CSS `abierto` depende de ese estado.
- **React Router** nos da una ruta por página sin recargar el sitio.

## Preguntas probables

**¿Por qué React y no solo HTML y JavaScript?**
Porque la tienda, el carrito, el panel de administración y los carruseles tienen datos que cambian. Con componentes y estado el código queda ordenado y se reutiliza, en lugar de repetir HTML y buscar elementos a mano.

**¿Por qué los pedidos van por WhatsApp y no hay pagos?**
Decisión del equipo: un carrito con pagos en línea cuesta (pasarela y servidor) y la empresa ya atiende por WhatsApp. El pedido llega completo y se confirma con el cliente. Una pasarela se puede agregar en una siguiente etapa.

**¿Es seguro el login de administrador?**
Es un **prototipo**: las contraseñas se guardan con sal y hash, y para crear cuenta hace falta un código de invitación. Pero todo vive en el navegador. Un sistema real necesita servidor y base de datos, y es el siguiente paso.

**Si el administrador cambia un precio, ¿lo ven los clientes?**
Todavía no: se guarda en ese navegador. Para que todos lo vean hace falta el servidor (siguiente etapa). Mientras tanto, los datos definitivos se ponen en `src/data/` y se publica de nuevo.

**¿Cómo se sube a internet?**
`npm run build` crea la carpeta `dist/` y se sube a un hosting estático (Netlify o GitHub Pages).

**¿Y la base de datos?**
Es la siguiente etapa. El documento pide tres entregables (requisitos, propuesta y prototipo funcional) y lo de mañana son avances del prototipo. Hoy los datos se guardan en el navegador; el plan es un servidor con MySQL que guarde las cuentas de administrador, los productos, las cotizaciones y los pedidos.

**¿Por qué el carrito es un panel y no una página?**
Para no sacar al cliente de lo que está viendo: añade una prenda y ve el carrito encima, sigue comprando y lo puede abrir desde cualquier página. Es lo que hacen las tiendas en línea.

**¿Funciona en celular?**
Sí: el diseño se adapta, el menú se compacta, las fotos se deslizan con el dedo y el carrito ocupa toda la pantalla con el botón de pedir siempre a la vista. Se puede mostrar con `F12` y el modo celular del navegador.

**¿Qué falta?**
Precios y contacto reales (se cargan desde el panel), más productos con sus fotos, y el servidor con base de datos.

## Si algo falla durante la demo

- **No aparecen los cambios del panel:** estás en otra dirección (otro puerto) u otro navegador. Abre la misma dirección de siempre o **Cargar copia** en Copia de seguridad.
- **No abre WhatsApp:** en la cotización, la confirmación trae un enlace «¿No se abrió? Haz clic aquí»; en el carrito, vuelve a pulsar **Pedir por WhatsApp**. Si el navegador bloquea la ventana nueva, permítela en el candado de la barra de direcciones.
- **El carrito no se ve o parece trabado:** ciérralo con la X o Esc. Si el contador no coincide, recarga la página (el carrito se guarda en el navegador).
- **Pantalla en blanco:** verifica que usaste `npm run dev` y no abriste con doble clic el `index.html` de la raíz del proyecto. El de la carpeta `dist-demo/` sí se abre con doble clic.
- **El computador no deja correr `npm` o abrir puertos:** usa la carpeta `dist-demo/` (doble clic en `index.html`).
