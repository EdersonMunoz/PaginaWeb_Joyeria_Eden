import { createHash } from "node:crypto";
import { Router } from "express";
import { ejecutar } from "../baseDatos.js";

const router = Router();

const hashPassword = (password) =>
  createHash("sha256").update(password, "utf8").digest("hex");

router.post("/login", async (req, res) => {
  const identificador = String(req.body?.identificador ?? "").trim();
  const password = String(req.body?.password ?? "");

  if (!identificador || !password) {
    return res.status(400).json({ mensaje: "El usuario y la contraseña son obligatorios." });
  }

  const { filas } = await ejecutar(
    `SELECT id AS "id", nombre AS "nombre", identificacion AS "identificacion",
            telefono AS "telefono", direccion AS "direccion", correo AS "correo",
            usuario AS "usuario", password_hash AS "passwordHash",
            rol AS "rol", estado AS "estado"
       FROM usuario
      WHERE LOWER(correo) = LOWER(:identificador)
         OR LOWER(usuario) = LOWER(:identificador)`,
    { identificador },
  );
  const cuenta = filas[0];

  if (!cuenta) {
    return res.status(404).json({
      mensaje: "Las credenciales ingresadas no corresponden a ninguna cuenta",
      codigo: "CUENTA_NO_EXISTE",
    });
  }

  if (cuenta.passwordHash !== hashPassword(password)) {
    return res.status(401).json({
      mensaje: "Correo/Nombre usuario o contraseña incorrectos, vuelve a intentarlo",
      codigo: "CREDENCIALES_INCORRECTAS",
    });
  }

  if (cuenta.estado === "Inactivo") {
    await ejecutar(`UPDATE usuario SET estado = 'Activo' WHERE id = :id`, { id: cuenta.id });
    cuenta.estado = "Activo";
  }

  return res.json({
    usuario: {
      id: cuenta.id,
      nombre: cuenta.nombre,
      identificacion: cuenta.identificacion,
      telefono: cuenta.telefono,
      direccion: cuenta.direccion,
      correo: cuenta.correo,
      usuario: cuenta.usuario,
      rol: cuenta.rol,
      estado: cuenta.estado,
    },
  });
});

router.post("/registro", async (req, res) => {
  const nombre = String(req.body?.nombre ?? "").trim();
  const identificacion = String(req.body?.identificacion ?? "").trim();
  const telefono = String(req.body?.telefono ?? "").trim();
  const usuario = String(req.body?.usuario ?? "").trim();
  const correo = String(req.body?.correo ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  const direccion = String(req.body?.direccion ?? "").trim();

  if (!nombre || !identificacion || !telefono || !usuario || !correo || !password || !direccion) {
    return res.status(400).json({
      mensaje: "Por favor, complete todos los campos obligatorios",
      codigo: "CAMPOS_VACIOS",
    });
  }
  if (
    identificacion.length > 30 ||
    telefono.length > 20 ||
    nombre.length > 100 ||
    usuario.length > 50 ||
    correo.length > 150 ||
    direccion.length > 300 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ||
    password.length < 8
  ) {
    return res.status(400).json({
      mensaje: "Uno o más campos no cuentan con el formato adecuado",
      codigo: "FORMATO_INVALIDO",
    });
  }

  const rol = usuario.toLowerCase().startsWith("admin") ? "admin" : "cliente";
  try {
    await ejecutar(
      `INSERT INTO usuario
         (nombre, identificacion, telefono, correo, usuario, direccion, password_hash, rol, estado)
       VALUES
         (:nombre, :identificacion, :telefono, :correo, :usuario, :direccion, :passwordHash, :rol, 'Activo')`,
      {
        nombre,
        identificacion,
        telefono,
        correo,
        usuario,
        direccion,
        passwordHash: hashPassword(password),
        rol,
      },
    );
  } catch (error) {
    if (error.errorNum === 1) {
      return res.status(409).json({
        mensaje: "El correo o nombre de usuario ya está registrado",
        codigo: "CUENTA_DUPLICADA",
      });
    }
    throw error;
  }

  return res.status(201).json({ mensaje: "Se registro la cuenta con exito" });
});

router.put("/cuenta/:id", async (req, res) => {
  const id = Number(req.params.id);
  const nombre = String(req.body?.nombre ?? "").trim();
  const identificacion = String(req.body?.identificacion ?? "").trim();
  const telefono = String(req.body?.telefono ?? "").trim();
  const usuario = String(req.body?.usuario ?? "").trim();
  const correo = String(req.body?.correo ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  const direccion = String(req.body?.direccion ?? "").trim();

  if (
    !Number.isInteger(id) ||
    !nombre ||
    !identificacion ||
    identificacion.length > 30 ||
    !telefono ||
    telefono.length > 20 ||
    nombre.length > 100 ||
    !usuario ||
    usuario.length > 50 ||
    !correo ||
    correo.length > 150 ||
    !direccion ||
    direccion.length > 300 ||
    (password && password.length < 8)
  ) {
    return res.status(400).json({
      mensaje: "Uno o más campos no cuentan con el formato adecuado",
      codigo: "FORMATO_INVALIDO",
    });
  }

  try {
    const camposPassword = password
      ? ", password_hash = :passwordHash"
      : "";
    await ejecutar(
      `UPDATE usuario
          SET nombre = :nombre, identificacion = :identificacion,
              telefono = :telefono, usuario = :usuario,
              correo = :correo, direccion = :direccion${camposPassword}
        WHERE id = :id`,
      {
        id,
        nombre,
        identificacion,
        telefono,
        usuario,
        correo,
        direccion,
        ...(password ? { passwordHash: hashPassword(password) } : {}),
      },
    );
  } catch (error) {
    if (error.errorNum === 1) {
      return res.status(409).json({
        mensaje: "El correo o nombre de usuario ya está registrado",
        codigo: "CUENTA_DUPLICADA",
      });
    }
    throw error;
  }

  return res.json({ mensaje: "La información de la cuenta se actualizó correctamente" });
});

router.patch("/cuenta/:id/estado", async (req, res) => {
  const id = Number(req.params.id);
  const estado = String(req.body?.estado ?? "");
  if (!Number.isInteger(id) || !["Activo", "Inactivo"].includes(estado)) {
    return res.status(400).json({ mensaje: "Estado de cuenta inválido" });
  }

  await ejecutar(
    `UPDATE usuario SET estado = :estado WHERE id = :id`,
    { id, estado },
  );
  return res.json({ mensaje: "Cuenta actualizada", estado });
});

router.patch("/cuenta/:id/desactivar", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ mensaje: "Identificador de cuenta inválido" });
  }
  await ejecutar(
    `UPDATE usuario SET estado = 'Inactivo' WHERE id = :id`,
    { id },
  );
  return res.json({ mensaje: "Cuenta actualizada", estado: "Inactivo" });
});

export default router;
