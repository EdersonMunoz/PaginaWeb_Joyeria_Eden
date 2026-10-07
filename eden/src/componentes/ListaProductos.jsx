import TarjetaProducto from "./TarjetaProducto";
import "./ListaProductos.css";

function ListaProductos({ productos, onSeleccionarProducto }) {
  return (
    <section className="catalogo-productos" aria-label="Productos">
      {productos.map((producto) => (
        <TarjetaProducto
          key={producto.id}
          producto={producto}
          onSeleccionar={onSeleccionarProducto}
        />
      ))}
    </section>
  );
}

export default ListaProductos;
