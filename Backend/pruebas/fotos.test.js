// Pruebas de las fotos en la nube (bucket de OCI Object Storage).
// No necesitan Oracle ni internet: usan la base y el bucket falsos de ayudas.js.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  bd,
  bucket,
  URL_BUCKET,
  prepararEntorno,
  registrar,
  modificar,
  pedir,
  productoValido,
  cambiosValidos,
  agregarProducto,
  PNG,
} from "./ayudas.js";
import { usarAlmacenDePrueba } from "../almacenFotos.js";

prepararEntorno();

describe("Fotos en el bucket de Oracle Cloud", () => {
  test("al registrar, la foto se sube al bucket y en la base queda solo su nombre", async () => {
    const r = await registrar(productoValido);
    assert.equal(r.estado, 201);

    const [nombre, foto] = [...bucket.fotos.entries()][0];
    assert.match(nombre, /^productos\/TST001-\d+\.png$/);
    assert.deepEqual(foto.bytes, PNG, "se suben los mismos bytes de la foto");
    assert.equal(foto.tipo, "image/png");

    assert.equal(bd.productos[0].imagen, nombre, "la base guarda el nombre, no la foto");
    assert.equal(r.cuerpo.producto.imagen, URL_BUCKET + nombre, "el frontend recibe la URL completa");
  });

  test("la URL pública no lleva la parte secreta de la PAR", async () => {
    agregarProducto({ ref: "ANI00001", imagen: "productos/AnillosAzules.jpg" });
    const r = await pedir("/api/productos?estado=todos");
    assert.equal(r.cuerpo.productos[0].imagen, `${URL_BUCKET}productos/AnillosAzules.jpg`);
    assert.ok(!r.cuerpo.productos[0].imagen.includes("TOKEN-SECRETO"));
  });

  test("si el registro tiene errores, no se sube ninguna foto", async () => {
    const r = await registrar({ ...productoValido, nombre: "" });
    assert.equal(r.estado, 400);
    assert.equal(bucket.fotos.size, 0);
  });

  test("modificar SIN foto nueva deja la misma foto", async () => {
    const p = agregarProducto({ ref: "ANI00001", imagen: "productos/AnillosAzules.jpg" });
    const r = await modificar(p.id, cambiosValidos);
    assert.equal(r.estado, 200);
    assert.equal(bucket.fotos.size, 0);
    assert.equal(bd.productos[0].imagen, "productos/AnillosAzules.jpg");
  });

  test("modificar CON foto nueva la sube y cambia el nombre en la base", async () => {
    const p = agregarProducto({ ref: "ANI00001", imagen: "productos/AnillosAzules.jpg" });
    const r = await modificar(p.id, cambiosValidos, { foto: true });
    assert.equal(r.estado, 200);
    const [nombre] = [...bucket.fotos.keys()];
    assert.match(nombre, /^productos\/ANI00001-\d+\.png$/);
    assert.equal(bd.productos[0].imagen, nombre);
  });

  test("si el bucket falla, no se registra el producto y se avisa", async () => {
    usarAlmacenDePrueba(async () => { throw new Error("sin internet"); });
    try {
      const r = await registrar(productoValido);
      assert.equal(r.estado, 502);
      assert.equal(r.cuerpo.errores.imagen, true);
      assert.equal(bd.productos.length, 0);
    } finally {
      usarAlmacenDePrueba(async (nombre, bytes, tipo) => bucket.fotos.set(nombre, { bytes, tipo }));
    }
  });
});
