import express from "express";
import { runModel } from "../../controllers/rController.js";

const router = express.Router();

router.post("/arima", (req, res) =>
  runModel(req, res, "time_series/arima.R")
);

router.post("/sarima", (req, res) =>
  runModel(req, res, "time_series/sarima.R")
);

router.post("/ets", (req, res) =>
  runModel(req, res, "time_series/ets.R")
);

router.post("/prophet", (req, res) =>
  runModel(req, res, "time_series/prophet.R")
);

export default router;
