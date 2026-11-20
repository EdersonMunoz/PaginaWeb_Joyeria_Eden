// Recibe la foto del producto (HU1 y HU2).
// La foto ya NO se guarda en una carpeta del backend: queda un momento en
// memoria (req.file.buffer) y las rutas la suben al bucket de Oracle Cloud
// (ver almacenFotos.js). En la base de datos solo queda su nombre.
import multer from "multer";

// Recibe un solo archivo en el campo "foto": solo imágenes de máximo 5 MB
export const subirFoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, archivo, listo) => {
    if (archivo.mimetype.startsWith("image/")) {
      listo(null, true);
    } else {
      listo(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "foto"));
    }
  },
}).single("foto");
