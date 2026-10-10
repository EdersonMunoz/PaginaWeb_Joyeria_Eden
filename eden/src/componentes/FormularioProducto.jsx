import iconoLapiz from "../assets/Iconos_HU2/iconoLapiz.png";
import "./FormularioProducto.css";

function FormularioProducto({
  titulo = "REGISTRAR PRODUCTO",
  textoBoton = "Registrar Producto",
  iconoBoton = iconoLapiz,
  producto = {},
  errores = {},
  deshabilitado = false,
  onChange,
  onBlurPrecio,
  onSubmit,
}) {
  return (
    <div className="panel-formulario">
      <h1>{titulo}</h1>

      <form className="formulario" onSubmit={onSubmit}>
        <fieldset className="formulario-campos" disabled={deshabilitado}>
          <label>
            Nombre del producto<span className="asterisco-rojo">*</span>
          </label>
          <input
            type="text"
            name="nombre"
            value={producto.nombre || ""}
            onChange={onChange}
            placeholder="Digite aquí el nombre del producto"
            className={errores.nombre ? "campo-error" : ""}
          />

          <label>
            Precio<span className="asterisco-rojo">*</span>
          </label>
          <input
            type="text"
            name="precio"
            value={producto.precio || ""}
            onChange={onChange}
            onBlur={onBlurPrecio}
            placeholder="Digite aquí el valor del producto"
            className={errores.precio ? "campo-error" : ""}
          />

          <label>
            Categoría<span className="asterisco-rojo">*</span>
          </label>
          <select
            name="categoria"
            value={producto.categoria ?? "Brazalete"}
            onChange={onChange}
            className={errores.categoria ? "campo-error" : ""}
          >
            <option value="">Selecciona una categoría</option>
            <option value="Perfumería">Perfumería</option>
            <option value="Brazalete">Brazalete</option>
            <option value="Cadenas">Cadenas</option>
            <option value="Anillos">Anillos</option>
            <option value="Aretes">Aretes</option>
            <option value="Pulsos">Pulsos</option>
            <option value="Pulseras">Pulseras</option>
          </select>

          <label>
            Stock<span className="asterisco-rojo">*</span>
          </label>
          <input
            type="text"
            name="stock"
            value={producto.stock || ""}
            onChange={onChange}
            placeholder="Digite aquí la cantidad del producto"
            className={errores.stock ? "campo-error" : ""}
          />

          <label>
            Descripción<span className="asterisco-rojo">*</span>
          </label>
          <textarea
            name="descripcion"
            value={producto.descripcion || ""}
            onChange={onChange}
            placeholder="Escriba la descripción..."
            className={errores.descripcion ? "campo-error" : ""}
          />
        </fieldset>

        <button
          type="submit"
          className="boton-guardar"
          disabled={deshabilitado}
        >
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