const express = require("express");
const path = require("path");
const app = express();

require("dotenv").config();

const pool = require("./config/database");
const { errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const estudiantesRoutes = require("./routes/estudiantes.routes");
const movimientosRoutes = require("./routes/movimientos.routes");
const adminRoutes = require("./routes/admin.routes");
const solicitudesInscripcionRoutes = require("./routes/solicitudes-inscripcion.routes");
const visitantesRoutes = require("./routes/visitantes.routes");
const { startSolicitudesExpirationRunner } = require("./utils/solicitudes-expiration-runner");

const PORT = Number(process.env.PORT || 3000);
const corsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (corsOrigins.length === 0) return true;
  return corsOrigins.includes("*") || corsOrigins.includes(origin);
}

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(isAllowedOrigin(origin) ? 204 : 403);
  }

  return next();
});

app.use(express.json({ limit: "20mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, _res, next) => {
  console.log(`[request] ${req.method} ${req.originalUrl}`);
  next();
});

app.use("/auth", authRoutes);
app.use("/estudiantes", estudiantesRoutes);
app.use("/movimientos", movimientosRoutes);
app.use("/admin", adminRoutes);
app.use("/solicitudes-inscripcion", solicitudesInscripcionRoutes);
app.use("/visitantes", visitantesRoutes);

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
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

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  startSolicitudesExpirationRunner();
});
