// Sprint 4 · HE4-HU1: contacto con un asesor por WhatsApp.
// Lógica pura (sin React) para poder probarla con `npm test`.

// Pantallas del cliente donde el Figma (sprint4) muestra el botón de WhatsApp:
// inicio, catálogo (incluye búsqueda y detalle de producto) y carrito (incluye el comprobante).
// Ajustes de cuenta y las pantallas del administrador no lo llevan.
const RUTAS_CON_BOTON = ["/usuario", "/usuario/catalogo", "/usuario/carrito"];

export function rutaConBotonWhatsApp(ruta) {
  const limpia = String(ruta ?? "").toLowerCase().replace(/\/+$/, "");
  return RUTAS_CON_BOTON.includes(limpia);
}

// Devuelve el enlace de wa.me o "" si el número configurado no tiene dígitos.
// wa.me abre WhatsApp Web (computador) o la app (celular) con el chat del asesor.
// El número va con código de país y solo dígitos; se aceptan "+", espacios y guiones.
export function construirEnlaceWhatsApp(numero, mensaje = "") {
  const digitos = String(numero ?? "").replace(/\D/g, "");
  if (!digitos) return "";

  const texto = String(mensaje ?? "").trim();
  return texto
    ? `https://wa.me/${digitos}?text=${encodeURIComponent(texto)}`
    : `https://wa.me/${digitos}`;
}
