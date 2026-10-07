import { useEffect, useState } from "react";
import iconoCarrito from "../assets/Iconos_HU2/iconoCarrito.png";
import iconoCorazon from "../assets/Iconos_HU2/iconoCorazon.png";
import "./DetalleProducto.css";

const formatoPrecio = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

function DetalleProducto({ producto, onCerrar }) {
  const [cantidad, setCantidad] = useState(1);
  const [favorito, setFavorito] = useState(false);

  useEffect(() => {
    const manejarEscape = (event) => {
      if (event.key === "Escape") {
        onCerrar();
      }
    };

    document.addEventListener("keydown", manejarEscape);
    return () => document.removeEventListener("keydown", manejarEscape);
  }, [onCerrar]);

  return (
    <div className="detalle-producto-fondo" onClick={onCerrar}>
      <section
        className="detalle-producto-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-producto-titulo"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="detalle-producto-cerrar"
          type="button"
          aria-label="Volver al catálogo"
          onClick={onCerrar}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 18-6-6 6-6M9 12h12" />
          </svg>
        </button>

        <button
          className={`detalle-producto-favorito${favorito ? " seleccionado" : ""}`}
          type="button"
          aria-label={favorito ? "Quitar de favoritos" : "Añadir a favoritos"}
          aria-pressed={favorito}
          onClick={() => setFavorito((seleccionado) => !seleccionado)}
        >
          <img src={iconoCorazon} alt="" />
        </button>

        <div className="detalle-producto-contenido">
          <div className="detalle-producto-imagen-contenedor">
            <img
              className="detalle-producto-imagen"
              src={producto.imagen}
              alt={producto.nombre}
            />
          </div>

          <div className="detalle-producto-informacion">
            <h2 id="detalle-producto-titulo">{producto.nombre}</h2>
            <p className="detalle-producto-descripcion">{producto.descripcion}</p>
            <p className="detalle-producto-precio">
              <span>Precio:</span>
              <strong>${formatoPrecio.format(producto.precio)}</strong>
            </p>

            <div className="detalle-producto-cantidad">
              <span id="detalle-producto-etiqueta-cantidad">Cantidad</span>
              <div
                className="detalle-producto-control-cantidad"
                role="group"
                aria-labelledby="detalle-producto-etiqueta-cantidad"
              >
                <button
                  type="button"
                  aria-label="Disminuir cantidad"
                  disabled={cantidad <= 1}
                  onClick={() => setCantidad((valor) => Math.max(1, valor - 1))}
                >
                  −
                </button>
                <output aria-live="polite">{cantidad}</output>
                <button
                  type="button"
                  aria-label="Aumentar cantidad"
                  disabled={cantidad >= producto.stock}
                  onClick={() =>
                    setCantidad((valor) => Math.min(producto.stock, valor + 1))
                  }
                >
                  +
                </button>
              </div>
            </div>

            <p className="detalle-producto-referencia">Ref: {producto.ref}</p>

            <button className="detalle-producto-comprar" type="button">
              <img src={iconoCarrito} alt="" />
              Comprar
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DetalleProducto;
