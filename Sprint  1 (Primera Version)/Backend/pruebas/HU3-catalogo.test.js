// HE1-HU3 · Consultar el catálogo interactivo
//   GET /api/productos        (lista con filtros)
//   GET /api/productos/:id    (detalle)
// Técnica: caja negra. Formato del ID: HE1-HU3-CA<criterio>-CP<caso>
// La base de datos es falsa y no filtra: se comprueba qué filtros recibe la consulta SQL.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { bd, agregarProducto, prepararEntorno, pedir, ultimaConsulta } from "./ayudas.js";

prepararEntorno();

describe("HE1-HU3-CA1 · Consulta del catálogo", () => {
  test("HE1-HU3-CA1-CP001 · (+) consultar el catálogo sin filtros", async () => {
    agregarProducto({ id: 1 });
    const r = await pedir("/api/productos");
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.productos.length, 1);
    assert.equal(ultimaConsulta().datos.estado, "Activo", "debe pedir solo productos disponibles");
  });

  test("HE1-HU3-CA1-CP002 · (-) estado desconocido en la dirección (?estado=xyz)", async () => {
    agregarProducto({ id: 1 });
    const r = await pedir("/api/productos?estado=xyz");
    assert.equal(r.estado, 200);
    assert.equal(
      ultimaConsulta().datos.estado,
      "Activo",
      "con un estado inválido debe mostrar solo los productos disponibles",
    );
  });

  test("HE1-HU3-CA1-CP003 · (-) catálogo sin productos", async () => {
    const r = await pedir("/api/productos");
    assert.equal(r.estado, 200);
    assert.deepEqual(r.cuerpo.productos, []);
  });
});

describe("HE1-HU3-CA2 · Filtro de productos por categoría", () => {
  test("HE1-HU3-CA2-CP001 · (+) filtrar por una categoría válida (Anillos)", async () => {
    const r = await pedir("/api/productos?categoria=Anillos");
    assert.equal(r.estado, 200);
    const { sql, datos } = ultimaConsulta();
    assert.equal(datos.cat0, "Anillos");
    assert.ok(sql.includes("c.nombre IN (:cat0)"));
  });

  test("HE1-HU3-CA2-CP002 · (-) filtrar por una categoría que no existe (Zapatos)", async () => {
    agregarProducto({ id: 1 });
    const r = await pedir("/api/productos?categoria=Zapatos");
    assert.equal(r.estado, 200);
    // Ningún producto coincide con "Zapatos": o la consulta sigue filtrando por categoría,
    // o la respuesta viene vacía. Lo que no debe pasar es mostrar productos de otras categorías.
    const siguesFiltrando = ultimaConsulta()?.sql.includes("c.nombre IN") ?? false;
    assert.ok(
      siguesFiltrando || r.cuerpo.productos.length === 0,
      "con una categoría inexistente no debe mostrar el catálogo completo",
    );
  });

  test("HE1-HU3-CA2-CP003 · (-) una categoría válida mezclada con una inválida", async () => {
    await pedir("/api/productos?categoria=Pulsos,Zapatos");
    const { datos } = ultimaConsulta();
    assert.equal(datos.cat0, "Pulsos");
    assert.equal(datos.cat1, undefined, "la categoría inválida no debe entrar al filtro");
  });
});

describe("HE1-HU3-CA3 · Filtro de productos por precio", () => {
  test("HE1-HU3-CA3-CP001 · (+) rango de precio válido (150000 a 4000000)", async () => {
    const r = await pedir("/api/productos?precioMin=150000&precioMax=4000000");
    assert.equal(r.estado, 200);
    const { sql, datos } = ultimaConsulta();
    assert.equal(datos.precioMin, 150000);
    assert.equal(datos.precioMax, 4000000);
    assert.ok(sql.includes("p.precio >= :precioMin") && sql.includes("p.precio <= :precioMax"));
  });

  test("HE1-HU3-CA3-CP002 · (-) precio mínimo mayor que el máximo", async () => {
    const r = await pedir("/api/productos?precioMin=5000000&precioMax=1000000");
    assert.equal(r.estado, 200);
    // Se aplican los dos límites, así que ningún producto puede cumplir ambos
    const { sql } = ultimaConsulta();
    assert.ok(sql.includes("p.precio >= :precioMin") && sql.includes("p.precio <= :precioMax"));
  });

  test("HE1-HU3-CA3-CP003 · (-) precio mínimo con letras", async () => {
    const r = await pedir("/api/productos?precioMin=abc");
    assert.equal(r.estado, 200);
    assert.equal(ultimaConsulta().datos.precioMin, undefined, "no debe usar un valor inválido");
  });
});

describe("HE1-HU3-CA4 · Búsqueda de producto", () => {
  test("HE1-HU3-CA4-CP001 · (+) buscar la palabra bright", async () => {
    const r = await pedir("/api/productos?q=bright");
    assert.equal(r.estado, 200);
    const { sql, datos } = ultimaConsulta();
    assert.equal(datos.q, "%bright%");
    assert.ok(sql.includes("LOWER(p.nombre) LIKE :q"));
  });

  test("HE1-HU3-CA4-CP002 · (-) búsqueda con solo espacios", async () => {
    const r = await pedir(`/api/productos?q=${encodeURIComponent("   ")}`);
    assert.equal(r.estado, 200);
    assert.equal(ultimaConsulta().datos.q, undefined, "no debe filtrar por un texto vacío");
  });

  test("HE1-HU3-CA4-CP003 · (-) búsqueda con intento de inyección SQL", async () => {
    const texto = "' OR 1=1 --";
    const r = await pedir(`/api/productos?q=${encodeURIComponent(texto)}`);
    assert.equal(r.estado, 200);
    const { sql, datos } = ultimaConsulta();
    assert.equal(datos.q, "%' or 1=1 --%", "el texto debe viajar como parámetro");
    assert.ok(!sql.includes("1=1"), "el texto no debe quedar escrito dentro del SQL");
  });

  test("HE1-HU3-CA4-CP004 · (+) buscar en mayúsculas (BRIGHT)", async () => {
    await pedir("/api/productos?q=BRIGHT");
    assert.equal(ultimaConsulta().datos.q, "%bright%");
  });
});

describe("HE1-HU3-CA5 · Detalle ampliado del producto", () => {
  test("HE1-HU3-CA5-CP001 · (+) consultar un producto que existe", async () => {
    agregarProducto({ id: 7, ref: "ANI007", descripcion: "Anillo con diamante" });
    const r = await pedir("/api/productos/7");
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.producto.ref, "ANI007");
    assert.equal(r.cuerpo.producto.descripcion, "Anillo con diamante");
    assert.ok(r.cuerpo.producto.imagen, "debe traer la ruta de la foto");
  });

  test("HE1-HU3-CA5-CP002 · (-) consultar un producto que no existe (id 999)", async () => {
    const r = await pedir("/api/productos/999");
    assert.equal(r.estado, 404);
    assert.equal(r.cuerpo.mensaje, "El producto no existe.");
  });

  test("HE1-HU3-CA5-CP003 · (-) id que no es un número (abc)", async () => {
    const r = await pedir("/api/productos/abc");
    assert.equal(r.estado, 404);
  });
});
