import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatearFechaPedido,
  historialDesdeCatalogo,
  mensajeErrorDetalle,
  migaHistorial,
  rutaHistorialDesde,
} from "./historial.js";

describe("formatearFechaPedido", () => {
  it("usa el formato dd-MM-yyyy", () => {
    assert.equal(formatearFechaPedido("2026-03-07T15:00:00.000Z"), "07-03-2026");
  });

  it("usa la hora de Colombia (UTC-5): a las 02:00 UTC todavía es el día anterior", () => {
    assert.equal(formatearFechaPedido("2026-03-08T02:00:00.000Z"), "07-03-2026");
  });

  it("con una fecha inválida devuelve texto vacío", () => {
    assert.equal(formatearFechaPedido("no es fecha"), "");
    assert.equal(formatearFechaPedido(undefined), "");
  });
});

describe("rutas del historial", () => {
  it("desde el catálogo mantiene el camino del catálogo", () => {
    assert.equal(historialDesdeCatalogo("/Usuario/Catalogo"), true);
    assert.equal(rutaHistorialDesde("/Usuario/Catalogo"), "/Usuario/Catalogo/Historial_Pedidos");
    assert.equal(rutaHistorialDesde("/Usuario/Catalogo/Historial_Pedidos"), "/Usuario/Catalogo/Historial_Pedidos");
  });

  it("desde el resto de pantallas usa el camino del inicio", () => {
    assert.equal(historialDesdeCatalogo("/Usuario"), false);
    assert.equal(rutaHistorialDesde("/Usuario"), "/Usuario/Historial_Pedidos");
    assert.equal(rutaHistorialDesde("/Usuario/Carrito"), "/Usuario/Historial_Pedidos");
  });
});

describe("migaHistorial", () => {
  it("desde el inicio: Inicio > Historial de pedidos", () => {
    assert.deepEqual(migaHistorial("/Usuario/Historial_Pedidos").map((n) => n.nombre), [
      "Inicio",
      "Historial de pedidos",
    ]);
  });

  it("desde el catálogo: Inicio > Catálogo > Historial de pedidos", () => {
    assert.deepEqual(migaHistorial("/Usuario/Catalogo/Historial_Pedidos").map((n) => n.nombre), [
      "Inicio",
      "Catálogo",
      "Historial de pedidos",
    ]);
  });
});

describe("mensajeErrorDetalle", () => {
  it("con un pedido inexistente (404) avisa que no se encontró", () => {
    assert.equal(mensajeErrorDetalle({ ok: false, estado: 404, mensaje: "El pedido no existe." }), "No se encontró el pedido.");
  });

  it("con otro error usa el mensaje del servidor", () => {
    assert.equal(mensajeErrorDetalle({ ok: false, estado: 500, mensaje: "Falla del servidor" }), "Falla del servidor");
  });

  it("sin mensaje usa uno genérico", () => {
    assert.match(mensajeErrorDetalle({ ok: false }), /No se pudo cargar el detalle/);
    assert.match(mensajeErrorDetalle(undefined), /No se pudo cargar el detalle/);
  });
});
