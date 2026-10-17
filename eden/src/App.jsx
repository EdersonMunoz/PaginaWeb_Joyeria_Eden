import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { productosIniciales } from "./datos/productos";
import Inicio from "./paginas/Inicio";
import InicioUsuario from "./paginas/InicioUsuario";
import InicioAdmin from "./paginas/InicioAdmin";
import Catalogo from "./paginas/Catalogo";
import GestionProductos from "./paginas/GestionProductos";
import RegistrarProducto from "./paginas/RegistrarProducto";
import EditarProducto from "./paginas/EditarProducto";

function App() {
  const [productos, setProductos] = useState(productosIniciales);

  const agregarProducto = (nuevo) => {
    const estado =
      Number(nuevo.stock) > 0 && nuevo.estado !== "Inactivo"
        ? "Activo"
        : "Inactivo";
    setProductos((actuales) => [
      ...actuales,
      { ...nuevo, id: Date.now(), estado },
    ]);
  };

  const editarProducto = (id, cambios) => {
    setProductos((actuales) =>
      actuales.map((producto) => {
        if (producto.id !== id) {
          return producto;
        }

        const actualizado = { ...producto, ...cambios };
        if (Number(actualizado.stock) <= 0) {
          actualizado.estado = "Inactivo";
        }
        return actualizado;
      }),
    );
  };

  const cambiarEstadoProducto = (id, estado) => {
    setProductos((actuales) =>
      actuales.map((producto) => {
        if (producto.id !== id) {
          return producto;
        }

        return {
          ...producto,
          estado:
            estado === "Activo" && Number(producto.stock) <= 0
              ? "Inactivo"
              : estado,
        };
      }),
    );
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Inicio" replace />} />
      <Route path="/Inicio" element={<Inicio />} />
      <Route path="/Usuario" element={<InicioUsuario productos={productos} />} />
      <Route path="/Admin" element={<InicioAdmin productos={productos} />} />
      <Route path="/Inicio/Catalogo" element={<Catalogo productos={productos} />} />
      <Route path="/Admin/Catalogo" element={<Catalogo productos={productos} />} />
      <Route path="/Usuario/Catalogo" element={<Catalogo productos={productos} />} />
      <Route
        path="/Admin/RegistrarProducto"
        element={<RegistrarProducto agregarProducto={agregarProducto} />}
      />
      <Route
        path="/Admin/GestionProductos"
        element={
          <GestionProductos
            productos={productos}
            cambiarEstadoProducto={cambiarEstadoProducto}
          />
        }
      />
      <Route
        path="/Admin/ModificarProducto/:id"
        element={<EditarProducto productos={productos} editarProducto={editarProducto} />}
      />
      <Route
        path="/Admin/ModificarProducto"
        element={<EditarProducto productos={productos} editarProducto={editarProducto} />}
      />
    </Routes>
  );
}

export default App;