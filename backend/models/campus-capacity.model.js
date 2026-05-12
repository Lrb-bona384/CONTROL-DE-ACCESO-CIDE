const pool = require("../config/database");

const MOTO_CAPACITY_LIMIT = 125;
const MOTO_CAPACITY_WARNING_THRESHOLD = 115;

function normalizeCount(value) {
  const total = Number(value);
  return Number.isFinite(total) && total > 0 ? total : 0;
}

async function countInsideMotorcycles(db = pool) {
  const result = await db.query(`
    WITH estudiantes_dentro AS (
      WITH ultimo_movimiento AS (
        SELECT DISTINCT ON (m.estudiante_id)
          m.id,
          m.estudiante_id,
          m.tipo,
          m.vehiculo_placa,
          m.fecha
        FROM movimientos m
        ORDER BY m.estudiante_id, m.fecha DESC, m.id DESC
      )
      SELECT COALESCE(na.placa_observada, um.vehiculo_placa, moto.placa) AS placa
      FROM ultimo_movimiento um
      JOIN estudiantes e ON e.id = um.estudiante_id
      LEFT JOIN novedades_acceso na ON na.movimiento_id = um.id
      LEFT JOIN motocicletas moto ON moto.estudiante_id = e.id AND moto.tipo = 'PRINCIPAL' AND moto.is_active = TRUE
      WHERE um.tipo = 'ENTRADA'
        AND e.is_deleted = FALSE
    ),
    visitantes_dentro AS (
      WITH ultimo_movimiento AS (
        SELECT DISTINCT ON (mv.visitante_id)
          mv.visitante_id,
          mv.tipo,
          mv.vehiculo_placa,
          mv.fecha,
          mv.id
        FROM movimientos_visitantes mv
        ORDER BY mv.visitante_id, mv.fecha DESC, mv.id DESC
      )
      SELECT COALESCE(um.vehiculo_placa, v.placa) AS placa
      FROM ultimo_movimiento um
      JOIN visitantes v ON v.id = um.visitante_id
      WHERE um.tipo = 'ENTRADA'
    )
    SELECT COUNT(*)::int AS total
    FROM (
      SELECT placa FROM estudiantes_dentro
      UNION ALL
      SELECT placa FROM visitantes_dentro
    ) motos_dentro
    WHERE placa IS NOT NULL AND TRIM(placa) <> ''
  `);

  return normalizeCount(result.rows[0]?.total);
}

function buildCapacityStatus(total) {
  const remaining = Math.max(MOTO_CAPACITY_LIMIT - total, 0);

  return {
    total,
    limit: MOTO_CAPACITY_LIMIT,
    warningThreshold: MOTO_CAPACITY_WARNING_THRESHOLD,
    remaining,
    isWarning: total >= MOTO_CAPACITY_WARNING_THRESHOLD && total < MOTO_CAPACITY_LIMIT,
    isFull: total >= MOTO_CAPACITY_LIMIT,
  };
}

async function getCapacityStatus(db = pool) {
  const total = await countInsideMotorcycles(db);
  return buildCapacityStatus(total);
}

module.exports = {
  MOTO_CAPACITY_LIMIT,
  MOTO_CAPACITY_WARNING_THRESHOLD,
  buildCapacityStatus,
  countInsideMotorcycles,
  getCapacityStatus,
};
