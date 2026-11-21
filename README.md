# 💎 Joyería y Perfumería Edén — Sitio Web Oficial

Bienvenidos al repositorio de **Joyería y Perfumería Edén**, el espacio digital diseñado para ofrecer una experiencia elegante, intuitiva y segura en la adquisición de piezas únicas de joyería.

## 🌟 Características Principales

* **Catálogo interactivo:** Navegación por colecciones (anillos, collares, pulseras, relojes).
* **Diseño Responsive:** Optimizado para dispositivos móviles, tablets y escritorio.
* **Carrito de compras:** Gestión sencilla de productos y cálculo de montos.
* **Formulario de contacto:** Atención personalizada para clientes y piezas a medida.
* **Gestión de usuarios:** Registro, edición y eliminación de cuentas, con interfaces separadas para usuario y administrador.
* **Gestión de productos:** Registro, modificación y eliminación de productos por parte del administrador.
* **Registro de ventas:** Generación de comprobante de compra.
* **Asesoría vía chat** para atención al cliente.

## 🛠️ Tecnologías Utilizadas

* **Frontend:** react
* **Backend:**  Node.js + Express
* **Base de Datos:** Oracle Database

## ⚙️ Funcionalidades del sistema

**Usuario / Administrador**
- Registrar usuario
- Eliminar usuario
- Modificar datos del usuario
- Asesorar vía chat al usuario
- Interfaz para usuario
- Interfaz para administrador

**Productos y ventas**
- Registrar producto
- Comprar producto
- Eliminar producto
- Modificar productos
- Añadir productos al carrito de compras
- Registrar ventas (comprobante)

## 🚀 Instalación, configuración y ejecución

Requisitos: Node.js 20 o superior y una base de datos Oracle (la compartida de Oracle Cloud o una local en Docker).

**1. Base de datos**

- Base nueva y vacía (Oracle local): ejecutar en SQL Developer, como el usuario `eden` y con F5,
  `Backend/db/01_tablas.sql`, `Backend/db/02_datos.sql` y `Backend/db/06_migracion_sprint3_compras.sql`.
- Base que ya tiene datos (la de la nube): **solo** `Backend/db/06_migracion_sprint3_compras.sql`.
  No borra nada. ⚠️ No ejecutar `01_tablas.sql` ahí: ese script borra las tablas.

**2. Backend** (puerto 3001)

```powershell
cd Backend
npm install
copy .env.ejemplo .env     # y completar los datos de la base (el .env nunca se sube a GitHub)
npm start
```

**3. Frontend** (puerto 5173)

```powershell
cd Frontend
npm install
npm run dev
```

**4. Pruebas**

```powershell
cd Backend;  npm test          # 160 pruebas, no necesitan Oracle
cd Frontend; npm test; npm run lint; npm run build
```

Más detalle en [`Backend/README.md`](Backend/README.md).

## 🛒 Sprint 3 · Carrito, compra y comprobante

Flujo: **Catálogo → Carrito → Procesar compra → Actualizar inventario → Registrar pedido → Comprobante.**

- El carrito se arma en la página; al pulsar **Pagar** el backend valida todo contra Oracle.
- Precios, descuento (cupón `PROMO2026`, 5 %), total, número de pedido y fecha los calcula el servidor.
- La compra se guarda en una sola transacción (pedido + detalle + inventario): o queda todo o no queda nada.
- El comprobante se muestra y se descarga (SVG) con los datos guardados en la base.
- La compra requiere una sesión iniciada y queda asociada a la cuenta autenticada.

## 👥 Equipo de desarrollo

| Integrante | Rol |
|---|---|
| Luis Fernando Becerra Fernández | Analista y Diseñador |
| Luis Miguel Solis Bolaños | Desarrollador |
| José David Gómez Cifuentes | Desarrollador |
| Ederson Muñoz Caicedo | Tester |
