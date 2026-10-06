import React, { useRef } from "react";
import iconoMas from "../assets/Iconos_HU2/iconoMas.png";
import "./PanelDerechoProducto.css";

function PanelDerechoProducto({
  imagenPreview,
  onCambiarImagen,
  refValor = "",
  refError = false,
  onChangeInput,
}) {
  const fileInputRef = useRef(null);

  const manejarClickFoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const manejarSeleccionArchivo = (e) => {
    const archivo = e.target.files[0];
    if (archivo) {
      const urlImagen = URL.createObjectURL(archivo);
      onCambiarImagen(urlImagen, archivo);
    }
  };

  return (
    <div className="panel-derecho">
      <h2 className="titulo-marca">
        Joyería y Perfumería
        <span>EDEN</span>
      </h2>

      {/* Input oculto para seleccionar archivos */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={manejarSeleccionArchivo}
        accept="image/*"
        style={{ display: "none" }}
      />

      <div className="zona-foto">
        <div className="foto-principal">
          <div className="contenedor-foto-arriba">
            {imagenPreview && (
              <img
                src={imagenPreview}
                alt="Vista previa del producto"
                className="imagen-cargada"
              />
            )}
          </div>
          <div className="base-blanca" />
        </div>

        <button
          className="boton-agregar-foto"
          type="button"
          onClick={manejarClickFoto}
        >
          <div className="area-icono">
            <img src={iconoMas} alt="Agregar foto" />
          </div>
          <span>Add photo</span>
        </button>
      </div>

      <div className={`campo-ref ${refError ? "campo-ref-error" : ""}`}>
        <label>
          Ref<span className="asterisco-rojo">*</span>
        </label>
        <input
          type="text"
          name="ref"
          value={refValor}
          onChange={onChangeInput}
        />
      </div>
    </div>
  );
}

export default PanelDerechoProducto;