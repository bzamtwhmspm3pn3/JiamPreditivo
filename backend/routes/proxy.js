const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio'); // Para web scraping (instale: npm install cheerio)
const router = express.Router();

// ==================== CÂMBIO (USD/AOA, EUR/AOA) via exchangerate.host (gratuito) ====================
router.get('/bna/taxas-cambio', async (req, res) => {
  try {
    // Busca USD para AOA
    const usdResponse = await axios.get('https://api.exchangerate.host/latest?base=USD&symbols=AOA', {
      timeout: 10000
    });
    const eurResponse = await axios.get('https://api.exchangerate.host/latest?base=EUR&symbols=AOA', {
      timeout: 10000
    });

    const usdRate = usdResponse.data.rates?.AOA || 918.95;
    const eurRate = eurResponse.data.rates?.AOA || 1090.13;

    res.json({
      USD: { venda: usdRate, compra: usdRate * 0.995 }, // estimativa de compra
      EUR: { venda: eurRate, compra: eurRate * 0.995 },
      fonte: 'exchangerate.host'
    });
  } catch (error) {
    console.error('❌ Erro ao buscar câmbio:', error.message);
    // Fallback: Trading Economics guest
    try {
      const teResponse = await axios.get('https://api.tradingeconomics.com/forex', {
        params: { symbols: 'USDAOA:CUR,EURAOA:CUR', c: 'guest:guest' },
        timeout: 10000
      });
      const data = teResponse.data;
      const usd = data.find(item => item.Symbol === 'USDAOA:CUR');
      const eur = data.find(item => item.Symbol === 'EURAOA:CUR');
      res.json({
        USD: { venda: usd?.Last || 918.95, compra: usd?.Bid || 915.50 },
        EUR: { venda: eur?.Last || 1090.13, compra: eur?.Bid || 1085.80 },
        fonte: 'Trading Economics (guest)'
      });
    } catch (teError) {
      console.error('❌ Fallback TE também falhou:', teError.message);
      res.json({
        USD: { venda: 918.95, compra: 915.50 },
        EUR: { venda: 1090.13, compra: 1085.80 },
        _mock: true,
        fonte: 'Fallback'
      });
    }
  }
});

// ==================== INFLAÇÃO (INE) via scraping (se possível) ====================
router.get('/ine/inflacao', async (req, res) => {
  try {
    // Tenta obter do Trading Economics guest primeiro
    const teResponse = await axios.get('https://api.tradingeconomics.com/country/angola', {
      params: { c: 'guest:guest' },
      timeout: 10000
    });
    const data = teResponse.data[0];
    if (data && data.Inflation) {
      return res.json({
        taxa: data.Inflation,
        periodo: 'Último dado disponível',
        fonte: 'Trading Economics (guest)'
      });
    }

    // Se falhar, tenta scraping do site do INE (exemplo hipotético)
    // Precisamos da URL real onde a inflação é publicada
    const ineResponse = await axios.get('https://www.ine.gov.ao/indicadores/inflacao', {
      timeout: 10000
    });
    const $ = cheerio.load(ineResponse.data);
    // Exemplo: suponha que a taxa esteja num elemento com classe .inflacao-valor
    const taxaTexto = $('.inflacao-valor').first().text().trim();
    const taxa = parseFloat(taxaTexto.replace(',', '.'));
    if (!isNaN(taxa)) {
      return res.json({
        taxa,
        periodo: 'Último mês',
        fonte: 'INE (scraping)'
      });
    }

    throw new Error('Não foi possível extrair inflação');
  } catch (error) {
    console.error('❌ Erro ao buscar inflação:', error.message);
    res.json({
      taxa: 14.56,
      periodo: 'Janeiro 2026 (estimado)',
      _mock: true,
      fonte: 'Fallback'
    });
  }
});

// ==================== DESEMPREGO (INE) via scraping ====================
router.get('/ine/desemprego', async (req, res) => {
  try {
    // Tenta Trading Economics guest
    const teResponse = await axios.get('https://api.tradingeconomics.com/country/angola', {
      params: { indicator: 'Unemployment Rate', c: 'guest:guest' },
      timeout: 10000
    });
    const data = teResponse.data[0];
    if (data && data.Value) {
      return res.json({
        taxa: data.Value,
        periodo: data.LatestValueDate || 'Último trimestre',
        fonte: 'Trading Economics (guest)'
      });
    }

    // Scraping do INE (exemplo)
    const ineResponse = await axios.get('https://www.ine.gov.ao/indicadores/desemprego', {
      timeout: 10000
    });
    const $ = cheerio.load(ineResponse.data);
    const taxaTexto = $('.desemprego-valor').first().text().trim();
    const taxa = parseFloat(taxaTexto.replace(',', '.'));
    if (!isNaN(taxa)) {
      return res.json({
        taxa,
        periodo: 'Último trimestre',
        fonte: 'INE (scraping)'
      });
    }

    throw new Error('Não foi possível extrair desemprego');
  } catch (error) {
    console.error('❌ Erro ao buscar desemprego:', error.message);
    res.json({
      taxa: 26.90,
      periodo: 'Setembro 2025 (estimado)',
      _mock: true,
      fonte: 'Fallback'
    });
  }
});

// ==================== PIB (FMI) - já funciona sem chave ====================
router.get('/imf/NGDP_RPCH/AGO', async (req, res) => {
  try {
    const response = await axios.get(
      'https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH/AGO',
      { timeout: 10000 }
    );
    const data = response.data;
    const pibValue = data.values?.AGO?.[2026] || 2.1;
    res.json({
      values: { AGO: { 2026: pibValue } },
      fonte: 'FMI'
    });
  } catch (error) {
    console.error('❌ Erro ao buscar PIB:', error.message);
    res.json({
      values: { AGO: { 2026: 2.1 } },
      _mock: true,
      fonte: 'Fallback'
    });
  }
});

// ==================== PETRÓLEO (Brent) via EIA (gratuito, requer cadastro) ou fallback ====================
router.get('/tradingeco/commodity/brent-crude-oil', async (req, res) => {
  try {
    // Tenta API do EIA (gratuita, mas precisa de chave)
    // Você pode obter uma chave gratuita em https://www.eia.gov/opendata/
    const EIA_API_KEY = process.env.EIA_API_KEY; // coloque no .env se tiver
    if (EIA_API_KEY) {
      const eiaResponse = await axios.get(
        `https://api.eia.gov/v2/petroleum/pri/spt/data/`,
        {
          params: {
            frequency: 'daily',
            data: ['value'],
            facets: { series: ['RBRTE'] }, // Brent spot
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0],
            sort: [ { column: 'period', direction: 'desc' } ],
            offset: 0,
            length: 1,
            api_key: EIA_API_KEY
          },
          timeout: 10000
        }
      );
      const value = eiaResponse.data.response?.data?.[0]?.value;
      if (value) {
        return res.json([{ Last: parseFloat(value) }]);
      }
    }

    // Fallback: Trading Economics guest
    const teResponse = await axios.get('https://api.tradingeconomics.com/commodity/brent-crude-oil', {
      params: { c: 'guest:guest' },
      timeout: 10000
    });
    res.json(teResponse.data);
  } catch (error) {
    console.error('❌ Erro ao buscar petróleo:', error.message);
    res.json([{ Last: 68.69 }]);
  }
});

module.exports = router;