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
//     "comprador":   { nombre, identificacion, telefono, correo }   (opcional, solo invitados)
//   }
//   Con sesión (Authorization: Bearer ...) el pedido queda a nombre de la cuenta.
//   Sin sesión se compra como invitado, igual que la ruta pública /Inicio/Carrito.
//
// POST /api/pedidos/cupon    valida un cupón:  { "codigo": "PROMO2026" } -> { codigo, porcentaje }
import { Router } from "express";
import { sesionOpcional } from "../sesion.js";
import {
  buscarCupon,
  validarCompra,
  MENSAJE_CUPON_INVALIDO,
  MENSAJE_CUPON_VACIO,
} from "../validarCompra.js";
import { ErrorCompra, registrarCompra } from "../pedidos.js";

const router = Router();

const MENSAJE_EXITO = "Pago exitoso, compra realizada.";

// HE3-HU2 escenario 2: el porcentaje lo decide el servidor, no la página
router.post("/cupon", (req, res) => {
  const codigo = typeof req.body?.codigo === "string" ? req.body.codigo.trim() : "";
  if (!codigo) {
    return res
      .status(400)
      .json({ mensaje: MENSAJE_CUPON_VACIO, codigo: "CUPON_VACIO", errores: { cupon: true } });
  }
  const cupon = buscarCupon(codigo);
  if (!cupon) {
    return res
      .status(400)
      .json({ mensaje: MENSAJE_CUPON_INVALIDO, codigo: "CUPON_INVALIDO", errores: { cupon: true } });
  }
  return res.json({ cupon });
});

// HE3-HU2 escenarios 3 y 4
router.post("/", sesionOpcional, async (req, res) => {
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
    ...(resultado.claveConsulta ? { claveConsulta: resultado.claveConsulta } : {}),
  });
});

export default router;
