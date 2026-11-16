import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../componentes/AuthLayout";
import CustomInput from "../componentes/CustomInput";
import PrimaryButton from "../componentes/PrimaryButton";
import logo from "../assets/Logo-Eden.png";
import iconoCuenta from "../assets/iconossvg/iconoCuenta.svg";
import iconoCandado from "../assets/iconossvg/iconoCandado.svg";
import { iniciarSesion } from "../api";
import { guardarSesion } from "../sesion";
import "./InicioSesion.css";

function InicioSesion() {
  const navigate = useNavigate();
  const location = useLocation();
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState(location.state?.mensajeExito ?? "");
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (!mensaje) return undefined;
    const temporizador = window.setTimeout(() => {
      setMensaje("");
    }, 3000);
    return () => window.clearTimeout(temporizador);
  }, [mensaje]);

  const limpiarMensajeExito = () => {
    if (location.state?.mensajeExito) {
      navigate("/InicioSesion", { replace: true, state: null });
    }
    setMensaje("");
  };

  const ingresar = async (event) => {
    event.preventDefault();
    setMensaje("");
    const camposErrores = {
      usuario: !usuario.trim(),
      contrasena: !contrasena,
    };

    setErrores(camposErrores);
    if (Object.values(camposErrores).some(Boolean)) {
      setMensaje("Por favor, complete todos los campos obligatorios.");
      return;
    }

    const respuesta = await iniciarSesion(usuario, contrasena);
    if (!respuesta.ok) {
      setMensaje(
        respuesta.codigo === "CUENTA_NO_EXISTE"
          ? "Las credenciales ingresadas no corresponden a ninguna cuenta"
          : respuesta.codigo === "CREDENCIALES_INCORRECTAS"
            ? "Correo/Nombre usuario o contraseña incorrectos, vuelve a intentarlo"
            : respuesta.mensaje,
      );
      return;
    }

    setErrores({});
    const destino = respuesta.usuario?.rol?.toLowerCase() === "admin"
      ? "/Admin"
      : "/Usuario";
    guardarSesion(respuesta.usuario, respuesta.token);
    navigate(destino, { state: { usuario: respuesta.usuario } });
  };

  return (
    <AuthLayout>
      <div className="auth-content">
        <img src={logo} alt="EDEN" className="auth-logo auth-login-logo" />
        <h1>INICIAR SESIÓN</h1>
        <p className="auth-description">
          Accede a tu cuenta de Eden, ingresa tus datos para continuar
        </p>
        <form className="auth-form" onSubmit={ingresar} noValidate>
          <CustomInput
            icon={iconoCuenta}
            iconClassName="custom-input-icon-oscuro"
            label="Nombre de usuario o correo"
            value={usuario}
            onChange={(event) => {
              setUsuario(event.target.value);
              limpiarMensajeExito();
              setErrores((actuales) => ({ ...actuales, usuario: false }));
            }}
            autoComplete="username"
            error={errores.usuario}
          />
          <CustomInput
            icon={iconoCandado}
            label="Contraseña"
            type="password"
            value={contrasena}
            onChange={(event) => {
              setContrasena(event.target.value);
              limpiarMensajeExito();
              setErrores((actuales) => ({ ...actuales, contrasena: false }));
            }}
            autoComplete="current-password"
            error={errores.contrasena}
          />
          <PrimaryButton type="submit">Ingresar ahora</PrimaryButton>
        </form>
        <p className="auth-register">
          Aún no tienes una cuenta?{" "}
          <Link to="/Registro">Regístrate aquí</Link>
        </p>
      </div>
      {mensaje && createPortal(
        <div className={`auth-feedback ${location.state?.mensajeExito ? "is-success" : "is-error"}`} role="alert">
          <p>{mensaje}</p>
          <span className="auth-feedback-icon" aria-hidden="true">
            {location.state?.mensajeExito ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            )}
          </span>
        </div>
      , document.body)}
    </AuthLayout>
  );
}

export default InicioSesion;
