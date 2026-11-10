export function esUsuarioValido(texto) {
  return typeof texto === "string" && /^[a-zA-Z0-9._-]{3,30}$/.test(texto);
}

export function esTelefonoValido(texto) {
  return typeof texto === "string" && /^\+?[\d ]{7,20}$/.test(texto);
}

export function esCorreoValido(texto) {
  return (
    typeof texto === "string" &&
    texto.length <= 150 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto)
  );
}

export function esPasswordValida(texto) {
  return typeof texto === "string" && texto.length >= 8 && Boolean(texto.trim());
}
