# Pruebas funcionales · Sprint 3 · Iteración 1 (v1.2.0-rc.1)

Proyecto: Joyería y Perfumería Edén · Épica 3: Carrito de compras.

## Documentos

- [Casos de pruebas funcionales (Excel)](https://docs.google.com/spreadsheets/d/1t6f2k3e6pXa5Le3khM8oky7ss6lXj0UgijUoElXA-po/edit?usp=sharing)
- [Evidencias de pruebas funcionales (Word)](https://docs.google.com/document/d/1qo_2NgzlYxFLq5JSsb9UdqEtQhgNEFSSDBSKYWqcFxY/edit?usp=sharing)

## Resultado

Se ejecutaron 6 historias de usuario (HU1 a HU6), 16 escenarios y 48 casos de prueba: **37 aprobados (77 %) y 11 NOK (23 %)**. La función principal respondió en todos los casos; los 11 NOK se marcaron porque la respuesta del sistema no coincide con el prototipo (Figma).

**Criterio:** un caso es NOK cuando no coincide con el prototipo o con la historia de usuario, aunque la función sirva. Si no existe prototipo ni historia para comparar, solo se registra un hallazgo y el caso queda aprobado.

| Historia | Casos | Aprobados | NOK |
|----------|------:|----------:|----:|
| HU1 Ver carrito | 6 | 3 | 3 |
| HU2 Agregar | 6 | 3 | 3 |
| HU3 Cantidades | 6 | 4 | 2 |
| HU4 Retirar | 3 | 3 | 0 |
| HU5 Cupón | 15 | 15 | 0 |
| HU6 Compra | 12 | 9 | 3 |
| **Total** | **48** | **37** | **11** |

## Hallazgos

Se registraron 6 hallazgos, detallados en la hoja "Reporte Total" del Excel. Ninguno bloquea la función principal.

| ID | Criticidad | Descripción | Casos | Estado |
|----|-----------|-------------|-------|--------|
| D-01 | Baja | El ícono del carrito no muestra el contador en Inicio ni en Ajustes de la cuenta. No hay prototipo de esas pantallas. | Aprobado con observación: HU1-CA1-CP002 | Abierto |
| D-02 | Baja | La notificación al agregar desde el detalle aparece desplazada respecto al prototipo. | **NOK:** HU2-CA2-CP001, CP002, CP003 | Abierto |
| D-03 | Media | En el detalle se muestra «Stock máximo alcanzado» junto con «Se agregó el producto al carrito». | **NOK:** HU3-CA2-CP002, CP003 | Abierto |
| D-04 | Baja | Mensaje «Ingresa un código de cupón.» no definido en la historia ni en el prototipo. | Aprobado con observación: HU5-CA2-CP003 | Por decidir |
| D-05 | Baja | Textos bajo los campos con error en el pago que el prototipo no tiene. | **NOK:** HU6-CA4-CP001, CP002, CP003 | Por decidir |
| D-06 | Baja | «Pagar» aparece deshabilitado con el carrito vacío; el prototipo lo muestra habilitado. | **NOK:** HU1-CA2-CP001, CP002, CP003 | Por decidir |

## Iteración 2

Se corrigen los hallazgos (v1.2.0-rc.2) y se repiten solo los 11 casos NOK. Los casos aprobados con observación (D-01 y D-04) se verifican junto con ellos. Después se inicia el Sprint 4 (v1.2.0).
