const express = require("express");
const router = express.Router();
const { primerIngreso } = require("../controllers/estudiantes.controller");

router.post("/primer-ingreso", primerIngreso);

module.exports = router;