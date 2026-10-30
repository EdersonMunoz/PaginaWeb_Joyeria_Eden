import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import * as api from "./api";
import Inicio from "./paginas/Inicio";
import InicioUsuario from "./paginas/InicioUsuario";
import InicioAdmin from "./paginas/InicioAdmin";
import Catalogo from "./paginas/Catalogo";
import GestionProductos from "./paginas/GestionProductos";
import RegistrarProducto from "./paginas/RegistrarProducto";
import EditarProducto from "./paginas/EditarProducto";

function App() {
  // Los productos vienen de la base de datos Oracle a través del backend
  const [productos, setProductos] = useState([]);
  const [errorConexion, setErrorConexion] = useState("");

  useEffect(() => {
    api.listarProductos().then((respuesta) => {
      if (respuesta.ok) {
        setProductos(respuesta.productos);
        setErrorConexion("");
      } else {
        setErrorConexion(respuesta.mensaje ?? "No se pudo cargar el catálogo");
      }
    });
  }, []);

  const reemplazarProducto = (actualizado) =>
    setProductos((actuales) =>
      actuales.map((producto) =>
        producto.id === actualizado.id ? actualizado : producto,
      ),
    );

  // HU1 · devuelve { ok, mensaje, errores }
  const agregarProducto = async (campos, archivo) => {
    const respuesta = await api.registrarProducto(campos, archivo);
    if (respuesta.ok) {
      setProductos((actuales) => [...actuales, respuesta.producto]);
    }
    return respuesta;
  };

  // HU2 · la foto nueva es opcional
  const editarProducto = async (id, campos, archivo) => {
    const respuesta = await api.modificarProducto(id, campos, archivo);
    if (respuesta.ok) {
      reemplazarProducto(respuesta.producto);
    }
    return respuesta;
  };

  // HU4 · estado "Activo" o "Inactivo"
  const cambiarEstadoProducto = async (id, estado) => {
    const respuesta = await api.cambiarEstadoProducto(id, estado);
    if (respuesta.ok) {
      reemplazarProducto(respuesta.producto);
    }
    return respuesta;
  };

  return (
    <>
      {errorConexion && (
        <p className="aviso-conexion" role="alert">
          {errorConexion}. Verifica que el backend esté encendido.
        </p>
      )}
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
    </>
  );
}

export default App;