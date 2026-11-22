# Pruebas unitarias · Épica 3 · Sprint 3

## Alcance

La tabla de casos de pantalla contiene 32 pruebas unitarias de caja negra (HE3-S3-I1-PU001–PU032) para la Épica 3 (Sprint 3): visualizar el carrito (HE3-HU1), agregar productos (HE3-HU2), modificar cantidades (HE3-HU3), retirar productos (HE3-HU4), aplicar cupones (HE3-HU5) y procesar la compra (HE3-HU6). El detalle está en [Casos_HE3-S3.md](Casos_HE3-S3.md).

## Cómo ejecutar

Las pruebas automáticas del proyecto se ejecutan desde la carpeta de cada parte:

```bash
cd Backend
npm test

cd ../Frontend
npm test
```

## Estado

Ejecución previa (19/11/2026, antes de la revisión de la profesora y con la especificación anterior): 20 casos, 18 OK y 2 NOK (PU013 y PU016), ya corregidos en el código. [Excel de pruebas unitarias · ejecución previa](https://docs.google.com/spreadsheets/d/1gT_d_7CfNVxbYUVyGnacO9tk7HS3Dr-bPltWbOT1sxg/edit?gid=22589911#gid=22589911).

Iteración 1 (versión actual): pendiente de ejecutar sobre el código actual, con los 32 casos.

## Límites de estas pruebas

La base de datos usada por las pruebas automáticas fue el Oracle simulado en memoria de `Backend/pruebas/ayudasCompras.js`, no un Oracle real. No comprueba los bloqueos de filas, el trigger de stock ni las migraciones `Backend/db/06_migracion_sprint3_compras.sql` y `Backend/db/07_migracion_cupones.sql`, ni la vigencia de cupones, su uso por cuenta o el límite global de usos contra Oracle real.

Las pruebas automáticas HE3-S3-PU001–PU061 de `Backend/pruebas/HE3-S3.test.js` y las de `Frontend/src/carrito.test.js` son independientes de los casos de pantalla HE3-S3-I1-PU001–PU032. La tabla de [Casos_HE3-S3.md](Casos_HE3-S3.md) recoge únicamente estos últimos.
