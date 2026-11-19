// Pruebas de enTransaccion() de baseDatos.js (Sprint 3).
// Usan una conexión "espía" con la misma interfaz del driver oracledb
// (execute, commit, rollback, close) para comprobar qué se le pide a Oracle.
// No se conectan a ninguna base de datos.
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import oracledb from "oracledb";
import { enTransaccion, usarConexionDePrueba } from "../baseDatos.js";

let llamadas;
let fallas;

function conexionEspia() {
  const registrar = (nombre, valor) => async (...argumentos) => {
    llamadas.push([nombre, ...argumentos]);
    if (fallas[nombre]) throw fallas[nombre];
    return valor;
  };
  return {
    execute: registrar("execute", { rows: [{ id: 7 }], rowsAffected: 1 }),
    commit: registrar("commit"),
    rollback: registrar("rollback"),
    close: registrar("close"),
  };
}

const nombres = () => llamadas.map(([nombre]) => nombre);

beforeEach(() => {
  llamadas = [];
  fallas = {};
  usarConexionDePrueba(async () => conexionEspia());
});

describe("enTransaccion · transacciones reales con el driver de Oracle", () => {
  test("TX-01 · (+) Si el trabajo termina bien: ejecuta, COMMIT una vez y cierra la conexión", async () => {
    const resultado = await enTransaccion(async (tx) => {
      await tx.ejecutar("UPDATE producto SET stock = stock - :cantidad WHERE id = :id", { id: 1, cantidad: 2 });
      await tx.ejecutar("INSERT INTO pedido (id) VALUES (:id)", { id: 9 });
      return "listo";
    });

    assert.equal(resultado, "listo");
    assert.deepEqual(nombres(), ["execute", "execute", "commit", "close"]);
  });

  test("TX-02 · Las sentencias van SIN autoCommit, con parámetros y en la misma conexión", async () => {
    await enTransaccion((tx) => tx.ejecutar("SELECT 1 FROM dual WHERE :a = :a", { a: 1 }));

    const [, sql, datos, opciones] = llamadas[0];
    assert.equal(sql, "SELECT 1 FROM dual WHERE :a = :a");
    assert.deepEqual(datos, { a: 1 });
    assert.equal(opciones.autoCommit, false);
    assert.equal(opciones.outFormat, oracledb.OUT_FORMAT_OBJECT);
  });

  test("TX-03 · ejecutar devuelve { filas, afectadas } igual que el ejecutar() normal", async () => {
    const resultado = await enTransaccion((tx) => tx.ejecutar("SELECT id FROM pedido"));

    assert.deepEqual(resultado, { filas: [{ id: 7 }], afectadas: 1 });
  });

  test("TX-04 · (-) Si el trabajo lanza un error: ROLLBACK, sin COMMIT, cierra y relanza el mismo error", async () => {
    const original = new Error("stock insuficiente");

    await assert.rejects(
      enTransaccion(async (tx) => {
        await tx.ejecutar("UPDATE producto SET stock = 0");
        throw original;
      }),
      (error) => error === original,
    );

    assert.deepEqual(nombres(), ["execute", "rollback", "close"]);
  });

  test("TX-05 · (-) Si una sentencia falla en Oracle: ROLLBACK y no se ejecuta nada más", async () => {
    fallas.execute = Object.assign(new Error("ORA-02290"), { errorNum: 2290 });
    let continuo = false;

    await assert.rejects(
      enTransaccion(async (tx) => {
        await tx.ejecutar("INSERT INTO pedido (id) VALUES (1)");
        continuo = true;
      }),
      { errorNum: 2290 },
    );

    assert.equal(continuo, false);
    assert.deepEqual(nombres(), ["execute", "rollback", "close"]);
  });

  test("TX-06 · (-) Si falla el COMMIT: se intenta ROLLBACK, se cierra y se informa el error", async () => {
    fallas.commit = new Error("ORA-03113");

    await assert.rejects(enTransaccion((tx) => tx.ejecutar("UPDATE producto SET stock = 1")), /ORA-03113/);

    assert.deepEqual(nombres(), ["execute", "commit", "rollback", "close"]);
  });

  test("TX-07 · (-) Si también falla el ROLLBACK: se conserva el error original y la conexión se cierra", async () => {
    fallas.rollback = new Error("conexión perdida");
    const consola = console.error;
    console.error = () => {};
    try {
      await assert.rejects(
        enTransaccion(async () => {
          throw new Error("error original");
        }),
        /error original/,
      );
    } finally {
      console.error = consola;
    }

    assert.deepEqual(nombres(), ["rollback", "close"]);
  });

  test("TX-08 · Cada transacción pide su propia conexión", async () => {
    let conexiones = 0;
    usarConexionDePrueba(async () => {
      conexiones += 1;
      return conexionEspia();
    });

    await Promise.all([enTransaccion(async () => {}), enTransaccion(async () => {})]);

    assert.equal(conexiones, 2);
    assert.equal(nombres().filter((nombre) => nombre === "commit").length, 2);
    assert.equal(nombres().filter((nombre) => nombre === "close").length, 2);
  });
});
