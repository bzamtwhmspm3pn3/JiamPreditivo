// C:\Users\VhenancioMarthinz\Downloads\JiamPreditivo\frontend\src\components\Dashboard\DataMining\Anomalias.jsx
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
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ZAxis, Cell,
  BarChart, Bar, LineChart, Line
} from 'recharts';

// Ícones
import { 
  Play, RefreshCw, Filter, TrendingUp, Download, 
  Send, Info, AlertCircle, CheckCircle,
  GitBranch, Layers, Zap, Cpu, Brain,
  Eye, EyeOff, Maximize2, Minimize2, ArrowLeft,
  AlertTriangle, Shield, Activity, PieChart as PieIcon
} from 'lucide-react';

// Utilitário
import { extrairDadosArray } from '../Actuarial/utils/dataExtractor';

const CORES = [
  '#3B82F6', // azul - normal
  '#EF4444', // vermelho - anomalia
  '#F59E0B', '#10B981', '#8B5CF6', '#EC4899'
];

const ALGORITMOS_CONFIG = {
  isolation_forest: {
    nome: 'Isolation Forest',
    icone: '🌲',
    descricao: 'Isola anomalias através de partições aleatórias',
    pacote: 'isotree',
    metricas: ['n_anomalias', 'taxa_anomalias', 'threshold'],
    graficos: ['scatter', 'scores'],
    params: [
      { 
        id: 'contamination', 
        nome: 'Contaminação', 
        tipo: 'float', 
        min: 0.01, 
        max: 0.5, 
        step: 0.01,
        default: 0.1,
        descricao: 'Proporção esperada de anomalias (0.01 = 1%)'
      },
      { 
        id: 'n_trees', 
        nome: 'Número de Árvores', 
        tipo: 'number', 
        min: 10, 
        max: 500,
        step: 10,
        default: 100,
        descricao: 'Quantidade de árvores na floresta'
      }
    ]
  },
  lof: {
    nome: 'LOF',
    icone: '📊',
    descricao: 'Local Outlier Factor - baseado em densidade local',
    pacote: 'dbscan',
    metricas: ['n_anomalias', 'taxa_anomalias', 'threshold'],
    graficos: ['scatter', 'scores'],
    params: [
      { 
        id: 'k', 
        nome: 'Número de Vizinhos (k)', 
        tipo: 'number', 
        min: 5, 
        max: 50,
        default: 20,
        descricao: 'Vizinhos considerados para cálculo de densidade'
      },
      { 
        id: 'contamination', 
        nome: 'Contaminação', 
        tipo: 'float', 
        min: 0.01, 
        max: 0.5, 
        step: 0.01,
        default: 0.1,
        descricao: 'Proporção esperada de anomalias'
      }
    ]
  },
  one_class_svm: {
    nome: 'One-Class SVM',
    icone: '🎯',
    descricao: 'Máquina de vetores de suporte para uma classe',
    pacote: 'e1071',
    metricas: ['n_anomalias', 'taxa_anomalias', 'n_support_vectors'],
    graficos: ['scatter'],
    params: [
      { 
        id: 'nu', 
        nome: 'Nu (ν)', 
        tipo: 'float', 
        min: 0.01, 
        max: 0.5, 
        step: 0.01,
        default: 0.1,
        descricao: 'Limite superior de anomalias e inferior de vetores de suporte'
      },
      { 
        id: 'kernel', 
        nome: 'Kernel', 
        tipo: 'select',
        options: [
          { value: 'radial', label: 'Radial' },
          { value: 'linear', label: 'Linear' },
          { value: 'polynomial', label: 'Polinomial' },
          { value: 'sigmoid', label: 'Sigmoid' }
        ],
        default: 'radial',
        descricao: 'Função de kernel para transformação'
      },
      { 
        id: 'gamma', 
        nome: 'Gamma', 
        tipo: 'float', 
        min: 0.01, 
        max: 1,
        step: 0.01,
        default: 0.1,
        descricao: 'Parâmetro do kernel radial'
      }
    ]
  }
};

// ============ FUNÇÕES AUXILIARES ============
const calcularClassificacao = (resultado, algoritmo) => {
  if (!resultado) return "MODERADA";
  
  const taxaAnomalias = resultado.taxa_anomalias || 0;
  const nAnomalias = resultado.n_anomalias || 0;
  const total = resultado.pontos?.length || resultado.n_total || 0;
  
  // Quanto menor a taxa de anomalias (dentro do esperado), melhor
  if (algoritmo === 'isolation_forest' || algoritmo === 'lof') {
    const contaminationEsperada = resultado.contamination || 0.1;
    const diferenca = Math.abs(taxaAnomalias - contaminationEsperada);
    
    if (diferenca < 0.02) return "EXCELENTE";
    if (diferenca < 0.05) return "BOA";
    if (diferenca < 0.1) return "MODERADA";
    return "FRACA";
  }
  
  if (algoritmo === 'one_class_svm') {
    if (taxaAnomalias < 0.15 && nAnomalias > 0) return "EXCELENTE";
    if (taxaAnomalias < 0.25) return "BOA";
    if (taxaAnomalias < 0.35) return "MODERADA";
    return "FRACA";
  }
  
  return "MODERADA";
};

const extrairMetrics = (resultado, algoritmo) => {
  if (!resultado) return {};
  
  return {
    n_anomalias: resultado.n_anomalias,
    taxa_anomalias: resultado.taxa_anomalias,
    threshold: resultado.threshold,
    n_support_vectors: resultado.n_support_vectors,
    n_total: resultado.pontos?.length || resultado.n_total,
    scores_summary: resultado.scores_summary,
    contamination: resultado.contamination
  };
};

export default function Anomalias({ dados, infoDados, onResultadoModelo }) {
  // ============================================
  // ESTADOS
  // ============================================
  const [algoritmo, setAlgoritmo] = useState('isolation_forest');
  const [parametros, setParametros] = useState({});
  const [variaveisSelecionadas, setVariaveisSelecionadas] = useState([]);
  const [executando, setExecutando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [enviadoAoDashboard, setEnviadoAoDashboard] = useState(false);

  // ============================================
  // EFEITOS
  // ============================================
  useEffect(() => {
    const config = ALGORITMOS_CONFIG[algoritmo];
    const paramsIniciais = {};
    config.params.forEach(p => {
      paramsIniciais[p.id] = p.default;
    });
    setParametros(paramsIniciais);
  }, [algoritmo]);

  useEffect(() => {
    if (infoDados.variaveis.length >= 2) {
      setVariaveisSelecionadas(infoDados.variaveis.slice(0, 2));
    }
  }, [infoDados.variaveis]);

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
    setParametros(prev => ({
      ...prev,
      [paramId]: value
    }));
  };

  // ============ FUNÇÃO DE ENVIO PARA DASHBOARD E MONGODB ============
  const enviarAoDashboard = useCallback(async (dadosAnalise) => {
    if (!onResultadoModelo) return;

    try {
      const config = ALGORITMOS_CONFIG[algoritmo];
      
      const nomeModelo = `Anomalias - ${config.nome} (${variaveisSelecionadas.length} variáveis)`;
      
      const dadosParaDashboard = {
        nome: nomeModelo,
        tipo: "data_mining",
        dados: dadosAnalise,
        categoria: 'anomalias',
        algoritmo: algoritmo,
        parametros: {
          ...parametros,
          variaveis: variaveisSelecionadas
        },
        metricas: {
          n_anomalias: dadosAnalise.n_anomalias,
          taxa_anomalias: dadosAnalise.taxa_anomalias,
          threshold: dadosAnalise.threshold
        },
        timestamp: new Date().toISOString(),
        resumo: `${dadosAnalise.n_anomalias} anomalias • ${(dadosAnalise.taxa_anomalias * 100).toFixed(1)}% dos dados`
      };

      // 1. Dashboard
      onResultadoModelo(dadosParaDashboard);
      setEnviadoAoDashboard(true);
      toast.success("📊 Resultados enviados para Relatórios");
      
      // 2. 🔥 MONGODB
      console.log('💾 Salvando modelo no MongoDB...');
      const salvo = await ModelosService.salvar({
        nome: nomeModelo,
        tipo: algoritmo,
        resultado: dadosAnalise,
        parametros: {
          ...parametros,
          variaveis: variaveisSelecionadas
        },
        classificacao: calcularClassificacao(dadosAnalise, algoritmo),
        timestamp: new Date().toISOString(),
        metrics: extrairMetrics(dadosAnalise, algoritmo),
        qualidade: dadosAnalise.metricas || {}
      });
      
      if (salvo.success) {
        console.log('✅ Modelo salvo no MongoDB com ID:', salvo.id);
      } else {
        console.error('❌ Erro ao salvar no MongoDB:', salvo.error);
      }

    } catch (error) {
      console.error('Erro ao enviar:', error);
    }
  }, [onResultadoModelo, algoritmo, parametros, variaveisSelecionadas]);

  // ============ FUNÇÃO DE EXECUÇÃO ============
  const handleExecutar = async () => {
    const dadosArray = extrairDadosArray(dados);
    
    if (!dadosArray || dadosArray.length === 0) {
      toast.error("❌ Carregue dados primeiro!");
      return;
    }

    if (variaveisSelecionadas.length < 2) {
      toast.error("❌ Selecione pelo menos 2 variáveis");
      return;
    }

    setExecutando(true);
    setResultado(null);
    setEnviadoAoDashboard(false);
    
    try {
      const response = await api.executarModeloR(
        'anomalias',
        dadosArray,
        {
          algoritmo: algoritmo,
          variaveis: variaveisSelecionadas,
          ...parametros
        }
      );
      
      if (response?.success) {
        const dadosResultado = response.resultado;
        console.log('📊 Resultado:', dadosResultado);
        
        setResultado(dadosResultado);
        
        // Chama a função de envio com await
        await enviarAoDashboard(dadosResultado);
        
        toast.success("✅ Análise concluída!");
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
  // RENDERIZAÇÃO DOS PARÂMETROS
  // ============================================
  const renderParametros = () => {
    const config = ALGORITMOS_CONFIG[algoritmo];
    
    return config.params.map(param => (
      <div key={param.id} className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            {param.nome}
          </label>
          {param.descricao && (
            <span className="text-xs text-gray-400" title={param.descricao}>
              <Info className="w-3 h-3" />
            </span>
          )}
        </div>
        
        {param.tipo === 'range' && (
          <div className="space-y-1">
            <input
              type="range"
              min={param.min}
              max={param.max}
              step={param.step || 1}
              value={parametros[param.id] || param.default}
              onChange={(e) => handleParamChange(param.id, parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{param.min}</span>
              <span className="font-medium text-red-600">
                {parametros[param.id] || param.default}
              </span>
              <span>{param.max}</span>
            </div>
          </div>
        )}

        {param.tipo === 'float' && (
          <input
            type="number"
            min={param.min}
            max={param.max}
            step={param.step || 0.01}
            value={parametros[param.id] || param.default}
            onChange={(e) => handleParamChange(param.id, parseFloat(e.target.value))}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          />
        )}

        {param.tipo === 'number' && (
          <input
            type="number"
            min={param.min}
            max={param.max}
            step={param.step || 1}
            value={parametros[param.id] || param.default}
            onChange={(e) => handleParamChange(param.id, parseInt(e.target.value))}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          />
        )}

        {param.tipo === 'select' && (
          <select
            value={parametros[param.id] || param.default}
            onChange={(e) => handleParamChange(param.id, e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          >
            {param.options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>
    ));
  };

  // ============================================
  // RENDERIZAÇÃO DE MÉTRICAS
  // ============================================
  const renderMetricas = () => {
    if (!resultado) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-xs text-red-200">Total de Pontos</div>
          <div className="text-2xl font-bold">{resultado.pontos?.length || resultado.n_total || 0}</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-xs text-red-200">Anomalias</div>
          <div className="text-2xl font-bold">{resultado.n_anomalias}</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-xs text-red-200">Taxa de Anomalias</div>
          <div className="text-2xl font-bold">{(resultado.taxa_anomalias * 100).toFixed(1)}%</div>
        </div>
        {resultado.threshold && (
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-red-200">Threshold</div>
            <div className="text-2xl font-bold">{resultado.threshold.toFixed(3)}</div>
          </div>
        )}
        {resultado.n_support_vectors && (
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-red-200">Vetores Suporte</div>
            <div className="text-2xl font-bold">{resultado.n_support_vectors}</div>
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // RENDERIZAÇÃO DOS RESULTADOS
  // ============================================
  const renderResultados = () => {
    if (!resultado || !resultado.pontos) return null;

    const config = ALGORITMOS_CONFIG[algoritmo];
    
    // Separar pontos normais e anomalias
    const pontosNormais = resultado.pontos.filter(p => !p.anomalia);
    const pontosAnomalos = resultado.pontos.filter(p => p.anomalia);

    // Dados para o gráfico de scores
    const scoresData = resultado.pontos
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
      .map((p, i) => ({
        index: i + 1,
        score: p.score,
        anomalia: p.anomalia
      }));

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Botão Voltar */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleNovaAnalise}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Nova Análise
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2"
          >
            {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {expanded ? 'Minimizar' : 'Expandir'}
          </Button>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{config.nome}</h2>
              <p className="text-red-100 mt-1">{config.descricao}</p>
            </div>
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              <Cpu className="w-3 h-3 mr-2" />
              {config.pacote}
            </Badge>
          </div>
          
          {renderMetricas()}
        </div>

        {/* Visualização 2D das Anomalias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Visualização das Anomalias
            </CardTitle>
            <CardDescription>
              Pontos em vermelho são anomalias detectadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="x" name="Componente 1" />
                  <YAxis type="number" dataKey="y" name="Componente 2" />
                  <ZAxis range={[20, 20]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  
                  {/* Pontos normais */}
                  {pontosNormais.length > 0 && (
                    <Scatter 
                      name="Normais" 
                      data={pontosNormais.slice(0, 1000)} 
                      fill="#3B82F6" 
                      shape="circle"
                    />
                  )}
                  
                  {/* Anomalias */}
                  {pontosAnomalos.length > 0 && (
                    <Scatter 
                      name="Anomalias" 
                      data={pontosAnomalos} 
                      fill="#EF4444" 
                      shape="circle"
                    />
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição dos Scores */}
        {resultado.scores_summary && (
          <Card>
            <CardHeader>
              <CardTitle>Distribuição dos Scores de Anomalia</CardTitle>
              <CardDescription>
                Quanto maior o score, mais anômalo é o ponto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500">Mínimo</div>
                  <div className="text-lg font-bold">{resultado.scores_summary.min?.toFixed(3)}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500">Q1</div>
                  <div className="text-lg font-bold">{resultado.scores_summary.q1?.toFixed(3)}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500">Mediana</div>
                  <div className="text-lg font-bold">{resultado.scores_summary.mediana?.toFixed(3)}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500">Q3</div>
                  <div className="text-lg font-bold">{resultado.scores_summary.q3?.toFixed(3)}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500">Máximo</div>
                  <div className="text-lg font-bold">{resultado.scores_summary.max?.toFixed(3)}</div>
                </div>
              </div>

              {/* Gráfico de scores */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoresData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" label="Ponto" />
                    <YAxis label="Score" />
                    <Tooltip />
                    <Bar dataKey="score">
                      {scoresData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.anomalia ? '#EF4444' : '#3B82F6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista das principais anomalias */}
        {pontosAnomalos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Principais Anomalias Detectadas
              </CardTitle>
              <CardDescription>
                Top 10 pontos com maior score de anomalia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left">#</th>
                      <th className="px-4 py-2 text-left">Coordenada X</th>
                      <th className="px-4 py-2 text-left">Coordenada Y</th>
                      <th className="px-4 py-2 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pontosAnomalos
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 10)
                      .map((ponto, idx) => (
                        <tr key={idx} className="border-t hover:bg-red-50">
                          <td className="px-4 py-2 font-mono">{idx + 1}</td>
                          <td className="px-4 py-2 font-mono">{ponto.x.toFixed(3)}</td>
                          <td className="px-4 py-2 font-mono">{ponto.y.toFixed(3)}</td>
                          <td className="px-4 py-2 text-right font-mono font-bold text-red-600">
                            {ponto.score.toFixed(3)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    );
  };

  // ============================================
  // RENDER PRINCIPAL
  // ============================================
  return (
    <div className="space-y-6">
      {/* Configuração */}
      {!resultado && (
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-red-600 to-pink-600 text-white">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <span>Detecção de Anomalias</span>
              </div>
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                <GitBranch className="w-3 h-3 mr-2" />
                {ALGORITMOS_CONFIG[algoritmo].nome}
              </Badge>
            </CardTitle>
            <CardDescription className="text-red-100">
              Identifique pontos anômalos e outliers nos dados
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Algoritmo */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-500" />
                  Algoritmo
                </h3>
                
                <div className="space-y-2">
                  {Object.entries(ALGORITMOS_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setAlgoritmo(key)}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        algoritmo === key
                          ? 'bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-500 shadow-md'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{config.icone}</span>
                        <div>
                          <div className="font-medium">{config.nome}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {config.descricao}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Parâmetros */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-red-500" />
                  Parâmetros
                </h3>

                <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
                  {renderParametros()}
                </div>
              </div>

              {/* Variáveis */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-500" />
                  Variáveis ({variaveisSelecionadas.length})
                </h3>

                <div className="bg-gray-50 p-4 rounded-xl max-h-64 overflow-y-auto">
                  {infoDados.variaveis.map(variavel => (
                    <label
                      key={variavel}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        variaveisSelecionadas.includes(variavel)
                          ? 'bg-red-50 border border-red-200'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={variaveisSelecionadas.includes(variavel)}
                        onChange={() => handleToggleVariavel(variavel)}
                        className="w-4 h-4 rounded text-red-600"
                      />
                      <span className="text-sm font-medium flex-1">{variavel}</span>
                      {variaveisSelecionadas.includes(variavel) && (
                        <CheckCircle className="w-4 h-4 text-red-500" />
                      )}
                    </label>
                  ))}
                </div>

                <Button
                  onClick={handleExecutar}
                  disabled={executando || variaveisSelecionadas.length < 2}
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-medium text-lg"
                >
                  {executando ? (
                    <><RefreshCw className="w-5 h-5 animate-spin mr-2" /> Processando...</>
                  ) : (
                    <><Play className="w-5 h-5 mr-2" /> Executar</>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados */}
      <AnimatePresence mode="wait">
        {resultado && renderResultados()}
      </AnimatePresence>
    </div>
  );
}