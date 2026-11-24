// Sprint 4 · HE4-HU2: historial de pedidos.
// Lógica pura (sin React) para poder probarla con `npm test`.

export const RUTA_HISTORIAL = "/Usuario/Historial_Pedidos";
export const RUTA_HISTORIAL_DESDE_CATALOGO = "/Usuario/Catalogo/Historial_Pedidos";

// ¿Se llegó al historial desde el catálogo? (Path: \Usuario\Catalogo\Historial_Pedidos)
export const historialDesdeCatalogo = (ruta) =>
  String(ruta ?? "").toLowerCase().startsWith("/usuario/catalogo");

// Enlace del menú: desde el catálogo se mantiene ese camino; desde el resto, el del inicio.
export const rutaHistorialDesde = (rutaActual) =>
  historialDesdeCatalogo(rutaActual) ? RUTA_HISTORIAL_DESDE_CATALOGO : RUTA_HISTORIAL;

// Migas de pan del Figma: Inicio\Catalogo\Historial Pedidos (o solo Inicio\Historial Pedidos)
export function migaHistorial(rutaActual) {
  const niveles = [{ nombre: "Inicio", ruta: "/Usuario" }];
  if (historialDesdeCatalogo(rutaActual)) {
    niveles.push({ nombre: "Catálogo", ruta: "/Usuario/Catalogo" });
  }
  return [...niveles, { nombre: "Historial de pedidos", ruta: rutaHistorialDesde(rutaActual) }];
}

// Fecha del listado en el formato del Figma: dd-MM-yyyy (hora de Colombia, no la del servidor).
export function formatearFechaPedido(fecha) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return "";

  const partes = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(valor);
  const dato = (tipo) => partes.find((parte) => parte.type === tipo)?.value ?? "";
  return `${dato("day")}-${dato("month")}-${dato("year")}`;
}

// Sprint 4 · HE4-HU3: texto cuando no se puede abrir el detalle de un pedido.
export function mensajeErrorDetalle(respuesta) {
  if (respuesta?.estado === 404) return "No se encontró el pedido.";
  return respuesta?.mensaje || "No se pudo cargar el detalle del pedido. Intenta nuevamente.";
}
