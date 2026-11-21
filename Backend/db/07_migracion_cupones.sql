-- =============================================================
--  Joyería y Perfumería EDEN - Sprint 3 (Épica 3: cupones)
--  Migración ADITIVA: crea CUPON y el índice de consulta en PEDIDO.
--
--  * No borra ni modifica PEDIDO, DETALLE_PEDIDO ni sus datos.
--  * Se puede ejecutar más de una vez: crea cada objeto solo si no existe.
--  * Ejecutar conectado con el usuario de la aplicación (eden), después de
--    db/06_migracion_sprint3_compras.sql, como script (tecla F5).
-- =============================================================

-- -------------------------------------------------------------
--  CUPON: vigencia y límite global de usos
-- -------------------------------------------------------------
DECLARE
  cantidad NUMBER;
BEGIN
  SELECT COUNT(*) INTO cantidad FROM user_tables WHERE table_name = 'CUPON';
  IF cantidad = 0 THEN
    EXECUTE IMMEDIATE q'[
      CREATE TABLE cupon (
        codigo            VARCHAR2(20) NOT NULL,
        porcentaje        NUMBER(5,2)  NOT NULL,
        fecha_vencimiento DATE         NOT NULL,
        max_usos          NUMBER(10)   NOT NULL,
        CONSTRAINT pk_cupon PRIMARY KEY (codigo),
        CONSTRAINT ck_cupon_codigo_mayusculas CHECK (codigo = UPPER(codigo)),
        CONSTRAINT ck_cupon_porcentaje CHECK (porcentaje BETWEEN 1 AND 100),
        CONSTRAINT ck_cupon_max_usos CHECK (max_usos > 0 AND max_usos = TRUNC(max_usos))
      )]';
  END IF;
END;
/

-- Los usos se cuentan en PEDIDO por código; este índice evita recorrer
-- todos los pedidos al validar el límite global o el uso por cuenta.
DECLARE
  cantidad NUMBER;
BEGIN
  SELECT COUNT(*) INTO cantidad FROM user_indexes WHERE index_name = 'IX_PEDIDO_CUPON';
  IF cantidad = 0 THEN
    EXECUTE IMMEDIATE 'CREATE INDEX ix_pedido_cupon ON pedido (cupon)';
  END IF;
END;
/

-- -------------------------------------------------------------
--  Cupones de prueba: inserta solo si el código todavía no existe
-- -------------------------------------------------------------
DECLARE
  cantidad NUMBER;
BEGIN
  SELECT COUNT(*) INTO cantidad FROM cupon WHERE codigo = 'PROMO2026';
  IF cantidad = 0 THEN
    INSERT INTO cupon (codigo, porcentaje, fecha_vencimiento, max_usos)
    VALUES ('PROMO2026', 5, DATE '2027-12-31', 1000);
  END IF;
END;
/

DECLARE
  cantidad NUMBER;
BEGIN
  SELECT COUNT(*) INTO cantidad FROM cupon WHERE codigo = 'VENCIDO2025';
  IF cantidad = 0 THEN
    INSERT INTO cupon (codigo, porcentaje, fecha_vencimiento, max_usos)
    VALUES ('VENCIDO2025', 10, DATE '2025-12-31', 1000);
  END IF;
END;
/

DECLARE
  cantidad NUMBER;
BEGIN
  SELECT COUNT(*) INTO cantidad FROM cupon WHERE codigo = 'LIMITE1';
  IF cantidad = 0 THEN
    INSERT INTO cupon (codigo, porcentaje, fecha_vencimiento, max_usos)
    VALUES ('LIMITE1', 10, DATE '2027-12-31', 1);
  END IF;
END;
/

COMMIT;

SELECT codigo, porcentaje, fecha_vencimiento, max_usos
  FROM cupon
 WHERE codigo IN ('PROMO2026', 'VENCIDO2025', 'LIMITE1')
 ORDER BY codigo;
