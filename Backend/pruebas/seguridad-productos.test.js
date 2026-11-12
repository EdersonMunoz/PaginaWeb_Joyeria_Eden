import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formulario,
  pedir,
  prepararEntorno,
  productoValido,
} from "./ayudas.js";
import { crearToken } from "../sesion.js";

prepararEntorno();

test("HE2-S2-PU032 · Seguridad: registrar productos exige sesión y rol administrador", async () => {
  const sinSesion = await pedir(
    "/api/productos",
    { method: "POST", body: formulario(productoValido) },
    { autenticar: false },
  );
  assert.equal(sinSesion.estado, 401);

  const cliente = await pedir(
    "/api/productos",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${crearToken({ id: 2, rol: "cliente" })}` },
      body: formulario(productoValido),
    },
  );
  assert.equal(cliente.estado, 403);

  const administrador = await pedir(
    "/api/productos",
    { method: "POST", body: formulario(productoValido) },
  );
  assert.equal(administrador.estado, 201);
  assert.notEqual(administrador.estado, 401);
  assert.notEqual(administrador.estado, 403);
});
