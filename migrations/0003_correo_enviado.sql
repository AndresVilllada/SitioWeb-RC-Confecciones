-- Migración 0003
-- Las cotizaciones se guardan siempre en la base y además se avisan por correo a la empresa.
-- Esta columna dice si ese aviso salió (1) o no (0): así, si el correo falla, en el panel se ve cuáles
-- cotizaciones hay que revisar a mano. Las filas anteriores quedan en 0 (nunca se avisaron por correo).
ALTER TABLE cotizaciones ADD COLUMN correo_enviado INTEGER NOT NULL DEFAULT 0 CHECK (correo_enviado IN (0, 1));
