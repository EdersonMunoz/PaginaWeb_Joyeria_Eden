// HE3-HU6 (comprobante de la compra) · Consultar el comprobante digital de la venta
// GET /api/pedidos/:numero     vuelve a consultar el comprobante de un pedido (ej. ED-00000042)
//   - Requiere la cabecera Authorization del MISMO usuario que compró.
// Si el pedido no existe o no es de quien pregunta se responde 404 en ambos casos,
// para no revelar qué números de pedido existen.
// El dibujo y la descarga en SVG siguen siendo del frontend (Comprobante.jsx).
import { Router } from "express";
import { requiereSesion } from "../sesion.js";
import { buscarComprobante, esNumeroDePedido } from "../pedidos.js";

const router = Router();

const NO_ENCONTRADO = { mensaje: "El pedido no existe.", codigo: "PEDIDO_NO_ENCONTRADO" };

router.get("/:numero", requiereSesion, async (req, res) => {
  const numero = String(req.params.numero).trim().toUpperCase();
  if (!esNumeroDePedido(numero)) {
    return res.status(404).json(NO_ENCONTRADO);
  }

  const comprobante = await buscarComprobante(numero, { sesion: req.sesion });
  if (!comprobante) {
    return res.status(404).json(NO_ENCONTRADO);
  }
  return res.json({ comprobante });
});

export default router;
