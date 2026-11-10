import { createHash } from "node:crypto";
import { Router } from "express";
import { ejecutar } from "../baseDatos.js";

const router = Router();

const hashPassword = (password) =>
  createHash("sha256").update(password, "utf8").digest("hex");

function validarDatosCuenta(cuerpo, { passwordOpcional = false } = {}) {
  const datos = {
    nombre: String(cuerpo?.nombre ?? "").trim(),
    identificacion: String(cuerpo?.identificacion ?? "").trim(),
    telefono: String(cuerpo?.telefono ?? "").trim(),
    usuario: String(cuerpo?.usuario ?? "").trim(),
    correo: String(cuerpo?.correo ?? "").trim().toLowerCase(),
    password: String(cuerpo?.password ?? ""),
    direccion: String(cuerpo?.direccion ?? "").trim(),
  };
  const faltanCampos =
    !datos.nombre ||
    !datos.identificacion ||
    !datos.telefono ||
    !datos.usuario ||
    !datos.correo ||
    (!passwordOpcional && !datos.password) ||
    !datos.direccion;

  if (faltanCampos) {
    return {
      datos,
      codigo: "CAMPOS_VACIOS",
      mensaje: "Por favor, complete todos los campos obligatorios",
    };
  }

  const passwordInvalida =
    (!passwordOpcional || datos.password !== "") &&
    (datos.password.length < 8 || !datos.password.trim());
  const formatoInvalido =
    datos.nombre.length > 100 ||
    datos.identificacion.length > 30 ||
    !/^\+?[\d ]{7,20}$/.test(datos.telefono) ||
    !/^[a-zA-Z0-9._-]{3,30}$/.test(datos.usuario) ||
    datos.correo.length > 150 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo) ||
    datos.direccion.length > 300 ||
    passwordInvalida;

  return formatoInvalido
    ? {
        datos,
        codigo: "FORMATO_INVALIDO",
        mensaje: "Uno o más campos no cuentan con el formato adecuado",
      }
    : { datos };
}

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
  const validacion = validarDatosCuenta(req.body);
  if (validacion.mensaje) {
    return res.status(400).json({
      mensaje: validacion.mensaje,
      codigo: validacion.codigo,
    });
  }
  const { nombre, identificacion, telefono, usuario, correo, password, direccion } = validacion.datos;

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
  const validacion = validarDatosCuenta(req.body, { passwordOpcional: true });
  if (!Number.isInteger(id)) {
    return res.status(400).json({
      mensaje: "Uno o más campos no cuentan con el formato adecuado",
      codigo: "FORMATO_INVALIDO",
    });
  }
  if (validacion.mensaje) {
    return res.status(400).json({
      mensaje: validacion.mensaje,
      codigo: validacion.codigo,
    });
  }
  const { nombre, identificacion, telefono, usuario, correo, password, direccion } = validacion.datos;

  try {
    const camposPassword = password
      ? ", password_hash = :passwordHash"
      : "";
    const resultado = await ejecutar(
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
    if (resultado.afectadas === 0) {
      return res.status(404).json({ mensaje: "La cuenta no existe" });
    }
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
  const resultado = await ejecutar(
    `UPDATE usuario SET estado = 'Inactivo' WHERE id = :id`,
    { id },
  );
  if (resultado.afectadas === 0) {
    return res.status(404).json({ mensaje: "La cuenta no existe" });
  }
  return res.json({ mensaje: "Cuenta actualizada", estado: "Inactivo" });
});

export default router;
