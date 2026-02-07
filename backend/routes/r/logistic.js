import express from "express";
import { runModel } from "../../controllers/rController.js";

const router = express.Router();

router.post("/", (req, res) => {
  runModel(req, res, "regression/logistic.R");
});

export default router;
