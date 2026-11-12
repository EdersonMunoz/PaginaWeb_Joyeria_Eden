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
import InicioSesion from "./paginas/InicioSesion";
import RegistroCuenta from "./paginas/RegistroCuenta";
import AjustesCuenta from "./paginas/AjustesCuenta";
import RutaProtegida from "./componentes/RutaProtegida";

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
        <Route path="/InicioSesion" element={<InicioSesion />} />
        <Route path="/Registro" element={<RegistroCuenta />} />
        <Route
          path="/Usuario/Ajustes_cuenta"
          element={<RutaProtegida rol="cliente"><AjustesCuenta /></RutaProtegida>}
        />
        <Route
          path="/Admin/Ajustes_cuenta"
          element={<RutaProtegida rol="admin"><AjustesCuenta /></RutaProtegida>}
        />
        <Route
          path="/Usuario"
          element={<RutaProtegida rol="cliente"><InicioUsuario productos={productos} /></RutaProtegida>}
        />
        <Route
          path="/Admin"
          element={<RutaProtegida rol="admin"><InicioAdmin productos={productos} /></RutaProtegida>}
        />
        <Route path="/Inicio/Catalogo" element={<Catalogo productos={productos} />} />
        <Route
          path="/Admin/Catalogo"
          element={<RutaProtegida rol="admin"><Catalogo productos={productos} /></RutaProtegida>}
        />
        <Route
          path="/Usuario/Catalogo"
          element={<RutaProtegida rol="cliente"><Catalogo productos={productos} /></RutaProtegida>}
        />
        <Route
          path="/Admin/RegistrarProducto"
          element={
            <RutaProtegida rol="admin">
              <RegistrarProducto agregarProducto={agregarProducto} />
            </RutaProtegida>
          }
        />
        <Route
          path="/Admin/GestionProductos"
          element={
            <RutaProtegida rol="admin">
            <GestionProductos
              productos={productos}
              cambiarEstadoProducto={cambiarEstadoProducto}
            />
            </RutaProtegida>
          }
        />
        <Route
          path="/Admin/ModificarProducto/:id"
          element={
            <RutaProtegida rol="admin">
              <EditarProducto productos={productos} editarProducto={editarProducto} />
            </RutaProtegida>
          }
        />
        <Route
          path="/Admin/ModificarProducto"
          element={
            <RutaProtegida rol="admin">
              <EditarProducto productos={productos} editarProducto={editarProducto} />
            </RutaProtegida>
          }
        />
      </Routes>
    </>
  );
}

export default App;