# Observaciones de implementación · Épica 2 · Sprint 2

Comportamientos de la aplicación que no están definidos en las historias de usuario ni en los prototipos, detectados en las pruebas funcionales de la Épica 2 (HE2). **No modifican las especificaciones**: se dejan registrados como observaciones de la implementación.

| Ref. | Qué hace la aplicación | Dónde se observó | Decisión |
|---|---|---|---|
| H-03 | Ignora los espacios al inicio y al final del correo antes de compararlo (por ejemplo, «Repetir correo electrónico» con un espacio al final se considera igual al correo). Es el comportamiento habitual en formularios web. | HE2-HU4-CA5 (CP003) | Se conserva. |
| H-07 y H-09 | Bajo los campos con error aparece un texto breve con el motivo (por ejemplo «Este campo es obligatorio», «Ingresa un correo válido», «Los correos no coinciden», «Campo obligatorio o valor inválido»). Los mensajes principales sí coinciden con las historias. | HE2-HU3-CA3, CA4, CA5 · HE2-HU4-CA4, CA5 · HE2-HU5-CA4 · HE2-HU6-CA4 | Se conservan (aprobado por el equipo). |
| H-11 | Al abrir una ruta protegida sin sesión iniciada, la aplicación redirige al módulo de inicio de sesión. | HE2-HU9-CA1 · HE2-HU10-CA1 | Se conserva. |
| H-10 | Al entrar a Ajustes de la cuenta desde el catálogo, la ruta se muestra como `Usuario\Ajustes_cuenta` (o `Admin\Ajustes_cuenta`) y no como `…\Catalogo\Ajustes_cuenta`. | HE2-HU7-CA1, CA3 · HE2-HU8-CA1, CA3 | **Pendiente:** consultar con la docente. |
| H-12 | Mejora: que el formulario de registro quede limpio tras un registro exitoso. | HE2-HU3-CA2 | **Implementada** junto con la corrección del mensaje de registro exitoso (H-08). |

## Notas
- Estas observaciones tienen criticidad **Baja**: no impiden ejecutar los escenarios ni cambian el resultado esperado.
- El detalle de cada hallazgo está en la hoja «Reporte Total» del archivo de casos de prueba funcionales.
