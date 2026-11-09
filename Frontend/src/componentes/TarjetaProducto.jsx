import iconoCarrito from "../assets/iconossvg/iconoCarrito.svg";
import iconoCorazon from "../assets/iconossvg/iconocorazon2.svg";
import iconoLapiz from "../assets/iconossvg/iconoLapiz.svg";
import iconoActivar from "../assets/iconoActivar.png";
import iconoBloquear from "../assets/iconoBloquear.png";
import "./TarjetaProducto.css";

const formatoPrecio = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

function TarjetaProducto({
  producto,
  onSeleccionar,
  administrador = false,
  soloLectura = false,
  modoInactivos = false,
  onEditar,
  onCambiarEstado,
}) {
  return (
    <article
      className={`tarjeta-producto${administrador ? " tarjeta-producto-admin" : ""}${modoInactivos ? " tarjeta-producto-inactivos" : ""}`}
    >
      <button
        className="tarjeta-producto-vista"
        type="button"
        onClick={() => onSeleccionar(producto)}
        aria-label={`Ver detalles de ${producto.nombre}`}
      >
        <img className="tarjeta-producto-imagen" src={producto.imagen} alt={producto.nombre} />
        <span className="tarjeta-producto-detalles">
          <span className="tarjeta-producto-precio">
            ${formatoPrecio.format(producto.precio)}
          </span>
          {!administrador && !soloLectura && (
            <span
              className="tarjeta-producto-acciones"
              aria-hidden="true"
              onClick={(event) => event.stopPropagation()}
            >
              <img src={iconoCarrito} alt="" />
              <img src={iconoCorazon} alt="" />
            </span>
          )}
        </span>
        <span className="tarjeta-producto-nombre">{producto.nombre}</span>
      </button>

      {administrador && (
        <div className="tarjeta-producto-admin-pie">
          <span
            className={`tarjeta-producto-estado${producto.estado === "Inactivo" ? " inactivo" : ""}${modoInactivos ? " reactivable" : ""}`}
          >
            {producto.estado || "Activo"}
          </span>
          <span className="tarjeta-producto-admin-acciones">
            <button
              className="tarjeta-producto-accion-admin"
              type="button"
              aria-label={`Editar ${producto.nombre}`}
              title="Editar producto"
              onClick={() => onEditar(producto)}
            >
              <img src={iconoLapiz} alt="" />
            </button>
            <button
              className={`tarjeta-producto-accion-admin${modoInactivos ? " tarjeta-producto-accion-reactivar" : ""}`}
              type="button"
              aria-label={`${modoInactivos ? "Activar" : "Inactivar"} ${producto.nombre}`}
              title={`${modoInactivos ? "Activar" : "Inactivar"} producto`}
              onClick={() => onCambiarEstado(producto)}
            >
              <img src={modoInactivos ? iconoActivar : iconoBloquear} alt="" />
            </button>
          </span>
        </div>
      )}
    </article>
  );
}

export default TarjetaProducto;