-- =============================================================
--  Joyería y Perfumería EDEN - Épica 1: Gestión de productos
--  Script 1 de 2: creación de tablas (Oracle 12c o superior)
--  Ejecutar conectado con el usuario de la aplicación.
-- =============================================================

-- Si se vuelve a ejecutar, primero borra lo anterior
BEGIN EXECUTE IMMEDIATE 'DROP TABLE producto CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE categoria CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE seq_producto'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE seq_categoria'; EXCEPTION WHEN OTHERS THEN NULL; END;
/

-- -------------------------------------------------------------
--  CATEGORIA: las 6 categorías del formulario y del filtro
-- -------------------------------------------------------------
CREATE TABLE categoria (
  id      NUMBER(5)     NOT NULL,
  nombre  VARCHAR2(30)  NOT NULL,
  CONSTRAINT pk_categoria        PRIMARY KEY (id),
  CONSTRAINT uq_categoria_nombre UNIQUE (nombre)
);

CREATE SEQUENCE seq_categoria START WITH 1 INCREMENT BY 1 NOCACHE;

CREATE OR REPLACE TRIGGER trg_categoria_id
BEFORE INSERT ON categoria
FOR EACH ROW
WHEN (NEW.id IS NULL)
BEGIN
  SELECT seq_categoria.NEXTVAL INTO :NEW.id FROM dual;
END;
/

-- -------------------------------------------------------------
--  PRODUCTO (HU1 registrar, HU2 modificar, HU3 consultar,
--            HU4 inactivar / activar)
-- -------------------------------------------------------------
CREATE TABLE producto (
  id            NUMBER(10)      NOT NULL,
  ref           VARCHAR2(20)    NOT NULL,
  nombre        VARCHAR2(120)   NOT NULL,
  precio        NUMBER(12)      NOT NULL,
  categoria_id  NUMBER(5)       NOT NULL,
  stock         NUMBER(8)       NOT NULL,
  descripcion   VARCHAR2(1000)  NOT NULL,
  imagen        VARCHAR2(300)   NOT NULL,
  estado        VARCHAR2(8)     DEFAULT 'Activo' NOT NULL,
  CONSTRAINT pk_producto          PRIMARY KEY (id),
  CONSTRAINT uq_producto_ref      UNIQUE (ref),
  CONSTRAINT fk_producto_categoria FOREIGN KEY (categoria_id) REFERENCES categoria (id),
  CONSTRAINT ck_producto_precio   CHECK (precio > 0),
  CONSTRAINT ck_producto_stock    CHECK (stock >= 0),
  CONSTRAINT ck_producto_estado   CHECK (estado IN ('Activo', 'Inactivo'))
);

CREATE SEQUENCE seq_producto START WITH 1 INCREMENT BY 1 NOCACHE;

CREATE OR REPLACE TRIGGER trg_producto_id
BEFORE INSERT ON producto
FOR EACH ROW
WHEN (NEW.id IS NULL)
BEGIN
  SELECT seq_producto.NEXTVAL INTO :NEW.id FROM dual;
END;
/

-- Regla del negocio: un producto sin unidades no puede quedar activo
-- (HU4, escenario 3 y HU2 cuando el stock queda en 0)
CREATE OR REPLACE TRIGGER trg_producto_sin_stock
BEFORE INSERT OR UPDATE ON producto
FOR EACH ROW
BEGIN
  IF :NEW.stock <= 0 THEN
    :NEW.estado := 'Inactivo';
  END IF;
END;
/
