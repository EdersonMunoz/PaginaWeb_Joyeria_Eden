# Backend · Joyería y Perfumería EDEN (Épica 1: productos · Sprint 2: cuentas · Sprint 3: carrito, compra y comprobante)

Node.js + Express + Oracle. El frontend (`../eden`) lo usa en `http://localhost:3001`.

```
backend/
├── servidor.js     arranca todo (una línea por página)
├── baseDatos.js    conexión a la base (ejecutar) y transacciones (enTransaccion)
├── sesion.js       tokens de sesión y permisos
├── validar.js      reglas de los campos del producto
├── validarCompra.js reglas de la compra: métodos de pago, dirección, cupón y cálculo del total  (Sprint 3)
├── pedidos.js      consultas de PEDIDO y DETALLE_PEDIDO; registra la compra en UNA transacción   (Sprint 3)
├── subirFoto.js    guarda la foto
├── rutas/          aquí trabaja cada integrante
│   ├── registrarProducto.js   HU1
│   ├── modificarProducto.js   HU2
│   ├── consultarCatalogo.js   HU3
│   ├── gestionarEstado.js     HU4
│   ├── autenticacion.js       Sprint 2 · registro, login y ajustes de cuenta
│   ├── procesarCompra.js      Sprint 3 · HU2 procesar compra (y validación de inventario de HU1)
│   └── consultarComprobante.js Sprint 3 · HU3 comprobante
├── db/             tablas y datos de prueba
│   ├── 00_usuario.sql   solo si usan Oracle XE instalado (con Docker no hace falta)
│   ├── 01_tablas.sql    tablas, secuencias y triggers
│   ├── 02_datos.sql     productos de prueba
│   ├── 06_migracion_sprint3_compras.sql   Sprint 3: tablas PEDIDO y DETALLE_PEDIDO (NO borra nada)
│   └── 07_migracion_cupones.sql           Sprint 3: tabla CUPON e índice de usos (NO borra nada)
├── pruebas/        pruebas automáticas (npm test)
├── fotos/          fotos que sube el admin
└── prueba.js       prueba automática de las 4 historias
```

## 1. Base de datos Oracle (una sola vez)

Con Docker Desktop abierto, en PowerShell:

```powershell
docker run -d --name eden-oracle -p 1522:1521 -e ORACLE_PASSWORD=admin123 -e APP_USER=eden -e APP_USER_PASSWORD=eden123 gvenzl/oracle-free:23-slim
docker logs -f eden-oracle      # esperar "DATABASE IS READY TO USE!" y salir con Ctrl+C
```

En SQL Developer, creen una conexión nueva:
usuario `eden`, clave `eden123`, host `localhost`, puerto `1522`, **nombre del servicio** `FREEPDB1`.
Abran y ejecuten como script (tecla **F5**), en este orden:
1. `db/01_tablas.sql`  ← **solo en una base nueva y vacía: borra las tablas que existan**
2. `db/02_datos.sql`
3. `db/06_migracion_sprint3_compras.sql`  ← Sprint 3 (pedidos)
4. `db/07_migracion_cupones.sql`  ← Sprint 3 (cupones; después de pedidos)

### Base que ya está funcionando (la de la nube o una local con datos): solo la migración

Para instalar el Sprint 3 en una base que ya tiene productos y usuarios **NO se ejecuta
`01_tablas.sql`** (borraría todo). Solo se ejecuta, una vez, conectado como `eden` y con F5:

- `db/06_migracion_sprint3_compras.sql`
- `db/07_migracion_cupones.sql`

La migración 06 crea `SEQ_PEDIDO`, `PEDIDO` y `DETALLE_PEDIDO`. La migración 07 crea `CUPON`,
el índice `IX_PEDIDO_CUPON` y los cupones de prueba si aún no existen. No borra ni modifica
`PEDIDO` ni `DETALLE_PEDIDO`; ambas migraciones se pueden volver a ejecutar (cada objeto se crea
solo si no existe).

Los otros días solo hay que encender el contenedor: `docker start eden-oracle`.

## 2. Encender el backend

```powershell
cd backend
npm install
copy .env.ejemplo .env
npm start
```

Debe decir **"Conectado a Oracle"** y **"Backend EDEN escuchando en http://localhost:3001"**.

Para comprobar las 4 historias, con el backend encendido, en otra terminal:

```powershell
cd backend
npm run prueba
```

La prueba crea productos con referencia `TST…`. Para borrarlos, en SQL Developer:
`DELETE FROM producto WHERE ref LIKE 'TST%'; COMMIT;`

## 3. Encender el frontend

```powershell
cd eden
npm install
npm run dev
```

Abrir `http://localhost:5173`. Si el backend está apagado, sale un aviso rojo abajo.

## Apagar todo
Ctrl+C en las terminales del frontend y del backend, y luego `docker stop eden-oracle`.

## Rutas de la API

| Historia | Método y ruta | Qué hace |
|---|---|---|
| HU3 | `GET /api/productos` | Lista productos. Filtros: `estado` (Activo por defecto, Inactivo, todos), `categoria`, `precioMin`, `precioMax`, `q` |
| HU3 | `GET /api/productos/:id` | Detalle de un producto |
| HU1 | `POST /api/productos` | Registra un producto (formulario con la foto en el campo `foto`) |
| HU2 | `GET /api/productos/referencia/:ref` | Busca un producto por su referencia |
| HU2 | `PUT /api/productos/:id` | Modifica un producto (foto nueva opcional) |
| HU4 | `PATCH /api/productos/:id/estado` | `{ "estado": "Activo" }` o `{ "estado": "Inactivo" }` |
| Sprint 2 | `POST /api/autenticacion/login`, `POST /api/autenticacion/registro`, `PUT /api/autenticacion/cuenta/:id`, `PATCH /api/autenticacion/cuenta/:id/desactivar` | Cuentas e inicio de sesión |
| HE3-HU2 | `POST /api/pedidos/cupon` | Requiere sesión; valida vigencia, uso por cuenta y límite global: `{ "codigo": "PROMO2026" }` → `{ "cupon": { "codigo", "porcentaje" } }` |
| HE3-HU1/HU2 | `POST /api/pedidos` | Requiere sesión; procesa la compra (pago simulado), descuenta el inventario y devuelve el comprobante |
| HE3-HU3 | `GET /api/pedidos/:numero` | Requiere sesión; vuelve a consultar el comprobante solo para su dueño |

## Sprint 3 · Carrito, compra y comprobante

El carrito sigue viviendo en la página (en memoria). El backend hace la validación definitiva
cuando el cliente pulsa **Pagar**.

### `POST /api/pedidos`

```json
{
  "articulos": [{ "productoId": 1, "cantidad": 2 }, { "productoId": 4, "cantidad": 4 }],
  "metodoPago": "Daviplata",
  "direccion": "Calle 10A Norte #25A-03",
  "codigoCupon": "PROMO2026",
  "idSolicitud": "3f2b8c1e-7a4d-4e9b-9c55-0d1e2f3a4b5c"
}
```

- Requiere `Authorization: Bearer <token>`. El pedido queda a nombre de la cuenta y los datos del
  cliente se leen de la tabla `USUARIO`. Sin token válido responde 401 (`Debes iniciar sesión`).
- El navegador solo decide **qué** compra y **cuánto**. Precio, subtotal, descuento, total, número
  de pedido, fecha y cliente los pone el backend; si llegan en el cuerpo, se ignoran.
- `codigoCupon` e `idSolicitud` son opcionales. `idSolicitud` evita que un doble clic cree dos pedidos.

Respuesta `201`:

```json
{
  "mensaje": "Pago exitoso, compra realizada.",
  "comprobante": {
    "numeroPedido": "ED-00000042",
    "fechaEmision": "2026-11-14T19:30:12.345Z",
    "estado": "Pagado",
    "cliente": { "nombre": "Ana Pérez", "identificacion": "123456789", "telefono": "3001234567", "correo": "ana@example.com" },
    "direccion": "Calle 10A Norte #25A-03",
    "metodoPago": "Daviplata",
    "codigoCupon": "PROMO2026",
    "porcentajeDescuento": 5,
    "articulos": [
      { "producto": { "id": 1, "ref": "ANI00001", "nombre": "Anillos Dualis Blue", "precio": 2450000 }, "cantidad": 2, "subtotal": 4900000 },
      { "producto": { "id": 4, "ref": "ARE00001", "nombre": "Pendientes Flora Celeste", "precio": 550000 }, "cantidad": 4, "subtotal": 2200000 }
    ],
    "totalProductos": 6,
    "subtotal": 7100000,
    "descuento": 355000,
    "total": 6745000
  },
  "inventario": [{ "id": 1, "stock": 8, "estado": "Activo" }, { "id": 4, "stock": 8, "estado": "Activo" }]
}
```

Errores (siempre `{ "mensaje", "codigo", ... }`):

| Estado | `codigo` | Cuándo |
|---|---|---|
| 400 | `CARRITO_VACIO`, `PRODUCTO_INVALIDO`, `CANTIDAD_INVALIDA` | Carrito vacío o cantidades que no son enteros mayores que cero |
| 400 | `DATOS_PAGO_INVALIDOS` + `errores: { metodo, direccion }` | Sin método de pago ("Ninguno" no vale) o dirección inválida |
| 400 | `CUPON_INVALIDO` + `errores: { cupon }` | El código no existe: «El cupón ingresado no es válido» |
| 400 | `CUPON_EXPIRADO` + `errores: { cupon }` | «El cupón ingresado ha expirado» |
| 400 | `CUPON_YA_UTILIZADO` + `errores: { cupon }` | «Ya has utilizado este cupón anteriormente» |
| 400 | `CUPON_LIMITE_SUPERADO` + `errores: { cupon }` | «Este cupón ya superó el límite de usos permitidos» |
| 401 / 403 | `Debes iniciar sesión` / `SESION_INVALIDA` / `CUENTA_INACTIVA` | Token ausente o inválido, cuenta borrada o inactiva |
| 409 | `STOCK_INSUFICIENTE`, `PRODUCTO_NO_DISPONIBLE` + `conflictos: [{ productoId, nombre, motivo, cantidadSolicitada, stockDisponible }]` | El inventario real no alcanza o el producto está inactivo / no existe |
| 409 | `SOLICITUD_REPETIDA` | El `idSolicitud` ya lo usó otra persona |
| 503 | `INVENTARIO_OCUPADO` | Otra compra tuvo bloqueado el producto más de 10 segundos |
| 500 | — | Error inesperado: `"Error interno del servidor"` (nunca se muestra el error de Oracle) |

### `GET /api/pedidos/:numero`

Requiere `Authorization: Bearer <token>` y devuelve `{ "comprobante": { ... } }` con la misma forma.
Solo responde al usuario dueño del pedido según su token; en cualquier otro caso responde 404
(no revela si el pedido existe).

### Cómo se protege el inventario

`pedidos.js` registra la compra con `enTransaccion()` de `baseDatos.js` (una sola conexión, sin
`autoCommit`):

1. `SELECT ... FOR UPDATE WAIT 10` de cada producto, siempre en orden de id → bloquea las filas y lee
   el precio y el stock reales. Otra compra del mismo producto espera aquí.
2. Si algo no alcanza o está inactivo → error 409 y `ROLLBACK`.
3. `INSERT` en `PEDIDO` (número de `SEQ_PEDIDO`, fecha `SYSTIMESTAMP`) y en `DETALLE_PEDIDO`
   (con la referencia, nombre y precio del momento).
4. `UPDATE producto SET stock = stock - :cantidad WHERE ... AND stock >= :cantidad` → si no actualiza
   exactamente una fila, `ROLLBACK`. Si el stock llega a 0, el trigger `TRG_PRODUCTO_SIN_STOCK`
   (Sprint 1) deja el producto Inactivo.
5. `COMMIT`. Cualquier error en cualquier paso deshace todo.

## Pruebas automáticas

```powershell
cd backend
npm test                 # todas (no necesitan Oracle ni el archivo .env)
node --test pruebas/HE3-S3.test.js     # solo las del Sprint 3
npm run prueba:oracle    # OPCIONAL: Sprint 3 contra el Oracle real (ver abajo)
```

`npm test` usa una base de datos falsa en memoria. La prueba `prueba:oracle` sí usa la base del
`.env` (con la migración ya aplicada): crea 2 productos `TS3…`, lanza compras simultáneas por la
última unidad, comprueba el rollback y el trigger, y al final borra solo lo que ella creó.
Úsenla en la base local de Docker o avisando al equipo si es la de la nube.

## Reglas que valida el backend
- Todos los campos son obligatorios; la foto es obligatoria al registrar.
- Precio mayor que 0 (acepta `$1.500.000`).
- Stock: mayor que 0 al registrar; 0 o más al modificar.
  Si un producto queda con stock 0, pasa a **Inactivo** automáticamente.
- No se puede activar un producto sin unidades disponibles.
- La referencia no se puede repetir.
- Compra (Sprint 3): cantidades enteras mayores que cero y no mayores al stock; solo productos
  activos; método de pago de la lista (9 bancos/billeteras); dirección de al menos 5 caracteres
  que no empiece por "Calle 0", "Carrera 0"...; cupón validado en `CUPON` y usos contados desde
  `PEDIDO` (por cuenta y globalmente). La vigencia incluye todo el día de `FECHA_VENCIMIENTO`;
  Oracle usa `SYSDATE`. El cupón válido aplica su porcentaje al subtotal, redondeado al peso
  (la mitad sube); total = subtotal − descuento.

## Si algo falla
- **"No se pudo conectar a Oracle"**: el contenedor está apagado (`docker start eden-oracle`) o el `.env` tiene otro puerto.
- **El puerto 1521 ya está ocupado** al crear el contenedor: por eso usamos `-p 1522:1521`.
- **Al pagar sale "Error interno del servidor"** y en la terminal del backend aparece
  `ORA-00942` o `ORA-02289`: falta ejecutar `db/06_migracion_sprint3_compras.sql`.
- **`npm install` falla**: revisen que están dentro de la carpeta `backend`.
- En Windows con OneDrive, usen `npm start` (no `npm run dev`) si el servidor se reinicia solo.
