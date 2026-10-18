// Pruebas unitarias de validar.js (HU1 y HU2).
// No necesitan Oracle ni servidor: solo llaman a las funciones.
// Uso:  npm test
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { limpiarPrecio, validarProducto, hayErrores, CATEGORIAS } from "../validar.js";

// Producto correcto que se reutiliza en todas las pruebas
const productoValido = {
  ref: "ANI001",
  nombre: "Anillo de oro",
  precio: "$1.500.000",
  categoria: "Anillos",
  stock: "15",
  descripcion: "Anillo de oro de 18 quilates",
};

describe("limpiarPrecio", () => {
  test('convierte "$1.500.000" en 1500000', () => {
    assert.equal(limpiarPrecio("$1.500.000"), 1500000);
  });

  test("acepta un número sin símbolos", () => {
    assert.equal(limpiarPrecio("1800000"), 1800000);
  });

  test("devuelve NaN si no es un número", () => {
    assert.ok(Number.isNaN(limpiarPrecio("abc")));
  });
});

describe("validarProducto · registro (HU1)", () => {
  test("escenario 1: datos correctos no generan errores", () => {
    const { errores, valores } = validarProducto(productoValido, {
      esRegistro: true,
      tieneFoto: true,
    });
    assert.equal(hayErrores(errores), false);
    assert.equal(valores.precio, 1500000);
    assert.equal(valores.stock, 15);
  });

  test("escenario 2: campos vacíos marcan cada campo con error", () => {
    const { errores } = validarProducto(
      { ref: "", nombre: "", precio: "", categoria: "", stock: "", descripcion: "" },
      { esRegistro: true, tieneFoto: true },
    );
    for (const campo of ["ref", "nombre", "precio", "categoria", "stock", "descripcion"]) {
      assert.equal(errores[campo], true, `falta el error en ${campo}`);
    }
  });

  test("escenario 3: precio negativo es inválido", () => {
    const { errores } = validarProducto(
      { ...productoValido, precio: "$-500.000" },
      { esRegistro: true, tieneFoto: true },
    );
    assert.equal(errores.precio, true);
  });

  test("escenario 3: stock 0 es inválido al registrar", () => {
    const { errores } = validarProducto(
      { ...productoValido, stock: "0" },
      { esRegistro: true, tieneFoto: true },
    );
    assert.equal(errores.stock, true);
  });

  test("el stock con decimales es inválido", () => {
    const { errores } = validarProducto(
      { ...productoValido, stock: "2.5" },
      { esRegistro: true, tieneFoto: true },
    );
    assert.equal(errores.stock, true);
  });

  test("una categoría que no está en la lista es inválida", () => {
    const { errores } = validarProducto(
      { ...productoValido, categoria: "Zapatos" },
      { esRegistro: true, tieneFoto: true },
    );
    assert.equal(errores.categoria, true);
  });

  test("todas las categorías de CATEGORIAS son válidas", () => {
    for (const categoria of CATEGORIAS) {
      const { errores } = validarProducto(
        { ...productoValido, categoria },
        { esRegistro: true, tieneFoto: true },
      );
      assert.equal(errores.categoria, undefined, `${categoria} debería ser válida`);
    }
  });

  test("sin foto, el registro marca error en imagen", () => {
    const { errores } = validarProducto(productoValido, { esRegistro: true, tieneFoto: false });
    assert.equal(errores.imagen, true);
  });

  test("el nombre de más de 120 caracteres es inválido", () => {
    const { errores } = validarProducto(
      { ...productoValido, nombre: "a".repeat(121) },
      { esRegistro: true, tieneFoto: true },
    );
    assert.equal(errores.nombre, true);
  });

  test("la referencia de más de 20 caracteres es inválida", () => {
    const { errores } = validarProducto(
      { ...productoValido, ref: "R".repeat(21) },
      { esRegistro: true, tieneFoto: true },
    );
    assert.equal(errores.ref, true);
  });
});

describe("validarProducto · modificación (HU2)", () => {
  test("stock 0 es válido al modificar", () => {
    const { errores } = validarProducto(
      { ...productoValido, stock: "0" },
      { esRegistro: false, tieneFoto: true },
    );
    assert.equal(errores.stock, undefined);
  });

  test("al modificar no se exige la referencia ni la foto", () => {
    const { errores } = validarProducto(
      { ...productoValido, ref: "" },
      { esRegistro: false, tieneFoto: false },
    );
    assert.equal(hayErrores(errores), false);
  });

  test("escenario 2: nombre vacío es inválido", () => {
    const { errores } = validarProducto(
      { ...productoValido, nombre: "" },
      { esRegistro: false, tieneFoto: true },
    );
    assert.equal(errores.nombre, true);
  });

  test("escenario 3: precio negativo es inválido", () => {
    const { errores } = validarProducto(
      { ...productoValido, precio: "-1500000" },
      { esRegistro: false, tieneFoto: true },
    );
    assert.equal(errores.precio, true);
  });
});

describe("hayErrores", () => {
  test("es false con un objeto vacío", () => {
    assert.equal(hayErrores({}), false);
  });

  test("es true si hay al menos un campo con error", () => {
    assert.equal(hayErrores({ precio: true }), true);
  });
});
