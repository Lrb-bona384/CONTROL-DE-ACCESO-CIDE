import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const initialForm = {
  documento: "",
  qr_uid: "",
  nombre: "",
  carrera: "",
  placa: "",
  color: "",
  vigencia: true,
};

function mapStudentToForm(student) {
  if (!student) return initialForm;

  return {
    documento: student.documento || "",
    qr_uid: student.qr_uid || "",
    nombre: student.nombre || "",
    carrera: student.carrera || "",
    placa: student.placa || "",
    color: student.color || "",
    vigencia: Boolean(student.vigencia),
  };
}

export default function Estudiantes() {
  const { token, role } = useAuth();
  const [students, setStudents] = useState([]);
  const [lookupDocument, setLookupDocument] = useState("");
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState("crear");

  const canManageStudents = useMemo(() => ["ADMIN", "GUARDA"].includes(role), [role]);

  async function fetchStudents() {
    const response = await fetch("/estudiantes", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "No se pudo cargar la lista de estudiantes");
    }

    setStudents(data.estudiantes || []);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/estudiantes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "No se pudo cargar estudiantes");
        }

        if (!cancelled) {
          setStudents(data.estudiantes || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleLookup(event) {
    event.preventDefault();
    setError("");
    setStatus("");

    if (!lookupDocument.trim()) {
      setError("Debes indicar un documento para buscar.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/estudiantes/documento/${encodeURIComponent(lookupDocument.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se encontro el estudiante");
      }

      setForm(mapStudentToForm(data));
      setCurrentMode("editar");
      setStatus(`Estudiante ${data.nombre} cargado para edicion.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setStatus("");
    setLoading(true);

    try {
      const response = await fetch("/estudiantes/primer-ingreso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo guardar el estudiante");
      }

      const nextMode = currentMode === "editar" ? "actualizado" : "creado";
      setStatus(`Estudiante ${nextMode} correctamente.`);
      setCurrentMode("editar");
      setForm(mapStudentToForm(data.estudiante));
      setLookupDocument(data.estudiante.documento || form.documento);
      await fetchStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(initialForm);
    setLookupDocument("");
    setCurrentMode("crear");
    setStatus("");
    setError("");
  }

  return (
    <section className="page">
      <header className="page__header">
        <p className="eyebrow">Estudiantes</p>
        <h2>Crear o modificar estudiante</h2>
        <p>
          {canManageStudents
            ? "ADMIN y GUARDA pueden registrar un estudiante desde cero o cargarlo por documento para actualizar sus datos."
            : "Solo tienes permiso de consulta sobre la informacion de estudiantes."}
        </p>
      </header>

      <div className="cards-grid">
        <article className="info-card">
          <h3>{currentMode === "editar" ? "Modificar estudiante existente" : "Crear estudiante nuevo"}</h3>

          <form className="inline-form" onSubmit={handleLookup}>
            <input
              type="text"
              placeholder="Buscar por documento"
              value={lookupDocument}
              onChange={(event) => setLookupDocument(event.target.value)}
            />
            <button type="submit" disabled={loading}>
              Buscar
            </button>
          </form>

          <form className="stack-form" onSubmit={handleSubmit}>
            <div className="form-grid-2">
              <label>
                Documento
                <input
                  type="text"
                  value={form.documento}
                  onChange={(event) => handleChange("documento", event.target.value)}
                  required
                />
              </label>

              <label>
                QR UID
                <input
                  type="text"
                  value={form.qr_uid}
                  onChange={(event) => handleChange("qr_uid", event.target.value)}
                  required
                />
              </label>

              <label>
                Nombre
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(event) => handleChange("nombre", event.target.value)}
                  required
                />
              </label>

              <label>
                Carrera
                <input
                  type="text"
                  value={form.carrera}
                  onChange={(event) => handleChange("carrera", event.target.value)}
                  required
                />
              </label>

              <label>
                Placa
                <input
                  type="text"
                  value={form.placa}
                  onChange={(event) => handleChange("placa", event.target.value)}
                  required
                />
              </label>

              <label>
                Color
                <input
                  type="text"
                  value={form.color}
                  onChange={(event) => handleChange("color", event.target.value)}
                  required
                />
              </label>
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.vigencia}
                onChange={(event) => handleChange("vigencia", event.target.checked)}
              />
              <span>Estudiante vigente</span>
            </label>

            <div className="button-strip">
              <button type="submit" disabled={loading}>
                {loading ? "Guardando..." : currentMode === "editar" ? "Guardar cambios" : "Crear estudiante"}
              </button>
              <button type="button" className="ghost-button" onClick={resetForm}>
                Nuevo registro
              </button>
            </div>
          </form>

          {status ? <div className="form-success">{status}</div> : null}
          {error ? <div className="form-error">{error}</div> : null}
        </article>

        <article className="info-card">
          <h3>Estudiantes registrados</h3>
          {students.length === 0 ? (
            <div className="empty-state">Aun no hay estudiantes registrados.</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>Nombre</th>
                    <th>QR</th>
                    <th>Placa</th>
                    <th>Vigencia</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.estudiante_id}>
                      <td>{student.documento}</td>
                      <td>{student.nombre}</td>
                      <td>{student.qr_uid}</td>
                      <td>{student.placa || "-"}</td>
                      <td>{student.vigencia ? "Vigente" : "No vigente"}</td>
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
