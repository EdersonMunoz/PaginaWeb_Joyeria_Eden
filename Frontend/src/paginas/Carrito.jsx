import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Encabezado from "../componentes/Encabezado";
import iconoCampana from "../assets/iconossvg/iconoCampana.svg";
import iconoCarroVacio from "../assets/iconossvg/iconoCarroVacio.svg";
import iconoCarga from "../assets/iconossvg/iconoCarga.svg";
import iconoLapiz from "../assets/iconossvg/iconoLapiz.svg";
import iconoBorrar from "../assets/iconossvg/iconoBorrar.svg";
import iconoBasura from "../assets/iconossvg/IconoBasura.svg";
import iconoCupon from "../assets/iconossvg/iconoCupon.svg";
import * as api from "../api";
import { obtenerUsuario } from "../sesion";
import {
  articulosParaCompra,
  calcularResumen,
  crearIdSolicitud,
  direccionValida,
} from "../carrito";
import Comprobante from "./Comprobante";
import "./Carrito.css";
import "../componentes/EncabezadoFigma.css";

const formatoPrecio = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});
const metodosPago = [
  "Bancolombia",
  "Daviplata",
  "Nequi",
  "Itaú Colombia",
  "Banco de Bogotá",
  "Banco AV Villas",
  "Banco Falabella",
  "Banco de Occidente",
  "Banco Popular",
];

const MENSAJE_ERROR_PAGO =
  "Error al realizar el pago de la compra. Por favor completa todos los campos obligatorios y/o corrige la información";
// Tiempo mínimo que se muestra "Procesando Compra" (el pago es simulado)
const ESPERA_MINIMA_PAGO = 1200;
const TIEMPO_PARA_CANCELAR = 3000;
const TIEMPO_CANCELANDO_PAGO = 1500;

function Carrito({
  carrito = [],
  actualizarCantidad,
  eliminarProducto,
  completarCompra,
  actualizarInventario,
  cupon: cuponAplicado = null,
  cambiarCupon: setCuponAplicado = () => {},
}) {
  const [notificacion, setNotificacion] = useState(null);
  const [codigoCupon, setCodigoCupon] = useState("");
  const [errorCupon, setErrorCupon] = useState("");
  const [validandoCupon, setValidandoCupon] = useState(false);
  const [mensajeErrorPago, setMensajeErrorPago] = useState(MENSAJE_ERROR_PAGO);
  const [direccion, setDireccion] = useState(() => {
    const direccionPerfil = obtenerUsuario()?.direccion;
    return typeof direccionPerfil === "string" ? direccionPerfil : "";
  });
  const [erroresPago, setErroresPago] = useState({
    metodo: false,
    direccion: false,
  });
  const [estadoPago, setEstadoPago] = useState(null);
  const [puedeCancelarPago, setPuedeCancelarPago] = useState(false);
  const [datosComprobante, setDatosComprobante] = useState(null);
  const [metodoPago, setMetodoPago] = useState("Ninguno");
  const [mostrarMetodosPago, setMostrarMetodosPago] = useState(false);
  const menuMetodosPagoRef = useRef(null);
  const pagoEnCurso = useRef(false);
  const montado = useRef(false);
  const temporizadorPagoRef = useRef(null);
  const temporizadorCancelacionRef = useRef(null);
  const rutaInicio = "/Usuario";
  const rutaCatalogo = "/Usuario/Catalogo";
  // Resumen que se muestra mientras se arma el carrito. Los valores oficiales del
  // pedido (precios, descuento y total) los calcula el backend al pagar.
  const { cantidadTotal, subtotal, descuento, total } = calcularResumen(
    carrito,
    cuponAplicado,
  );

  // Al entrar al carrito se consulta el inventario real (Oracle): si cambió el stock
  // o el precio de algún producto, el carrito y el resumen se ponen al día.
  useEffect(() => {
    let vigente = true;
    actualizarInventario?.().then((ajustado) => {
      if (vigente && ajustado) {
        setNotificacion({
          tipo: "stock",
          mensaje: "El carrito se actualizó según el inventario disponible",
        });
      }
    });
    return () => {
      vigente = false;
    };
  }, [actualizarInventario]);

  useEffect(() => {
    if (!notificacion) {
      return undefined;
    }

    const temporizador = window.setTimeout(() => setNotificacion(null), 3000);
    return () => window.clearTimeout(temporizador);
  }, [notificacion]);

  useEffect(() => {
    if (!mostrarMetodosPago) {
      return undefined;
    }

    const cerrarSiFuera = (event) => {
      if (!menuMetodosPagoRef.current?.contains(event.target)) {
        setMostrarMetodosPago(false);
      }
    };

    document.addEventListener("pointerdown", cerrarSiFuera);
    return () => document.removeEventListener("pointerdown", cerrarSiFuera);
  }, [mostrarMetodosPago]);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
      if (temporizadorPagoRef.current !== null) {
        window.clearTimeout(temporizadorPagoRef.current);
      }
      if (temporizadorCancelacionRef.current !== null) {
        window.clearTimeout(temporizadorCancelacionRef.current);
      }
      temporizadorPagoRef.current = null;
      temporizadorCancelacionRef.current = null;
      pagoEnCurso.current = false;
    };
  }, []);

  useEffect(() => {
    if (estadoPago !== "exitoso" && estadoPago !== "error") {
      return undefined;
    }

    const temporizador = window.setTimeout(() => {
      setEstadoPago(estadoPago === "error" ? null : "comprobante");
    }, 3000);
    return () => window.clearTimeout(temporizador);
  }, [estadoPago]);

  // HE3-HU2 escenario 2: el backend valida el código y define el porcentaje
  const aplicarCupon = async (event) => {
    event.preventDefault();
    const codigo = codigoCupon.trim().toUpperCase();

    if (!codigo) {
      const mensaje = "Ingresa un código de cupón.";
      setErrorCupon(mensaje);
      setNotificacion({ tipo: "cupon-error", mensaje });
      return;
    }
    if (validandoCupon) {
      return;
    }

    setValidandoCupon(true);
    const respuesta = await api.validarCupon(codigo);
    setValidandoCupon(false);

    if (respuesta.ok && respuesta.cupon) {
      setCuponAplicado(respuesta.cupon);
      setCodigoCupon("");
      setErrorCupon("");
      setNotificacion({
        tipo: "cupon-exito",
        mensaje: "Cupón aplicado correctamente",
      });
      return;
    }

    const mensaje = respuesta.mensaje ?? "El cupón ingresado no es válido";
    setErrorCupon(mensaje);
    setNotificacion({ tipo: "cupon-error", mensaje });
  };

  const mostrarErrorPago = (mensaje = MENSAJE_ERROR_PAGO) => {
    setMensajeErrorPago(mensaje);
    setEstadoPago("error");
  };

  const enviarCompra = async () => {
    const [respuesta] = await Promise.all([
      api.procesarCompra({
        articulos: articulosParaCompra(carrito),
        metodoPago,
        direccion: direccion.trim(),
        codigoCupon: cuponAplicado?.codigo ?? "",
        idSolicitud: crearIdSolicitud(),
      }),
      new Promise((seguir) => window.setTimeout(seguir, ESPERA_MINIMA_PAGO)),
    ]);
    pagoEnCurso.current = false;

    if (respuesta.ok && respuesta.comprobante) {
      completarCompra(respuesta.inventario ?? []);
      if (!montado.current) return;

      setDatosComprobante(respuesta.comprobante);
      setMetodoPago("Ninguno");
      setMostrarMetodosPago(false);
      setCodigoCupon("");
      setEstadoPago("exitoso");
      return;
    }

    if (!montado.current) return;

    if (respuesta.estado === 401 || respuesta.estado === 403) {
      // La sesión venció: api.js ya cerró la sesión y está llevando al inicio de sesión
      setEstadoPago(null);
      return;
    }

    setErroresPago({
      metodo: Boolean(respuesta.errores?.metodo),
      direccion: Boolean(respuesta.errores?.direccion),
    });
    if (respuesta.errores?.cupon) {
      setCuponAplicado(null);
      const mensaje = respuesta.mensaje ?? "El cupón ingresado no es válido";
      setErrorCupon(mensaje);
      setNotificacion({ tipo: "cupon-error", mensaje });
    }
    if (respuesta.estado === 409) {
      // El inventario cambió (otra compra, producto inactivado...): se actualiza el carrito
      await actualizarInventario?.();
      if (!montado.current) return;
    }
    mostrarErrorPago(
      respuesta.errores?.metodo || respuesta.errores?.direccion
        ? MENSAJE_ERROR_PAGO
        : (respuesta.mensaje ?? MENSAJE_ERROR_PAGO),
    );
  };

  const iniciarPago = () => {
    const errores = {
      metodo: metodoPago === "Ninguno",
      direccion: !direccionValida(direccion),
    };

    setErroresPago(errores);
    if (errores.metodo || errores.direccion) {
      mostrarErrorPago();
      return;
    }
    if (pagoEnCurso.current) {
      return;
    }

    pagoEnCurso.current = true;
    setPuedeCancelarPago(true);
    setEstadoPago("procesando");
    temporizadorPagoRef.current = window.setTimeout(() => {
      temporizadorPagoRef.current = null;
      if (!montado.current || !pagoEnCurso.current) return;
      setPuedeCancelarPago(false);
      setEstadoPago("enviando");
      void enviarCompra();
    }, TIEMPO_PARA_CANCELAR);
  };

  const cancelarPago = () => {
    if (temporizadorPagoRef.current === null || !pagoEnCurso.current) return;

    window.clearTimeout(temporizadorPagoRef.current);
    temporizadorPagoRef.current = null;
    setPuedeCancelarPago(false);
    setEstadoPago("cancelando");
    temporizadorCancelacionRef.current = window.setTimeout(() => {
      temporizadorCancelacionRef.current = null;
      pagoEnCurso.current = false;
      if (montado.current) {
        setEstadoPago(null);
      }
    }, TIEMPO_CANCELANDO_PAGO);
  };

  return (
    <main className="pagina-carrito">
      <Encabezado
        sesionIniciada
        ocultarCarrito
        ocultarFavoritos
        ocultarIconoBusqueda
        carritoCantidad={cantidadTotal}
      />

      <div className="carrito-contenido">
        <p className="carrito-miga-pan">
          <Link to={rutaInicio}>Inicio</Link>
          <span aria-hidden="true">\</span>
          <Link to={rutaCatalogo}>Catálogo</Link>
          <span aria-hidden="true">\</span>
          Carrito
        </p>

        <div className="carrito-layout">
          <section className="carrito-listado" aria-labelledby="carrito-titulo">
            <div className="carrito-listado-encabezado">
              <h1 id="carrito-titulo">Carrito</h1>
              <span>Nro. Pedido</span>
            </div>

            {carrito.length === 0 ? (
              <div className="carrito-vacio">
                <img src={iconoCarroVacio} alt="" />
                <h2>No hay productos agregados en el carrito</h2>
                <p>
                  Aquí encontrarás los productos que hayas agregado al carrito
                </p>
              </div>
            ) : (
              <div className="carrito-productos">
                {carrito.map(({ producto, cantidad }) => {
                  const stock = Number(producto.stock);
                  const cantidadMaxima = Number.isFinite(stock)
                    ? Math.max(0, Math.floor(stock))
                    : Number.POSITIVE_INFINITY;
                  const precio = Number(producto.precio) || 0;

                  return (
                    <article className="carrito-producto" key={producto.id}>
                      <img
                        className="carrito-producto-imagen"
                        src={producto.imagen}
                        alt={producto.nombre}
                      />
                      <div className="carrito-producto-informacion">
                        <h2>{producto.nombre}</h2>
                        <strong>{producto.ref}</strong>
                        <div
                          className="carrito-control-cantidad"
                          role="group"
                          aria-label={`Cantidad de ${producto.nombre}`}
                        >
                          <button
                            type="button"
                            aria-label={`Disminuir cantidad de ${producto.nombre}`}
                            disabled={cantidad <= 1}
                            onClick={() =>
                              actualizarCantidad?.(producto.id, cantidad - 1)
                            }
                          >
                            −
                          </button>
                          <output aria-live="polite">{cantidad}</output>
                          <button
                            type="button"
                            aria-label={`Aumentar cantidad de ${producto.nombre}`}
                            disabled={cantidadMaxima === 0}
                            onClick={() => {
                              if (cantidad >= cantidadMaxima) {
                                actualizarCantidad?.(
                                  producto.id,
                                  cantidadMaxima,
                                );
                                setNotificacion({
                                  tipo: "stock",
                                  mensaje: "Stock máximo alcanzado",
                                });
                                return;
                              }

                              actualizarCantidad?.(producto.id, cantidad + 1);
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="carrito-producto-precio">
                        <span>Precio unitario</span>
                        <strong>${formatoPrecio.format(precio)}</strong>
                      </div>
                      <div className="carrito-producto-total">
                        <span>Total</span>
                        <strong>
                          ${formatoPrecio.format(precio * cantidad)}
                        </strong>
                      </div>
                      <button
                        className="carrito-producto-eliminar"
                        type="button"
                        aria-label={`Eliminar ${producto.nombre} del carrito`}
                        title="Eliminar producto"
                        onClick={() => {
                          eliminarProducto(producto.id);
                          if (carrito.length === 1) {
                            setCuponAplicado(null);
                            setMetodoPago("Ninguno");
                            setMostrarMetodosPago(false);
                          }
                          setNotificacion({
                            tipo: "eliminar",
                            mensaje: "Se borró el producto del carrito",
                          });
                        }}
                      >
                        <img src={iconoBorrar} alt="" />
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="carrito-resumen" aria-labelledby="carrito-resumen-titulo">
            <h2 id="carrito-resumen-titulo">Resumen de compra</h2>
            <dl className="carrito-resumen-valores" aria-live="polite">
              <div>
                <dt>Total productos</dt>
                <dd>{cantidadTotal}</dd>
              </div>
              <div>
                <dt>Subtotal</dt>
                <dd>${formatoPrecio.format(subtotal)}</dd>
              </div>
              <div>
                <dt>Descuento</dt>
                <dd>${formatoPrecio.format(descuento)}</dd>
              </div>
              <div className="carrito-resumen-total">
                <dt>Total</dt>
                <dd>${formatoPrecio.format(total)}</dd>
              </div>
            </dl>

            <form className="carrito-cupon" onSubmit={aplicarCupon}>
              <label htmlFor="carrito-codigo-cupon">Aplicar cupón</label>
              <span className="carrito-cupon-campo">
                <input
                  id="carrito-codigo-cupon"
                  aria-label="Código de cupón"
                  aria-invalid={Boolean(errorCupon)}
                  type="text"
                  value={codigoCupon}
                  onChange={(event) => {
                    setCodigoCupon(event.target.value);
                    setErrorCupon("");
                  }}
                />
                <button type="submit" disabled={validandoCupon}>Aplicar</button>
              </span>
            </form>
            {cuponAplicado && (
              <div className="carrito-cupon-aplicado">
                <span>{cuponAplicado.codigo}</span>
                <strong>{cuponAplicado.porcentaje}%</strong>
                <button
                  type="button"
                  aria-label={`Quitar cupón ${cuponAplicado.codigo}`}
                  onClick={() => setCuponAplicado(null)}
                >
                  ×
                </button>
              </div>
            )}

            <div className="carrito-opciones-compra">
              <div className="carrito-metodo-pago">
                <span id="carrito-metodo-pago-etiqueta">Método de pago</span>
                <div
                  className="carrito-metodo-pago-control"
                  ref={menuMetodosPagoRef}
                >
                  <button
                    className={`carrito-metodo-pago-boton${erroresPago.metodo ? " carrito-campo-invalido" : ""}`}
                    type="button"
                    aria-label="Método de pago"
                    aria-haspopup="listbox"
                    aria-expanded={mostrarMetodosPago}
                    aria-controls="carrito-opciones-metodo-pago"
                    aria-invalid={erroresPago.metodo}
                    aria-describedby={
                      erroresPago.metodo ? "carrito-error-metodo" : undefined
                    }
                    onClick={() =>
                      setMostrarMetodosPago((mostrar) => !mostrar)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        setMostrarMetodosPago(false);
                      } else if (event.key === "ArrowDown") {
                        event.preventDefault();
                        setMostrarMetodosPago(true);
                      }
                    }}
                  >
                    <span>{metodoPago}</span>
                    <svg
                      className={`carrito-metodo-pago-flecha${mostrarMetodosPago ? " desplegada" : ""}`}
                      viewBox="0 0 16 16"
                      aria-hidden="true"
                    >
                      <path d="m3 6 5 5 5-5" />
                    </svg>
                  </button>
                  {mostrarMetodosPago && (
                    <div
                      className="carrito-metodo-pago-opciones"
                      id="carrito-opciones-metodo-pago"
                      role="listbox"
                      aria-labelledby="carrito-metodo-pago-etiqueta"
                    >
                      {metodosPago.map((metodo) => (
                        <button
                          className={
                            metodoPago === metodo
                              ? "carrito-metodo-pago-opcion seleccionada"
                              : "carrito-metodo-pago-opcion"
                          }
                          key={metodo}
                          type="button"
                          role="option"
                          aria-selected={metodoPago === metodo}
                          onClick={() => {
                            setMetodoPago(metodo);
                            setMostrarMetodosPago(false);
                            setErroresPago((anteriores) => ({
                              ...anteriores,
                              metodo: false,
                            }));
                          }}
                        >
                          {metodo}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {erroresPago.metodo && (
                  <span className="carrito-error-campo" id="carrito-error-metodo">
                    Selecciona un método de pago.
                  </span>
                )}
              </div>

              <label className="carrito-direccion">
                <span>Dirección de envío</span>
                <span className="carrito-direccion-campo">
                  <input
                    aria-label="Dirección de envío"
                    type="text"
                    className={erroresPago.direccion ? "carrito-campo-invalido" : ""}
                    aria-invalid={erroresPago.direccion}
                    aria-describedby={
                      erroresPago.direccion
                        ? "carrito-error-direccion"
                        : undefined
                    }
                    value={direccion}
                    onChange={(event) => {
                      const valor = event.target.value;
                      setDireccion(valor);
                      setErroresPago((anteriores) => ({
                        ...anteriores,
                        direccion:
                          anteriores.direccion && !direccionValida(valor),
                      }));
                    }}
                  />
                  <img src={iconoLapiz} alt="" />
                </span>
                {erroresPago.direccion && (
                  <span
                    className="carrito-error-campo"
                    id="carrito-error-direccion"
                  >
                    Ingresa una dirección válida.
                  </span>
                )}
              </label>

              <button
                className="carrito-boton-pagar"
                type="button"
                disabled={
                  carrito.length === 0 ||
                  ["procesando", "enviando", "cancelando"].includes(estadoPago)
                }
                onClick={iniciarPago}
              >
                Pagar
              </button>
            </div>
          </aside>
        </div>
      </div>

      {notificacion && (
        <div
          className={`carrito-notificacion carrito-notificacion-${notificacion.tipo}`}
          role="status"
          aria-live="polite"
        >
          <img
            src={
              notificacion.tipo === "stock"
                ? iconoCampana
                : notificacion.tipo.startsWith("cupon-")
                  ? iconoCupon
                  : iconoBasura
            }
            alt=""
          />
          <span>{notificacion.mensaje}</span>
        </div>
      )}

      {estadoPago && estadoPago !== "comprobante" && (
        <div className="carrito-modal-fondo">
          <section
            className={`carrito-modal carrito-modal-${estadoPago}`}
            role={estadoPago === "error" ? "alertdialog" : "dialog"}
            aria-modal="true"
            aria-label={
              estadoPago === "error"
                ? mensajeErrorPago
                : estadoPago === "exitoso"
                  ? "Pago exitoso, compra realizada."
                  : estadoPago === "cancelando"
                    ? "Cancelando compra, por favor, espere un momento"
                    : "Procesando Compra"
            }
          >
            {["procesando", "enviando", "cancelando"].includes(estadoPago) && (
              <img className="carrito-modal-cargando" src={iconoCarga} alt="" />
            )}
            {estadoPago === "error" && (
              <>
                <svg
                  className="carrito-modal-error-icono"
                  viewBox="0 0 60 60"
                  aria-hidden="true"
                >
                  <path d="M10 10l40 40M50 10L10 50" />
                </svg>
                <p>{mensajeErrorPago}</p>
              </>
            )}
            {estadoPago === "exitoso" && (
              <>
                <svg
                  className="carrito-modal-exito-icono"
                  viewBox="0 0 80 80"
                  aria-hidden="true"
                >
                  <circle cx="40" cy="40" r="37" />
                  <path d="m24 40 11 11 22-23" />
                </svg>
                <p>Pago exitoso, compra realizada.</p>
              </>
            )}
            {["procesando", "enviando"].includes(estadoPago) && (
              <h2>Procesando Compra</h2>
            )}
            {estadoPago === "cancelando" && (
              <p>Cancelando compra, por favor, espere un momento</p>
            )}
            {estadoPago === "procesando" && puedeCancelarPago && (
              <button
                className="carrito-modal-cancelar"
                type="button"
                onClick={cancelarPago}
              >
                Cancelar
              </button>
            )}
          </section>
        </div>
      )}

      {estadoPago === "comprobante" && datosComprobante && (
        <Comprobante
          compra={datosComprobante}
          onCerrar={() => setEstadoPago(null)}
        />
      )}
    </main>
  );
}

export default Carrito;
