# Pruebas unitarias · Épica 3 · Sprint 3

## Alcance

Pruebas unitarias de caja negra para la Épica 3 (Sprint 3): visualizar el estado del carrito (HE3-HU1), agregar producto (HE3-HU2), modificar cantidades (HE3-HU3), retirar productos (HE3-HU4), aplicar cupón (HE3-HU5) y procesar la compra (HE3-HU6). Los casos manuales y su mapeo están en [Casos_HE3-S3.md](Casos_HE3-S3.md).

## Cómo ejecutar

Las pruebas automáticas del proyecto se ejecutan desde la carpeta de cada parte:

```bash
cd Backend
npm test

cd ../Frontend
npm test
```

Los 20 casos de este Excel se ejecutaron en el navegador, con el frontend compilado y el backend del proyecto. El detalle de cada caso está en [Casos_HE3-S3.md](Casos_HE3-S3.md).

## Estado

- Iteración 1: 20 casos, 18 OK y 2 NOK.
  - **PU013** (pago sin método de pago): el método de pago llega preseleccionado (Daviplata) y la lista no tiene la opción «Ninguno», por lo que se puede pagar sin haber elegido un método.
  - **PU016** (dirección «hola mundo»): el sistema acepta la dirección. Solo revisa que tenga 5 caracteres o más y que la vía no sea 0.
- Iteración 2: pendiente. Se ejecutará sobre el código corregido.

## Límites de estas pruebas

La base de datos fue el Oracle simulado en memoria de `Backend/pruebas/ayudasCompras.js`, no un Oracle real. Estas pruebas no comprueban los bloqueos de filas, el trigger de stock ni la migración `Backend/db/06_migracion_sprint3_compras.sql`.

## Excel de referencia

- [Excel de pruebas unitarias · Iteración 1](https://docs.google.com/spreadsheets/d/1gT_d_7CfNVxbYUVyGnacO9tk7HS3Dr-bPltWbOT1sxg/edit?gid=22589911#gid=22589911)
