import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const VIGENCIA_SEGUNDOS = 8 * 60 * 60;
let secreto = process.env.SECRETO_SESION;

if (!secreto) {
  secreto = randomBytes(32).toString("hex");
  console.warn("SECRETO_SESION no está definido; los tokens dejarán de valer al reiniciar.");
}

function firmar(payload) {
  return createHmac("sha256", secreto).update(payload).digest("base64url");
}

export function crearToken({ id, rol }) {
  const payload = Buffer.from(
    JSON.stringify({
      id,
      rol,
      exp: Math.floor(Date.now() / 1000) + VIGENCIA_SEGUNDOS,
    }),
  ).toString("base64url");
  return `${payload}.${firmar(payload)}`;
}

export function verificarToken(token) {
  if (typeof token !== "string") return null;

  const partes = token.split(".");
  if (partes.length !== 2 || !partes[0] || !partes[1]) return null;

  const [payloadCodificado, firmaCodificada] = partes;
  const firmaRecibida = Buffer.from(firmaCodificada, "base64url");
  const firmaEsperada = Buffer.from(firmar(payloadCodificado), "base64url");
  if (
    firmaRecibida.length !== firmaEsperada.length ||
    !timingSafeEqual(firmaRecibida, firmaEsperada)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadCodificado, "base64url").toString("utf8"));
    if (
      !payload ||
      (typeof payload.id !== "number" && typeof payload.id !== "string") ||
      typeof payload.rol !== "string" ||
      !Number.isInteger(payload.exp) ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function requiereSesion(req, res, next) {
  const autorizacion = req.get("Authorization") ?? "";
  const coincidencia = /^Bearer\s+(\S+)$/i.exec(autorizacion);
  const sesion = coincidencia ? verificarToken(coincidencia[1]) : null;
  if (!sesion) {
    return res.status(401).json({ mensaje: "Debes iniciar sesión" });
  }
  req.sesion = sesion;
  return next();
}

export function requiereRol(rol) {
  return (req, res, next) => {
    if (req.sesion?.rol !== rol) {
      return res.status(403).json({ mensaje: "No tienes permiso para esta acción" });
    }
    return next();
  };
}
