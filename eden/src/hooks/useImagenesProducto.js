import { useEffect, useRef, useState } from "react";

// Maneja las fotos del producto: agregar, quitar, cuál se está viendo
// y liberar la memoria de las vistas previas.
export default function useImagenesProducto() {
  const [imagenes, setImagenes] = useState([]); // [{ id, file, url }]
  const [activa, setActiva] = useState(0);
  const imagenesRef = useRef(imagenes);

  useEffect(() => {
    imagenesRef.current = imagenes;
  }, [imagenes]);

  useEffect(() => {
    return () => imagenesRef.current.forEach((img) => URL.revokeObjectURL(img.url));
  }, []);

  const agregarImagenes = (archivos) => {
    const nuevas = Array.from(archivos ?? []).map((file) => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
    }));
    if (nuevas.length === 0) return;
    setActiva(imagenes.length); // muestra la primera de las nuevas
    setImagenes((prev) => [...prev, ...nuevas]);
  };

  const quitarImagen = (id) => {
    const img = imagenes.find((i) => i.id === id);
    if (img) URL.revokeObjectURL(img.url);
    setImagenes((prev) => prev.filter((i) => i.id !== id));
    setActiva(0);
  };

  // liberar: false cuando las fotos se entregaron al producto guardado,
  // porque el catálogo las sigue mostrando con esas mismas URLs.
  const limpiarImagenes = ({ liberar = true } = {}) => {
    if (liberar) imagenes.forEach((i) => URL.revokeObjectURL(i.url));
    setImagenes([]);
    setActiva(0);
  };

  return {
    imagenes,
    activa,
    imagenActiva: imagenes[activa],
    setActiva,
    agregarImagenes,
    quitarImagen,
    limpiarImagenes,
  };
}
