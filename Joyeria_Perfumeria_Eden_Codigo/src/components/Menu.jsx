import { useState } from "react";
import logoJoyeria from "../assets/LogoJoyeriaEden.png";
import iconoLupa from "../assets/iconoLupa.png";
import iconoOpciones from "../assets/iconoOpciones.png";
import iconoCarrito from "../assets/iconoCarrito.png";
import iconoCuenta from "../assets/iconoCuenta.png";

function Menu() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* Barra de navegación principal */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "15px 40px",
          backgroundColor: "#FDFBF7",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Lado izquierdo: Icono opciones + Lupa */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "30px" }}>
          <div
            onClick={() => setMenuAbierto(true)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <img
              src={iconoOpciones}
              alt="Abrir menú"
              style={{
                width: "24px",
                height: "24px",
                objectFit: "contain",
                marginBottom: "8px",
              }}
            />
            <div
              style={{
                width: "40px",
                height: "2px",
                backgroundColor: "#0F4D38",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <img
              src={iconoLupa}
              alt="Buscar"
              style={{
                width: "24px",
                height: "24px",
                objectFit: "contain",
                marginBottom: "8px",
              }}
            />
            <div
              style={{
                width: "40px",
                height: "2px",
                backgroundColor: "#0F4D38",
              }}
            />
          </div>
        </div>

        {/* Logo con línea debajo */}
        <div style={{ textAlign: "center" }}>
          <img
            src={logoJoyeria}
            alt="Logo Joyería"
            style={{ width: "200px", height: "auto", objectFit: "contain" }}
          />
          <div
            style={{
              width: "80%",
              height: "2px",
              backgroundColor: "#0F4D38",
              margin: "8px auto 0 auto",
            }}
          />
        </div>

        {/* Lado derecho: Botón + Carrito */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <a
            href="#login"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 28px",
              backgroundColor: "#0F4D38",
              borderRadius: "999px",
              textDecoration: "none",
              color: "#FFFFFF",
              fontSize: "16px",
              fontWeight: "500",
              lineHeight: "1",
            }}
          >
            <img
              src={iconoCuenta}
              alt="Icono cuenta"
              style={{ width: "20px", height: "20px", objectFit: "contain" }}
            />
            User login
          </a>
          <img
            src={iconoCarrito}
            alt="Carrito de compras"
            style={{
              width: "26px",
              height: "26px",
              objectFit: "contain",
              cursor: "pointer",
            }}
          />
        </div>
      </nav>

      
      {menuAbierto && (
        <div
          onClick={() => setMenuAbierto(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: "999",
          }}
        />
      )}

      {menuAbierto && (
        <div
          style={{
            position: "fixed",     // Se mantiene fijo en pantalla
            top: 0,
            left: 0,
            width: "320px",        // Ancho controlado
            maxWidth: "100%",
            height: "100vh",       // Toda la altura visible
            backgroundColor: "#FDFBF7",
            boxShadow: "4px 0 15px rgba(0,0,0,0.15)",
            zIndex: "1000",
            display: "flex",
            flexDirection: "column",
            padding: "40px 30px",
            boxSizing: "border-box",
            overflowY: "auto",     // Si hay mucho contenido, se desplaza
          }}
        >
          {/* Botón de cerrar */}
          <button
            onClick={() => setMenuAbierto(false)}
            style={{
              alignSelf: "flex-end",
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#333",
              marginBottom: "20px",
            }}
          >
            ✕
          </button>

          {/* Opciones del menú */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "25px" }}
          >
            <a
              href="#inicio"
              style={{
                textDecoration: "none",
                fontSize: "18px",
                color: "#333",
                fontWeight: "500",
              }}
            >
              Inicio
            </a>
            <a
              href="#colecciones"
              style={{
                textDecoration: "none",
                fontSize: "18px",
                color: "#333",
                fontWeight: "500",
              }}
            >
              Colecciones
            </a>
            <a
              href="#joyeria"
              style={{
                textDecoration: "none",
                fontSize: "18px",
                color: "#333",
                fontWeight: "500",
              }}
            >
              Joyería
            </a>
            <a
              href="#perfumeria"
              style={{
                textDecoration: "none",
                fontSize: "18px",
                color: "#333",
                fontWeight: "500",
              }}
            >
              Perfumería
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default Menu;