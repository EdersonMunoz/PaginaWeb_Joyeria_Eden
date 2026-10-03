function TarjetaProducto({ producto }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
      <img
        src={producto.imagen}
        alt={producto.nombre}
        style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "6px" }}
      />
      <p>
        <strong>{producto.nombre}</strong> - ${producto.precio.toLocaleString("es-CO")} ({producto.categoria})
      </p>
    </div>
  );
}

export default TarjetaProducto;