import { useEffect, useState } from "react";
import {
  PRODUCTO_VACIO,
  limpiarPrecio,
  limpiarRef,
  validarProducto,
} from "../utilidades/producto";

// Tiempo que se muestra cada mensaje antes de cerrarse solo
const DURACION_MENSAJE = { exito: 3000, error: 5000, "error-servidor": 5000 };

// Toda la lógica de la HE1-HU1 - Registrar producto.
// Recibe de App.jsx la función agregarProducto y la lista de productos
// (para no repetir referencias). La pantalla solo se encarga de mostrar.
export default function useRegistrarProducto({ agregarProducto, productos = [] }) {
  const [form, setForm] = useState(PRODUCTO_VACIO);
  const [imagen, setImagen] = useState(null); // { url, archivo }
  const [errores, setErrores] = useState({});
  const [estado, setEstado] = useState(null); // null | "exito" | "error" | "error-servidor"

  // Los mensajes se cierran solos después de un tiempo
  useEffect(() => {
    if (!estado) return;
    const t = setTimeout(() => setEstado(null), DURACION_MENSAJE[estado]);
    return () => clearTimeout(t);
  }, [estado]);

  const cerrarMensaje = () => setEstado(null);

  const cambiarImagen = (url, archivo) => {
    if (imagen) URL.revokeObjectURL(imagen.url); // libera la foto anterior
    setImagen({ url, archivo });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let valor = value;
    if (name === "precio") valor = limpiarPrecio(value);
    if (name === "ref") valor = limpiarRef(value);
    setForm((prev) => ({ ...prev, [name]: valor }));

    if (errores[name]) {
      setErrores((prev) => {
        const resto = { ...prev };
        delete resto[name];
        return resto;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nuevosErrores = validarProducto(form, productos);
    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      setEstado("error");
      return;
    }

    try {
      // Mismo formato que los productos de datos/productos.js.
      // Cuando exista el backend en C#, aquí se cambia por la llamada a la API.
      await agregarProducto({
        ref: form.ref,
        nombre: form.nombre.trim(),
        precio: Number(form.precio),
        categoria: form.categoria,
        stock: Number(form.stock),
        descripcion: form.descripcion.trim(),
        imagen: imagen?.url ?? "",
        estado: "Activo",
      });
      setForm(PRODUCTO_VACIO);
      setImagen(null); // la URL no se libera: el catálogo sigue mostrando la foto
      setEstado("exito");
    } catch (err) {
      console.error(err);
      setEstado("error-servidor");
    }
  };

  return {
    form,
    imagen,
    errores,
    estado,
    cambiarImagen,
    handleChange,
    handleSubmit,
    cerrarMensaje,
  };
}
