import { useEffect, useState } from "react";
import {
  PRODUCTO_VACIO,
  limpiarPrecio,
  limpiarRef,
  validarProducto,
} from "../utilidades/producto";
import useImagenesProducto from "./useImagenesProducto";

// Tiempo que se muestra cada mensaje antes de cerrarse solo
const DURACION_MENSAJE = { exito: 3000, error: 5000, "error-servidor": 5000 };

// Toda la lógica de la HU1 - Registrar producto.
// Recibe de App.jsx la función agregarProducto y la lista de productos
// (para no repetir referencias). La pantalla solo se encarga de mostrar.
export default function useRegistrarProducto({ agregarProducto, productos = [] }) {
  const [form, setForm] = useState(PRODUCTO_VACIO);
  const [errores, setErrores] = useState({});
  const [estado, setEstado] = useState(null); // null | "exito" | "error" | "error-servidor"
  const [enviando, setEnviando] = useState(false);
  const galeria = useImagenesProducto();

  // Los mensajes se cierran solos después de un tiempo
  useEffect(() => {
    if (!estado) return;
    const t = setTimeout(() => setEstado(null), DURACION_MENSAJE[estado]);
    return () => clearTimeout(t);
  }, [estado]);

  const cerrarMensaje = () => setEstado(null);

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

    const urls = galeria.imagenes.map((i) => i.url);

    try {
      setEnviando(true);
      // Mismo formato que los productos de datos/productos.js.
      // Cuando exista el backend en C#, aquí se cambia por la llamada a la API.
      await agregarProducto({
        ref: form.ref,
        nombre: form.nombre.trim(),
        precio: Number(form.precio),
        categoria: form.categoria,
        stock: Number(form.stock),
        descripcion: form.descripcion.trim(),
        imagen: urls[0] ?? "",
        imagenes: urls,
        estado: "Activo",
      });
      setForm(PRODUCTO_VACIO);
      galeria.limpiarImagenes({ liberar: false });
      setEstado("exito");
    } catch (err) {
      console.error(err);
      setEstado("error-servidor");
    } finally {
      setEnviando(false);
    }
  };

  return {
    form,
    errores,
    estado,
    enviando,
    galeria,
    handleChange,
    handleSubmit,
    cerrarMensaje,
  };
}
