// backend/routes/proxy.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

const API_ENDPOINTS = {
  bna: 'https://www.bna.ao/api',
  ine: 'https://www.ine.gov.ao/api',
  imf: 'https://www.imf.org/external/datamapper/api/v1',
  tradingeco: 'https://api.tradingeconomics.com'
};

router.get('/:source/:path(*)', async (req, res) => {
  const { source, path } = req.params;
  const baseUrl = API_ENDPOINTS[source];

  if (!baseUrl) {
    return res.status(400).json({ error: 'Fonte nÃ£o suportada' });
  }

  try {
    const fullUrl = `${baseUrl}/${path}`;
    console.log(`🔀 Proxy: ${req.originalUrl} -> ${fullUrl}`);

    const response = await axios.get(fullUrl, {
      params: req.query,
      timeout: 10000
    });

    res.json(response.data);
  } catch (error) {
    console.error(`❌ Erro no proxy:`, error.message);
    res.status(error.response?.status || 500).json({
      error: 'Erro ao buscar dados externos',
      details: error.message
    });
  }
});

module.exports = router;