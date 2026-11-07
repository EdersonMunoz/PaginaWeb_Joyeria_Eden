import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { crearApp } from "../servidor.js";
import { usarEjecutorDePrueba } from "../baseDatos.js";

let servidor;
let api;
let cuentas;
let consultas;

const hash = (password) =>
  createHash("sha256").update(password, "utf8").digest("hex");

before(async () => {
  usarEjecutorDePrueba(async (sql, datos) => {
    consultas.push({ sql, datos });

    if (sql.includes("INSERT INTO usuario")) {
      cuentas.push({ id: cuentas.length + 1, ...datos });
      return { filas: [], afectadas: 1 };
    }

    if (sql.includes("FROM usuario") && sql.includes("WHERE LOWER(correo)")) {
      const cuenta = cuentas.find(
        (item) =>
          item.correo.toLowerCase() === datos.identificador.toLowerCase() ||
          item.usuario.toLowerCase() === datos.identificador.toLowerCase(),
      );
      return { filas: cuenta ? [cuenta] : [], afectadas: 0 };
    }

    if (sql.includes("UPDATE usuario") && sql.includes("SET nombre")) {
      const cuenta = cuentas.find((item) => item.id === datos.id);
      Object.assign(cuenta, datos);
      return { filas: [], afectadas: 1 };
    }

    throw new Error(`Consulta no prevista en la prueba: ${sql}`);
  });

  await new Promise((resolve) => {
    servidor = crearApp().listen(0, "127.0.0.1", resolve);
  });
  api = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  await new Promise((resolve) => servidor.close(resolve));
});

beforeEach(() => {
  cuentas = [];
  consultas = [];
});

test("registro, inicio de sesión y actualización conservan los datos del perfil", async () => {
  const perfil = {
    nombre: "Ana Pérez",
    identificacion: "123456789",
    telefono: "3001234567",
    usuario: "anaperez123",
    correo: "ana@example.com",
    direccion: "Calle 10 # 5-20",
    password: "EdenPrueba123",
  };

  const registro = await fetch(`${api}/api/autenticacion/registro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(perfil),
  });
  assert.equal(registro.status, 201);
  assert.equal(cuentas.length, 1);
  assert.equal(cuentas[0].passwordHash, hash(perfil.password));
  assert.equal("password" in cuentas[0], false);
  for (const campo of ["nombre", "identificacion", "telefono", "usuario", "correo", "direccion"]) {
    assert.equal(cuentas[0][campo], perfil[campo]);
  }
  assert.match(consultas[0].sql, /identificacion, telefono, correo, usuario, direccion/);

  const inicio = await fetch(`${api}/api/autenticacion/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identificador: perfil.usuario,
      password: perfil.password,
    }),
  });
  const datosInicio = await inicio.json();
  assert.equal(inicio.status, 200);
  for (const campo of ["identificacion", "telefono", "direccion"]) {
    assert.equal(datosInicio.usuario[campo], perfil[campo]);
  }

  const perfilActualizado = {
    ...perfil,
    identificacion: "987654321",
    telefono: "3117654321",
    direccion: "Carrera 7 # 12-34",
  };
  delete perfilActualizado.password;
  const actualizacion = await fetch(`${api}/api/autenticacion/cuenta/1`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(perfilActualizado),
  });
  assert.equal(actualizacion.status, 200);
  const consultaActualizacion = consultas.at(-1);
  assert.match(consultaActualizacion.sql, /telefono = :telefono/);
  assert.match(consultaActualizacion.sql, /direccion = :direccion/);
  assert.doesNotMatch(consultaActualizacion.sql, /password_hash/);
  assert.equal(cuentas[0].passwordHash, hash(perfil.password));
  for (const campo of ["identificacion", "telefono", "direccion"]) {
    assert.equal(cuentas[0][campo], perfilActualizado[campo]);
  }
});
