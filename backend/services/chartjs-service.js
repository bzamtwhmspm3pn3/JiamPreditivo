// services/chartjs-service.js
class ChartJsService {
  constructor() {
    console.log('ChartJsService inicializado');
  }

  // Criar configuração básica de gráfico
  criarConfiguracao(tipo, dados, labels, opcoes = {}) {
    const config = {
      type: tipo,
      data: {
        labels: labels,
        datasets: dados
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: opcoes.titulo ? true : false,
            text: opcoes.titulo || ''
          }
        },
        ...opcoes
      }
    };

    return config;
  }

  // Gráfico de linha
  criarLinha(labels, datasets, opcoes = {}) {
    const dadosFormatados = datasets.map(dataset => ({
      label: dataset.label,
      data: dataset.valores,
      borderColor: dataset.cor || this.gerarCor(),
      backgroundColor: dataset.cor ? `${dataset.cor}20` : this.gerarCor(0.2),
      tension: 0.1,
      ...dataset.opcoes
    }));

    return this.criarConfiguracao('line', dadosFormatados, labels, {
      scales: {
        y: {
          beginAtZero: opcoes.beginAtZero || false
        }
      },
      ...opcoes
    });
  }

  // Gráfico de barras
  criarBarras(labels, datasets, opcoes = {}) {
    const dadosFormatados = datasets.map(dataset => ({
      label: dataset.label,
      data: dataset.valores,
      backgroundColor: dataset.cor || this.gerarCor(0.7),
      borderColor: dataset.cor ? this.escurecerCor(dataset.cor) : this.gerarCor(),
      borderWidth: 1,
      ...dataset.opcoes
    }));

    return this.criarConfiguracao('bar', dadosFormatados, labels, {
      scales: {
        y: {
          beginAtZero: true
        }
      },
      ...opcoes
    });
  }

  // Gráfico de pizza
  criarPizza(labels, valores, opcoes = {}) {
    const cores = this.gerarPaleta(valores.length);
    
    const dataset = {
      label: opcoes.label || 'Distribuição',
      data: valores,
      backgroundColor: cores,
      borderColor: cores.map(cor => this.escurecerCor(cor)),
      borderWidth: 1
    };

    return this.criarConfiguracao('pie', [dataset], labels, opcoes);
  }

  // Gráfico de dispersão (scatter)
  criarDispersao(pontos, opcoes = {}) {
    const dataset = {
      label: opcoes.label || 'Dispersão',
      data: pontos,
      backgroundColor: opcoes.cor || this.gerarCor(0.5),
      borderColor: opcoes.cor ? this.escurecerCor(opcoes.cor) : this.gerarCor(),
      ...opcoes.dataset
    };

    return this.criarConfiguracao('scatter', [dataset], [], {
      scales: {
        x: {
          type: 'linear',
          position: 'bottom'
        }
      },
      ...opcoes
    });
  }

  // Gráfico de histograma
  criarHistograma(valores, opcoes = {}) {
    // Calcular bins automaticamente
    const numBins = opcoes.bins || Math.ceil(Math.sqrt(valores.length));
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const binWidth = (max - min) / numBins;
    
    const bins = new Array(numBins).fill(0);
    const labels = [];
    
    for (let i = 0; i < numBins; i++) {
      const binStart = min + (i * binWidth);
      const binEnd = binStart + binWidth;
      labels.push(`${binStart.toFixed(2)}-${binEnd.toFixed(2)}`);
      
      valores.forEach(valor => {
        if (valor >= binStart && (i === numBins - 1 ? valor <= binEnd : valor < binEnd)) {
          bins[i]++;
        }
      });
    }

    return this.criarBarras(labels, [{
      label: opcoes.label || 'Frequência',
      valores: bins,
      cor: opcoes.cor || '#36A2EB'
    }], {
      titulo: opcoes.titulo || 'Histograma',
      scales: {
        y: {
          title: {
            display: true,
            text: 'Frequência'
          }
        },
        x: {
          title: {
            display: true,
            text: opcoes.eixoX || 'Valores'
          }
        }
      }
    });
  }

  // Gerar cor hexadecimal aleatória
  gerarCor(alpha = 1) {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    
    if (alpha < 1) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // Gerar paleta de cores
  gerarPaleta(numCores) {
    const paleta = [];
    const hueStep = 360 / numCores;
    
    for (let i = 0; i < numCores; i++) {
      const hue = i * hueStep;
      paleta.push(`hsla(${hue}, 70%, 60%, 0.7)`);
    }
    
    return paleta;
  }

  // Escurecer cor
  escurecerCor(corHex, percent = 20) {
    // Implementação simplificada
    return corHex;
  }

  // Converter dados para formato Chart.js
  converterDadosParaChart(dados, config) {
    const { tipo, eixoX, series, agrupamento } = config;
    
    switch(tipo) {
      case 'linha':
      case 'barra':
        const labels = dados.map(item => item[eixoX]);
        const datasets = series.map(serie => ({
          label: serie.label || serie.campo,
          valores: dados.map(item => item[serie.campo])
        }));
        
        return tipo === 'linha' 
          ? this.criarLinha(labels, datasets, config.opcoes)
          : this.criarBarras(labels, datasets, config.opcoes);
          
      case 'histograma':
        const valores = dados.map(item => item[config.campo]);
        return this.criarHistograma(valores, config.opcoes);
        
      case 'dispersao':
        const pontos = dados.map(item => ({
          x: item[config.eixoX],
          y: item[config.eixoY]
        }));
        return this.criarDispersao(pontos, config.opcoes);
        
      default:
        throw new Error(`Tipo de gráfico não suportado: ${tipo}`);
    }
  }
}

module.exports = new ChartJsService();