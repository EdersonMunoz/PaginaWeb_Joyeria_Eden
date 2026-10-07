import { useState } from "react";
import { Link } from "react-router-dom";
import Encabezado from "../componentes/Encabezado";
import "./IniciarSesion.css";

function IniciarSesion() {
  const [mensaje, setMensaje] = useState("");

  const manejarEnvio = (event) => {
    event.preventDefault();
    setMensaje(
      "La autenticación todavía no está conectada. No se inició ninguna sesión.",
    );
  };

  return (
    <main className="pagina-iniciar-sesion">
      <Encabezado />

      <section className="inicio-sesion-contenido" aria-labelledby="inicio-sesion-titulo">
        <form className="inicio-sesion-formulario" onSubmit={manejarEnvio}>
          <h1 id="inicio-sesion-titulo">Iniciar sesión</h1>
          <p className="inicio-sesion-introduccion">
            Ingresa los datos de tu cuenta para continuar.
          </p>

          <label htmlFor="inicio-sesion-correo">Correo electrónico</label>
          <input
            id="inicio-sesion-correo"
            name="correo"
            type="email"
            autoComplete="username"
            placeholder="nombre@ejemplo.com"
            required
          />

          <label htmlFor="inicio-sesion-contrasena">Contraseña</label>
          <input
            id="inicio-sesion-contrasena"
            name="contrasena"
            type="password"
            autoComplete="current-password"
            placeholder="Escribe tu contraseña"
            required
          />

          <button className="inicio-sesion-boton" type="submit">
            Iniciar sesión
          </button>

          {mensaje && (
            <p className="inicio-sesion-mensaje" role="status">
              {mensaje}
            </p>
          )}

          <Link className="inicio-sesion-volver" to="/">
            Volver al inicio
          </Link>
        </form>
      </section>
    </main>
  );
}

export default IniciarSesion;
