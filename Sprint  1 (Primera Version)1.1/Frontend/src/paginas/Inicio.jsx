import Encabezado from "../componentes/Encabezado";
import { useCallback, useEffect, useState } from "react";
import DetalleProducto from "../componentes/DetalleProducto";
import "./Inicio.css";
import "../componentes/EncabezadoFigma.css";
import "./InicioFigma.css";

import fondoMenu from "../assets/fondoMenu.png";
import iconoMas from "../assets/Iconos_HU2/iconoMas.png";
import iconoCorazon from "../assets/Iconos_HU2/iconoCorazon.png";
import ListaProductos from "../componentes/ListaProductos";

const normalizarTexto = (texto) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();

// En la tarjeta la marca va en su propia línea: "VALENTINO" / "Uomo Born in Roma"
const quitarMarca = (nombre, marca) =>
  normalizarTexto(nombre).startsWith(normalizarTexto(marca))
    ? nombre.slice(marca.length).trim()
    : nombre;

const productosDestacados = [
  {
    nombre: "Anillo Oro 18k",
    imagen: "/productos/AnilloOro.jpeg",
    descripcion: "Anillo de oro de 18 quilates",
  },
  {
    nombre: "Pendientes Flora Celeste",
    imagen: "/productos/PendientesCelestes.jpg",
    descripcion: "Pendientes Flora Celeste",
  },
  {
    nombre: "Collar Lumière",
    imagen: "/productos/CollarAmatista.jpg",
    descripcion: "Collar Lumière de Amethyste",
  },
];

const productosMasVendidos = [
  {
    nombre: "Valentino Uomo Born in Roma",
    marca: "VALENTINO",
    imagen: "/productos/LocionValentino.jpg",
    precio: "$789.900",
  },
  {
    nombre: "Valentino Uomo Born in Roma",
    marca: "VALENTINO",
    imagen: "/productos/LocionValentino.jpg",
    precio: "$789.900",
  },
  {
    nombre: "Valentino Uomo Born in Roma",
    marca: "VALENTINO",
    imagen: "/productos/LocionValentino.jpg",
    precio: "$789.900",
  },
];

function Inicio({ administrador = false, usuario = false, productos = [] }) {
  const [busquedaAbierta, setBusquedaAbierta] = useState(false);
  const [consulta, setConsulta] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const sesionIniciada = administrador || usuario;
  const cerrarBusqueda = useCallback(() => {
    setBusquedaAbierta(false);
    setConsulta("");
  }, []);
  const consultaNormalizada = normalizarTexto(consulta.trim());
  const resultadosBusqueda = consultaNormalizada
    ? productos.filter(
        (producto) =>
          producto.estado !== "Inactivo" &&
          normalizarTexto(
            `${producto.nombre} ${producto.categoria} ${producto.descripcion} ${producto.ref}`,
          ).includes(consultaNormalizada),
      )
    : [];

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

  return (
    <main
      className={[
        "pagina-inicio",
        "pagina-inicio-figma",
        administrador && "pagina-inicio-admin",
        usuario && "pagina-inicio-usuario",
        !administrador && !usuario && "pagina-inicio-visitante",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Encabezado
        busquedaAbierta={busquedaAbierta}
        consulta={consulta}
        contenidoBusqueda={
          consultaNormalizada ? (
            <section aria-labelledby="inicio-resultados-busqueda-titulo">
              <h2
                id="inicio-resultados-busqueda-titulo"
                className="catalogo-titulo-busqueda"
              >
                Resultados de búsqueda
              </h2>
              {resultadosBusqueda.length ? (
                <ListaProductos
                  productos={resultadosBusqueda}
                  onSeleccionarProducto={setProductoSeleccionado}
                  soloLectura={administrador}
                />
              ) : (
                <p className="catalogo-busqueda-vacia">
                  No encontramos productos para “{consulta.trim()}”.
                </p>
              )}
            </section>
          ) : null
        }
        onCambiarConsulta={setConsulta}
        onCerrarBusqueda={cerrarBusqueda}
        administrador={administrador}
        sesionIniciada={sesionIniciada}
        mostrarLogin={!sesionIniciada}
        ocultarTendencias
        menuDeshabilitado={!sesionIniciada}
        onAbrirBusqueda={sesionIniciada ? () => setBusquedaAbierta(true) : undefined}
      />

      <section className="inicio-principal" aria-labelledby="inicio-titulo">
        <div
          className="inicio-portada"
          style={{ backgroundImage: `url("${fondoMenu}")` }}
        >
          <div className="inicio-portada-contenido">
            <p>Joyería y Perfumería</p>
            <h1 id="inicio-titulo">EDEN</h1>
          </div>
        </div>

        <div className="inicio-destacados" aria-label="Productos destacados">
          {productosDestacados.map((producto) => (
            <div
              className="inicio-tarjeta-destacada"
              key={producto.nombre}
            >
              <img src={producto.imagen} alt={producto.descripcion} />
            </div>
          ))}
        </div>
      </section>

      <section className="inicio-mas-vendidos" aria-labelledby="mas-vendidos-titulo">
        <h2 id="mas-vendidos-titulo">
          <span>Nuestros productos favoritos</span>
          <strong><span>Los</span> más vendidos</strong>
        </h2>
        <div className="inicio-mas-vendidos-lista">
          {productosMasVendidos.map((producto, indice) => (
            <article
              className="inicio-tarjeta-mas-vendido"
              key={`${producto.nombre}-${indice}`}
            >
              <img
                className="inicio-mas-vendido-imagen"
                src={producto.imagen}
                alt={producto.nombre}
              />
              <span className="inicio-mas-vendido-marca">{producto.marca}</span>
              <span className="inicio-mas-vendido-descripcion">
                <span className="inicio-mas-vendido-nombre">
                  {quitarMarca(producto.nombre, producto.marca)}
                </span>
                <span className="inicio-mas-vendido-agregar">
                  <img src={iconoMas} alt="" />
                </span>
              </span>
              <span className="inicio-mas-vendido-pie">
                <span className="inicio-mas-vendido-precio">{producto.precio}</span>
                <span className="inicio-mas-vendido-favorito" aria-hidden="true">
                  <img src={iconoCorazon} alt="" />
                </span>
              </span>
            </article>
          ))}
        </div>
      </section>

      {productoSeleccionado && (
        <DetalleProducto
          producto={productoSeleccionado}
          vistaAdminSoloLectura={administrador}
          onCerrar={() => setProductoSeleccionado(null)}
        />
      )}
    </main>
  );
}

export default Inicio;
