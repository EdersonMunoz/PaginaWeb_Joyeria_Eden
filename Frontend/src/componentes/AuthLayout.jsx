import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo.png";
import portada from "../assets/prototipoInicioSesion01.png";

function AuthLayout({
  children,
  activeTab = "login",
  onTabChange,
  portada: portadaPersonalizada,
}) {
  const navigate = useNavigate();

  const cambiarSeccion = (seccion) => {
    onTabChange?.(seccion);
    navigate(seccion === "login" ? "/InicioSesion" : "/Registro");
  };

  return (
    <main
      className={`auth-page${portadaPersonalizada ? " auth-page-register" : ""}`}
    >
      <section className="auth-card">
        <div className="auth-panel">{children}</div>
        <div
          className="auth-cover"
          style={{
            backgroundImage: `url("${portadaPersonalizada ?? portada}")`,
          }}
          aria-label="Joyería y Perfumería EDEN"
        >
          <div className="auth-cover-copy">
            <p>Joyería y Perfumería</p>
            <strong>EDEN</strong>
          </div>
        </div>
        <div className="auth-tabs" role="tablist" aria-label="Acceso a la cuenta">
          <button
            className={activeTab === "login" ? "is-active" : ""}
            type="button"
            role="tab"
            aria-selected={activeTab === "login"}
            onClick={() => cambiarSeccion("login")}
          >
            Inicia sesión
          </button>
          <button
            className={activeTab === "register" ? "is-active" : ""}
            type="button"
            role="tab"
            aria-selected={activeTab === "register"}
            onClick={() => cambiarSeccion("register")}
          >
            Regístrate
          </button>
        </div>
      </section>
      <img src={logo} alt="EDEN" className="auth-hidden-logo" />
    </main>
  );
}

export default AuthLayout;
