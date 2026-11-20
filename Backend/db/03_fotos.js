// =============================================================
//  Joyería y Perfumería EDEN - Épica 1: Gestión de productos
//  Paso 3 de 3: subir las fotos de los productos de prueba al
//  bucket "eden-fotos" de Oracle Cloud (Object Storage).
//
//  Usa FOTOS_PAR_URL del archivo .env. Ejecutar UNA vez:
//      cd Backend
//      npm run fotos
//  Los nombres coinciden con la columna imagen de 02_datos.sql.
// =============================================================
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { subirAlBucket, urlFoto } from "../almacenFotos.js";

// Las fotos de prueba están en Frontend/public/productos
const carpeta = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..", "..", "Frontend", "public", "productos",
);

const TIPOS = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

let fallas = 0;
for (const archivo of fs.readdirSync(carpeta)) {
  const tipo = TIPOS[path.extname(archivo).toLowerCase()];
  if (!tipo) continue;
  const nombre = `productos/${archivo}`;
  try {
    const bytes = fs.readFileSync(path.join(carpeta, archivo));
    await subirAlBucket(nombre, bytes, tipo);
    console.log(`✅ ${nombre} (${Math.round(bytes.length / 1024)} KB)`);
  } catch (error) {
    console.log(`❌ ${nombre}: ${error.message}`);
    fallas += 1;
  }
}

if (fallas === 0) {
  console.log(`\nListo. Prueba abrir en el navegador:\n${urlFoto("productos/AnilloOro.jpeg")}`);
} else {
  console.log(`\n${fallas} foto(s) no se subieron. Revisa FOTOS_PAR_URL en el .env`);
}
process.exit(fallas === 0 ? 0 : 1);
