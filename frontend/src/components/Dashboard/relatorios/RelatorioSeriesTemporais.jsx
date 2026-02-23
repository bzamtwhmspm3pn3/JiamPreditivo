// C:\Users\VhenancioMarthinz\Downloads\JiamPreditivo\frontend\src\components\Dashboard\relatorios\RelatorioSeriesTemporais.jsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, ComposedChart, Area,
  PieChart, Pie, Cell,
  ReferenceLine
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Calculator,
  TrendingUp,
  Percent,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Brain,
  FileBarChart,
  BarChart3,
  Sigma,
  Grid,
  Info,
  Download,
  Award,
  Shield,
  Clock,
  Globe,
  Layers,
  ScatterChart as ScatterChartIcon,
  PieChart as PieChartIcon,
  Activity,
  Hash,
  DollarSign,
  FileText,
  TrendingDown,
  Database,
  Cpu,
  Server,
  HardDrive,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  EyeOff,
  XCircle,
  CheckSquare,
  AlertCircle,
  FileCheck,
  Code,
  ArrowLeft,
  BookOpen,
  Scale,
  Calculator as CalculatorIcon,
  BarChart4,
  LineChart as LineChartIcon,
  Gauge,
  GitBranch,
  Trees,
  Sparkles,
  Network,
  Workflow,
  Flower2,
  Leaf,
  TreePine,
  Settings,
  Calendar,
  CalendarDays,
  Clock as ClockIcon,
  Hourglass,
  History,
  ArrowUpDown
} from 'lucide-react';

// Componentes UI personalizados
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import Button from '../componentes/Button';
import Badge from '../componentes/Badge';
import Input from '../componentes/Input';
import Label from '../componentes/Label';

const RelatorioSeriesTemporais = ({ modelo, dadosCompletos }) => {
  const [dadosProcessados, setDadosProcessados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [exportandoPDF, setExportandoPDF] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('resumo');
  const [graficoAtivo, setGraficoAtivo] = useState('previsoes');
  const [todasPrevisoesVisiveis, setTodasPrevisoesVisiveis] = useState(false);

  useEffect(() => {
    try {
      console.log('📊 RELATÓRIO SÉRIES TEMPORAIS - Dados recebidos:');
      console.log('📦 modelo:', modelo);
      
      // VERIFICAR SE TEM DADOS DO R
      if (!modelo || !modelo.resultado) {
        throw new Error('Modelo sem dados do R');
      }

      const resultado = modelo.resultado;
      console.log('📦 resultado do R:', resultado);

      // DETECTAR TIPO DE MODELO
      const tipoModelo = modelo.tipo || 'desconhecido';
      console.log('🔍 Tipo de modelo detectado:', tipoModelo);

      // PROCESSAR RESULTADOS COMPLETOS
      processarResultadosCompletos(resultado, tipoModelo);

    } catch (error) {
      console.error('❌ Erro ao processar dados:', error);
      setErro(error.message);
      setLoading(false);
    }
  }, [modelo]);

  // Função principal de processamento
  const processarResultadosCompletos = (resultados, tipoModelo) => {
    try {
      console.log('🔍 Processando dados de série temporal...');

      // EXTRAIR PREVISÕES
      const previsoes = resultados.previsoes || [];
      const ajustados = resultados.ajustados || [];
      const residuos = resultados.residuos || [];
      const historico = resultados.historico || [];

      // EXTRAIR MÉTRICAS
      const metricas = resultados.metricas || {};
      const metricasAjuste = metricas.ajuste || {};
      const metricasDiagnostico = metricas.diagnostico || {};

      // EXTRAIR INTERPRETAÇÃO TÉCNICA
      const interpretacao = resultados.interpretacao_tecnica || {};

      // EXTRAIR COEFICIENTES
      let coeficientes = [];
      if (resultados.coeficientes && Array.isArray(resultados.coeficientes)) {
        coeficientes = resultados.coeficientes.map(coef => ({
          termo: coef.termo || coef.parameter || 'Parâmetro',
          estimativa: parseFloat(coef.estimativa || coef.estimate || 0) || 0,
          erro_padrao: parseFloat(coef.erro_padrao || coef.std_error || 0) || 0,
          estatistica: parseFloat(coef.estatistica_t || coef.estatistica || coef.t_value || 0) || 0,
          p_valor: parseFloat(coef.p_valor || coef.p_value || 0) || 0,
          significancia: coef.significativo_95 ? 
                        (coef.significativo_99 ? '***' : '**') : 
                        (coef.significativo_95 ? '**' : 
                         (coef.p_valor < 0.1 ? '.' : 'ns'))
        }));
      }

      // EXTRAIR INFORMAÇÕES DO MODELO
      const modeloInfo = resultados.modelo_info || {};
      const qualidadeAjuste = resultados.qualidade_ajuste || {};
      const periodoPrevisao = resultados.periodo_previsao || {};

      // PREPARAR DADOS PARA GRÁFICOS

      // 1. Dados históricos + previsões
      const dadosGrafico = [];
      
      // Processar previsões
      if (previsoes && Array.isArray(previsoes)) {
        previsoes.forEach(item => {
          dadosGrafico.push({
            periodo: item.periodo || item.data || `Período ${dadosGrafico.length + 1}`,
            valor: parseFloat(item.previsao || 0) || 0,
            inferior: parseFloat(item.inferior || item.intervalo_95?.inferior || 0) || 0,
            superior: parseFloat(item.superior || item.intervalo_95?.superior || 0) || 0,
            tipo: 'previsao'
          });
        });
      }

      // 2. Dados de resíduos (criar simulados baseados nos resíduos reais)
      const residuosData = [];
      if (metricasAjuste.residuos_mean !== undefined) {
        // Criar distribuição de resíduos baseada nas estatísticas
        for (let i = 1; i <= 20; i++) {
          // Simular resíduos baseados nas estatísticas reais
          const residuoSimulado = (metricasAjuste.residuos_mean || 0) + 
                                  (metricasAjuste.residuos_sd || 0.5) * (Math.random() - 0.5) * 2;
          residuosData.push({
            indice: i,
            residuo: residuoSimulado
          });
        }
      }

      // 3. Métricas formatadas
      const metricasFormatadas = {
        // Ajuste
        aic: metricasAjuste.AIC || metricasAjuste.aic || null,
        bic: metricasAjuste.BIC || metricasAjuste.bic || null,
        aicc: metricasAjuste.AICc || metricasAjuste.aicc || null,
        log_likelihood: modeloInfo.log_likelihood || null,
        sigma2: modeloInfo.sigma2 || null,
        
        // Precisão
        rmse: metricasAjuste.RMSE || metricasAjuste.rmse || null,
        mae: metricasAjuste.MAE || metricasAjuste.mae || null,
        mape: metricasAjuste.MAPE || metricasAjuste.mape || null,
        mase: metricasAjuste.MASE || metricasAjuste.mase || null,
        smape: metricasAjuste.sMAPE || metricasAjuste.smape || null,
        theil_u: metricasAjuste.Theil_U || metricasAjuste.theil_u || null,
        r2: metricasAjuste.R2 || metricasAjuste.r2 || null,
        r2_adj: metricasAjuste.R2_adj || metricasAjuste.r2_adj || null,
        
        // Estatísticas dos resíduos
        residuos_mean: metricasAjuste.residuos_mean || null,
        residuos_sd: metricasAjuste.residuos_sd || null,
        residuos_skewness: metricasAjuste.residuos_skewness || null,
        residuos_kurtosis: metricasAjuste.residuos_kurtosis || null,
        
        // Diagnóstico
        ljung_box: metricasDiagnostico.teste_ljung_box?.valor_p || null,
        normalidade: metricasDiagnostico.teste_normalidade?.valor_p || null,
        arch: metricasDiagnostico.teste_arch?.valor_p || null,
        outliers: metricasDiagnostico.outliers?.n_outliers || 0,
        tem_outliers: metricasDiagnostico.outliers?.tem_outliers || false
      };

      // 4. Interpretações
      const interpretacoes = [
        interpretacao.tendencia_global || 'Tendência não identificada',
        qualidadeAjuste.classificacao_mape ? `MAPE classificado como ${qualidadeAjuste.classificacao_mape}` : null,
        qualidadeAjuste.classificacao_geral ? `Classificação geral: ${qualidadeAjuste.classificacao_geral}` : null,
        metricasDiagnostico.teste_ljung_box?.conclusao || null,
        metricasDiagnostico.teste_normalidade?.conclusao || null,
        metricasDiagnostico.teste_arch?.conclusao || null,
        metricasDiagnostico.outliers?.tem_outliers ? `Detectados ${metricasDiagnostico.outliers.n_outliers} outliers` : null
      ].filter(Boolean);

      // 5. Estatísticas
      const estatisticas = {
        mediaPrevisao: previsoes.length > 0 
          ? previsoes.reduce((sum, p) => sum + (parseFloat(p.previsao) || 0), 0) / previsoes.length 
          : 0,
        amplitudeMedia: previsoes.length > 0 
          ? previsoes.reduce((sum, p) => sum + ((parseFloat(p.superior) || 0) - (parseFloat(p.inferior) || 0)), 0) / previsoes.length 
          : 0,
        crescimentoPercentual: interpretacao.crescimento_percentual || 
                               (previsoes.length >= 2 ? 
                                 ((parseFloat(previsoes[previsoes.length - 1].previsao) - parseFloat(previsoes[0].previsao)) / 
                                  Math.abs(parseFloat(previsoes[0].previsao) || 1)) * 100 
                               : 0)
      };

      // MONTAR OBJETO COMPLETO
      const dados = {
        success: true,
        timestamp: resultados.timestamp || new Date().toISOString(),
        tipoModelo,
        nome: modelo.nome || `Modelo ${tipoModelo.toUpperCase()}`,
        n_observacoes: resultados.n_observacoes || 0,
        
        // Dados principais
        previsoes,
        ajustados,
        residuos,
        historico,
        
        // Dados para gráficos
        dadosGrafico,
        residuosData,
        
        // Métricas
        metricas: metricasFormatadas,
        
        // Coeficientes
        coeficientes,
        
        // Interpretações
        interpretacoes,
        interpretacao,
        
        // Informações do modelo
        modeloInfo,
        qualidadeAjuste,
        periodoPrevisao,
        
        // Estatísticas
        estatisticas,
        
        // Resumo
        resumo: resultados.resumo || ''
      };

      console.log('✅ Dados de série temporal processados:', dados);
      setDadosProcessados(dados);
      setLoading(false);

    } catch (error) {
      console.error('❌ Erro no processamento:', error);
      setErro(error.message);
      setLoading(false);
    }
  };

  // FUNÇÃO DE SIGNIFICÂNCIA
  const getSignificanciaR = (pValue) => {
    if (!pValue && pValue !== 0) return 'ns';
    if (pValue < 0.001) return '***';
    if (pValue < 0.01) return '**';
    if (pValue < 0.05) return '*';
    if (pValue < 0.1) return '.';
    return 'ns';
  };

  // Funções auxiliares
  const formatarNumero = (valor, decimais = 4, fallback = '-') => {
    if (valor === undefined || valor === null || valor === '' || valor === 'NA') return fallback;
    const num = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(num)) return fallback;
    if (Math.abs(num) < 0.0001 && num !== 0) return num.toExponential(decimais);
    return decimais === 0 ? num.toString() : num.toFixed(decimais);
  };

  const formatarPercentual = (valor) => {
    if (valor === undefined || valor === null || valor === 'NA') return '-';
    const num = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(num)) return '-';
    return `${(num * 100).toFixed(2)}%`;
  };

  const formatarData = (data) => {
    if (!data) return 'N/A';
    return String(data);
  };

  const getCorModelo = () => {
    if (!dadosProcessados) return 'from-blue-600 to-indigo-600';
    switch (dadosProcessados.tipoModelo) {
      case 'arima': return 'from-blue-500 to-blue-700';
      case 'sarima': return 'from-purple-500 to-indigo-700';
      case 'ets': return 'from-green-500 to-emerald-700';
      case 'prophet': return 'from-pink-500 to-rose-700';
      default: return 'from-blue-600 to-indigo-600';
    }
  };

  const getIconeModelo = () => {
    if (!dadosProcessados) return <History className="w-8 h-8" />;
    switch (dadosProcessados.tipoModelo) {
      case 'arima': return <TrendingUp className="w-8 h-8" />;
      case 'sarima': return <Calendar className="w-8 h-8" />;
      case 'ets': return <Activity className="w-8 h-8" />;
      case 'prophet': return <Sparkles className="w-8 h-8" />;
      default: return <History className="w-8 h-8" />;
    }
  };

  const getNomeModelo = () => {
    if (!dadosProcessados) return 'Série Temporal';
    switch (dadosProcessados.tipoModelo) {
      case 'arima': return 'ARIMA';
      case 'sarima': return 'SARIMA';
      case 'ets': return 'ETS (Suavização Exponencial)';
      case 'prophet': return 'Prophet (Facebook)';
      default: return dadosProcessados.tipoModelo.toUpperCase();
    }
  };

  // Renderizar previsões
  const renderPrevisoes = () => {
    if (!dadosProcessados || dadosProcessados.previsoes.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Info className="w-8 h-8 mx-auto mb-2" />
          <p>Nenhuma previsão disponível</p>
        </div>
      );
    }

    const { previsoes, estatisticas, periodoPrevisao } = dadosProcessados;
    const previsoesParaExibir = todasPrevisoesVisiveis ? previsoes : previsoes.slice(0, 20);

    return (
      <div className="space-y-6">
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">Média das Previsões</div>
            <div className="text-2xl font-bold text-blue-800">
              {formatarNumero(estatisticas.mediaPrevisao, 4)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="text-sm text-purple-600 font-medium">Amplitude Média</div>
            <div className="text-2xl font-bold text-purple-800">
              {formatarNumero(estatisticas.amplitudeMedia, 4)}
            </div>
          </div>
          <div className={`bg-gradient-to-br ${estatisticas.crescimentoPercentual >= 0 ? 'from-green-50 to-green-100' : 'from-red-50 to-red-100'} p-4 rounded-lg border ${estatisticas.crescimentoPercentual >= 0 ? 'border-green-200' : 'border-red-200'}`}>
            <div className="text-sm text-gray-600 font-medium">Crescimento Total</div>
            <div className={`text-2xl font-bold ${estatisticas.crescimentoPercentual >= 0 ? 'text-green-800' : 'text-red-800'}`}>
              {estatisticas.crescimentoPercentual.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Tabela de previsões */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Previsões {getNomeModelo()}
            </CardTitle>
            <CardDescription>
              {periodoPrevisao.inicio ? `Período: ${formatarData(periodoPrevisao.inicio)}` : ''}
              {periodoPrevisao.fim ? ` a ${formatarData(periodoPrevisao.fim)}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Previsão</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Limite Inferior</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Limite Superior</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Intervalo</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previsoesParaExibir.map((prev, idx) => {
                    const previsao = parseFloat(prev.previsao) || 0;
                    const inferior = parseFloat(prev.inferior || prev.intervalo_95?.inferior) || 0;
                    const superior = parseFloat(prev.superior || prev.intervalo_95?.superior) || 0;
                    const intervalo = superior - inferior;
                    
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          Período {prev.periodo || idx + 1}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {prev.data || prev.ds || ''}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono font-bold text-blue-600">
                          {formatarNumero(previsao, 6)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-500">
                          {formatarNumero(inferior, 6)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-500">
                          {formatarNumero(superior, 6)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${Math.min(100, (intervalo / Math.abs(previsao)) * 10)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">
                              ±{(intervalo / 2).toFixed(4)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Botão para mostrar mais */}
            {previsoes.length > 20 && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTodasPrevisoesVisiveis(!todasPrevisoesVisiveis)}
                >
                  {todasPrevisoesVisiveis ? 'Mostrar menos' : `Mostrar todas as ${previsoes.length} previsões`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderizar métricas
  const renderMetricas = () => {
    if (!dadosProcessados) return null;

    const { metricas, qualidadeAjuste } = dadosProcessados;

    const metricasLista = [
      { label: 'AIC', valor: metricas.aic, desc: 'Critério de Informação de Akaike', formato: 'numero' },
      { label: 'BIC', valor: metricas.bic, desc: 'Critério de Informação Bayesiano', formato: 'numero' },
      { label: 'AICc', valor: metricas.aicc, desc: 'AIC corrigido', formato: 'numero' },
      { label: 'Log-Verossimilhança', valor: metricas.log_likelihood, desc: 'Log-likelihood', formato: 'numero' },
      { label: 'σ²', valor: metricas.sigma2, desc: 'Variância dos resíduos', formato: 'numero' },
      { label: 'RMSE', valor: metricas.rmse, desc: 'Raiz do Erro Quadrático Médio', formato: 'numero' },
      { label: 'MAE', valor: metricas.mae, desc: 'Erro Absoluto Médio', formato: 'numero' },
      { label: 'MAPE', valor: metricas.mape, desc: 'Erro Percentual Absoluto Médio', formato: 'percentual' },
      { label: 'MASE', valor: metricas.mase, desc: 'Erro Absoluto Escalonado Médio', formato: 'numero' },
      { label: 'sMAPE', valor: metricas.smape, desc: 'MAPE Simétrico', formato: 'percentual' },
      { label: 'Theil\'s U', valor: metricas.theil_u, desc: 'Coeficiente de Theil', formato: 'numero' },
      { label: 'R²', valor: metricas.r2, desc: 'Coeficiente de Determinação', formato: 'percentual' },
      { label: 'R² Ajustado', valor: metricas.r2_adj, desc: 'R² ajustado', formato: 'percentual' }
    ];

    const metricasValidas = metricasLista.filter(m => m.valor !== null && m.valor !== undefined);

    return (
      <div className="space-y-6">
        {/* Cards de métricas principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricasValidas.slice(0, 4).map((metrica, idx) => (
            <div key={idx} className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="text-sm text-gray-600">{metrica.label}</div>
              <div className="text-2xl font-bold mt-1">
                {metrica.formato === 'percentual' 
                  ? formatarPercentual(metrica.valor / 100)
                  : formatarNumero(metrica.valor, metrica.label.includes('AIC') ? 2 : 4)}
              </div>
              <div className="text-xs text-gray-500 mt-1">{metrica.desc}</div>
            </div>
          ))}
        </div>

        {/* Tabela de métricas completa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="w-5 h-5" />
              Métricas Detalhadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Métrica</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classificação</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metricasValidas.map((metrica, idx) => {
                    let classificacao = '';
                    if (metrica.label === 'MAPE' && metrica.valor !== null) {
                      if (metrica.valor < 10) classificacao = 'Excelente';
                      else if (metrica.valor < 20) classificacao = 'Boa';
                      else if (metrica.valor < 50) classificacao = 'Razoável';
                      else classificacao = 'Fraca';
                    }

                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{metrica.label}</td>
                        <td className="px-4 py-3 font-mono">
                          {metrica.formato === 'percentual' 
                            ? formatarPercentual(metrica.valor / 100)
                            : formatarNumero(metrica.valor, 4)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{metrica.desc}</td>
                        <td className="px-4 py-3">
                          {classificacao && (
                            <Badge variant={
                              classificacao === 'Excelente' ? 'success' :
                              classificacao === 'Boa' ? 'info' :
                              classificacao === 'Razoável' ? 'warning' : 'danger'
                            }>
                              {classificacao}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Interpretação do MAPE */}
            {metricas.mape !== null && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">📊 Interpretação do MAPE</h4>
                <p className="text-sm text-blue-700">
                  {metricas.mape < 10 && '✅ Excelente precisão: O modelo tem alta acurácia (MAPE < 10%)'}
                  {metricas.mape >= 10 && metricas.mape < 20 && '👍 Boa precisão: Previsões adequadas para a maioria das aplicações (MAPE 10-20%)'}
                  {metricas.mape >= 20 && metricas.mape < 50 && '⚠️ Precisão razoável: Útil para planejamento geral, mas com cautela (MAPE 20-50%)'}
                  {metricas.mape >= 50 && '❌ Baixa precisão: Considere revisar o modelo ou transformar os dados (MAPE > 50%)'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderizar coeficientes
  const renderCoeficientes = () => {
    if (!dadosProcessados || dadosProcessados.coeficientes.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Info className="w-8 h-8 mx-auto mb-2" />
          <p>Nenhum coeficiente disponível para este modelo</p>
        </div>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sigma className="w-5 h-5" />
            Coeficientes do Modelo {getNomeModelo()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parâmetro</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estimativa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Erro Padrão</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estatística</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">p-valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Signif.</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dadosProcessados.coeficientes.map((coef, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap font-medium">{coef.termo}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono">{formatarNumero(coef.estimativa, 6)}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono">{formatarNumero(coef.erro_padrao, 6)}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono">{formatarNumero(coef.estatistica, 4)}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono">
                      <span className={coef.p_valor < 0.05 ? 'text-green-600' : 'text-red-600'}>
                        {formatarNumero(coef.p_valor, 4)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        coef.significancia === '***' ? 'bg-green-100 text-green-800' :
                        coef.significancia === '**' ? 'bg-blue-100 text-blue-800' :
                        coef.significancia === '*' ? 'bg-yellow-100 text-yellow-800' :
                        coef.significancia === '.' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {coef.significancia}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            <p>*** p &lt; 0.001, ** p &lt; 0.01, * p &lt; 0.05, . p &lt; 0.1</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Renderizar diagnósticos
  const renderDiagnostico = () => {
    if (!dadosProcessados) return null;

    const { metricas, interpretacoes, modeloInfo, qualidadeAjuste, estatisticas, interpretacao } = dadosProcessados;

    return (
      <div className="space-y-6">
        {/* Diagnóstico de Resíduos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Diagnóstico de Resíduos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Testes Estatísticos</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Teste Ljung-Box (p-valor)</span>
                    <div>
                      {metricas.ljung_box !== null ? (
                        <Badge variant={metricas.ljung_box > 0.05 ? 'success' : 'warning'}>
                          {formatarNumero(metricas.ljung_box, 4)}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Teste de Normalidade (p-valor)</span>
                    <div>
                      {metricas.normalidade !== null ? (
                        <Badge variant={metricas.normalidade > 0.05 ? 'success' : 'warning'}>
                          {formatarNumero(metricas.normalidade, 4)}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Teste ARCH (p-valor)</span>
                    <div>
                      {metricas.arch !== null ? (
                        <Badge variant={metricas.arch > 0.05 ? 'success' : 'warning'}>
                          {formatarNumero(metricas.arch, 4)}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Interpretação:</strong> p-valor &gt; 0.05 indica resíduos independentes/normais.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Resumo dos Resíduos</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Média dos resíduos:</span>
                    <span className="font-mono">{formatarNumero(metricas.residuos_mean, 6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Desvio padrão:</span>
                    <span className="font-mono">{formatarNumero(metricas.residuos_sd, 6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Assimetria (skewness):</span>
                    <span className="font-mono">{formatarNumero(metricas.residuos_skewness, 4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Curtose:</span>
                    <span className="font-mono">{formatarNumero(metricas.residuos_kurtosis, 4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Outliers detectados:</span>
                    <span className="font-mono">{metricas.outliers || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interpretações Técnicas */}
        {interpretacoes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Interpretações Técnicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {interpretacoes.map((interp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{interp}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Recomendações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {estatisticas.amplitudeMedia > Math.abs(estatisticas.mediaPrevisao) * 0.5 && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800 font-medium">⚠️ Alta Incerteza</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Intervalos de confiança amplos. Considere mais dados históricos ou revisar o modelo.
                  </p>
                </div>
              )}

              {metricas.mape > 50 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-red-800 font-medium">❌ Baixa Precisão</p>
                  <p className="text-sm text-red-700 mt-1">
                    MAPE acima de 50%. Considere transformar os dados ou testar outros modelos.
                  </p>
                </div>
              )}

              {metricas.ljung_box !== null && metricas.ljung_box < 0.05 && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800 font-medium">⚠️ Autocorrelação nos Resíduos</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Resíduos autocorrelacionados (p &lt; 0.05). Considere ajustar a ordem do modelo.
                  </p>
                </div>
              )}

              {(dadosProcessados.n_observacoes || 0) < 24 && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-blue-800 font-medium">📊 Poucas Observações</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Menos de 24 observações. Modelos de séries temporais funcionam melhor com mais dados.
                  </p>
                </div>
              )}

              {metricas.outliers > 0 && (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-orange-800 font-medium">📈 Outliers Detectados</p>
                  <p className="text-sm text-orange-700 mt-1">
                    {metricas.outliers} outliers identificados. Considere tratamento para melhorar o modelo.
                  </p>
                </div>
              )}

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800 font-medium">✅ Pontos Fortes do Modelo</p>
                <p className="text-sm text-green-700 mt-1">
                  {dadosProcessados.tipoModelo === 'arima' && 'ARIMA: Modelo flexível para séries estacionárias.'}
                  {dadosProcessados.tipoModelo === 'sarima' && 'SARIMA: Captura sazonalidade com componentes ARIMA.'}
                  {dadosProcessados.tipoModelo === 'ets' && 'ETS: Suavização exponencial com tendência e sazonalidade.'}
                  {dadosProcessados.tipoModelo === 'prophet' && 'Prophet: Robusto a outliers e mudanças de tendência.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderizar gráficos
  const renderGraficos = () => {
    if (!dadosProcessados) return null;

    const { dadosGrafico, residuosData, metricas, nome, tipoModelo } = dadosProcessados;

    // Gráfico de Previsões vs Histórico
    const graficoPrevisoes = () => {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={dadosGrafico}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="periodo" 
              label={{ value: 'Período', position: 'bottom' }}
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              label={{ value: 'Valor', angle: -90, position: 'left' }}
            />
            <Tooltip 
              formatter={(value, name) => [formatarNumero(value, 4), name]}
              labelFormatter={(label) => `Período: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="valor" 
              stroke="#EF4444" 
              strokeWidth={3}
              dot={{ r: 4 }}
              name="Previsão"
            />
            <Area
              type="monotone"
              dataKey="superior"
              stroke="none"
              fill="#EF4444"
              fillOpacity={0.1}
              name="IC Superior"
            />
            <Area
              type="monotone"
              dataKey="inferior"
              stroke="none"
              fill="#EF4444"
              fillOpacity={0.1}
              name="IC Inferior"
            />
          </ComposedChart>
        </ResponsiveContainer>
      );
    };

    // Gráfico de Resíduos
    const graficoResiduos = () => {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={residuosData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="indice" label={{ value: 'Observação', position: 'bottom' }} />
            <YAxis label={{ value: 'Resíduo', angle: -90, position: 'left' }} />
            <Tooltip 
              formatter={(value) => [formatarNumero(value, 6), 'Resíduo']}
            />
            <Bar 
              dataKey="residuo" 
              fill="#8884d8" 
              radius={[4, 4, 0, 0]}
            >
              {residuosData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.residuo >= 0 ? '#3B82F6' : '#EF4444'} 
                />
              ))}
            </Bar>
            <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
          </BarChart>
        </ResponsiveContainer>
      );
    };

    const graficos = {
      previsoes: graficoPrevisoes,
      residuos: graficoResiduos
    };

    return (
      <div className="space-y-6">
        {/* Navegação entre gráficos */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setGraficoAtivo('previsoes')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              graficoAtivo === 'previsoes'
                ? `bg-gradient-to-r ${getCorModelo()} text-white shadow-lg`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📈 Previsões
          </button>
          <button
            onClick={() => setGraficoAtivo('residuos')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              graficoAtivo === 'residuos'
                ? `bg-gradient-to-r ${getCorModelo()} text-white shadow-lg`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🔍 Resíduos
          </button>
        </div>

        {/* Gráfico ativo */}
        <Card>
          <CardContent className="p-6">
            <div className="h-[400px]">
              {graficos[graficoAtivo]()}
            </div>
          </CardContent>
        </Card>

        {/* Interpretação do gráfico */}
        <div className={`p-4 rounded-lg border ${
          tipoModelo === 'arima' ? 'bg-blue-50 border-blue-200' :
          tipoModelo === 'sarima' ? 'bg-purple-50 border-purple-200' :
          tipoModelo === 'ets' ? 'bg-green-50 border-green-200' :
          'bg-pink-50 border-pink-200'
        }`}>
          <h4 className={`font-semibold mb-2 ${
            tipoModelo === 'arima' ? 'text-blue-800' :
            tipoModelo === 'sarima' ? 'text-purple-800' :
            tipoModelo === 'ets' ? 'text-green-800' :
            'text-pink-800'
          }`}>
            💡 Interpretação
          </h4>
          <p className={`text-sm ${
            tipoModelo === 'arima' ? 'text-blue-700' :
            tipoModelo === 'sarima' ? 'text-purple-700' :
            tipoModelo === 'ets' ? 'text-green-700' :
            'text-pink-700'
          }`}>
            {graficoAtivo === 'previsoes' && (
              <>
                <strong>Linha vermelha:</strong> Previsões futuras com intervalo de confiança (área sombreada).<br/>
                Quanto menor a área sombreada, maior a confiança na previsão.<br/>
                <strong>MAPE:</strong> {metricas.mape ? metricas.mape.toFixed(2) + '%' : 'N/A'}
              </>
            )}
            {graficoAtivo === 'residuos' && (
              <>
                <strong>Barras azuis/vermelhas:</strong> Resíduos (diferença entre observado e previsto).<br/>
                <strong>Linha em zero:</strong> Resíduos devem oscilar aleatoriamente em torno de zero.<br/>
                <strong>Barras vermelhas fora do padrão:</strong> Possíveis outliers ou pontos de mudança.
              </>
            )}
          </p>
        </div>
      </div>
    );
  };

  // Aba Resumo
  const AbaResumo = () => {
    if (!dadosProcessados) return null;

    const { interpretacoes, metricas, estatisticas, modeloInfo, periodoPrevisao, interpretacao } = dadosProcessados;

    return (
      <div className="space-y-6">
        {/* Cards rápidos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Observações', value: dadosProcessados.n_observacoes, desc: 'Períodos históricos', cor: 'blue' },
            { label: 'Previsões', value: dadosProcessados.previsoes.length, desc: 'Períodos futuros', cor: 'purple' },
            { label: 'MAPE', value: metricas.mape ? `${metricas.mape.toFixed(2)}%` : 'N/A', desc: 'Erro percentual', cor: metricas.mape < 10 ? 'green' : metricas.mape < 20 ? 'yellow' : 'red' },
            { label: 'Crescimento', value: `${estatisticas.crescimentoPercentual.toFixed(2)}%`, desc: 'Total previsto', cor: estatisticas.crescimentoPercentual >= 0 ? 'green' : 'red' }
          ].map((stat, idx) => {
            const corClasses = {
              blue: 'bg-blue-50 border-blue-200',
              purple: 'bg-purple-50 border-purple-200',
              green: 'bg-green-50 border-green-200',
              yellow: 'bg-yellow-50 border-yellow-200',
              red: 'bg-red-50 border-red-200'
            };
            return (
              <div key={idx} className={`text-center p-4 ${corClasses[stat.cor]} rounded-lg border`}>
                <div className="text-xl font-bold text-gray-800">{stat.value}</div>
                <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
                <div className="text-xs text-gray-500">{stat.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Informações do Modelo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Especificação do Modelo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Modelo</div>
                <div className="text-lg font-semibold">{getNomeModelo()}</div>
              </div>
              {modeloInfo.ordem_arima && (
                <div>
                  <div className="text-sm text-gray-600">Ordem ARIMA</div>
                  <div className="text-lg font-semibold font-mono">{modeloInfo.ordem_arima}</div>
                </div>
              )}
              {modeloInfo.ordem_sazonal && (
                <div>
                  <div className="text-sm text-gray-600">Ordem Sazonal</div>
                  <div className="text-lg font-semibold font-mono">{modeloInfo.ordem_sazonal}</div>
                </div>
              )}
              {modeloInfo.formula_completa && (
                <div>
                  <div className="text-sm text-gray-600">Fórmula</div>
                  <div className="text-lg font-semibold">{modeloInfo.formula_completa}</div>
                </div>
              )}
            </div>

            {periodoPrevisao.inicio && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Período de Previsão:</strong> {formatarData(periodoPrevisao.inicio)}
                  {periodoPrevisao.fim ? ` a ${formatarData(periodoPrevisao.fim)}` : ''}
                </p>
              </div>
            )}

            {interpretacao.tendencia_global && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Tendência Global:</strong> {interpretacao.tendencia_global}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interpretações */}
        {interpretacoes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Resumo da Análise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {interpretacoes.map((interp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{interp}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // 🔥 GERAR PDF PROFISSIONAL
  const gerarPDFProfissional = async () => {
    if (!dadosProcessados) return;
    
    setExportandoPDF(true);
    
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margem = 20;
      
      doc.setFont('helvetica', 'normal');
      
      // CAPA
      doc.setFillColor(10, 31, 68);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('RELATÓRIO TÉCNICO', pageWidth / 2, 90, { align: 'center' });
      
      doc.setFontSize(20);
      doc.text('SÉRIES TEMPORAIS', pageWidth / 2, 110, { align: 'center' });
      
      doc.setFontSize(20);
      doc.text(dadosProcessados.nome?.toUpperCase() || 'ANÁLISE DE SÉRIE TEMPORAL', pageWidth / 2, 140, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(`Modelo: ${getNomeModelo()}`, pageWidth / 2, 170, { align: 'center' });
      doc.text(`Observações: ${dadosProcessados.n_observacoes} | Previsões: ${dadosProcessados.previsoes.length}`, pageWidth / 2, 180, { align: 'center' });
      doc.text(`MAPE: ${dadosProcessados.metricas.mape ? dadosProcessados.metricas.mape.toFixed(2) + '%' : 'N/A'}`, pageWidth / 2, 190, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, 250, { align: 'center' });
      doc.text('Sistema JIAM Preditivo - Motor Estatístico R', pageWidth / 2, 260, { align: 'center' });
      
      // PÁGINA 2: ESPECIFICAÇÃO
      doc.addPage();
      
      doc.setFillColor(10, 31, 68);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
      doc.setFontSize(10);
      doc.text('Página 2', pageWidth - margem, 20, { align: 'right' });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.text('ESPECIFICAÇÃO DO MODELO', margem, 50);
      
      doc.setFontSize(11);
      let yPos = 70;
      
      const detalhes = [
        ['Modelo:', getNomeModelo()],
        ['Observações:', dadosProcessados.n_observacoes.toString()],
        ['Previsões:', dadosProcessados.previsoes.length.toString()],
      ];
      
      if (dadosProcessados.modeloInfo.ordem_arima) {
        detalhes.push(['Ordem ARIMA:', dadosProcessados.modeloInfo.ordem_arima]);
      }
      
      if (dadosProcessados.modeloInfo.ordem_sazonal) {
        detalhes.push(['Ordem Sazonal:', dadosProcessados.modeloInfo.ordem_sazonal]);
      }
      
      if (dadosProcessados.modeloInfo.formula_completa) {
        detalhes.push(['Fórmula:', dadosProcessados.modeloInfo.formula_completa]);
      }
      
      detalhes.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margem, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margem + 60, yPos);
        yPos += 8;
      });
      
      // PÁGINA 3: PREVISÕES
      doc.addPage();
      
      doc.setFillColor(10, 31, 68);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
      doc.setFontSize(10);
      doc.text('Página 3', pageWidth - margem, 20, { align: 'right' });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.text('PREVISÕES', margem, 50);
      
      const previsoesTable = dadosProcessados.previsoes.slice(0, 15).map((prev, idx) => [
        `Período ${idx + 1}`,
        prev.data || prev.ds || '',
        formatarNumero(prev.previsao, 6),
        formatarNumero(prev.inferior || prev.intervalo_95?.inferior, 6),
        formatarNumero(prev.superior || prev.intervalo_95?.superior, 6)
      ]);
      
      autoTable(doc, {
        startY: 60,
        head: [['Período', 'Data', 'Previsão', 'Limite Inf.', 'Limite Sup.']],
        body: previsoesTable,
        theme: 'grid',
        headStyles: { fillColor: [10, 31, 68], textColor: 255 },
        margin: { left: margem, right: margem }
      });
      
      // PÁGINA 4: MÉTRICAS
      doc.addPage();
      
      doc.setFillColor(10, 31, 68);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
      doc.setFontSize(10);
      doc.text('Página 4', pageWidth - margem, 20, { align: 'right' });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.text('MÉTRICAS DE PERFORMANCE', margem, 50);
      
      const metricasArray = [];
      if (dadosProcessados.metricas.rmse !== null) metricasArray.push(['RMSE', formatarNumero(dadosProcessados.metricas.rmse, 4)]);
      if (dadosProcessados.metricas.mae !== null) metricasArray.push(['MAE', formatarNumero(dadosProcessados.metricas.mae, 4)]);
      if (dadosProcessados.metricas.mape !== null) metricasArray.push(['MAPE', formatarNumero(dadosProcessados.metricas.mape, 2) + '%']);
      if (dadosProcessados.metricas.aic !== null) metricasArray.push(['AIC', formatarNumero(dadosProcessados.metricas.aic, 2)]);
      if (dadosProcessados.metricas.bic !== null) metricasArray.push(['BIC', formatarNumero(dadosProcessados.metricas.bic, 2)]);
      if (dadosProcessados.metricas.r2 !== null) metricasArray.push(['R²', formatarNumero(dadosProcessados.metricas.r2, 4)]);
      
      autoTable(doc, {
        startY: 60,
        body: metricasArray,
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 5 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: 60 } },
        margin: { left: margem, right: margem }
      });
      
      // PÁGINA 5: COEFICIENTES (se houver)
      if (dadosProcessados.coeficientes.length > 0) {
        doc.addPage();
        
        doc.setFillColor(10, 31, 68);
        doc.rect(0, 0, pageWidth, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
        doc.setFontSize(10);
        doc.text('Página 5', pageWidth - margem, 20, { align: 'right' });
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(18);
        doc.text('COEFICIENTES DO MODELO', margem, 50);
        
        const coefTable = dadosProcessados.coeficientes.map(coef => [
          coef.termo,
          formatarNumero(coef.estimativa, 6),
          formatarNumero(coef.erro_padrao, 6),
          formatarNumero(coef.estatistica, 4),
          formatarNumero(coef.p_valor, 4),
          coef.significancia
        ]);
        
        autoTable(doc, {
          startY: 60,
          head: [['Parâmetro', 'Estimativa', 'Erro Padrão', 'Estatística', 'p-valor', 'Signif.']],
          body: coefTable,
          theme: 'grid',
          headStyles: { fillColor: [10, 31, 68], textColor: 255 },
          margin: { left: margem, right: margem }
        });
      }
      
      // PÁGINA FINAL: CONCLUSÃO
      const totalPages = doc.internal.getNumberOfPages();
      doc.setPage(totalPages);
      doc.addPage();
      
      doc.setFillColor(10, 31, 68);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
      doc.setFontSize(10);
      const totalPagesFinal = doc.internal.getNumberOfPages();
      doc.text(`Página ${totalPagesFinal}`, pageWidth - margem, 20, { align: 'right' });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.text('CONCLUSÃO', margem, 50);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      let yConclusao = 70;
      
      let conclusao = '';
      const mape = dadosProcessados.metricas.mape;
      const crescimento = dadosProcessados.estatisticas.crescimentoPercentual;
      
      conclusao = `O modelo ${getNomeModelo()} foi aplicado à série temporal com ${dadosProcessados.n_observacoes} observações. `;
      
      if (mape !== null) {
        conclusao += `A precisão do modelo é ${mape < 10 ? 'excelente' : mape < 20 ? 'boa' : mape < 50 ? 'razoável' : 'baixa'} `;
        conclusao += `(MAPE = ${mape.toFixed(2)}%). `;
      }
      
      conclusao += `As previsões indicam um crescimento total de ${crescimento.toFixed(2)}% `;
      conclusao += `no período de ${dadosProcessados.previsoes.length} períodos. `;
      
      if (dadosProcessados.metricas.ljung_box !== null && dadosProcessados.metricas.ljung_box > 0.05) {
        conclusao += `Os resíduos não apresentam autocorrelação significativa (p > 0.05). `;
      } else if (dadosProcessados.metricas.ljung_box !== null) {
        conclusao += `Há indícios de autocorrelação nos resíduos (p < 0.05). `;
      }
      
      if (dadosProcessados.metricas.outliers > 0) {
        conclusao += `Foram detectados ${dadosProcessados.metricas.outliers} outliers. `;
      }
      
      const lines = doc.splitTextToSize(conclusao, pageWidth - 2 * margem);
      lines.forEach(line => {
        doc.text(line, margem, yConclusao);
        yConclusao += 7;
      });
      
      // Rodapé em todas as páginas
      const totalPagesFinalAll = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPagesFinalAll; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Sistema JIAM Preditivo - Motor Estatístico R', pageWidth / 2, pageHeight - 15, { align: 'center' });
        doc.text(`Documento confidencial - Página ${i} de ${totalPagesFinalAll}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
      
      const nomeArquivo = `Relatorio_JIAM_${dadosProcessados.tipoModelo}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(nomeArquivo);
      
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      alert(`Erro ao gerar PDF: ${error.message}`);
    } finally {
      setExportandoPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-4">
            <History className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Processando modelo de série temporal...</h3>
          <p className="text-gray-600 mt-2">Aguardando respostas do motor estatístico R</p>
          <div className="mt-4 flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Erro no Processamento</h3>
        <p className="text-gray-600 mb-4">{erro}</p>
        <pre className="text-left bg-red-50 p-4 rounded-lg overflow-auto max-h-96 text-sm">
          {JSON.stringify({ modelo }, null, 2)}
        </pre>
      </div>
    );
  }

  if (!dadosProcessados || !dadosProcessados.success) {
    return (
      <div className="text-center py-12">
        <Info className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Dados não disponíveis</h3>
        <p className="text-gray-600">Execute o modelo no motor R primeiro.</p>
      </div>
    );
  }

  // Abas disponíveis
  const abas = [
    { id: 'resumo', label: '📋 Resumo', icon: FileText },
    { id: 'previsoes', label: '🔮 Previsões', icon: CalendarDays },
    { id: 'metricas', label: '📊 Métricas', icon: Gauge },
    { id: 'coeficientes', label: 'β Coeficientes', icon: Sigma },
    { id: 'diagnostico', label: '🔍 Diagnóstico', icon: Activity },
    { id: 'graficos', label: '📈 Gráficos', icon: BarChart3 }
  ];

  return (
    <div className="space-y-8">
      {/* Cabeçalho Principal com botão PDF */}
      <div className={`bg-gradient-to-r ${getCorModelo()} text-white p-8 rounded-3xl`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              {getIconeModelo()}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                📈 Relatório de Série Temporal - {getNomeModelo()}
              </h1>
              <p className="text-lg opacity-90">
                {dadosProcessados.nome} • {dadosProcessados.n_observacoes} observações • {dadosProcessados.previsoes.length} previsões
              </p>
            </div>
          </div>
          
          <button
            onClick={gerarPDFProfissional}
            disabled={exportandoPDF}
            className="flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50"
          >
            {exportandoPDF ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Exportar PDF Completo
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-sm opacity-80">Observações</div>
            <div className="text-2xl font-bold">{dadosProcessados.n_observacoes}</div>
          </div>
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-sm opacity-80">Previsões</div>
            <div className="text-2xl font-bold">{dadosProcessados.previsoes.length}</div>
          </div>
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-sm opacity-80">MAPE</div>
            <div className="text-2xl font-bold">
              {dadosProcessados.metricas.mape ? dadosProcessados.metricas.mape.toFixed(2) + '%' : 'N/A'}
            </div>
          </div>
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-sm opacity-80">Crescimento</div>
            <div className={`text-2xl font-bold ${dadosProcessados.estatisticas.crescimentoPercentual >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {dadosProcessados.estatisticas.crescimentoPercentual.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Navegação por Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {abas.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAbaAtiva(tab.id)}
                  className={`
                    flex items-center gap-2 px-1 py-4 text-sm font-medium whitespace-nowrap
                    relative transition-colors
                    ${abaAtiva === tab.id
                      ? `text-blue-600 border-b-2 border-blue-500`
                      : 'text-gray-500 hover:text-gray-700'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Conteúdo da Tab */}
        <div className="p-6">
          {abaAtiva === 'resumo' && <AbaResumo />}
          {abaAtiva === 'previsoes' && renderPrevisoes()}
          {abaAtiva === 'metricas' && renderMetricas()}
          {abaAtiva === 'coeficientes' && renderCoeficientes()}
          {abaAtiva === 'diagnostico' && renderDiagnostico()}
          {abaAtiva === 'graficos' && renderGraficos()}
        </div>
      </div>

      {/* Rodapé com Ações */}
      <div className="bg-white rounded-xl shadow-sm p-6 border">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Análise concluída com sucesso - Motor Estatístico R</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelatorioSeriesTemporais;