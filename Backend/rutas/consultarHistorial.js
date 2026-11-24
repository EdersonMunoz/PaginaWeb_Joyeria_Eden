// Sprint 4 · HE4-HU2 · Consultar el historial de pedidos
// GET /api/pedidos     lista los pedidos de la cuenta que inició sesión (el más reciente primero)
//   - Requiere la cabecera Authorization de un cliente.
//   - El id de la cuenta sale del token firmado, nunca de la dirección ni del cuerpo:
//     nadie puede pedir el historial de otra persona.
//   - Sin pedidos responde { pedidos: [] } (la página muestra el estado vacío).
import { Router } from "express";
import { requiereRol, requiereSesion } from "../sesion.js";
import { listarPedidosDeUsuario } from "../pedidos.js";

const router = Router();

router.get("/", requiereSesion, requiereRol("cliente"), async (req, res) => {
  const pedidos = await listarPedidosDeUsuario(req.sesion.id);
  return res.json({ pedidos });
});

export default router;
