-- =============================================================
--  Joyería y Perfumería EDEN - Sprint 3 (Épica 3: carrito, compra y comprobante)
--  Migración ADITIVA: crea SEQ_PEDIDO y las tablas PEDIDO y DETALLE_PEDIDO.
--
--  * NO borra tablas, NO borra datos y NO modifica PRODUCTO, CATEGORIA ni USUARIO.
--  * Se puede ejecutar más de una vez: cada objeto se crea solo si todavía no existe.
--  * Sirve igual en la base compartida de Oracle Cloud y en un Oracle local.
--
--  Cómo ejecutarla: SQL Developer, conectado con el usuario de la aplicación (eden),
--  abrir este archivo y ejecutarlo como script (tecla F5).
--  Requisito: que ya existan PRODUCTO y USUARIO (01_tablas.sql / 04_usuarios_nube.sql).
--
--  OJO: para instalar el Sprint 3 NO se ejecuta 01_tablas.sql (ese script borra todo).
-- =============================================================

-- -------------------------------------------------------------
--  Número consecutivo del pedido (el backend arma "ED-00000001" con él)
-- -------------------------------------------------------------
DECLARE
  cantidad NUMBER;
BEGIN
  SELECT COUNT(*) INTO cantidad FROM user_sequences WHERE sequence_name = 'SEQ_PEDIDO';
  IF cantidad = 0 THEN
    EXECUTE IMMEDIATE 'CREATE SEQUENCE seq_pedido START WITH 1 INCREMENT BY 1 NOCACHE';
  END IF;
END;
/

-- -------------------------------------------------------------
--  PEDIDO (HU2 procesar compra, HU3 comprobante): una fila por compra
-- -------------------------------------------------------------
DECLARE
  cantidad NUMBER;
BEGIN
  SELECT COUNT(*) INTO cantidad FROM user_tables WHERE table_name = 'PEDIDO';
  IF cantidad = 0 THEN
    EXECUTE IMMEDIATE q'[
      CREATE TABLE pedido (
        id                     NUMBER(10)     NOT NULL,
        -- Número que ve el cliente en el comprobante: 'ED-' + id con 8 dígitos
        numero                 VARCHAR2(20)   NOT NULL,
        -- Fecha oficial de la compra: la pone Oracle (SYSTIMESTAMP), no el navegador
        fecha                  TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
        -- Cuenta que compró. NULL = compra como invitado (ruta pública /Inicio/Carrito)
        usuario_id             NUMBER(10),
        -- Fotografía de los datos del cliente en el momento de la compra:
        -- el comprobante no cambia si después edita su cuenta
        cliente_nombre         VARCHAR2(100),
        cliente_identificacion VARCHAR2(30),
        cliente_telefono       VARCHAR2(20),
        cliente_correo         VARCHAR2(150),
        direccion              VARCHAR2(300)  NOT NULL,
        metodo_pago            VARCHAR2(30)   NOT NULL,
        cupon                  VARCHAR2(20),
        porcentaje_descuento   NUMBER(5,2)    DEFAULT 0 NOT NULL,
        subtotal               NUMBER(14)     NOT NULL,
        descuento              NUMBER(14)     DEFAULT 0 NOT NULL,
        total                  NUMBER(14)     NOT NULL,
        -- El pago es simulado: todo pedido guardado es un pago exitoso
        estado                 VARCHAR2(10)   DEFAULT 'Pagado' NOT NULL,
        -- Solo pedidos de invitado: hash SHA-256 de la clave para volver a ver el comprobante
        clave_consulta_hash    VARCHAR2(64),
        -- Identificador que manda la página por cada intento de pago: al ser único,
        -- un doble clic o un reintento no crea dos pedidos
        id_solicitud           VARCHAR2(64),
        CONSTRAINT pk_pedido              PRIMARY KEY (id),
        CONSTRAINT uq_pedido_numero       UNIQUE (numero),
        CONSTRAINT uq_pedido_solicitud    UNIQUE (id_solicitud),
        CONSTRAINT fk_pedido_usuario      FOREIGN KEY (usuario_id) REFERENCES usuario (id),
        -- Igual que en PRODUCTO: Oracle no tiene ENUM, el CHECK limita los valores.
        -- Las vocales con tilde de "Itau Colombia" y "Banco de Bogota" se arman con UNISTR
        -- para que queden bien guardadas sin importar la codificacion con que se abra este archivo.
        CONSTRAINT ck_pedido_metodo_pago  CHECK (metodo_pago IN (
          'Bancolombia', 'Daviplata', 'Nequi', 'Ita]' || UNISTR('\00FA') || q'[ Colombia',
          'Banco de Bogot]' || UNISTR('\00E1') || q'[',
          'Banco AV Villas', 'Banco Falabella', 'Banco de Occidente', 'Banco Popular')),
        CONSTRAINT ck_pedido_estado       CHECK (estado IN ('Pagado')),
        CONSTRAINT ck_pedido_porcentaje   CHECK (porcentaje_descuento BETWEEN 0 AND 100),
        CONSTRAINT ck_pedido_subtotal     CHECK (subtotal > 0),
        CONSTRAINT ck_pedido_descuento    CHECK (descuento >= 0 AND descuento <= subtotal),
        -- Los tres valores guardados siempre cuadran
        CONSTRAINT ck_pedido_total        CHECK (total = subtotal - descuento)
      )]';
  END IF;
END;
/

-- Para listar rápido los pedidos de una cuenta
DECLARE
  cantidad NUMBER;
BEGIN
  SELECT COUNT(*) INTO cantidad FROM user_indexes WHERE index_name = 'IX_PEDIDO_USUARIO';
  IF cantidad = 0 THEN
    EXECUTE IMMEDIATE 'CREATE INDEX ix_pedido_usuario ON pedido (usuario_id)';
  END IF;
END;
/

-- -------------------------------------------------------------
--  DETALLE_PEDIDO: una fila por producto comprado.
--  Guarda la "fotografía" del producto (referencia, nombre y precio del momento):
--  el comprobante no cambia aunque después modifiquen el producto en el catálogo.
-- -------------------------------------------------------------
DECLARE
  cantidad NUMBER;
BEGIN
  SELECT COUNT(*) INTO cantidad FROM user_tables WHERE table_name = 'DETALLE_PEDIDO';
  IF cantidad = 0 THEN
    EXECUTE IMMEDIATE q'[
      CREATE TABLE detalle_pedido (
        id               NUMBER(12)     GENERATED BY DEFAULT AS IDENTITY,
        pedido_id        NUMBER(10)     NOT NULL,
        linea            NUMBER(4)      NOT NULL,
        producto_id      NUMBER(10)     NOT NULL,
        producto_ref     VARCHAR2(20)   NOT NULL,
        producto_nombre  VARCHAR2(120)  NOT NULL,
        precio_unitario  NUMBER(12)     NOT NULL,
        cantidad         NUMBER(8)      NOT NULL,
        subtotal         NUMBER(14)     NOT NULL,
        CONSTRAINT pk_detalle_pedido        PRIMARY KEY (id),
        CONSTRAINT fk_detalle_pedido        FOREIGN KEY (pedido_id) REFERENCES pedido (id),
        CONSTRAINT fk_detalle_producto      FOREIGN KEY (producto_id) REFERENCES producto (id),
        CONSTRAINT uq_detalle_linea         UNIQUE (pedido_id, linea),
        CONSTRAINT uq_detalle_producto      UNIQUE (pedido_id, producto_id),
        CONSTRAINT ck_detalle_precio        CHECK (precio_unitario > 0),
        CONSTRAINT ck_detalle_cantidad      CHECK (cantidad > 0),
        CONSTRAINT ck_detalle_subtotal      CHECK (subtotal = precio_unitario * cantidad)
      )]';
  END IF;
END;
/

-- Para consultar qué pedidos incluyen un producto
DECLARE
  cantidad NUMBER;
BEGIN
  SELECT COUNT(*) INTO cantidad FROM user_indexes WHERE index_name = 'IX_DETALLE_PRODUCTO';
  IF cantidad = 0 THEN
    EXECUTE IMMEDIATE 'CREATE INDEX ix_detalle_producto ON detalle_pedido (producto_id)';
  END IF;
END;
/

-- Para revisar (deben aparecer las dos tablas y la secuencia)
SELECT table_name FROM user_tables WHERE table_name IN ('PEDIDO', 'DETALLE_PEDIDO');
SELECT sequence_name FROM user_sequences WHERE sequence_name = 'SEQ_PEDIDO';
