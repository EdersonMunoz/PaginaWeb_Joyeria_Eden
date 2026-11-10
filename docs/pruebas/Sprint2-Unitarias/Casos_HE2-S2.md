# Casos de prueba HE2-S2

| ID | Descripción | Categoría | Evidencia |
|---|---|---|---|
| HE2-S2-PU001 | Inicio de sesión exitoso de un cliente con su nombre de usuario | Funcional | prueba automática |
| HE2-S2-PU002 | Inicio de sesión exitoso de un administrador con su correo (sin importar mayúsculas) | Funcional | prueba automática |
| HE2-S2-PU003 | Usuario no registrado | Funcional | prueba automática |
| HE2-S2-PU004 | Contraseña incorrecta | Funcional | prueba automática |
| HE2-S2-PU005 | Campos obligatorios vacíos al iniciar sesión | Funcional | prueba automática |
| HE2-S2-PU006 | Iniciar sesión con una cuenta Inactiva la vuelve a activar | Funcional | prueba automática |
| HE2-S2-PU007 | Registro exitoso: rol Cliente y la contraseña se guarda cifrada, no en texto | Funcional | prueba automática |
| HE2-S2-PU008 | Correo o nombre de usuario ya registrado | Funcional | prueba automática |
| HE2-S2-PU009 | Campos obligatorios vacíos al registrar | Funcional | prueba automática |
| HE2-S2-PU010 | Formato inválido: correo sin @ y contraseña de menos de 8 caracteres | Funcional | prueba automática |
| HE2-S2-PU011 | Registro de administrador: el usuario con el patrón especial "admin" recibe rol Administrador | Funcional | prueba automática |
| HE2-S2-PU012 | Actualizar datos sin cambiar la contraseña: se guardan los datos y la clave sigue igual | Funcional | prueba automática |
| HE2-S2-PU013 | Actualizar con un dato de formato incorrecto: se rechaza y no se guarda nada | Funcional | prueba automática |
| HE2-S2-PU014 | Actualizar con un correo que ya usa otra cuenta: se rechaza | Funcional | prueba automática |
| HE2-S2-PU015 | Desactivar la cuenta: queda Inactiva y no se borra | Funcional | prueba automática |
| HE2-S2-PU016 | Actualizar con un correo sin formato válido: se rechaza | Funcional | prueba automática |
| HE2-S2-PU017 | Registrar con un nombre de usuario con espacios y símbolos: se rechaza | Funcional | prueba automática |
| HE2-S2-PU018 | Registrar con un teléfono que contiene letras: se rechaza | Funcional | prueba automática |
| HE2-S2-PU019 | Actualizar una cuenta que no existe: no debe decir que se actualizó | Funcional | prueba automática |
| HE2-S2-PU020 | Desactivar una cuenta que no existe: no debe responder éxito | Funcional | prueba automática |
| HE2-S2-PU021 | Seguridad: actualizar una cuenta sin sesión devuelve 401 y no cambia los datos | Seguridad | prueba automática |
| HE2-S2-PU022 | Seguridad: actualizar una cuenta con el token de otra cuenta devuelve 403 y no cambia nada | Seguridad | prueba automática |
| HE2-S2-PU023 | Seguridad: desactivar una cuenta sin sesión devuelve 401 y sigue Activa | Seguridad | prueba automática |
| HE2-S2-PU024 | Seguridad: desactivar una cuenta con el token de otra cuenta devuelve 403 | Seguridad | prueba automática |
| HE2-S2-PU025 | Seguridad: el login devuelve token no vacío y permite actualizar la cuenta propia | Seguridad | prueba automática |
| HE2-S2-PU026 | Mejora: registrar una identificación ya usada devuelve 409, también si la cuenta está Inactiva | Mejora | prueba automática |
| HE2-S2-PU027 | Mejora: el usuario no distingue mayúsculas al registrarse y al iniciar sesión | Mejora | prueba automática |
| HE2-S2-PU028 | Funcional: rechazar una contraseña de solo espacios y aceptar una frase segura | Funcional | prueba automática |
| HE2-S2-PU029 | Funcional: actualizar con usuario con espacios o símbolos devuelve 400 y no se guarda | Funcional | prueba automática |
| HE2-S2-PU030 | Funcional: actualizar con teléfono con letras devuelve 400 y no se guarda | Funcional | prueba automática |
| HE2-S2-PU031 | Mejora: contraseñas iguales deben tener hashes distintos y no ser SHA-256 simple | Mejora | prueba automática |
| HE2-S2-PU032 | Seguridad: modificar productos sin token devuelve 401 y con token de cliente devuelve 403 | Seguridad | prueba automática (pendiente) |
