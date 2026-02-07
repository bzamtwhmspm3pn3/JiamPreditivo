import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  ReferenceLine, Cell, ResponsiveContainer
} from 'recharts';
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import Button from '../componentes/Button';
import Badge from '../componentes/Badge';
import Input from '../componentes/Input';
import Label from '../componentes/Label';

// Funções auxiliares
const formatarNumero = (valor, casas = 4) => {
  const num = parseFloat(valor);
  if (isNaN(num)) return '0'.padEnd(casas === 0 ? 1 : casas + 1, '.0');
  if (Math.abs(num) < 0.0001 && num !== 0) return num.toExponential(casas);
  return casas === 0 ? num.toString() : num.toFixed(casas);
};

// Calcular correlação de Pearson
const calcularCorrelacaoPearson = (x, y) => {
  const n = x.length;
  if (n < 2) return 0;
  
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  let cov = 0, varX = 0, varY = 0;
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    cov += diffX * diffY;
    varX += diffX * diffX;
    varY += diffY * diffY;
  }
  
  return varX === 0 || varY === 0 ? 0 : cov / Math.sqrt(varX * varY);
};

export default function ResultadoLinearMultiplaAprimorado({ resultado, dadosOriginais, onVoltar, onNovoModelo }) {
  const [abaAtiva, setAbaAtiva] = useState('resumo');
  const [valoresSimulacao, setValoresSimulacao] = useState({});
  const [resultadoSimulacao, setResultadoSimulacao] = useState(null);
  const [coeficientesExtraidos, setCoeficientesExtraidos] = useState({ intercepto: 0, coeficientesVars: {} });
  const [estatisticas, setEstatisticas] = useState({
    rQuadrado: 0,
    rQuadradoAjustado: 0,
    mse: 0,
    rmse: 0,
    mae: 0,
    aic: 0,
    bic: 0,
    fStatistic: 0,
    pValue: 0,
    nObservacoes: 0,
    qualidade: 'Fraca',
    cor: 'text-red-600'
  });
  const [dadosProcessados, setDadosProcessados] = useState(false);
  const [variaveisX, setVariaveisX] = useState([]);
  const [variavelY, setVariavelY] = useState('');
  
  // Estados para dados de gráficos
  const [dadosScatter, setDadosScatter] = useState([]);
  const [linhaRegressao, setLinhaRegressao] = useState([]);
  const [dadosResiduos, setDadosResiduos] = useState([]);
  const [dadosQQ, setDadosQQ] = useState([]);
  const [dadosCooks, setDadosCooks] = useState([]);
  const [dadosForestPlot, setDadosForestPlot] = useState([]);
  const [dadosHeatmap, setDadosHeatmap] = useState([]);
  const [dadosDensidade, setDadosDensidade] = useState([]);
  const [dadosCurvaPrevisao, setDadosCurvaPrevisao] = useState([]);
  const [dadosImportancia, setDadosImportancia] = useState([]);

  // Função para encontrar coeficiente
  const encontrarCoeficiente = (nome) => {
    const coefArray = resultado?.resultado?.coeficientes || [];
    if (!Array.isArray(coefArray)) return null;
    
    if (nome === 'Intercepto' || nome === '(Intercept)') {
      return coefArray.find(coef => coef && coef.termo && coef.termo.trim() === '(Intercept)');
    }
    
    return coefArray.find(coef => {
      if (!coef || !coef.termo) return false;
      const termo = coef.termo.trim();
      return termo === nome || termo.includes(nome);
    });
  };

  // Preparar dados para gráficos
  const prepararDadosGraficos = () => {
    if (!dadosOriginais || !variaveisX.length || !variavelY) {
      console.log('❌ Dados insuficientes para preparar gráficos');
      return;
    }

    console.log('📊 Preparando dados para gráficos...', {
      variaveisX,
      variavelY,
      dadosOriginaisLength: dadosOriginais.length
    });

    try {
      // 1. Gráfico de dispersão principal (primeira variável X)
      const primeiraVariavelX = variaveisX[0];
      const scatterData = [];
      
      dadosOriginais.forEach((item, index) => {
        const xVal = parseFloat(item[primeiraVariavelX]);
        const yVal = parseFloat(item[variavelY]);
        
        if (!isNaN(xVal) && !isNaN(yVal)) {
          scatterData.push({
            id: index + 1,
            x: xVal,
            y: yVal,
            name: `Obs ${index + 1}`
          });
        }
      });

      console.log('📈 Dados scatter:', scatterData.length, 'pontos');
      setDadosScatter(scatterData);

      // 2. Calcular regressão linear simples para a primeira variável
      if (scatterData.length > 0) {
        const xValues = scatterData.map(d => d.x);
        const yValues = scatterData.map(d => d.y);
        const n = scatterData.length;
        
        const meanX = xValues.reduce((a, b) => a + b, 0) / n;
        const meanY = yValues.reduce((a, b) => a + b, 0) / n;
        
        let sumXY = 0, sumX2 = 0;
        for (let i = 0; i < n; i++) {
          sumXY += (xValues[i] - meanX) * (yValues[i] - meanY);
          sumX2 += Math.pow(xValues[i] - meanX, 2);
        }
        
        const slope = sumX2 !== 0 ? sumXY / sumX2 : 0;
        const intercept = meanY - slope * meanX;
        
        const minX = Math.min(...xValues) * 0.9;
        const maxX = Math.max(...xValues) * 1.1;
        
        setLinhaRegressao([
          { x: minX, y: intercept + slope * minX },
          { x: maxX, y: intercept + slope * maxX }
        ]);

        // 3. Calcular resíduos
        const residualData = scatterData.map((d, idx) => {
          const yPred = intercept + slope * d.x;
          return {
            id: idx + 1,
            fitted: yPred,
            residual: d.y - yPred,
            absolute_residual: Math.abs(d.y - yPred)
          };
        });
        
        console.log('📊 Dados residuos:', residualData.length, 'pontos');
        setDadosResiduos(residualData);

        // 4. Gerar dados para Q-Q plot (simplificado)
        const residuos = residualData.map(d => d.residual);
        const sortedResiduos = [...residuos].sort((a, b) => a - b);
        const dadosQQ = [];
        
        for (let i = 0; i < n; i++) {
          const p = (i + 0.5) / n;
          // Aproximação para quantis normais
          const teorico = Math.sqrt(2) * Math.atan(2 * p - 1);
          dadosQQ.push({
            teorico: teorico,
            observado: sortedResiduos[i],
            id: i + 1
          });
        }
        
        setDadosQQ(dadosQQ);

        // 5. Calcular Cook's Distance (simplificado)
        const mse = residuos.reduce((sum, r) => sum + r * r, 0) / Math.max(1, n - variaveisX.length - 1);
        const cooksData = [];
        const limite = 4 / n;
        
        for (let i = 0; i < n; i++) {
          const hi = 1 / n + Math.pow(xValues[i], 2) / (sumX2 || 1);
          const cooksDist = (residuos[i] ** 2 * hi) / (mse * Math.pow(1 - hi, 2));
          cooksData.push({
            id: i + 1,
            cooksDistance: isNaN(cooksDist) ? 0 : cooksDist,
            limite: limite
          });
        }
        
        setDadosCooks(cooksData);

        // 6. Gerar dados de densidade
        const minRes = Math.min(...residuos);
        const maxRes = Math.max(...residuos);
        const densityData = [];
        const bandwidth = Math.max(0.1, (maxRes - minRes) / 20);
        
        for (let i = 0; i <= 50; i++) {
          const x = minRes + (maxRes - minRes) * (i / 50);
          let sum = 0;
          for (const r of residuos) {
            const u = (x - r) / bandwidth;
            sum += Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
          }
          densityData.push({
            x: x,
            density: sum / (residuos.length * bandwidth)
          });
        }
        
        setDadosDensidade(densityData);

        // 7. Curva de previsão com intervalo de confiança
        const rmse = Math.sqrt(Math.max(0, mse));
        const predictionCurve = [];
        
        for (let i = 0; i <= 20; i++) {
          const x = minX + (maxX - minX) * (i / 20);
          const yPred = intercept + slope * x;
          predictionCurve.push({
            x: x,
            y_pred: yPred,
            lower: yPred - 1.96 * rmse,
            upper: yPred + 1.96 * rmse
          });
        }
        
        setDadosCurvaPrevisao(predictionCurve);
      }

      // 8. Forest Plot (coeficientes)
      const forestData = variaveisX.map(variavel => {
        const coef = coeficientesExtraidos.coeficientesVars[variavel] || 0;
        const coefObj = encontrarCoeficiente(variavel);
        const erro = coefObj?.erro || Math.abs(coef) * 0.3;
        
        return {
          name: variavel,
          estimate: coef,
          lower: coef - 1.96 * erro,
          upper: coef + 1.96 * erro,
          pValue: coefObj?.valor_p || 0.5,
          significante: (coefObj?.valor_p || 1) < 0.05
        };
      }).sort((a, b) => Math.abs(b.estimate) - Math.abs(a.estimate));
      
      console.log('🌲 Forest plot data:', forestData);
      setDadosForestPlot(forestData);

      // 9. Heatmap de correlação
      const todasVariaveis = [variavelY, ...variaveisX];
      const heatmapData = [];
      
      for (let i = 0; i < todasVariaveis.length; i++) {
        for (let j = 0; j < todasVariaveis.length; j++) {
          const var1 = todasVariaveis[i];
          const var2 = todasVariaveis[j];
          
          if (i === j) {
            heatmapData.push({
              x: var1,
              y: var2,
              value: 1.0,
              absValue: 1.0,
              color: '#3B82F6'
            });
          } else {
            // Extrair valores para as duas variáveis
            const valores1 = [];
            const valores2 = [];
            
            dadosOriginais.forEach(item => {
              const v1 = parseFloat(item[var1]);
              const v2 = parseFloat(item[var2]);
              if (!isNaN(v1) && !isNaN(v2)) {
                valores1.push(v1);
                valores2.push(v2);
              }
            });
            
            // Calcular correlação
            let correlacao = 0;
            if (valores1.length > 1) {
              correlacao = calcularCorrelacaoPearson(valores1, valores2);
            }
            
            heatmapData.push({
              x: var1,
              y: var2,
              value: correlacao,
              absValue: Math.abs(correlacao),
              color: correlacao >= 0 ? '#3B82F6' : '#EF4444'
            });
          }
        }
      }
      
      console.log('🔥 Heatmap data:', heatmapData.length, 'pontos');
      setDadosHeatmap(heatmapData);

      // 10. Importância das variáveis
      const importanciaData = variaveisX.map(variavel => ({
        name: variavel,
        importancia: Math.abs(coeficientesExtraidos.coeficientesVars[variavel] || 0),
        coeficiente: coeficientesExtraidos.coeficientesVars[variavel] || 0,
        cor: coeficientesExtraidos.coeficientesVars[variavel] >= 0 ? '#3B82F6' : '#EF4444'
      })).sort((a, b) => b.importancia - a.importancia);
      
      console.log('🏆 Importância data:', importanciaData);
      setDadosImportancia(importanciaData);

      console.log('✅ Todos os dados para gráficos preparados!');

    } catch (error) {
      console.error('❌ Erro ao preparar dados para gráficos:', error);
    }
  };

  const processarResultados = () => {
    if (!resultado || !resultado.resultado) return;

    const { resultado: resultadoBackend } = resultado;
    const formula = resultado.parametros;
    
    // Extrair variáveis
    const variaveisXArray = formula.x_multiplas ? 
      formula.x_multiplas.split(',').map(v => v.trim()) : [];
    const variavelYValor = formula.y || '';
    
    setVariaveisX(variaveisXArray);
    setVariavelY(variavelYValor);

    // Extrair coeficientes
    let interceptoValor = 0;
    const coeficientesVars = {};
    
    variaveisXArray.forEach(variavel => {
      coeficientesVars[variavel] = 0;
    });

    const coefArray = resultadoBackend.coeficientes || [];
    if (Array.isArray(coefArray) && coefArray.length > 0) {
      coefArray.forEach(coef => {
        if (!coef || !coef.termo) return;
        const termo = coef.termo.trim();
        const estimativa = parseFloat(coef.estimativa) || 0;
        
        if (termo === '(Intercept)') {
          interceptoValor = estimativa;
        } else {
          const variavelEncontrada = variaveisXArray.find(v => 
            v === termo || v.trim() === termo || termo.includes(v)
          );
          if (variavelEncontrada) {
            coeficientesVars[variavelEncontrada] = estimativa;
          }
        }
      });
    }
    
    setCoeficientesExtraidos({ intercepto: interceptoValor, coeficientesVars });

    // Extrair métricas
    const qualidade = resultadoBackend.qualidade || {};
    const metrics = resultadoBackend.metrics || {};
    
    const rQuadrado = qualidade.R2 || metrics.r_squared || metrics.rSquared || 0;
    const estatisticasCalculadas = {
      rQuadrado: parseFloat(rQuadrado) || 0,
      rQuadradoAjustado: parseFloat(qualidade.R2ajustado || metrics.adjusted_r_squared || metrics.adjustedRSquared || 0),
      mse: parseFloat(qualidade.MSE || metrics.mse || 0),
      rmse: parseFloat(qualidade.RMSE || metrics.rmse || 0),
      mae: parseFloat(qualidade.MAE || metrics.mae || 0),
      aic: parseFloat(qualidade.AIC || metrics.aic || 0),
      bic: parseFloat(qualidade.BIC || metrics.bic || 0),
      fStatistic: parseFloat(qualidade.F_statistic || metrics.f_statistic || metrics.fStatistic || 0),
      pValue: parseFloat(qualidade.p_valor_global || metrics.p_value || metrics.pValue || 0),
      nObservacoes: parseInt(qualidade.n_observacoes || (dadosOriginais ? dadosOriginais.length : 0)) || 0,
      qualidade: rQuadrado >= 0.9 ? 'Excelente' : 
                rQuadrado >= 0.7 ? 'Boa' : 
                rQuadrado >= 0.5 ? 'Moderada' : 'Fraca',
      cor: rQuadrado >= 0.9 ? 'text-green-600' : 
           rQuadrado >= 0.7 ? 'text-blue-600' : 
           rQuadrado >= 0.5 ? 'text-yellow-600' : 'text-red-600'
    };
    
    setEstatisticas(estatisticasCalculadas);
    setDadosProcessados(true);
  };

  useEffect(() => {
    if (resultado && resultado.resultado) {
      processarResultados();
    }
  }, [resultado]);

  useEffect(() => {
    if (dadosProcessados && dadosOriginais && dadosOriginais.length > 0) {
      prepararDadosGraficos();
    }
  }, [dadosProcessados, dadosOriginais]);

  // Renderizar a aba de gráficos
  const renderAbaGraficos = () => {
    console.log('🔍 DEBUG - Dados disponíveis para gráficos:', {
      dadosResiduos: dadosResiduos.length,
      dadosQQ: dadosQQ.length,
      dadosForestPlot: dadosForestPlot.length,
      dadosHeatmap: dadosHeatmap.length,
      dadosCooks: dadosCooks.length,
      dadosDensidade: dadosDensidade.length,
      dadosCurvaPrevisao: dadosCurvaPrevisao.length,
      dadosImportancia: dadosImportancia.length,
      dadosScatter: dadosScatter.length
    });

    // Se não houver dados suficientes
    if (dadosResiduos.length === 0 && dadosScatter.length === 0) {
      return (
        <div className="text-center p-8 text-gray-500">
          <p>Dados insuficientes para gerar gráficos</p>
          <p className="text-sm mt-2">
            Resíduos: {dadosResiduos.length} | Scatter: {dadosScatter.length}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Primeira linha - Gráficos de diagnóstico */}
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h4 className="font-semibold text-gray-700 mb-3">📊 Resíduos vs Valores Ajustados</h4>
            {dadosResiduos.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <ScatterChart data={dadosResiduos}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fitted" name="Valor Ajustado" />
                    <YAxis dataKey="residual" name="Resíduo" />
                    <Tooltip formatter={(v) => formatarNumero(v, 4)} />
                    <Scatter data={dadosResiduos} fill="#3B82F6" fillOpacity={0.7} name="Resíduos" />
                    <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="3 3" />
                  </ScatterChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-500 mt-2">
                  Verifica homocedasticidade. Pontos devem ser aleatórios em torno de zero.
                </p>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Dados não disponíveis
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h4 className="font-semibold text-gray-700 mb-3">📈 Normal Q-Q Plot</h4>
            {dadosQQ.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <ScatterChart data={dadosQQ}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="teorico" name="Quantis Teóricos" />
                    <YAxis dataKey="observado" name="Quantis Observados" />
                    <Tooltip formatter={(v) => formatarNumero(v, 4)} />
                    <Scatter data={dadosQQ} fill="#10B981" fillOpacity={0.7} name="Q-Q" />
                    <ReferenceLine stroke="#6B7280" strokeDasharray="3 3" />
                  </ScatterChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-500 mt-2">
                  Verifica normalidade. Pontos devem estar próximos da linha diagonal.
                </p>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Dados não disponíveis
              </div>
            )}
          </div>

          {/* Segunda linha - Forest Plot e Heatmap */}
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h4 className="font-semibold text-gray-700 mb-3">🌲 Forest Plot</h4>
            {dadosForestPlot.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosForestPlot} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={['auto', 'auto']} />
                    <YAxis type="category" dataKey="name" width={80} />
                    <Tooltip 
                      formatter={(v, n) => [
                        formatarNumero(v, 4), 
                        n === 'estimate' ? 'Coeficiente' : n === 'lower' ? 'IC Inferior' : 'IC Superior'
                      ]}
                    />
                    <Bar dataKey="estimate" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Coeficiente">
                      {dadosForestPlot.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.significante ? '#3B82F6' : '#9CA3AF'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-500 mt-2">
                  Intervalos de confiança dos coeficientes. Barras azuis são significativas.
                </p>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Dados não disponíveis
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h4 className="font-semibold text-gray-700 mb-3">🔥 Heatmap de Correlação</h4>
            {dadosHeatmap.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs border">
                    <thead>
                      <tr>
                        <th className="px-2 py-1 bg-gray-100 border"></th>
                        {[...new Set(dadosHeatmap.map(d => d.x))].map((v, i) => (
                          <th key={i} className="px-2 py-1 bg-gray-100 border text-center whitespace-nowrap">
                            {v === variavelY ? `${v} (Y)` : v}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...new Set(dadosHeatmap.map(d => d.x))].map((varRow, rowIndex) => (
                        <tr key={rowIndex}>
                          <td className="px-2 py-1 bg-gray-50 border font-medium whitespace-nowrap">
                            {varRow === variavelY ? `${varRow} (Y)` : varRow}
                          </td>
                          {[...new Set(dadosHeatmap.map(d => d.x))].map((varCol, colIndex) => {
                            const dado = dadosHeatmap.find(d => d.x === varRow && d.y === varCol);
                            const valor = dado?.value || 0;
                            let bgColor = 'bg-white';
                            
                            if (rowIndex === colIndex) {
                              bgColor = 'bg-gray-100';
                            } else if (valor > 0.7) bgColor = 'bg-green-100';
                            else if (valor > 0.4) bgColor = 'bg-blue-100';
                            else if (valor > -0.4) bgColor = 'bg-gray-50';
                            else if (valor > -0.7) bgColor = 'bg-orange-100';
                            else bgColor = 'bg-red-100';
                            
                            return (
                              <td key={colIndex} className={`px-2 py-1 border text-center ${bgColor}`}>
                                {formatarNumero(valor, 2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Matriz de correlação. Cores indicam força e direção das correlações.
                </p>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Dados não disponíveis
              </div>
            )}
          </div>

          {/* Terceira linha - Cook's Distance e Densidade */}
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h4 className="font-semibold text-gray-700 mb-3">⚠️ Cook's Distance</h4>
            {dadosCooks.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dadosCooks}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="id" name="Observação" />
                    <YAxis />
                    <Tooltip formatter={(v) => formatarNumero(v, 4)} />
                    <Bar dataKey="cooksDistance" name="Distância de Cook" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    <ReferenceLine y={dadosCooks[0]?.limite || 0} stroke="#DC2626" strokeDasharray="3 3" label="Limite" />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-500 mt-2">
                  Identifica observações influentes. Pontos acima da linha podem ser outliers influentes.
                </p>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Dados não disponíveis
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h4 className="font-semibold text-gray-700 mb-3">📊 Densidade dos Resíduos</h4>
            {dadosDensidade.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={dadosDensidade}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" name="Resíduo" />
                    <YAxis />
                    <Tooltip formatter={(v) => formatarNumero(v, 6)} />
                    <Area 
                      type="monotone" 
                      dataKey="density" 
                      stroke="#8B5CF6" 
                      fill="#8B5CF6" 
                      fillOpacity={0.3}
                      name="Densidade"
                    />
                    <ReferenceLine x={0} stroke="#6B7280" strokeDasharray="3 3" />
                  </AreaChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-500 mt-2">
                  Distribuição dos resíduos (Kernel Density Estimation). Idealmente simétrica em torno de zero.
                </p>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Dados não disponíveis
              </div>
            )}
          </div>

          {/* Quarta linha - Curva de Previsão e Importância */}
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h4 className="font-semibold text-gray-700 mb-3">📈 Curva de Previsão com IC</h4>
            {dadosCurvaPrevisao.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={dadosCurvaPrevisao}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" name="X" />
                    <YAxis />
                    <Tooltip 
                      formatter={(v, n) => [
                        formatarNumero(v, 4), 
                        n === 'y_pred' ? 'Previsão' : n === 'lower' ? 'IC 95% Inf' : 'IC 95% Sup'
                      ]}
                    />
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
                      strokeWidth={2}
                      dot={false}
                      name="Previsão"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-500 mt-2">
                  Previsão com intervalo de confiança de 95%. A área azul mostra a incerteza.
                </p>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Dados não disponíveis
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h4 className="font-semibold text-gray-700 mb-3">🏆 Importância das Variáveis</h4>
            {dadosImportancia.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dadosImportancia}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(v, n) => [
                        formatarNumero(v, 4), 
                        n === 'importancia' ? 'Importância' : 'Coeficiente'
                      ]}
                    />
                    <Bar dataKey="importancia" name="Importância (|coef|)" radius={[4, 4, 0, 0]}>
                      {dadosImportancia.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-500 mt-2">
                  Magnitude absoluta dos coeficientes. Maior = maior impacto na variável resposta.
                </p>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Dados não disponíveis
              </div>
            )}
          </div>
        </div>
        
        {/* Gráfico de dispersão em largura total */}
        <div className="mt-6">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h4 className="font-semibold text-gray-700 mb-3">📈 Dispersão com Regressão</h4>
            {dadosScatter.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <ScatterChart margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" name={variaveisX[0] || 'X'} />
                    <YAxis dataKey="y" name={variavelY || 'Y'} />
                    <Tooltip formatter={(v) => formatarNumero(v, 2)} />
                    <Scatter data={dadosScatter} fill="#8884d8" fillOpacity={0.7} name="Dados" />
                    {linhaRegressao.length > 0 && (
                      <Line 
                        type="monotone" 
                        data={linhaRegressao} 
                        dataKey="y" 
                        stroke="#ff7300" 
                        strokeWidth={2}
                        dot={false}
                        name="Regressão"
                      />
                    )}
                  </ScatterChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-500 mt-2">
                  Relação entre {variaveisX[0] || 'X'} e {variavelY || 'Y'}. Linha mostra tendência.
                  R² = {(estatisticas.rQuadrado * 100).toFixed(1)}% da variância explicada.
                </p>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Dados não disponíveis
              </div>
            )}
          </div>
        </div>
      
      {/* Interpretações */}
      <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-4">📋 Guia de Interpretação dos Gráficos</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <h5 className="font-medium mb-2">📊 Resíduos vs Ajustados</h5>
            <ul className="space-y-1">
              <li>• <strong>Objetivo:</strong> Verificar homocedasticidade</li>
              <li>• <strong>Ideal:</strong> Pontos aleatórios em torno de zero</li>
              <li>• <strong>Problema:</strong> Padrão em funil ou curva</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">📈 Normal Q-Q Plot</h5>
            <ul className="space-y-1">
              <li>• <strong>Objetivo:</strong> Verificar normalidade dos resíduos</li>
              <li>• <strong>Ideal:</strong> Pontos na linha diagonal</li>
              <li>• <strong>Problema:</strong> Pontos desviados nas caudas</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">🌲 Forest Plot</h5>
            <ul className="space-y-1">
              <li>• <strong>Objetivo:</strong> Visualizar coeficientes e IC</li>
              <li>• <strong>Ideal:</strong> IC não inclui zero (significativo)</li>
              <li>• <strong>Interpretação:</strong> Barras azuis = significativas</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">🔥 Heatmap</h5>
            <ul className="space-y-1">
              <li>• <strong>Objetivo:</strong> Ver correlações entre variáveis</li>
              <li>• <strong>Verde/Azul:</strong> Correlação positiva</li>
              <li>• <strong>Vermelho/Laranja:</strong> Correlação negativa</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">⚠️ Cook's Distance</h5>
            <ul className="space-y-1">
              <li>• <strong>Objetivo:</strong> Identificar outliers influentes</li>
              <li>• <strong>Ação:</strong> Investigar pontos acima da linha</li>
              <li>• <strong>Limite:</strong> Geralmente 4/n</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">📊 Densidade</h5>
            <ul className="space-y-1">
              <li>• <strong>Objetivo:</strong> Ver distribuição dos resíduos</li>
              <li>• <strong>Ideal:</strong> Curva simétrica em zero</li>
              <li>• <strong>KDE:</strong> Estimação por kernel suavizada</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">📈 Curva de Previsão</h5>
            <ul className="space-y-1">
              <li>• <strong>Objetivo:</strong> Previsão com intervalo de confiança</li>
              <li>• <strong>Linha:</strong> Valor médio previsto</li>
              <li>• <strong>Área azul:</strong> IC 95% da previsão</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">🏆 Importância</h5>
            <ul className="space-y-1">
              <li>• <strong>Objetivo:</strong> Comparar impacto das variáveis</li>
              <li>• <strong>Métrica:</strong> Valor absoluto do coeficiente</li>
              <li>• <strong>Interpretação:</strong> Maior = maior impacto</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">📈 Dispersão</h5>
            <ul className="space-y-1">
              <li>• <strong>Objetivo:</strong> Ver relação X-Y</li>
              <li>• <strong>Linha:</strong> Tendência linear</li>
              <li>• <strong>R²:</strong> {(estatisticas.rQuadrado * 100).toFixed(1)}% variância explicada</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

  
  const renderConteudoAba = () => {
    switch (abaAtiva) {
      case 'graficos':
        return renderAbaGraficos();
        
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
                    <div className="text-xl font-bold text-gray-800 mb-2">
                      Ŷ = {formatarNumero(coeficientesExtraidos.intercepto, 4)} + {variaveisX.map((v, i) => 
                        <span key={v}>
                          {formatarNumero(coeficientesExtraidos.coeficientesVars[v], 4)} × {v}
                          {i < variaveisX.length - 1 && ' + '}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      Onde Ŷ é o valor predito de {variavelY || 'Y'}
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Intercepto (β₀):</span>
                      <Badge variant={coeficientesExtraidos.intercepto !== 0 ? "default" : "secondary"}>
                        {formatarNumero(coeficientesExtraidos.intercepto, 4)}
                      </Badge>
                    </div>
                    {variaveisX.map(variavel => (
                      <div key={variavel} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium">Coef. {variavel} (β):</span>
                        <Badge variant={coeficientesExtraidos.coeficientesVars[variavel] !== 0 ? "default" : "secondary"}>
                          {formatarNumero(coeficientesExtraidos.coeficientesVars[variavel], 4)}
                        </Badge>
                      </div>
                    ))}
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
                      <span className="font-semibold">{formatarNumero(estatisticas.mse, 4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Raiz do MSE (RMSE):</span>
                      <span className="font-semibold">{formatarNumero(estatisticas.rmse, 4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Número de Variáveis:</span>
                      <span className="font-semibold">{variaveisX.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Observações:</span>
                      <span className="font-semibold">{estatisticas.nObservacoes}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'coeficientes':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Coeficientes do Modelo</CardTitle>
              <CardDescription>Significância estatística dos parâmetros</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parâmetro</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimativa</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Erro Padrão</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estatística t</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">p-valor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Significância</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      const coefIntercept = encontrarCoeficiente('(Intercept)');
                      return (
                        <tr>
                          <td className="px-4 py-3 whitespace-nowrap font-medium">Intercepto</td>
                          <td className="px-4 py-3 whitespace-nowrap">{coefIntercept ? formatarNumero(coefIntercept.estimativa, 4) : formatarNumero(coeficientesExtraidos.intercepto, 4)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{coefIntercept?.erro ? formatarNumero(coefIntercept.erro, 4) : 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{coefIntercept?.estatistica ? formatarNumero(coefIntercept.estatistica, 4) : 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{coefIntercept?.valor_p ? formatarNumero(coefIntercept.valor_p, 4) : 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {coefIntercept?.valor_p ? (
                              parseFloat(coefIntercept.valor_p) < 0.001 ? <Badge variant="success">***</Badge> :
                              parseFloat(coefIntercept.valor_p) < 0.01 ? <Badge variant="success">**</Badge> :
                              parseFloat(coefIntercept.valor_p) < 0.05 ? <Badge variant="success">*</Badge> :
                              parseFloat(coefIntercept.valor_p) < 0.1 ? <Badge variant="warning">.</Badge> :
                              <Badge variant="secondary">n.s.</Badge>
                            ) : 'N/A'}
                          </td>
                        </tr>
                      );
                    })()}
                    
                    {variaveisX.map(variavel => {
                      const coef = encontrarCoeficiente(variavel);
                      return (
                        <tr key={variavel}>
                          <td className="px-4 py-3 whitespace-nowrap font-medium">{variavel}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{coef ? formatarNumero(coef.estimativa, 4) : formatarNumero(coeficientesExtraidos.coeficientesVars[variavel], 4)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{coef?.erro ? formatarNumero(coef.erro, 4) : 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{coef?.estatistica ? formatarNumero(coef.estatistica, 4) : 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{coef?.valor_p ? formatarNumero(coef.valor_p, 4) : 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {coef?.valor_p ? (
                              parseFloat(coef.valor_p) < 0.001 ? <Badge variant="success">***</Badge> :
                              parseFloat(coef.valor_p) < 0.01 ? <Badge variant="success">**</Badge> :
                              parseFloat(coef.valor_p) < 0.05 ? <Badge variant="success">*</Badge> :
                              parseFloat(coef.valor_p) < 0.1 ? <Badge variant="warning">.</Badge> :
                              <Badge variant="secondary">n.s.</Badge>
                            ) : <Badge variant="secondary">N/A</Badge>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">📝 Interpretação</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• <strong>Intercepto ({formatarNumero(coeficientesExtraidos.intercepto, 4)})</strong>: Valor esperado de {variavelY || 'Y'} quando todas as variáveis X = 0</li>
                  {variaveisX.map(variavel => (
                    <li key={variavel}>
                      • <strong>Coeficiente {variavel} ({formatarNumero(coeficientesExtraidos.coeficientesVars[variavel], 4)})</strong>: Mantendo outras variáveis constantes, cada unidade de aumento em {variavel} altera {variavelY || 'Y'} em {formatarNumero(coeficientesExtraidos.coeficientesVars[variavel], 4)} unidades
                    </li>
                  ))}
                  <li>• <strong>Significância</strong>: *** p &lt; 0.001, ** p &lt; 0.01, * p &lt; 0.05, . p &lt; 0.1</li>
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
                      <div className="text-2xl font-bold text-blue-600">{(estatisticas.rQuadrado * 100).toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">R²</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{(estatisticas.rQuadradoAjustado * 100).toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">R² Ajustado</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded border">
                      <span>Erro Quadrático Médio (MSE)</span>
                      <span className="font-bold">{formatarNumero(estatisticas.mse, 4)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded border">
                      <span>Raiz do Erro Quadrático Médio (RMSE)</span>
                      <span className="font-bold">{formatarNumero(estatisticas.rmse, 4)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded border">
                      <span>Erro Absoluto Médio (MAE)</span>
                      <span className="font-bold">{formatarNumero(estatisticas.mae, 4)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>📈 Estatísticas do Modelo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">{formatarNumero(estatisticas.aic, 2)}</div>
                      <div className="text-sm text-gray-600">AIC</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-indigo-600">{formatarNumero(estatisticas.bic, 2)}</div>
                      <div className="text-sm text-gray-600">BIC</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded border">
                      <span>Estatística F</span>
                      <span className="font-bold">{formatarNumero(estatisticas.fStatistic, 4)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded border">
                      <span>p-valor (F)</span>
                      <Badge variant={estatisticas.pValue < 0.05 ? "success" : "secondary"}>
                        {formatarNumero(estatisticas.pValue, 4)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded border">
                      <span>Observações (n)</span>
                      <span className="font-bold">{estatisticas.nObservacoes}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'simulacao':
        return (
          <Card>
            <CardHeader>
              <CardTitle>🔮 Simulação com o Modelo</CardTitle>
              <CardDescription>Previsão com múltiplas variáveis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
                  <h4 className="font-semibold text-gray-700 mb-3">Equação Estimada:</h4>
                  <div className="text-lg font-mono text-center font-bold text-gray-800">
                    Ŷ = {formatarNumero(coeficientesExtraidos.intercepto, 4)} + {variaveisX.map((v, i) => 
                      <span key={v}>
                        {formatarNumero(coeficientesExtraidos.coeficientesVars[v], 4)} × {v}
                        {i < variaveisX.length - 1 && ' + '}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <h4 className="font-semibold text-gray-700 mb-4">Previsão de Valores</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {variaveisX.map(variavel => (
                      <div key={variavel} className="space-y-2">
                        <Label htmlFor={`simulacao-${variavel}`}>
                          {variavel} (coef: {formatarNumero(coeficientesExtraidos.coeficientesVars[variavel], 4)})
                        </Label>
                        <Input
                          id={`simulacao-${variavel}`}
                          type="number"
                          step="any"
                          value={valoresSimulacao[variavel] || ''}
                          onChange={(e) => setValoresSimulacao({
                            ...valoresSimulacao,
                            [variavel]: e.target.value
                          })}
                          placeholder={`Valor para ${variavel}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center">
                    <Button 
                      onClick={() => {
                        const valoresFaltantes = variaveisX.filter(v => !valoresSimulacao[v] || isNaN(parseFloat(valoresSimulacao[v])));
                        if (valoresFaltantes.length > 0) {
                          toast.error(`Preencha valores válidos para: ${valoresFaltantes.join(', ')}`);
                          return;
                        }
                        
                        let y = parseFloat(coeficientesExtraidos.intercepto) || 0;
                        const partesFormula = [formatarNumero(coeficientesExtraidos.intercepto, 4)];
                        
                        variaveisX.forEach(variavel => {
                          const valor = parseFloat(valoresSimulacao[variavel]);
                          const coeficiente = coeficientesExtraidos.coeficientesVars[variavel];
                          y += coeficiente * valor;
                          partesFormula.push(`${formatarNumero(coeficiente, 4)} × ${formatarNumero(valor, 2)}`);
                        });
                        
                        setResultadoSimulacao({
                          valores: { ...valoresSimulacao },
                          y,
                          formula: `Ŷ = ${partesFormula.join(' + ')}`,
                          resultado: formatarNumero(y, 4)
                        });
                      }}
                      size="lg"
                      className="px-8"
                    >
                      Calcular Previsão
                    </Button>
                  </div>

                  {resultadoSimulacao && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
                    >
                      <h5 className="font-semibold text-green-800 mb-3">📊 Resultado da Simulação</h5>
                      
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">Valores de entrada:</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {Object.entries(resultadoSimulacao.valores).map(([variavel, valor]) => (
                            <div key={variavel} className="bg-white p-2 rounded border text-center">
                              <div className="text-xs text-gray-500">{variavel}</div>
                              <div className="font-bold">{valor}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center p-4 bg-white rounded-lg border">
                        <div className="text-center">
                          <div className="text-sm text-gray-600">{variavelY || 'Y'} previsto (Ŷ)</div>
                          <div className="text-3xl font-bold text-green-600">{resultadoSimulacao.resultado}</div>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-sm text-gray-700 font-mono bg-white p-3 rounded border">
                        {resultadoSimulacao.formula} = {resultadoSimulacao.resultado}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (!resultado || !resultado.resultado) {
    return <div className="text-center p-8 text-gray-500"><p>Nenhum resultado disponível</p></div>;
  }

  if (!dadosProcessados) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Processando resultados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>📊 Resultados da Regressão {variaveisX.length === 1 ? 'Linear Simples' : 'Linear Múltipla'}</CardTitle>
              <CardDescription>
                Modelo: {variavelY} ~ {variaveisX.join(' + ')} • 
                Variáveis: {variaveisX.length} • 
                Observações: {estatisticas.nObservacoes}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={onNovoModelo} variant="outline" size="sm">🔄 Novo Modelo</Button>
              <Button onClick={onVoltar} variant="outline" size="sm">⬅️ Voltar</Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="border-b border-gray-200">
        <div className="flex flex-wrap gap-2">
          {['resumo', 'coeficientes', 'metricas', 'simulacao', 'graficos'].map((aba) => (
            <button
              key={aba}
              onClick={() => setAbaAtiva(aba)}
              className={`px-4 py-2 font-medium flex items-center gap-2 ${
                abaAtiva === aba 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {aba === 'resumo' && '📋 Resumo'}
              {aba === 'coeficientes' && '📈 Coeficientes'}
              {aba === 'metricas' && '📐 Métricas'}
              {aba === 'simulacao' && '🔮 Simulação'}
              {aba === 'graficos' && '📊 Gráficos'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {renderConteudoAba()}
      </div>
    </div>
  );
}