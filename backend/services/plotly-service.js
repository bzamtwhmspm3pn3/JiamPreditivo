// services/plotly-service.js
const axios = require('axios');

class PlotlyService {
  constructor() {
    // Configure suas credenciais do Plotly
    this.username = process.env.PLOTLY_USERNAME || 'seu_usuario';
    this.apiKey = process.env.PLOTLY_API_KEY || 'sua_chave';
    this.baseUrl = 'https://api.plot.ly/v2';
  }

  // Método para criar gráfico básico
  async criarGrafico(data, layout = {}, tipo = 'scatter') {
    try {
      // Simulação - em produção, use a API real do Plotly
      const figura = {
        data: data,
        layout: layout,
        type: tipo
      };

      // Se tiver credenciais válidas, descomente:
      /*
      const response = await axios.post(`${this.baseUrl}/plots`, {
        figure: figura,
        world_readable: true
      }, {
        auth: {
          username: this.username,
          password: this.apiKey
        }
      });
      
      return response.data;
      */

      // Retorno simulado para desenvolvimento
      return {
        success: true,
        url: `https://plot.ly/~${this.username}/simulado`,
        figure: figura,
        message: 'Gráfico criado com sucesso (modo simulação)'
      };

    } catch (error) {
      console.error('Erro ao criar gráfico Plotly:', error);
      throw new Error(`Falha ao criar gráfico: ${error.message}`);
    }
  }

  // Método para criar gráfico de distribuição
  async criarDistribuicao(dados, variavel, tipo = 'histogram') {
    const trace = {
      x: dados.map(item => item[variavel]),
      type: tipo,
      name: variavel,
      opacity: 0.7
    };

    const layout = {
      title: `Distribuição de ${variavel}`,
      xaxis: { title: variavel },
      yaxis: { title: 'Frequência' },
      bargap: 0.05
    };

    return this.criarGrafico([trace], layout);
  }

  // Método para criar gráfico de série temporal
  async criarSerieTemporal(dados, x, y) {
    const trace = {
      x: dados.map(item => item[x]),
      y: dados.map(item => item[y]),
      type: 'scatter',
      mode: 'lines+markers',
      name: y
    };

    const layout = {
      title: `Série Temporal: ${y}`,
      xaxis: { title: x },
      yaxis: { title: y }
    };

    return this.criarGrafico([trace], layout);
  }

  // Método para criar gráfico de comparação
  async criarComparacao(dados, variaveis) {
    const traces = variaveis.map(variavel => ({
      x: dados.map((_, index) => index + 1),
      y: dados.map(item => item[variavel]),
      type: 'scatter',
      mode: 'lines',
      name: variavel
    }));

    const layout = {
      title: 'Comparação de Variáveis',
      xaxis: { title: 'Observação' },
      yaxis: { title: 'Valor' }
    };

    return this.criarGrafico(traces, layout);
  }
}

module.exports = new PlotlyService();