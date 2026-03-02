const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "control_acceso_cide",
  password: "Mas2022",
  port: 5432,
});

pool.connect()
  .then(() => console.log("✅ Conectado a PostgreSQL"))
  .catch(err => console.error("❌ Error conexión DB:", err));

module.exports = pool;