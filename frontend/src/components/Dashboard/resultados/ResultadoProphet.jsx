import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, TrendingUp, TrendingDown, 
  Activity, BarChart2, Calendar, Target 
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../componentes/Card';
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

      const dadosAjustados = ajustados.map(item => ({
        data: item.data || item.ds,
        valor: parseFloat(item.valor || item.yhat) || 0,
        tipo: 'ajustado'
      }));

      const dadosPrevisoes = previsoes.map(item => ({
        data: item.data || item.ds,
        previsao: parseFloat(item.previsao || item.yhat) || 0,
        inferior: parseFloat(item.inferior || item.yhat_lower) || 0,
        superior: parseFloat(item.superior || item.yhat_upper) || 0,
        tipo: 'previsao'
      }));

      const dadosHistoricos = dados_originais?.dados?.map(item => ({
        data: item.data || item.ds,
        valor: parseFloat(item.valor || item.y) || 0,
        tipo: 'historico'
      })) || [];

      const residuosProcessados = residuos.map((r, i) => ({
        periodo: i + 1,
        residuo: parseFloat(r) || 0
      }));

      const metricasProcessadas = {
        mse: metricas.mse,
        rmse: metricas.rmse,
        mae: metricas.mae,
        mape: metricas.mape,
        r2: metricas.r2
      };

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

  const ordenarPorData = (array) => {
    if (!array || !Array.isArray(array)) return [];
    return [...array].sort((a, b) => {
      const ta = obterTimestamp(a.data);
      const tb = obterTimestamp(b.data);
      return ta - tb;
    });
  };

  const dadosPrevisoesHistorico = () => {
    if (!dadosProcessados || (!dadosProcessados.dadosHistoricos?.length && !dadosProcessados.dadosPrevisoes?.length)) return null;

    const { dadosHistoricos, dadosPrevisoes, dadosAjustados, nomeSerie } = dadosProcessados;

    const todasDatas = new Set();
    dadosHistoricos.forEach(item => todasDatas.add(item.data));
    dadosAjustados.forEach(item => todasDatas.add(item.data));
    dadosPrevisoes.forEach(item => todasDatas.add(item.data));

    const datasOrdenadas = Array.from(todasDatas).sort((a, b) => obterTimestamp(a) - obterTimestamp(b));
    const labels = datasOrdenadas.map(d => formatarDataGrafico(d));

    const historicoMap = new Map(dadosHistoricos.map(d => [d.data, d.valor]));
    const ajustadosMap = new Map(dadosAjustados.map(d => [d.data, d.valor]));
    const previsoesMap = new Map(dadosPrevisoes.map(d => [d.data, d.previsao]));
    const inferiorMap = new Map(dadosPrevisoes.map(d => [d.data, d.inferior]));
    const superiorMap = new Map(dadosPrevisoes.map(d => [d.data, d.superior]));

    const datasets = [];

    if (dadosHistoricos.length) {
      datasets.push({
        label: 'Dados Históricos',
        data: datasOrdenadas.map(d => historicoMap.get(d) ?? null),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 6,
        order: 1
      });
    }

    if (dadosAjustados.length) {
      datasets.push({
        label: 'Modelo Ajustado',
        data: datasOrdenadas.map(d => ajustadosMap.get(d) ?? null),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2,
        borderDash: [3, 3],
        fill: false,
        tension: 0.1,
        pointRadius: 2,
        order: 2
      });
    }

    if (dadosPrevisoes.length) {
      datasets.push({
        label: 'Previsões Futuras',
        data: datasOrdenadas.map(d => previsoesMap.get(d) ?? null),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.2,
        pointRadius: 4,
        pointHoverRadius: 8,
        order: 3
      });

      const temIntervalos = dadosPrevisoes.some(p => p.inferior !== null && p.superior !== null);
      if (temIntervalos) {
        datasets.push({
          label: 'Limite Superior (95%)',
          data: datasOrdenadas.map(d => superiorMap.get(d) ?? null),
          borderColor: 'rgba(239, 68, 68, 0.5)',
          backgroundColor: 'rgba(0,0,0,0)',
          borderWidth: 1,
          borderDash: [2, 2],
          fill: false,
          tension: 0,
          pointRadius: 0,
          order: 4
        });

        datasets.push({
          label: 'Limite Inferior (95%)',
          data: datasOrdenadas.map(d => inferiorMap.get(d) ?? null),
          borderColor: 'rgba(239, 68, 68, 0.5)',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderWidth: 1,
          borderDash: [2, 2],
          fill: { target: '+1', above: 'rgba(239, 68, 68, 0.2)' },
          tension: 0,
          pointRadius: 0,
          order: 5
        });
      }
    }

    return {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `📈 ${nomeSerie} - Previsões Prophet`,
            font: { size: 16, weight: 'bold' }
          },
          legend: { position: 'top', labels: { usePointStyle: true } },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              title: (items) => items[0]?.label || 'Período',
              label: (ctx) => {
                const label = ctx.dataset.label;
                const value = ctx.parsed.y;
                if (label.includes('Limite')) return `${label}: ${value.toFixed(4)}`;
                return `${label}: ${value.toFixed(4)}`;
              },
              afterBody: (items) => {
                const idx = items[0]?.dataIndex;
                if (idx === undefined) return [];
                const data = datasOrdenadas[idx];
                const prev = dadosPrevisoes.find(p => p.data === data);
                if (prev && prev.inferior && prev.superior) {
                  return [
                    `Intervalo: ${prev.inferior.toFixed(4)} - ${prev.superior.toFixed(4)}`,
                    `Amplitude: ${(prev.superior - prev.inferior).toFixed(4)}`
                  ];
                }
                return [];
              }
            }
          }
        },
        scales: {
          x: { title: { display: true, text: 'Período' }, ticks: { maxRotation: 45 } },
          y: { title: { display: true, text: 'Valor' } }
        },
        interaction: { intersect: false, mode: 'index' },
        animation: { duration: 1000, easing: 'easeOutQuart' },
        spanGaps: true
      }
    };
  };

  const dadosTendenciaDetalhada = () => {
    if (!dadosProcessados?.dadosHistoricos || dadosProcessados.dadosHistoricos.length < 10) return null;

    const { dadosHistoricos, dadosAjustados } = dadosProcessados;
    const dadosOrdenados = ordenarPorData(dadosHistoricos);
    const valores = dadosOrdenados.map(d => d.valor);
    const labels = dadosOrdenados.map(d => formatarDataGrafico(d.data));

    const mediaMovel = [];
    for (let i = 0; i < valores.length; i++) {
      if (i >= 4) {
        const soma = valores.slice(i-4, i+1).reduce((a, b) => a + b, 0);
        mediaMovel.push(soma / 5);
      } else {
        mediaMovel.push(null);
      }
    }

    const n = valores.length;
    const somaX = valores.reduce((s, _, i) => s + i, 0);
    const somaY = valores.reduce((s, v) => s + v, 0);
    const somaXY = valores.reduce((s, v, i) => s + v * i, 0);
    const somaX2 = valores.reduce((s, _, i) => s + i * i, 0);
    const b = (n * somaXY - somaX * somaY) / (n * somaX2 - somaX * somaX);
    const a = (somaY - b * somaX) / n;
    const linhaTendencia = Array(n).fill(0).map((_, i) => a + b * i);

    const ajustadosOrdenados = ordenarPorData(dadosAjustados);
    const ajustadosValores = ajustadosOrdenados.map(d => d.valor);

    return {
      type: 'line',
      data: {
        labels,
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
          title: { display: true, text: '📊 Análise Detalhada de Tendência', font: { size: 16, weight: 'bold' } },
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

  const dadosComponentes = () => {
    if (!dadosProcessados?.componentes?.tendencia?.length) return null;

    const { componentes, nomeSerie } = dadosProcessados;
    const tendencia = componentes.tendencia;
    const labels = tendencia.map(t => formatarDataGrafico(t.data || t.ds));
    const valores = tendencia.map(t => parseFloat(t.valor || t.trend) || 0);

    return {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Tendência',
          data: valores,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.3,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: `📊 ${nomeSerie} - Componentes do Modelo Prophet`, font: { size: 16, weight: 'bold' } },
          legend: { position: 'top', labels: { usePointStyle: true } },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          x: { title: { display: true, text: 'Período' }, ticks: { maxRotation: 45 } },
          y: { title: { display: true, text: 'Valor da Tendência' } }
        },
        interaction: { intersect: false, mode: 'index' },
        animation: { duration: 1000, easing: 'easeOutQuart' }
      }
    };
  };

  const dadosMetricas = () => {
    if (!dadosProcessados?.metricas) return null;

    const { metricas } = dadosProcessados;
    const metricasArray = [];
    if (metricas.rmse !== undefined) metricasArray.push({ label: 'RMSE', valor: Math.abs(metricas.rmse) });
    if (metricas.mae !== undefined) metricasArray.push({ label: 'MAE', valor: metricas.mae });
    if (metricas.mape !== undefined) metricasArray.push({ label: 'MAPE', valor: metricas.mape });
    if (metricas.mse !== undefined) metricasArray.push({ label: 'MSE', valor: metricas.mse });
    if (metricas.r2 !== undefined) metricasArray.push({ label: 'R²', valor: metricas.r2 });
    if (metricasArray.length === 0) return null;

    metricasArray.sort((a, b) => b.valor - a.valor);

    return {
      type: 'bar',
      data: {
        labels: metricasArray.map(m => m.label),
        datasets: [{
          label: 'Valor',
          data: metricasArray.map(m => m.valor),
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(168, 85, 247, 0.8)'
          ],
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          title: { display: true, text: '🎯 Métricas de Performance do Prophet', font: { size: 16, weight: 'bold' } },
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const metrica = metricasArray[ctx.dataIndex];
                const valor = ctx.parsed.x;
                const suf = metrica.label.includes('MAPE') ? '%' : '';
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
    const valores = residuos.map(r => r.residuo);
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const desvio = Math.sqrt(valores.reduce((s, r) => s + (r - media) ** 2, 0) / valores.length);
    const limites = valores.map(() => 2 * desvio);
    const labels = residuos.map(r => `Resíduo ${r.periodo}`);

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Resíduos',
            data: valores,
            backgroundColor: valores.map(v => Math.abs(v) > 2 * desvio ? 'rgba(239, 68, 68, 0.7)' : 'rgba(59, 130, 246, 0.7)'),
            borderColor: valores.map(v => Math.abs(v) > 2 * desvio ? 'rgb(185, 28, 28)' : 'rgb(29, 78, 216)'),
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Limites (±2σ)',
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
          title: { display: true, text: '🔍 Análise de Resíduos do Prophet', font: { size: 16, weight: 'bold' } },
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

  const dadosComparacaoPrevisoes = () => {
    if (!dadosProcessados?.dadosPrevisoes || dadosProcessados.dadosPrevisoes.length === 0) return null;

    const { dadosPrevisoes } = dadosProcessados;
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
            borderColor: 'rgba(239, 68, 68, 0.5)',
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
            borderColor: 'rgba(239, 68, 68, 0.5)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
          title: { display: true, text: '🔮 Previsões Futuras com Intervalos de Confiança', font: { size: 16, weight: 'bold' } },
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

  const renderizarGrafico = () => {
    if (carregando) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
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
      comparacao: dadosComparacaoPrevisoes(),
      metricas: dadosMetricas(),
      residuos: dadosResiduos()
    };

    const graficoAtual = graficos[graficoAtivo];
    if (!graficoAtual) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-3xl mb-2">🔮</div>
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

  const graficosDisponiveis = [
    { id: 'previsoes', label: '📈 Previsões', disponivel: !!dadosPrevisoesHistorico() },
    { id: 'tendencia', label: '📉 Tendência', disponivel: !!dadosTendenciaDetalhada() },
    { id: 'componentes', label: '🔧 Componentes', disponivel: !!dadosComponentes() },
    { id: 'comparacao', label: '🎯 Intervalos', disponivel: !!dadosComparacaoPrevisoes() },
    { id: 'metricas', label: '📊 Métricas', disponivel: !!dadosMetricas() },
    { id: 'residuos', label: '🔍 Resíduos', disponivel: !!dadosResiduos() }
  ].filter(g => g.disponivel);

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
        <p className="text-gray-600">Carregando gráficos do Prophet...</p>
      </div>
    );
  }

  if (!dadosProcessados || graficosDisponiveis.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🔮</div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">Dados insuficientes para gráficos</h3>
        <p className="text-gray-500">Execute o modelo Prophet com dados válidos para visualizar os gráficos</p>
      </div>
    );
  }

  const { nomeSerie, metricas } = dadosProcessados;

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
                 grafico.id === 'metricas' ? 'Performance' : 'Análise de Resíduos'}
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
              <button onClick={exportarGrafico} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                📥 Exportar como PNG
              </button>
              <div className="text-xs text-gray-500">💡 Passe o mouse sobre os pontos/barras para ver detalhes</div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-sm font-medium text-purple-700 mb-2">💡 Interpretação</div>
            <div className="text-sm text-purple-600 space-y-2">
              {graficoAtivo === 'previsoes' && (
                <>
                  <p>Compara dados históricos, ajuste do modelo e previsões futuras.</p>
                  <p><strong>Linha azul:</strong> Dados históricos.</p>
                  <p><strong>Linha laranja tracejada:</strong> Modelo ajustado.</p>
                  <p><strong>Linha vermelha:</strong> Previsões com intervalo de confiança.</p>
                </>
              )}
              {graficoAtivo === 'tendencia' && (
                <>
                  <p>Análise detalhada da tendência.</p>
                  <p><strong>Linha azul:</strong> Valores históricos.</p>
                  <p><strong>Linha laranja:</strong> Média móvel (5 períodos).</p>
                  <p><strong>Linha vermelha tracejada:</strong> Tendência linear.</p>
                  <p><strong>Linha verde tracejada:</strong> Ajuste do Prophet.</p>
                </>
              )}
              {graficoAtivo === 'componentes' && (
                <>
                  <p>Componente de tendência do modelo Prophet.</p>
                  <p>Mostra a direção geral de longo prazo da série.</p>
                </>
              )}
              {graficoAtivo === 'comparacao' && (
                <>
                  <p>Previsões pontuais com intervalos de confiança de 95%.</p>
                  <p><strong>Linha verde:</strong> Previsão mais provável.</p>
                  <p><strong>Área sombreada:</strong> Intervalo de confiança.</p>
                </>
              )}
              {graficoAtivo === 'metricas' && (
                <>
                  <p>Desempenho do modelo.</p>
                  <p><strong>MAPE:</strong> Erro percentual médio (ideal &lt; 10%).</p>
                  <p><strong>RMSE/MAE:</strong> Medidas de erro absoluto.</p>
                  <p><strong>R²:</strong> Variação explicada pelo modelo (0-1).</p>
                </>
              )}
              {graficoAtivo === 'residuos' && (
                <>
                  <p>Avalia a qualidade do ajuste.</p>
                  <p><strong>Resíduos dentro de ±2σ:</strong> Bom ajuste.</p>
                  <p><strong>Padrão aleatório:</strong> Modelo bem especificado.</p>
                </>
              )}
            </div>
          </div>

          <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
            <div className="text-sm font-medium text-pink-700 mb-2">🔮 Informações do Prophet</div>
            <div className="text-sm text-pink-600 space-y-1">
              <div className="flex justify-between"><span>Modelo:</span><span className="font-medium">Prophet</span></div>
              <div className="flex justify-between"><span>Série:</span><span className="font-medium truncate">{nomeSerie}</span></div>
              {metricas.mape !== undefined && (
                <div className="flex justify-between"><span>MAPE:</span><span className="font-medium">{metricas.mape.toFixed(1)}%</span></div>
              )}
              {metricas.rmse !== undefined && (
                <div className="flex justify-between"><span>RMSE:</span><span className="font-medium">{metricas.rmse.toFixed(2)}</span></div>
              )}
              {dadosProcessados.dadosHistoricos && (
                <div className="flex justify-between"><span>Observações:</span><span className="font-medium">{dadosProcessados.dadosHistoricos.length}</span></div>
              )}
              {dadosProcessados.dadosPrevisoes && (
                <div className="flex justify-between"><span>Previsões:</span><span className="font-medium">{dadosProcessados.dadosPrevisoes.length}</span></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SimpleTabs = ({ tabs, defaultTab, className, children }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  return (
    <div className={className}>
      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium flex items-center gap-2 ${
              activeTab === tab.id ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">{children(activeTab)}</div>
    </div>
  );
};

export default function ResultadoProphet({ resultado, onVoltar, onNovoModelo }) {
  if (!resultado) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Nenhum resultado disponível</p>
        <Button onClick={onVoltar} className="mt-4">Voltar para configuração</Button>
      </div>
    );
  }

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

  if (previsoes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800">⚠️ Sem dados de previsão</h3>
          <p className="text-yellow-700 mt-2">O modelo foi executado, mas não retornou previsões.</p>
          <Button onClick={onVoltar} className="mt-4">Voltar para Configuração</Button>
        </div>
      </div>
    );
  }

  const estatisticas = {
    mediaPrevisao: previsoes.length ? previsoes.reduce((sum, p) => sum + p.previsao, 0) / previsoes.length : 0,
    amplitudeMedia: previsoes.length ? previsoes.reduce((sum, p) => sum + p.amplitude, 0) / previsoes.length : 0,
    crescimentoPercentual: previsoes.length >= 2 
      ? ((previsoes[previsoes.length - 1].previsao - previsoes[0].previsao) / Math.abs(previsoes[0].previsao || 1)) * 100 
      : 0
  };

  const formatarNumero = (num) => num == null ? 'N/A' : Number(num).toFixed(2);
  const formatarNumeroPreciso = (num) => num == null ? 'N/A' : Number(num).toFixed(8);
  const formatarIntervalo = (amp) => amp == null ? 'N/A' : `±${(amp / 2).toFixed(2)}`;

  const traduzirFrequencia = (freq) => {
    const t = {
      day: 'Diária', week: 'Semanal', month: 'Mensal', quarter: 'Trimestral', year: 'Anual',
      daily: 'Diária', weekly: 'Semanal', monthly: 'Mensal', quarterly: 'Trimestral', yearly: 'Anual'
    };
    return t[freq?.toLowerCase()] || freq || 'Mensal';
  };

  const traduzirSazonalidade = (saz) => {
    const t = { additive: 'Aditiva', multiplicative: 'Multiplicativa', auto: 'Automática', none: 'Nenhuma' };
    return t[saz?.toLowerCase()] || saz || 'Aditiva';
  };

  const exportarCSV = () => {
    const csvData = [
      ['Período', 'Data', 'Previsão', 'Inferior (95%)', 'Superior (95%)', 'Intervalo (±)'],
      ...previsoes.map((p, i) => [
        `Período ${p.periodo || i+1}`,
        formatarDataCompleta(p.data_completa || p.data),
        formatarNumeroPreciso(p.previsao),
        formatarNumeroPreciso(p.inferior),
        formatarNumeroPreciso(p.superior),
        formatarIntervalo(p.amplitude)
      ])
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `prophet_previsoes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const prepararDadosParaGraficos = () => {
    if (!resultado) return null;
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

  const tabs = [
    { id: 'previsoes', label: 'Previsões', icon: '🔮' },
    { id: 'metricas', label: 'Métricas', icon: '📊' },
    { id: 'diagnostico', label: 'Diagnóstico', icon: '🔍' },
    { id: 'graficos', label: 'Gráficos', icon: '📈' }
  ];

  const formatarDataSimples = (data) => formatarDataCompleta(data);

  const renderizarGraficos = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Visualizações Gráficas do Prophet</h3>
            <p className="text-gray-600">Análise visual dos resultados do modelo Prophet (Facebook)</p>
          </div>
          <Badge variant="info" className="bg-purple-100 text-purple-800 border-purple-300">🔮 Análise Prophet</Badge>
        </div>
      </div>
      {dadosGraficos ? <GraficosProphet dados={dadosGraficos} tipoModelo="prophet" /> : (
        <div className="text-center py-12"><div className="text-4xl mb-4">🔮</div><p className="text-gray-500">Dados insuficientes para gráficos</p></div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onVoltar} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Voltar para configuração">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">🔮 Resultados do Prophet</h1>
            <p className="text-gray-600">
              {interpretacao_tecnica.variavel || 'Variável'} • {modelo_info.crescimento || 'Linear'} • {traduzirFrequencia(interpretacao_tecnica.frequencia)}
            </p>
          </div>
        </div>
        <Button onClick={onNovoModelo} variant="primary" size="sm">Novo Modelo</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-blue-600 font-medium">Média das Previsões</p><h3 className="text-2xl font-bold text-blue-800 mt-1">{formatarNumero(estatisticas.mediaPrevisao)}</h3></div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-purple-600 font-medium">Amplitude Média</p><h3 className="text-2xl font-bold text-purple-800 mt-1">{formatarNumero(estatisticas.amplitudeMedia)}</h3></div>
              <BarChart2 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className={`bg-gradient-to-br ${estatisticas.crescimentoPercentual >= 0 ? 'from-green-50 to-green-100' : 'from-red-50 to-red-100'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-600 font-medium">Crescimento Total</p><h3 className={`text-2xl font-bold mt-1 ${estatisticas.crescimentoPercentual >= 0 ? 'text-green-800' : 'text-red-800'}`}>{estatisticas.crescimentoPercentual.toFixed(1)}%</h3></div>
              {estatisticas.crescimentoPercentual >= 0 ? <TrendingUp className="w-8 h-8 text-green-600" /> : <TrendingDown className="w-8 h-8 text-red-600" />}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-orange-600 font-medium">Qualidade do Ajuste</p><h3 className="text-2xl font-bold text-orange-800 mt-1">{qualidade_ajuste.classificacao_mape || 'N/A'}</h3></div>
              <Target className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-xs text-orange-700 mt-2">MAPE: {qualidade_ajuste.mape_valor ? qualidade_ajuste.mape_valor.toFixed(1) + '%' : 'N/A'}</p>
          </CardContent>
        </Card>
      </div>

      <SimpleTabs tabs={tabs} defaultTab="previsoes" className="mb-6">
        {(activeTab) => (
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {activeTab === 'previsoes' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Previsões Futuras - Prophet</CardTitle>
                      <p className="text-sm text-gray-600">Intervalo de confiança: {modelo_info.intervalo_confianca ? `${(modelo_info.intervalo_confianca * 100).toFixed(0)}%` : '95%'}</p>
                    </div>
                    <Badge variant="success">{previsoes.length} períodos previstos</Badge>
                  </div>
                </CardHeader>
                <CardContent>
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
                        {previsoes.map((p, idx) => {
                          const intervalo = p.amplitude ? (p.amplitude / 2).toFixed(2) : 'N/A';
                          return (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap"><span className="font-medium text-gray-800">Período {p.periodo || idx + 1}</span></td>
                              <td className="px-6 py-4 whitespace-nowrap"><span className="text-gray-700">{formatarDataSimples(p.data_completa || p.data)}</span></td>
                              <td className="px-6 py-4 whitespace-nowrap"><span className="font-bold text-blue-700">{formatarNumeroPreciso(p.previsao)}</span></td>
                              <td className="px-6 py-4 whitespace-nowrap"><span className="text-gray-600">{formatarNumeroPreciso(p.inferior)}</span></td>
                              <td className="px-6 py-4 whitespace-nowrap"><span className="text-gray-600">{formatarNumeroPreciso(p.superior)}</span></td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-1 mr-2"><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((p.amplitude || 0) / (Math.abs(p.previsao) || 1)) * 10)}%` }} /></div></div>
                                  <span className="text-sm font-medium text-gray-700">±{intervalo}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3">📊 Resumo das Previsões</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center"><p className="text-sm text-gray-600">Valor Mínimo Previsto</p><p className="text-xl font-bold text-blue-700">{previsoes.length ? formatarNumeroPreciso(Math.min(...previsoes.map(p => p.previsao || 0))) : 'N/A'}</p></div>
                      <div className="text-center"><p className="text-sm text-gray-600">Valor Máximo Previsto</p><p className="text-xl font-bold text-green-700">{previsoes.length ? formatarNumeroPreciso(Math.max(...previsoes.map(p => p.previsao || 0))) : 'N/A'}</p></div>
                      <div className="text-center"><p className="text-sm text-gray-600">Amplitude Média Relativa</p><p className="text-xl font-bold text-purple-700">{previsoes.length && estatisticas.mediaPrevisao !== 0 ? `${((estatisticas.amplitudeMedia / Math.abs(estatisticas.mediaPrevisao)) * 100).toFixed(1)}%` : 'N/A'}</p></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'metricas' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle>📐 Métricas de Desempenho</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { label: 'MSE (Erro Quadrático Médio)', value: metricas.mse, color: 'blue' },
                        { label: 'RMSE (Raiz do Erro Quadrático)', value: metricas.rmse, color: 'purple' },
                        { label: 'MAE (Erro Absoluto Médio)', value: metricas.mae, color: 'green' },
                        { label: 'MAPE (Erro Percentual Absoluto Médio)', value: metricas.mape, color: 'orange' }
                      ].map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700">{m.label}</span>
                          <span className={`font-bold text-${m.color}-600`}>
                            {m.value !== undefined ? formatarNumero(m.value) : 'N/A'}
                            {m.label.includes('MAPE') && m.value !== undefined && '%'}
                          </span>
                        </div>
                      ))}
                    </div>
                    {metricas.mape !== undefined && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                        <h4 className="font-semibold text-orange-800 mb-2">🎯 Interpretação do MAPE</h4>
                        <div className="text-sm text-gray-700">
                          {metricas.mape < 10 && <p>✅ <strong>Excelente previsão</strong> (MAPE &lt; 10%)</p>}
                          {metricas.mape >= 10 && metricas.mape < 20 && <p>👍 <strong>Boa previsão</strong> (MAPE 10-20%)</p>}
                          {metricas.mape >= 20 && metricas.mape < 50 && <p>⚠️ <strong>Previsão razoável</strong> (MAPE 20-50%)</p>}
                          {metricas.mape >= 50 && <p>❌ <strong>Baixa precisão</strong> (MAPE &gt; 50%)</p>}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>📊 Estatísticas dos Dados</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-blue-600 font-medium">Período Histórico</p>
                          <p className="text-lg font-bold text-blue-800">{formatarDataCompleta(interpretacao_tecnica.primeira_data) || 'N/A'}</p>
                          <p className="text-xs text-blue-700">Primeira observação</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-sm text-green-600 font-medium">Período Histórico</p>
                          <p className="text-lg font-bold text-green-800">{formatarDataCompleta(interpretacao_tecnica.ultima_data) || 'N/A'}</p>
                          <p className="text-xs text-green-700">Última observação</p>
                        </div>
                      </div>
                      {[
                        { label: 'Número de Observações', value: interpretacao_tecnica.n_observacoes, icon: '📈' },
                        { label: 'Média dos Dados', value: dados_originais.media, icon: '📊' },
                        { label: 'Desvio Padrão', value: dados_originais.desvio_padrao, icon: '📐' },
                        { label: 'Valor Mínimo', value: dados_originais.minimo, icon: '📉' },
                        { label: 'Valor Máximo', value: dados_originais.maximo, icon: '📈' }
                      ].map((s, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3"><span className="text-xl">{s.icon}</span><span className="text-gray-700">{s.label}</span></div>
                          <span className="font-bold text-gray-900">{s.value !== undefined ? formatarNumero(s.value) : 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'diagnostico' && (
              <Card>
                <CardHeader><CardTitle>🔍 Diagnóstico do Modelo Prophet</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-800">Configuração do Modelo</h4>
                      <div className="space-y-3">
                        {[
                          { label: 'Tipo de Crescimento', value: modelo_info.crescimento || 'Linear' },
                          { label: 'Intervalo de Confiança', value: `${((modelo_info.intervalo_confianca || 0.95) * 100).toFixed(0)}%` },
                          { label: 'Frequência da Série', value: traduzirFrequencia(interpretacao_tecnica.frequencia) },
                          { label: 'Feriados Incluídos', value: modelo_info.feriados_incluidos ? 'Sim' : 'Não' },
                          { label: 'Sazonalidade', value: traduzirSazonalidade(modelo_info.sazonalidade) },
                          { label: 'Períodos Previstos', value: periodo_previsao.n_periodos || previsoes.length }
                        ].map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                            <span className="text-gray-600">{item.label}</span>
                            <Badge variant="outline">{item.value}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-4">💡 Recomendações</h4>
                      <div className="space-y-3">
                        {estatisticas.amplitudeMedia > Math.abs(estatisticas.mediaPrevisao) * 0.3 && (
                          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg"><p className="text-yellow-800 font-medium">⚠️ Alta Incerteza</p><p className="text-sm text-yellow-700">Intervalos de confiança muito amplos. Considere aumentar o número de observações históricas.</p></div>
                        )}
                        {metricas.mape > 50 && (
                          <div className="bg-red-50 border border-red-200 p-3 rounded-lg"><p className="text-red-800 font-medium">❌ Baixa Precisão</p><p className="text-sm text-red-700">MAPE acima de 50%. Considere transformar os dados ou ajustar hiperparâmetros.</p></div>
                        )}
                        {residuos.some(r => Math.abs(r) > (Math.abs(dados_originais.media || 1) * 0.5)) && (
                          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg"><p className="text-blue-800 font-medium">📅 Outliers Detectados</p><p className="text-sm text-blue-700">Resíduos grandes sugerem eventos atípicos.</p></div>
                        )}
                        {(interpretacao_tecnica.n_observacoes || 0) < 24 && (
                          <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg"><p className="text-purple-800 font-medium">📊 Poucas Observações</p><p className="text-sm text-purple-700">Menos de 24 observações. Prophet funciona melhor com séries mais longas.</p></div>
                        )}
                        <div className="bg-green-50 border border-green-200 p-3 rounded-lg"><p className="text-green-800 font-medium">✅ Pontos Fortes do Prophet</p><p className="text-sm text-green-700">Excelente com sazonalidades múltiplas, robusto a dados faltantes, interpretação direta das tendências.</p></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'graficos' && renderizarGraficos()}
          </motion.div>
        )}
      </SimpleTabs>

      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <Button onClick={onVoltar} variant="outline">⬅️ Voltar para Configuração</Button>
        <Button onClick={onNovoModelo} variant="primary">🔮 Criar Novo Modelo</Button>
      </div>
    </div>
  );
}