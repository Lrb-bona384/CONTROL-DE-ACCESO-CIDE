const express = require("express");
const app = express();
const pool = require("./config/database");
const PORT = 3000;

app.use(express.json());const estudiantesRoutes = require("./routes/estudiantes.routes");
app.use("/estudiantes", estudiantesRoutes);

// Ruta base
app.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente 🚀");
});

// Health check con DB
app.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as now");
    res.json({
      status: "OK",
      database_time: result.rows[0].now,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "DB ERROR" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});