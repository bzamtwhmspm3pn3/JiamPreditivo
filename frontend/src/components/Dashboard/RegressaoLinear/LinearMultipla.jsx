import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../../services/api';

// Componentes UI
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import Button from '../componentes/Button';
import Select from '../componentes/Select';
import { Input, Label } from '../componentes/Input';
import Badge from '../componentes/Badge';

// Componentes de Resultados
import ResultadoLinearMultiplaAprimorado from '../resultados/ResultadoLinearMultiplaAprimorado';
import ModelosService from '../../../services/modelosService';

export default function LinearMultipla({ 
  dados, 
  onSaveModel, 
  modelosAjustados, 
  onVoltar, 
  statusSistema,
  onResultadoModelo // 🔥 ADICIONAR NOVA PROP
}) {
  const [variaveis, setVariaveis] = useState([]);
  const [variavelY, setVariavelY] = useState('');
  const [variaveisX, setVariaveisX] = useState([]);
  const [variaveisSelecionadas, setVariaveisSelecionadas] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [visualizacaoAtiva, setVisualizacaoAtiva] = useState('configuracao');
  const [infoDados, setInfoDados] = useState({ 
    linhas: 0, 
    colunas: 0 
  });

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

 // 🔥 FUNÇÃO PARA SALVAR RESULTADO NO DASHBOARD E NO MONGODB
const salvarResultadoNoDashboard = async (resultado, config) => {
  if (!onResultadoModelo) return;
  
  try {
    const dadosParaDashboard = {
      nome: `Regressão Múltipla: ${config.y} ~ ${config.x_multiplas}`,
      tipo: "linear_multipla",
      dados: resultado,
      parametros: config,
      classificacao: calcularClassificacao(resultado),
      timestamp: new Date().toISOString(),
      metrics: extrairMetrics(resultado),
      categoria: "previsoes"
    };

    
    // 1. Enviar para o Dashboard (como já fazia)
    onResultadoModelo(dadosParaDashboard);
    console.log('📤 Resultado salvo no Dashboard:', dadosParaDashboard);
    
    // 2. 🔥 NOVO: Salvar no MongoDB via ModelosService
    console.log('💾 Salvando modelo no MongoDB...');
    const salvo = await ModelosService.salvar({
      nome: dadosParaDashboard.nome,
      tipo: dadosParaDashboard.tipo,
      resultado: resultado,
      parametros: config,
      classificacao: dadosParaDashboard.classificacao,
      timestamp: dadosParaDashboard.timestamp,
      metrics: dadosParaDashboard.metrics
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
      
      // Selecionar automaticamente a primeira variável como Y
      if (vars.length > 0) {
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

  // Atualizar variáveis X disponíveis
  useEffect(() => {
    if (variavelY) {
      const varsDisponiveis = variaveis.filter(v => v !== variavelY);
      setVariaveisX(varsDisponiveis);
      // Filtrar seleções que não estão mais disponíveis
      setVariaveisSelecionadas(prev => 
        prev.filter(v => varsDisponiveis.includes(v))
      );
    }
  }, [variavelY, variaveis]);

  const toggleVariavel = (variavel) => {
    setVariaveisSelecionadas(prev => 
      prev.includes(variavel)
        ? prev.filter(v => v !== variavel)
        : [...prev, variavel]
    );
  };

  const selecionarTodasVariaveis = () => {
    setVariaveisSelecionadas([...variaveisX]);
  };

  const limparSelecao = () => {
    setVariaveisSelecionadas([]);
  };

  const executarModelo = async () => {
    if (!variavelY) {
      toast.error('Selecione a variável resposta (Y)');
      return;
    }

    if (variaveisSelecionadas.length === 0) {
      toast.error('Selecione pelo menos uma variável preditora (X)');
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
        x_multiplas: variaveisSelecionadas.join(','),
        tipo_regressao: 'multipla',
        familia: 'gaussian',
        include_intercept: 'true',
        calcular_metricas: 'true'
      };

      console.log('📤 Enviando regressão múltipla:', {
        parametros,
        totalRegistros: dadosArray.length,
        variaveisSelecionadas: variaveisSelecionadas
      });

      // Verificar se os dados têm as variáveis selecionadas
      const amostra = dadosArray[0];
      const todasVariaveis = [variavelY, ...variaveisSelecionadas];
      const variaveisFaltantes = todasVariaveis.filter(v => !(v in amostra));
      
      if (variaveisFaltantes.length > 0) {
        toast.error(`Variáveis não encontradas: ${variaveisFaltantes.join(', ')}`);
        setCarregando(false);
        return;
      }

      // Preparar dados para envio
      const dadosParaEnvio = dadosArray.map(linha => {
        const obj = {};
        Object.keys(linha).forEach(key => {
          obj[key] = linha[key];
        });
        return obj;
      });

      const resultadoBackend = await api.executarModeloR('glm', dadosParaEnvio, parametros);
      
      console.log('📥 Resposta do backend:', resultadoBackend);

      if (resultadoBackend.success) {
        const novoModelo = {
          tipo: 'linear_multipla',
          nome: `Regressão Linear Múltipla: ${variavelY} ~ ${variaveisSelecionadas.join(' + ')}`,
          parametros: parametros,
          resultado: resultadoBackend,
          timestamp: new Date().toISOString(),
          id: `linear_multipla_${Date.now()}`,
          fonte: 'backend',
          dadosUsados: {
            n: dadosArray.length,
            variavelY: variavelY,
            variaveisX: variaveisSelecionadas
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
      } else {
        toast.error(`❌ Erro: ${resultadoBackend.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro detalhado:', error);
      
      // Fallback: calcular localmente se o backend falhar
      try {
        const dadosArray = extrairDadosArray(dados);
        const resultadoCalculado = calcularRegressaoMultiplaManual(
          dadosArray, 
          variavelY, 
          variaveisSelecionadas
        );
        
        const novoModelo = {
          tipo: 'linear_multipla',
          nome: `Regressão Linear Múltipla: ${variavelY} ~ ${variaveisSelecionadas.join(' + ')}`,
          parametros: {
            y: variavelY,
            x_multiplas: variaveisSelecionadas.join(','),
            tipo_regressao: 'multipla'
          },
          resultado: {
            success: true,
            coefficients: resultadoCalculado.coefficients,
            metrics: resultadoCalculado.metrics,
            simulacao: false,
            temCoeficientes: true
          },
          timestamp: new Date().toISOString(),
          id: `linear_multipla_${Date.now()}`,
          fonte: 'frontend (fallback)',
          dadosUsados: {
            n: dadosArray.length,
            variavelY: variavelY,
            variaveisX: variaveisSelecionadas
          }
        };
        
        setResultado(novoModelo);
        
        // 🔥 CHAMAR onSaveModel
        if (onSaveModel) {
          onSaveModel(novoModelo.nome, novoModelo);
        }
        
        // 🔥 SALVAR NO DASHBOARD (FALLBACK)
        if (onResultadoModelo) {
          onResultadoModelo({
            nome: `Regressão Múltipla (Fallback): ${variavelY} ~ ${variaveisSelecionadas.join(' + ')}`,
            tipo: "linear_multipla",
            dados: resultadoCalculado,
            parametros: {
              y: variavelY,
              x_multiplas: variaveisSelecionadas.join(',')
            },
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

  // Função para calcular regressão múltipla manualmente (fallback) - mantida igual
  const calcularRegressaoMultiplaManual = (dadosArray, yVar, xVars) => {
    // ... (mantenha o código existente)
    // Código mantido igual da sua função existente
  };

  // Função auxiliar para mínimos quadrados - mantida igual
  const calcularMinimosQuadrados = (X, y) => {
    // ... (mantenha o código existente)
  };

  // Função auxiliar para inverter matriz - mantida igual
  const inverterMatriz = (mat) => {
    // ... (mantenha o código existente)
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
            <h1 className="text-2xl font-bold text-gray-800">📊 Regressão Linear Múltipla</h1>
            <p className="text-gray-600">Y = β₀ + β₁X₁ + β₂X₂ + ... + ε</p>
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
                Para executar uma regressão linear múltipla, você precisa carregar dados primeiro.
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
                    Selecione a variável resposta (Y) e múltiplas variáveis preditoras (X)
                    {variaveis.length > 0 && (
                      <span className="text-green-600 ml-2">
                        ({variaveis.length} variáveis disponíveis)
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Seleção de Variável Y */}
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
                    <p className="text-xs text-gray-500 mt-1">
                      Variável que você quer prever/explicar
                    </p>
                  </div>

                  {/* Seleção de Variáveis X */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Variáveis Preditoras (X)</Label>
                      <div className="flex gap-2">
                        <button
                          onClick={selecionarTodasVariaveis}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Selecionar todas
                        </button>
                        {variaveisSelecionadas.length > 0 && (
                          <button
                            onClick={limparSelecao}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Limpar
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="border border-gray-300 rounded-lg p-3 max-h-64 overflow-y-auto">
                      {variaveisX.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">
                          Selecione primeiro a variável Y
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {variaveisX.map(v => (
                            <div
                              key={`x-${v}`}
                              className={`p-3 rounded-lg cursor-pointer transition-all ${
                                variaveisSelecionadas.includes(v)
                                  ? 'bg-blue-50 border-2 border-blue-300'
                                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                              }`}
                              onClick={() => toggleVariavel(v)}
                            >
                              <div className="flex items-center">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${
                                  variaveisSelecionadas.includes(v)
                                    ? 'bg-blue-500 border-blue-500'
                                    : 'bg-white border-gray-400'
                                }`}>
                                  {variaveisSelecionadas.includes(v) && (
                                    <span className="text-white text-xs">✓</span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium">{v}</div>
                                  {dadosArray.length > 0 && (
                                    <div className="text-xs text-gray-500">
                                      Tipo: {typeof dadosArray[0][v]}, Valor: {dadosArray[0][v]}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mt-3">
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">{variaveisSelecionadas.length}</span> de{' '}
                        <span className="font-semibold">{variaveisX.length}</span> variáveis selecionadas
                      </div>
                      {variaveisSelecionadas.length > 0 && (
                        <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Selecionadas: {variaveisSelecionadas.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pré-visualização dos dados */}
                  {variavelY && variaveisSelecionadas.length > 0 && dadosArray.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h4 className="font-semibold text-gray-700 mb-2">📋 Amostra dos Dados</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="px-3 py-2 text-left">{variavelY} (Y)</th>
                              {variaveisSelecionadas.map(v => (
                                <th key={v} className="px-3 py-2 text-left">{v}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {dadosArray.slice(0, 3).map((linha, idx) => (
                              <tr key={idx} className="border-b border-gray-200">
                                <td className="px-3 py-2">{linha[variavelY]}</td>
                                {variaveisSelecionadas.map(v => (
                                  <td key={v} className="px-3 py-2">{linha[v]}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Informações do Modelo */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">📐 Fórmula do Modelo</h4>
                    <div className="font-mono bg-white p-4 rounded border">
                      {variavelY && variaveisSelecionadas.length > 0 
                        ? `${variavelY} = β₀ + ${variaveisSelecionadas.map((x, i) => `β${i+1} × ${x}`).join(' + ')} + ε`
                        : 'Y = β₀ + β₁X₁ + β₂X₂ + ... + ε'}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                      <div className="text-center p-2 bg-white rounded border text-sm">
                        <div className="font-bold">β₀</div>
                        <div className="text-gray-600 text-xs">Intercepto</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded border text-sm">
                        <div className="font-bold">β₁, β₂...</div>
                        <div className="text-gray-600 text-xs">Coeficientes</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded border text-sm">
                        <div className="font-bold">X₁, X₂...</div>
                        <div className="text-gray-600 text-xs">Variáveis</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded border text-sm">
                        <div className="font-bold">ε</div>
                        <div className="text-gray-600 text-xs">Erro</div>
                      </div>
                    </div>
                  </div>

                  {/* Botão de Execução */}
                  <div className="pt-4">
                    <Button
                      onClick={executarModelo}
                      disabled={carregando || !variavelY || variaveisSelecionadas.length === 0 || !statusSistema.connected}
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
                          Executar Regressão Múltipla
                        </>
                      )}
                    </Button>
                    
                    {(!variavelY || variaveisSelecionadas.length === 0) && (
                      <p className="text-sm text-amber-600 mt-2 text-center">
                        {!variavelY ? 'Selecione a variável resposta (Y)' : 'Selecione pelo menos uma variável preditora (X)'}
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
            <ResultadoLinearMultiplaAprimorado 
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