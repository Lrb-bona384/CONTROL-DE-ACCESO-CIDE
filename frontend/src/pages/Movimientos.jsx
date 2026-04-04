import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : `${date.toLocaleDateString("es-CO")} ${date.toLocaleTimeString("es-CO")}`;
}

export default function Movimientos() {
  const { role, token } = useAuth();
  const [insideCampus, setInsideCampus] = useState([]);
  const [allMovements, setAllMovements] = useState([]);
  const [form, setForm] = useState({ qr_uid: "" });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setError("");

      try {
        const requests = [
          fetch("/movimientos/dentro-campus", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ];

        if (role === "ADMIN") {
          requests.push(
            fetch("/movimientos", {
              headers: { Authorization: `Bearer ${token}` },
            })
          );
        }

        const responses = await Promise.all(requests);
        const payloads = await Promise.all(responses.map((response) => response.json()));

        if (!responses.every((response) => response.ok)) {
          const firstError = payloads.find((payload) => payload.error);
          throw new Error(firstError?.error || "No se pudo cargar la informacion");
        }

        if (!cancelled) {
          setInsideCampus(payloads[0].estudiantes || []);
          setAllMovements(payloads[1]?.movimientos || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [role, token, status]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setStatus("");

    try {
      const response = await fetch("/movimientos/registrar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ qr_uid: form.qr_uid }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo registrar el movimiento");
      }

      setStatus(`${data.movimiento.tipo} registrada para ${data.estudiante.nombre}`);
      setForm({ qr_uid: "" });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="page">
      <header className="page__header">
        <p className="eyebrow">Movimientos</p>
        <h2>Operacion segun permisos</h2>
        <p>
          {role === "ADMIN"
            ? "Como ADMIN puedes registrar movimientos y revisar el historico completo."
            : "Como GUARDA puedes registrar entradas/salidas y ver quienes estan dentro del campus."}
        </p>
      </header>

      {(role === "ADMIN" || role === "GUARDA") && (
        <article className="info-card">
          <h3>Registrar entrada o salida</h3>
          <form className="inline-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="QR UID"
              value={form.qr_uid}
              onChange={(event) => setForm({ qr_uid: event.target.value })}
              required
            />
            <button type="submit">Registrar</button>
          </form>
          {status ? <div className="form-success">{status}</div> : null}
        </article>
      )}

      {error ? <div className="form-error">{error}</div> : null}

      <div className="cards-grid">
        <article className="info-card">
          <h3>Dentro del campus</h3>
          {insideCampus.length === 0 ? (
            <div className="empty-state">No hay estudiantes dentro del campus en este momento.</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>Nombre</th>
                    <th>Placa</th>
                    <th>Ultimo movimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {insideCampus.map((item) => (
                    <tr key={`${item.estudiante_id}-${item.documento}`}>
                      <td>{item.documento}</td>
                      <td>{item.nombre}</td>
                      <td>{item.placa || "-"}</td>
                      <td>{formatDate(item.fecha_ultimo_movimiento)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        {role === "ADMIN" && (
          <article className="info-card">
            <h3>Historico de movimientos</h3>
            {allMovements.length === 0 ? (
              <div className="empty-state">Aun no hay movimientos registrados.</div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Documento</th>
                      <th>Estudiante</th>
                      <th>Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allMovements.map((item) => (
                      <tr key={item.id}>
                        <td>{formatDate(item.fecha_hora)}</td>
                        <td>{item.documento}</td>
                        <td>{item.nombre}</td>
                        <td>{item.tipo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        )}
      </div>
    </section>
  );
}
