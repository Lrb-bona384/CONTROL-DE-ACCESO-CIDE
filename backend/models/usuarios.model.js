const pool = require("../config/database");

async function listUsuarios() {
  return pool.query(
    `
    SELECT id, username, role, created_at
    FROM usuarios
    ORDER BY id ASC
    `
  );
}

async function findByUsername(username) {
  return pool.query(
    `
    SELECT id, username, role, created_at
    FROM usuarios
    WHERE username = $1
    LIMIT 1
    `,
    [username]
  );
}

async function createUsuario(payload) {
  const { username, passwordHash, role } = payload;

  return pool.query(
    `
    INSERT INTO usuarios (username, password_hash, role)
    VALUES ($1, $2, $3)
    RETURNING id, username, role, created_at
    `,
    [username, passwordHash, role]
  );
}

module.exports = {
  listUsuarios,
  findByUsername,
  createUsuario,
};
