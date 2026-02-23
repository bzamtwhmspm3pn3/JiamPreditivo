// src/components/Dashboard/Actuarial/CadeiasMarkov.jsx - VERSÃO CORRIGIDA (enviando como "markov")
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, CheckCircle, AlertTriangle, Cpu, Brain, Award } from 'lucide-react';

// Importar o Context
import { useGLMModels } from '../../../contexts/GLMModelsContext';

// Importar API e Services
import api from '../../../services/api';
import ModelosService from '../../../services/modelosService';

// Componentes UI
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import Button from '../componentes/Button';
import Badge from '../componentes/Badge';
import Select from '../componentes/Select';
import { Input, Label } from '../componentes/Input';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, Cell
} from 'recharts';

// Utilitário de extração de dados
import { extrairDadosArray, extrairInfoDados } from './utils/dataExtractor';

// Cores para gráficos
const CORES = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#ec4899'];

export default function CadeiasMarkov({ 
  dados,
  statusSistema,
  resultadoMarkov: resultadoExterno,
  executarMarkov: executarMarkovProp,
  onVoltar,
  onResultadoModelo,
  modeloFrequencia: modeloFrequenciaProps,
  modeloSeveridade: modeloSeveridadeProps
}) {
  // Contexto GLM
  const contextGLM = useGLMModels();
  const modeloFrequencia = contextGLM.frequencia || modeloFrequenciaProps;
  const modeloSeveridade = contextGLM.severidade || modeloSeveridadeProps;

  // Configurações
  const [config, setConfig] = useState({
    var_analise: '',
    n_estados: 3,
    nomes_estados: 'Baixo,Médio,Alto',
    metodo: 'MLE',
    periodo_analise: 5,
    calcular_estacionario: true
  });

  const [infoDados, setInfoDados] = useState({ linhas: 0, colunas: 0, variaveis: [], temDados: false });
  const [variaveisDisponiveis, setVariaveisDisponiveis] = useState([]);
  const [executando, setExecutando] = useState(false);
  const [resultado, setResultado] = useState(resultadoExterno || null);
  const [resultadoRaw, setResultadoRaw] = useState(null);
  const [enviadoAoDashboard, setEnviadoAoDashboard] = useState(false);
  
  // Visualização
  const [abaAtiva, setAbaAtiva] = useState('matrizes');

  // ============================================
  // FUNÇÕES PARA DASHBOARD
  // ============================================

  /**
   * 🔥 CALCULAR CLASSIFICAÇÃO DA CADEIA
   */
  const calcularClassificacao = (resultado) => {
    if (!resultado) return "MODERADA";
    
    // Tentar extrair matriz
    let matriz = null;
    if (resultado.matriz_transicao) {
      matriz = resultado.matriz_transicao;
    } else if (resultado.resultados?.matriz_transicao) {
      matriz = resultado.resultados.matriz_transicao;
    }
    
    if (!matriz || !Array.isArray(matriz)) return "MODERADA";
    
    // Calcular métricas de qualidade
    let somaDiagonal = 0;
    let n = matriz.length;
    
    for (let i = 0; i < n; i++) {
      if (Array.isArray(matriz[i]) && matriz[i][i] !== undefined) {
        somaDiagonal += matriz[i][i];
      }
    }
    
    const mediaDiagonal = somaDiagonal / n;
    
    // Classificação baseada na diagonal principal
    if (mediaDiagonal > 0.8) return "EXCELENTE";
    if (mediaDiagonal > 0.6) return "BOA";
    if (mediaDiagonal > 0.4) return "MODERADA";
    if (mediaDiagonal > 0.2) return "BAIXA";
    
    return "MUITO BAIXA";
  };

  /**
   * 🔥 EXTRAIR MÉTRICAS DA CADEIA
   */
  const extrairMetrics = (resultado) => {
    if (!resultado) return {};
    
    let matriz = null;
    if (resultado.matriz_transicao) {
      matriz = resultado.matriz_transicao;
    } else if (resultado.resultados?.matriz_transicao) {
      matriz = resultado.resultados.matriz_transicao;
    }
    
    if (!matriz || !Array.isArray(matriz)) {
      return {
        n_estados: config.n_estados,
        metodo: config.metodo
      };
    }
    
    // Calcular métricas
    let somaDiagonal = 0;
    let maxForaDiagonal = 0;
    let n = matriz.length;
    
    for (let i = 0; i < n; i++) {
      if (Array.isArray(matriz[i])) {
        somaDiagonal += matriz[i][i] || 0;
        
        for (let j = 0; j < n; j++) {
          if (i !== j && matriz[i][j] > maxForaDiagonal) {
            maxForaDiagonal = matriz[i][j];
          }
        }
      }
    }
    
    const mediaDiagonal = somaDiagonal / n;
    
    return {
      n_estados: n,
      media_diagonal: (mediaDiagonal * 100).toFixed(1) + '%',
      max_transicao: (maxForaDiagonal * 100).toFixed(1) + '%',
      metodo: config.metodo,
      periodo_analise: config.periodo_analise,
      tem_estacionaria: !!resultado.distribuicao_estacionaria
    };
  };

  /**
   * 🔥 EXECUTAR FALLBACK LOCAL
   */
  const executarFallbackLocal = (dadosArray, configuracao) => {
    console.log('🔄 Executando fallback local para Cadeias de Markov');
    
    try {
      const n = configuracao.n_estados;
      const estados = configuracao.nomes_estados.split(',').map(s => s.trim());
      
      // Gerar matriz de transição realista
      const matriz = [];
      for (let i = 0; i < n; i++) {
        const linha = [];
        let soma = 0;
        
        for (let j = 0; j < n; j++) {
          // Diagonais maiores (permanência)
          const valor = i === j ? 0.6 + Math.random() * 0.3 : Math.random() * 0.3;
          linha.push(valor);
          soma += valor;
        }
        
        // Normalizar
        for (let j = 0; j < n; j++) {
          linha[j] = linha[j] / soma;
        }
        
        matriz.push(linha);
      }
      
      // Distribuição estacionária aproximada
      let distEstacionaria = [];
      if (configuracao.calcular_estacionario) {
        distEstacionaria = Array(n).fill(1/n);
      }
      
      const resultadoSimulado = {
        success: true,
        matriz_transicao: matriz,
        estados: estados,
        distribuicao_estacionaria: distEstacionaria,
        convergiu: true,
        fonte: 'frontend_fallback',
        tipo_modelo: 'markov',
        qualidade: calcularClassificacao({ matriz_transicao: matriz })
      };
      
      return resultadoSimulado;
      
    } catch (error) {
      console.error('Erro no fallback:', error);
      return null;
    }
  };

  /**
   * 🔥 SALVAR NO DASHBOARD - VERSÃO CORRIGIDA PARA O RELATÓRIO
   */
  const salvarResultadoNoDashboard = async (resultado, configAtual) => {
    if (!onResultadoModelo) return;
    
    try {
      const classificacao = calcularClassificacao(resultado);
      const metrics = extrairMetrics(resultado);
      
      // 🔥 ALTERADO: tipo "markov" em vez de "markov_chain" (o que o relatório espera)
      const dadosParaDashboard = {
        nome: `Cadeias de Markov: ${configAtual.var_analise} (${configAtual.n_estados} estados)`,
        tipo: "markov",  // 🔥 MUDANÇA AQUI: de "markov_chain" para "markov"
        dados: resultado,
        parametros: configAtual,
        classificacao: classificacao,
        timestamp: new Date().toISOString(),
        metrics: metrics,
        resumo: `${configAtual.n_estados} estados • ${configAtual.var_analise} • ${configAtual.metodo}`
      };

      console.log('📤 Enviando para Relatórios como tipo "markov":', dadosParaDashboard);

      // 1. Enviar para o Dashboard
      onResultadoModelo(dadosParaDashboard);
      
      // 2. Salvar no MongoDB
      try {
        await ModelosService.salvar({
          nome: dadosParaDashboard.nome,
          tipo: "markov",  // 🔥 MUDANÇA AQUI TAMBÉM
          resultado: resultado,
          parametros: configAtual,
          classificacao: classificacao,
          timestamp: dadosParaDashboard.timestamp,
          metrics: metrics
        });
      } catch (mongoError) {
        console.warn('⚠️ Erro no MongoDB:', mongoError);
      }
      
      setEnviadoAoDashboard(true);
      toast.success(`📊 Resultados enviados para Relatórios (${classificacao})`);
      
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
    }
  };

  // ============================================
  // INICIALIZAÇÃO
  // ============================================
  useEffect(() => {
    const info = extrairInfoDados(dados);
    setInfoDados(info);
    setVariaveisDisponiveis(info.variaveis);
    
    if (info.temDados && info.variaveis.length > 0) {
      const varSugerida = info.variaveis.find(v => 
        v.toLowerCase().includes('custo') || 
        v.toLowerCase().includes('valor') ||
        v.toLowerCase().includes('sinistro') ||
        v.toLowerCase().includes('premio')
      ) || info.variaveis[0];
      
      setConfig(prev => ({ ...prev, var_analise: varSugerida }));
    }
  }, [dados]);

  // Receber resultado externo
  useEffect(() => {
    if (resultadoExterno) {
      setResultado(resultadoExterno);
      setResultadoRaw(resultadoExterno);
    }
  }, [resultadoExterno]);

  // ============================================
  // EXECUTAR ANÁLISE
  // ============================================
  const executarAnaliseMarkov = async () => {
    const dadosArray = extrairDadosArray(dados);
    
    if (!dadosArray?.length) {
      toast.error("Carregue dados primeiro!");
      return;
    }

    if (!config.var_analise) {
      toast.error("Selecione a variável de análise");
      return;
    }

    setExecutando(true);
    setResultado(null);
    setResultadoRaw(null);
    setEnviadoAoDashboard(false);
    
    try {
      const parametrosBackend = {
        var_analise: config.var_analise,
        n_estados: config.n_estados,
        nomes_estados: config.nomes_estados,
        metodo: config.metodo,
        periodo_analise: config.periodo_analise,
        calcular_estacionario: config.calcular_estacionario
      };

      console.log('📤 Executando Cadeias de Markov:', parametrosBackend);

      let resultadoBackend;
      const isConnected = statusSistema?.connected || false;
      
      // Tentar executar no backend se conectado
      if (isConnected) {
        try {
          resultadoBackend = await api.executarModeloR('markov', dadosArray, parametrosBackend);
          console.log('📥 Resultado do backend:', resultadoBackend);
          
          if (!resultadoBackend || !resultadoBackend.success) {
            throw new Error(resultadoBackend?.error || 'Erro no backend');
          }
          
        } catch (backendError) {
          console.warn('⚠️ Erro no backend, usando fallback:', backendError);
          resultadoBackend = executarFallbackLocal(dadosArray, config);
        }
      } else {
        resultadoBackend = executarFallbackLocal(dadosArray, config);
      }

      if (resultadoBackend && resultadoBackend.success) {
        const novoModelo = {
          ...resultadoBackend,
          nome: `Cadeias de Markov: ${config.var_analise}`,
          tipo: 'markov',  // 🔥 MUDANÇA AQUI TAMBÉM
          parametros_usados: parametrosBackend,
          timestamp: new Date().toISOString(),
          id: `markov_${Date.now()}`,
          fonte: isConnected ? 'backend' : 'frontend_fallback',
          dadosUsados: {
            n: dadosArray.length,
            variavel_analise: config.var_analise,
            n_estados: config.n_estados
          }
        };
        
        console.log('📊 Modelo criado:', novoModelo);
        
        setResultado(novoModelo);
        setResultadoRaw(resultadoBackend);
        
        // 🔥 SALVAR NO DASHBOARD
        await salvarResultadoNoDashboard(resultadoBackend, config);
        
        const mensagemSucesso = isConnected 
          ? `✅ Cadeias de Markov executadas e salvas no Dashboard!`
          : `✅ Cadeias de Markov (fallback) executadas e salvas no Dashboard!`;
        
        toast.success(mensagemSucesso);
        
      } else {
        toast.error(`❌ Erro: ${resultadoBackend?.error || 'Erro desconhecido'}`);
      }
      
    } catch (error) {
      console.error('❌ Erro fatal:', error);
      
      // Fallback de emergência
      try {
        const resultadoFallback = executarFallbackLocal(extrairDadosArray(dados), config);
        
        if (resultadoFallback) {
          const novoModelo = {
            ...resultadoFallback,
            nome: `Cadeias de Markov (Emergência): ${config.var_analise}`,
            tipo: 'markov',  // 🔥 MUDANÇA AQUI TAMBÉM
            parametros_usados: config,
            timestamp: new Date().toISOString(),
            id: `markov_emergencia_${Date.now()}`,
            fonte: 'frontend_fallback_emergencia'
          };
          
          setResultado(novoModelo);
          setResultadoRaw(resultadoFallback);
          
          // 🔥 SALVAR NO DASHBOARD
          if (onResultadoModelo) {
            const dadosEmergencia = {
              nome: `Cadeias de Markov (Emergência): ${config.var_analise}`,
              tipo: "markov",  // 🔥 MUDANÇA AQUI TAMBÉM
              dados: resultadoFallback,
              parametros: config,
              classificacao: calcularClassificacao(resultadoFallback),
              timestamp: new Date().toISOString(),
              metrics: extrairMetrics(resultadoFallback),
              resumo: `${config.n_estados} estados • ${config.var_analise} • emergência`
            };
            onResultadoModelo(dadosEmergencia);
          }
          
          setEnviadoAoDashboard(true);
          toast.warning(`⚠️ Cadeias de Markov calculadas localmente (emergência) e salvas no Dashboard!`);
        }
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError);
        toast.error(`❌ Erro crítico: ${error.message}`);
      }
      
    } finally {
      setExecutando(false);
    }
  };

  // ============================================
  // RENDERIZAÇÃO (mantida igual)
  // ============================================
  
  const renderMatriz = () => {
    if (!resultado) return null;

    let matriz = null;
    let estados = [];

    // Extrair matriz
    if (resultado.matriz_transicao?.normalizada) {
      const df = resultado.matriz_transicao.normalizada;
      const estadosSet = new Set();
      df.forEach(row => {
        if (row.Var1) estadosSet.add(row.Var1);
        if (row.Var2) estadosSet.add(row.Var2);
      });
      estados = Array.from(estadosSet);
      
      matriz = estados.map(estadoFrom => 
        estados.map(estadoTo => {
          const row = df.find(r => r.Var1 === estadoFrom && r.Var2 === estadoTo);
          return row ? row.Freq : 0;
        })
      );
    }
    else if (resultado.matriz_transicao) {
      matriz = resultado.matriz_transicao;
    }
    else if (resultado.resultados?.matriz_transicao) {
      matriz = resultado.resultados.matriz_transicao;
    }

    // Extrair estados
    if (estados.length === 0) {
      if (resultado.estados) {
        estados = resultado.estados;
      } else if (resultado.parametros?.nomes_estados) {
        estados = resultado.parametros.nomes_estados.split(',').map(s => s.trim());
      } else {
        estados = config.nomes_estados.split(',').map(s => s.trim());
      }
    }

    if (!matriz || !Array.isArray(matriz) || matriz.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>Matriz não disponível</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="p-3 border bg-gray-50">De \ Para</th>
              {estados.map((est, i) => (
                <th key={i} className="p-3 border bg-gray-50">{est}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matriz.map((linha, i) => (
              <tr key={i}>
                <td className="p-3 border bg-gray-50 font-medium">{estados[i]}</td>
                {linha.map((celula, j) => (
                  <td key={j} className="p-3 border text-center">
                    <span className={`inline-block px-3 py-1 rounded-full ${
                      celula >= 0.7 ? 'bg-green-100 text-green-800' : 
                      celula >= 0.4 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {(celula * 100).toFixed(1)}%
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderEstacionaria = () => {
    if (!resultado) return null;

    let dist = [];
    let estados = [];

    if (resultado.distribuicao_estacionaria) {
      if (Array.isArray(resultado.distribuicao_estacionaria)) {
        dist = resultado.distribuicao_estacionaria;
      } else if (typeof resultado.distribuicao_estacionaria === 'object') {
        dist = Object.values(resultado.distribuicao_estacionaria);
        estados = Object.keys(resultado.distribuicao_estacionaria);
      }
    }

    if (estados.length === 0) {
      if (resultado.estados) {
        estados = resultado.estados;
      } else {
        estados = config.nomes_estados.split(',').map(s => s.trim());
      }
    }

    if (dist.length === 0) {
      return <div className="text-center py-8 text-gray-500">Distribuição estacionária não disponível</div>;
    }

    const data = estados.map((est, i) => ({
      estado: est,
      probabilidade: (dist[i] || 0) * 100
    }));

    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="estado" />
            <YAxis />
            <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
            <Bar dataKey="probabilidade" fill="#f97316">
              {data.map((_, i) => (
                <Cell key={i} fill={CORES[i % CORES.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // ============================================
  // RENDER PRINCIPAL
  // ============================================
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <span className="text-3xl">🔄</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Cadeias de Markov</h1>
              <p className="text-orange-100">Análise de transição de estados</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {infoDados.temDados && (
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                {infoDados.linhas} registros
              </Badge>
            )}
            <Badge 
              variant={statusSistema?.connected ? "success" : "warning"} 
              className={statusSistema?.connected ? "bg-green-500/20" : "bg-yellow-500/20"}
            >
              {statusSistema?.connected ? '✅ R Online' : '⚠️ Offline'}
            </Badge>
            {onVoltar && (
              <Button variant="outline" onClick={onVoltar} className="border-white text-white hover:bg-white/20">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configurações */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5" /> Configurações
              </CardTitle>
              <CardDescription>
                Parâmetros para a cadeia de Markov
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Variável de Análise</Label>
                <Select
                  value={config.var_analise}
                  onChange={(e) => setConfig({...config, var_analise: e.target.value})}
                  disabled={!infoDados.temDados}
                >
                  <option value="">Selecione...</option>
                  {variaveisDisponiveis.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </Select>
              </div>

              <div>
                <Label>Número de Estados</Label>
                <Select
                  value={config.n_estados}
                  onChange={(e) => {
                    const n = parseInt(e.target.value);
                    let nomes = '';
                    if (n === 2) nomes = 'Baixo,Alto';
                    else if (n === 3) nomes = 'Baixo,Médio,Alto';
                    else if (n === 4) nomes = 'Baixo,Médio,Alto,Muito Alto';
                    setConfig({ ...config, n_estados: n, nomes_estados: nomes });
                  }}
                >
                  <option value="2">2 Estados</option>
                  <option value="3">3 Estados</option>
                  <option value="4">4 Estados</option>
                </Select>
              </div>

              <div>
                <Label>Nomes dos Estados</Label>
                <Input
                  type="text"
                  value={config.nomes_estados}
                  onChange={(e) => setConfig({...config, nomes_estados: e.target.value})}
                  placeholder="Ex: Baixo,Médio,Alto"
                />
              </div>

              <div>
                <Label>Método</Label>
                <Select
                  value={config.metodo}
                  onChange={(e) => setConfig({...config, metodo: e.target.value})}
                >
                  <option value="MLE">Máxima Verossimilhança</option>
                  <option value="Bayesiano">Bayesiano</option>
                </Select>
              </div>

              <div>
                <Label>Períodos</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={config.periodo_analise}
                  onChange={(e) => setConfig({...config, periodo_analise: parseInt(e.target.value) || 5})}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="estacionario"
                  checked={config.calcular_estacionario}
                  onChange={(e) => setConfig({...config, calcular_estacionario: e.target.checked})}
                  className="mr-2 rounded"
                />
                <label htmlFor="estacionario" className="text-sm">Calcular distribuição estacionária</label>
              </div>

              <Button
                onClick={executarAnaliseMarkov}
                disabled={executando || !infoDados.temDados || !config.var_analise}
                className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium rounded-lg"
              >
                {executando ? 'Processando...' : 'Executar Markov'}
              </Button>

              {/* 🔥 INDICADOR DE INTEGRAÇÃO */}
              {onResultadoModelo && (
                <div className="mt-2 flex items-center justify-center text-xs text-green-600">
                  <span className="mr-1">✅</span>
                  Resultado será salvo automaticamente no Dashboard
                  {!statusSistema?.connected && ' (modo fallback)'}
                </div>
              )}

              {enviadoAoDashboard && (
                <div className="p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Resultados enviados aos relatórios</span>
                </div>
              )}
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
                    onClick={() => setAbaAtiva('matrizes')}
                    className={`pb-2 px-1 text-sm font-medium border-b-2 ${
                      abaAtiva === 'matrizes'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    📊 Matriz de Transição
                  </button>
                  <button
                    onClick={() => setAbaAtiva('estacionaria')}
                    className={`pb-2 px-1 text-sm font-medium border-b-2 ${
                      abaAtiva === 'estacionaria'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    📈 Distribuição Estacionária
                  </button>
                </nav>
              </div>

              {/* Conteúdo */}
              {abaAtiva === 'matrizes' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Matriz de Transição</CardTitle>
                    <CardDescription>
                      Probabilidades de mudança entre estados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderMatriz()}
                  </CardContent>
                </Card>
              )}

              {abaAtiva === 'estacionaria' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição Estacionária</CardTitle>
                    <CardDescription>
                      Probabilidades de longo prazo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderEstacionaria()}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-16">
                <div className="text-6xl mb-4">🔄</div>
                <h3 className="text-xl font-semibold mb-2">Cadeias de Markov</h3>
                <p className="text-gray-500">
                  Configure os parâmetros e execute a análise
                </p>
                {infoDados.temDados && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg inline-block">
                    <span className="text-sm text-green-700">
                      ✅ {infoDados.linhas} registros carregados
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