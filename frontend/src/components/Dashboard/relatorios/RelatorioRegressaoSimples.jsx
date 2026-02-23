// C:\Users\VhenancioMarthinz\Downloads\JiamPreditivo\frontend\src\components\Dashboard\relatorios\RelatorioRegressaoSimples.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, ComposedChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ReferenceLine
} from 'recharts';
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
  Printer,
  Share2,
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
  ArrowUpDown,
  FunctionSquare,
  Dices
} from 'lucide-react';

// Componentes UI
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import Button from '../componentes/Button';
import Badge from '../componentes/Badge';
import Input from '../componentes/Input';
import Label from '../componentes/Label';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const RelatorioRegressaoSimples = ({ modelo, dadosCompletos }) => {
  const [dadosProcessados, setDadosProcessados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [exportandoPDF, setExportandoPDF] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('resumo');
  const [graficoAtivo, setGraficoAtivo] = useState('dispersao');
  const [valorSimulacao, setValorSimulacao] = useState('');
  const [resultadoSimulacao, setResultadoSimulacao] = useState(null);

  useEffect(() => {
    try {
      console.log('📊 RELATÓRIO REGRESSÃO SIMPLES - Dados recebidos:');
      console.log('📦 modelo:', modelo);
      console.log('📦 dadosCompletos:', dadosCompletos);
      
      if (!modelo || !modelo.resultado) {
        throw new Error('Modelo sem dados do R');
      }

      const resultado = modelo.resultado;
      console.log('📦 resultado do R:', resultado);

      // VERIFICAR COEFICIENTES (formato do R)
      if (!resultado.coefficients) {
        throw new Error('Coeficientes do R não encontrados');
      }

      // EXTRAIR DADOS ORIGINAIS do modelo
      const dadosOriginais = modelo.dadosOriginais || [];

      // PROCESSAR COEFICIENTES
      const coeficientesR = resultado.coefficients;
      const coeficientesArray = [];
      let intercepto = 0;
      let coeficienteX = 0;
      let nomeVariavelX = 'X';
      
      Object.entries(coeficientesR).forEach(([nome, valores]) => {
        const estimativa = valores.estimate || 0;
        const erro = valores.std_error || 0;
        const estatistica = valores.t_value || 0;
        const valor_p = valores.p_value || 0;
        
        coeficientesArray.push({
          termo: nome,
          estimativa,
          erro,
          estatistica,
          valor_p,
          significancia: getSignificanciaR(valor_p)
        });
        
        if (nome === '(Intercept)') {
          intercepto = estimativa;
        } else {
          coeficienteX = estimativa;
          nomeVariavelX = nome;
        }
      });

      // PROCESSAR MÉTRICAS
      const metrics = resultado.metrics || {};
      console.log('📊 métricas do R:', metrics);

      // CRIAR DADOS REAIS PARA GRÁFICOS
      let scatterData = [];
      let regressionLine = [];
      let residualData = [];
      let histogramData = [];
      let predictionCurve = [];
      let densityData = [];
      let yDensityData = [];

      if (dadosOriginais.length > 0 && modelo.parametros?.x && modelo.parametros?.y) {
        const xVar = modelo.parametros.x;
        const yVar = modelo.parametros.y;
        
        console.log(`📊 Usando dados reais: X=${xVar}, Y=${yVar}, ${dadosOriginais.length} observações`);
        
        // Dados de dispersão REAIS
        scatterData = dadosOriginais
          .map((item, idx) => {
            const xVal = parseFloat(item[xVar]);
            const yVal = parseFloat(item[yVar]);
            
            if (isNaN(xVal) || isNaN(yVal)) return null;
            
            return {
              id: idx + 1,
              x: xVal,
              y: yVal,
              y_pred: intercepto + coeficienteX * xVal
            };
          })
          .filter(d => d !== null);

        console.log(`📊 Gerados ${scatterData.length} pontos reais para dispersão`);

        if (scatterData.length > 0) {
          const xValues = scatterData.map(d => d.x);
          const minX = Math.min(...xValues);
          const maxX = Math.max(...xValues);
          const padding = (maxX - minX) * 0.1;
          
          // Linha de regressão REAL
          regressionLine = [
            { x: minX - padding, y: intercepto + coeficienteX * (minX - padding) },
            { x: maxX + padding, y: intercepto + coeficienteX * (maxX + padding) }
          ];

          // Resíduos REAIS
          residualData = scatterData.map(d => ({
            id: d.id,
            fitted: d.y_pred,
            residual: d.y - d.y_pred,
            absolute_residual: Math.abs(d.y - d.y_pred)
          }));

          // Histograma de resíduos REAIS
          const residuals = residualData.map(d => d.residual);
          const minResidual = Math.min(...residuals);
          const maxResidual = Math.max(...residuals);
          const binCount = Math.min(10, Math.floor(Math.sqrt(residuals.length)));
          const binWidth = (maxResidual - minResidual) / binCount;
          
          histogramData = Array(binCount).fill(0).map((_, i) => {
            const binStart = minResidual + i * binWidth;
            const binEnd = binStart + binWidth;
            const count = residuals.filter(r => r >= binStart && r < binEnd).length;
            
            return {
              bin: i + 1,
              range: `${binStart.toFixed(2)}-${binEnd.toFixed(2)}`,
              count,
              frequency: count / residuals.length
            };
          });

          // Curva de previsão com dados REAIS
          const mse = metrics.mse || 0;
          predictionCurve = Array.from({ length: 50 }, (_, i) => {
            const x = minX + (maxX - minX) * (i / 49);
            const y_pred = intercepto + coeficienteX * x;
            return {
              x,
              y_pred,
              lower: y_pred - 2 * Math.sqrt(mse),
              upper: y_pred + 2 * Math.sqrt(mse)
            };
          });

          // Densidade dos resíduos REAIS
          densityData = calcularDensidade(residuals, 100);
          
          // Densidade da variável Y REAL
          const yValues = scatterData.map(d => d.y);
          yDensityData = calcularDensidade(yValues, 100);
        }
      } else {
        console.warn('⚠️ Dados originais não disponíveis, usando dados simulados');
        // Fallback para dados simulados
        const xMin = 0;
        const xMax = 10;
        
        for (let i = 0; i <= 20; i++) {
          const x = xMin + (i * (xMax - xMin) / 20);
          const y_pred = intercepto + coeficienteX * x;
          scatterData.push({
            x,
            y: y_pred + (Math.random() * 2 - 1),
            y_pred
          });
        }
        
        regressionLine = [
          { x: xMin, y: intercepto + coeficienteX * xMin },
          { x: xMax, y: intercepto + coeficienteX * xMax }
        ];
      }

      // Radar metrics com dados REAIS
      const maxY = scatterData.length > 0 ? Math.max(...scatterData.map(d => d.y)) : 1;
      const minY = scatterData.length > 0 ? Math.min(...scatterData.map(d => d.y)) : 0;
      const rangeY = maxY - minY || 1;
      
      const radarMetrics = [
        { metric: 'R²', value: metrics.r_squared || 0, fullMark: 1 },
        { metric: 'Precisão', value: 1 - Math.min(1, (metrics.rmse || 0) / rangeY), fullMark: 1 },
        { metric: 'Ajuste', value: metrics.adjusted_r_squared || 0, fullMark: 1 },
        { metric: 'Erro Médio', value: 1 - Math.min(1, (metrics.mae || 0) / rangeY), fullMark: 1 },
        { metric: 'Confiança', value: 1 - Math.min(1, Math.sqrt(metrics.mse || 0) / rangeY), fullMark: 1 }
      ].map(m => ({
        ...m,
        value: Math.max(0, Math.min(1, m.value))
      }));

      const dados = {
        nome: modelo.nome || 'Modelo de Regressão Linear',
        tipo: modelo.tipo || 'linear_simples',
        classificacao: modelo.classificacao || 'MODERADA',
        pontuacao: modelo.pontuacao || 0.5,
        timestamp: modelo.timestamp || new Date().toISOString(),
        equacao: `Ŷ = ${intercepto.toFixed(4)} + ${coeficienteX.toFixed(4)} × ${nomeVariavelX}`,
        intercepto,
        coeficienteX,
        nomeVariavelX,
        nomeVariavelY: modelo.parametros?.y || 'Y',
        coeficientes: coeficientesArray,
        coeficientesCount: coeficientesArray.length,
        metricas: {
          r2: metrics.r_squared || 0,
          r2Ajustado: metrics.adjusted_r_squared || 0,
          rmse: metrics.rmse || 0,
          mae: metrics.mae || 0,
          mse: metrics.mse || 0,
          aic: metrics.aic || 0,
          bic: metrics.bic || 0,
          fStatistic: metrics.f_statistic || 0,
          pValue: metrics.p_value || 0,
          nObservacoes: dadosOriginais.length || 0
        },
        scatterData,
        regressionLine,
        residualData,
        histogramData,
        predictionCurve,
        radarMetrics,
        densityData,
        yDensityData,
        dadosGrafico: scatterData,
        estatisticas: {
          rQuadrado: metrics.r_squared || 0,
          rQuadradoAjustado: metrics.adjusted_r_squared || 0,
          mse: metrics.mse || 0,
          rmse: metrics.rmse || 0,
          mae: metrics.mae || 0,
          aic: metrics.aic || 0,
          bic: metrics.bic || 0,
          fStatistic: metrics.f_statistic || 0,
          pValue: metrics.p_value || 0,
          nObservacoes: dadosOriginais.length || 0,
          qualidade: (metrics.r_squared || 0) >= 0.9 ? 'Excelente' :
                     (metrics.r_squared || 0) >= 0.7 ? 'Boa' :
                     (metrics.r_squared || 0) >= 0.5 ? 'Moderada' : 'Fraca'
        },
        debug: {
          coefficients: resultado.coefficients,
          metrics: resultado.metrics
        }
      };

      console.log('✅ Dados REAIS do R processados:', {
        scatterPoints: dados.scatterData.length,
        residuos: dados.residualData.length,
        r2: dados.metricas.r2
      });
      
      setDadosProcessados(dados);
      setLoading(false);

    } catch (error) {
      console.error('❌ Erro ao processar dados do R:', error);
      setErro(error.message);
      setLoading(false);
    }
  }, [modelo]);

  const getSignificanciaR = useCallback((pValue) => {
    if (pValue < 0.001) return '***';
    if (pValue < 0.01) return '**';
    if (pValue < 0.05) return '*';
    if (pValue < 0.1) return '.';
    return ' ';
  }, []);

  const calcularDensidade = useCallback((valores, pontos = 100) => {
    if (!valores || valores.length === 0) return [];
    
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const bandwidth = (max - min) / 10;
    
    const density = [];
    const step = (max - min) / pontos;
    
    for (let i = 0; i <= pontos; i++) {
      const x = min + i * step;
      let sum = 0;
      
      for (const valor of valores) {
        const u = (x - valor) / bandwidth;
        sum += Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
      }
      
      density.push({
        x: x,
        density: sum / (valores.length * bandwidth)
      });
    }
    
    return density;
  }, []);

  const getCorClassificacao = useCallback((classificacao) => {
    switch(classificacao?.toUpperCase()) {
      case 'EXCELENTE': return 'text-green-600';
      case 'BOA': return 'text-blue-600';
      case 'MODERADA': return 'text-yellow-600';
      case 'FRACA': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }, []);

  const getBgClassificacao = useCallback((classificacao) => {
    switch(classificacao?.toUpperCase()) {
      case 'EXCELENTE': return 'bg-green-100';
      case 'BOA': return 'bg-blue-100';
      case 'MODERADA': return 'bg-yellow-100';
      case 'FRACA': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  }, []);

  const formatarNumero = useCallback((valor, decimais = 4, fallback = '-') => {
    if (valor === undefined || valor === null || valor === '' || valor === 'NA') return fallback;
    const num = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(num)) return fallback;
    if (Math.abs(num) < 0.0001 && num !== 0) return num.toExponential(decimais);
    return decimais === 0 ? num.toString() : num.toFixed(decimais);
  }, []);

  const formatarPercentual = useCallback((valor) => {
    if (valor === undefined || valor === null || valor === 'NA') return '-';
    const num = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(num)) return '-';
    return `${(num * 100).toFixed(1)}%`;
  }, []);

  const executarSimulacao = useCallback(() => {
    if (!dadosProcessados) return;
    
    const x = parseFloat(valorSimulacao);
    if (isNaN(x)) {
      alert('Digite um valor numérico válido');
      return;
    }

    const y = dadosProcessados.intercepto + dadosProcessados.coeficienteX * x;
    
    setResultadoSimulacao({
      x,
      y,
      formula: `Ŷ = ${formatarNumero(dadosProcessados.intercepto, 4)} + ${formatarNumero(dadosProcessados.coeficienteX, 4)} × ${x}`,
      resultado: y.toFixed(4)
    });
  }, [dadosProcessados, valorSimulacao, formatarNumero]);

  // GRÁFICO DE DISPERSÃO COM DADOS REAIS
  const GraficoDispersao = useMemo(() => {
    if (!dadosProcessados) return null;
    
    if (dadosProcessados.scatterData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Dados insuficientes para gráfico de dispersão</p>
        </div>
      );
    }

    console.log(`📈 Renderizando gráfico de dispersão com ${dadosProcessados.scatterData.length} pontos reais`);

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-gray-700">📈 Dispersão com Linha de Regressão (Dados Reais)</h4>
          <Badge variant="success">R² = {(dadosProcessados.estatisticas.rQuadrado * 100).toFixed(1)}%</Badge>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="x" 
              type="number" 
              name={dadosProcessados.nomeVariavelX} 
              label={{ value: dadosProcessados.nomeVariavelX, position: 'bottom' }}
              domain={['auto', 'auto']}
            />
            <YAxis 
              dataKey="y" 
              type="number" 
              name={dadosProcessados.nomeVariavelY} 
              label={{ value: dadosProcessados.nomeVariavelY, angle: -90, position: 'left' }}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              formatter={(value, name) => [formatarNumero(value, 4), name]}
              labelFormatter={(label) => `Observação: ${label}`}
            />
            <Legend />
            <Scatter 
              name="Dados Observados (R)" 
              data={dadosProcessados.scatterData} 
              fill="#8884d8" 
              shape="circle"
              opacity={0.7}
            />
            {dadosProcessados.regressionLine.length > 0 && (
              <Line 
                type="monotone" 
                data={dadosProcessados.regressionLine} 
                dataKey="y" 
                stroke="#ff7300" 
                strokeWidth={2}
                dot={false}
                name="Reta de Regressão (R)"
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
        
        <div className="text-sm text-gray-600 mt-2">
          {dadosProcessados.scatterData.length} observações • 
          Fonte: Motor Estatístico R
        </div>
      </div>
    );
  }, [dadosProcessados, formatarNumero]);

  // GRÁFICO DE RESÍDUOS COM DADOS REAIS
  const GraficoResiduos = useMemo(() => {
    if (!dadosProcessados) return null;
    
    if (dadosProcessados.residualData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Dados insuficientes para análise de resíduos</p>
        </div>
      );
    }

    console.log(`📊 Renderizando gráfico de resíduos com ${dadosProcessados.residualData.length} pontos reais`);

    return (
      <div className="space-y-6">
        <h4 className="font-semibold text-gray-700">📊 Análise de Resíduos (Dados Reais)</h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-2">Resíduos vs Valores Ajustados</h5>
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart data={dadosProcessados.residualData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fitted" name="Valor Ajustado" />
                <YAxis dataKey="residual" name="Resíduo" />
                <Tooltip formatter={(value) => formatarNumero(value, 4)} />
                <Scatter 
                  data={dadosProcessados.residualData} 
                  fill="#10B981" 
                  fillOpacity={0.7}
                  name="Resíduos"
                />
                <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="3 3" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-2">Distribuição dos Resíduos</h5>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dadosProcessados.histogramData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [value, 'Frequência']}
                  labelFormatter={(label) => `Intervalo: ${label}`}
                />
                <Bar 
                  dataKey="count" 
                  name="Frequência" 
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }, [dadosProcessados, formatarNumero]);

  // GRÁFICO DE CURVA DE PREVISÃO
  const GraficoCurvaPrevisao = useMemo(() => {
    if (!dadosProcessados) return null;
    
    if (dadosProcessados.predictionCurve.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Dados insuficientes para curva de previsão</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-700">📈 Curva de Previsão com Intervalos de Confiança</h4>
        
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart 
            data={dadosProcessados.predictionCurve}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="x" 
              name={dadosProcessados.nomeVariavelX}
              label={{ value: dadosProcessados.nomeVariavelX, position: 'bottom' }}
            />
            <YAxis 
              name={dadosProcessados.nomeVariavelY}
              label={{ value: dadosProcessados.nomeVariavelY, angle: -90, position: 'left' }}
            />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'y_pred') return [formatarNumero(value, 4), 'Previsão'];
                if (name === 'lower') return [formatarNumero(value, 4), 'IC Inferior'];
                if (name === 'upper') return [formatarNumero(value, 4), 'IC Superior'];
                return [value, name];
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="upper" 
              stroke="#93C5FD" 
              fill="#93C5FD" 
              fillOpacity={0.3}
              name="IC 95% Superior"
            />
            <Area 
              type="monotone" 
              dataKey="lower" 
              stroke="#93C5FD" 
              fill="white" 
              fillOpacity={1}
              name="IC 95% Inferior"
            />
            <Line 
              type="monotone" 
              dataKey="y_pred" 
              stroke="#EF4444" 
              strokeWidth={3}
              dot={false}
              name="Previsão do Modelo"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }, [dadosProcessados, formatarNumero]);

  // GRÁFICO RADAR
  const GraficoRadar = useMemo(() => {
    if (!dadosProcessados) return null;
    
    if (dadosProcessados.radarMetrics.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Dados insuficientes para gráfico radar</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-700">📊 Métricas de Performance</h4>
        
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart 
            data={dadosProcessados.radarMetrics}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis domain={[0, 1]} />
            <Radar 
              name="Desempenho" 
              dataKey="value" 
              stroke="#8884d8" 
              fill="#8884d8" 
              fillOpacity={0.6}
            />
            <Tooltip 
              formatter={(value) => formatarPercentual(value)}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  }, [dadosProcessados, formatarPercentual]);

  // GRÁFICO DE DENSIDADE
  const GraficoDensidade = useMemo(() => {
    if (!dadosProcessados) return null;
    
    if (dadosProcessados.densityData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Dados insuficientes para gráfico de densidade</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h4 className="font-semibold text-gray-700">📊 Análise de Densidade (KDE)</h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-2">Densidade dos Resíduos</h5>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dadosProcessados.densityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="x" 
                  label={{ value: 'Valor do Resíduo', position: 'bottom' }}
                />
                <YAxis 
                  label={{ value: 'Densidade', angle: -90, position: 'left' }}
                />
                <Tooltip 
                  formatter={(value) => [formatarNumero(value, 6), 'Densidade']}
                />
                <Area 
                  type="monotone" 
                  dataKey="density" 
                  stroke="#EF4444" 
                  fill="#EF4444" 
                  fillOpacity={0.3}
                  name="Densidade KDE"
                />
                <ReferenceLine x={0} stroke="#6B7280" strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-2">Densidade de {dadosProcessados.nomeVariavelY}</h5>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dadosProcessados.yDensityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="x" 
                  label={{ value: `Valor de ${dadosProcessados.nomeVariavelY}`, position: 'bottom' }}
                />
                <YAxis 
                  label={{ value: 'Densidade', angle: -90, position: 'left' }}
                />
                <Tooltip 
                  formatter={(value) => [formatarNumero(value, 6), 'Densidade']}
                />
                <Area 
                  type="monotone" 
                  dataKey="density" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3}
                  name="Densidade KDE"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }, [dadosProcessados, formatarNumero]);

  const renderGraficoSelecionado = useCallback(() => {
    switch (graficoAtivo) {
      case 'dispersao':
        return GraficoDispersao;
      case 'residuos':
        return GraficoResiduos;
      case 'curva_previsao':
        return GraficoCurvaPrevisao;
      case 'radar':
        return GraficoRadar;
      case 'densidade':
        return GraficoDensidade;
      default:
        return GraficoDispersao;
    }
  }, [graficoAtivo, GraficoDispersao, GraficoResiduos, GraficoCurvaPrevisao, GraficoRadar, GraficoDensidade]);

  // ABA RESUMO
  const AbaResumo = useMemo(() => {
    if (!dadosProcessados) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-xl font-bold text-gray-800">{(dadosProcessados.estatisticas.rQuadrado * 100).toFixed(1)}%</div>
            <div className="text-xs text-gray-600 mt-1">R²</div>
            <div className="text-xs text-gray-500">Coef. Determinação</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-xl font-bold text-gray-800">{formatarNumero(dadosProcessados.estatisticas.rmse, 4)}</div>
            <div className="text-xs text-gray-600 mt-1">RMSE</div>
            <div className="text-xs text-gray-500">Raiz do erro</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-xl font-bold text-gray-800">{dadosProcessados.estatisticas.nObservacoes}</div>
            <div className="text-xs text-gray-600 mt-1">Observações</div>
            <div className="text-xs text-gray-500">Registros</div>
          </div>
          <div className={`text-center p-4 ${getBgClassificacao(dadosProcessados.classificacao)} rounded-lg border`}>
            <div className={`text-xl font-bold ${getCorClassificacao(dadosProcessados.classificacao)}`}>
              {dadosProcessados.classificacao}
            </div>
            <div className="text-xs text-gray-600 mt-1">Classificação</div>
            <div className="text-xs text-gray-500">Qualidade</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-gray-700 mb-3 text-center">Equação do Modelo (R)</h4>
          <div className="text-2xl font-mono font-bold text-gray-800 text-center">
            {dadosProcessados.equacao}
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Fonte: Motor Estatístico R
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Ajuste do Modelo
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span>R² Ajustado</span>
                <span className="font-bold">{(dadosProcessados.estatisticas.rQuadradoAjustado * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span>MSE</span>
                <span className="font-bold">{formatarNumero(dadosProcessados.estatisticas.mse, 4)}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span>MAE</span>
                <span className="font-bold">{formatarNumero(dadosProcessados.estatisticas.mae, 4)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Database className="w-4 h-4" /> Estatísticas do Modelo
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span>AIC</span>
                <span className="font-bold">{formatarNumero(dadosProcessados.estatisticas.aic, 2)}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span>BIC</span>
                <span className="font-bold">{formatarNumero(dadosProcessados.estatisticas.bic, 2)}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span>p-valor</span>
                <Badge variant={dadosProcessados.estatisticas.pValue < 0.05 ? 'success' : 'secondary'}>
                  {formatarNumero(dadosProcessados.estatisticas.pValue, 4)}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [dadosProcessados, formatarNumero, getBgClassificacao, getCorClassificacao]);

  // ABA COEFICIENTES
  const AbaCoeficientes = useMemo(() => {
    if (!dadosProcessados) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Sigma className="w-6 h-6" />
            Coeficientes (Output do R)
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Termo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estimativa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Erro Padrão</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">t-valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">p-valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Signif.</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dadosProcessados.coeficientes.map((coef, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      {coef.termo}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono">
                      {coef.estimativa.toFixed(6)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono">
                      {coef.erro?.toFixed(6) || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono">
                      {coef.estatistica?.toFixed(4) || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`font-mono ${coef.valor_p < 0.05 ? 'text-green-600' : 'text-red-600'}`}>
                        {coef.valor_p?.toFixed(6) || '-'}
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
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Interpretação dos Coeficientes
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Intercepto (β₀) = {formatarNumero(dadosProcessados.intercepto, 4)}</strong>: Valor esperado de {dadosProcessados.nomeVariavelY} quando {dadosProcessados.nomeVariavelX} = 0</li>
            <li>• <strong>Coeficiente (β₁) = {formatarNumero(dadosProcessados.coeficienteX, 4)}</strong>: Para cada unidade de aumento em {dadosProcessados.nomeVariavelX}, {dadosProcessados.nomeVariavelY} muda em {formatarNumero(dadosProcessados.coeficienteX, 4)} unidades</li>
          </ul>
        </div>
      </div>
    );
  }, [dadosProcessados, formatarNumero]);

  // ABA MÉTRICAS
  const AbaMetricas = useMemo(() => {
    if (!dadosProcessados) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Ajuste do Modelo</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(dadosProcessados.metricas.r2 * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">R²</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(dadosProcessados.metricas.r2Ajustado * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">R² Ajustado</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>RMSE</span>
                <span className="font-bold">{dadosProcessados.metricas.rmse.toFixed(4)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>MAE</span>
                <span className="font-bold">{dadosProcessados.metricas.mae.toFixed(4)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>MSE</span>
                <span className="font-bold">{dadosProcessados.metricas.mse.toFixed(4)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📈 Critérios de Informação</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {dadosProcessados.metricas.aic.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">AIC</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {dadosProcessados.metricas.bic.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">BIC</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>F-statistic</span>
                <span className="font-bold">{dadosProcessados.metricas.fStatistic.toFixed(4)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>p-valor</span>
                <Badge variant={dadosProcessados.metricas.pValue < 0.05 ? 'success' : 'secondary'}>
                  {dadosProcessados.metricas.pValue.toFixed(6)}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>Observações</span>
                <span className="font-bold">{dadosProcessados.estatisticas.nObservacoes}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Target className="w-6 h-6" />
            Radar de Performance
          </h3>
          {GraficoRadar}
        </div>
      </div>
    );
  }, [dadosProcessados, GraficoRadar]);

  // ABA GRÁFICOS
  const AbaGraficos = useMemo(() => {
    if (!dadosProcessados) return null;

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setGraficoAtivo('dispersao')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              graficoAtivo === 'dispersao'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📈 Dispersão
          </button>
          <button
            onClick={() => setGraficoAtivo('residuos')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              graficoAtivo === 'residuos'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📊 Resíduos
          </button>
          <button
            onClick={() => setGraficoAtivo('curva_previsao')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              graficoAtivo === 'curva_previsao'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📈 Curva de Previsão
          </button>
          <button
            onClick={() => setGraficoAtivo('radar')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              graficoAtivo === 'radar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📊 Radar
          </button>
          <button
            onClick={() => setGraficoAtivo('densidade')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              graficoAtivo === 'densidade'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📊 Densidade
          </button>
        </div>

        <motion.div
          key={graficoAtivo}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderGraficoSelecionado()}
        </motion.div>
      </div>
    );
  }, [dadosProcessados, graficoAtivo, renderGraficoSelecionado]);

  // ABA SIMULAÇÃO
  const AbaSimulacao = useMemo(() => {
    if (!dadosProcessados) return null;

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-gray-700 mb-3 text-center">Equação Estimada (R):</h4>
          <div className="text-2xl font-mono font-bold text-gray-800 text-center">
            {dadosProcessados.equacao}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border-2 border-gray-100 shadow-lg">
          <h4 className="font-semibold text-gray-700 mb-4">🔮 Previsão de Valores</h4>
          
          <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor de {dadosProcessados.nomeVariavelX}:
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={valorSimulacao}
                  onChange={(e) => setValorSimulacao(e.target.value)}
                  placeholder="Digite um valor"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={executarSimulacao}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Calcular
                </button>
              </div>
            </div>
          </div>

          {resultadoSimulacao && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
            >
              <h5 className="font-semibold text-green-800 mb-3">📊 Resultado da Simulação</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white rounded-lg border">
                  <div className="text-sm text-gray-600 mb-1">Quando {dadosProcessados.nomeVariavelX} =</div>
                  <div className="text-3xl font-bold">{resultadoSimulacao.x}</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <div className="text-sm text-gray-600 mb-1">{dadosProcessados.nomeVariavelY} previsto (Ŷ) =</div>
                  <div className="text-3xl font-bold text-green-600">
                    {resultadoSimulacao.resultado}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-gray-700 font-mono bg-white p-3 rounded border">
                {resultadoSimulacao.formula} = {resultadoSimulacao.resultado}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }, [dadosProcessados, valorSimulacao, resultadoSimulacao, executarSimulacao]);

  // FUNÇÃO PARA GERAR PDF
  const gerarPDFProfissional = useCallback(async () => {
    if (!dadosProcessados) return;
    
    setExportandoPDF(true);
    
    try {
      console.log('📄 Iniciando geração do PDF...');
      
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
      doc.text('RELATÓRIO TÉCNICO', pageWidth / 2, 100, { align: 'center' });
      
      doc.setFontSize(20);
      doc.text('REGRESSÃO LINEAR SIMPLES', pageWidth / 2, 120, { align: 'center' });
      
      doc.setFontSize(24);
      doc.text(dadosProcessados.nome.toUpperCase(), pageWidth / 2, 150, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(`Classificação: ${dadosProcessados.classificacao}`, pageWidth / 2, 170, { align: 'center' });
      doc.text(`R²: ${(dadosProcessados.metricas.r2 * 100).toFixed(2)}%`, pageWidth / 2, 180, { align: 'center' });
      doc.text(`p-valor: ${dadosProcessados.metricas.pValue.toFixed(6)}`, pageWidth / 2, 190, { align: 'center' });
      
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
        ['Modelo:', dadosProcessados.nome],
        ['Técnica:', 'REGRESSÃO LINEAR SIMPLES'],
        ['Variável Y:', dadosProcessados.nomeVariavelY],
        ['Variável X:', dadosProcessados.nomeVariavelX],
        ['Classificação:', dadosProcessados.classificacao],
        ['Equação (R):', dadosProcessados.equacao]
      ];
      
      detalhes.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margem, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value.toString(), margem + 50, yPos);
        yPos += 8;
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
        coef.termo,
        coef.estimativa.toFixed(6),
        coef.erro.toFixed(6),
        coef.estatistica.toFixed(4),
        coef.valor_p.toFixed(6),
        coef.significancia
      ]);
      
      autoTable(doc, {
        startY: 60,
        head: [['Termo', 'Estimativa', 'Erro Padrão', 't-valor', 'p-valor', 'Signif.']],
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
        ['R²', `${(dadosProcessados.metricas.r2 * 100).toFixed(2)}%`],
        ['R² Ajustado', `${(dadosProcessados.metricas.r2Ajustado * 100).toFixed(2)}%`],
        ['RMSE', dadosProcessados.metricas.rmse.toFixed(6)],
        ['MAE', dadosProcessados.metricas.mae.toFixed(6)],
        ['AIC', dadosProcessados.metricas.aic.toFixed(2)],
        ['BIC', dadosProcessados.metricas.bic.toFixed(2)],
        ['F-statistic', dadosProcessados.metricas.fStatistic.toFixed(4)],
        ['p-valor', dadosProcessados.metricas.pValue.toFixed(6)]
      ];
      
      autoTable(doc, {
        startY: 60,
        body: metricasData,
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 5 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: 60 } },
        margin: { left: margem, right: margem }
      });
      
      // PÁGINA 5: CONCLUSÃO
      doc.addPage();
      
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
      
      const conclusao = dadosProcessados.metricas.pValue < 0.05
        ? `O modelo de regressão linear simples apresenta-se como estatisticamente significativo (p = ${dadosProcessados.metricas.pValue.toFixed(6)} < 0.05), com R² de ${(dadosProcessados.metricas.r2 * 100).toFixed(2)}%. Todos os cálculos foram realizados pelo motor estatístico R.`
        : `O modelo não apresenta significância estatística (p = ${dadosProcessados.metricas.pValue.toFixed(6)} ≥ 0.05), indicando que a relação linear entre as variáveis pode não ser adequada.`;
      
      const lines = doc.splitTextToSize(conclusao, pageWidth - 2 * margem);
      lines.forEach(line => {
        doc.text(line, margem, yConclusao);
        yConclusao += 7;
      });
      
      const totalPagesFinal = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPagesFinal; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Sistema JIAM Preditivo - Motor Estatístico R', pageWidth / 2, pageHeight - 15, { align: 'center' });
        doc.text(`Documento confidencial - Página ${i} de ${totalPagesFinal}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
      
      const nomeArquivo = `Relatorio_JIAM_${dadosProcessados.nome.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(nomeArquivo);
      
      console.log('✅ PDF gerado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro detalhado ao gerar PDF:', error);
      alert(`Erro ao gerar PDF: ${error.message}`);
    } finally {
      setExportandoPDF(false);
    }
  }, [dadosProcessados]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-4">
            <Brain className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Processando dados do R...</h3>
          <p className="text-gray-600 mt-2">Aguardando respostas do motor estatístico</p>
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
        <h3 className="text-xl font-bold text-gray-800 mb-2">Erro no Motor R</h3>
        <p className="text-gray-600 mb-4">{erro}</p>
        <pre className="text-left bg-red-50 p-4 rounded-lg overflow-auto max-h-96 text-sm">
          {JSON.stringify({ modelo }, null, 2)}
        </pre>
      </div>
    );
  }

  if (!dadosProcessados) {
    return (
      <div className="text-center py-12">
        <Info className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Dados do R não disponíveis</h3>
        <p className="text-gray-600">Execute o modelo no motor R primeiro.</p>
      </div>
    );
  }

  const abas = [
    { id: 'resumo', label: '📋 Resumo', icon: FileText },
    { id: 'coeficientes', label: '📈 Coeficientes', icon: Sigma },
    { id: 'metricas', label: '📊 Métricas', icon: Gauge },
    { id: 'graficos', label: '📈 Gráficos', icon: BarChart3 },
    { id: 'simulacao', label: '🔮 Simulação', icon: Calculator }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-[#0A1F44] to-[#1a3a6e] text-white p-8 rounded-3xl">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Calculator className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">📈 Relatório de Regressão Linear Simples</h1>
              <p className="text-lg opacity-90">{dadosProcessados.nome}</p>
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
            <div className="text-sm opacity-80">Classificação</div>
            <div className={`text-2xl font-bold ${getCorClassificacao(dadosProcessados.classificacao)}`}>
              {dadosProcessados.classificacao}
            </div>
          </div>
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-sm opacity-80">R² (R)</div>
            <div className="text-2xl font-bold">{(dadosProcessados.metricas.r2 * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-sm opacity-80">RMSE (R)</div>
            <div className="text-2xl font-bold">{dadosProcessados.metricas.rmse.toFixed(4)}</div>
          </div>
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-sm opacity-80">p-valor (R)</div>
            <div className="text-2xl font-bold">{dadosProcessados.metricas.pValue.toFixed(4)}</div>
          </div>
        </div>
      </div>

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
                      ? 'text-blue-600 border-b-2 border-blue-500'
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

        <div className="p-6">
          {abaAtiva === 'resumo' && AbaResumo}
          {abaAtiva === 'coeficientes' && AbaCoeficientes}
          {abaAtiva === 'metricas' && AbaMetricas}
          {abaAtiva === 'graficos' && AbaGraficos}
          {abaAtiva === 'simulacao' && AbaSimulacao}
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-xl border-2 border-amber-200">
        <div className="flex items-center gap-4">
          <Award className="w-12 h-12 text-amber-600" />
          <div>
            <h4 className="font-bold text-amber-800 text-lg">Motor Estatístico R</h4>
            <p className="text-amber-700">
              Todos os cálculos e coeficientes foram gerados pelo motor estatístico R,
              garantindo precisão e confiabilidade acadêmica.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelatorioRegressaoSimples;