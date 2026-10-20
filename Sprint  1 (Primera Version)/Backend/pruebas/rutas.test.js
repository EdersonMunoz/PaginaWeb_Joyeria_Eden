// Pruebas de las rutas del backend (HU1, HU2, HU3 y HU4) SIN Oracle.
// Usa usarEjecutorDePrueba() de baseDatos.js: en lugar de ir a la base de datos,
// ejecutar() llama a la función falsa de este archivo, que trabaja con un arreglo en memoria.
// Uso:  npm test
import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { crearApp } from "../servidor.js";
import { usarEjecutorDePrueba } from "../baseDatos.js";
import { carpetaFotos } from "../subirFoto.js";

// ---------------------------------------------------------------
// Base de datos falsa
// ---------------------------------------------------------------
let productos = [];
let siguienteId = 1;
let consultas = []; // guarda cada { sql, datos } que llegó a ejecutar()

const crearProducto = (extra = {}) => ({
  id: siguienteId++,
  ref: `REF${siguienteId}`,
  nombre: "Anillo de oro",
  precio: 1500000,
  categoria: "Anillos",
  stock: 10,
  descripcion: "Anillo de oro de 18 quilates",
  imagen: "/fotos/prueba.png",
  estado: "Activo",
  ...extra,
});

function instalarBaseFalsa() {
  usarEjecutorDePrueba(async (sql, datos) => {
    consultas.push({ sql, datos });

    if (sql.includes("INSERT INTO producto")) {
      productos.push(crearProducto({ ...datos, id: siguienteId }));
      return { filas: [], afectadas: 1 };
    }
    if (sql.includes("SET nombre")) {
      const producto = productos.find((p) => p.id === datos.id);
      Object.assign(producto, {
        nombre: datos.nombre,
        precio: datos.precio,
        categoria: datos.categoria,
        stock: datos.stock,
        descripcion: datos.descripcion,
        imagen: datos.imagen,
      });
      if (datos.stock <= 0) producto.estado = "Inactivo";
      return { filas: [], afectadas: 1 };
    }
    if (sql.includes("SET estado")) {
      productos.find((p) => p.id === datos.id).estado = datos.estado;
      return { filas: [], afectadas: 1 };
    }
    if (sql.includes("WHERE p.id = :id")) {
      return { filas: productos.filter((p) => p.id === datos.id), afectadas: 0 };
    }
    if (sql.includes("UPPER(p.ref)")) {
      const filas = productos.filter((p) => p.ref.toUpperCase() === datos.ref.toUpperCase());
      return { filas, afectadas: 0 };
    }
    if (sql.includes("ORDER BY p.id")) {
      return { filas: productos, afectadas: 0 };
    }
    throw new Error(`Consulta no prevista en la prueba: ${sql}`);
  });
}

// ---------------------------------------------------------------
// Servidor de prueba (puerto libre, nunca toca el 3001)
// ---------------------------------------------------------------
let servidor;
let API;
let fotosAntes;

before(async () => {
  instalarBaseFalsa();
  fotosAntes = new Set(fs.readdirSync(carpetaFotos));
  await new Promise((listo) => {
    servidor = crearApp().listen(0, "127.0.0.1", listo);
  });
  API = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  await new Promise((listo) => servidor.close(listo));
  // Borra las fotos que las pruebas dejaron en backend/fotos
  for (const archivo of fs.readdirSync(carpetaFotos)) {
    if (!fotosAntes.has(archivo)) fs.rmSync(`${carpetaFotos}/${archivo}`, { force: true });
  }
});

beforeEach(() => {
  productos = [];
  siguienteId = 1;
  consultas = [];
});

// ---------------------------------------------------------------
// Ayudas para hacer peticiones
// ---------------------------------------------------------------
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
  "base64",
);

const base = {
  ref: "TST001",
  nombre: "Producto de prueba",
  precio: "$1.500.000",
  categoria: "Pulsos",
  stock: "15",
  descripcion: "Creado por las pruebas",
};

const formulario = (campos, conFoto = true) => {
  const datos = new FormData();
  Object.entries(campos).forEach(([k, v]) => datos.append(k, v));
  if (conFoto) datos.append("foto", new Blob([PNG], { type: "image/png" }), "prueba.png");
  return datos;
};

const pedir = async (ruta, opciones) => {
  const respuesta = await fetch(`${API}${ruta}`, opciones);
  return { estado: respuesta.status, cuerpo: await respuesta.json() };
};

const cambiarEstado = (id, estado) =>
  pedir(`/api/productos/${id}/estado`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado }),
  });

// ---------------------------------------------------------------
// Servidor general
// ---------------------------------------------------------------
describe("servidor", () => {
  test("GET /api/salud responde ok", async () => {
    const r = await pedir("/api/salud");
    assert.equal(r.estado, 200);
    assert.deepEqual(r.cuerpo, { ok: true });
  });

  test("una ruta que no existe responde 404", async () => {
    const r = await pedir("/api/no-existe");
    assert.equal(r.estado, 404);
    assert.equal(r.cuerpo.mensaje, "Ruta no encontrada");
  });
});

// ---------------------------------------------------------------
// HU3 · Consultar catálogo
// ---------------------------------------------------------------
describe("HU3 · GET /api/productos", () => {
  test("por defecto pide solo los productos Activo", async () => {
    productos.push(crearProducto());
    const r = await pedir("/api/productos");
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.productos.length, 1);
    assert.equal(consultas.at(-1).datos.estado, "Activo");
  });

  test("?estado=todos no filtra por estado", async () => {
    await pedir("/api/productos?estado=todos");
    assert.equal(consultas.at(-1).datos.estado, undefined);
    assert.ok(!consultas.at(-1).sql.includes("p.estado = :estado"));
  });

  test("esc. 2: filtra por una o varias categorías", async () => {
    await pedir("/api/productos?categoria=Anillos,Pulsos");
    const { sql, datos } = consultas.at(-1);
    assert.equal(datos.cat0, "Anillos");
    assert.equal(datos.cat1, "Pulsos");
    assert.ok(sql.includes("c.nombre IN (:cat0, :cat1)"));
  });

  test("esc. 2: ignora las categorías que no existen", async () => {
    await pedir("/api/productos?categoria=Pulsos,Zapatos");
    const { datos } = consultas.at(-1);
    assert.equal(datos.cat0, "Pulsos");
    assert.equal(datos.cat1, undefined);
  });

  test("esc. 3: filtra por rango de precio", async () => {
    await pedir("/api/productos?precioMin=150000&precioMax=4000000");
    const { datos } = consultas.at(-1);
    assert.equal(datos.precioMin, 150000);
    assert.equal(datos.precioMax, 4000000);
  });

  test("esc. 3: ignora un precio que no es número", async () => {
    await pedir("/api/productos?precioMin=abc");
    assert.equal(consultas.at(-1).datos.precioMin, undefined);
  });

  test("esc. 4: la búsqueda va en minúsculas y con comodines", async () => {
    await pedir(`/api/productos?q=${encodeURIComponent("  BRIGHT ")}`);
    assert.equal(consultas.at(-1).datos.q, "%bright%");
  });
});

describe("HU3 · GET /api/productos/:id", () => {
  test("esc. 5: devuelve el detalle del producto", async () => {
    productos.push(crearProducto({ id: 7, ref: "ANI007" }));
    siguienteId = 8;
    const r = await pedir("/api/productos/7");
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.producto.ref, "ANI007");
  });

  test("responde 404 si el producto no existe", async () => {
    const r = await pedir("/api/productos/999");
    assert.equal(r.estado, 404);
    assert.equal(r.cuerpo.mensaje, "El producto no existe.");
  });

  test("responde 404 si el id no es un número", async () => {
    const r = await pedir("/api/productos/abc");
    assert.equal(r.estado, 404);
  });
});

// ---------------------------------------------------------------
// HU1 · Registrar producto
// ---------------------------------------------------------------
describe("HU1 · POST /api/productos", () => {
  test("esc. 1: registro exitoso responde 201 y guarda el precio limpio", async () => {
    const r = await pedir("/api/productos", { method: "POST", body: formulario(base) });
    assert.equal(r.estado, 201);
    assert.equal(r.cuerpo.mensaje, "¡Producto Registrado Exitosamente!");
    assert.equal(r.cuerpo.producto.precio, 1500000);
    assert.equal(r.cuerpo.producto.estado, "Activo");
    assert.match(r.cuerpo.producto.imagen, /^\/fotos\//);
  });

  test("esc. 2: campos vacíos responden 400 con los campos en error", async () => {
    const r = await pedir("/api/productos", {
      method: "POST",
      body: formulario({ ...base, precio: "", stock: "" }),
    });
    assert.equal(r.estado, 400);
    assert.equal(r.cuerpo.errores.precio, true);
    assert.equal(r.cuerpo.errores.stock, true);
    assert.equal(productos.length, 0, "no debe guardar nada");
  });

  test("esc. 3: precio negativo y stock 0 responden 400", async () => {
    const r = await pedir("/api/productos", {
      method: "POST",
      body: formulario({ ...base, precio: "$-500.000", stock: "0" }),
    });
    assert.equal(r.estado, 400);
    assert.equal(r.cuerpo.errores.precio, true);
    assert.equal(r.cuerpo.errores.stock, true);
  });

  test("sin foto responde 400 con error en imagen", async () => {
    const r = await pedir("/api/productos", {
      method: "POST",
      body: formulario(base, false),
    });
    assert.equal(r.estado, 400);
    assert.equal(r.cuerpo.errores.imagen, true);
  });

  test("una referencia repetida responde 409 (sin importar mayúsculas)", async () => {
    productos.push(crearProducto({ ref: "TST001" }));
    const r = await pedir("/api/productos", {
      method: "POST",
      body: formulario({ ...base, ref: "tst001" }),
    });
    assert.equal(r.estado, 409);
    assert.equal(r.cuerpo.errores.ref, true);
    assert.equal(productos.length, 1, "no debe duplicar el producto");
  });

  test("un archivo que no es imagen responde 400", async () => {
    const datos = formulario(base, false);
    datos.append("foto", new Blob(["hola"], { type: "text/plain" }), "nota.txt");
    const r = await pedir("/api/productos", { method: "POST", body: datos });
    assert.equal(r.estado, 400);
    assert.equal(r.cuerpo.errores.imagen, true);
  });
});

// ---------------------------------------------------------------
// HU2 · Modificar producto
// ---------------------------------------------------------------
describe("HU2 · modificar producto", () => {
  test("consultar por referencia encuentra el producto sin importar mayúsculas", async () => {
    productos.push(crearProducto({ id: 3, ref: "ANI003" }));
    const r = await pedir("/api/productos/referencia/ani003");
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.producto.id, 3);
  });

  test("consultar una referencia que no existe responde 404", async () => {
    const r = await pedir("/api/productos/referencia/NOHAY");
    assert.equal(r.estado, 404);
    assert.equal(r.cuerpo.mensaje, "No encontramos un producto con esa referencia.");
  });

  test("PUT a un producto que no existe responde 404", async () => {
    const r = await pedir("/api/productos/999", {
      method: "PUT",
      body: formulario(base, false),
    });
    assert.equal(r.estado, 404);
  });

  test("esc. 1: modificación exitosa", async () => {
    productos.push(crearProducto({ id: 1 }));
    const r = await pedir("/api/productos/1", {
      method: "PUT",
      body: formulario({ ...base, precio: "1800000" }, false),
    });
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.mensaje, "¡Producto actualizado correctamente!");
    assert.equal(r.cuerpo.producto.precio, 1800000);
  });

  test("sin foto nueva conserva la foto anterior", async () => {
    productos.push(crearProducto({ id: 1, imagen: "/fotos/vieja.png" }));
    const r = await pedir("/api/productos/1", {
      method: "PUT",
      body: formulario(base, false),
    });
    assert.equal(r.cuerpo.producto.imagen, "/fotos/vieja.png");
  });

  test("esc. 2: campo vacío responde 400", async () => {
    productos.push(crearProducto({ id: 1 }));
    const r = await pedir("/api/productos/1", {
      method: "PUT",
      body: formulario({ ...base, nombre: "" }, false),
    });
    assert.equal(r.estado, 400);
    assert.equal(r.cuerpo.errores.nombre, true);
  });

  test("esc. 3: precio negativo responde 400", async () => {
    productos.push(crearProducto({ id: 1 }));
    const r = await pedir("/api/productos/1", {
      method: "PUT",
      body: formulario({ ...base, precio: "-1500000" }, false),
    });
    assert.equal(r.estado, 400);
    assert.equal(r.cuerpo.errores.precio, true);
  });

  test("stock 0 deja el producto Inactivo", async () => {
    productos.push(crearProducto({ id: 1 }));
    const r = await pedir("/api/productos/1", {
      method: "PUT",
      body: formulario({ ...base, stock: "0" }, false),
    });
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.producto.estado, "Inactivo");
  });
});

// ---------------------------------------------------------------
// HU4 · Inactivar y activar
// ---------------------------------------------------------------
describe("HU4 · PATCH /api/productos/:id/estado", () => {
  test("esc. 1: inactivar un producto", async () => {
    productos.push(crearProducto({ id: 1 }));
    const r = await cambiarEstado(1, "Inactivo");
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.mensaje, "El producto fue removido del catálogo correctamente");
    assert.equal(r.cuerpo.producto.estado, "Inactivo");
  });

  test("esc. 2: activar un producto con unidades", async () => {
    productos.push(crearProducto({ id: 1, estado: "Inactivo", stock: 5 }));
    const r = await cambiarEstado(1, "Activo");
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.mensaje, "El producto fue publicado en el catálogo correctamente");
    assert.equal(r.cuerpo.producto.estado, "Activo");
  });

  test("esc. 3: activar sin unidades responde 409 y no cambia el estado", async () => {
    productos.push(crearProducto({ id: 1, estado: "Inactivo", stock: 0 }));
    const r = await cambiarEstado(1, "Activo");
    assert.equal(r.estado, 409);
    assert.equal(productos[0].estado, "Inactivo");
  });

  test("un estado que no es Activo ni Inactivo responde 400", async () => {
    productos.push(crearProducto({ id: 1 }));
    const r = await cambiarEstado(1, "Pausado");
    assert.equal(r.estado, 400);
  });

  test("un producto que no existe responde 404", async () => {
    const r = await cambiarEstado(999, "Activo");
    assert.equal(r.estado, 404);
  });
});
