const express = require("express");
const router = express.Router();
const controller = require("../controllers/linearController");

router.post("/predict", controller.predict);

module.exports = router;
