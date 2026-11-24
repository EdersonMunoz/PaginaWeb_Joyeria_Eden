import { useCallback, useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import * as api from "./api";
import * as logicaCarrito from "./carrito";
import Inicio from "./paginas/Inicio";
import InicioUsuario from "./paginas/InicioUsuario";
import InicioAdmin from "./paginas/InicioAdmin";
import { decidirAcceso, obtenerUsuario } from "./sesion";
import Catalogo from "./paginas/Catalogo";
import GestionProductos from "./paginas/GestionProductos";
import RegistrarProducto from "./paginas/RegistrarProducto";
import EditarProducto from "./paginas/EditarProducto";
import InicioSesion from "./paginas/InicioSesion";
import RegistroCuenta from "./paginas/RegistroCuenta";
import AjustesCuenta from "./paginas/AjustesCuenta";
import Carrito from "./paginas/Carrito";
import RutaProtegida from "./componentes/RutaProtegida";

function RedireccionRutaInicio({ destinoCliente }) {
  const acceso = decidirAcceso(obtenerUsuario(), "cliente");
  if (acceso === "/InicioSesion") {
    return <Navigate to={acceso} replace />;
  }

  return (
    <Navigate
      to={acceso === "/Admin" ? "/Admin/Catalogo" : destinoCliente}
      replace
    />
  );
}

function App() {
  // Los productos vienen de la base de datos Oracle a través del backend
  const [productos, setProductos] = useState([]);
  const [errorConexion, setErrorConexion] = useState("");
  const [carrito, setCarrito] = useState([]);
  // El cupón vive aquí (y no dentro de la página del carrito) para que no se pierda
  // al ir al catálogo y volver: así siempre se refleja en el total.
  const [cuponCarrito, setCuponCarrito] = useState(null);
  const carritoActual = useRef(carrito);

  useEffect(() => {
    carritoActual.current = carrito;
  }, [carrito]);

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

  // Sprint 3 · vuelve a pedir el catálogo al backend y pone el carrito al día con el
  // inventario real de Oracle (precios, stock y productos que ya no están disponibles).
  // Devuelve true si hubo que ajustar el carrito.
  const actualizarInventario = useCallback(async () => {
    const respuesta = await api.listarProductos();
    if (!respuesta.ok) {
      return false;
    }

    setProductos(respuesta.productos);
    setErrorConexion("");
    const { ajustado } = logicaCarrito.sincronizarCarrito(
      carritoActual.current,
      respuesta.productos,
    );
    setCarrito(
      (actual) => logicaCarrito.sincronizarCarrito(actual, respuesta.productos).carrito,
    );
    return ajustado;
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

  // Sprint 3 · HE3-HU2: el carrito sigue en memoria; las reglas están en carrito.js
  const agregarAlCarrito = (producto, cantidad = 1) => {
    setCarrito((actual) => logicaCarrito.agregarAlCarrito(actual, producto, cantidad));
  };

  const actualizarCantidadCarrito = (productoId, cantidad) => {
    setCarrito((actual) => logicaCarrito.actualizarCantidad(actual, productoId, cantidad));
  };

  const eliminarDelCarrito = (productoId) => {
    setCarrito((actual) => logicaCarrito.eliminarDelCarrito(actual, productoId));
  };

  // Sprint 3 · HE3-HU6: la compra ya quedó guardada en el backend. `inventario` es el stock
  // y estado reales que devolvió Oracle ([{ id, stock, estado }]); no se calcula aquí.
  const completarCompra = useCallback((inventario) => {
    setProductos((actuales) => logicaCarrito.aplicarInventario(actuales, inventario));
    setCarrito([]);
    setCuponCarrito(null);
  }, []);

  const propiedadesCarrito = {
    carrito,
    actualizarCantidad: actualizarCantidadCarrito,
    eliminarProducto: eliminarDelCarrito,
    completarCompra,
    actualizarInventario,
    cupon: cuponCarrito,
    cambiarCupon: setCuponCarrito,
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
          element={<RutaProtegida rol="cliente"><AjustesCuenta carrito={carrito} /></RutaProtegida>}
        />
        <Route
          path="/Admin/Ajustes_cuenta"
          element={<RutaProtegida rol="admin"><AjustesCuenta /></RutaProtegida>}
        />
        <Route
          path="/Usuario"
          element={<RutaProtegida rol="cliente"><InicioUsuario productos={productos} carrito={carrito} /></RutaProtegida>}
        />
        <Route
          path="/Admin"
          element={<RutaProtegida rol="admin"><InicioAdmin productos={productos} /></RutaProtegida>}
        />
        <Route
          path="/Inicio/Catalogo"
          element={<RedireccionRutaInicio destinoCliente="/Usuario/Catalogo" />}
        />
        <Route
          path="/Admin/Catalogo"
          element={
            <RutaProtegida rol="admin">
              <Catalogo
                productos={productos}
                carrito={carrito}
                agregarAlCarrito={agregarAlCarrito}
              />
            </RutaProtegida>
          }
        />
        <Route
          path="/Usuario/Catalogo"
          element={
            <RutaProtegida rol="cliente">
              <Catalogo
                productos={productos}
                carrito={carrito}
                agregarAlCarrito={agregarAlCarrito}
              />
            </RutaProtegida>
          }
        />
        <Route
          path="/Inicio/Carrito"
          element={<RedireccionRutaInicio destinoCliente="/Usuario/Carrito" />}
        />
        <Route
          path="/Usuario/Carrito"
          element={
            <RutaProtegida rol="cliente">
              <Carrito {...propiedadesCarrito} />
            </RutaProtegida>
          }
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