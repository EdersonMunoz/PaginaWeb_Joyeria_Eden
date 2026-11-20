// HE1-HU2-CA002 · Modificar datos de productos
// GET /api/productos/referencia/:ref   consultar el producto por su referencia
// PUT /api/productos/:id               guardar los cambios (foto nueva opcional en "foto")
import { Router } from "express";
import {
  ejecutar,
  buscarProductoPorId,
  buscarProductoPorReferencia,
} from "../baseDatos.js";
import { validarProducto, hayErrores } from "../validar.js";
import { subirFoto } from "../subirFoto.js";
import { subirAlBucket, nombreFoto } from "../almacenFotos.js";
import { requiereRol, requiereSesion } from "../sesion.js";

const router = Router();

const MENSAJE_EXITO = "¡Producto actualizado correctamente!";
const MENSAJE_ERROR =
  "Error al actualizar producto. Por favor completa todos los campos obligatorios y/o corrige los valores numéricos";

// Dado: "he consultado un producto por su referencia"
router.get("/referencia/:ref", requiereSesion, requiereRol("admin"), async (req, res) => {
  const producto = await buscarProductoPorReferencia(req.params.ref.trim());
  if (!producto) {
    return res
      .status(404)
      .json({ mensaje: "No encontramos un producto con esa referencia." });
  }
  res.json({ producto });
});

router.put("/:id", requiereSesion, requiereRol("admin"), subirFoto, async (req, res) => {
  const id = Number(req.params.id);

  const actual = Number.isInteger(id) ? await buscarProductoPorId(id) : null;
  if (!actual) {
    return res.status(404).json({ mensaje: "El producto no existe." });
  }

  const { errores, valores } = validarProducto(req.body, {
    esRegistro: false,
    tieneFoto: true,
  });

  // Escenarios 2 y 3: campos vacíos o valores numéricos no válidos
  if (hayErrores(errores)) {
    return res.status(400).json({ mensaje: MENSAJE_ERROR, errores });
  }

  // Si el admin subió una foto nueva, se sube al bucket; si no, queda la anterior
  const cambiaFoto = Boolean(req.file);
  const fotoNueva = cambiaFoto ? nombreFoto(actual.ref, req.file) : null;
  if (cambiaFoto) {
    try {
      await subirAlBucket(fotoNueva, req.file.buffer, req.file.mimetype);
    } catch (error) {
      console.error(error);
      return res.status(502).json({
        mensaje: "No se pudo guardar la foto en la nube. Intenta de nuevo",
        errores: { imagen: true },
      });
    }
  }

  // Escenario 1: modificación exitosa.
  // Si el stock queda en 0, el producto pasa a "Inactivo" (no se puede vender).
  await ejecutar(
    `UPDATE producto
        SET nombre = :nombre,
            precio = :precio,
            categoria_id = (SELECT id FROM categoria WHERE nombre = :categoria),
            stock = :stock,
            descripcion = :descripcion,
            ${cambiaFoto ? "imagen = :imagen," : ""}
            estado = CASE WHEN :stock <= 0 THEN 'Inactivo' ELSE estado END
      WHERE id = :id`,
    {
      nombre: valores.nombre,
      precio: valores.precio,
      categoria: valores.categoria,
      stock: valores.stock,
      descripcion: valores.descripcion,
      ...(cambiaFoto ? { imagen: fotoNueva } : {}),
      id,
    },
  );

  const producto = await buscarProductoPorId(id);
  res.json({ mensaje: MENSAJE_EXITO, producto });
});

export default router;
