import "./Encabezado.css";
import { useNavigate } from "react-router-dom";

import iconoOpciones from "../assets/Iconos_HU2/iconoOpciones.png"; 
import iconoLupa from "../assets/Iconos_HU2/iconoLupa.png";
import logo from "../assets/Iconos_HU2/Logo.png";
import iconoCarrito from "../assets/Iconos_HU2/iconoCarrito.png";
import iconoCorazon from "../assets/Iconos_HU2/iconoCorazon.png";
import iconoRegresar from "../assets/iconoRegresar.png";

function Encabezado({
  acciones,
  busquedaAbierta = false,
  consulta = "",
  onAbrirBusqueda,
  onAbrirMenu,
  onRegresar,
  onVerPerfil,
  onCerrarBusqueda,
  onCambiarConsulta,
  administrador = false,
}) {
  const navigate = useNavigate();

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
        {onRegresar && (
          <button
            className="icono-subrayado encabezado-boton-regresar"
            type="button"
            aria-label="Regresar"
            onClick={onRegresar}
          >
            <img src={iconoRegresar} alt="" className="encabezado-icono" />
          </button>
        )}
        {onAbrirMenu ? (
          <button
            className="icono-subrayado encabezado-boton-menu"
            type="button"
            aria-label="Abrir menú"
            onClick={onAbrirMenu}
          >
            <img src={iconoOpciones} alt="" className="encabezado-icono" />
          </button>
        ) : (
          <div className="icono-subrayado">
            <img src={iconoOpciones} alt="Opciones" className="encabezado-icono" />
          </div>
        )}

        {/* Ícono Lupa con su rayita verde */}
        <button
          className="icono-subrayado encabezado-boton-buscar"
          type="button"
          aria-label="Abrir búsqueda"
          onClick={onAbrirBusqueda}
        >
          <img src={iconoLupa} alt="Buscar" className="encabezado-icono" />
        </button>
      </div>

      {/* Logo central con su línea verde */}
      <div className="contenedor-logo">
        <img src={logo} alt="EDEN" className="encabezado-logo" />
      </div>

      <div className="encabezado-derecha-contenido">
        <div className="encabezado-derecha">
          <button
            className="boton-login"
            type="button"
            onClick={administrador ? onVerPerfil : () => navigate("/iniciar-sesion")}
            aria-label={administrador ? "Ver perfil" : "User login"}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            {administrador ? "Ver perfil" : "User login"}
          </button>

          <div className="icono-subrayado">
            <img src={iconoCarrito} alt="Carrito" className="encabezado-icono" />
          </div>

          <div className="icono-subrayado">
            <img src={iconoCorazon} alt="Favoritos" className="encabezado-icono" />
          </div>
        </div>
        {acciones && <div className="encabezado-acciones">{acciones}</div>}
      </div>
    </header>
  );
}

export default Encabezado;