// HE1-HU3-CA003 · Consultar el catálogo interactivo
// GET /api/productos        lista de productos con filtros opcionales:
//     ?estado=Activo (por defecto) | Inactivo | todos
//     ?categoria=Anillos,Cadenas   (una o varias, separadas por coma)
//     ?precioMin=150000&precioMax=4000000
//     ?q=bright                     (busca en nombre, referencia, categoría y descripción)
// GET /api/productos/:id    detalle de un producto
import { Router } from "express";
import { ejecutar, SELECT_PRODUCTO, buscarProductoPorId } from "../baseDatos.js";
import { CATEGORIAS } from "../validar.js";

const router = Router();

router.get("/", async (req, res) => {
  const condiciones = [];
  const datos = {};

  // Por defecto el cliente solo ve los productos activos (HU4)
  const estado = req.query.estado ?? "Activo";
  if (estado === "Activo" || estado === "Inactivo") {
    condiciones.push("p.estado = :estado");
    datos.estado = estado;
  }

  // Escenario 2: filtro por categoría
  if (req.query.categoria) {
    const categorias = String(req.query.categoria)
      .split(",")
      .map((c) => c.trim())
      .filter((c) => CATEGORIAS.includes(c));
    if (categorias.length > 0) {
      const marcadores = categorias.map((_c, i) => `:cat${i}`);
      categorias.forEach((c, i) => (datos[`cat${i}`] = c));
      condiciones.push(`c.nombre IN (${marcadores.join(", ")})`);
    }
  }

  // Escenario 3: filtro por precio
  const precioMin = Number(req.query.precioMin);
  if (req.query.precioMin && Number.isFinite(precioMin)) {
    condiciones.push("p.precio >= :precioMin");
    datos.precioMin = precioMin;
  }
  const precioMax = Number(req.query.precioMax);
  if (req.query.precioMax && Number.isFinite(precioMax)) {
    condiciones.push("p.precio <= :precioMax");
    datos.precioMax = precioMax;
  }

  // Escenario 4: búsqueda por palabra
  const q = String(req.query.q ?? "").trim().toLowerCase();
  if (q) {
    condiciones.push(`(LOWER(p.nombre) LIKE :q OR LOWER(p.ref) LIKE :q
                       OR LOWER(c.nombre) LIKE :q OR LOWER(p.descripcion) LIKE :q)`);
    datos.q = `%${q}%`;
  }

  const donde = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  const { filas } = await ejecutar(`${SELECT_PRODUCTO} ${donde} ORDER BY p.id`, datos);
  res.json({ productos: filas });
});

// Escenario 5: detalle ampliado del producto
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const producto = Number.isInteger(id) ? await buscarProductoPorId(id) : null;
  if (!producto) {
    return res.status(404).json({ mensaje: "El producto no existe." });
  }
  res.json({ producto });
});

export default router;
