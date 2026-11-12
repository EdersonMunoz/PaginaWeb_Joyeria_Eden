import { Navigate } from "react-router-dom";
import { decidirAcceso, obtenerUsuario } from "../sesion";

function RutaProtegida({ rol, children }) {
  const acceso = decidirAcceso(obtenerUsuario(), rol);
  return acceso === "permitir" ? children : <Navigate to={acceso} replace />;
}

export default RutaProtegida;
