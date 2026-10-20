// HE1-HU1 · Registrar un nuevo producto  (POST /api/productos)
// Técnica: caja negra. Cada prueba lleva el ID del caso de prueba del Excel.
// Formato del ID: HE1-HU1-CA<criterio>-CP<caso>
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  bd,
  agregarProducto,
  prepararEntorno,
  registrar,
  formulario,
  formularioConArchivoDeTexto,
  pedir,
  productoValido,
} from "./ayudas.js";

prepararEntorno();

// Textos tomados tal cual del "Entonces" de los criterios de aceptación
const MENSAJE_EXITO = "¡Producto Registrado Exitosamente!";
const MENSAJE_ERROR =
  "Error al registrar producto. Por favor completa todos los campos obligatorios y/o corrige los valores numéricos";

// Revisa que el sistema rechazó el registro y marcó los campos en error
function assertRechazado(r, camposEnError) {
  assert.equal(r.estado, 400);
  assert.equal(r.cuerpo.mensaje, MENSAJE_ERROR);
  for (const campo of camposEnError) {
    assert.equal(r.cuerpo.errores[campo], true, `el campo ${campo} debía quedar en error`);
  }
  assert.equal(bd.productos.length, 0, "no debe guardar el producto");
}

describe("HE1-HU1-CA1 · Registro exitoso de producto", () => {
  test("HE1-HU1-CA1-CP001 · (+) todos los campos válidos con foto", async () => {
    const r = await registrar(productoValido);
    assert.equal(r.estado, 201);
    assert.equal(r.cuerpo.mensaje, MENSAJE_EXITO);
    assert.equal(r.cuerpo.producto.precio, 1500000);
    assert.equal(r.cuerpo.producto.estado, "Activo");
    assert.equal(bd.productos.length, 1);
  });

  test("HE1-HU1-CA1-CP002 · (-) referencia repetida (en minúsculas)", async () => {
    agregarProducto({ ref: "TST001" });
    const r = await registrar({ ...productoValido, ref: "tst001" });
    assert.equal(r.estado, 409);
    assert.equal(r.cuerpo.errores.ref, true);
    assert.equal(bd.productos.length, 1, "no debe duplicar el producto");
  });

  test("HE1-HU1-CA1-CP003 · (-) archivo que no es imagen como foto", async () => {
    const r = await pedir("/api/productos", {
      method: "POST",
      body: formularioConArchivoDeTexto(productoValido),
    });
    assert.equal(r.estado, 400);
    assert.equal(r.cuerpo.errores.imagen, true);
    assert.equal(bd.productos.length, 0, "no debe guardar el producto");
  });
});

describe("HE1-HU1-CA2 · Campos obligatorios vacíos", () => {
  test("HE1-HU1-CA2-CP001 · (+) todos los campos vacíos", async () => {
    const r = await registrar({
      ref: "",
      nombre: "",
      precio: "",
      categoria: "",
      stock: "",
      descripcion: "",
    });
    assertRechazado(r, ["ref", "nombre", "precio", "categoria", "stock", "descripcion"]);
  });

  test("HE1-HU1-CA2-CP002 · (-) solo la descripción vacía", async () => {
    const r = await registrar({ ...productoValido, descripcion: "" });
    assertRechazado(r, ["descripcion"]);
    assert.deepEqual(r.cuerpo.errores, { descripcion: true }, "solo debe marcar la descripción");
  });

  test("HE1-HU1-CA2-CP003 · (-) todos los campos llenos pero sin foto", async () => {
    const r = await pedir("/api/productos", {
      method: "POST",
      body: formulario(productoValido, { foto: false }),
    });
    assertRechazado(r, ["imagen"]);
  });

  test("HE1-HU1-CA2-CP004 · (-) nombre y descripción solo con espacios", async () => {
    const r = await registrar({ ...productoValido, nombre: "   ", descripcion: "   " });
    assertRechazado(r, ["nombre", "descripcion"]);
  });
});

describe("HE1-HU1-CA3 · Valores numéricos no válidos", () => {
  test("HE1-HU1-CA3-CP001 · (+) precio negativo", async () => {
    const r = await registrar({ ...productoValido, precio: "$-500.000" });
    assertRechazado(r, ["precio"]);
  });

  test("HE1-HU1-CA3-CP002 · (-) precio con letras", async () => {
    const r = await registrar({ ...productoValido, precio: "abc" });
    assertRechazado(r, ["precio"]);
  });

  test("HE1-HU1-CA3-CP003 · (-) stock en 0", async () => {
    const r = await registrar({ ...productoValido, stock: "0" });
    assertRechazado(r, ["stock"]);
  });

  test("HE1-HU1-CA3-CP004 · (-) stock con decimales", async () => {
    const r = await registrar({ ...productoValido, stock: "2.5" });
    assertRechazado(r, ["stock"]);
  });

  test("HE1-HU1-CA3-CP005 · (-) stock en notación científica (1e3)", async () => {
    const r = await registrar({ ...productoValido, stock: "1e3" });
    assertRechazado(r, ["stock"]);
  });
});
