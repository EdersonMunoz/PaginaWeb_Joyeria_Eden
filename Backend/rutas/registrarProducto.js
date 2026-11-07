// HE1-HU1-CA001 · Registrar un nuevo producto
// POST /api/productos   (formulario multipart con la foto en el campo "foto")
import { Router } from "express";
import { ejecutar, buscarProductoPorReferencia } from "../baseDatos.js";
import { validarProducto, hayErrores } from "../validar.js";
import { subirFoto } from "../subirFoto.js";
import { subirAlBucket, nombreFoto } from "../almacenFotos.js";

const router = Router();

const MENSAJE_EXITO = "¡Producto Registrado Exitosamente!";
const MENSAJE_ERROR =
  "Error al registrar producto. Por favor completa todos los campos obligatorios y/o corrige los valores numéricos";

router.post("/", subirFoto, async (req, res) => {
  const { errores, valores } = validarProducto(req.body, {
    esRegistro: true,
    tieneFoto: Boolean(req.file),
  });

  // Escenarios 2 y 3: campos vacíos o valores numéricos no válidos
  if (hayErrores(errores)) {
    return res.status(400).json({ mensaje: MENSAJE_ERROR, errores });
  }

  // La referencia no se puede repetir
  if (await buscarProductoPorReferencia(valores.ref)) {
    return res.status(409).json({
      mensaje: "Ya existe un producto con esa referencia",
      errores: { ref: true },
    });
  }

  // La foto se sube al bucket de Oracle Cloud; en la base solo queda su nombre
  const imagen = nombreFoto(valores.ref, req.file);
  try {
    await subirAlBucket(imagen, req.file.buffer, req.file.mimetype);
  } catch (error) {
    console.error(error);
    return res.status(502).json({
      mensaje: "No se pudo guardar la foto en la nube. Intenta de nuevo",
      errores: { imagen: true },
    });
  }

  // Escenario 1: registro exitoso
  await ejecutar(
    `INSERT INTO producto (ref, nombre, precio, categoria_id, stock, descripcion, imagen, estado)
     VALUES (:ref, :nombre, :precio,
             (SELECT id FROM categoria WHERE nombre = :categoria),
             :stock, :descripcion, :imagen, 'Activo')`,
    {
      ref: valores.ref,
      nombre: valores.nombre,
      precio: valores.precio,
      categoria: valores.categoria,
      stock: valores.stock,
      descripcion: valores.descripcion,
      imagen,
    },
  );

  const producto = await buscarProductoPorReferencia(valores.ref);
  res.status(201).json({ mensaje: MENSAJE_EXITO, producto });
});

export default router;
