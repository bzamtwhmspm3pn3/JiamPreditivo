// frontend/src/components/Dashboard/resultados/ResultadoProphet.jsx

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, TrendingUp, TrendingDown, 
  Activity, BarChart2, Calendar, Target,
  AlertTriangle, CheckCircle, Info, Eye, FileText, Printer
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import {
  formatarDataCompleta,
  formatarDataGrafico,
  obterTimestamp,
  corrigirSeculoData,
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

const GraficosProphet = ({ dados, dadosOriginaisExtras, tipoModelo }) => {
  const [graficoAtivo, setGraficoAtivo] = useState('previsoes');
  const [dadosProcessados, setDadosProcessados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const chartRef = useRef(null);

  useEffect(() => {
    console.log('📊 GraficosProphet - Dados recebidos:', dados);
    console.log('📊 GraficosProphet - dadosOriginaisExtras:', dadosOriginaisExtras);
    
    if (!dados) {
      setDadosProcessados(null);
      setCarregando(false);
      return;
    }

    try {
      const { 
        previsoes = [], 
        metricas = {},
        interpretacao_tecnica = {},
        dados_originais = {},
        periodo_previsao = {}
      } = dados;
      
      // 🔥 PROCESSAR DADOS HISTÓRICOS - PRIORIDADES:
      // 1. dados_originais.dados (formato com objetos)
      // 2. dados_originais.historico (array simples)
      // 3. dadosOriginaisExtras (props do componente pai)
      // 4. resultado.historico (direto)
      
      let dadosHistoricos = [];
      
      // Tentativa 1: dados_originais.dados
      if (dados_originais?.dados && Array.isArray(dados_originais.dados) && dados_originais.dados.length > 0) {
        dadosHistoricos = dados_originais.dados.map(item => ({
          data: item.data || item.ds || item.periodo,
          valor: parseFloat(item.valor || item.y || 0),
          tipo: 'historico'
        }));
        console.log('📊 Histórico carregado de dados_originais.dados:', dadosHistoricos.length);
      }
      
      // Tentativa 2: dados_originais.historico
      if (dadosHistoricos.length === 0 && dados_originais?.historico && Array.isArray(dados_originais.historico) && dados_originais.historico.length > 0) {
        const valores = dados_originais.historico;
        const datas = dados_originais.datas || valores.map((_, i) => i);
        dadosHistoricos = valores.map((valor, idx) => ({
          data: datas[idx],
          valor: parseFloat(valor) || 0,
          tipo: 'historico'
        }));
        console.log('📊 Histórico carregado de dados_originais.historico:', dadosHistoricos.length);
      }
      
      // Tentativa 3: dadosOriginaisExtras (prop do componente pai)
      if (dadosHistoricos.length === 0 && dadosOriginaisExtras && Array.isArray(dadosOriginaisExtras) && dadosOriginaisExtras.length > 0) {
        // Verificar se é array de números
        if (typeof dadosOriginaisExtras[0] === 'number') {
          dadosHistoricos = dadosOriginaisExtras.map((valor, idx) => ({
            data: idx,
            valor: valor,
            tipo: 'historico'
          }));
        } 
        // Verificar se é array de objetos
        else if (typeof dadosOriginaisExtras[0] === 'object') {
          dadosHistoricos = dadosOriginaisExtras.map(item => ({
            data: item.data || item.ds || item.Data,
            valor: parseFloat(item.valor || item.y || item.Inflacao_Turquia || 0),
            tipo: 'historico'
          }));
        }
        console.log('📊 Histórico carregado de dadosOriginaisExtras:', dadosHistoricos.length);
      }
      
      // Tentativa 4: resultado.historico direto
      if (dadosHistoricos.length === 0 && dados.historico && Array.isArray(dados.historico) && dados.historico.length > 0) {
        dadosHistoricos = dados.historico.map(item => ({
          data: item.data || item.ds,
          valor: parseFloat(item.valor || item.y || 0),
          tipo: 'historico'
        }));
        console.log('📊 Histórico carregado de dados.historico:', dadosHistoricos.length);
      }
      
      // Tentativa 5: extrair de interpretacao_tecnica
      if (dadosHistoricos.length === 0 && interpretacao_tecnica?.dados_historicos) {
        dadosHistoricos = interpretacao_tecnica.dados_historicos;
        console.log('📊 Histórico carregado de interpretacao_tecnica:', dadosHistoricos.length);
      }
      
      // Processar previsões
      const dadosPrevisoes = previsoes.map((item, idx) => ({
        data: item.data || item.ds || idx,
        previsao: parseFloat(item.previsao || item.yhat || 0),
        inferior: parseFloat(item.inferior || item.yhat_lower || 0),
        superior: parseFloat(item.superior || item.yhat_upper || 0),
        tipo: 'previsao'
      }));
      
      // Processar dados ajustados (se disponíveis)
      const dadosAjustados = (dados.ajustados || []).map((item, idx) => ({
        data: item.data || item.ds || idx,
        valor: parseFloat(item.valor || item.yhat || 0),
        tipo: 'ajustado'
      }));
      
      const metricasProcessadas = {
        mse: metricas.mse,
        rmse: metricas.rmse,
        mae: metricas.mae,
        mape: metricas.mape,
        r2: metricas.r2
      };
      
      const processado = {
        dadosHistoricos,
        dadosAjustados,
        dadosPrevisoes,
        metricas: metricasProcessadas,
        interpretacao: interpretacao_tecnica,
        periodoPrevisao: periodo_previsao,
        nomeSerie: interpretacao_tecnica?.variavel || dados.nome || 'Prophet'
      };
      
      console.log('📊 Dados processados finais:', {
        historicos: dadosHistoricos.length,
        previsoes: dadosPrevisoes.length,
        ajustados: dadosAjustados.length
      });
      
      setDadosProcessados(processado);
    } catch (error) {
      console.error('❌ Erro ao processar dados para gráficos:', error);
      setDadosProcessados(null);
    } finally {
      setCarregando(false);
    }
  }, [dados, dadosOriginaisExtras]);

  const ordenarPorData = (array) => {
    if (!array || !Array.isArray(array)) return [];
    return [...array].sort((a, b) => {
      const ta = obterTimestamp(a.data);
      const tb = obterTimestamp(b.data);
      return ta - tb;
    });
  };

  const dadosPrevisoesHistorico = () => {
    if (!dadosProcessados) return null;
    
    const { dadosHistoricos, dadosPrevisoes, dadosAjustados, nomeSerie } = dadosProcessados;
    
    // Se não tem dados históricos nem previsões, retorna null
    if ((!dadosHistoricos || dadosHistoricos.length === 0) && (!dadosPrevisoes || dadosPrevisoes.length === 0)) {
      return null;
    }
    
    // Reunir todas as datas para o eixo X
    const todasDatas = new Set();
    
    if (dadosHistoricos && dadosHistoricos.length > 0) {
      dadosHistoricos.forEach(item => {
        if (item && item.data !== undefined && item.data !== null) todasDatas.add(item.data);
      });
    }
    
    if (dadosPrevisoes && dadosPrevisoes.length > 0) {
      dadosPrevisoes.forEach(item => {
        if (item && item.data !== undefined && item.data !== null) todasDatas.add(item.data);
      });
    }
    
    if (dadosAjustados && dadosAjustados.length > 0) {
      dadosAjustados.forEach(item => {
        if (item && item.data !== undefined && item.data !== null) todasDatas.add(item.data);
      });
    }
    
    // Ordenar datas
    const datasOrdenadas = Array.from(todasDatas).sort((a, b) => obterTimestamp(a) - obterTimestamp(b));
    const labels = datasOrdenadas.map(d => formatarDataGrafico(d));
    
    // Criar maps para acesso rápido
    const historicoMap = new Map();
    if (dadosHistoricos) {
      dadosHistoricos.forEach(d => {
        if (d && d.data !== undefined) historicoMap.set(d.data, d.valor);
      });
    }
    
    const ajustadosMap = new Map();
    if (dadosAjustados) {
      dadosAjustados.forEach(d => {
        if (d && d.data !== undefined) ajustadosMap.set(d.data, d.valor);
      });
    }
    
    const previsoesMap = new Map();
    const inferiorMap = new Map();
    const superiorMap = new Map();
    
    if (dadosPrevisoes) {
      dadosPrevisoes.forEach(d => {
        if (d && d.data !== undefined) {
          previsoesMap.set(d.data, d.previsao);
          if (d.inferior !== undefined) inferiorMap.set(d.data, d.inferior);
          if (d.superior !== undefined) superiorMap.set(d.data, d.superior);
        }
      });
    }
    
    // Construir datasets
    const datasets = [];
    
    // Dataset 1: DADOS HISTÓRICOS
    if (dadosHistoricos && dadosHistoricos.length > 0) {
      datasets.push({
        label: 'Dados Históricos',
        data: datasOrdenadas.map(d => {
          const val = historicoMap.get(d);
          return val !== undefined ? val : null;
        }),
        borderColor: '#2563eb',
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
    
    // Dataset 2: AJUSTE DO MODELO (opcional)
    if (dadosAjustados && dadosAjustados.length > 0) {
      datasets.push({
        label: 'Ajuste do Modelo',
        data: datasOrdenadas.map(d => ajustadosMap.get(d) ?? null),
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
    
    // Dataset 3: PREVISÕES
    if (dadosPrevisoes && dadosPrevisoes.length > 0) {
      datasets.push({
        label: 'Previsões',
        data: datasOrdenadas.map(d => previsoesMap.get(d) ?? null),
        borderColor: '#16a34a',
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
      
      // INTERVALO DE CONFIANÇA
      const temIntervalos = dadosPrevisoes.some(p => p.inferior !== undefined && p.superior !== undefined);
      
      if (temIntervalos) {
        // Limite Superior
        datasets.push({
          label: 'Limite Superior (95% CI)',
          data: datasOrdenadas.map(d => superiorMap.get(d) ?? null),
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
          data: datasOrdenadas.map(d => inferiorMap.get(d) ?? null),
          borderColor: 'rgba(22, 163, 74, 0.3)',
          backgroundColor: 'rgba(22, 163, 74, 0.15)',
          borderWidth: 1,
          borderDash: [2, 2],
          fill: { target: '+1', above: 'rgba(22, 163, 74, 0.15)' },
          tension: 0,
          pointRadius: 0,
          order: 5
        });
      }
    }
    
    const formatNumber = (num, decimals = 2) => {
      if (num == null || isNaN(num)) return 'N/A';
      if (typeof num !== 'number') num = parseFloat(num);
      return num.toFixed(decimals);
    };
    
    // Calcular crescimento
    let growthText = '';
    let growthClass = '';
    
    if (dadosPrevisoes && dadosPrevisoes.length > 0 && dadosHistoricos && dadosHistoricos.length > 0) {
      const ultimoHistorico = dadosHistoricos[dadosHistoricos.length - 1]?.valor;
      const primeiraPrevisao = dadosPrevisoes[0]?.previsao;
      
      if (ultimoHistorico && primeiraPrevisao && ultimoHistorico !== 0) {
        const growth = ((primeiraPrevisao - ultimoHistorico) / ultimoHistorico) * 100;
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
  
  const dadosMetricas = () => {
    if (!dadosProcessados?.metricas) return null;
    
    const { metricas } = dadosProcessados;
    const metricasArray = [];
    
    if (metricas.rmse && !isNaN(metricas.rmse)) metricasArray.push({ label: 'RMSE', valor: metricas.rmse });
    if (metricas.mae && !isNaN(metricas.mae)) metricasArray.push({ label: 'MAE', valor: metricas.mae });
    if (metricas.mape && !isNaN(metricas.mape)) metricasArray.push({ label: 'MAPE', valor: metricas.mape });
    if (metricas.mse && !isNaN(metricas.mse)) metricasArray.push({ label: 'MSE', valor: metricas.mse });
    if (metricas.r2 && !isNaN(metricas.r2)) metricasArray.push({ label: 'R²', valor: metricas.r2 });
    
    if (metricasArray.length === 0) return null;
    
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
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          title: { display: true, text: '🎯 Métricas de Performance', font: { size: 16, weight: 'bold' } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const metrica = metricasArray[ctx.dataIndex];
                const suf = metrica.label.includes('MAPE') ? '%' : '';
                return `${metrica.label}: ${metrica.valor.toFixed(2)}${suf}`;
              }
            }
          }
        }
      }
    };
  };
  
  const renderizarGrafico = () => {
    if (carregando) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
            <p className="text-gray-500">Carregando gráficos...</p>
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
          </div>
        </div>
      );
    }
    
    const graficos = {
      previsoes: dadosPrevisoesHistorico(),
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
    { id: 'metricas', label: '📊 Métricas', disponivel: !!dadosMetricas() }
  ].filter(g => g.disponivel);
  
  if (graficosDisponiveis.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🔮</div>
        <p className="text-gray-500">Dados insuficientes para gráficos</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 mb-6">
        {graficosDisponiveis.map(grafico => (
          <button
            key={grafico.id}
            onClick={() => setGraficoAtivo(grafico.id)}
            className={`px-4 py-3 rounded-lg transition-all flex-1 ${
              graficoAtivo === grafico.id
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="font-medium">{grafico.label}</div>
          </button>
        ))}
      </div>
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <div className="h-[500px]">{renderizarGrafico()}</div>
      </div>
    </div>
  );
};

// ==================== FUNÇÕES AUXILIARES ====================

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
  return [];
};

const extrairMetricas = (resultado) => {
  if (resultado.metricas) return resultado.metricas;
  if (resultado.qualidade_ajuste) return resultado.qualidade_ajuste;
  return {};
};

const extrairDadosOriginais = (resultado) => {
  if (resultado.dados_originais) return resultado.dados_originais;
  return {
    n_observacoes: resultado.interpretacao_tecnica?.n_observacoes || 0,
    primeira_data: resultado.interpretacao_tecnica?.primeira_data,
    ultima_data: resultado.interpretacao_tecnica?.ultima_data
  };
};

// ==================== COMPONENTE PRINCIPAL ====================

const SimpleTabs = ({ tabs, defaultTab, children }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  return (
    <div>
      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium flex items-center gap-2 ${
              activeTab === tab.id ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'
            }`}
          >
            <span>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>
      <div>{children(activeTab)}</div>
    </div>
  );
};

export default function ResultadoProphet({ resultado, dadosOriginais, onVoltar, onNovoModelo }) {
  const [dadosProcessados, setDadosProcessados] = useState(null);

  useEffect(() => {
    console.log('🔍 Resultado Prophet recebido:', resultado);
    console.log('📊 dadosOriginais recebidos:', dadosOriginais);
    
    if (!resultado) return;
    
    const previsoes = extrairPrevisoes(resultado);
    const metricas = extrairMetricas(resultado);
    let dadosOriginaisProcessados = extrairDadosOriginais(resultado);
    
    // Se não tem dados históricos, usar dadosOriginais da prop
    if ((!dadosOriginaisProcessados.historico || dadosOriginaisProcessados.historico.length === 0) && dadosOriginais) {
      if (Array.isArray(dadosOriginais)) {
        if (typeof dadosOriginais[0] === 'number') {
          dadosOriginaisProcessados = {
            historico: dadosOriginais,
            n_observacoes: dadosOriginais.length,
            media: dadosOriginais.reduce((a,b) => a+b, 0) / dadosOriginais.length,
            minimo: Math.min(...dadosOriginais),
            maximo: Math.max(...dadosOriginais)
          };
        } else if (typeof dadosOriginais[0] === 'object') {
          const valores = dadosOriginais.map(item => item.valor || item.y || item.Inflacao_Turquia);
          const datas = dadosOriginais.map(item => item.data || item.ds || item.Data);
          dadosOriginaisProcessados = {
            historico: valores,
            datas: datas,
            dados: dadosOriginais,
            n_observacoes: valores.length,
            media: valores.reduce((a,b) => a+b, 0) / valores.length,
            minimo: Math.min(...valores),
            maximo: Math.max(...valores),
            primeira_data: datas[0],
            ultima_data: datas[datas.length - 1]
          };
        }
      }
    }
    
    let mediaPrevisao = 0, amplitudeMedia = 0, crescimentoPercentual = 0;
    
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
    
    setDadosProcessados({ previsoes, metricas, dadosOriginais: dadosOriginaisProcessados, estatisticas: { mediaPrevisao, amplitudeMedia, crescimentoPercentual } });
  }, [resultado, dadosOriginais]);

  if (!resultado || !dadosProcessados || dadosProcessados.previsoes.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Nenhum resultado disponível</p>
        <Button onClick={onVoltar} className="mt-4">Voltar</Button>
      </div>
    );
  }

  const { previsoes, metricas, dadosOriginais: dadosHist, estatisticas } = dadosProcessados;
  
  const formatarNumero = (num) => num == null || isNaN(num) ? 'N/A' : Number(num).toFixed(2);
  const formatarNumeroPreciso = (num) => num == null || isNaN(num) ? 'N/A' : Number(num).toFixed(4);
  const formatarData = (data) => {
    if (!data) return 'N/A';
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

  const prepararDadosParaGraficos = () => ({
    previsoes,
    metricas,
    dados_originais: dadosHist,
    interpretacao_tecnica: resultado.interpretacao_tecnica || {},
    nome: resultado.interpretacao_tecnica?.variavel || 'Prophet'
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">🔮 Resultados do Prophet</h1>
          <p className="text-gray-600">{resultado.interpretacao_tecnica?.variavel || 'Variável'} • Linear • Mensal</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onNovoModelo} variant="primary" size="sm">Novo Modelo</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-blue-600">Média das Previsões</p><h3 className="text-2xl font-bold">{formatarNumero(estatisticas.mediaPrevisao)}</h3></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-purple-600">Amplitude Média</p><h3 className="text-2xl font-bold">{formatarNumero(estatisticas.amplitudeMedia)}</h3></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-green-600">Crescimento Total</p><h3 className="text-2xl font-bold">{estatisticas.crescimentoPercentual.toFixed(1)}%</h3></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-orange-600">Qualidade</p><h3 className="text-2xl font-bold">{metricas.mape ? (metricas.mape < 10 ? 'Excelente' : metricas.mape < 20 ? 'Boa' : 'Razoável') : 'N/A'}</h3><p className="text-xs">MAPE: {metricas.mape ? metricas.mape.toFixed(1) + '%' : 'N/A'}</p></CardContent></Card>
      </div>

      <SimpleTabs tabs={tabs} defaultTab="previsoes">
        {(activeTab) => (
          <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {activeTab === 'previsoes' && (
              <Card>
                <CardHeader><CardTitle>Previsões Futuras</CardTitle><Badge variant="success">{previsoes.length} períodos</Badge></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50"><tr>{['Período', 'Data', 'Previsão', 'Inferior', 'Superior', 'Intervalo'].map(h => <th key={h} className="px-4 py-2 text-left">{h}</th>)}</thead>
                      <tbody>
                        {previsoes.map((p, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-4 py-2">{i+1}</td>
                            <td className="px-4 py-2">{formatarData(p.data_completa || p.data)}</td>
                            <td className="px-4 py-2 font-bold text-blue-700">{formatarNumeroPreciso(p.previsao)}</td>
                            <td className="px-4 py-2">{formatarNumeroPreciso(p.inferior)}</td>
                            <td className="px-4 py-2">{formatarNumeroPreciso(p.superior)}</td>
                            <td className="px-4 py-2">±{((p.amplitude || (p.superior - p.inferior)) / 2).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {activeTab === 'metricas' && (
              <div className="grid grid-cols-2 gap-6">
                <Card><CardHeader><CardTitle>Métricas de Desempenho</CardTitle></CardHeader><CardContent>{['rmse', 'mae', 'mape', 'mse'].map(m => (<div key={m} className="flex justify-between p-2"><span>{m.toUpperCase()}</span><span className="font-bold">{metricas[m] !== undefined ? formatarNumero(metricas[m]) + (m === 'mape' ? '%' : '') : 'N/A'}</span></div>))}</CardContent></Card>
                <Card><CardHeader><CardTitle>Estatísticas dos Dados</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-2"><div>Início:</div><div>{formatarData(dadosHist.primeira_data)}</div><div>Fim:</div><div>{formatarData(dadosHist.ultima_data)}</div><div>Observações:</div><div>{dadosHist.n_observacoes || 'N/A'}</div><div>Média:</div><div>{formatarNumero(dadosHist.media)}</div><div>Mínimo:</div><div>{formatarNumero(dadosHist.minimo)}</div><div>Máximo:</div><div>{formatarNumero(dadosHist.maximo)}</div></div></CardContent></Card>
              </div>
            )}
            
            {activeTab === 'graficos' && <GraficosProphet dados={prepararDadosParaGraficos()} dadosOriginaisExtras={dadosOriginais} tipoModelo="prophet" />}
          </motion.div>
        )}
      </SimpleTabs>

      <div className="flex justify-between pt-4">
        <Button onClick={onVoltar} variant="outline">⬅️ Voltar</Button>
        <Button onClick={onNovoModelo} variant="primary">🔮 Novo Modelo</Button>
      </div>
    </div>
  );
}