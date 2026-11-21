// Pedidos (Sprint 3 · HE3-HU6 procesar compra y comprobante).
// Aquí están las consultas a Oracle de PEDIDO, DETALLE_PEDIDO y CUPON
// (db/06_migracion_sprint3_compras.sql y db/07_migracion_cupones.sql).
// Las rutas solo llaman a estas funciones.
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { ejecutar, enTransaccion } from "./baseDatos.js";
import {
  calcularTotales,
  MENSAJE_CUPON_EXPIRADO,
  MENSAJE_CUPON_INVALIDO,
  MENSAJE_CUPON_LIMITE_SUPERADO,
  MENSAJE_CUPON_YA_UTILIZADO,
} from "./validarCompra.js";

// Mayor valor que cabe en pedido.subtotal / pedido.total: NUMBER(14)
const MONTO_MAXIMO = 99999999999999;

// Error "esperado" de una compra: la ruta lo convierte en una respuesta JSON clara.
// Cualquier otro error (Oracle caído, etc.) termina como 500 sin detalles internos.
export class ErrorCompra extends Error {
  constructor(estado, codigo, mensaje, extra = {}) {
    super(mensaje);
    this.name = "ErrorCompra";
    this.estado = estado;
    this.codigo = codigo;
    this.extra = extra;
  }
}

const sha256 = (valor) => createHash("sha256").update(valor, "utf8").digest("hex");

// "ED-00000042": mismo estilo que mostraba el frontend (ED- y 8 dígitos),
// pero ahora sale de la secuencia SEQ_PEDIDO de Oracle, así que nunca se repite.
export const numeroDePedido = (id) => `ED-${String(id).padStart(8, "0")}`;
export const esNumeroDePedido = (numero) => /^ED-\d{8,10}$/.test(numero);

const SELECT_CUPON = `
  SELECT c.codigo AS "codigo", c.porcentaje AS "porcentaje",
         c.max_usos AS "maxUsos",
         CASE
           WHEN TRUNC(SYSDATE) > TRUNC(c.fecha_vencimiento) THEN 1
           ELSE 0
         END AS "expirado"
    FROM cupon c
   WHERE c.codigo = :codigo`;

const SELECT_USOS_CUPON = `
  SELECT COUNT(*) AS "usosGlobales",
         COUNT(CASE WHEN p.usuario_id = :usuarioId THEN 1 END) AS "usosCuenta"
    FROM pedido p
   WHERE p.cupon = :codigo`;

/**
 * Busca un cupón y aplica el orden de rechazo: inexistente, expirado,
 * ya utilizado por la cuenta y límite global. Con bloquear=true, bloquea
 * primero la fila del cupón para serializar compras concurrentes.
 */
export async function buscarCupon(codigo, usuarioId, { ejecutar: ejecutarBase = ejecutar, bloquear = false } = {}) {
  const consulta = bloquear ? `${SELECT_CUPON}\n     FOR UPDATE WAIT 10` : SELECT_CUPON;
  const { filas } = await ejecutarBase(consulta, { codigo });
  const fila = filas[0];
  if (!fila) {
    return { error: { codigo: "CUPON_INVALIDO", mensaje: MENSAJE_CUPON_INVALIDO } };
  }
  if (Number(fila.expirado) === 1) {
    return { error: { codigo: "CUPON_EXPIRADO", mensaje: MENSAJE_CUPON_EXPIRADO } };
  }

  const conteo = await ejecutarBase(SELECT_USOS_CUPON, { codigo, usuarioId });
  const { usosGlobales = 0, usosCuenta = 0 } = conteo.filas[0] ?? {};
  if (Number(usosCuenta) > 0) {
    return { error: { codigo: "CUPON_YA_UTILIZADO", mensaje: MENSAJE_CUPON_YA_UTILIZADO } };
  }
  if (Number(usosGlobales) >= Number(fila.maxUsos)) {
    return { error: { codigo: "CUPON_LIMITE_SUPERADO", mensaje: MENSAJE_CUPON_LIMITE_SUPERADO } };
  }

  return {
    cupon: {
      codigo: fila.codigo,
      porcentaje: Number(fila.porcentaje),
    },
  };
}

// ---------------------------------------------------------------
// Lectura del comprobante (lo que quedó GUARDADO, no lo que mandó el navegador)
// ---------------------------------------------------------------
const SELECT_PEDIDO = `
  SELECT p.id AS "id", p.numero AS "numeroPedido", p.fecha AS "fechaEmision",
         p.estado AS "estado", p.usuario_id AS "usuarioId",
         p.cliente_nombre AS "clienteNombre",
         p.cliente_identificacion AS "clienteIdentificacion",
         p.cliente_telefono AS "clienteTelefono", p.cliente_correo AS "clienteCorreo",
         p.direccion AS "direccion", p.metodo_pago AS "metodoPago",
         p.cupon AS "codigoCupon", p.porcentaje_descuento AS "porcentajeDescuento",
         p.subtotal AS "subtotal", p.descuento AS "descuento", p.total AS "total",
         p.clave_consulta_hash AS "claveConsultaHash"
    FROM pedido p`;

const SELECT_DETALLES = `
  SELECT d.linea AS "linea", d.producto_id AS "productoId", d.producto_ref AS "ref",
         d.producto_nombre AS "nombre", d.precio_unitario AS "precio",
         d.cantidad AS "cantidad", d.subtotal AS "subtotal"
    FROM detalle_pedido d
   WHERE d.pedido_id = :pedidoId
   ORDER BY d.linea`;

// Arma el JSON que usa Comprobante.jsx. Los datos del producto son la "fotografía"
// guardada en DETALLE_PEDIDO: no cambian aunque después editen el catálogo.
function armarComprobante(pedido, detalles) {
  const cliente = {
    nombre: pedido.clienteNombre,
    identificacion: pedido.clienteIdentificacion,
    telefono: pedido.clienteTelefono,
    correo: pedido.clienteCorreo,
  };
  const tieneCliente = Object.values(cliente).some((valor) => valor !== null && valor !== "");
  const fecha = pedido.fechaEmision;

  return {
    numeroPedido: pedido.numeroPedido,
    fechaEmision: fecha instanceof Date ? fecha.toISOString() : fecha,
    estado: pedido.estado,
    cliente: tieneCliente ? cliente : null,
    direccion: pedido.direccion,
    metodoPago: pedido.metodoPago,
    codigoCupon: pedido.codigoCupon ?? "",
    porcentajeDescuento: Number(pedido.porcentajeDescuento),
    articulos: detalles.map((detalle) => ({
      producto: {
        id: detalle.productoId,
        ref: detalle.ref,
        nombre: detalle.nombre,
        precio: Number(detalle.precio),
      },
      cantidad: Number(detalle.cantidad),
      subtotal: Number(detalle.subtotal),
    })),
    totalProductos: detalles.reduce((suma, detalle) => suma + Number(detalle.cantidad), 0),
    subtotal: Number(pedido.subtotal),
    descuento: Number(pedido.descuento),
    total: Number(pedido.total),
  };
}

// `bd` es cualquier cosa con ejecutar(sql, datos): la transacción de la compra
// o el ejecutar() normal de baseDatos.js.
async function leerPedido(bd, condicion, datos) {
  const { filas } = await bd.ejecutar(`${SELECT_PEDIDO} WHERE ${condicion}`, datos);
  const pedido = filas[0];
  if (!pedido) return null;
  const detalles = await bd.ejecutar(SELECT_DETALLES, { pedidoId: pedido.id });
  return { pedido, comprobante: armarComprobante(pedido, detalles.filas) };
}

// ¿Quien pregunta es el dueño del pedido?
//  - Pedido de un usuario: solo ese usuario (el id sale del token firmado, no del navegador).
//  - Pedido de invitado: solo quien tenga la clave que se entregó al comprar.
function esDueno(pedido, { sesion, claveConsulta }) {
  if (pedido.usuarioId !== null && pedido.usuarioId !== undefined) {
    return Boolean(sesion) && Number(sesion.id) === Number(pedido.usuarioId);
  }
  if (!pedido.claveConsultaHash || typeof claveConsulta !== "string" || !claveConsulta) {
    return false;
  }
  const esperado = Buffer.from(pedido.claveConsultaHash, "hex");
  const recibido = Buffer.from(sha256(claveConsulta), "hex");
  return esperado.length === recibido.length && timingSafeEqual(esperado, recibido);
}

// HE3-HU6 (comprobante de la compra) · devuelve el comprobante o null (no existe o no es de quien pregunta).
export async function buscarComprobante(numero, quien) {
  const encontrado = await leerPedido({ ejecutar }, "p.numero = :numero", { numero });
  if (!encontrado || !esDueno(encontrado.pedido, quien)) return null;
  return encontrado.comprobante;
}

// ---------------------------------------------------------------
// Registro de la compra: UNA sola transacción
// ---------------------------------------------------------------
const SELECT_PRODUCTO_BLOQUEADO = `
  SELECT p.id AS "id", p.ref AS "ref", p.nombre AS "nombre", p.precio AS "precio",
         p.stock AS "stock", p.estado AS "estado"
    FROM producto p
   WHERE p.id = :id
     FOR UPDATE WAIT 10`;

/**
 * Registra la compra completa o no registra nada.
 *
 * @param {object} compra   valores ya validados por validarCompra()
 * @param {object|null} sesion   payload del token ({ id, rol }) o null si es invitado
 * @returns {{ comprobante, inventario, claveConsulta?, repetida }}
 */
export async function registrarCompra(compra, sesion) {
  const usuarioId = sesion ? Number(sesion.id) : null;
  // La clave del invitado solo existe aquí y en la respuesta: en la base queda su hash.
  const claveConsulta = usuarioId === null ? randomBytes(24).toString("base64url") : null;

  try {
    return await enTransaccion(async (tx) => {
      // 0. Solicitud repetida (doble clic, reintento): se devuelve el pedido que ya existe.
      const repetido = await buscarSolicitudRepetida(tx, compra.idSolicitud, usuarioId);
      if (repetido) return repetido;

      // 1. Comprador: los datos salen de la cuenta en Oracle, no del navegador.
      const cliente = await obtenerCliente(tx, usuarioId, compra.comprador);

      // 2. Bloquear y validar el cupón antes de contar usos y registrar el pedido.
      let cupon = null;
      if (compra.codigoCupon) {
        const validacionCupon = await buscarCupon(compra.codigoCupon, usuarioId, {
          ejecutar: tx.ejecutar,
          bloquear: true,
        });
        if (validacionCupon.error) {
          throw new ErrorCompra(
            400,
            validacionCupon.error.codigo,
            validacionCupon.error.mensaje,
            { errores: { cupon: true } },
          );
        }
        cupon = validacionCupon.cupon;
      }

      // 3. Bloquear los productos (SELECT ... FOR UPDATE) y leer precio y stock reales.
      //    Mientras esta transacción no termine, nadie más puede cambiar esas filas:
      //    una segunda compra del mismo producto espera aquí y después ve el stock ya descontado.
      const lineas = [];
      const conflictos = [];
      for (const { productoId, cantidad } of compra.articulos) {
        const { filas } = await tx.ejecutar(SELECT_PRODUCTO_BLOQUEADO, { id: productoId });
        const producto = filas[0];
        if (!producto) {
          conflictos.push({ productoId, motivo: "INEXISTENTE", cantidadSolicitada: cantidad, stockDisponible: 0 });
        } else if (producto.estado !== "Activo") {
          conflictos.push({
            productoId,
            nombre: producto.nombre,
            motivo: "INACTIVO",
            cantidadSolicitada: cantidad,
            stockDisponible: 0,
          });
        } else if (Number(producto.stock) < cantidad) {
          conflictos.push({
            productoId,
            nombre: producto.nombre,
            motivo: "STOCK_INSUFICIENTE",
            cantidadSolicitada: cantidad,
            stockDisponible: Number(producto.stock),
          });
        } else {
          lineas.push({
            productoId,
            ref: producto.ref,
            nombre: producto.nombre,
            precio: Number(producto.precio),
            cantidad,
          });
        }
      }
      if (conflictos.length > 0) {
        const soloStock = conflictos.every((c) => c.motivo === "STOCK_INSUFICIENTE");
        throw new ErrorCompra(
          409,
          soloStock ? "STOCK_INSUFICIENTE" : "PRODUCTO_NO_DISPONIBLE",
          soloStock
            ? "No hay unidades suficientes de uno o más productos. Revisa las cantidades del carrito"
            : "Uno o más productos del carrito ya no están disponibles",
          { conflictos },
        );
      }

      // 4. Dinero: todo se calcula aquí con los precios de Oracle.
      const totales = calcularTotales(lineas, cupon);
      if (totales.subtotal > MONTO_MAXIMO) {
        throw new ErrorCompra(400, "MONTO_EXCEDIDO", "El valor de la compra supera el máximo permitido", {
          errores: { articulos: true },
        });
      }

      // 5. Pedido: el número sale de la secuencia y la fecha del reloj de Oracle (SYSTIMESTAMP).
      const secuencia = await tx.ejecutar(`SELECT seq_pedido.NEXTVAL AS "id" FROM dual`);
      const pedidoId = Number(secuencia.filas[0].id);
      await tx.ejecutar(
        `INSERT INTO pedido
           (id, numero, fecha, usuario_id, cliente_nombre, cliente_identificacion,
            cliente_telefono, cliente_correo, direccion, metodo_pago, cupon,
            porcentaje_descuento, subtotal, descuento, total, estado,
            clave_consulta_hash, id_solicitud)
         VALUES
           (:id, :numero, SYSTIMESTAMP, :usuarioId, :clienteNombre, :clienteIdentificacion,
            :clienteTelefono, :clienteCorreo, :direccion, :metodoPago, :cupon,
            :porcentajeDescuento, :subtotal, :descuento, :total, 'Pagado',
            :claveConsultaHash, :idSolicitud)`,
        {
          id: pedidoId,
          numero: numeroDePedido(pedidoId),
          usuarioId,
          clienteNombre: cliente?.nombre || null,
          clienteIdentificacion: cliente?.identificacion || null,
          clienteTelefono: cliente?.telefono || null,
          clienteCorreo: cliente?.correo || null,
          direccion: compra.direccion,
          metodoPago: compra.metodoPago,
          cupon: cupon?.codigo ?? null,
          porcentajeDescuento: totales.porcentajeDescuento,
          subtotal: totales.subtotal,
          descuento: totales.descuento,
          total: totales.total,
          claveConsultaHash: claveConsulta ? sha256(claveConsulta) : null,
          idSolicitud: compra.idSolicitud,
        },
      );

      // 6. Detalle (fotografía del producto) + descuento del inventario, línea por línea.
      const inventario = [];
      for (const [indice, linea] of totales.detalles.entries()) {
        await tx.ejecutar(
          `INSERT INTO detalle_pedido
             (pedido_id, linea, producto_id, producto_ref, producto_nombre,
              precio_unitario, cantidad, subtotal)
           VALUES
             (:pedidoId, :linea, :productoId, :ref, :nombre, :precio, :cantidad, :subtotal)`,
          {
            pedidoId,
            linea: indice + 1,
            productoId: linea.productoId,
            ref: linea.ref,
            nombre: linea.nombre,
            precio: linea.precio,
            cantidad: linea.cantidad,
            subtotal: linea.subtotal,
          },
        );

        // Segunda barrera contra la sobreventa: solo descuenta si TODAVÍA alcanza.
        // El estado no se toca aquí: si el stock llega a 0, el trigger
        // TRG_PRODUCTO_SIN_STOCK deja el producto "Inactivo" (regla del Sprint 1).
        const descuento = await tx.ejecutar(
          `UPDATE producto
              SET stock = stock - :cantidad
            WHERE id = :id AND estado = 'Activo' AND stock >= :cantidad`,
          { id: linea.productoId, cantidad: linea.cantidad },
        );
        if (descuento.afectadas !== 1) {
          throw new ErrorCompra(
            409,
            "STOCK_INSUFICIENTE",
            "No hay unidades suficientes de uno o más productos. Revisa las cantidades del carrito",
            {
              conflictos: [
                {
                  productoId: linea.productoId,
                  nombre: linea.nombre,
                  motivo: "STOCK_INSUFICIENTE",
                  cantidadSolicitada: linea.cantidad,
                },
              ],
            },
          );
        }

        const actual = await tx.ejecutar(
          `SELECT p.id AS "id", p.stock AS "stock", p.estado AS "estado"
             FROM producto p WHERE p.id = :id`,
          { id: linea.productoId },
        );
        inventario.push({
          id: actual.filas[0].id,
          stock: Number(actual.filas[0].stock),
          estado: actual.filas[0].estado,
        });
      }

      // 7. El comprobante se arma leyendo lo que acaba de quedar guardado.
      const guardado = await leerPedido(tx, "p.id = :id", { id: pedidoId });
      return {
        comprobante: guardado.comprobante,
        inventario,
        ...(claveConsulta ? { claveConsulta } : {}),
        repetida: false,
      };
    }); // <- aquí enTransaccion hace COMMIT; si algo falló arriba, ROLLBACK de todo
  } catch (error) {
    // ORA-00001 en la columna única ID_SOLICITUD: la misma solicitud llegó dos veces
    // al tiempo y la otra ganó. Esta ya se deshizo; se devuelve el pedido de la otra.
    if (error?.errorNum === 1 && compra.idSolicitud) {
      const repetido = await buscarSolicitudRepetida({ ejecutar }, compra.idSolicitud, usuarioId);
      if (repetido) return repetido;
    }
    // ORA-30006 / ORA-00054: otra compra tuvo bloqueado el producto más de 10 segundos.
    if (error?.errorNum === 30006 || error?.errorNum === 54) {
      throw new ErrorCompra(
        503,
        "INVENTARIO_OCUPADO",
        "El inventario está ocupado en este momento. Intenta de nuevo en unos segundos",
      );
    }
    throw error;
  }
}

async function buscarSolicitudRepetida(bd, idSolicitud, usuarioId) {
  if (!idSolicitud) return null;
  const encontrado = await leerPedido(bd, "p.id_solicitud = :idSolicitud", { idSolicitud });
  if (!encontrado) return null;

  const propietario = encontrado.pedido.usuarioId ?? null;
  if ((propietario === null ? null : Number(propietario)) !== usuarioId) {
    // El identificador ya lo usó otra persona: no se le muestra ese pedido.
    throw new ErrorCompra(409, "SOLICITUD_REPETIDA", "Esta solicitud de compra ya fue utilizada");
  }
  return { comprobante: encontrado.comprobante, inventario: [], repetida: true };
}

async function obtenerCliente(tx, usuarioId, comprador) {
  if (usuarioId === null) return comprador; // invitado: datos opcionales ya validados

  const { filas } = await tx.ejecutar(
    `SELECT u.nombre AS "nombre", u.identificacion AS "identificacion",
            u.telefono AS "telefono", u.correo AS "correo", u.estado AS "estado"
       FROM usuario u
      WHERE u.id = :id`,
    { id: usuarioId },
  );
  const cuenta = filas[0];
  if (!cuenta) {
    throw new ErrorCompra(401, "SESION_INVALIDA", "Debes iniciar sesión");
  }
  if (cuenta.estado !== "Activo") {
    throw new ErrorCompra(403, "CUENTA_INACTIVA", "La cuenta está inactiva. Inicia sesión de nuevo para comprar");
  }
  return cuenta;
}
