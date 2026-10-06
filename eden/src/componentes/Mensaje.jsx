import { useEffect } from "react";

// Mensaje emergente en el centro de la pantalla, con el fondo difuminado.
// Usa los estilos de los modales de la HU2 (paginas/PaginaProducto.css).
// tipo: "exito" | "error". Se cierra solo, con un clic o con la tecla Esc.
function Mensaje({ tipo, texto, onCerrar }) {
  useEffect(() => {
    const alPresionar = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [onCerrar]);

  const esExito = tipo === "exito";

  return (
    <div className="overlay-modal" onClick={onCerrar}>
      <div
        className={`modal-contenido ${esExito ? "modal-exito" : "modal-error"}`}
        role={esExito ? "status" : "alert"}
      >
        {esExito ? (
          // Marcador con chulo, como en Prototipo_ProdRegExitoso
          <svg className="icono-modal-exito" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 2h14a1 1 0 0 1 1 1v19l-8-5-8 5V3a1 1 0 0 1 1-1z" fill="#1b4d3e" />
            <path
              d="M8.5 9.5l2.5 2.5 4.5-4.5"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg
            className="icono-modal-error"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d93025"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}

        {esExito ? (
          <span>{texto}</span>
        ) : (
          <div className="texto-modal-error">
            <p>{texto}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Mensaje;
