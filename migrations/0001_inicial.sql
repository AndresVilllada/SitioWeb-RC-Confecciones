-- =====================================================================
-- RC Confecciones: migración 0001, esquema inicial (SQLite / Cloudflare D1)
-- Se aplica con:  npm run api:crear-tablas   (local)   |   npm run nube:tablas   (base real)
-- NO se edita una migración ya aplicada: los cambios van en un archivo nuevo (0003_..., ver docs/BACKEND.md).
-- Convención: tablas y columnas en español, sin tildes.
-- Fechas: "creado" en UTC (texto AAAA-MM-DD HH:MM:SS); sesiones e intentos usan segundos Unix.
-- =====================================================================

-- ---------- Seguridad ----------
CREATE TABLE IF NOT EXISTS administradores (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre  TEXT NOT NULL,
  correo  TEXT NOT NULL UNIQUE,             -- siempre en minúsculas
  clave   TEXT NOT NULL,                    -- pbkdf2-sha256$iteraciones$sal$hash (nunca la clave en claro)
  creado  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sesiones (
  id        TEXT PRIMARY KEY,               -- SHA-256 del token (el token real solo vive en la cookie)
  admin_id  INTEGER NOT NULL REFERENCES administradores(id) ON DELETE CASCADE,
  expira    INTEGER NOT NULL,               -- segundos Unix
  creado    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sesiones_expira ON sesiones(expira);

-- Registro de intentos para limitar abusos (inicios de sesión fallidos, envíos repetidos)
CREATE TABLE IF NOT EXISTS intentos (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo    TEXT NOT NULL,                    -- login-correo | login-ip | registro-ip | cotizacion-ip | pedido-ip
  clave   TEXT NOT NULL,                    -- correo o IP
  creado  INTEGER NOT NULL                  -- segundos Unix
);
CREATE INDEX IF NOT EXISTS idx_intentos ON intentos(tipo, clave, creado);

-- ---------- Contenido editable desde el panel ----------
CREATE TABLE IF NOT EXISTS productos (
  id           TEXT PRIMARY KEY,
  nombre       TEXT NOT NULL,
  descripcion  TEXT NOT NULL DEFAULT '',
  precio       INTEGER CHECK (precio IS NULL OR precio >= 0),   -- NULL = "Precio por definir"
  orden        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS servicios (
  id      TEXT PRIMARY KEY,
  titulo  TEXT NOT NULL,
  texto   TEXT NOT NULL DEFAULT '',
  orden   INTEGER NOT NULL
);

-- Fotos subidas desde el panel. La imagen se guarda en base64 (texto) para que funcione igual
-- en el computador y en Cloudflare. El id es el hash de la imagen: la misma foto no se duplica.
CREATE TABLE IF NOT EXISTS fotos (
  id         TEXT PRIMARY KEY,              -- 32 caracteres hexadecimales
  mime       TEXT NOT NULL CHECK (mime IN ('image/jpeg', 'image/png', 'image/webp')),
  datos_b64  TEXT NOT NULL,
  bytes      INTEGER NOT NULL,
  creado     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Rutas de fotos de cada producto / servicio / la galería. Una ruta puede ser:
--   imagenes/carpeta/foto.jpeg   (archivo que viene con el sitio)
--   /api/fotos/<id>              (foto subida desde el panel, guardada en la tabla fotos)
CREATE TABLE IF NOT EXISTS producto_fotos (
  producto_id  TEXT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  orden        INTEGER NOT NULL,
  ruta         TEXT NOT NULL,
  PRIMARY KEY (producto_id, orden)
);

CREATE TABLE IF NOT EXISTS servicio_fotos (
  servicio_id  TEXT NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
  orden        INTEGER NOT NULL,
  ruta         TEXT NOT NULL,
  PRIMARY KEY (servicio_id, orden)
);

CREATE TABLE IF NOT EXISTS galeria (
  orden  INTEGER PRIMARY KEY,
  ruta   TEXT NOT NULL
);

-- Una sola fila (id = 1)
CREATE TABLE IF NOT EXISTS contacto (
  id         INTEGER PRIMARY KEY CHECK (id = 1),
  whatsapp   TEXT NOT NULL DEFAULT '',
  instagram  TEXT NOT NULL DEFAULT '',
  correo     TEXT NOT NULL DEFAULT '',
  ubicacion  TEXT NOT NULL DEFAULT ''
);

-- ---------- Lo que envían los clientes ----------
CREATE TABLE IF NOT EXISTS cotizaciones (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  creado         TEXT NOT NULL DEFAULT (datetime('now')),
  estado         TEXT NOT NULL DEFAULT 'nueva' CHECK (estado IN ('nueva', 'contactada', 'cerrada', 'descartada')),
  nombre         TEXT NOT NULL,
  organizacion   TEXT NOT NULL DEFAULT '',
  correo         TEXT NOT NULL,
  telefono       TEXT NOT NULL,
  tipo_cliente   TEXT NOT NULL CHECK (tipo_cliente IN ('empresa', 'club', 'restaurante', 'otro')),
  prenda         TEXT NOT NULL,
  cantidad       INTEGER NOT NULL CHECK (cantidad BETWEEN 1 AND 10000),
  fecha_requerida TEXT,                                     -- AAAA-MM-DD o NULL
  tiene_diseno   TEXT NOT NULL DEFAULT 'no' CHECK (tiene_diseno IN ('si', 'no')),
  mensaje        TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado ON cotizaciones(estado, id);

CREATE TABLE IF NOT EXISTS pedidos (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  creado  TEXT NOT NULL DEFAULT (datetime('now')),
  estado  TEXT NOT NULL DEFAULT 'nuevo' CHECK (estado IN ('nuevo', 'confirmado', 'entregado', 'cancelado')),
  total   INTEGER                                           -- NULL si algún producto no tenía precio
);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado, id);

-- Cada ítem guarda una "foto" del nombre y el precio del momento del pedido.
-- producto_id NO tiene llave foránea: si el producto se borra, el pedido histórico se conserva.
CREATE TABLE IF NOT EXISTS pedido_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id    INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id  TEXT NOT NULL,
  nombre       TEXT NOT NULL,
  precio       INTEGER,
  cantidad     INTEGER NOT NULL CHECK (cantidad BETWEEN 1 AND 99)
);
CREATE INDEX IF NOT EXISTS idx_items_pedido ON pedido_items(pedido_id);
