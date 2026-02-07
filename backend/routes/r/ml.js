import express from "express";
import { runModel } from "../../controllers/rController.js";

const router = express.Router();

router.post("/random-forest", (req, res) =>
  runModel(req, res, "ml/random_forest.R")
);

router.post("/xgboost", (req, res) =>
  runModel(req, res, "ml/xgboost.R")
);

export default router;
