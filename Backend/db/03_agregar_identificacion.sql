-- Agrega los datos personales que faltan a instalaciones existentes sin borrar cuentas.
-- SOLO para bases locales creadas antes de estas columnas. En la base de la nube NO hace falta.
DECLARE
  cantidad NUMBER;
BEGIN
  SELECT COUNT(*) INTO cantidad
    FROM user_tab_columns
   WHERE table_name = 'USUARIO' AND column_name = 'IDENTIFICACION';
  IF cantidad = 0 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE usuario ADD (identificacion VARCHAR2(30))';
  END IF;

  SELECT COUNT(*) INTO cantidad
    FROM user_tab_columns
   WHERE table_name = 'USUARIO' AND column_name = 'TELEFONO';
  IF cantidad = 0 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE usuario ADD (telefono VARCHAR2(20))';
  END IF;

  SELECT COUNT(*) INTO cantidad
    FROM user_tab_columns
   WHERE table_name = 'USUARIO' AND column_name = 'DIRECCION';
  IF cantidad = 0 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE usuario ADD (direccion VARCHAR2(300))';
  END IF;
END;
/
