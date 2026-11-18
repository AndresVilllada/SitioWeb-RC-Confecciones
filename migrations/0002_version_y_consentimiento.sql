-- Migración 0002
--  1) Versión del contenido: evita que dos administradores se pisen sin darse cuenta.
--     Cada guardado del panel sube la versión en 1; si alguien guarda con una versión vieja, se rechaza.
--  2) Consentimiento: guarda CUÁNDO aceptó el cliente el tratamiento de datos (Ley 1581 de 2012).

CREATE TABLE contenido_version (
  id          INTEGER PRIMARY KEY CHECK (id = 1),     -- una sola fila
  version     INTEGER NOT NULL,                        -- NOT NULL a propósito: ver servidor/datos.js (guardia de versión)
  actualizado TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO contenido_version (id, version) VALUES (1, 1);

-- NULL = cotización anterior a esta migración (no se sabe); las nuevas siempre la traen.
ALTER TABLE cotizaciones ADD COLUMN acepto_datos_en TEXT;
