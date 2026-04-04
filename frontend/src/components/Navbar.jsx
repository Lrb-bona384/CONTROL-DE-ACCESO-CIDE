import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const menuByRole = {
  ADMIN: [
    { to: "/", label: "Dashboard" },
    { to: "/estudiantes", label: "Estudiantes" },
    { to: "/movimientos", label: "Movimientos" },
    { to: "/admin", label: "Administracion" },
  ],
  GUARDA: [
    { to: "/", label: "Dashboard" },
    { to: "/estudiantes", label: "Estudiantes" },
    { to: "/movimientos", label: "Movimientos" },
  ],
  CONSULTA: [
    { to: "/", label: "Dashboard" },
  ],
};

export default function Navbar() {
  const { user, logout, role } = useAuth();
  const items = menuByRole[role] || [];

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <p className="eyebrow">Control de Acceso CIDE</p>
        <h1>Panel operativo</h1>
      </div>

      <div className="sidebar__session">
        <span className="sidebar__user">{user?.username || "Sin sesion"}</span>
        <span className="sidebar__role">{role || "-"}</span>
      </div>

      <nav className="sidebar__nav">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) => `sidebar__link${isActive ? " active" : ""}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button type="button" className="sidebar__logout" onClick={logout}>
        Cerrar sesion
      </button>
    </aside>
  );
}
