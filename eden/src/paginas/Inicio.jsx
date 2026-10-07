import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Encabezado from "../componentes/Encabezado";
import "./Inicio.css";

import fondoMenu from "../assets/fondoMenu.png";
import iconoAjustes from "../assets/iconoAjustes.png";
import iconoX from "../assets/iconoX.png";

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

function Inicio({ administrador = false }) {
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [perfilAbierto, setPerfilAbierto] = useState(false);

  useEffect(() => {
    if (!menuAbierto && !perfilAbierto) {
      return undefined;
    }

    const cerrarConEscape = (event) => {
      if (event.key === "Escape") {
        setMenuAbierto(false);
        setPerfilAbierto(false);
      }
    };

    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [menuAbierto, perfilAbierto]);

  return (
    <main className="pagina-inicio">
      <Encabezado
        administrador={administrador}
        onAbrirBusqueda={() =>
          navigate("/catalogo", {
            state: {
              abrirBusqueda: true,
              regresarA: administrador ? "/admin" : "/",
            },
          })
        }
        onAbrirMenu={() => setMenuAbierto(true)}
        onVerPerfil={administrador ? () => setPerfilAbierto(true) : undefined}
      />

      <section
        className="inicio-portada"
        style={{ backgroundImage: `url("${fondoMenu}")` }}
        aria-labelledby="inicio-titulo"
      >
        <div className="inicio-portada-contenido">
          <p>Joyería y perfumería</p>
          <h1 id="inicio-titulo">EDEN</h1>
        </div>
      </section>

      <section className="inicio-destacados" aria-label="Productos destacados">
        {productosDestacados.map((producto) => (
          <Link
            className="inicio-tarjeta-destacada"
            key={producto.nombre}
            to="/catalogo"
            state={{ regresarA: administrador ? "/admin" : "/" }}
            aria-label={`Explorar catálogo: ${producto.nombre}`}
          >
            <img src={producto.imagen} alt={producto.descripcion} />
          </Link>
        ))}
      </section>

      {menuAbierto && (
        <div
          className="inicio-menu-fondo"
          onClick={() => setMenuAbierto(false)}
        >
          <aside
            className="inicio-menu-admin"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inicio-menu-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="inicio-menu-encabezado">
              <h2 id="inicio-menu-titulo">Menú</h2>
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setMenuAbierto(false)}
              >
                <img src={iconoX} alt="" />
              </button>
            </div>

            <nav
              className="inicio-menu-enlaces"
              aria-label={administrador ? "Administración" : "Navegación principal"}
            >
              <Link
                to="/catalogo"
                state={{ regresarA: administrador ? "/admin" : "/" }}
                onClick={() => setMenuAbierto(false)}
              >
                Catálogo
              </Link>
              {administrador && (
                <>
                  <Link
                    to="/admin/productos/crear"
                    onClick={() => setMenuAbierto(false)}
                  >
                    Agregar producto/os
                  </Link>
                  <button type="button" disabled>
                    Editar producto/os
                  </button>
                  <button type="button" disabled>
                    Eliminar producto/os
                  </button>
                  <Link
                    to="/catalogo"
                    state={{ regresarA: "/admin" }}
                    onClick={() => setMenuAbierto(false)}
                  >
                    Gestión de productos
                  </Link>
                </>
              )}
            </nav>

            {administrador && (
              <div className="inicio-menu-pie">
                <button
                  type="button"
                  onClick={() => {
                    setMenuAbierto(false);
                    setPerfilAbierto(true);
                  }}
                >
                  Cuenta <img src={iconoAjustes} alt="" />
                </button>
                <Link to="/" onClick={() => setMenuAbierto(false)}>
                  Cerrar sesión
                </Link>
              </div>
            )}
          </aside>
        </div>
      )}

      {administrador && perfilAbierto && (
        <div
          className="inicio-perfil-fondo"
          onClick={() => setPerfilAbierto(false)}
        >
          <section
            className="inicio-perfil-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inicio-perfil-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="inicio-menu-encabezado">
              <h2 id="inicio-perfil-titulo">Perfil administrador</h2>
              <button
                type="button"
                aria-label="Cerrar perfil"
                onClick={() => setPerfilAbierto(false)}
              >
                <img src={iconoX} alt="" />
              </button>
            </div>
            <p>Vista de demostración. El inicio de sesión aún no está conectado.</p>
          </section>
        </div>
      )}
    </main>
  );
}

export default Inicio;
