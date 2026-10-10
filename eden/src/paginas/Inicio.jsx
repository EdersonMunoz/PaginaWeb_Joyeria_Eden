import Encabezado from "../componentes/Encabezado";
import "./Inicio.css";

import fondoMenu from "../assets/fondoMenu.png";
import iconoMas from "../assets/Iconos_HU2/iconoMas.png";
import iconoCorazon from "../assets/Iconos_HU2/iconoCorazon.png";

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

function Inicio({ administrador = false, usuario = false }) {
  const sesionIniciada = administrador || usuario;

  return (
    <main className="pagina-inicio">
      <Encabezado
        administrador={administrador}
        sesionIniciada={sesionIniciada}
        mostrarLogin={!sesionIniciada}
        ocultarTendencias
      />

      <section className="inicio-principal" aria-labelledby="inicio-titulo">
        <div
          className="inicio-portada"
          style={{ backgroundImage: `url("${fondoMenu}")` }}
        >
          <div className="inicio-portada-contenido">
            <p>Joyería y perfumería</p>
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
                <span className="inicio-mas-vendido-nombre">{producto.nombre}</span>
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

    </main>
  );
}

export default Inicio;
