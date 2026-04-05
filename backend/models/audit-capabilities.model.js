const pool = require("../config/database");

let cachedPoolCapabilities = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000;

async function hasColumn(db, tableName, columnName) {
  const result = await db.query(
    `
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
      AND column_name = $2
    LIMIT 1
    `,
    [tableName, columnName]
  );

  return result.rows.length > 0;
}

async function getAuditCapabilities(db = pool) {
  const canUseCache = db === pool;
  const now = Date.now();

  if (canUseCache && cachedPoolCapabilities && now - cachedAt < CACHE_TTL_MS) {
    return cachedPoolCapabilities;
  }

  const movimientoActor = await hasColumn(db, "movimientos", "actor_user_id");
  const estudianteCreatedBy = await hasColumn(db, "estudiantes", "created_by_user_id");
  const estudianteUpdatedBy = await hasColumn(db, "estudiantes", "updated_by_user_id");

  const capabilities = {
    movimientoActor,
    estudianteCreatedBy,
    estudianteUpdatedBy,
  };

  if (canUseCache) {
    cachedPoolCapabilities = capabilities;
    cachedAt = now;
  }

  return capabilities;
}

function clearAuditCapabilitiesCache() {
  cachedPoolCapabilities = null;
  cachedAt = 0;
}

module.exports = {
  getAuditCapabilities,
  clearAuditCapabilitiesCache,
};
