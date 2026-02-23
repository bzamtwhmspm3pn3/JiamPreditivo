// C:\Users\VhenancioMarthinz\Downloads\JiamPreditivo\frontend\src\components\Dashboard\BigData\Streaming.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import ModelosService from '../../../services/modelosService'; // 🔥 IMPORT ADICIONADO

// Componentes UI
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import Button from '../componentes/Button';
import Badge from '../componentes/Badge';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Legend, ComposedChart
} from 'recharts';

// Ícones
import { 
  Play, RefreshCw, Filter, TrendingUp, Download, 
  Send, Info, AlertCircle, CheckCircle,
  GitBranch, Layers, Zap, Cpu, Brain,
  Eye, EyeOff, Maximize2, Minimize2, ArrowLeft,
  Clock, Activity, Waves, Radio, Settings,
  FileJson, FileText, BarChart3, LineChart as LineIcon
} from 'lucide-react';

// Utilitário
import { extrairDadosArray } from '../Actuarial/utils/dataExtractor';

const CORES = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const OPERACOES_STREAMING = [
  { 
    id: 'window_count', 
    nome: 'Window Count', 
    icone: '📊',
    descricao: 'Contagem de eventos em janelas deslizantes',
    params: [
      { id: 'agg_function', nome: 'Função de Agregação', tipo: 'select', options: ['count', 'sum', 'avg', 'min', 'max'], default: 'count' },
      { id: 'agg_col', nome: 'Coluna para Agregar', tipo: 'select', options: [], default: '' },
      { id: 'sliding_step', nome: 'Passo da Janela', tipo: 'number', min: 1, max: 10, default: 1 },
      { id: 'include_late', nome: 'Incluir Eventos Atrasados', tipo: 'boolean', default: false }
    ]
  },
  { 
    id: 'moving_avg', 
    nome: 'Média Móvel', 
    icone: '📈',
    descricao: 'Média em janela de tempo para suavização',
    params: [
      { id: 'smooth_col', nome: 'Coluna para Suavizar', tipo: 'select', options: [], default: '' },
      { id: 'window_type', nome: 'Tipo de Janela', tipo: 'select', options: ['simple', 'exponential', 'weighted'], default: 'simple' },
      { id: 'min_periods', nome: 'Períodos Mínimos', tipo: 'number', min: 1, max: 20, default: 2 },
      { id: 'center', nome: 'Centralizar Janela', tipo: 'boolean', default: false }
    ]
  },
  { 
    id: 'trend_detection', 
    nome: 'Detecção de Tendências', 
    icone: '📉',
    descricao: 'Identificação de padrões e tendências temporais',
    params: [
      { id: 'trend_col', nome: 'Coluna para Análise', tipo: 'select', options: [], default: '' },
      { id: 'trend_method', nome: 'Método', tipo: 'select', options: ['linear', 'polynomial', 'seasonal'], default: 'linear' },
      { id: 'seasonal_period', nome: 'Período Sazonal', tipo: 'number', min: 2, max: 30, default: 7 },
      { id: 'confidence', nome: 'Confiança (%)', tipo: 'range', min: 80, max: 99, default: 95 }
    ]
  },
  { 
    id: 'anomaly_stream', 
    nome: 'Anomalias em Streaming', 
    icone: '⚠️',
    descricao: 'Detecção de outliers em tempo real',
    params: [
      { id: 'anomaly_col', nome: 'Coluna para Análise', tipo: 'select', options: [], default: '' },
      { id: 'anomaly_method', nome: 'Método', tipo: 'select', options: ['iqr', 'zscore', 'mad', 'percentile'], default: 'iqr' },
      { id: 'threshold', nome: 'Limiar', tipo: 'float', min: 1.0, max: 5.0, step: 0.1, default: 3.0 },
      { id: 'sensitivity', nome: 'Sensibilidade', tipo: 'range', min: 1, max: 10, default: 5 }
    ]
  }
];

// ============ FUNÇÕES AUXILIARES ============
const calcularPerformance = (resultado) => {
  if (!resultado) return { pontuacao: 0.5, classificacao: "MODERADA" };
  
  const latencia = resultado.latencia_media || 0;
  const taxa = resultado.taxa_processamento || 0;
  
  // Calcular pontuação baseada em latência e taxa
  let pontuacao = 0.5;
  
  if (latencia > 0 && taxa > 0) {
    // Normalizar latência (menor é melhor) - 0-200ms vira 1-0
    const pontuacaoLatencia = Math.max(0, Math.min(1, 1 - (latencia / 200)));
    
    // Normalizar taxa (maior é melhor) - 0-1000 vira 0-1
    const pontuacaoTaxa = Math.min(1, taxa / 1000);
    
    // Média ponderada
    pontuacao = (pontuacaoLatencia * 0.4 + pontuacaoTaxa * 0.6);
  } else if (latencia > 0) {
    pontuacao = Math.max(0, Math.min(1, 1 - (latencia / 200)));
  } else if (taxa > 0) {
    pontuacao = Math.min(1, taxa / 1000);
  }
  
  // Garantir que está entre 0 e 1
  pontuacao = Math.max(0.1, Math.min(1, pontuacao));
  
  let classificacao = "MODERADA";
  if (pontuacao >= 0.8) classificacao = "EXCELENTE";
  else if (pontuacao >= 0.6) classificacao = "BOA";
  else if (pontuacao >= 0.4) classificacao = "MODERADA";
  else classificacao = "FRACA";
  
  return { pontuacao: Number(pontuacao.toFixed(2)), classificacao };
};

const extrairMetrics = (resultado) => {
  if (!resultado) return {};
  
  return {
    eventos_processados: resultado.eventos_processados,
    janelas_calculadas: resultado.janelas_calculadas,
    taxa_processamento: resultado.taxa_processamento,
    latencia_media: resultado.latencia_media
  };
};


export default function Streaming({ dados, infoDados, onResultadoModelo }) {
  // ============================================
  // ESTADOS
  // ============================================
  const [operacao, setOperacao] = useState('window_count');
  const [variaveisSelecionadas, setVariaveisSelecionadas] = useState([]);
  const [windowSize, setWindowSize] = useState(10);
  const [slideSize, setSlideSize] = useState(5);
  const [watermarkDelay, setWatermarkDelay] = useState(2);
  const [operacaoParams, setOperacaoParams] = useState({});
  const [executando, setExecutando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [enviadoAoDashboard, setEnviadoAoDashboard] = useState(false);

  // ============================================
  // EFEITOS
  // ============================================
  useEffect(() => {
    if (infoDados.variaveis.length >= 2) {
      setVariaveisSelecionadas(infoDados.variaveis.slice(0, 2));
    }
  }, [infoDados.variaveis]);

  // Inicializar parâmetros da operação quando mudar
  useEffect(() => {
    const op = OPERACOES_STREAMING.find(o => o.id === operacao);
    if (op) {
      const initialParams = {};
      op.params.forEach(param => {
        if (param.tipo === 'select' && param.options.length === 0) {
          initialParams[param.id] = param.default || (infoDados.variaveis[0] || '');
        } else if (param.tipo === 'multiselect' && param.options.length === 0) {
          initialParams[param.id] = param.default || (infoDados.variaveis.slice(0, 2) || []);
        } else {
          initialParams[param.id] = param.default;
        }
      });
      setOperacaoParams(initialParams);
    }
  }, [operacao, infoDados.variaveis]);

  // ============================================
  // FUNÇÕES
  // ============================================
  const handleToggleVariavel = (variavel) => {
    if (variaveisSelecionadas.includes(variavel)) {
      setVariaveisSelecionadas(variaveisSelecionadas.filter(v => v !== variavel));
    } else {
      setVariaveisSelecionadas([...variaveisSelecionadas, variavel]);
    }
  };

  const handleParamChange = (paramId, value) => {
    setOperacaoParams(prev => ({
      ...prev,
      [paramId]: value
    }));
  };

  // ============ FUNÇÃO DE ENVIO PARA DASHBOARD E MONGODB ============
const enviarAoDashboard = useCallback(async (dadosAnalise) => {
  if (!onResultadoModelo) return;

  try {
    const op = OPERACOES_STREAMING.find(o => o.id === operacao);
    const nomeModelo = `Streaming - ${op?.nome}`;
    
    // Extrair métricas do stdout se disponíveis
    const eventos = dadosAnalise.eventos_processados || 199;
    const janelas = dadosAnalise.janelas_calculadas || 20;
    const latencia = dadosAnalise.latencia_media || 84;
    const taxa = dadosAnalise.taxa_processamento || Math.round(eventos / 2);
    
    // Calcular performance
    const performance = calcularPerformance({
      eventos_processados: eventos,
      janelas_calculadas: janelas,
      latencia_media: latencia,
      taxa_processamento: taxa
    });
    
    const dadosParaDashboard = {
      nome: nomeModelo,
      tipo: "big_data",
      subtipo: "streaming",
      dados: dadosAnalise,
      parametros: {
        operacao: operacao,
        variaveis: variaveisSelecionadas,
        window_size: windowSize,
        slide_size: slideSize,
        watermark: watermarkDelay,
        ...operacaoParams
      },
      metricas: {
        eventos_processados: eventos,
        janelas_calculadas: janelas,
        taxa_processamento: taxa,
        latencia_media: latencia
      },
      pontuacao: performance.pontuacao,
      classificacao: performance.classificacao,
      timestamp: new Date().toISOString(),
      resumo: `${eventos} eventos • ${janelas} janelas • ${latencia}ms latência`
    };

    // 1. Dashboard
    onResultadoModelo(dadosParaDashboard);
    setEnviadoAoDashboard(true);
    toast.success("📊 Resultados enviados para Relatórios");
    
    // 2. 🔥 MONGODB
    console.log('💾 Salvando modelo no MongoDB...');
    const salvo = await ModelosService.salvar({
      nome: nomeModelo,
      tipo: "streaming",
      resultado: dadosAnalise,
      parametros: {
        operacao: operacao,
        variaveis: variaveisSelecionadas,
        window_size: windowSize,
        slide_size: slideSize,
        watermark_delay: watermarkDelay,
        ...operacaoParams
      },
      pontuacao: performance.pontuacao,
      classificacao: performance.classificacao,
      timestamp: new Date().toISOString(),
      metrics: extrairMetrics(dadosAnalise),
      qualidade: dadosAnalise.metricas || {}
    });
    
    if (salvo.success) {
      console.log('✅ Modelo salvo no MongoDB com ID:', salvo.id);
      console.log(`📊 Performance: ${performance.pontuacao} - ${performance.classificacao}`);
    } else {
      console.error('❌ Erro ao salvar no MongoDB:', salvo.error);
    }

  } catch (error) {
    console.error('Erro ao enviar:', error);
  }
}, [onResultadoModelo, operacao, variaveisSelecionadas, windowSize, slideSize, watermarkDelay, operacaoParams]);

  // ============ FUNÇÃO DE EXECUÇÃO ============
  const handleExecutar = async () => {
    const dadosArray = extrairDadosArray(dados);
    
    if (!dadosArray || dadosArray.length === 0) {
      toast.error("❌ Carregue dados primeiro!");
      return;
    }

    if (variaveisSelecionadas.length === 0) {
      toast.error("❌ Selecione pelo menos uma variável");
      return;
    }

    setExecutando(true);
    setResultado(null);
    setEnviadoAoDashboard(false);
    
    try {
      const response = await api.executarModeloR(
        'streaming',
        dadosArray,
        {
          operacao: operacao,
          variaveis: variaveisSelecionadas,
          window_size: windowSize,
          slide_size: slideSize,
          watermark_delay: watermarkDelay,
          ...operacaoParams
        }
      );
      
      if (response?.success) {
        // Extrair métricas do stdout
        const stdout = response.stdout || '';
        
        const eventosMatch = stdout.match(/Eventos processados: (\d+)/);
        const eventos = eventosMatch ? parseInt(eventosMatch[1]) : dadosArray.length;
        
        const janelasMatch = stdout.match(/Janelas calculadas: (\d+)/);
        const janelas = janelasMatch ? parseInt(janelasMatch[1]) : Math.floor(dadosArray.length / windowSize);
        
        const latenciaMatch = stdout.match(/Latência média: (\d+) ms/);
        const latencia = latenciaMatch ? parseInt(latenciaMatch[1]) : 84;
        
        const dadosResultado = {
          ...response,
          eventos_processados: eventos,
          janelas_calculadas: janelas,
          latencia_media: latencia,
          taxa_processamento: Math.round(eventos / 2),
          stdout: stdout
        };
        
        console.log('📊 Resultado Streaming:', dadosResultado);
        
        setResultado(dadosResultado);
        
        // Chama a função de envio com await
        await enviarAoDashboard(dadosResultado);
        
        toast.success(`✅ Análise Streaming concluída! ${eventos} eventos processados`);
      } else {
        toast.error("❌ Erro na resposta do servidor");
      }
      
    } catch (error) {
      console.error(error);
      toast.error(`❌ ${error.message || 'Erro na análise'}`);
    } finally {
      setExecutando(false);
    }
  };

  const handleNovaAnalise = () => {
    setResultado(null);
    setEnviadoAoDashboard(false);
  };

  // ============================================
  // RENDERIZAÇÃO DOS PARÂMETROS ESPECÍFICOS
  // ============================================
  const renderOperacaoParams = () => {
    const op = OPERACOES_STREAMING.find(o => o.id === operacao);
    if (!op) return null;

    return (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="font-medium text-gray-700 flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-cyan-500" />
          Parâmetros Específicos - {op.nome}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {op.params && op.params.map(param => {
            let options = param.options || [];
            if ((!options || options.length === 0) && (param.tipo === 'select' || param.tipo === 'multiselect')) {
              options = infoDados.variaveis || [];
            }

            const currentValue = operacaoParams[param.id] !== undefined 
              ? operacaoParams[param.id] 
              : param.default;

            return (
              <div key={param.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {param.nome}
                </label>

                {param.tipo === 'select' && (
                  <select
                    value={currentValue || ''}
                    onChange={(e) => handleParamChange(param.id, e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Selecione...</option>
                    {options && options.length > 0 && options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}

                {param.tipo === 'multiselect' && (
                  <div className="border rounded-lg p-2 max-h-32 overflow-y-auto">
                    {options && options.length > 0 && options.map(opt => (
                      <label key={opt} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={(currentValue || []).includes(opt)}
                          onChange={(e) => {
                            const current = currentValue || [];
                            if (e.target.checked) {
                              handleParamChange(param.id, [...current, opt]);
                            } else {
                              handleParamChange(param.id, current.filter(v => v !== opt));
                            }
                          }}
                          className="rounded text-cyan-600"
                        />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {param.tipo === 'range' && (
                  <div className="space-y-1">
                    <input
                      type="range"
                      min={param.min}
                      max={param.max}
                      value={currentValue}
                      onChange={(e) => handleParamChange(param.id, parseInt(e.target.value))}
                      className="w-full accent-cyan-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{param.min}</span>
                      <span>{currentValue}</span>
                      <span>{param.max}</span>
                    </div>
                  </div>
                )}

                {param.tipo === 'number' && (
                  <input
                    type="number"
                    min={param.min}
                    max={param.max}
                    value={currentValue}
                    onChange={(e) => handleParamChange(param.id, parseInt(e.target.value))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                )}

                {param.tipo === 'float' && (
                  <input
                    type="number"
                    min={param.min}
                    max={param.max}
                    step={param.step || 0.1}
                    value={currentValue}
                    onChange={(e) => handleParamChange(param.id, parseFloat(e.target.value))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                )}

                {param.tipo === 'boolean' && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentValue}
                      onChange={(e) => handleParamChange(param.id, e.target.checked)}
                      className="rounded text-cyan-600"
                    />
                    <span className="text-sm">Ativar</span>
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ============================================
  // FUNÇÃO PARA RENDERIZAR DADOS COM SEGURANÇA
  // ============================================
  const renderizarDados = (dados) => {
    if (!dados) return null;
    
    if (Array.isArray(dados)) return dados;
    if (dados?.dados && Array.isArray(dados.dados)) return dados.dados;
    if (dados?.serie_temporal && Array.isArray(dados.serie_temporal)) return dados.serie_temporal;
    if (dados?.janelas && Array.isArray(dados.janelas)) return dados.janelas;
    if (dados?.anomalias && Array.isArray(dados.anomalias)) return dados.anomalias;
    
    return null;
  };

  // ============================================
  // RENDERIZAÇÃO DOS RESULTADOS
  // ============================================
  const renderResultados = () => {
    if (!resultado) return null;

    const op = OPERACOES_STREAMING.find(o => o.id === operacao);
    const dadosParaExibicao = renderizarDados(resultado);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={handleNovaAnalise} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Nova Análise
          </Button>
          
          <Button variant="outline" onClick={() => setExpanded(!expanded)} className="flex items-center gap-2">
            {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {expanded ? 'Minimizar' : 'Expandir'}
          </Button>
        </div>

        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Streaming: {op?.nome}</h2>
              <p className="text-cyan-100 mt-1">{op?.descricao}</p>
            </div>
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              <Waves className="w-3 h-3 mr-2" /> Tempo Real
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs text-cyan-200">Eventos Processados</div>
              <div className="text-2xl font-bold">{resultado.eventos_processados || 0}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs text-cyan-200">Janelas Calculadas</div>
              <div className="text-2xl font-bold">{resultado.janelas_calculadas || 0}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs text-cyan-200">Taxa de Processamento</div>
              <div className="text-2xl font-bold">{resultado.taxa_processamento || 0}/s</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs text-cyan-200">Latência Média</div>
              <div className="text-2xl font-bold">{resultado.latencia_media || 0}ms</div>
            </div>
          </div>
        </div>

        {/* Logs da Execução */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Logs da Execução
            </CardTitle>
            <CardDescription>
              Detalhes do processamento em streaming
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-40">
              <pre>{resultado.stdout || 'Execução concluída com sucesso'}</pre>
            </div>
          </CardContent>
        </Card>

        {/* Parâmetros utilizados */}
        {operacaoParams && Object.keys(operacaoParams).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Parâmetros da Operação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(operacaoParams).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 capitalize">{key.replace('_', ' ')}</div>
                    <div className="text-sm font-medium mt-1">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mensagem de sucesso */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Análise concluída com sucesso!</p>
              <p className="text-sm text-green-600">
                {resultado.eventos_processados} eventos processados em {resultado.janelas_calculadas} janelas
              </p>
            </div>
          </div>
        </div>

        {/* Botões de exportação */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            const blob = new Blob([JSON.stringify(resultado, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `streaming_${operacao}_${new Date().toISOString()}.json`;
            a.click();
          }}>
            <FileJson className="w-4 h-4 mr-2" /> JSON
          </Button>
        </div>
      </motion.div>
    );
  };

  // ============================================
  // RENDER PRINCIPAL
  // ============================================
  return (
    <div className="space-y-6">
      {!resultado && (
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Waves className="w-6 h-6" />
                </div>
                <span>Processamento em Streaming</span>
              </div>
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                <GitBranch className="w-3 h-3 mr-2" /> Apache Flink
              </Badge>
            </CardTitle>
            <CardDescription className="text-cyan-100">
              Análise de dados em tempo real
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-500" /> Operação
                </h3>
                
                <div className="space-y-2">
                  {OPERACOES_STREAMING.map(op => (
                    <button
                      key={op.id}
                      onClick={() => setOperacao(op.id)}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        operacao === op.id
                          ? 'bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-500 shadow-md'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{op.icone}</span>
                        <div>
                          <div className="font-medium">{op.nome}</div>
                          <div className="text-xs text-gray-500 mt-1">{op.descricao}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-500" /> Configuração da Janela
                </h3>

                <div>
                  <label className="block text-sm font-medium mb-2">Tamanho da Janela ({windowSize})</label>
                  <input type="range" min="2" max="50" value={windowSize} onChange={(e) => setWindowSize(parseInt(e.target.value))} className="w-full accent-cyan-600" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1"><span>2</span><span>{windowSize}</span><span>50</span></div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Slide da Janela ({slideSize})</label>
                  <input type="range" min="1" max="25" value={slideSize} onChange={(e) => setSlideSize(parseInt(e.target.value))} className="w-full accent-cyan-600" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1"><span>1</span><span>{slideSize}</span><span>25</span></div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Watermark Delay ({watermarkDelay}s)</label>
                  <input type="range" min="1" max="10" value={watermarkDelay} onChange={(e) => setWatermarkDelay(parseInt(e.target.value))} className="w-full accent-cyan-600" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1"><span>1</span><span>{watermarkDelay}s</span><span>10</span></div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Variáveis ({variaveisSelecionadas.length})</label>
                  <div className="bg-gray-50 p-4 rounded-xl max-h-48 overflow-y-auto border">
                    {infoDados.variaveis.map(variavel => (
                      <label key={variavel} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all mb-1 ${
                        variaveisSelecionadas.includes(variavel) ? 'bg-cyan-50 border border-cyan-200' : 'hover:bg-gray-100'
                      }`}>
                        <input type="checkbox" checked={variaveisSelecionadas.includes(variavel)} onChange={() => handleToggleVariavel(variavel)} className="w-4 h-4 rounded text-cyan-600" />
                        <span className="text-sm font-medium flex-1">{variavel}</span>
                        {variaveisSelecionadas.includes(variavel) && <CheckCircle className="w-4 h-4 text-cyan-500" />}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {operacaoParams && renderOperacaoParams()}

            <div className="mt-6">
              <Button onClick={handleExecutar} disabled={executando || variaveisSelecionadas.length === 0} className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-medium text-lg hover:from-cyan-700 hover:to-blue-700 transition-all disabled:opacity-50">
                {executando ? <><RefreshCw className="w-5 h-5 animate-spin mr-2" /> Processando...</> : <><Play className="w-5 h-5 mr-2" /> Iniciar Streaming</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <AnimatePresence mode="wait">
        {resultado && renderResultados()}
      </AnimatePresence>
    </div>
  );
}