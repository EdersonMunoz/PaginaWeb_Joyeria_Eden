// HE1-HU2 · Modificar datos de productos
//   GET /api/productos/referencia/:ref   (consultar por referencia)
//   PUT /api/productos/:id               (guardar los cambios)
// Técnica: caja negra. Formato del ID: HE1-HU2-CA<criterio>-CP<caso>
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  bd,
  agregarProducto,
  prepararEntorno,
  modificar,
  formularioConArchivoDeTexto,
  pedir,
  cambiosValidos,
} from "./ayudas.js";

prepararEntorno();

// Textos tomados tal cual del "Entonces" de los criterios de aceptación
const MENSAJE_EXITO = "¡Producto actualizado correctamente!";
const MENSAJE_ERROR =
  "Error al actualizar producto. Por favor completa todos los campos obligatorios y/o corrige los valores numéricos";

// Revisa que el sistema rechazó la modificación y no cambió el producto
function assertRechazado(r, camposEnError, productoAntes) {
  assert.equal(r.estado, 400);
  assert.equal(r.cuerpo.mensaje, MENSAJE_ERROR);
  for (const campo of camposEnError) {
    assert.equal(r.cuerpo.errores[campo], true, `el campo ${campo} debía quedar en error`);
  }
  assert.deepEqual(bd.productos[0], productoAntes, "el producto no debe cambiar");
}

describe("HE1-HU2-CA1 · Modificación exitosa de producto", () => {
  test("HE1-HU2-CA1-CP001 · (+) cambia nombre, precio y stock con valores válidos", async () => {
    agregarProducto({ id: 1 });
    const r = await modificar(1, cambiosValidos);
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.mensaje, MENSAJE_EXITO);
    assert.equal(r.cuerpo.producto.nombre, "Anillo de oro 18k");
    assert.equal(r.cuerpo.producto.precio, 1800000);
    assert.equal(r.cuerpo.producto.stock, 20);
  });

  test("HE1-HU2-CA1-CP002 · (-) modificar un producto que no existe", async () => {
    const r = await modificar(999, cambiosValidos);
    assert.equal(r.estado, 404);
    assert.equal(r.cuerpo.mensaje, "El producto no existe.");
  });

  test("HE1-HU2-CA1-CP003 · (-) archivo que no es imagen como foto nueva", async () => {
    const antes = agregarProducto({ id: 1 });
    const copia = { ...antes };
    const r = await pedir("/api/productos/1", {
      method: "PUT",
      body: formularioConArchivoDeTexto(cambiosValidos),
    });
    assert.equal(r.estado, 400);
    assert.equal(r.cuerpo.errores.imagen, true);
    assert.deepEqual(bd.productos[0], copia, "el producto no debe cambiar");
  });

  test("HE1-HU2-CA1-CP004 · (+) consultar por referencia escrita en minúsculas", async () => {
    agregarProducto({ id: 3, ref: "ANI003" });
    const r = await pedir("/api/productos/referencia/ani003");
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.producto.id, 3);
  });

  test("HE1-HU2-CA1-CP005 · (-) consultar una referencia que no existe", async () => {
    const r = await pedir("/api/productos/referencia/NOHAY");
    assert.equal(r.estado, 404);
    assert.equal(r.cuerpo.mensaje, "No encontramos un producto con esa referencia.");
  });

  test("HE1-HU2-CA1-CP006 · (+) modificar sin foto nueva conserva la foto anterior", async () => {
    agregarProducto({ id: 1, imagen: "/fotos/vieja.png" });
    const r = await modificar(1, cambiosValidos);
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.producto.imagen, "/fotos/vieja.png");
  });

  test("HE1-HU2-CA1-CP007 · (+) modificar con stock 0 deja el producto inactivo", async () => {
    agregarProducto({ id: 1 });
    const r = await modificar(1, { ...cambiosValidos, stock: "0" });
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.mensaje, MENSAJE_EXITO);
    assert.equal(r.cuerpo.producto.estado, "Inactivo");
  });
});

describe("HE1-HU2-CA2 · Campos obligatorios vacíos al modificar", () => {
  test("HE1-HU2-CA2-CP001 · (+) nombre y descripción vacíos", async () => {
    const antes = { ...agregarProducto({ id: 1 }) };
    const r = await modificar(1, { ...cambiosValidos, nombre: "", descripcion: "" });
    assertRechazado(r, ["nombre", "descripcion"], antes);
  });

  test("HE1-HU2-CA2-CP002 · (-) solo la categoría vacía", async () => {
    const antes = { ...agregarProducto({ id: 1 }) };
    const r = await modificar(1, { ...cambiosValidos, categoria: "" });
    assertRechazado(r, ["categoria"], antes);
    assert.deepEqual(r.cuerpo.errores, { categoria: true }, "solo debe marcar la categoría");
  });

  test("HE1-HU2-CA2-CP003 · (-) todos los campos vacíos", async () => {
    const antes = { ...agregarProducto({ id: 1 }) };
    const r = await modificar(1, {
      nombre: "",
      precio: "",
      categoria: "",
      stock: "",
      descripcion: "",
    });
    assertRechazado(r, ["nombre", "precio", "categoria", "stock", "descripcion"], antes);
  });
});

describe("HE1-HU2-CA3 · Modificación con valores numéricos no válidos", () => {
  test("HE1-HU2-CA3-CP001 · (+) precio negativo", async () => {
    const antes = { ...agregarProducto({ id: 1 }) };
    const r = await modificar(1, { ...cambiosValidos, precio: "-1500000" });
    assertRechazado(r, ["precio"], antes);
  });

  test("HE1-HU2-CA3-CP002 · (-) precio con letras", async () => {
    const antes = { ...agregarProducto({ id: 1 }) };
    const r = await modificar(1, { ...cambiosValidos, precio: "abc" });
    assertRechazado(r, ["precio"], antes);
  });

  test("HE1-HU2-CA3-CP003 · (-) stock negativo", async () => {
    const antes = { ...agregarProducto({ id: 1 }) };
    const r = await modificar(1, { ...cambiosValidos, stock: "-5" });
    assertRechazado(r, ["stock"], antes);
  });

  test("HE1-HU2-CA3-CP004 · (-) stock con decimales", async () => {
    const antes = { ...agregarProducto({ id: 1 }) };
    const r = await modificar(1, { ...cambiosValidos, stock: "2.5" });
    assertRechazado(r, ["stock"], antes);
  });
});
