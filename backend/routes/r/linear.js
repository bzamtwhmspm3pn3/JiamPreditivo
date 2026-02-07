import express from "express";
import { runModel } from "../../controllers/rController.js";

const router = express.Router();

router.post("/", (req, res) => {
  runModel(req, res, "regression/linear.R");
});

export default router;
