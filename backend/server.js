const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

require('dotenv').config();

const pool = require("./config/database");
const { runMigrations } = require("./database/runMigrations");
const { errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const estudiantesRoutes = require("./routes/estudiantes.routes");
const movimientosRoutes = require("./routes/movimientos.routes");
const adminRoutes = require("./routes/admin.routes");

const PORT = Number(process.env.PORT || 3000);
const legacyPublicDir = path.join(__dirname, "public");
const frontendDistDir = path.resolve(__dirname, "../frontend/dist");
const hasFrontendBuild = fs.existsSync(frontendDistDir);

app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[request] ${req.method} ${req.originalUrl}`);
  next();
});

app.use("/auth", authRoutes);
app.use("/estudiantes", estudiantesRoutes);
app.use("/movimientos", movimientosRoutes);
app.use("/admin", adminRoutes);

if (hasFrontendBuild) {
  app.use(express.static(frontendDistDir));
} else {
  app.use(express.static(legacyPublicDir));
}

app.get("/", (_req, res) => {
  const indexFile = hasFrontendBuild
    ? path.join(frontendDistDir, "index.html")
    : path.join(legacyPublicDir, "index.html");

  res.sendFile(indexFile);
});

app.get("/health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as now");
    res.json({
      status: "OK",
      database_time: result.rows[0].now,
    });
  } catch (error) {
    console.error("[health] error", error.message);
    res.status(500).json({ status: "DB ERROR" });
  }
});

if (hasFrontendBuild) {
  app.get(/^\/(?!auth|estudiantes|movimientos|admin|health).*/, (_req, res) => {
    res.sendFile(path.join(frontendDistDir, "index.html"));
  });
}

app.use(errorHandler);

runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("[startup] error ejecutando migraciones", error.message);
    process.exit(1);
  });
