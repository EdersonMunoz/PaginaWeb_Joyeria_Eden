// Lógica del carrito y compra (Sprint 3 · HE3-HU1 a HE3-HU6).
// Son funciones puras (sin React ni navegador) para poder probarlas con `npm test`.
// El carrito sigue viviendo en memoria en App.jsx: [{ producto, cantidad }].
// Los valores oficiales (precios, descuento, total) los calcula el backend al pagar;
// aquí solo se calcula lo que se muestra mientras el cliente arma el carrito.

const enteroPositivo = (valor) => Math.max(1, Math.floor(Number(valor) || 1));

// Unidades disponibles de un producto (Infinity si el stock no es un número)
export function stockDisponible(producto) {
  const stock = Number(producto?.stock);
  return Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : Number.POSITIVE_INFINITY;
}

export const cantidadEnCarrito = (carrito, productoId) =>
  carrito.find((item) => item.producto.id === productoId)?.cantidad ?? 0;

export const stockRestante = (producto, carrito) =>
  Math.max(0, stockDisponible(producto) - cantidadEnCarrito(carrito, producto.id));

export function migaCarrito(origen) {
  const niveles = [{ nombre: "Inicio", ruta: "/Usuario" }];

  if (origen === "catalogo") {
    niveles.push({ nombre: "Catálogo", ruta: "/Usuario/Catalogo" });
  }

  return [...niveles, { nombre: "Carrito", ruta: "/Usuario/Carrito" }];
}

export function direccionValida(direccion) {
  if (typeof direccion !== "string") return false;
  const normalizada = direccion.trim();
  return (
    normalizada.length >= 5 &&
    normalizada.length <= 300 &&
    !/^(?:calle|carrera|cra\.?|avenida|av\.?)\s*0(?:\s|#|$)/i.test(normalizada) &&
    /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(normalizada) &&
    /\d/.test(normalizada)
  );
}

// HE3-HU2 escenarios 1 y 2: suma `cantidad` sin pasar del stock.
// Devuelve el MISMO arreglo si no cambió nada (ya estaba en el máximo).
export function agregarAlCarrito(carrito, producto, cantidad = 1) {
  const existente = carrito.find((item) => item.producto.id === producto.id);
  const cantidadActual = existente?.cantidad ?? 0;
  const cantidadFinal = Math.min(stockDisponible(producto), cantidadActual + enteroPositivo(cantidad));

  if (cantidadFinal === cantidadActual) {
    return carrito;
  }

  if (existente) {
    return carrito.map((item) =>
      item.producto.id === producto.id ? { ...item, cantidad: cantidadFinal } : item,
    );
  }

  return [...carrito, { producto, cantidad: cantidadFinal }];
}

// HE3-HU3 escenarios 1 y 2: cambia la cantidad entre 1 y el stock
export function actualizarCantidad(carrito, productoId, cantidad) {
  return carrito.map((item) => {
    if (item.producto.id !== productoId) {
      return item;
    }

    return {
      ...item,
      cantidad: Math.min(Math.max(1, stockDisponible(item.producto)), enteroPositivo(cantidad)),
    };
  });
}

// HE3-HU4 escenario 1
export const eliminarDelCarrito = (carrito, productoId) =>
  carrito.filter((item) => item.producto.id !== productoId);

// Sprint 4 · HE4-HU4: "Volver a comprar" un pedido del historial.
// Agrega al carrito los productos del pedido que HOY tienen unidades suficientes
// (stock actual menos lo que ya hay en el carrito); los que no alcanzan, están inactivos
// o ya no existen no se agregan. Se usa el producto actual del catálogo (precio y stock de hoy),
// no la fotografía guardada en el pedido.
// `articulos` es la lista del detalle del pedido: [{ producto: { id }, cantidad }].
// Devuelve { carrito, agregados, omitidos }; si no se pudo agregar nada, el MISMO carrito.
export function recomprarPedido(carrito, articulos = [], productos = []) {
  const porId = new Map(productos.map((producto) => [producto.id, producto]));
  let resultado = carrito;
  const agregados = [];
  const omitidos = [];

  for (const { producto: enPedido, cantidad } of articulos) {
    const unidades = enteroPositivo(cantidad);
    const actual = porId.get(enPedido.id);
    const disponible =
      actual && actual.estado !== "Inactivo" ? stockRestante(actual, resultado) : 0;

    if (!actual || disponible < unidades) {
      omitidos.push(enPedido);
      continue;
    }

    resultado = agregarAlCarrito(resultado, actual, unidades);
    agregados.push(actual);
  }

  return { carrito: resultado, agregados, omitidos };
}

// "completa" si entró todo el pedido; "parcial" si algún producto quedó por fuera.
export const avisoRecompra = ({ omitidos }) => (omitidos.length === 0 ? "completa" : "parcial");

// Notificación que muestra el carrito al llegar desde "Volver a comprar" (null si no aplica).
export function notificacionRecompra(aviso) {
  if (aviso === "completa") {
    return { tipo: "agregado", mensaje: "Se agregó el producto al carrito" };
  }
  if (aviso === "parcial") {
    return {
      tipo: "agregado-parcial",
      mensaje: "Algunos productos no se agregaron por falta de disponibilidad",
    };
  }
  return null;
}

// HE3-HU6 escenario 1: lo que muestra "Resumen de compra".
// Mismo redondeo que el backend (validarCompra.js): al peso, la mitad hacia arriba.
export function calcularResumen(carrito, cupon = null) {
  const cantidadTotal = carrito.reduce((total, item) => total + Number(item.cantidad || 0), 0);
  const subtotal = carrito.reduce(
    (total, item) => total + Number(item.producto.precio || 0) * Number(item.cantidad || 0),
    0,
  );
  const descuento = cupon ? Math.round((subtotal * Number(cupon.porcentaje || 0)) / 100) : 0;
  return { cantidadTotal, subtotal, descuento, total: subtotal - descuento };
}

// Pone el carrito al día con el catálogo que acaba de llegar del backend (Oracle):
// actualiza precio y stock de cada producto, baja las cantidades que ya no alcanzan
// y retira los productos que ya no se pueden comprar (inactivos, sin unidades o borrados).
// Devuelve { carrito, ajustado }; si nada cambió devuelve el MISMO arreglo.
export function sincronizarCarrito(carrito, productos) {
  const porId = new Map(productos.map((producto) => [producto.id, producto]));
  let ajustado = false;
  let cambio = false;

  const actualizado = [];
  for (const item of carrito) {
    const producto = porId.get(item.producto.id);
    const disponible = producto && producto.estado !== "Inactivo" ? stockDisponible(producto) : 0;
    if (disponible <= 0) {
      ajustado = true;
      cambio = true;
      continue;
    }

    const cantidad = Math.min(item.cantidad, disponible);
    if (cantidad !== item.cantidad || Number(producto.precio) !== Number(item.producto.precio)) {
      ajustado = true;
    }
    if (cantidad !== item.cantidad || producto !== item.producto) {
      cambio = true;
      actualizado.push({ ...item, producto, cantidad });
    } else {
      actualizado.push(item);
    }
  }

  return { carrito: cambio ? actualizado : carrito, ajustado };
}

// HE3-HU6 escenario 2: aplica al catálogo el inventario que devolvió el backend tras la compra
// ([{ id, stock, estado }]). El stock ya no se calcula en el navegador.
export function aplicarInventario(productos, inventario = []) {
  const porId = new Map(inventario.map((fila) => [fila.id, fila]));
  return productos.map((producto) => {
    const fila = porId.get(producto.id);
    return fila ? { ...producto, stock: fila.stock, estado: fila.estado } : producto;
  });
}

// Lo ÚNICO del carrito que se envía al backend: qué producto y cuántas unidades.
// Precios y totales no se envían: el backend los toma de la base de datos.
export const articulosParaCompra = (carrito) =>
  carrito.map(({ producto, cantidad }) => ({ productoId: producto.id, cantidad }));

// Identificador de cada intento de pago: si la misma solicitud llega dos veces
// (doble clic, reintento por red lenta) el backend no crea dos pedidos.
export function crearIdSolicitud() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random()
    .toString(36)
    .slice(2, 12)}`;
}
