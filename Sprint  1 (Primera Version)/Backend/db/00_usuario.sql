-- =============================================================
--  Joyería y Perfumería EDEN
--  Script 0: crear el usuario (esquema) de la aplicación
--  Ejecutar UNA SOLA VEZ conectado como SYSTEM (o SYS).
--  Si ya tienen un usuario para el proyecto, sáltense este script.
-- =============================================================

-- Oracle XE 21c usa el contenedor XEPDB1; Oracle Free 23ai usa FREEPDB1
ALTER SESSION SET CONTAINER = XEPDB1;

CREATE USER eden IDENTIFIED BY eden123
  DEFAULT TABLESPACE users
  QUOTA UNLIMITED ON users;

GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE TRIGGER TO eden;
