import { useState } from "react";
import logoEden from "../assets/Logo-Eden.png";
import "./Comprobante.css";

const formatoPrecio = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});
const etiquetasCliente = [
  ["Nombre", "nombre"],
  ["Identificación", "identificacion"],
  ["Teléfono", "telefono"],
  ["Correo", "correo"],
];

const mostrarDato = (valor) => {
  if (typeof valor === "string") {
    return valor.trim() || "No registrado";
  }
  return valor ?? "No registrado";
};

const escaparXml = (valor) =>
  String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const dividirTexto = (texto, limite) => {
  const palabras = String(texto ?? "").split(/\s+/);
  const lineas = [];
  let linea = "";

  palabras.forEach((palabra) => {
    const siguiente = linea ? `${linea} ${palabra}` : palabra;
    if (siguiente.length > limite && linea) {
      lineas.push(linea);
      linea = palabra;
    } else {
      linea = siguiente;
    }
  });

  if (linea) {
    lineas.push(linea);
  }
  return lineas.length ? lineas : [""];
};

const crearImagenComprobante = (compra) => {
  const ancho = 603;
  const columnas = [30, 72, 290, 360, 445, 573];
  const tablaY = 390;
  const altoEncabezadoTabla = 38;
  let y = tablaY + altoEncabezadoTabla;
  const lineasHorizontales = [];
  const filasProductos = compra.articulos
    .map(({ producto, cantidad }, indice) => {
      const descripcion = dividirTexto(producto.nombre, 29);
      const altoFila = Math.max(38, descripcion.length * 17 + 10);
      const medio = y + altoFila / 2;
      const fila = `
        <rect x="30" y="${y}" width="543" height="${altoFila}" fill="#ffffff" stroke="#b7b7b7"/>
        <text x="51" y="${medio + 4}" text-anchor="middle" class="celda">${indice + 1}</text>
        <text x="80" y="${y + 19}" class="celda">${descripcion
          .map(
            (linea, lineaIndice) =>
              `<tspan x="80" dy="${lineaIndice === 0 ? 0 : 17}">${escaparXml(linea)}</tspan>`,
          )
          .join("")}</text>
        <text x="325" y="${medio + 4}" text-anchor="middle" class="celda">${cantidad}</text>
        <text x="438" y="${medio + 4}" text-anchor="end" class="celda">$${formatoPrecio.format(Number(producto.precio) || 0)}</text>
        <text x="566" y="${medio + 4}" text-anchor="end" class="celda">$${formatoPrecio.format((Number(producto.precio) || 0) * cantidad)}</text>`;
      y += altoFila;
      lineasHorizontales.push(`<line x1="30" y1="${y}" x2="573" y2="${y}" stroke="#b7b7b7"/>`);
      return fila;
    })
    .join("");

  const filasTotales = [];
  if (compra.descuento > 0) {
    filasTotales.push(`
      <rect x="30" y="${y}" width="543" height="36" fill="#ffffff" stroke="#b7b7b7"/>
      <text x="438" y="${y + 23}" text-anchor="end" class="celda">Descuento${compra.codigoCupon ? ` (${escaparXml(compra.codigoCupon)})` : ""}</text>
      <text x="566" y="${y + 23}" text-anchor="end" class="celda">-$${formatoPrecio.format(compra.descuento)}</text>`);
    y += 36;
    lineasHorizontales.push(`<line x1="30" y1="${y}" x2="573" y2="${y}" stroke="#b7b7b7"/>`);
  }
  filasTotales.push(`
    <rect x="30" y="${y}" width="543" height="42" fill="#ffffff" stroke="#b7b7b7"/>
    <text x="438" y="${y + 26}" text-anchor="end" class="celda">Total</text>
    <text x="566" y="${y + 26}" text-anchor="end" class="celda" font-weight="700">$${formatoPrecio.format(compra.total)}</text>`);
  y += 42;
  lineasHorizontales.push(`<line x1="30" y1="${y}" x2="573" y2="${y}" stroke="#b7b7b7"/>`);

  const alto = y + 145;
  const fechaEmision = new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(compra.fechaEmision));
  const cliente = compra.cliente ?? {};
  const datosCliente = [
    ...etiquetasCliente.map(([etiqueta, campo]) => [
      etiqueta,
      mostrarDato(cliente[campo]),
    ]),
    ["Dirección", mostrarDato(compra.direccion)],
  ]
    .map(([etiqueta, valor], indice) => `
      <text x="32" y="${238 + indice * 23}" class="dato"><tspan font-weight="600">${etiqueta}:</tspan> ${escaparXml(valor)}</text>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}">
    <style>
      text { font-family: Arial, sans-serif; fill: #1a1a1a; }
      .celda { font-size: 12px; }
      .dato { font-size: 14px; }
    </style>
    <rect x="1" y="1" width="601" height="${alto - 2}" rx="21" fill="#fff" stroke="#004d40" stroke-width="2"/>
    <path d="M2 22C2 11 11 2 22 2H581C592 2 601 11 601 22V125H2V22Z" fill="#004d40"/>
    <text x="30" y="43" font-size="21" fill="#fff" style="fill:#fff">Joyería y Perfumería</text>
    <text x="120" y="97" font-size="44" fill="#fff" style="fill:#fff">EDEN</text>
    <text x="400" y="65" font-size="23" font-weight="600" fill="#fff" style="fill:#fff">Nro. Pedido</text>
    <text x="400" y="94" font-size="16" fill="#fff" style="fill:#fff">${escaparXml(compra.numeroPedido)}</text>
    <text x="30" y="190" font-size="40" font-weight="600">Recibo</text>
    <text x="484" y="210" text-anchor="middle" font-family="Georgia,serif" font-size="82" font-weight="700" fill="#e5c27b" style="fill:#e5c27b">E</text>
    ${datosCliente}
    <text x="420" y="315" font-size="14">Fecha de emisión:</text>
    <text x="420" y="336" font-size="14">${fechaEmision}</text>
    <rect x="30" y="${tablaY}" width="543" height="${altoEncabezadoTabla}" fill="#f0f0f0" stroke="#b7b7b7"/>
    <text x="51" y="${tablaY + 24}" text-anchor="middle" class="celda" font-weight="700">N.º</text>
    <text x="181" y="${tablaY + 24}" text-anchor="middle" class="celda" font-weight="700">Descripción</text>
    <text x="325" y="${tablaY + 24}" text-anchor="middle" class="celda" font-weight="700">Cantidad</text>
    <text x="402" y="${tablaY + 24}" text-anchor="middle" class="celda" font-weight="700">Precio</text>
    <text x="509" y="${tablaY + 24}" text-anchor="middle" class="celda" font-weight="700">Subtotal</text>
    ${filasProductos}
    ${filasTotales.join("")}
    ${lineasHorizontales.join("")}
    ${columnas
      .slice(1, -1)
      .map((x) => `<line x1="${x}" y1="${tablaY}" x2="${x}" y2="${y}" stroke="#b7b7b7"/>`)
      .join("")}
    <text x="32" y="${y + 72}" font-size="15"><tspan font-weight="600">Método de pago:</tspan> ${escaparXml(compra.metodoPago)}</text>
    <text x="432" y="${y + 65}" text-anchor="middle" font-family="cursive" font-size="25" font-style="italic">Joyería Eden</text>
    <line x1="345" y1="${y + 74}" x2="545" y2="${y + 74}" stroke="#1a1a1a"/>
    <text x="445" y="${y + 96}" text-anchor="middle" font-size="14">Firma</text>
  </svg>`;
};

function Comprobante({ compra, onCerrar }) {
  const [mensajeDescarga, setMensajeDescarga] = useState("");
  const cliente = compra.cliente ?? {};
  const fechaEmision = new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(compra.fechaEmision));

  const descargarComprobante = () => {
    let url;
    setMensajeDescarga("");

    try {
      const contenido = crearImagenComprobante(compra);
      const archivo = new Blob([contenido], {
        type: "image/svg+xml;charset=utf-8",
      });
      url = URL.createObjectURL(archivo);

      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `Comprobante-${compra.numeroPedido}.svg`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      setMensajeDescarga("El comprobante se está descargando.");
    } catch {
      setMensajeDescarga("No se pudo descargar el comprobante. Intenta nuevamente.");
    } finally {
      if (url) {
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    }
  };

  return (
    <div className="comprobante-fondo">
      <section
        className="comprobante-dialogo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="comprobante-titulo"
      >
        <button
          className="comprobante-cerrar"
          type="button"
          aria-label="Cerrar comprobante"
          onClick={onCerrar}
        >
          ×
        </button>
        <article className="comprobante-factura">
          <header className="comprobante-encabezado">
            <div className="comprobante-marca">
              <span>Joyería y Perfumería</span>
              <strong>EDEN</strong>
            </div>
            <strong className="comprobante-numero-pedido">
              Nro. Pedido
              <span>{compra.numeroPedido}</span>
            </strong>
          </header>

          <div className="comprobante-cuerpo">
            <div className="comprobante-detalle-cliente">
              <div>
                <h1 id="comprobante-titulo">Recibo</h1>
                <dl>
                  <div>
                    <dt>Nombre</dt>
                    <dd>{mostrarDato(cliente.nombre)}</dd>
                  </div>
                  <div>
                    <dt>Identificación</dt>
                    <dd>{mostrarDato(cliente.identificacion)}</dd>
                  </div>
                  <div>
                    <dt>Teléfono</dt>
                    <dd>{mostrarDato(cliente.telefono)}</dd>
                  </div>
                  <div>
                    <dt>Correo</dt>
                    <dd>{mostrarDato(cliente.correo)}</dd>
                  </div>
                  <div>
                    <dt>Dirección</dt>
                    <dd>{mostrarDato(compra.direccion)}</dd>
                  </div>
                </dl>
              </div>
              <div className="comprobante-emision">
                <img src={logoEden} alt="Emblema de Joyería Eden" />
                <span>Fecha de emisión:</span>
                <strong>{fechaEmision}</strong>
              </div>
            </div>

            <div className="comprobante-tabla-contenedor">
              <table className="comprobante-tabla">
                <thead>
                  <tr>
                    <th scope="col">N.º</th>
                    <th scope="col">Descripción</th>
                    <th scope="col">Cantidad</th>
                    <th scope="col">Precio</th>
                    <th scope="col">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {compra.articulos.map(({ producto, cantidad }, indice) => {
                    const precio = Number(producto.precio) || 0;
                    return (
                      <tr key={producto.id}>
                        <td>{indice + 1}</td>
                        <td>{producto.nombre}</td>
                        <td>{cantidad}</td>
                        <td>${formatoPrecio.format(precio)}</td>
                        <td>${formatoPrecio.format(precio * cantidad)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  {compra.descuento > 0 && (
                    <tr>
                      <td colSpan="4">
                        Descuento{compra.codigoCupon && ` (${compra.codigoCupon})`}
                      </td>
                      <td>-${formatoPrecio.format(compra.descuento)}</td>
                    </tr>
                  )}
                  <tr className="comprobante-total">
                    <th colSpan="4" scope="row">
                      Total
                    </th>
                    <td>${formatoPrecio.format(compra.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="comprobante-pie">
              <p>
                <strong>Método de pago:</strong> {compra.metodoPago}
              </p>
              <div className="comprobante-firma">
                <span>Joyería Eden</span>
                <strong>Firma</strong>
              </div>
            </div>
          </div>
        </article>
        <button
          className="comprobante-descargar"
          type="button"
          onClick={descargarComprobante}
        >
          Descargar
        </button>
        {mensajeDescarga && (
          <p
            className="comprobante-mensaje-descarga"
            role={mensajeDescarga.startsWith("No se pudo") ? "alert" : "status"}
            aria-live="polite"
          >
            {mensajeDescarga}
          </p>
        )}
      </section>
    </div>
  );
}

export default Comprobante;
