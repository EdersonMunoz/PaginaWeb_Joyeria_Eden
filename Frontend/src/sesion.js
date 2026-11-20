const CLAVE_USUARIO = "eden.usuario";
const CLAVE_TOKEN = "eden.token";

function obtenerAlmacen(almacen) {
  return typeof almacen?.getItem === "function" ? almacen : globalThis.localStorage;
}

function obtenerAlmacenes(almacen) {
  if (typeof almacen?.getItem === "function") {
    return [almacen];
  }

  return [globalThis.localStorage, globalThis.sessionStorage].filter(
    (destino) => typeof destino?.getItem === "function",
  );
}

export function guardarSesion(usuario, token, almacen) {
  try {
    const destino = obtenerAlmacen(almacen);
    destino.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    destino.setItem(CLAVE_TOKEN, token);
    return true;
  } catch {
    return false;
  }
}

export function obtenerUsuario(almacen) {
  for (const destino of obtenerAlmacenes(almacen)) {
    try {
      const usuario = destino.getItem(CLAVE_USUARIO);
      if (usuario) return JSON.parse(usuario);
    } catch {
      continue;
    }
  }
  return null;
}

export function obtenerToken(almacen) {
  for (const destino of obtenerAlmacenes(almacen)) {
    try {
      const token = destino.getItem(CLAVE_TOKEN);
      if (token) return token;
    } catch {
      continue;
    }
  }
  return null;
}

export function actualizarUsuario(usuario, almacen) {
  try {
    obtenerAlmacen(almacen).setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    return true;
  } catch {
    return false;
  }
}

export function cerrarSesion(almacen) {
  let limpiado = false;
  for (const destino of obtenerAlmacenes(almacen)) {
    try {
      destino.removeItem(CLAVE_USUARIO);
      destino.removeItem(CLAVE_TOKEN);
      limpiado = true;
    } catch {
      continue;
    }
  }
  return limpiado;
}

export function decidirAcceso(usuario, rolRequerido) {
  if (!usuario) return "/InicioSesion";

  const rolUsuario = String(usuario.rol ?? "").toLowerCase();
  const rolSolicitado = String(rolRequerido ?? "").toLowerCase();
  if (rolUsuario === rolSolicitado) return "permitir";
  return rolUsuario === "admin" ? "/Admin" : "/Usuario";
}
