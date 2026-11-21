// HE3-HU2-CA002 · Procesar la compra de los productos seleccionados
// (y la validación definitiva de HE3-HU1: cantidades contra el inventario real)
//
// POST /api/pedidos          procesa la compra (pago SIMULADO: no se contacta ningún banco)
//   cuerpo JSON: {
//     "articulos":   [{ "productoId": 1, "cantidad": 2 }],
//     "metodoPago":  "Daviplata",
//     "direccion":   "Calle 10A Norte #25A-03",
//     "codigoCupon": "PROMO2026",          (opcional)
//     "idSolicitud": "f3b0c1e2-...",       (opcional: evita cobrar dos veces el mismo clic)
//   }
//   Requiere sesión (Authorization: Bearer ...); el pedido queda a nombre de la cuenta.
//
// POST /api/pedidos/cupon    valida un cupón:  { "codigo": "PROMO2026" } -> { codigo, porcentaje }
import { Router } from "express";
import { requiereSesion } from "../sesion.js";
import {
  validarCompra,
  MENSAJE_CUPON_VACIO,
} from "../validarCompra.js";
import { buscarCupon, ErrorCompra, registrarCompra } from "../pedidos.js";

const router = Router();

const MENSAJE_EXITO = "Pago exitoso, compra realizada.";

// HE3-HU2 escenario 2: el porcentaje lo decide el servidor, no la página
router.post("/cupon", requiereSesion, async (req, res) => {
  const codigo = typeof req.body?.codigo === "string" ? req.body.codigo.trim().toUpperCase() : "";
  if (!codigo) {
    return res
      .status(400)
      .json({ mensaje: MENSAJE_CUPON_VACIO, codigo: "CUPON_VACIO", errores: { cupon: true } });
  }
  const validacion = await buscarCupon(codigo, req.sesion.id);
  if (validacion.error) {
    return res
      .status(400)
      .json({
        mensaje: validacion.error.mensaje,
        codigo: validacion.error.codigo,
        errores: { cupon: true },
      });
  }
  return res.json({ cupon: validacion.cupon });
});

// HE3-HU2 escenarios 3 y 4
router.post("/", requiereSesion, async (req, res) => {
  const { valores, error } = validarCompra(req.body);
  if (error) {
    return res.status(error.estado).json({
      mensaje: error.mensaje,
      codigo: error.codigo,
      ...(error.errores ? { errores: error.errores } : {}),
    });
  }

  let resultado;
  try {
    resultado = await registrarCompra(valores, req.sesion);
  } catch (errorCompra) {
    if (errorCompra instanceof ErrorCompra) {
      return res.status(errorCompra.estado).json({
        mensaje: errorCompra.message,
        codigo: errorCompra.codigo,
        ...errorCompra.extra,
      });
    }
    throw errorCompra; // error inesperado: lo atiende servidor.js (500 sin detalles de Oracle)
  }

  // 201 si el pedido se acaba de crear; 200 si era una solicitud repetida
  return res.status(resultado.repetida ? 200 : 201).json({
    mensaje: MENSAJE_EXITO,
    comprobante: resultado.comprobante,
    inventario: resultado.inventario,
  });
});

export default router;
