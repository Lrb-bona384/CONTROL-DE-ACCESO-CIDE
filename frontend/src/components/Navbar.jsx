import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const menuByRole = {
  ADMIN: [
    { to: "/", label: "Inicio", icon: "IN" },
    { to: "/estudiantes", label: "Estudiantes", icon: "ES" },
    { to: "/movimientos", label: "Movimientos", icon: "MV" },
    { to: "/admin", label: "Administración", icon: "AD" },
  ],
  GUARDA: [
    { to: "/", label: "Inicio", icon: "IN" },
    { to: "/estudiantes", label: "Estudiantes", icon: "ES" },
    { to: "/movimientos", label: "Movimientos", icon: "MV" },
  ],
  CONSULTA: [
    { to: "/", label: "Inicio", icon: "IN" },
    { to: "/estudiantes", label: "Estudiantes", icon: "ES" },
    { to: "/movimientos", label: "Movimientos", icon: "MV" },
  ],
};

function isMobileViewport() {
  return typeof window !== "undefined"
    && (window.matchMedia?.("(max-width: 820px)").matches || window.innerWidth <= 820);
}

export default function Navbar() {
  const { user, logout, role } = useAuth();
  const [menuOpen, setMenuOpen] = useState(() => !isMobileViewport());
  const items = menuByRole[role] || [];
  const roleCopy = role === "ADMIN"
    ? "Acceso administrativo completo"
    : role === "GUARDA"
      ? "Operación de acceso y monitoreo"
      : "Consulta y seguimiento";
  const roleLabel = role === "ADMIN"
    ? "Rol activo: ADMIN"
    : role === "GUARDA"
      ? "Rol activo: GUARDA"
      : role === "CONSULTA"
        ? "Rol activo: CONSULTA"
        : "Rol activo: -";
  const closeMenuOnlyOnMobile = () => {
    if (isMobileViewport()) {
      setMenuOpen(false);
    }
  };

  return (
    <aside className={`sidebar${menuOpen ? " sidebar--open" : " sidebar--collapsed"}`}>
      <div className="sidebar__mobile-head">
        <button
          type="button"
          className="sidebar__toggle"
          aria-expanded={menuOpen}
          aria-controls="siuc-sidebar-menu"
          aria-label={menuOpen ? "Contraer menú" : "Desplegar menú"}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span className="sidebar__toggle-lines" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        <span className="sidebar__mobile-title">Portal de ingresos SIUC</span>
      </div>

      <div className="sidebar__brand">
        <h1 className="sidebar__wordmark">SIUC</h1>
        <p className="sidebar__submark">Sistema de Ingreso Universidad CIDE</p>
        <p className="sidebar__portal">Portal de ingresos SIUC</p>
      </div>

      <nav
        id="siuc-sidebar-menu"
        className="sidebar__nav"
        aria-label="Navegación principal"
      >
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            aria-label={item.label}
            title={item.label}
            className={({ isActive }) => `sidebar__link${isActive ? " active" : ""}`}
            onClick={closeMenuOnlyOnMobile}
          >
            <span className="sidebar__icon" aria-hidden="true">{item.icon}</span>
            <span className="sidebar__label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__session">
          <span className="sidebar__welcome">Bienvenido</span>
          <span className="sidebar__user">{user?.username || "Sin sesión"}</span>
          <span className="sidebar__role">{roleLabel}</span>
          <span className="sidebar__role-copy">{roleCopy}</span>
        </div>

        <button type="button" className="sidebar__logout" aria-label="Cerrar sesión" onClick={logout}>
          <span className="sidebar__logout-icon" aria-hidden="true">↪</span>
          <span className="sidebar__logout-label">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
