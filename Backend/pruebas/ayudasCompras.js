// Ayudas compartidas por las pruebas del Sprint 3 (HE3: carrito, compra y comprobante).
//  - Oracle FALSO en memoria con transacciones: imita lo que hace Oracle para las
//    sentencias de pedidos.js (bloqueo de filas con FOR UPDATE, commit, rollback,
//    secuencia, restricciones CHECK/UNIQUE y el trigger TRG_PRODUCTO_SIN_STOCK).
//  - Servidor de prueba en un puerto libre (nunca usa el 3001).
// Este archivo NO es una prueba (no termina en .test.js).
//
// IMPORTANTE: es una simulación. Sirve para comprobar la lógica del backend
// (qué se confirma, qué se deshace, en qué orden se bloquea), pero NO reemplaza
// una prueba contra un Oracle de verdad (ver pruebas/oracle-real.test.js).
import { before, after, beforeEach } from "node:test";
import { usarConexionDePrueba, usarEjecutorDePrueba } from "../baseDatos.js";
import { METODOS_PAGO } from "../validarCompra.js";

process.env.SECRETO_SESION = "secreto-fijo-de-prueba-para-sesiones";
process.env.FOTOS_PAR_URL = "https://objectstorage.prueba.oraclecloud.com/p/TOKEN-SECRETO/n/ns/b/eden-fotos/o/";
const { crearApp } = await import("../servidor.js");
const { crearToken } = await import("../sesion.js");

// ---------------------------------------------------------------
// Estado de la base falsa
// ---------------------------------------------------------------
export const bd = {};

export function reiniciarBase() {
  Object.assign(bd, {
    productos: [], // datos CONFIRMADOS (lo que vería cualquier otra conexión)
    cupones: [
      { codigo: "PROMO2026", porcentaje: 5, fechaVencimiento: "2027-12-31", maxUsos: 1000 },
      { codigo: "VENCIDO2025", porcentaje: 10, fechaVencimiento: "2025-12-31", maxUsos: 1000 },
      { codigo: "LIMITE1", porcentaje: 10, fechaVencimiento: "2027-12-31", maxUsos: 1 },
    ],
    usuarios: [],
    pedidos: [],
    detalles: [],
    secuenciaPedido: 0,
    siguienteProducto: 1,
    siguienteDetalle: 1,
    bloqueos: new Map(), // productoId -> { dueno, espera: [funciones] }
    bloqueosCupones: new Map(), // codigo -> { dueno, espera: [funciones] }
    sentencias: [], // todo lo que se ejecutó dentro de transacciones
    conexiones: 0,
    commits: 0,
    rollbacks: 0,
    cierres: 0,
    // Inyección de fallas: función (sql, datos) => true para que esa sentencia falle
    fallarEn: null,
    // Simula que otra sesión cambió el producto entre el bloqueo y el UPDATE
    forzarUpdateSinFilas: false,
    fallarCommit: false,
  });
}
reiniciarBase();

export function agregarProducto(extra = {}) {
  const id = extra.id ?? bd.siguienteProducto;
  bd.siguienteProducto = Math.max(bd.siguienteProducto, id) + 1;
  const producto = {
    id,
    ref: `REF${id}`,
    nombre: "Anillos Dualis Blue",
    precio: 2450000,
    categoria: "Anillos",
    stock: 10,
    descripcion: "Anillos en plata con zafiros azules.",
    imagen: "productos/AnillosAzules.jpg",
    estado: "Activo",
    ...extra,
  };
  bd.productos.push(producto);
  return producto;
}

export function agregarUsuario(extra = {}) {
  const usuario = {
    id: bd.usuarios.length + 1,
    nombre: "Ana Pérez",
    identificacion: "123456789",
    telefono: "3001234567",
    correo: "ana@example.com",
    usuario: "anaperez",
    direccion: "Calle 10 # 5-20",
    rol: "cliente",
    estado: "Activo",
    ...extra,
  };
  bd.usuarios.push(usuario);
  return usuario;
}

export const productoPorId = (id) => bd.productos.find((p) => p.id === id);

const errorOracle = (errorNum, texto) =>
  Object.assign(new Error(`ORA-${String(errorNum).padStart(5, "0")}: ${texto}`), { errorNum });

// Fila de PEDIDO con los alias de SELECT_PEDIDO (pedidos.js)
const filaPedido = (p) => ({
  id: p.id,
  numeroPedido: p.numero,
  fechaEmision: p.fecha,
  estado: p.estado,
  usuarioId: p.usuarioId,
  clienteNombre: p.clienteNombre,
  clienteIdentificacion: p.clienteIdentificacion,
  clienteTelefono: p.clienteTelefono,
  clienteCorreo: p.clienteCorreo,
  direccion: p.direccion,
  metodoPago: p.metodoPago,
  codigoCupon: p.cupon,
  porcentajeDescuento: p.porcentajeDescuento,
  subtotal: p.subtotal,
  descuento: p.descuento,
  total: p.total,
  claveConsultaHash: p.claveConsultaHash,
});

const filaDetalle = (d) => ({
  linea: d.linea,
  productoId: d.productoId,
  ref: d.ref,
  nombre: d.nombre,
  precio: d.precio,
  cantidad: d.cantidad,
  subtotal: d.subtotal,
});

// Consultas de solo lectura sobre PEDIDO / DETALLE_PEDIDO (sirven dentro y fuera de transacción)
function leerPedidos(sql, datos, pedidos, detalles) {
  if (sql.includes("FROM pedido p")) {
    let encontrado;
    if (sql.includes("p.numero = :numero")) encontrado = pedidos.find((p) => p.numero === datos.numero);
    else if (sql.includes("p.id_solicitud = :idSolicitud")) {
      encontrado = pedidos.find((p) => p.idSolicitud === datos.idSolicitud);
    } else if (sql.includes("p.id = :id")) encontrado = pedidos.find((p) => p.id === datos.id);
    else throw new Error(`Consulta de pedido no prevista en la prueba: ${sql}`);
    return { rows: encontrado ? [filaPedido(encontrado)] : [] };
  }
  if (sql.includes("FROM detalle_pedido d")) {
    return {
      rows: detalles
        .filter((d) => d.pedidoId === datos.pedidoId)
        .sort((a, b) => a.linea - b.linea)
        .map(filaDetalle),
    };
  }
  return null;
}

function leerCupon(sql, datos, pedidos) {
  if (sql.includes("FROM cupon c")) {
    const cupon = bd.cupones.find((fila) => fila.codigo === datos.codigo);
    if (!cupon) return { rows: [] };
    const fechaActual = new Date().toISOString().slice(0, 10);
    return {
      rows: [{
        codigo: cupon.codigo,
        porcentaje: cupon.porcentaje,
        maxUsos: cupon.maxUsos,
        expirado: fechaActual > cupon.fechaVencimiento ? 1 : 0,
      }],
    };
  }
  if (sql.includes('AS "usosGlobales"')) {
    const pedidosConCupon = pedidos.filter((pedido) => pedido.cupon === datos.codigo);
    return {
      rows: [{
        usosGlobales: pedidosConCupon.length,
        usosCuenta: pedidosConCupon.filter((pedido) => pedido.usuarioId === datos.usuarioId).length,
      }],
    };
  }
  return null;
}

// ---------------------------------------------------------------
// Conexión falsa: misma interfaz que usa enTransaccion() del driver oracledb
// ---------------------------------------------------------------
function crearConexionFalsa() {
  bd.conexiones += 1;
  const conexion = {
    cambios: new Map(), // productoId -> { stock, estado } sin confirmar
    pedidosNuevos: [],
    detallesNuevos: [],
    bloqueados: new Set(),
    cuponesBloqueados: new Set(),
    cerrada: false,
  };

  // Lo que ve ESTA conexión: lo confirmado + sus propios cambios sin confirmar
  const verProducto = (id) => {
    const confirmado = bd.productos.find((p) => p.id === id);
    return confirmado ? { ...confirmado, ...(conexion.cambios.get(id) ?? {}) } : null;
  };

  // SELECT ... FOR UPDATE: si otra conexión tiene la fila, se espera a que termine
  const bloquear = async (id) => {
    for (;;) {
      const bloqueo = bd.bloqueos.get(id);
      if (!bloqueo || bloqueo.dueno === conexion) break;
      await new Promise((seguir) => bloqueo.espera.push(seguir));
    }
    if (!bd.bloqueos.has(id)) bd.bloqueos.set(id, { dueno: conexion, espera: [] });
    conexion.bloqueados.add(id);
  };

  const bloquearCupon = async (codigo) => {
    for (;;) {
      const bloqueo = bd.bloqueosCupones.get(codigo);
      if (!bloqueo || bloqueo.dueno === conexion) break;
      await new Promise((seguir) => bloqueo.espera.push(seguir));
    }
    if (!bd.bloqueosCupones.has(codigo)) {
      bd.bloqueosCupones.set(codigo, { dueno: conexion, espera: [] });
    }
    conexion.cuponesBloqueados.add(codigo);
  };

  const soltarBloqueos = () => {
    for (const id of conexion.bloqueados) {
      const bloqueo = bd.bloqueos.get(id);
      bd.bloqueos.delete(id);
      bloqueo?.espera.forEach((seguir) => seguir());
    }
    conexion.bloqueados.clear();
    for (const codigo of conexion.cuponesBloqueados) {
      const bloqueo = bd.bloqueosCupones.get(codigo);
      bd.bloqueosCupones.delete(codigo);
      bloqueo?.espera.forEach((seguir) => seguir());
    }
    conexion.cuponesBloqueados.clear();
  };

  const descartar = () => {
    conexion.cambios.clear();
    conexion.pedidosNuevos = [];
    conexion.detallesNuevos = [];
    soltarBloqueos();
  };

  return {
    async execute(sql, datos = {}, opciones = {}) {
      if (conexion.cerrada) throw new Error("La conexión ya está cerrada");
      if (opciones.autoCommit !== false) {
        throw new Error("Dentro de una transacción no se puede usar autoCommit");
      }
      bd.sentencias.push({ sql, datos });
      await new Promise((seguir) => setImmediate(seguir)); // como una ida y vuelta a Oracle
      if (bd.fallarEn?.(sql, datos)) throw errorOracle(3113, "falla simulada por la prueba");

      // --- CUPON ---
      if (sql.includes("FROM cupon c")) {
        if (sql.includes("FOR UPDATE")) await bloquearCupon(datos.codigo);
        const resultado = leerCupon(sql, datos, bd.pedidos);
        if (resultado) return resultado;
      }
      const lecturaCupon = leerCupon(
        sql,
        datos,
        [...bd.pedidos, ...conexion.pedidosNuevos],
      );
      if (lecturaCupon) return lecturaCupon;

      // --- PRODUCTO ---
      if (sql.includes("FROM producto p") && sql.includes("FOR UPDATE")) {
        await bloquear(datos.id);
        const producto = verProducto(datos.id); // se lee DESPUÉS de tener el bloqueo
        return { rows: producto ? [producto] : [] };
      }
      if (sql.includes("UPDATE producto") && sql.includes("stock = stock - :cantidad")) {
        const producto = verProducto(datos.id);
        if (
          bd.forzarUpdateSinFilas ||
          !producto ||
          producto.estado !== "Activo" ||
          producto.stock < datos.cantidad
        ) {
          return { rowsAffected: 0 };
        }
        if (!conexion.bloqueados.has(datos.id)) await bloquear(datos.id);
        const stock = producto.stock - datos.cantidad;
        if (stock < 0) throw errorOracle(2290, "restricción CK_PRODUCTO_STOCK violada");
        // Trigger TRG_PRODUCTO_SIN_STOCK: sin unidades queda Inactivo
        conexion.cambios.set(datos.id, { stock, estado: stock <= 0 ? "Inactivo" : producto.estado });
        return { rowsAffected: 1 };
      }
      if (sql.includes("FROM producto p") && sql.includes("p.id = :id")) {
        const producto = verProducto(datos.id);
        return { rows: producto ? [producto] : [] };
      }

      // --- USUARIO ---
      if (sql.includes("FROM usuario u")) {
        return { rows: bd.usuarios.filter((u) => u.id === datos.id).map((u) => ({ ...u })) };
      }

      // --- PEDIDO / DETALLE_PEDIDO ---
      if (sql.includes("seq_pedido.NEXTVAL")) {
        bd.secuenciaPedido += 1; // las secuencias no se devuelven con rollback
        return { rows: [{ id: bd.secuenciaPedido }] };
      }
      if (sql.includes("INSERT INTO pedido")) {
        const todos = [...bd.pedidos, ...conexion.pedidosNuevos];
        if (
          todos.some((p) => p.id === datos.id || p.numero === datos.numero) ||
          (datos.idSolicitud && todos.some((p) => p.idSolicitud === datos.idSolicitud))
        ) {
          throw errorOracle(1, "restricción única violada");
        }
        if (datos.usuarioId !== null && !bd.usuarios.some((u) => u.id === datos.usuarioId)) {
          throw errorOracle(2291, "FK_PEDIDO_USUARIO: clave principal no encontrada");
        }
        if (
          !METODOS_PAGO.includes(datos.metodoPago) ||
          !datos.direccion ||
          !(datos.subtotal > 0) ||
          datos.descuento < 0 ||
          datos.descuento > datos.subtotal ||
          datos.total !== datos.subtotal - datos.descuento
        ) {
          throw errorOracle(2290, "restricción CHECK de PEDIDO violada");
        }
        conexion.pedidosNuevos.push({ ...datos, fecha: new Date(), estado: "Pagado" });
        return { rowsAffected: 1 };
      }
      if (sql.includes("INSERT INTO detalle_pedido")) {
        const pedidoExiste = [...bd.pedidos, ...conexion.pedidosNuevos].some(
          (p) => p.id === datos.pedidoId,
        );
        if (!pedidoExiste || !bd.productos.some((p) => p.id === datos.productoId)) {
          throw errorOracle(2291, "clave principal no encontrada");
        }
        if (
          !(datos.precio > 0) ||
          !(datos.cantidad > 0) ||
          datos.subtotal !== datos.precio * datos.cantidad
        ) {
          throw errorOracle(2290, "restricción CHECK de DETALLE_PEDIDO violada");
        }
        if (
          conexion.detallesNuevos.some(
            (d) =>
              d.pedidoId === datos.pedidoId &&
              (d.productoId === datos.productoId || d.linea === datos.linea),
          )
        ) {
          throw errorOracle(1, "restricción única violada");
        }
        conexion.detallesNuevos.push({ id: bd.siguienteDetalle++, ...datos });
        return { rowsAffected: 1 };
      }
      const lectura = leerPedidos(
        sql,
        datos,
        [...bd.pedidos, ...conexion.pedidosNuevos],
        [...bd.detalles, ...conexion.detallesNuevos],
      );
      if (lectura) return lectura;

      throw new Error(`Sentencia no prevista en la prueba: ${sql}`);
    },

    async commit() {
      if (bd.fallarCommit) throw errorOracle(3113, "falla simulada en el commit");
      for (const [id, cambio] of conexion.cambios) {
        Object.assign(bd.productos.find((p) => p.id === id), cambio);
      }
      bd.pedidos.push(...conexion.pedidosNuevos);
      bd.detalles.push(...conexion.detallesNuevos);
      bd.commits += 1;
      descartar();
    },

    async rollback() {
      bd.rollbacks += 1;
      descartar();
    },

    async close() {
      descartar(); // Oracle también deshace lo pendiente si se cierra sin commit
      conexion.cerrada = true;
      bd.cierres += 1;
    },
  };
}

// ejecutar() normal (fuera de transacción): solo ve datos confirmados.
// `otrasConsultas(sql, datos)` permite atender consultas adicionales (devuelve undefined si no es suya).
export function instalarBaseFalsa(otrasConsultas) {
  usarConexionDePrueba(async () => crearConexionFalsa());
  usarEjecutorDePrueba(async (sql, datos) => {
    const adicional = await otrasConsultas?.(sql, datos);
    if (adicional) return adicional;
    const cupon = leerCupon(sql, datos, bd.pedidos);
    if (cupon) return { filas: cupon.rows, afectadas: 0 };
    const lectura = leerPedidos(sql, datos, bd.pedidos, bd.detalles);
    if (lectura) return { filas: lectura.rows, afectadas: 0 };
    if (sql.includes("WHERE p.id = :id")) {
      return { filas: bd.productos.filter((p) => p.id === datos.id), afectadas: 0 };
    }
    if (sql.includes("ORDER BY p.id")) {
      return { filas: bd.productos, afectadas: 0 };
    }
    throw new Error(`Consulta no prevista en la prueba: ${sql}`);
  });
}

// ---------------------------------------------------------------
// Servidor de prueba: llamar UNA vez al inicio de cada archivo .test.js
// ---------------------------------------------------------------
let servidor;
let API;
let erroresDeConsola = [];
let consolaOriginal;

export function prepararEntorno() {
  before(async () => {
    instalarBaseFalsa();
    // Los errores 500 se registran con console.error: se guardan para revisarlos sin ensuciar la salida
    consolaOriginal = console.error;
    console.error = (...argumentos) => erroresDeConsola.push(argumentos);
    await new Promise((listo) => {
      servidor = crearApp().listen(0, "127.0.0.1", listo);
    });
    API = `http://127.0.0.1:${servidor.address().port}`;
  });

  after(async () => {
    console.error = consolaOriginal;
    await new Promise((listo) => servidor.close(listo));
  });

  beforeEach(() => {
    reiniciarBase();
    erroresDeConsola = [];
  });
}

export const erroresRegistrados = () => erroresDeConsola;

// ---------------------------------------------------------------
// Peticiones
// ---------------------------------------------------------------
export const tokenDe = (usuario) => crearToken({ id: usuario.id, rol: usuario.rol });

export async function pedir(ruta, { metodo = "GET", cuerpo, token, cabeceras = {}, crudo } = {}) {
  const headers = { ...cabeceras };
  if (cuerpo !== undefined || crudo !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const respuesta = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers,
    body: crudo ?? (cuerpo === undefined ? undefined : JSON.stringify(cuerpo)),
  });
  return { estado: respuesta.status, cuerpo: await respuesta.json() };
}

// Compra válida mínima: se le pasan los artículos y lo que se quiera cambiar
export const compraValida = (articulos, extra = {}) => ({
  articulos,
  metodoPago: "Daviplata",
  direccion: "Calle 10A Norte #25A-03",
  ...extra,
});

const usuarioDePrueba = () =>
  bd.usuarios.find((usuario) => usuario.usuario === "cliente-prueba") ??
  agregarUsuario({
    usuario: "cliente-prueba",
    identificacion: "999999999",
    correo: "cliente-prueba@example.com",
  });

export const comprar = (cuerpo, opciones = {}) => {
  const { sinSesion = false, token, ...otrasOpciones } = opciones;
  return pedir("/api/pedidos", {
    metodo: "POST",
    cuerpo,
    ...otrasOpciones,
    ...(!sinSesion ? { token: token ?? tokenDe(usuarioDePrueba()) } : {}),
  });
};

export const consultar = (numero, opciones = {}) => pedir(`/api/pedidos/${numero}`, opciones);
