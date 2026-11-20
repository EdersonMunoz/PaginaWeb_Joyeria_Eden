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
  onAgregarCarrito,
}) {
  return (
    <article
      className={`tarjeta-producto${administrador ? " tarjeta-producto-admin" : ""}${modoInactivos ? " tarjeta-producto-inactivos" : ""}`}
    >
      <button
        className="tarjeta-producto-imagen-boton"
        type="button"
        onClick={() => onSeleccionar(producto)}
        aria-label={`Ver detalles de ${producto.nombre}`}
      >
        <img className="tarjeta-producto-imagen" src={producto.imagen} alt="" />
      </button>

      <div className="tarjeta-producto-detalles">
        <button
          className="tarjeta-producto-descripcion-boton"
          type="button"
          onClick={() => onSeleccionar(producto)}
          aria-label={`Ver detalles de ${producto.nombre}`}
        >
          <span className="tarjeta-producto-precio">
            ${formatoPrecio.format(producto.precio)}
          </span>
          <span className="tarjeta-producto-nombre">{producto.nombre}</span>
        </button>
        {!administrador && !soloLectura && (
          <span className="tarjeta-producto-acciones">
            {onAgregarCarrito && (
              <button
                type="button"
                aria-label={`Agregar ${producto.nombre} al carrito`}
                disabled={
                  Number.isFinite(Number(producto.stock)) &&
                  Number(producto.stock) <= 0
                }
                onClick={() => onAgregarCarrito(producto, 1)}
              >
                <img src={iconoCarrito} alt="" />
              </button>
            )}
            <button type="button" aria-label={`Agregar ${producto.nombre} a favoritos`}>
              <img src={iconoCorazon} alt="" />
            </button>
          </span>
        )}
      </div>

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