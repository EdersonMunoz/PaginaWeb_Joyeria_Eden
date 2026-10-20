// Conexión a la base de datos Oracle.
// Todas las rutas usan ejecutar(sql, datos) y no se preocupan por abrir o cerrar conexiones.
import oracledb from "oracledb";

let pool = null;
let ejecutorDePrueba = null;

export async function iniciarBaseDatos() {
  pool = await oracledb.createPool({
    user: process.env.DB_USUARIO,
    password: process.env.DB_CLAVE,
    connectString: process.env.DB_CONEXION,
    poolMin: 1,
    poolMax: 5,
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
export const SELECT_PRODUCTO = `
  SELECT p.id AS "id", p.ref AS "ref", p.nombre AS "nombre", p.precio AS "precio",
         c.nombre AS "categoria", p.stock AS "stock", p.descripcion AS "descripcion",
         p.imagen AS "imagen", p.estado AS "estado"
    FROM producto p
    JOIN categoria c ON c.id = p.categoria_id`;

export async function buscarProductoPorId(id) {
  const { filas } = await ejecutar(`${SELECT_PRODUCTO} WHERE p.id = :id`, { id });
  return filas[0] ?? null;
}

export async function buscarProductoPorReferencia(ref) {
  const { filas } = await ejecutar(
    `${SELECT_PRODUCTO} WHERE UPPER(p.ref) = UPPER(:ref)`,
    { ref },
  );
  return filas[0] ?? null;
}
