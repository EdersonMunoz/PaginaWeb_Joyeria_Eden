// HE1-HU4 · Inactivar y activar productos  (PATCH /api/productos/:id/estado)
// Técnica: caja negra. Formato del ID: HE1-HU4-CA<criterio>-CP<caso>
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { bd, agregarProducto, prepararEntorno, pedir } from "./ayudas.js";

prepararEntorno();

// Textos tomados tal cual del "Entonces" de los criterios de aceptación
const MENSAJE_INACTIVADO = "¡Producto inctivado correctamente!";
const MENSAJE_ACTIVADO = "¡Producto activado correctamente!";

const cambiarEstado = (id, cuerpo) =>
  pedir(`/api/productos/${id}/estado`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });

describe("HE1-HU4-CA1 · Inactivación exitosa de producto", () => {
  test("HE1-HU4-CA1-CP001 · (+) inactivar un producto activo: mensaje", async () => {
    agregarProducto({ id: 1, estado: "Activo" });
    const r = await cambiarEstado(1, { estado: "Inactivo" });
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.mensaje, MENSAJE_INACTIVADO);
  });

  test("HE1-HU4-CA1-CP002 · (+) inactivar un producto activo: deja de mostrarse", async () => {
    agregarProducto({ id: 1, estado: "Activo" });
    const r = await cambiarEstado(1, { estado: "Inactivo" });
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.producto.estado, "Inactivo");
    assert.equal(bd.productos[0].estado, "Inactivo");
  });

  test("HE1-HU4-CA1-CP003 · (-) inactivar un producto que no existe", async () => {
    const r = await cambiarEstado(999, { estado: "Inactivo" });
    assert.equal(r.estado, 404);
  });

  test("HE1-HU4-CA1-CP004 · (-) estado que no es Activo ni Inactivo (Pausado)", async () => {
    agregarProducto({ id: 1, estado: "Activo" });
    const r = await cambiarEstado(1, { estado: "Pausado" });
    assert.equal(r.estado, 400);
    assert.equal(bd.productos[0].estado, "Activo", "el estado no debe cambiar");
  });

  test("HE1-HU4-CA1-CP005 · (-) petición sin estado", async () => {
    agregarProducto({ id: 1, estado: "Activo" });
    const r = await cambiarEstado(1, {});
    assert.equal(r.estado, 400);
    assert.equal(bd.productos[0].estado, "Activo", "el estado no debe cambiar");
  });
});

describe("HE1-HU4-CA2 · Cancelación de la inactivación", () => {
  test("HE1-HU4-CA2-CP001 · (+) botón Cancelar en la confirmación", async () => {
    agregarProducto({ id: 1, estado: "Activo" });
    assert.equal(bd.productos[0].estado, "Activo", "el producto debe permanecer Activo tras cancelar");
  });

  test("HE1-HU4-CA2-CP002 · (-) tecla Escape con la confirmación abierta", async () => {
    agregarProducto({ id: 1, estado: "Activo" });
    assert.equal(bd.productos[0].estado, "Activo", "el producto debe permanecer Activo tras presionar Escape");
  });

  test("HE1-HU4-CA2-CP003 · (-) Cancelar desde la ficha del producto", async () => {
    agregarProducto({ id: 1, estado: "Activo" });
    assert.equal(bd.productos[0].estado, "Activo", "el producto debe permanecer Activo tras cancelar en la ficha");
  });
});

describe("HE1-HU4-CA3 · Activación exitosa de producto", () => {
  test("HE1-HU4-CA3-CP001 · (+) activar un producto inactivo con unidades: mensaje", async () => {
    agregarProducto({ id: 1, estado: "Inactivo", stock: 5 });
    const r = await cambiarEstado(1, { estado: "Activo" });
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.mensaje, MENSAJE_ACTIVADO);
  });

  test("HE1-HU4-CA3-CP002 · (+) activar un producto inactivo: vuelve a mostrarse", async () => {
    agregarProducto({ id: 1, estado: "Inactivo", stock: 5 });
    const r = await cambiarEstado(1, { estado: "Activo" });
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.producto.estado, "Activo");
    assert.equal(bd.productos[0].estado, "Activo");
  });

  test("HE1-HU4-CA3-CP003 · (-) activar un producto sin unidades (stock 0)", async () => {
    agregarProducto({ id: 1, estado: "Inactivo", stock: 0 });
    const r = await cambiarEstado(1, { estado: "Activo" });
    assert.equal(r.estado, 409);
    assert.equal(bd.productos[0].estado, "Inactivo", "no debe activarse sin unidades");
  });

  test("HE1-HU4-CA3-CP004 · (-) activar un producto que no existe", async () => {
    const r = await cambiarEstado(999, { estado: "Activo" });
    assert.equal(r.estado, 404);
  });
});