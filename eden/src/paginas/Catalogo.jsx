import TarjetaProducto from "../componentes/TarjetaProducto";

function Catalogo({ productos }) {
  return (
    <div>
      <h1>Catalogo</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {productos.map((producto) => (
          <TarjetaProducto key={producto.id} producto={producto} />
        ))}
      </div>
    </div>
  );
}

export default Catalogo;