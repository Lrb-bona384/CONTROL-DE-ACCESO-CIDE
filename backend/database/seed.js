const bcrypt = require("bcrypt");
const pool = require("../config/database");

async function seed() {
  try {
    console.log("🌱 Iniciando seed de usuarios...");

    // Usuarios de prueba
    const users = [
      {
        username: "admin",
        password: "Admin123!",
        role: "admin",
      },
      {
        username: "staff",
        password: "Staff123!",
        role: "staff",
      },
      {
        username: "test",
        password: "Test123!",
        role: "staff",
      },
    ];

    // Crear tabla si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✓ Tabla usuarios verificada/creada");

    // Limpiar usuarios existentes (opcional, descomenta si quieres)
    // await pool.query("DELETE FROM usuarios");

    // Insertar usuarios
    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password, 10);

      // Verificar si el usuario ya existe
      const existente = await pool.query(
        "SELECT id FROM usuarios WHERE username = $1",
        [user.username]
      );

      if (existente.rows.length > 0) {
        console.log(`⚠ Usuario '${user.username}' ya existe, omitiendo...`);
        continue;
      }

      await pool.query(
        "INSERT INTO usuarios (username, password_hash, role) VALUES ($1, $2, $3)",
        [user.username, passwordHash, user.role]
      );

      console.log(`✓ Usuario '${user.username}' creado (contraseña: ${user.password})`);
    }

    // Mostrar usuarios creados
    const result = await pool.query("SELECT id, username, role FROM usuarios ORDER BY id");
    console.log("\n📋 Usuarios en la base de datos:");
    result.rows.forEach((u) => {
      console.log(`   - ${u.username} (rol: ${u.role})`);
    });

    console.log("\n✅ Seed completado exitosamente");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en seed:", error);
    process.exit(1);
  }
}

seed();
