const pool = require("../config/database");

async function primerIngreso(req, res) {
  const { documento, nombre, carrera, vigencia, placa, color } = req.body;

  // Validación mínima
  if (!documento || !nombre || !carrera || typeof vigencia !== "boolean" || !placa || !color) {
    return res.status(400).json({ error: "Faltan datos requeridos o vigencia no es boolean" });
  }

  try {
    await pool.query("BEGIN");

    // Upsert estudiante
    const estudianteResult = await pool.query(
      `
      INSERT INTO estudiantes (documento, nombre, carrera, vigencia)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (documento)
      DO UPDATE SET nombre = EXCLUDED.nombre, carrera = EXCLUDED.carrera, vigencia = EXCLUDED.vigencia
      RETURNING id, documento, nombre, carrera, vigencia
      `,
      [documento, nombre, carrera, vigencia]
    );

    const estudiante = estudianteResult.rows[0];

    // Upsert moto (1:1 por MVP)
    await pool.query(
      `
      INSERT INTO motocicletas (estudiante_id, placa, color)
      VALUES ($1, $2, $3)
      ON CONFLICT (estudiante_id)
      DO UPDATE SET placa = EXCLUDED.placa, color = EXCLUDED.color
      `,
      [estudiante.id, placa, color]
    );

    await pool.query("COMMIT");

    return res.status(201).json({
      message: "Primer ingreso registrado",
      estudiante,
    });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "Error registrando primer ingreso" });
  }
}

module.exports = { primerIngreso };