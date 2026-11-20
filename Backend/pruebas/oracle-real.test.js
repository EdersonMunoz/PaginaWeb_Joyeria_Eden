// Prueba OPCIONAL del Sprint 3 contra un Oracle DE VERDAD (transacción, bloqueos y trigger reales).
//
// `npm test` NO la ejecuta (queda como "skipped"): necesita la base de datos y el archivo .env.
// Para ejecutarla, con la migración db/06_migracion_sprint3_compras.sql ya aplicada:
//
//     cd Backend
//     npm run prueba:oracle
//
// Qué hace:
//   1. Crea 2 productos de prueba con referencia TS3… (no toca los productos existentes).
//   2. Lanza compras simultáneas por la última unidad y comprueba que no hay sobreventa.
//   3. Comprueba que una compra rechazada no deja pedido, detalle ni descuento parcial.
//   4. Comprueba el comprobante guardado y el trigger TRG_PRODUCTO_SIN_STOCK.
//   5. BORRA solo lo que ella misma creó (sus pedidos, sus detalles y sus 2 productos).
// Úsenla en la base local de Docker o, si es en la nube compartida, avisando al equipo.
import "dotenv/config";
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { cerrarBaseDatos, ejecutar, iniciarBaseDatos } from "../baseDatos.js";

const activa = process.env.PRUEBA_ORACLE === "1" || process.argv.includes("--oracle");

describe("Sprint 3 contra Oracle real", { skip: !activa && "se ejecuta con: npm run prueba:oracle" }, () => {
  const marca = `TS3${Date.now().toString(36).toUpperCase()}`.slice(0, 18);
  const pedidosCreados = [];
  let servidor;
  let API;
  let ultimaUnidad;
  let conStock;

  const comprar = async (articulos, extra = {}) => {
    const respuesta = await fetch(`${API}/api/pedidos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        articulos,
        metodoPago: "Itaú Colombia", // con tilde: comprueba también la restricción CHECK
        direccion: "Calle 10A Norte #25A-03",
        ...extra,
      }),
    });
    const cuerpo = await respuesta.json();
    if (cuerpo.comprobante) pedidosCreados.push(cuerpo.comprobante.numeroPedido);
    return { estado: respuesta.status, cuerpo };
  };

  const producto = async (ref) => {
    const { filas } = await ejecutar(
      `SELECT p.id AS "id", p.stock AS "stock", p.estado AS "estado" FROM producto p WHERE p.ref = :ref`,
      { ref },
    );
    return filas[0];
  };

  const crearProducto = async (ref, stock, precio) => {
    await ejecutar(
      `INSERT INTO producto (ref, nombre, precio, categoria_id, stock, descripcion, imagen, estado)
       VALUES (:ref, :nombre, :precio, (SELECT MIN(id) FROM categoria), :stock,
               'Producto temporal de la prueba del Sprint 3', 'productos/AnilloOro.jpeg', 'Activo')`,
      { ref, nombre: `Prueba Sprint 3 ${ref}`, precio, stock },
    );
    return producto(ref);
  };

  before(async () => {
    await iniciarBaseDatos();
    const { filas } = await ejecutar(
      `SELECT COUNT(*) AS "cantidad" FROM user_tables WHERE table_name IN ('PEDIDO', 'DETALLE_PEDIDO')`,
    );
    assert.equal(
      Number(filas[0].cantidad),
      2,
      "Faltan las tablas PEDIDO y DETALLE_PEDIDO: ejecuten db/06_migracion_sprint3_compras.sql",
    );
    ultimaUnidad = await crearProducto(`${marca}A`, 1, 364990);
    conStock = await crearProducto(`${marca}B`, 5, 550000);

    const { crearApp } = await import("../servidor.js");
    await new Promise((listo) => {
      servidor = crearApp().listen(0, "127.0.0.1", listo);
    });
    API = `http://127.0.0.1:${servidor.address().port}`;
  });

  after(async () => {
    try {
      for (const numero of new Set(pedidosCreados)) {
        await ejecutar(
          `DELETE FROM detalle_pedido WHERE pedido_id = (SELECT id FROM pedido WHERE numero = :numero)`,
          { numero },
        );
        await ejecutar(`DELETE FROM pedido WHERE numero = :numero`, { numero });
      }
      await ejecutar(`DELETE FROM producto WHERE ref IN (:a, :b)`, { a: `${marca}A`, b: `${marca}B` });
    } finally {
      if (servidor) await new Promise((listo) => servidor.close(listo));
      await cerrarBaseDatos();
    }
  });

  test("ORA-01 · Una compra rechazada por stock no deja pedido ni descuento parcial (ROLLBACK real)", async () => {
    const r = await comprar([
      { productoId: conStock.id, cantidad: 2 },
      { productoId: ultimaUnidad.id, cantidad: 3 },
    ]);

    assert.equal(r.estado, 409);
    assert.equal((await producto(`${marca}B`)).stock, 5);
    assert.equal((await producto(`${marca}A`)).stock, 1);
    const { filas } = await ejecutar(
      `SELECT COUNT(*) AS "cantidad" FROM detalle_pedido WHERE producto_id IN (:a, :b)`,
      { a: ultimaUnidad.id, b: conStock.id },
    );
    assert.equal(Number(filas[0].cantidad), 0);
  });

  test("ORA-02 · Cinco compras simultáneas de la última unidad: solo una se registra", async () => {
    const respuestas = await Promise.all(
      Array.from({ length: 5 }, () => comprar([{ productoId: ultimaUnidad.id, cantidad: 1 }])),
    );

    assert.equal(respuestas.filter((r) => r.estado === 201).length, 1);
    assert.equal(respuestas.filter((r) => r.estado === 409).length, 4);
    const final = await producto(`${marca}A`);
    assert.equal(final.stock, 0);
    assert.equal(final.estado, "Inactivo", "el trigger TRG_PRODUCTO_SIN_STOCK debe inactivarlo");
    const { filas } = await ejecutar(
      `SELECT NVL(SUM(cantidad), 0) AS "vendidas" FROM detalle_pedido WHERE producto_id = :id`,
      { id: ultimaUnidad.id },
    );
    assert.equal(Number(filas[0].vendidas), 1);
  });

  test("ORA-03 · Compra con cupón: pedido, detalle e inventario quedan guardados y cuadran", async () => {
    const r = await comprar([{ productoId: conStock.id, cantidad: 2 }], { codigoCupon: "PROMO2026" });

    assert.equal(r.estado, 201);
    const { comprobante, claveConsulta } = r.cuerpo;
    assert.match(comprobante.numeroPedido, /^ED-\d{8}$/);
    assert.equal(comprobante.subtotal, 1100000);
    assert.equal(comprobante.descuento, 55000);
    assert.equal(comprobante.total, 1045000);
    assert.equal(comprobante.metodoPago, "Itaú Colombia");
    assert.ok(Math.abs(Date.now() - new Date(comprobante.fechaEmision).getTime()) < 10 * 60 * 1000);
    assert.equal((await producto(`${marca}B`)).stock, 3);

    const consulta = await fetch(`${API}/api/pedidos/${comprobante.numeroPedido}`, {
      headers: { "X-Clave-Consulta": claveConsulta },
    });
    assert.equal(consulta.status, 200);
    assert.deepEqual((await consulta.json()).comprobante, comprobante);

    const sinClave = await fetch(`${API}/api/pedidos/${comprobante.numeroPedido}`);
    assert.equal(sinClave.status, 404);
  });
});
