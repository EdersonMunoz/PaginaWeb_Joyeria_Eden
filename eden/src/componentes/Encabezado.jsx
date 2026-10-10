import "./Encabezado.css";

import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import iconoOpciones from "../assets/Iconos_HU2/iconoOpciones.png"; 
import iconoLupa from "../assets/Iconos_HU2/iconoLupa.png";
import logo from "../assets/Iconos_HU2/Logo.png";
import iconoCarrito from "../assets/Iconos_HU2/iconoCarrito.png";
import iconoCorazon from "../assets/Iconos_HU2/iconoCorazon.png";
import iconoTendencias from "../assets/iconoTendencias.png";
import iconoCuenta from "../assets/iconoCuenta.png";
import iconoAjustes from "../assets/iconoAjustes.png";
import iconoX from "../assets/iconoX.png";

function Encabezado({
  acciones,
  busquedaAbierta = false,
  consulta = "",
  onAbrirBusqueda,
  onVerPerfil,
  onCerrarBusqueda,
  onCambiarConsulta,
  administrador = false,
  sesionIniciada = false,
  mostrarLogin = false,
  ocultarCarrito = false,
  ocultarTendencias = false,
  mostrarTendencias = false,
}) {
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const esAdministrador =
    administrador || location.pathname.startsWith("/Admin");
  const esUsuario = sesionIniciada && !esAdministrador;
  const rutaCatalogo = esAdministrador
    ? "/Admin/Catalogo"
    : esUsuario
      ? "/Usuario/Catalogo"
      : "/Inicio/Catalogo";
  const rutaInicio = esAdministrador ? "/Admin" : esUsuario ? "/Usuario" : "/";

  useEffect(() => {
    if (!menuAbierto) {
      return undefined;
    }

    const cerrarConEscape = (event) => {
      if (event.key === "Escape") {
        setMenuAbierto(false);
      }
    };

    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [menuAbierto]);

  if (busquedaAbierta) {
    return (
      <header className="encabezado encabezado-busqueda">
        <div className="contenedor-logo encabezado-busqueda-logo">
          <img src={logo} alt="EDEN" className="encabezado-logo" />
        </div>

        <label className="encabezado-campo-busqueda">
          <img src={iconoLupa} alt="" />
          <span className="visualmente-oculto">Buscar productos</span>
          <input
            type="search"
            placeholder="Buscar"
            value={consulta}
            onChange={(event) => onCambiarConsulta(event.target.value)}
            autoFocus
          />
        </label>

        <button
          className="encabezado-cerrar-busqueda"
          type="button"
          onClick={onCerrarBusqueda}
        >
          Cerrar
        </button>
      </header>
    );
  }

  return (
    <header className="encabezado">
      <div className="encabezado-izquierda">
        <button
          className="icono-subrayado encabezado-boton-menu"
          type="button"
          aria-label="Abrir menú"
          aria-expanded={menuAbierto}
          onClick={() => setMenuAbierto(true)}
        >
          <img src={iconoOpciones} alt="" className="encabezado-icono" />
        </button>

        {/* Ícono Lupa con su rayita verde */}
        {onAbrirBusqueda ? (
          <button
            className="icono-subrayado encabezado-boton-buscar"
            type="button"
            aria-label="Abrir búsqueda"
            onClick={onAbrirBusqueda}
          >
            <img src={iconoLupa} alt="" className="encabezado-icono" />
          </button>
        ) : (
          <div className="icono-subrayado">
            <img src={iconoLupa} alt="Buscar" className="encabezado-icono" />
          </div>
        )}
      </div>

      {/* Logo central con su línea verde */}
      <div className="contenedor-logo">
        <img src={logo} alt="EDEN" className="encabezado-logo" />
      </div>

      <div className="encabezado-derecha-contenido">
        <div className="encabezado-derecha">
          {(administrador || sesionIniciada || mostrarLogin) && (
            onVerPerfil ? (
              <button
                className="boton-login"
                type="button"
                onClick={onVerPerfil}
                aria-label="Ver perfil"
              >
                <img src={iconoCuenta} alt="" />
                Ver perfil
              </button>
            ) : (
              <span className="boton-login encabezado-login-estatico">
                <img src={iconoCuenta} alt="" />
                {administrador || sesionIniciada ? "Ver perfil" : "User login"}
              </span>
            )
          )}

          {!ocultarCarrito && (
            <div className="icono-subrayado">
              <img src={iconoCarrito} alt="Carrito" className="encabezado-icono" />
            </div>
          )}

          <div className="icono-subrayado">
            <img
              src={administrador && mostrarTendencias && !ocultarTendencias ? iconoTendencias : iconoCorazon}
              alt={administrador && mostrarTendencias && !ocultarTendencias ? "Tendencias" : "Favoritos"}
              className="encabezado-icono"
            />
          </div>
        </div>
        {acciones && <div className="encabezado-acciones">{acciones}</div>}
      </div>
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

            <nav className="inicio-menu-enlaces" aria-label="Navegación principal">
              <Link to={rutaInicio} onClick={() => setMenuAbierto(false)}>
                Inicio
              </Link>
              <Link to={rutaCatalogo} onClick={() => setMenuAbierto(false)}>
                Catálogo
              </Link>
              {esAdministrador ? (
                <>
                  <Link
                    to="/Admin/Productos/RegistrarProducto"
                    onClick={() => setMenuAbierto(false)}
                  >
                    Agregar producto/os
                  </Link>
                  <Link
                    to="/Admin/Productos/ModificarProducto"
                    onClick={() => setMenuAbierto(false)}
                  >
                    Editar producto/os
                  </Link>
                  <Link
                    to="/Admin/GestionProductos"
                    onClick={() => setMenuAbierto(false)}
                  >
                    Gestión de productos
                  </Link>
                  <Link
                    to="/Admin/ProductosInactivos"
                    onClick={() => setMenuAbierto(false)}
                  >
                    Productos inactivos
                  </Link>
                </>
              ) : (
                <>
                  <button type="button">Historial de pedidos</button>
                  <button type="button">Mis favoritos</button>
                </>
              )}
            </nav>
            {sesionIniciada && (
              <div className="inicio-menu-pie">
                <button type="button">
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
    </header>
  );
}

export default Encabezado;