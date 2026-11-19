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

  it("cerrar sesión ignora un evento como argumento y borra usuario y token", () => {
    const almacen = crearAlmacen();
    const descriptorAnterior = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: almacen,
    });

    try {
      guardarSesion({ id: 1, rol: "cliente" }, "token-prueba");

      assert.equal(cerrarSesion({ type: "click" }), true);
      assert.equal(obtenerUsuario(), null);
      assert.equal(obtenerToken(), null);
    } finally {
      if (descriptorAnterior) {
        Object.defineProperty(globalThis, "localStorage", descriptorAnterior);
      } else {
        delete globalThis.localStorage;
      }
    }
  });

  it("busca tokens en ambos almacenamientos y al cerrar limpia los dos", () => {
    const localStorageAnterior = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    const sessionStorageAnterior = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
    const local = crearAlmacen();
    const session = crearAlmacen();

    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: local,
    });
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: session,
    });

    try {
      session.setItem("eden.token", "token-de-sesion");
      session.setItem("eden.usuario", JSON.stringify({ id: 2, rol: "cliente" }));

      assert.equal(obtenerToken(), "token-de-sesion");
      assert.deepEqual(obtenerUsuario(), { id: 2, rol: "cliente" });
      assert.equal(cerrarSesion(), true);
      assert.equal(local.getItem("eden.token"), null);
      assert.equal(session.getItem("eden.token"), null);
      assert.equal(session.getItem("eden.usuario"), null);
    } finally {
      if (localStorageAnterior) {
        Object.defineProperty(globalThis, "localStorage", localStorageAnterior);
      } else {
        delete globalThis.localStorage;
      }
      if (sessionStorageAnterior) {
        Object.defineProperty(globalThis, "sessionStorage", sessionStorageAnterior);
      } else {
        delete globalThis.sessionStorage;
      }
    }
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
