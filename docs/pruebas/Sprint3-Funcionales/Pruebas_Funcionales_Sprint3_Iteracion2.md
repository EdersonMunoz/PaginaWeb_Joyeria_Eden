# Pruebas funcionales · Sprint 3 · Iteración 2 (v1.2.0-rc.2)

Proyecto: Joyería y Perfumería Edén · Épica 3: Carrito de compras.

## Documentos

- [Casos de pruebas funcionales (Excel)](https://docs.google.com/spreadsheets/d/1nwzYyM4rYp4ZOn_kTh7UrCys7Bv4zlzXbO0NrSkZh7U/edit?usp=sharing)
- [Evidencias de pruebas funcionales (Word)](https://docs.google.com/document/d/1xDT1Phyw8NnzcUgUhJukCmgy6OkEgYgMvaT1TBxYYiM/edit?usp=sharing)

## Resultado

Se repitieron 6 casos de prueba en 3 escenarios sobre la versión v1.2.0-rc.2, que incluye las correcciones de D-01, D-02 y D-03: **6 aprobados (100 %) y 0 NOK**.

| Historia | Escenario | Casos repetidos | Aprobados | NOK |
|----------|-----------|----------------:|----------:|----:|
| HU1 Ver carrito | CA1 | 1 (CP002) | 1 | 0 |
| HU2 Agregar | CA2 | 3 (CP001, CP002, CP003) | 3 | 0 |
| HU3 Cantidades | CA2 | 2 (CP002, CP003) | 2 | 0 |
| **Total** | | **6** | **6** | **0** |

## Hallazgos

| ID | Criticidad | Descripción | Casos | Estado |
|----|-----------|-------------|-------|--------|
| D-01 | Baja | El ícono del carrito no mostraba el contador en Inicio ni en Ajustes de la cuenta. | HU1-CA1-CP002 | Corregido |
| D-02 | Baja | La notificación al agregar desde el detalle aparecía desplazada respecto al prototipo. | HU2-CA2-CP001, CP002, CP003 | Corregido |
| D-03 | Media | En el detalle se mostraba «Stock máximo alcanzado» junto con «Se agregó el producto al carrito». | HU3-CA2-CP002, CP003 | Corregido |
| D-07 | Baja | Al agotarse el stock tras «Comprar», la notificación «Se agregó el producto al carrito» se superpone por un instante al aviso «Stock máximo alcanzado». No afecta el resultado: el carrito queda con 5 unidades. | Aprobado con observación: HU3-CA2-CP003 | Aceptado |

D-04, D-05 y D-06 se aceptaron en la iteración 1 y no se repiten. D-07 se acepta por ser viable para el proyecto (aviso breve, sin efecto en el resultado); no se modifica la especificación.

## Observaciones para el Sprint 4

- En el carrito, según el tamaño de la ventana, el botón «Pagar» queda fuera de la vista y hay que desplazarse para verlo. El prototipo es una pantalla estática y no representa el scroll. Se acepta como diferencia viable y no se modifican las especificaciones; se propone como mejora del Sprint 4 mantener el resumen de compra visible.

## Siguiente paso

Con las pruebas funcionales de la Épica 3 cerradas, se publica la versión v1.2.0 y se inicia el Sprint 4.
