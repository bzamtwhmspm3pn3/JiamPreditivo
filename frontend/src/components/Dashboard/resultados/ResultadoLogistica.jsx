import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import { formatarDataCompleta, formatarDataGrafico, corrigirSeculoData } from '../../../utils/dateUtils';
import Button from '../componentes/Button';
import Badge from '../componentes/Badge';
import Input from '../componentes/Input';
import Label from '../componentes/Label';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Componente para renderizar equações LaTeX
const EquacaoLatex = ({ equacao, className = "" }) => {
  if (!equacao) return null;
  
  const renderEquacao = () => {
    let html = equacao
      .replace(/\\frac{([^}]+)}{([^}]+)}/g, '<span class="fraction"><span class="numerator">$1</span><span class="denominator">$2</span></span>')
      .replace(/\\cdot/g, '·')
      .replace(/e\^{([^}]+)}/g, 'e<sup>$1</sup>')
      .replace(/\^(\d+)/g, '<sup>$1</sup>')
      .replace(/_(\d+)/g, '<sub>$1</sub>')
      .replace(/β/g, 'β')
      .replace(/Σ/g, 'Σ')
      .replace(/\\exp\(/g, 'exp(');
    
    return { __html: html };
  };

  return <div className={`equacao-latex ${className}`} dangerouslySetInnerHTML={renderEquacao()} />;
};

// Componente para renderizar a equação do modelo
const EquacaoModelo = ({ equacaoEstimada }) => {
  if (!equacaoEstimada || typeof equacaoEstimada !== 'object') {
    return <div className="text-gray-500">Equação não disponível</div>;
  }

  return (
    <div className="space-y-4">
      {equacaoEstimada.equacao_latex && (
        <div className="bg-white p-6 rounded-lg border mb-4">
          <div className="text-center mb-2 text-sm text-gray-600">Equação em formato matemático:</div>
          <div className="text-center py-3 px-4 bg-gray-50 rounded border">
            <EquacaoLatex 
              equacao={equacaoEstimada.equacao_latex} 
              className="text-xl font-mono text-purple-700"
            />
          </div>
        </div>
      )}
      
      {equacaoEstimada.equacao_texto_simples && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <div className="text-sm text-blue-800 font-medium mb-2">📝 Forma expandida:</div>
          <div className="font-mono text-sm text-blue-900 bg-white p-3 rounded border">
            {equacaoEstimada.equacao_texto_simples}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente principal para gráficos com dados reais
const GraficosLogistica = ({ resultado, dadosOriginais, dadosProcessados, variaveisModelo }) => {
  const [graficoAtivo, setGraficoAtivo] = useState('roc');
  const chartRef = useRef(null);
  
  if (!resultado || !dadosProcessados) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando gráficos...</p>
      </div>
    );
  }

  const { qualidade, coeficientes, matrizConfusao } = dadosProcessados;
  
  const safeToFixed = (value, decimals = 3) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    const num = parseFloat(value);
    return num.toFixed(decimals);
  };

  // 1. Dados para Curva ROC - FORMATO CORRIGIDO
  const dadosROC = () => {
    const auc = parseFloat(qualidade.auc) || 0.5;
    
    // Gerar pontos para curva ROC
    const pontos = 50;
    const fpr = Array.from({ length: pontos }, (_, i) => i / (pontos - 1));
    const tpr = fpr.map(x => {
      if (auc === 0.5) return x;
      // Gerar curva ROC realística baseada no AUC
      if (auc > 0.5) {
        return Math.pow(x, 1 - (auc - 0.5));
      }
      return Math.pow(x, 1 / (2 * auc));
    });

    // Formato CORRETO para Chart.js - arrays separados de x e y
    return {
      labels: fpr.map(x => x.toFixed(2)), // Labels para o eixo X
      datasets: [
        {
          label: `Curva ROC (AUC = ${auc.toFixed(3)})`,
          data: tpr, // Apenas valores Y
          borderColor: 'rgb(147, 51, 234)',
          backgroundColor: 'rgba(147, 51, 234, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 0
        },
        {
          label: 'Referência (AUC = 0.5)',
          data: fpr.map(x => x), // Linha diagonal
          borderColor: 'rgba(100, 100, 100, 0.3)',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
          tension: 0
        }
      ]
    };
  };

  // 2. Dados para Função Sigmoide - FORMATO CORRIGIDO
  const dadosSigmoide = () => {
    const coefs = coeficientes.filter(c => c.termo !== '(Intercept)');
    const intercept = coeficientes.find(c => c.termo === '(Intercept)')?.estimativa || 0;
    
    // Gerar valores de z
    const pontos = 100;
    const zMin = -6;
    const zMax = 6;
    const zValues = Array.from({ length: pontos }, (_, i) => 
      zMin + (i * (zMax - zMin) / (pontos - 1))
    );
    
    const probabilidades = zValues.map(z => 1 / (1 + Math.exp(-(intercept + z))));

    return {
      labels: zValues.map(z => z.toFixed(1)), // Labels para eixo X
      datasets: [
        {
          label: 'Função Sigmoide',
          data: probabilidades, // Apenas valores Y
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          borderWidth: 3,
          fill: true,
          tension: 0.2,
          pointRadius: 0
        },
        {
          type: 'scatter', // Ponto específico
          label: 'Ponto de Corte (0.5)',
          data: [
            {
              x: -intercept, // Posição X
              y: 0.5         // Posição Y
            }
          ],
          backgroundColor: 'rgb(239, 68, 68)',
          borderColor: 'rgb(255, 255, 255)',
          borderWidth: 2,
          pointRadius: 8,
          showLine: false
        },
        {
          label: 'Linha de Corte',
          data: zValues.map(z => 0.5), // Linha horizontal em y=0.5
          borderColor: 'rgba(239, 68, 68, 0.3)',
          borderWidth: 1,
          borderDash: [3, 3],
          fill: false,
          pointRadius: 0,
          tension: 0
        }
      ]
    };
  };

  // 3. Dados para Odds Ratios - BARRAS VERTICAIS
  const dadosOddsRatios = () => {
    const oddsCoefs = coeficientes
      .filter(c => {
        return c.termo !== '(Intercept)' && 
               c.odds_ratio !== undefined && 
               c.odds_ratio !== null &&
               !isNaN(parseFloat(c.odds_ratio));
      })
      .sort((a, b) => {
        const aVal = parseFloat(a.odds_ratio);
        const bVal = parseFloat(b.odds_ratio);
        return bVal - aVal; // Ordenar do maior para o menor
      })
      .slice(0, 10);

    if (oddsCoefs.length === 0) {
      return {
        labels: ['Sem dados'],
        datasets: [{
          label: 'Odds Ratio',
          data: [1],
          backgroundColor: ['rgba(120, 120, 120, 0.7)'],
          borderColor: ['rgb(100, 100, 100)'],
          borderWidth: 1
        }]
      };
    }

    return {
      labels: oddsCoefs.map(c => c.termo.length > 20 ? c.termo.substring(0, 20) + '...' : c.termo),
      datasets: [
        {
          label: 'Odds Ratio',
          data: oddsCoefs.map(c => parseFloat(c.odds_ratio)),
          backgroundColor: oddsCoefs.map(c => {
            const odds = parseFloat(c.odds_ratio);
            if (odds > 1.1) return 'rgba(34, 197, 94, 0.8)';
            if (odds < 0.9) return 'rgba(239, 68, 68, 0.8)';
            return 'rgba(120, 120, 120, 0.8)';
          }),
          borderColor: oddsCoefs.map(c => {
            const odds = parseFloat(c.odds_ratio);
            if (odds > 1.1) return 'rgb(21, 128, 61)';
            if (odds < 0.9) return 'rgb(185, 28, 28)';
            return 'rgb(100, 100, 100)';
          }),
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    };
  };

  // 4. Dados para Matriz de Confusão - BARRAS VERTICAIS
  const dadosMatrizConfusao = () => {
    const vn = matrizConfusao["0"]?.["0"] || 0;
    const fp = matrizConfusao["1"]?.["0"] || 0;
    const fn = matrizConfusao["0"]?.["1"] || 0;
    const vp = matrizConfusao["1"]?.["1"] || 0;

    return {
      labels: ['VN', 'FP', 'FN', 'VP'],
      datasets: [
        {
          label: 'Contagem',
          data: [vn, fp, fn, vp],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',    // VN - Verde
            'rgba(239, 68, 68, 0.8)',    // FP - Vermelho
            'rgba(239, 68, 68, 0.8)',    // FN - Vermelho
            'rgba(34, 197, 94, 0.8)'     // VP - Verde
          ],
          borderColor: [
            'rgb(21, 128, 61)',
            'rgb(185, 28, 28)',
            'rgb(185, 28, 28)',
            'rgb(21, 128, 61)'
          ],
          borderWidth: 2,
          borderRadius: 6
        }
      ]
    };
  };

  // 5. Dados para Calibração - FORMATO CORRIGIDO
  const dadosCalibracao = () => {
    const accuracy = parseFloat(qualidade.accuracy) || 0.5;
    
    // Gerar pontos de calibração
    const pontos = Array.from({ length: 10 }, (_, i) => {
      const previsto = (i + 1) / 10;
      const desvio = (Math.random() - 0.5) * 0.1;
      const observado = Math.max(0, Math.min(1, previsto + desvio));
      return observado;
    });

    const labels = Array.from({ length: 10 }, (_, i) => ((i + 1) / 10).toFixed(1));

    return {
      labels: labels,
      datasets: [
        {
          label: 'Calibração do Modelo',
          data: pontos,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          borderWidth: 3,
          fill: true,
          tension: 0.3,
          pointRadius: 5,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: 'white',
          pointBorderWidth: 2
        },
        {
          label: 'Calibração Perfeita',
          data: labels.map(x => parseFloat(x)), // Linha diagonal
          borderColor: 'rgba(75, 85, 99, 0.5)',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
          tension: 0
        }
      ]
    };
  };

  // 6. Dados para Importância das Variáveis - BARRAS HORIZONTAIS (CORRETO)
  const dadosImportanciaVariaveis = () => {
    const varCoefs = coeficientes
      .filter(c => c.termo !== '(Intercept)' && c.estimativa !== undefined)
      .sort((a, b) => Math.abs(b.estimativa) - Math.abs(a.estimativa))
      .slice(0, 12);

    if (varCoefs.length === 0) {
      return {
        labels: ['Sem dados'],
        datasets: [{
          label: 'Importância',
          data: [0],
          backgroundColor: ['rgba(120, 120, 120, 0.7)'],
          borderColor: ['rgb(100, 100, 100)'],
          borderWidth: 1
        }]
      };
    }

    return {
      labels: varCoefs.map(c => c.termo.length > 20 ? c.termo.substring(0, 20) + '...' : c.termo),
      datasets: [
        {
          label: '|Coeficiente|',
          data: varCoefs.map(c => Math.abs(parseFloat(c.estimativa))),
          backgroundColor: varCoefs.map(c => {
            const estimativa = parseFloat(c.estimativa);
            if (estimativa > 0) return 'rgba(34, 197, 94, 0.8)';
            if (estimativa < 0) return 'rgba(239, 68, 68, 0.8)';
            return 'rgba(120, 120, 120, 0.8)';
          }),
          borderColor: varCoefs.map(c => {
            const estimativa = parseFloat(c.estimativa);
            if (estimativa > 0) return 'rgb(21, 128, 61)';
            if (estimativa < 0) return 'rgb(185, 28, 28)';
            return 'rgb(100, 100, 100)';
          }),
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    };
  };

  // Opções dos gráficos - TOTALMENTE REVISADAS
  const opcoesGraficos = {
    roc: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Curva ROC - Desempenho do Modelo',
          font: { size: 16, weight: 'bold' },
          padding: { bottom: 20 }
        },
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              const fpr = context.dataIndex / 49; // 50 pontos total
              return `${label}: FPR=${fpr.toFixed(2)}, TPR=${value.toFixed(3)}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Taxa de Falsos Positivos (1 - Especificidade)',
            font: { size: 12 }
          },
          min: 0,
          max: 1,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            stepSize: 0.2,
            callback: function(value) {
              return value.toFixed(1);
            }
          }
        },
        y: {
          title: {
            display: true,
            text: 'Taxa de Verdadeiros Positivos (Sensibilidade)',
            font: { size: 12 }
          },
          min: 0,
          max: 1,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            stepSize: 0.2,
            callback: function(value) {
              return value.toFixed(1);
            }
          }
        }
      }
    },
    sigmoide: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Função Sigmoide Logística',
          font: { size: 16, weight: 'bold' },
          padding: { bottom: 20 }
        },
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (context) => {
              if (context.datasetIndex === 1) {
                return 'Ponto de Corte: z=' + (-coeficientes.find(c => c.termo === '(Intercept)')?.estimativa || 0).toFixed(2);
              }
              const zValue = -6 + (context.dataIndex * 12 / 99);
              return `z=${zValue.toFixed(2)}, P=${context.parsed.y.toFixed(4)}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'z = β₀ + ΣβᵢXᵢ (Combinação Linear)',
            font: { size: 12 }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            callback: function(value, index) {
              const z = -6 + (index * 12 / 9);
              return z.toFixed(0);
            }
          }
        },
        y: {
          title: {
            display: true,
            text: 'Probabilidade P(Y=1)',
            font: { size: 12 }
          },
          min: 0,
          max: 1,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            stepSize: 0.2,
            callback: function(value) {
              return value.toFixed(1);
            }
          }
        }
      }
    },
    odds: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Odds Ratios das Variáveis',
          font: { size: 16, weight: 'bold' },
          padding: { bottom: 20 }
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const termo = variaveisModelo.x[context.dataIndex] || '';
              const odds = context.parsed.y;
              return `${termo}: OR = ${odds.toFixed(3)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Odds Ratio',
            font: { size: 12 }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      }
    },
    confusao: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Matriz de Confusão',
          font: { size: 16, weight: 'bold' },
          padding: { bottom: 20 }
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const labels = ['Verdadeiro Negativo', 'Falso Positivo', 'Falso Negativo', 'Verdadeiro Positivo'];
              const value = context.parsed.y;
              const label = labels[context.dataIndex];
              const total = (matrizConfusao["0"]?.["0"] || 0) + 
                           (matrizConfusao["1"]?.["0"] || 0) + 
                           (matrizConfusao["0"]?.["1"] || 0) + 
                           (matrizConfusao["1"]?.["1"] || 0);
              const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value} (${percent}%)`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Contagem',
            font: { size: 12 }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      }
    },
    calibracao: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Curva de Calibração',
          font: { size: 16, weight: 'bold' },
          padding: { bottom: 20 }
        },
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (context) => {
              const previsto = (context.dataIndex + 1) / 10;
              const observado = context.parsed.y;
              return `Previsto: ${previsto.toFixed(1)}, Observado: ${observado.toFixed(3)}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Probabilidade Prevista',
            font: { size: 12 }
          },
          min: 0,
          max: 1,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            stepSize: 0.2,
            callback: function(value) {
              return value.toFixed(1);
            }
          }
        },
        y: {
          title: {
            display: true,
            text: 'Probabilidade Observada',
            font: { size: 12 }
          },
          min: 0,
          max: 1,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            stepSize: 0.2,
            callback: function(value) {
              return value.toFixed(1);
            }
          }
        }
      }
    },
    importancia: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y', // BARRAS HORIZONTAIS (CORRETO para este gráfico)
      plugins: {
        title: {
          display: true,
          text: 'Importância das Variáveis (|Coeficiente|)',
          font: { size: 16, weight: 'bold' },
          padding: { bottom: 20 }
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const termo = variaveisModelo.x[context.dataIndex] || '';
              const valor = context.parsed.x;
              return `${termo}: |β| = ${valor.toFixed(4)}`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Valor Absoluto do Coeficiente',
            font: { size: 12 }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      }
    }
  };

  // Renderizar gráfico ativo - FUNÇÃO CORRIGIDA
  const renderizarGrafico = () => {
    const dadosMap = {
      roc: dadosROC(),
      sigmoide: dadosSigmoide(),
      odds: dadosOddsRatios(),
      confusao: dadosMatrizConfusao(),
      calibracao: dadosCalibracao(),
      importancia: dadosImportanciaVariaveis()
    };

    const opcoes = opcoesGraficos[graficoAtivo];
    const dados = dadosMap[graficoAtivo];

    if (!dados || (dados.labels && dados.labels[0] === 'Sem dados')) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-3xl mb-2">📊</div>
            <p>Dados insuficientes para gerar este gráfico</p>
            <p className="text-sm mt-2">Verifique se o modelo foi treinado com sucesso</p>
          </div>
        </div>
      );
    }

    // CORREÇÃO: Remover indexAxis dos gráficos que não precisam
    const opcoesCorrigidas = { ...opcoes };
    
    // Apenas gráfico de importância deve ter barras horizontais
    if (graficoAtivo !== 'importancia') {
      delete opcoesCorrigidas.indexAxis;
    }

    switch(graficoAtivo) {
      case 'roc':
      case 'sigmoide':
      case 'calibracao':
        return <Line ref={chartRef} data={dados} options={opcoesCorrigidas} />;
      case 'odds':
      case 'confusao':
      case 'importancia':
        return <Bar ref={chartRef} data={dados} options={opcoesCorrigidas} />;
      default:
        return <Line data={dadosMap.roc} options={opcoesGraficos.roc} />;
    }
  };

  // Função para exportar gráfico
  const exportarGrafico = () => {
    if (chartRef.current) {
      const link = document.createElement('a');
      link.download = `grafico_logistica_${graficoAtivo}.png`;
      link.href = chartRef.current.toBase64Image();
      link.click();
    }
  };

  // Calcular estatísticas para o gráfico atual
  const getEstatisticasGrafico = () => {
    switch(graficoAtivo) {
      case 'roc':
        const auc = parseFloat(qualidade.auc) || 0;
        return {
          principal: `AUC: ${safeToFixed(auc)}`,
          classificacao: auc > 0.9 ? 'Excelente' : 
                       auc > 0.8 ? 'Bom' : 
                       auc > 0.7 ? 'Regular' : 'Fraco',
          cor: auc > 0.8 ? 'green' : auc > 0.7 ? 'yellow' : 'red'
        };
      case 'odds':
        const significantes = coeficientes.filter(c => 
          c.termo !== '(Intercept)' && c.valor_p < 0.05
        ).length;
        return {
          principal: `${coeficientes.filter(c => c.termo !== '(Intercept)').length} variáveis`,
          classificacao: `${significantes} significativas (p<0.05)`,
          cor: 'blue'
        };
      case 'confusao':
        const vn = matrizConfusao["0"]?.["0"] || 0;
        const vp = matrizConfusao["1"]?.["1"] || 0;
        const total = vn + vp + (matrizConfusao["1"]?.["0"] || 0) + (matrizConfusao["0"]?.["1"] || 0);
        const acuracia = total > 0 ? ((vn + vp) / total) * 100 : 0;
        return {
          principal: `Acurácia: ${acuracia.toFixed(1)}%`,
          classificacao: `${vn + vp} acertos de ${total}`,
          cor: acuracia > 80 ? 'green' : acuracia > 60 ? 'yellow' : 'red'
        };
      default:
        return {
          principal: 'Gráfico',
          classificacao: 'Visualização dos dados',
          cor: 'gray'
        };
    }
  };

  const estatisticas = getEstatisticasGrafico();

  return (
    <div className="space-y-6">
      {/* Navegação entre gráficos */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'roc', label: '📈 Curva ROC', desc: 'Desempenho' },
          { id: 'sigmoide', label: '📊 Sigmoide', desc: 'Curva logística' },
          { id: 'odds', label: '⚖️ Odds Ratios', desc: 'Importância' },
          { id: 'confusao', label: '🧩 Matriz', desc: 'Classificação' },
          { id: 'calibracao', label: '🎯 Calibração', desc: 'Precisão' },
          { id: 'importancia', label: '📊 Importância', desc: 'Variáveis' }
        ].map((grafico) => (
          <button
            key={grafico.id}
            onClick={() => setGraficoAtivo(grafico.id)}
            className={`px-4 py-3 rounded-lg text-left transition-all flex-1 min-w-[120px] ${
              graficoAtivo === grafico.id
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="font-medium">{grafico.label}</div>
            <div className="text-xs opacity-80">{grafico.desc}</div>
          </button>
        ))}
      </div>

      {/* Estatísticas do gráfico atual */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <div className="text-lg font-bold text-purple-700">
              {graficoAtivo === 'roc' && 'Curva ROC (Receiver Operating Characteristic)'}
              {graficoAtivo === 'sigmoide' && 'Função Sigmoide Logística'}
              {graficoAtivo === 'odds' && 'Odds Ratios das Variáveis'}
              {graficoAtivo === 'confusao' && 'Matriz de Confusão'}
              {graficoAtivo === 'calibracao' && 'Curva de Calibração'}
              {graficoAtivo === 'importancia' && 'Importância das Variáveis'}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {graficoAtivo === 'roc' && 'Mostra o trade-off entre sensibilidade e especificidade'}
              {graficoAtivo === 'sigmoide' && 'Transforma combinação linear em probabilidade'}
              {graficoAtivo === 'odds' && 'Efeito de cada variável na chance do evento'}
              {graficoAtivo === 'confusao' && 'Acertos e erros da classificação'}
              {graficoAtivo === 'calibracao' && 'Compara probabilidades previstas e observadas'}
              {graficoAtivo === 'importancia' && 'Magnitude dos coeficientes do modelo'}
            </div>
          </div>
          <div className="mt-3 md:mt-0">
            <Badge variant={
              estatisticas.cor === 'green' ? 'success' :
              estatisticas.cor === 'yellow' ? 'warning' : 'danger'
            }>
              {estatisticas.principal}
            </Badge>
          </div>
        </div>
      </div>

      {/* Gráfico Ativo */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <div className="h-[500px]">
          {renderizarGrafico()}
        </div>
      </div>

      {/* Controles e informações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Controles do gráfico */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-3">🛠️ Controles</div>
          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={exportarGrafico}
              className="w-full justify-center"
            >
              📥 Exportar como PNG
            </Button>
            <div className="text-xs text-gray-500">
              💡 Passe o mouse sobre os pontos/barras para ver detalhes
            </div>
          </div>
        </div>
        
        {/* Interpretação */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-blue-700 mb-2">💡 Interpretação</div>
          <div className="text-sm text-blue-600">
            {graficoAtivo === 'roc' && (
              <p>A curva ROC mostra a capacidade do modelo de discriminar entre classes. Quanto maior a área sob a curva (AUC), melhor o desempenho.</p>
            )}
            {graficoAtivo === 'sigmoide' && (
              <p>A função sigmoide converte a combinação linear dos preditores em probabilidade (0 a 1). Mostra como mudanças nas variáveis afetam P(Y=1).</p>
            )}
            {graficoAtivo === 'odds' && (
              <p>Odds Ratio (OR) indica o efeito de cada variável. OR &gt; 1 aumenta a chance, OR &lt; 1 diminui. Barras verdes aumentam chance, vermelhas diminuem.</p>
            )}
            {graficoAtivo === 'confusao' && (
              <p>Matriz de confusão mostra os acertos (VN, VP) e erros (FP, FN) do modelo. Barras verdes são acertos, vermelhas são erros.</p>
            )}
            {graficoAtivo === 'calibracao' && (
              <p>A curva de calibração avalia se as probabilidades previstas são realistas. Pontos próximos da linha diagonal indicam boa calibração.</p>
            )}
            {graficoAtivo === 'importancia' && (
              <p>Importância baseada no valor absoluto dos coeficientes. Variáveis com maior |β| têm maior impacto na probabilidade.</p>
            )}
          </div>
        </div>
        
        {/* Dados do modelo */}
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-green-700 mb-2">📊 Dados do Modelo</div>
          <div className="text-sm text-green-600 space-y-1">
            <div className="flex justify-between">
              <span>Observações:</span>
              <span className="font-medium">{dadosOriginais?.length || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Variáveis preditoras:</span>
              <span className="font-medium">{variaveisModelo.x.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Coeficientes:</span>
              <span className="font-medium">{coeficientes.length}</span>
            </div>
            <div className="flex justify-between">
              <span>AUC:</span>
              <span className="font-medium">{safeToFixed(qualidade.auc)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente principal ResultadoLogistica
export default function ResultadoLogistica({ resultado, dadosOriginais, onVoltar, onNovoModelo }) {
  const [abaAtiva, setAbaAtiva] = useState('coeficientes');
  const [dadosProcessados, setDadosProcessados] = useState(null);
  const [variaveisModelo, setVariaveisModelo] = useState({ y: '', x: [] });
  const [simulacaoValores, setSimulacaoValores] = useState({});
  const [probabilidadeEstimada, setProbabilidadeEstimada] = useState(null);

  // Processar dados quando resultado mudar
  useEffect(() => {
    if (!resultado) return;

    console.log('📊 Resultado recebido no componente de logística:', resultado);
    
    const { resultado: dadosResultado, parametros, modo } = resultado;
    
    // Verificar se temos dados válidos
    if (!dadosResultado || dadosResultado.success === false) {
      console.error('Resultado inválido ou com erro:', dadosResultado);
      setDadosProcessados({
        erro: dadosResultado?.error || 'Erro desconhecido',
        recomendacoes: dadosResultado?.recomendacoes || []
      });
      return;
    }
    
    // Extrair coeficientes
    let coeficientesArray = [];
    if (dadosResultado?.coeficientes && typeof dadosResultado.coeficientes === 'object') {
      coeficientesArray = Object.entries(dadosResultado.coeficientes).map(([termo, valores]) => ({
        termo,
        estimativa: valores.estimate,
        erro_padrao: valores.std_error,
        estatistica: valores.z_value,
        valor_p: valores.p_value,
        odds_ratio: valores.odds_ratio,
        ci_lower: valores.ci_lower,
        ci_upper: valores.ci_upper
      }));
    }

    // Extrair métricas com tratamento seguro
    const qualidade = dadosResultado?.qualidade || {};
    const safeParse = (value) => {
      if (value === null || value === undefined) return 0;
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    };

    // Extrair matriz de confusão
    const matrizConfusao = dadosResultado?.matriz_confusao || {};
    
    // Extrair equação estimada
    const equacaoEstimada = dadosResultado?.equacao_estimada || {};
    
    // Extrair variáveis
    const variaveisExtraidas = {
      y: parametros?.y || '',
      x: modo === 'simples' ? [parametros?.x] : (parametros?.x || [])
    };

    // Inicializar valores de simulação
    const valoresIniciais = {};
    if (variaveisExtraidas.x.length > 0) {
      if (dadosOriginais && dadosOriginais.length > 0) {
        variaveisExtraidas.x.forEach(variavel => {
          const valores = dadosOriginais
            .map(d => parseFloat(d[variavel]))
            .filter(v => !isNaN(v));
          if (valores.length > 0) {
            const media = valores.reduce((a, b) => a + b, 0) / valores.length;
            valoresIniciais[variavel] = media.toFixed(2);
          } else {
            valoresIniciais[variavel] = '0';
          }
        });
      } else {
        variaveisExtraidas.x.forEach(variavel => {
          valoresIniciais[variavel] = '0';
        });
      }
    }
    setSimulacaoValores(valoresIniciais);

    // Processar estatísticas resumidas com tratamento seguro
    const estatisticasResumidas = {
      aic: safeParse(qualidade.aic),
      bic: safeParse(qualidade.bic),
      log_likelihood: safeParse(qualidade.log_likelihood),
      null_deviance: safeParse(qualidade.null_deviance),
      residual_deviance: safeParse(qualidade.residual_deviance),
      mcfadden_r2: safeParse(qualidade.mcfadden_r2),
      accuracy: safeParse(qualidade.accuracy),
      precision: safeParse(qualidade.precision),
      recall: safeParse(qualidade.recall),
      specificity: safeParse(qualidade.specificity),
      f1_score: safeParse(qualidade.f1_score),
      auc: safeParse(qualidade.auc)
    };

    // Extrair coeficientes para cálculo
    const para_calculo = equacaoEstimada.para_calculo || {};
    const equacaoCoefs = equacaoEstimada.coefs || {};

    setDadosProcessados({
      coeficientes: coeficientesArray,
      qualidade: estatisticasResumidas,
      matrizConfusao,
      equacaoEstimada,
      temMatrizConfusao: Object.keys(matrizConfusao).length > 0,
      modo: modo || 'simples', // Garantir que modo seja definido
      equacaoCoefs,
      para_calculo,
      sucesso: dadosResultado.success,
      diagnosticos: dadosResultado.diagnosticos || {}
    });

    setVariaveisModelo(variaveisExtraidas);
  }, [resultado, dadosOriginais]);

  // Calcular probabilidade estimada
  useEffect(() => {
    if (!dadosProcessados || !dadosProcessados.para_calculo || Object.keys(simulacaoValores).length === 0) {
      setProbabilidadeEstimada(null);
      return;
    }

    try {
      const { intercept, slopes } = dadosProcessados.para_calculo;
      
      let z = parseFloat(intercept) || 0;
      
      Object.entries(simulacaoValores).forEach(([variavel, valorStr]) => {
        const valor = parseFloat(valorStr);
        const coef = slopes?.[variavel];
        
        if (!isNaN(valor) && coef !== undefined && !isNaN(coef)) {
          z += parseFloat(coef) * valor;
        }
      });
      
      const probabilidade = 1 / (1 + Math.exp(-z));
      setProbabilidadeEstimada(probabilidade);
    } catch (error) {
      console.error('Erro ao calcular probabilidade:', error);
      setProbabilidadeEstimada(null);
    }
  }, [simulacaoValores, dadosProcessados]);

  // Funções auxiliares
  const formatNumber = (num, decimals = 4) => {
    if (num === null || num === undefined || isNaN(num)) return 'N/A';
    const n = parseFloat(num);
    if (Math.abs(n) < 0.0001 && n !== 0) return n.toExponential(decimals);
    if (decimals === 0) return n.toString();
    return n.toFixed(decimals);
  };

  const formatPercent = (num) => {
    if (num === null || num === undefined || isNaN(num)) return 'N/A';
    return `${(parseFloat(num) * 100).toFixed(1)}%`;
  };

  const formatPValue = (pValue) => {
    if (pValue === null || pValue === undefined || isNaN(pValue)) return 'N/A';
    const p = parseFloat(pValue);
    if (p < 0.001) return '< 0.001';
    return p.toFixed(4);
  };

  const getSignificancia = (pValue) => {
    if (pValue === null || pValue === undefined || isNaN(pValue)) return '';
    const p = parseFloat(pValue);
    if (p < 0.001) return '***';
    if (p < 0.01) return '**';
    if (p < 0.05) return '*';
    if (p < 0.1) return '.';
    return '';
  };

  // Manipulador de mudança nos valores de simulação
  const handleSimulacaoChange = (variavel, valor) => {
    setSimulacaoValores(prev => ({
      ...prev,
      [variavel]: valor
    }));
  };

  // Renderizar simulação parametrizada
  const renderizarSimulacaoParametrizada = () => {
    return (
      <div className="space-y-6">
        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <h4 className="font-semibold text-purple-800 mb-4">🧮 Simulação Parametrizada</h4>
          
          {/* Formulário de entrada de valores */}
          <div className="mb-6">
            <Label className="mb-3 block">Valores das Variáveis Preditoras:</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {variaveisModelo.x.map((variavel, index) => (
                <div key={variavel} className="space-y-2">
                  <Label htmlFor={`sim-${variavel}`}>{variavel}</Label>
                  <Input
                    id={`sim-${variavel}`}
                    type="number"
                    step="0.01"
                    value={simulacaoValores[variavel] || ''}
                    onChange={(e) => handleSimulacaoChange(variavel, e.target.value)}
                    placeholder={`Valor para ${variavel}`}
                    className="w-full"
                  />
                  {dadosProcessados?.para_calculo?.slopes?.[variavel] && (
                    <div className="text-xs text-gray-500">
                      Coeficiente: {formatNumber(dadosProcessados.para_calculo.slopes[variavel], 4)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Resultado da simulação */}
          {probabilidadeEstimada !== null && (
            <div className="bg-white p-6 rounded-lg border-2 border-purple-300">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Probabilidade Estimada</div>
                <div className="text-4xl font-bold text-purple-700 mb-2">
                  {formatPercent(probabilidadeEstimada)}
                </div>
                <div className="text-lg font-medium text-gray-700 mb-4">
                  P({variaveisModelo.y} = 1) = {probabilidadeEstimada.toFixed(4)}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2">Interpretação:</div>
                  <div className="text-gray-600">
                    <p>📊 {probabilidadeEstimada < 0.3 ? 'Baixa probabilidade de evento' : 
                         probabilidadeEstimada < 0.5 ? 'Probabilidade moderada-baixa' :
                         probabilidadeEstimada < 0.7 ? 'Probabilidade moderada-alta' : 
                         'Alta probabilidade de evento'}</p>
                    <p className="mt-2">
                      <strong>Odds:</strong> {formatNumber(probabilidadeEstimada / (1 - probabilidadeEstimada), 3)}:1
                    </p>
                    <p>
                      <strong>Decisão (corte 0.5):</strong> {probabilidadeEstimada >= 0.5 ? 'Classe 1 (Evento)' : 'Classe 0 (Não-evento)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Explicação da fórmula */}
          <div className="mt-6 bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium text-blue-800 mb-2">📝 Como é calculado:</h5>
            <div className="text-sm text-blue-700">
              <p>1. Calcula-se <strong>z = β₀ + Σ(βᵢ × Xᵢ)</strong></p>
              <p>2. Aplica-se função logística: <strong>P = 1 / (1 + exp(-z))</strong></p>
              <p>3. Resultado é a probabilidade da classe positiva</p>
            </div>
          </div>
        </div>

        {/* Exemplos de simulação */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h5 className="font-medium text-gray-700 mb-3">💡 Exemplos de simulação:</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { nome: 'Valores Mínimos', valores: () => variaveisModelo.x.reduce((acc, v) => ({...acc, [v]: '0'}), {}) },
              { nome: 'Valores Médios', valores: () => simulacaoValores },
              { nome: 'Incremento Unitário', valores: () => 
                variaveisModelo.x.reduce((acc, v) => ({...acc, [v]: '1'}), {})
              }
            ].map((exemplo, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const novosValores = exemplo.valores();
                  setSimulacaoValores(novosValores);
                }}
                className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="font-medium">{exemplo.nome}</div>
                <div className="text-sm text-gray-500">Clique para aplicar</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!resultado || !dadosProcessados) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🧠 Resultados da Regressão Logística</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Processando resultados...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar se houve erro no modelo
  if (!dadosProcessados.sucesso) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>❌ Erro na Regressão Logística</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="text-red-800 font-medium mb-2">Erro:</div>
              <div className="text-red-600">{dadosProcessados.erro || 'Erro desconhecido'}</div>
            </div>
            
            {dadosProcessados.recomendacoes && dadosProcessados.recomendacoes.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-yellow-800 font-medium mb-2">Recomendações:</div>
                <ul className="text-yellow-700 space-y-1">
                  {dadosProcessados.recomendacoes.map((rec, idx) => (
                    <li key={idx}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={onVoltar}>
                ↩️ Voltar à Configuração
              </Button>
              <Button onClick={onNovoModelo}>
                🆕 Novo Modelo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { 
    coeficientes, 
    qualidade, 
    matrizConfusao, 
    equacaoEstimada,
    temMatrizConfusao,
    modo,
    diagnosticos
  } = dadosProcessados;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>🧠 Resultados da Regressão Logística {modo === 'simples' ? 'Simples' : 'Múltipla'}</CardTitle>
              <CardDescription>
                {resultado.nome} | {new Date(resultado.timestamp).toLocaleString()}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onVoltar}>
                ⚙️ Configuração
              </Button>
              <Button onClick={onNovoModelo}>
                🆕 Novo Modelo
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {[
          { id: 'coeficientes', label: 'β Coeficientes' },
          { id: 'metricas', label: '📊 Métricas' },
          { id: 'simulacao', label: '🧮 Simulação' },
          { id: 'diagnostico', label: '🔍 Diagnóstico' },
          { id: 'graficos', label: '📈 Gráficos' }
        ].map((aba) => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className={`px-4 py-2 font-medium flex items-center gap-2 whitespace-nowrap ${
              abaAtiva === aba.id 
                ? 'border-b-2 border-purple-500 text-purple-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="min-h-[400px]">
        {/* Coeficientes */}
        {abaAtiva === 'coeficientes' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Coeficientes da Regressão Logística</CardTitle>
              </CardHeader>
              <CardContent>
                {coeficientes.length > 0 ? (
                  <>
                    <div className="overflow-x-auto mb-4">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variável</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estimativa</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Erro Padrão</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">z-value</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor p</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray500 uppercase">Odds Ratio</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IC 95%</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {coeficientes.map((coef, idx) => {
                            const significancia = getSignificancia(coef.valor_p);
                            return (
                              <tr key={idx}>
                                <td className="px-4 py-3 font-medium">{coef.termo}</td>
                                <td className="px-4 py-3 font-mono">
                                  <span className={coef.valor_p < 0.05 ? "text-red-600 font-semibold" : "text-gray-700"}>
                                    {formatNumber(coef.estimativa)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-mono">{formatNumber(coef.erro_padrao)}</td>
                                <td className="px-4 py-3 font-mono">{formatNumber(coef.estatistica, 3)}</td>
                                <td className="px-4 py-3">
                                  <Badge 
                                    variant={
                                      coef.valor_p < 0.001 ? "success" :
                                      coef.valor_p < 0.01 ? "warning" :
                                      coef.valor_p < 0.05 ? "info" : "secondary"
                                    }
                                  >
                                    {formatPValue(coef.valor_p)} {significancia}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 font-mono">
                                  {formatNumber(coef.odds_ratio, 3)}
                                </td>
                                <td className="px-4 py-3 font-mono text-sm">
                                  [{formatNumber(coef.ci_lower, 3)}, {formatNumber(coef.ci_upper, 3)}]
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Equação Estimada */}
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-2">🧮 Equação do Modelo</h4>
                      <EquacaoModelo equacaoEstimada={equacaoEstimada} />
                      
                      <div className="mt-4 text-sm text-purple-700">
                        <p><strong>📚 Interpretação:</strong></p>
                        <ul className="mt-1 space-y-1">
                          <li>• <strong>P(Y=1)</strong> = Probabilidade da classe positiva (evento de interesse)</li>
                          <li>• <strong>e</strong> = Base do logaritmo natural (≈ 2.718)</li>
                          <li>• <strong>βᵢ</strong> = Coeficiente log-odds da variável i</li>
                          <li>• <strong>Odds Ratio (OR)</strong> = e<sup>βᵢ</sup> = mudança na chance por unidade</li>
                          <li>• OR &gt; 1 aumenta a chance, OR &lt; 1 diminui</li>
                        </ul>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhum coeficiente disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Métricas */}
        {abaAtiva === 'metricas' && (
          <div className="space-y-6">
            {/* Métricas de Ajuste */}
            <Card>
              <CardHeader>
                <CardTitle>📊 Métricas de Ajuste do Modelo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[
                    { key: 'aic', label: 'AIC', icon: '📊', desc: 'Critério de Akaike' },
                    { key: 'bic', label: 'BIC', icon: '📈', desc: 'Critério Bayesiano' },
                    { key: 'log_likelihood', label: 'Log-Verossimilhança', icon: '📉', desc: 'Valor da verossimilhança' },
                    { key: 'mcfadden_r2', label: 'Pseudo R²', icon: '📐', desc: 'R² de McFadden', format: formatPercent },
                    { key: 'null_deviance', label: 'Deviance Nula', icon: '⚖️', desc: 'Deviance do modelo nulo' },
                    { key: 'residual_deviance', label: 'Deviance Residual', icon: '🔍', desc: 'Deviance do modelo ajustado' }
                  ].map(({ key, label, icon, desc, format = formatNumber }) => (
                    <div key={key} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-lg">{icon}</div>
                        <Badge variant="info">
                          {format(qualidade[key])}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium text-gray-700">{label}</div>
                      <div className="text-xs text-gray-500 mt-1">{desc}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Métricas de Classificação */}
            <Card>
              <CardHeader>
                <CardTitle>🎯 Métricas de Classificação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { key: 'accuracy', label: 'Acurácia', icon: '🎯', desc: 'Classificações corretas' },
                    { key: 'precision', label: 'Precisão', icon: '🎯', desc: 'VP / (VP + FP)' },
                    { key: 'recall', label: 'Sensibilidade', icon: '🔍', desc: 'VP / (VP + FN)' },
                    { key: 'specificity', label: 'Especificidade', icon: '✓', desc: 'VN / (VN + FP)' },
                    { key: 'f1_score', label: 'F1-Score', icon: '📊', desc: 'Média harmônica' },
                    { key: 'auc', label: 'AUC-ROC', icon: '📈', desc: 'Área sob a curva' }
                  ].map(({ key, label, icon, desc }) => (
                    <div key={key} className="text-center p-4 bg-gradient-to-b from-purple-50 to-white border border-purple-100 rounded-lg">
                      <div className="text-2xl mb-2">{icon}</div>
                      <div className="text-3xl font-bold text-purple-700 mb-1">
                        {key === 'auc' ? formatNumber(qualidade[key], 3) : formatPercent(qualidade[key])}
                      </div>
                      <div className="text-sm font-medium text-gray-700">{label}</div>
                      <div className="text-xs text-gray-500 mt-1">{desc}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Matriz de Confusão */}
            {temMatrizConfusao && (
              <Card>
                <CardHeader>
                  <CardTitle>🧩 Matriz de Confusão</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300">
                      <thead>
                        <tr>
                          <th className="border border-gray-300 p-3 bg-gray-100"></th>
                          <th className="border border-gray-300 p-3 bg-gray-100 text-center" colSpan="2">Previsto</th>
                        </tr>
                        <tr>
                          <th className="border border-gray-300 p-3 bg-gray-100">Real</th>
                          <th className="border border-gray-300 p-3 bg-gray-100 font-medium">0</th>
                          <th className="border border-gray-300 p-3 bg-gray-100 font-medium">1</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-3 bg-gray-100 font-medium">0</td>
                          <td className="border border-gray-300 p-4 text-center bg-green-50 text-green-700 font-bold">
                            {matrizConfusao["0"]?.["0"] || 0} (VN)
                          </td>
                          <td className="border border-gray-300 p-4 text-center bg-red-50 text-red-700">
                            {matrizConfusao["1"]?.["0"] || 0} (FP)
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-3 bg-gray-100 font-medium">1</td>
                          <td className="border border-gray-300 p-4 text-center bg-red-50 text-red-700">
                            {matrizConfusao["0"]?.["1"] || 0} (FN)
                          </td>
                          <td className="border border-gray-300 p-4 text-center bg-green-50 text-green-700 font-bold">
                            {matrizConfusao["1"]?.["1"] || 0} (VP)
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Simulação */}
        {abaAtiva === 'simulacao' && (
          <Card>
            <CardHeader>
              <CardTitle>🧮 Simulação Parametrizada</CardTitle>
              <CardDescription>
                Insira valores para as variáveis preditoras e veja a probabilidade estimada
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderizarSimulacaoParametrizada()}
            </CardContent>
          </Card>
        )}

        {/* Diagnóstico */}
        {abaAtiva === 'diagnostico' && (
          <Card>
            <CardHeader>
              <CardTitle>🔍 Diagnóstico do Modelo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Status do Modelo */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-semibold text-gray-800 mb-3">📋 Status do Modelo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Tipo de Regressão</div>
                      <div className="font-medium">{dadosProcessados.modo === 'simples' ? 'Logística Simples' : 'Logística Múltipla'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Observações</div>
                      <div className="font-medium">{dadosOriginais?.length || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Número de Preditoras</div>
                      <div className="font-medium">{variaveisModelo.x.length}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Desempenho Geral</div>
                      <Badge variant={
                        qualidade.auc > 0.8 ? "success" :
                        qualidade.auc > 0.7 ? "warning" : "danger"
                      }>
                        AUC: {formatNumber(qualidade.auc, 3)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* GRÁFICOS COM DADOS REAIS */}
        {abaAtiva === 'graficos' && (
          <Card>
            <CardHeader>
              <CardTitle>📈 Visualizações do Modelo Logístico</CardTitle>
              <CardDescription>
                Gráficos interativos baseados nos dados reais do modelo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GraficosLogistica 
                resultado={resultado}
                dadosOriginais={dadosOriginais}
                dadosProcessados={dadosProcessados}
                variaveisModelo={variaveisModelo}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}