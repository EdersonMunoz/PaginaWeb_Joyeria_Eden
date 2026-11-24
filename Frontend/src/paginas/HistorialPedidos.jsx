import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Encabezado from "../componentes/Encabezado";
import * as api from "../api";
import {
  formatearFechaPedido,
  historialDesdeCatalogo,
  mensajeErrorDetalle,
  migaHistorial,
} from "../historial";
import Comprobante from "./Comprobante";
import "../componentes/EncabezadoFigma.css";
import "./HistorialPedidos.css";

// Sprint 4 · HE4-HU2: el cliente consulta los pedidos que ha realizado.
//   Path: \Usuario\Historial_Pedidos  o  \Usuario\Catalogo\Historial_Pedidos
//   Escenario 1: listado con número, cantidad de productos, fecha y "Ver más detalles".
//   Escenario 2: sin pedidos, mensaje y botón para ir al catálogo.
// Sprint 4 · HE4-HU3: "Ver más detalles" abre el recibo completo del pedido (el mismo
// comprobante de la compra) en una ventana, con lo que quedó guardado en Oracle.
// Sprint 4 · HE4-HU4: "Volver a comprar" agrega los productos del pedido al carrito (solo los que
// tienen unidades hoy) y lleva al carrito con el aviso correspondiente.
function HistorialPedidos({ recomprarPedido }) {
  const { pathname } = useLocation();
  const navegar = useNavigate();
  const nivelesMiga = migaHistorial(pathname);
  const [pedidos, setPedidos] = useState([]);
  const [estado, setEstado] = useState("cargando"); // cargando | listo | error
  const [mensajeError, setMensajeError] = useState("");

  const mostrarRespuesta = useCallback((respuesta) => {
    if (respuesta.ok) {
      setPedidos(respuesta.pedidos ?? []);
      setMensajeError("");
      setEstado("listo");
    } else {
      setMensajeError(respuesta.mensaje ?? "No se pudo cargar el historial de pedidos");
      setEstado("error");
    }
  }, []);

  useEffect(() => {
    let activo = true;
    api.listarPedidos().then((respuesta) => {
      if (activo) mostrarRespuesta(respuesta);
    });
    return () => {
      activo = false;
    };
  }, [mostrarRespuesta]);

  // HE4-HU3 · detalle: null (cerrado) | { numero, estado: "cargando" | "listo" | "error", compra, mensaje }
  const [detalle, setDetalle] = useState(null);
  // Si el cliente abre otro pedido (o cierra la ventana) mientras llega la respuesta, se ignora la vieja.
  const solicitudDetalle = useRef(0);

  const abrirDetalle = async (numero) => {
    const solicitud = ++solicitudDetalle.current;
    setDetalle({ numero, estado: "cargando" });
    const respuesta = await api.consultarComprobante(numero);
    if (solicitud !== solicitudDetalle.current) return;
    setDetalle(
      respuesta.ok
        ? { numero, estado: "listo", compra: respuesta.comprobante }
        : { numero, estado: "error", mensaje: mensajeErrorDetalle(respuesta) },
    );
  };

  const cerrarDetalle = useCallback(() => {
    solicitudDetalle.current += 1;
    setDetalle(null);
  }, []);

  useEffect(() => {
    if (!detalle) return undefined;
    const cerrarConEscape = (evento) => {
      if (evento.key === "Escape") cerrarDetalle();
    };
    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [detalle, cerrarDetalle]);

  // HE4-HU4 · número del pedido que se está volviendo a comprar (evita el doble clic)
  const [recomprando, setRecomprando] = useState(null);
  const [errorRecompra, setErrorRecompra] = useState("");

  const volverAComprar = async (numero) => {
    if (recomprando) return;
    setRecomprando(numero);
    setErrorRecompra("");

    const respuesta = await recomprarPedido(numero);
    if (!respuesta.ok) {
      setErrorRecompra(
        respuesta.mensaje || "No se pudo volver a comprar este pedido. Intenta nuevamente.",
      );
      setRecomprando(null);
      return;
    }

    navegar("/Usuario/Carrito", {
      state: {
        origen: historialDesdeCatalogo(pathname) ? "catalogo" : undefined,
        avisoRecompra: respuesta.aviso,
      },
    });
  };

  const reintentar = async () => {
    setEstado("cargando");
    mostrarRespuesta(await api.listarPedidos());
  };

  return (
    <main className="pagina-historial">
      <Encabezado
        sesionIniciada
        ocultarCarrito
        ocultarFavoritos
        ocultarIconoBusqueda
      />

      <div className="historial-contenido">
        <p className="historial-miga-pan">
          {nivelesMiga.map((nivel, indice) => (
            <Fragment key={nivel.nombre}>
              {indice > 0 && <span aria-hidden="true">\</span>}
              {indice === nivelesMiga.length - 1 ? (
                nivel.nombre
              ) : (
                <Link to={nivel.ruta}>{nivel.nombre}</Link>
              )}
            </Fragment>
          ))}
        </p>

        <section className="historial-listado" aria-labelledby="historial-titulo">
          <h1 id="historial-titulo">Historial de pedidos</h1>

          <div className="historial-columnas" aria-hidden="true">
            <span>Nro. Pedido</span>
            <span>Nro. Productos</span>
            <span>Fecha</span>
            <span>Detalle</span>
          </div>

          {estado === "cargando" && (
            <p className="historial-estado" role="status">
              Cargando tus pedidos...
            </p>
          )}

          {estado === "error" && (
            <div className="historial-estado" role="alert">
              <p>{mensajeError}</p>
              <button type="button" className="historial-boton" onClick={reintentar}>
                Reintentar
              </button>
            </div>
          )}

          {estado === "listo" && pedidos.length === 0 && (
            <div className="historial-estado historial-vacio">
              <h2>Aún no tienes pedidos registrados</h2>
              <p>Cuando realices una compra, la verás aquí.</p>
              <Link className="historial-boton" to="/Usuario/Catalogo">
                Ir al catálogo
              </Link>
            </div>
          )}

          {estado === "listo" && pedidos.length > 0 && (
            <ul className="historial-lista">
              {pedidos.map((pedido) => (
                <li key={pedido.numeroPedido} className="historial-fila">
                  <div className="historial-pedido">
                    <span className="historial-numero">{pedido.numeroPedido}</span>
                    <span>{pedido.totalProductos}</span>
                    <span>{formatearFechaPedido(pedido.fecha)}</span>
                    <button
                      type="button"
                      className="historial-ver-detalle"
                      onClick={() => abrirDetalle(pedido.numeroPedido)}
                    >
                      Ver más detalles
                    </button>
                  </div>
                  <button
                    type="button"
                    className="historial-recomprar"
                    disabled={recomprando !== null}
                    aria-label={`Volver a comprar el pedido ${pedido.numeroPedido}`}
                    onClick={() => volverAComprar(pedido.numeroPedido)}
                  >
                    {recomprando === pedido.numeroPedido ? "Agregando..." : "Volver a comprar"}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {errorRecompra && (
            <p className="historial-error-recompra" role="alert">
              {errorRecompra}
            </p>
          )}
        </section>
      </div>

      {detalle?.estado === "listo" && (
        <Comprobante compra={detalle.compra} onCerrar={cerrarDetalle} />
      )}

      {(detalle?.estado === "cargando" || detalle?.estado === "error") && (
        <div className="comprobante-fondo">
          <section
            className="historial-detalle-aviso"
            role={detalle.estado === "error" ? "alert" : "status"}
            aria-modal="true"
            aria-label="Detalle del pedido"
          >
            {detalle.estado === "cargando" ? (
              <p>Cargando el detalle del pedido...</p>
            ) : (
              <>
                <p>{detalle.mensaje}</p>
                <div className="historial-detalle-acciones">
                  <button
                    type="button"
                    className="historial-boton"
                    onClick={() => abrirDetalle(detalle.numero)}
                  >
                    Reintentar
                  </button>
                  <button type="button" className="historial-boton" onClick={cerrarDetalle}>
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

export default HistorialPedidos;
