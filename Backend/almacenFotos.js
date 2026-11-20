// Fotos de los productos en la nube: OCI Object Storage (bucket "eden-fotos").
// La base de datos NO guarda la foto: solo guarda su nombre dentro del bucket
// (por ejemplo "productos/ANI00001-1730745600000.jpg") en la columna IMAGEN.
//
// FOTOS_PAR_URL (en el .env) es la "Pre-Authenticated Request" del bucket:
// una dirección secreta que deja SUBIR fotos sin usuario ni contraseña.
//   https://objectstorage.<region>.oraclecloud.com/p/<token>/n/<namespace>/b/eden-fotos/o/
// Para VER las fotos se usa la misma dirección sin la parte secreta "/p/<token>"
// (funciona porque el bucket es público para lectura).

let almacenDePrueba = null;

const parUrl = () => {
  const url = process.env.FOTOS_PAR_URL;
  if (!url) throw new Error("Falta FOTOS_PAR_URL en el archivo .env");
  return url.endsWith("/") ? url : `${url}/`;
};

// "productos/Anillo de oro.jpg" -> "productos/Anillo%20de%20oro.jpg"
const codificar = (nombre) => nombre.split("/").map(encodeURIComponent).join("/");

// Dirección pública con la que el navegador muestra la foto
export function urlFoto(nombre) {
  if (!nombre) return null;
  if (/^https?:\/\//.test(nombre)) return nombre;
  const publica = process.env.FOTOS_URL_PUBLICA || parUrl().replace(/\/p\/[^/]+/, "");
  return `${publica.endsWith("/") ? publica : `${publica}/`}${codificar(nombre)}`;
}

// Sube los bytes de la foto al bucket con el nombre indicado
export async function subirAlBucket(nombre, bytes, tipo) {
  if (almacenDePrueba) return almacenDePrueba(nombre, bytes, tipo);

  const respuesta = await fetch(`${parUrl()}${codificar(nombre)}`, {
    method: "PUT",
    headers: { "Content-Type": tipo },
    body: bytes,
  });
  if (!respuesta.ok) {
    throw new Error(`El bucket respondió ${respuesta.status}: ${await respuesta.text()}`);
  }
}

// Nombre único para una foto nueva: productos/<referencia>-<momento>.<extensión>
export function nombreFoto(ref, archivo) {
  const extension = (archivo.originalname.match(/\.[a-z0-9]+$/i)?.[0] ?? ".jpg").toLowerCase();
  const limpia = String(ref).replace(/[^A-Za-z0-9_-]/g, "") || "producto";
  return `productos/${limpia}-${Date.now()}${extension}`;
}

// Solo para pruebas automáticas sin internet
export function usarAlmacenDePrueba(funcion) {
  almacenDePrueba = funcion;
}
