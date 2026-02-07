const express = require("express");
const router = express.Router();
const Avaliacao = require("../models/avaliacao");

// GET → todas as avaliações (mais recentes primeiro)
router.get("/", async (req, res) => {
  try {
    const avaliacoes = await Avaliacao.find().sort({ createdAt: -1 });
    res.json(avaliacoes);
  } catch (err) {
    res.status(500).json({ error: "Erro ao carregar avaliações." });
  }
});

// POST → criar nova avaliação
router.post("/", async (req, res) => {
  try {
    const { nome, texto, estrelas } = req.body;
    if (!texto || !estrelas) {
      return res.status(400).json({ error: "Texto e estrelas são obrigatórios." });
    }

    const novaAvaliacao = new Avaliacao({
      nome: nome?.trim() === "" ? "Visitante" : nome.trim(),
      texto,
      estrelas
    });

    await novaAvaliacao.save();
    res.status(201).json(novaAvaliacao);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao salvar avaliação." });
  }
});

module.exports = router;
