const express = require('express');
const router = express.Router();
const axios = require('axios');

// APIs externas com fallbacks
const API_ENDPOINTS = {
  bna: {
    url: 'https://www.bna.ao/api',
    fallback: {
      'taxas-cambio': { USD: { venda: 912.25, compra: 902.50 }, EUR: { venda: 1101.02, compra: 1089.50 } }
    }
  },
  ine: {
    url: 'https://www.ine.gov.ao/api',
    fallback: {
      'inflacao': 14.56,
      'desemprego': 26.90
    }
  },
  imf: {
    url: 'https://www.imf.org/external/datamapper/api/v1',
    fallback: {
      'NGDP_RPCH/AGO': { values: { AGO: { '2026': 2.1, '2025': 1.8 } } }
    }
  },
  tradingeco: {
    url: 'https://api.tradingeconomics.com',
    fallback: {
      'commodity/brent-crude-oil': [{ Last: 68.69, Change: 0.5 }],
      'country/angola': [{ Inflation: 14.56, UnemploymentRate: 26.90 }]
    }
  }
};

router.get('/:source/:path(*)', async (req, res) => {
  const { source, path } = req.params;
  const config = API_ENDPOINTS[source];

  if (!config) {
    return res.status(400).json({ error: 'Fonte não suportada' });
  }

  try {
    // CORREÇÃO: Usar crases para template string
    const fullUrl = `${config.url}/${path}`;
    console.log(`🔀 Proxy: ${req.originalUrl} -> ${fullUrl}`);

    const response = await axios.get(fullUrl, {
      params: req.query,
      timeout: 5000,
      headers: { 'User-Agent': 'JIAM-Preditivo/2.0' }
    });

    res.json(response.data);
  } catch (error) {
    console.log(`⚠️ API ${source} indisponível (${error.message}), usando fallback`);

    // Retornar fallback específico para o caminho
    const fallback = config.fallback[path] || config.fallback;
    res.json(fallback);
  }
});

module.exports = router;
