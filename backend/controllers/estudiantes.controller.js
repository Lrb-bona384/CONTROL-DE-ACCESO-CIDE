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
    async function obtenerPorDocumento(req, res) {
  const { documento } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        e.id as estudiante_id,
        e.documento,
        e.nombre,
        e.carrera,
        e.vigencia,
        m.placa,
        m.color
      FROM estudiantes e
      LEFT JOIN motocicletas m ON m.estudiante_id = e.id
      WHERE e.documento = $1
      `,
      [documento]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error consultando estudiante" });
  }
}

module.exports = { primerIngreso, obtenerPorDocumento };
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "Error registrando primer ingreso" });
  }
}

module.exports = { primerIngreso };