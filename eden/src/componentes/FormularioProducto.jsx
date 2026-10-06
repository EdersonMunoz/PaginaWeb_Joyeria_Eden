import iconoLapiz from "../assets/Iconos_HU2/iconoLapiz.png";
import { CATEGORIAS } from "../utilidades/producto";
import "./FormularioProducto.css";

function FormularioProducto({
  titulo = "REGISTRAR PRODUCTO",
  textoBoton = "Registrar Producto",
  iconoBoton = iconoLapiz,
  producto = {},
  errores = {},
  onChange,
  onSubmit,
}) {
  return (
    <div className="panel-formulario">
      <h1>{titulo}</h1>

      <form className="formulario" onSubmit={onSubmit}>
        <div className="formulario-campos">
          <label htmlFor="nombre">
            Nombre del producto<span className="asterisco-rojo">*</span>
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={producto.nombre || ""}
            onChange={onChange}
            placeholder="Digite aquí el nombre del producto"
            className={errores.nombre ? "campo-error" : ""}
          />

          <label htmlFor="precio">
            Precio<span className="asterisco-rojo">*</span>
          </label>
          <input
            type="text"
            id="precio"
            name="precio"
            value={producto.precio || ""}
            onChange={onChange}
            placeholder="Digite aquí el valor del producto"
            className={errores.precio ? "campo-error" : ""}
          />

          <label htmlFor="categoria">
            Categoría<span className="asterisco-rojo">*</span>
          </label>
          <select
            id="categoria"
            name="categoria"
            value={producto.categoria || ""}
            onChange={onChange}
            className={errores.categoria ? "campo-error" : ""}
          >
            <option value="" disabled>
              Presione para deslizar
            </option>
            {CATEGORIAS.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>

          <label htmlFor="stock">
            Stock<span className="asterisco-rojo">*</span>
          </label>
          <input
            type="text"
            id="stock"
            name="stock"
            value={producto.stock || ""}
            onChange={onChange}
            placeholder="Digite aquí la cantidad del producto"
            className={errores.stock ? "campo-error" : ""}
          />

          <label htmlFor="descripcion">
            Descripción<span className="asterisco-rojo">*</span>
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={producto.descripcion || ""}
            onChange={onChange}
            placeholder="Escriba aquí la descripción del producto: contexto, materiales detallados específicamente (composición y peso)"
            className={errores.descripcion ? "campo-error" : ""}
          />
        </div>

        <button type="submit" className="boton-guardar">
          {iconoBoton && (
            <img src={iconoBoton} alt="Icono del botón" className="icono-lapiz" />
          )}
          {textoBoton}
        </button>
      </form>
    </div>
  );
}

export default FormularioProducto;