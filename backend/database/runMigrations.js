const pool = require("../config/database");

async function runMigrations() {
  await pool.query(`
    ALTER TABLE usuarios
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS created_by INT REFERENCES usuarios(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS updated_by INT REFERENCES usuarios(id) ON DELETE SET NULL
  `);

  await pool.query(`
    ALTER TABLE estudiantes
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS created_by INT REFERENCES usuarios(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS updated_by INT REFERENCES usuarios(id) ON DELETE SET NULL
  `);

  await pool.query(`
    ALTER TABLE motocicletas
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS created_by INT REFERENCES usuarios(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS updated_by INT REFERENCES usuarios(id) ON DELETE SET NULL
  `);

  await pool.query(`
    ALTER TABLE movimientos
      ADD COLUMN IF NOT EXISTS created_by INT REFERENCES usuarios(id) ON DELETE SET NULL
  `);
}

module.exports = { runMigrations };
