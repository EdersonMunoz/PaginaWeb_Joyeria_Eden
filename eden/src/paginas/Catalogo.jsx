import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Encabezado from "../componentes/Encabezado";
import DetalleProducto from "../componentes/DetalleProducto";
import ListaProductos from "../componentes/ListaProductos";
import iconoLapiz from "../assets/Iconos_HU2/iconoLapiz.png";
import iconoActivar from "../assets/iconoActivar.png";
import "./Catalogo.css";

const PRECIO_MINIMO = 150000;
const PRECIO_MAXIMO = 15000000;
const PASO_PRECIO = 50000;
const CATEGORIAS_CATALOGO = [
  { etiqueta: "Perfumería", valor: "Perfumería" },
  { etiqueta: "Aretes", valor: "Aretes" },
  { etiqueta: "Pulsos", valor: "Pulsos" },
  { etiqueta: "Anillos", valor: "Anillos" },
  { etiqueta: "Cadenas", valor: "Cadenas" },
  { etiqueta: "Brazaletes", valor: "Brazalete" },
];
const formatoPrecio = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

const filtrosIniciales = {
  categorias: [],
  precioMinimo: PRECIO_MINIMO,
  precioMaximo: PRECIO_MAXIMO,
};

const normalizarTexto = (texto) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();

function Catalogo({
  productos,
  modoGestion = false,
  modoInactivos = false,
  cambiarEstadoProducto,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const administrador = location.pathname.startsWith("/Admin/");
  const usuario = location.pathname.startsWith("/Usuario/");
  const sesionIniciada = administrador || usuario;
  const rutaInicio = administrador ? "/Admin" : usuario ? "/Usuario" : "/";
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [busquedaAbierta, setBusquedaAbierta] = useState(
    Boolean(location.state?.abrirBusqueda),
  );
  const [consulta, setConsulta] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [productoParaCambiarEstado, setProductoParaCambiarEstado] = useState(null);
  const [avisoCambioEstado, setAvisoCambioEstado] = useState(null);
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtrosIniciales);
  const [filtrosTemporales, setFiltrosTemporales] = useState(filtrosIniciales);
  const cerrarBusqueda = useCallback(() => {
    setBusquedaAbierta(false);
    setConsulta("");

    if (location.state?.volverA) {
      navigate(location.state.volverA, { replace: true });
    }
  }, [location.state, navigate]);
  const productosDelCatalogo = modoInactivos
    ? productos.filter((producto) => producto.estado === "Inactivo")
    : modoGestion
      ? productos
      : productos.filter((producto) => producto.estado !== "Inactivo");
  const productosVisibles = productosDelCatalogo.filter((producto) => {
    const coincideCategoria =
      filtrosAplicados.categorias.length === 0 ||
      filtrosAplicados.categorias.includes(producto.categoria);

    return (
      coincideCategoria &&
      producto.precio >= filtrosAplicados.precioMinimo &&
      producto.precio <= filtrosAplicados.precioMaximo
    );
  });
  const consultaNormalizada = normalizarTexto(consulta.trim());
  const productosBusqueda = consultaNormalizada
    ? productosVisibles.filter((producto) =>
        normalizarTexto(
          `${producto.nombre} ${producto.categoria} ${producto.descripcion} ${producto.ref}`,
        ).includes(consultaNormalizada),
      )
    : [];

  useEffect(() => {
    if (location.state?.abrirBusqueda) {
      navigate(location.pathname, {
        replace: true,
        state: {
          administrador,
          usuario,
          volverA: location.state.volverA,
        },
      });
    }
  }, [
    administrador,
    location.key,
    location.pathname,
    location.state,
    navigate,
    usuario,
  ]);

  useEffect(() => {
    if (!mostrarFiltros && !busquedaAbierta) {
      return undefined;
    }

    const manejarEscape = (event) => {
      if (event.key === "Escape") {
        if (busquedaAbierta) {
          cerrarBusqueda();
        } else {
          setMostrarFiltros(false);
        }
      }
    };

    if (mostrarFiltros) {
      document.body.style.overflow = "hidden";
    }
    document.addEventListener("keydown", manejarEscape);

    return () => {
      if (mostrarFiltros) {
        document.body.style.overflow = "";
      }
      document.removeEventListener("keydown", manejarEscape);
    };
  }, [mostrarFiltros, busquedaAbierta, cerrarBusqueda]);

  useEffect(() => {
    if (!productoSeleccionado) {
      return undefined;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [productoSeleccionado]);

  useEffect(() => {
    if (!avisoCambioEstado) {
      return undefined;
    }

    const temporizador = window.setTimeout(
      () => setAvisoCambioEstado(null),
      2800,
    );

    return () => window.clearTimeout(temporizador);
  }, [avisoCambioEstado]);

  useEffect(() => {
    if (!productoParaCambiarEstado) {
      return undefined;
    }

    const cancelarConEscape = (event) => {
      if (event.key === "Escape") {
        setProductoParaCambiarEstado(null);
      }
    };

    document.addEventListener("keydown", cancelarConEscape);
    return () => document.removeEventListener("keydown", cancelarConEscape);
  }, [productoParaCambiarEstado]);

  const abrirFiltros = () => {
    setFiltrosTemporales({
      ...filtrosAplicados,
      categorias: [...filtrosAplicados.categorias],
    });
    setMostrarFiltros(true);
  };

  const alternarCategoria = (categoria) => {
    setFiltrosTemporales((filtros) => ({
      ...filtros,
      categorias: filtros.categorias.includes(categoria)
        ? filtros.categorias.filter((seleccionada) => seleccionada !== categoria)
        : [...filtros.categorias, categoria],
    }));
  };

  const abrirBusqueda = () => {
    if (modoInactivos) {
      navigate("/Admin/GestionProductos", {
        state: {
          abrirBusqueda: true,
          volverA: location.pathname,
        },
      });
      return;
    }

    setBusquedaAbierta(true);
  };

  const solicitarCambioEstadoDesdeTarjeta = (producto) => {
    setProductoSeleccionado(producto);
    setProductoParaCambiarEstado(producto);
  };

  const confirmarCambioEstado = () => {
    if (!productoParaCambiarEstado) {
      return;
    }

    if (typeof cambiarEstadoProducto !== "function") {
      throw new Error("No se configuró la actualización del estado del producto.");
    }

    const nuevoEstado = modoInactivos ? "Activo" : "Inactivo";
    cambiarEstadoProducto(productoParaCambiarEstado.id, nuevoEstado);
    setProductoParaCambiarEstado(null);
    setProductoSeleccionado(null);
    setAvisoCambioEstado({
      estado: nuevoEstado,
      mensaje: `¡Producto ${modoInactivos ? "activado" : "inactivado"} correctamente!`,
    });
  };

  const filtros = (
    <div className="catalogo-barra-filtros">
      <button
        className="catalogo-boton-filtros"
        type="button"
        aria-expanded={mostrarFiltros}
        onClick={abrirFiltros}
      >
        Filtros
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 4h18l-7 8v7l-4 2v-9L3 4Z" />
        </svg>
      </button>
      {mostrarFiltros && (
        <div
          className="catalogo-filtros-fondo"
          onClick={() => setMostrarFiltros(false)}
        >
          <aside
            className="catalogo-panel-filtros"
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalogo-titulo-filtros"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="catalogo-panel-encabezado">
              <button
                className="catalogo-cerrar-filtros"
                type="button"
                aria-label="Cerrar filtros"
                onClick={() => setMostrarFiltros(false)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
              <h2 id="catalogo-titulo-filtros">Filtros</h2>
            </div>

            <section className="catalogo-seccion-filtros" aria-labelledby="catalogo-titulo-categoria">
              <h3 id="catalogo-titulo-categoria">Categoría</h3>
              <div className="catalogo-categorias">
                {CATEGORIAS_CATALOGO.map(({ etiqueta, valor }) => {
                  const seleccionada = filtrosTemporales.categorias.includes(valor);

                  return (
                    <button
                      className={`catalogo-chip-categoria${seleccionada ? " seleccionada" : ""}`}
                      key={valor}
                      type="button"
                      aria-pressed={seleccionada}
                      onClick={() => alternarCategoria(valor)}
                    >
                      {etiqueta}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="catalogo-seccion-filtros catalogo-seccion-precio" aria-labelledby="catalogo-titulo-precio">
              <h3 id="catalogo-titulo-precio">Precio</h3>
              <div className="catalogo-rango-precio-etiquetas" aria-live="polite">
                <span>${formatoPrecio.format(filtrosTemporales.precioMinimo)}</span>
                <span>–</span>
                <span>${formatoPrecio.format(filtrosTemporales.precioMaximo)}</span>
              </div>
              <div className="catalogo-rango-precio">
                <div className="catalogo-rango-precio-pista" />
                <input
                  aria-label="Precio mínimo"
                  type="range"
                  min={PRECIO_MINIMO}
                  max={PRECIO_MAXIMO}
                  step={PASO_PRECIO}
                  value={filtrosTemporales.precioMinimo}
                  onChange={(event) => {
                    const precioMinimo = Number(event.target.value);
                    setFiltrosTemporales((filtros) => ({
                      ...filtros,
                      precioMinimo: Math.min(
                        precioMinimo,
                        filtros.precioMaximo - PASO_PRECIO,
                      ),
                    }));
                  }}
                />
                <input
                  aria-label="Precio máximo"
                  type="range"
                  min={PRECIO_MINIMO}
                  max={PRECIO_MAXIMO}
                  step={PASO_PRECIO}
                  value={filtrosTemporales.precioMaximo}
                  onChange={(event) => {
                    const precioMaximo = Number(event.target.value);
                    setFiltrosTemporales((filtros) => ({
                      ...filtros,
                      precioMaximo: Math.max(
                        precioMaximo,
                        filtros.precioMinimo + PASO_PRECIO,
                      ),
                    }));
                  }}
                />
              </div>
            </section>

            <button
              className="catalogo-aplicar-filtros"
              type="button"
              onClick={() => {
                setFiltrosAplicados({
                  ...filtrosTemporales,
                  categorias: [...filtrosTemporales.categorias],
                });
                setMostrarFiltros(false);
              }}
            >
              Aplicar filtros
            </button>
          </aside>
        </div>
      )}
    </div>
  );

  return (
    <main className={`pagina-catalogo${modoGestion ? " pagina-catalogo-gestion" : ""}`}>
      <Encabezado
        acciones={filtros}
        busquedaAbierta={busquedaAbierta}
        consulta={consulta}
        administrador={administrador}
        sesionIniciada={sesionIniciada}
        mostrarLogin={!sesionIniciada}
        ocultarCarrito={modoGestion}
        onAbrirBusqueda={abrirBusqueda}
        onCerrarBusqueda={cerrarBusqueda}
        onCambiarConsulta={setConsulta}
      />

      {modoGestion && (
        <h1 className="catalogo-titulo-admin">
          {modoInactivos ? "Productos Inactivos" : "Gestión de productos"}
        </h1>
      )}

      {busquedaAbierta ? (
        <div className="catalogo-contenido catalogo-contenido-busqueda">
          {consultaNormalizada ? (
            <section aria-labelledby="catalogo-titulo-resultados">
              <h2 id="catalogo-titulo-resultados" className="catalogo-titulo-busqueda">
                Resultados de búsqueda
              </h2>
              {productosBusqueda.length > 0 ? (
                <ListaProductos
                  productos={productosBusqueda}
                  onSeleccionarProducto={setProductoSeleccionado}
                  administrador={modoGestion}
                  modoInactivos={modoInactivos}
                  onCambiarEstadoProducto={solicitarCambioEstadoDesdeTarjeta}
                  onEditarProducto={(producto) =>
                    navigate(`/Admin/Productos/ModificarProducto/${producto.id}`)
                  }
                />
              ) : (
                <p className="catalogo-busqueda-vacia">
                  No encontramos productos para “{consulta.trim()}”.
                </p>
              )}
            </section>
          ) : (
            <>
              <section aria-labelledby="catalogo-titulo-busquedas-populares">
                <h2
                  id="catalogo-titulo-busquedas-populares"
                  className="catalogo-titulo-busqueda"
                >
                  Búsquedas populares
                </h2>
                <div className="catalogo-sugerencias-busqueda">
                  {["Anillos", "Aretes", "Cadenas", "Perfumería"].map((sugerencia) => (
                    <button
                      key={sugerencia}
                      type="button"
                      onClick={() => setConsulta(sugerencia)}
                    >
                      {sugerencia}
                    </button>
                  ))}
                </div>
              </section>

              <section
                className="catalogo-destacados-busqueda"
                aria-labelledby="catalogo-titulo-destacados"
              >
                <h2 id="catalogo-titulo-destacados" className="catalogo-titulo-busqueda">
                  Productos destacados
                </h2>
                <ListaProductos
                  productos={productosVisibles.slice(0, 4)}
                  onSeleccionarProducto={setProductoSeleccionado}
                  administrador={modoGestion}
                  modoInactivos={modoInactivos}
                  onCambiarEstadoProducto={solicitarCambioEstadoDesdeTarjeta}
                  onEditarProducto={(producto) =>
                    navigate(`/Admin/Productos/ModificarProducto/${producto.id}`)
                  }
                />
              </section>
            </>
          )}
        </div>
      ) : (
        <div className="catalogo-contenido">
          <p className="catalogo-miga-pan">
            <Link to={rutaInicio}>Inicio</Link>
            <span aria-hidden="true">\</span>
            {modoInactivos
              ? "Productos_Inactivos"
              : modoGestion
                ? "Gestión_Productos"
                : "Catalogo"}
          </p>

          <ListaProductos
            productos={productosVisibles}
            onSeleccionarProducto={setProductoSeleccionado}
            administrador={modoGestion}
            modoInactivos={modoInactivos}
            onCambiarEstadoProducto={solicitarCambioEstadoDesdeTarjeta}
            onEditarProducto={(producto) =>
              navigate(`/Admin/Productos/ModificarProducto/${producto.id}`)
            }
          />
        </div>
      )}

      {productoSeleccionado && (
        <DetalleProducto
          producto={productoSeleccionado}
          administrador={modoGestion}
          modoInactivos={modoInactivos}
          confirmandoInactivacion={
            productoParaCambiarEstado?.id === productoSeleccionado.id
          }
          onSolicitarCambioEstado={() =>
            setProductoParaCambiarEstado(productoSeleccionado)
          }
          onCancelarCambioEstado={() => setProductoParaCambiarEstado(null)}
          onConfirmarCambioEstado={confirmarCambioEstado}
          onEditar={(producto) =>
            navigate(`/Admin/Productos/ModificarProducto/${producto.id}`)
          }
          onCerrar={() => {
            setProductoSeleccionado(null);
            setProductoParaCambiarEstado(null);
          }}
        />
      )}

      {avisoCambioEstado && (
        <div className="catalogo-aviso-inactivacion-fondo">
          <div
            className={`catalogo-aviso-inactivacion${avisoCambioEstado.estado === "Activo" ? " catalogo-aviso-activacion" : ""}`}
            role="status"
            aria-live="polite"
          >
            <img
              className={avisoCambioEstado.estado === "Activo" ? "aviso-icono-activar" : ""}
              src={avisoCambioEstado.estado === "Activo" ? iconoActivar : iconoLapiz}
              alt=""
              aria-hidden="true"
            />
            {avisoCambioEstado.mensaje}
          </div>
        </div>
      )}
    </main>
  );
}

export default Catalogo;
