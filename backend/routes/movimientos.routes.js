const express = require("express");
const router = express.Router();

const {
  registrarMovimiento,
  listarMovimientos,
  listarMovimientosPorEstudiante,
  listarDentroCampus,
} = require("../controllers/movimientos.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { requireRole } = require("../middleware/requireRole");
const { ROLES } = require("../constants/roles");

router.use(authMiddleware);

router.post("/registrar", requireRole(ROLES.ADMIN, ROLES.GUARDA), registrarMovimiento);
router.get("/", requireRole(ROLES.ADMIN), listarMovimientos);
router.get("/estudiante/:id", requireRole(ROLES.ADMIN), listarMovimientosPorEstudiante);
router.get("/dentro-campus", requireRole(ROLES.ADMIN, ROLES.GUARDA), listarDentroCampus);

module.exports = router;
