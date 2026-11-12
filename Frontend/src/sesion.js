const CLAVE_USUARIO = "eden.usuario";
const CLAVE_TOKEN = "eden.token";

function obtenerAlmacen(almacen) {
  return typeof almacen?.getItem === "function" ? almacen : globalThis.localStorage;
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
  try {
    const usuario = obtenerAlmacen(almacen).getItem(CLAVE_USUARIO);
    return usuario ? JSON.parse(usuario) : null;
  } catch {
    return null;
  }
}

export function obtenerToken(almacen) {
  try {
    return obtenerAlmacen(almacen).getItem(CLAVE_TOKEN) || null;
  } catch {
    return null;
  }
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
  try {
    const destino = obtenerAlmacen(almacen);
    destino.removeItem(CLAVE_USUARIO);
    destino.removeItem(CLAVE_TOKEN);
    return true;
  } catch {
    return false;
  }
}

export function decidirAcceso(usuario, rolRequerido) {
  if (!usuario) return "/InicioSesion";

  const rolUsuario = String(usuario.rol ?? "").toLowerCase();
  const rolSolicitado = String(rolRequerido ?? "").toLowerCase();
  if (rolUsuario === rolSolicitado) return "permitir";
  return rolUsuario === "admin" ? "/Admin" : "/Usuario";
}
