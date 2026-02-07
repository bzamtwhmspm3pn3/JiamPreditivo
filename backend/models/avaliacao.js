const mongoose = require("mongoose");

const avaliacaoSchema = new mongoose.Schema({
  nome: { type: String, default: "Visitante" },
  texto: { type: String, required: true },
  estrelas: { type: Number, required: true, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Avaliacao", avaliacaoSchema);
