import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { usarEjecutorDePrueba } from "../baseDatos.js";

process.env.SECRETO_SESION = "secreto-fijo-de-prueba-para-regresion-seguridad";
const { crearApp } = await import("../servidor.js");
const { crearToken } = await import("../sesion.js");

let servidor;
let api;
let cuentas;

const hashSha256 = (password) =>
  createHash("sha256").update(password, "utf8").digest("hex");

function agregarCuenta(extra = {}) {
  const cuenta = {
    id: cuentas.length + 1,
    nombre: "Ana Pérez",
    identificacion: "123456789",
    telefono: "3001234567",
    correo: "ana@example.com",
    usuario: "anaperez",
    direccion: "Calle 10 # 5-20",
    passwordHash: hashSha256("EdenPrueba123"),
    rol: "cliente",
    estado: "Activo",
    ...extra,
  };
  cuentas.push(cuenta);
  return cuenta;
}

function instalardbFalsa() {
  usarEjecutorDePrueba(async (sql, datos) => {
    if (sql.includes("INSERT INTO usuario")) {
      cuentas.push({ id: cuentas.length + 1, ...datos });
      return { filas: [], afectadas: 1 };
    }

    if (sql.includes("WHERE LOWER(correo)")) {
      const identificador = datos.identificador.toLowerCase();
      const cuenta = cuentas.find(
        (item) =>
          item.correo.toLowerCase() === identificador ||
          item.usuario.toLowerCase() === identificador,
      );
      return { filas: cuenta ? [cuenta] : [], afectadas: 0 };
    }

    if (sql.includes("SET password_hash")) {
      const cuenta = cuentas.find((item) => item.id === datos.id);
      if (!cuenta) return { filas: [], afectadas: 0 };
      cuenta.passwordHash = datos.passwordHash;
      return { filas: [], afectadas: 1 };
    }

    if (sql.includes("SET nombre")) {
      const cuenta = cuentas.find((item) => item.id === datos.id);
      if (!cuenta) return { filas: [], afectadas: 0 };
      Object.assign(cuenta, datos);
      return { filas: [], afectadas: 1 };
    }

    if (sql.includes("SET estado")) {
      const cuenta = cuentas.find((item) => item.id === datos.id);
      if (!cuenta) return { filas: [], afectadas: 0 };
      cuenta.estado = "Inactivo";
      return { filas: [], afectadas: 1 };
    }

    throw new Error(`Consulta no prevista en la prueba: ${sql}`);
  });
}

before(async () => {
  instalardbFalsa();
  await new Promise((resolve) => {
    servidor = crearApp().listen(0, "127.0.0.1", resolve);
  });
  api = `http://127.0.0.1:${servidor.address().port}/api/autenticacion`;
});

after(async () => {
  await new Promise((resolve) => servidor.close(resolve));
});

beforeEach(() => {
  cuentas = [];
});

async function pedir(ruta, metodo, cuerpo, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const respuesta = await fetch(`${api}${ruta}`, {
    method: metodo,
    headers,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  return { estado: respuesta.status, cuerpo: await respuesta.json() };
}

const iniciarSesion = (identificador, password) =>
  pedir("/login", "POST", { identificador, password });

const datosActualizar = {
  nombre: "Ana María Pérez",
  identificacion: "123456789",
  telefono: "3117654321",
  usuario: "anaperez",
  correo: "ana@example.com",
  direccion: "Carrera 7 # 12-34",
};

const tokenPara = (cuenta) => crearToken({ id: cuenta.id, rol: cuenta.rol });

// R-03 es un riesgo aceptado; esta suite no agrega una prueba para ese riesgo.

test("REG-SEG-01 · (+) Las contraseñas iguales se guardan con scrypt y no se expone passwordHash", async () => {
  const perfil = {
    nombre: "Ana Pérez",
    identificacion: "123456789",
    telefono: "3001234567",
    usuario: "anaperez",
    correo: "ana@example.com",
    direccion: "Calle 10 # 5-20",
    password: "ClaveIgual123",
  };
  const registro1 = await pedir("/registro", "POST", perfil);
  const registro2 = await pedir(
    "/registro",
    "POST",
    {
      ...perfil,
      identificacion: "987654321",
      usuario: "otrapersona",
      correo: "otra@example.com",
    },
  );
  const [primera, segunda] = cuentas;

  assert.equal(registro1.estado, 201);
  assert.equal(registro2.estado, 201);
  assert.match(primera.passwordHash, /^scrypt\$[a-f\d]{32}\$[a-f\d]{128}$/i);
  assert.match(segunda.passwordHash, /^scrypt\$[a-f\d]{32}\$[a-f\d]{128}$/i);
  assert.notEqual(primera.passwordHash, segunda.passwordHash);

  const login = await iniciarSesion("anaperez", perfil.password);
  assert.equal(login.estado, 200);
  assert.equal("passwordHash" in login.cuerpo.usuario, false);
});

test("REG-SEG-02 · (+) El primer inicio de sesión migra el hash SHA-256 legado a scrypt", async () => {
  const cuenta = agregarCuenta();
  const hashAnterior = cuenta.passwordHash;

  const primerLogin = await iniciarSesion("anaperez", "EdenPrueba123");
  assert.equal(primerLogin.estado, 200);
  assert.notEqual(cuenta.passwordHash, hashAnterior);
  assert.match(cuenta.passwordHash, /^scrypt\$[a-f\d]{32}\$[a-f\d]{128}$/i);
  assert.equal("passwordHash" in primerLogin.cuerpo.usuario, false);

  const segundoLogin = await iniciarSesion("anaperez", "EdenPrueba123");
  assert.equal(segundoLogin.estado, 200);
});

test("REG-SEG-03 · (-) Actualizar una cuenta sin sesión devuelve 401 y no cambia los datos", async () => {
  const cuenta = agregarCuenta();
  const antes = { ...cuenta };

  const respuesta = await pedir(
    `/cuenta/${cuenta.id}`,
    "PUT",
    { ...datosActualizar, nombre: "Nombre no autorizado" },
  );

  assert.equal(respuesta.estado, 401);
  assert.deepEqual(cuenta, antes);
});

test("REG-SEG-04 · (-) Un token firmado de otra cuenta no permite actualizarla", async () => {
  const cuenta = agregarCuenta();
  const otra = agregarCuenta({
    correo: "otra@example.com",
    usuario: "otrapersona",
    identificacion: "987654321",
  });
  const antes = { ...cuenta };

  const respuesta = await pedir(
    `/cuenta/${cuenta.id}`,
    "PUT",
    { ...datosActualizar, nombre: "Nombre no autorizado" },
    tokenPara(otra),
  );

  assert.equal(respuesta.estado, 403);
  assert.deepEqual(cuenta, antes);
});

test("REG-SEG-05 · (-) Desactivar una cuenta sin sesión devuelve 401 y sigue activa", async () => {
  const cuenta = agregarCuenta();

  const respuesta = await pedir(`/cuenta/${cuenta.id}/desactivar`, "PATCH");

  assert.equal(respuesta.estado, 401);
  assert.equal(cuenta.estado, "Activo");
});

test("REG-SEG-06 · (-) Un token firmado de otra cuenta no permite desactivarla", async () => {
  const cuenta = agregarCuenta();
  const otra = agregarCuenta({
    correo: "otra@example.com",
    usuario: "otrapersona",
    identificacion: "987654321",
  });

  const respuesta = await pedir(
    `/cuenta/${cuenta.id}/desactivar`,
    "PATCH",
    undefined,
    tokenPara(otra),
  );

  assert.equal(respuesta.estado, 403);
  assert.equal(cuenta.estado, "Activo");
});

test("REG-SEG-07 · (+) El token firmado del login permite actualizar la cuenta propia", async () => {
  const cuenta = agregarCuenta();
  const login = await iniciarSesion("anaperez", "EdenPrueba123");

  assert.equal(login.estado, 200);
  assert.equal(typeof login.cuerpo.token, "string");
  assert.ok(login.cuerpo.token.length > 0);

  const actualizacion = await pedir(
    `/cuenta/${cuenta.id}`,
    "PUT",
    datosActualizar,
    login.cuerpo.token,
  );

  assert.equal(actualizacion.estado, 200);
  assert.equal(cuenta.nombre, datosActualizar.nombre);
});

test("REG-SEG-08 · (-) Un token manipulado se rechaza en las rutas de actualizar y desactivar cuenta", async () => {
  const cuenta = agregarCuenta();
  const tokenValido = tokenPara(cuenta);
  const [payload, firma] = tokenValido.split(".");
  const datosToken = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  const tokenManipulado = `${Buffer.from(
    JSON.stringify({ ...datosToken, id: cuenta.id + 1 }),
  ).toString("base64url")}.${firma}`;

  const actualizar = await pedir(
    `/cuenta/${cuenta.id}`,
    "PUT",
    datosActualizar,
    tokenManipulado,
  );
  const desactivar = await pedir(
    `/cuenta/${cuenta.id}/desactivar`,
    "PATCH",
    undefined,
    tokenManipulado,
  );

  assert.equal(actualizar.estado, 401);
  assert.equal(desactivar.estado, 401);
  assert.equal(cuenta.estado, "Activo");
  assert.equal(cuenta.nombre, "Ana Pérez");
});
