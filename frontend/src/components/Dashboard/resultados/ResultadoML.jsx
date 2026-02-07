// componentes/resultados/ResultadoML.js
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import Button from '../componentes/Button';
import Badge from '../componentes/Badge';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  Colors,
  ArcElement,
  RadialLinearScale
} from 'chart.js';
import { Bar, Line, Scatter } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  Colors,
  ArcElement,
  RadialLinearScale
);

// Componente de gráficos específico para ML
const GraficosML = ({ dados, tipoModelo }) => {
  const [graficoAtivo, setGraficoAtivo] = useState('importancia');
  const [dadosProcessados, setDadosProcessados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const chartRef = useRef(null);

  useEffect(() => {
    console.log('📊 GraficosML recebeu dados:', dados);
    
    if (!dados || !dados.resultado) {
      console.log('⚠️  GraficosML: Dados vazios');
      setDadosProcessados(null);
      setCarregando(false);
      return;
    }

    try {
      const { resultado } = dados;
      console.log('📊 Resultado bruto:', resultado);
      
      const isRegression = dados.parametros?.is_regression || false;
      const isXGBoost = tipoModelo === 'xgboost';
      const isRandomForest = tipoModelo === 'random_forest';

      // Extrair dados de importância - VERIFICANDO ESTRUTURA REAL
      let importanciaData = [];
      
      if (isXGBoost) {
        console.log('🔍 Procurando importancia XGBoost:', {
          metricas_xgboost: resultado.metricas_xgboost,
          importancia: resultado.metricas_xgboost?.importancia,
          tipo: typeof resultado.metricas_xgboost?.importancia
        });
        
        if (resultado.metricas_xgboost?.importancia) {
          if (Array.isArray(resultado.metricas_xgboost.importancia)) {
            importanciaData = resultado.metricas_xgboost.importancia;
          } else if (typeof resultado.metricas_xgboost.importancia === 'object') {
            // Converter objeto para array
            importanciaData = Object.entries(resultado.metricas_xgboost.importancia).map(([variavel, valores]) => ({
              variavel,
              ...valores
            }));
          }
        }
      } else if (isRandomForest) {
        console.log('🔍 Procurando importancia Random Forest:', {
          metricas_rf: resultado.metricas_rf,
          importancia: resultado.metricas_rf?.importancia,
          tipo: typeof resultado.metricas_rf?.importancia
        });
        
        if (resultado.metricas_rf?.importancia) {
          if (Array.isArray(resultado.metricas_rf.importancia)) {
            importanciaData = resultado.metricas_rf.importancia;
          } else if (typeof resultado.metricas_rf.importancia === 'object') {
            // Converter objeto para array
            importanciaData = Object.entries(resultado.metricas_rf.importancia).map(([variavel, valores]) => ({
              variavel,
              ...valores
            }));
          }
        }
      }

      console.log('📊 Importância extraída:', importanciaData);

      // Extrair qualidade
      const qualidade = resultado.qualidade || {};
      console.log('📊 Qualidade extraída:', qualidade);

      // Extrair predições
      const predicoes_amostra = resultado.predicoes_amostra || [];
      console.log('📊 Predições extraídas:', predicoes_amostra?.length, 'amostras');

      // Preparar dados para gráficos
      const processado = {
        importancia: importanciaData,
        qualidade: qualidade,
        isRegression: isRegression,
        isXGBoost: isXGBoost,
        isRandomForest: isRandomForest,
        parametros: dados.parametros || {},
        predicoes_amostra: predicoes_amostra,
        matrizConfusao: qualidade.ConfusionMatrix || null,
        metricsByClass: qualidade.MetricsByClass || []
      };

      console.log('📊 Dados processados para gráficos:', processado);
      setDadosProcessados(processado);
    } catch (error) {
      console.error('❌ Erro ao processar dados para gráficos:', error);
      setDadosProcessados(null);
    } finally {
      setCarregando(false);
    }
  }, [dados, tipoModelo]);

  // Função auxiliar para extrair valores de importância
  const extrairValorImportancia = (item, chaveDados) => {
    if (!item) return 0;
    
    // Tentar diferentes formas de acessar o valor
    const valor = item[chaveDados] || 
                  item.importancia || 
                  item.gain || 
                  item.importance ||
                  0;
    
    return parseFloat(valor) || 0;
  };

  // 1. Gráfico de Importância das Variáveis
  const dadosImportancia = () => {
    console.log('📊 Gerando dadosImportancia:', dadosProcessados?.importancia);
    
    if (!dadosProcessados?.importancia || !Array.isArray(dadosProcessados.importancia) || 
        dadosProcessados.importancia.length === 0) {
      console.log('❌ Sem dados de importância');
      return null;
    }

    const { importancia, isXGBoost, isRandomForest, isRegression } = dadosProcessados;
    
    // Limitar a top 15 variáveis para melhor visualização
    const topVariaveis = importancia.slice(0, 15).reverse();
    
    // Determinar qual métrica usar baseado no modelo
    let chaveDados = 'importancia';
    let titulo = 'Importância das Variáveis';
    let eixoXLabel = 'Importância';
    
    if (isXGBoost) {
      chaveDados = 'gain';
      titulo = 'Importância por Ganho (XGBoost)';
      eixoXLabel = 'Ganho';
    } else if (isRandomForest && isRegression) {
      chaveDados = 'inc_mse';
      titulo = 'Importância por %Aumento MSE (Random Forest)';
      eixoXLabel = '% Aumento MSE';
    } else if (isRandomForest && !isRegression) {
      chaveDados = 'mean_decrease_accuracy';
      titulo = 'Importância por Redução Média da Precisão (Random Forest)';
      eixoXLabel = 'Redução Média Precisão';
    }

    const labels = topVariaveis.map(item => {
      const nome = item.variavel || item.Variavel || item.name || 'Variável';
      return nome.length > 25 ? `${nome.substring(0, 25)}...` : nome;
    });
    
    const valores = topVariaveis.map(item => extrairValorImportancia(item, chaveDados));

    console.log('📊 Labels:', labels);
    console.log('📊 Valores:', valores);

    // Verificar se há valores válidos
    if (valores.length === 0 || valores.every(v => v === 0)) {
      console.log('❌ Valores de importância inválidos');
      return null;
    }

    // Calcular cores baseadas nos valores
    const maxVal = Math.max(...valores);
    const coresBackground = valores.map(valor => {
      const intensidade = maxVal > 0 ? valor / maxVal : 0;
      
      if (isXGBoost) {
        return `rgba(245, 158, 11, ${0.6 + intensidade * 0.4})`;
      } else {
        return `rgba(16, 185, 129, ${0.6 + intensidade * 0.4})`;
      }
    });

    const coresBorda = isXGBoost 
      ? 'rgb(194, 120, 9)' 
      : 'rgb(14, 159, 110)';

    return {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: eixoXLabel,
          data: valores,
          backgroundColor: coresBackground,
          borderColor: coresBorda,
          borderWidth: 1,
          borderRadius: 6,
          hoverBackgroundColor: isXGBoost 
            ? 'rgba(245, 158, 11, 0.9)' 
            : 'rgba(16, 185, 129, 0.9)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          title: {
            display: true,
            text: titulo,
            font: { 
              size: 16, 
              weight: 'bold',
              family: "'Inter', 'Segoe UI', sans-serif"
            },
            padding: { top: 10, bottom: 20 }
          },
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            titleColor: '#f9fafb',
            bodyColor: '#f3f4f6',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: (context) => {
                return topVariaveis[context[0].dataIndex]?.variavel || 'Variável';
              },
              label: (context) => {
                const item = topVariaveis[context.dataIndex];
                const valor = context.parsed.x;
                
                return `${eixoXLabel}: ${valor.toFixed(6)}`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: eixoXLabel,
              font: { size: 12, weight: '600' }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: { size: 11 },
              color: '#6b7280'
            }
          },
          y: {
            grid: {
              color: 'rgba(0, 0, 0, 0.03)'
            },
            ticks: {
              font: { size: 11 },
              color: '#374151'
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    };
  };

  // 2. Gráfico de Métricas de Performance
  const dadosMetricas = () => {
    console.log('📊 Gerando dadosMetricas:', dadosProcessados?.qualidade);
    
    if (!dadosProcessados?.qualidade) {
      console.log('❌ Sem dados de qualidade');
      return null;
    }

    const { qualidade, isRegression } = dadosProcessados;
    
    const metricas = [];
    const cores = [
      'rgba(239, 68, 68, 0.8)',   // Vermelho
      'rgba(34, 197, 94, 0.8)',   // Verde
      'rgba(59, 130, 246, 0.8)',  // Azul
      'rgba(168, 85, 247, 0.8)',  // Roxo
      'rgba(245, 158, 11, 0.8)',  // Laranja
      'rgba(14, 165, 233, 0.8)'   // Ciano
    ];

    if (isRegression) {
      // Métricas de regressão
      if (qualidade.RMSE !== undefined && qualidade.RMSE !== null && qualidade.RMSE !== 'NA') {
        const rmse = parseFloat(qualidade.RMSE);
        if (!isNaN(rmse)) {
          metricas.push({ 
            label: 'RMSE', 
            valor: rmse, 
            desc: 'Raiz do Erro Quadrático Médio' 
          });
        }
      }
      if (qualidade.R2 !== undefined && qualidade.R2 !== null && qualidade.R2 !== 'NA') {
        const r2 = parseFloat(qualidade.R2);
        if (!isNaN(r2)) {
          metricas.push({ 
            label: 'R²', 
            valor: r2, 
            desc: 'Coeficiente de Determinação' 
          });
        }
      }
      if (qualidade.MAE !== undefined && qualidade.MAE !== null && qualidade.MAE !== 'NA') {
        const mae = parseFloat(qualidade.MAE);
        if (!isNaN(mae)) {
          metricas.push({ 
            label: 'MAE', 
            valor: mae, 
            desc: 'Erro Absoluto Médio' 
          });
        }
      }
      if (qualidade.MSE !== undefined && qualidade.MSE !== null && qualidade.MSE !== 'NA') {
        const mse = parseFloat(qualidade.MSE);
        if (!isNaN(mse)) {
          metricas.push({ 
            label: 'MSE', 
            valor: mse, 
            desc: 'Erro Quadrático Médio' 
          });
        }
      }
    } else {
      // Métricas de classificação
      if (qualidade.Accuracy !== undefined && qualidade.Accuracy !== null && qualidade.Accuracy !== 'NA') {
        const accuracy = parseFloat(qualidade.Accuracy);
        if (!isNaN(accuracy)) {
          metricas.push({ 
            label: 'Acurácia', 
            valor: accuracy, 
            desc: 'Taxa de acerto geral' 
          });
        }
      }
      if (qualidade.Precision !== undefined && qualidade.Precision !== null && qualidade.Precision !== 'NA') {
        const precision = parseFloat(qualidade.Precision);
        if (!isNaN(precision)) {
          metricas.push({ 
            label: 'Precisão', 
            valor: precision, 
            desc: 'VP / (VP + FP)' 
          });
        }
      }
      if (qualidade.Recall !== undefined && qualidade.Recall !== null && qualidade.Recall !== 'NA') {
        const recall = parseFloat(qualidade.Recall);
        if (!isNaN(recall)) {
          metricas.push({ 
            label: 'Revocação', 
            valor: recall, 
            desc: 'VP / (VP + FN)' 
          });
        }
      }
      if (qualidade.F1_Score !== undefined && qualidade.F1_Score !== null && qualidade.F1_Score !== 'NA') {
        const f1 = parseFloat(qualidade.F1_Score);
        if (!isNaN(f1)) {
          metricas.push({ 
            label: 'F1-Score', 
            valor: f1, 
            desc: 'Média harmônica' 
          });
        }
      }
    }

    console.log('📊 Métricas extraídas:', metricas);

    if (metricas.length === 0) {
      console.log('❌ Nenhuma métrica válida encontrada');
      return null;
    }

    // Ordenar métricas por valor (maior primeiro)
    const metricasOrdenadas = [...metricas].sort((a, b) => b.valor - a.valor);

    return {
      type: 'bar',
      data: {
        labels: metricasOrdenadas.map(m => m.label),
        datasets: [{
          label: isRegression ? 'Valor' : 'Score',
          data: metricasOrdenadas.map(m => m.valor),
          backgroundColor: metricasOrdenadas.map((_, i) => cores[i % cores.length]),
          borderColor: metricasOrdenadas.map((_, i) => 
            cores[i % cores.length].replace('0.8', '1')
          ),
          borderWidth: 2,
          borderRadius: 8,
          hoverBackgroundColor: metricasOrdenadas.map((_, i) => 
            cores[i % cores.length].replace('0.8', '0.9')
          )
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: isRegression ? '📈 Métricas de Regressão' : '🎯 Métricas de Classificação',
            font: { 
              size: 16, 
              weight: 'bold',
              family: "'Inter', 'Segoe UI', sans-serif"
            },
            padding: { top: 10, bottom: 20 }
          },
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            titleColor: '#f9fafb',
            bodyColor: '#f3f4f6',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const metrica = metricasOrdenadas[context.dataIndex];
                const valor = context.parsed.y;
                
                let valorFormatado = '';
                if (!isRegression && (metrica.label === 'Acurácia' || metrica.label === 'Precisão' || 
                    metrica.label === 'Revocação' || metrica.label === 'F1-Score')) {
                  valorFormatado = `${(valor * 100).toFixed(2)}%`;
                } else {
                  valorFormatado = valor.toFixed(4);
                }
                
                return [
                  `${metrica.label}: ${valorFormatado}`,
                  metrica.desc ? `(${metrica.desc})` : ''
                ].filter(Boolean);
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: isRegression ? 'Valor' : 'Score',
              font: { size: 12, weight: '600' }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: { size: 11 },
              color: '#6b7280',
              callback: function(value) {
                if (isRegression) {
                  return value.toFixed(3);
                } else {
                  return (value * 100).toFixed(0) + '%';
                }
              }
            }
          },
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.03)'
            },
            ticks: {
              font: { size: 12, weight: '500' },
              color: '#374151'
            }
          }
        },
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        }
      }
    };
  };

  // 3. Gráfico de Predições vs Reais (apenas para regressão)
  const dadosPredicoesReais = () => {
    console.log('📊 Gerando dadosPredicoesReais:', dadosProcessados?.predicoes_amostra?.length);
    
    if (!dadosProcessados?.isRegression || !dadosProcessados?.predicoes_amostra || 
        !Array.isArray(dadosProcessados.predicoes_amostra) || 
        dadosProcessados.predicoes_amostra.length === 0) {
      console.log('❌ Sem dados de predições para regressão');
      return null;
    }

    const { predicoes_amostra } = dadosProcessados;
    
    // Usar todas as predições disponíveis (até 100 para performance)
    const limite = Math.min(100, predicoes_amostra.length);
    const amostra = predicoes_amostra.slice(0, limite);
    
    const pontos = amostra.map(p => {
      const real = parseFloat(p.real);
      const predito = parseFloat(p.predito);
      return {
        x: isNaN(real) ? 0 : real,
        y: isNaN(predito) ? 0 : predito
      };
    });

    console.log('📊 Pontos gerados:', pontos.length);

    // Verificar se há pontos válidos
    if (pontos.length === 0) {
      return null;
    }

    // Calcular linha ideal (y = x)
    const todosValores = [...pontos.map(p => p.x), ...pontos.map(p => p.y)];
    const minVal = Math.min(...todosValores);
    const maxVal = Math.max(...todosValores);
    
    const linhaIdeal = [
      { x: minVal, y: minVal },
      { x: maxVal, y: maxVal }
    ];

    // Calcular R² para a regressão
    const calcularR2 = () => {
      try {
        const mediaY = pontos.reduce((sum, p) => sum + p.y, 0) / pontos.length;
        const ssRes = pontos.reduce((sum, p) => sum + Math.pow(p.y - p.x, 2), 0);
        const ssTot = pontos.reduce((sum, p) => sum + Math.pow(p.y - mediaY, 2), 0);
        return ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
      } catch (error) {
        console.error('Erro ao calcular R²:', error);
        return 0;
      }
    };

    const r2 = calcularR2();

    return {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Predições vs Reais',
            data: pontos,
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            borderColor: 'rgb(59, 130, 246)',
            pointRadius: 4,
            pointHoverRadius: 8,
            pointBorderColor: 'white',
            pointBorderWidth: 1
          },
          {
            label: 'Linha Ideal (y = x)',
            data: linhaIdeal,
            type: 'line',
            borderColor: 'rgba(239, 68, 68, 0.7)',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
            tension: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `📊 Predições vs Valores Reais (R² = ${r2.toFixed(4)})`,
            font: { 
              size: 16, 
              weight: 'bold',
              family: "'Inter', 'Segoe UI', sans-serif"
            },
            padding: { top: 10, bottom: 20 }
          },
          legend: {
            position: 'top',
            labels: {
              padding: 15,
              usePointStyle: true,
              font: { size: 12 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            titleColor: '#f9fafb',
            bodyColor: '#f3f4f6',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const ponto = context.raw;
                const erro = ponto.x - ponto.y;
                const erroPercentual = ponto.x !== 0 ? Math.abs(erro / ponto.x) * 100 : 0;
                
                return [
                  `Real: ${ponto.x.toFixed(4)}`,
                  `Previsto: ${ponto.y.toFixed(4)}`,
                  `Erro: ${erro.toFixed(4)}`,
                  erroPercentual > 0 ? `(${erroPercentual.toFixed(1)}%)` : ''
                ].filter(Boolean);
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Valor Real',
              font: { size: 12, weight: '600' }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: { size: 11 },
              color: '#6b7280'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Valor Previsto',
              font: { size: 12, weight: '600' }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: { size: 11 },
              color: '#6b7280'
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'point'
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    };
  };

  // 4. Gráfico de Erros (apenas para regressão)
  const dadosErros = () => {
    console.log('📊 Gerando dadosErros');
    
    if (!dadosProcessados?.isRegression || !dadosProcessados?.predicoes_amostra || 
        !Array.isArray(dadosProcessados.predicoes_amostra) || 
        dadosProcessados.predicoes_amostra.length === 0) {
      console.log('❌ Sem dados para gráfico de erros');
      return null;
    }

    const { predicoes_amostra } = dadosProcessados;
    
    const limite = Math.min(30, predicoes_amostra.length);
    const amostra = predicoes_amostra.slice(0, limite);
    
    const erros = amostra.map(p => {
      const real = parseFloat(p.real) || 0;
      const predito = parseFloat(p.predito) || 0;
      return real - predito;
    }).filter(e => !isNaN(e));
    
    // Verificar se há erros válidos
    if (erros.length === 0) {
      console.log('❌ Nenhum erro válido calculado');
      return null;
    }

    const labels = amostra.map((p, i) => `Obs ${i + 1}`);

    // Calcular estatísticas
    const mediaErro = erros.reduce((a, b) => a + b, 0) / erros.length;
    const mae = erros.reduce((a, b) => a + Math.abs(b), 0) / erros.length;

    return {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Erro (Real - Previsto)',
            data: erros,
            backgroundColor: erros.map(e => 
              e > 0 
                ? 'rgba(239, 68, 68, 0.7)' 
                : 'rgba(34, 197, 94, 0.7)'
            ),
            borderColor: erros.map(e => 
              e > 0 
                ? 'rgb(185, 28, 28)' 
                : 'rgb(21, 128, 61)'
            ),
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: '📉 Distribuição dos Erros',
            font: { 
              size: 16, 
              weight: 'bold',
              family: "'Inter', 'Segoe UI', sans-serif"
            },
            padding: { top: 10, bottom: 20 }
          },
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            titleColor: '#f9fafb',
            bodyColor: '#f3f4f6',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const erro = context.parsed.y;
                const real = parseFloat(amostra[context.dataIndex]?.real) || 0;
                const erroPercentual = real !== 0 ? Math.abs(erro / real) * 100 : 0;
                
                return [
                  `Erro: ${erro.toFixed(4)}`,
                  erroPercentual > 0 ? `Erro %: ${erroPercentual.toFixed(1)}%` : '',
                  erro > 0 ? 'Subestimado' : 'Superestimado'
                ].filter(Boolean);
              }
            }
          }
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'Erro (Real - Previsto)',
              font: { size: 12, weight: '600' }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: { size: 11 },
              color: '#6b7280'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: { size: 10 },
              color: '#9ca3af',
              maxRotation: 45
            }
          }
        },
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        }
      }
    };
  };

  // 5. Gráfico de Matriz de Confusão (apenas para classificação)
  const dadosMatrizConfusao = () => {
    console.log('📊 Gerando dadosMatrizConfusao:', dadosProcessados?.matrizConfusao);
    
    const { isRegression, matrizConfusao } = dadosProcessados || {};
    
    if (isRegression || !matrizConfusao || typeof matrizConfusao !== 'object') {
      console.log('❌ Sem matriz de confusão disponível');
      return null;
    }

    // Verificar se é uma matriz válida
    let classes = [];
    let dadosMatriz = [];
    
    if (Array.isArray(matrizConfusao)) {
      // Se for array, assumir que é matriz 2D
      dadosMatriz = matrizConfusao;
      classes = matrizConfusao.map((_, i) => `Classe ${i}`);
    } else if (typeof matrizConfusao === 'object') {
      // Se for objeto, extrair classes
      classes = Object.keys(matrizConfusao);
      if (classes.length === 0) return null;
      
      // Construir matriz 2D
      classes.forEach((predCls, rowIndex) => {
        const linha = [];
        classes.forEach((realCls, colIndex) => {
          const valor = matrizConfusao[predCls]?.[realCls];
          linha.push(typeof valor === 'number' ? valor : 0);
        });
        dadosMatriz.push(linha);
      });
    }

    if (dadosMatriz.length === 0) return null;

    // Preparar dados para heatmap-like visualization
    const total = dadosMatriz.flat().reduce((a, b) => a + b, 0);
    if (total === 0) return null;

    return {
      type: 'bar',
      data: {
        labels: classes,
        datasets: classes.map((realCls, colIndex) => ({
          label: `Real: ${realCls}`,
          data: dadosMatriz.map(row => row[colIndex] || 0),
          backgroundColor: `rgba(${59 + colIndex * 40}, ${130 - colIndex * 20}, ${246 - colIndex * 40}, 0.7)`,
          borderColor: `rgb(${59 + colIndex * 40}, ${130 - colIndex * 20}, ${246 - colIndex * 40})`,
          borderWidth: 1
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: '🧩 Matriz de Confusão',
            font: { 
              size: 16, 
              weight: 'bold',
              family: "'Inter', 'Segoe UI', sans-serif"
            },
            padding: { top: 10, bottom: 20 }
          },
          legend: {
            position: 'top',
            labels: {
              padding: 15,
              font: { size: 11 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            titleColor: '#f9fafb',
            bodyColor: '#f3f4f6',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const valor = context.parsed.y;
                const percentual = total > 0 ? ((valor / total) * 100).toFixed(1) : 0;
                const prevCls = classes[context.dataIndex];
                const realCls = context.dataset.label.replace('Real: ', '');
                
                return [
                  `Previsto: ${prevCls}`,
                  `Real: ${realCls}`,
                  `Contagem: ${valor}`,
                  `Percentual: ${percentual}%`,
                  prevCls === realCls ? '✅ Acerto' : '❌ Erro'
                ];
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
              font: { size: 12, weight: '600' }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: { size: 11 },
              color: '#6b7280'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Previsto',
              font: { size: 12, weight: '600' }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.03)'
            },
            ticks: {
              font: { size: 11 },
              color: '#374151'
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    };
  };

  // 6. Gráfico de Métricas por Classe (apenas classificação)
  const dadosMetricasPorClasse = () => {
    console.log('📊 Gerando dadosMetricasPorClasse:', dadosProcessados?.metricsByClass);
    
    const { isRegression, metricsByClass } = dadosProcessados || {};
    
    if (isRegression || !metricsByClass || !Array.isArray(metricsByClass) || metricsByClass.length === 0) {
      console.log('❌ Sem métricas por classe disponíveis');
      return null;
    }

    // Preparar dados para gráfico
    const classes = metricsByClass.map(cls => cls.Classe || 'Classe');
    const precisao = metricsByClass.map(cls => {
      const val = cls.Precision || cls.precision || 0;
      return parseFloat(val) || 0;
    });
    const recall = metricsByClass.map(cls => {
      const val = cls.Recall || cls.recall || 0;
      return parseFloat(val) || 0;
    });
    const f1Score = metricsByClass.map(cls => {
      const val = cls.F1_Score || cls.f1_score || 0;
      return parseFloat(val) || 0;
    });

    return {
      type: 'bar',
      data: {
        labels: classes,
        datasets: [
          {
            label: 'Precisão',
            data: precisao,
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
            borderRadius: 4,
            order: 1
          },
          {
            label: 'Revocação',
            data: recall,
            backgroundColor: 'rgba(245, 158, 11, 0.7)',
            borderColor: 'rgb(245, 158, 11)',
            borderWidth: 1,
            borderRadius: 4,
            order: 2
          },
          {
            label: 'F1-Score',
            data: f1Score,
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1,
            borderRadius: 4,
            order: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: '📊 Métricas por Classe',
            font: { 
              size: 16, 
              weight: 'bold',
              family: "'Inter', 'Segoe UI', sans-serif"
            },
            padding: { top: 10, bottom: 20 }
          },
          legend: {
            position: 'top',
            labels: {
              padding: 15,
              usePointStyle: true,
              font: { size: 12 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            titleColor: '#f9fafb',
            bodyColor: '#f3f4f6',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const classe = classes[context.dataIndex];
                const valor = context.parsed.y;
                const metrica = context.dataset.label;
                
                return [
                  `${classe}: ${metrica}`,
                  `Valor: ${(valor * 100).toFixed(2)}%`
                ];
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 1,
            title: {
              display: true,
              text: 'Score',
              font: { size: 12, weight: '600' }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: { size: 11 },
              color: '#6b7280',
              callback: function(value) {
                return (value * 100).toFixed(0) + '%';
              }
            }
          },
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.03)'
            },
            ticks: {
              font: { size: 11 },
              color: '#374151'
            }
          }
        },
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        }
      }
    };
  };

  // Renderizar gráfico atual
  const renderizarGrafico = () => {
    if (carregando) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Carregando dados para gráficos...</p>
          </div>
        </div>
      );
    }

    if (!dadosProcessados) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-3xl mb-2">📊</div>
            <p>Nenhum dado disponível para gráficos</p>
            <p className="text-sm mt-2">Execute o modelo primeiro para visualizar os gráficos</p>
          </div>
        </div>
      );
    }

    const graficos = {
      importancia: dadosImportancia(),
      metricas: dadosMetricas(),
      predicoes: dadosPredicoesReais(),
      erros: dadosErros(),
      matriz: dadosMatrizConfusao(),
      metricasPorClasse: dadosMetricasPorClasse()
    };

    console.log('📊 Gráficos disponíveis:', Object.keys(graficos).filter(k => graficos[k]));

    const graficoAtual = graficos[graficoAtivo];

    if (!graficoAtual) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-3xl mb-2">📊</div>
            <p>Dados insuficientes para gerar este gráfico</p>
            <p className="text-sm mt-2">
              {graficoAtivo === 'predicoes' || graficoAtivo === 'erros'
                ? 'Este gráfico está disponível apenas para modelos de regressão' 
                : graficoAtivo === 'metricasPorClasse' || graficoAtivo === 'matriz'
                ? 'Este gráfico está disponível apenas para modelos de classificação'
                : 'Verifique se o modelo foi treinado com sucesso'}
            </p>
          </div>
        </div>
      );
    }

    // Renderizar gráfico baseado no tipo
    switch (graficoAtual.type) {
      case 'bar':
        return <Bar ref={chartRef} data={graficoAtual.data} options={graficoAtual.options} />;
      case 'line':
        return <Line ref={chartRef} data={graficoAtual.data} options={graficoAtual.options} />;
      case 'scatter':
        return <Scatter ref={chartRef} data={graficoAtual.data} options={graficoAtual.options} />;
      default:
        return <Bar ref={chartRef} data={graficoAtual.data} options={graficoAtual.options} />;
    }
  };

  // Determinar quais gráficos estão disponíveis
  const graficosDisponiveis = [
    { id: 'importancia', label: '📊 Importância', disponivel: !!dadosImportancia() },
    { id: 'metricas', label: '📈 Métricas', disponivel: !!dadosMetricas() },
    { id: 'predicoes', label: '🎯 Predições', disponivel: !!dadosPredicoesReais() },
    { id: 'erros', label: '📉 Erros', disponivel: !!dadosErros() },
    { id: 'matriz', label: '🧩 Matriz', disponivel: !!dadosMatrizConfusao() },
    { id: 'metricasPorClasse', label: '🏷️ Por Classe', disponivel: !!dadosMetricasPorClasse() }
  ].filter(g => g.disponivel);

  console.log('📊 Gráficos disponíveis:', graficosDisponiveis);

  // Função para exportar gráfico
  const exportarGrafico = () => {
    if (chartRef.current) {
      const link = document.createElement('a');
      link.download = `grafico_ml_${graficoAtivo}_${tipoModelo}_${Date.now()}.png`;
      link.href = chartRef.current.toBase64Image();
      link.click();
    }
  };

  if (carregando) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando gráficos...</p>
      </div>
    );
  }

  if (!dadosProcessados || graficosDisponiveis.length === 0) {
    console.log('❌ Nenhum gráfico disponível:', {
      dadosProcessados: !!dadosProcessados,
      graficosDisponiveis: graficosDisponiveis.length
    });
    
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          Dados insuficientes para gráficos
        </h3>
        <p className="text-gray-500">
          Execute o modelo com dados válidos para visualizar os gráficos
        </p>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
          <p className="text-sm text-gray-600">Dados recebidos:</p>
          <pre className="text-xs mt-2 overflow-auto max-h-40">
            {JSON.stringify(dados?.resultado || {}, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  const { isXGBoost, isRandomForest, isRegression, parametros } = dadosProcessados;

  return (
    <div className="space-y-6">
      {/* Navegação entre gráficos */}
      {graficosDisponiveis.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {graficosDisponiveis.map((grafico) => (
            <button
              key={grafico.id}
              onClick={() => setGraficoAtivo(grafico.id)}
              className={`px-4 py-3 rounded-lg text-left transition-all flex-1 min-w-[140px] ${
                graficoAtivo === grafico.id
                  ? `${isXGBoost ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 'bg-gradient-to-r from-green-500 to-emerald-600'} text-white shadow-lg transform scale-105`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="font-medium">{grafico.label}</div>
              <div className="text-xs opacity-80">
                {grafico.id === 'importancia' ? 'Variáveis' :
                 grafico.id === 'metricas' ? 'Performance' :
                 grafico.id === 'predicoes' ? 'Real vs Previsto' :
                 grafico.id === 'erros' ? 'Distribuição' :
                 grafico.id === 'matriz' ? 'Classificação' :
                 'Métricas por Classe'}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Gráfico Ativo */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="h-[500px]">
          {renderizarGrafico()}
        </div>
      </div>

      {/* Controles e informações */}
      {graficosDisponiveis.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Controles do gráfico */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-3">🛠️ Controles</div>
            <div className="space-y-3">
              <button
                onClick={exportarGrafico}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                📥 Exportar como PNG
              </button>
              <div className="text-xs text-gray-500">
                💡 Passe o mouse sobre os pontos/barras para ver detalhes
              </div>
            </div>
          </div>
          
          {/* Interpretação */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-sm font-medium text-blue-700 mb-2">💡 Interpretação</div>
            <div className="text-sm text-blue-600 space-y-2">
              {graficoAtivo === 'importancia' && (
                <>
                  <p>Mostra as variáveis mais importantes no modelo.</p>
                  <p><strong>XGBoost:</strong> Ganho mede melhoria na pureza das folhas.</p>
                  <p><strong>Random Forest:</strong> Mede impacto na performance ao permutar variáveis.</p>
                </>
              )}
              {graficoAtivo === 'metricas' && (
                <>
                  <p>Avaliação da performance do modelo.</p>
                  {isRegression ? (
                    <p><strong>Busque:</strong> R² alto (próximo de 1), RMSE/MAE baixos.</p>
                  ) : (
                    <p><strong>Busque:</strong> Acurácia, Precisão, Revocação e F1-Score altos (próximos de 1).</p>
                  )}
                </>
              )}
              {graficoAtivo === 'predicoes' && (
                <>
                  <p>Compara valores previstos com valores reais.</p>
                  <p>Pontos próximos da linha y=x indicam boas previsões.</p>
                  <p>R² próximo de 1 mostra bom ajuste.</p>
                </>
              )}
              {graficoAtivo === 'erros' && (
                <>
                  <p>Distribuição dos erros de predição.</p>
                  <p>Erros devem distribuir-se simetricamente em torno de zero.</p>
                  <p>MAE (Erro Absoluto Médio) mostra magnitude média dos erros.</p>
                </>
              )}
              {graficoAtivo === 'matriz' && (
                <>
                  <p>Avalia acertos e erros da classificação.</p>
                  <p><strong>Diagonal (cores diferentes):</strong> Acertos corretos para cada classe.</p>
                  <p><strong>Fora da diagonal:</strong> Erros de classificação entre classes.</p>
                </>
              )}
              {graficoAtivo === 'metricasPorClasse' && (
                <>
                  <p>Performance do modelo para cada classe individual.</p>
                  <p><strong>Precisão:</strong> Quão precisas são as previsões positivas.</p>
                  <p><strong>Revocação:</strong> Quão bem o modelo encontra todas as positivas.</p>
                  <p><strong>F1-Score:</strong> Média harmônica de Precisão e Revocação.</p>
                </>
              )}
            </div>
          </div>
          
          {/* Dados do modelo */}
          <div className={`p-4 rounded-lg border ${isXGBoost ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
            <div className={`text-sm font-medium mb-2 ${isXGBoost ? 'text-orange-700' : 'text-green-700'}`}>📊 Dados do Modelo</div>
            <div className={`text-sm space-y-1 ${isXGBoost ? 'text-orange-600' : 'text-green-600'}`}>
              <div className="flex justify-between">
                <span>Modelo:</span>
                <span className="font-medium">{isXGBoost ? 'XGBoost' : 'Random Forest'}</span>
              </div>
              <div className="flex justify-between">
                <span>Tipo:</span>
                <span className="font-medium">{isRegression ? 'Regressão' : 'Classificação'}</span>
              </div>
              {parametros?.n_estimators && (
                <div className="flex justify-between">
                  <span>{isXGBoost ? 'Árvores:' : 'Estimadores:'}</span>
                  <span className="font-medium">{parametros.n_estimators}</span>
                </div>
              )}
              {parametros?.n_observacoes && (
                <div className="flex justify-between">
                  <span>Observações:</span>
                  <span className="font-medium">{parametros.n_observacoes}</span>
                </div>
              )}
              {parametros?.n_features && (
                <div className="flex justify-between">
                  <span>Variáveis:</span>
                  <span className="font-medium">{parametros.n_features}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente principal ResultadoML
export default function ResultadoML({ resultado, tipoModelo, onVoltar, onNovoModelo }) {
  const [detalheAtivo, setDetalheAtivo] = useState('metricas');

  // Função auxiliar para verificar se valor é válido
  const valorValido = (valor) => {
    return valor !== undefined && valor !== null && valor !== 'NA' && valor !== 'NaN';
  };

  // Função auxiliar para formatar valores
  const formatarValor = (valor, formato = 'numero') => {
    if (!valorValido(valor)) return 'N/A';
    
    if (formato === 'percentual') {
      if (typeof valor === 'string' && valor.includes('%')) {
        return valor;
      }
      const numValor = typeof valor === 'string' ? parseFloat(valor) : valor;
      return `${(numValor * 100).toFixed(2)}%`;
    }
    
    if (formato === 'numero') {
      const numValor = typeof valor === 'string' ? parseFloat(valor) : valor;
      return Number.isFinite(numValor) ? numValor.toFixed(4) : 'N/A';
    }
    
    return valor;
  };

  // Preparar dados para gráficos
  const prepararDadosParaGraficos = () => {
    if (!resultado || !resultado.success) {
      console.log('⚠️  ResultadoML: Sem dados válidos para gráficos');
      return null;
    }

    console.log('📊 ResultadoML: Preparando dados para gráficos:', {
      resultado,
      tipoModelo,
      possuiMetricasRF: !!resultado.metricas_rf,
      possuiMetricasXGB: !!resultado.metricas_xgboost,
      qualidade: resultado.qualidade
    });

    return {
      resultado: resultado,
      parametros: resultado.parametros || {},
      tipoModelo: tipoModelo,
      nome: `${tipoModelo === 'xgboost' ? '⚡ XGBoost' : '🌲 Random Forest'} ${
        (resultado.parametros?.is_regression || false) ? '(Regressão)' : '(Classificação)'
      }`,
      timestamp: new Date().toISOString()
    };
  };

  const dadosGraficos = prepararDadosParaGraficos();
  const abasDisponiveis = ['metricas', 'importancia', 'detalhes'];
  if (dadosGraficos) {
    abasDisponiveis.push('graficos');
  }

  if (!resultado || !resultado.success) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {resultado?.error ? 'Erro no Modelo' : 'Nenhum resultado disponível'}
          </h3>
          <p className="text-gray-500 mb-6">
            {resultado?.error || 'Execute um modelo primeiro para ver os resultados'}
          </p>
          <Button onClick={onVoltar}>
            ⬅️ Voltar para Configuração
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Extrair dados baseado na estrutura dos scripts R
  const { 
    qualidade, 
    parametros, 
    predicoes_amostra, 
    resumo 
  } = resultado;

  // Extrair métricas específicas de cada modelo
  const isXGBoost = tipoModelo === 'xgboost';
  const isRandomForest = tipoModelo === 'random_forest';
  const isRegression = parametros?.is_regression || false;

  // Importância das variáveis (estrutura diferente para cada modelo)
  const importanciaData = isXGBoost 
    ? resultado.metricas_xgboost?.importancia 
    : isRandomForest 
      ? resultado.metricas_rf?.importancia 
      : null;

  // Estatísticas específicas
  const estatisticas = isXGBoost
    ? resultado.metricas_xgboost?.resumo_importancia
    : isRandomForest
      ? resultado.metricas_rf?.estatisticas
      : null;

  // Função para formatar métricas baseadas no tipo de modelo
  const getMetricasFormatadas = () => {
    if (!qualidade) return [];
    
    const metricas = [];
    
    // Métricas de regressão
    if (isRegression) {
      if (valorValido(qualidade.RMSE)) {
        metricas.push({
          titulo: "RMSE",
          valor: formatarValor(qualidade.RMSE),
          desc: "Raiz do Erro Quadrático Médio",
          cor: "bg-red-100 text-red-800"
        });
      }
      if (valorValido(qualidade.R2)) {
        metricas.push({
          titulo: "R²",
          valor: formatarValor(qualidade.R2),
          desc: "Coeficiente de Determinação",
          cor: "bg-green-100 text-green-800"
        });
      }
      if (valorValido(qualidade.MAE)) {
        metricas.push({
          titulo: "MAE",
          valor: formatarValor(qualidade.MAE),
          desc: "Erro Absoluto Médio",
          cor: "bg-blue-100 text-blue-800"
        });
      }
      if (valorValido(qualidade.MSE)) {
        metricas.push({
          titulo: "MSE",
          valor: formatarValor(qualidade.MSE),
          desc: "Erro Quadrático Médio",
          cor: "bg-purple-100 text-purple-800"
        });
      }
      if (valorValido(qualidade.MAPE)) {
        metricas.push({
          titulo: "MAPE",
          valor: formatarValor(qualidade.MAPE, 'percentual'),
          desc: "Erro Percentual Absoluto Médio",
          cor: "bg-orange-100 text-orange-800"
        });
      }
      if (valorValido(qualidade.R2_adj)) {
        metricas.push({
          titulo: "R² Ajustado",
          valor: formatarValor(qualidade.R2_adj),
          desc: "R² ajustado por graus de liberdade",
          cor: "bg-teal-100 text-teal-800"
        });
      }
      
      // Adicionar métricas adicionais que podem vir em diferentes formatos
      if (valorValido(qualidade.OOB)) {
        metricas.push({
          titulo: "Erro OOB",
          valor: formatarValor(qualidade.OOB, 'percentual'),
          desc: "Erro Out-of-Bag (apenas Random Forest)",
          cor: "bg-indigo-100 text-indigo-800"
        });
      }
    } else {
      // Métricas de classificação
      if (valorValido(qualidade.Accuracy)) {
        metricas.push({
          titulo: "Acurácia",
          valor: formatarValor(qualidade.Accuracy, 'percentual'),
          desc: "Taxa de acerto geral",
          cor: "bg-green-100 text-green-800"
        });
      }
      if (valorValido(qualidade.Precision)) {
        metricas.push({
          titulo: "Precisão",
          valor: formatarValor(qualidade.Precision, 'percentual'),
          desc: "Verdadeiros Positivos / (Verdadeiros Positivos + Falsos Positivos)",
          cor: "bg-blue-100 text-blue-800"
        });
      }
      if (valorValido(qualidade.Recall)) {
        metricas.push({
          titulo: "Revocação",
          valor: formatarValor(qualidade.Recall, 'percentual'),
          desc: "Verdadeiros Positivos / (Verdadeiros Positivos + Falsos Negativos)",
          cor: "bg-orange-100 text-orange-800"
        });
      }
      if (valorValido(qualidade.F1_Score)) {
        metricas.push({
          titulo: "Pontuação F1",
          valor: formatarValor(qualidade.F1_Score, 'percentual'),
          desc: "Média harmônica de Precisão e Revocação",
          cor: "bg-purple-100 text-purple-800"
        });
      }
    }

    return metricas;
  };

  // Renderizar importância das variáveis
  const renderImportanciaVariaveis = () => {
    if (!importanciaData || !Array.isArray(importanciaData)) {
      return (
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">📊</div>
          Importância das variáveis não disponível
        </div>
      );
    }

    // Determinar qual métrica usar baseado no modelo
    let chaveDados = 'importancia';
    let rotuloDados = 'Importância';
    
    if (isXGBoost) {
      chaveDados = 'ganho';
      rotuloDados = 'Ganho';
    } else if (isRandomForest && isRegression) {
      chaveDados = 'inc_mse';
      rotuloDados = '%AumentoMSE';
    } else if (isRandomForest && !isRegression) {
      chaveDados = 'mean_decrease_accuracy';
      rotuloDados = 'ReduçãoMédiaPrecisão';
    }

    // Preparar dados para exibição
    const tabelaData = importanciaData.slice(0, 10).map((item, index) => ({
      nome: item.variavel,
      valor: parseFloat(item[chaveDados]) || 0,
      classificacao: index + 1,
      percentual: item[`${chaveDados}_percentual`] || item.ganho_percentual || item.inc_mse_percentual || item.mda_percentual
    }));

    // Calcular total para percentuais
    const totalValor = tabelaData.reduce((soma, item) => soma + item.valor, 0);

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-gray-700">
            {isXGBoost ? '⚡ Importância por Ganho' : 
             isRandomForest && isRegression ? '🌲 Importância por %AumentoMSE' :
             '🌲 Importância por Redução Média da Precisão'}
          </h4>
          <Badge variant="info">
            Top {tabelaData.length} variáveis
          </Badge>
        </div>

        {/* Tabela detalhada */}
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Classificação</th>
                <th className="px-4 py-2 text-left">Variável</th>
                <th className="px-4 py-2 text-left">{rotuloDados}</th>
                <th className="px-4 py-2 text-left">% Total</th>
                {isXGBoost && <th className="px-4 py-2 text-left">Cobertura</th>}
              </tr>
            </thead>
            <tbody>
              {tabelaData.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">#{item.classificacao}</td>
                  <td className="px-4 py-2 font-medium">{item.nome}</td>
                  <td className="px-4 py-2">{item.valor.toFixed(6)}</td>
                  <td className="px-4 py-2">
                    {item.percentual || (totalValor > 0 ? ((item.valor/totalValor)*100).toFixed(1) : 0)}%
                  </td>
                  {isXGBoost && importanciaData[index]?.cobertura_percentual && (
                    <td className="px-4 py-2">
                      {importanciaData[index].cobertura_percentual}%
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Renderizar detalhes específicos do modelo
  const renderDetalhesEspecificos = () => {
    // Função auxiliar para formatar valor OOB
    const formatarOOB = () => {
      if (estatisticas?.oob_error !== undefined && estatisticas.oob_error !== null && estatisticas.oob_error !== 'NA') {
        const oobError = typeof estatisticas.oob_error === 'string' 
          ? parseFloat(estatisticas.oob_error) 
          : estatisticas.oob_error;
        
        if (Number.isFinite(oobError)) {
          return isRegression 
            ? oobError.toFixed(4)
            : `${(oobError * 100).toFixed(2)}%`;
        }
      }
      return 'N/A';
    };

    if (isRandomForest) {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-700 font-medium">🌳 Árvores</div>
              <div className="text-2xl font-bold text-blue-800">{parametros?.n_estimators || 100}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-700 font-medium">🔧 Variáveis por Divisão</div>
              <div className="text-2xl font-bold text-green-800">{parametros?.mtry || 'sqrt'}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-700 font-medium">🍃 Tamanho do Nó</div>
              <div className="text-2xl font-bold text-purple-800">{parametros?.nodesize || 1}</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-orange-700 font-medium">Erro OOB</div>
              <div className="text-2xl font-bold text-orange-800">
                {formatarOOB()}
              </div>
            </div>
          </div>

          {/* Informações específicas do RF */}
          {estatisticas && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3">📈 Estatísticas do Random Forest</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Número de árvores:</span>
                  <div className="font-medium">{estatisticas.n_trees || parametros?.n_estimators || 100}</div>
                </div>
                {(estatisticas.oob_error !== undefined && estatisticas.oob_error !== null && estatisticas.oob_error !== 'NA') && (
                  <div>
                    <span className="text-gray-600">Taxa de Erro OOB:</span>
                    <div className="font-medium">
                      {isRegression 
                        ? `${parseFloat(estatisticas.oob_error).toFixed(4)}`
                        : `${(parseFloat(estatisticas.oob_error) * 100).toFixed(2)}%`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    } else if (isXGBoost) {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-orange-700 font-medium">⚡ Árvores</div>
              <div className="text-2xl font-bold text-orange-800">{parametros?.n_estimators || 100}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-red-700 font-medium">📏 Profundidade Máxima</div>
              <div className="text-2xl font-bold text-red-800">{parametros?.max_depth || 6}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-700 font-medium">📈 Taxa de Aprendizado</div>
              <div className="text-2xl font-bold text-blue-800">{parametros?.learning_rate || 0.1}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-700 font-medium">🎯 Função de Perda</div>
              <div className="text-lg font-bold text-green-800 truncate">
                {parametros?.objective || 'reg:squarederror'}
              </div>
            </div>
          </div>

          {/* Estatísticas XGBoost */}
          {estatisticas && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3">⚡ Estatísticas XGBoost</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Variável mais importante:</span>
                  <div className="font-medium">{estatisticas.variavel_mais_importante || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-gray-600">Ganho Total:</span>
                  <div className="font-medium">{estatisticas.total_ganho?.toFixed(4) || 'N/A'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  // Renderizar matriz de confusão se disponível
  const renderMatrizConfusao = () => {
    if (!qualidade?.ConfusionMatrix || typeof qualidade.ConfusionMatrix === 'string') {
      return null;
    }

    const matriz = qualidade.ConfusionMatrix;
    const classes = Object.keys(matriz);

    return (
      <div className="mt-6">
        <h4 className="font-semibold text-gray-700 mb-3">🎯 Matriz de Confusão</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 border"></th>
                {classes.map(cls => (
                  <th key={cls} className="px-4 py-2 border text-center font-medium">
                    Real: {cls}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classes.map((predCls, rowIndex) => (
                <tr key={predCls}>
                  <td className="px-4 py-2 border bg-gray-50 font-medium">
                    Previsto: {predCls}
                  </td>
                  {classes.map(realCls => (
                    <td 
                      key={realCls} 
                      className={`px-4 py-2 border text-center ${
                        predCls === realCls 
                          ? 'bg-green-50 text-green-700 font-bold' 
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {matriz[predCls]?.[realCls] || 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const metricas = getMetricasFormatadas();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={onVoltar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              ⬅️
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {isRandomForest ? '🌲 Random Forest' : '⚡ XGBoost'}
                {isRegression ? ' (Regressão)' : ' (Classificação)'}
              </h1>
              <div className="flex flex-wrap gap-2 mt-1">
                {qualidade.RMSE !== undefined && qualidade.RMSE !== 'NA' && (
                  <Badge variant="outline">RMSE = {formatarValor(qualidade.RMSE)}</Badge>
                )}
                {qualidade.R2 !== undefined && qualidade.R2 !== 'NA' && (
                  <Badge variant="outline">R² = {formatarValor(qualidade.R2)}</Badge>
                )}
                {isRandomForest && estatisticas?.oob_error !== undefined && estatisticas.oob_error !== 'NA' && (
                  <Badge variant="outline">
                    OOB = {isRegression 
                      ? formatarValor(estatisticas.oob_error) 
                      : formatarValor(estatisticas.oob_error, 'percentual')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={onVoltar}
            variant="outline"
            className="flex items-center gap-2"
          >
            ↩️ Nova Configuração
          </Button>
          <Button
            onClick={onNovoModelo}
            className="flex items-center gap-2"
          >
            🆕 Novo Modelo
          </Button>
        </div>
      </div>

      {/* Navegação entre detalhes */}
      <div className="flex border-b border-gray-200">
        {abasDisponiveis.map((aba) => (
          <button
            key={aba}
            onClick={() => setDetalheAtivo(aba)}
            className={`px-6 py-3 font-medium transition-colors ${
              detalheAtivo === aba
                ? `border-b-2 ${isXGBoost ? 'border-orange-500 text-orange-600' : 'border-green-500 text-green-600'}`
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {aba === 'metricas' && '📊 Métricas'}
            {aba === 'importancia' && '🎯 Importância'}
            {aba === 'detalhes' && '⚙️ Detalhes'}
            {aba === 'graficos' && '📈 Gráficos'}
          </button>
        ))}
      </div>

      {/* Conteúdo das abas */}
      <div className="space-y-6">
        {/* Métricas */}
        {detalheAtivo === 'metricas' && (
          <Card>
            <CardHeader>
              <CardTitle>
                {isRegression ? '📈 Métricas de Regressão' : '🎯 Métricas de Classificação'}
              </CardTitle>
              <CardDescription>
                {isRandomForest 
                  ? 'Estatísticas do Random Forest' 
                  : 'Métricas de performance do XGBoost'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metricas.map((metrica, index) => (
                  metrica.valor && metrica.valor !== 'N/A' && (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg ${metrica.cor}`}
                    >
                      <div className="text-sm font-medium opacity-80">{metrica.titulo}</div>
                      <div className="text-2xl font-bold mt-2">{metrica.valor}</div>
                      <div className="text-xs mt-1 opacity-70">{metrica.desc}</div>
                    </motion.div>
                  )
                ))}
              </div>

              {renderMatrizConfusao()}

              {/* Métricas por classe se disponível */}
              {qualidade?.MetricsByClass && !qualidade.MetricsByClass.Nota && Array.isArray(qualidade.MetricsByClass) && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-700 mb-3">📋 Métricas por Classe</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left">Classe</th>
                          <th className="px-4 py-2 text-left">Precisão</th>
                          <th className="px-4 py-2 text-left">Revocação</th>
                          <th className="px-4 py-2 text-left">Pontuação F1</th>
                          <th className="px-4 py-2 text-left">Suporte</th>
                        </tr>
                      </thead>
                      <tbody>
                        {qualidade.MetricsByClass.map((cls, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium">{cls.Classe}</td>
                            <td className="px-4 py-2">{cls.Precision}</td>
                            <td className="px-4 py-2">{cls.Recall}</td>
                            <td className="px-4 py-2">{cls.F1_Score}</td>
                            <td className="px-4 py-2">{cls.Support}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Importância das Variáveis */}
        {detalheAtivo === 'importancia' && (
          <Card>
            <CardHeader>
              <CardTitle>
                {isXGBoost 
                  ? '⚡ Importância por Ganho' 
                  : isRegression 
                    ? '🌲 Importância por %AumentoMSE' 
                    : '🌲 Importância por Redução Média da Precisão'}
              </CardTitle>
              <CardDescription>
                {isXGBoost 
                  ? 'Ganho de informação de cada característica no XGBoost' 
                  : 'Contribuição de cada variável no Random Forest'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderImportanciaVariaveis()}
            </CardContent>
          </Card>
        )}

        {/* Detalhes do Modelo */}
        {detalheAtivo === 'detalhes' && (
          <Card>
            <CardHeader>
              <CardTitle>
                {isRandomForest ? '🌳 Configuração do Random Forest' : '⚡ Configuração do XGBoost'}
              </CardTitle>
              <CardDescription>
                Parâmetros e configurações do modelo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderDetalhesEspecificos()}

              {/* Informações gerais */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">
                  {isRandomForest ? '🌲 Sobre o Random Forest' : '⚡ Sobre o XGBoost'}
                </h4>
                <div className="text-sm text-blue-700 space-y-1">
                  {isRandomForest ? (
                    <>
                      <p>✅ <strong>Conjunto:</strong> Combina múltiplas árvores de decisão</p>
                      <p>✅ <strong>Bagging:</strong> Bootstrap aggregating com substituição</p>
                      <p>✅ <strong>Importância:</strong> Calculada via permutação (Redução Média da Precisão/Gini)</p>
                      <p>✅ <strong>Robustez:</strong> Menos propenso a sobreajuste que árvores únicas</p>
                    </>
                  ) : (
                    <>
                      <p>✅ <strong>Gradient Boosting:</strong> Aditivo, corrige erros iterativamente</p>
                      <p>✅ <strong>Ganho:</strong> Melhoria na pureza das folhas</p>
                      <p>✅ <strong>Cobertura:</strong> Número médio de observações nas folhas</p>
                      <p>✅ <strong>Frequência:</strong> Número de vezes que uma característica é usada</p>
                    </>
                  )}
                </div>
              </div>

              {/* Amostra de previsões */}
              {predicoes_amostra && Array.isArray(predicoes_amostra) && predicoes_amostra.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-700 mb-3">🔍 Amostra de Previsões</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left">ID</th>
                          <th className="px-4 py-2 text-left">Valor Real</th>
                          <th className="px-4 py-2 text-left">Valor Previsto</th>
                          <th className="px-4 py-2 text-left">Erro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {predicoes_amostra.slice(0, 10).map((pred, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2 font-mono">#{pred.id}</td>
                            <td className="px-4 py-2">{pred.real}</td>
                            <td className="px-4 py-2">
                              {typeof pred.predito === 'number' ? pred.predito.toFixed(4) : pred.predito}
                            </td>
                            <td className="px-4 py-2">
                              {isRegression ? (
                                <span className={Math.abs(pred.real - pred.predito) > (Math.abs(pred.real) * 0.1) ? 'text-red-600' : 'text-green-600'}>
                                  {(pred.real - pred.predito).toFixed(4)}
                                </span>
                              ) : (
                                <Badge variant={pred.real === pred.predito ? "success" : "danger"}>
                                  {pred.real === pred.predito ? '✓ Correto' : '✗ Errado'}
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ABA: Gráficos */}
        {detalheAtivo === 'graficos' && dadosGraficos && (
          <Card>
            <CardHeader>
              <CardTitle>📈 Visualizações do Modelo</CardTitle>
              <CardDescription>
                {isXGBoost ? 'Gráficos específicos do XGBoost' : 'Visualizações do Random Forest'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GraficosML 
                dados={dadosGraficos}
                tipoModelo={tipoModelo}
              />
            </CardContent>
          </Card>
        )}

        {/* Mensagem se não houver dados para gráficos */}
        {detalheAtivo === 'graficos' && !dadosGraficos && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Dados insuficientes para gráficos
              </h3>
              <p className="text-gray-500 mb-6">
                Execute um modelo primeiro para ver os gráficos
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Resumo Final */}
      <Card>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-700">
                {isRandomForest ? '🌲 Random Forest Concluído' : '⚡ XGBoost Concluído'}
              </h4>
              <p className="text-sm text-gray-600">
                Modelo treinado com {parametros?.n_observacoes || 0} observações e {parametros?.n_features || 0} características
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button
                onClick={() => {
                  const dataStr = JSON.stringify(resultado, null, 2);
                  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                  const exportFileDefaultName = `${tipoModelo}_resultado_${Date.now()}.json`;
                  
                  const linkElement = document.createElement('a');
                  linkElement.setAttribute('href', dataUri);
                  linkElement.setAttribute('download', exportFileDefaultName);
                  linkElement.click();
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                📥 Exportar Resultados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}