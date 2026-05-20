// frontend/src/components/Dashboard/resultados/ResultadoProphet.jsx

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, TrendingUp, TrendingDown, 
  Activity, BarChart2, Calendar, Target,
  AlertTriangle, CheckCircle, Info, Eye, FileText, Printer
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../componentes/Card';
import {
  formatarDataCompleta,
  formatarDataGrafico,
  obterTimestamp
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
import { Bar, Line } from 'react-chartjs-2';

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

// ==================== COMPONENTE DE GRÁFICOS ====================

const GraficosProphet = ({ dados, tipoModelo }) => {
  const [graficoAtivo, setGraficoAtivo] = useState('previsoes');
  const [dadosProcessados, setDadosProcessados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!dados) {
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
      
      const dadosAjustados = (ajustados || []).map((item, idx) => ({
        data: item.data || item.ds || idx,
        valor: parseFloat(item.valor || item.yhat || 0) || 0,
        tipo: 'ajustado'
      }));

      const dadosPrevisoes = (previsoes || []).map((item, idx) => ({
        data: item.data || item.ds || idx,
        previsao: parseFloat(item.previsao || item.yhat || 0) || 0,
        inferior: parseFloat(item.inferior || item.yhat_lower || 0) || 0,
        superior: parseFloat(item.superior || item.yhat_upper || 0) || 0,
        tipo: 'previsao'
      }));

      let dadosHistoricos = [];
      if (dados_originais?.dados && Array.isArray(dados_originais.dados)) {
        dadosHistoricos = dados_originais.dados.map((item, idx) => ({
          data: item.data || item.ds || idx,
          valor: parseFloat(item.valor || item.y || 0) || 0,
          tipo: 'historico'
        }));
      } else if (dados_originais?.historico && Array.isArray(dados_originais.historico)) {
        dadosHistoricos = dados_originais.historico.map((valor, idx) => ({
          data: dados_originais.datas?.[idx] || idx,
          valor: parseFloat(valor) || 0,
          tipo: 'historico'
        }));
      }

      const residuosProcessados = (residuos || []).map((r, i) => ({
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

      setDadosProcessados({
        dadosHistoricos,
        dadosAjustados,
        dadosPrevisoes,
        residuos: residuosProcessados,
        metricas: metricasProcessadas,
        interpretacao: interpretacao_tecnica,
        periodoPrevisao: periodo_previsao,
        nomeSerie: interpretacao_tecnica?.variavel || 'Prophet'
      });
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
      const ta = typeof a.data === 'number' ? a.data : new Date(a.data).getTime();
      const tb = typeof b.data === 'number' ? b.data : new Date(b.data).getTime();
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
          title: { display: true, text: `📈 ${nomeSerie} - Previsões Prophet`, font: { size: 16, weight: 'bold' } },
          legend: { position: 'top', labels: { usePointStyle: true } },
          tooltip: { mode: 'index', intersect: false }
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

  const dadosMetricas = () => {
    if (!dadosProcessados?.metricas) return null;

    const { metricas } = dadosProcessados;
    const metricasArray = [];
    if (metricas.rmse !== undefined && !isNaN(metricas.rmse)) metricasArray.push({ label: 'RMSE', valor: Math.abs(metricas.rmse) });
    if (metricas.mae !== undefined && !isNaN(metricas.mae)) metricasArray.push({ label: 'MAE', valor: metricas.mae });
    if (metricas.mape !== undefined && !isNaN(metricas.mape)) metricasArray.push({ label: 'MAPE', valor: metricas.mape });
    if (metricas.mse !== undefined && !isNaN(metricas.mse)) metricasArray.push({ label: 'MSE', valor: metricas.mse });
    if (metricas.r2 !== undefined && !isNaN(metricas.r2)) metricasArray.push({ label: 'R²', valor: metricas.r2 });
    
    if (metricasArray.length === 0) return null;

    return {
      type: 'bar',
      data: {
        labels: metricasArray.map(m => m.label),
        datasets: [{
          label: 'Valor',
          data: metricasArray.map(m => m.valor),
          backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(34, 197, 94, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(168, 85, 247, 0.8)'],
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
                const suf = metrica.label.includes('MAPE') ? '%' : '';
                return `${metrica.label}: ${metrica.valor.toFixed(2)}${suf}`;
              }
            }
          }
        },
        scales: { x: { beginAtZero: true, title: { display: true, text: 'Valor da Métrica' } } },
        animation: { duration: 800, easing: 'easeOutQuart' }
      }
    };
  };

  const dadosComparacaoPrevisoes = () => {
    if (!dadosProcessados?.dadosPrevisoes || dadosProcessados.dadosPrevisoes.length === 0) return null;

    const { dadosPrevisoes } = dadosProcessados;
    const dadosOrdenados = ordenarPorData(dadosPrevisoes);
    const labels = dadosOrdenados.map(item => typeof item.data === 'number' ? `Período ${item.data+1}` : formatarDataGrafico(item.data));
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
        scales: { x: { title: { display: true, text: 'Período' } }, y: { title: { display: true, text: 'Valor Previsto' } } },
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
      comparacao: dadosComparacaoPrevisoes(),
      metricas: dadosMetricas()
    };

    const graficoAtualObj = graficos[graficoAtivo];
    if (!graficoAtualObj) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>Dados insuficientes para gerar este gráfico</p>
          </div>
        </div>
      );
    }

    if (graficoAtualObj.type === 'line') {
      return <Line ref={chartRef} data={graficoAtualObj.data} options={graficoAtualObj.options} />;
    }
    return <Bar ref={chartRef} data={graficoAtualObj.data} options={graficoAtualObj.options} />;
  };

  const graficosDisponiveis = [
    { id: 'previsoes', label: '📈 Previsões', disponivel: !!dadosPrevisoesHistorico() },
    { id: 'comparacao', label: '🎯 Intervalos', disponivel: !!dadosComparacaoPrevisoes() },
    { id: 'metricas', label: '📊 Métricas', disponivel: !!dadosMetricas() }
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
               grafico.id === 'comparacao' ? 'Intervalos de Confiança' :
               'Performance'}
            </div>
          </button>
        ))}
      </div>

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
              <div className="text-xs text-gray-500">💡 Passe o mouse sobre os pontos para ver detalhes</div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-sm font-medium text-purple-700 mb-2">💡 Interpretação</div>
            <div className="text-sm text-purple-600">
              {graficoAtivo === 'previsoes' && (
                <p><strong>Linha azul:</strong> Dados históricos. <strong>Linha vermelha:</strong> Previsões com intervalo de confiança.</p>
              )}
              {graficoAtivo === 'comparacao' && (
                <p><strong>Linha verde:</strong> Previsão mais provável. <strong>Área sombreada:</strong> Intervalo de confiança de 95%.</p>
              )}
              {graficoAtivo === 'metricas' && (
                <p><strong>MAPE &lt; 10%:</strong> Excelente. <strong>RMSE/MAE:</strong> Medidas de erro absoluto.</p>
              )}
            </div>
          </div>

          <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
            <div className="text-sm font-medium text-pink-700 mb-2">🔮 Informações do Prophet</div>
            <div className="text-sm text-pink-600 space-y-1">
              <div className="flex justify-between"><span>Modelo:</span><span className="font-medium">Prophet</span></div>
              <div className="flex justify-between"><span>Série:</span><span className="font-medium truncate">{nomeSerie}</span></div>
              {metricas.mape !== undefined && !isNaN(metricas.mape) && (
                <div className="flex justify-between"><span>MAPE:</span><span className="font-medium">{metricas.mape.toFixed(1)}%</span></div>
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

// ==================== COMPONENTE PRINCIPAL ====================

const SimpleTabs = ({ tabs, defaultTab, className, children }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  return (
    <div className={className}>
      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium flex items-center gap-2 transition-all ${
              activeTab === tab.id ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">{children(activeTab)}</div>
    </div>
  );
};

// Funções auxiliares
const extrairPrevisoes = (resultado) => {
  if (resultado.previsoes && Array.isArray(resultado.previsoes) && resultado.previsoes.length > 0) {
    return resultado.previsoes.map(p => ({
      periodo: p.periodo || 0,
      data: p.data || p.ds || '',
      data_formatada: p.data_formatada || p.data || '',
      data_completa: p.data_completa || p.data || '',
      previsao: parseFloat(p.previsao || p.yhat || 0),
      inferior: parseFloat(p.inferior || p.yhat_lower || 0),
      superior: parseFloat(p.superior || p.yhat_upper || 0),
      amplitude: parseFloat(p.amplitude || (p.yhat_upper - p.yhat_lower) || 0)
    }));
  }
  if (resultado.resultado) return extrairPrevisoes(resultado.resultado);
  return [];
};

const extrairMetricas = (resultado) => {
  if (resultado.metricas) return resultado.metricas;
  if (resultado.qualidade_ajuste) return resultado.qualidade_ajuste;
  if (resultado.metrics) return resultado.metrics;
  return {};
};

const extrairDadosOriginais = (resultado) => {
  if (resultado.dados_originais) return resultado.dados_originais;
  if (resultado.dados) return resultado.dados;
  if (resultado.historico) return { historico: resultado.historico };
  return {};
};

export default function ResultadoProphet({ resultado, onVoltar, onNovoModelo }) {
  const [dadosProcessados, setDadosProcessados] = useState(null);

  useEffect(() => {
    console.log('🔍 Resultado Prophet recebido:', resultado);
    
    if (!resultado) return;
    
    const previsoes = extrairPrevisoes(resultado);
    const metricas = extrairMetricas(resultado);
    const dadosOriginais = extrairDadosOriginais(resultado);
    
    console.log('📊 Previsões extraídas:', previsoes.length);
    
    let mediaPrevisao = 0;
    let amplitudeMedia = 0;
    let crescimentoPercentual = 0;
    
    if (previsoes.length > 0) {
      const valoresValidos = previsoes.filter(p => !isNaN(p.previsao) && p.previsao !== 0);
      if (valoresValidos.length > 0) {
        mediaPrevisao = valoresValidos.reduce((sum, p) => sum + p.previsao, 0) / valoresValidos.length;
        amplitudeMedia = valoresValidos.reduce((sum, p) => sum + (p.amplitude || Math.abs(p.superior - p.inferior)), 0) / valoresValidos.length;
        if (valoresValidos.length >= 2) {
          const primeiro = valoresValidos[0].previsao;
          const ultimo = valoresValidos[valoresValidos.length - 1].previsao;
          if (primeiro !== 0) crescimentoPercentual = ((ultimo - primeiro) / Math.abs(primeiro)) * 100;
        }
      }
    }
    
    setDadosProcessados({ previsoes, metricas, dadosOriginais, estatisticas: { mediaPrevisao, amplitudeMedia, crescimentoPercentual } });
  }, [resultado]);

  if (!resultado) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Nenhum resultado disponível</p>
        <Button onClick={onVoltar} className="mt-4">Voltar para configuração</Button>
      </div>
    );
  }

  if (!dadosProcessados || dadosProcessados.previsoes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800">⚠️ Sem dados de previsão</h3>
          <p className="text-yellow-700 mt-2">O modelo foi executado, mas não retornou previsões válidas.</p>
          <p className="text-yellow-600 text-sm mt-1">Verifique se o pacote 'prophet' está instalado no servidor.</p>
          <Button onClick={onVoltar} className="mt-4">Voltar para Configuração</Button>
        </div>
      </div>
    );
  }

  const { previsoes, metricas, dadosOriginais, estatisticas } = dadosProcessados;

  const formatarNumero = (num) => num == null || isNaN(num) ? 'N/A' : Number(num).toFixed(2);
  const formatarNumeroPreciso = (num) => num == null || isNaN(num) ? 'N/A' : Number(num).toFixed(4);
  const formatarData = (data) => {
    if (!data) return 'Data não disponível';
    try {
      const d = new Date(data);
      if (isNaN(d.getTime())) return data;
      return d.toLocaleDateString('pt-BR');
    } catch { return data; }
  };

  const tabs = [
    { id: 'previsoes', label: 'Previsões', icon: '🔮' },
    { id: 'metricas', label: 'Métricas', icon: '📊' },
    { id: 'graficos', label: 'Gráficos', icon: '📈' }
  ];

  const traduzirFrequencia = (freq) => {
    const t = { day: 'Diária', week: 'Semanal', month: 'Mensal', quarter: 'Trimestral', year: 'Anual' };
    return t[freq?.toLowerCase()] || freq || 'Mensal';
  };

  const exportarCSV = () => {
    const csvData = [
      ['Período', 'Data', 'Previsão', 'Inferior (95%)', 'Superior (95%)', 'Intervalo (±)'],
      ...previsoes.map((p, i) => [
        `Período ${p.periodo || i+1}`,
        formatarData(p.data_completa || p.data),
        formatarNumeroPreciso(p.previsao),
        formatarNumeroPreciso(p.inferior),
        formatarNumeroPreciso(p.superior),
        p.amplitude ? `±${(p.amplitude / 2).toFixed(2)}` : 'N/A'
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
      metricas,
      interpretacao_tecnica: resultado.interpretacao_tecnica || {},
      dados_originais: dadosOriginais,
      periodo_previsao: resultado.periodo_previsao || {},
      qualidade_ajuste: resultado.qualidade_ajuste || {},
      modelo_info: resultado.modelo_info || {},
      nome: resultado.interpretacao_tecnica?.variavel || 'Prophet'
    };
  };

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
              {resultado.interpretacao_tecnica?.variavel || 'Variável'} • 
              {resultado.modelo_info?.crescimento || ' Linear'} • 
              {traduzirFrequencia(resultado.interpretacao_tecnica?.frequencia)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportarCSV} variant="outline" size="sm">📥 Exportar CSV</Button>
          <Button onClick={onNovoModelo} variant="primary" size="sm">Novo Modelo</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6"><div className="flex justify-between"><div><p className="text-sm text-blue-600">Média das Previsões</p><h3 className="text-2xl font-bold text-blue-800">{formatarNumero(estatisticas.mediaPrevisao)}</h3></div><Activity className="w-8 h-8 text-blue-600" /></div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="pt-6"><div className="flex justify-between"><div><p className="text-sm text-purple-600">Amplitude Média</p><h3 className="text-2xl font-bold text-purple-800">{formatarNumero(estatisticas.amplitudeMedia)}</h3></div><BarChart2 className="w-8 h-8 text-purple-600" /></div></CardContent>
        </Card>
        <Card className={`bg-gradient-to-br ${estatisticas.crescimentoPercentual >= 0 ? 'from-green-50 to-green-100' : 'from-red-50 to-red-100'}`}>
          <CardContent className="pt-6"><div className="flex justify-between"><div><p className="text-sm text-gray-600">Crescimento Total</p><h3 className={`text-2xl font-bold ${estatisticas.crescimentoPercentual >= 0 ? 'text-green-800' : 'text-red-800'}`}>{estatisticas.crescimentoPercentual.toFixed(1)}%</h3></div>{estatisticas.crescimentoPercentual >= 0 ? <TrendingUp className="w-8 h-8 text-green-600" /> : <TrendingDown className="w-8 h-8 text-red-600" />}</div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="pt-6"><div className="flex justify-between"><div><p className="text-sm text-orange-600">Qualidade do Ajuste</p><h3 className="text-2xl font-bold text-orange-800">{metricas.mape ? (metricas.mape < 10 ? 'Excelente' : metricas.mape < 20 ? 'Boa' : 'Razoável') : 'N/A'}</h3></div><Target className="w-8 h-8 text-orange-600" /></div><p className="text-xs text-orange-700 mt-2">MAPE: {metricas.mape ? metricas.mape.toFixed(1) + '%' : 'N/A'}</p></CardContent>
        </Card>
      </div>

      <SimpleTabs tabs={tabs} defaultTab="previsoes" className="mb-6">
        {(activeTab) => (
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            
            {activeTab === 'previsoes' && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Previsões Futuras - Prophet</CardTitle>
                      <p className="text-sm text-gray-600">Intervalo de confiança: 95%</p>
                    </div>
                    <Badge variant="success">{previsoes.length} períodos previstos</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-lg border shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Período</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Data</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Previsão</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Inferior (95%)</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Superior (95%)</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Intervalo</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {previsoes.map((p, idx) => {
                          const intervalo = p.amplitude ? (p.amplitude / 2).toFixed(2) : (p.superior && p.inferior) ? ((p.superior - p.inferior) / 2).toFixed(2) : 'N/A';
                          return (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap"><span className="font-medium">Período {p.periodo || idx + 1}</span></td>
                              <td className="px-6 py-4 whitespace-nowrap">{formatarData(p.data_completa || p.data)}</td>
                              <td className="px-6 py-4 whitespace-nowrap"><span className="font-bold text-blue-700">{formatarNumeroPreciso(p.previsao)}</span></td>
                              <td className="px-6 py-4 whitespace-nowrap">{formatarNumeroPreciso(p.inferior)}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{formatarNumeroPreciso(p.superior)}</td>
                              <td className="px-6 py-4 whitespace-nowrap"><span className="font-medium">±{intervalo}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
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
                        { label: 'MSE', value: metricas.mse },
                        { label: 'RMSE', value: metricas.rmse },
                        { label: 'MAE', value: metricas.mae },
                        { label: 'MAPE', value: metricas.mape, suffix: '%' }
                      ].map((m, idx) => (
                        <div key={idx} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700">{m.label}</span>
                          <span className="font-bold text-blue-600">
                            {m.value !== undefined && !isNaN(m.value) ? formatarNumero(m.value) + (m.suffix || '') : 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>📊 Estatísticas dos Dados</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm text-blue-600">Início</p>
                          <p className="font-bold text-blue-800">{formatarData(dadosOriginais.primeira_data) || 'N/A'}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-sm text-green-600">Fim</p>
                          <p className="font-bold text-green-800">{formatarData(dadosOriginais.ultima_data) || 'N/A'}</p>
                        </div>
                      </div>
                      {[
                        { label: 'Observações', value: dadosOriginais.n_observacoes || resultado.interpretacao_tecnica?.n_observacoes },
                        { label: 'Média', value: dadosOriginais.media },
                        { label: 'Desvio Padrão', value: dadosOriginais.desvio_padrao },
                        { label: 'Mínimo', value: dadosOriginais.minimo },
                        { label: 'Máximo', value: dadosOriginais.maximo }
                      ].map((s, idx) => (
                        <div key={idx} className="flex justify-between p-2 hover:bg-gray-50 rounded-lg">
                          <span className="text-gray-600">{s.label}</span>
                          <span className="font-bold">{s.value !== undefined && !isNaN(s.value) ? formatarNumero(s.value) : 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'graficos' && <GraficosProphet dados={prepararDadosParaGraficos()} tipoModelo="prophet" />}
            
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