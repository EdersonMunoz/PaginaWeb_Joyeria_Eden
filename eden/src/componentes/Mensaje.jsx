import { useEffect } from "react";
import { BookmarkCheck, X } from "lucide-react";
import "./Mensaje.css";

// Mensaje emergente en el centro de la pantalla, con el fondo difuminado.
// tipo: "exito" | "error". Se cierra con clic o con la tecla Esc.
// Sirve para las demás historias (por ejemplo, "Producto actualizado exitosamente").
export default function Mensaje({ tipo, texto, onCerrar }) {
  useEffect(() => {
    const alPresionar = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [onCerrar]);

  const esExito = tipo === "exito";

  return (
    <div className="mensaje-fondo" onClick={onCerrar}>
      <div
        className={`mensaje mensaje--${tipo}`}
        role={esExito ? "status" : "alert"}
        aria-live={esExito ? "polite" : "assertive"}
      >
        {esExito ? (
          <BookmarkCheck
            className="mensaje__icono"
            fill="var(--verde)"
            color="var(--blanco)"
            aria-hidden="true"
          />
        ) : (
          <X className="mensaje__icono" strokeWidth={1.5} aria-hidden="true" />
        )}
        <p className="mensaje__texto">{texto}</p>
      </div>
    </div>
  );
}
