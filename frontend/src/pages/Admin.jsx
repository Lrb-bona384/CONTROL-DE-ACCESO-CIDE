import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Admin() {
  const { token } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [auditoria, setAuditoria] = useState([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "CONSULTA",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadAdminData() {
      try {
        const responses = await Promise.all([
          fetch("/admin/usuarios", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/admin/auditoria", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const payloads = await Promise.all(responses.map((response) => response.json()));

        if (!responses.every((response) => response.ok)) {
          const firstError = payloads.find((payload) => payload.error);
          throw new Error(firstError?.error || "No se pudo cargar el panel administrativo");
        }

        if (!cancelled) {
          setUsuarios(payloads[0].usuarios || []);
          setAuditoria(payloads[1].auditoria || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      }
    }

    loadAdminData();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function reloadAdminData() {
    const responses = await Promise.all([
      fetch("/admin/usuarios", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/admin/auditoria", { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    const payloads = await Promise.all(responses.map((response) => response.json()));

    if (!responses.every((response) => response.ok)) {
      const firstError = payloads.find((payload) => payload.error);
      throw new Error(firstError?.error || "No se pudo recargar la informacion administrativa");
    }

    setUsuarios(payloads[0].usuarios || []);
    setAuditoria(payloads[1].auditoria || []);
  }

  async function handleCreateUser(event) {
    event.preventDefault();
    setError("");
    setStatus("");

    try {
      const response = await fetch("/admin/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo crear el usuario");
      }

      setStatus(`Usuario ${data.usuario.username} creado correctamente.`);
      setForm({
        username: "",
        password: "",
        role: "CONSULTA",
      });
      await reloadAdminData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="page">
      <header className="page__header">
        <p className="eyebrow">Administracion</p>
        <h2>Herramientas exclusivas de ADMIN</h2>
        <p>Desde aqui puedes supervisar usuarios y el historico global auditado del sistema.</p>
      </header>

      {error ? <div className="form-error">{error}</div> : null}
      {status ? <div className="form-success">{status}</div> : null}

      <div className="cards-grid">
        <article className="info-card">
          <h3>Crear nuevo usuario</h3>
          <form className="stack-form" onSubmit={handleCreateUser}>
            <label>
              Username
              <input
                type="text"
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                placeholder="nuevo.usuario"
                required
              />
            </label>

            <label>
              Contrasena
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Segura123!"
                required
              />
            </label>

            <label>
              Rol
              <select
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
              >
                <option value="ADMIN">ADMIN</option>
                <option value="GUARDA">GUARDA</option>
                <option value="CONSULTA">CONSULTA</option>
              </select>
            </label>

            <button type="submit">Crear usuario</button>
          </form>
        </article>

        <article className="info-card">
          <h3>Usuarios del sistema</h3>
          {usuarios.length === 0 ? (
            <div className="empty-state">No hay usuarios creados.</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Creado</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.role}</td>
                      <td>{user.created_at ? new Date(user.created_at).toLocaleString("es-CO") : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="info-card">
          <h3>Auditoria reciente</h3>
          {auditoria.length === 0 ? (
            <div className="empty-state">Todavia no hay eventos en auditoria.</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Tabla</th>
                    <th>Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {auditoria.slice(0, 10).map((item) => (
                    <tr key={item.id}>
                      <td>{new Date(item.created_at).toLocaleString("es-CO")}</td>
                      <td>{item.tipo_movimiento}</td>
                      <td>{item.tabla}</td>
                      <td>{item.actor_username || "Sistema"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
