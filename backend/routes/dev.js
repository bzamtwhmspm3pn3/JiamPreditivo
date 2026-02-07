// routes/dev.js
const express = require('express');
const router = express.Router();

// Apenas para desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  // @route   GET /api/dev/routes
  // @desc    Listar todas as rotas disponíveis
  router.get('/routes', (req, res) => {
    const routes = [];
    
    req.app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        // Rotas registradas diretamente
        routes.push({
          path: middleware.route.path,
          methods: Object.keys(middleware.route.methods)
        });
      } else if (middleware.name === 'router') {
        // Rotas de router
        middleware.handle.stack.forEach((handler) => {
          if (handler.route) {
            routes.push({
              path: handler.route.path,
              methods: Object.keys(handler.route.methods)
            });
          }
        });
      }
    });
    
    res.json({
      success: true,
      total_routes: routes.length,
      routes: routes.sort((a, b) => a.path.localeCompare(b.path))
    });
  });

  // @route   POST /api/dev/test/model
  // @desc    Testar interpretação de modelo
  router.post('/test/model', (req, res) => {
    const testModel = {
      coefficients: [
        { name: 'Idade', value: 250, p_value: 0.001 },
        { name: 'Salario', value: 0.05, p_value: 0.03 },
        { name: 'Experiencia', value: 100, p_value: 0.12 }
      ],
      intercept: 1500,
      r2: 0.85,
      r2_adj: 0.83,
      aic: 2450,
      bic: 2465
    };
    
    res.json({
      success: true,
      message: 'Modelo de teste criado',
      model: testModel,
      endpoints: {
        interpret: 'POST /api/r/interpretacao/regressao-linear',
        format: 'GET /api/r/interpretacao/formato-numero'
      }
    });
  });
}

module.exports = router;