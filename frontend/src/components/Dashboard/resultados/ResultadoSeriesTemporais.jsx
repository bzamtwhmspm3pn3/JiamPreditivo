import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import {
  formatarDataCompleta,
  formatarDataGrafico,
  corrigirSeculoData,
  obterTimestamp,
  isAnoIsolado,
  isExcelSerial,
  converterExcelSerialParaData
} from '../../../utils/dateUtils';
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

// Componente de gráficos unificado para Séries Temporais
const GraficosSeriesTemporais = ({ dados, tipoModelo }) => {
  const [graficoAtivo, setGraficoAtivo] = useState('previsoes');
  const [dadosProcessados, setDadosProcessados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const chartRef = useRef(null);

  const getCoresModelo = () => {
    const cores = {
      arima: {
        primaria: 'rgb(59, 130, 246)',
        secundaria: 'rgb(239, 68, 68)',
        terciaria: 'rgb(245, 158, 11)',
        gradient: 'from-blue-500 to-blue-600'
      },
      sarima: {
        primaria: 'rgb(139, 92, 246)',
        secundaria: 'rgb(59, 130, 246)',
        terciaria: 'rgb(168, 85, 247)',
        gradient: 'from-purple-500 to-indigo-600'
      },
      ets: {
        primaria: 'rgb(34, 197, 94)',
        secundaria: 'rgb(245, 158, 11)',
        terciaria: 'rgb(59, 130, 246)',
        gradient: 'from-green-500 to-emerald-600'
      },
      prophet: {
        primaria: 'rgb(236, 72, 153)',
        secundaria: 'rgb(139, 92, 246)',
        terciaria: 'rgb(245, 158, 11)',
        gradient: 'from-pink-500 to-purple-600'
      }
    };
    return cores[tipoModelo] || cores.arima;
  };

  useEffect(() => {
    if (!dados) {
      setDadosProcessados(null);
      setCarregando(false);
      return;
    }

    try {
      const {
        previsoes = [],
        historico = [],
        ajustados = [],
        residuos = [],
        metricas = {},
        interpretacao = {},
        modelo_info = {},
        coeficientes = [],
        dados_originais = {},
        periodo_previsao = {}
      } = dados;

      const dadosHistoricos = historico
        .filter(item => item && (item.data || item.Data || item.ds))
        .map(item => ({
          data: item.data || item.Data || item.ds,
          valor: parseFloat(item.valor || item.value || item.y || 0) || 0,
          tipo: 'historico'
        }));

      const dadosAjustados = ajustados
        .filter(item => item && (item.data || item.Data || item.ds))
        .map(item => ({
          data: item.data || item.Data || item.ds,
          valor: parseFloat(item.valor || item.ajustado || item.fitted || 0) || 0,
          tipo: 'ajustado'
        }));

      const dadosPrevisoes = previsoes
        .filter(item => item && (item.data || item.Data || item.ds))
        .map(item => ({
          data: item.data || item.Data || item.ds,
          previsao: parseFloat(item.previsao || item.value || item.fitted || 0) || 0,
          inferior: parseFloat(item.inferior || item.lower_95 || item.lower || 0) || 0,
          superior: parseFloat(item.superior || item.upper_95 || item.upper || 0) || 0,
          tipo: 'previsao'
        }));

      const residuosProcessados = residuos
        .filter(r => r !== null && r !== undefined)
        .map((r, i) => ({ periodo: i + 1, residuo: parseFloat(r) || 0 }));

      const metricasProcessadas = {
        ajuste: metricas?.ajuste || {},
        precisao: metricas?.precisao || {},
        diagnostico: metricas?.diagnostico || {}
      };

      const coeficientesProcessados = coeficientes
        .filter(coef => coef && (coef.termo || coef.parameter))
        .map((coef, idx) => ({
          termo: coef.termo || coef.parameter || `coef${idx + 1}`,
          estimativa: parseFloat(coef.estimativa || coef.estimate || coef.coef || 0) || 0,
          p_valor: coef.p_valor || coef.pvalue || coef.p_value,
          erro_padrao: coef.erro_padrao || coef.std_error || coef.se
        }));

      const processado = {
        dadosHistoricos,
        dadosAjustados,
        dadosPrevisoes,
        residuos: residuosProcessados,
        metricas: metricasProcessadas,
        coeficientes: coeficientesProcessados,
        interpretacao,
        modelo_info,
        dados_originais,
        periodo_previsao,
        tipoModelo,
        nomeSerie: interpretacao?.variavel || dados.nome || 'Série Temporal',
        ordemModelo: modelo_info?.ordem_arima || modelo_info?.ordem || 'N/A'
      };

      setDadosProcessados(processado);
    } catch (error) {
      console.error('Erro ao processar dados para gráficos:', error);
      setDadosProcessados(null);
    } finally {
      setCarregando(false);
    }
  }, [dados, tipoModelo]);

  const ordenarPorData = (dadosArray) => {
    if (!dadosArray || !Array.isArray(dadosArray)) return [];
    return [...dadosArray].sort((a, b) => {
      const ta = obterTimestamp(a.data);
      const tb = obterTimestamp(b.data);
      return ta - tb;
    });
  };

  const dadosPrevisoesHistorico = () => {
  if (!dadosProcessados) return null;

  const { dadosHistoricos, dadosPrevisoes, dadosAjustados, nomeSerie } = dadosProcessados;
  const cores = getCoresModelo();

  // Se não tem dados, retorna null
  if ((!dadosHistoricos || dadosHistoricos.length === 0) && (!dadosPrevisoes || dadosPrevisoes.length === 0)) {
    return null;
  }

  const formatNumber = (num, decimals = 2) => {
    if (num == null || isNaN(num)) return 'N/A';
    if (typeof num !== 'number') num = parseFloat(num);
    if (Math.abs(num) < 0.0001) return num.toExponential(decimals);
    return num.toFixed(decimals);
  };

  // 🔧 CORREÇÃO PRINCIPAL: Reunir todas as datas (históricas + previsões)
  const todasDatas = new Set();
  
  // Adicionar datas históricas
  if (dadosHistoricos && Array.isArray(dadosHistoricos)) {
    dadosHistoricos.forEach(item => {
      if (item && item.data) todasDatas.add(item.data);
    });
  }
  
  // Adicionar datas de previsões
  if (dadosPrevisoes && Array.isArray(dadosPrevisoes)) {
    dadosPrevisoes.forEach(item => {
      if (item && item.data) todasDatas.add(item.data);
    });
  }
  
  // Adicionar datas do ajuste
  if (dadosAjustados && Array.isArray(dadosAjustados)) {
    dadosAjustados.forEach(item => {
      if (item && item.data) todasDatas.add(item.data);
    });
  }

  // Ordenar datas
  const datasOrdenadas = Array.from(todasDatas).sort((a, b) => {
    const ta = obterTimestamp(a);
    const tb = obterTimestamp(b);
    return ta - tb;
  });

  const labels = datasOrdenadas.map(d => formatarDataGrafico(d));

  // Criar maps para acesso rápido
  const historicoMap = new Map();
  if (dadosHistoricos) {
    dadosHistoricos.forEach(d => {
      if (d && d.data) historicoMap.set(d.data, d.valor);
    });
  }

  const ajustadosMap = new Map();
  if (dadosAjustados) {
    dadosAjustados.forEach(d => {
      if (d && d.data) ajustadosMap.set(d.data, d.valor);
    });
  }

  const previsoesMap = new Map();
  const inferiorMap = new Map();
  const superiorMap = new Map();
  
  if (dadosPrevisoes) {
    dadosPrevisoes.forEach(d => {
      if (d && d.data) {
        previsoesMap.set(d.data, d.previsao);
        if (d.inferior !== undefined) inferiorMap.set(d.data, d.inferior);
        if (d.superior !== undefined) superiorMap.set(d.data, d.superior);
      }
    });
  }

  // Construir datasets
  const datasets = [];

  // 🔵 DATASET 1: DADOS HISTÓRICOS (linha contínua) - CORRESPONDE AO SEU ARTIGO
  if (dadosHistoricos && dadosHistoricos.length > 0) {
    datasets.push({
      label: 'Dados Históricos',
      data: datasOrdenadas.map(d => {
        const val = historicoMap.get(d);
        return val !== undefined ? val : null;
      }),
      borderColor: '#2563eb',  // Azul como no seu artigo
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      borderWidth: 2.5,
      fill: false,
      tension: 0.2,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: '#2563eb',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 1.5,
      order: 1
    });
  }

  // 🟠 DATASET 2: MODELO AJUSTADO (linha tracejada fina) - opcional
  if (dadosAjustados && dadosAjustados.length > 0) {
    datasets.push({
      label: 'Ajuste do Modelo',
      data: datasOrdenadas.map(d => {
        const val = ajustadosMap.get(d);
        return val !== undefined ? val : null;
      }),
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.05)',
      borderWidth: 1.5,
      borderDash: [4, 4],
      fill: false,
      tension: 0.2,
      pointRadius: 1,
      pointHoverRadius: 4,
      order: 2
    });
  }

  // 🟢 DATASET 3: PREVISÕES (linha tracejada grossa) - CORRESPONDE AO SEU ARTIGO
  if (dadosPrevisoes && dadosPrevisoes.length > 0) {
    datasets.push({
      label: 'Previsões',
      data: datasOrdenadas.map(d => {
        const val = previsoesMap.get(d);
        return val !== undefined ? val : null;
      }),
      borderColor: '#16a34a',  // Verde como no seu artigo
      backgroundColor: 'rgba(22, 163, 74, 0.1)',
      borderWidth: 2.5,
      borderDash: [6, 6],
      fill: false,
      tension: 0.2,
      pointRadius: 4,
      pointHoverRadius: 7,
      pointBackgroundColor: '#16a34a',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 1.5,
      order: 3
    });

    // 🌑 INTERVALO DE CONFIANÇA (área sombreada) - CORRESPONDE AO SEU ARTIGO
    const temIntervalos = dadosPrevisoes.some(p => p.inferior !== undefined && p.superior !== undefined);
    
    if (temIntervalos) {
      // Limite Superior
      datasets.push({
        label: 'Limite Superior (95% CI)',
        data: datasOrdenadas.map(d => {
          const val = superiorMap.get(d);
          return val !== undefined ? val : null;
        }),
        borderColor: 'rgba(22, 163, 74, 0.3)',
        backgroundColor: 'rgba(0,0,0,0)',
        borderWidth: 1,
        borderDash: [2, 2],
        fill: false,
        tension: 0,
        pointRadius: 0,
        order: 4
      });

      // Limite Inferior com área preenchida
      datasets.push({
        label: 'Intervalo de Confiança (95%)',
        data: datasOrdenadas.map(d => {
          const val = inferiorMap.get(d);
          return val !== undefined ? val : null;
        }),
        borderColor: 'rgba(22, 163, 74, 0.3)',
        backgroundColor: 'rgba(22, 163, 74, 0.15)',  // Área sombreada
        borderWidth: 1,
        borderDash: [2, 2],
        fill: {
          target: '+1',  // Preenche até o limite superior
          above: 'rgba(22, 163, 74, 0.15)'  // Cor da área
        },
        tension: 0,
        pointRadius: 0,
        order: 5
      });
    }
  }

  // Calcular crescimento percentual para legenda
  let growthText = '';
  let growthClass = '';
  
  if (dadosPrevisoes && dadosPrevisoes.length > 0 && dadosHistoricos && dadosHistoricos.length > 0) {
    const ultimoHistorico = dadosHistoricos[dadosHistoricos.length - 1]?.valor;
    const ultimaPrevisao = dadosPrevisoes[dadosPrevisoes.length - 1]?.previsao;
    
    if (ultimoHistorico && ultimaPrevisao && ultimoHistorico !== 0) {
      const growth = ((ultimaPrevisao - ultimoHistorico) / ultimoHistorico) * 100;
      growthText = `Crescimento: ${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
      growthClass = growth >= 0 ? 'text-green-600' : 'text-red-600';
    }
  }

  return {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        title: {
          display: true,
          text: `📈 ${nomeSerie} - ${growthText}`,
          font: { size: 16, weight: 'bold' },
          color: '#1f2937',
          padding: { top: 10, bottom: 20 }
        },
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: { size: 11, weight: '500' },
            boxWidth: 12,
            generateLabels: (chart) => {
              const original = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
              return original.filter(label => 
                !label.text.includes('Limite Superior') && 
                !label.text.includes('Limite Inferior')
              );
            }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          titleColor: '#f9fafb',
          bodyColor: '#e5e7eb',
          borderColor: '#374151',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label;
              const value = context.parsed.y;
              if (value === null || value === undefined) return null;
              
              if (label === 'Intervalo de Confiança (95%)') {
                const idx = context.dataIndex;
                const dataPoint = datasOrdenadas[idx];
                const inferior = inferiorMap.get(dataPoint);
                const superior = superiorMap.get(dataPoint);
                if (inferior && superior) {
                  return [
                    `Intervalo: ${formatNumber(inferior)} - ${formatNumber(superior)}`,
                    `Amplitude: ${formatNumber(superior - inferior)}`
                  ];
                }
              }
              return `${label}: ${formatNumber(value)}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Período', font: { size: 12, weight: '600' } },
          ticks: { maxRotation: 45, autoSkip: true, maxTicksLimit: 12 },
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        y: {
          title: { display: true, text: 'Valor', font: { size: 12, weight: '600' } },
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: {
            callback: (value) => {
              if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
              if (value >= 1e3) return (value / 1e3).toFixed(1) + 'k';
              return value.toLocaleString('pt-BR');
            }
          }
        }
      },
      animation: { duration: 1000, easing: 'easeOutQuart' }
    }
  };
};


  const dadosTendencia = () => {
    if (!dadosProcessados?.dadosHistoricos || dadosProcessados.dadosHistoricos.length < 10) return null;

    const { dadosHistoricos, dadosAjustados, nomeSerie } = dadosProcessados;
    const cores = getCoresModelo();

    const dadosOrdenados = ordenarPorData(dadosHistoricos);
    const valores = dadosOrdenados.map(d => d.valor);

    const mediaMovel = [];
    for (let i = 0; i < valores.length; i++) {
      if (i >= 4) {
        const media = (valores[i-4] + valores[i-3] + valores[i-2] + valores[i-1] + valores[i]) / 5;
        mediaMovel.push(media);
      } else mediaMovel.push(null);
    }

    const n = valores.length;
    const somaX = valores.reduce((sum, _, i) => sum + i, 0);
    const somaY = valores.reduce((sum, val) => sum + val, 0);
    const somaXY = valores.reduce((sum, val, i) => sum + val * i, 0);
    const somaX2 = valores.reduce((sum, _, i) => sum + i * i, 0);

    const b = (n * somaXY - somaX * somaY) / (n * somaX2 - somaX * somaX);
    const a = (somaY - b * somaX) / n;
    const linhaTendencia = Array(n).fill(0).map((_, i) => a + b * i);

    const ajustadosOrdenados = ordenarPorData(dadosAjustados || []);
    const ajustadosValores = ajustadosOrdenados.map(d => d.valor);
    const labels = dadosOrdenados.map(d => formatarDataGrafico(d.data));

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Valores Históricos',
            data: valores,
            borderColor: cores.primaria,
            backgroundColor: cores.primaria.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            borderWidth: 2,
            fill: false,
            tension: 0.2,
            pointRadius: 2,
            order: 1
          },
          {
            label: 'Média Móvel (5 períodos)',
            data: mediaMovel,
            borderColor: cores.terciaria,
            backgroundColor: cores.terciaria.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            borderWidth: 2,
            fill: false,
            tension: 0.2,
            pointRadius: 0,
            order: 2
          },
          {
            label: 'Tendência Linear',
            data: linhaTendencia,
            borderColor: cores.secundaria,
            backgroundColor: cores.secundaria.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0,
            pointRadius: 0,
            order: 3
          },
          ...(ajustadosValores.length > 0 ? [{
            label: 'Ajuste do Modelo',
            data: ajustadosValores,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2,
            borderDash: [2, 2],
            fill: false,
            tension: 0.3,
            pointRadius: 1,
            order: 4
          }] : [])
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `📉 ${nomeSerie} - Análise de Tendência`,
            font: { size: 16, weight: 'bold' }
          },
          legend: { position: 'top', labels: { usePointStyle: true } },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          x: { title: { display: true, text: 'Período' }, ticks: { maxRotation: 45 } },
          y: { title: { display: true, text: 'Valor' } }
        },
        interaction: { intersect: false, mode: 'index' },
        animation: { duration: 1000, easing: 'easeOutQuart' }
      }
    };
  };

  const dadosComparacaoPrevisoes = () => {
    if (!dadosProcessados?.dadosPrevisoes || dadosProcessados.dadosPrevisoes.length === 0) return null;

    const { dadosPrevisoes, nomeSerie } = dadosProcessados;
    const cores = getCoresModelo();

    const dadosOrdenados = ordenarPorData(dadosPrevisoes);
    const labels = dadosOrdenados.map(item => formatarDataGrafico(item.data));
    const valores = dadosOrdenados.map(item => item.previsao);
    const inferiores = dadosOrdenados.map(item => item.inferior);
    const superiores = dadosOrdenados.map(item => item.superior);

    return {
      type: 'line',
      data: {
        labels,
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
            borderColor: cores.secundaria.replace('rgb', 'rgba').replace(')', ', 0.5)'),
            backgroundColor: 'rgba(0,0,0,0)',
            borderWidth: 1,
            borderDash: [3, 3],
            fill: false,
            tension: 0.3,
            pointRadius: 2
          },
          {
            label: 'Limite Superior (95%)',
            data: superiores,
            borderColor: cores.secundaria.replace('rgb', 'rgba').replace(')', ', 0.5)'),
            backgroundColor: cores.secundaria.replace('rgb', 'rgba').replace(')', ', 0.1)'),
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
            text: `🎯 ${nomeSerie} - Intervalos de Confiança`,
            font: { size: 16, weight: 'bold' }
          },
          legend: { position: 'top', labels: { usePointStyle: true } },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (ctx) => {
                const idx = ctx.dataIndex;
                if (ctx.dataset.label === 'Previsão Pontual') {
                  return [
                    `Previsão: ${ctx.parsed.y.toFixed(4)}`,
                    `Intervalo: ${inferiores[idx].toFixed(4)} a ${superiores[idx].toFixed(4)}`,
                    `Amplitude: ${(superiores[idx] - inferiores[idx]).toFixed(4)}`
                  ];
                }
                return `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(4)}`;
              }
            }
          }
        },
        scales: {
          x: { title: { display: true, text: 'Período' } },
          y: { title: { display: true, text: 'Valor Previsto' } }
        },
        interaction: { intersect: false, mode: 'index' },
        animation: { duration: 1000, easing: 'easeOutQuart' }
      }
    };
  };

  const dadosMetricasPerformance = () => {
    if (!dadosProcessados?.metricas) return null;

    const { metricas } = dadosProcessados;
    const { ajuste, precisao } = metricas;
    const cores = getCoresModelo();

    const metricasArray = [];
    const coresGrafico = [
      cores.primaria.replace('rgb', 'rgba').replace(')', ', 0.8)'),
      cores.secundaria.replace('rgb', 'rgba').replace(')', ', 0.8)'),
      cores.terciaria.replace('rgb', 'rgba').replace(')', ', 0.8)'),
      'rgba(168, 85, 247, 0.8)',
      'rgba(245, 158, 11, 0.8)'
    ];

    if (precisao?.ME !== undefined) metricasArray.push({ label: 'Erro Médio (ME)', valor: Math.abs(precisao.ME) });
    if (precisao?.MAE !== undefined) metricasArray.push({ label: 'MAE', valor: precisao.MAE });
    if (precisao?.MAPE !== undefined) metricasArray.push({ label: 'MAPE', valor: precisao.MAPE });
    if (ajuste?.RMSE !== undefined) metricasArray.push({ label: 'RMSE', valor: ajuste.RMSE });
    if (ajuste?.AIC !== undefined) metricasArray.push({ label: 'AIC', valor: ajuste.AIC });
    if (ajuste?.BIC !== undefined) metricasArray.push({ label: 'BIC', valor: ajuste.BIC });

    if (metricasArray.length === 0) return null;

    metricasArray.sort((a, b) => b.valor - a.valor);

    return {
      type: 'bar',
      data: {
        labels: metricasArray.map(m => m.label),
        datasets: [{
          label: 'Valor',
          data: metricasArray.map(m => m.valor),
          backgroundColor: metricasArray.map((_, i) => coresGrafico[i % coresGrafico.length]),
          borderColor: metricasArray.map((_, i) => coresGrafico[i % coresGrafico.length].replace('0.8', '1')),
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
            text: `📊 ${tipoModelo.toUpperCase()} - Métricas de Performance`,
            font: { size: 16, weight: 'bold' }
          },
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const metrica = metricasArray[ctx.dataIndex];
                const valor = ctx.parsed.x;
                let suf = '';
                if (metrica.label.includes('MAPE')) suf = '%';
                return `${metrica.label}: ${valor.toFixed(2)}${suf}`;
              }
            }
          }
        },
        scales: {
          x: { beginAtZero: true, title: { display: true, text: 'Valor da Métrica' } },
          y: { grid: { color: 'rgba(0,0,0,0.03)' } }
        },
        animation: { duration: 800, easing: 'easeOutQuart' }
      }
    };
  };

  const dadosResiduos = () => {
    if (!dadosProcessados?.residuos || dadosProcessados.residuos.length === 0) return null;

    const { residuos } = dadosProcessados;
    const cores = getCoresModelo();

    const labels = residuos.map(r => `Resíduo ${r.periodo}`);
    const valores = residuos.map(r => r.residuo);

    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const desvio = Math.sqrt(valores.reduce((s, r) => s + (r - media) ** 2, 0) / valores.length);
    const limites = valores.map(() => 2 * desvio);

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Resíduos',
            data: valores,
            backgroundColor: valores.map(v =>
              Math.abs(v) > 2 * desvio
                ? cores.secundaria.replace('rgb', 'rgba').replace(')', ', 0.7)')
                : cores.primaria.replace('rgb', 'rgba').replace(')', ', 0.7)')
            ),
            borderColor: valores.map(v => Math.abs(v) > 2 * desvio ? cores.secundaria : cores.primaria),
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Limites (±2σ)',
            data: limites,
            type: 'line',
            borderColor: cores.terciaria.replace('rgb', 'rgba').replace(')', ', 0.5)'),
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
            text: `🔍 ${tipoModelo.toUpperCase()} - Análise de Resíduos`,
            font: { size: 16, weight: 'bold' }
          },
          legend: { position: 'top', labels: { usePointStyle: true } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                if (ctx.dataset.label === 'Resíduos') {
                  const out = Math.abs(ctx.parsed.y) > 2 * desvio ? ' ⚠️ Fora dos limites' : '';
                  return `Resíduo: ${ctx.parsed.y.toFixed(4)}${out}`;
                }
                return `Limite: ±${ctx.parsed.y.toFixed(4)}`;
              }
            }
          }
        },
        scales: {
          y: { title: { display: true, text: 'Valor do Resíduo' } },
          x: { ticks: { display: false } }
        },
        animation: { duration: 800, easing: 'easeOutQuart' }
      }
    };
  };

  const dadosCoeficientes = () => {
    if (!dadosProcessados?.coeficientes || dadosProcessados.coeficientes.length === 0) return null;

    const { coeficientes } = dadosProcessados;
    const cores = getCoresModelo();

    const ordenados = [...coeficientes]
      .filter(c => c.termo && c.estimativa !== undefined)
      .sort((a, b) => Math.abs(b.estimativa) - Math.abs(a.estimativa))
      .slice(0, 10);

    const labels = ordenados.map(c => c.termo);
    const valores = ordenados.map(c => c.estimativa);
    const pValores = ordenados.map(c => c.p_valor);

    const coresBarras = valores.map((_, i) => {
      const p = pValores[i];
      if (p !== undefined && p < 0.05) return cores.secundaria.replace('rgb', 'rgba').replace(')', ', 0.8)');
      if (p !== undefined && p < 0.1) return cores.terciaria.replace('rgb', 'rgba').replace(')', ', 0.8)');
      return cores.primaria.replace('rgb', 'rgba').replace(')', ', 0.5)');
    });

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Estimativa do Coeficiente',
          data: valores,
          backgroundColor: coresBarras,
          borderColor: coresBarras.map(c => c.replace('0.8', '1').replace('0.5', '1')),
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `β ${tipoModelo.toUpperCase()} - Coeficientes do Modelo`,
            font: { size: 16, weight: 'bold' }
          },
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const idx = ctx.dataIndex;
                const valor = ctx.parsed.y;
                const p = pValores[idx];
                const linha1 = `Coeficiente: ${valor.toFixed(6)}`;
                const linha2 = p !== undefined ? `p-valor: ${p.toFixed(4)}` : '';
                const linha3 = p !== undefined && p < 0.05 ? '✅ Significativo (p < 0.05)' :
                              p !== undefined && p < 0.1 ? '⚠️ Marginal (p < 0.1)' :
                              p !== undefined ? '❌ Não significativo' : '';
                return [linha1, linha2, linha3].filter(Boolean);
              }
            }
          }
        },
        scales: {
          y: { title: { display: true, text: 'Valor do Coeficiente' } },
          x: { ticks: { maxRotation: 45 } }
        },
        animation: { duration: 800, easing: 'easeOutQuart' }
      }
    };
  };

  const renderizarGrafico = () => {
    if (carregando) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
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
      previsoes: dadosPrevisoesHistorico(),
      tendencia: dadosTendencia(),
      comparacao: dadosComparacaoPrevisoes(),
      metricas: dadosMetricasPerformance(),
      residuos: dadosResiduos(),
      coeficientes: dadosCoeficientes()
    };

    const graficoAtual = graficos[graficoAtivo];
    if (!graficoAtual) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-3xl mb-2">📊</div>
            <p>Dados insuficientes para gerar este gráfico</p>
          </div>
        </div>
      );
    }

    if (graficoAtual.type === 'line') {
      return <Line ref={chartRef} data={graficoAtual.data} options={graficoAtual.options} />;
    }
    return <Bar ref={chartRef} data={graficoAtual.data} options={graficoAtual.options} />;
  };

  const getGraficosDisponiveis = () => {
    return [
      { id: 'previsoes', label: '📈 Previsões', disponivel: !!dadosPrevisoesHistorico() },
      { id: 'tendencia', label: '📉 Tendência', disponivel: !!dadosTendencia() },
      { id: 'comparacao', label: '🎯 Intervalos', disponivel: !!dadosComparacaoPrevisoes() },
      { id: 'metricas', label: '📊 Métricas', disponivel: !!dadosMetricasPerformance() },
      { id: 'coeficientes', label: 'β Coeficientes', disponivel: !!dadosCoeficientes() },
      { id: 'residuos', label: '🔍 Resíduos', disponivel: !!dadosResiduos() }
    ].filter(g => g.disponivel);
  };

  const graficosDisponiveis = getGraficosDisponiveis();
  const exportarGrafico = () => {
    if (chartRef.current) {
      const link = document.createElement('a');
      link.download = `grafico_${tipoModelo}_${graficoAtivo}_${Date.now()}.png`;
      link.href = chartRef.current.toBase64Image();
      link.click();
    }
  };

  if (carregando) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
        <p className="text-gray-600">Carregando gráficos...</p>
      </div>
    );
  }

  if (!dadosProcessados || graficosDisponiveis.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">Dados insuficientes para gráficos</h3>
        <p className="text-gray-500">Execute o modelo com dados válidos para visualizar os gráficos</p>
      </div>
    );
  }

  const { nomeSerie, ordemModelo, metricas } = dadosProcessados;
  const cores = getCoresModelo();

  const getIconeModelo = () => {
    const icones = { arima: '📈', sarima: '🔄', ets: '📊', prophet: '🔮' };
    return icones[tipoModelo] || '📈';
  };

  return (
    <div className="space-y-6">
      {graficosDisponiveis.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {graficosDisponiveis.map(grafico => (
            <button
              key={grafico.id}
              onClick={() => setGraficoAtivo(grafico.id)}
              className={`px-4 py-3 rounded-lg text-left transition-all flex-1 min-w-[140px] ${
                graficoAtivo === grafico.id
                  ? `bg-gradient-to-r ${cores.gradient} text-white shadow-lg transform scale-105`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="font-medium">{grafico.label}</div>
              <div className="text-xs opacity-80">
                {grafico.id === 'previsoes' ? 'Histórico vs Previsto' :
                 grafico.id === 'tendencia' ? 'Análise de Tendência' :
                 grafico.id === 'comparacao' ? 'Intervalos de Confiança' :
                 grafico.id === 'metricas' ? 'Performance' :
                 grafico.id === 'coeficientes' ? 'Parâmetros do Modelo' : 'Análise de Resíduos'}
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="h-[500px]">{renderizarGrafico()}</div>
      </div>

      {graficosDisponiveis.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-3">🛠️ Controles</div>
            <div className="space-y-3">
              <button
                onClick={exportarGrafico}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                📥 Exportar como PNG
              </button>
              <div className="text-xs text-gray-500">💡 Passe o mouse sobre os pontos/barras para ver detalhes</div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${
            tipoModelo === 'arima' ? 'bg-blue-50 border-blue-200' :
            tipoModelo === 'sarima' ? 'bg-purple-50 border-purple-200' :
            tipoModelo === 'ets' ? 'bg-green-50 border-green-200' : 'bg-pink-50 border-pink-200'
          }`}>
            <div className={`text-sm font-medium mb-2 ${
              tipoModelo === 'arima' ? 'text-blue-700' :
              tipoModelo === 'sarima' ? 'text-purple-700' :
              tipoModelo === 'ets' ? 'text-green-700' : 'text-pink-700'
            }`}>💡 Interpretação</div>
            <div className={`text-sm space-y-2 ${
              tipoModelo === 'arima' ? 'text-blue-600' :
              tipoModelo === 'sarima' ? 'text-purple-600' :
              tipoModelo === 'ets' ? 'text-green-600' : 'text-pink-600'
            }`}>
              {graficoAtivo === 'previsoes' && (
                <>
                  <p>Compara dados históricos, ajuste do modelo e previsões futuras.</p>
                  <p><strong>Linha colorida:</strong> Dados históricos observados.</p>
                  <p><strong>Linha tracejada:</strong> Modelo ajustado aos dados.</p>
                  <p><strong>Linha em destaque:</strong> Previsões futuras com intervalo de confiança.</p>
                </>
              )}
              {graficoAtivo === 'tendencia' && (
                <>
                  <p>Análise detalhada da tendência e ajuste do modelo.</p>
                  <p><strong>Linha colorida:</strong> Valores históricos.</p>
                  <p><strong>Linha tracejada:</strong> Média móvel (5 períodos).</p>
                  <p><strong>Linha pontilhada:</strong> Tendência linear.</p>
                </>
              )}
              {graficoAtivo === 'comparacao' && (
                <>
                  <p>Mostra intervalos de confiança das previsões futuras.</p>
                  <p><strong>Linha verde:</strong> Previsão pontual mais provável.</p>
                  <p><strong>Área sombreada:</strong> Intervalo de 95% de confiança.</p>
                </>
              )}
              {graficoAtivo === 'metricas' && (
                <>
                  <p>Desempenho do modelo {tipoModelo.toUpperCase()}.</p>
                  <p><strong>MAPE:</strong> Erro percentual médio (ideal &lt; 10%).</p>
                  <p><strong>RMSE/MAE:</strong> Medidas de erro absoluto.</p>
                  <p><strong>AIC/BIC:</strong> Critérios de qualidade do ajuste.</p>
                </>
              )}
              {graficoAtivo === 'coeficientes' && (
                <>
                  <p>Parâmetros do modelo {tipoModelo.toUpperCase()}.</p>
                  <p><strong>Coeficientes significativos (p &lt; 0.05):</strong> Impacto real no modelo.</p>
                  <p><strong>Valor positivo:</strong> Relação direta; <strong>negativo:</strong> relação inversa.</p>
                </>
              )}
              {graficoAtivo === 'residuos' && (
                <>
                  <p>Avalia a qualidade do ajuste do modelo.</p>
                  <p><strong>Resíduos:</strong> Diferença entre observado e previsto.</p>
                  <p><strong>Dentro de ±2σ:</strong> Bom ajuste (≈95% dos dados).</p>
                  <p><strong>Padrão aleatório:</strong> Modelo bem especificado.</p>
                </>
              )}
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${
            tipoModelo === 'arima' ? 'bg-blue-100 border-blue-300' :
            tipoModelo === 'sarima' ? 'bg-purple-100 border-purple-300' :
            tipoModelo === 'ets' ? 'bg-green-100 border-green-300' : 'bg-pink-100 border-pink-300'
          }`}>
            <div className={`text-sm font-medium mb-2 flex items-center gap-2 ${
              tipoModelo === 'arima' ? 'text-blue-800' :
              tipoModelo === 'sarima' ? 'text-purple-800' :
              tipoModelo === 'ets' ? 'text-green-800' : 'text-pink-800'
            }`}>
              {getIconeModelo()} {tipoModelo.toUpperCase()} - Informações
            </div>
            <div className={`text-sm space-y-1 ${
              tipoModelo === 'arima' ? 'text-blue-700' :
              tipoModelo === 'sarima' ? 'text-purple-700' :
              tipoModelo === 'ets' ? 'text-green-700' : 'text-pink-700'
            }`}>
              <div className="flex justify-between">
                <span>Série:</span>
                <span className="font-medium truncate">{nomeSerie}</span>
              </div>
              <div className="flex justify-between">
                <span>Modelo:</span>
                <span className="font-medium">{tipoModelo.toUpperCase()} {ordemModelo !== 'N/A' ? `(${ordemModelo})` : ''}</span>
              </div>
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
              {metricas.ajuste?.RMSE && (
                <div className="flex justify-between">
                  <span>RMSE:</span>
                  <span className="font-medium">{metricas.ajuste.RMSE.toFixed(2)}</span>
                </div>
              )}
              {metricas.precisao?.MAPE && (
                <div className="flex justify-between">
                  <span>MAPE:</span>
                  <span className="font-medium">{metricas.precisao.MAPE.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente principal ResultadoSeriesTemporais
export default function ResultadoSeriesTemporais({ resultado, tipoModelo, onVoltar, onNovoModelo }) {
  const [abaAtiva, setAbaAtiva] = useState('interpretacao');
  const [todasPrevisoesVisiveis, setTodasPrevisoesVisiveis] = useState(false);

  if (!resultado) return null;

  const dadosResultado = resultado.resultado || resultado;

  const interpretacao = dadosResultado.interpretacao_tecnica || {};
  const coeficientes = Array.isArray(dadosResultado.coeficientes) ? dadosResultado.coeficientes : [];
  const metricas = dadosResultado.metricas || {};
  const previsoes = Array.isArray(dadosResultado.previsoes) ? dadosResultado.previsoes : [];
  const modeloInfo = dadosResultado.modelo_info || {};
  const periodoPrevisao = dadosResultado.periodo_previsao || {};
  const qualidadeAjuste = dadosResultado.qualidade_ajuste || {};
  const resumoModelo = dadosResultado.resumo_modelo || {};
  const historico = Array.isArray(dadosResultado.historico) ? dadosResultado.historico : [];
  const residuos = Array.isArray(dadosResultado.residuos) ? dadosResultado.residuos : [];

  const metricasAjuste = metricas?.ajuste || {};
  const metricasPrecisao = metricas?.precisao || {};
  const metricasDiagnostico = metricas?.diagnostico || {};

  const formatNumber = (num, decimals = 2) => {
    if (num == null || isNaN(num)) return 'N/A';
    if (typeof num !== 'number') num = parseFloat(num);
    if (Math.abs(num) < 0.0001) return num.toExponential(decimals);
    return num.toFixed(decimals);
  };

  const safeText = (value, def = 'N/A') => {
    if (value == null) return def;
    if (typeof value === 'object' && !(value instanceof Date)) {
      try { return JSON.stringify(value); } catch { return def; }
    }
    return String(value);
  };

  const getNomeVariavel = () => safeText(
    interpretacao.variavel || dadosResultado.variavel_y || resultado.nome || 'Série Temporal'
  );

  const getTipoNome = () => {
    const nomes = { arima: 'ARIMA', sarima: 'SARIMA', ets: 'ETS', prophet: 'Prophet' };
    return nomes[tipoModelo] || tipoModelo;
  };

  const getPeriodoCorreto = () => {
    if (resultado.dadosUsados) {
      const { periodo_inicio, n_previsoes, frequencia } = resultado.dadosUsados;
      if (periodo_inicio) {
        const inicioCorrigido = corrigirSeculoData(periodo_inicio);
        if (n_previsoes && frequencia) {
          try {
            if (frequencia.toLowerCase().includes('anual') || !inicioCorrigido.includes('/')) {
              return `Ano ${inicioCorrigido}`;
            }
            const [mesStr, anoStr] = inicioCorrigido.split('/');
            const mes = parseInt(mesStr);
            const ano = parseInt(anoStr);
            if (!isNaN(mes) && !isNaN(ano)) {
              let mesFinal = mes + parseInt(n_previsoes);
              let anoFinal = ano;
              while (mesFinal > 12) { mesFinal -= 12; anoFinal += 1; }
              const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
              return `${meses[mes-1]} de ${ano} a ${meses[mesFinal-1]} de ${anoFinal}`;
            }
          } catch (e) {}
        }
        return formatarDataCompleta(inicioCorrigido);
      }
    }
    return 'Período não especificado';
  };

  const prepararDadosParaGraficos = () => {
    if (!dadosResultado) return null;
    return {
      previsoes,
      historico,
      metricas,
      interpretacao,
      modelo_info: modeloInfo,
      coeficientes,
      residuos,
      nome: getNomeVariavel(),
      tipoModelo
    };
  };
  const dadosGraficos = prepararDadosParaGraficos();

  const renderizarInterpretacaoTecnica = () => {
    const periodoCorreto = getPeriodoCorreto();

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Interpretação Técnica da Série Temporal: <span className="text-blue-600">{getNomeVariavel()}</span>
          </h3>
          <p className="text-gray-600">Análise completa do modelo {getTipoNome()} aplicado</p>
          <div className="mt-2 text-sm text-blue-700">📅 Período da previsão: {periodoCorreto}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">🗓️</span> Contexto da Análise
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="font-medium text-gray-700 min-w-[180px]">Início da previsão:</span>
                <span className="text-gray-900 font-semibold">
                  {resultado.dadosUsados?.periodo_inicio
                    ? formatarDataCompleta(corrigirSeculoData(resultado.dadosUsados.periodo_inicio))
                    : 'Outubro de 2025'}
                </span>
              </li>
              <li className="flex items-start">
                <span className="font-medium text-gray-700 min-w-[180px]">Período de previsão:</span>
                <span className="text-gray-900 font-semibold">{periodoCorreto}</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium text-gray-700 min-w-[180px]">Observações históricas:</span>
                <span className="text-gray-900 font-semibold">
                  {safeText(dadosResultado.n_observacoes || resultado.dadosUsados?.n || interpretacao.n_observacoes || historico.length || '119')}
                </span>
              </li>
              <li className="flex items-start">
                <span className="font-medium text-gray-700 min-w-[180px]">Frequência:</span>
                <span className="text-gray-900 font-semibold">
                  {safeText(resultado.dadosUsados?.frequencia || interpretacao.frequencia || 'Mensal')}
                </span>
              </li>
              <li className="flex items-start">
                <span className="font-medium text-gray-700 min-w-[180px]">Período histórico:</span>
                <span className="text-gray-900 font-semibold">
                  Novembro de 2015 a Setembro de 2025
                </span>
              </li>
              <li className="flex items-start">
                <span className="font-medium text-gray-700 min-w-[180px]">Períodos previstos:</span>
                <span className="text-gray-900 font-semibold">
                  {safeText(resultado.dadosUsados?.n_previsoes || previsoes?.length || '12')}
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">📈</span> Tendência e Qualidade
            </h4>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Tendência Global</div>
                <div className={`text-xl font-bold ${
                  interpretacao.tendencia_global?.includes('Alta') || interpretacao.tendencia === 'positiva' ? 'text-green-600' :
                  interpretacao.tendencia_global?.includes('Baixa') || interpretacao.tendencia === 'negativa' ? 'text-red-600' :
                  'text-blue-600'
                }`}>
                  {safeText(interpretacao.tendencia_global || interpretacao.tendencia || 'Estável')}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {interpretacao.tendencia_global?.includes('Alta') || interpretacao.tendencia === 'positiva' ? 'Cenário de crescimento' :
                   interpretacao.tendencia_global?.includes('Baixa') || interpretacao.tendencia === 'negativa' ? 'Cenário de redução' :
                   'Estabilidade prevista'}
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm text-gray-600 mb-2">Classificação do Modelo</div>
                <div className="flex flex-wrap gap-2">
                  {qualidadeAjuste.classificacao_mape && (
                    <Badge variant={
                      qualidadeAjuste.classificacao_mape === 'Excelente' ? 'success' :
                      qualidadeAjuste.classificacao_mape === 'Boa' ? 'primary' :
                      qualidadeAjuste.classificacao_mape === 'Razoável' ? 'warning' : 'error'
                    }>
                      MAPE: {safeText(qualidadeAjuste.classificacao_mape)}
                    </Badge>
                  )}
                  {qualidadeAjuste.classificacao_rmse && (
                    <Badge variant={
                      qualidadeAjuste.classificacao_rmse === 'Excelente' ? 'success' :
                      qualidadeAjuste.classificacao_rmse === 'Boa' ? 'primary' :
                      qualidadeAjuste.classificacao_rmse === 'Razoável' ? 'warning' : 'error'
                    }>
                      RMSE: {safeText(qualidadeAjuste.classificacao_rmse)}
                    </Badge>
                  )}
                  {resumoModelo.convergiu !== undefined && (
                    <Badge variant={resumoModelo.convergiu ? 'success' : 'error'}>
                      {resumoModelo.convergiu ? 'Convergiu' : 'Não convergiu'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Especificação do Modelo {getTipoNome()}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Tipo de Modelo</div>
              <div className="text-lg font-semibold text-blue-700">{getTipoNome()}</div>
            </div>
            {modeloInfo.ordem_arima && (
              <div>
                <div className="text-sm text-gray-600">Ordem ARIMA</div>
                <div className="text-lg font-semibold font-mono">{safeText(modeloInfo.ordem_arima)}</div>
              </div>
            )}
            {resultado.dadosUsados?.ordem && (
              <div>
                <div className="text-sm text-gray-600">Ordem Configurada</div>
                <div className="text-lg font-semibold font-mono">({safeText(resultado.dadosUsados.ordem).replace(/[()]/g, '')})</div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-600">Frequência</div>
              <div className="text-lg font-semibold">{safeText(resultado.dadosUsados?.frequencia || 'Mensal')}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Previsões</div>
              <div className="text-lg font-semibold">{safeText(resultado.dadosUsados?.n_previsoes || '12')} períodos</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Início</div>
              <div className="text-lg font-semibold">
                {resultado.dadosUsados?.periodo_inicio
                  ? formatarDataCompleta(corrigirSeculoData(resultado.dadosUsados.periodo_inicio))
                  : 'Outubro 2025'}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">📋 Resumo da Configuração:</div>
            <div className="text-gray-600">
              Modelo {getTipoNome()}({resultado.dadosUsados?.ordem?.replace(/[()]/g, '').replace(/,/g, ', ') || '1, 1, 1'}) aplicado a {getNomeVariavel()} com frequência {safeText(resultado.dadosUsados?.frequencia || 'mensal')}. 
              Previsão de {safeText(resultado.dadosUsados?.n_previsoes || '12')} períodos a partir de {resultado.dadosUsados?.periodo_inicio
                ? formatarDataCompleta(corrigirSeculoData(resultado.dadosUsados.periodo_inicio))
                : 'Outubro de 2025'}.
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderizarPrevisoes = () => {
    if (!previsoes || previsoes.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Nenhuma previsão disponível</p>
          <p className="text-sm mt-2">O modelo pode não ter gerado previsões</p>
        </div>
      );
    }

    const previsoesParaExibir = todasPrevisoesVisiveis ? previsoes : previsoes.slice(0, 20);

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Previsões do Modelo {getTipoNome()}</h3>
              <p className="text-gray-600">{getPeriodoCorreto()}</p>
              <p className="text-sm text-gray-500 mt-1">
                Modelo: ARIMA({resultado.dadosUsados?.ordem?.replace(/[()]/g, '').replace(/,/g, ', ') || '1, 1, 1'}) • 
                Frequência: {safeText(resultado.dadosUsados?.frequencia || 'Mensal')}
              </p>
            </div>
            <Badge variant="secondary">{previsoes.length} períodos</Badge>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Período</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Previsão</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Inferior (95%)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Superior (95%)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Intervalo</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previsoesParaExibir.map((previsao, idx) => {
                const previsaoValor = typeof previsao.previsao === 'number' ? previsao.previsao :
                                     typeof previsao.value === 'number' ? previsao.value :
                                     typeof previsao.fitted === 'number' ? previsao.fitted : 0;
                const inferiorValor = typeof previsao.inferior === 'number' ? previsao.inferior :
                                     typeof previsao.lower_95 === 'number' ? previsao.lower_95 :
                                     typeof previsao.lower === 'number' ? previsao.lower : 0;
                const superiorValor = typeof previsao.superior === 'number' ? previsao.superior :
                                     typeof previsao.upper_95 === 'number' ? previsao.upper_95 :
                                     typeof previsao.upper === 'number' ? previsao.upper : 0;
                const intervalo = superiorValor - inferiorValor;

                let dataExibicao;
                if (previsao.data || previsao.Data || previsao.ds) {
                  dataExibicao = formatarDataCompleta(corrigirSeculoData(previsao.data || previsao.Data || previsao.ds));
                } else {
                  const inicioPrevisao = resultado.dadosUsados?.periodo_inicio || '10/2025';
                  const [mesInicioStr, anoInicioStr] = corrigirSeculoData(inicioPrevisao).split('/');
                  let mesInicio = parseInt(mesInicioStr);
                  let anoInicio = parseInt(anoInicioStr);
                  let mesAtual = mesInicio + idx;
                  let anoAtual = anoInicio;
                  while (mesAtual > 12) { mesAtual -= 12; anoAtual += 1; }
                  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
                  dataExibicao = `${meses[mesAtual - 1]} de ${anoAtual}`;
                }

                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">Período {idx + 1}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{dataExibicao}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-blue-700 text-lg">{formatNumber(previsaoValor, 8)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-600">{formatNumber(inferiorValor, 8)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-600">{formatNumber(superiorValor, 8)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500 text-sm">±{formatNumber(intervalo / 2, 2)}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {previsoes.length > 20 && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => setTodasPrevisoesVisiveis(!todasPrevisoesVisiveis)}>
              {todasPrevisoesVisiveis ? '↥ Mostrar resumo' : `↧ Mostrar todas as ${previsoes.length} previsões`}
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderizarMetricas = () => {
    const temMetricasAjuste = Object.keys(metricasAjuste).length > 0;
    const temMetricasPrecisao = Object.keys(metricasPrecisao).length > 0;
    const temMetricasDiagnostico = Object.keys(metricasDiagnostico).length > 0;

    if (!temMetricasAjuste && !temMetricasPrecisao && !temMetricasDiagnostico) {
      const temRMSE = dadosResultado.RMSE !== undefined;
      const temMAPE = dadosResultado.MAPE !== undefined;
      const temMAE = dadosResultado.MAE !== undefined;
      const temAIC = dadosResultado.AIC !== undefined;
      const temBIC = dadosResultado.BIC !== undefined;

      if (!temRMSE && !temMAPE && !temMAE && !temAIC && !temBIC) {
        return (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Nenhuma métrica disponível</p>
            <p className="text-sm mt-2">O modelo pode não ter gerado métricas de avaliação</p>
          </div>
        );
      }

      const metricasDiretas = {
        RMSE: dadosResultado.RMSE,
        MAPE: dadosResultado.MAPE,
        MAE: dadosResultado.MAE,
        AIC: dadosResultado.AIC,
        BIC: dadosResultado.BIC
      };

      return (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="mr-2">🎯</span> Acurácia e Precisão do Modelo
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {metricasDiretas.ME !== undefined && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-800">Erro Médio (ME)</div>
                  <div className="text-2xl font-bold text-blue-700">{formatNumber(metricasDiretas.ME)}</div>
                  <div className="text-xs text-blue-600">Tendência do erro</div>
                </div>
              )}
              {metricasDiretas.RMSE !== undefined && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="text-sm font-medium text-red-800">RMSE</div>
                  <div className="text-2xl font-bold text-red-700">{formatNumber(metricasDiretas.RMSE)}</div>
                  <div className="text-xs text-red-600">Raiz do erro quadrático médio</div>
                </div>
              )}
              {metricasDiretas.MAE !== undefined && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-sm font-medium text-orange-800">MAE</div>
                  <div className="text-2xl font-bold text-orange-700">{formatNumber(metricasDiretas.MAE)}</div>
                  <div className="text-xs text-orange-600">Erro absoluto médio</div>
                </div>
              )}
              {metricasDiretas.MAPE !== undefined && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-sm font-medium text-purple-800">MAPE</div>
                  <div className="text-2xl font-bold text-purple-700">{formatNumber(metricasDiretas.MAPE)}%</div>
                  <div className="text-xs text-purple-600">Erro percentual médio</div>
                </div>
              )}
              {metricasDiretas.AIC !== undefined && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-sm font-medium text-green-800">AIC</div>
                  <div className="text-2xl font-bold text-green-700">{formatNumber(metricasDiretas.AIC, 1)}</div>
                  <div className="text-xs text-green-600">Critério de informação</div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="mr-2">🎯</span> Acurácia e Precisão do Modelo
          </h4>
          {temMetricasPrecisao && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {metricasPrecisao.ME !== undefined && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-800">Erro Médio (ME)</div>
                  <div className="text-2xl font-bold text-blue-700">{formatNumber(metricasPrecisao.ME)}</div>
                  <div className="text-xs text-blue-600">Tendência do erro</div>
                </div>
              )}
              {metricasAjuste.RMSE !== undefined && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="text-sm font-medium text-red-800">RMSE</div>
                  <div className="text-2xl font-bold text-red-700">{formatNumber(metricasAjuste.RMSE)}</div>
                  <div className="text-xs text-red-600">Raiz do erro quadrático médio</div>
                </div>
              )}
              {metricasPrecisao.MAE !== undefined && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-sm font-medium text-orange-800">MAE</div>
                  <div className="text-2xl font-bold text-orange-700">{formatNumber(metricasPrecisao.MAE)}</div>
                  <div className="text-xs text-orange-600">Erro absoluto médio</div>
                </div>
              )}
              {metricasPrecisao.MAPE !== undefined && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-sm font-medium text-purple-800">MAPE</div>
                  <div className="text-2xl font-bold text-purple-700">{formatNumber(metricasPrecisao.MAPE)}%</div>
                  <div className="text-xs text-purple-600">Erro percentual médio</div>
                </div>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Métrica</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Interpretação</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Classificação</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metricasAjuste.RMSE !== undefined && (
                  <tr>
                    <td className="px-6 py-4 font-medium">RMSE</td>
                    <td className="px-6 py-4 font-mono">{formatNumber(metricasAjuste.RMSE)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Raiz do erro quadrático médio</td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        qualidadeAjuste.classificacao_rmse === 'Excelente' ? 'success' :
                        qualidadeAjuste.classificacao_rmse === 'Boa' ? 'primary' :
                        qualidadeAjuste.classificacao_rmse === 'Razoável' ? 'warning' : 'secondary'
                      }>
                        {safeText(qualidadeAjuste.classificacao_rmse || 'N/A')}
                      </Badge>
                    </td>
                  </tr>
                )}
                {metricasAjuste.MAPE !== undefined && (
                  <tr>
                    <td className="px-6 py-4 font-medium">MAPE</td>
                    <td className="px-6 py-4 font-mono">{formatNumber(metricasAjuste.MAPE)}%</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Erro percentual absoluto médio</td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        qualidadeAjuste.classificacao_mape === 'Excelente' ? 'success' :
                        qualidadeAjuste.classificacao_mape === 'Boa' ? 'primary' :
                        qualidadeAjuste.classificacao_mape === 'Razoável' ? 'warning' : 'secondary'
                      }>
                        {safeText(qualidadeAjuste.classificacao_mape || 'N/A')}
                      </Badge>
                    </td>
                  </tr>
                )}
                {metricasAjuste.AIC !== undefined && (
                  <tr>
                    <td className="px-6 py-4 font-medium">AIC</td>
                    <td className="px-6 py-4 font-mono">{formatNumber(metricasAjuste.AIC, 1)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Critério de informação de Akaike</td>
                    <td className="px-6 py-4"><Badge variant="secondary">Critério</Badge></td>
                  </tr>
                )}
                {metricasAjuste.BIC !== undefined && (
                  <tr>
                    <td className="px-6 py-4 font-medium">BIC</td>
                    <td className="px-6 py-4 font-mono">{formatNumber(metricasAjuste.BIC, 1)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Critério de informação bayesiano</td>
                    <td className="px-6 py-4"><Badge variant="secondary">Critério</Badge></td>
                  </tr>
                )}
                {metricasDiagnostico.teste_ljung_box?.valor_p !== undefined && (
                  <tr>
                    <td className="px-6 py-4 font-medium">Teste Ljung-Box</td>
                    <td className="px-6 py-4 font-mono">p-valor: {formatNumber(metricasDiagnostico.teste_ljung_box.valor_p, 4)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {metricasDiagnostico.teste_ljung_box.conclusao || 'Teste de autocorrelação'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={metricasDiagnostico.teste_ljung_box.valor_p > 0.05 ? 'success' : 'error'}>
                        {metricasDiagnostico.teste_ljung_box.valor_p > 0.05 ? 'OK' : 'Atenção'}
                      </Badge>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderizarCoeficientes = () => {
    if (!coeficientes || coeficientes.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Nenhum coeficiente disponível</p>
          <p className="text-sm mt-2">Este modelo não gerou coeficientes parametrizados</p>
        </div>
      );
    }

    return (
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h4 className="text-xl font-bold text-gray-800 mb-6">Coeficientes do Modelo {getTipoNome()}</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Parâmetro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Estimativa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Erro Padrão</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Estatística t</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Significância</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coeficientes.map((coef, idx) => {
                const termo = safeText(coef.termo || coef.parameter || `coef${idx + 1}`);
                const estimativa = formatNumber(coef.estimativa || coef.estimate || coef.coef);
                const erroPadrao = formatNumber(coef.erro_padrao || coef.std_error || coef.se);
                const estatisticaT = formatNumber(coef.estatistica_t || coef.t_value || coef.statistic);
                const pValor = coef.p_valor || coef.pvalue || coef.p_value;
                const significativo = pValor !== undefined && pValor !== null && pValor < 0.05;

                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium font-mono">{termo}</td>
                    <td className="px-6 py-4 font-mono">{estimativa}</td>
                    <td className="px-6 py-4 font-mono">{erroPadrao}</td>
                    <td className="px-6 py-4 font-mono">{estatisticaT}</td>
                    <td className="px-6 py-4">
                      {pValor !== undefined ? (
                        significativo ? (
                          <Badge variant="success">Significativo (p = {formatNumber(pValor, 4)})</Badge>
                        ) : (
                          <Badge variant="secondary">Não significativo (p = {formatNumber(pValor, 4)})</Badge>
                        )
                      ) : (
                        <Badge variant="outline">N/A</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderizarDiagnostico = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h4 className="text-xl font-bold text-gray-800 mb-6">Diagnóstico Completo do Modelo</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-5 rounded-lg">
              <h5 className="font-semibold text-gray-700 mb-3">Status do Modelo</h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fonte:</span>
                  <span className="font-medium">{safeText(resultado.fonte || 'Backend R')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="success">✓ Executado com sucesso</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Observações:</span>
                  <span className="font-mono">{safeText(dadosResultado.n_observacoes || resultado.dadosUsados?.n || historico.length || '119')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Variável analisada:</span>
                  <span className="font-medium">{getNomeVariavel()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frequência:</span>
                  <span className="font-medium">{safeText(resultado.dadosUsados?.frequencia || 'Mensal')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Período histórico:</span>
                  <span className="font-medium">Nov/2015 a Set/2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Período previsto:</span>
                  <span className="font-medium">{getPeriodoCorreto()}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-5 rounded-lg">
              <h5 className="font-semibold text-gray-700 mb-3">Qualidade do Ajuste</h5>
              <div className="space-y-3">
                {metricasDiagnostico.teste_ljung_box?.valor_p !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Teste Ljung-Box:</span>
                    <Badge variant={metricasDiagnostico.teste_ljung_box.valor_p > 0.05 ? 'success' : 'error'}>
                      {metricasDiagnostico.teste_ljung_box.valor_p > 0.05 ? 'Resíduos OK' : 'Resíduos correlacionados'}
                    </Badge>
                  </div>
                )}
                {metricasAjuste.MAPE !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Precisão (MAPE):</span>
                    <Badge variant={
                      metricasAjuste.MAPE < 10 ? 'success' :
                      metricasAjuste.MAPE < 20 ? 'primary' :
                      metricasAjuste.MAPE < 50 ? 'warning' : 'error'
                    }>
                      {formatNumber(metricasAjuste.MAPE)}%
                    </Badge>
                  </div>
                )}
                {dadosResultado.RMSE !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">RMSE:</span>
                    <Badge variant={
                      dadosResultado.RMSE < (metricasAjuste.valor_medio * 0.1) ? 'success' :
                      dadosResultado.RMSE < (metricasAjuste.valor_medio * 0.2) ? 'primary' :
                      dadosResultado.RMSE < (metricasAjuste.valor_medio * 0.5) ? 'warning' : 'error'
                    }>
                      {formatNumber(dadosResultado.RMSE)}
                    </Badge>
                  </div>
                )}
                {resumoModelo.convergiu !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Convergência:</span>
                    <Badge variant={resumoModelo.convergiu ? 'success' : 'error'}>
                      {resumoModelo.convergiu ? 'Convergiu' : 'Não convergiu'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderizarGraficos = () => {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Visualizações Gráficas</h3>
              <p className="text-gray-600">Análise visual dos resultados do modelo {getTipoNome()}</p>
            </div>
            <Badge variant="info" className="bg-indigo-100 text-indigo-800 border-indigo-300">
              {Object.keys(dadosResultado).length} conjuntos de dados
            </Badge>
          </div>
        </div>

        <GraficosSeriesTemporais dados={dadosGraficos} tipoModelo={tipoModelo} />
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">⏰ Resultados de Série Temporal - {getTipoNome()}</CardTitle>
              <CardDescription className="mt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span>Modelo: {safeText(resultado.nome || 'Análise de Série Temporal')}</span>
                  <span className="hidden md:inline">•</span>
                  <span>Executado em: {resultado.timestamp ? new Date(resultado.timestamp).toLocaleString('pt-BR') : 'Data não disponível'}</span>
                  {resultado.fonte && (
                    <>
                      <span className="hidden md:inline">•</span>
                      <Badge variant="outline" className="text-blue-600 border-blue-300">{safeText(resultado.fonte)}</Badge>
                    </>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-600">📅 Período previsto: {getPeriodoCorreto()}</div>
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={onVoltar}>⚙️ Configuração</Button>
              <Button onClick={onNovoModelo}>🆕 Novo Modelo</Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex border-b border-gray-200 overflow-x-auto">
        {[
          { id: 'interpretacao', label: 'Interpretação', icon: '📋' },
          { id: 'previsoes', label: 'Previsões', icon: '🔮' },
          { id: 'metricas', label: 'Métricas', icon: '📊' },
          { id: 'coeficientes', label: 'Coeficientes', icon: 'β' },
          { id: 'diagnostico', label: 'Diagnóstico', icon: '🔍' },
          { id: 'graficos', label: 'Gráficos', icon: '📈' }
        ].map(aba => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className={`px-5 py-3 font-medium whitespace-nowrap flex items-center gap-2 transition-all ${
              abaAtiva === aba.id ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>{aba.icon}</span>
            <span>{aba.label}</span>
          </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        {abaAtiva === 'interpretacao' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {renderizarInterpretacaoTecnica()}
          </motion.div>
        )}
        {abaAtiva === 'previsoes' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1 }}>
            {renderizarPrevisoes()}
          </motion.div>
        )}
        {abaAtiva === 'metricas' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.2 }}>
            {renderizarMetricas()}
          </motion.div>
        )}
        {abaAtiva === 'coeficientes' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.3 }}>
            {renderizarCoeficientes()}
          </motion.div>
        )}
        {abaAtiva === 'diagnostico' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.4 }}>
            {renderizarDiagnostico()}
          </motion.div>
        )}
        {abaAtiva === 'graficos' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.5 }}>
            {renderizarGraficos()}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}