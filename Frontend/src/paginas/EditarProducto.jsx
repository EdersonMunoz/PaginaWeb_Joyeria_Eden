import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Encabezado from "../componentes/Encabezado";
import FormularioProducto from "../componentes/FormularioProducto";
import PanelDerechoProducto from "../componentes/PanelDerechoProducto";
import "./EditarProducto.css";
import "./PaginaProducto.css";

const productoVacio = {
  nombre: "",
  precio: "",
  categoria: "",
  stock: "",
  descripcion: "",
};

const obtenerCamposProducto = (producto) =>
  producto
    ? {
        nombre: producto.nombre,
        precio: String(producto.precio),
        categoria: producto.categoria,
        stock: String(producto.stock),
        descripcion: producto.descripcion,
      }
    : productoVacio;

function EditarProducto({ productos, editarProducto }) {
  const { id } = useParams();
  const productoInicial = id
    ? productos.find((item) => String(item.id) === id) || null
    : null;

  const [productoSeleccionado, setProductoSeleccionado] = useState(productoInicial);
  const [producto, setProducto] = useState(() => obtenerCamposProducto(productoInicial));
  const [referencia, setReferencia] = useState(productoInicial?.ref || "");
  const [referenciaNoEncontrada, setReferenciaNoEncontrada] = useState(false);

  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [camposTocados, setCamposTocados] = useState({});
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [imagenPreview, setImagenPreview] = useState(productoInicial?.imagen || null);
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [mensajeServidor, setMensajeServidor] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [productoInicialAnterior, setProductoInicialAnterior] = useState({
    id,
    productoInicial,
  });

  if (
    productoInicialAnterior.id !== id ||
    productoInicialAnterior.productoInicial !== productoInicial
  ) {
    setProductoInicialAnterior({ id, productoInicial });
    setProductoSeleccionado(productoInicial);
    setProducto(obtenerCamposProducto(productoInicial));
    setReferencia(productoInicial?.ref || "");
    setReferenciaNoEncontrada(false);
    setImagenPreview(productoInicial?.imagen || null);
    setArchivoImagen(null);
    setMostrarErrores(false);
    setCamposTocados({});
  }

  // Cierre automático de modales tras 3 segundos
  useEffect(() => {
    if (mostrarModalExito) {
      const timer = setTimeout(() => {
        setMostrarModalExito(false);
        setProductoSeleccionado(null);
        setProducto(productoVacio);
        setReferencia("");
        setReferenciaNoEncontrada(false);
        setImagenPreview(null);
        setArchivoImagen(null);
        setMostrarErrores(false);
        setCamposTocados({});
      }, 3000);
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
      const FORMATO_PRECIO = /^\$?\s*(\d+|\d{1,3}(\.\d{3})+)$/;
      if (!FORMATO_PRECIO.test(valStr)) return true; // Marca error en rojo
      const numero = Number(valStr.replace(/[$.\s]/g, ""));
      return !Number.isInteger(numero) || numero <= 0;
    }

    if (name === "stock") {
      if (valStr === "") return true;
      return !/^\d+$/.test(valStr); // Rechaza 0x10, decimales y negativos (en modificar, 0 sí es válido)
    }

    return false;
  };

  const manejarCambioInput = (e) => {
    const { name, value } = e.target;
    setProducto((prev) => ({ ...prev, [name]: value }));
    setCamposTocados((prev) => ({ ...prev, [name]: true }));
  };

  const manejarBlurInput = (event) => {
    setCamposTocados((prev) => ({ ...prev, [event.target.name]: true }));
  };

  const manejarBusquedaReferencia = (event) => {
    const valor = event.target.value;
    setReferencia(valor);

    const consulta = valor.trim().toLocaleLowerCase();
    const coincidencia = consulta
      ? productos.find(
          (item) =>
            String(item.ref || "").trim().toLocaleLowerCase() === consulta,
        ) || null
      : null;

    setProductoSeleccionado(coincidencia);
    setProducto(obtenerCamposProducto(coincidencia));
    setImagenPreview(coincidencia?.imagen || null);
    setArchivoImagen(null);
    setMostrarErrores(false);
    setCamposTocados({});
    setReferenciaNoEncontrada(Boolean(consulta) && !coincidencia);
    setMostrarModalExito(false);
    setMostrarModalError(false);
  };

  const errores = Object.fromEntries(
    Object.entries(producto).map(([nombre, valor]) => [
      nombre,
      esCampoInvalido(nombre, valor) &&
        (mostrarErrores || camposTocados[nombre]),
    ]),
  );

  const manejarGuardar = async (e) => {
    e.preventDefault();
    if (!productoSeleccionado || guardando) {
      return;
    }
    setMensajeServidor("");

    setMostrarErrores(true);
    const hayErrores = Object.entries(producto).some(([nombre, valor]) =>
      esCampoInvalido(nombre, valor),
    );
    if (hayErrores) {
      setMostrarModalExito(false);
      setMostrarModalError(true);
      return;
    }

    // Se guarda en la base de datos a través del backend
    setGuardando(true);
    const respuesta = await editarProducto(
      productoSeleccionado.id,
      producto,
      archivoImagen,
    );
    setGuardando(false);

    if (!respuesta.ok) {
      setMensajeServidor(respuesta.mensaje ?? "");
      setMostrarModalExito(false);
      setMostrarModalError(true);
      return;
    }

    setMostrarModalError(false);
    setMostrarModalExito(true);
  };

  return (
    <div className="pagina-editar pagina-producto">
      <Encabezado
        administrador
        ocultarTendencias
        ocultarIconoBusqueda
      />

      <p className="miga-pan">
        <Link to="/Admin">Inicio</Link>
        <span aria-hidden="true">\</span>
        Modificar_producto
      </p>

      <div className="contenido">
        {/* COMPONENTE 1: FORMULARIO */}
        <FormularioProducto
          titulo="Modificar producto"
          textoBoton="Guardar cambios"
          producto={producto}
          errores={errores}
          deshabilitado={!productoSeleccionado}
          mostrarCandados={!productoSeleccionado}
          onChange={manejarCambioInput}
          onBlurCampo={manejarBlurInput}
          onSubmit={manejarGuardar}
        />

        {/* COMPONENTE 2: PANEL DE FOTO Y REF */}
        <PanelDerechoProducto
          imagenPreview={imagenPreview}
          onCambiarImagen={(url, archivo) => {
            setImagenPreview(url);
            setArchivoImagen(archivo ?? null);
          }}
          refValor={referencia}
          refError={referenciaNoEncontrada}
          refMensaje={
            referenciaNoEncontrada
              ? "No encontramos un producto con esa referencia."
              : ""
          }
          onChangeReferencia={manejarBusquedaReferencia}
          deshabilitarFoto={!productoSeleccionado}
          esBuscarReferencia
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
              {mensajeServidor && !mensajeServidor.startsWith("Error al actualizar") ? (
                <p>{mensajeServidor}</p>
              ) : (
                <>
                  <p>Error al actualizar producto. Por favor</p>
                  <p>completa todos los campos obligatorios</p>
                  <p>y/o corrige los valores numéricos</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditarProducto;