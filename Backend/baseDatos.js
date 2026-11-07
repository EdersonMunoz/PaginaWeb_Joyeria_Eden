// Conexión a la base de datos Oracle.
// Todas las rutas usan ejecutar(sql, datos) y no se preocupan por abrir o cerrar conexiones.
import oracledb from "oracledb";
import { urlFoto } from "./almacenFotos.js";

let pool = null;
let ejecutorDePrueba = null;

export async function iniciarBaseDatos() {
  // Base en Oracle Cloud (Autonomous Database): se conecta con el "wallet",
  // la carpeta descomprimida que se descarga de la consola de Oracle Cloud.
  // Si DB_WALLET está vacío, se conecta a un Oracle local como antes.
  const wallet = process.env.DB_WALLET;
  pool = await oracledb.createPool({
    user: process.env.DB_USUARIO,
    password: process.env.DB_CLAVE,
    connectString: process.env.DB_CONEXION,
    poolMin: 1,
    poolMax: 5,
    ...(wallet
      ? {
          configDir: wallet,
          walletLocation: wallet,
          walletPassword: process.env.DB_WALLET_CLAVE,
        }
      : {}),
  });
}

export async function cerrarBaseDatos() {
  if (pool) {
    await pool.close(5);
    pool = null;
  }
}

// Ejecuta una sentencia y confirma (commit) automáticamente.
// Devuelve { filas, afectadas }.
export async function ejecutar(sql, datos = {}) {
  if (ejecutorDePrueba) {
    return ejecutorDePrueba(sql, datos);
  }

  const conexion = await oracledb.getConnection();
  try {
    const resultado = await conexion.execute(sql, datos, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
    });
    return {
      filas: resultado.rows ?? [],
      afectadas: resultado.rowsAffected ?? 0,
    };
  } finally {
    await conexion.close();
  }
}

// Solo para pruebas automáticas sin Oracle.
export function usarEjecutorDePrueba(funcion) {
  ejecutorDePrueba = funcion;
}

// ---------------------------------------------------------------
// Consultas compartidas por varias historias
// ---------------------------------------------------------------
// En la columna IMAGEN está el nombre de la foto dentro del bucket;
// al frontend se le entrega la dirección completa para mostrarla.
export const conUrlFoto = (producto) =>
  producto && { ...producto, imagen: urlFoto(producto.imagen) };

export const SELECT_PRODUCTO = `
  SELECT p.id AS "id", p.ref AS "ref", p.nombre AS "nombre", p.precio AS "precio",
         c.nombre AS "categoria", p.stock AS "stock", p.descripcion AS "descripcion",
         p.imagen AS "imagen", p.estado AS "estado"
    FROM producto p
    JOIN categoria c ON c.id = p.categoria_id`;

export async function buscarProductoPorId(id) {
  const { filas } = await ejecutar(`${SELECT_PRODUCTO} WHERE p.id = :id`, { id });
  return conUrlFoto(filas[0]) ?? null;
}

export async function buscarProductoPorReferencia(ref) {
  const { filas } = await ejecutar(
    `${SELECT_PRODUCTO} WHERE UPPER(p.ref) = UPPER(:ref)`,
    { ref },
  );
  return conUrlFoto(filas[0]) ?? null;
}
