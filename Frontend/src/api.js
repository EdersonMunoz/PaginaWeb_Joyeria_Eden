// Comunicación con el backend (carpeta backend/ del proyecto).
// La dirección se puede cambiar con la variable VITE_API_URL en un archivo .env del frontend.
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const RUTA_PRODUCTOS = `${API_URL}/api/productos`;

// Las fotos que sube el admin viven en el backend; las de prueba, en public/productos del frontend
const normalizarProducto = (producto) =>
  producto && {
    ...producto,
    imagen: producto.imagen?.startsWith("/fotos/")
      ? `${API_URL}${producto.imagen}`
      : producto.imagen,
  };

async function pedir(ruta, opciones) {
  try {
    const respuesta = await fetch(`${RUTA_PRODUCTOS}${ruta}`, opciones);
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
