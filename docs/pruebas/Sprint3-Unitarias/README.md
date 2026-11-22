# Pruebas unitarias · Épica 3 · Sprint 3

## Alcance

La tabla de casos de pantalla contiene 31 pruebas unitarias de caja negra (HE3-S3-I1-PU001–PU031) para la Épica 3 (Sprint 3): visualizar el carrito (HE3-HU1), agregar productos (HE3-HU2), modificar cantidades (HE3-HU3), retirar productos (HE3-HU4), aplicar cupones (HE3-HU5) y procesar la compra (HE3-HU6). El detalle está en [Casos_HE3-S3.md](Casos_HE3-S3.md).

## Cómo ejecutar

Las pruebas automáticas del proyecto se ejecutan desde la carpeta de cada parte:

```bash
cd Backend
npm test

cd ../Frontend
npm test
```

## Estado

| Iteración | Fecha | Casos | Resultado | Motivo | Excel |
|---|---|---|---|---|---|
| 1 | 18/11/2026 | 20 (PU001–PU020) | 18 OK, 2 NOK | Primera ejecución, sobre la especificación y el código anteriores. | [Excel · Iteración 1](https://docs.google.com/spreadsheets/d/1gT_d_7CfNVxbYUVyGnacO9tk7HS3Dr-bPltWbOT1sxg/edit?gid=22589911#gid=22589911) |
| 2 | 21/11/2026 | 31 (PU001–PU031) | 31 OK, 0 NOK | Ejecución sobre el código corregido, con las observaciones de la profesora aplicadas (cupones, miga de pan, renumeración de las historias a HU1–HU6) y el banco ampliado de 20 a 31 casos. | [Excel · Iteración 2](https://docs.google.com/spreadsheets/d/1o__4Gfn-6TWRNwCaI0YEUQb-fTBRzcM8oabvak6n3Lk/edit?gid=68337349#gid=68337349) |

### Defectos de la Iteración 1 (corregidos)

- **PU013** (pago sin método de pago): el método de pago llegaba preseleccionado (Daviplata) y la lista no tenía la opción «Ninguno», por lo que se podía pagar sin haber elegido un método. Corregido: ahora inicia en «Ninguno». Verificado en la Iteración 2 (PU013 y PU022).
- **PU016** (dirección «hola mundo»): el sistema aceptaba la dirección porque solo revisaba 5 caracteres o más y que la vía no fuera 0. Corregido: ahora se rechaza. Verificado en la Iteración 2 (PU014, PU016, PU017 y PU031).

En la Iteración 2 no se detectaron defectos, por lo que no hay una tercera iteración.

## Límites de estas pruebas

La base de datos usada por las pruebas automáticas fue el Oracle simulado en memoria de `Backend/pruebas/ayudasCompras.js`, no un Oracle real. No comprueba los bloqueos de filas, el trigger de stock ni las migraciones `Backend/db/06_migracion_sprint3_compras.sql` y `Backend/db/07_migracion_cupones.sql`, ni la vigencia de cupones, su uso por cuenta o el límite global de usos contra Oracle real.

Las pruebas automáticas HE3-S3-PU001–PU061 de `Backend/pruebas/HE3-S3.test.js` y las de `Frontend/src/carrito.test.js` son independientes de los casos de pantalla HE3-S3-I1-PU001–PU031. La tabla de [Casos_HE3-S3.md](Casos_HE3-S3.md) recoge únicamente estos últimos. El prefijo I1 identifica la familia de casos de pantalla, no la iteración en la que se ejecutaron.

## Excel de referencia

- [Iteración 1 · ejecución del 18/11/2026](https://docs.google.com/spreadsheets/d/1gT_d_7CfNVxbYUVyGnacO9tk7HS3Dr-bPltWbOT1sxg/edit?gid=22589911#gid=22589911)
- [Iteración 2 · ejecución del 21/11/2026 (versión actual)](https://docs.google.com/spreadsheets/d/1o__4Gfn-6TWRNwCaI0YEUQb-fTBRzcM8oabvak6n3Lk/edit?gid=68337349#gid=68337349)
