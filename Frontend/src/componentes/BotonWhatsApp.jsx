import { useEffect } from "react";
import { construirEnlaceWhatsApp } from "../whatsapp";
import "./BotonWhatsApp.css";

// Número del asesor (con código de país, solo dígitos) y mensaje inicial del chat.
// Se configuran en el .env del frontend (ver .env.example).
const NUMERO_ASESOR = import.meta.env.VITE_WHATSAPP_NUMERO ?? "";
const MENSAJE_INICIAL =
  import.meta.env.VITE_WHATSAPP_MENSAJE ?? "Hola, necesito ayuda con la tienda EDEN.";

// Sprint 4 · HE4-HU1-CA001: botón flotante que abre el chat de WhatsApp del asesor en una
// pestaña nueva (WhatsApp Web en el computador o la app en el celular).
function BotonWhatsApp() {
  const enlace = construirEnlaceWhatsApp(NUMERO_ASESOR, MENSAJE_INICIAL);

  useEffect(() => {
    if (!NUMERO_ASESOR) {
      console.warn("Falta VITE_WHATSAPP_NUMERO en el .env del frontend: el botón de WhatsApp abre wa.me sin número.");
    }
  }, []);

  return (
    <a
      className="boton-whatsapp"
      href={enlace || "https://wa.me/"}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar a un asesor por WhatsApp"
      title="Contactar a un asesor por WhatsApp"
    >
      <svg
        className="boton-whatsapp-icono"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path
          fill="currentColor"
          d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.18 2.095 3.195 5.076 4.483.709.3 1.263.489 1.694.626.712.226 1.36.195 1.871.12.571-.09 1.758-.72 2.006-1.425.247-.705.247-1.289.173-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411"
        />
      </svg>
    </a>
  );
}

export default BotonWhatsApp;
