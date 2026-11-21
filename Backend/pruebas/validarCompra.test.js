// Pruebas de las reglas de la compra (validarCompra.js): no usan servidor ni base de datos.
// Ejecutar solo este archivo:  node --test pruebas/validarCompra.test.js
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  buscarCupon,
  calcularTotales,
  direccionValida,
  validarCompra,
  METODOS_PAGO,
  LINEAS_MAXIMAS,
} from "../validarCompra.js";

const base = (extra = {}) => ({
  articulos: [{ productoId: 1, cantidad: 2 }],
  metodoPago: "Daviplata",
  direccion: "Calle 10A Norte #25A-03",
  ...extra,
});

describe("validarCompra · carrito", () => {
  test("acepta una compra válida y solo conserva los campos permitidos", () => {
    const { valores, error } = validarCompra(
      base({ total: 1, subtotal: 1, descuento: 1, numeroPedido: "X", articulos: [{ productoId: "3", cantidad: "2", precio: 1 }] }),
    );

    assert.equal(error, undefined);
    assert.deepEqual(valores, {
      articulos: [{ productoId: 3, cantidad: 2 }],
      metodoPago: "Daviplata",
      direccion: "Calle 10A Norte #25A-03",
      cupon: null,
      idSolicitud: null,
      comprador: null,
    });
  });

  test("ordena los productos por id y une las líneas repetidas", () => {
    const { valores } = validarCompra(
      base({
        articulos: [
          { productoId: 9, cantidad: 1 },
          { productoId: 2, cantidad: 3 },
          { productoId: 9, cantidad: 4 },
        ],
      }),
    );

    assert.deepEqual(valores.articulos, [
      { productoId: 2, cantidad: 3 },
      { productoId: 9, cantidad: 5 },
    ]);
  });

  test("rechaza cuerpos que no son un objeto", () => {
    for (const cuerpo of [undefined, null, "texto", 5, [], [base()]]) {
      assert.equal(validarCompra(cuerpo).error.codigo, "CARRITO_VACIO");
    }
  });

  test("rechaza cantidades que no son enteros positivos", () => {
    for (const cantidad of [0, -1, 1.5, "1.5", "1e3", "0x10", "", " ", null, undefined, true, NaN, Infinity, [], {}, "-2", 100000000]) {
      const { error } = validarCompra(base({ articulos: [{ productoId: 1, cantidad }] }));
      assert.equal(error?.codigo, "CANTIDAD_INVALIDA", `cantidad ${String(cantidad)}`);
      assert.equal(error.estado, 400);
    }
  });

  test("rechaza identificadores de producto inválidos", () => {
    for (const productoId of [0, -3, 1.5, "abc", "1 OR 1=1", null, undefined, {}, [1]]) {
      const { error } = validarCompra(base({ articulos: [{ productoId, cantidad: 1 }] }));
      assert.equal(error?.codigo, "PRODUCTO_INVALIDO", `productoId ${String(productoId)}`);
    }
    assert.equal(validarCompra(base({ articulos: [null] })).error.codigo, "PRODUCTO_INVALIDO");
  });

  test("limita la cantidad de productos distintos", () => {
    const articulos = Array.from({ length: LINEAS_MAXIMAS + 1 }, (_, i) => ({ productoId: i + 1, cantidad: 1 }));

    assert.equal(validarCompra(base({ articulos })).error.codigo, "CARRITO_DEMASIADO_GRANDE");
    assert.equal(validarCompra(base({ articulos: articulos.slice(1) })).error, undefined);
  });
});

describe("validarCompra · método de pago, dirección y cupón", () => {
  test("los 9 métodos del diseño son válidos y 'Ninguno' no", () => {
    assert.equal(METODOS_PAGO.length, 9);
    METODOS_PAGO.forEach((metodoPago) => assert.equal(validarCompra(base({ metodoPago })).error, undefined));
    assert.deepEqual(validarCompra(base({ metodoPago: "Ninguno" })).error.errores, { metodo: true });
  });

  test("direccionValida: mismas reglas que el frontend", () => {
    for (const valida of ["Calle 10A Norte #25A-03", "Calle 10 # 5-20", "Carrera 7 # 12-34", "Calle 05 # 1-2", "Vereda El Tablón, casa 4"]) {
      assert.equal(direccionValida(valida), true, valida);
    }
    for (const invalida of ["", "    ", "abc", "hola mundo", "12345", "Calle 0 #25A-03", "calle 0", "CARRERA 0 # 2-3", "Cra. 0 # 2", "Avenida 0", "Av 0 # 1", null, undefined, 12345678, {}, "a".repeat(301)]) {
      assert.equal(direccionValida(invalida), false, String(invalida));
    }
  });

  test("buscarCupon normaliza el código y no acepta propiedades heredadas", () => {
    assert.deepEqual(buscarCupon("PROMO2026"), { codigo: "PROMO2026", porcentaje: 5 });
    assert.deepEqual(buscarCupon(" promo2026 "), { codigo: "PROMO2026", porcentaje: 5 });
    for (const codigo of ["", "PROMO", "PROMO2026X", "constructor", "toString", "__proto__", null, undefined, {}]) {
      assert.equal(buscarCupon(codigo), null, String(codigo));
    }
  });

  test("un cupón incorrecto detiene la compra; uno vacío no", () => {
    assert.equal(validarCompra(base({ codigoCupon: "NOEXISTE" })).error.codigo, "CUPON_INVALIDO");
    assert.equal(validarCompra(base({ codigoCupon: "" })).valores.cupon, null);
    assert.deepEqual(validarCompra(base({ codigoCupon: "promo2026" })).valores.cupon, {
      codigo: "PROMO2026",
      porcentaje: 5,
    });
  });
});

describe("calcularTotales · dinero en pesos enteros", () => {
  test("sin cupón: total = subtotal", () => {
    const totales = calcularTotales(
      [
        { precio: 2450000, cantidad: 2 },
        { precio: 550000, cantidad: 2 },
      ],
      null,
    );

    assert.equal(totales.subtotal, 6000000);
    assert.equal(totales.descuento, 0);
    assert.equal(totales.total, 6000000);
    assert.equal(totales.totalProductos, 4);
    assert.deepEqual(totales.detalles.map((d) => d.subtotal), [4900000, 1100000]);
  });

  test("5 %: redondea al peso más cercano y la mitad hacia arriba", () => {
    const cupon = { porcentaje: 5 };
    for (const [subtotal, descuento] of [
      [7100000, 355000],
      [364990, 18250], // 18.249,5
      [409900, 20495],
      [10, 1], // 0,5
      [9, 0], // 0,45
      [29, 1], // 1,45
      [30, 2], // 1,5
      [1, 0],
      [999999999999, 50000000000],
    ]) {
      const totales = calcularTotales([{ precio: subtotal, cantidad: 1 }], cupon);
      assert.equal(totales.descuento, descuento, `subtotal ${subtotal}`);
      assert.equal(totales.descuento, Math.round((subtotal * 5) / 100), "igual que el frontend");
      assert.equal(totales.total + totales.descuento, totales.subtotal);
      assert.ok(Number.isInteger(totales.total));
    }
  });

  test("el descuento se calcula sobre el subtotal de toda la compra, no línea por línea", () => {
    // Línea por línea daría 18.250 + 18.250 = 36.500; sobre el subtotal 729.980 es 36.499
    const totales = calcularTotales(
      [
        { precio: 364990, cantidad: 1 },
        { precio: 364990, cantidad: 1 },
      ],
      { porcentaje: 5 },
    );

    assert.equal(totales.descuento, 36499);
    assert.equal(totales.total, 693481);
  });
});
