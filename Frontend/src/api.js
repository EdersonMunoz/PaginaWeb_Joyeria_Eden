// Comunicación con el backend (carpeta backend/ del proyecto).
// La dirección se puede cambiar con la variable VITE_API_URL en un archivo .env del frontend.
import { cerrarSesion, obtenerToken } from "./sesion";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const RUTA_PRODUCTOS = `${API_URL}/api/productos`;
const RUTA_AUTENTICACION = `${API_URL}/api/autenticacion`;
const RUTA_PEDIDOS = `${API_URL}/api/pedidos`;

// Las fotos de los productos están en el bucket de Oracle Cloud: el backend ya manda
// la dirección completa (https://objectstorage...). Se deja el caso "/fotos/" por si
// alguien usa una base vieja.
const normalizarProducto = (producto) =>
  producto && {
    ...producto,
    imagen: producto.imagen?.startsWith("/fotos/")
      ? `${API_URL}${producto.imagen}`
      : producto.imagen,
  };

function opcionesConSesion(opciones, incluirSesion = true) {
  if (!incluirSesion) return { opciones, envioToken: false };

  const token = obtenerToken();
  if (!token) return { opciones, envioToken: false };

  return {
    opciones: {
      ...opciones,
      headers: {
        ...opciones.headers,
        Authorization: `Bearer ${token}`,
      },
    },
    envioToken: true,
  };
}

function esAutenticacionRechazada(respuesta) {
  return respuesta.status === 401 || respuesta.status === 403;
}

function cerrarSesionYRedirigir() {
  cerrarSesion();
  if (typeof window !== "undefined" && window.location.pathname !== "/InicioSesion") {
    window.location.assign("/InicioSesion");
  }
}

async function leerRespuesta(respuesta) {
  const cuerpo = await respuesta.json().catch(() => ({}));

  return {
    ...cuerpo,
    ok: respuesta.ok,
    estado: respuesta.status,
    mensaje: respuesta.ok
      ? cuerpo.mensaje
      : cuerpo.mensaje ??
        cuerpo.error ??
        `Error ${respuesta.status}: ${respuesta.statusText || "respuesta del servidor"}`,
  };
}

async function realizarPeticion(url, opciones, { publica = false, sinSesion = false } = {}) {
  const { opciones: opcionesAutenticadas, envioToken } = opcionesConSesion(
    opciones,
    !sinSesion,
  );
  let respuesta;
  try {
    respuesta = await fetch(url, opcionesAutenticadas);
  } catch {
    return { ok: false, mensaje: "No se pudo conectar con el servidor" };
  }

  if (publica && envioToken && esAutenticacionRechazada(respuesta)) {
    cerrarSesion();
    try {
      respuesta = await fetch(url, opciones);
    } catch {
      return { ok: false, mensaje: "No se pudo conectar con el servidor" };
    }
  } else if (!publica && esAutenticacionRechazada(respuesta)) {
    cerrarSesionYRedirigir();
  }

  return leerRespuesta(respuesta);
}

async function pedir(ruta, opciones = {}, { publica = false } = {}) {
  const respuesta = await realizarPeticion(
    `${RUTA_PRODUCTOS}${ruta}`,
    opciones,
    { publica },
  );
  return {
    ...respuesta,
    producto: normalizarProducto(respuesta.producto),
    productos: respuesta.productos?.map(normalizarProducto),
  };
}

async function pedirAutenticacion(ruta, opciones = {}, { publica = false } = {}) {
  return realizarPeticion(`${RUTA_AUTENTICACION}${ruta}`, opciones, {
    publica,
    sinSesion: publica,
  });
}

const formularioProducto = (campos, archivo) => {
  const datos = new FormData();
  ["ref", "nombre", "precio", "categoria", "stock", "descripcion"].forEach((campo) => {
    if (campos[campo] !== undefined) datos.append(campo, campos[campo]);
  });
  if (archivo) datos.append("foto", archivo);
  return datos;
};

// HU3 · todos los productos (el catálogo del cliente filtra los inactivos)
export const listarProductos = () =>
  pedir("?estado=todos", {}, { publica: true });

export const iniciarSesion = (identificador, password) =>
  pedirAutenticacion("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identificador, password }),
  }, { publica: true });

export const registrarCuenta = (campos) =>
  pedirAutenticacion("/registro", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(campos),
  }, { publica: true });

export const actualizarCuenta = (id, campos) =>
  pedirAutenticacion(`/cuenta/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(campos),
  });

export const desactivarCuenta = (id) =>
  pedirAutenticacion(`/cuenta/${id}/desactivar`, { method: "PATCH" });

// ---------------------------------------------------------------
// Sprint 3 · carrito, compra y comprobante (/api/pedidos)
// ---------------------------------------------------------------
const JSON_POST = (cuerpo) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(cuerpo),
});

// HE3-HU5 · el backend valida el cupón y devuelve su porcentaje: { cupon: { codigo, porcentaje } }
export const validarCupon = (codigo) =>
  realizarPeticion(`${RUTA_PEDIDOS}/cupon`, JSON_POST({ codigo }));

// HE3-HU6 · procesa la compra (pago simulado) y devuelve el comprobante guardado en Oracle.
// compra = { articulos: [{ productoId, cantidad }], metodoPago, direccion, codigoCupon, idSolicitud }
// Requiere sesión iniciada; el pedido queda a nombre de la cuenta.
export const procesarCompra = (compra) =>
  realizarPeticion(RUTA_PEDIDOS, JSON_POST(compra));

// HE3-HU6 (comprobante de la compra) · vuelve a consultar el comprobante de la cuenta autenticada.
export const consultarComprobante = (numeroPedido) =>
  realizarPeticion(`${RUTA_PEDIDOS}/${encodeURIComponent(numeroPedido)}`, {});

// Sprint 4 · HE4-HU2 · historial de pedidos de la cuenta que inició sesión.
// Devuelve { pedidos: [{ numeroPedido, totalProductos, fecha }] } del más reciente al más antiguo.
export const listarPedidos = () => realizarPeticion(RUTA_PEDIDOS, {});

// HU1 · registrar
export const registrarProducto = (campos, archivo) =>
  pedir("", { method: "POST", body: formularioProducto(campos, archivo) });

// HU2 · modificar (la foto es opcional)
export const modificarProducto = (id, campos, archivo) =>
  pedir(`/${id}`, { method: "PUT", body: formularioProducto(campos, archivo) });

// HU4 · inactivar / activar
export const cambiarEstadoProducto = (id, estado) =>
  pedir(`/${id}/estado`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado }),
  });
