import { Link } from "react-router-dom";
import { Menu, Search, User, ShoppingCart, Heart } from "lucide-react";
import logo from "../assets/logo-eden.png";

export default function Header() {
  return (
    <header className="header">
      <div className="header__izquierda">
        <button type="button" className="header__icono header__icono--menu" aria-label="Abrir menú">
          <Menu strokeWidth={1.25} />
        </button>
        <button type="button" className="header__icono header__icono--buscar" aria-label="Buscar">
          <Search strokeWidth={2} />
        </button>
      </div>

      <Link to="/" className="header__logo">
        <img src={logo} alt="Joyería y Perfumería Edén" className="header__logo-img" />
      </Link>

      <div className="header__derecha">
        <button type="button" className="btn-login">
          <User strokeWidth={1.75} />
          <span className="btn-login__texto">User login</span>
        </button>
        <button type="button" className="header__icono header__icono--carrito" aria-label="Carrito de compras">
          <ShoppingCart strokeWidth={1.5} />
        </button>
        <button type="button" className="header__icono header__icono--corazon" aria-label="Favoritos">
          <Heart strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
