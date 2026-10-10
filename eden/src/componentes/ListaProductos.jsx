import TarjetaProducto from "./TarjetaProducto";
import "./ListaProductos.css";

function ListaProductos({
  productos,
  onSeleccionarProducto,
  administrador = false,
  modoInactivos = false,
  onEditarProducto,
  onCambiarEstadoProducto,
}) {
  return (
    <section className="catalogo-productos" aria-label="Productos">
      {productos.map((producto) => (
        <TarjetaProducto
          key={producto.id}
          producto={producto}
          onSeleccionar={onSeleccionarProducto}
          administrador={administrador}
          modoInactivos={modoInactivos}
          onEditar={onEditarProducto}
          onCambiarEstado={onCambiarEstadoProducto}
        />
      ))}
    </section>
  );
}

export default ListaProductos;
