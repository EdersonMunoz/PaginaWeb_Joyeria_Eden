// ---------------------------------------------------------------
// Pruebas · HE4 Épica 4 · Sprint 4
// HE4-HU2 · Consultar historial de pedidos (GET /api/pedidos)
//
// Igual que las del Sprint 3: Oracle FALSO en memoria (pruebas/ayudasCompras.js) y el
// backend real por HTTP. Ejecutar solo este archivo:  node --test pruebas/HE4-S4.test.js
// ---------------------------------------------------------------
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  agregarProducto,
  agregarUsuario,
  bd,
  comprar,
  compraValida,
  consultar,
  erroresRegistrados,
  pedir,
  prepararEntorno,
  tokenDe,
} from "./ayudasCompras.js";

prepararEntorno();

const anillos = (extra) =>
  agregarProducto({ ref: "ANI00001", nombre: "Anillos Dualis Blue", precio: 2450000, stock: 10, ...extra });
const pendientes = (extra) =>
  agregarProducto({ ref: "ARE00001", nombre: "Pendientes Flora Celeste", precio: 550000, stock: 12, ...extra });

const historial = (usuario) => pedir("/api/pedidos", usuario ? { token: tokenDe(usuario) } : {});

describe("HE4-HU2 · Consultar historial de pedidos · escenario 1 · listado de pedidos existentes", () => {
  test("HE4-S4-PU001 · lista los pedidos de la cuenta con número, cantidad de productos y fecha", async () => {
    const ana = agregarUsuario();
    const a = anillos();
    const p = pendientes();
    await comprar(compraValida([{ productoId: a.id, cantidad: 2 }, { productoId: p.id, cantidad: 3 }]), {
      token: tokenDe(ana),
    });

    const r = await historial(ana);

    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.pedidos.length, 1);
    const [pedido] = r.cuerpo.pedidos;
    assert.equal(pedido.numeroPedido, "ED-00000001");
    assert.equal(pedido.totalProductos, 5);
    assert.ok(Math.abs(Date.now() - new Date(pedido.fecha).getTime()) < 60000);
  });

  test("HE4-S4-PU002 · el listado solo trae datos básicos (sin precios, dirección ni método de pago)", async () => {
    const ana = agregarUsuario();
    const a = anillos();
    await comprar(compraValida([{ productoId: a.id, cantidad: 1 }]), { token: tokenDe(ana) });

    const r = await historial(ana);

    assert.deepEqual(Object.keys(r.cuerpo.pedidos[0]).sort(), ["fecha", "numeroPedido", "totalProductos"]);
  });

  test("HE4-S4-PU003 · ordena del pedido más reciente al más antiguo", async () => {
    const ana = agregarUsuario();
    const a = anillos();
    await comprar(compraValida([{ productoId: a.id, cantidad: 1 }]), { token: tokenDe(ana) });
    await comprar(compraValida([{ productoId: a.id, cantidad: 2 }]), { token: tokenDe(ana) });
    await comprar(compraValida([{ productoId: a.id, cantidad: 3 }]), { token: tokenDe(ana) });
    // Se fuerza una fecha antigua en el primero para que el orden no dependa del reloj
    bd.pedidos[0].fecha = new Date("2026-01-01T10:00:00Z");

    const r = await historial(ana);

    assert.deepEqual(
      r.cuerpo.pedidos.map((pedido) => pedido.numeroPedido),
      ["ED-00000003", "ED-00000002", "ED-00000001"],
    );
  });

  test("HE4-S4-PU004 · cada cuenta ve solo sus pedidos", async () => {
    const ana = agregarUsuario();
    const luis = agregarUsuario({ usuario: "luis", correo: "luis@example.com", identificacion: "555" });
    const a = anillos();
    await comprar(compraValida([{ productoId: a.id, cantidad: 1 }]), { token: tokenDe(ana) });
    await comprar(compraValida([{ productoId: a.id, cantidad: 4 }]), { token: tokenDe(luis) });

    const deAna = await historial(ana);
    const deLuis = await historial(luis);

    assert.deepEqual(deAna.cuerpo.pedidos.map((p) => p.totalProductos), [1]);
    assert.deepEqual(deLuis.cuerpo.pedidos.map((p) => p.totalProductos), [4]);
    assert.notEqual(deAna.cuerpo.pedidos[0].numeroPedido, deLuis.cuerpo.pedidos[0].numeroPedido);
  });
});

describe("HE4-HU2 · Consultar historial de pedidos · escenario 2 · historial sin pedidos", () => {
  test("HE4-S4-PU005 · una cuenta sin compras recibe una lista vacía", async () => {
    const ana = agregarUsuario();

    const r = await historial(ana);

    assert.equal(r.estado, 200);
    assert.deepEqual(r.cuerpo, { pedidos: [] });
  });

  test("HE4-S4-PU006 · los pedidos de invitado (sin cuenta) no aparecen en el historial de nadie", async () => {
    const ana = agregarUsuario();
    const a = anillos();
    await comprar(compraValida([{ productoId: a.id, cantidad: 1 }]), { sinSesion: true });

    const r = await historial(ana);

    assert.deepEqual(r.cuerpo.pedidos, []);
  });
});

describe("HE4-HU2 · Consultar historial de pedidos · seguridad", () => {
  test("HE4-S4-PU007 · sin sesión responde 401", async () => {
    const r = await historial(null);

    assert.equal(r.estado, 401);
  });

  test("HE4-S4-PU008 · un token inválido responde 401", async () => {
    const r = await pedir("/api/pedidos", { token: "token.invalido" });

    assert.equal(r.estado, 401);
  });

  test("HE4-S4-PU009 · el administrador no tiene historial de pedidos (403)", async () => {
    const admin = agregarUsuario({ usuario: "admin", rol: "admin", correo: "admin@example.com", identificacion: "1" });

    const r = await historial(admin);

    assert.equal(r.estado, 403);
  });

  test("HE4-S4-PU010 · no se puede pedir el historial de otra cuenta con parámetros", async () => {
    const ana = agregarUsuario();
    const luis = agregarUsuario({ usuario: "luis", correo: "luis@example.com", identificacion: "555" });
    const a = anillos();
    await comprar(compraValida([{ productoId: a.id, cantidad: 4 }]), { token: tokenDe(luis) });

    const r = await pedir(`/api/pedidos?usuarioId=${luis.id}&usuario_id=${luis.id}`, { token: tokenDe(ana) });

    assert.equal(r.estado, 200);
    assert.deepEqual(r.cuerpo.pedidos, []);
  });

  test("HE4-S4-PU011 · consultar el historial no genera errores 500", async () => {
    const ana = agregarUsuario();

    await historial(ana);

    assert.equal(erroresRegistrados().length, 0);
  });
});

describe("HE4-HU3 · Consulta del detalle de un pedido · escenario 1 · visualización del detalle de la orden", () => {
  test("HE4-S4-PU012 · desde el historial se abre el detalle con productos, cantidades, precios, método de pago y dirección", async () => {
    const ana = agregarUsuario();
    const a = anillos();
    const p = pendientes();
    await comprar(
      compraValida([{ productoId: a.id, cantidad: 2 }, { productoId: p.id, cantidad: 1 }], {
        metodoPago: "Nequi",
        direccion: "Calle 10A Norte #25A-03",
      }),
      { token: tokenDe(ana) },
    );
    const { cuerpo } = await historial(ana);

    const r = await consultar(cuerpo.pedidos[0].numeroPedido, { token: tokenDe(ana) });

    assert.equal(r.estado, 200);
    const detalle = r.cuerpo.comprobante;
    assert.equal(detalle.numeroPedido, cuerpo.pedidos[0].numeroPedido);
    assert.deepEqual(
      detalle.articulos.map(({ producto, cantidad, subtotal }) => ({
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad,
        subtotal,
      })),
      [
        { nombre: "Anillos Dualis Blue", precio: 2450000, cantidad: 2, subtotal: 4900000 },
        { nombre: "Pendientes Flora Celeste", precio: 550000, cantidad: 1, subtotal: 550000 },
      ],
    );
    assert.equal(detalle.metodoPago, "Nequi");
    assert.equal(detalle.direccion, "Calle 10A Norte #25A-03");
    assert.equal(detalle.total, 5450000);
    assert.equal(detalle.totalProductos, cuerpo.pedidos[0].totalProductos);
  });

  test("HE4-S4-PU013 · el detalle conserva los precios de la compra aunque el catálogo cambie después", async () => {
    const ana = agregarUsuario();
    const a = anillos();
    const compra = await comprar(compraValida([{ productoId: a.id, cantidad: 1 }]), { token: tokenDe(ana) });
    a.precio = 9999999;
    a.nombre = "Nombre nuevo";

    const r = await consultar(compra.cuerpo.comprobante.numeroPedido, { token: tokenDe(ana) });

    assert.equal(r.cuerpo.comprobante.articulos[0].producto.precio, 2450000);
    assert.equal(r.cuerpo.comprobante.articulos[0].producto.nombre, "Anillos Dualis Blue");
  });

  test("HE4-S4-PU014 · el detalle trae los datos del cliente guardados en la compra", async () => {
    const ana = agregarUsuario();
    const a = anillos();
    const compra = await comprar(compraValida([{ productoId: a.id, cantidad: 1 }]), { token: tokenDe(ana) });

    const r = await consultar(compra.cuerpo.comprobante.numeroPedido, { token: tokenDe(ana) });

    assert.equal(r.cuerpo.comprobante.cliente.nombre, "Ana Pérez");
    assert.equal(r.cuerpo.comprobante.cliente.correo, "ana@example.com");
    assert.ok(r.cuerpo.comprobante.fechaEmision);
  });
});

describe("HE4-HU3 · Consulta del detalle de un pedido · seguridad", () => {
  test("HE4-S4-PU015 · no se puede abrir el detalle de un pedido de otra cuenta (404)", async () => {
    const ana = agregarUsuario();
    const luis = agregarUsuario({ usuario: "luis", correo: "luis@example.com", identificacion: "555" });
    const a = anillos();
    const compra = await comprar(compraValida([{ productoId: a.id, cantidad: 1 }]), { token: tokenDe(luis) });

    const r = await consultar(compra.cuerpo.comprobante.numeroPedido, { token: tokenDe(ana) });

    assert.equal(r.estado, 404);
  });

  test("HE4-S4-PU016 · un pedido inexistente responde 404 y sin sesión 401", async () => {
    const ana = agregarUsuario();

    assert.equal((await consultar("ED-00000999", { token: tokenDe(ana) })).estado, 404);
    assert.equal((await consultar("ED-00000999")).estado, 401);
  });
});
