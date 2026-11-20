// Servidor del backend de Joyería y Perfumería EDEN
// Arranca con:  npm start   (o  npm run dev  para que se reinicie al guardar)
import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { pathToFileURL } from "node:url";
import { iniciarBaseDatos, cerrarBaseDatos } from "./baseDatos.js";

import consultarCatalogo from "./rutas/consultarCatalogo.js"; // HU3
import registrarProducto from "./rutas/registrarProducto.js"; // HU1
import modificarProducto from "./rutas/modificarProducto.js"; // HU2
import gestionarEstado from "./rutas/gestionarEstado.js"; // HU4
import autenticacion from "./rutas/autenticacion.js"; // Sprint 2 · cuentas e inicio de sesión
import procesarCompra from "./rutas/procesarCompra.js"; // Sprint 3 · HU2 (y validación de HU1)
import consultarComprobante from "./rutas/consultarComprobante.js"; // Sprint 3 · HU3

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
  // Las fotos ya no las sirve el backend: el navegador las carga directo
  // del bucket de Oracle Cloud (ver almacenFotos.js)

  app.get("/api/salud", (_req, res) => res.json({ ok: true }));

  // Una línea por página (cada integrante trabaja en su archivo de rutas/)
  app.use("/api/productos", consultarCatalogo); // HU3 · Consultar catálogo
  app.use("/api/productos", registrarProducto); // HU1 · Registrar producto
  app.use("/api/productos", modificarProducto); // HU2 · Modificar producto
  app.use("/api/productos", gestionarEstado); //   HU4 · Inactivar y activar
  app.use("/api/autenticacion", autenticacion); // Sprint 2 · Registro, login y ajustes de cuenta
  app.use("/api/pedidos", procesarCompra); //       Sprint 3 · Procesar compra y validar cupón
  app.use("/api/pedidos", consultarComprobante); // Sprint 3 · Consultar comprobante

  app.use((_req, res) => res.status(404).json({ mensaje: "Ruta no encontrada" }));

  // Errores no controlados
  app.use((error, _req, res, _next) => {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        mensaje: "La foto debe estar en formato JPG, PNG o WEBP y/o el peso máximo permitido es 5 MB",
        errores: { imagen: true },
      });
    }
    // El cuerpo no es un JSON válido (o es demasiado grande): es un error de quien llama
    if (error?.type === "entity.parse.failed" || error?.type === "entity.too.large") {
      return res
        .status(error.status ?? 400)
        .json({ mensaje: "La solicitud no tiene un formato válido", codigo: "SOLICITUD_INVALIDA" });
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
