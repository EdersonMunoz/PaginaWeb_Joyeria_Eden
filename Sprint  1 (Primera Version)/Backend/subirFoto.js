// Guarda la foto del producto en la carpeta fotos/ (HU1 y HU2).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";

const carpetaFotos = path.join(path.dirname(fileURLToPath(import.meta.url)), "fotos");
fs.mkdirSync(carpetaFotos, { recursive: true });

const almacenamiento = multer.diskStorage({
  destination: carpetaFotos,
  filename: (_req, archivo, listo) => {
    const extension = path.extname(archivo.originalname).toLowerCase() || ".jpg";
    const nombre = `${Date.now()}-${Math.round(Math.random() * 1e6)}${extension}`;
    listo(null, nombre);
  },
});

// Recibe un solo archivo en el campo "foto": solo imágenes de máximo 5 MB
export const subirFoto = multer({
  storage: almacenamiento,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, archivo, listo) => {
    if (archivo.mimetype.startsWith("image/")) {
      listo(null, true);
    } else {
      listo(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "foto"));
    }
  },
}).single("foto");

// Ruta pública con la que el frontend muestra la foto
export const rutaPublicaFoto = (archivo) => `/fotos/${archivo.filename}`;

// Borra una foto subida (por ejemplo, si el formulario tenía errores)
export function borrarFoto(rutaPublica) {
  if (!rutaPublica || !rutaPublica.startsWith("/fotos/")) return;
  const archivo = path.join(carpetaFotos, path.basename(rutaPublica));
  fs.rm(archivo, { force: true }, () => {});
}

export { carpetaFotos };
