// ResultadoProphet.jsx - VERSÃO COMPLETAMENTE CORRIGIDA
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

// ============ FUNÇÕES AUXILIARES ============

const extrairHistoricoProphet = (dados) => {
  if (!dados) return [];
  
  if (dados.dados_originais?.dados) {
    return dados.dados_originais.dados.map(item => ({
      data: item.ds || item.data,
      valor: item.y || item.valor
    }));
  }
  if (dados.dados_originais?.historico) {
    return dados.dados_originais.historico;
  }
  if (dados.historico) {
    return dados.historico;
  }
  return [];
};

const extrairPrevisoesProphet = (dados) => {
  if (!dados) return [];
  
  if (dados.previsoes) {
    return dados.previsoes.map(p => ({
      data: p.ds || p.data,
      previsao: p.yhat || p.previsao,
      inferior: p.yhat_lower || p.inferior,
      superior: p.yhat_upper || p.superior,
      amplitude: (p.yhat_upper || p.superior) - (p.yhat_lower || p.inferior)
    }));
  }
  return [];
};

// ============ COMPONENTE DE GRÁFICOS ============

const GraficosProphet = ({ dados, tipoModelo }) => {
  const [graficoAtivo, setGraficoAtivo] = useState('previsoes');
  const [dadosProcessados, setDadosProcessados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const chartRef = useRef(null);

  const getCoresModelo = () => ({
    primaria: 'rgb(59, 130, 246)',
    secundaria: 'rgb(239, 68, 68)',
    terciaria: 'rgb(245, 158, 11)',
    gradient: 'from-purple-500 to-pink-600'
  });

  useEffect(() => {
    if (!dados) {
      setDadosProcessados(null);
      setCarregando(false);
      return;
    }

    try {
      const historico = extrairHistoricoProphet(dados);
      const previsoesRaw = extrairPrevisoesProphet(dados);

      const dadosHistoricos = historico.map(item => ({
        data: item.data || item.ds,
        valor: parseFloat(item.valor || item.y || 0) || 0,
        tipo: 'historico'
      }));

      const dadosPrevisoes = previsoesRaw.map(item => ({
        data: item.data,
        previsao: parseFloat(item.previsao) || 0,
        inferior: parseFloat(item.inferior) || 0,
        superior: parseFloat(item.superior) || 0,
        tipo: 'previsao'
      }));

      const processado = {
        dadosHistoricos,
        dadosPrevisoes,
        nomeSerie: dados.nome || dados.interpretacao_tecnica?.variavel || 'Prophet'
      };

      setDadosProcessados(processado);
    } catch (error) {
      console.error('Erro ao processar dados:', error);
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
    if (!dadosProcessados) return null;

    const { dadosHistoricos, dadosPrevisoes, nomeSerie } = dadosProcessados;

    if ((!dadosHistoricos || dadosHistoricos.length === 0) && (!dadosPrevisoes || dadosPrevisoes.length === 0)) {
      return null;
    }

    const todasDatas = new Set();
    if (dadosHistoricos) dadosHistoricos.forEach(item => item.data && todasDatas.add(item.data));
    if (dadosPrevisoes) dadosPrevisoes.forEach(item => item.data && todasDatas.add(item.data));

    const datasOrdenadas = Array.from(todasDatas).sort((a, b) => obterTimestamp(a) - obterTimestamp(b));
    const labels = datasOrdenadas.map(d => formatarDataGrafico(d));

    const historicoMap = new Map(dadosHistoricos?.map(d => [d.data, d.valor]) || []);
    const previsoesMap = new Map(dadosPrevisoes?.map(d => [d.data, d.previsao]) || []);
    const inferiorMap = new Map(dadosPrevisoes?.map(d => [d.data, d.inferior]) || []);
    const superiorMap = new Map(dadosPrevisoes?.map(d => [d.data, d.superior]) || []);

    const datasets = [];

    if (dadosHistoricos && dadosHistoricos.length > 0) {
      datasets.push({
        label: 'Dados Históricos',
        data: datasOrdenadas.map(d => historicoMap.get(d) ?? null),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderWidth: 2.5,
        fill: false,
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 6,
        order: 1
      });
    }

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
        order: 2
      });

      const temIntervalos = dadosPrevisoes.some(p => p.inferior !== undefined && p.superior !== undefined);
      if (temIntervalos) {
        datasets.push({
          label: 'Intervalo de Confiança (95%)',
          data: datasOrdenadas.map(d => inferiorMap.get(d) ?? null),
          borderColor: 'rgba(22, 163, 74, 0.3)',
          backgroundColor: 'rgba(22, 163, 74, 0.15)',
          borderWidth: 1,
          borderDash: [2, 2],
          fill: { target: '+1', above: 'rgba(22, 163, 74, 0.15)' },
          pointRadius: 0,
          order: 3
        });
      }
    }

    let growthText = '';
    if (dadosPrevisoes?.length > 0 && dadosHistoricos?.length > 0) {
      const ultimoHistorico = dadosHistoricos[dadosHistoricos.length - 1]?.valor;
      const ultimaPrevisao = dadosPrevisoes[dadosPrevisoes.length - 1]?.previsao;
      if (ultimoHistorico && ultimaPrevisao && ultimoHistorico !== 0) {
        const growth = ((ultimaPrevisao - ultimoHistorico) / ultimoHistorico) * 100;
        growthText = ` (${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%)`;
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
            text: `📈 ${nomeSerie} - Previsões Prophet${growthText}`,
            font: { size: 16, weight: 'bold' }
          },
          legend: { position: 'top', labels: { usePointStyle: true } },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          x: { title: { display: true, text: 'Período' }, ticks: { maxRotation: 45, autoSkip: true, maxTicksLimit: 12 } },
          y: { title: { display: true, text: 'Valor' } }
        }
      }
    };
  };

  const renderizarGrafico = () => {
    if (carregando) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p>Carregando gráficos...</p>
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

    const graficoAtualObj = dadosPrevisoesHistorico();
    if (!graficoAtualObj) {
      return <div className="h-64 flex items-center justify-center text-gray-500">Dados insuficientes</div>;
    }

    return <Line ref={chartRef} data={graficoAtualObj.data} options={graficoAtualObj.options} />;
  };

  const graficosDisponiveis = [{ id: 'previsoes', label: '📈 Previsões', disponivel: true }];

  if (carregando) {
    return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" /><p>Carregando gráficos...</p></div>;
  }

  if (!dadosProcessados) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🔮</div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">Dados insuficientes para gráficos</h3>
        <p className="text-gray-500">Execute o modelo Prophet com dados válidos</p>
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
            className={`px-4 py-3 rounded-lg transition-all flex-1 min-w-[140px] ${
              graficoAtivo === grafico.id
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="font-medium">{grafico.label}</div>
          </button>
        ))}
      </div>
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="h-[500px]">{renderizarGrafico()}</div>
      </div>
    </div>
  );
};

// ============ COMPONENTE SIMPLE TABS ============

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

// ============ COMPONENTE PRINCIPAL ============

export default function ResultadoProphet({ resultado, onVoltar, onNovoModelo }) {
  if (!resultado) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Nenhum resultado disponível</p>
        <Button onClick={onVoltar} className="mt-4">Voltar para configuração</Button>
      </div>
    );
  }

  const { 
    previsoes = [],
    metricas = {},
    interpretacao_tecnica = {},
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
    mediaPrevisao: previsoes.length ? previsoes.reduce((sum, p) => sum + (p.previsao || 0), 0) / previsoes.length : 0,
    crescimentoPercentual: previsoes.length >= 2 
      ? (((previsoes[previsoes.length - 1].previsao || 0) - (previsoes[0].previsao || 0)) / Math.abs(previsoes[0].previsao || 1)) * 100 
      : 0
  };

  const formatarNumero = (num) => num == null ? 'N/A' : Number(num).toFixed(2);
  const formatarNumeroPreciso = (num) => num == null ? 'N/A' : Number(num).toFixed(6);
  const formatarDataSimples = (data) => data || 'N/A';

  const tabs = [
    { id: 'previsoes', label: 'Previsões', icon: '🔮' },
    { id: 'metricas', label: 'Métricas', icon: '📊' },
    { id: 'graficos', label: 'Gráficos', icon: '📈' }
  ];

  const dadosGraficos = {
    previsoes,
    metricas,
    interpretacao_tecnica,
    dados_originais: resultado.dados_originais,
    nome: interpretacao_tecnica?.variavel || 'Prophet'
  };

  const renderizarGraficos = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Visualizações Gráficas do Prophet</h3>
            <p className="text-gray-600">Análise visual dos resultados</p>
          </div>
          <Badge variant="info">🔮 Prophet</Badge>
        </div>
      </div>
      <GraficosProphet dados={dadosGraficos} tipoModelo="prophet" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onVoltar} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            ⬅️
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🔮 Resultados do Prophet</h1>
            <p className="text-gray-600">{interpretacao_tecnica.variavel || 'Variável'}</p>
          </div>
        </div>
        <Button onClick={onNovoModelo} variant="primary" size="sm">Novo Modelo</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-blue-600 font-medium">Média das Previsões</p><h3 className="text-2xl font-bold text-blue-800 mt-1">{formatarNumero(estatisticas.mediaPrevisao)}</h3></div>
              <Activity className="w-8 h-8 text-blue-600" />
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
          </CardContent>
        </Card>
      </div>

      <SimpleTabs tabs={tabs} defaultTab="previsoes" className="mb-6">
        {(activeTab) => (
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {activeTab === 'previsoes' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div><CardTitle>Previsões Futuras - Prophet</CardTitle><p className="text-sm text-gray-600">Intervalo de confiança: 95%</p></div>
                    <Badge variant="success">{previsoes.length} períodos previstos</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-lg border shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Período</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Data</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Previsão</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Inferior</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Superior</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {previsoes.map((p, idx) => {
                          const previsaoValor = p.previsao;
                          const inferiorValor = p.inferior;
                          const superiorValor = p.superior;
                          
                          const formatarValor = (val) => {
                            if (val === undefined || val === null || isNaN(val)) return 'N/A';
                            return val.toFixed(4);
                          };
                          
                          return (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap"><span className="font-medium">Período {idx + 1}</span></td>
                              <td className="px-6 py-4 whitespace-nowrap"><span className="text-gray-700">{formatarDataSimples(p.ds || p.data)}</span></td>
                              <td className="px-6 py-4 whitespace-nowrap"><span className="font-bold text-blue-700">{formatarValor(previsaoValor)}</span></td>
                              <td className="px-6 py-4 whitespace-nowrap"><span className="text-gray-600">{formatarValor(inferiorValor)}</span></td>
                              <td className="px-6 py-4 whitespace-nowrap"><span className="text-gray-600">{formatarValor(superiorValor)}</span></td>
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
              <Card>
                <CardHeader><CardTitle>📐 Métricas de Desempenho</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">MAPE</span>
                      <span className="font-bold text-purple-600">{metricas.mape ? `${metricas.mape.toFixed(2)}%` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">RMSE</span>
                      <span className="font-bold text-red-600">{metricas.rmse ? metricas.rmse.toFixed(2) : 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">MAE</span>
                      <span className="font-bold text-green-600">{metricas.mae ? metricas.mae.toFixed(2) : 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">R²</span>
                      <span className="font-bold text-blue-600">{metricas.r2 ? metricas.r2.toFixed(4) : 'N/A'}</span>
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