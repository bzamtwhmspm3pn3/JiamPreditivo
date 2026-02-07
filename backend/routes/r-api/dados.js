// backend/routes/r-api/dados.js
const express = require('express');
const router = express.Router();
const rController = require('../../controllers/rController');

// Upload e processamento de dados
router.post('/upload', rController.uploadDados);

// Limpeza de dados
router.post('/limpar', (req, res) => {
  req.body.operacao = 'limpeza';
  return rController.processarDados(req, res);
});

// Transformação de dados
router.post('/transformar', (req, res) => {
  req.body.operacao = 'transformacao';
  return rController.processarDados(req, res);
});

// Análise exploratória
router.post('/explorar', (req, res) => {
  res.json({
    success: true,
    mensagem: 'Análise exploratória de dados',
    timestamp: new Date().toISOString(),
    estatisticas: {
      n_observacoes: 100,
      n_variaveis: 5,
      tipos: {
        numericas: 3,
        categoricas: 2
      }
    }
  });
});

module.exports = router;