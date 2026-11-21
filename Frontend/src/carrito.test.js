import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  actualizarCantidad,
  agregarAlCarrito,
  aplicarInventario,
  articulosParaCompra,
  calcularResumen,
  cantidadEnCarrito,
  crearIdSolicitud,
  direccionValida,
  eliminarDelCarrito,
  sincronizarCarrito,
  stockDisponible,
  stockRestante,
} from "./carrito.js";

const anillos = { id: 1, ref: "ANI00001", nombre: "Anillos Dualis Blue", precio: 2450000, stock: 10, estado: "Activo" };
const pendientes = { id: 4, ref: "ARE00001", nombre: "Pendientes Flora Celeste", precio: 550000, stock: 12, estado: "Activo" };
const perfume = { id: 5, ref: "PER00002", nombre: "Versace Eros", precio: 364990, stock: 2, estado: "Activo" };
const cupon = { codigo: "PROMO2026", porcentaje: 5 };

describe("HE3-HU2 · Agregar producto al carrito · escenarios 1 y 2", () => {
  it("agrega una unidad desde el catálogo y varias desde la ficha", () => {
    let carrito = agregarAlCarrito([], anillos);
    carrito = agregarAlCarrito(carrito, pendientes, 3);
    carrito = agregarAlCarrito(carrito, anillos, 2);

    assert.deepEqual(carrito, [
      { producto: anillos, cantidad: 3 },
      { producto: pendientes, cantidad: 3 },
    ]);
    assert.equal(cantidadEnCarrito(carrito, anillos.id), 3);
    assert.equal(cantidadEnCarrito(carrito, 99), 0);
  });
});

describe("HE3-HU2 escenario 1 y HE3-HU3 escenario 2 · límite por stock al agregar", () => {
  it("no pasa del stock y devuelve el mismo carrito cuando ya está en el máximo", () => {
    const carrito = agregarAlCarrito([], perfume, 5);
    assert.equal(carrito[0].cantidad, 2);

    assert.equal(agregarAlCarrito(carrito, perfume, 1), carrito);
    assert.equal(agregarAlCarrito([], { ...perfume, stock: 0 }, 1).length, 0);
  });
});

describe("HE3-HU3 escenario 1 y HE3-HU4 escenario 1 · modificar y retirar", () => {
  it("ajusta cantidades entre 1 y el stock y elimina productos", () => {
    let carrito = agregarAlCarrito(agregarAlCarrito([], anillos), perfume);

    carrito = actualizarCantidad(carrito, perfume.id, 9);
    assert.equal(cantidadEnCarrito(carrito, perfume.id), 2);
    carrito = actualizarCantidad(carrito, perfume.id, 0);
    assert.equal(cantidadEnCarrito(carrito, perfume.id), 1);
    carrito = actualizarCantidad(carrito, anillos.id, 4);
    assert.equal(cantidadEnCarrito(carrito, anillos.id), 4);

    assert.deepEqual(eliminarDelCarrito(carrito, anillos.id), [{ producto: perfume, cantidad: 1 }]);
  });
});

describe("HE3-HU3 · Modificar cantidades · escenario 2", () => {
  it("stockDisponible tolera valores que no son números", () => {
    assert.equal(stockDisponible({ stock: "7" }), 7);
    assert.equal(stockDisponible({ stock: -3 }), 0);
    assert.equal(stockDisponible({ stock: undefined }), Number.POSITIVE_INFINITY);
  });

  it("calcula el stock restante restando las unidades que ya están en el carrito", () => {
    const carrito = [{ producto: perfume, cantidad: 1 }];

    assert.equal(stockRestante(perfume, carrito), 1);
    assert.equal(stockRestante(perfume, [{ producto: perfume, cantidad: 2 }]), 0);
    assert.equal(stockRestante({ ...perfume, stock: undefined }, []), Number.POSITIVE_INFINITY);
  });
});

describe("HE3-HU6 · Procesar la compra · escenario 4", () => {
  it("valida direcciones con al menos cinco caracteres, una letra y un número", () => {
    for (const direccion of [
      "Calle 10A Norte #25A-03",
      "Vereda El Tablón, casa 4",
    ]) {
      assert.equal(direccionValida(direccion), true, direccion);
    }

    for (const direccion of [
      "hola mundo",
      "12345",
      "Calle 0 #25A-03",
      "Calle",
      "a".repeat(301),
      "",
    ]) {
      assert.equal(direccionValida(direccion), false, direccion);
    }
  });
});

describe("HE3-HU6 · Procesar la compra · escenario 1 · resumen y cálculo", () => {
  it("calcula total de productos, subtotal, descuento y total (valores del prototipo)", () => {
    const carrito = [
      { producto: anillos, cantidad: 2 },
      { producto: pendientes, cantidad: 4 },
    ];

    assert.deepEqual(calcularResumen(carrito), {
      cantidadTotal: 6,
      subtotal: 7100000,
      descuento: 0,
      total: 7100000,
    });
    // Prototipo_Usuario_carrito_Descuento: PROMO2026 5 % -> $355.000 y $6.745.000
    assert.deepEqual(calcularResumen(carrito, cupon), {
      cantidadTotal: 6,
      subtotal: 7100000,
      descuento: 355000,
      total: 6745000,
    });
  });

  it("reporte 1 · el cupón se refleja en el total y se recalcula si cambian las cantidades", () => {
    let carrito = [{ producto: anillos, cantidad: 1 }];
    assert.equal(calcularResumen(carrito, cupon).total, 2327500);

    carrito = actualizarCantidad(carrito, anillos.id, 2);
    assert.deepEqual(calcularResumen(carrito, cupon), {
      cantidadTotal: 2,
      subtotal: 4900000,
      descuento: 245000,
      total: 4655000,
    });
  });

  it("reporte 2 · cada incremento de cantidad cambia el resumen hasta llegar al stock", () => {
    let carrito = [{ producto: perfume, cantidad: 1 }];
    const antes = calcularResumen(carrito);

    carrito = actualizarCantidad(carrito, perfume.id, 2);
    const despues = calcularResumen(carrito);
    assert.equal(despues.cantidadTotal, antes.cantidadTotal + 1);
    assert.equal(despues.subtotal, antes.subtotal + perfume.precio);

    // En el máximo ya no cambia: la página muestra "Stock máximo alcanzado"
    assert.deepEqual(calcularResumen(actualizarCantidad(carrito, perfume.id, 3)), despues);
  });

  it("redondea el descuento igual que el backend (medio peso hacia arriba)", () => {
    assert.equal(calcularResumen([{ producto: perfume, cantidad: 1 }], cupon).descuento, 18250);
    assert.equal(calcularResumen([{ producto: perfume, cantidad: 2 }], cupon).descuento, 36499);
    assert.equal(calcularResumen([], cupon).total, 0);
  });

  it("al backend solo se envían producto y cantidad, nunca precios ni totales", () => {
    const carrito = [
      { producto: anillos, cantidad: 2 },
      { producto: perfume, cantidad: 1 },
    ];

    assert.deepEqual(articulosParaCompra(carrito), [
      { productoId: 1, cantidad: 2 },
      { productoId: 5, cantidad: 1 },
    ]);
  });
});

describe("HE3-HU6 · Procesar la compra · escenario 2 · solicitud de pago", () => {
  it("cada intento de pago tiene un identificador distinto y válido para el backend", () => {
    const a = crearIdSolicitud();
    const b = crearIdSolicitud();

    assert.notEqual(a, b);
    assert.match(a, /^[A-Za-z0-9_-]{8,64}$/);
  });
});

describe("HE3-HU6 · Procesar la compra · escenario 2 · coherencia del inventario", () => {
  it("actualiza precio y stock, baja cantidades y retira lo que ya no se puede comprar", () => {
    const carrito = [
      { producto: anillos, cantidad: 6 },
      { producto: pendientes, cantidad: 2 },
      { producto: perfume, cantidad: 2 },
      { producto: { id: 77, precio: 1, stock: 5 }, cantidad: 1 },
    ];
    const catalogo = [
      { ...anillos, stock: 4 }, // quedan menos unidades
      { ...pendientes, precio: 600000 }, // cambió el precio
      { ...perfume, stock: 0, estado: "Inactivo" }, // se agotó
    ];

    const { carrito: actualizado, ajustado } = sincronizarCarrito(carrito, catalogo);

    assert.equal(ajustado, true);
    assert.deepEqual(actualizado, [
      { producto: catalogo[0], cantidad: 4 },
      { producto: catalogo[1], cantidad: 2 },
    ]);
    assert.equal(calcularResumen(actualizado).subtotal, 4 * 2450000 + 2 * 600000);
  });

  it("si nada cambió devuelve el mismo carrito", () => {
    const carrito = [{ producto: anillos, cantidad: 2 }];

    const resultado = sincronizarCarrito(carrito, [anillos, pendientes]);

    assert.equal(resultado.carrito, carrito);
    assert.equal(resultado.ajustado, false);
  });

  it("aplica el inventario que devuelve la compra sin recalcular el stock en el navegador", () => {
    const productos = aplicarInventario(
      [anillos, pendientes, perfume],
      [
        { id: 1, stock: 8, estado: "Activo" },
        { id: 5, stock: 0, estado: "Inactivo" },
      ],
    );

    assert.deepEqual(
      productos.map(({ id, stock, estado }) => ({ id, stock, estado })),
      [
        { id: 1, stock: 8, estado: "Activo" },
        { id: 4, stock: 12, estado: "Activo" },
        { id: 5, stock: 0, estado: "Inactivo" },
      ],
    );
    assert.equal(productos[1], pendientes);
  });
});
