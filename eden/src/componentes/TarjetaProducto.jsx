import iconoCarrito from "../assets/Iconos_HU2/iconoCarrito.png";
import iconoCorazon from "../assets/Iconos_HU2/iconoCorazon.png";
import "./TarjetaProducto.css";

const formatoPrecio = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

function TarjetaProducto({ producto, onSeleccionar }) {
  return (
    <button
      className="tarjeta-producto"
      type="button"
      onClick={() => onSeleccionar(producto)}
      aria-label={`Ver detalles de ${producto.nombre}`}
    >
      <img className="tarjeta-producto-imagen" src={producto.imagen} alt={producto.nombre} />
      <span className="tarjeta-producto-detalles">
        <span className="tarjeta-producto-precio">
          ${formatoPrecio.format(producto.precio)}
        </span>
        <span className="tarjeta-producto-acciones" aria-hidden="true">
          <img src={iconoCarrito} alt="" />
          <img src={iconoCorazon} alt="" />
        </span>
      </span>
      <span className="tarjeta-producto-nombre">{producto.nombre}</span>
    </button>
  );
}

export default TarjetaProducto;