-- =============================================================
--  Joyería y Perfumería EDEN
--  Paso 0 (Oracle Cloud): crear el usuario (esquema) de la aplicación
--  Ejecutar UNA SOLA VEZ como ADMIN, en la consola de Oracle Cloud:
--  Autonomous Database "eden" -> Database actions -> SQL.
--  Cambien la contraseña: mínimo 12 caracteres, con mayúscula,
--  minúscula y número (en la nube no sirve "eden123").
-- =============================================================
CREATE USER eden IDENTIFIED BY "TU_CLAVE_AQUI";

GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE TRIGGER TO eden;

-- En Autonomous Database el espacio de almacenamiento se llama DATA
ALTER USER eden QUOTA UNLIMITED ON DATA;
