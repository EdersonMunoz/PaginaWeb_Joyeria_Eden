import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registrarCuenta } from "../api";
import {
  esCorreoValido,
  esPasswordValida,
  esTelefonoValido,
  esUsuarioValido,
} from "../validacionesCuenta";
import AuthLayout from "../componentes/AuthLayout";
import PrimaryButton from "../componentes/PrimaryButton";
import fondoRegistro from "../assets/fondo_Prototipo_Registrar_Cuenta.jpg";
import "./InicioSesion.css";

const camposIniciales = {
  nombre: "",
  apellido: "",
  identificacion: "",
  telefono: "",
  usuario: "",
  correo: "",
  repetirCorreo: "",
  password: "",
  confirmarPassword: "",
  direccion: "",
};

function RegistroCuenta() {
  const navigate = useNavigate();
  const [campos, setCampos] = useState(camposIniciales);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [mensajeError, setMensajeError] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false);

  useEffect(() => {
    if (!mensaje) return undefined;
    const temporizador = window.setTimeout(() => setMensaje(""), 3000);
    return () => window.clearTimeout(temporizador);
  }, [mensaje]);

  useEffect(() => {
    if (!registroExitoso) return undefined;
    const temporizador = window.setTimeout(() => {
      navigate("/InicioSesion", {
        state: { mensajeExito: "Se registro la cuenta con exito" },
      });
    }, 3000);
    return () => window.clearTimeout(temporizador);
  }, [registroExitoso, navigate]);

  const cambiarCampo = (event) => {
    const { name, value } = event.target;
    setCampos((actuales) => ({ ...actuales, [name]: value }));
    setErrores((actuales) => ({ ...actuales, [name]: "" }));
    setMensaje("");
    setMensajeError(false);
  };

  const registrar = async (event) => {
    event.preventDefault();
    const nuevosErrores = {};
    if (!campos.nombre.trim()) nuevosErrores.nombre = "Este campo es obligatorio";
    if (!campos.apellido.trim()) nuevosErrores.apellido = "Este campo es obligatorio";
    if (!campos.identificacion.trim() || campos.identificacion.length > 30) {
      nuevosErrores.identificacion = "Este campo es obligatorio";
    }
    if (!campos.telefono.trim()) {
      nuevosErrores.telefono = "Este campo es obligatorio";
    } else if (!esTelefonoValido(campos.telefono)) {
      nuevosErrores.telefono = "Ingresa un teléfono válido";
    }
    if (!campos.usuario.trim()) {
      nuevosErrores.usuario = "Este campo es obligatorio";
    } else if (!esUsuarioValido(campos.usuario)) {
      nuevosErrores.usuario = "Ingresa un nombre de usuario válido";
    }
    if (!campos.correo.trim()) {
      nuevosErrores.correo = "Este campo es obligatorio";
    } else if (!esCorreoValido(campos.correo)) {
      nuevosErrores.correo = "Ingresa un correo válido";
    }
    if (!campos.repetirCorreo.trim()) {
      nuevosErrores.repetirCorreo = "Este campo es obligatorio";
    }
    if (!campos.direccion.trim()) nuevosErrores.direccion = "Este campo es obligatorio";
    if (campos.repetirCorreo && campos.correo !== campos.repetirCorreo) {
      nuevosErrores.repetirCorreo = "Los correos no coinciden";
    }
    if (!campos.password) {
      nuevosErrores.password = "Este campo es obligatorio";
    } else if (!esPasswordValida(campos.password)) {
      nuevosErrores.password = campos.password.length < 8
        ? "La contraseña debe tener mínimo 8 caracteres"
        : "La contraseña no puede contener solo espacios en blanco";
    }
    if (!campos.confirmarPassword) {
      nuevosErrores.confirmarPassword = "Este campo es obligatorio";
    }
    if (campos.confirmarPassword && campos.password !== campos.confirmarPassword) {
      nuevosErrores.confirmarPassword = "Las contraseñas no coinciden";
    }

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length) {
      const camposVacios = Object.entries(campos).some(([nombre, valor]) =>
        nombre === "password" || nombre === "confirmarPassword"
          ? valor === ""
          : !valor.trim(),
      );
      const erroresSoloDeCoincidencia =
        !camposVacios &&
        Object.values(nuevosErrores).every((error) =>
          error === "Los correos no coinciden" ||
          error === "Las contraseñas no coinciden",
        );
      setMensaje(camposVacios
        ? "Por favor, complete todos los campos obligatorios."
        : erroresSoloDeCoincidencia
          ? "Alguno/s de los campos no coinciden, por favor verificar."
          : "Uno o más campos no cuentan con el formato adecuado");
      setMensajeError(true);
      return;
    }

    const respuesta = await registrarCuenta({
      nombre: `${campos.nombre.trim()} ${campos.apellido.trim()}`.trim(),
      identificacion: campos.identificacion.trim(),
      telefono: campos.telefono.trim(),
      usuario: campos.usuario,
      correo: campos.correo,
      direccion: campos.direccion.trim(),
      password: campos.password,
    });
    if (!respuesta.ok) {
      setMensaje(respuesta.mensaje);
      setMensajeError(true);
      return;
    }

    setMensaje("Se registro la cuenta con exito");
    setMensajeError(false);
    setRegistroExitoso(true);
  };

  return (
    <AuthLayout
      activeTab="register"
      portada={fondoRegistro}
    >
      <div className="auth-content auth-register-content">
        <div className="register-fields-scroll">
          <div className="register-inner">
            <h1>REGISTRAR CUENTA</h1>
            <p className="auth-description">
              Regístrate para acceder a todo lo que Eden tiene para ofrecerte.
            </p>
            <form className="auth-form register-form" onSubmit={registrar} noValidate>



            <Campo
              label="Nombres"
              placeholder="Digite aquí su nombre/s"
              name="nombre"
              value={campos.nombre}
              error={errores.nombre}
              onChange={cambiarCampo}
            />
            <Campo
              label="Apellidos"
              placeholder="Digite aquí sus apellidos"
              name="apellido"
              value={campos.apellido}
              error={errores.apellido}
              onChange={cambiarCampo}
            />
            <Campo
              label="Identificación"
              placeholder="Digite aquí su número de identificación"
              name="identificacion"
              value={campos.identificacion}
              error={errores.identificacion}
              onChange={cambiarCampo}
              maxLength={30}
            />
            <Campo
              label="Teléfono"
              placeholder="Digite aquí su número de teléfono"
              name="telefono"
              value={campos.telefono}
              error={errores.telefono}
              onChange={cambiarCampo}
            />
             <Campo
  label="Nombre Usuario"
  placeholder="Recuerde al crear un nombre de usuario este no debe contener espacios"
  name="usuario"
  multilinea
  value={campos.usuario}
  error={errores.usuario}
  onChange={cambiarCampo}
/>
            <Campo
              label="Correo electrónico"
              placeholder="Digite aquí su correo electrónico"
              name="correo"
              type="email"
              value={campos.correo}
              error={errores.correo}
              onChange={cambiarCampo}
            />
            <Campo
              label="Repetir correo electrónico"
              placeholder="Digite nuevamente aquí su correo electrónico"
              name="repetirCorreo"
              type="email"
              value={campos.repetirCorreo}
              error={errores.repetirCorreo}
              onChange={cambiarCampo}
            />
            <Campo
              label="Contraseña"
              placeholder="Digite aquí su contraseña"
              name="password"
              type="password"
              value={campos.password}
              error={errores.password}
              onChange={cambiarCampo}
            />
            <Campo
              label="Repetir contraseña"
              placeholder="Confirme aquí su contraseña"
              name="confirmarPassword"
              type="password"
              value={campos.confirmarPassword}
              error={errores.confirmarPassword}
              onChange={cambiarCampo}
            />
            <Campo
              label="Dirección"
              placeholder="Digite aquí su dirección"
              name="direccion"
              value={campos.direccion}
              error={errores.direccion}
              onChange={cambiarCampo}
            />
            <PrimaryButton type="submit">Registrar</PrimaryButton>
          </form>
        </div>
      </div>
      </div>
      {mensaje && createPortal(
        <div className={`auth-feedback ${mensajeError ? "is-error" : "is-success"}`} role="alert">
          <p>{mensaje}</p>
          <span className="auth-feedback-icon" aria-hidden="true">
            {mensajeError ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            )}
          </span>
        </div>,
        document.body,
      )}
    </AuthLayout>
  );
}

function Campo({
  label,
  placeholder = label,
  name,
  type = "text",
  value,
  error,
  onChange,
  multilinea = false,
  maxLength,
}) {
  const [mostrar, setMostrar] = useState(false);
  const esPassword = type === "password";

  const propiedades = {
    "aria-invalid": Boolean(error),
    name,
    placeholder,
    value,
    onChange,
    maxLength,
  };

  return (
    <label className={`register-field ${error ? "has-error" : ""}`}>
      <span className="register-field-label">
        {label}<b aria-hidden="true">*</b>
      </span>
      <span className="register-field-control">
        {multilinea ? (
          <textarea
            {...propiedades}
            rows={2}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.preventDefault();
            }}
          />
        ) : esPassword ? (
          <>
            <span className="register-password-wrap">
              <input
                {...propiedades}
                type={mostrar ? "text" : "password"}
                className={mostrar ? "" : "register-password-oculta"}
                autoComplete="new-password"
              />
              {!mostrar && (
                <span className="register-password-mask" aria-hidden="true">
                  {"*".repeat(value.length)}
                </span>
              )}
            </span>
            <button
              type="button"
              className="register-password-toggle"
              onClick={() => setMostrar((actual) => !actual)}
              aria-label={mostrar ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {mostrar ? <IconoOjoTachado /> : <IconoOjo />}
            </button>
          </>
        ) : (
          <input {...propiedades} type={type} />
        )}
      </span>
      {error && <span className="register-field-error">{error}</span>}
    </label>
  );
}

function IconoOjo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconoOjoTachado() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

export default RegistroCuenta;
