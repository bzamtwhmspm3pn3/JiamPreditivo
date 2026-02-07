const fs = require("fs");
const path = require("path");
const { runR } = require("../services/rRunner");

exports.predict = async (req, res) => {
  try {
    // 1. Recebe dados do frontend
    const data = req.body;

    // 2. Escreve CSV de entrada
    const inputPath = path.join(__dirname, "../tmp/input/linear_input.csv");

    const header = Object.keys(data[0]).join(",");
    const rows = data.map(r => Object.values(r).join(","));

    fs.writeFileSync(inputPath, [header, ...rows].join("\n"));

    // 3. Executa R
    const scriptPath = path.join(__dirname, "../api/r/linear/endpoint.R");
    await runR(scriptPath);

    // 4. Lê resultado
    const outputPath = path.join(__dirname, "../tmp/output/linear_output.csv");
    const output = fs.readFileSync(outputPath, "utf8");

    res.json({
      status: "ok",
      result: output
    });

  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
};
