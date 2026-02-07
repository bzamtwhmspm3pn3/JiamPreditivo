const express = require("express");
const router = express.Router();
const rController = require("../../controllers/rController");

// Rota para execução de modelos
router.post("/modelos", rController.executarModelo);

module.exports = router;
