import { useState } from "react";
import carrito from "../assets/iconoCarrito.png";
import corazon from "../assets/iconoCorazon.png";

function DetalleProducto({ producto, alCerrar }) {
  const [cantidad, setCantidad] = useState(1);

  return (
    <div
      onClick={alCerrar}
      style={{
        position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
        background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "white", borderRadius: "12px", padding: "24px", width: "90%", maxWidth: "900px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            onClick={alCerrar}
            aria-label="Volver al catálogo"
            style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer" }}
          >
            ←
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            aria-label="Agregar a favoritos"
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            <img src={corazon} alt="" width="24" />
          </button>
        </div>

        <div style={{ display: "flex", gap: "24px", marginTop: "12px" }}>
          <img
            src={producto.imagen}
            alt={producto.nombre}
            style={{ width: "45%", objectFit: "cover", borderRadius: "6px" }}
          />
          <div style={{ flex: 1 }}>
            <h2>{producto.nombre}</h2>
            <p>{producto.descripcion}</p>
            <p>
              Precio: <strong>${producto.precio.toLocaleString("es-CO")}</strong>
            </p>

            <p>Cantidad</p>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button onClick={() => setCantidad(Math.max(1, cantidad - 1))}>-</button>
              <span>{cantidad}</span>
              <button onClick={() => setCantidad(cantidad + 1)}>+</button>
            </div>

            <p>Ref: {producto.ref}</p>

            <button style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <img src={carrito} alt="" width="20" />
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetalleProducto;