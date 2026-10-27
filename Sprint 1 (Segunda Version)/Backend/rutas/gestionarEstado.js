// HE1-HU4-CA004 · Inactivar y activar productos
// PATCH /api/productos/:id/estado     cuerpo JSON: { "estado": "Activo" | "Inactivo" }
import { Router } from "express";
import { ejecutar, buscarProductoPorId } from "../baseDatos.js";

const router = Router();

const MENSAJE_INACTIVADO = "El producto fue removido del catálogo correctamente";
const MENSAJE_ACTIVADO = "El producto fue publicado en el catálogo correctamente";
const MENSAJE_SIN_UNIDADES =
  "Error al activar el producto. Por favor verifica que existan unidades disponibles";

router.patch("/:id/estado", async (req, res) => {
  const id = Number(req.params.id);
  const estado = req.body?.estado;

  if (estado !== "Activo" && estado !== "Inactivo") {
    return res
      .status(400)
      .json({ mensaje: 'El estado debe ser "Activo" o "Inactivo".' });
  }

  const producto = Number.isInteger(id) ? await buscarProductoPorId(id) : null;
  if (!producto) {
    return res.status(404).json({ mensaje: "El producto no existe." });
  }

  // Escenario 3: activación sin unidades disponibles
  if (estado === "Activo" && Number(producto.stock) <= 0) {
    return res.status(409).json({ mensaje: MENSAJE_SIN_UNIDADES });
  }

  // Escenario 1 (inactivar) y escenario 2 (activar)
  await ejecutar("UPDATE producto SET estado = :estado WHERE id = :id", {
    estado,
    id,
  });

  res.json({
    mensaje: estado === "Activo" ? MENSAJE_ACTIVADO : MENSAJE_INACTIVADO,
    producto: await buscarProductoPorId(id),
  });
});

export default router;