# Pruebas funcionales · Sprint 3 · Iteración 1 (v1.2.0-rc.1)

Proyecto: Joyería y Perfumería Edén · Épica 3: Carrito de compras.

## Documentos

- [Casos de pruebas funcionales (Excel)](https://docs.google.com/spreadsheets/d/1t6f2k3e6pXa5Le3khM8oky7ss6lXj0UgijUoElXA-po/edit?usp=sharing)
- [Evidencias de pruebas funcionales (Word)](https://docs.google.com/document/d/1qo_2NgzlYxFLq5JSsb9UdqEtQhgNEFSSDBSKYWqcFxY/edit?usp=sharing)

## Resultado

Se ejecutaron 6 historias de usuario (HU1 a HU6), 16 escenarios y 48 casos de prueba: **43 aprobados (90 %) y 5 NOK (10 %)**.

**Criterio:** un caso es NOK cuando la respuesta del sistema no coincide con lo esperado y debe corregirse. Si la diferencia se acepta como viable para el proyecto, no se modifica la especificación: se deja escrita en observaciones y el caso queda aprobado.

| Historia | Casos | Aprobados | NOK |
|----------|------:|----------:|----:|
| HU1 Ver carrito | 6 | 6 | 0 |
| HU2 Agregar | 6 | 3 | 3 |
| HU3 Cantidades | 6 | 4 | 2 |
| HU4 Retirar | 3 | 3 | 0 |
| HU5 Cupón | 15 | 15 | 0 |
| HU6 Compra | 12 | 12 | 0 |
| **Total** | **48** | **43** | **5** |

## Hallazgos

Se registraron 6 hallazgos, detallados en la hoja "Reporte Total" del Excel. Ninguno bloquea la función principal.

| ID | Criticidad | Descripción | Casos | Estado |
|----|-----------|-------------|-------|--------|
| D-01 | Baja | El ícono del carrito no muestra el contador en Inicio ni en Ajustes de la cuenta. | Aprobado con observación: HU1-CA1-CP002 | Abierto |
| D-02 | Baja | La notificación al agregar desde el detalle aparece desplazada respecto al prototipo. | **NOK:** HU2-CA2-CP001, CP002, CP003 | Abierto |
| D-03 | Media | En el detalle se muestra «Stock máximo alcanzado» junto con «Se agregó el producto al carrito». | **NOK:** HU3-CA2-CP002, CP003 | Abierto |
| D-04 | Baja | Mensaje «Ingresa un código de cupón.» no definido en la historia ni en el prototipo. | Aprobado con observación: HU5-CA2-CP003 | Aceptado |
| D-05 | Baja | Textos de ayuda bajo los campos con error en el pago, que el prototipo no tiene. | Aprobado con observación: HU6-CA4-CP001, CP002, CP003 | Aceptado |
| D-06 | Baja | «Pagar» aparece deshabilitado con el carrito vacío; el prototipo lo muestra habilitado. | Aprobado con observación: HU1-CA2-CP001, CP002, CP003 | Aceptado |

D-04, D-05 y D-06 se aceptan porque son viables para el proyecto: ayudan al usuario o evitan acciones inválidas. No se modifica la especificación.

## Iteración 2

D-01, D-02 y D-03 ya se corrigieron en el código (v1.2.0-rc.2). Se repiten los 5 casos NOK (HU2-CA2-CP001, CP002, CP003 y HU3-CA2-CP002, CP003) y el caso HU1-CA1-CP002 (D-01). Después se inicia el Sprint 4 (v1.2.0).
