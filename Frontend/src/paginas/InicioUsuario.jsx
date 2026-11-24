import Inicio from "./Inicio";

function InicioUsuario({ productos, carrito = [] }) {
  return <Inicio usuario productos={productos} carrito={carrito} />;
}

export default InicioUsuario;
