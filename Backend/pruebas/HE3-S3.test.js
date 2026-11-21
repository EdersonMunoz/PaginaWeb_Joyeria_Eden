// Pruebas · HE3 Carrito, compra y comprobante · Sprint 3  (HE3-S3-PU001 ... PU052)
// Cada test lleva el ID del caso (docs/pruebas/Sprint3-Unitarias/Casos_HE3-S3.md).
//
// Cómo funcionan (patrón AAA):
//   Arrange: se prepara un Oracle FALSO en memoria con transacciones (pruebas/ayudasCompras.js).
//   Act:     se llama al backend real por HTTP (rutas de /api/pedidos).
//   Assert:  se revisa la respuesta y lo que quedó "guardado" (pedido, detalle e inventario).
// No usan la base de datos real ni credenciales. Lo que SÍ depende de Oracle de verdad
// (bloqueos reales, triggers, restricciones) se prueba aparte con pruebas/oracle-real.test.js.
//
// Ejecutar solo este archivo:  node --test pruebas/HE3-S3.test.js
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
  productoPorId,
  tokenDe,
} from "./ayudasCompras.js";
import { METODOS_PAGO } from "../validarCompra.js";

prepararEntorno();

const MENSAJE_ERROR_PAGO =
  "Error al realizar el pago de la compra. Por favor completa todos los campos obligatorios y/o corrige la información";

// Productos de los prototipos del Sprint 3
const anillos = (extra) =>
  agregarProducto({ ref: "ANI00001", nombre: "Anillos Dualis Blue", precio: 2450000, stock: 10, ...extra });
const pendientes = (extra) =>
  agregarProducto({ ref: "ARE00001", nombre: "Pendientes Flora Celeste", precio: 550000, stock: 12, ...extra });
const perfume = (extra) =>
  agregarProducto({ ref: "PER00002", nombre: "Versace Eros Eau de Toilette", precio: 364990, stock: 18, ...extra });

// Nada quedó guardado ni descontado
function assertSinCambios(productos) {
  assert.equal(bd.pedidos.length, 0, "no debe quedar ningún pedido");
  assert.equal(bd.detalles.length, 0, "no debe quedar ningún detalle");
  productos.forEach(([producto, stock]) => {
    assert.equal(productoPorId(producto.id).stock, stock, `el stock de ${producto.ref} no debe cambiar`);
  });
  assert.equal(bd.bloqueos.size, 0, "no deben quedar filas bloqueadas");
}

// ===============================================================
describe("HE3-HU1 · Gestionar productos del carrito (validación contra el inventario real)", () => {
  test("HE3-S3-PU001 · (+) Comprar exactamente el stock disponible deja el producto en 0 e Inactivo", async () => {
    const producto = anillos({ stock: 3 });

    const r = await comprar(compraValida([{ productoId: producto.id, cantidad: 3 }]));

    assert.equal(r.estado, 201);
    assert.equal(productoPorId(producto.id).stock, 0);
    // Regla del Sprint 1 (trigger TRG_PRODUCTO_SIN_STOCK): sin unidades queda Inactivo
    assert.equal(productoPorId(producto.id).estado, "Inactivo");
    assert.deepEqual(r.cuerpo.inventario, [{ id: producto.id, stock: 0, estado: "Inactivo" }]);
  });

  test("HE3-S3-PU002 · (-) Una cantidad mayor al stock se rechaza e informa el stock disponible", async () => {
    const producto = anillos({ stock: 2 });

    const r = await comprar(compraValida([{ productoId: producto.id, cantidad: 3 }]));

    assert.equal(r.estado, 409);
    assert.equal(r.cuerpo.codigo, "STOCK_INSUFICIENTE");
    assert.deepEqual(r.cuerpo.conflictos, [
      {
        productoId: producto.id,
        nombre: "Anillos Dualis Blue",
        motivo: "STOCK_INSUFICIENTE",
        cantidadSolicitada: 3,
        stockDisponible: 2,
      },
    ]);
    assertSinCambios([[producto, 2]]);
  });

  for (const [id, caso, cantidad] of [
    ["PU003", "cero", 0],
    ["PU004", "negativa", -1],
    ["PU005", "decimal", 2.5],
    ["PU006", 'texto decimal "2.5"', "2.5"],
    ["PU007", "no numérica", "dos"],
  ]) {
    test(`HE3-S3-${id} · (-) Cantidad ${caso}: no se procesa`, async () => {
      const producto = anillos();

      const r = await comprar(compraValida([{ productoId: producto.id, cantidad }]));

      assert.equal(r.estado, 400);
      assert.equal(r.cuerpo.codigo, "CANTIDAD_INVALIDA");
      assert.equal(bd.conexiones, 0, "ni siquiera debe abrir una transacción");
      assertSinCambios([[producto, 10]]);
    });
  }

  test("HE3-S3-PU008 · (-) Un producto que no existe no se puede comprar", async () => {
    const producto = anillos();

    const r = await comprar(
      compraValida([
        { productoId: producto.id, cantidad: 1 },
        { productoId: 999, cantidad: 1 },
      ]),
    );

    assert.equal(r.estado, 409);
    assert.equal(r.cuerpo.codigo, "PRODUCTO_NO_DISPONIBLE");
    assert.equal(r.cuerpo.conflictos[0].productoId, 999);
    assert.equal(r.cuerpo.conflictos[0].motivo, "INEXISTENTE");
    assertSinCambios([[producto, 10]]);
  });

  test("HE3-S3-PU009 · (-) Un producto inactivo no se puede comprar aunque tenga unidades", async () => {
    const producto = anillos({ estado: "Inactivo", stock: 5 });

    const r = await comprar(compraValida([{ productoId: producto.id, cantidad: 1 }]));

    assert.equal(r.estado, 409);
    assert.equal(r.cuerpo.codigo, "PRODUCTO_NO_DISPONIBLE");
    assert.equal(r.cuerpo.conflictos[0].motivo, "INACTIVO");
    assertSinCambios([[producto, 5]]);
  });

  test("HE3-S3-PU010 · (-) Carrito vacío, ausente o con formato inválido", async () => {
    for (const articulos of [[], undefined, null, "1", { productoId: 1, cantidad: 1 }]) {
      const r = await comprar(compraValida(articulos));
      assert.equal(r.estado, 400);
      assert.equal(r.cuerpo.codigo, "CARRITO_VACIO");
    }
    assertSinCambios([]);
  });

  test("HE3-S3-PU011 · (-) El stock cambió después de agregar al carrito: gana el inventario real", async () => {
    const producto = anillos({ stock: 5 });
    // El cliente agregó 4 al carrito cuando había 5; luego alguien más compró 3
    const otra = await comprar(compraValida([{ productoId: producto.id, cantidad: 3 }]));
    assert.equal(otra.estado, 201);

    const r = await comprar(compraValida([{ productoId: producto.id, cantidad: 4 }]));

    assert.equal(r.estado, 409);
    assert.equal(r.cuerpo.conflictos[0].stockDisponible, 2);
    assert.equal(productoPorId(producto.id).stock, 2);
    assert.equal(bd.pedidos.length, 1);
  });

  test("HE3-S3-PU012 · (+) Líneas repetidas del mismo producto se suman y se validan juntas", async () => {
    const producto = anillos({ stock: 3 });
    const lineas = [
      { productoId: producto.id, cantidad: 2 },
      { productoId: producto.id, cantidad: 2 },
    ];

    const excedida = await comprar(compraValida(lineas));
    assert.equal(excedida.estado, 409);
    assert.equal(excedida.cuerpo.conflictos[0].cantidadSolicitada, 4);

    producto.stock = 4;
    const exitosa = await comprar(compraValida(lineas));
    assert.equal(exitosa.estado, 201);
    assert.equal(exitosa.cuerpo.comprobante.articulos.length, 1);
    assert.equal(exitosa.cuerpo.comprobante.articulos[0].cantidad, 4);
    assert.equal(productoPorId(producto.id).stock, 0);
  });

  test("HE3-S3-PU013 · (+) Después de comprar, el catálogo muestra el stock actualizado", async () => {
    const producto = anillos({ stock: 10 });
    await comprar(compraValida([{ productoId: producto.id, cantidad: 4 }]));

    const detalle = await pedir(`/api/productos/${producto.id}`);

    assert.equal(detalle.estado, 200);
    assert.equal(detalle.cuerpo.producto.stock, 6);
  });
});

// ===============================================================
describe("HE3-HU2 · Procesar compra", () => {
  test("HE3-S3-PU014 · (+) Compra de un producto: registra pedido, detalle y descuenta inventario", async () => {
    const producto = anillos({ stock: 10 });

    const r = await comprar(compraValida([{ productoId: producto.id, cantidad: 2 }]));

    assert.equal(r.estado, 201);
    assert.equal(r.cuerpo.mensaje, "Pago exitoso, compra realizada.");
    assert.equal(bd.pedidos.length, 1);
    const [pedido] = bd.pedidos;
    assert.equal(pedido.subtotal, 4900000);
    assert.equal(pedido.descuento, 0);
    assert.equal(pedido.total, 4900000);
    assert.equal(pedido.metodoPago, "Daviplata");
    assert.equal(pedido.direccion, "Calle 10A Norte #25A-03");
    assert.equal(pedido.estado, "Pagado");
    assert.deepEqual(
      bd.detalles.map(({ id: _id, ...detalle }) => detalle),
      [
        {
          pedidoId: pedido.id,
          linea: 1,
          productoId: producto.id,
          ref: "ANI00001",
          nombre: "Anillos Dualis Blue",
          precio: 2450000,
          cantidad: 2,
          subtotal: 4900000,
        },
      ],
    );
    assert.equal(productoPorId(producto.id).stock, 8);
    assert.equal(productoPorId(producto.id).estado, "Activo");
  });

  test("HE3-S3-PU015 · (+) Compra con varios productos y cantidades distintas", async () => {
    const a = anillos({ stock: 10 });
    const b = pendientes({ stock: 12 });
    const c = perfume({ stock: 18 });

    const r = await comprar(
      compraValida([
        { productoId: c.id, cantidad: 3 },
        { productoId: a.id, cantidad: 1 },
        { productoId: b.id, cantidad: 2 },
      ]),
    );

    assert.equal(r.estado, 201);
    const { comprobante } = r.cuerpo;
    assert.equal(comprobante.totalProductos, 6);
    assert.equal(comprobante.subtotal, 2450000 + 2 * 550000 + 3 * 364990);
    assert.equal(comprobante.total, comprobante.subtotal);
    assert.equal(bd.detalles.length, 3);
    assert.deepEqual(
      [a, b, c].map((p) => productoPorId(p.id).stock),
      [9, 10, 15],
    );
    // La suma de los detalles guardados es el subtotal guardado
    assert.equal(
      bd.detalles.reduce((suma, d) => suma + d.subtotal, 0),
      bd.pedidos[0].subtotal,
    );
  });

  test("HE3-S3-PU016 · (+) Cupón PROMO2026: 5 % sobre el subtotal (valores del prototipo)", async () => {
    // Prototipo_Usuario_carrito_Descuento: subtotal $7.100.000, descuento $355.000, total $6.745.000
    const a = anillos();
    const b = pendientes();

    const r = await comprar(
      compraValida(
        [
          { productoId: a.id, cantidad: 2 },
          { productoId: b.id, cantidad: 4 },
        ],
        { codigoCupon: "PROMO2026" },
      ),
    );

    assert.equal(r.estado, 201);
    const { comprobante } = r.cuerpo;
    assert.equal(comprobante.subtotal, 7100000);
    assert.equal(comprobante.descuento, 355000);
    assert.equal(comprobante.total, 6745000);
    assert.equal(comprobante.codigoCupon, "PROMO2026");
    assert.equal(comprobante.porcentajeDescuento, 5);
    const [pedido] = bd.pedidos;
    assert.equal(pedido.cupon, "PROMO2026");
    assert.equal(pedido.total, pedido.subtotal - pedido.descuento);
  });

  test("HE3-S3-PU017 · (+) Redondeo del descuento: medio peso sube y el total cuadra con lo guardado", async () => {
    const producto = perfume(); // $364.990 -> 5 % = 18.249,5 -> $18.250

    const r = await comprar(
      compraValida([{ productoId: producto.id, cantidad: 1 }], { codigoCupon: "PROMO2026" }),
    );

    assert.equal(r.cuerpo.comprobante.descuento, 18250);
    assert.equal(r.cuerpo.comprobante.total, 346740);
    assert.equal(bd.pedidos[0].descuento + bd.pedidos[0].total, bd.pedidos[0].subtotal);
  });

  test("HE3-S3-PU018 · (-) Cupón incorrecto: error claro y no se registra la compra", async () => {
    const producto = anillos();

    const r = await comprar(
      compraValida([{ productoId: producto.id, cantidad: 1 }], { codigoCupon: "PROMO2025" }),
    );

    assert.equal(r.estado, 400);
    assert.equal(r.cuerpo.codigo, "CUPON_INVALIDO");
    assert.equal(r.cuerpo.mensaje, "El cupón ingresado no es válido");
    assert.deepEqual(r.cuerpo.errores, { cupon: true });
    assertSinCambios([[producto, 10]]);
  });

  test("HE3-S3-PU019 · (+) Cupón vacío o ausente: la compra se procesa sin descuento", async () => {
    const producto = anillos({ stock: 10 });

    for (const extra of [{}, { codigoCupon: "" }, { codigoCupon: "   " }, { codigoCupon: null }]) {
      const r = await comprar(compraValida([{ productoId: producto.id, cantidad: 1 }], extra));
      assert.equal(r.estado, 201);
      assert.equal(r.cuerpo.comprobante.descuento, 0);
      assert.equal(r.cuerpo.comprobante.codigoCupon, "");
      assert.equal(r.cuerpo.comprobante.total, 2450000);
    }
    assert.ok(bd.pedidos.every((pedido) => pedido.cupon === null));
  });

  test("HE3-S3-PU020 · (+) El cupón no distingue mayúsculas ni espacios", async () => {
    const producto = anillos();

    const r = await comprar(
      compraValida([{ productoId: producto.id, cantidad: 1 }], { codigoCupon: "  promo2026 " }),
    );

    assert.equal(r.estado, 201);
    assert.equal(r.cuerpo.comprobante.codigoCupon, "PROMO2026");
    assert.equal(r.cuerpo.comprobante.descuento, 122500);
  });

  test("HE3-S3-PU021 · (+) POST /api/pedidos/cupon: el porcentaje lo define el servidor", async () => {
    const cliente = agregarUsuario();
    const token = tokenDe(cliente);
    const valido = await pedir("/api/pedidos/cupon", {
      metodo: "POST",
      cuerpo: { codigo: "promo2026" },
      token,
    });
    assert.equal(valido.estado, 200);
    assert.deepEqual(valido.cuerpo.cupon, { codigo: "PROMO2026", porcentaje: 5 });

    const invalido = await pedir("/api/pedidos/cupon", {
      metodo: "POST",
      cuerpo: { codigo: "REGALO" },
      token,
    });
    assert.equal(invalido.estado, 400);
    assert.equal(invalido.cuerpo.mensaje, "El cupón ingresado no es válido");

    const vacio = await pedir("/api/pedidos/cupon", {
      metodo: "POST",
      cuerpo: { codigo: "  " },
      token,
    });
    assert.equal(vacio.estado, 400);
    assert.equal(vacio.cuerpo.mensaje, "Ingresa un código de cupón.");

    const sinSesion = await pedir("/api/pedidos/cupon", {
      metodo: "POST",
      cuerpo: { codigo: "PROMO2026" },
    });
    assert.equal(sinSesion.estado, 401);
    assert.equal(sinSesion.cuerpo.mensaje, "Debes iniciar sesión");
  });

  test("HE3-S3-PU022 · (-) Seguridad: precio, descuento, total, número y fecha enviados por el navegador se ignoran", async () => {
    const producto = anillos({ stock: 10 });

    const r = await comprar({
      articulos: [
        { productoId: producto.id, cantidad: 2, precio: 1, subtotal: 2, producto: { precio: 1, stock: 9999 } },
      ],
      metodoPago: "Nequi",
      direccion: "Carrera 9 # 4-25",
      codigoCupon: "PROMO2026",
      subtotal: 2,
      porcentajeDescuento: 99,
      descuento: 4899999,
      total: 1,
      numeroPedido: "ED-99999999",
      fechaEmision: "2001-01-01T00:00:00.000Z",
      usuarioId: 77,
      estado: "Gratis",
    });

    assert.equal(r.estado, 201);
    const { comprobante } = r.cuerpo;
    assert.equal(comprobante.subtotal, 4900000);
    assert.equal(comprobante.descuento, 245000);
    assert.equal(comprobante.total, 4655000);
    assert.equal(comprobante.articulos[0].producto.precio, 2450000);
    assert.equal(comprobante.numeroPedido, "ED-00000001");
    assert.equal(comprobante.estado, "Pagado");
    assert.ok(Math.abs(Date.now() - new Date(comprobante.fechaEmision).getTime()) < 60000);
    assert.equal(
      bd.pedidos[0].usuarioId,
      bd.usuarios[0].id,
      "la compra queda vinculada al usuario de sesión, no al usuarioId enviado",
    );
  });

  test("HE3-S3-PU023 · (-) Método de pago vacío, ausente o 'Ninguno'", async () => {
    const producto = anillos();

    for (const metodoPago of ["", "   ", undefined, null, "Ninguno"]) {
      const r = await comprar(compraValida([{ productoId: producto.id, cantidad: 1 }], { metodoPago }));
      assert.equal(r.estado, 400);
      assert.equal(r.cuerpo.codigo, "DATOS_PAGO_INVALIDOS");
      assert.equal(r.cuerpo.mensaje, MENSAJE_ERROR_PAGO);
      assert.deepEqual(r.cuerpo.errores, { metodo: true });
    }
    assertSinCambios([[producto, 10]]);
  });

  test("HE3-S3-PU024 · (-) Método de pago no permitido", async () => {
    const producto = anillos();

    for (const metodoPago of ["PayPal", "daviplata", "Efectivo", 5, ["Nequi"]]) {
      const r = await comprar(compraValida([{ productoId: producto.id, cantidad: 1 }], { metodoPago }));
      assert.equal(r.estado, 400);
      assert.deepEqual(r.cuerpo.errores, { metodo: true });
    }
    assertSinCambios([[producto, 10]]);
  });

  test("HE3-S3-PU025 · (+) Los 9 métodos de pago del diseño se aceptan (pago simulado)", async () => {
    const producto = anillos({ stock: 9 });
    assert.equal(METODOS_PAGO.length, 9);

    for (const metodoPago of METODOS_PAGO) {
      const r = await comprar(compraValida([{ productoId: producto.id, cantidad: 1 }], { metodoPago }));
      assert.equal(r.estado, 201, metodoPago);
      assert.equal(r.cuerpo.comprobante.metodoPago, metodoPago);
    }
    assert.equal(bd.pedidos.length, 9);
  });

  test("HE3-S3-PU026 · (-) Dirección vacía o ausente", async () => {
    const producto = anillos();

    for (const direccion of ["", "    ", undefined, null]) {
      const r = await comprar(compraValida([{ productoId: producto.id, cantidad: 1 }], { direccion }));
      assert.equal(r.estado, 400);
      assert.equal(r.cuerpo.mensaje, MENSAJE_ERROR_PAGO);
      assert.deepEqual(r.cuerpo.errores, { direccion: true });
    }
    assertSinCambios([[producto, 10]]);
  });

  test("HE3-S3-PU027 · (-) Dirección inválida del prototipo: 'Calle 0 #25A-03'", async () => {
    const producto = anillos();

    for (const direccion of [
      "Calle 0 #25A-03",
      "Calle 0  #25A-03",
      "carrera 0 # 1-1",
      "Cra 0",
      "hola mundo",
      "12345",
      "Calle diez # casa",
      "1234 # 5-6",
      "x".repeat(301),
    ]) {
      const r = await comprar(compraValida([{ productoId: producto.id, cantidad: 1 }], { direccion }));
      assert.equal(r.estado, 400, direccion);
      assert.deepEqual(r.cuerpo.errores, { direccion: true });
    }
    assertSinCambios([[producto, 10]]);
  });

  test("HE3-S3-PU028 · (+) Direcciones reales no se rechazan por exceso de validación", async () => {
    const producto = anillos({ stock: 10 });
    const direcciones = [
      "Calle 10A Norte #25A-03",
      "Carrera 9 # 4-25, apto 301",
      "Calle 05 # 3-12",
      "Vereda El Tablón, casa 4",
      "Km 3 vía al Bordo",
      "Avenida 0 de Mayo 123".replace("Avenida 0", "Avenida 10"),
    ];

    for (const direccion of direcciones) {
      const r = await comprar(compraValida([{ productoId: producto.id, cantidad: 1 }], { direccion }));
      assert.equal(r.estado, 201, direccion);
      assert.equal(r.cuerpo.comprobante.direccion, direccion);
    }
  });

  test("HE3-S3-PU029 · (-) Sin método de pago y con dirección inválida: se marcan los dos campos", async () => {
    const producto = anillos();

    const r = await comprar(
      compraValida([{ productoId: producto.id, cantidad: 1 }], {
        metodoPago: "Ninguno",
        direccion: "Calle 0 #25A-03",
      }),
    );

    assert.equal(r.estado, 400);
    assert.equal(r.cuerpo.mensaje, MENSAJE_ERROR_PAGO);
    assert.deepEqual(r.cuerpo.errores, { metodo: true, direccion: true });
    assertSinCambios([[producto, 10]]);
  });
});

// ===============================================================
describe("Transacción Oracle (simulada): todo o nada", () => {
  const dosProductos = () => {
    const a = anillos({ stock: 10 });
    const b = pendientes({ stock: 12 });
    const cuerpo = compraValida([
      { productoId: a.id, cantidad: 2 },
      { productoId: b.id, cantidad: 3 },
    ]);
    return { a, b, cuerpo };
  };

  function assertRollbackCompleto(r, a, b) {
    assert.equal(r.estado, 500);
    assert.deepEqual(r.cuerpo, { mensaje: "Error interno del servidor" });
    assert.equal(bd.commits, 0);
    assert.equal(bd.rollbacks, 1);
    assert.equal(bd.cierres, bd.conexiones, "la conexión se devuelve al pool");
    assertSinCambios([
      [a, 10],
      [b, 12],
    ]);
  }

  test("HE3-S3-PU030 · (+) Compra exitosa: una sola conexión, un solo COMMIT y ningún ROLLBACK", async () => {
    const { a, b, cuerpo } = dosProductos();

    const r = await comprar(cuerpo);

    assert.equal(r.estado, 201);
    assert.equal(bd.conexiones, 1, "toda la compra usa la misma conexión");
    assert.equal(bd.commits, 1);
    assert.equal(bd.rollbacks, 0);
    assert.equal(bd.cierres, 1);
    assert.equal(bd.bloqueos.size, 0);
    assert.equal(productoPorId(a.id).stock, 8);
    assert.equal(productoPorId(b.id).stock, 9);
    // Orden: primero se bloquean los productos, después se escribe
    const orden = bd.sentencias.map(({ sql }) =>
      sql.includes("FOR UPDATE")
        ? "bloqueo"
        : sql.includes("INSERT INTO pedido")
          ? "pedido"
          : sql.includes("INSERT INTO detalle_pedido")
            ? "detalle"
            : sql.includes("UPDATE producto")
              ? "inventario"
              : null,
    ).filter(Boolean);
    assert.deepEqual(orden, ["bloqueo", "bloqueo", "pedido", "detalle", "inventario", "detalle", "inventario"]);
  });

  test("HE3-S3-PU031 · (-) Falla al insertar el pedido: ROLLBACK completo", async () => {
    const { a, b, cuerpo } = dosProductos();
    bd.fallarEn = (sql) => sql.includes("INSERT INTO pedido");

    assertRollbackCompleto(await comprar(cuerpo), a, b);
  });

  test("HE3-S3-PU032 · (-) Falla al insertar el segundo detalle: no queda pedido incompleto ni descuento parcial", async () => {
    const { a, b, cuerpo } = dosProductos();
    bd.fallarEn = (sql, datos) => sql.includes("INSERT INTO detalle_pedido") && datos.linea === 2;

    const r = await comprar(cuerpo);

    // Ya se había insertado el pedido, el detalle 1 y descontado el producto 1: todo se deshace
    assert.ok(bd.sentencias.some(({ sql }) => sql.includes("UPDATE producto")));
    assertRollbackCompleto(r, a, b);
  });

  test("HE3-S3-PU033 · (-) Falla al actualizar el inventario del segundo producto: ROLLBACK completo", async () => {
    const { a, b, cuerpo } = dosProductos();
    bd.fallarEn = (sql, datos) => sql.includes("UPDATE producto") && datos.id === b.id;

    assertRollbackCompleto(await comprar(cuerpo), a, b);
  });

  test("HE3-S3-PU034 · (-) Falla en el COMMIT: no se informa una compra exitosa", async () => {
    const { a, b, cuerpo } = dosProductos();
    bd.fallarCommit = true;

    assertRollbackCompleto(await comprar(cuerpo), a, b);
  });

  test("HE3-S3-PU035 · (-) El UPDATE condicional no descuenta (stock cambió): 409 y ROLLBACK", async () => {
    const { a, b, cuerpo } = dosProductos();
    bd.forzarUpdateSinFilas = true;

    const r = await comprar(cuerpo);

    assert.equal(r.estado, 409);
    assert.equal(r.cuerpo.codigo, "STOCK_INSUFICIENTE");
    assert.equal(bd.commits, 0);
    assert.equal(bd.rollbacks, 1);
    assertSinCambios([
      [a, 10],
      [b, 12],
    ]);
  });

  test("HE3-S3-PU036 · (-) Los errores de Oracle no se muestran al usuario (solo quedan en el registro del servidor)", async () => {
    const { cuerpo } = dosProductos();
    bd.fallarEn = (sql) => sql.includes("INSERT INTO pedido");

    const r = await comprar(cuerpo);

    assert.equal(JSON.stringify(r.cuerpo).includes("ORA-"), false);
    assert.equal(erroresRegistrados().length, 1);
    assert.match(String(erroresRegistrados()[0][0].message), /ORA-03113/);
  });

  test("HE3-S3-PU037 · (-) Un conflicto de stock en el segundo producto no descuenta el primero", async () => {
    const a = anillos({ stock: 10 });
    const b = pendientes({ stock: 1 });

    const r = await comprar(
      compraValida([
        { productoId: a.id, cantidad: 2 },
        { productoId: b.id, cantidad: 5 },
      ]),
    );

    assert.equal(r.estado, 409);
    assert.equal(bd.rollbacks, 1);
    assertSinCambios([
      [a, 10],
      [b, 1],
    ]);
  });
});

// ===============================================================
describe("Concurrencia (simulada): sin sobreventa", () => {
  test("HE3-S3-PU038 · Dos compras simultáneas de la última unidad: solo una se registra", async () => {
    const producto = anillos({ stock: 1 });
    const cuerpo = compraValida([{ productoId: producto.id, cantidad: 1 }]);

    const respuestas = await Promise.all([comprar(cuerpo), comprar(cuerpo)]);

    assert.deepEqual(respuestas.map((r) => r.estado).sort(), [201, 409]);
    assert.equal(respuestas.find((r) => r.estado === 409).cuerpo.codigo, "PRODUCTO_NO_DISPONIBLE");
    assert.equal(bd.pedidos.length, 1);
    assert.equal(bd.detalles.length, 1);
    assert.equal(productoPorId(producto.id).stock, 0);
    assert.equal(productoPorId(producto.id).estado, "Inactivo");
    assert.equal(bd.bloqueos.size, 0);
  });

  test("HE3-S3-PU039 · Diez compras simultáneas con 3 unidades: 3 exitosas, 7 rechazadas, stock 0", async () => {
    const producto = anillos({ stock: 3 });
    const cuerpo = compraValida([{ productoId: producto.id, cantidad: 1 }]);

    const respuestas = await Promise.all(Array.from({ length: 10 }, () => comprar(cuerpo)));

    assert.equal(respuestas.filter((r) => r.estado === 201).length, 3);
    assert.equal(respuestas.filter((r) => r.estado === 409).length, 7);
    assert.equal(productoPorId(producto.id).stock, 0);
    assert.equal(
      bd.detalles.reduce((suma, d) => suma + d.cantidad, 0),
      3,
      "unidades vendidas = unidades que había",
    );
    assert.equal(new Set(bd.pedidos.map((p) => p.numero)).size, 3, "números de pedido únicos");
  });

  test("HE3-S3-PU040 · Dos compras simultáneas que caben: el inventario final es consistente", async () => {
    const producto = anillos({ stock: 5 });

    const respuestas = await Promise.all([
      comprar(compraValida([{ productoId: producto.id, cantidad: 2 }])),
      comprar(compraValida([{ productoId: producto.id, cantidad: 3 }])),
    ]);

    assert.deepEqual(respuestas.map((r) => r.estado), [201, 201]);
    assert.equal(productoPorId(producto.id).stock, 0);
    assert.equal(bd.pedidos.length, 2);
  });

  test("HE3-S3-PU041 · Carritos con los mismos productos en orden contrario no se bloquean entre sí", async () => {
    const a = anillos({ stock: 4 });
    const b = pendientes({ stock: 4 });

    const respuestas = await Promise.all([
      comprar(compraValida([{ productoId: a.id, cantidad: 2 }, { productoId: b.id, cantidad: 2 }])),
      comprar(compraValida([{ productoId: b.id, cantidad: 2 }, { productoId: a.id, cantidad: 2 }])),
    ]);

    assert.deepEqual(respuestas.map((r) => r.estado), [201, 201]);
    assert.equal(productoPorId(a.id).stock, 0);
    assert.equal(productoPorId(b.id).stock, 0);
    // Los bloqueos siempre se piden por id ascendente
    const bloqueos = bd.sentencias.filter(({ sql }) => sql.includes("FOR UPDATE")).map(({ datos }) => datos.id);
    assert.deepEqual(bloqueos.slice().sort((x, y) => x - y), [a.id, a.id, b.id, b.id]);
  });
});

// ===============================================================
describe("Seguridad: sesiones y pedidos ajenos", () => {
  test("HE3-S3-PU042 · (+) Usuario autenticado: el pedido queda a nombre de su cuenta con los datos de Oracle", async () => {
    const ana = agregarUsuario();
    const producto = anillos();

    const r = await comprar(
      compraValida([{ productoId: producto.id, cantidad: 1 }], {
        // Intento de suplantar: estos datos se ignoran cuando hay sesión
        comprador: { nombre: "Otra Persona", identificacion: "999", telefono: "3110000000", correo: "x@y.co" },
        usuarioId: 55,
      }),
      { token: tokenDe(ana) },
    );

    assert.equal(r.estado, 201);
    assert.equal(bd.pedidos[0].usuarioId, ana.id);
    assert.deepEqual(r.cuerpo.comprobante.cliente, {
      nombre: "Ana Pérez",
      identificacion: "123456789",
      telefono: "3001234567",
      correo: "ana@example.com",
    });
    assert.equal("claveConsulta" in r.cuerpo, false, "no se devuelve una clave de consulta");
  });

  test("HE3-S3-PU043 · (-) Token inválido o manipulado: 401 y la compra no se procesa", async () => {
    const ana = agregarUsuario();
    const producto = anillos();
    const [payload, firma] = tokenDe(ana).split(".");
    const manipulado = `${Buffer.from(JSON.stringify({ id: 2, rol: "cliente", exp: 9999999999 })).toString("base64url")}.${firma}`;

    for (const token of ["token-invalido", manipulado, `${payload}.firma-falsa`]) {
      const r = await comprar(compraValida([{ productoId: producto.id, cantidad: 1 }]), { token });
      assert.equal(r.estado, 401);
      assert.equal(r.cuerpo.mensaje, "Debes iniciar sesión");
    }
    const sinToken = await comprar(compraValida([{ productoId: producto.id, cantidad: 1 }]), {
      sinSesion: true,
    });
    assert.equal(sinToken.estado, 401);
    assert.equal(sinToken.cuerpo.mensaje, "Debes iniciar sesión");
    assertSinCambios([[producto, 10]]);
  });

  test("HE3-S3-PU044 · (-) Token válido de una cuenta que ya no existe o está inactiva", async () => {
    const producto = anillos();
    const inactiva = agregarUsuario({ estado: "Inactivo" });

    const sinCuenta = await comprar(compraValida([{ productoId: producto.id, cantidad: 1 }]), {
      token: tokenDe({ id: 404, rol: "cliente" }),
    });
    assert.equal(sinCuenta.estado, 401);

    const cuentaInactiva = await comprar(compraValida([{ productoId: producto.id, cantidad: 1 }]), {
      token: tokenDe(inactiva),
    });
    assert.equal(cuentaInactiva.estado, 403);
    assert.equal(cuentaInactiva.cuerpo.codigo, "CUENTA_INACTIVA");
    assertSinCambios([[producto, 10]]);
  });

  test("HE3-S3-PU045 · (+) El dueño puede volver a consultar su comprobante", async () => {
    const ana = agregarUsuario();
    const producto = anillos();
    const compra = await comprar(
      compraValida([{ productoId: producto.id, cantidad: 2 }], { codigoCupon: "PROMO2026" }),
      { token: tokenDe(ana) },
    );

    const r = await consultar(compra.cuerpo.comprobante.numeroPedido, { token: tokenDe(ana) });

    assert.equal(r.estado, 200);
    assert.deepEqual(r.cuerpo.comprobante, compra.cuerpo.comprobante);
  });

  test("HE3-S3-PU046 · (-) Nadie más puede consultar el pedido de otro usuario", async () => {
    const ana = agregarUsuario();
    const luis = agregarUsuario({ correo: "luis@example.com", usuario: "luis", identificacion: "987" });
    const admin = agregarUsuario({ correo: "admin@eden.com", usuario: "admin", identificacion: "111", rol: "admin" });
    const producto = anillos();
    const compra = await comprar(compraValida([{ productoId: producto.id, cantidad: 1 }]), {
      token: tokenDe(ana),
    });
    const { numeroPedido } = compra.cuerpo.comprobante;

    const otroUsuario = await consultar(numeroPedido, { token: tokenDe(luis) });
    const administrador = await consultar(numeroPedido, { token: tokenDe(admin) });
    const sinSesion = await consultar(numeroPedido);
    const conClaveInventada = await consultar(numeroPedido, {
      token: tokenDe(luis),
      cabeceras: { "X-Clave-Consulta": "cualquiera" },
    });
    const tokenInvalido = await consultar(numeroPedido, { token: "token-invalido" });

    for (const r of [otroUsuario, administrador, conClaveInventada]) {
      assert.equal(r.estado, 404);
      assert.equal(r.cuerpo.codigo, "PEDIDO_NO_ENCONTRADO");
      assert.equal("comprobante" in r.cuerpo, false);
    }
    assert.equal(sinSesion.estado, 401);
    assert.equal(sinSesion.cuerpo.mensaje, "Debes iniciar sesión");
    assert.equal(tokenInvalido.estado, 401);
  });

  test("HE3-S3-PU047 · (-) Compra sin sesión: 401 y no registra pedido ni descuenta inventario", async () => {
    const producto = anillos();

    const r = await comprar(compraValida([{ productoId: producto.id, cantidad: 1 }]), {
      sinSesion: true,
    });

    assert.equal(r.estado, 401);
    assert.equal(r.cuerpo.mensaje, "Debes iniciar sesión");
    assertSinCambios([[producto, 10]]);
  });

  test("HE3-S3-PU048 · (-) X-Clave-Consulta no sustituye al propietario autenticado", async () => {
    const ana = agregarUsuario();
    const luis = agregarUsuario({ correo: "luis@example.com", usuario: "luis", identificacion: "987" });
    const producto = anillos();
    const compra = await comprar(compraValida([{ productoId: producto.id, cantidad: 1 }]), {
      token: tokenDe(ana),
    });
    const { numeroPedido } = compra.cuerpo.comprobante;

    const conClaveDeConsulta = await consultar(numeroPedido, {
      token: tokenDe(luis),
      cabeceras: { "X-Clave-Consulta": "clave-legacy" },
    });
    assert.equal(conClaveDeConsulta.estado, 404);
    assert.equal(conClaveDeConsulta.cuerpo.codigo, "PEDIDO_NO_ENCONTRADO");
  });

  test("HE3-S3-PU049 · (-) Datos de comprador no permiten comprar sin sesión", async () => {
    const producto = anillos();
    const articulos = [{ productoId: producto.id, cantidad: 1 }];

    const sinSesion = await comprar(
      compraValida(articulos, { comprador: { nombre: "Carlos Gómez", correo: "carlos.example.com" } }),
      { sinSesion: true },
    );
    assert.equal(sinSesion.estado, 401);
    assert.equal(sinSesion.cuerpo.mensaje, "Debes iniciar sesión");
    assertSinCambios([[producto, 10]]);
  });

  test("HE3-S3-PU050 · Solicitud repetida (doble clic): un solo pedido y un solo descuento", async () => {
    const ana = agregarUsuario();
    const producto = anillos({ stock: 10 });
    const cuerpo = compraValida([{ productoId: producto.id, cantidad: 2 }], {
      idSolicitud: "3f2b8c1e-7a4d-4e9b-9c55-0d1e2f3a4b5c",
    });

    const primera = await comprar(cuerpo, { token: tokenDe(ana) });
    const repetida = await comprar(cuerpo, { token: tokenDe(ana) });
    const simultaneas = await Promise.all([
      comprar({ ...cuerpo, idSolicitud: "solicitud-simultanea-0001" }, { token: tokenDe(ana) }),
      comprar({ ...cuerpo, idSolicitud: "solicitud-simultanea-0001" }, { token: tokenDe(ana) }),
    ]);

    assert.equal(primera.estado, 201);
    assert.equal(repetida.estado, 200);
    assert.deepEqual(repetida.cuerpo.comprobante, primera.cuerpo.comprobante);
    assert.deepEqual(simultaneas.map((r) => r.estado).sort(), [200, 201]);
    assert.equal(
      simultaneas[0].cuerpo.comprobante.numeroPedido,
      simultaneas[1].cuerpo.comprobante.numeroPedido,
    );
    assert.equal(bd.pedidos.length, 2);
    assert.equal(productoPorId(producto.id).stock, 6, "dos pedidos de 2 unidades, no cuatro");
  });

  test("HE3-S3-PU051 · (-) El identificador de solicitud de otra persona no muestra su pedido", async () => {
    const ana = agregarUsuario();
    const luis = agregarUsuario({ correo: "luis@example.com", usuario: "luis", identificacion: "987" });
    const producto = anillos();
    const cuerpo = compraValida([{ productoId: producto.id, cantidad: 1 }], { idSolicitud: "solicitud-de-ana-0001" });
    await comprar(cuerpo, { token: tokenDe(ana) });

    const deLuis = await comprar(cuerpo, { token: tokenDe(luis) });
    const deOtroUsuario = await comprar(cuerpo);
    const malFormada = await comprar({ ...cuerpo, idSolicitud: "corta" });

    for (const r of [deLuis, deOtroUsuario]) {
      assert.equal(r.estado, 409);
      assert.equal(r.cuerpo.codigo, "SOLICITUD_REPETIDA");
      assert.equal("comprobante" in r.cuerpo, false);
    }
    assert.equal(malFormada.estado, 400);
    assert.equal(bd.pedidos.length, 1);
  });

  test("HE3-S3-PU052 · (-) Inyección SQL: los datos viajan como parámetros, nunca dentro de la sentencia", async () => {
    const producto = anillos();
    const direccion = "Calle 5 # 1-2'; DROP TABLE pedido; --";

    const identificador = await comprar(compraValida([{ productoId: "1 OR 1=1", cantidad: 1 }]));
    assert.equal(identificador.estado, 400);
    assert.equal(identificador.cuerpo.codigo, "PRODUCTO_INVALIDO");

    const r = await comprar(compraValida([{ productoId: producto.id, cantidad: 1 }], { direccion }));
    assert.equal(r.estado, 201);
    assert.equal(bd.pedidos[0].direccion, direccion, "se guarda como texto");
    assert.ok(bd.sentencias.length > 0);
    assert.ok(
      bd.sentencias.every(({ sql }) => !sql.includes("DROP TABLE") && !sql.includes("Daviplata")),
      "ninguna sentencia lleva datos del usuario concatenados",
    );

    const numero = await consultar("ED-00000001' OR '1'='1", {
      token: tokenDe(bd.usuarios[0]),
    });
    assert.equal(numero.estado, 404);
  });
});

// ===============================================================
describe("HE3-HU3 · Comprobante de compra", () => {
  test("HE3-S3-PU053 · (+) La respuesta tiene la estructura que usa Comprobante.jsx", async () => {
    const ana = agregarUsuario();
    const a = anillos();
    const b = pendientes();

    const r = await comprar(
      compraValida(
        [
          { productoId: a.id, cantidad: 2 },
          { productoId: b.id, cantidad: 2 },
        ],
        { metodoPago: "Bancolombia", codigoCupon: "PROMO2026" },
      ),
      { token: tokenDe(ana) },
    );

    assert.equal(r.estado, 201);
    const { comprobante } = r.cuerpo;
    assert.deepEqual(Object.keys(comprobante).sort(), [
      "articulos",
      "cliente",
      "codigoCupon",
      "descuento",
      "direccion",
      "estado",
      "fechaEmision",
      "metodoPago",
      "numeroPedido",
      "porcentajeDescuento",
      "subtotal",
      "total",
      "totalProductos",
    ]);
    assert.match(comprobante.numeroPedido, /^ED-\d{8}$/);
    assert.equal(new Date(comprobante.fechaEmision).toISOString(), comprobante.fechaEmision);
    assert.deepEqual(comprobante.articulos, [
      {
        producto: { id: a.id, ref: "ANI00001", nombre: "Anillos Dualis Blue", precio: 2450000 },
        cantidad: 2,
        subtotal: 4900000,
      },
      {
        producto: { id: b.id, ref: "ARE00001", nombre: "Pendientes Flora Celeste", precio: 550000 },
        cantidad: 2,
        subtotal: 1100000,
      },
    ]);
    // Prototipo_Usuario_Comprobante_Pantalla: $4.900.000 + $1.100.000 = $6.000.000
    assert.equal(comprobante.subtotal, 6000000);
    assert.equal(comprobante.descuento, 300000);
    assert.equal(comprobante.total, 5700000);
    assert.equal(comprobante.metodoPago, "Bancolombia");
    assert.equal(comprobante.direccion, "Calle 10A Norte #25A-03");
    // Nada sensible ni interno en la respuesta
    const texto = JSON.stringify(r.cuerpo);
    for (const prohibido of ["passwordHash", "claveConsultaHash", "usuarioId", "idSolicitud"]) {
      assert.equal(texto.includes(prohibido), false, prohibido);
    }
  });

  test("HE3-S3-PU054 · (+) El comprobante conserva nombre, referencia y precio del momento de la compra", async () => {
    const ana = agregarUsuario();
    const producto = anillos();
    const compra = await comprar(compraValida([{ productoId: producto.id, cantidad: 1 }]), {
      token: tokenDe(ana),
    });

    // Después el administrador cambia el producto y la clienta cambia sus datos
    Object.assign(productoPorId(producto.id), { nombre: "Anillos Edición 2027", precio: 9999999, ref: "NUEVA" });
    Object.assign(ana, { nombre: "Ana María Pérez", telefono: "3117654321" });

    const r = await consultar(compra.cuerpo.comprobante.numeroPedido, { token: tokenDe(ana) });

    assert.equal(r.estado, 200);
    assert.deepEqual(r.cuerpo.comprobante, compra.cuerpo.comprobante);
    assert.equal(r.cuerpo.comprobante.articulos[0].producto.nombre, "Anillos Dualis Blue");
    assert.equal(r.cuerpo.comprobante.articulos[0].producto.precio, 2450000);
    assert.equal(r.cuerpo.comprobante.cliente.nombre, "Ana Pérez");
  });

  test("HE3-S3-PU055 · (+) Número de pedido único y consecutivo, generado por el servidor", async () => {
    const producto = anillos({ stock: 10 });
    const numeros = [];
    for (let i = 0; i < 3; i += 1) {
      const r = await comprar(compraValida([{ productoId: producto.id, cantidad: 1 }]));
      numeros.push(r.cuerpo.comprobante.numeroPedido);
    }

    assert.deepEqual(numeros, ["ED-00000001", "ED-00000002", "ED-00000003"]);
  });

  test("HE3-S3-PU056 · (-) Pedido inexistente o número con formato inválido: 404", async () => {
    const token = tokenDe(agregarUsuario());
    for (const numero of ["ED-00000099", "ED-1", "99", "ed-abc"]) {
      const r = await consultar(numero, { token });
      assert.equal(r.estado, 404);
      assert.equal(r.cuerpo.mensaje, "El pedido no existe.");
    }
  });
});

// ===============================================================
describe("Integración con el resto del backend (regresión)", () => {
  test("HE3-S3-PU057 · (-) Cuerpo que no es JSON válido: 400 y no 500", async () => {
    const r = await pedir("/api/pedidos", { metodo: "POST", crudo: "{articulos:" });

    assert.equal(r.estado, 400);
    assert.equal(r.cuerpo.codigo, "SOLICITUD_INVALIDA");
    assert.equal(erroresRegistrados().length, 0);
  });

  test("HE3-S3-PU058 · Las rutas anteriores siguen respondiendo igual", async () => {
    anillos();

    const catalogo = await pedir("/api/productos?estado=todos");
    assert.equal(catalogo.estado, 200);
    assert.equal(catalogo.cuerpo.productos.length, 1);

    const salud = await pedir("/api/salud");
    assert.deepEqual(salud.cuerpo, { ok: true });

    const inexistente = await pedir("/api/no-existe");
    assert.equal(inexistente.estado, 404);
    assert.equal(inexistente.cuerpo.mensaje, "Ruta no encontrada");

    // Las rutas protegidas del Sprint 1 y 2 siguen exigiendo sesión
    const protegida = await pedir("/api/productos/1/estado", { metodo: "PATCH", cuerpo: { estado: "Inactivo" } });
    assert.equal(protegida.estado, 401);
  });
});
