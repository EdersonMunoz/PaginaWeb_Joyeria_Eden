import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { productosIniciales } from "./datos/productos";
import Inicio from "./paginas/Inicio";
import InicioUsuario from "./paginas/InicioUsuario";
import InicioAdmin from "./paginas/InicioAdmin";
import Catalogo from "./paginas/Catalogo";
import GestionProductos from "./paginas/GestionProductos";
import ProductosInactivos from "./paginas/ProductosInactivos";
import RegistrarProducto from "./paginas/RegistrarProducto";
import EditarProducto from "./paginas/EditarProducto";

function App() {
  const [productos, setProductos] = useState(productosIniciales);

  const agregarProducto = (nuevo) => {
    setProductos([...productos, { ...nuevo, id: Date.now() }]);
  };

  const editarProducto = (id, cambios) => {
    setProductos(productos.map((p) => (p.id === id ? { ...p, ...cambios } : p)));
  };

  const cambiarEstadoProducto = (id, estado) => {
    setProductos((productosActuales) =>
      productosActuales.map((producto) =>
        producto.id === id ? { ...producto, estado } : producto,
      ),
    );
  };

  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/Usuario" element={<InicioUsuario />} />
      <Route path="/Admin" element={<InicioAdmin />} />
      <Route path="/Inicio/Catalogo" element={<Catalogo productos={productos} />} />
      <Route path="/Admin/Catalogo" element={<Catalogo productos={productos} />} />
      <Route path="/Usuario/Catalogo" element={<Catalogo productos={productos} />} />
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
        path="/Admin/ProductosInactivos"
        element={
          <ProductosInactivos
            productos={productos}
            cambiarEstadoProducto={cambiarEstadoProducto}
          />
        }
      />
      <Route
        path="/Admin/Productos/RegistrarProducto"
        element={<RegistrarProducto agregarProducto={agregarProducto} />}
      />
      <Route
        path="/Admin/Productos/ModificarProducto/:id"
        element={<EditarProducto productos={productos} editarProducto={editarProducto} />}
      />
      <Route
        path="/Admin/Productos/ModificarProducto"
        element={<EditarProducto productos={productos} editarProducto={editarProducto} />}
      />
    </Routes>
  );
}

export default App;