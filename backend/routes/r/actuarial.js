import express from "express";
import { runModel } from "../../controllers/rController.js";

const router = express.Router();

router.post("/mortality", (req, res) =>
  runModel(req, res, "actuarial/mortality_table.R")
);

router.post("/markov", (req, res) =>
  runModel(req, res, "actuarial/markov.R")
);

router.post("/monte-carlo", (req, res) =>
  runModel(req, res, "actuarial/monte_carlo.R")
);

export default router;
