import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { productosIniciales } from "./datos/productos";
import Inicio from "./paginas/Inicio";
import InicioUsuario from "./paginas/InicioUsuario";
import InicioAdmin from "./paginas/InicioAdmin";
import Catalogo from "./paginas/Catalogo";
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