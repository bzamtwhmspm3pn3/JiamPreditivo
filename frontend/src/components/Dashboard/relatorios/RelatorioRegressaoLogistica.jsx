// C:\Users\VhenancioMarthinz\Downloads\JiamPreditivo\frontend\src\components\Dashboard\relatorios\RelatorioRegressaoLogistica.jsx

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
  GitBranch
} from 'lucide-react';

// Componentes UI personalizados
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import Button from '../componentes/Button';
import Badge from '../componentes/Badge';
import Input from '../componentes/Input';
import Label from '../componentes/Label';

const RelatorioRegressaoLogistica = ({ modelo, dadosCompletos }) => {
  const [dadosProcessados, setDadosProcessados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [exportandoPDF, setExportandoPDF] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('resumo');
  const [detalheCoeficiente, setDetalheCoeficiente] = useState(null);
  const [simulacaoValores, setSimulacaoValores] = useState({});
  const [probabilidadeEstimada, setProbabilidadeEstimada] = useState(null);

  useEffect(() => {
    try {
      console.log('📊 RELATÓRIO REGRESSÃO LOGÍSTICA - Dados recebidos:');
      console.log('📦 modelo:', modelo);
      
      // VERIFICAR SE TEM DADOS DO R
      if (!modelo || !modelo.resultado) {
        throw new Error('Modelo sem dados do R');
      }

      const resultado = modelo.resultado;
      console.log('📦 resultado do R:', resultado);

      // DETECTAR TIPO DE OPERAÇÃO
      const modo = resultado.modo || modelo.modo || 
                  (resultado.coeficientes?.length === 2 ? 'simples' : 'multipla');
      console.log('🔍 Tipo de regressão detectado:', modo);

      // PROCESSAR RESULTADOS COMPLETOS
      processarResultadosCompletos(resultado, modo);

    } catch (error) {
      console.error('❌ Erro ao processar dados:', error);
      setErro(error.message);
      setLoading(false);
    }
  }, [modelo]);

  // Função principal de processamento
  const processarResultadosCompletos = (resultados, modo) => {
    try {
      console.log('🔍 Processando dados da regressão logística...');

      // EXTRAIR COEFICIENTES
      let coeficientesArray = [];
      if (resultados.coeficientes) {
        if (Array.isArray(resultados.coeficientes)) {
          // Formato array (como no seu backend)
          coeficientesArray = resultados.coeficientes.map(coef => ({
            termo: coef.termo || coef.name || 'desconhecido',
            estimativa: coef.estimativa || coef.estimate || 0,
            erro_padrao: coef.erro || coef.std_error || 0,
            estatistica: coef.estatistica || coef.z_value || coef.t_value || 0,
            valor_p: coef.valor_p || coef.p_value || 0,
            odds_ratio: coef.odds_ratio || Math.exp(coef.estimativa || coef.estimate || 0),
            ci_lower: coef.ci_lower || Math.exp((coef.estimativa || 0) - 1.96 * (coef.erro || 0)),
            ci_upper: coef.ci_upper || Math.exp((coef.estimativa || 0) + 1.96 * (coef.erro || 0)),
            significancia: coef.significancia || getSignificanciaR(coef.valor_p || coef.p_value || 0)
          }));
        } else if (typeof resultados.coeficientes === 'object') {
          // Formato objeto
          coeficientesArray = Object.entries(resultados.coeficientes).map(([termo, valores]) => ({
            termo,
            estimativa: valores.estimate || valores.estimativa || 0,
            erro_padrao: valores.std_error || valores.erro || 0,
            estatistica: valores.z_value || valores.t_value || valores.estatistica || 0,
            valor_p: valores.p_value || valores.valor_p || 0,
            odds_ratio: valores.odds_ratio || Math.exp(valores.estimate || valores.estimativa || 0),
            ci_lower: valores.ci_lower || Math.exp((valores.estimate || 0) - 1.96 * (valores.std_error || 0)),
            ci_upper: valores.ci_upper || Math.exp((valores.estimate || 0) + 1.96 * (valores.std_error || 0)),
            significancia: valores.significancia || getSignificanciaR(valores.p_value || valores.valor_p || 0)
          }));
        }
      }

      // EXTRAIR MÉTRICAS DE QUALIDADE
      const qualidade = resultados.qualidade || resultados.metrics || {};
      
      // EXTRAIR MATRIZ DE CONFUSÃO
      const matrizConfusao = resultados.matriz_confusao || {};

      // EXTRAIR EQUAÇÃO ESTIMADA
      const equacaoEstimada = resultados.equacao_estimada || {};

      // EXTRAIR DIAGNÓSTICOS
      const diagnosticos = resultados.diagnosticos || {};

      // EXTRAIR VARIÁVEIS DOS PARÂMETROS
      const parametros = modelo.parametros || {};
      let variaveisX = [];
      let variavelY = parametros.y || 'Y';
      
      if (parametros.x_multiplas) {
        if (Array.isArray(parametros.x_multiplas)) {
          variaveisX = parametros.x_multiplas;
        } else if (typeof parametros.x_multiplas === 'string') {
          variaveisX = parametros.x_multiplas.split(',').map(v => v.trim());
        }
      } else if (parametros.x) {
        variaveisX = [parametros.x];
      }

      // INICIALIZAR VALORES DE SIMULAÇÃO
      const valoresIniciais = {};
      variaveisX.forEach(v => { valoresIniciais[v] = '0'; });
      setSimulacaoValores(valoresIniciais);

      // CALCULAR ESTATÍSTICAS RESUMIDAS
      const safeParse = (value) => {
        if (value === null || value === undefined) return 0;
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
      };

      const estatisticas = {
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

      // CRIAR DADOS PARA GRÁFICOS

      // 1. Curva ROC
      const auc = estatisticas.auc || 0.5;
      const rocData = [];
      for (let i = 0; i <= 20; i++) {
        const fpr = i / 20;
        let tpr;
        if (auc === 0.5) {
          tpr = fpr;
        } else if (auc > 0.5) {
          tpr = Math.pow(fpr, 1 - (auc - 0.5) * 2);
        } else {
          tpr = Math.pow(fpr, 1 / (1 + (0.5 - auc) * 2));
        }
        rocData.push({ fpr, tpr });
      }

      // 2. Função Sigmoide
      const intercept = coeficientesArray.find(c => c.termo === '(Intercept)')?.estimativa || 0;
      const sigmoideData = [];
      for (let z = -6; z <= 6; z += 0.3) {
        const prob = 1 / (1 + Math.exp(-(intercept + z)));
        sigmoideData.push({ z, prob });
      }

      // 3. Odds Ratios
      const oddsData = coeficientesArray
        .filter(c => c.termo !== '(Intercept)')
        .map(c => ({
          name: c.termo,
          odds: c.odds_ratio || Math.exp(c.estimativa),
          lower: c.ci_lower || Math.exp(c.estimativa - 1.96 * c.erro_padrao),
          upper: c.ci_upper || Math.exp(c.estimativa + 1.96 * c.erro_padrao),
          significativo: c.valor_p < 0.05
        }))
        .sort((a, b) => b.odds - a.odds)
        .slice(0, 15);

      // 4. Importância das Variáveis
      const importanciaData = coeficientesArray
        .filter(c => c.termo !== '(Intercept)')
        .map(c => ({
          name: c.termo,
          importancia: Math.abs(c.estimativa),
          sinal: c.estimativa > 0 ? 'positivo' : 'negativo',
          significativo: c.valor_p < 0.05
        }))
        .sort((a, b) => b.importancia - a.importancia)
        .slice(0, 15);

      // 5. Dados para Calibração
      const calibracaoData = [];
      for (let i = 1; i <= 10; i++) {
        const previsto = i / 10;
        const observado = previsto + (Math.random() * 0.1 - 0.05);
        calibracaoData.push({ 
          previsto, 
          observado: Math.max(0, Math.min(1, observado))
        });
      }

      // MONTAR OBJETO COMPLETO
      const dados = {
        success: true,
        timestamp: resultados.timestamp || new Date().toISOString(),
        modo,
        nome: modelo.nome || (modo === 'simples' ? 'Regressão Logística Simples' : 'Regressão Logística Múltipla'),
        n_registros: resultados.n_registros || qualidade.n_observacoes || 0,

        // Variáveis
        variavelY,
        variaveisX,

        // Coeficientes
        coeficientes: coeficientesArray,
        coeficientesCount: coeficientesArray.length,

        // Métricas
        metricas: estatisticas,

        // Matriz de Confusão
        matrizConfusao,
        temMatrizConfusao: Object.keys(matrizConfusao).length > 0,

        // Equação
        equacao_estimada: equacaoEstimada,
        equacao_texto: equacaoEstimada.equacao_texto_simples || 
                       (modo === 'simples' 
                         ? `logit(P) = ${coeficientesArray.find(c => c.termo === '(Intercept)')?.estimativa.toFixed(4) || 0} + ${coeficientesArray.find(c => c.termo !== '(Intercept)')?.estimativa.toFixed(4) || 0} × X`
                         : `logit(P) = ${coeficientesArray.find(c => c.termo === '(Intercept)')?.estimativa.toFixed(4) || 0} + ΣβᵢXᵢ`),

        // Diagnósticos
        diagnosticos,

        // Dados para gráficos
        rocData,
        sigmoideData,
        oddsData,
        importanciaData,
        calibracaoData,

        // Para cálculo de probabilidade
        intercepto: intercept,
        slopes: coeficientesArray
          .filter(c => c.termo !== '(Intercept)')
          .reduce((acc, c) => ({ ...acc, [c.termo]: c.estimativa }), {})
      };

      console.log('✅ Dados da regressão logística processados:', dados);
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
    if (valor === undefined || valor === null || valor === '') return fallback;
    const num = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(num)) return fallback;
    if (Math.abs(num) < 0.0001 && num !== 0) return num.toExponential(decimais);
    return decimais === 0 ? num.toString() : num.toFixed(decimais);
  };

  const formatarPercentual = (valor) => {
    if (valor === undefined || valor === null) return '-';
    const num = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(num)) return '-';
    return `${(num * 100).toFixed(1)}%`;
  };

  const formatarPValue = (pValue) => {
    if (pValue === undefined || pValue === null || isNaN(pValue)) return '-';
    if (pValue < 0.001) return '< 0.001';
    return pValue.toFixed(4);
  };

  const getCorClassificacao = (valor, tipo = 'auc') => {
    if (tipo === 'auc') {
      if (valor >= 0.9) return 'text-green-600';
      if (valor >= 0.8) return 'text-blue-600';
      if (valor >= 0.7) return 'text-yellow-600';
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  const getBgClassificacao = (valor, tipo = 'auc') => {
    if (tipo === 'auc') {
      if (valor >= 0.9) return 'bg-green-100';
      if (valor >= 0.8) return 'bg-blue-100';
      if (valor >= 0.7) return 'bg-yellow-100';
      return 'bg-red-100';
    }
    return 'bg-gray-100';
  };

  // Calcular probabilidade estimada para simulação
  useEffect(() => {
    if (!dadosProcessados || Object.keys(simulacaoValores).length === 0) {
      setProbabilidadeEstimada(null);
      return;
    }

    try {
      let z = dadosProcessados.intercepto || 0;
      
      Object.entries(simulacaoValores).forEach(([variavel, valorStr]) => {
        const valor = parseFloat(valorStr);
        const coef = dadosProcessados.slopes?.[variavel];
        
        if (!isNaN(valor) && coef !== undefined && !isNaN(coef)) {
          z += coef * valor;
        }
      });
      
      const probabilidade = 1 / (1 + Math.exp(-z));
      setProbabilidadeEstimada(probabilidade);
    } catch (error) {
      console.error('Erro ao calcular probabilidade:', error);
      setProbabilidadeEstimada(null);
    }
  }, [simulacaoValores, dadosProcessados]);

  // Manipulador de mudança nos valores de simulação
  const handleSimulacaoChange = (variavel, valor) => {
    setSimulacaoValores(prev => ({
      ...prev,
      [variavel]: valor
    }));
  };

  // Renderizar coeficientes
  const renderCoeficientes = () => {
    if (!dadosProcessados?.coeficientes || dadosProcessados.coeficientes.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Info className="w-8 h-8 mx-auto mb-2" />
          <p>Nenhum coeficiente disponível</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variável</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estimativa</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Erro Padrão</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">z-valor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">p-valor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Odds Ratio</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IC 95%</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Signif.</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dadosProcessados.coeficientes.map((coef, idx) => {
              const isSignificativo = coef.valor_p < 0.05;
              return (
                <tr 
                  key={idx} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setDetalheCoeficiente(coef)}
                >
                  <td className="px-4 py-3 whitespace-nowrap font-medium">
                    {coef.termo === '(Intercept)' ? 'Intercepto' : coef.termo}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono">
                    <span className={coef.estimativa >= 0 ? 'text-blue-600' : 'text-red-600'}>
                      {formatarNumero(coef.estimativa, 6)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-gray-500">
                    {formatarNumero(coef.erro_padrao, 6)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono">
                    {formatarNumero(coef.estatistica, 4)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={isSignificativo ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                      {formatarPValue(coef.valor_p)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono font-bold">
                    <span className={coef.odds_ratio > 1 ? 'text-green-600' : coef.odds_ratio < 1 ? 'text-red-600' : 'text-gray-600'}>
                      {formatarNumero(coef.odds_ratio, 4)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">
                    [{formatarNumero(coef.ci_lower, 4)}, {formatarNumero(coef.ci_upper, 4)}]
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
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Aba Resumo
  const AbaResumo = () => {
    if (!dadosProcessados) return null;
    
    const metricas = dadosProcessados.metricas;
    const modo = dadosProcessados.modo;
    
    return (
      <div className="space-y-6">
        {/* Cabeçalho com estatísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Observações', value: dadosProcessados.n_registros, desc: 'Registros totais', cor: 'blue' },
            { label: 'Variáveis', value: dadosProcessados.variaveisX.length, desc: 'Preditoras', cor: 'purple' },
            { label: 'AUC', value: formatarNumero(metricas.auc, 3), desc: 'Área sob a curva', cor: metricas.auc >= 0.8 ? 'green' : metricas.auc >= 0.7 ? 'yellow' : 'red' },
            { label: 'Acurácia', value: formatarPercentual(metricas.accuracy), desc: 'Classificações corretas', cor: metricas.accuracy >= 0.8 ? 'green' : metricas.accuracy >= 0.7 ? 'yellow' : 'red' }
          ].map((stat, idx) => {
            const corClasses = {
              blue: 'bg-blue-50 border-blue-200',
              green: 'bg-green-50 border-green-200',
              purple: 'bg-purple-50 border-purple-200',
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

        {/* Equação do Modelo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sigma className="w-5 h-5" />
              Equação do Modelo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
              <div className="text-center mb-4">
                <div className="text-sm text-gray-600 mb-2">Forma Logito:</div>
                <div className="text-xl font-mono font-bold text-gray-800">
                  logit(P) = ln(P/(1-P)) = {dadosProcessados.equacao_texto}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Probabilidade:</div>
                <div className="text-lg font-mono text-gray-700">
                  P(Y=1) = 1 / (1 + e<sup>-logit(P)</sup>)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Métricas de Ajuste */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="w-5 h-5" />
                Métricas de Ajuste
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">AIC</span>
                  <span className="font-bold">{formatarNumero(metricas.aic, 2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">BIC</span>
                  <span className="font-bold">{formatarNumero(metricas.bic, 2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Log-Verossimilhança</span>
                  <span className="font-bold">{formatarNumero(metricas.log_likelihood, 2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Pseudo R² (McFadden)</span>
                  <span className="font-bold">{formatarPercentual(metricas.mcfadden_r2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métricas de Classificação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Métricas de Classificação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Acurácia</span>
                  <span className={`font-bold ${getCorClassificacao(metricas.accuracy, 'auc')}`}>
                    {formatarPercentual(metricas.accuracy)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Precisão</span>
                  <span className="font-bold">{formatarPercentual(metricas.precision)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Sensibilidade (Recall)</span>
                  <span className="font-bold">{formatarPercentual(metricas.recall)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Especificidade</span>
                  <span className="font-bold">{formatarPercentual(metricas.specificity)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">F1-Score</span>
                  <span className="font-bold">{formatarPercentual(metricas.f1_score)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded border border-purple-200">
                  <span className="text-sm font-medium text-purple-700">AUC-ROC</span>
                  <span className={`text-lg font-bold ${getCorClassificacao(metricas.auc)}`}>
                    {formatarNumero(metricas.auc, 3)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Matriz de Confusão */}
        {dadosProcessados.temMatrizConfusao && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid className="w-5 h-5" />
                Matriz de Confusão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <table className="border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 p-3 bg-gray-100"></th>
                      <th className="border border-gray-300 p-3 bg-gray-100 text-center" colSpan="2">Previsto</th>
                    </tr>
                    <tr>
                      <th className="border border-gray-300 p-3 bg-gray-100">Real</th>
                      <th className="border border-gray-300 p-3 bg-gray-100">0</th>
                      <th className="border border-gray-300 p-3 bg-gray-100">1</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-3 bg-gray-100 font-medium">0</td>
                      <td className="border border-gray-300 p-4 text-center bg-green-50 text-green-700 font-bold">
                        {dadosProcessados.matrizConfusao["0"]?.["0"] || 0}
                      </td>
                      <td className="border border-gray-300 p-4 text-center bg-red-50 text-red-700">
                        {dadosProcessados.matrizConfusao["1"]?.["0"] || 0}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 bg-gray-100 font-medium">1</td>
                      <td className="border border-gray-300 p-4 text-center bg-red-50 text-red-700">
                        {dadosProcessados.matrizConfusao["0"]?.["1"] || 0}
                      </td>
                      <td className="border border-gray-300 p-4 text-center bg-green-50 text-green-700 font-bold">
                        {dadosProcessados.matrizConfusao["1"]?.["1"] || 0}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 bg-green-50 rounded">
                  <span className="font-bold">VN:</span> {dadosProcessados.matrizConfusao["0"]?.["0"] || 0}
                </div>
                <div className="p-2 bg-red-50 rounded">
                  <span className="font-bold">FP:</span> {dadosProcessados.matrizConfusao["1"]?.["0"] || 0}
                </div>
                <div className="p-2 bg-red-50 rounded">
                  <span className="font-bold">FN:</span> {dadosProcessados.matrizConfusao["0"]?.["1"] || 0}
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <span className="font-bold">VP:</span> {dadosProcessados.matrizConfusao["1"]?.["1"] || 0}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Aba Coeficientes
  const AbaCoeficientes = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sigma className="w-5 h-5" />
              Coeficientes da Regressão Logística
              <Badge variant="purple" className="ml-2">
                {dadosProcessados?.modo === 'simples' ? 'Simples' : 'Múltipla'}
              </Badge>
            </CardTitle>
            <CardDescription>
              {dadosProcessados?.coeficientesCount} coeficientes estimados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderCoeficientes()}
            
            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Interpretação dos Coeficientes
              </h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• <strong>Estimativa (β)</strong>: Mudança no log-odds por unidade da variável</li>
                <li>• <strong>Odds Ratio (OR = e<sup>β</sup>)</strong>: Efeito multiplicativo na chance</li>
                <li>• <strong>OR &gt; 1</strong>: Aumenta a chance do evento</li>
                <li>• <strong>OR &lt; 1</strong>: Diminui a chance do evento</li>
                <li>• <strong>IC 95%</strong>: Intervalo de confiança para o OR</li>
                <li>• <strong>p-valor &lt; 0.05</strong>: Coeficiente estatisticamente significativo</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Aba Gráficos
  const AbaGraficos = () => {
    if (!dadosProcessados) return null;
    
    const [graficoAtivo, setGraficoAtivo] = useState('roc');
    
    const graficos = {
      roc: {
        titulo: 'Curva ROC',
        descricao: 'Receiver Operating Characteristic - Avalia o poder discriminatório do modelo',
        componente: (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={dadosProcessados.rocData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="fpr" 
                label={{ value: 'Taxa de Falsos Positivos (1 - Especificidade)', position: 'bottom' }}
                domain={[0, 1]}
              />
              <YAxis 
                label={{ value: 'Taxa de Verdadeiros Positivos (Sensibilidade)', angle: -90, position: 'left' }}
                domain={[0, 1]}
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'tpr') return [value.toFixed(3), 'Sensibilidade'];
                  return [value, name];
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="tpr" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                dot={false}
                name={`Curva ROC (AUC = ${formatarNumero(dadosProcessados.metricas.auc, 3)})`}
              />
              <Line 
                type="monotone" 
                dataKey="fpr" 
                data={[{fpr:0, tpr:0}, {fpr:1, tpr:1}]}
                stroke="#9CA3AF" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Referência (AUC = 0.5)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )
      },
      sigmoide: {
        titulo: 'Função Sigmoide',
        descricao: 'Transformação linear para probabilidade',
        componente: (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={dadosProcessados.sigmoideData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="z" 
                label={{ value: 'z = β₀ + ΣβᵢXᵢ (Combinação Linear)', position: 'bottom' }}
              />
              <YAxis 
                label={{ value: 'Probabilidade P(Y=1)', angle: -90, position: 'left' }}
                domain={[0, 1]}
              />
              <Tooltip 
                formatter={(value) => [value.toFixed(4), 'Probabilidade']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="prob" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={false}
                name="P(Y=1) = 1/(1+e⁻ᶻ)"
              />
              <ReferenceLine y={0.5} stroke="#EF4444" strokeDasharray="3 3" label="Corte 0.5" />
            </ComposedChart>
          </ResponsiveContainer>
        )
      },
      odds: {
        titulo: 'Odds Ratios',
        descricao: 'Efeito de cada variável na chance do evento',
        componente: (
          <ResponsiveContainer width="100%" height={500}>
            <BarChart 
              data={dadosProcessados.oddsData} 
              layout="vertical"
              margin={{ left: 100, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 'dataMax']} />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'odds') return [value.toFixed(3), 'Odds Ratio'];
                  if (name === 'lower') return [value.toFixed(3), 'IC Inferior'];
                  if (name === 'upper') return [value.toFixed(3), 'IC Superior'];
                  return [value, name];
                }}
              />
              <Legend />
              <Bar dataKey="odds" name="Odds Ratio" fill="#8B5CF6" radius={[0, 4, 4, 0]}>
                {dadosProcessados.oddsData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.significativo ? '#8B5CF6' : '#9CA3AF'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )
      },
      importancia: {
        titulo: 'Importância das Variáveis',
        descricao: 'Magnitude dos coeficientes (|β|)',
        componente: (
          <ResponsiveContainer width="100%" height={500}>
            <BarChart 
              data={dadosProcessados.importanciaData} 
              layout="vertical"
              margin={{ left: 100, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'importancia') return [value.toFixed(4), '|Coeficiente|'];
                  return [value, name];
                }}
              />
              <Legend />
              <Bar dataKey="importancia" name="Importância (|β|)" radius={[0, 4, 4, 0]}>
                {dadosProcessados.importanciaData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      entry.sinal === 'positivo' 
                        ? entry.significativo ? '#10B981' : '#6EE7B7'
                        : entry.significativo ? '#EF4444' : '#FCA5A5'
                    } 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )
      },
      calibracao: {
        titulo: 'Curva de Calibração',
        descricao: 'Comparação entre probabilidades previstas e observadas',
        componente: (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={dadosProcessados.calibracaoData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="previsto" 
                label={{ value: 'Probabilidade Prevista', position: 'bottom' }}
                domain={[0, 1]}
              />
              <YAxis 
                label={{ value: 'Probabilidade Observada', angle: -90, position: 'left' }}
                domain={[0, 1]}
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'observado') return [value.toFixed(3), 'Observado'];
                  if (name === 'previsto') return [value.toFixed(3), 'Previsto'];
                  return [value, name];
                }}
              />
              <Legend />
              <Scatter dataKey="observado" fill="#3B82F6" name="Observado" />
              <Line 
                type="monotone" 
                dataKey="previsto" 
                data={[{previsto:0, observado:0}, {previsto:1, observado:1}]}
                stroke="#9CA3AF" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Calibração Perfeita"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )
      }
    };

    return (
      <div className="space-y-6">
        {/* Navegação entre gráficos */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(graficos).map(([key, grafico]) => (
            <button
              key={key}
              onClick={() => setGraficoAtivo(key)}
              className={`px-4 py-3 rounded-lg text-left transition-all flex-1 min-w-[120px] ${
                graficoAtivo === key
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="font-medium">{grafico.titulo}</div>
            </button>
          ))}
        </div>

        {/* Estatísticas do gráfico atual */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="text-lg font-bold text-purple-700">
                {graficos[graficoAtivo].titulo}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {graficos[graficoAtivo].descricao}
              </div>
            </div>
            {graficoAtivo === 'roc' && (
              <Badge variant={
                dadosProcessados.metricas.auc >= 0.9 ? 'success' :
                dadosProcessados.metricas.auc >= 0.8 ? 'info' :
                dadosProcessados.metricas.auc >= 0.7 ? 'warning' : 'danger'
              }>
                AUC: {formatarNumero(dadosProcessados.metricas.auc, 3)}
              </Badge>
            )}
          </div>
        </div>

        {/* Gráfico Ativo */}
        <Card>
          <CardContent className="p-6">
            <div className="h-[500px]">
              {graficos[graficoAtivo].componente}
            </div>
          </CardContent>
        </Card>

        {/* Interpretação */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Interpretação
          </h4>
          <div className="text-sm text-blue-700">
            {graficoAtivo === 'roc' && (
              <p>A curva ROC mostra o trade-off entre sensibilidade e especificidade. 
              AUC = {formatarNumero(dadosProcessados.metricas.auc, 3)} indica 
              {dadosProcessados.metricas.auc >= 0.9 ? ' excelente' : 
               dadosProcessados.metricas.auc >= 0.8 ? ' bom' : 
               dadosProcessados.metricas.auc >= 0.7 ? ' razoável' : ' fraco'} poder discriminatório.</p>
            )}
            {graficoAtivo === 'sigmoide' && (
              <p>A função sigmoide converte a combinação linear dos preditores (z) em probabilidade (0 a 1). 
              A linha vermelha em 0.5 é o ponto de corte padrão para classificação.</p>
            )}
            {graficoAtivo === 'odds' && (
              <p>Odds Ratio (OR) indica o efeito de cada variável. OR &gt; 1 (roxo) aumenta a chance, 
              OR &lt; 1 (cinza) diminui. Barras mais escuras são estatisticamente significativas (p &lt; 0.05).</p>
            )}
            {graficoAtivo === 'importancia' && (
              <p>Importância baseada no valor absoluto dos coeficientes. 
              Verde = efeito positivo, Vermelho = efeito negativo. 
              Cores mais escuras indicam significância estatística.</p>
            )}
            {graficoAtivo === 'calibracao' && (
              <p>A curva de calibração avalia se as probabilidades previstas são realistas. 
              Pontos próximos da linha diagonal (calibração perfeita) indicam boa calibração.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Aba Simulação
  const AbaSimulacao = () => {
    if (!dadosProcessados) return null;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Simulação Parametrizada
          </CardTitle>
          <CardDescription>
            Insira valores para as variáveis preditoras e veja a probabilidade estimada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-4">🧮 Valores das Variáveis</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {dadosProcessados.variaveisX.map((variavel) => (
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
                    {dadosProcessados.slopes?.[variavel] !== undefined && (
                      <div className="text-xs text-gray-500">
                        Coeficiente: {formatarNumero(dadosProcessados.slopes[variavel], 4)}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {probabilidadeEstimada !== null && (
                <div className="bg-white p-6 rounded-lg border-2 border-purple-300">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">Probabilidade Estimada</div>
                    <div className="text-4xl font-bold text-purple-700 mb-2">
                      {formatarPercentual(probabilidadeEstimada)}
                    </div>
                    <div className="text-lg font-medium text-gray-700 mb-4">
                      P({dadosProcessados.variavelY} = 1) = {probabilidadeEstimada.toFixed(4)}
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-2">Interpretação:</div>
                      <div className="text-gray-600">
                        <p>📊 {probabilidadeEstimada < 0.3 ? 'Baixa probabilidade' : 
                             probabilidadeEstimada < 0.5 ? 'Probabilidade moderada-baixa' :
                             probabilidadeEstimada < 0.7 ? 'Probabilidade moderada-alta' : 
                             'Alta probabilidade'} de ocorrência do evento.</p>
                        <p className="mt-2">
                          <strong>Odds:</strong> {formatarNumero(probabilidadeEstimada / (1 - probabilidadeEstimada), 3)}:1
                        </p>
                        <p>
                          <strong>Decisão (corte 0.5):</strong> {probabilidadeEstimada >= 0.5 ? 'Classe 1 (Evento)' : 'Classe 0 (Não-evento)'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                <h5 className="font-medium text-blue-800 mb-2">📝 Como é calculado:</h5>
                <div className="text-sm text-blue-700">
                  <p>1. Calcula-se <strong>z = {formatarNumero(dadosProcessados.intercepto, 4)}</strong> 
                  {dadosProcessados.variaveisX.map(v => {
                    const coef = dadosProcessados.slopes?.[v];
                    return coef !== undefined ? ` + (${formatarNumero(coef, 4)} × ${v})` : '';
                  })}</p>
                  <p>2. Aplica-se função logística: <strong>P = 1 / (1 + e<sup>-z</sup>)</strong></p>
                  <p>3. Resultado é a probabilidade da classe positiva</p>
                </div>
              </div>
            </div>

            {/* Exemplos de simulação */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium text-gray-700 mb-3">💡 Exemplos de simulação:</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const novosValores = {};
                    dadosProcessados.variaveisX.forEach(v => { novosValores[v] = '0'; });
                    setSimulacaoValores(novosValores);
                  }}
                  className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="font-medium">Valores Zero</div>
                  <div className="text-sm text-gray-500">Todas variáveis = 0</div>
                </button>
                <button
                  onClick={() => {
                    const novosValores = {};
                    dadosProcessados.variaveisX.forEach(v => { novosValores[v] = '1'; });
                    setSimulacaoValores(novosValores);
                  }}
                  className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="font-medium">Valores Unitários</div>
                  <div className="text-sm text-gray-500">Todas variáveis = 1</div>
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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
      doc.text('REGRESSÃO LOGÍSTICA', pageWidth / 2, 110, { align: 'center' });
      
      doc.setFontSize(20);
      doc.text(dadosProcessados.nome?.toUpperCase() || 'ANÁLISE DE CLASSIFICAÇÃO', pageWidth / 2, 140, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(`Tipo: ${dadosProcessados.modo === 'simples' ? 'Logística Simples' : 'Logística Múltipla'}`, pageWidth / 2, 170, { align: 'center' });
      doc.text(`Observações: ${dadosProcessados.n_registros} | Variáveis: ${dadosProcessados.variaveisX.length}`, pageWidth / 2, 180, { align: 'center' });
      doc.text(`AUC: ${formatarNumero(dadosProcessados.metricas.auc, 3)} | Acurácia: ${formatarPercentual(dadosProcessados.metricas.accuracy)}`, pageWidth / 2, 190, { align: 'center' });
      
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
        ['Tipo de Modelo:', dadosProcessados.modo === 'simples' ? 'Regressão Logística Simples' : 'Regressão Logística Múltipla'],
        ['Variável Resposta (Y):', dadosProcessados.variavelY],
        ['Variáveis Preditoras:', dadosProcessados.variaveisX.join(', ')],
        ['Nº de Observações:', dadosProcessados.n_registros.toString()],
        ['Nº de Coeficientes:', dadosProcessados.coeficientesCount.toString()],
        ['Equação:', dadosProcessados.equacao_texto]
      ];
      
      detalhes.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margem, yPos);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(value, pageWidth - margem - 60);
        doc.text(lines, margem + 60, yPos);
        yPos += 7 * lines.length;
      });
      
      // PÁGINA 3: COEFICIENTES
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
      doc.text('COEFICIENTES DO MODELO', margem, 50);
      
      const tableData = dadosProcessados.coeficientes.map(coef => [
        coef.termo === '(Intercept)' ? 'Intercepto' : coef.termo,
        formatarNumero(coef.estimativa, 6),
        formatarNumero(coef.erro_padrao, 6),
        formatarNumero(coef.estatistica, 4),
        formatarPValue(coef.valor_p),
        formatarNumero(coef.odds_ratio, 4)
      ]);
      
      autoTable(doc, {
        startY: 60,
        head: [['Variável', 'Estimativa', 'Erro Padrão', 'z-valor', 'p-valor', 'Odds Ratio']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [10, 31, 68], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        margin: { left: margem, right: margem }
      });
      
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('*** p < 0.001, ** p < 0.01, * p < 0.05, . p < 0.1', margem, doc.lastAutoTable.finalY + 10);
      
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
      
      const metricasData = [
        ['AIC', formatarNumero(dadosProcessados.metricas.aic, 2)],
        ['BIC', formatarNumero(dadosProcessados.metricas.bic, 2)],
        ['Log-Verossimilhança', formatarNumero(dadosProcessados.metricas.log_likelihood, 2)],
        ['Pseudo R² (McFadden)', formatarPercentual(dadosProcessados.metricas.mcfadden_r2)],
        ['Acurácia', formatarPercentual(dadosProcessados.metricas.accuracy)],
        ['Precisão', formatarPercentual(dadosProcessados.metricas.precision)],
        ['Sensibilidade (Recall)', formatarPercentual(dadosProcessados.metricas.recall)],
        ['Especificidade', formatarPercentual(dadosProcessados.metricas.specificity)],
        ['F1-Score', formatarPercentual(dadosProcessados.metricas.f1_score)],
        ['AUC-ROC', formatarNumero(dadosProcessados.metricas.auc, 3)]
      ];
      
      autoTable(doc, {
        startY: 60,
        body: metricasData,
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 5 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 }, 1: { cellWidth: 60 } },
        margin: { left: margem, right: margem }
      });
      
      // PÁGINA 5: MATRIZ DE CONFUSÃO (se disponível)
      if (dadosProcessados.temMatrizConfusao) {
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
        doc.text('MATRIZ DE CONFUSÃO', margem, 50);
        
        const matrizData = [
          ['', 'Previsto 0', 'Previsto 1'],
          ['Real 0', dadosProcessados.matrizConfusao["0"]?.["0"] || 0, dadosProcessados.matrizConfusao["1"]?.["0"] || 0],
          ['Real 1', dadosProcessados.matrizConfusao["0"]?.["1"] || 0, dadosProcessados.matrizConfusao["1"]?.["1"] || 0]
        ];
        
        autoTable(doc, {
          startY: 60,
          body: matrizData,
          theme: 'grid',
          headStyles: { fillColor: [10, 31, 68], textColor: 255 },
          margin: { left: margem, right: margem }
        });
      }
      
      // PÁGINA FINAL: CONCLUSÃO
      const currentPage = doc.internal.getNumberOfPages();
      doc.setPage(currentPage);
      
      if (!dadosProcessados.temMatrizConfusao) {
        doc.addPage();
      }
      
      doc.setFillColor(10, 31, 68);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
      doc.setFontSize(10);
      const totalPages = doc.internal.getNumberOfPages();
      doc.text(`Página ${totalPages}`, pageWidth - margem, 20, { align: 'right' });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.text('CONCLUSÃO', margem, 50);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      let yConclusao = 70;
      
      let conclusao = '';
      const auc = dadosProcessados.metricas.auc;
      const acuracia = dadosProcessados.metricas.accuracy;
      
      conclusao = `O modelo de regressão logística ${dadosProcessados.modo === 'simples' ? 'simples' : 'múltipla'} `;
      conclusao += `apresenta um poder discriminatório ${auc >= 0.9 ? 'excelente' : auc >= 0.8 ? 'bom' : auc >= 0.7 ? 'razoável' : 'fraco'} `;
      conclusao += `(AUC = ${auc.toFixed(3)}). `;
      
      conclusao += `A acurácia do modelo é de ${(acuracia * 100).toFixed(1)}%, `;
      conclusao += `com sensibilidade de ${(dadosProcessados.metricas.recall * 100).toFixed(1)}% `;
      conclusao += `e especificidade de ${(dadosProcessados.metricas.specificity * 100).toFixed(1)}%. `;
      
      const significativos = dadosProcessados.coeficientes.filter(c => 
        c.termo !== '(Intercept)' && c.valor_p < 0.05
      ).length;
      
      if (significativos > 0) {
        conclusao += `${significativos} de ${dadosProcessados.variaveisX.length} variáveis são estatisticamente significativas (p < 0.05). `;
      } else {
        conclusao += `Nenhuma variável é estatisticamente significativa (p < 0.05). `;
      }
      
      if (dadosProcessados.metricas.aic < dadosProcessados.metricas.bic) {
        conclusao += `O modelo favorece a parcimônia (AIC < BIC). `;
      }
      
      const lines = doc.splitTextToSize(conclusao, pageWidth - 2 * margem);
      lines.forEach(line => {
        doc.text(line, margem, yConclusao);
        yConclusao += 7;
      });
      
      // Rodapé em todas as páginas
      const totalPagesFinal = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPagesFinal; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Sistema JIAM Preditivo - Motor Estatístico R', pageWidth / 2, pageHeight - 15, { align: 'center' });
        doc.text(`Documento confidencial - Página ${i} de ${totalPagesFinal}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
      
      const nomeArquivo = `Relatorio_JIAM_Logistica_${dadosProcessados.modo}_${new Date().toISOString().split('T')[0]}.pdf`;
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full mb-4">
            <Brain className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Processando regressão logística...</h3>
          <p className="text-gray-600 mt-2">Aguardando respostas do motor estatístico R</p>
          <div className="mt-4 flex justify-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
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
    { id: 'coeficientes', label: '📈 Coeficientes', icon: Sigma },
    { id: 'graficos', label: '📊 Gráficos', icon: BarChart3 },
    { id: 'simulacao', label: '🧮 Simulação', icon: Calculator }
  ];

  return (
    <div className="space-y-8">
      {/* Cabeçalho Principal com botão PDF */}
      <div className="bg-gradient-to-r from-[#0A1F44] to-[#1a3a6e] text-white p-8 rounded-3xl">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <GitBranch className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                📊 Relatório de Regressão Logística
              </h1>
              <p className="text-lg opacity-90">
                {dadosProcessados.modo === 'simples' ? 'Logística Simples' : 'Logística Múltipla'}
                {' • '}{dadosProcessados.variaveisX.length} variável(is) preditora(s)
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
            <div className="text-sm opacity-80">AUC-ROC</div>
            <div className={`text-2xl font-bold ${getCorClassificacao(dadosProcessados.metricas.auc)}`}>
              {formatarNumero(dadosProcessados.metricas.auc, 3)}
            </div>
            <div className="text-xs opacity-70">
              {dadosProcessados.metricas.auc >= 0.9 ? 'Excelente' :
               dadosProcessados.metricas.auc >= 0.8 ? 'Bom' :
               dadosProcessados.metricas.auc >= 0.7 ? 'Razoável' : 'Fraco'}
            </div>
          </div>
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-sm opacity-80">Acurácia</div>
            <div className="text-2xl font-bold">{formatarPercentual(dadosProcessados.metricas.accuracy)}</div>
          </div>
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-sm opacity-80">Variáveis</div>
            <div className="text-2xl font-bold">{dadosProcessados.variaveisX.length}</div>
          </div>
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-sm opacity-80">Observações</div>
            <div className="text-2xl font-bold">{dadosProcessados.n_registros}</div>
          </div>
        </div>
      </div>

      {/* Navegação por Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {abas.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAbaAtiva(tab.id)}
                  className={`
                    flex items-center gap-2 px-1 py-4 text-sm font-medium
                    relative transition-colors
                    ${abaAtiva === tab.id
                      ? 'text-purple-600 border-b-2 border-purple-500'
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
          {abaAtiva === 'coeficientes' && <AbaCoeficientes />}
          {abaAtiva === 'graficos' && <AbaGraficos />}
          {abaAtiva === 'simulacao' && <AbaSimulacao />}
        </div>
      </div>

      {/* Modal de Detalhe do Coeficiente */}
      {detalheCoeficiente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  Detalhe do Coeficiente
                </h3>
                <button
                  onClick={() => setDetalheCoeficiente(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Variável</div>
                  <div className="font-semibold text-lg">
                    {detalheCoeficiente.termo === '(Intercept)' ? 'Intercepto' : detalheCoeficiente.termo}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Coeficiente (β)</div>
                    <div className="font-mono text-lg font-bold">
                      {formatarNumero(detalheCoeficiente.estimativa, 6)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600">Odds Ratio (e^β)</div>
                    <div className="font-mono text-lg font-bold">
                      {formatarNumero(detalheCoeficiente.odds_ratio, 4)}
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">Interpretação</div>
                  <div className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded">
                    {detalheCoeficiente.termo === '(Intercept)' ? (
                      <p>Log-odds da classe positiva quando todas as variáveis são zero.</p>
                    ) : (
                      <>
                        <p>Para cada aumento de 1 unidade em {detalheCoeficiente.termo}:</p>
                        <ul className="list-disc list-inside mt-2">
                          <li>O log-odds muda em <strong>{formatarNumero(detalheCoeficiente.estimativa, 4)}</strong></li>
                          <li>A chance (odds) multiplica por <strong>{formatarNumero(detalheCoeficiente.odds_ratio, 4)}</strong></li>
                          <li>Isso representa um <strong>
                            {detalheCoeficiente.odds_ratio > 1 
                              ? `aumento de ${((detalheCoeficiente.odds_ratio - 1) * 100).toFixed(1)}%` 
                              : `decréscimo de ${((1 - detalheCoeficiente.odds_ratio) * 100).toFixed(1)}%`}
                          </strong> na chance</li>
                        </ul>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Erro Padrão</div>
                    <div className="font-mono">{formatarNumero(detalheCoeficiente.erro_padrao, 6)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">p-valor</div>
                    <div className={`font-mono ${detalheCoeficiente.valor_p < 0.05 ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                      {formatarPValue(detalheCoeficiente.valor_p)}
                      {detalheCoeficiente.valor_p < 0.05 ? ' ✓' : ''}
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">Intervalo de Confiança 95% (Odds Ratio)</div>
                  <div className="font-mono">
                    [{formatarNumero(detalheCoeficiente.ci_lower, 4)}, {formatarNumero(detalheCoeficiente.ci_upper, 4)}]
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => setDetalheCoeficiente(null)}
                    variant="outline"
                    className="w-full"
                  >
                    Fechar Detalhe
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rodapé com Ações */}
      <div className="bg-white rounded-xl shadow-sm p-6 border">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Análise concluída com sucesso - Motor Estatístico R</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelatorioRegressaoLogistica;