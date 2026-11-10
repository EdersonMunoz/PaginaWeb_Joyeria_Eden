import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  actualizarUsuario,
  cerrarSesion,
  decidirAcceso,
  guardarSesion,
  obtenerToken,
  obtenerUsuario,
} from "./sesion.js";

function crearAlmacen() {
  const valores = new Map();
  return {
    getItem: (clave) => valores.get(clave) ?? null,
    setItem: (clave, valor) => valores.set(clave, String(valor)),
    removeItem: (clave) => valores.delete(clave),
  };
}

describe("sesión", () => {
  it("guarda y recupera usuario y token", () => {
    const almacen = crearAlmacen();
    const usuario = { id: 1, rol: "admin" };

    assert.equal(guardarSesion(usuario, "token-prueba", almacen), true);
    assert.deepEqual(obtenerUsuario(almacen), usuario);
    assert.equal(obtenerToken(almacen), "token-prueba");
  });

  it("cerrar sesión borra usuario y token", () => {
    const almacen = crearAlmacen();
    guardarSesion({ id: 1, rol: "cliente" }, "token-prueba", almacen);

    assert.equal(cerrarSesion(almacen), true);
    assert.equal(obtenerUsuario(almacen), null);
    assert.equal(obtenerToken(almacen), null);
  });

  it("actualizar usuario conserva el token", () => {
    const almacen = crearAlmacen();
    guardarSesion({ id: 1, rol: "cliente" }, "token-prueba", almacen);

    assert.equal(actualizarUsuario({ id: 1, rol: "cliente", nombre: "Ana" }, almacen), true);
    assert.deepEqual(obtenerUsuario(almacen), { id: 1, rol: "cliente", nombre: "Ana" });
    assert.equal(obtenerToken(almacen), "token-prueba");
  });

  it("decide acceso según usuario y rol", () => {
    assert.equal(decidirAcceso(null, "admin"), "/InicioSesion");
    assert.equal(decidirAcceso({ rol: "cliente" }, "admin"), "/Usuario");
    assert.equal(decidirAcceso({ rol: "admin" }, "cliente"), "/Admin");
    assert.equal(decidirAcceso({ rol: "admin" }, "admin"), "permitir");
  });
});
