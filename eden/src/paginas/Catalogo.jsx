import { useState } from "react";
import TarjetaProducto from "../componentes/TarjetaProducto";
import DetalleProducto from "../componentes/DetalleProducto";

function Catalogo({ productos }) {
  const [seleccionado, setSeleccionado] = useState(null);

  return (
    <div>
      <h1>Catalogo</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
        {productos.map((producto) => (
          <TarjetaProducto
            key={producto.id}
            producto={producto}
            alAbrir={() => setSeleccionado(producto)}
          />
        ))}
      </div>
      
{seleccionado && (
  <DetalleProducto producto={seleccionado} alCerrar={() => setSeleccionado(null)} />
)}

    </div>
  );
}

export default Catalogo;