import carrito from "../assets/iconoCarrito.png";
import corazon from "../assets/iconoCorazon.png";
function TarjetaProducto({ producto, alAbrir }) {
  return (
    <div onClick={alAbrir} style={{ cursor: "pointer" }}>
      <img
        src={producto.imagen}
        alt={producto.nombre}
        style={{ width: "100%", aspectRatio: "3 / 4", objectFit: "cover", borderRadius: "6px" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
        <strong>${producto.precio.toLocaleString("es-CO")}</strong>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={(e) => e.stopPropagation()}
            aria-label="Agregar al carrito"
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            <img src={carrito} alt="" width="20" />
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            aria-label="Agregar a favoritos"
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            <img src={corazon} alt="" width="20" />
          </button>
        </div>
      </div>
      <p style={{ margin: "4px 0 0" }}>{producto.nombre}</p>
    </div>
  );
}

export default TarjetaProducto;