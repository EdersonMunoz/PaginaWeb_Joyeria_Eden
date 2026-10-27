import iconoLapiz from "../assets/Iconos_HU2/iconoLapiz.png";
import iconoCandado from "../assets/Iconos_HU2/iconoCandado.png";
import "./FormularioProducto.css";

function FormularioProducto({
  titulo = "REGISTRAR PRODUCTO",
  textoBoton = "Registrar Producto",
  iconoBoton = iconoLapiz,
  producto = {},
  errores = {},
  deshabilitado = false,
  mostrarCandados = false,
  onChange,
  onBlurCampo,
  onSubmit,
}) {
  const indicadorCampo = mostrarCandados ? (
    <img
      src={iconoCandado}
      alt=""
      aria-hidden="true"
      className="icono-candado"
    />
  ) : (
    <span className="asterisco-rojo">*</span>
  );

  return (
    <div className="panel-formulario">
      <h1>{titulo}</h1>

      <form className="formulario" onSubmit={onSubmit}>
        <fieldset className="formulario-campos" disabled={deshabilitado}>
          <label>
            Nombre del producto{indicadorCampo}
          </label>
          <input
            type="text"
            name="nombre"
            value={producto.nombre || ""}
            onChange={onChange}
            onBlur={onBlurCampo}
            placeholder="Digite aquí el nombre del producto"
            className={errores.nombre ? "campo-error" : ""}
          />

          <label>
            Precio{indicadorCampo}
          </label>
          <input
            type="text"
            name="precio"
            value={producto.precio || ""}
            onChange={onChange}
            onBlur={onBlurCampo}
            placeholder="Digite aquí el valor del producto"
            className={errores.precio ? "campo-error" : ""}
          />

          <label>
            Categoría{indicadorCampo}
          </label>
          <select
            name="categoria"
            value={producto.categoria || ""}
            onChange={onChange}
            onBlur={onBlurCampo}
            className={[
              errores.categoria && "campo-error",
              !producto.categoria && "categoria-placeholder",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <option value="">Presione para deslizar</option>
            <option value="Perfumería">Perfumería</option>
            <option value="Aretes">Aretes</option>
            <option value="Pulsos">Pulsos</option>
            <option value="Anillos">Anillos</option>
            <option value="Cadenas">Cadenas</option>
            <option value="Brazalete">Brazalete</option>
          </select>

          <label>
            Stock{indicadorCampo}
          </label>
          <input
            type="text"
            name="stock"
            value={producto.stock || ""}
            onChange={onChange}
            onBlur={onBlurCampo}
            placeholder="Digite aquí la cantidad del producto"
            className={errores.stock ? "campo-error" : ""}
          />

          <label>
            Descripción{indicadorCampo}
          </label>
          <textarea
            name="descripcion"
            value={producto.descripcion || ""}
            onChange={onChange}
            placeholder="Escriba aquí la descripción del producto: contexto, materiales detallados específicamente (composición y peso)"
            className={errores.descripcion ? "campo-error" : ""}
            onBlur={onBlurCampo}
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