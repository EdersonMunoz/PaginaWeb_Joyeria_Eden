// Reglas de la compra (Sprint 3 · HE3-HU1 carrito, HE3-HU2 procesar compra).
// Igual que validar.js para los productos: aquí NO se toca la base de datos.
// Son las mismas reglas que muestra el frontend (Carrito.jsx); el backend las
// repite y además calcula el dinero, para que nadie pueda saltarse la página.

// Métodos de pago del diseño (Prototipo_Usuario_carrito_Metodo_Pago).
// "Ninguno" es el estado "todavía no elegí": no es un método válido.
export const METODOS_PAGO = [
  "Bancolombia",
  "Daviplata",
  "Nequi",
  "Itaú Colombia",
  "Banco de Bogotá",
  "Banco AV Villas",
  "Banco Falabella",
  "Banco de Occidente",
  "Banco Popular",
];

// Cupones vigentes: código -> porcentaje de descuento sobre el subtotal
export const CUPONES = { PROMO2026: 5 };

// Máximos que caben en las columnas de Oracle
const CANTIDAD_MAXIMA = 99999999; // producto.stock NUMBER(8)
const DIRECCION_MAXIMA = 300; // igual que usuario.direccion
export const LINEAS_MAXIMAS = 100; // productos distintos en una misma compra

export const MENSAJE_ERROR_PAGO =
  "Error al realizar el pago de la compra. Por favor completa todos los campos obligatorios y/o corrige la información";
export const MENSAJE_CUPON_INVALIDO = "El cupón ingresado no es válido";
export const MENSAJE_CUPON_VACIO = "Ingresa un código de cupón.";

const texto = (valor) =>
  typeof valor === "string" || typeof valor === "number" ? String(valor).trim() : "";

// Misma regla que el frontend: al menos 5 caracteres, una letra y un número;
// la vía no puede ser "0"
// (el diseño usa "Calle 0 #25A-03" como ejemplo de dirección inválida).
// No se exige un formato exacto para no rechazar direcciones reales
// ("Vereda El Tablón, casa 4", "Km 3 vía al Bordo"...).
export function direccionValida(direccion) {
  if (typeof direccion !== "string") return false;
  const normalizada = direccion.trim();
  return (
    normalizada.length >= 5 &&
    normalizada.length <= DIRECCION_MAXIMA &&
    !/^(?:calle|carrera|cra\.?|avenida|av\.?)\s*0(?:\s|#|$)/i.test(normalizada) &&
    /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(normalizada) &&
    /\d/.test(normalizada)
  );
}

// Devuelve { codigo, porcentaje } o null si el código no existe.
// No distingue mayúsculas ni espacios alrededor ("promo2026 " sirve).
export function buscarCupon(codigo) {
  const normalizado = texto(codigo).toUpperCase();
  return Object.hasOwn(CUPONES, normalizado)
    ? { codigo: normalizado, porcentaje: CUPONES[normalizado] }
    : null;
}

// Un entero positivo: 3 o "3". Rechaza 0, -1, 2.5, "2.5", "1e3", "0x10", null, true...
function limpiarEnteroPositivo(valor) {
  if (typeof valor === "number") {
    return Number.isSafeInteger(valor) && valor > 0 ? valor : NaN;
  }
  if (typeof valor === "string" && /^\d{1,15}$/.test(valor.trim())) {
    const numero = Number(valor.trim());
    return numero > 0 ? numero : NaN;
  }
  return NaN;
}

function error(estado, codigo, mensaje, errores) {
  return { error: { estado, codigo, mensaje, ...(errores ? { errores } : {}) } };
}

/**
 * Valida el cuerpo de POST /api/pedidos.
 * Solo se leen: articulos [{ productoId, cantidad }], metodoPago, direccion,
 * codigoCupon, idSolicitud y comprador. Precios, subtotales, descuentos, totales,
 * número de pedido, fecha o usuario que mande el navegador se IGNORAN.
 *
 * @returns {{ valores: object } | { error: { estado, codigo, mensaje, errores? } }}
 */
export function validarCompra(cuerpo) {
  const datos = cuerpo && typeof cuerpo === "object" && !Array.isArray(cuerpo) ? cuerpo : {};

  // --- Carrito ---------------------------------------------------------
  const articulos = datos.articulos;
  if (!Array.isArray(articulos) || articulos.length === 0) {
    return error(400, "CARRITO_VACIO", "No hay productos agregados en el carrito", {
      articulos: true,
    });
  }

  const cantidades = new Map(); // productoId -> cantidad (une líneas repetidas)
  for (const articulo of articulos) {
    const productoId = limpiarEnteroPositivo(articulo?.productoId);
    if (Number.isNaN(productoId)) {
      return error(400, "PRODUCTO_INVALIDO", "Uno de los productos del carrito no es válido", {
        articulos: true,
      });
    }
    const cantidad = limpiarEnteroPositivo(articulo?.cantidad);
    const acumulada = (cantidades.get(productoId) ?? 0) + cantidad;
    if (Number.isNaN(cantidad) || acumulada > CANTIDAD_MAXIMA) {
      return error(
        400,
        "CANTIDAD_INVALIDA",
        "La cantidad de cada producto debe ser un número entero mayor que cero",
        { articulos: true },
      );
    }
    cantidades.set(productoId, acumulada);
  }
  if (cantidades.size > LINEAS_MAXIMAS) {
    return error(400, "CARRITO_DEMASIADO_GRANDE", "El carrito tiene demasiados productos distintos", {
      articulos: true,
    });
  }

  // --- Método de pago y dirección (HE3-HU2 escenario 4) ------------------
  const metodoPago = texto(datos.metodoPago);
  const direccion = typeof datos.direccion === "string" ? datos.direccion.trim() : "";
  const erroresPago = {};
  if (!METODOS_PAGO.includes(metodoPago)) erroresPago.metodo = true;
  if (!direccionValida(direccion)) erroresPago.direccion = true;
  if (Object.keys(erroresPago).length > 0) {
    return error(400, "DATOS_PAGO_INVALIDOS", MENSAJE_ERROR_PAGO, erroresPago);
  }

  // --- Cupón (opcional) --------------------------------------------------
  const codigoCupon = texto(datos.codigoCupon);
  let cupon = null;
  if (codigoCupon !== "") {
    cupon = buscarCupon(codigoCupon);
    if (!cupon) {
      return error(400, "CUPON_INVALIDO", MENSAJE_CUPON_INVALIDO, { cupon: true });
    }
  }

  // --- Identificador de la solicitud (opcional, evita compras repetidas) ---
  let idSolicitud = null;
  if (datos.idSolicitud !== undefined && datos.idSolicitud !== null && datos.idSolicitud !== "") {
    idSolicitud = texto(datos.idSolicitud);
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(idSolicitud)) {
      return error(400, "SOLICITUD_INVALIDA", "El identificador de la solicitud no es válido");
    }
  }

  // --- Datos del comprador invitado (opcionales) -------------------------
  const comprador = validarComprador(datos.comprador);
  if (comprador.error) return comprador;

  return {
    valores: {
      // Siempre en el mismo orden (por id): así dos compras simultáneas bloquean
      // los productos en el mismo orden y no se pueden bloquear entre sí.
      articulos: [...cantidades]
        .map(([productoId, cantidad]) => ({ productoId, cantidad }))
        .sort((a, b) => a.productoId - b.productoId),
      metodoPago,
      direccion,
      cupon,
      idSolicitud,
      comprador: comprador.valores,
    },
  };
}

// El invitado puede (no es obligatorio) dejar sus datos para el comprobante.
// Para un usuario con sesión estos datos se ignoran: se usan los de su cuenta.
function validarComprador(comprador) {
  const vacio = { valores: null };
  if (comprador === undefined || comprador === null) return vacio;
  if (typeof comprador !== "object" || Array.isArray(comprador)) {
    return error(400, "COMPRADOR_INVALIDO", MENSAJE_ERROR_PAGO, { comprador: true });
  }

  const valores = {
    nombre: texto(comprador.nombre),
    identificacion: texto(comprador.identificacion),
    telefono: texto(comprador.telefono),
    correo: texto(comprador.correo).toLowerCase(),
  };
  // Mismos formatos y tamaños que las cuentas (rutas/autenticacion.js)
  const invalido =
    valores.nombre.length > 100 ||
    valores.identificacion.length > 30 ||
    (valores.telefono !== "" && !/^\+?[\d ]{7,20}$/.test(valores.telefono)) ||
    valores.correo.length > 150 ||
    (valores.correo !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valores.correo));
  if (invalido) {
    return error(400, "COMPRADOR_INVALIDO", MENSAJE_ERROR_PAGO, { comprador: true });
  }

  const sinDatos = Object.values(valores).every((valor) => valor === "");
  return sinDatos ? vacio : { valores };
}

/**
 * Calcula el dinero de la compra con los precios REALES de la base de datos.
 * Todo son pesos enteros (producto.precio es NUMBER(12) sin centavos).
 *
 * Redondeo del descuento: al peso más cercano y la mitad hacia arriba
 * (igual que Math.round del frontend), hecho con enteros para no depender de decimales:
 *   subtotal 364.990, 5 %  ->  18.249,5  ->  18.250
 * El total SIEMPRE es subtotal - descuento, así los tres valores guardados cuadran.
 *
 * @param {Array<{ precio: number, cantidad: number }>} lineas
 * @param {{ porcentaje: number } | null} cupon
 */
export function calcularTotales(lineas, cupon) {
  const detalles = lineas.map((linea) => ({
    ...linea,
    subtotal: linea.precio * linea.cantidad,
  }));
  const subtotal = detalles.reduce((suma, linea) => suma + linea.subtotal, 0);
  const porcentaje = cupon?.porcentaje ?? 0;
  const descuento = Math.floor((subtotal * porcentaje + 50) / 100);
  return {
    detalles,
    totalProductos: detalles.reduce((suma, linea) => suma + linea.cantidad, 0),
    subtotal,
    porcentajeDescuento: porcentaje,
    descuento,
    total: subtotal - descuento,
  };
}
