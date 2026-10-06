import Encabezado from "../componentes/Encabezado";
import FormularioProducto from "../componentes/FormularioProducto";
import PanelDerechoProducto from "../componentes/PanelDerechoProducto";
import Mensaje from "../componentes/Mensaje";
import useRegistrarProducto from "../hooks/useRegistrarProducto";
import { formatearPrecio } from "../utilidades/producto";
import iconoCheck from "../assets/Iconos_HU2/iconoCheck.svg";
import "./PaginaProducto.css";

// HE1-HU1 - Registrar producto. Ruta: /admin/productos/registrar
// Usa los mismos componentes que Editar producto (HE1-HU2).
// La lógica está en hooks/useRegistrarProducto.js

const MENSAJES = {
  exito: "¡Producto registrado exitosamente!",
  error:
    "Error al registrar producto. Por favor completa todos los campos obligatorios y/o corrige los valores numéricos",
  "error-servidor": "No se pudo registrar el producto. Revisa la conexión e inténtalo de nuevo.",
};

function RegistrarProducto({ agregarProducto, productos }) {
  const { form, imagen, errores, estado, cambiarImagen, handleChange, handleSubmit, cerrarMensaje } =
    useRegistrarProducto({ agregarProducto, productos });

  // Al cerrar el mensaje de error, el cursor queda en el primer campo con error
  const alCerrarMensaje = () => {
    cerrarMensaje();
    document.querySelector(".pagina-producto .campo-error, .campo-ref-error input")?.focus();
  };

  return (
    <div className="pagina-producto">
      <Encabezado />

      <p className="miga-pan">Inicio \ Registrar_Producto</p>

      <div className="contenido">
        <FormularioProducto
          textoBoton="Registrar producto"
          iconoBoton={iconoCheck}
          producto={{ ...form, precio: formatearPrecio(form.precio) }}
          errores={errores}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />

        <PanelDerechoProducto
          imagenPreview={imagen?.url}
          onCambiarImagen={cambiarImagen}
          refValor={form.ref}
          refError={errores.ref}
          onChangeInput={handleChange}
        />
      </div>

      {estado && (
        <Mensaje
          tipo={estado === "exito" ? "exito" : "error"}
          texto={MENSAJES[estado]}
          onCerrar={alCerrarMensaje}
        />
      )}
    </div>
  );
}

export default RegistrarProducto;
