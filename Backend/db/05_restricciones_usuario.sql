-- =============================================================
-- EDEN - Restricciones de unicidad para las cuentas de usuario
-- Ejecutar UNA sola vez en la base de datos de la nube.
-- Antes de continuar, revisar que estas consultas no devuelvan filas.
-- Si hay duplicados, corregirlos antes de aplicar las restricciones.
-- =============================================================

-- Identificaciones duplicadas
SELECT identificacion, COUNT(*) AS cantidad
  FROM usuario
 GROUP BY identificacion
HAVING COUNT(*) > 1;

-- Usuarios duplicados sin distinguir mayúsculas/minúsculas
SELECT LOWER(usuario) AS usuario_normalizado, COUNT(*) AS cantidad
  FROM usuario
 GROUP BY LOWER(usuario)
HAVING COUNT(*) > 1;

-- Correos duplicados sin distinguir mayúsculas/minúsculas
SELECT LOWER(correo) AS correo_normalizado, COUNT(*) AS cantidad
  FROM usuario
 GROUP BY LOWER(correo)
HAVING COUNT(*) > 1;

-- Crear las restricciones después de verificar y resolver los duplicados.
ALTER TABLE usuario
  ADD CONSTRAINT uq_usuario_identificacion UNIQUE (identificacion);

CREATE UNIQUE INDEX uq_usuario_nombre_ci ON usuario (LOWER(usuario));

CREATE UNIQUE INDEX uq_usuario_correo_ci ON usuario (LOWER(correo));

ALTER TABLE usuario MODIFY (password_hash VARCHAR2(255));
