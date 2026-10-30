// Reglas de los campos del producto (HU1 y HU2).
// Son las mismas que valida el frontend; el backend las repite
// para que nadie pueda guardar datos inválidos saltándose la página.

export const CATEGORIAS = [
  "Perfumería",
  "Aretes",
  "Pulsos",
  "Anillos",
  "Cadenas",
  "Brazalete",
];

// Máximos que caben en las columnas de Oracle: precio NUMBER(12) y stock NUMBER(8)
const PRECIO_MAXIMO = 999999999999;
const STOCK_MAXIMO = 99999999;

const texto = (valor) => (valor === undefined || valor === null ? "" : String(valor).trim());

// "$1.500.000" -> 1500000
// Expresión regular:
// 1) Opcional signo '$' al inicio
// 2) O solo dígitos (\d+)
// 3) O grupos de 1 a 3 dígitos seguidos estrictamente de puntos cada 3 dígitos (\d{1,3}(\.\d{3})+)
const FORMATO_PRECIO = /^\$?\s*(\d+|\d{1,3}(\.\d{3})+)$/;

export function limpiarPrecio(valor) {
  const t = texto(valor);

  // Si tiene centavos (1500.50) o puntos mal puestos (1.5.0.0), es inválido
  if (!FORMATO_PRECIO.test(t)) {
    return NaN;
  }

  return Number(t.replace(/[$.\s]/g, ""));
}

/**
 * Valida los datos de un producto.
 * @param {object} datos   campos que llegan del formulario
 * @param {object} opciones
 *   esRegistro: true en HU1 (stock debe ser mayor que 0 y la foto es obligatoria)
 *   tieneFoto:  si llegó una foto en la petición
 * @returns {{ errores: object, valores: object }}
 *   errores trae { campo: true } por cada campo inválido (vacío si todo está bien)
 */
export function validarProducto(datos, { esRegistro, tieneFoto }) {
  const errores = {};

  const nombre = texto(datos.nombre);
  if (nombre === "" || nombre.length > 120) errores.nombre = true;

  const precioTexto = texto(datos.precio);
  const precio = limpiarPrecio(precioTexto);
  if (
    precioTexto === "" ||
    precioTexto.includes("-") ||
    /e/i.test(precioTexto) ||
    !Number.isInteger(precio) ||
    precio <= 0 ||
    precio > PRECIO_MAXIMO
  ) {
    errores.precio = true;
  }

  const categoria = texto(datos.categoria);
  if (!CATEGORIAS.includes(categoria)) errores.categoria = true;

    const stockTexto = texto(datos.stock);
  const stock = Number(stockTexto);
  const stockMinimo = esRegistro ? 1 : 0;
  if (
    stockTexto === "" ||
    !/^\d+$/.test(stockTexto) ||   // <-- Rechaza 0x10, 2.5, abc, negativos
    stock < stockMinimo ||
    stock > STOCK_MAXIMO
  ) {
    errores.stock = true;
  }

  const descripcion = texto(datos.descripcion);
  if (descripcion === "" || descripcion.length > 1000) errores.descripcion = true;

  if (esRegistro) {
    const ref = texto(datos.ref);
    if (ref === "" || ref.length > 20) errores.ref = true;
    if (!tieneFoto) errores.imagen = true;
  }

  return {
    errores,
    valores: {
      nombre,
      precio,
      categoria,
      stock,
      descripcion,
      ref: texto(datos.ref),
    },
  };
}

export const hayErrores = (errores) => Object.keys(errores).length > 0;