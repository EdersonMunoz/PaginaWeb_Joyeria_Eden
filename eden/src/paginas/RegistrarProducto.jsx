import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Encabezado from "../componentes/Encabezado";
import FormularioProducto from "../componentes/FormularioProducto";
import PanelDerechoProducto from "../componentes/PanelDerechoProducto";
import "./EditarProducto.css";
import iconoChulito from "../assets/iconoChulito.png";
import iconoGuardado from "../assets/iconoGuardado.png";

const productoInicial = {
  nombre: "",
  precio: "",
  categoria: "",
  stock: "",
  descripcion: "",
  ref: "",
};

function RegistrarProducto({ agregarProducto }) {
  const [producto, setProducto] = useState(productoInicial);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [errores, setErrores] = useState({});
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mostrarModalError, setMostrarModalError] = useState(false);

  useEffect(() => {
    if (!mostrarModalExito && !mostrarModalError) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setMostrarModalExito(false);
      setMostrarModalError(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [mostrarModalExito, mostrarModalError]);

  const esCampoInvalido = (nombre, valor) => {
    const valorTexto = valor ? String(valor).trim() : "";

    if (["nombre", "categoria", "descripcion", "ref"].includes(nombre)) {
      return valorTexto === "";
    }

    if (nombre === "precio") {
      const precio = Number(valorTexto);
      return valorTexto === "" || !Number.isFinite(precio) || precio <= 0;
    }

    if (nombre === "stock") {
      const stock = Number(valorTexto);
      return valorTexto === "" || !Number.isInteger(stock) || stock < 0;
    }

    return false;
  };

  const manejarCambioInput = (event) => {
    const { name, value } = event.target;
    setProducto((actual) => ({ ...actual, [name]: value }));
    setErrores((actuales) => ({
      ...actuales,
      [name]: esCampoInvalido(name, value),
    }));
  };

  const manejarCambioImagen = (imagen) => {
    setImagenPreview(imagen);
    setErrores((actuales) => ({ ...actuales, imagen: false }));
  };

  const manejarGuardar = (event) => {
    event.preventDefault();
    const nuevosErrores = Object.fromEntries(
      Object.entries(producto).map(([nombre, valor]) => [
        nombre,
        esCampoInvalido(nombre, valor),
      ]),
    );
    nuevosErrores.imagen = !imagenPreview;

    setErrores(nuevosErrores);
    if (Object.values(nuevosErrores).some(Boolean)) {
      setMostrarModalError(true);
      return;
    }

    agregarProducto({
      ...producto,
      precio: Number(producto.precio),
      stock: Number(producto.stock),
      imagen: imagenPreview || "",
      estado: "Activo",
    });
    setProducto(productoInicial);
    setImagenPreview(null);
    setErrores({});
    setMostrarModalError(false);
    setMostrarModalExito(true);
  };

  return (
    <div className="pagina-editar pagina-registrar">
      <Encabezado
        administrador
        ocultarTendencias
      />

      <p className="miga-pan">
        <Link to="/Admin">Inicio</Link>
        <span aria-hidden="true"> \ </span>
        Registrar_Producto
      </p>

      <div className="contenido">
        <FormularioProducto
          titulo="REGISTRAR PRODUCTO"
          textoBoton="Registrar producto"
          iconoBoton={iconoChulito}
          producto={producto}
          errores={errores}
          onChange={manejarCambioInput}
          onSubmit={manejarGuardar}
        />

        <PanelDerechoProducto
          imagenPreview={imagenPreview}
          onCambiarImagen={manejarCambioImagen}
          imagenError={errores.imagen}
          refValor={producto.ref}
          refError={errores.ref}
          onChangeInput={manejarCambioInput}
        />
      </div>

      {mostrarModalExito && (
        <div className="overlay-modal">
          <div className="modal-contenido modal-exito" role="status">
            <img
              className="icono-modal-exito"
              src={iconoGuardado}
              alt=""
              aria-hidden="true"
            />
            <span>¡Producto Registrado Exitosamente!</span>
          </div>
        </div>
      )}

      {mostrarModalError && (
        <div className="overlay-modal">
          <div className="modal-contenido modal-error" role="alert">
            <svg
              className="icono-modal-error"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d93025"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <div className="texto-modal-error">
              <p>Error al registrar producto. Por favor</p>
              <p>completa todos los campos obligatorios</p>
              <p>y/o corrige los valores numéricos</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegistrarProducto;