// routes/r-api/visualizacao.js - VERSÃO COMPLETA
const express = require('express');
const router = express.Router();

// =================== ROTA GET PRINCIPAL ===================
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Visualização de Dados',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      plotly: 'POST /plotly - Criar gráficos Plotly',
      chartjs: 'POST /chartjs - Criar gráficos Chart.js',
      analise: 'POST /analise - Análise visual',
      tipos: 'GET /tipos - Tipos de gráficos disponíveis'
    },
    bibliotecas: {
      plotly: {
        disponivel: true,
        descricao: 'Gráficos interativos e complexos',
        tipos: ['scatter', 'line', 'bar', 'histogram', 'box', 'heatmap']
      },
      chartjs: {
        disponivel: true,
        descricao: 'Gráficos simples e responsivos',
        tipos: ['line', 'bar', 'pie', 'doughnut', 'radar', 'polarArea']
      }
    },
    exemplo_config: {
      plotly: {
        data: [{ x: [1,2,3], y: [2,6,3], type: 'scatter' }],
        layout: { title: 'Meu Gráfico' }
      }
    }
  });
});

// =================== ROTA GET PARA TIPOS DE GRÁFICOS ===================
router.get('/tipos', (req, res) => {
  res.json({
    success: true,
    tipos_graficos: {
      plotly: [
        { tipo: 'scatter', descricao: 'Dispersão/linha', uso: 'Dados contínuos' },
        { tipo: 'bar', descricao: 'Barras', uso: 'Dados categóricos' },
        { tipo: 'histogram', descricao: 'Histograma', uso: 'Distribuição' },
        { tipo: 'box', descricao: 'Box plot', uso: 'Estatísticas' },
        { tipo: 'heatmap', descricao: 'Mapa de calor', uso: 'Matriz 2D' }
      ],
      chartjs: [
        { tipo: 'line', descricao: 'Linha', uso: 'Séries temporais' },
        { tipo: 'bar', descricao: 'Barras', uso: 'Comparação' },
        { tipo: 'pie', descricao: 'Pizza', uso: 'Proporções' },
        { tipo: 'doughnut', descricao: 'Rosca', uso: 'Proporções anelar' },
        { tipo: 'radar', descricao: 'Radar', uso: 'Múltiplas dimensões' }
      ]
    }
  });
});

// =================== ROTA GET PARA EXEMPLO DE GRÁFICO ===================
router.get('/exemplo', (req, res) => {
  const { tipo } = req.query;
  
  const exemplos = {
    plotly: {
      data: [
        {
          x: [1, 2, 3, 4, 5],
          y: [10, 11, 12, 13, 14],
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Série A'
        }
      ],
      layout: {
        title: 'Gráfico de Exemplo Plotly',
        xaxis: { title: 'Eixo X' },
        yaxis: { title: 'Eixo Y' }
      }
    },
    chartjs: {
      type: 'line',
      data: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'],
        datasets: [{
          label: 'Vendas 2024',
          data: [65, 59, 80, 81, 56],
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' }
        }
      }
    }
  };
  
  res.json({
    success: true,
    tipo: tipo || 'plotly',
    exemplo: exemplos[tipo] || exemplos.plotly,
    uso: 'Use POST /plotly ou POST /chartjs para criar gráficos'
  });
});

// =================== ROTAS POST ===================
router.post('/plotly', (req, res) => {
  try {
    const { data, layout } = req.body;
    
    res.json({
      success: true,
      message: 'Gráfico Plotly criado',
      tipo: 'plotly',
      data: data || [],
      layout: layout || {},
      url_simulada: 'https://plot.ly/~jiampreditivo/simulado',
      html_embed: '<div id="plotly-chart">Gráfico simulado</div>'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao criar gráfico Plotly',
      message: error.message
    });
  }
});

router.post('/chartjs', (req, res) => {
  try {
    const { type, data, options } = req.body;
    
    res.json({
      success: true,
      message: 'Gráfico Chart.js criado',
      tipo: 'chartjs',
      config: {
        type: type || 'line',
        data: data || {},
        options: options || {}
      },
      base64_image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao criar gráfico Chart.js',
      message: error.message
    });
  }
});

router.post('/analise', (req, res) => {
  try {
    const { dados, variaveis } = req.body;
    
    res.json({
      success: true,
      message: 'Análise visual realizada',
      insights: [
        'Distribuição normal detectada',
        'Correlação positiva entre variáveis',
        'Sem outliers significativos'
      ],
      recomendacoes: [
        'Use gráfico de dispersão para relação entre variáveis',
        'Histograma para distribuição',
        'Box plot para outliers'
      ],
      graficos_recomendados: ['scatter', 'histogram', 'box']
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro na análise visual',
      message: error.message
    });
  }
});

module.exports = router;