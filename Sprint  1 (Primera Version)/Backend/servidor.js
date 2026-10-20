// Servidor del backend de Joyería y Perfumería EDEN
// Arranca con:  npm start   (o  npm run dev  para que se reinicie al guardar)
import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { pathToFileURL } from "node:url";
import { iniciarBaseDatos, cerrarBaseDatos } from "./baseDatos.js";
import { carpetaFotos } from "./subirFoto.js";

import consultarCatalogo from "./rutas/consultarCatalogo.js"; // HU3
import registrarProducto from "./rutas/registrarProducto.js"; // HU1
import modificarProducto from "./rutas/modificarProducto.js"; // HU2
import gestionarEstado from "./rutas/gestionarEstado.js"; // HU4

export function crearApp() {
  const app = express();

  // Direcciones del frontend que pueden usar el backend (separadas por coma).
  // Además se acepta la página en cualquier puerto de este mismo computador
  // (Vite usa 5174, 5175... cuando el 5173 está ocupado).
  const origenes = (process.env.FRONTEND_URL ?? "http://localhost:5173,http://localhost:4173")
    .split(",")
    .map((origen) => origen.trim());
  const esLocal = (origen) => /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origen);
  app.use(
    cors({
      origin: (origen, listo) => listo(null, !origen || origenes.includes(origen) || esLocal(origen)),
    }),
  );
  app.use(express.json());
  app.use("/fotos", express.static(carpetaFotos));

  app.get("/api/salud", (_req, res) => res.json({ ok: true }));

  // Una línea por página (cada integrante trabaja en su archivo de rutas/)
  app.use("/api/productos", consultarCatalogo); // HU3 · Consultar catálogo
  app.use("/api/productos", registrarProducto); // HU1 · Registrar producto
  app.use("/api/productos", modificarProducto); // HU2 · Modificar producto
  app.use("/api/productos", gestionarEstado); //   HU4 · Inactivar y activar

  app.use((_req, res) => res.status(404).json({ mensaje: "Ruta no encontrada" }));

  // Errores no controlados
  app.use((error, _req, res, _next) => {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        mensaje: "La foto debe ser una imagen de máximo 5 MB",
        errores: { imagen: true },
      });
    }
    console.error(error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  });

  return app;
}

// Solo arranca el servidor si se ejecuta este archivo directamente
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const puerto = Number(process.env.PUERTO ?? 3001);
  try {
    await iniciarBaseDatos();
    console.log("Conectado a Oracle");
  } catch (error) {
    console.error(
      "No se pudo conectar a Oracle. Revisa DB_USUARIO, DB_CLAVE y DB_CONEXION en el archivo .env\n",
      error.message,
    );
    process.exit(1);
  }

  const servidor = crearApp().listen(puerto, "127.0.0.1", (error) => {
    if (error) {
      console.error(`No se pudo abrir el puerto ${puerto}: ${error.message}`);
      process.exit(1);
    }
    console.log(`Backend EDEN escuchando en http://localhost:${puerto}`);
  });

  const apagar = async () => {
    servidor.close();
    await cerrarBaseDatos();
    process.exit(0);
  };
  process.on("SIGINT", apagar);
  process.on("SIGTERM", apagar);
}
