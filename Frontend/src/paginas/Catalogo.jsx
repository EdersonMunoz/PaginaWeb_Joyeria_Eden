import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Encabezado from "../componentes/Encabezado";
import DetalleProducto from "../componentes/DetalleProducto";
import ListaProductos from "../componentes/ListaProductos";
import "./Catalogo.css";
import "../componentes/EncabezadoFigma.css";
import "./CatalogoFigma.css";

const PRECIO_MINIMO = 150000;
const PRECIO_MAXIMO = 15000000;
const PASO_PRECIO = 50000;
const CATEGORIAS_CATALOGO = [
  { etiqueta: "Perfumería", valor: "Perfumería" },
  { etiqueta: "Aretes", valor: "Aretes" },
  { etiqueta: "Pulsos", valor: "Pulsos" },
  { etiqueta: "Anillos", valor: "Anillos" },
  { etiqueta: "Cadenas", valor: "Cadenas" },
  { etiqueta: "Brazalete", valor: "Brazalete" },
];
const formatoPrecio = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

const filtrosIniciales = {
  categorias: [],
  precioMinimo: PRECIO_MINIMO,
  precioMaximo: PRECIO_MAXIMO,
  precioActivo: false,
};

const normalizarTexto = (texto) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();

function Catalogo({ productos }) {
  const location = useLocation();
  const administrador = location.pathname.startsWith("/Admin");
  const usuario = location.pathname.startsWith("/Usuario");
  const vistaAdminSoloLectura =
    Boolean(location.state?.vistaAdminSoloLectura) || administrador;
  const sesionIniciada = administrador || usuario;
  const rutaInicio = administrador
    ? "/Admin"
    : usuario
      ? "/Usuario"
      : "/Inicio";
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [busquedaAbierta, setBusquedaAbierta] = useState(false);
  const [consulta, setConsulta] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtrosIniciales);
  const [filtrosTemporales, setFiltrosTemporales] = useState(filtrosIniciales);
  const cerrarBusqueda = useCallback(() => {
    setBusquedaAbierta(false);
    setConsulta("");
  }, []);
  const productosDelCatalogo = productos.filter(
    (producto) => producto.estado !== "Inactivo",
  );
  const productosVisibles = productosDelCatalogo.filter((producto) => {
    const coincideCategoria =
      filtrosAplicados.categorias.length === 0 ||
      filtrosAplicados.categorias.includes(producto.categoria);

    return (
      coincideCategoria &&
      (!filtrosAplicados.precioActivo ||
        (producto.precio >= filtrosAplicados.precioMinimo &&
          producto.precio <= filtrosAplicados.precioMaximo))
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

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [productoSeleccionado]);

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
    setBusquedaAbierta(true);
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
                      precioActivo: true,
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
                      precioActivo: true,
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

  const contenidoBusqueda = busquedaAbierta ? (
    consultaNormalizada ? (
      <section aria-labelledby="catalogo-titulo-resultados">
        <h2 id="catalogo-titulo-resultados" className="catalogo-titulo-busqueda">
          Resultados de búsqueda
        </h2>
        {productosBusqueda.length > 0 ? (
          <ListaProductos
            productos={productosBusqueda}
            onSeleccionarProducto={setProductoSeleccionado}
            soloLectura={administrador || vistaAdminSoloLectura}
          />
        ) : (
          <p className="catalogo-busqueda-vacia">
            No encontramos productos para “{consulta.trim()}”.
          </p>
        )}
      </section>
    ) : null
  ) : null;

  return (
    <main
      className={[
        "pagina-catalogo",
        (usuario || vistaAdminSoloLectura) && "pagina-catalogo-usuario",
        "pagina-catalogo-figma",
        busquedaAbierta && "pagina-catalogo-busqueda-abierta",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Encabezado
        acciones={filtros}
        busquedaAbierta={busquedaAbierta}
        consulta={consulta}
        contenidoBusqueda={contenidoBusqueda}
        administrador={administrador}
        sesionIniciada={sesionIniciada}
        mostrarLogin={!sesionIniciada}
        vistaAdminSoloLectura={vistaAdminSoloLectura}
        onAbrirBusqueda={abrirBusqueda}
        onCerrarBusqueda={cerrarBusqueda}
        onCambiarConsulta={setConsulta}
      />

      <div className="catalogo-contenido">
        <p className="catalogo-miga-pan">
          <Link to={rutaInicio}>Inicio</Link>
          <span aria-hidden="true">\</span>
          Catálogo
        </p>

        <ListaProductos
          productos={productosVisibles}
          onSeleccionarProducto={setProductoSeleccionado}
          soloLectura={vistaAdminSoloLectura}
        />
      </div>

      {productoSeleccionado && (
        <DetalleProducto
          producto={productoSeleccionado}
          vistaAdminSoloLectura={vistaAdminSoloLectura}
          onCerrar={() => {
            setProductoSeleccionado(null);
          }}
        />
      )}
    </main>
  );
}

export default Catalogo;
