import { Outlet } from "react-router-dom";
import Header from "./Header";
import "./LayoutAdmin.css";

// Estructura común de las pantallas de administrador:
// el header arriba y en <Outlet /> se pinta la página de la ruta.
export default function LayoutAdmin() {
  return (
    <div className="app">
      <Header />
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
