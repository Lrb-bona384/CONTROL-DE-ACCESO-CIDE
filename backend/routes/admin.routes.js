const express = require("express");
const router = express.Router();

const {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  actualizarEstudiante,
  eliminarEstudiante,
} = require("../controllers/admin.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { requireRole } = require("../middleware/requireRole");
const { ROLES } = require("../constants/roles");

router.use(authMiddleware);
router.use(requireRole(ROLES.ADMIN));

router.get("/reportes", (_req, res) => {
  return res.status(200).json({ message: "Reportes administrativos" });
});

router.get("/usuarios", listarUsuarios);
router.post("/usuarios", crearUsuario);
router.put("/usuarios/:id", actualizarUsuario);
router.delete("/usuarios/:id", eliminarUsuario);
router.put("/estudiantes/:id", actualizarEstudiante);
router.delete("/estudiantes/:id", eliminarEstudiante);

module.exports = router;
