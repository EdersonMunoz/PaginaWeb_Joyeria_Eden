import React from "react";
import "./Encabezado.css";

import iconoOpciones from "../assets/Iconos_HU2/iconoOpciones.png"; 
import iconoLupa from "../assets/Iconos_HU2/iconoLupa.png";
import logo from "../assets/Iconos_HU2/Logo.png";
import iconoCarrito from "../assets/Iconos_HU2/iconoCarrito.png";
import iconoCorazon from "../assets/Iconos_HU2/iconoCorazon.png";

function Encabezado() {
  return (
    <header className="encabezado">
      <div className="encabezado-izquierda">
        {/* Ícono Opciones con su rayita verde */}
        <div className="icono-subrayado">
          <img src={iconoOpciones} alt="Opciones" className="encabezado-icono" />
        </div>

        {/* Ícono Lupa con su rayita verde */}
        <div className="icono-subrayado">
          <img src={iconoLupa} alt="Buscar" className="encabezado-icono" />
        </div>
      </div>

      {/* Logo central con su línea verde */}
      <div className="contenedor-logo">
        <img src={logo} alt="EDEN" className="encabezado-logo" />
      </div>

      <div className="encabezado-derecha">
        <button className="boton-login">
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
          User login
        </button>

        {/* Ícono Carrito con su rayita verde */}
        <div className="icono-subrayado">
          <img src={iconoCarrito} alt="Carrito" className="encabezado-icono" />
        </div>

        {/* Ícono Corazón */}
        <div className="icono-subrayado">
        <img src={iconoCorazon} alt="Favoritos" className="encabezado-icono" />
        </div>
      </div>
    </header>
  );
}

export default Encabezado;