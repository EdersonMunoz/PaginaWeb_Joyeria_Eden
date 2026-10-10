import { useEffect, useState } from "react";
import iconoCarrito from "../assets/Iconos_HU2/iconoCarrito.png";
import iconoCorazon from "../assets/Iconos_HU2/iconoCorazon.png";
import iconoLapiz from "../assets/Iconos_HU2/iconoLapiz.png";
import iconoActivar from "../assets/iconoActivar.png";
import iconoBloquear from "../assets/iconoBloquear.png";
import "./DetalleProducto.css";

const formatoPrecio = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

function DetalleProducto({
  producto,
  onCerrar,
  administrador = false,
  modoInactivos = false,
  onEditar,
  confirmandoInactivacion = false,
  onSolicitarCambioEstado,
  onCancelarCambioEstado,
  onConfirmarCambioEstado,
}) {
  const [cantidad, setCantidad] = useState(1);
  const [favorito, setFavorito] = useState(false);

  useEffect(() => {
    const manejarEscape = (event) => {
      if (event.key === "Escape") {
        if (confirmandoInactivacion) {
          onCancelarCambioEstado();
        } else {
          onCerrar();
        }
      }
    };

    document.addEventListener("keydown", manejarEscape);
    return () => document.removeEventListener("keydown", manejarEscape);
  }, [confirmandoInactivacion, onCancelarCambioEstado, onCerrar]);

  return (
    <div
      className={`detalle-producto-fondo${administrador ? " detalle-producto-fondo-admin" : ""}`}
      onClick={onCerrar}
    >
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

        {!administrador && (
          <button
            className={`detalle-producto-favorito${favorito ? " seleccionado" : ""}`}
            type="button"
            aria-label={favorito ? "Quitar de favoritos" : "Añadir a favoritos"}
            aria-pressed={favorito}
            onClick={() => setFavorito((seleccionado) => !seleccionado)}
          >
            <img src={iconoCorazon} alt="" />
          </button>
        )}

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

            {administrador ? (
              <>
                <div className="detalle-producto-admin-dato">
                  <span>Stock:</span>
                  <span>{producto.stock}</span>
                </div>
                <div className="detalle-producto-admin-dato">
                  <span>Estado de producto:</span>
                  <span
                    className={`detalle-producto-admin-estado${producto.estado === "Inactivo" ? " inactivo" : ""}`}
                  >
                    {producto.estado || "Activo"}
                  </span>
                </div>
                {confirmandoInactivacion ? (
                  <div className="detalle-producto-confirmacion">
                    <p>
                      Confirmación necesaria para{" "}
                      {modoInactivos ? "activar" : "inactivar"} producto:
                    </p>
                    <div className="detalle-producto-confirmacion-acciones">
                      <button type="button" onClick={onConfirmarCambioEstado}>
                        Confirmar
                      </button>
                      <button type="button" onClick={onCancelarCambioEstado}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="detalle-producto-admin-acciones">
                    <button
                      className="detalle-producto-admin-accion"
                      type="button"
                      aria-label={`Editar ${producto.nombre}`}
                      title="Editar producto"
                      onClick={() => onEditar(producto)}
                    >
                      <img src={iconoLapiz} alt="" />
                    </button>
                    <button
                      className="detalle-producto-admin-accion"
                      type="button"
                      aria-label={`${modoInactivos ? "Activar" : "Inactivar"} ${producto.nombre}`}
                      title={`${modoInactivos ? "Activar" : "Inactivar"} producto`}
                      onClick={onSolicitarCambioEstado}
                    >
                      <img
                        className={modoInactivos ? "detalle-producto-accion-reactivar" : ""}
                        src={modoInactivos ? iconoActivar : iconoBloquear}
                        alt=""
                      />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default DetalleProducto;
