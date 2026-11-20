# Pruebas de seguridad y regresión de HE2

Estas pruebas verifican que continúen vigentes los arreglos de seguridad realizados para la HE2, incluidos el manejo de contraseñas, la sesión y la protección de rutas.
Son pruebas de regresión independientes: no forman parte del banco unitario PU001–PU025 ni del Excel.

## Backend — `pruebas/regresion-seguridad.test.js`

| Prueba | Qué verifica | Hallazgo |
|---|---|---|
| `REG-SEG-01 · (+) Las contraseñas iguales se guardan con scrypt y no se expone passwordHash` | Contraseñas idénticas se almacenan con hashes scrypt distintos y el login no expone `passwordHash`. | R-06 |
| `REG-SEG-02 · (+) El primer inicio de sesión migra el hash SHA-256 legado a scrypt` | El login convierte el hash SHA-256 legado a scrypt y permite iniciar sesión nuevamente. | R-06 |
| `REG-SEG-03 · (-) Actualizar una cuenta sin sesión devuelve 401 y no cambia los datos` | Una actualización sin token falla y conserva los datos de la cuenta. | R-01 |
| `REG-SEG-04 · (-) Un token firmado de otra cuenta no permite actualizarla` | El dueño de otro token no puede actualizar la cuenta y sus datos permanecen intactos. | R-01 |
| `REG-SEG-05 · (-) Desactivar una cuenta sin sesión devuelve 401 y sigue activa` | Desactivar sin token falla y la cuenta sigue activa. | R-02 |
| `REG-SEG-06 · (-) Un token firmado de otra cuenta no permite desactivarla` | El dueño de otro token no puede desactivar la cuenta. | R-02 |
| `REG-SEG-07 · (+) El token firmado del login permite actualizar la cuenta propia` | El token obtenido al iniciar sesión permite actualizar la propia cuenta. | R-01 |
| `REG-SEG-08 · (-) Un token manipulado se rechaza en las rutas de actualizar y desactivar cuenta` | El token manipulado recibe 401 en ambas rutas y no cambia la cuenta. | R-01, R-02 |

## Backend — `pruebas/seguridad-productos.test.js`

| Prueba | Qué verifica | Hallazgo |
|---|---|---|
| `HE2-S2-PU032 · Seguridad: registrar productos exige sesión y rol administrador` | Sin sesión, la ruta responde 401; con rol cliente, 403; y con rol administrador, registra el producto. | R-05 |

El nombre de esta prueba conserva el ID histórico HE2-S2-PU032; no pertenece al banco unitario PU001–PU025.

## Backend — `pruebas/autenticacion.test.js`

| Prueba | Qué verifica | Hallazgo |
|---|---|---|
| `registro, inicio de sesión y actualización conservan los datos del perfil` | El registro conserva datos del perfil y usa scrypt; el login devuelve los datos sin contraseña y la actualización conserva el hash existente. | R-06 |

## Frontend — `src/sesion.test.js`

| Prueba | Qué verifica | Hallazgo |
|---|---|---|
| `guarda y recupera usuario y token` | La sesión guarda y recupera el usuario y el token. | |
| `cerrar sesión borra usuario y token` | Cerrar sesión elimina usuario y token del almacén indicado. | R-04 |
| `cerrar sesión ignora un evento como argumento y borra usuario y token` | Un evento recibido como argumento no impide borrar usuario y token del almacenamiento local. | R-14 |
| `actualizar usuario conserva el token` | Actualizar el perfil conserva el token de sesión. | |
| `decide acceso según usuario y rol` | La decisión de acceso corresponde al usuario y al rol solicitado. | R-05 |

R-03 es un riesgo aceptado y no tiene prueba.

## Ejecución

Desde la raíz del repositorio:

(cd Backend && npm test)

(cd Frontend && npm test)
