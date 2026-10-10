import Catalogo from "./Catalogo";

function GestionProductos({ productos, cambiarEstadoProducto }) {
  return (
    <Catalogo
      productos={productos}
      modoGestion
      cambiarEstadoProducto={cambiarEstadoProducto}
    />
  );
}

export default GestionProductos;
