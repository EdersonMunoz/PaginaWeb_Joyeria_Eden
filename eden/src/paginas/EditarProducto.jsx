import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Encabezado from "../componentes/Encabezado";
import FormularioProducto from "../componentes/FormularioProducto";
import PanelDerechoProducto from "../componentes/PanelDerechoProducto";
import "./EditarProducto.css";

function EditarProducto({ productos, editarProducto }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const productoExistente = productos.find((p) => String(p.id) === id);

  const [producto, setProducto] = useState(() => ({
    nombre: productoExistente?.nombre || "",
    precio: productoExistente?.precio ? String(productoExistente.precio) : "",
    categoria: productoExistente?.categoria || "Brazalete",
    stock: productoExistente?.stock ? String(productoExistente.stock) : "",
    descripcion: productoExistente?.descripcion || "",
    ref: productoExistente?.ref || "",
  }));

  const [errores, setErrores] = useState({});
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [imagenPreview, setImagenPreview] = useState(productoExistente?.imagen || null);

  // Cierre automático de modales tras 3 segundos
  useEffect(() => {
    if (mostrarModalExito) {
      const timer = setTimeout(() => setMostrarModalExito(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [mostrarModalExito]);

  useEffect(() => {
    if (mostrarModalError) {
      const timer = setTimeout(() => setMostrarModalError(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [mostrarModalError]);

  const esCampoInvalido = (name, value) => {
    const valStr = value ? value.toString().trim() : "";

    if (["nombre", "categoria", "descripcion", "ref"].includes(name)) {
      return valStr === "";
    }

    if (name === "precio") {
      if (valStr === "") return true;
      const tieneSignoNegativo = valStr.includes("-");
      const valorLimpio = valStr.replace(/[^0-9.-]+/g, "");
      const numero = Number(valorLimpio);
      return tieneSignoNegativo || isNaN(numero) || numero <= 0;
    }

    if (name === "stock") {
      if (valStr === "") return true;
      const tieneSignoNegativo = valStr.includes("-");
      const numero = Number(valStr);
      return tieneSignoNegativo || isNaN(numero) || numero < 0;
    }

    return false;
  };

  const manejarCambioInput = (e) => {
    const { name, value } = e.target;
    setProducto((prev) => ({ ...prev, [name]: value }));
    setErrores((prev) => ({ ...prev, [name]: esCampoInvalido(name, value) }));
  };

  const manejarGuardar = (e) => {
    e.preventDefault();

    const nuevosErrores = {
      nombre: esCampoInvalido("nombre", producto.nombre),
      precio: esCampoInvalido("precio", producto.precio),
      categoria: esCampoInvalido("categoria", producto.categoria),
      stock: esCampoInvalido("stock", producto.stock),
      descripcion: esCampoInvalido("descripcion", producto.descripcion),
      ref: esCampoInvalido("ref", producto.ref),
    };

    setErrores(nuevosErrores);

    if (Object.values(nuevosErrores).some(Boolean)) {
      setMostrarModalError(true);
    } else {
      editarProducto(Number(id), {
        ...producto,
        precio: Number(producto.precio),
        stock: Number(producto.stock),
        imagen: imagenPreview,
      });
      setMostrarModalExito(true);
    }
  };

  useEffect(() => {
    if (!mostrarModalExito) return undefined;

    const timer = setTimeout(() => navigate("/catalogo"), 1500);
    return () => clearTimeout(timer);
  }, [mostrarModalExito, navigate]);

  return (
    <div className="pagina-editar">
      <Encabezado />

      <p className="miga-pan">Inicio \ Editar_Producto</p>

      <div className="contenido">
        {/* COMPONENTE 1: FORMULARIO */}
        <FormularioProducto
          titulo="Editar producto"
          textoBoton="Guardar cambios"
          producto={producto}
          errores={errores}
          onChange={manejarCambioInput}
          onSubmit={manejarGuardar}
        />

        {/* COMPONENTE 2: PANEL DE FOTO Y REF */}
        <PanelDerechoProducto
          imagenPreview={imagenPreview}
          onCambiarImagen={(url) => setImagenPreview(url)}
          refValor={producto.ref}
          refError={errores.ref}
          onChangeInput={manejarCambioInput}
        />
      </div>

      {/* ALERTAS TEMPORIZADAS */}
      {mostrarModalExito && (
        <div className="overlay-modal">
          <div className="modal-contenido modal-exito">
            <svg
              className="icono-modal-exito"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1b4d3e"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span>¡Producto actualizado correctamente!</span>
          </div>
        </div>
      )}

      {mostrarModalError && (
        <div className="overlay-modal">
          <div className="modal-contenido modal-error">
            <svg
              className="icono-modal-error"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d93025"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <div className="texto-modal-error">
              <p>Error al actualizar producto. Por favor</p>
              <p>completa todos los campos obligatorios</p>
              <p>y/o corrige los valores numéricos</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditarProducto;