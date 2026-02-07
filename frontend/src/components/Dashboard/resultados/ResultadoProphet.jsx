// ResultadoProphet.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, TrendingUp, TrendingDown, 
  Activity, BarChart2, Calendar, Target 
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../componentes/Card';
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

// Componente de gráficos específico para Prophet
const GraficosProphet = ({ dados, tipoModelo }) => {
  const [graficoAtivo, setGraficoAtivo] = useState('previsoes');
  const [dadosProcessados, setDadosProcessados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const chartRef = useRef(null);

  useEffect(() => {
    console.log('📊 GraficosProphet recebeu dados:', dados);
    
    if (!dados) {
      console.log('⚠️  GraficosProphet: Dados vazios');
      setDadosProcessados(null);
      setCarregando(false);
      return;
    }

    try {
      const { 
        previsoes = [], 
        ajustados = [], 
        residuos = [], 
        metricas = {},
        interpretacao_tecnica = {},
        dados_originais = {},
        periodo_previsao = {}
      } = dados;
      
      console.log('📊 Dados brutos recebidos:', {
        previsoes: previsoes?.length,
        ajustados: ajustados?.length,
        residuos: residuos?.length,
        metricas
      });

      // Processar dados ajustados (fit)
      let dadosAjustados = [];
      if (ajustados && Array.isArray(ajustados)) {
        dadosAjustados = ajustados.map(item => ({
          data: item.data || item.ds,
          valor: parseFloat(item.valor || item.yhat) || 0,
          tipo: 'ajustado'
        }));
      }

      // Processar previsões
      let dadosPrevisoes = [];
      if (previsoes && Array.isArray(previsoes)) {
        dadosPrevisoes = previsoes.map(item => ({
          data: item.data || item.ds,
          previsao: parseFloat(item.previsao || item.yhat) || 0,
          inferior: parseFloat(item.inferior || item.yhat_lower) || 0,
          superior: parseFloat(item.superior || item.yhat_upper) || 0,
          tipo: 'previsao'
        }));
      }

      // Processar dados históricos
      let dadosHistoricos = [];
      if (dados_originais && Array.isArray(dados_originais.dados)) {
        dadosHistoricos = dados_originais.dados.map(item => ({
          data: item.data || item.ds,
          valor: parseFloat(item.valor || item.y) || 0,
          tipo: 'historico'
        }));
      }

      // Processar resíduos
      let residuosProcessados = [];
      if (residuos && Array.isArray(residuos)) {
        residuosProcessados = residuos.map((r, i) => ({
          periodo: i + 1,
          residuo: parseFloat(r) || 0
        }));
      }

      // Processar métricas
      const metricasProcessadas = {
        mse: metricas.mse,
        rmse: metricas.rmse,
        mae: metricas.mae,
        mape: metricas.mape,
        r2: metricas.r2
      };

      // Processar componentes do modelo (tendência, sazonalidade)
      let componentes = {};
      if (dados.componentes) {
        componentes = {
          tendencia: dados.componentes.tendencia || [],
          sazonalidade: dados.componentes.sazonalidade || [],
          feriados: dados.componentes.feriados || []
        };
      }

      const processado = {
        dadosHistoricos,
        dadosAjustados,
        dadosPrevisoes,
        residuos: residuosProcessados,
        metricas: metricasProcessadas,
        componentes,
        interpretacao: interpretacao_tecnica,
        periodoPrevisao: periodo_previsao,
        nomeSerie: interpretacao_tecnica?.variavel || 'Prophet'
      };

      console.log('📊 Dados processados:', processado);
      setDadosProcessados(processado);
    } catch (error) {
      console.error('❌ Erro ao processar dados para gráficos:', error);
      setDadosProcessados(null);
    } finally {
      setCarregando(false);
    }
  }, [dados]);

  // Função para formatar datas para exibição
  const formatarDataGrafico = (dataStr) => {
    if (!dataStr) return '';
    
    if (typeof dataStr === 'string' && dataStr.includes('-')) {
      const [ano, mes] = dataStr.split('-');
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dec'];
      return `${meses[parseInt(mes) - 1]}/${ano.slice(2)}`;
    }
    
    return dataStr;
  };

  // 1. Gráfico de Previsões vs Histórico
  const dadosPrevisoesHistorico = () => {
  console.log('📊 Gerando gráfico Previsões vs Histórico:', dadosProcessados);
  
  if (!dadosProcessados || (!dadosProcessados.dadosHistoricos?.length && !dadosProcessados.dadosPrevisoes?.length)) {
    console.log('❌ Sem dados suficientes para gráfico de previsões');
    return null;
  }

  const { dadosHistoricos, dadosPrevisoes, dadosAjustados, nomeSerie } = dadosProcessados;
  
  // Processar e combinar todos os dados com verificações de segurança
  const todosDados = [
    ...(dadosHistoricos || []).filter(d => d && (d.data || d.ds)).map(d => ({
      ...d,
      data: d.data || d.ds,
      valor: parseFloat(d.valor || d.y || 0) || 0,
      tipo: 'historico'
    })),
    ...(dadosAjustados || []).filter(d => d && (d.data || d.ds)).map(d => ({
      ...d,
      data: d.data || d.ds,
      valor: parseFloat(d.valor || d.yhat || 0) || 0,
      tipo: 'ajustado'
    })),
    ...(dadosPrevisoes || []).filter(d => d && (d.data || d.ds)).map(d => ({
      ...d,
      data: d.data || d.ds,
      previsao: parseFloat(d.previsao || d.yhat || 0) || 0,
      inferior: parseFloat(d.inferior || d.yhat_lower || 0) || 0,
      superior: parseFloat(d.superior || d.yhat_upper || 0) || 0,
      tipo: 'previsao'
    }))
  ];

  // Ordenar por data com verificação de segurança
  todosDados.sort((a, b) => {
    const dataA = a.data;
    const dataB = b.data;
    
    // Se ambos tiverem data, comparar
    if (dataA && dataB) {
      // Se forem strings de data, converter para timestamp para comparação
      if (typeof dataA === 'string' && typeof dataB === 'string') {
        try {
          // Tentar parsear como data
          const dateA = new Date(dataA);
          const dateB = new Date(dataB);
          if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
            return dateA.getTime() - dateB.getTime();
          }
          // Se não for possível parsear, usar localeCompare
          return dataA.localeCompare(dataB);
        } catch {
          // Se houver erro no parse, usar localeCompare
          return dataA.localeCompare(dataB);
        }
      }
      // Se um for número (timestamp), comparar números
      if (typeof dataA === 'number' && typeof dataB === 'number') {
        return dataA - dataB;
      }
      // Fallback: tratar como strings
      return String(dataA).localeCompare(String(dataB));
    }
    
    // Se um não tiver data, colocar no final
    if (!dataA && dataB) return 1;
    if (dataA && !dataB) return -1;
    
    // Se nenhum tiver data, manter ordem original
    return 0;
  });

  // Separar por tipo
  const dadosPorTipo = {
    historico: todosDados.filter(d => d.tipo === 'historico'),
    ajustado: todosDados.filter(d => d.tipo === 'ajustado'),
    previsao: todosDados.filter(d => d.tipo === 'previsao')
  };

  // Criar labels baseadas nas datas
  const labels = todosDados.map(d => {
    if (d.data) {
      return formatarDataGrafico(d.data);
    }
    // Se não tiver data, usar índice
    const index = todosDados.indexOf(d) + 1;
    return `Período ${index}`;
  });

  return {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        // Dados históricos
        {
          label: 'Dados Históricos',
          data: todosDados.map(d => d.tipo === 'historico' ? d.valor : null),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointRadius: 3,
          pointHoverRadius: 6
        },
        // Dados ajustados (fit)
        {
          label: 'Modelo Ajustado',
          data: todosDados.map(d => d.tipo === 'ajustado' ? d.valor : null),
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 2,
          borderDash: [3, 3],
          fill: false,
          tension: 0.1,
          pointRadius: 2
        },
        // Previsões
        {
          label: 'Previsões Futuras',
          data: todosDados.map(d => d.tipo === 'previsao' ? (d.previsao || d.valor) : null),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.2,
          pointRadius: 4,
          pointHoverRadius: 8
        },
        // Intervalo de confiança das previsões (limite superior)
        {
          label: 'Intervalo de Confiança (95%)',
          data: todosDados.map(d => {
            if (d.tipo === 'previsao' && d.superior) {
              return d.superior;
            }
            return null;
          }),
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          borderWidth: 1,
          fill: '+1',
          tension: 0.1,
          pointRadius: 0
        },
        // Intervalo de confiança (limite inferior)
        {
          label: '',
          data: todosDados.map(d => {
            if (d.tipo === 'previsao' && d.inferior) {
              return d.inferior;
            }
            return null;
          }),
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          borderWidth: 1,
          fill: false,
          tension: 0.1,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `📈 ${nomeSerie} - Previsões Prophet`,
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
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Período',
            font: { size: 12, weight: '600' }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            maxRotation: 45,
            font: { size: 11 },
            color: '#6b7280'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Valor',
            font: { size: 12, weight: '600' }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            font: { size: 11 },
            color: '#6b7280',
            callback: function(value) {
              if (Math.abs(value) >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M';
              }
              if (Math.abs(value) >= 1000) {
                return (value / 1000).toFixed(1) + 'k';
              }
              return value.toLocaleString('pt-BR');
            }
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

  // 2. Gráfico de Componentes do Modelo (Tendência e Sazonalidade)
  const dadosComponentes = () => {
    console.log('📊 Gerando gráfico de Componentes:', dadosProcessados?.componentes);
    
    if (!dadosProcessados?.componentes || 
        (!dadosProcessados.componentes.tendencia?.length && 
         !dadosProcessados.componentes.sazonalidade?.length)) {
      console.log('❌ Sem dados de componentes');
      return null;
    }

    const { componentes, nomeSerie } = dadosProcessados;
    
    const { tendencia = [], sazonalidade = [], feriados = [] } = componentes;
    
    // Se não houver dados de sazonalidade, usar dados sintéticos
    const dadosSazonalidade = sazonalidade.length > 0 
      ? sazonalidade 
      : Array(12).fill(0).map((_, i) => ({
          periodo: `Mês ${i + 1}`,
          valor: Math.sin(i * Math.PI / 6) * 0.1
        }));

    const labelsTendencia = tendencia.map(t => formatarDataGrafico(t.data || t.ds));
    const valoresTendencia = tendencia.map(t => parseFloat(t.valor || t.trend) || 0);

    const labelsSazonalidade = dadosSazonalidade.map(s => s.periodo || s.name);
    const valoresSazonalidade = dadosSazonalidade.map(s => parseFloat(s.valor || s.value) || 0);

    return {
      type: 'line',
      data: {
        labels: labelsTendencia,
        datasets: [
          {
            label: 'Tendência',
            data: valoresTendencia,
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 3,
            fill: false,
            tension: 0.3,
            pointRadius: 0,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `📊 ${nomeSerie} - Componentes do Modelo Prophet`,
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
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Período',
              font: { size: 12, weight: '600' }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              maxRotation: 45,
              font: { size: 11 },
              color: '#6b7280'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Valor da Tendência',
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
          mode: 'index'
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    };
  };

  // 3. Gráfico de Métricas de Performance
  const dadosMetricas = () => {
    console.log('📊 Gerando gráfico de Métricas:', dadosProcessados?.metricas);
    
    if (!dadosProcessados?.metricas) {
      console.log('❌ Sem métricas disponíveis');
      return null;
    }

    const { metricas } = dadosProcessados;
    
    const metricasArray = [];
    const cores = [
      'rgba(239, 68, 68, 0.8)',   // Vermelho
      'rgba(34, 197, 94, 0.8)',   // Verde
      'rgba(59, 130, 246, 0.8)',  // Azul
      'rgba(245, 158, 11, 0.8)',  // Laranja
      'rgba(168, 85, 247, 0.8)'   // Roxo
    ];

    // Adicionar métricas disponíveis
    if (metricas.rmse !== undefined) {
      metricasArray.push({ label: 'RMSE', valor: Math.abs(metricas.rmse), desc: 'Raiz do Erro Quadrático Médio' });
    }
    if (metricas.mae !== undefined) {
      metricasArray.push({ label: 'MAE', valor: metricas.mae, desc: 'Erro Absoluto Médio' });
    }
    if (metricas.mape !== undefined) {
      metricasArray.push({ label: 'MAPE', valor: metricas.mape, desc: 'Erro Percentual Absoluto Médio' });
    }
    if (metricas.mse !== undefined) {
      metricasArray.push({ label: 'MSE', valor: metricas.mse, desc: 'Erro Quadrático Médio' });
    }
    if (metricas.r2 !== undefined) {
      metricasArray.push({ label: 'R²', valor: metricas.r2, desc: 'Coeficiente de Determinação' });
    }

    if (metricasArray.length === 0) return null;

    // Ordenar por valor
    metricasArray.sort((a, b) => b.valor - a.valor);

    return {
      type: 'bar',
      data: {
        labels: metricasArray.map(m => m.label),
        datasets: [{
          label: 'Valor',
          data: metricasArray.map(m => m.valor),
          backgroundColor: metricasArray.map((_, i) => cores[i % cores.length]),
          borderColor: metricasArray.map((_, i) => 
            cores[i % cores.length].replace('0.8', '1')
          ),
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          title: {
            display: true,
            text: '🎯 Métricas de Performance do Prophet',
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
                const metrica = metricasArray[context.dataIndex];
                const valor = context.parsed.x;
                
                let valorFormatado = '';
                if (metrica.label.includes('MAPE')) {
                  valorFormatado = `${valor.toFixed(2)}%`;
                } else if (metrica.label.includes('R²')) {
                  valorFormatado = valor.toFixed(4);
                } else {
                  valorFormatado = valor.toFixed(2);
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
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Valor da Métrica',
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
              font: { size: 12 },
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

  // 4. Gráfico de Resíduos
  const dadosResiduos = () => {
    console.log('📊 Gerando gráfico de Resíduos:', dadosProcessados?.residuos);
    
    if (!dadosProcessados?.residuos || dadosProcessados.residuos.length === 0) {
      console.log('❌ Sem dados de resíduos');
      return null;
    }

    const { residuos } = dadosProcessados;
    
    const labels = residuos.map(r => `Resíduo ${r.periodo}`);
    const valores = residuos.map(r => r.residuo);

    // Calcular estatísticas
    const mediaResiduos = valores.reduce((a, b) => a + b, 0) / valores.length;
    const limites = valores.map(() => 2 * Math.sqrt(valores.reduce((sum, r) => sum + Math.pow(r, 2), 0) / valores.length));

    return {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Resíduos',
            data: valores,
            backgroundColor: valores.map(v => 
              Math.abs(v) > 2 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(59, 130, 246, 0.7)'
            ),
            borderColor: valores.map(v => 
              Math.abs(v) > 2 ? 'rgb(185, 28, 28)' : 'rgb(29, 78, 216)'
            ),
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Limites (2σ)',
            data: limites,
            type: 'line',
            borderColor: 'rgba(245, 158, 11, 0.5)',
            borderWidth: 1,
            borderDash: [3, 3],
            fill: false,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: '🔍 Análise de Resíduos do Prophet',
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
                const valor = context.parsed.y;
                const label = context.dataset.label === 'Resíduos' 
                  ? `Resíduo: ${valor.toFixed(4)}` 
                  : `Limite: ±${valor.toFixed(4)}`;
                
                if (context.dataset.label === 'Resíduos' && Math.abs(valor) > 2) {
                  return [label, '⚠️ Fora dos limites (2σ)'];
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'Valor do Resíduo',
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
              display: false
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

  // 5. Gráfico de Comparação de Previsões
  const dadosComparacaoPrevisoes = () => {
    console.log('📊 Gerando gráfico de Comparação:', dadosProcessados?.dadosPrevisoes);
    
    if (!dadosProcessados?.dadosPrevisoes || dadosProcessados.dadosPrevisoes.length === 0) {
      console.log('❌ Sem dados de previsões para comparação');
      return null;
    }

    const { dadosPrevisoes } = dadosProcessados;
    
    const labels = dadosPrevisoes.map((item, i) => {
      const dataFormatada = formatarDataGrafico(item.data);
      return dataFormatada || `P${i + 1}`;
    });

    const valores = dadosPrevisoes.map(item => item.previsao);
    const inferiores = dadosPrevisoes.map(item => item.inferior);
    const superiores = dadosPrevisoes.map(item => item.superior);

    // Calcular amplitude dos intervalos
    const amplitudes = superiores.map((sup, i) => sup - inferiores[i]);

    return {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Previsão Pontual',
            data: valores,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 8
          },
          {
            label: 'Limite Inferior (95%)',
            data: inferiores,
            borderColor: 'rgba(239, 68, 68, 0.5)',
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            borderWidth: 1,
            borderDash: [3, 3],
            fill: false,
            tension: 0.3,
            pointRadius: 2
          },
          {
            label: 'Limite Superior (95%)',
            data: superiores,
            borderColor: 'rgba(239, 68, 68, 0.5)',
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            borderWidth: 1,
            borderDash: [3, 3],
            fill: '+1',
            tension: 0.3,
            pointRadius: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: '🔮 Previsões Futuras com Intervalos de Confiança',
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
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                const idx = context.dataIndex;
                const label = context.dataset.label;
                const valor = context.parsed.y;
                
                if (label === 'Previsão Pontual') {
                  return [
                    `Previsão: ${valor.toFixed(4)}`,
                    `Intervalo: ${inferiores[idx].toFixed(4)} a ${superiores[idx].toFixed(4)}`,
                    `Amplitude: ${amplitudes[idx].toFixed(4)}`
                  ];
                }
                return `${label}: ${valor.toFixed(4)}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Período de Previsão',
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
          mode: 'index'
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    };
  };

  // 6. Gráfico de Análise de Tendência Detalhada
  const dadosTendenciaDetalhada = () => {
    console.log('📊 Gerando gráfico de Tendência Detalhada:', dadosProcessados?.dadosHistoricos);
    
    if (!dadosProcessados?.dadosHistoricos || dadosProcessados.dadosHistoricos.length < 10) {
      console.log('❌ Sem dados históricos suficientes para análise de tendência');
      return null;
    }

    const { dadosHistoricos, dadosAjustados } = dadosProcessados;
    
    // Calcular média móvel simples (5 períodos)
    const mediaMovel = [];
    for (let i = 0; i < dadosHistoricos.length; i++) {
      if (i >= 4) {
        const valores = dadosHistoricos.slice(i-4, i+1).map(d => d.valor);
        const media = valores.reduce((a, b) => a + b, 0) / valores.length;
        mediaMovel.push(media);
      } else {
        mediaMovel.push(null);
      }
    }

    const labels = dadosHistoricos.map((item, i) => {
      const dataFormatada = formatarDataGrafico(item.data);
      return dataFormatada || `P${i + 1}`;
    });

    const valores = dadosHistoricos.map(item => item.valor);
    const ajustadosValores = dadosAjustados?.map(item => item.valor) || [];

    // Calcular tendência linear simples
    const n = valores.length;
    const somaX = valores.reduce((sum, _, i) => sum + i, 0);
    const somaY = valores.reduce((sum, val) => sum + val, 0);
    const somaXY = valores.reduce((sum, val, i) => sum + val * i, 0);
    const somaX2 = valores.reduce((sum, _, i) => sum + i * i, 0);
    
    const b = (n * somaXY - somaX * somaY) / (n * somaX2 - somaX * somaX);
    const a = (somaY - b * somaX) / n;
    
    const linhaTendencia = Array(n).fill(0).map((_, i) => a + b * i);

    return {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Valores Históricos',
            data: valores,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.2,
            pointRadius: 2
          },
          {
            label: 'Média Móvel (5 períodos)',
            data: mediaMovel,
            borderColor: 'rgb(245, 158, 11)',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.2,
            pointRadius: 0
          },
          {
            label: 'Tendência Linear',
            data: linhaTendencia,
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0,
            pointRadius: 0
          },
          {
            label: 'Ajuste Prophet',
            data: ajustadosValores,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2,
            borderDash: [2, 2],
            fill: false,
            tension: 0.3,
            pointRadius: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: '📊 Análise Detalhada de Tendência',
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
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Período',
              font: { size: 12, weight: '600' }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: { size: 11 },
              color: '#6b7280',
              maxRotation: 45
            }
          },
          y: {
            title: {
              display: true,
              text: 'Valor',
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
          mode: 'index'
        },
        animation: {
          duration: 1000,
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p>Carregando gráficos do Prophet...</p>
          </div>
        </div>
      );
    }

    if (!dadosProcessados) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-3xl mb-2">🔮</div>
            <p>Nenhum dado disponível para gráficos</p>
            <p className="text-sm mt-2">Execute o modelo Prophet primeiro para visualizar os gráficos</p>
          </div>
        </div>
      );
    }

    const graficos = {
      previsoes: dadosPrevisoesHistorico(),
      tendencia: dadosTendenciaDetalhada(),
      componentes: dadosComponentes(),
      metricas: dadosMetricas(),
      residuos: dadosResiduos(),
      comparacao: dadosComparacaoPrevisoes()
    };

    console.log('📊 Gráficos disponíveis:', Object.keys(graficos).filter(k => graficos[k]));

    const graficoAtual = graficos[graficoAtivo];

    if (!graficoAtual) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-3xl mb-2">🔮</div>
            <p>Dados insuficientes para gerar este gráfico</p>
            <p className="text-sm mt-2">
              {graficoAtivo === 'previsoes' 
                ? 'Este gráfico requer dados históricos e de previsão' 
                : graficoAtivo === 'componentes'
                ? 'Este gráfico requer componentes do modelo Prophet'
                : graficoAtivo === 'residuos'
                ? 'Este gráfico requer dados de resíduos'
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
    { id: 'previsoes', label: '📈 Previsões', disponivel: !!dadosPrevisoesHistorico() },
    { id: 'tendencia', label: '📉 Tendência', disponivel: !!dadosTendenciaDetalhada() },
    { id: 'componentes', label: '🔧 Componentes', disponivel: !!dadosComponentes() },
    { id: 'comparacao', label: '🎯 Intervalos', disponivel: !!dadosComparacaoPrevisoes() },
    { id: 'metricas', label: '📊 Métricas', disponivel: !!dadosMetricas() },
    { id: 'residuos', label: '🔍 Resíduos', disponivel: !!dadosResiduos() }
  ].filter(g => g.disponivel);

  console.log('📊 Gráficos disponíveis:', graficosDisponiveis);

  // Função para exportar gráfico
  const exportarGrafico = () => {
    if (chartRef.current) {
      const link = document.createElement('a');
      link.download = `grafico_prophet_${graficoAtivo}_${Date.now()}.png`;
      link.href = chartRef.current.toBase64Image();
      link.click();
    }
  };

  if (carregando) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando gráficos do Prophet...</p>
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
        <div className="text-4xl mb-4">🔮</div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          Dados insuficientes para gráficos
        </h3>
        <p className="text-gray-500">
          Execute o modelo Prophet com dados válidos para visualizar os gráficos
        </p>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
          <p className="text-sm text-gray-600">Dados recebidos:</p>
          <pre className="text-xs mt-2 overflow-auto max-h-40">
            {JSON.stringify(dados || {}, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  const { nomeSerie, metricas } = dadosProcessados;

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
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="font-medium">{grafico.label}</div>
              <div className="text-xs opacity-80">
                {grafico.id === 'previsoes' ? 'Histórico vs Previsto' :
                 grafico.id === 'tendencia' ? 'Análise de Tendência' :
                 grafico.id === 'componentes' ? 'Componentes do Modelo' :
                 grafico.id === 'comparacao' ? 'Intervalos de Confiança' :
                 grafico.id === 'metricas' ? 'Performance' :
                 'Análise de Resíduos'}
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
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-sm font-medium text-purple-700 mb-2">💡 Interpretação</div>
            <div className="text-sm text-purple-600 space-y-2">
              {graficoAtivo === 'previsoes' && (
                <>
                  <p>Compara dados históricos, ajuste do modelo e previsões futuras.</p>
                  <p><strong>Linha azul:</strong> Dados históricos observados.</p>
                  <p><strong>Linha laranja tracejada:</strong> Modelo ajustado aos dados.</p>
                  <p><strong>Linha vermelha:</strong> Previsões futuras com intervalo de confiança.</p>
                </>
              )}
              {graficoAtivo === 'tendencia' && (
                <>
                  <p>Análise detalhada da tendência e ajuste do modelo.</p>
                  <p><strong>Linha azul:</strong> Valores históricos.</p>
                  <p><strong>Linha laranja:</strong> Média móvel (5 períodos).</p>
                  <p><strong>Linha vermelha tracejada:</strong> Tendência linear.</p>
                  <p><strong>Linha verde tracejada:</strong> Ajuste do Prophet.</p>
                </>
              )}
              {graficoAtivo === 'componentes' && (
                <>
                  <p>Componentes principais do modelo Prophet.</p>
                  <p><strong>Tendência:</strong> Direção geral de longo prazo da série.</p>
                  <p><strong>Sazonalidade:</strong> Padrões que se repetem regularmente.</p>
                  <p><strong>Feriados:</strong> Efeitos de feriados e datas especiais.</p>
                </>
              )}
              {graficoAtivo === 'comparacao' && (
                <>
                  <p>Mostra intervalos de confiança das previsões futuras.</p>
                  <p><strong>Linha verde:</strong> Previsão pontual mais provável.</p>
                  <p><strong>Área sombreada:</strong> Intervalo onde há 95% de confiança que o valor real estará.</p>
                  <p><strong>Amplitude pequena:</strong> Maior certeza nas previsões.</p>
                </>
              )}
              {graficoAtivo === 'metricas' && (
                <>
                  <p>Desempenho do modelo Prophet.</p>
                  <p><strong>MAPE:</strong> Erro percentual médio (ideal &lt; 10%).</p>
                  <p><strong>RMSE/MAE:</strong> Medidas de erro absoluto.</p>
                  <p><strong>R²:</strong> Quanto da variação é explicada pelo modelo (0-1).</p>
                </>
              )}
              {graficoAtivo === 'residuos' && (
                <>
                  <p>Avalia a qualidade do ajuste do modelo.</p>
                  <p><strong>Resíduos:</strong> Diferença entre observado e previsto.</p>
                  <p><strong>Dentro de ±2σ:</strong> Bom ajuste (≈95% dos dados).</p>
                  <p><strong>Padrão aleatório:</strong> Modelo bem especificado.</p>
                  <p><strong>Padrão sistemático:</strong> Possível subespecificação.</p>
                </>
              )}
            </div>
          </div>
          
          {/* Dados do modelo */}
          <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
            <div className="text-sm font-medium text-pink-700 mb-2">🔮 Informações do Prophet</div>
            <div className="text-sm text-pink-600 space-y-1">
              <div className="flex justify-between">
                <span>Modelo:</span>
                <span className="font-medium">Prophet (Facebook)</span>
              </div>
              <div className="flex justify-between">
                <span>Série:</span>
                <span className="font-medium truncate">{nomeSerie}</span>
              </div>
              {metricas.mape !== undefined && (
                <div className="flex justify-between">
                  <span>MAPE:</span>
                  <span className="font-medium">{metricas.mape.toFixed(1)}%</span>
                </div>
              )}
              {metricas.rmse !== undefined && (
                <div className="flex justify-between">
                  <span>RMSE:</span>
                  <span className="font-medium">{metricas.rmse.toFixed(2)}</span>
                </div>
              )}
              {dadosProcessados.dadosHistoricos && (
                <div className="flex justify-between">
                  <span>Observações:</span>
                  <span className="font-medium">{dadosProcessados.dadosHistoricos.length}</span>
                </div>
              )}
              {dadosProcessados.dadosPrevisoes && (
                <div className="flex justify-between">
                  <span>Previsões:</span>
                  <span className="font-medium">{dadosProcessados.dadosPrevisoes.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Se você não tem o componente Tabs, vamos criar uma implementação simples
const SimpleTabs = ({ tabs, defaultTab, className, children }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  
  return (
    <div className={className}>
      {/* Cabeçalho das tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium flex items-center gap-2 ${
              activeTab === tab.id 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Conteúdo da tab ativa */}
      <div className="mt-4">
        {children(activeTab)}
      </div>
    </div>
  );
};

export default function ResultadoProphet({ 
  resultado, 
  dadosOriginais,
  onVoltar,
  onNovoModelo 
}) {
  if (!resultado) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Nenhum resultado disponível</p>
        <Button onClick={onVoltar} className="mt-4">
          Voltar para configuração
        </Button>
      </div>
    );
  }

  // Debug: verificar estrutura dos dados
  useEffect(() => {
    console.log('🔍 Estrutura do resultado Prophet:', resultado);
    console.log('📊 Previsões:', resultado.previsoes?.length || 0);
    console.log('📈 Métricas:', resultado.metricas);
  }, [resultado]);

  const { 
    previsoes = [],
    ajustados = [],
    residuos = [],
    metricas = {},
    interpretacao_tecnica = {},
    dados_originais = {},
    periodo_previsao = {},
    qualidade_ajuste = {},
    modelo_info = {}
  } = resultado;

  // Verificar se temos dados suficientes
  if (previsoes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800">⚠️ Sem dados de previsão</h3>
          <p className="text-yellow-700 mt-2">
            O modelo foi executado, mas não retornou previsões. Verifique os logs para mais informações.
          </p>
          <Button onClick={onVoltar} className="mt-4">
            Voltar para Configuração
          </Button>
        </div>
      </div>
    );
  }

  // Calcular estatísticas
  const estatisticas = {
    mediaPrevisao: previsoes.length > 0 
      ? previsoes.reduce((sum, p) => sum + p.previsao, 0) / previsoes.length 
      : 0,
    amplitudeMedia: previsoes.length > 0 
      ? previsoes.reduce((sum, p) => sum + p.amplitude, 0) / previsoes.length 
      : 0,
    crescimentoPercentual: previsoes.length >= 2 
      ? ((previsoes[previsoes.length - 1].previsao - previsoes[0].previsao) / 
         Math.abs(previsoes[0].previsao || 1)) * 100 
      : 0
  };

  // Formatar número com 2 casas decimais
  const formatarNumero = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return Number(num).toFixed(2);
  };

  // Formatar número com 8 casas decimais (para previsões precisas)
  const formatarNumeroPreciso = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return Number(num).toFixed(8);
  };

  // Formatar intervalo ±
  const formatarIntervalo = (amplitude) => {
    if (amplitude === null || amplitude === undefined) return 'N/A';
    return `±${(amplitude / 2).toFixed(2)}`;
  };

  // Formatar data completa (ex: "Outubro de 2025")
  const formatarDataCompleta = (dataStr) => {
    if (!dataStr) return 'N/A';
    
    try {
      const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      
      // Se já estiver formatado como "Outubro de 2025"
      if (typeof dataStr === 'string' && dataStr.includes(' de ')) {
        return dataStr;
      }
      
      // Se for formato YYYY-MM-DD
      if (typeof dataStr === 'string' && dataStr.includes('-')) {
        const [ano, mes, dia] = dataStr.split('-');
        const mesNum = parseInt(mes);
        if (mesNum >= 1 && mesNum <= 12) {
          return `${meses[mesNum - 1]} de ${ano}`;
        }
      }
      
      return dataStr;
    } catch {
      return dataStr;
    }
  };

  // Traduzir frequência de inglês para português
  const traduzirFrequencia = (freq) => {
    if (!freq) return 'Mensal';
    
    const traducoes = {
      'day': 'Diária',
      'week': 'Semanal',
      'month': 'Mensal',
      'quarter': 'Trimestral',
      'year': 'Anual',
      'daily': 'Diária',
      'weekly': 'Semanal',
      'monthly': 'Mensal',
      'quarterly': 'Trimestral',
      'yearly': 'Anual',
      'diaria': 'Diária',
      'semanal': 'Semanal',
      'mensal': 'Mensal',
      'trimestral': 'Trimestral',
      'anual': 'Anual'
    };
    
    return traducoes[freq.toLowerCase()] || freq;
  };

  // Traduzir sazonalidade de inglês para português
  const traduzirSazonalidade = (sazonalidade) => {
    if (!sazonalidade) return 'Aditiva';
    
    const traducoes = {
      'additive': 'Aditiva',
      'multiplicative': 'Multiplicativa',
      'additiva': 'Aditiva',
      'multiplicativa': 'Multiplicativa',
      'auto': 'Automática',
      'none': 'Nenhuma'
    };
    
    return traducoes[sazonalidade.toLowerCase()] || sazonalidade;
  };

  // Exportar resultados
  const exportarCSV = () => {
    const csvData = [
      ['Período', 'Data', 'Previsão', 'Limite Inferior (95%)', 'Limite Superior (95%)', 'Intervalo (±)'],
      ...previsoes.map(p => [
        `Período ${p.periodo || previsoes.indexOf(p) + 1}`,
        formatarDataCompleta(p.data_completa || p.data),
        formatarNumeroPreciso(p.previsao),
        formatarNumeroPreciso(p.inferior),
        formatarNumeroPreciso(p.superior),
        formatarIntervalo(p.amplitude)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `prophet_previsoes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Preparar dados para gráficos
  const prepararDadosParaGraficos = () => {
    if (!resultado) {
      console.log('⚠️  Sem dados para gráficos');
      return null;
    }

    return {
      previsoes,
      ajustados,
      residuos,
      metricas,
      interpretacao_tecnica,
      dados_originais,
      periodo_previsao,
      qualidade_ajuste,
      modelo_info,
      nome: interpretacao_tecnica?.variavel || 'Prophet',
      tipoModelo: 'prophet'
    };
  };

  const dadosGraficos = prepararDadosParaGraficos();

  // Definir tabs (adicionando a tab de gráficos)
  const tabs = [
    { id: 'previsoes', label: 'Previsões', icon: '🔮' },
    { id: 'metricas', label: 'Métricas', icon: '📊' },
    { id: 'diagnostico', label: 'Diagnóstico', icon: '🔍' },
    { id: 'graficos', label: 'Gráficos', icon: '📈' }
  ];

  // Formatar data para exibição simples (sem ícone de calendário)
  const formatarDataSimples = (dataStr) => {
    const completa = formatarDataCompleta(dataStr);
    return completa;
  };

  // RENDERIZAR GRÁFICOS
  const renderizarGraficos = () => {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Visualizações Gráficas do Prophet</h3>
              <p className="text-gray-600">
                Análise visual dos resultados do modelo Prophet (Facebook)
              </p>
            </div>
            <Badge variant="info" className="bg-purple-100 text-purple-800 border-purple-300">
              🔮 Análise Prophet
            </Badge>
          </div>
        </div>

        {dadosGraficos ? (
          <GraficosProphet 
            dados={dadosGraficos}
            tipoModelo="prophet"
          />
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔮</div>
            <p className="text-gray-500">Dados insuficientes para gráficos</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onVoltar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Voltar para configuração"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              🔮 Resultados do Prophet
            </h1>
            <p className="text-gray-600">
              {interpretacao_tecnica.variavel || 'Variável'} • 
              {modelo_info.crescimento || 'Linear'} • 
              {traduzirFrequencia(interpretacao_tecnica.frequencia) || 'Mensal'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={onNovoModelo}
            variant="primary"
            size="sm"
          >
            Novo Modelo
          </Button>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Média das Previsões</p>
                <h3 className="text-2xl font-bold text-blue-800 mt-1">
                  {formatarNumero(estatisticas.mediaPrevisao)}
                </h3>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Amplitude Média</p>
                <h3 className="text-2xl font-bold text-purple-800 mt-1">
                  {formatarNumero(estatisticas.amplitudeMedia)}
                </h3>
              </div>
              <BarChart2 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${estatisticas.crescimentoPercentual >= 0 ? 'from-green-50 to-green-100' : 'from-red-50 to-red-100'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Crescimento Total</p>
                <h3 className={`text-2xl font-bold mt-1 ${estatisticas.crescimentoPercentual >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  {estatisticas.crescimentoPercentual.toFixed(1)}%
                </h3>
              </div>
              {estatisticas.crescimentoPercentual >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Qualidade do Ajuste</p>
                <h3 className="text-2xl font-bold text-orange-800 mt-1">
                  {qualidade_ajuste.classificacao_mape || 'N/A'}
                </h3>
              </div>
              <Target className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-xs text-orange-700 mt-2">
              MAPE: {qualidade_ajuste.mape_valor ? qualidade_ajuste.mape_valor.toFixed(1) + '%' : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Principais */}
      <SimpleTabs
        tabs={tabs}
        defaultTab="previsoes"
        className="mb-6"
      >
        {(activeTab) => (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Aba Previsões */}
            {activeTab === 'previsoes' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Previsões Futuras - Prophet</CardTitle>
                        <p className="text-sm text-gray-600">
                          Intervalo de confiança: {modelo_info.intervalo_confianca ? `${(modelo_info.intervalo_confianca * 100).toFixed(0)}%` : '95%'}
                        </p>
                      </div>
                      <Badge variant="success">
                        {previsoes.length} períodos previstos
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Tabela de Previsões */}
                    <div className="overflow-x-auto rounded-lg border shadow-sm">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Período
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Data
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Previsão
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Inferior (95%)
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Superior (95%)
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Intervalo
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {previsoes.map((p, idx) => {
                            const intervalo = p.amplitude ? (p.amplitude / 2).toFixed(2) : 'N/A';
                            
                            return (
                              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                {/* Período */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="font-medium text-gray-800">
                                    Período {p.periodo || idx + 1}
                                  </span>
                                </td>
                                
                                {/* Data */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-gray-700">
                                    {formatarDataSimples(p.data_completa || p.data)}
                                  </span>
                                </td>
                                
                                {/* Previsão */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="font-bold text-blue-700">
                                    {formatarNumeroPreciso(p.previsao)}
                                  </span>
                                </td>
                                
                                {/* Limite Inferior */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-gray-600">
                                    {formatarNumeroPreciso(p.inferior)}
                                  </span>
                                </td>
                                
                                {/* Limite Superior */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-gray-600">
                                    {formatarNumeroPreciso(p.superior)}
                                  </span>
                                </td>
                                
                                {/* Intervalo */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-1 mr-2">
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-green-500 h-2 rounded-full"
                                          style={{ 
                                            width: `${Math.min(100, ((p.amplitude || 0) / (Math.abs(p.previsao) || 1)) * 10)}%` 
                                          }}
                                        />
                                      </div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">
                                      ±{intervalo}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Resumo das Previsões */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-3">📊 Resumo das Previsões</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Valor Mínimo Previsto</p>
                          <p className="text-xl font-bold text-blue-700">
                            {previsoes.length > 0 
                              ? formatarNumeroPreciso(Math.min(...previsoes.map(p => p.previsao || 0)))
                              : 'N/A'}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Valor Máximo Previsto</p>
                          <p className="text-xl font-bold text-green-700">
                            {previsoes.length > 0 
                              ? formatarNumeroPreciso(Math.max(...previsoes.map(p => p.previsao || 0)))
                              : 'N/A'}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Amplitude Média Relativa</p>
                          <p className="text-xl font-bold text-purple-700">
                            {previsoes.length > 0 && estatisticas.mediaPrevisao !== 0
                              ? `${((estatisticas.amplitudeMedia / Math.abs(estatisticas.mediaPrevisao)) * 100).toFixed(1)}%`
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Aba Métricas */}
            {activeTab === 'metricas' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Métricas do Modelo */}
                <Card>
                  <CardHeader>
                    <CardTitle>📐 Métricas de Desempenho</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { label: 'MSE (Erro Quadrático Médio)', value: metricas.mse, color: 'blue' },
                        { label: 'RMSE (Raiz do Erro Quadrático)', value: metricas.rmse, color: 'purple' },
                        { label: 'MAE (Erro Absoluto Médio)', value: metricas.mae, color: 'green' },
                        { label: 'MAPE (Erro Percentual Absoluto Médio)', value: metricas.mape, color: 'orange' }
                      ].map((metrica, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700">{metrica.label}</span>
                          <span className={`font-bold text-${metrica.color}-600`}>
                            {metrica.value !== undefined ? formatarNumero(metrica.value) : 'N/A'}
                            {metrica.label.includes('MAPE') && metrica.value !== undefined && '%'}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Interpretação do MAPE */}
                    {metricas.mape !== undefined && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                        <h4 className="font-semibold text-orange-800 mb-2">🎯 Interpretação do MAPE</h4>
                        <div className="text-sm text-gray-700">
                          {metricas.mape < 10 && (
                            <p>✅ <strong>Excelente previsão</strong> - O modelo tem alta precisão (MAPE &lt; 10%)</p>
                          )}
                          {metricas.mape >= 10 && metricas.mape < 20 && (
                            <p>👍 <strong>Boa previsão</strong> - Precisão adequada para decisões (MAPE 10-20%)</p>
                          )}
                          {metricas.mape >= 20 && metricas.mape < 50 && (
                            <p>⚠️ <strong>Previsão razoável</strong> - Útil para planejamento geral (MAPE 20-50%)</p>
                          )}
                          {metricas.mape >= 50 && (
                            <p>❌ <strong>Baixa precisão</strong> - Considere revisar o modelo (MAPE &gt; 50%)</p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Estatísticas dos Dados */}
                <Card>
                  <CardHeader>
                    <CardTitle>📊 Estatísticas dos Dados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-blue-600 font-medium">Período Histórico</p>
                          <p className="text-lg font-bold text-blue-800">
                            {formatarDataCompleta(interpretacao_tecnica.primeira_data) || 'N/A'}
                          </p>
                          <p className="text-xs text-blue-700">Primeira observação</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-sm text-green-600 font-medium">Período Histórico</p>
                          <p className="text-lg font-bold text-green-800">
                            {formatarDataCompleta(interpretacao_tecnica.ultima_data) || 'N/A'}
                          </p>
                          <p className="text-xs text-green-700">Última observação</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {[
                          { label: 'Número de Observações', value: interpretacao_tecnica.n_observacoes, icon: '📈' },
                          { label: 'Média dos Dados', value: dados_originais.media, icon: '📊' },
                          { label: 'Desvio Padrão', value: dados_originais.desvio_padrao, icon: '📐' },
                          { label: 'Valor Mínimo', value: dados_originais.minimo, icon: '📉' },
                          { label: 'Valor Máximo', value: dados_originais.maximo, icon: '📈' }
                        ].map((stat, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{stat.icon}</span>
                              <span className="text-gray-700">{stat.label}</span>
                            </div>
                            <span className="font-bold text-gray-900">
                              {stat.value !== undefined ? formatarNumero(stat.value) : 'N/A'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Aba Diagnóstico */}
            {activeTab === 'diagnostico' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>🔍 Diagnóstico do Modelo Prophet</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Configuração do Modelo */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-800">Configuração do Modelo</h4>
                        <div className="space-y-3">
                          {[
                            { label: 'Tipo de Crescimento', value: modelo_info.crescimento || 'Linear' },
                            { label: 'Intervalo de Confiança', value: `${((modelo_info.intervalo_confianca || 0.95) * 100).toFixed(0)}%` },
                            { label: 'Frequência da Série', value: traduzirFrequencia(interpretacao_tecnica.frequencia) || 'Mensal' },
                            { label: 'Feriados Incluídos', value: modelo_info.feriados_incluidos ? 'Sim' : 'Não' },
                            { label: 'Sazonalidade', value: traduzirSazonalidade(modelo_info.sazonalidade) || 'Aditiva' },
                            { label: 'Períodos Previstos', value: periodo_previsao.n_periodos || previsoes.length }
                          ].map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                              <span className="text-gray-600">{item.label}</span>
                              <Badge variant="outline">{item.value}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recomendações */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-4">💡 Recomendações</h4>
                        <div className="space-y-3">
                          {estatisticas.amplitudeMedia > Math.abs(estatisticas.mediaPrevisao) * 0.3 && (
                            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                              <p className="text-yellow-800 font-medium">⚠️ Alta Incerteza</p>
                              <p className="text-sm text-yellow-700">
                                Intervalos de confiança muito amplos. Considere aumentar o número de observações históricas.
                              </p>
                            </div>
                          )}

                          {metricas.mape > 50 && (
                            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                              <p className="text-red-800 font-medium">❌ Baixa Precisão</p>
                              <p className="text-sm text-red-700">
                                MAPE acima de 50%. Considere:
                                <ul className="mt-1 ml-4 list-disc">
                                  <li>Transformar os dados (log, diferenciação)</li>
                                  <li>Ajustar hiperparâmetros do Prophet</li>
                                  <li>Considerar outros modelos</li>
                                </ul>
                              </p>
                            </div>
                          )}

                          {residuos.some(r => Math.abs(r) > (Math.abs(dados_originais.media || 1) * 0.5)) && (
                            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                              <p className="text-blue-800 font-medium">📅 Outliers Detectados</p>
                              <p className="text-sm text-blue-700">
                                Resíduos grandes sugerem eventos atípicos. O Prophet pode não capturar padrões irregulares.
                              </p>
                            </div>
                          )}

                          {(interpretacao_tecnica.n_observacoes || 0) < 24 && (
                            <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
                              <p className="text-purple-800 font-medium">📊 Poucas Observações</p>
                              <p className="text-sm text-purple-700">
                                Menos de 24 observações. Prophet funciona melhor com séries temporais mais longas.
                              </p>
                            </div>
                          )}

                          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                            <p className="text-green-800 font-medium">✅ Pontos Fortes do Prophet</p>
                            <p className="text-sm text-green-700">
                              • Excelente com sazonalidades múltiplas<br/>
                              • Automático com feriados e pontos de mudança<br/>
                              • Robustos a dados faltantes<br/>
                              • Interpretação direta das tendências
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tendência e Sazonalidade */}
                <Card>
                  <CardHeader>
                    <CardTitle>📈 Análise de Tendência</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-lg">
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800">
                          {interpretacao_tecnica.tendencia_global || 'Tendência não disponível'}
                        </h3>
                        <p className="text-gray-600 mt-2">
                          Crescimento total projetado: {estatisticas.crescimentoPercentual.toFixed(1)}%
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-center space-x-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">
                            {previsoes.length > 0 ? formatarNumero(previsoes[0].previsao) : 'N/A'}
                          </div>
                          <div className="text-sm text-gray-600">Primeira previsão</div>
                        </div>
                        
                        <div className="text-gray-400">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">
                            {previsoes.length > 0 ? formatarNumero(previsoes[previsoes.length - 1].previsao) : 'N/A'}
                          </div>
                          <div className="text-sm text-gray-600">Última previsão</div>
                        </div>
                      </div>
                      
                      <div className="mt-6 text-center">
                        <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          📅 Período: {periodo_previsao.n_periodos || previsoes.length} {traduzirFrequencia(interpretacao_tecnica.frequencia)?.toLowerCase() || 'períodos'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Aba Gráficos */}
            {activeTab === 'graficos' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                {renderizarGraficos()}
              </motion.div>
            )}
          </motion.div>
        )}
      </SimpleTabs>

      {/* Ações Finais */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <Button
          onClick={onVoltar}
          variant="outline"
        >
          ⬅️ Voltar para Configuração
        </Button>
        
        <div className="flex gap-3">
          <Button
            onClick={onNovoModelo}
            variant="primary"
          >
            🔮 Criar Novo Modelo
          </Button>
        </div>
      </div>
    </div>
  );
}