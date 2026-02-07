// middleware/apiValidation.js
const API_KEYS = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];

const validateAPIKey = (req, res, next) => {
  // Permitir rotas públicas sem API key
  const publicRoutes = ['/api/health', '/api/r/status', '/api/r/interpretacao/status'];
  if (publicRoutes.includes(req.path)) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key não fornecida'
    });
  }

  if (!API_KEYS.includes(apiKey)) {
    return res.status(403).json({
      success: false,
      error: 'API key inválida'
    });
  }

  next();
};

module.exports = { validateAPIKey };