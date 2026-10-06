// Reglas y formatos del producto.
// Se comparten entre Registrar producto (HU1) y Modificar producto (HU2).

// Las mismas categorías que usan los productos de datos/productos.js
export const CATEGORIAS = ["Anillos", "Aretes", "Brazaletes", "Cadenas", "Perfumería"];

export const PRODUCTO_VACIO = {
  nombre: "",
  precio: "", // solo dígitos y el signo menos, ej. "500000"
  categoria: "",
  stock: "",
  descripcion: "",
  ref: "",
};

// Referencia: 3 letras y 5 números, como en datos/productos.js (ej. ANI00001)
export const FORMATO_REF = /^[A-Z]{3}\d{5}$/;

// Pasa a mayúsculas, quita espacios y símbolos, y corta en 8 caracteres
export const limpiarRef = (texto) =>
  texto.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);

// Deja solo dígitos y, si el usuario lo escribió, el signo menos.
// Se permite el "-" para que el escenario de valor negativo se pueda probar.
export const limpiarPrecio = (texto) => {
  const digitos = texto.replace(/\D/g, "");
  return texto.includes("-") ? "-" + digitos : digitos;
};

// "500000" -> "$500.000"   |   "-500000" -> "$-500.000"
export const formatearPrecio = (valor) => {
  if (!valor) return "";
  const negativo = String(valor).startsWith("-");
  const digitos = String(valor).replace("-", "");
  return (
    "$" + (negativo ? "-" : "") + (digitos ? Number(digitos).toLocaleString("es-CO") : "")
  );
};

// Devuelve un objeto con los campos que tienen error, ej. { precio: true }.
// Si está vacío, el producto es válido.
// productosExistentes sirve para no repetir una referencia que ya existe.
export function validarProducto(producto, productosExistentes = []) {
  const errores = {};
  if (!producto.nombre.trim()) errores.nombre = true;
  if (!(Number(producto.precio) > 0)) errores.precio = true; // vacío, cero, negativo o "-"
  if (!producto.categoria) errores.categoria = true;
  const stock = Number(producto.stock);
  if (producto.stock === "" || !Number.isInteger(stock) || stock <= 0) errores.stock = true;
  if (!producto.descripcion.trim()) errores.descripcion = true;

  const ref = producto.ref.trim();
  const refRepetida = productosExistentes.some((p) => p.ref === ref);
  if (!FORMATO_REF.test(ref) || refRepetida) errores.ref = true;

  return errores;
}
