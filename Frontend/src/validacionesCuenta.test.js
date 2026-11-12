import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  esCorreoValido,
  esPasswordValida,
  esTelefonoValido,
  esUsuarioValido,
} from "./validacionesCuenta.js";

describe("validaciones de cuenta", () => {
  it("valida nombres de usuario permitidos", () => {
    assert.equal(esUsuarioValido("ana.perez_1"), true);
    assert.equal(esUsuarioValido("ana perez!"), false);
    assert.equal(esUsuarioValido("ab"), false);
    assert.equal(esUsuarioValido("a".repeat(31)), false);
  });

  it("valida teléfonos permitidos", () => {
    assert.equal(esTelefonoValido("+57 3001234567"), true);
    assert.equal(esTelefonoValido("abc123xyz"), false);
    assert.equal(esTelefonoValido("123456"), false);
    assert.equal(esTelefonoValido("123456789012345678901"), false);
  });

  it("valida correos y limita su longitud", () => {
    assert.equal(esCorreoValido("ana@example.com"), true);
    assert.equal(esCorreoValido("ana.example.com"), false);
    assert.equal(esCorreoValido(`${"a".repeat(147)}@b.co`), false);
  });

  it("valida contraseñas de mínimo ocho caracteres que no sean solo espacios", () => {
    assert.equal(esPasswordValida("clave segura 1"), true);
    assert.equal(esPasswordValida("1234567"), false);
    assert.equal(esPasswordValida("          "), false);
  });
});
