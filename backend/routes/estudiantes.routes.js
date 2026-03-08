const express = require("express");
const router = express.Router();

const {
  primerIngreso,
  listarEstudiantes,
  obtenerPorId,
  obtenerPorDocumento,
} = require("../controllers/estudiantes.controller");
const { requireRole } = require("../middleware/requireRole");
const { ROLES } = require("../constants/roles");

const ROLES_LECTURA = [ROLES.ADMIN, ROLES.GUARDA, ROLES.CONSULTA];

router.get("/", requireRole(ROLES_LECTURA), listarEstudiantes);
router.post("/primer-ingreso", requireRole(ROLES.GUARDA), primerIngreso);
router.get("/:id", requireRole(ROLES_LECTURA), obtenerPorId);
router.get("/documento/:documento", requireRole(ROLES_LECTURA), obtenerPorDocumento);

module.exports = router;
