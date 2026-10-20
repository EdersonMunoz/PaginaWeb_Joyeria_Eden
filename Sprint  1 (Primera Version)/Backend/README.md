# Backend · Joyería y Perfumería EDEN (Épica 1: Gestión de productos)

Node.js + Express + Oracle. El frontend (`../eden`) lo usa en `http://localhost:3001`.

```
backend/
├── servidor.js     arranca todo (una línea por página)
├── baseDatos.js    conexión a la base
├── validar.js      reglas de los campos
├── subirFoto.js    guarda la foto
├── rutas/          aquí trabaja cada integrante
│   ├── registrarProducto.js   HU1
│   ├── modificarProducto.js   HU2
│   ├── consultarCatalogo.js   HU3
│   └── gestionarEstado.js     HU4
├── db/             tablas y datos de prueba
│   ├── 00_usuario.sql   solo si usan Oracle XE instalado (con Docker no hace falta)
│   ├── 01_tablas.sql    tablas, secuencias y triggers
│   └── 02_datos.sql     productos de prueba
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
1. `db/01_tablas.sql`
2. `db/02_datos.sql`

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

## Reglas que valida el backend
- Todos los campos son obligatorios; la foto es obligatoria al registrar.
- Precio mayor que 0 (acepta `$1.500.000`).
- Stock: mayor que 0 al registrar; 0 o más al modificar.
  Si un producto queda con stock 0, pasa a **Inactivo** automáticamente.
- No se puede activar un producto sin unidades disponibles.
- La referencia no se puede repetir.

## Si algo falla
- **"No se pudo conectar a Oracle"**: el contenedor está apagado (`docker start eden-oracle`) o el `.env` tiene otro puerto.
- **El puerto 1521 ya está ocupado** al crear el contenedor: por eso usamos `-p 1522:1521`.
- **`npm install` falla**: revisen que están dentro de la carpeta `backend`.
- En Windows con OneDrive, usen `npm start` (no `npm run dev`) si el servidor se reinicia solo.
