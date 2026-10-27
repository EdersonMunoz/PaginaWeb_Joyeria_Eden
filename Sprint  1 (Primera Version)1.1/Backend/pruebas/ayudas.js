// Ayudas compartidas por las pruebas de HU1 a HU4.
//  - Base de datos falsa en memoria (se conecta con usarEjecutorDePrueba de baseDatos.js)
//  - Servidor de prueba en un puerto libre (nunca usa el 3001)
//  - Funciones para armar formularios y hacer peticiones
// Este archivo NO es una prueba (no termina en .test.js), por eso `node --test` no lo ejecuta solo.
import { before, after, beforeEach } from "node:test";
import fs from "node:fs";
import { crearApp } from "../servidor.js";
import { usarEjecutorDePrueba } from "../baseDatos.js";
import { carpetaFotos } from "../subirFoto.js";

// ---------------------------------------------------------------
// Base de datos falsa
// ---------------------------------------------------------------
export const bd = { productos: [], consultas: [], siguienteId: 1 };

export function agregarProducto(extra = {}) {
  const id = extra.id ?? bd.siguienteId;
  bd.siguienteId = Math.max(bd.siguienteId, id) + 1;
  const producto = {
    id,
    ref: `REF${id}`,
    nombre: "Anillo de oro",
    precio: 1500000,
    categoria: "Anillos",
    stock: 10,
    descripcion: "Anillo de oro de 18 quilates",
    imagen: "/fotos/prueba.png",
    estado: "Activo",
    ...extra,
  };
  bd.productos.push(producto);
  return producto;
}

export const ultimaConsulta = () => bd.consultas.at(-1);

function instalarBaseFalsa() {
  usarEjecutorDePrueba(async (sql, datos) => {
    bd.consultas.push({ sql, datos });

    if (sql.includes("INSERT INTO producto")) {
      agregarProducto({
        ref: datos.ref,
        nombre: datos.nombre,
        precio: datos.precio,
        categoria: datos.categoria,
        stock: datos.stock,
        descripcion: datos.descripcion,
        imagen: datos.imagen,
      });
      return { filas: [], afectadas: 1 };
    }
    if (sql.includes("SET nombre")) {
      const producto = bd.productos.find((p) => p.id === datos.id);
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
      bd.productos.find((p) => p.id === datos.id).estado = datos.estado;
      return { filas: [], afectadas: 1 };
    }
    if (sql.includes("WHERE p.id = :id")) {
      return { filas: bd.productos.filter((p) => p.id === datos.id), afectadas: 0 };
    }
    if (sql.includes("UPPER(p.ref)")) {
      const filas = bd.productos.filter((p) => p.ref.toUpperCase() === datos.ref.toUpperCase());
      return { filas, afectadas: 0 };
    }
    if (sql.includes("ORDER BY p.id")) {
      return { filas: bd.productos, afectadas: 0 };
    }
    throw new Error(`Consulta no prevista en la prueba: ${sql}`);
  });
}

// ---------------------------------------------------------------
// Servidor de prueba: llamar UNA vez al inicio de cada archivo .test.js
// ---------------------------------------------------------------
let servidor;
let API;
let fotosAntes;

export function prepararEntorno() {
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
    bd.productos = [];
    bd.consultas = [];
    bd.siguienteId = 1;
  });
}

// ---------------------------------------------------------------
// Peticiones
// ---------------------------------------------------------------
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
  "base64",
);

// Datos válidos para registrar un producto (HU1)
export const productoValido = {
  ref: "TST001",
  nombre: "Producto de prueba",
  precio: "$1.500.000",
  categoria: "Pulsos",
  stock: "15",
  descripcion: "Creado por las pruebas",
};

// Datos válidos para modificar un producto (HU2): no llevan referencia
export const cambiosValidos = {
  nombre: "Anillo de oro 18k",
  precio: "1800000",
  categoria: "Anillos",
  stock: "20",
  descripcion: "Anillo de oro de 18 quilates",
};

export function formulario(campos, { foto = true } = {}) {
  const datos = new FormData();
  Object.entries(campos).forEach(([k, v]) => datos.append(k, v));
  if (foto) datos.append("foto", new Blob([PNG], { type: "image/png" }), "prueba.png");
  return datos;
}

// Formulario con un archivo que NO es imagen en el campo "foto"
export function formularioConArchivoDeTexto(campos) {
  const datos = formulario(campos, { foto: false });
  datos.append("foto", new Blob(["hola"], { type: "text/plain" }), "nota.txt");
  return datos;
}

export async function pedir(ruta, opciones) {
  const respuesta = await fetch(`${API}${ruta}`, opciones);
  return { estado: respuesta.status, cuerpo: await respuesta.json() };
}

export const registrar = (campos, opciones) =>
  pedir("/api/productos", { method: "POST", body: formulario(campos, opciones) });

export const modificar = (id, campos, opciones = { foto: false }) =>
  pedir(`/api/productos/${id}`, { method: "PUT", body: formulario(campos, opciones) });
