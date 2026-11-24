import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { construirEnlaceWhatsApp, rutaConBotonWhatsApp } from "./whatsapp.js";

describe("construirEnlaceWhatsApp", () => {
  it("arma el enlace con el número y el mensaje codificado", () => {
    assert.equal(
      construirEnlaceWhatsApp("573001234567", "Hola, necesito ayuda & asesoría"),
      "https://wa.me/573001234567?text=Hola%2C%20necesito%20ayuda%20%26%20asesor%C3%ADa",
    );
  });

  it("deja solo los dígitos del número", () => {
    assert.equal(
      construirEnlaceWhatsApp("+57 300-123 4567", "Hola"),
      "https://wa.me/573001234567?text=Hola",
    );
  });

  it("sin mensaje, el enlace va solo con el número", () => {
    assert.equal(construirEnlaceWhatsApp("573001234567", "   "), "https://wa.me/573001234567");
  });

  it("sin número devuelve texto vacío", () => {
    assert.equal(construirEnlaceWhatsApp("", "Hola"), "");
    assert.equal(construirEnlaceWhatsApp(undefined, "Hola"), "");
    assert.equal(construirEnlaceWhatsApp("abc", "Hola"), "");
  });
});

describe("rutaConBotonWhatsApp", () => {
  it("es verdadero en inicio, catálogo y carrito del cliente", () => {
    assert.equal(rutaConBotonWhatsApp("/Usuario"), true);
    assert.equal(rutaConBotonWhatsApp("/Usuario/Catalogo"), true);
    assert.equal(rutaConBotonWhatsApp("/Usuario/Carrito"), true);
    assert.equal(rutaConBotonWhatsApp("/usuario/carrito/"), true);
  });

  it("es falso en ajustes, administrador y pantallas públicas", () => {
    assert.equal(rutaConBotonWhatsApp("/Usuario/Ajustes_cuenta"), false);
    assert.equal(rutaConBotonWhatsApp("/Admin"), false);
    assert.equal(rutaConBotonWhatsApp("/Admin/Catalogo"), false);
    assert.equal(rutaConBotonWhatsApp("/Inicio"), false);
    assert.equal(rutaConBotonWhatsApp("/InicioSesion"), false);
    assert.equal(rutaConBotonWhatsApp(undefined), false);
  });
});
