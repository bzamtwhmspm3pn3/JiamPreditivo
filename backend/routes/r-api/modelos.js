
// backend/routes/r-api/modelos.js
const express = require('express');
const router = express.Router();
const rController = require('../../controllers/rController');

// Listar modelos disponíveis
router.get('/disponiveis', rController.getModelosDisponiveis);

// Executar modelo específico
router.post('/executar', rController.executarModelo);

// Endpoints específicos para cada tipo de modelo
router.post('/glm', (req, res) => {
  req.body.tipo = 'glm';
  return rController.executarModelo(req, res);
});

router.post('/random-forest', (req, res) => {
  req.body.tipo = 'random_forest';
  return rController.executarModelo(req, res);
});

router.post('/xgboost', (req, res) => {
  req.body.tipo = 'xgboost';
  return rController.executarModelo(req, res);
});

router.post('/arima', (req, res) => {
  req.body.tipo = 'arima';
  return rController.executarModelo(req, res);
});

router.post('/prophet', (req, res) => {
  req.body.tipo = 'prophet';
  return rController.executarModelo(req, res);
});

// Validar modelo
router.post('/validar', (req, res) => {
  res.json({
    success: true,
    mensagem: 'Endpoint de validação de modelo',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;