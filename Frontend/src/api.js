// Comunicación con el backend (carpeta backend/ del proyecto).
// La dirección se puede cambiar con la variable VITE_API_URL en un archivo .env del frontend.
import { cerrarSesion, obtenerToken } from "./sesion";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const RUTA_PRODUCTOS = `${API_URL}/api/productos`;
const RUTA_AUTENTICACION = `${API_URL}/api/autenticacion`;

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

function opcionesConSesion(opciones) {
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

async function pedir(ruta, opciones) {
  try {
    const { opciones: opcionesAutenticadas, envioToken } = opcionesConSesion(opciones);
    const respuesta = await fetch(`${RUTA_PRODUCTOS}${ruta}`, opcionesAutenticadas);
    if (envioToken && respuesta.status === 401) cerrarSesion();
    const cuerpo = await respuesta.json().catch(() => ({}));
    return {
      ...cuerpo,
      ok: respuesta.ok,
      producto: normalizarProducto(cuerpo.producto),
      productos: cuerpo.productos?.map(normalizarProducto),
    };
  } catch {
    return { ok: false, mensaje: "No se pudo conectar con el servidor" };
  }
}

async function pedirAutenticacion(ruta, opciones) {
  try {
    const { opciones: opcionesAutenticadas, envioToken } = opcionesConSesion(opciones);
    const respuesta = await fetch(`${RUTA_AUTENTICACION}${ruta}`, opcionesAutenticadas);
    if (envioToken && respuesta.status === 401) cerrarSesion();
    const cuerpo = await respuesta.json().catch(() => ({}));
    return { ...cuerpo, ok: respuesta.ok, estado: respuesta.status };
  } catch {
    return { ok: false, mensaje: "No se pudo conectar con el servidor" };
  }
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
export const listarProductos = () => pedir("?estado=todos");

export const iniciarSesion = (identificador, password) =>
  pedirAutenticacion("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identificador, password }),
  });

export const registrarCuenta = (campos) =>
  pedirAutenticacion("/registro", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(campos),
  });

export const actualizarCuenta = (id, campos) =>
  pedirAutenticacion(`/cuenta/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(campos),
  });

export const desactivarCuenta = (id) =>
  pedirAutenticacion(`/cuenta/${id}/desactivar`, { method: "PATCH" });

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
