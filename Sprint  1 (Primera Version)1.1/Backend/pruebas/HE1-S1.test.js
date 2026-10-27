// Pruebas unitarias · HE1 Gestión de productos · Sprint 1  (20 casos: HE1-S1-PU001 ... PU020)
// Son los mismos casos del Excel "Pruebas_Unitarias_HE1_Sprint1": cada test lleva el ID del caso,
// así el resultado de `npm test` se puede copiar a la columna "Resultado real" (OK / NOK).
//
// Cómo funcionan (patrón AAA):
//   Arrange: se prepara la base de datos falsa en memoria (ayudas.js) y los datos del caso.
//   Act:     se llama al backend (la ruta o la función de validar.js).
//   Assert:  se compara con el "Resultado esperado" del Excel.
// Un test que FALLA = un defecto real del código (el caso queda NOK).
//
// Ejecutar solo este archivo:  node --test pruebas/HE1-S1.test.js
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  bd,
  agregarProducto,
  prepararEntorno,
  registrar,
  modificar,
  pedir,
  formularioConArchivoDeTexto,
  productoValido,
  cambiosValidos,
  ultimaConsulta,
} from "./ayudas.js";

prepararEntorno();

const MSG_EXITO = "¡Producto Registrado Exitosamente!";
const MSG_ERR_REG =
  "Error al registrar producto. Por favor completa todos los campos obligatorios y/o corrige los valores numéricos";
const MSG_ERR_MOD =
  "Error al actualizar producto. Por favor completa todos los campos obligatorios y/o corrige los valores numéricos";
const MSG_SIN_UNIDADES =
  "Error al activar el producto. Por favor verifica que existan unidades disponibles";

// Registro rechazado: el sistema responde 400 con el mensaje de error, marca el campo y NO guarda nada
async function esperarRegistroRechazado(campos, camposEnError, opciones) {
  const r = await registrar({ ...productoValido, ...campos }, opciones);
  assert.equal(r.estado, 400, `debía rechazar el registro, pero respondió ${r.estado} y guardó el producto`);
  assert.equal(r.cuerpo.mensaje, MSG_ERR_REG);
  for (const campo of camposEnError) assert.equal(r.cuerpo.errores[campo], true, `debía marcar "${campo}" en rojo`);
  assert.equal(bd.productos.length, 0, "no debe guardar el producto");
}

// Modificación rechazada: 400, mensaje de error y el producto queda igual
async function esperarModificacionRechazada(producto, cambios, campoEnError) {
  const antes = { ...producto };
  const r = await modificar(producto.id, { ...cambiosValidos, ...cambios });
  assert.equal(r.estado, 400, `debía rechazar los cambios, pero respondió ${r.estado} y los guardó`);
  assert.equal(r.cuerpo.mensaje, MSG_ERR_MOD);
  assert.equal(r.cuerpo.errores[campoEnError], true, `debía marcar "${campoEnError}" en rojo`);
  assert.deepEqual(bd.productos[0], antes, "el producto no debe cambiar");
}

describe("1 · Campos obligatorios vacíos", () => {
  test("HE1-S1-PU001 · (+) Registrar producto con todos los campos válidos", async () => {
    const r = await registrar(productoValido);
    assert.equal(r.estado, 201);
    assert.equal(r.cuerpo.mensaje, MSG_EXITO);
    assert.equal(bd.productos.length, 1);
  });

  test("HE1-S1-PU002 · (-) Nombre vacío", async () => {
    await esperarRegistroRechazado({ nombre: "" }, ["nombre"]);
  });

  test("HE1-S1-PU003 · (-) Nombre y descripción solo con espacios", async () => {
    await esperarRegistroRechazado({ nombre: "   ", descripcion: "   " }, ["nombre", "descripcion"]);
  });

  test("HE1-S1-PU004 · (-) Registrar sin seleccionar foto", async () => {
    await esperarRegistroRechazado({}, ["imagen"], { foto: false });
  });

  test("HE1-S1-PU005 · (-) Modificar con el stock vacío", async () => {
    const p = agregarProducto({ ref: "ANI00001" });
    await esperarModificacionRechazada(p, { stock: "" }, "stock");
  });
});

describe("2 · Valores numéricos (precio y stock)", () => {
  test("HE1-S1-PU006 · (-) Precio con letras (abc)", async () => {
    await esperarRegistroRechazado({ precio: "abc" }, ["precio"]);
  });

  test("HE1-S1-PU007 · (-) Precio negativo (-500000)", async () => {
    await esperarRegistroRechazado({ precio: "-500000" }, ["precio"]);
  });

  test("HE1-S1-PU008 · (-) Precio con centavos (1500.50)", async () => {
    await esperarRegistroRechazado({ precio: "1500.50" }, ["precio"]);
  });

  test("HE1-S1-PU009 · (-) Precio con puntos mal ubicados (1.5.0.0)", async () => {
    await esperarRegistroRechazado({ precio: "1.5.0.0" }, ["precio"]);
  });

  test("HE1-S1-PU010 · (-) Modificar con precio decimal (409900.99)", async () => {
    const p = agregarProducto({ ref: "PER00001", precio: 409900 });
    await esperarModificacionRechazada(p, { precio: "409900.99" }, "precio");
  });

  test("HE1-S1-PU011 · (-) Stock 0 al registrar", async () => {
    await esperarRegistroRechazado({ stock: "0" }, ["stock"]);
  });

  test("HE1-S1-PU012 · (-) Stock decimal (2.5)", async () => {
    await esperarRegistroRechazado({ stock: "2.5" }, ["stock"]);
  });

  test("HE1-S1-PU013 · (-) Stock hexadecimal (0x10)", async () => {
    await esperarRegistroRechazado({ stock: "0x10" }, ["stock"]);
  });
});

describe("3 · Longitud de los textos y valores especiales", () => {
  test("HE1-S1-PU014 · (-) Nombre de 121 caracteres (máximo 120)", async () => {
    await esperarRegistroRechazado({ nombre: "a".repeat(121) }, ["nombre"]);
  });

  test("HE1-S1-PU015 · (-) Modificar con precio hexadecimal (0x10)", async () => {
    // JavaScript interpreta "0x10" como el número 16: el sistema lo guarda como precio $16 en vez de rechazarlo.
    const p = agregarProducto({ ref: "CAD00001", precio: 2870000 });
    await esperarModificacionRechazada(p, { precio: "0x10" }, "precio");
  });
});

describe("4 · Foto del producto", () => {
  test("HE1-S1-PU016 · (-) Archivo de texto (nota.txt) como foto", async () => {
    const r = await pedir("/api/productos", { method: "POST", body: formularioConArchivoDeTexto(productoValido) });
    assert.equal(r.estado, 400);
    assert.equal(r.cuerpo.errores.imagen, true);
    assert.equal(bd.productos.length, 0, "no debe guardar el producto");
  });
});

describe("5 · Reglas del negocio", () => {
  test("HE1-S1-PU017 · (-) Referencia repetida en minúsculas (ani00001)", async () => {
    agregarProducto({ ref: "ANI00001" });
    const r = await registrar({ ...productoValido, ref: "ani00001" });
    assert.equal(r.estado, 409);
    assert.equal(r.cuerpo.mensaje, "Ya existe un producto con esa referencia");
    assert.equal(bd.productos.length, 1, "no debe crear un segundo producto");
  });

  test("HE1-S1-PU018 · (+) Modificar el stock a 0 deja el producto Inactivo", async () => {
    const p = agregarProducto({ ref: "ANI00001", estado: "Activo", stock: 10 });
    const r = await modificar(p.id, { ...cambiosValidos, stock: "0" });
    assert.equal(r.estado, 200);
    assert.equal(bd.productos[0].stock, 0);
    assert.equal(bd.productos[0].estado, "Inactivo");
  });

  test("HE1-S1-PU019 · (-) Activar un producto inactivo con stock 0", async () => {
    const p = agregarProducto({ stock: 0, estado: "Inactivo" });
    const r = await pedir(`/api/productos/${p.id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "Activo" }),
    });
    assert.equal(r.estado, 409);
    assert.equal(r.cuerpo.mensaje, MSG_SIN_UNIDADES);
    assert.equal(bd.productos[0].estado, "Inactivo", "debe seguir Inactivo");
  });
});

describe("6 · Catálogo: búsqueda", () => {
  test("HE1-S1-PU020 · (+) Buscar la palabra bright", async () => {
    agregarProducto({ ref: "PER00001", nombre: "Versace Bright Crystal" });
    const r = await pedir("/api/productos?q=bright");
    assert.equal(r.estado, 200);
    // La búsqueda se hace en la base (LIKE): la prueba revisa que el backend la pida bien
    assert.match(ultimaConsulta().sql, /LIKE :q/);
    assert.equal(ultimaConsulta().datos.q, "%bright%");
  });
});
