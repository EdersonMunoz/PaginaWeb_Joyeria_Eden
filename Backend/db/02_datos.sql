-- =============================================================
--  Joyería y Perfumería EDEN - Épica 1 (productos) y Sprint 2 (cuentas)
--  Paso 2 de 3: datos de prueba (cuentas demo, categorías y productos)
--  Ejecutar conectado con el usuario de la aplicación (eden),
--  después de 01_tablas.sql. En SQL Developer: tecla F5.
-- =============================================================

-- Cuentas de prueba del Sprint 2 (el admin entra con usuario admin / clave admin1234)
INSERT INTO usuario
  (nombre, identificacion, telefono, correo, usuario, direccion, password_hash, rol, estado)
VALUES ('Usuario demo', '1000000001', '3000000001', 'demo@eden.com', 'demo',
        'Calle 10 # 5-20',
        'fc2a864d09aed808615a638e4736ff5af35facb474f28e290841fa5516ab8d66',
        'cliente', 'Activo');

INSERT INTO usuario
  (nombre, identificacion, telefono, correo, usuario, direccion, password_hash, rol, estado)
VALUES ('Administrador demo', '1000000002', '3000000002', 'admin@eden.com', 'admin',
        'Carrera 7 # 12-34',
        'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270',
        'admin', 'Activo');

-- Las 6 categorías del formulario y del filtro
INSERT INTO categoria (nombre) VALUES ('Perfumería');
INSERT INTO categoria (nombre) VALUES ('Aretes');
INSERT INTO categoria (nombre) VALUES ('Pulsos');
INSERT INTO categoria (nombre) VALUES ('Anillos');
INSERT INTO categoria (nombre) VALUES ('Cadenas');
INSERT INTO categoria (nombre) VALUES ('Brazalete');

-- Productos de prueba. La columna imagen tiene el nombre de la foto dentro del
-- bucket "eden-fotos"; las fotos se suben al bucket con el paso 3:  npm run fotos
INSERT INTO producto (ref, nombre, precio, categoria_id, stock, descripcion, imagen, estado)
VALUES ('ANI00001', 'Anillos Dualis Blue', 2450000,
        (SELECT id FROM categoria WHERE nombre = 'Anillos'), 10,
        'Anillos en plata con zafiros azules.', 'productos/AnillosAzules.jpg', 'Activo');

INSERT INTO producto (ref, nombre, precio, categoria_id, stock, descripcion, imagen, estado)
VALUES ('CAD00001', 'Collar Lumière de Amethyste', 2870000,
        (SELECT id FROM categoria WHERE nombre = 'Cadenas'), 8,
        'Collar con amatistas.', 'productos/CollarAmatista.jpg', 'Activo');

INSERT INTO producto (ref, nombre, precio, categoria_id, stock, descripcion, imagen, estado)
VALUES ('PER00001', 'Versace Bright Crystal', 409900,
        (SELECT id FROM categoria WHERE nombre = 'Perfumería'), 20,
        'Perfume Versace Bright Crystal.', 'productos/LocionVersaceRosada.jpg', 'Activo');

INSERT INTO producto (ref, nombre, precio, categoria_id, stock, descripcion, imagen, estado)
VALUES ('ARE00001', 'Pendientes Flora Celeste', 550000,
        (SELECT id FROM categoria WHERE nombre = 'Aretes'), 12,
        'Pendientes en plata de ley con baño de oro y gema central azulada.', 'productos/PendientesCelestes.jpg', 'Activo');

INSERT INTO producto (ref, nombre, precio, categoria_id, stock, descripcion, imagen, estado)
VALUES ('PER00002', 'Versace Eros Eau de Toilette', 364990,
        (SELECT id FROM categoria WHERE nombre = 'Perfumería'), 18,
        'Perfume Versace Eros Eau de Toilette.', 'productos/LocionVersace.jpg', 'Activo');

INSERT INTO producto (ref, nombre, precio, categoria_id, stock, descripcion, imagen, estado)
VALUES ('PER00003', 'Valentino Uomo Born in Roma', 789900,
        (SELECT id FROM categoria WHERE nombre = 'Perfumería'), 15,
        'Perfume Valentino Uomo Born in Roma.', 'productos/LocionValentino.jpg', 'Activo');

INSERT INTO producto (ref, nombre, precio, categoria_id, stock, descripcion, imagen, estado)
VALUES ('ANI00003', 'Anillo solitario Oro 18k', 300000,
        (SELECT id FROM categoria WHERE nombre = 'Anillos'), 24,
        'Anillo de compromiso en oro amarillo de 18K con engaste central de diamante.', 'productos/AnilloOro.jpeg', 'Activo');

INSERT INTO producto (ref, nombre, precio, categoria_id, stock, descripcion, imagen, estado)
VALUES ('ANI00004', 'Duo Legado Verde', 7950000,
        (SELECT id FROM categoria WHERE nombre = 'Anillos'), 5,
        'Duo de anillos con detalles en tonos verdes.', 'productos/AnillosAzules.jpg', 'Activo');

INSERT INTO producto (ref, nombre, precio, categoria_id, stock, descripcion, imagen, estado)
VALUES ('ANI00005', 'Anillo Solsticio Dorado', 6800000,
        (SELECT id FROM categoria WHERE nombre = 'Anillos'), 5,
        'Anillo dorado de diseño Solsticio.', 'productos/AnilloOro.jpeg', 'Activo');

COMMIT;

-- Para revisar
SELECT * FROM producto;
