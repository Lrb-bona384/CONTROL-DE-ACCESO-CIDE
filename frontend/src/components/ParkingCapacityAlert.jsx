import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const REFRESH_INTERVAL_MS = 30_000;
export const CAPACITY_UPDATED_EVENT = "siuc:capacity-updated";

function getCapacityTone(capacity) {
  if (!capacity) return "normal";
  if (capacity.isFull || capacity.remaining <= 0) return "full";
  if (capacity.remaining <= 5) return "critical";
  if (capacity.isWarning) return "warning";
  return "normal";
}

export function dispatchCapacityRefresh() {
  window.dispatchEvent(new Event(CAPACITY_UPDATED_EVENT));
}

export default function ParkingCapacityAlert() {
  const { apiRequest, isAuthenticated } = useAuth();
  const [capacity, setCapacity] = useState(null);
  const [dismissedKey, setDismissedKey] = useState("");

  const loadCapacity = useCallback(async () => {
    try {
      const data = await apiRequest("/movimientos/capacidad-motos");
      setCapacity(data.capacity || null);
    } catch (error) {
      setCapacity(null);
    }
  }, [apiRequest]);

  useEffect(() => {
    if (!isAuthenticated || typeof apiRequest !== "function") return undefined;

    let cancelled = false;

    async function safeLoadCapacity() {
      try {
        const data = await apiRequest("/movimientos/capacidad-motos");
        if (!cancelled) {
          setCapacity(data.capacity || null);
        }
      } catch (error) {
        if (!cancelled) {
          setCapacity(null);
        }
      }
    }

    safeLoadCapacity();
    const timer = window.setInterval(safeLoadCapacity, REFRESH_INTERVAL_MS);
    const refreshNow = () => {
      loadCapacity();
    };

    window.addEventListener(CAPACITY_UPDATED_EVENT, refreshNow);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener(CAPACITY_UPDATED_EVENT, refreshNow);
    };
  }, [apiRequest, isAuthenticated, loadCapacity]);

  const alertKey = useMemo(() => {
    if (!capacity) return "";
    if (capacity.isFull) return `full-${capacity.total}`;
    if (capacity.isWarning) return `warning-${capacity.total}`;
    return "";
  }, [capacity]);

  if (!capacity || !alertKey || dismissedKey === alertKey) {
    return null;
  }

  const tone = getCapacityTone(capacity);
  const isFull = tone === "full";
  const title = isFull ? "Parqueadero de motos lleno" : "Alerta de capacidad de motos";
  const message = isFull
    ? "El campus llegó al límite operativo. Se debe registrar una salida antes de permitir otro ingreso de moto."
    : `Quedan ${capacity.remaining} cupos antes de llegar al límite operativo. Puedes seguir registrando ingresos hasta completar el cupo.`;

  return (
    <section className={`capacity-alert capacity-alert--${tone}`} role="alert" aria-live="polite">
      <div>
        <p className="capacity-alert__eyebrow">Capacidad del campus</p>
        <h2>{title}</h2>
        <p>{message}</p>
        <strong>
          {capacity.total} / {capacity.limit} motos dentro
        </strong>
      </div>
      <button type="button" onClick={() => setDismissedKey(alertKey)} aria-label="Cerrar alerta de capacidad">
        <span aria-hidden="true"></span>
      </button>
    </section>
  );
}
