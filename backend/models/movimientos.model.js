const pool = require("../config/database");
const { getAuditCapabilities } = require("./audit-capabilities.model");

async function getLastByEstudianteId(client, estudianteId) {
  return client.query(
    "SELECT tipo FROM movimientos WHERE estudiante_id = $1 ORDER BY fecha DESC, id DESC LIMIT 1",
    [estudianteId]
  );
}

async function createMovimiento(client, estudianteId, tipo, audit = {}) {
  const { actorUserId = null } = audit;
  const capabilities = await getAuditCapabilities(client);

  if (capabilities.movimientoActor) {
    return client.query(
      `
      INSERT INTO movimientos (estudiante_id, tipo, actor_user_id)
      VALUES ($1, $2, $3)
      RETURNING id, estudiante_id, tipo, actor_user_id, fecha AS fecha_hora
      `,
      [estudianteId, tipo, actorUserId]
    );
  }

  return client.query(
    "INSERT INTO movimientos (estudiante_id, tipo) VALUES ($1, $2) RETURNING id, estudiante_id, tipo, fecha AS fecha_hora",
    [estudianteId, tipo]
  );
}

function buildActorFields(capabilities = {}) {
  if (!capabilities.movimientoActor) {
    return {
      join: "",
      fields: `
        NULL::int AS actor_user_id,
        NULL::varchar AS actor_username,
      `,
    };
  }

  return {
    join: "LEFT JOIN usuarios actor ON actor.id = m.actor_user_id",
    fields: `
      m.actor_user_id,
      actor.username AS actor_username,
    `,
  };
}

async function listAllMovimientos() {
  const capabilities = await getAuditCapabilities(pool);
  const actorMeta = buildActorFields(capabilities);

  return pool.query(
    `
    SELECT
      m.id,
      m.estudiante_id,
      e.documento,
      e.nombre,
      e.carrera,
      e.vigencia,
      ${actorMeta.fields}
      m.tipo,
      m.fecha AS fecha_hora
    FROM movimientos m
    JOIN estudiantes e ON e.id = m.estudiante_id
    ${actorMeta.join}
    ORDER BY m.fecha DESC, m.id DESC
    `
  );
}

async function listMovimientosByEstudianteId(estudianteId) {
  const capabilities = await getAuditCapabilities(pool);
  const actorMeta = buildActorFields(capabilities);

  return pool.query(
    `
    SELECT
      m.id,
      m.estudiante_id,
      e.documento,
      e.nombre,
      e.carrera,
      e.vigencia,
      ${actorMeta.fields}
      m.tipo,
      m.fecha AS fecha_hora
    FROM movimientos m
    JOIN estudiantes e ON e.id = m.estudiante_id
    ${actorMeta.join}
    WHERE m.estudiante_id = $1
    ORDER BY m.fecha DESC, m.id DESC
    `,
    [estudianteId]
  );
}

async function listDentroCampus() {
  const capabilities = await getAuditCapabilities(pool);
  const actorCteField = capabilities.movimientoActor ? "m.actor_user_id," : "";
  const actorJoin = capabilities.movimientoActor
    ? "LEFT JOIN usuarios actor ON actor.id = um.actor_user_id"
    : "";
  const actorSelect = capabilities.movimientoActor
    ? `
      um.actor_user_id,
      actor.username AS actor_username,
    `
    : `
      NULL::int AS actor_user_id,
      NULL::varchar AS actor_username,
    `;

  return pool.query(
    `
    WITH ultimo_movimiento AS (
      SELECT DISTINCT ON (m.estudiante_id)
        m.estudiante_id,
        m.tipo,
        m.fecha,
        ${actorCteField}
        m.id
      FROM movimientos m
      ORDER BY m.estudiante_id, m.fecha DESC, m.id DESC
    )
    SELECT
      e.id AS estudiante_id,
      e.documento,
      e.nombre,
      e.carrera,
      e.vigencia,
      moto.placa,
      moto.color,
      um.tipo AS ultimo_movimiento,
      ${actorSelect}
      um.fecha AS fecha_ultimo_movimiento
    FROM ultimo_movimiento um
    JOIN estudiantes e ON e.id = um.estudiante_id
    LEFT JOIN motocicletas moto ON moto.estudiante_id = e.id
    ${actorJoin}
    WHERE um.tipo = 'ENTRADA'
    ORDER BY um.fecha DESC
    `
  );
}

module.exports = {
  getLastByEstudianteId,
  createMovimiento,
  listAllMovimientos,
  listMovimientosByEstudianteId,
  listDentroCampus,
};
