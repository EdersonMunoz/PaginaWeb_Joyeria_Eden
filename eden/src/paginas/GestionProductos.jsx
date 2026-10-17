import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Encabezado from "../componentes/Encabezado";
import iconoBoteBasura from "../assets/iconoBoteBasura.png";
import iconoChulito from "../assets/iconoChulito.png";
import iconoLapiz from "../assets/Iconos_HU2/iconoLapiz.png";
import iconoRefrescar from "../assets/iconoRefrescar.png";
import iconoX from "../assets/iconoX.png";
import "./GestionProductos.css";

const formatoPrecio = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

const normalizarTexto = (texto) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();

function GestionProductos({ productos, cambiarEstadoProducto }) {
  const [consulta, setConsulta] = useState("");
  const [cambioEstadoPendiente, setCambioEstadoPendiente] = useState(null);
  const [resultadoCambioEstado, setResultadoCambioEstado] = useState(null);
  const navigate = useNavigate();
  const productosVisibles = useMemo(() => {
    const consultaNormalizada = normalizarTexto(consulta.trim());
    if (!consultaNormalizada) {
      return productos;
    }

    return productos.filter((producto) =>
      normalizarTexto(`${producto.nombre} ${producto.ref}`).includes(
        consultaNormalizada,
      ),
    );
  }, [consulta, productos]);

  useEffect(() => {
    if (!cambioEstadoPendiente) {
      return undefined;
    }

    const cerrarConEscape = (event) => {
      if (event.key === "Escape") {
        setCambioEstadoPendiente(null);
      }
    };

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [cambioEstadoPendiente]);

  useEffect(() => {
    if (!resultadoCambioEstado) {
      return undefined;
    }

    const temporizador = window.setTimeout(
      () => setResultadoCambioEstado(null),
      3000,
    );

    return () => window.clearTimeout(temporizador);
  }, [resultadoCambioEstado]);

  const manejarAccionEstado = (producto) => {
    setCambioEstadoPendiente({
      producto,
      accion: producto.estado === "Activo" ? "inactivar" : "activar",
    });
  };

  const confirmarCambioEstado = () => {
    if (!cambioEstadoPendiente) {
      return;
    }

    const { producto, accion } = cambioEstadoPendiente;
    setCambioEstadoPendiente(null);

    if (accion === "activar" && !(Number(producto.stock) > 0)) {
      setResultadoCambioEstado({
        tipo: "error",
        mensaje:
          "Error al activar el producto. Por favor verifica que existan unidades disponibles",
      });
      return;
    }

    const activando = accion === "activar";
    cambiarEstadoProducto(producto.id, activando ? "Activo" : "Inactivo");
    setResultadoCambioEstado({
      tipo: "exito",
      mensaje: activando
        ? "El producto fue publicado en el catálogo correctamente"
        : "El producto fue removido del catálogo correctamente",
    });
  };

  return (
    <main className="pagina-gestion-productos">
      <Encabezado administrador ocultarTendencias ocultarIconoBusqueda />

      <p className="gestion-miga-pan">
        <Link to="/Admin">Inicio</Link>
        <span aria-hidden="true">\</span>
        Gestión_productos
      </p>

      <section className="gestion-contenido" aria-labelledby="gestion-titulo">
        <div className="gestion-encabezado">
          <h1 id="gestion-titulo">Gestionar productos</h1>
          <label className="gestion-busqueda">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 5 5" />
            </svg>
            <span className="visualmente-oculto">Buscar producto</span>
            <input
              type="search"
              placeholder="Buscar producto"
              value={consulta}
              onChange={(event) => setConsulta(event.target.value)}
            />
          </label>
        </div>

        <div className="gestion-columnas" aria-hidden="true">
          <span>Descripción</span>
          <span>Referencia</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        <div className="gestion-lista" aria-live="polite">
          {productosVisibles.length > 0 ? (
            productosVisibles.map((producto) => {
              const activo = producto.estado === "Activo";

              return (
                <article className="gestion-producto" key={producto.id}>
                  <img
                    className="gestion-producto-imagen"
                    src={producto.imagen}
                    alt={producto.nombre}
                  />
                  <div className="gestion-producto-descripcion">
                    <span>{producto.nombre}</span>
                    <strong>${formatoPrecio.format(producto.precio)}</strong>
                  </div>
                  <span className="gestion-producto-referencia">
                    {producto.ref}
                  </span>
                  <span
                    className={`gestion-producto-estado${activo ? " activo" : ""}`}
                  >
                    {activo ? "Activo" : "No Activo"}
                  </span>
                  <div className="gestion-producto-acciones">
                    <button
                      type="button"
                      aria-label={`Modificar ${producto.nombre}`}
                      title="Modificar producto"
                      onClick={() =>
                        navigate(
                          `/Admin/ModificarProducto/${producto.id}`,
                        )
                      }
                    >
                      <img src={iconoLapiz} alt="" />
                    </button>
                    <button
                      type="button"
                      aria-label={`${activo ? "Inactivar" : "Activar"} ${producto.nombre}`}
                      title={activo ? "Inactivar producto" : "Activar producto"}
                      onClick={() => manejarAccionEstado(producto)}
                    >
                      <img
                        src={activo ? iconoBoteBasura : iconoRefrescar}
                        alt=""
                      />
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="gestion-sin-resultados">
              No encontramos productos para “{consulta.trim()}”.
            </p>
          )}
        </div>
      </section>

      {cambioEstadoPendiente && (
        <div
          className="gestion-confirmacion-fondo"
          onClick={() => setCambioEstadoPendiente(null)}
        >
          <section
            className="gestion-confirmacion"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gestion-confirmacion-titulo"
            aria-describedby="gestion-confirmacion-descripcion"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="gestion-confirmacion-titulo">
              {cambioEstadoPendiente.accion === "activar"
                ? "¿Estás seguro de activar este producto?"
                : "¿Estás seguro de inactivar este producto?"}
            </h2>
            <p id="gestion-confirmacion-descripcion">
              {cambioEstadoPendiente.accion === "activar"
                ? "Esta acción publicará el producto en el catálogo y debe asegurarse de contar con unidades disponibles."
                : "Esta acción ocultará el producto del catálogo y ya no estará disponible para la venta."}
            </p>
            <div className="gestion-confirmacion-acciones">
              <button
                className="gestion-confirmacion-cancelar"
                type="button"
                onClick={() => setCambioEstadoPendiente(null)}
              >
                Cancelar
              </button>
              <button
                className="gestion-confirmacion-aceptar"
                type="button"
                onClick={confirmarCambioEstado}
              >
                {cambioEstadoPendiente.accion === "activar"
                  ? "Activar producto"
                  : "Inactivar producto"}
              </button>
            </div>
          </section>
        </div>
      )}

      {resultadoCambioEstado && (
        <div className="gestion-resultado-fondo">
          <div
            className={`gestion-resultado-mensaje ${resultadoCambioEstado.tipo}`}
            role={resultadoCambioEstado.tipo === "error" ? "alert" : "status"}
          >
            <img
              src={
                resultadoCambioEstado.tipo === "error" ? iconoX : iconoChulito
              }
              alt=""
            />
            <span>{resultadoCambioEstado.mensaje}</span>
          </div>
        </div>
      )}
    </main>
  );
}

export default GestionProductos;
