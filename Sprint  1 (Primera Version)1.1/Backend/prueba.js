// Prueba rápida de la Épica 1 contra el backend ya encendido.
// Uso:  1) npm start   (en otra terminal)
//       2) npm run prueba
// Crea un producto de prueba con una referencia nueva cada vez.
const API = process.env.API_URL ?? "http://localhost:3001/api/productos";

// Imagen PNG de 1x1 píxel para la foto
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
  "base64",
);

let fallas = 0;
const revisar = (descripcion, condicion, detalle = "") => {
  console.log(`${condicion ? "✅" : "❌"} ${descripcion}${condicion ? "" : `  → ${detalle}`}`);
  if (!condicion) fallas += 1;
};

const formulario = (campos, conFoto = true) => {
  const datos = new FormData();
  Object.entries(campos).forEach(([k, v]) => datos.append(k, v));
  if (conFoto) datos.append("foto", new Blob([PNG], { type: "image/png" }), "prueba.png");
  return datos;
};

const pedir = async (ruta, opciones) => {
  const r = await fetch(`${API}${ruta}`, opciones);
  return { estado: r.status, cuerpo: await r.json() };
};

const ref = `TST${Date.now().toString().slice(-5)}`;
const base = {
  ref,
  nombre: "Producto de prueba",
  precio: "$1.500.000",
  categoria: "Pulsos",
  stock: "15",
  descripcion: "Creado por prueba.js",
};

console.log(`\nProbando ${API}\n`);

// ---- HU1 ----
let r = await pedir("", { method: "POST", body: formulario({ ...base, precio: "", stock: "" }) });
revisar("HU1 esc. 2 · campos vacíos → error 400", r.estado === 400 && r.cuerpo.errores?.precio, JSON.stringify(r));

r = await pedir("", { method: "POST", body: formulario({ ...base, precio: "$-500.000", stock: "0" }) });
revisar("HU1 esc. 3 · precio negativo y stock 0 → error 400",
  r.estado === 400 && r.cuerpo.errores?.precio && r.cuerpo.errores?.stock, JSON.stringify(r));

r = await pedir("", { method: "POST", body: formulario(base) });
revisar("HU1 esc. 1 · registro exitoso → 201", r.estado === 201 && r.cuerpo.mensaje === "¡Producto Registrado Exitosamente!", JSON.stringify(r));
const id = r.cuerpo.producto?.id;
revisar("HU1 · el precio $1.500.000 se guardó como 1500000", r.cuerpo.producto?.precio === 1500000, JSON.stringify(r.cuerpo.producto));

r = await pedir("", { method: "POST", body: formulario(base) });
revisar("HU1 · referencia repetida → 409", r.estado === 409, JSON.stringify(r));

// ---- HU2 ----
r = await pedir(`/referencia/${ref.toLowerCase()}`);
revisar("HU2 · consultar por referencia", r.estado === 200 && r.cuerpo.producto?.id === id, JSON.stringify(r));

r = await pedir(`/${id}`, { method: "PUT", body: formulario({ ...base, nombre: "" }, false) });
revisar("HU2 esc. 2 · campo vacío → error 400", r.estado === 400 && r.cuerpo.errores?.nombre, JSON.stringify(r));

r = await pedir(`/${id}`, { method: "PUT", body: formulario({ ...base, precio: "-1500000" }, false) });
revisar("HU2 esc. 3 · precio negativo → error 400", r.estado === 400 && r.cuerpo.errores?.precio, JSON.stringify(r));

r = await pedir(`/${id}`, { method: "PUT", body: formulario({ ...base, precio: "1800000" }, false) });
revisar("HU2 esc. 1 · modificación exitosa", r.estado === 200 && r.cuerpo.producto?.precio === 1800000, JSON.stringify(r));

// ---- HU3 ----
r = await pedir("?categoria=Pulsos");
revisar("HU3 esc. 2 · filtro por categoría", r.cuerpo.productos?.some((p) => p.id === id) && r.cuerpo.productos.every((p) => p.categoria === "Pulsos"), JSON.stringify(r));

r = await pedir("?precioMin=1700000&precioMax=1900000");
revisar("HU3 esc. 3 · filtro por precio", r.cuerpo.productos?.some((p) => p.id === id), JSON.stringify(r));

r = await pedir(`?q=${encodeURIComponent("de prueba")}`);
revisar("HU3 esc. 4 · búsqueda", r.cuerpo.productos?.some((p) => p.id === id), JSON.stringify(r));

r = await pedir(`/${id}`);
revisar("HU3 esc. 5 · detalle del producto", r.estado === 200 && r.cuerpo.producto?.ref === ref, JSON.stringify(r));

// ---- HU4 ----
const cambiarEstado = (estado) =>
  pedir(`/${id}/estado`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado }),
  });

r = await cambiarEstado("Inactivo");
revisar("HU4 esc. 1 · inactivar", r.estado === 200 && r.cuerpo.producto?.estado === "Inactivo", JSON.stringify(r));
r = await pedir("");
revisar("HU4 esc. 1 · ya no aparece en el catálogo", !r.cuerpo.productos?.some((p) => p.id === id), "sigue apareciendo");

r = await cambiarEstado("Activo");
revisar("HU4 esc. 2 · activar", r.estado === 200 && r.cuerpo.producto?.estado === "Activo", JSON.stringify(r));

r = await pedir(`/${id}`, { method: "PUT", body: formulario({ ...base, stock: "0" }, false) });
revisar("HU2 · stock 0 deja el producto inactivo", r.cuerpo.producto?.estado === "Inactivo", JSON.stringify(r));

r = await cambiarEstado("Activo");
revisar("HU4 esc. 3 · activar sin unidades → 409", r.estado === 409, JSON.stringify(r));

console.log(fallas === 0 ? "\nTodo funciona ✅\n" : `\n${fallas} prueba(s) fallaron ❌\n`);
process.exit(fallas === 0 ? 0 : 1);
