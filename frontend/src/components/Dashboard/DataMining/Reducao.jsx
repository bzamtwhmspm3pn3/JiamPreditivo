// C:\Users\VhenancioMarthinz\Downloads\JiamPreditivo\frontend\src\components\Dashboard\DataMining\Reducao.jsx
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
  ScatterChart as ScatterIcon, BarChart3, LineChart as LineIcon
} from 'lucide-react';

// Utilitário
import { extrairDadosArray } from '../Actuarial/utils/dataExtractor';

const CORES = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#06B6D4'
];

const ALGORITMOS_CONFIG = {
  pca: {
    nome: 'PCA',
    icone: '📉',
    descricao: 'Análise de Componentes Principais - redução linear',
    pacote: 'stats',
    metricas: ['variancia_explicada', 'n_componentes'],
    graficos: ['scatter', 'variancia', 'loadings'],
    params: [
      { 
        id: 'n_components', 
        nome: 'Número de Componentes', 
        tipo: 'range', 
        min: 2, 
        max: 10,
        default: 2,
        descricao: 'Dimensões para redução (recomendado: 2-3)'
      },
      { 
        id: 'scale', 
        nome: 'Padronizar Dados', 
        tipo: 'boolean',
        default: true,
        descricao: 'Centralizar e escalar os dados antes da PCA'
      }
    ]
  },
  tsne: {
    nome: 't-SNE',
    icone: '🌀',
    descricao: 't-Distributed Stochastic Neighbor Embedding',
    pacote: 'Rtsne',
    metricas: ['perplexity', 'iteracoes', 'kl_divergencia'],
    graficos: ['scatter'],
    params: [
      { 
        id: 'n_components', 
        nome: 'Dimensões', 
        tipo: 'range', 
        min: 2, 
        max: 3,
        default: 2,
        descricao: 'Dimensões de saída (2 ou 3)'
      },
      { 
        id: 'perplexity', 
        nome: 'Perplexidade', 
        tipo: 'number', 
        min: 5, 
        max: 50,
        default: 30,
        descricao: 'Equilíbrio entre variância local e global'
      },
      { 
        id: 'max_iter', 
        nome: 'Iterações Máximas', 
        tipo: 'number', 
        min: 250, 
        max: 2000,
        step: 250,
        default: 1000,
        descricao: 'Número de iterações do algoritmo'
      }
    ]
  },
  umap: {
    nome: 'UMAP',
    icone: '🌌',
    descricao: 'Uniform Manifold Approximation and Projection',
    pacote: 'umap',
    metricas: ['n_neighbors', 'min_dist'],
    graficos: ['scatter'],
    params: [
      { 
        id: 'n_components', 
        nome: 'Dimensões', 
        tipo: 'range', 
        min: 2, 
        max: 3,
        default: 2,
        descricao: 'Dimensões de saída'
      },
      { 
        id: 'n_neighbors', 
        nome: 'Vizinhos', 
        tipo: 'number', 
        min: 2, 
        max: 50,
        default: 15,
        descricao: 'Tamanho da vizinhança local'
      },
      { 
        id: 'min_dist', 
        nome: 'Distância Mínima', 
        tipo: 'float', 
        min: 0.01, 
        max: 0.5,
        step: 0.01,
        default: 0.1,
        descricao: 'Distância mínima entre pontos'
      }
    ]
  }
};

// ============ FUNÇÕES AUXILIARES ============
const calcularClassificacao = (resultado, algoritmo) => {
  if (!resultado) return "MODERADA";
  
  if (algoritmo === 'pca' && resultado.variancia_explicada) {
    const varianciaTotal = resultado.variancia_explicada.reduce((a, b) => a + b, 0);
    if (varianciaTotal >= 0.8) return "EXCELENTE";
    if (varianciaTotal >= 0.6) return "BOA";
    if (varianciaTotal >= 0.4) return "MODERADA";
    return "FRACA";
  }
  
  if (algoritmo === 'tsne' && resultado.kl_divergencia) {
    if (resultado.kl_divergencia < 1) return "EXCELENTE";
    if (resultado.kl_divergencia < 2) return "BOA";
    if (resultado.kl_divergencia < 3) return "MODERADA";
    return "FRACA";
  }
  
  return "MODERADA";
};

const extrairMetrics = (resultado, algoritmo) => {
  if (!resultado) return {};
  
  const metrics = {};
  
  if (algoritmo === 'pca') {
    metrics.n_componentes = resultado.n_componentes;
    metrics.variancia_explicada = resultado.variancia_explicada;
    metrics.variancia_acumulada = resultado.variancia_acumulada;
    metrics.loadings = resultado.loadings;
  }
  
  if (algoritmo === 'tsne') {
    metrics.perplexity = resultado.perplexity;
    metrics.iteracoes = resultado.iteracoes;
    metrics.kl_divergencia = resultado.kl_divergencia;
  }
  
  if (algoritmo === 'umap') {
    metrics.n_neighbors = resultado.n_neighbors;
    metrics.min_dist = resultado.min_dist;
    metrics.n_componentes = resultado.n_componentes;
  }
  
  return metrics;
};

export default function Reducao({ dados, infoDados, onResultadoModelo }) {
  // ============================================
  // ESTADOS
  // ============================================
  const [algoritmo, setAlgoritmo] = useState('pca');
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
    if (infoDados.variaveis.length >= 3) {
      setVariaveisSelecionadas(infoDados.variaveis.slice(0, 3));
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
      
      const nomeModelo = `Redução - ${config.nome} (${variaveisSelecionadas.length} variáveis)`;
      
      const dadosParaDashboard = {
        nome: nomeModelo,
        tipo: "data_mining",
        dados: dadosAnalise,
        categoria: 'reducao',
        algoritmo: algoritmo,
        parametros: {
          ...parametros,
          variaveis: variaveisSelecionadas
        },
        metricas: {
          n_componentes: dadosAnalise.n_componentes,
          variancia_explicada: dadosAnalise.variancia_explicada
        },
        timestamp: new Date().toISOString(),
        resumo: `${dadosAnalise.n_componentes} componentes • ${variaveisSelecionadas.length} variáveis originais`
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
        'reducao',
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
              onChange={(e) => handleParamChange(param.id, parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{param.min}</span>
              <span className="font-medium text-blue-600">
                {parametros[param.id] || param.default}
              </span>
              <span>{param.max}</span>
            </div>
          </div>
        )}

        {param.tipo === 'number' && (
          <input
            type="number"
            min={param.min}
            max={param.max}
            step={param.step || 1}
            value={parametros[param.id] || param.default}
            onChange={(e) => handleParamChange(param.id, parseInt(e.target.value))}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        )}

        {param.tipo === 'float' && (
          <input
            type="number"
            min={param.min}
            max={param.max}
            step={param.step || 0.01}
            value={parametros[param.id] || param.default}
            onChange={(e) => handleParamChange(param.id, parseFloat(e.target.value))}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        )}

        {param.tipo === 'boolean' && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={parametros[param.id] ?? param.default}
              onChange={(e) => handleParamChange(param.id, e.target.checked)}
              className="w-4 h-4 rounded text-blue-600"
            />
            <span className="text-sm text-gray-600">Ativar</span>
          </div>
        )}
      </div>
    ));
  };

  // ============================================
  // RENDERIZAÇÃO DE MÉTRICAS
  // ============================================
  const renderMetricas = () => {
    if (!resultado) return null;

    if (algoritmo === 'pca' && resultado.variancia_explicada) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Componentes</div>
            <div className="text-2xl font-bold">{resultado.n_componentes}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Variância PC1</div>
            <div className="text-2xl font-bold">{(resultado.variancia_explicada[0] * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Variância PC2</div>
            <div className="text-2xl font-bold">{(resultado.variancia_explicada[1] * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Variância Acumulada</div>
            <div className="text-2xl font-bold">{(resultado.variancia_acumulada * 100).toFixed(1)}%</div>
          </div>
        </div>
      );
    }

    if (algoritmo === 'tsne' && resultado.kl_divergencia) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Perplexidade</div>
            <div className="text-2xl font-bold">{resultado.perplexity}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Iterações</div>
            <div className="text-2xl font-bold">{resultado.iteracoes}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">KL Divergência</div>
            <div className="text-2xl font-bold">{resultado.kl_divergencia.toFixed(2)}</div>
          </div>
        </div>
      );
    }

    if (algoritmo === 'umap') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Componentes</div>
            <div className="text-2xl font-bold">{resultado.n_componentes}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Vizinhos</div>
            <div className="text-2xl font-bold">{resultado.n_neighbors}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Distância Mínima</div>
            <div className="text-2xl font-bold">{resultado.min_dist}</div>
          </div>
        </div>
      );
    }

    return null;
  };

  // ============================================
  // RENDERIZAÇÃO DOS RESULTADOS
  // ============================================
  const renderResultados = () => {
    if (!resultado || !resultado.componentes) return null;

    const config = ALGORITMOS_CONFIG[algoritmo];
    
    // Preparar dados para o scatter plot
    const scatterData = resultado.componentes.slice(0, 1000).map((ponto, idx) => ({
      x: ponto[0],
      y: ponto[1],
      z: ponto[2] || 0,
      id: idx
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
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{config.nome}</h2>
              <p className="text-orange-100 mt-1">{config.descricao}</p>
            </div>
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              <Cpu className="w-3 h-3 mr-2" />
              {config.pacote}
            </Badge>
          </div>
          
          {renderMetricas()}
        </div>

        {/* Visualização 2D/3D */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScatterIcon className="w-5 h-5" />
              Visualização {resultado.n_componentes === 2 ? '2D' : '3D'}
            </CardTitle>
            <CardDescription>
              {resultado.componentes.length} pontos projetados em {resultado.n_componentes} dimensões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Componente 1" 
                    label={{ value: 'Componente 1', position: 'bottom' }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Componente 2" 
                    label={{ value: 'Componente 2', angle: -90, position: 'left' }}
                  />
                  {resultado.n_componentes === 3 && (
                    <ZAxis type="number" dataKey="z" name="Componente 3" />
                  )}
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter 
                    name="Dados" 
                    data={scatterData} 
                    fill="#F97316"
                    shape="circle"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Variância Explicada (PCA) */}
        {algoritmo === 'pca' && resultado.variancia_explicada && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Variância Explicada por Componente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={resultado.variancia_explicada.map((v, i) => ({
                      name: `PC${i + 1}`,
                      variancia: v * 100,
                      acumulada: resultado.variancia_acumulada * 100
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                    <Bar dataKey="variancia" fill="#F97316" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loadings (PCA) */}
        {algoritmo === 'pca' && resultado.loadings && (
          <Card>
            <CardHeader>
              <CardTitle>Contribuição das Variáveis (Loadings)</CardTitle>
              <CardDescription>
                Peso de cada variável nos componentes principais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left">Variável</th>
                      <th className="px-4 py-2 text-right">PC1</th>
                      <th className="px-4 py-2 text-right">PC2</th>
                      {resultado.n_componentes > 2 && (
                        <th className="px-4 py-2 text-right">PC3</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {variaveisSelecionadas.map((variavel, idx) => (
                      <tr key={variavel} className="border-t">
                        <td className="px-4 py-2 font-medium">{variavel}</td>
                        <td className="px-4 py-2 text-right font-mono">
                          {resultado.loadings.PC1?.[idx]?.toFixed(3) || '-'}
                        </td>
                        <td className="px-4 py-2 text-right font-mono">
                          {resultado.loadings.PC2?.[idx]?.toFixed(3) || '-'}
                        </td>
                        {resultado.n_componentes > 2 && (
                          <td className="px-4 py-2 text-right font-mono">
                            {resultado.loadings.PC3?.[idx]?.toFixed(3) || '-'}
                          </td>
                        )}
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
          <CardHeader className="bg-gradient-to-r from-orange-600 to-amber-600 text-white">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <ScatterIcon className="w-6 h-6" />
                </div>
                <span>Redução Dimensional</span>
              </div>
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                <GitBranch className="w-3 h-3 mr-2" />
                {ALGORITMOS_CONFIG[algoritmo].nome}
              </Badge>
            </CardTitle>
            <CardDescription className="text-orange-100">
              Reduza a dimensionalidade dos dados para visualização e análise
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Algoritmo */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  Algoritmo
                </h3>
                
                <div className="space-y-2">
                  {Object.entries(ALGORITMOS_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setAlgoritmo(key)}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        algoritmo === key
                          ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-500 shadow-md'
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
                  <Filter className="w-4 h-4 text-orange-500" />
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
                          ? 'bg-orange-50 border border-orange-200'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={variaveisSelecionadas.includes(variavel)}
                        onChange={() => handleToggleVariavel(variavel)}
                        className="w-4 h-4 rounded text-orange-600"
                      />
                      <span className="text-sm font-medium flex-1">{variavel}</span>
                      {variaveisSelecionadas.includes(variavel) && (
                        <CheckCircle className="w-4 h-4 text-orange-500" />
                      )}
                    </label>
                  ))}
                </div>

                <Button
                  onClick={handleExecutar}
                  disabled={executando || variaveisSelecionadas.length < 2}
                  className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-medium text-lg"
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