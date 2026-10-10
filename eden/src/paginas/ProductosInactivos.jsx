import Catalogo from "./Catalogo";

function ProductosInactivos({ productos, cambiarEstadoProducto }) {
  return (
    <Catalogo
      productos={productos}
      modoGestion
      modoInactivos
      cambiarEstadoProducto={cambiarEstadoProducto}
    />
  );
}

export default ProductosInactivos;
