// Lógica del carrito de compras (Sprint 3 · HE3-HU1 y HE3-HU2).
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

// HU1 escenarios 1, 2 y 5: suma `cantidad` sin pasar del stock.
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

// HU1 escenarios 3 y 5: cambia la cantidad entre 1 y el stock
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

// HU1 escenario 4
export const eliminarDelCarrito = (carrito, productoId) =>
  carrito.filter((item) => item.producto.id !== productoId);

// HU2 escenarios 1 y 2: lo que muestra "Resumen de compra".
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

// HU2 escenario 3: aplica al catálogo el inventario que devolvió el backend tras la compra
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
