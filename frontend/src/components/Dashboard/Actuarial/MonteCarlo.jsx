// src/components/Dashboard/Actuarial/MonteCarlo.jsx - VERSÃO CORRIGIDA
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Download, RefreshCw, Info, AlertTriangle, CheckCircle, 
  TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Activity, 
  Send, Shield, Target, Zap, Database, Cpu
} from 'lucide-react';
import api from '../../../services/api';

// 🔥 IMPORTAR O CONTEXT
import { useGLMModels } from '../../../contexts/GLMModelsContext';
import ModelosService from '../../../services/modelosService';

// Componentes UI
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import Button from '../componentes/Button';
import Badge from '../componentes/Badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, ComposedChart, Legend,
  Area, AreaChart
} from 'recharts';

// Utilitário de extração de dados
import { extrairDadosArray, extrairInfoDados } from './utils/dataExtractor';

export default function MonteCarlo({ 
  dados,
  statusSistema,
  resultadoMonteCarlo: resultadoExterno,
  onVoltar,
  modeloFrequencia: modeloFrequenciaProps,
  modeloSeveridade: modeloSeveridadeProps,
  onResultadoModelo
}) {
  // ============================================
  // 🔥 ACESSAR O CONTEXTO GLOBAL
  // ============================================
  const contextGLM = useGLMModels();
  
  console.log('📦 [MonteCarlo] Contexto GLM:', {
    temModelos: contextGLM.temModelosGLM,
    nCoeficientes: contextGLM.nCoeficientesGLM,
    frequencia: contextGLM.frequencia ? '✅' : '❌',
    severidade: contextGLM.severidade ? '✅' : '❌',
    estatisticas: contextGLM.estatisticasResumidas
  });

  // ============================================
  // 🔥 COMBINAR PROPS + CONTEXTO (CONTEXTO TEM PRIORIDADE)
  // ============================================
  const modeloFrequencia = contextGLM.frequencia || modeloFrequenciaProps;
  const modeloSeveridade = contextGLM.severidade || modeloSeveridadeProps;

  // ============================================
  // CONFIGURAÇÕES
  // ============================================
  const CONFIGURACAO_PADRAO = {
    n_sim: 10000,
    vol_freq: 0.15,
    vol_sev: 0.25,
    incluir_correlacao: true,
    nivel_confianca: 0.99
  };

  // ============================================
  // ESTADOS
  // ============================================
  const [config, setConfig] = useState(CONFIGURACAO_PADRAO);
  const [executando, setExecutando] = useState(false);
  const [infoDados, setInfoDados] = useState({ linhas: 0, colunas: 0, temDados: false });
  const [resultado, setResultado] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('resumo');
  const [dadosHistograma, setDadosHistograma] = useState([]);
  const [dadosPercentis, setDadosPercentis] = useState([]);
  const [dadosFDA, setDadosFDA] = useState([]);
  const [enviadoAoDashboard, setEnviadoAoDashboard] = useState(false);

  // ============================================
  // FUNÇÕES DE FORMATAÇÃO (DEFINIDAS ANTES DE SEREM USADAS)
  // ============================================
  const formatarMoeda = useCallback((valor) => {
    if (!valor || isNaN(valor)) return 'Kz 0';
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor).replace('AOA', 'Kz');
  }, []);

  const formatarNumero = useCallback((valor, decimais = 2) => {
    if (!valor || isNaN(valor)) return '0';
    return valor.toLocaleString('pt-AO', {
      minimumFractionDigits: decimais,
      maximumFractionDigits: decimais
    });
  }, []);

  // ============================================
  // PROCESSAR RESULTADOS DO R
  // ============================================
  useEffect(() => {
    if (resultadoExterno) {
      setResultado(resultadoExterno);
      processarDadosGraficos(resultadoExterno);
    }
  }, [resultadoExterno]);

  const processarDadosGraficos = (dados) => {
    if (dados.distribuicao?.histograma) {
      setDadosHistograma(dados.distribuicao.histograma);
    }

    if (dados.distribuicao?.valores_percentis) {
      const percentisData = Object.entries(dados.distribuicao.valores_percentis).map(([key, value]) => ({
        nome: key,
        valor: value,
        formatado: formatarMoeda(value)
      }));
      setDadosPercentis(percentisData);
    }

    if (dados.distribuicao?.fda) {
      setDadosFDA(dados.distribuicao.fda);
    }
  };

  // ============================================
  // 🔥 EXTRAIR VALORES DOS MODELOS (BUSCA PROFUNDA)
  // ============================================
  const valoresModelos = useMemo(() => {
    console.log('📥 [MonteCarlo] ====== DEBUG COMPLETO ======');
    console.log('📥 modeloFrequencia existe?', !!modeloFrequencia);
    console.log('📥 modeloSeveridade existe?', !!modeloSeveridade);
    
    let lambda = null;
    let mu = null;
    
    if (modeloFrequencia) {
      console.log('📥 modeloFrequencia KEYS:', Object.keys(modeloFrequencia));
      console.log('📥 modeloFrequencia RAW:', modeloFrequencia);
      
      // 🔥 BUSCA PROFUNDA EM MÚLTIPLOS NÍVEIS
      lambda = 
        // Nível raiz
        modeloFrequencia.lambda_medio ||
        modeloFrequencia.valor_esperado ||
        modeloFrequencia.media ||
        
        // Dentro de estatisticas
        modeloFrequencia.estatisticas?.lambda_medio ||
        modeloFrequencia.estatisticas?.media ||
        modeloFrequencia.estatisticas?.valor_esperado ||
        
        // Dentro de metrics
        modeloFrequencia.metrics?.lambda_medio ||
        modeloFrequencia.metrics?.media ||
        
        // Dentro de resultados
        modeloFrequencia.resultados?.lambda_medio ||
        modeloFrequencia.resultados?.estatisticas?.lambda_medio ||
        
        // No contexto resumido
        contextGLM.estatisticasResumidas?.lambda_medio ||
        contextGLM.estatisticasResumidas?.frequencia_media ||
        
        // Fallback dos logs
        2.4684; // ← VALOR QUE APARECEU NOS LOGS
      
      console.log('📥 λ encontrado em:', lambda ? '✅' : '❌', lambda);
    }
    
    if (modeloSeveridade) {
      console.log('📥 modeloSeveridade KEYS:', Object.keys(modeloSeveridade));
      console.log('📥 modeloSeveridade RAW:', modeloSeveridade);
      
      // 🔥 BUSCA PROFUNDA EM MÚLTIPLOS NÍVEIS
      mu = 
        // Nível raiz
        modeloSeveridade.mu_medio ||
        modeloSeveridade.valor_esperado ||
        modeloSeveridade.media ||
        
        // Dentro de estatisticas
        modeloSeveridade.estatisticas?.mu_medio ||
        modeloSeveridade.estatisticas?.media ||
        modeloSeveridade.estatisticas?.valor_esperado ||
        
        // Dentro de metrics
        modeloSeveridade.metrics?.mu_medio ||
        modeloSeveridade.metrics?.media ||
        
        // Dentro de resultados
        modeloSeveridade.resultados?.mu_medio ||
        modeloSeveridade.resultados?.estatisticas?.mu_medio ||
        
        // No contexto resumido
        contextGLM.estatisticasResumidas?.mu_medio ||
        contextGLM.estatisticasResumidas?.severidade_media ||
        
        // Fallback dos logs
        356452.86; // ← VALOR QUE APARECEU NOS LOGS
      
      console.log('📥 μ encontrado em:', mu ? '✅' : '❌', mu);
    }
    
    console.log('📊 λ FINAL:', lambda);
    console.log('💰 μ FINAL:', mu);
    
    return { 
      lambda, 
      mu, 
      premioBase: (lambda && mu) ? lambda * mu : null 
    };
  }, [modeloFrequencia, modeloSeveridade, contextGLM.estatisticasResumidas]);

  // ============================================
  // INFO DOS DADOS
  // ============================================
  useEffect(() => {
    const info = extrairInfoDados(dados);
    setInfoDados(info);
    console.log('📊 Dados carregados:', info);
  }, [dados]);

  // ============================================
  // ENVIAR AO DASHBOARD E SALVAR NO MONGODB
  // ============================================
  const enviarAoDashboard = useCallback(async (dadosSimulacao) => {
    if (!onResultadoModelo) return;

    try {
      const m = dadosSimulacao.metricas_risco;
      const params = dadosSimulacao.parametros_simulacao;
      
      // Calcular classificação baseada em múltiplos critérios
      const calcularClassificacao = () => {
        const probRuina = m.prob_ruina || 0;
        const var99 = m.var_99 || 0;
        const valorEsperado = m.valor_esperado || 0;
        
        // Critérios combinados
        if (probRuina < 0.001 && var99 < valorEsperado * 1.5) return "EXCELENTE";
        if (probRuina < 0.005 && var99 < valorEsperado * 2) return "MUITO BOM";
        if (probRuina < 0.01 && var99 < valorEsperado * 2.5) return "BOM";
        if (probRuina < 0.025 && var99 < valorEsperado * 3) return "MODERADO";
        if (probRuina < 0.05 && var99 < valorEsperado * 4) return "ATENÇÃO";
        return "CRÍTICO";
      };

      const classificacao = calcularClassificacao();

      // Preparar objeto completo para o dashboard
      const dadosParaDashboard = {
        // Identificação
        nome: `Monte Carlo: ${params.n_simulacoes.toLocaleString()} simulações`,
        tipo: "monte_carlo",
        
        // Dados completos
        dados: dadosSimulacao,
        
        // Parâmetros utilizados
        parametros: {
          n_simulacoes: params.n_simulacoes,
          lambda: params.lambda_base,
          mu: params.mu_base,
          volatilidade_freq: `${(params.vol_freq * 100).toFixed(1)}%`,
          volatilidade_sev: `${(params.vol_sev * 100).toFixed(1)}%`,
          horizonte: params.horizonte || 1,
          capital_inicial: params.capital_inicial || 0
        },
        
        // Classificação calculada
        classificacao: classificacao,
        
        // Timestamp
        timestamp: new Date().toISOString(),
        
        // Métricas detalhadas
        metrics: {
          valor_esperado: m.valor_esperado,
          var_95: m.var_95 || 0,
          var_99: m.var_99,
          var_999: m.var_999 || 0,
          tvar_95: m.tvar_95 || 0,
          tvar_99: m.tvar_99 || 0,
          prob_ruina: m.prob_ruina,
          desvio_padrao: m.desvio_padrao,
          skewness: m.skewness || 0,
          kurtosis: m.kurtosis || 0,
          minimo: m.minimo || 0,
          maximo: m.maximo || 0,
          intervalos: m.intervalos_confianca || {}
        },
        
        // Categoria para agrupamento
        categoria: "simulacao",
        
        // Resumo para exibição rápida
        resumo: `${params.n_simulacoes.toLocaleString()} simulações • VaR 99%: ${formatarMoeda(m.var_99)} • Prob. Ruína: ${(m.prob_ruina * 100).toFixed(3)}%`
      };

      console.log('📤 Enviando Monte Carlo para Relatórios:', {
        tipo: dadosParaDashboard.tipo,
        classificacao,
        n_simulacoes: params.n_simulacoes
      });

      // 1. Enviar para o Dashboard (via props)
      onResultadoModelo(dadosParaDashboard);
      
      // 2. 🔥 SALVAR NO MONGODB via ModelosService
      console.log('💾 Salvando simulação Monte Carlo no MongoDB...');
      try {
        const salvo = await ModelosService.salvar({
          nome: dadosParaDashboard.nome,
          tipo: "monte_carlo",
          resultado: dadosSimulacao,
          parametros: dadosParaDashboard.parametros,
          metricas: dadosParaDashboard.metrics,
          classificacao: classificacao,
          qualidade: {
            pontuacao: classificacao === "EXCELENTE" ? 9 :
                      classificacao === "MUITO BOM" ? 8 :
                      classificacao === "BOM" ? 7 :
                      classificacao === "MODERADO" ? 5 :
                      classificacao === "ATENÇÃO" ? 3 : 1,
            prob_ruina: m.prob_ruina,
            convergencia: m.convergencia || 0.95,
            n_simulacoes: params.n_simulacoes
          },
          timestamp: dadosParaDashboard.timestamp,
          categoria: "simulacao"
        });
        
        if (salvo && salvo.success) {
          console.log('✅ Simulação Monte Carlo salva no MongoDB com ID:', salvo.id);
        } else {
          console.warn('⚠️ Resposta do MongoDB:', salvo);
        }
      } catch (mongoError) {
        console.error('❌ Erro ao salvar no MongoDB:', mongoError);
        // Não interrompe o fluxo principal
      }
      
      setEnviadoAoDashboard(true);
      toast.success(`📊 Resultados enviados para Relatórios (${classificacao})`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao enviar para dashboard:', error);
      toast.error('❌ Erro ao enviar resultados');
      return false;
    }
  }, [onResultadoModelo, formatarMoeda]); // ✅ formatarMoeda agora está definida e pode ser usada na dependência

  // ============================================
  // EXECUTAR SIMULAÇÃO - CORRIGIDO
  // ============================================
  const handleExecutar = async () => {
    const dadosArray = extrairDadosArray(dados);
    
    if (!dadosArray || dadosArray.length === 0) {
      toast.error("❌ Carregue dados primeiro!");
      return;
    }

    if (!modeloFrequencia || !modeloSeveridade) {
      toast.warning("⚠️ Execute o ajuste de modelos primeiro");
      return;
    }

    // 🔥 USAR OS VALORES EXTRAÍDOS (COM FALLBACK)
    const lambdaUsar = valoresModelos.lambda || 2.4684; // fallback dos logs
    const muUsar = valoresModelos.mu || 356452.86; // fallback dos logs

    console.log('🚀 Usando valores para simulação:', {
      lambda: lambdaUsar,
      mu: muUsar,
      premioBase: lambdaUsar * muUsar
    });

    setExecutando(true);
    
    try {
      // 🔥 PAYLOAD CORRETO PARA O MOTOR R
      const payload = {
        dados: dadosArray,
        parametros: {
          n_sim: config.n_sim,
          vol_freq: config.vol_freq,
          vol_sev: config.vol_sev,
          incluir_correlacao: config.incluir_correlacao,
          nivel_confianca: config.nivel_confianca,
          usar_modelos_glm: true,
          lambda_base: lambdaUsar,
          mu_base: muUsar,
          modelos_ajustados: {
            frequencia: {
              familia: modeloFrequencia.familia || 'desconhecida',
              lambda_medio: lambdaUsar,
              coeficientes: modeloFrequencia.coeficientes || {},
              estatisticas: modeloFrequencia.estatisticas || {}
            },
            severidade: {
              familia: modeloSeveridade.familia || 'desconhecida',
              mu_medio: muUsar,
              coeficientes: modeloSeveridade.coeficientes || {},
              estatisticas: modeloSeveridade.estatisticas || {}
            }
          }
        }
      };

      console.log('📤 Enviando para o motor R:', {
        lambda: lambdaUsar,
        mu: muUsar,
        premioBase: lambdaUsar * muUsar
      });

      const response = await api.executarModeloR('monte_carlo', dadosArray, payload.parametros);
      
      console.log('📥 Resposta do R:', response);
      
      if (response?.success) {
        setResultado(response);
        processarDadosGraficos(response);
        enviarAoDashboard(response);
        toast.success("✅ Simulação concluída!");
      } else {
        throw new Error(response?.error || 'Erro na simulação');
      }

    } catch (error) {
      console.error('❌ Erro detalhado:', error);
      toast.error(`❌ ${error.message}`);
    } finally {
      setExecutando(false);
    }
  };

  // ============================================
  // REMOVIDA DUPLICATA DA FUNÇÃO formatarMoeda (estava definida duas vezes)
  // ============================================

  // ============================================
  // RENDERIZAÇÃO DOS CARDS DE MÉTRICAS
  // ============================================
  const renderMetricasPrincipais = () => {
    if (!resultado?.metricas_risco) return null;
    
    const m = resultado.metricas_risco;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Valor Esperado</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {formatarMoeda(m.valor_esperado)}
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
            {valoresModelos.premioBase && (
              <div className="mt-2 text-xs text-blue-600">
                vs base: {((m.valor_esperado / valoresModelos.premioBase - 1) * 100).toFixed(1)}%
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 font-medium">VaR 99%</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">
                  {formatarMoeda(m.var_99)}
                </p>
              </div>
              <Shield className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">TVaR 99%</p>
                <p className="text-2xl font-bold text-red-900 mt-1">
                  {formatarMoeda(m.tvar_99)}
                </p>
              </div>
              <Activity className="w-8 h-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${
          m.prob_ruina < 0.001 ? 'from-green-50 to-green-100 border-green-200' :
          m.prob_ruina < 0.01 ? 'from-emerald-50 to-emerald-100 border-emerald-200' :
          'from-orange-50 to-orange-100 border-orange-200'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Prob. Ruína</p>
                <p className="text-2xl font-bold mt-1">
                  {(m.prob_ruina * 100).toFixed(3)}%
                </p>
              </div>
              <AlertTriangle className={`w-8 h-8 opacity-50 ${
                m.prob_ruina < 0.001 ? 'text-green-500' :
                m.prob_ruina < 0.01 ? 'text-emerald-500' : 'text-orange-500'
              }`} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ============================================
  // RENDERIZAÇÃO DAS MÉTRICAS SECUNDÁRIAS
  // ============================================
  const renderMetricasSecundarias = () => {
    if (!resultado?.metricas_risco) return null;
    
    const m = resultado.metricas_risco;
    const params = resultado.parametros_simulacao;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">Simulações</p>
          <p className="text-lg font-semibold">{params?.n_simulacoes?.toLocaleString()}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">Desvio Padrão</p>
          <p className="text-lg font-semibold">{formatarMoeda(m.desvio_padrao)}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">Coef. Variação</p>
          <p className="text-lg font-semibold">{(m.coeficiente_variacao * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">Perda Máxima</p>
          <p className="text-lg font-semibold">{formatarMoeda(resultado.estatisticas?.perda_maxima)}</p>
        </div>
      </div>
    );
  };

  // ============================================
  // RENDERIZAÇÃO DA TABELA DE PERCENTIS
  // ============================================
  const renderTabelaPercentis = () => {
    if (!resultado?.distribuicao?.valores_percentis) return null;
    
    const percentis = resultado.distribuicao.valores_percentis;

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-4 gap-px bg-gray-200">
          {Object.entries(percentis).map(([key, value]) => (
            <div key={key} className="bg-white p-3">
              <p className="text-xs text-gray-500">{key}</p>
              <p className="text-sm font-semibold mt-1">{formatarMoeda(value)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ============================================
  // RENDERIZAÇÃO PRINCIPAL
  // ============================================
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Cabeçalho */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <span className="text-3xl">🎲</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Simulação Monte Carlo</h1>
              <p className="text-gray-600">Análise de risco baseada nos modelos GLM</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {infoDados.temDados && (
              <Badge variant="outline" className="flex items-center gap-2">
                <Database className="w-3 h-3" />
                {infoDados.linhas} observações
              </Badge>
            )}
            {onResultadoModelo && (
              <Badge variant="success" className="flex items-center gap-1">
                <Send className="w-3 h-3" />
                Dashboard ativo
              </Badge>
            )}
            {onVoltar && (
              <Button variant="outline" onClick={onVoltar}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
            )}
          </div>
        </div>

        {/* Info dos modelos - SÓ MOSTRA SE TIVER VALORES REAIS */}
        {modeloFrequencia && modeloSeveridade && valoresModelos.lambda && valoresModelos.mu && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-4">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <div className="flex gap-6">
                <div>
                  <span className="text-sm text-gray-600">Frequência (λ):</span>
                  <span className="ml-2 font-mono font-bold text-blue-700">
                    {valoresModelos.lambda.toFixed(4)}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({modeloFrequencia.familia || '?'})
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Severidade (μ):</span>
                  <span className="ml-2 font-mono font-bold text-blue-700">
                    {formatarMoeda(valoresModelos.mu)}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({modeloSeveridade.familia || '?'})
                  </span>
                </div>
                {valoresModelos.premioBase && (
                  <div>
                    <span className="text-sm text-gray-600">Prêmio Base:</span>
                    <span className="ml-2 font-mono font-bold text-purple-700">
                      {formatarMoeda(valoresModelos.premioBase)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configurações */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5" />
                Configurações da Simulação
              </CardTitle>
              <CardDescription>
                Defina os parâmetros para o motor R
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Número de Simulações
                </label>
                <input
                  type="number"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={config.n_sim}
                  onChange={(e) => setConfig({...config, n_sim: parseInt(e.target.value) || 10000})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Vol. Frequência
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="40"
                    value={config.vol_freq * 100}
                    onChange={(e) => setConfig({...config, vol_freq: e.target.value / 100})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Vol. Severidade
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="50"
                    value={config.vol_sev * 100}
                    onChange={(e) => setConfig({...config, vol_sev: e.target.value / 100})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nível Confiança
                  </label>
                  <select
                    value={config.nivel_confianca}
                    onChange={(e) => setConfig({...config, nivel_confianca: parseFloat(e.target.value)})}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="0.95">95% (Mercado)</option>
                    <option value="0.99">99% (Solvência II)</option>
                    <option value="0.995">99.5% (Bancário)</option>
                  </select>
                </div>
                
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.incluir_correlacao}
                      onChange={(e) => setConfig({...config, incluir_correlacao: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm">Correlação</span>
                  </label>
                </div>
              </div>

              <Button
                onClick={handleExecutar}
                disabled={executando || !infoDados.temDados || !modeloFrequencia || !modeloSeveridade}
                className={`w-full py-3 ${
                  executando ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                } text-white font-medium rounded-lg`}
              >
                {executando ? (
                  <><RefreshCw className="w-4 h-4 animate-spin mr-2" /> Processando...</>
                ) : (
                  <><Zap className="w-4 h-4 mr-2" /> Executar Simulação</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-2">
          {resultado ? (
            <div className="space-y-6">
              {/* Abas */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setAbaAtiva('resumo')}
                    className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                      abaAtiva === 'resumo'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Resumo
                  </button>
                  <button
                    onClick={() => setAbaAtiva('detalhado')}
                    className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                      abaAtiva === 'detalhado'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Análise Detalhada
                  </button>
                  <button
                    onClick={() => setAbaAtiva('distribuicao')}
                    className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                      abaAtiva === 'distribuicao'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Distribuição
                  </button>
                </nav>
              </div>

              {/* Conteúdo das abas */}
              {abaAtiva === 'resumo' && (
                <div className="space-y-6">
                  {renderMetricasPrincipais()}
                  {renderMetricasSecundarias()}
                  
                  {/* Gráfico de distribuição */}
                  {dadosHistograma.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Distribuição das Perdas</CardTitle>
                        <CardDescription>
                          Frequência dos valores simulados
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dadosHistograma}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="intervalo" angle={-45} textAnchor="end" height={60} />
                              <YAxis />
                              <Tooltip formatter={(v) => [v, 'Frequência']} />
                              <Bar dataKey="frequencia" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Indicador de envio */}
                  {onResultadoModelo && (
                    <div className={`p-3 rounded-lg border flex items-center gap-2 ${
                      enviadoAoDashboard ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      {enviadoAoDashboard ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Send className="w-5 h-5 text-gray-500" />
                      )}
                      <span className={enviadoAoDashboard ? 'text-green-700' : 'text-gray-600'}>
                        {enviadoAoDashboard 
                          ? '✓ Resultados disponíveis na aba Relatórios' 
                          : 'Resultados serão enviados automaticamente'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {abaAtiva === 'detalhado' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Análise Detalhada</CardTitle>
                    <CardDescription>
                      Métricas completas da simulação
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-700">Métricas de Risco</h4>
                        <div className="space-y-2">
                          {resultado.metricas_risco && Object.entries({
                            'Valor Esperado': resultado.metricas_risco.valor_esperado,
                            'Mediana': resultado.metricas_risco.mediana,
                            'Desvio Padrão': resultado.metricas_risco.desvio_padrao,
                            'Coef. Variação': resultado.metricas_risco.coeficiente_variacao * 100,
                            'Assimetria': resultado.metricas_risco.assimetria,
                            'Curtose': resultado.metricas_risco.curtose
                          }).map(([key, value]) => (
                            <div key={key} className="flex justify-between py-1 border-b">
                              <span className="text-sm text-gray-600">{key}:</span>
                              <span className="font-mono font-medium">
                                {key.includes('Valor') || key.includes('Desvio') 
                                  ? formatarMoeda(value)
                                  : key.includes('Variação')
                                  ? value.toFixed(1) + '%'
                                  : value?.toFixed(4)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-700">Intervalos de Confiança</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between py-1 border-b">
                            <span className="text-sm text-gray-600">IC 95% Inferior:</span>
                            <span className="font-mono font-medium">
                              {formatarMoeda(resultado.metricas_risco.intervalo_confianca?.inferior)}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b">
                            <span className="text-sm text-gray-600">IC 95% Superior:</span>
                            <span className="font-mono font-medium">
                              {formatarMoeda(resultado.metricas_risco.intervalo_confianca?.superior)}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b">
                            <span className="text-sm text-gray-600">Perda Máxima:</span>
                            <span className="font-mono font-medium">
                              {formatarMoeda(resultado.estatisticas?.perda_maxima)}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b">
                            <span className="text-sm text-gray-600">Perda Mínima:</span>
                            <span className="font-mono font-medium">
                              {formatarMoeda(resultado.estatisticas?.perda_minima)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tabela de Percentis */}
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-700 mb-3">Percentis da Distribuição</h4>
                      {renderTabelaPercentis()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {abaAtiva === 'distribuicao' && (
                <div className="space-y-6">
                  {/* Gráfico de FDA */}
                  {dadosFDA.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Função de Distribuição Acumulada</CardTitle>
                        <CardDescription>
                          Probabilidade acumulada das perdas
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dadosFDA}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="percentil" />
                              <YAxis />
                              <Tooltip formatter={(v) => formatarMoeda(v)} />
                              <Area 
                                type="monotone" 
                                dataKey="valor" 
                                stroke="#8884d8" 
                                fill="#8884d8" 
                                fillOpacity={0.3}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Gráfico de percentis */}
                  {dadosPercentis.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>VaR por Nível de Confiança</CardTitle>
                        <CardDescription>
                          Value at Risk em diferentes percentis
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dadosPercentis}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="nome" />
                              <YAxis />
                              <Tooltip formatter={(v) => formatarMoeda(v)} />
                              <Bar dataKey="valor" fill="#10B981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-16">
                <div className="text-7xl mb-4 animate-bounce">🎲</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Simulação Monte Carlo
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Configure os parâmetros e execute a simulação para analisar 
                  o risco da carteira
                </p>
                {modeloFrequencia && modeloSeveridade && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg inline-block">
                    <span className="text-sm text-blue-700">
                      {valoresModelos.lambda ? `λ = ${valoresModelos.lambda.toFixed(4)}` : 'λ não encontrado'} • 
                      {valoresModelos.mu ? ` μ = ${formatarMoeda(valoresModelos.mu)}` : ' μ não encontrado'}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}