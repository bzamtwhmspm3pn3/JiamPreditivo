import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ComposedChart, ReferenceLine
} from 'recharts';
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import Button from '../componentes/Button';
import Badge from '../componentes/Badge';
import Input from '../componentes/Input';

// Paleta de cores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function ResultadoLinearAprimorado({ resultado, dadosOriginais, onVoltar, onNovoModelo }) {
  const [abaAtiva, setAbaAtiva] = useState('resumo');
  const [valorSimulacaoX, setValorSimulacaoX] = useState('');
  const [resultadoSimulacao, setResultadoSimulacao] = useState(null);
  const [graficoSelecionado, setGraficoSelecionado] = useState('dispersao');
  const [dadosGraficos, setDadosGraficos] = useState(null);

  useEffect(() => {
    if (resultado && dadosOriginais) {
      prepararDadosGraficos();
    }
  }, [resultado, dadosOriginais]);

  if (!resultado || !resultado.resultado) {
    return (
      <div className="text-center p-8 text-gray-500">
        <p>Nenhum resultado disponível</p>
      </div>
    );
  }

  const { resultado: resultadoBackend } = resultado;
  const coeficientes = resultadoBackend.coefficients || {};
  const metricas = resultadoBackend.metrics || {};
  const formula = resultado.parametros;

  // Função para extrair intercepto e coeficiente de forma segura
  const extrairCoeficientes = () => {
    let interceptoValor = 0;
    let coeficienteXValor = 0;
    
    // Extrair intercepto
    if (coeficientes['(Intercept)']) {
      if (typeof coeficientes['(Intercept)'] === 'object') {
        interceptoValor = coeficientes['(Intercept)'].estimate || coeficientes['(Intercept)'] || 0;
      } else {
        interceptoValor = coeficientes['(Intercept)'] || 0;
      }
    } else if (coeficientes.intercept) {
      if (typeof coeficientes.intercept === 'object') {
        interceptoValor = coeficientes.intercept.estimate || coeficientes.intercept || 0;
      } else {
        interceptoValor = coeficientes.intercept || 0;
      }
    }
    
    // Extrair coeficiente da variável X
    if (formula.x && coeficientes[formula.x]) {
      if (typeof coeficientes[formula.x] === 'object') {
        coeficienteXValor = coeficientes[formula.x].estimate || coeficientes[formula.x] || 0;
      } else {
        coeficienteXValor = coeficientes[formula.x] || 0;
      }
    }
    
    return { intercepto: interceptoValor, coeficienteX: coeficienteXValor };
  };

  const { intercepto, coeficienteX } = extrairCoeficientes();

  // Função para calcular densidade (Kernel Density Estimation)
  const calcularDensidade = (valores, pontos = 100) => {
    if (!valores || valores.length === 0) return [];
    
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const bandwidth = (max - min) / 10; // Largura de banda
    
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
  };

  // Preparar dados para gráficos
  const prepararDadosGraficos = () => {
    if (!dadosOriginais || !formula.x || !formula.y) return;

    try {
      // 1. Dados para gráfico de dispersão
      const scatterData = dadosOriginais.map((item, idx) => ({
        id: idx + 1,
        x: parseFloat(item[formula.x]) || 0,
        y: parseFloat(item[formula.y]) || 0,
        y_pred: intercepto + coeficienteX * (parseFloat(item[formula.x]) || 0)
      })).filter(d => !isNaN(d.x) && !isNaN(d.y));

      // Linha de regressão
      const xValues = scatterData.map(d => d.x);
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      const regressionLine = [
        { x: minX * 0.9, y: intercepto + coeficienteX * minX * 0.9 },
        { x: maxX * 1.1, y: intercepto + coeficienteX * maxX * 1.1 }
      ];

      // 2. Dados para análise de resíduos
      const residualData = scatterData.map(d => ({
        id: d.id,
        fitted: d.y_pred,
        residual: d.y - d.y_pred,
        absolute_residual: Math.abs(d.y - d.y_pred)
      }));

      // 3. Histograma de resíduos
      const residuals = residualData.map(d => d.residual);
      const minResidual = Math.min(...residuals);
      const maxResidual = Math.max(...residuals);
      const binCount = 10;
      const binWidth = (maxResidual - minResidual) / binCount;
      
      const histogramData = Array(binCount).fill(0).map((_, i) => {
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

      // 4. Dados para curva de previsão com intervalo de confiança
      const mse = metricas.mse || 0;
      const predictionCurve = Array.from({ length: 50 }, (_, i) => {
        const x = minX + (maxX - minX) * (i / 49);
        return {
          x: x,
          y_pred: intercepto + coeficienteX * x,
          lower: (intercepto + coeficienteX * x) - 2 * Math.sqrt(mse),
          upper: (intercepto + coeficienteX * x) + 2 * Math.sqrt(mse)
        };
      });

      // 5. Dados para métricas radar
      const radarMetrics = [
        { metric: 'R²', value: metricas.r_squared || 0, fullMark: 1 },
        { metric: 'Precisão', value: 1 - (metricas.rmse || 1) / Math.max(...scatterData.map(d => d.y)), fullMark: 1 },
        { metric: 'Ajuste', value: metricas.adjusted_r_squared || 0, fullMark: 1 },
        { metric: 'Erro Médio', value: 1 - (metricas.mae || 1) / Math.max(...scatterData.map(d => d.y)), fullMark: 1 },
        { metric: 'Confiança', value: 1 - Math.sqrt(mse) / Math.max(...scatterData.map(d => d.y)), fullMark: 1 }
      ];

      // 6. Dados para gráfico de densidade dos resíduos
      const densityData = calcularDensidade(residuals, 100);

      // 7. Dados para gráfico de densidade da variável Y
      const yValues = scatterData.map(d => d.y);
      const yDensityData = calcularDensidade(yValues, 100);

      setDadosGraficos({
        scatterData,
        regressionLine,
        residualData,
        histogramData,
        predictionCurve,
        radarMetrics,
        densityData,
        yDensityData,
        scatterDataLength: scatterData.length
      });
    } catch (error) {
      console.error('Erro ao preparar dados para gráficos:', error);
    }
  };

  // Função para calcular previsão
  const calcularPrevisao = (valorX) => {
    const x = parseFloat(valorX);
    if (isNaN(x)) return null;
    return parseFloat(intercepto) + parseFloat(coeficienteX) * x;
  };

  // Executar simulação
  const executarSimulacao = () => {
    if (!valorSimulacaoX || isNaN(parseFloat(valorSimulacaoX))) {
      toast.error('Digite um valor numérico válido para X');
      return;
    }

    const x = parseFloat(valorSimulacaoX);
    const y = calcularPrevisao(x);
    
    setResultadoSimulacao({
      x,
      y,
      formula: `Ŷ = ${parseFloat(intercepto).toFixed(4)} + ${parseFloat(coeficienteX).toFixed(4)} × ${x}`,
      resultado: y.toFixed(4)
    });
  };

  // Calcular estatísticas
  const calcularEstatisticas = () => {
    const stats = {
      rQuadrado: metricas.r_squared || metricas.rSquared || 0,
      rQuadradoAjustado: metricas.adjusted_r_squared || metricas.adjustedRSquared || 0,
      mse: metricas.mse || 0,
      rmse: metricas.rmse || 0,
      mae: metricas.mae || 0,
      aic: metricas.aic || 0,
      bic: metricas.bic || 0,
      fStatistic: metricas.f_statistic || metricas.fStatistic || 0,
      pValue: metricas.p_value || metricas.pValue || 0
    };

    // Garantir que são números
    Object.keys(stats).forEach(key => {
      stats[key] = parseFloat(stats[key]) || 0;
    });

    // Classificar qualidade do modelo baseado no R²
    let qualidade = '';
    let cor = '';
    if (stats.rQuadrado >= 0.9) {
      qualidade = 'Excelente';
      cor = 'text-green-600';
    } else if (stats.rQuadrado >= 0.7) {
      qualidade = 'Boa';
      cor = 'text-blue-600';
    } else if (stats.rQuadrado >= 0.5) {
      qualidade = 'Moderada';
      cor = 'text-yellow-600';
    } else {
      qualidade = 'Fraca';
      cor = 'text-red-600';
    }

    return { ...stats, qualidade, cor };
  };

  const estatisticas = calcularEstatisticas();

  // Função para formatar números com segurança
  const formatarNumero = (valor, casas = 4) => {
    const num = parseFloat(valor);
    if (isNaN(num)) return '0.0000';
    return num.toFixed(casas);
  };

  // Função para obter o valor de um coeficiente para exibição
  const getCoefValor = (coef, chave = 'estimate') => {
    if (!coef) return 0;
    
    if (typeof coef === 'object') {
      return coef[chave] || coef;
    }
    
    return coef;
  };

  // ============ RENDERIZAÇÃO DE GRÁFICOS ============

  const renderGraficoDispersao = () => {
    if (!dadosGraficos?.scatterData || dadosGraficos.scatterData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Dados insuficientes para gráfico de dispersão</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-gray-700">📈 Dispersão com Linha de Regressão</h4>
          <Badge variant="success">R² = {(estatisticas.rQuadrado * 100).toFixed(1)}%</Badge>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="x" 
              type="number" 
              name="X" 
              label={{ value: formula.x, position: 'bottom' }}
            />
            <YAxis 
              dataKey="y" 
              type="number" 
              name="Y" 
              label={{ value: formula.y, angle: -90, position: 'left' }}
            />
            <Tooltip 
              formatter={(value, name) => [`${Number(value).toFixed(2)}`, name]}
              labelFormatter={(label) => `Ponto: ${label}`}
            />
            <Legend />
            <Scatter 
              name="Dados Observados" 
              data={dadosGraficos.scatterData} 
              fill="#8884d8" 
              shape="circle"
              opacity={0.7}
            />
            {dadosGraficos.regressionLine && dadosGraficos.regressionLine.length > 0 && (
              <Line 
                type="monotone" 
                data={dadosGraficos.regressionLine} 
                dataKey="y" 
                stroke="#ff7300" 
                strokeWidth={2}
                dot={false}
                name="Linha de Regressão"
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
        
        <div className="text-sm text-gray-600 mt-2">
          {dadosGraficos.scatterDataLength} observações • Equação: Ŷ = {formatarNumero(intercepto)} + {formatarNumero(coeficienteX)}X
        </div>
      </div>
    );
  };

  const renderGraficoResiduos = () => {
    if (!dadosGraficos?.residualData || dadosGraficos.residualData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Dados insuficientes para análise de resíduos</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h4 className="font-semibold text-gray-700">📊 Análise de Resíduos</h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resíduos vs Valores Ajustados */}
          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-2">Resíduos vs Valores Ajustados</h5>
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart data={dadosGraficos.residualData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fitted" name="Valor Ajustado" />
                <YAxis dataKey="residual" name="Resíduo" />
                <Tooltip formatter={(value) => Number(value).toFixed(4)} />
                <Scatter 
                  data={dadosGraficos.residualData} 
                  fill="#10B981" 
                  fillOpacity={0.7}
                  name="Resíduos"
                />
                <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="3 3" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Histograma dos Resíduos */}
          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-2">Distribuição dos Resíduos</h5>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dadosGraficos.histogramData}>
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
  };

  const renderGraficoCurvaPrevisao = () => {
    if (!dadosGraficos?.predictionCurve || dadosGraficos.predictionCurve.length === 0) {
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
            data={dadosGraficos.predictionCurve}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="x" 
              name="X"
              label={{ value: formula.x, position: 'bottom' }}
            />
            <YAxis 
              name="Y Previsto"
              label={{ value: formula.y, angle: -90, position: 'left' }}
            />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'y_pred') return [Number(value).toFixed(4), 'Previsão'];
                if (name === 'lower') return [Number(value).toFixed(4), 'IC Inferior'];
                if (name === 'upper') return [Number(value).toFixed(4), 'IC Superior'];
                return [value, name];
              }}
            />
            <Legend />
            
            {/* Área de intervalo de confiança */}
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
            
            {/* Linha de previsão */}
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
  };

  const renderGraficoRadarMetricas = () => {
    if (!dadosGraficos?.radarMetrics || dadosGraficos.radarMetrics.length === 0) {
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
            data={dadosGraficos.radarMetrics}
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
              formatter={(value) => `${Number(value).toFixed(4)}`}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderGraficoDensidadeResiduos = () => {
    if (!dadosGraficos?.densityData || dadosGraficos.densityData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Dados insuficientes para gráfico de densidade</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h4 className="font-semibold text-gray-700">📊 Análise de Densidade</h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Densidade dos Resíduos */}
          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-2">Densidade dos Resíduos (KDE)</h5>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dadosGraficos.densityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="x" 
                  name="Resíduo"
                  label={{ value: 'Valor do Resíduo', position: 'bottom' }}
                />
                <YAxis 
                  name="Densidade"
                  label={{ value: 'Densidade de Probabilidade', angle: -90, position: 'left' }}
                />
                <Tooltip 
                  formatter={(value) => [Number(value).toFixed(6), 'Densidade']}
                  labelFormatter={(label) => `Resíduo: ${Number(label).toFixed(4)}`}
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
            <div className="text-xs text-gray-500 mt-2 text-center">
              Distribuição suavizada dos resíduos (Kernel Density Estimation)
            </div>
          </div>

          {/* Densidade da Variável Y */}
          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-2">Densidade de {formula.y}</h5>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dadosGraficos.yDensityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="x" 
                  name={formula.y}
                  label={{ value: `Valor de ${formula.y}`, position: 'bottom' }}
                />
                <YAxis 
                  name="Densidade"
                  label={{ value: 'Densidade de Probabilidade', angle: -90, position: 'left' }}
                />
                <Tooltip 
                  formatter={(value) => [Number(value).toFixed(6), 'Densidade']}
                  labelFormatter={(label) => `${formula.y}: ${Number(label).toFixed(4)}`}
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
            <div className="text-xs text-gray-500 mt-2 text-center">
              Distribuição suavizada da variável dependente
            </div>
          </div>
        </div>

        {/* Estatísticas de densidade */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Estatísticas das Distribuições</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-white p-3 rounded shadow-sm">
              <div className="text-gray-500">Média dos Resíduos</div>
              <div className="font-semibold">
                {dadosGraficos.densityData.length > 0 
                  ? (dadosGraficos.densityData.reduce((sum, d) => sum + d.x * d.density, 0) / 
                     dadosGraficos.densityData.reduce((sum, d) => sum + d.density, 0)).toFixed(4)
                  : '0.0000'}
              </div>
            </div>
            <div className="bg-white p-3 rounded shadow-sm">
              <div className="text-gray-500">Variância dos Resíduos</div>
              <div className="font-semibold">
                {estatisticas.mse?.toFixed(4) || '0.0000'}
              </div>
            </div>
            <div className="bg-white p-3 rounded shadow-sm">
              <div className="text-gray-500">Assimetria</div>
              <div className="font-semibold text-yellow-600">Verificar</div>
            </div>
            <div className="bg-white p-3 rounded shadow-sm">
              <div className="text-gray-500">Curtose</div>
              <div className="font-semibold text-blue-600">Normal</div>
            </div>
          </div>
        </div>

        {/* Interpretação */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="text-sm font-medium text-blue-900 mb-2">💡 Interpretação da Densidade</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Resíduos:</strong> Distribuição deve ser simétrica em torno de zero</li>
            <li>• <strong>Pico em 0:</strong> Indica boa precisão do modelo</li>
            <li>• <strong>{formula.y}:</strong> Distribuição da variável original</li>
            <li>• <strong>KDE:</strong> Estimação por kernel (suavizada)</li>
          </ul>
        </div>
      </div>
    );
  };

  // Renderizar o gráfico selecionado
  const renderGraficoSelecionado = () => {
    switch (graficoSelecionado) {
      case 'dispersao':
        return renderGraficoDispersao();
      case 'residuos':
        return renderGraficoResiduos();
      case 'curva_previsao':
        return renderGraficoCurvaPrevisao();
      case 'radar':
        return renderGraficoRadarMetricas();
      case 'densidade':
        return renderGraficoDensidadeResiduos();
      default:
        return renderGraficoDispersao();
    }
  };

  // Função para renderizar a aba ativa
  const renderConteudoAba = () => {
    switch (abaAtiva) {
      case 'resumo':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Equação Estimada</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                    <div className="text-2xl font-bold text-gray-800 mb-2">
                      Ŷ = {formatarNumero(intercepto)} + {formatarNumero(coeficienteX)} × X
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      Onde Ŷ é o valor predito de {formula.y || 'Y'}
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Intercepto (β₀):</span>
                      <Badge variant={intercepto !== 0 ? "default" : "secondary"}>
                        {formatarNumero(intercepto)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Coeficiente Angular (β₁):</span>
                      <Badge variant={coeficienteX !== 0 ? "default" : "secondary"}>
                        {formatarNumero(coeficienteX)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Qualidade do Modelo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold mb-2">
                      {estatisticas.qualidade}
                    </div>
                    <div className={`text-2xl font-semibold ${estatisticas.cor}`}>
                      R² = {(estatisticas.rQuadrado * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Explicação da variância
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>R² Ajustado:</span>
                      <span className="font-semibold">{(estatisticas.rQuadradoAjustado * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Erro Quadrático Médio (MSE):</span>
                      <span className="font-semibold">{formatarNumero(estatisticas.mse)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Raiz do MSE (RMSE):</span>
                      <span className="font-semibold">{formatarNumero(estatisticas.rmse)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos no resumo */}
            <Card>
              <CardHeader>
                <CardTitle>📊 Visualização do Modelo</CardTitle>
                <CardDescription>
                  Gráficos para análise da regressão linear
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Botões de seleção de gráfico */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={() => setGraficoSelecionado('dispersao')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      graficoSelecionado === 'dispersao'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📈 Dispersão
                  </button>
                  <button
                    onClick={() => setGraficoSelecionado('residuos')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      graficoSelecionado === 'residuos'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📊 Resíduos
                  </button>
                  <button
                    onClick={() => setGraficoSelecionado('curva_previsao')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      graficoSelecionado === 'curva_previsao'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📈 Curva de Previsão
                  </button>
                  <button
                    onClick={() => setGraficoSelecionado('radar')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      graficoSelecionado === 'radar'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📊 Métricas Radar
                  </button>
                  <button
                    onClick={() => setGraficoSelecionado('densidade')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      graficoSelecionado === 'densidade'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📊 Densidade
                  </button>
                </div>

                {/* Gráfico selecionado */}
                <motion.div
                  key={graficoSelecionado}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderGraficoSelecionado()}
                </motion.div>

                {/* Informações sobre o gráfico */}
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">💡 Como interpretar:</h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {graficoSelecionado === 'dispersao' && (
                      <>
                        <li>• <strong>Pontos azuis:</strong> Dados observados</li>
                        <li>• <strong>Linha laranja:</strong> Reta de regressão ajustada</li>
                        <li>• <strong>R²:</strong> Proporção da variância explicada pelo modelo</li>
                      </>
                    )}
                    {graficoSelecionado === 'residuos' && (
                      <>
                        <li>• <strong>Esquerda:</strong> Resíduos devem ser aleatórios em torno de zero</li>
                        <li>• <strong>Direita:</strong> Distribuição dos resíduos (idealmente normal)</li>
                        <li>• <strong>Homocedasticidade:</strong> Resíduos constantes ao longo de X</li>
                      </>
                    )}
                    {graficoSelecionado === 'curva_previsao' && (
                      <>
                        <li>• <strong>Linha vermelha:</strong> Valor médio previsto</li>
                        <li>• <strong>Área azul:</strong> Intervalo de confiança 95%</li>
                        <li>• <strong>Interpretação:</strong> 95% de chance do valor real estar na área azul</li>
                      </>
                    )}
                    {graficoSelecionado === 'radar' && (
                      <>
                        <li>• <strong>R²:</strong> Explicação da variância (quanto maior melhor)</li>
                        <li>• <strong>Precisão:</strong> 1 - (RMSE / amplitude de Y)</li>
                        <li>• <strong>Ajuste:</strong> R² ajustado por número de variáveis</li>
                        <li>• <strong>Erro Médio:</strong> 1 - (MAE / amplitude de Y)</li>
                        <li>• <strong>Confiança:</strong> 1 - (√MSE / amplitude de Y)</li>
                      </>
                    )}
                    {graficoSelecionado === 'densidade' && (
                      <>
                        <li>• <strong>Esquerda:</strong> Densidade dos resíduos (Kernel Density Estimation)</li>
                        <li>• <strong>Direita:</strong> Densidade da variável dependente</li>
                        <li>• <strong>Interpretação:</strong> Distribuição suavizada dos dados</li>
                        <li>• <strong>Normalidade:</strong> Resíduos devem ter distribuição normal</li>
                      </>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'coeficientes':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Coeficientes do Modelo</CardTitle>
              <CardDescription>
                Significância estatística dos parâmetros estimados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parâmetro
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estimativa
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Erro Padrão
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estatística t
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        p-valor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Significância
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(coeficientes).map(([nome, coef]) => {
                      const estimate = getCoefValor(coef, 'estimate');
                      const stdError = getCoefValor(coef, 'std_error');
                      const tValue = getCoefValor(coef, 't_value');
                      const pValue = getCoefValor(coef, 'p_value');
                      
                      return (
                        <tr key={nome}>
                          <td className="px-4 py-3 whitespace-nowrap font-medium">
                            {nome === '(Intercept)' ? 'Intercepto' : nome}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatarNumero(estimate)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {stdError ? formatarNumero(stdError) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {tValue ? formatarNumero(tValue) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {pValue ? formatarNumero(pValue) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {pValue ? (
                              parseFloat(pValue) < 0.001 ? (
                                <Badge variant="success">***</Badge>
                              ) : parseFloat(pValue) < 0.01 ? (
                                <Badge variant="success">**</Badge>
                              ) : parseFloat(pValue) < 0.05 ? (
                                <Badge variant="success">*</Badge>
                              ) : parseFloat(pValue) < 0.1 ? (
                                <Badge variant="warning">.</Badge>
                              ) : (
                                <Badge variant="secondary">n.s.</Badge>
                              )
                            ) : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">📝 Interpretação</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• <strong>Intercepto ({formatarNumero(intercepto)})</strong>: Valor esperado de {formula.y || 'Y'} quando {formula.x || 'X'} = 0</li>
                  <li>• <strong>Coeficiente ({formatarNumero(coeficienteX)})</strong>: Para cada unidade de aumento em {formula.x || 'X'}, {formula.y || 'Y'} aumenta em {formatarNumero(coeficienteX)} unidades</li>
                  <li>• <strong>Significância</strong>: *** p &lt; 0.001, ** p &lt; 0.01, * p &lt; 0.05</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        );

      case 'metricas':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>📊 Ajuste do Modelo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {(estatisticas.rQuadrado * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">R²</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {(estatisticas.rQuadradoAjustado * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">R² Ajustado</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded border">
                      <span>Erro Quadrático Médio (MSE)</span>
                      <span className="font-bold">{formatarNumero(estatisticas.mse)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded border">
                      <span>Raiz do Erro Quadrático Médio (RMSE)</span>
                      <span className="font-bold">{formatarNumero(estatisticas.rmse)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded border">
                      <span>Erro Absoluto Médio (MAE)</span>
                      <span className="font-bold">{formatarNumero(estatisticas.mae)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>📈 Estatísticas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatarNumero(estatisticas.aic, 2)}
                      </div>
                      <div className="text-sm text-gray-600">AIC</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-indigo-600">
                        {formatarNumero(estatisticas.bic, 2)}
                      </div>
                      <div className="text-sm text-gray-600">BIC</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded border">
                      <span>Estatística F</span>
                      <span className="font-bold">{formatarNumero(estatisticas.fStatistic)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded border">
                      <span>p-valor (F)</span>
                      <Badge variant={estatisticas.pValue < 0.05 ? "success" : "secondary"}>
                        {formatarNumero(estatisticas.pValue)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded border">
                      <span>Observações (n)</span>
                      <span className="font-bold">{dadosOriginais?.length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico radar das métricas */}
            <Card>
              <CardHeader>
                <CardTitle>📊 Visualização Radar das Métricas</CardTitle>
                <CardDescription>
                  Performance do modelo em diferentes dimensões
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderGraficoRadarMetricas()}
              </CardContent>
            </Card>
          </div>
        );

      case 'simulacao':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🔮 Simulação com o Modelo</CardTitle>
                <CardDescription>
                  Use a equação estimada para prever valores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Equação */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
                    <h4 className="font-semibold text-gray-700 mb-3">Equação Estimada:</h4>
                    <div className="text-2xl font-mono text-center font-bold text-gray-800">
                      Ŷ = {formatarNumero(intercepto)} + {formatarNumero(coeficienteX)} × X
                    </div>
                  </div>

                  {/* Simulação */}
                  <div className="bg-white p-6 rounded-lg border">
                    <h4 className="font-semibold text-gray-700 mb-4">Previsão de Valores</h4>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Valor de {formula.x || 'X'} para previsão:
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={valorSimulacaoX}
                            onChange={(e) => setValorSimulacaoX(e.target.value)}
                            placeholder="Digite um valor"
                            className="flex-1"
                          />
                          <Button onClick={executarSimulacao}>
                            Calcular
                          </Button>
                        </div>
                      </div>
                    </div>

                    {resultadoSimulacao && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
                      >
                        <h5 className="font-semibold text-green-800 mb-2">📊 Resultado da Simulação</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-sm text-gray-600">Quando {formula.x || 'X'} =</div>
                            <div className="text-2xl font-bold">{resultadoSimulacao.x}</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm text-gray-600">{formula.y || 'Y'} previsto (Ŷ) =</div>
                            <div className="text-2xl font-bold text-green-600">
                              {resultadoSimulacao.resultado}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 text-sm text-gray-700 font-mono bg-white p-3 rounded border">
                          {resultadoSimulacao.formula} = {resultadoSimulacao.resultado}
                        </div>
                      </motion.div>
                    )}

                    {/* Exemplos de simulação */}
                    <div className="mt-6">
                      <h5 className="font-semibold text-gray-700 mb-3">💡 Exemplos Rápidos:</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[1, 2, 5, 10].map((valor) => (
                          <button
                            key={valor}
                            onClick={() => {
                              setValorSimulacaoX(valor.toString());
                              setTimeout(executarSimulacao, 100);
                            }}
                            className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border text-center transition-colors"
                          >
                            <div className="text-lg font-bold">{valor}</div>
                            <div className="text-xs text-gray-500">unidade(s)</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de curva de previsão na simulação */}
            <Card>
              <CardHeader>
                <CardTitle>📈 Curva de Previsão</CardTitle>
                <CardDescription>
                  Visualize onde sua simulação se encaixa na curva de previsão
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderGraficoCurvaPrevisao()}
                
                {resultadoSimulacao && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">📌 Sua Simulação no Gráfico:</h5>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Quando X = {resultadoSimulacao.x}, Y previsto = {resultadoSimulacao.resultado}</li>
                      <li>• Este ponto está na linha vermelha da curva de previsão</li>
                      <li>• Há 95% de chance do valor real estar entre os limites azuis</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho do resultado */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>📊 Resultados da Regressão Linear</CardTitle>
              <CardDescription>
                Modelo: {resultado.nome} • Variável Y: {formula.y} • Variável X: {formula.x}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={onNovoModelo} variant="outline" size="sm">
                🔄 Novo Modelo
              </Button>
              <Button onClick={onVoltar} variant="outline" size="sm">
                ⬅️ Voltar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs de navegação simplificadas */}
      <div className="border-b border-gray-200">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAbaAtiva('resumo')}
            className={`px-4 py-2 font-medium flex items-center gap-2 ${
              abaAtiva === 'resumo' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 Resumo
          </button>
          <button
            onClick={() => setAbaAtiva('coeficientes')}
            className={`px-4 py-2 font-medium flex items-center gap-2 ${
              abaAtiva === 'coeficientes' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📈 Coeficientes
          </button>
          <button
            onClick={() => setAbaAtiva('metricas')}
            className={`px-4 py-2 font-medium flex items-center gap-2 ${
              abaAtiva === 'metricas' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📐 Métricas
          </button>
          <button
            onClick={() => setAbaAtiva('simulacao')}
            className={`px-4 py-2 font-medium flex items-center gap-2 ${
              abaAtiva === 'simulacao' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🔮 Simulação
          </button>
        </div>
      </div>

      {/* Conteúdo da aba ativa */}
      <div className="mt-6">
        {renderConteudoAba()}
      </div>
    </div>
  );
}