import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Encabezado from "../componentes/Encabezado";
import iconoCandado from "../assets/iconossvg/iconoCandado.svg";
import { actualizarCuenta, desactivarCuenta } from "../api";
import { actualizarUsuario, cerrarSesion, obtenerUsuario } from "../sesion";
import { esPasswordValida, esTelefonoValido } from "../validacionesCuenta";
import "./AjustesCuenta.css";
import "../componentes/EncabezadoFigma.css";

function AjustesCuenta() {
  const navigate = useNavigate();
  const location = useLocation();
  const esAdministrador = location.pathname.startsWith("/Admin/");
  const cuenta = obtenerUsuario();
  const nombreGuardado = cuenta?.nombre?.trim() ?? "";
  const partesNombre = nombreGuardado.split(/\s+/);
  const inicial = {
    nombre: cuenta?.nombres ?? cuenta?.nombreCompleto?.split(/\s+/)[0] ?? partesNombre.shift() ?? "",
    apellido: cuenta?.apellidos ?? cuenta?.apellido ?? partesNombre.join(" "),
    identificacion: cuenta?.identificacion ?? "",
    telefono: cuenta?.telefono ?? "",
    usuario: cuenta?.usuario ?? "",
    correo: cuenta?.correo ?? "",
    repetirCorreo: cuenta?.correo ?? "",
    password: "",
    repetirPassword: "",
    direccion: cuenta?.direccion ?? "",
  };
  const [formulario, setFormulario] = useState(inicial);
  const [guardado, setGuardado] = useState(inicial);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("success");
  const [confirmarDesactivacion, setConfirmarDesactivacion] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const cambiado = Object.keys(guardado).some((campo) => formulario[campo] !== guardado[campo]);

  useEffect(() => {
    if (!mensaje) return undefined;
    const temporizador = window.setTimeout(() => {
      setMensaje("");
      setTipoMensaje("success");
    }, 3000);
    return () => window.clearTimeout(temporizador);
  }, [mensaje]);

  const cambiar = (event) => {
    const { name, value } = event.target;
    const limpiarConfirmacion =
      name === "password" && value === "";
    const passwordNueva = name === "password" ? value : formulario.password;
    const passwordRepetida =
      name === "repetirPassword"
        ? value
        : limpiarConfirmacion
          ? ""
          : formulario.repetirPassword;
    setFormulario((actual) => ({
      ...actual,
      [name]: value,
      ...(limpiarConfirmacion ? { repetirPassword: "" } : {}),
    }));
    setErrores((actual) => ({
      ...actual,
      [name]: false,
      repetirPassword:
        Boolean(passwordNueva && passwordRepetida) &&
        passwordNueva !== passwordRepetida,
    }));
    setMensaje("");
    setTipoMensaje("success");
  };

  const actualizar = async (event) => {
    event.preventDefault();
    const nuevosErrores = {
      nombre: !formulario.nombre.trim(),
      apellido: !formulario.apellido.trim(),
      identificacion:
        !formulario.identificacion.trim() || formulario.identificacion.length > 30,
      telefono: !esTelefonoValido(formulario.telefono),
      usuario: !/^[a-zA-Z0-9._-]{3,30}$/.test(formulario.usuario),
      correo: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.correo),
      password: formulario.password ? !esPasswordValida(formulario.password) : false,
      direccion: !formulario.direccion.trim(),
    };
    if (formulario.correo !== inicial.correo && !formulario.repetirCorreo.trim()) {
      nuevosErrores.repetirCorreo = true;
    } else if (formulario.repetirCorreo && formulario.correo !== formulario.repetirCorreo) {
      nuevosErrores.repetirCorreo = true;
    }
    if (formulario.password && formulario.password !== formulario.repetirPassword) {
      nuevosErrores.repetirPassword = true;
    }
    setErrores(nuevosErrores);
    if (Object.values(nuevosErrores).some(Boolean)) {
      const erroresActivos = Object.entries(nuevosErrores).filter(([, error]) => error);
      const soloErroresCoincidencia =
        erroresActivos.length > 0 &&
        erroresActivos.every(([campo]) =>
          (campo === "repetirCorreo" &&
            formulario.repetirCorreo.trim() &&
            formulario.correo !== formulario.repetirCorreo) ||
          (campo === "repetirPassword" &&
            formulario.password &&
            formulario.repetirPassword &&
            formulario.password !== formulario.repetirPassword),
        );
      setMensaje(soloErroresCoincidencia
        ? "Alguno/s de los campos no coinciden, por favor verificar."
        : "Uno o más campos no cuentan con el formato adecuado");
      setTipoMensaje("error");
      return;
    }
    const datosActualizacion = {
      nombre: `${formulario.nombre.trim()} ${formulario.apellido.trim()}`.trim(),
      identificacion: formulario.identificacion.trim(),
      telefono: formulario.telefono.trim(),
      usuario: formulario.usuario,
      correo: formulario.correo,
      direccion: formulario.direccion.trim(),
    };
    if (formulario.password) {
      datosActualizacion.password = formulario.password;
    }
    const respuesta = await actualizarCuenta(cuenta?.id, datosActualizacion);
    if (!respuesta.ok) {
      setMensaje(respuesta.mensaje);
      setTipoMensaje("error");
      return;
    }
    const cuentaActualizada = {
      ...cuenta,
      nombre: `${formulario.nombre.trim()} ${formulario.apellido.trim()}`.trim(),
      identificacion: formulario.identificacion.trim(),
      telefono: formulario.telefono.trim(),
      usuario: formulario.usuario,
      correo: formulario.correo,
      direccion: formulario.direccion.trim(),
    };
    actualizarUsuario(cuentaActualizada);
    setGuardado({ ...formulario });
    setErrores({});
    setMensaje("Datos actualizados correctamente");
    setTipoMensaje("success");
  };

  const desactivar = async () => {
    const respuesta = await desactivarCuenta(cuenta?.id);
    if (!respuesta.ok) {
      setMensaje(respuesta.mensaje);
      setTipoMensaje("error");
      setConfirmarDesactivacion(false);
      return;
    }
    cerrarSesion();
    setConfirmarDesactivacion(false);
    navigate("/Inicio", {
      state: {
        mensaje:
          "Su cuenta ha sido desactivada exitosamente, recuerde que al volver a iniciar sesión su cuenta se activará nuevamente",
      },
    });
  };

  return (
    <main className="pagina-ajustes">
      <Encabezado
        administrador={esAdministrador}
        sesionIniciada
        ocultarIconoBusqueda
        ocultarCarrito={esAdministrador}
        ocultarTendencias
      />
      <div className="ajustes-contenido">
        <p className="ajustes-miga">
          <Link to={esAdministrador ? "/Admin" : "/Usuario"}>Inicio</Link>
          <span aria-hidden="true">\Ajustes_cuenta</span>
        </p>
        <section className="ajustes-panel" aria-labelledby="ajustes-titulo">
          <div className="ajustes-titulo">
            <h1 id="ajustes-titulo">AJUSTES DE LA CUENTA</h1>
          </div>
          <form onSubmit={actualizar} className="ajustes-form" noValidate>
            <div className="ajustes-columna">
              <Campo label="Nombres" name="nombre" value={formulario.nombre} error={errores.nombre} onChange={cambiar} />
              <Campo label="Apellidos" name="apellido" value={formulario.apellido} error={errores.apellido} onChange={cambiar} />
              <Campo label="Identificación" name="identificacion" value={formulario.identificacion} error={errores.identificacion} onChange={cambiar} maxLength={30} />
              <Campo label="Teléfono" name="telefono" value={formulario.telefono} error={errores.telefono} onChange={cambiar} />
              <Campo label="Nombre Usuario" name="usuario" value={formulario.usuario} error={errores.usuario} onChange={cambiar} />
            </div>
            <div className="ajustes-columna">
              <Campo label="Correo electrónico" name="correo" type="email" value={formulario.correo} error={errores.correo} onChange={cambiar} />
              <Campo
                label="Repetir correo electrónico"
                name="repetirCorreo"
                type="email"
                value={formulario.repetirCorreo}
                error={errores.repetirCorreo}
                onChange={cambiar}
                disabled={!formulario.correo || formulario.correo === inicial.correo}
                bloqueado={!formulario.correo || formulario.correo === inicial.correo}
              />
              <Campo
                label="Contraseña"
                name="password"
                type={passwordVisible ? "text" : "password"}
                value={formulario.password}
                error={errores.password}
                onChange={cambiar}
                placeholder="Deja vacío para conservar la contraseña actual"
                trailing={
                  <button type="button" className="ajustes-mostrar-password" aria-label={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setPasswordVisible((visible) => !visible)}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      {passwordVisible ? (
                        <>
                          <path d="m3 3 18 18" />
                          <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c5.1 0 8.5 4.8 9.5 7a17 17 0 0 1-3.1 4.1" />
                          <path d="M6.6 6.6C4.8 8 3.5 10 2.5 12c1 2.2 4.4 7 9.5 7 1.1 0 2.1-.2 3-.6" />
                        </>
                      ) : (
                        <>
                          <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                          <circle cx="12" cy="12" r="2.5" />
                        </>
                      )}
                    </svg>
                  </button>
                }
              />
              <Campo
                label="Repetir contraseña"
                name="repetirPassword"
                type="password"
                value={formulario.repetirPassword}
                error={errores.repetirPassword}
                onChange={cambiar}
                disabled={!formulario.password}
                bloqueado={!formulario.password}
                placeholder="Repite la nueva contraseña"
              />
              <Campo label="Dirección" name="direccion" value={formulario.direccion} error={errores.direccion} onChange={cambiar} />
              <div className="ajustes-acciones">
                <button className="ajustes-desactivar" type="button" onClick={() => setConfirmarDesactivacion(true)}>
                  Desactivar<br />Cuenta
                </button>
                <button className={`ajustes-actualizar${cambiado ? " activo" : ""}`} type="submit" disabled={!cambiado}>
                  Guardar
                </button>
              </div>
            </div>
          </form>
          {mensaje && (
            <div className={`ajustes-feedback ${tipoMensaje === "error" ? "error" : "success"}`} role="alert">
              <span className="ajustes-feedback-icon" aria-hidden="true">
                {tipoMensaje === "error" ? "×" : "✓"}
              </span>
              <p>{mensaje}</p>
            </div>
          )}
        </section>
      </div>
      {confirmarDesactivacion && (
        <div className="ajustes-modal-fondo" role="presentation">
          <section className="ajustes-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirmar-titulo">
            <h2 id="confirmar-titulo">¿Está seguro de que desea desactivar su cuenta?</h2>
            <p>Esta acción cerrará su sesión actual</p>
            <div>
              <button type="button" onClick={() => setConfirmarDesactivacion(false)}>Cancelar</button>
              <button type="button" className="confirmar" onClick={desactivar}>Confirmar</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function Campo({ label, name, type = "text", value, error, onChange, trailing, disabled = false, bloqueado = false, readOnly = false, placeholder = "", maxLength }) {
  return (
    <label className={`ajustes-campo${error ? " error" : ""}`}>
      <span className="ajustes-etiqueta">{label}{bloqueado ? <img src={iconoCandado} alt="" /> : <b>*</b>}</span>
      <span className="ajustes-entrada">
        <input aria-invalid={Boolean(error)} name={name} type={type} value={value} onChange={onChange} disabled={disabled} readOnly={readOnly} placeholder={placeholder} maxLength={maxLength} />
        {trailing}
      </span>
      {error && <small className="ajustes-error">Campo obligatorio o valor inválido</small>}
    </label>
  );
}

export default AjustesCuenta;
