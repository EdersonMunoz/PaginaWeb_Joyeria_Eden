import { useRef } from "react";
import { Link } from "react-router-dom";
import { Plus, Check, ChevronDown, X } from "lucide-react";
import useRegistrarProducto from "../hooks/useRegistrarProducto";
import { CATEGORIAS, formatearPrecio } from "../utilidades/producto";
import Mensaje from "../componentes/Mensaje";
import "./RegistrarProducto.css";

// HE1-HU1 - Registrar producto. Ruta: /admin/productos/crear
// Esta pantalla solo muestra; la lógica está en hooks/useRegistrarProducto.js

const MENSAJES = {
  exito: "¡Producto registrado exitosamente!",
  error:
    "Error al registrar producto. Por favor completa todos los campos obligatorios y/o corrige los valores numéricos",
  "error-servidor": "No se pudo registrar el producto. Revisa la conexión e inténtalo de nuevo.",
};

function Campo({ id, etiqueta, error, children }) {
  return (
    <div className={`campo ${error ? "campo--error" : ""}`}>
      <label htmlFor={id}>
        {etiqueta}
        <span className="campo__req" aria-hidden="true">*</span>
      </label>
      {children}
    </div>
  );
}

export default function RegistrarProducto({ agregarProducto, productos }) {
  const { form, errores, estado, enviando, galeria, handleChange, handleSubmit, cerrarMensaje } =
    useRegistrarProducto({ agregarProducto, productos });
  const { imagenes, activa, imagenActiva, setActiva, agregarImagenes, quitarImagen } = galeria;
  const inputArchivo = useRef(null);
  const formulario = useRef(null);

  // Al cerrar el mensaje de error, el cursor queda en el primer campo con error
  const alCerrarMensaje = () => {
    cerrarMensaje();
    formulario.current?.querySelector('[aria-invalid="true"]')?.focus();
  };

  const invalido = (campo) => (errores[campo] ? { "aria-invalid": true } : {});

  return (
    <>
      <nav className="ruta" aria-label="Ubicación">
        <Link to="/">Inicio</Link>
        <span aria-hidden="true">\</span>
        <span aria-current="page">Registrar_Producto</span>
      </nav>

      <form ref={formulario} className="registro" onSubmit={handleSubmit} noValidate>
        {/* ---------- Columna izquierda: formulario ---------- */}
        <section className="tarjeta" aria-labelledby="titulo-registro">
          <h1 id="titulo-registro" className="tarjeta__titulo">
            Registrar producto
          </h1>

          <Campo id="nombre" etiqueta="Nombre del producto" error={errores.nombre}>
            <input
              id="nombre"
              name="nombre"
              type="text"
              placeholder="Digite aquí el nombre del producto"
              value={form.nombre}
              onChange={handleChange}
              {...invalido("nombre")}
            />
          </Campo>

          <Campo id="precio" etiqueta="Precio" error={errores.precio}>
            <input
              id="precio"
              name="precio"
              type="text"
              inputMode="numeric"
              placeholder="Digite aquí el valor del producto"
              value={formatearPrecio(form.precio)}
              onChange={handleChange}
              {...invalido("precio")}
            />
          </Campo>

          <Campo id="categoria" etiqueta="Categoría" error={errores.categoria}>
            <div className={`campo__select ${form.categoria ? "" : "campo__select--vacio"}`}>
              <ChevronDown className="campo__chevron" aria-hidden="true" />
              <select
                id="categoria"
                name="categoria"
                value={form.categoria}
                onChange={handleChange}
                {...invalido("categoria")}
              >
                <option value="" disabled>
                  Presione para deslizar
                </option>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </Campo>

          <Campo id="stock" etiqueta="Stock" error={errores.stock}>
            <input
              id="stock"
              name="stock"
              type="number"
              min="1"
              step="1"
              placeholder="Digite aquí la cantidad del producto"
              value={form.stock}
              onChange={handleChange}
              {...invalido("stock")}
            />
          </Campo>

          <Campo id="descripcion" etiqueta="Descripción" error={errores.descripcion}>
            <textarea
              id="descripcion"
              name="descripcion"
              placeholder="Escriba aquí la descripción del producto: contexto, materiales detallados específicamente (composición y peso)"
              value={form.descripcion}
              onChange={handleChange}
              {...invalido("descripcion")}
            />
          </Campo>
        </section>

        <button type="submit" className="btn-registrar" disabled={enviando}>
          <Check strokeWidth={2} aria-hidden="true" />
          {enviando ? "Registrando…" : "Registrar producto"}
        </button>

        <div className="registro__divisor" aria-hidden="true" />

        {/* ---------- Columna derecha: marca, fotos y referencia ---------- */}
        <section className="registro__media" aria-label="Fotos y referencia del producto">
          <p className="marca" aria-hidden="true">
            <span className="marca__subtitulo">Joyería y Perfumería</span>
            <span className="marca__titulo">EDEN</span>
          </p>

          <div className="galeria">
            <div className="galeria__principal">
              <div className="galeria__imagen">
                {imagenActiva && (
                  <img src={imagenActiva.url} alt={`Foto ${activa + 1} del producto`} />
                )}
              </div>

              <div className="galeria__miniaturas">
                {imagenes.map((img, i) => (
                  <div key={img.id} className="miniatura-contenedor">
                    <button
                      type="button"
                      className={`miniatura ${i === activa ? "miniatura--activa" : ""}`}
                      onClick={() => setActiva(i)}
                      aria-label={`Ver foto ${i + 1}`}
                    >
                      <img src={img.url} alt="" />
                    </button>
                    <button
                      type="button"
                      className="miniatura__quitar"
                      onClick={() => quitarImagen(img.id)}
                      aria-label={`Quitar foto ${i + 1}`}
                    >
                      <X strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="galeria__agregar"
              onClick={() => inputArchivo.current?.click()}
            >
              <span className="agregar__icono">
                <Plus strokeWidth={1.5} aria-hidden="true" />
              </span>
              <span className="agregar__texto">Add photo</span>
            </button>
            <input
              ref={inputArchivo}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                agregarImagenes(e.target.files);
                e.target.value = ""; // permite volver a elegir el mismo archivo
              }}
            />
          </div>

          <div className={`ref ${errores.ref ? "ref--error" : ""}`}>
            <label htmlFor="ref" className="ref__etiqueta">
              Ref<span className="campo__req" aria-hidden="true">*</span>
            </label>
            <input
              id="ref"
              name="ref"
              type="text"
              autoComplete="off"
              maxLength={8}
              title="3 letras y 5 números, por ejemplo ANI00001"
              value={form.ref}
              onChange={handleChange}
              {...invalido("ref")}
            />
          </div>
        </section>
      </form>

      {estado && (
        <Mensaje
          tipo={estado === "exito" ? "exito" : "error"}
          texto={MENSAJES[estado]}
          onCerrar={alCerrarMensaje}
        />
      )}
    </>
  );
}
