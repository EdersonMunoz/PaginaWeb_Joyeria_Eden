// Pruebas unitarias · HE2 Cuentas de usuario · Sprint 2  (23 casos: HE2-S2-PU001 ... PU023)
// Cada test lleva el ID del caso y el escenario del Excel "Especificaciones segundo sprint"
// (HE2-HU1 a HU6), así el resultado de `npm test` se puede copiar a la columna "Resultado real".
//
// Cómo funcionan (patrón AAA):
//   Arrange: se prepara una tabla USUARIO falsa en memoria (no usa Oracle) y los datos del caso.
//   Act:     se llama al backend (las rutas de /api/autenticacion).
//   Assert:  se compara con el "Resultado esperado" del Excel.
// Un test que FALLA = un defecto real del código (el caso queda NOK).
//
// Ejecutar solo este archivo:  node --test pruebas/HE2-S2.test.js
import { createHash } from "node:crypto";
import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { crearApp } from "../servidor.js";
import { usarEjecutorDePrueba } from "../baseDatos.js";

// ---------------------------------------------------------------
// Tabla USUARIO falsa en memoria (hace lo mismo que Oracle para estas consultas)
// ---------------------------------------------------------------
const hash = (clave) => createHash("sha256").update(clave, "utf8").digest("hex");
let cuentas = [];
let siguienteId = 1;

const cuentaBase = (extra = {}) => ({
  id: siguienteId++,
  nombre: "Ana Pérez",
  identificacion: "123456789",
  telefono: "3001234567",
  correo: "ana@example.com",
  usuario: "anaperez",
  direccion: "Calle 10 # 5-20",
  passwordHash: hash("EdenPrueba123"),
  rol: "cliente",
  estado: "Activo",
  ...extra,
});
const agregarCuenta = (extra) => {
  const cuenta = cuentaBase(extra);
  cuentas.push(cuenta);
  return cuenta;
};

// Oracle responde con el error ORA-00001 cuando se repite un valor UNIQUE (correo o usuario)
const errorDuplicado = () => Object.assign(new Error("ORA-00001"), { errorNum: 1 });

function instalarBaseFalsa() {
  usarEjecutorDePrueba(async (sql, datos) => {
    if (sql.includes("INSERT INTO usuario")) {
      const repetida = cuentas.some(
        (c) =>
          c.correo.toLowerCase() === datos.correo.toLowerCase() ||
          c.usuario.toLowerCase() === datos.usuario.toLowerCase() ||
          c.identificacion === datos.identificacion,
      );
      if (repetida) throw errorDuplicado();
      cuentas.push(cuentaBase(datos));
      return { filas: [], afectadas: 1 };
    }
    if (sql.includes("WHERE LOWER(correo)")) {
      const buscado = datos.identificador.toLowerCase();
      const cuenta = cuentas.find((c) => c.correo.toLowerCase() === buscado || c.usuario.toLowerCase() === buscado);
      return { filas: cuenta ? [{ ...cuenta }] : [], afectadas: 0 };
    }
    if (sql.includes("SET nombre")) {
      const cuenta = cuentas.find((c) => c.id === datos.id);
      if (!cuenta) return { filas: [], afectadas: 0 };
      const repetida = cuentas.some(
        (c) =>
          c.id !== datos.id &&
          (c.correo.toLowerCase() === datos.correo.toLowerCase() ||
            c.usuario.toLowerCase() === datos.usuario.toLowerCase() ||
            c.identificacion === datos.identificacion),
      );
      if (repetida) throw errorDuplicado();
      Object.assign(cuenta, datos);
      return { filas: [], afectadas: 1 };
    }
    if (sql.includes("SET estado")) {
      // El login reactiva con el literal 'Activo'; desactivar usa 'Inactivo'; el PATCH /estado manda :estado
      const cuenta = cuentas.find((c) => c.id === datos.id);
      if (!cuenta) return { filas: [], afectadas: 0 };
      cuenta.estado = sql.includes("'Activo'") ? "Activo" : sql.includes("'Inactivo'") ? "Inactivo" : datos.estado;
      return { filas: [], afectadas: 1 };
    }
    throw new Error(`Consulta no prevista en la prueba: ${sql}`);
  });
}

// ---------------------------------------------------------------
// Servidor de prueba en un puerto libre (nunca usa el 3001)
// ---------------------------------------------------------------
let servidor;
let API;

before(async () => {
  instalarBaseFalsa();
  await new Promise((listo) => {
    servidor = crearApp().listen(0, "127.0.0.1", listo);
  });
  API = `http://127.0.0.1:${servidor.address().port}/api/autenticacion`;
});
after(async () => {
  await new Promise((listo) => servidor.close(listo));
});
beforeEach(() => {
  cuentas = [];
  siguienteId = 1;
});

async function pedir(ruta, metodo, cuerpo, cabeceras = {}) {
  const respuesta = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers: { "Content-Type": "application/json", ...cabeceras },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  return { estado: respuesta.status, cuerpo: await respuesta.json() };
}
const iniciarSesion = (identificador, password) => pedir("/login", "POST", { identificador, password });
const registrar = (campos) => pedir("/registro", "POST", { ...datosRegistro, ...campos });

// Datos válidos para registrar una cuenta (HE2-HU3 y HU4)
const datosRegistro = {
  nombre: "Carlos Gómez",
  identificacion: "1061234567",
  telefono: "3109876543",
  usuario: "carlosgomez",
  correo: "carlos@example.com",
  direccion: "Carrera 7 # 12-34",
  password: "ClaveSegura123",
};

// ===============================================================
// HE2-HU1 y HU2 · Iniciar sesión (cliente y administrador)
// ===============================================================
describe("1 · Iniciar sesión", () => {
  test("HE2-S2-PU001 · (+) Inicio de sesión exitoso de un cliente con su nombre de usuario", async () => {
    agregarCuenta();
    const r = await iniciarSesion("anaperez", "EdenPrueba123");
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.usuario.rol, "cliente");
    assert.equal(r.cuerpo.usuario.correo, "ana@example.com");
    assert.equal("passwordHash" in r.cuerpo.usuario, false, "nunca debe devolver la contraseña al navegador");
  });

  test("HE2-S2-PU002 · (+) Inicio de sesión exitoso de un administrador con su correo (sin importar mayúsculas)", async () => {
    agregarCuenta({ correo: "admin@eden.com", usuario: "admin", rol: "admin", passwordHash: hash("admin1234") });
    const r = await iniciarSesion("ADMIN@Eden.com", "admin1234");
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.usuario.rol, "admin");
  });

  test("HE2-S2-PU003 · (-) Usuario no registrado", async () => {
    const r = await iniciarSesion("nadie@example.com", "cualquiera123");
    assert.equal(r.estado, 404);
    assert.equal(r.cuerpo.mensaje, "Las credenciales ingresadas no corresponden a ninguna cuenta");
  });

  test("HE2-S2-PU004 · (-) Contraseña incorrecta", async () => {
    agregarCuenta();
    const r = await iniciarSesion("anaperez", "OtraClave999");
    assert.equal(r.estado, 401);
    assert.equal(r.cuerpo.mensaje, "Correo/Nombre usuario o contraseña incorrectos, vuelve a intentarlo");
  });

  test("HE2-S2-PU005 · (-) Campos obligatorios vacíos al iniciar sesión", async () => {
    const r = await iniciarSesion("", "");
    assert.equal(r.estado, 400);
    assert.match(r.cuerpo.mensaje, /obligatorios/);
  });

  test("HE2-S2-PU006 · (+) Iniciar sesión con una cuenta Inactiva la vuelve a activar", async () => {
    const cuenta = agregarCuenta({ estado: "Inactivo" });
    const r = await iniciarSesion("anaperez", "EdenPrueba123");
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.usuario.estado, "Activo");
    assert.equal(cuentas.find((c) => c.id === cuenta.id).estado, "Activo", "debe quedar activa en la base");
  });
});

// ===============================================================
// HE2-HU3 y HU4 · Registrar cuenta (cliente y administrador)
// ===============================================================
describe("2 · Registrar cuenta", () => {
  test("HE2-S2-PU007 · (+) Registro exitoso: rol Cliente y la contraseña se guarda cifrada, no en texto", async () => {
    const r = await registrar({});
    assert.equal(r.estado, 201);
    assert.equal(r.cuerpo.mensaje, "Se registro la cuenta con exito");
    assert.equal(cuentas.length, 1);
    assert.equal(cuentas[0].rol, "cliente");
    assert.notEqual(cuentas[0].passwordHash, datosRegistro.password, "la contraseña no debe guardarse en texto plano");
    assert.equal(cuentas[0].passwordHash, hash(datosRegistro.password));
  });

  test("HE2-S2-PU008 · (-) Correo o nombre de usuario ya registrado", async () => {
    agregarCuenta({ correo: "carlos@example.com" });
    const r = await registrar({});
    assert.equal(r.estado, 409);
    assert.equal(r.cuerpo.mensaje, "El correo, nombre de usuario o identificación ya está registrado");
    assert.equal(cuentas.length, 1, "no debe crear una segunda cuenta");
  });

  test("HE2-S2-PU009 · (-) Campos obligatorios vacíos al registrar", async () => {
    const r = await registrar({ nombre: "   ", direccion: "" });
    assert.equal(r.estado, 400);
    assert.equal(r.cuerpo.mensaje, "Por favor, complete todos los campos obligatorios");
    assert.equal(cuentas.length, 0, "no debe guardar nada");
  });

  test("HE2-S2-PU010 · (-) Formato inválido: correo sin @ y contraseña de menos de 8 caracteres", async () => {
    const correoMalo = await registrar({ correo: "carlos.example.com" });
    assert.equal(correoMalo.estado, 400);
    assert.equal(correoMalo.cuerpo.mensaje, "Uno o más campos no cuentan con el formato adecuado");

    const claveCorta = await registrar({ password: "abc1234" });
    assert.equal(claveCorta.estado, 400);
    assert.equal(claveCorta.cuerpo.mensaje, "Uno o más campos no cuentan con el formato adecuado");
    assert.equal(cuentas.length, 0);
  });

  test("HE2-S2-PU011 · (+) Registro de administrador: el usuario con el patrón especial \"admin\" recibe rol Administrador", async () => {
    const r = await registrar({ usuario: "admin.carlos" });
    assert.equal(r.estado, 201);
    assert.equal(cuentas[0].rol, "admin");
  });
});

// ===============================================================
// HE2-HU5 y HU6 · Actualizar y desactivar la cuenta
// ===============================================================
describe("3 · Ajustes de la cuenta", () => {
  test("HE2-S2-PU012 · (+) Actualizar datos sin cambiar la contraseña: se guardan los datos y la clave sigue igual", async () => {
    const cuenta = agregarCuenta();
    const clave = cuenta.passwordHash;
    const r = await pedir(`/cuenta/${cuenta.id}`, "PUT", {
      nombre: "Ana María Pérez",
      identificacion: "123456789",
      telefono: "3117654321",
      usuario: "anaperez",
      correo: "ana@example.com",
      direccion: "Carrera 7 # 12-34",
    });
    assert.equal(r.estado, 200);
    assert.equal(cuentas[0].nombre, "Ana María Pérez");
    assert.equal(cuentas[0].telefono, "3117654321");
    assert.equal(cuentas[0].passwordHash, clave, "sin contraseña nueva, la anterior no debe cambiar");
  });

  test("HE2-S2-PU013 · (-) Actualizar con un dato de formato incorrecto: se rechaza y no se guarda nada", async () => {
    const cuenta = agregarCuenta();
    const r = await pedir(`/cuenta/${cuenta.id}`, "PUT", {
      nombre: "Ana Pérez",
      identificacion: "123456789",
      telefono: "3".repeat(21), // el máximo son 20 caracteres
      usuario: "anaperez",
      correo: "ana@example.com",
      direccion: "Calle 10 # 5-20",
    });
    assert.equal(r.estado, 400);
    assert.equal(r.cuerpo.mensaje, "Uno o más campos no cuentan con el formato adecuado");
    assert.equal(cuentas[0].telefono, "3001234567", "el teléfono no debe cambiar");
  });

  test("HE2-S2-PU014 · (-) Actualizar con un correo que ya usa otra cuenta: se rechaza", async () => {
    const cuenta = agregarCuenta();
    agregarCuenta({ correo: "otra@example.com", usuario: "otrapersona" });
    const r = await pedir(`/cuenta/${cuenta.id}`, "PUT", {
      nombre: "Ana Pérez",
      identificacion: "123456789",
      telefono: "3001234567",
      usuario: "anaperez",
      correo: "otra@example.com",
      direccion: "Calle 10 # 5-20",
    });
    assert.equal(r.estado, 409);
    assert.equal(r.cuerpo.mensaje, "El correo, nombre de usuario o identificación ya está registrado");
    assert.equal(cuentas[0].correo, "ana@example.com", "el correo no debe cambiar");
  });

  test("HE2-S2-PU015 · (+) Desactivar la cuenta: queda Inactiva y no se borra", async () => {
    const cuenta = agregarCuenta();
    const r = await pedir(`/cuenta/${cuenta.id}/desactivar`, "PATCH");
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.estado, "Inactivo");
    assert.equal(cuentas.length, 1, "la cuenta se conserva (no se pierde el historial)");
    assert.equal(cuentas[0].estado, "Inactivo");
  });
});

// ===============================================================
// Validaciones de formato
// (casos agregados tras revisar los criterios de HE2-HU3, HU4, HU5 y HU6)
// ===============================================================
describe("4 · Validaciones de formato", () => {
  const datosActualizar = {
    nombre: "Ana Pérez",
    identificacion: "123456789",
    telefono: "3001234567",
    usuario: "anaperez",
    correo: "ana@example.com",
    direccion: "Calle 10 # 5-20",
  };

  test("HE2-S2-PU016 · (-) Actualizar con un correo sin formato válido: se rechaza", async () => {
    const cuenta = agregarCuenta();
    const r = await pedir(`/cuenta/${cuenta.id}`, "PUT", { ...datosActualizar, correo: "ana.example.com" });
    assert.equal(r.estado, 400);
    assert.equal(r.cuerpo.mensaje, "Uno o más campos no cuentan con el formato adecuado");
    assert.equal(cuentas[0].correo, "ana@example.com", "el correo no debe cambiar");
  });

  test("HE2-S2-PU017 · (-) Registrar con un nombre de usuario con espacios y símbolos: se rechaza", async () => {
    const r = await registrar({ usuario: "carlos gomez!" });
    assert.equal(r.estado, 400);
    assert.equal(r.cuerpo.mensaje, "Uno o más campos no cuentan con el formato adecuado");
    assert.equal(cuentas.length, 0, "no debe crearse la cuenta");
  });

  test("HE2-S2-PU018 · (-) Registrar con un teléfono que contiene letras: se rechaza", async () => {
    const r = await registrar({ telefono: "abc123xyz" });
    assert.equal(r.estado, 400);
    assert.equal(r.cuerpo.mensaje, "Uno o más campos no cuentan con el formato adecuado");
    assert.equal(cuentas.length, 0, "no debe crearse la cuenta");
  });

});

// ===============================================================
// Casos adicionales de validación y reglas de negocio
// ===============================================================
describe("5 · Casos adicionales de validación y reglas de negocio", () => {
  const datosActualizar = {
    nombre: "Ana Pérez",
    identificacion: "123456789",
    telefono: "3001234567",
    usuario: "anaperez",
    correo: "ana@example.com",
    direccion: "Calle 10 # 5-20",
  };
  const encabezado = (token) => ({ Authorization: `Bearer ${token}` });

  test("HE2-S2-PU019 · (-) Mejora: registrar una identificación ya usada devuelve 409, también si la cuenta está Inactiva", async (t) => {
    await t.test("cuenta existente Activa", async () => {
      agregarCuenta({ identificacion: datosRegistro.identificacion });
      const r = await registrar({
        correo: "nuevo@example.com",
        usuario: "nuevousuario",
      });
      assert.deepEqual(
        { estado: r.estado, mensaje: r.cuerpo.mensaje, cuentas: cuentas.length },
        {
          estado: 409,
          mensaje: "El correo, nombre de usuario o identificación ya está registrado",
          cuentas: 1,
        },
        "no debe registrarse una identificación que ya pertenece a otra cuenta",
      );
    });

    cuentas = [];
    siguienteId = 1;
    await t.test("cuenta existente Inactiva", async () => {
      agregarCuenta({ identificacion: datosRegistro.identificacion, estado: "Inactivo" });
      const r = await registrar({
        correo: "nuevo@example.com",
        usuario: "nuevousuario",
      });
      assert.deepEqual(
        { estado: r.estado, mensaje: r.cuerpo.mensaje, cuentas: cuentas.length },
        {
          estado: 409,
          mensaje: "El correo, nombre de usuario o identificación ya está registrado",
          cuentas: 1,
        },
        "el estado Inactivo no debe permitir duplicar la identificación",
      );
    });
  });

  test("HE2-S2-PU020 · (-) Mejora: el usuario no distingue mayúsculas al registrarse y al iniciar sesión", async () => {
    const primera = await registrar({ usuario: "Maria" });
    const segunda = await registrar({
      usuario: "maria",
      correo: "maria.otra@example.com",
      identificacion: "2061234567",
    });
    const login = await iniciarSesion("MARIA", datosRegistro.password);
    assert.deepEqual(
      {
        registroInicial: primera.estado,
        registroDuplicado: segunda.estado,
        mensaje: segunda.cuerpo.mensaje,
        inicioSesion: login.estado,
      },
      {
        registroInicial: 201,
        registroDuplicado: 409,
        mensaje: "El correo, nombre de usuario o identificación ya está registrado",
        inicioSesion: 200,
      },
      "los nombres de usuario deben ser únicos sin distinguir mayúsculas",
    );
  });

  test("HE2-S2-PU021 · (-) Funcional: rechazar una contraseña de solo espacios y aceptar una frase segura", async () => {
    const soloEspacios = await registrar({
      password: "          ",
      correo: "espacios@example.com",
      usuario: "usuarioespacios",
    });
    const fraseSegura = await registrar({
      password: "clave segura 1",
      correo: "frase@example.com",
      usuario: "usuariofrase",
      identificacion: "2061234568",
    });
    assert.deepEqual(
      {
        espacios: { estado: soloEspacios.estado, mensaje: soloEspacios.cuerpo.mensaje },
        frase: fraseSegura.estado,
      },
      {
        espacios: {
          estado: 400,
          mensaje: "Uno o más campos no cuentan con el formato adecuado",
        },
        frase: 201,
      },
      "la contraseña debe contener caracteres distintos de espacios y aceptar frases seguras",
    );
  });

  test("HE2-S2-PU022 · (-) Funcional: actualizar con usuario con espacios o símbolos devuelve 400 y no se guarda", async () => {
    const cuenta = agregarCuenta();
    const r = await pedir(`/cuenta/${cuenta.id}`, "PUT", {
      ...datosActualizar,
      usuario: "ana persona!",
    });
    assert.deepEqual(
      { estado: r.estado, usuario: cuentas[0].usuario },
      { estado: 400, usuario: "anaperez" },
      "el usuario inválido no debe guardarse",
    );
  });

  test("HE2-S2-PU023 · (-) Funcional: actualizar con teléfono con letras devuelve 400 y no se guarda", async () => {
    const cuenta = agregarCuenta();
    const r = await pedir(`/cuenta/${cuenta.id}`, "PUT", {
      ...datosActualizar,
      telefono: "300abc4567",
    });
    assert.deepEqual(
      { estado: r.estado, telefono: cuentas[0].telefono },
      { estado: 400, telefono: "3001234567" },
      "el teléfono inválido no debe guardarse",
    );
  });

});
