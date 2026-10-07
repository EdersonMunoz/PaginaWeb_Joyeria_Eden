import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { productosIniciales } from "./datos/productos";
import Inicio from "./paginas/Inicio";
import SesionIniciadaAdmin from "./paginas/SesionIniciadaAdmin";
import IniciarSesion from "./paginas/IniciarSesion";
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
      <Route path="/" element={<Inicio />} />
      <Route path="/iniciar-sesion" element={<IniciarSesion />} />
      <Route path="/admin" element={<SesionIniciadaAdmin />} />
      <Route path="/catalogo" element={<Catalogo productos={productos} />} />
      <Route
        path="/admin/productos/crear"
        element={<RegistrarProducto agregarProducto={agregarProducto} />}
      />
      <Route
        path="/admin/productos/editar/:id"
        element={<EditarProducto productos={productos} editarProducto={editarProducto} />}
      />
    </Routes>
  );
}

export default App;