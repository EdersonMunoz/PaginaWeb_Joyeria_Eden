import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Encabezado from "../componentes/Encabezado";
import DetalleProducto from "../componentes/DetalleProducto";
import ListaProductos from "../componentes/ListaProductos";
import "./Catalogo.css";
import iconoRegresar from "../assets/iconoRegresar.png";

const PRECIO_MINIMO = 150000;
const PRECIO_MAXIMO = 15000000;
const PASO_PRECIO = 50000;
const CATEGORIAS_CATALOGO = [
  "Perfumería",
  "Aretes",
  "Pulsos",
  "Anillos",
  "Cadenas",
  "Brazalete",
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

function Catalogo({ productos }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [busquedaAbierta, setBusquedaAbierta] = useState(
    Boolean(location.state?.abrirBusqueda),
  );
  const [consulta, setConsulta] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtrosIniciales);
  const [filtrosTemporales, setFiltrosTemporales] = useState(filtrosIniciales);
  const productosVisibles = productos.filter((producto) => {
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
        state: location.state.regresarA
          ? { regresarA: location.state.regresarA }
          : null,
      });
    }
  }, [location.key, location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!mostrarFiltros && !busquedaAbierta) {
      return undefined;
    }

    const manejarEscape = (event) => {
      if (event.key === "Escape") {
        if (busquedaAbierta) {
          setBusquedaAbierta(false);
          setConsulta("");
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
  }, [mostrarFiltros, busquedaAbierta]);

  useEffect(() => {
    if (!productoSeleccionado) {
      return undefined;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
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

  const cerrarBusqueda = () => {
    setBusquedaAbierta(false);
    setConsulta("");
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
                className="catalogo-volver-filtros"
                type="button"
                aria-label="Cerrar filtros"
                onClick={() => setMostrarFiltros(false)}
              >
                <img src={iconoRegresar} alt="" />
              </button>
              <h2 id="catalogo-titulo-filtros">Filtros</h2>
            </div>

            <section className="catalogo-seccion-filtros" aria-labelledby="catalogo-titulo-categoria">
              <h3 id="catalogo-titulo-categoria">Categoría</h3>
              <div className="catalogo-categorias">
                {CATEGORIAS_CATALOGO.map((categoria) => {
                  const seleccionada = filtrosTemporales.categorias.includes(categoria);

                  return (
                    <button
                      className={`catalogo-chip-categoria${seleccionada ? " seleccionada" : ""}`}
                      key={categoria}
                      type="button"
                      aria-pressed={seleccionada}
                      onClick={() => alternarCategoria(categoria)}
                    >
                      {categoria}
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
    <main className="pagina-catalogo">
      <Encabezado
        acciones={filtros}
        onRegresar={() => navigate(location.state?.regresarA || "/")}
        busquedaAbierta={busquedaAbierta}
        consulta={consulta}
        onAbrirBusqueda={() => setBusquedaAbierta(true)}
        onCerrarBusqueda={cerrarBusqueda}
        onCambiarConsulta={setConsulta}
      />

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
                />
              </section>
            </>
          )}
        </div>
      ) : (
        <div className="catalogo-contenido">
          <p className="catalogo-miga-pan">
            Inicio <span aria-hidden="true">\</span> Catalogo
          </p>

          <ListaProductos
            productos={productosVisibles}
            onSeleccionarProducto={setProductoSeleccionado}
          />
        </div>
      )}

      {productoSeleccionado && (
        <DetalleProducto
          producto={productoSeleccionado}
          onCerrar={() => setProductoSeleccionado(null)}
        />
      )}
    </main>
  );
}

export default Catalogo;
