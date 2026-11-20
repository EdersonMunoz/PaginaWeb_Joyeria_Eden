# Evidencias de pruebas funcionales · Épica 2 · Sprint 2 · Iteración 1

Proyecto: Joyería y Perfumería Edén · Épica 2: Gestión de cuentas de usuario.

Grupo de evaluación: Ederson Muñoz Caicedo.

Versión probada: rama `main` en el commit `bb06dc4`, que incluye el arreglo de `Frontend/src/api.js` (pull request #28).

Los documentos de evidencia (capturas de cada caso de prueba) pesan entre 11 y 94 MB, por lo que no se guardan en el repositorio. Están en Google Docs y se enlazan aquí y desde cada caso del Excel.

## Archivo de casos de prueba

- [Casos_Pruebas_Funcionales_Sprint2_HE2_v2 (Google Sheets)](https://docs.google.com/spreadsheets/d/1Yq634VSXyv0gVSeFYuSux8VZMpAU3b4lTSg3ToNmZ2g/edit?usp=sharing)

El Excel tiene una hoja por historia de usuario y la hoja **Reporte Total**, con el resumen de resultados, la gráfica de casos aprobados y reprobados y la tabla de hallazgos.

## Resultado general

| Escenarios | Casos de prueba | Aprobados | Reprobados | Sin ejecutar | % de aprobación |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 34 | 102 | 83 | 19 | 0 | 81,4 % |

## Evidencias por historia de usuario

| Historia de usuario | Casos | Aprobados | Reprobados | Evidencia |
|---|:---:|:---:|:---:|---|
| HE2-HU1-CA001 · Iniciar sesión (Cliente) | 12 | 9 | 3 | [HU1](https://docs.google.com/document/d/1vgIegXUiam7x0rW3EM5T9VYQeVT5IsXxLPXc29u5yuE/edit?usp=sharing) |
| HE2-HU2-CA002 · Iniciar sesión (Administrador) | 12 | 9 | 3 | [HU2](https://docs.google.com/document/d/1Iqz55xqWWrtCkJfmFge_YeqifwlbVKJIN5nXyNXDPh8/edit?usp=sharing) |
| HE2-HU3-CA003 · Registrar cuenta (Cliente) | 15 | 15 | 0 | [HU3](https://docs.google.com/document/d/1XjxRaIMhsZDc7ibw0MqzVwiZeyo2lKkYNKPGzWHuyZI/edit?usp=sharing) |
| HE2-HU4-CA004 · Registrar cuenta (Administrador) | 15 | 14 | 1 | [HU4](https://docs.google.com/document/d/1M6vlV9vgOH1SHg1uJk44aRYf0nX5XEE5qFE4pLBQ8yk/edit?usp=sharing) |
| HE2-HU5-CA005 · Actualizar la información de la cuenta (Cliente) | 12 | 6 | 6 | [HU5](https://docs.google.com/document/d/19LUeWyng9QR-JmHeQcioen2cvEmkYf4Ol1L3_FUU_nE/edit?usp=sharing) |
| HE2-HU6-CA006 · Actualizar la información de la cuenta (Administrador) | 12 | 6 | 6 | [HU6](https://docs.google.com/document/d/1Ge7KFbUpIu5hA2s88V5HP5GqYAPomUa2mYK6ii5NR7I/edit?usp=sharing) |
| HE2-HU7-CA007 · Desactivar cuenta (Cliente) | 9 | 9 | 0 | [HU7](https://docs.google.com/document/d/14mPy_z7IsGCYuTsSnbL8ZWtFEqIjsf76wGmI19yAX4k/edit?usp=sharing) |
| HE2-HU8-CA008 · Desactivar cuenta (Administrador) | 9 | 9 | 0 | [HU8](https://docs.google.com/document/d/1HpyJrlWOp-UYVRhlfX6dTjVRW1pCvpbktWM_0UImbq0/edit?usp=sharing) |
| HE2-HU9-CA009 · Cerrar sesión (Cliente) | 3 | 3 | 0 | [HU9](https://docs.google.com/document/d/12EB2Cxwa8R_xZ-xuATLNE5KxlJNldhd_Q_tKDk-hVeM/edit?usp=sharing) |
| HE2-HU10-CA010 · Cerrar sesión (Administrador) | 3 | 3 | 0 | [HU10](https://docs.google.com/document/d/1v3eiHxc85zzXwv8HPURRsNv3_7kgHSHtVGBAeFND50A/edit?usp=sharing) |

## Hallazgos principales

Todos los hallazgos son de criticidad baja; el detalle completo (12 hallazgos) está en la hoja **Reporte Total** del Excel.

- **Mensaje de campos vacíos en Iniciar sesión** (HU1-CA4, HU2-CA4): el texto no coincide con el definido en la historia.
- **Texto del botón en Ajustes de la cuenta** (HU5 y HU6, escenarios CA1 y CA2): el botón dice «Guardar» y la historia define «Actualizar». Se repetirán estos casos en la iteración 2, tras la corrección.
- **Registro de administrador** (HU4-CA5, CP003): el sistema recorta el espacio final del correo de confirmación y crea la cuenta; falta definir este comportamiento en la historia.
