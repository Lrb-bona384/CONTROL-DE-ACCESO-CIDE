const bcrypt = require("bcrypt");
const pool = require("../config/database");

// Usage: node scripts/createUser.js <username> <password> <role>
// role debe ser ADMIN, GUARDA o CONSULTA (staff se normaliza a GUARDA).

async function createUser(username, password, role) {
  if (!username || !password || !role) {
    console.error("Uso: node scripts/createUser.js <username> <password> <role>");
    process.exit(1);
  }

  const SALT_ROUNDS = 10;
  const normRole = role.toUpperCase().trim();

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      `
      INSERT INTO usuarios (username, password_hash, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (username) DO UPDATE
        SET password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role
      RETURNING id, username, role
      `,
      [username, passwordHash, normRole]
    );

    console.log("Usuario creado/actualizado:", result.rows[0]);
  } catch (error) {
    console.error("Error creando usuario:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

// leer parámetros cli
const [,, user, pass, role] = process.argv;
createUser(user, pass, role);
