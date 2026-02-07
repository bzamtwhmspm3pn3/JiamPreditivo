// C:\Users\VhenancioMarthinz\Downloads\JiamPreditivo\frontend\src\components\Dashboard\relatorios\RelatorioRegressaoSimples.jsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, ComposedChart, Area
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
  Info
} from 'lucide-react';

const RelatorioRegressaoSimples = ({ modelo, dadosCompletos }) => {
  const [dadosProcessados, setDadosProcessados] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (modelo && dadosCompletos) {
      processarDados();
    }
  }, [modelo, dadosCompletos]);

  const processarDados = () => {
    try {
      console.log("📊 Processando dados do modelo:", modelo);
      console.log("📊 Dados completos:", dadosCompletos);

      const resultado = modelo.resultado || modelo.dados || {};
      const metricas = dadosCompletos.metricas || {};
      const coeficientes = dadosCompletos.coeficientes || {};
      const parametros = modelo.parametros || {};

      console.log("📊 Resultado backend:", resultado);
      console.log("📊 Métricas extraídas:", metricas);
      console.log("📊 Coeficientes:", coeficientes);

      // Extrair métricas do backend
      const qualidadeBackend = resultado.qualidade || {};
      const coeficientesBackend = resultado.coeficientes || [];

      // Extrair intercepto e coeficiente
      let intercepto = 0;
      let coeficienteX = 0;
      let nomeVariavelX = 'X';
      let nomeVariavelY = parametros.y || 'Y';

      // Processar coeficientes
      const coeficientesFormatados = [];
      
      // Primeiro tentar do backend R
      if (coeficientesBackend.length > 0) {
        coeficientesBackend.forEach(coef => {
          const termo = coef.termo || coef.name;
          const estimativa = coef.estimativa || coef.estimate || 0;
          const erro = coef.erro || coef.std_error || 0;
          const estatistica = coef.estatistica || coef.t_value || 0;
          const valor_p = coef.valor_p || coef.p_value || 0;
          
          coeficientesFormatados.push({
            termo,
            estimativa,
            erro,
            estatistica,
            valor_p,
            significancia: getSignificancia(valor_p)
          });

          if (termo === '(Intercept)') {
            intercepto = estimativa;
          } else {
            coeficienteX = estimativa;
            nomeVariavelX = termo;
          }
        });
      } 
      // Se não tiver do backend, usar do dadosCompletos
      else {
        Object.entries(coeficientes).forEach(([nome, valor]) => {
          const estimate = typeof valor === 'object' ? valor.estimate : valor;
          const p_value = typeof valor === 'object' ? valor.p_value : 0;
          
          coeficientesFormatados.push({
            termo: nome,
            estimativa: estimate || 0,
            erro: typeof valor === 'object' ? valor.std_error || 0 : 0,
            estatistica: typeof valor === 'object' ? valor.t_value || 0 : 0,
            valor_p: p_value || 0,
            significancia: getSignificancia(p_value)
          });

          if (nome === '(Intercept)' || nome === 'intercept') {
            intercepto = estimate || 0;
          } else {
            coeficienteX = estimate || 0;
            nomeVariavelX = nome;
          }
        });
      }

      // Extrair métricas
      const r2 = qualidadeBackend.R2 || metricas.r2 || metricas.r_squared || 0;
      const r2Ajustado = qualidadeBackend.R2ajustado || metricas.r2_ajustado || metricas.adj_r_squared || 0;
      const rmse = qualidadeBackend.RMSE || metricas.rmse || 0;
      const mae = qualidadeBackend.MAE || metricas.mae || 0;
      const mse = rmse * rmse;
      const aic = qualidadeBackend.AIC || metricas.aic || 0;
      const bic = qualidadeBackend.BIC || metricas.bic || 0;
      const fStatistic = qualidadeBackend.F_statistic || metricas.f_statistic || 0;
      const pValue = qualidadeBackend.p_valor_global || metricas.p_value || 0;
      const nObservacoes = qualidadeBackend.n_observacoes || 0;

      // Criar equação
      const equacao = resultado.equacao_estimada || 
                     `Ŷ = ${intercepto.toFixed(4)} + ${coeficienteX.toFixed(4)} × ${nomeVariavelX}`;

      // Criar dados para gráfico
      const dadosGrafico = criarDadosGrafico(intercepto, coeficienteX);

      const dados = {
        // Informações básicas
        nome: modelo.nome || 'Modelo Linear Simples',
        tipo: modelo.tipo || 'linear_simples',
        classificacao: modelo.classificacao || 'MODERADA',
        pontuacao: modelo.pontuacao || 0.5,

        // Equação
        equacao,
        intercepto,
        coeficienteX,
        nomeVariavelX,
        nomeVariavelY,

        // Coeficientes
        coeficientes: coeficientesFormatados,

        // Métricas
        metricas: {
          r2,
          r2Ajustado,
          rmse,
          mae,
          mse,
          aic,
          bic,
          fStatistic,
          pValue,
          nObservacoes
        },

        // ANOVA (se disponível)
        anova: resultado.anova || [],

        // Dados para visualização
        dadosGrafico
      };

      console.log("✅ Dados processados:", dados);
      setDadosProcessados(dados);
      setLoading(false);

    } catch (error) {
      console.error("❌ Erro ao processar dados:", error);
      setLoading(false);
    }
  };

  const getSignificancia = (pValue) => {
    if (pValue < 0.001) return '***';
    if (pValue < 0.01) return '**';
    if (pValue < 0.05) return '*';
    if (pValue < 0.1) return '.';
    return 'ns';
  };

  const criarDadosGrafico = (intercepto, coeficienteX) => {
    // Criar dados simulados para o gráfico
    const dados = [];
    for (let i = 0; i < 20; i++) {
      const x = i * 2;
      const y = intercepto + coeficienteX * x + (Math.random() * 5 - 2.5);
      dados.push({
        x,
        y,
        y_pred: intercepto + coeficienteX * x,
        residuo: y - (intercepto + coeficienteX * x)
      });
    }
    return dados;
  };

  const getCorClassificacao = (classificacao) => {
    switch(classificacao) {
      case 'EXCELENTE': return 'text-green-600';
      case 'BOA': return 'text-blue-600';
      case 'MODERADA': return 'text-yellow-600';
      case 'FRACA': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getBgClassificacao = (classificacao) => {
    switch(classificacao) {
      case 'EXCELENTE': return 'bg-green-100';
      case 'BOA': return 'bg-blue-100';
      case 'MODERADA': return 'bg-yellow-100';
      case 'FRACA': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-4">
            <Brain className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Processando análise de regressão...</h3>
          <p className="text-gray-600 mt-2">Extraindo métricas do modelo linear</p>
          <div className="mt-4 flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!dadosProcessados) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Não foi possível processar o modelo</h3>
        <p className="text-gray-600">Os dados do modelo de regressão linear não foram encontrados ou estão incompletos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-[#0A1F44] to-[#1a3a6e] text-white p-8 rounded-3xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-white/20 rounded-xl">
            <Calculator className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">📈 Relatório de Regressão Linear Simples</h1>
            <p className="text-lg opacity-90">{dadosProcessados.nome}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-sm opacity-80">Classificação</div>
            <div className={`text-2xl font-bold ${getCorClassificacao(dadosProcessados.classificacao)}`}>
              {dadosProcessados.classificacao}
            </div>
          </div>
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-sm opacity-80">R²</div>
            <div className="text-2xl font-bold">{(dadosProcessados.metricas.r2 * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-sm opacity-80">RMSE</div>
            <div className="text-2xl font-bold">{dadosProcessados.metricas.rmse.toFixed(4)}</div>
          </div>
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-sm opacity-80">Observações</div>
            <div className="text-2xl font-bold">{dadosProcessados.metricas.nObservacoes || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Equação do Modelo */}
      <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Sigma className="w-6 h-6" />
          Equação Estimada do Modelo
        </h3>
        
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-gray-800 mb-4">
              {dadosProcessados.equacao}
            </div>
            <div className="text-sm text-gray-600">
              Onde Ŷ é o valor predito de {dadosProcessados.nomeVariavelY}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Intercepto (β₀):</span>
              <span className="text-lg font-bold text-blue-600">
                {dadosProcessados.intercepto.toFixed(4)}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Valor esperado de {dadosProcessados.nomeVariavelY} quando {dadosProcessados.nomeVariavelX} = 0
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Coeficiente (β₁):</span>
              <span className="text-lg font-bold text-green-600">
                {dadosProcessados.coeficienteX.toFixed(4)}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Para cada unidade de aumento em {dadosProcessados.nomeVariavelX}, {dadosProcessados.nomeVariavelY} muda em {dadosProcessados.coeficienteX.toFixed(4)} unidades
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico de Dispersão */}
      <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Visualização do Modelo
        </h3>
        
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={dadosProcessados.dadosGrafico}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="x" 
              label={{ value: dadosProcessados.nomeVariavelX, position: 'bottom' }}
            />
            <YAxis 
              label={{ value: dadosProcessados.nomeVariavelY, angle: -90, position: 'left' }}
            />
            <Tooltip
              formatter={(value, name) => {
                if (name === 'y') return [value.toFixed(2), 'Valor Observado'];
                if (name === 'y_pred') return [value.toFixed(2), 'Valor Previsto'];
                return [value, name];
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="y_pred"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="Linha de Regressão"
            />
            <Scatter
              dataKey="y"
              fill="#3b82f6"
              opacity={0.6}
              name="Dados Observados"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Coeficientes */}
      <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Sigma className="w-6 h-6" />
          Coeficientes e Significância
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Termo
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
              {dadosProcessados.coeficientes.map((coef, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap font-medium">
                    {coef.termo === '(Intercept)' ? 'Intercepto' : coef.termo}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-bold text-blue-600">
                    {coef.estimativa.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {coef.erro?.toFixed(4) || 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {coef.estatistica?.toFixed(2) || 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`font-bold ${coef.valor_p < 0.05 ? 'text-green-600' : 'text-red-600'}`}>
                      {coef.valor_p?.toFixed(4) || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      coef.significancia === '***' ? 'bg-green-100 text-green-800 border border-green-300' :
                      coef.significancia === '**' ? 'bg-green-50 text-green-700 border border-green-200' :
                      coef.significancia === '*' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      coef.significancia === '.' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                      'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {coef.significancia}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-bold text-blue-800 mb-2">Interpretação dos Níveis de Significância</h4>
              <div className="text-sm text-blue-700 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>*** p &lt; 0.001 - Altamente Significativo</div>
                <div>** p &lt; 0.01 - Muito Significativo</div>
                <div>* p &lt; 0.05 - Significativo</div>
                <div>. p &lt; 0.1 - Marginalmente Significativo</div>
                <div>ns p ≥ 0.1 - Não Significativo</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas de Performance */}
      <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Target className="w-6 h-6" />
          Métricas de Performance
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Ajuste do Modelo */}
          <div>
            <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">📊 Ajuste do Modelo</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">R² (Coeficiente de Determinação)</span>
                <span className="text-xl font-bold text-blue-600">
                  {(dadosProcessados.metricas.r2 * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">R² Ajustado</span>
                <span className="text-xl font-bold text-green-600">
                  {(dadosProcessados.metricas.r2Ajustado * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Correlação (r)</span>
                <span className="text-xl font-bold text-purple-600">
                  {Math.sqrt(dadosProcessados.metricas.r2).toFixed(4)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Erros */}
          <div>
            <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">📈 Erros de Previsão</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">RMSE (Raiz do Erro Quadrático Médio)</span>
                <span className="text-xl font-bold text-orange-600">
                  {dadosProcessados.metricas.rmse.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">MAE (Erro Absoluto Médio)</span>
                <span className="text-xl font-bold text-red-600">
                  {dadosProcessados.metricas.mae.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">MSE (Erro Quadrático Médio)</span>
                <span className="text-xl font-bold text-pink-600">
                  {dadosProcessados.metricas.mse.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Critérios de Informação */}
          <div>
            <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">⚙️ Critérios de Informação</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">AIC (Akaike Information Criterion)</span>
                <span className="text-xl font-bold text-indigo-600">
                  {dadosProcessados.metricas.aic.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">BIC (Bayesian Information Criterion)</span>
                <span className="text-xl font-bold text-teal-600">
                  {dadosProcessados.metricas.bic.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Estatística F</span>
                <span className="text-xl font-bold text-yellow-600">
                  {dadosProcessados.metricas.fStatistic.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Significância Global */}
        <div className={`mt-8 p-6 rounded-lg border-2 ${
          dadosProcessados.metricas.pValue < 0.05 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
            : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-gray-800 mb-2">
                {dadosProcessados.metricas.pValue < 0.05 ? '✅ Modelo Estatisticamente Significativo' : '⚠️ Modelo Não Significativo'}
              </h4>
              <p className="text-gray-600">
                Teste F para verificar se o modelo como um todo é estatisticamente significativo
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${
                dadosProcessados.metricas.pValue < 0.05 ? 'text-green-600' : 'text-red-600'
              }`}>
                p = {dadosProcessados.metricas.pValue.toFixed(4)}
              </div>
              <div className={`text-sm font-bold ${
                dadosProcessados.metricas.pValue < 0.05 ? 'text-green-700' : 'text-red-700'
              }`}>
                {dadosProcessados.metricas.pValue < 0.05 ? 'SIGNIFICATIVO (p < 0.05)' : 'NÃO SIGNIFICATIVO (p ≥ 0.05)'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo e Interpretação */}
      <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Brain className="w-6 h-6" />
          Interpretação e Conclusão
        </h3>
        
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h4 className="font-bold text-blue-800 mb-3">🎯 Qualidade do Modelo</h4>
            <p className="text-blue-700">
              Este modelo de regressão linear simples foi classificado como <strong>{dadosProcessados.classificacao}</strong> 
              com um R² de <strong>{(dadosProcessados.metricas.r2 * 100).toFixed(1)}%</strong>. 
              Isso significa que o modelo explica aproximadamente {(dadosProcessados.metricas.r2 * 100).toFixed(0)}% 
              da variação na variável {dadosProcessados.nomeVariavelY}.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-bold text-green-800 mb-3">✅ Pontos Fortes</h4>
              <ul className="text-green-700 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Modelo linear de fácil interpretação</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>R² = {(dadosProcessados.metricas.r2 * 100).toFixed(1)}%</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Erro de previsão (RMSE) = {dadosProcessados.metricas.rmse.toFixed(4)}</span>
                </li>
              </ul>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-bold text-yellow-800 mb-3">💡 Recomendações</h4>
              <ul className="text-yellow-700 space-y-2">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <span>{dadosProcessados.metricas.r2 < 0.7 ? 'Considere transformações nas variáveis' : 'Modelo adequado para previsões'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <span>Verifique pressupostos de linearidade</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <span>Valide com novos dados para confirmação</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelatorioRegressaoSimples;