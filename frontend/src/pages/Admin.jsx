import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const initialForm = {
  username: "",
  password: "",
  role: "CONSULTA",
};

export default function Admin() {
  const { apiRequest, user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [userDeleteTarget, setUserDeleteTarget] = useState(null);
  const [userRestoreTarget, setUserRestoreTarget] = useState(null);
  const [userPasswordTarget, setUserPasswordTarget] = useState(null);
  const [studentDeleteTarget, setStudentDeleteTarget] = useState(null);
  const [studentRestoreTarget, setStudentRestoreTarget] = useState(null);
  const [studentFilter, setStudentFilter] = useState("");
  const [studentDeleteIssue, setStudentDeleteIssue] = useState("");
  const [studentDeleteStatus, setStudentDeleteStatus] = useState({
    checking: false,
    insideCampus: false,
    canDeactivate: true,
    lastMovement: null,
    message: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    confirmPassword: "",
  });

  async function loadUsers() {
    const data = await apiRequest("/admin/usuarios");
    setUsuarios(data.usuarios || []);
  }

  async function loadStudents() {
    const data = await apiRequest("/admin/estudiantes");
    setEstudiantes(data.estudiantes || []);
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setError("");

      try {
        const [usersData, studentsData] = await Promise.all([
          apiRequest("/admin/usuarios"),
          apiRequest("/admin/estudiantes"),
        ]);

        if (!cancelled) {
          setUsuarios(usersData.usuarios || []);
          setEstudiantes(studentsData.estudiantes || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [apiRequest]);

  async function handleCreateUser(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setStatus("");

    try {
      const data = await apiRequest("/admin/usuarios", {
        method: "POST",
        body: JSON.stringify(form),
      });

      setStatus(`Usuario ${data.usuario.username} creado correctamente.`);
      setForm(initialForm);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDeleteStudent() {
    if (!studentDeleteTarget) return;

    setLoading(true);
    setError("");
    setStatus("");

    try {
      const data = await apiRequest(`/admin/estudiantes/documento/${encodeURIComponent(studentDeleteTarget.documento)}`, {
        method: "DELETE",
      });

      setStatus(`Estudiante ${data.estudiante.nombre} desactivado correctamente.`);
      setStudentDeleteIssue("");
      setStudentDeleteTarget(null);
      await loadStudents();
    } catch (err) {
      if (err.code === "STUDENT_INSIDE_CAMPUS") {
        setStudentDeleteIssue(err.message);
        setStudentDeleteStatus((current) => ({
          ...current,
          insideCampus: true,
          canDeactivate: false,
          message: err.message,
          lastMovement: "ENTRADA",
        }));
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDeleteUser() {
    if (!userDeleteTarget) return;

    setLoading(true);
    setError("");
    setStatus("");

    try {
      const data = await apiRequest(`/admin/usuarios/${userDeleteTarget.id}`, {
        method: "DELETE",
      });

      setStatus(`Usuario ${data.usuario.username} desactivado correctamente.`);
      setUserDeleteTarget(null);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmRestoreUser() {
    if (!userRestoreTarget) return;

    setLoading(true);
    setError("");
    setStatus("");

    try {
      const data = await apiRequest(`/admin/usuarios/${userRestoreTarget.id}/reactivar`, {
        method: "PATCH",
      });

      setStatus(`Usuario ${data.usuario.username} reactivado correctamente.`);
      setUserRestoreTarget(null);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmRestoreStudent() {
    if (!studentRestoreTarget) return;

    setLoading(true);
    setError("");
    setStatus("");

    try {
      const data = await apiRequest(`/admin/estudiantes/documento/${encodeURIComponent(studentRestoreTarget.documento)}/reactivar`, {
        method: "PATCH",
      });

      setStatus(`Estudiante ${data.estudiante.nombre} reactivado correctamente.`);
      setStudentRestoreTarget(null);
      await loadStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterExitAndDeleteStudent() {
    if (!studentDeleteTarget) return;

    setLoading(true);
    setError("");
    setStatus("");

    try {
      const data = await apiRequest(
        `/admin/estudiantes/documento/${encodeURIComponent(studentDeleteTarget.documento)}/registrar-salida`,
        { method: "POST" }
      );

      setStatus(`Salida registrada para ${data.estudiante.nombre}. Ya puedes confirmar la desactivación.`);
      setStudentDeleteIssue("");
      setStudentDeleteStatus({
        checking: false,
        insideCampus: false,
        canDeactivate: true,
        lastMovement: "SALIDA",
        message: "La salida ya fue registrada. Ahora puedes desactivar al estudiante con seguridad.",
      });
      await loadStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword() {
    if (!userPasswordTarget) return;

    if (!passwordForm.password || passwordForm.password.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      setError("La confirmación de contraseña no coincide.");
      return;
    }

    setLoading(true);
    setError("");
    setStatus("");

    try {
      const data = await apiRequest(`/admin/usuarios/${userPasswordTarget.id}`, {
        method: "PUT",
        body: JSON.stringify({ password: passwordForm.password }),
      });

      setStatus(`Contraseña actualizada para ${data.usuario.username}.`);
      setPasswordForm({ password: "", confirmPassword: "" });
      setUserPasswordTarget(null);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredStudents = useMemo(() => {
    const term = studentFilter.trim().toLowerCase();
    if (!term) return estudiantes;

    return estudiantes.filter((student) => {
      const fields = [
        student.documento,
        student.nombre,
        student.placa,
        student.qr_uid,
        student.created_by_username,
        student.updated_by_username,
      ];

      return fields.some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [estudiantes, studentFilter]);

  useEffect(() => {
    let cancelled = false;

    async function loadStudentDeleteStatus() {
      if (!studentDeleteTarget) {
        setStudentDeleteIssue("");
        setStudentDeleteStatus({
          checking: false,
          insideCampus: false,
          canDeactivate: true,
          lastMovement: null,
          message: "",
        });
        return;
      }

      setStudentDeleteIssue("");
      setStudentDeleteStatus({
        checking: true,
        insideCampus: false,
        canDeactivate: true,
        lastMovement: null,
        message: "Verificando si el estudiante sigue dentro del campus...",
      });

      try {
        const data = await apiRequest(
          `/admin/estudiantes/documento/${encodeURIComponent(studentDeleteTarget.documento)}/estado-desactivacion`
        );

        if (!cancelled) {
          setStudentDeleteStatus({
            checking: false,
            insideCampus: Boolean(data.insideCampus),
            canDeactivate: Boolean(data.canDeactivate),
            lastMovement: data.lastMovement || null,
            message: data.message || "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setStudentDeleteIssue(err.message);
          setStudentDeleteStatus({
            checking: false,
            insideCampus: false,
            canDeactivate: true,
            lastMovement: null,
            message: "",
          });
        }
      }
    }

    loadStudentDeleteStatus();

    return () => {
      cancelled = true;
    };
  }, [apiRequest, studentDeleteTarget]);

  return (
    <section className="page">
      <header className="page__header">
        <p className="eyebrow">Administración</p>
        <h2>Herramientas exclusivas de ADMIN</h2>
        <p>
          Desde aquí puedes crear usuarios, revisar estudiantes y gestionar la operación administrativa del sistema.
        </p>
      </header>

      {error ? <div className="form-error">{error}</div> : null}
      {status ? <div className="form-success">{status}</div> : null}

      <div className="cards-grid cards-grid--single">
        <article className="info-card">
          <h3>Crear nuevo usuario</h3>
          <form className="stack-form" onSubmit={handleCreateUser} autoComplete="off">
            <input type="text" name="admin-fake-user" autoComplete="username" tabIndex="-1" hidden readOnly />
            <input type="password" name="admin-fake-pass" autoComplete="current-password" tabIndex="-1" hidden readOnly />
            <label>
              Username
              <input
                type="text"
                name="admin_create_username"
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                autoComplete="off"
                spellCheck="false"
                placeholder="nuevo.usuario"
                required
              />
            </label>

            <label>
              Contraseña
              <input
                type="password"
                name="admin_create_password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                autoComplete="new-password"
                placeholder="Segura123!"
                required
                minLength={8}
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

            <button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear usuario"}
            </button>
          </form>
        </article>

      </div>

      <section className="table-panel">
        <div className="table-panel__header">
          <div>
            <p className="eyebrow">Gestión de usuarios</p>
            <h3>Usuarios del sistema</h3>
          </div>
          <span className="table-count">{usuarios.length} visible(s)</span>
        </div>
        {usuarios.length === 0 ? (
          <div className="empty-state">No hay usuarios creados.</div>
        ) : (
          <div className="table-wrap table-wrap--panel">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Creado</th>
                  <th>Actualizado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((account) => (
                  <tr key={account.id}>
                    <td>{account.id}</td>
                    <td>{account.username}</td>
                    <td>{account.role}</td>
                    <td>{account.is_active ? "Activo" : "Desactivado"}</td>
                    <td>{account.created_at ? new Date(account.created_at).toLocaleString("es-CO") : "-"}</td>
                    <td>{account.updated_at ? new Date(account.updated_at).toLocaleString("es-CO") : "-"}</td>
                    <td>
                      <div className="button-strip">
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => {
                            setError("");
                            setPasswordForm({ password: "", confirmPassword: "" });
                            setUserPasswordTarget(account);
                          }}
                        >
                          Cambiar contraseña
                        </button>
                        {account.username === "admin" ? (
                          <span className="movement-pill entry">Protegido</span>
                        ) : account.id === user?.id ? (
                          <span className="movement-pill exit">Sesión actual</span>
                        ) : account.is_active ? (
                          <button
                            type="button"
                            className="danger-button"
                            onClick={() => setUserDeleteTarget(account)}
                          >
                            Desactivar
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => setUserRestoreTarget(account)}
                          >
                            Reactivar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="table-panel">
        <div className="table-panel__header admin-table-header">
          <div>
            <p className="eyebrow">Gestión de estudiantes</p>
            <h3>Estudiantes del sistema</h3>
          </div>
          <div className="admin-table-tools">
            <input
              type="text"
              value={studentFilter}
              onChange={(event) => setStudentFilter(event.target.value)}
              placeholder="Filtrar por documento, nombre, placa, QR o responsable"
            />
            <span className="table-count">{filteredStudents.length} visible(s)</span>
          </div>
        </div>

        {estudiantes.length === 0 ? (
          <div className="empty-state">No hay estudiantes registrados.</div>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-state">No se encontraron estudiantes con ese filtro.</div>
        ) : (
          <div className="table-wrap table-wrap--scrollable table-wrap--panel">
            <table className="data-table admin-students-table">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Nombre</th>
                  <th>QR</th>
                  <th>Placa</th>
                  <th>Celular</th>
                  <th>Vigencia</th>
                  <th>Creado</th>
                  <th>Actualizado</th>
                  <th>Creado por</th>
                  <th>Actualizado por</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.estudiante_id}>
                    <td>{student.documento}</td>
                    <td>{student.nombre}</td>
                    <td>{student.qr_uid || "-"}</td>
                    <td>{student.placa || "-"}</td>
                    <td>{student.celular || "-"}</td>
                    <td>{student.vigencia ? "Vigente" : "No vigente"}</td>
                    <td>{student.created_at ? new Date(student.created_at).toLocaleString("es-CO") : "-"}</td>
                    <td>{student.updated_at ? new Date(student.updated_at).toLocaleString("es-CO") : "-"}</td>
                    <td>{student.created_by_username || "Sin responsable"}</td>
                    <td>{student.updated_by_username || "Sin responsable"}</td>
                    <td>{student.is_deleted ? "Desactivado" : "Activo"}</td>
                    <td>
                      {student.is_deleted ? (
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => setStudentRestoreTarget(student)}
                        >
                          Reactivar
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => setStudentDeleteTarget(student)}
                        >
                          Desactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <article className="info-card">
        <h3>Estado del módulo admin</h3>
        <div className="empty-state">
          Aquí ADMIN ya puede crear usuarios, revisar estudiantes y desactivar usuarios o estudiantes sin perder historial.
        </div>
      </article>

      {userDeleteTarget ? (
        <div className="modal" aria-hidden="false">
          <div className="modal-backdrop" onClick={() => setUserDeleteTarget(null)} />
          <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="delete-user-title">
            <p className="eyebrow">Confirmación requerida</p>
            <h3 id="delete-user-title">Desactivar usuario</h3>
            <p className="modal-copy">
              Esta acción bloqueará el acceso del usuario, pero conservará los movimientos y la auditoría histórica.
            </p>
            <pre className="modal-details">{[
              `id: ${userDeleteTarget.id || "-"}`,
              `usuario: ${userDeleteTarget.username || "-"}`,
              `rol: ${userDeleteTarget.role || "-"}`,
              `creado: ${userDeleteTarget.created_at ? new Date(userDeleteTarget.created_at).toLocaleString("es-CO") : "-"}`,
            ].join("\n")}</pre>
            <div className="button-strip">
              <button
                type="button"
                className="danger-button"
                disabled={loading}
                onClick={handleConfirmDeleteUser}
              >
                {loading ? "Desactivando..." : "Confirmar desactivación"}
              </button>
              <button
                type="button"
                className="ghost-button"
                disabled={loading}
                onClick={() => setUserDeleteTarget(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {userPasswordTarget ? (
        <div className="modal" aria-hidden="false">
          <div className="modal-backdrop" onClick={() => setUserPasswordTarget(null)} />
          <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="password-user-title">
            <p className="eyebrow">Administración de acceso</p>
            <h3 id="password-user-title">Cambiar contraseña de usuario</h3>
            <p className="modal-copy">
              Esta acción solo está disponible desde administración. Define una nueva contraseña segura para el usuario seleccionado.
            </p>
            <pre className="modal-details">{[
              `id: ${userPasswordTarget.id || "-"}`,
              `usuario: ${userPasswordTarget.username || "-"}`,
              `rol: ${userPasswordTarget.role || "-"}`,
            ].join("\n")}</pre>
            <div className="stack-form">
              <label>
                Nueva contraseña
                <input
                  type="password"
                  value={passwordForm.password}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>
              <label>
                Confirmar contraseña
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  placeholder="Repite la nueva contraseña"
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>
            </div>
            <div className="button-strip">
              <button type="button" disabled={loading} onClick={handleChangePassword}>
                {loading ? "Actualizando..." : "Guardar contraseña"}
              </button>
              <button
                type="button"
                className="ghost-button"
                disabled={loading}
                onClick={() => {
                  setPasswordForm({ password: "", confirmPassword: "" });
                  setUserPasswordTarget(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {userRestoreTarget ? (
        <div className="modal" aria-hidden="false">
          <div className="modal-backdrop" onClick={() => setUserRestoreTarget(null)} />
          <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="restore-user-title">
            <p className="eyebrow">Confirmación requerida</p>
            <h3 id="restore-user-title">Reactivar usuario</h3>
            <p className="modal-copy">
              Esta acción devolverá el acceso al usuario y mantendrá intacta la trazabilidad histórica del sistema.
            </p>
            <pre className="modal-details">{[
              `id: ${userRestoreTarget.id || "-"}`,
              `usuario: ${userRestoreTarget.username || "-"}`,
              `rol: ${userRestoreTarget.role || "-"}`,
              `desactivado: ${userRestoreTarget.deactivated_at ? new Date(userRestoreTarget.deactivated_at).toLocaleString("es-CO") : "-"}`,
            ].join("\n")}</pre>
            <div className="button-strip">
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmRestoreUser}
              >
                {loading ? "Reactivando..." : "Confirmar reactivación"}
              </button>
              <button
                type="button"
                className="ghost-button"
                disabled={loading}
                onClick={() => setUserRestoreTarget(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {studentDeleteTarget ? (
        <div className="modal" aria-hidden="false">
          <div className="modal-backdrop" onClick={() => {
            setStudentDeleteIssue("");
            setStudentDeleteStatus({
              checking: false,
              insideCampus: false,
              canDeactivate: true,
              lastMovement: null,
              message: "",
            });
            setStudentDeleteTarget(null);
          }} />
          <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="delete-student-title">
            <p className="eyebrow">Confirmación requerida</p>
            <h3 id="delete-student-title">Desactivar estudiante</h3>
            <p className="modal-copy">
              Esta acción desactivará el estudiante, pero conservará sus movimientos y el historial del sistema.
            </p>
            {studentDeleteStatus.message ? (
              <div className={studentDeleteStatus.insideCampus ? "form-error" : "auth-status"}>
                {studentDeleteStatus.message}
              </div>
            ) : null}
            {studentDeleteIssue ? (
              <div className="form-error">{studentDeleteIssue}</div>
            ) : null}
            <pre className="modal-details">{[
              `documento: ${studentDeleteTarget.documento || "-"}`,
              `nombre: ${studentDeleteTarget.nombre || "-"}`,
              `placa: ${studentDeleteTarget.placa || "-"}`,
              `vigencia: ${studentDeleteTarget.vigencia ? "Activa" : "Inactiva"}`,
              `estado_campus: ${studentDeleteStatus.insideCampus ? "Dentro del campus" : "Fuera del campus"}`,
              `último_movimiento: ${studentDeleteStatus.lastMovement || "Sin registro"}`,
              `actualizado_por: ${studentDeleteTarget.updated_by_username || "Sin responsable"}`,
            ].join("\n")}</pre>
            <div className="button-strip">
              <button
                type="button"
                className="danger-button"
                disabled={loading || studentDeleteStatus.checking || !studentDeleteStatus.canDeactivate}
                onClick={handleConfirmDeleteStudent}
              >
                {loading ? "Desactivando..." : "Confirmar desactivación"}
              </button>
              {studentDeleteStatus.insideCampus ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleRegisterExitAndDeleteStudent}
                >
                  {loading ? "Registrando..." : "Sí, registrar salida"}
                </button>
              ) : null}
              <button
                type="button"
                className="ghost-button"
                disabled={loading}
                onClick={() => {
                  setStudentDeleteIssue("");
                  setStudentDeleteStatus({
                    checking: false,
                    insideCampus: false,
                    canDeactivate: true,
                    lastMovement: null,
                    message: "",
                  });
                  setStudentDeleteTarget(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {studentRestoreTarget ? (
        <div className="modal" aria-hidden="false">
          <div className="modal-backdrop" onClick={() => setStudentRestoreTarget(null)} />
          <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="restore-student-title">
            <p className="eyebrow">Confirmación requerida</p>
            <h3 id="restore-student-title">Reactivar estudiante</h3>
            <p className="modal-copy">
              Esta acción habilitará nuevamente al estudiante para operación, sin perder movimientos ni auditoría.
            </p>
            <pre className="modal-details">{[
              `documento: ${studentRestoreTarget.documento || "-"}`,
              `nombre: ${studentRestoreTarget.nombre || "-"}`,
              `placa: ${studentRestoreTarget.placa || "-"}`,
              `desactivado: ${studentRestoreTarget.deleted_at ? new Date(studentRestoreTarget.deleted_at).toLocaleString("es-CO") : "-"}`,
            ].join("\n")}</pre>
            <div className="button-strip">
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmRestoreStudent}
              >
                {loading ? "Reactivando..." : "Confirmar reactivación"}
              </button>
              <button
                type="button"
                className="ghost-button"
                disabled={loading}
                onClick={() => setStudentRestoreTarget(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
