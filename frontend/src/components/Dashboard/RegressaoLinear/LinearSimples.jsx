import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../../services/api';

// Componentes UI
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import Button from '../componentes/Button';
import Select from '../componentes/Select';
import Label from '../componentes/Label';
import Badge from '../componentes/Badge';

// Componentes de Resultados
import ResultadoLinearAprimorado from '../resultados/ResultadoLinearAprimorado';
import ModelosService from '../../../services/modelosService';


export default function LinearSimples({ dados, onSaveModel, modelosAjustados, onVoltar, statusSistema, onResultadoModelo }) {
  const [variaveis, setVariaveis] = useState([]);
  const [variavelY, setVariavelY] = useState('');
  const [variavelX, setVariavelX] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [visualizacaoAtiva, setVisualizacaoAtiva] = useState('configuracao');
  const [infoDados, setInfoDados] = useState({ 
    linhas: 0, 
    colunas: 0
  });


// 🔥 FUNÇÃO PARA SALVAR RESULTADO NO DASHBOARD E NO MONGODB
const salvarResultadoNoDashboard = async (resultado, config, dadosOriginais) => {
  if (!onResultadoModelo) return;
  
  try {
    // Calcular número de observações
    const n_observacoes = dadosOriginais?.length || config.dados?.length || 0;
    
    const dadosParaDashboard = {
      nome: `Regressão Linear Simples: ${config.y} ~ ${config.x}`,
      tipo: "linear_simples",
      dados: resultado,
      parametros: {
        ...config,
        n_observacoes: n_observacoes  // 🔥 ADICIONAR AQUI
      },
      classificacao: calcularClassificacao(resultado),
      timestamp: new Date().toISOString(),
      metrics: {
        ...extrairMetrics(resultado),
        n_observacoes: n_observacoes  // 🔥 TAMBÉM NAS MÉTRICAS
      },
      categoria: "previsoes"
    };

    // 1. Enviar para o Dashboard
    onResultadoModelo(dadosParaDashboard);
    console.log('📤 Resultado salvo no Dashboard:', dadosParaDashboard.nome);
    console.log('📊 Observações:', n_observacoes);
    
    // 2. Salvar no MongoDB
    console.log('💾 Salvando modelo no MongoDB...');
    const salvo = await ModelosService.salvar({
      nome: dadosParaDashboard.nome,
      tipo: "linear_simples",
      resultado: resultado,
      parametros: {
        ...config,
        n_observacoes: n_observacoes
      },
      classificacao: dadosParaDashboard.classificacao,
      timestamp: dadosParaDashboard.timestamp,
      metrics: {
        ...extrairMetrics(resultado),
        n_observacoes: n_observacoes
      }
    });
    
    if (salvo.success) {
      console.log('✅ Modelo salvo no MongoDB com ID:', salvo.id);
    } else {
      console.error('❌ Erro ao salvar no MongoDB:', salvo.error);
    }
    
  } catch (error) {
    console.error('Erro ao salvar:', error);
  }
};

  // 🔥 FUNÇÃO PARA CALCULAR CLASSIFICAÇÃO
  const calcularClassificacao = (resultado) => {
    if (!resultado || !resultado.metrics) return "MODERADA";
    
    const r2 = resultado.metrics.r_squared || 0;
    const rmse = resultado.metrics.rmse || 0;
    const aic = resultado.metrics.aic || Infinity;
    
    // Classificação baseada em R²
    if (r2 > 0.8) return "ALTA";
    if (r2 > 0.6) return "MODERADA";
    if (r2 > 0.4) return "BAIXA";
    return "MUITO BAIXA";
  };

  // 🔥 FUNÇÃO PARA EXTRAIR MÉTRICAS
  const extrairMetrics = (resultado) => {
    if (!resultado) return {};
    
    return {
      r_squared: resultado.metrics?.r_squared,
      adjusted_r_squared: resultado.metrics?.adjusted_r_squared,
      rmse: resultado.metrics?.rmse,
      mae: resultado.metrics?.mae,
      mse: resultado.metrics?.mse,
      aic: resultado.metrics?.aic,
      bic: resultado.metrics?.bic,
      f_statistic: resultado.metrics?.f_statistic,
      p_value: resultado.metrics?.p_value
    };
  };

   // Função para extrair os dados do objeto
  const extrairDadosArray = (dadosObj) => {
    if (!dadosObj) return [];
    
    if (Array.isArray(dadosObj)) return dadosObj;
    
    if (typeof dadosObj === 'object') {
      if (dadosObj.dados_completos && Array.isArray(dadosObj.dados_completos)) {
        return dadosObj.dados_completos;
      }
      if (dadosObj.amostra && Array.isArray(dadosObj.amostra)) {
        return dadosObj.amostra;
      }
      if (dadosObj.data && Array.isArray(dadosObj.data)) {
        return dadosObj.data;
      }
      if (Object.keys(dadosObj).length > 0 && typeof dadosObj[0] !== 'undefined') {
        return Object.values(dadosObj);
      }
    }
    
    return [];
  };

  // Extrair variáveis dos dados
  useEffect(() => {
    const dadosArray = extrairDadosArray(dados);
    
    if (dadosArray && Array.isArray(dadosArray) && dadosArray.length > 0) {
      const primeiraLinha = dadosArray[0];
      const vars = Object.keys(primeiraLinha);
      
      setVariaveis(vars);
      setInfoDados({
        linhas: dadosArray.length,
        colunas: vars.length
      });
      
      // Selecionar automaticamente variáveis numéricas se possível
      const variaveisNumericas = vars.filter(v => {
        const valor = primeiraLinha[v];
        return typeof valor === 'number' || !isNaN(parseFloat(valor));
      });
      
      if (variaveisNumericas.length >= 2) {
        setVariavelY(variaveisNumericas[0]);
        setVariavelX(variaveisNumericas[1]);
      } else if (vars.length >= 2) {
        setVariavelY(vars[0]);
        setVariavelX(vars[1]);
      } else if (vars.length === 1) {
        setVariavelY(vars[0]);
      }
    } else {
      setVariaveis([]);
      setInfoDados({ linhas: 0, colunas: 0 });
      
      if (!dados) {
        toast.warning('Nenhum dado carregado. Volte para a aba "Dados" para carregar um arquivo.');
      }
    }
  }, [dados]);

  const executarModelo = async () => {
    if (!variavelY || !variavelX) {
      toast.error('Selecione as variáveis Y e X');
      return;
    }

    if (!statusSistema.connected) {
      toast.error('Backend R não conectado');
      return;
    }

    const dadosArray = extrairDadosArray(dados);
    
    if (!dadosArray || dadosArray.length === 0) {
      toast.error('Nenhum dado disponível para análise');
      return;
    }

    setCarregando(true);
    setResultado(null);

    try {
      const parametros = {
        y: variavelY,
        x: variavelX,
        tipo_regressao: 'simples',
        familia: 'gaussian',
        include_intercept: 'true',
        calcular_metricas: 'true'
      };

      // Verificar se os dados têm as variáveis selecionadas
      const amostra = dadosArray[0];
      if (!amostra || !(variavelY in amostra) || !(variavelX in amostra)) {
        toast.error('Erro: Variáveis não encontradas nos dados.');
        setCarregando(false);
        return;
      }

      // Preparar dados para envio
      const dadosParaEnvio = dadosArray.map(linha => ({
        [variavelY]: parseFloat(linha[variavelY]) || 0,
        [variavelX]: parseFloat(linha[variavelX]) || 0
      }));

      console.log('📤 Enviando dados para o backend:', {
        parametros,
        dadosParaEnvio: dadosParaEnvio.slice(0, 3),
        total: dadosParaEnvio.length
      });

      const resultadoBackend = await api.executarModeloR('glm', dadosParaEnvio, parametros);

      console.log('📥 Resposta do backend:', resultadoBackend);

      if (resultadoBackend.success) {
        // Verificar se temos resultados completos
        if (!resultadoBackend.coefficients || !resultadoBackend.metrics) {
          console.warn('⚠️ Resultado incompleto recebido do backend:', resultadoBackend);
          
          // Se não temos coeficientes ou métricas, tentar calcular manualmente
          const resultadoCalculado = calcularRegressaoManual(dadosParaEnvio, variavelY, variavelX);
          
          const novoModelo = {
            tipo: 'linear_simples',
            nome: `Regressão Linear Simples: ${variavelY} ~ ${variavelX}`,
            parametros: parametros,
            resultado: {
              success: true,
              coefficients: resultadoCalculado.coefficients,
              metrics: resultadoCalculado.metrics,
              simulacao: false,
              temCoeficientes: true,
              coeficientesCount: 2
            },
            timestamp: new Date().toISOString(),
            id: `linear_simples_${Date.now()}`,
            fonte: 'frontend (fallback)',
            dadosUsados: {
              n: dadosArray.length,
              variaveis: [variavelY, variavelX]
            }
          };
          
          setResultado(novoModelo);
          
          // 🔥 CHAMAR onSaveModel PARA COMPATIBILIDADE
          if (onSaveModel) {
            onSaveModel(novoModelo.nome, novoModelo);
          }
          
          // 🔥 SALVAR NO DASHBOARD (FALLBACK)
          salvarResultadoNoDashboard({
            coefficients: resultadoCalculado.coefficients,
            metrics: resultadoCalculado.metrics,
            success: true
          }, parametros);
          
          setVisualizacaoAtiva('resultados');
          
          toast.success(`✅ Modelo executado (fallback) e salvo no Dashboard! (n=${dadosArray.length})`);
        } else {
          // Resultado completo do backend
          const novoModelo = {
            tipo: 'linear_simples',
            nome: `Regressão Linear Simples: ${variavelY} ~ ${variavelX}`,
            parametros: parametros,
            resultado: resultadoBackend,
            timestamp: new Date().toISOString(),
            id: `linear_simples_${Date.now()}`,
            fonte: 'backend',
            dadosUsados: {
              n: dadosArray.length,
              variaveis: [variavelY, variavelX]
            }
          };
          
          setResultado(novoModelo);
          
          // 🔥 CHAMAR onSaveModel PARA COMPATIBILIDADE
          if (onSaveModel) {
            onSaveModel(novoModelo.nome, novoModelo);
          }
          
          // 🔥 SALVAR NO DASHBOARD
          salvarResultadoNoDashboard(resultadoBackend, parametros);
          
          setVisualizacaoAtiva('resultados');
          
          toast.success(`✅ Modelo executado e salvo no Dashboard! (n=${dadosArray.length})`);
        }
      } else {
        toast.error(`❌ Erro: ${resultadoBackend.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro:', error);
      
      // Tentar calcular localmente em caso de erro
      try {
        const dadosArray = extrairDadosArray(dados);
        const dadosParaEnvio = dadosArray.map(linha => ({
          [variavelY]: parseFloat(linha[variavelY]) || 0,
          [variavelX]: parseFloat(linha[variavelX]) || 0
        }));
        
        const resultadoCalculado = calcularRegressaoManual(dadosParaEnvio, variavelY, variavelX);
        
        const novoModelo = {
          tipo: 'linear_simples',
          nome: `Regressão Linear Simples: ${variavelY} ~ ${variavelX}`,
          parametros: { y: variavelY, x: variavelX },
          resultado: {
            success: true,
            coefficients: resultadoCalculado.coefficients,
            metrics: resultadoCalculado.metrics,
            simulacao: false,
            temCoeficientes: true
          },
          timestamp: new Date().toISOString(),
          id: `linear_simples_${Date.now()}`,
          fonte: 'frontend (emergência)',
          dadosUsados: {
            n: dadosArray.length,
            variaveis: [variavelY, variavelX]
          }
        };
        
        setResultado(novoModelo);
        
        // 🔥 CHAMAR onSaveModel PARA COMPATIBILIDADE
        if (onSaveModel) {
          onSaveModel(novoModelo.nome, novoModelo);
        }
        
        // 🔥 SALVAR NO DASHBOARD (FALLBACK)
        if (onResultadoModelo) {
          onResultadoModelo({
            nome: `Regressão Simples (Fallback): ${variavelY} ~ ${variavelX}`,
            tipo: "linear_simples",
            dados: resultadoCalculado,
            parametros: { y: variavelY, x: variavelX },
            classificacao: calcularClassificacao(resultadoCalculado),
            timestamp: new Date().toISOString(),
            metrics: extrairMetrics(resultadoCalculado),
            categoria: "previsoes",
            fonte: "frontend_fallback"
          });
        }
        
        setVisualizacaoAtiva('resultados');
        
        toast.warning(`⚠️ Modelo calculado localmente e salvo no Dashboard`);
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError);
        toast.error(`❌ Erro: ${error.message || 'Falha na conexão'}`);
      }
    } finally {
      setCarregando(false);
    }
  };

  // Função para calcular regressão linear manualmente (fallback)
  const calcularRegressaoManual = (dadosArray, yVar, xVar) => {
    console.log('🔄 Calculando regressão manualmente com', dadosArray.length, 'registros');
    
    // Extrair arrays de X e Y
    const xValues = dadosArray.map(d => d[xVar]);
    const yValues = dadosArray.map(d => d[yVar]);
    
    // Calcular médias
    const n = xValues.length;
    const xMean = xValues.reduce((a, b) => a + b, 0) / n;
    const yMean = yValues.reduce((a, b) => a + b, 0) / n;
    
    // Calcular somas
    const ssxx = xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);
    const ssxy = xValues.reduce((sum, x, i) => sum + (x - xMean) * (yValues[i] - yMean), 0);
    
    // Calcular coeficientes
    const beta1 = ssxy / ssxx; // Coeficiente angular
    const beta0 = yMean - beta1 * xMean; // Intercepto
    
    // Calcular previsões e resíduos
    const predictions = xValues.map(x => beta0 + beta1 * x);
    const residuals = yValues.map((y, i) => y - predictions[i]);
    
    // Calcular métricas
    const sst = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const sse = residuals.reduce((sum, r) => sum + Math.pow(r, 2), 0);
    const ssr = sst - sse;
    
    // R²
    const rSquared = ssr / sst;
    const adjustedRSquared = 1 - (1 - rSquared) * (n - 1) / (n - 2);
    
    // MSE, RMSE, MAE
    const mse = sse / (n - 2);
    const rmse = Math.sqrt(mse);
    const mae = residuals.reduce((sum, r) => sum + Math.abs(r), 0) / n;
    
    // Erro padrão dos coeficientes
    const seBeta1 = Math.sqrt(mse / ssxx);
    const seBeta0 = Math.sqrt(mse * (1/n + Math.pow(xMean, 2) / ssxx));
    
    // Estatísticas t
    const tBeta1 = beta1 / seBeta1;
    const tBeta0 = beta0 / seBeta0;
    
    // p-valores aproximados
    const pBeta1 = 2 * (1 - tCDF(Math.abs(tBeta1), n - 2));
    const pBeta0 = 2 * (1 - tCDF(Math.abs(tBeta0), n - 2));
    
    return {
      coefficients: {
        '(Intercept)': {
          estimate: beta0,
          std_error: seBeta0,
          t_value: tBeta0,
          p_value: pBeta0
        },
        [xVar]: {
          estimate: beta1,
          std_error: seBeta1,
          t_value: tBeta1,
          p_value: pBeta1
        }
      },
      metrics: {
        r_squared: rSquared,
        adjusted_r_squared: adjustedRSquared,
        mse: mse,
        rmse: rmse,
        mae: mae,
        aic: n * Math.log(mse) + 2 * 2,
        bic: n * Math.log(mse) + 2 * Math.log(n),
        f_statistic: (ssr / 1) / (sse / (n - 2)),
        p_value: pBeta1
      }
    };
  };

  // Função auxiliar para CDF da distribuição t (aproximação)
  const tCDF = (t, df) => {
    // Aproximação simples para CDF da distribuição t
    if (df > 30) {
      return (1 + Math.erf(t / Math.sqrt(2))) / 2;
    }
    
    const x = df / (df + t * t);
    const c = Math.exp(lgamma((df + 1) / 2) - lgamma(df / 2)) / Math.sqrt(df * Math.PI);
    return 0.5 + (t > 0 ? 1 : -1) * c * betainc(x, df / 2, 0.5) / 2;
  };

  // Funções auxiliares para funções gama e beta
  const lgamma = (z) => {
    const g = 7;
    const p = [
      0.99999999999980993, 676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059, 12.507343278686905,
      -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
    ];
    
    if (z < 0.5) {
      return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - lgamma(1 - z);
    }
    
    z -= 1;
    let x = p[0];
    for (let i = 1; i < p.length; i++) {
      x += p[i] / (z + i);
    }
    const t = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  };

  const betainc = (x, a, b) => {
    if (x > (a + 1) / (a + b + 2)) {
      return 1 - betainc(1 - x, b, a);
    }
    
    let bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    
    let result = 0;
    for (let m = 0; m < 100; m++) {
      const term = bt / (a + m);
      result += term;
      bt *= x * (a + b + m) / (a + m + 1);
      if (Math.abs(term) < 1e-10) break;
    }
    
    return result;
  };

  const dadosArray = extrairDadosArray(dados);
  const semDados = !dadosArray || dadosArray.length === 0;

  return (
    <div className="space-y-6 p-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onVoltar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Voltar"
          >
            ⬅️
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📈 Regressão Linear Simples</h1>
            <p className="text-gray-600">Y = β₀ + β₁X + ε</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!semDados && (
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              📊 {infoDados.linhas} linhas × {infoDados.colunas} colunas
            </div>
          )}
          
          <Badge variant={statusSistema.connected ? "success" : "danger"}>
            {statusSistema.connected ? '✅ Conectado' : '❌ Desconectado'}
          </Badge>
        </div>
      </div>

      {/* Aviso se não houver dados */}
      {semDados && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-yellow-600 mr-2">⚠️</span>
            <div>
              <h3 className="font-medium text-yellow-800">Nenhum dado carregado</h3>
              <p className="text-yellow-700 text-sm mt-1">
                Para executar uma regressão linear, você precisa carregar dados primeiro.
                Vá para a aba "Dados" para importar um arquivo CSV, Excel ou outros formatos.
              </p>
              <button
                onClick={onVoltar}
                className="mt-3 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors text-sm font-medium"
              >
                ↪️ Ir para aba de Dados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      {!semDados && (
        <>
          {/* Tabs de Navegação Simples */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setVisualizacaoAtiva('configuracao')}
              className={`px-4 py-2 font-medium flex items-center gap-2 ${
                visualizacaoAtiva === 'configuracao' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ⚙️ Configuração
            </button>
            {resultado && (
              <button
                onClick={() => setVisualizacaoAtiva('resultados')}
                className={`px-4 py-2 font-medium flex items-center gap-2 ${
                  visualizacaoAtiva === 'resultados' 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📊 Resultados
              </button>
            )}
          </div>

          {/* Conteúdo das Tabs */}
          {visualizacaoAtiva === 'configuracao' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Configuração do Modelo</CardTitle>
                  <CardDescription>
                    Selecione a variável resposta (Y) e a variável preditora (X)
                    {variaveis.length > 0 && (
                      <span className="text-green-600 ml-2">
                        ({variaveis.length} variáveis disponíveis)
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="variavelY">Variável Resposta (Y)</Label>
                      <Select
                        id="variavelY"
                        value={variavelY}
                        onChange={(e) => setVariavelY(e.target.value)}
                        placeholder="Selecione a variável Y"
                      >
                        <option value="">Selecione...</option>
                        {variaveis.map(v => (
                          <option key={`y-${v}`} value={v}>{v}</option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="variavelX">Variável Preditora (X)</Label>
                      <Select
                        id="variavelX"
                        value={variavelX}
                        onChange={(e) => setVariavelX(e.target.value)}
                        placeholder="Selecione a variável X"
                      >
                        <option value="">Selecione...</option>
                        {variaveis
                          .filter(v => v !== variavelY)
                          .map(v => (
                            <option key={`x-${v}`} value={v}>{v}</option>
                          ))}
                      </Select>
                    </div>
                  </div>

                  {variavelY && variavelX && dadosArray.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h4 className="font-semibold text-gray-700 mb-2">📋 Amostra dos Dados</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="px-3 py-2 text-left">{variavelY} (Y)</th>
                              <th className="px-3 py-2 text-left">{variavelX} (X)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dadosArray.slice(0, 5).map((linha, idx) => (
                              <tr key={idx} className="border-b border-gray-200">
                                <td className="px-3 py-2">{linha[variavelY]}</td>
                                <td className="px-3 py-2">{linha[variavelX]}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Fórmula do Modelo</h4>
                    <div className="font-mono bg-white p-3 rounded border text-center text-lg">
                      {variavelY && variavelX 
                        ? `${variavelY} = β₀ + β₁ × ${variavelX} + ε`
                        : 'Y = β₀ + β₁X + ε'}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3 text-sm">
                      <div className="text-center p-2 bg-white rounded border">
                        <div className="font-bold">β₀</div>
                        <div className="text-gray-600 text-xs">Intercepto</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded border">
                        <div className="font-bold">β₁</div>
                        <div className="text-gray-600 text-xs">Coeficiente Angular</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded border">
                        <div className="font-bold">ε</div>
                        <div className="text-gray-600 text-xs">Erro Aleatório</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={executarModelo}
                      disabled={carregando || !variavelY || !variavelX || !statusSistema.connected}
                      size="lg"
                      className="w-full"
                    >
                      {carregando ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Executando Modelo...
                        </>
                      ) : (
                        <>
                          <span className="mr-2">▶️</span>
                          Executar Regressão Linear
                        </>
                      )}
                    </Button>
                    
                    {(!variavelY || !variavelX) && (
                      <p className="text-sm text-amber-600 mt-2 text-center">
                        ⚠️ Selecione ambas as variáveis para executar o modelo
                      </p>
                    )}
                    
                    {/* 🔥 INDICADOR DE INTEGRAÇÃO COM DASHBOARD */}
                    {onResultadoModelo && (
                      <div className="mt-2 flex items-center justify-center text-xs text-green-600">
                        <span className="mr-1">✅</span>
                        Resultado será salvo automaticamente no Dashboard
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <ResultadoLinearAprimorado 
              resultado={resultado}
              dadosOriginais={dadosArray}
              onVoltar={() => setVisualizacaoAtiva('configuracao')}
              onNovoModelo={() => {
                setResultado(null);
                setVisualizacaoAtiva('configuracao');
              }}
            />
          )}
        </>
      )}
    </div>
  );
}