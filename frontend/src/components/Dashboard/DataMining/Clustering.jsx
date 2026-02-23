// C:\Users\VhenancioMarthinz\Downloads\JiamPreditivo\frontend\src\components\Dashboard\DataMining\Clustering.jsx
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
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ScatterChart, Scatter,
  LineChart, Line, ComposedChart, Area
} from 'recharts';

// Ícones
import { 
  Play, RefreshCw, Filter, TrendingUp, Download, 
  Send, Info, AlertCircle, CheckCircle, XCircle,
  GitBranch, Layers, Zap, Cpu, Brain, Network,
  Eye, EyeOff, Maximize2, Minimize2, ArrowLeft,
  Activity, Target, PieChart as PieIcon, BarChart as BarIcon,
  ScatterChart as ScatterIcon, LineChart as LineIcon
} from 'lucide-react';

// Utilitário
import { extrairDadosArray } from '../Actuarial/utils/dataExtractor';

const CORES = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#06B6D4'
];

const ALGORITMOS_CONFIG = {
  kmeans: {
    nome: 'K-Means',
    icone: '🎯',
    descricao: 'Algoritmo de agrupamento particional que divide os dados em K grupos',
    pacote: 'stats',
    metricas: ['silhueta', 'inercia', 'davies_bouldin'],
    graficos: ['pizza', 'barras', 'centroides'],
    params: [
      { 
        id: 'n_clusters', 
        nome: 'Número de Clusters', 
        tipo: 'range', 
        min: 2, 
        max: 10,
        default: 3,
        descricao: 'Quantidade de grupos a serem formados'
      },
      { 
        id: 'max_iter', 
        nome: 'Máximo de Iterações', 
        tipo: 'number', 
        min: 100, 
        max: 1000,
        default: 300,
        descricao: 'Número máximo de iterações do algoritmo'
      }
    ]
  },
  dbscan: {
    nome: 'DBSCAN',
    icone: '🌐',
    descricao: 'Agrupamento baseado em densidade, identifica clusters de formatos arbitrários',
    pacote: 'dbscan',
    metricas: ['silhueta', 'n_clusters', 'noise_ratio'],
    graficos: ['pizza', 'barras', 'scatter'],
    params: [
      { 
        id: 'eps', 
        nome: 'EPS (Raio)', 
        tipo: 'float', 
        min: 0.1, 
        max: 2.0, 
        step: 0.1,
        default: 0.5,
        descricao: 'Distância máxima entre pontos no mesmo cluster'
      },
      { 
        id: 'min_samples', 
        nome: 'Min Samples', 
        tipo: 'number', 
        min: 2, 
        max: 20,
        default: 5,
        descricao: 'Número mínimo de pontos para formar um cluster'
      }
    ]
  },
  hierarchical: {
    nome: 'Hierárquico',
    icone: '🌳',
    descricao: 'Constrói uma hierarquia de clusters através de divisões ou aglomerações',
    pacote: 'stats',
    metricas: ['silhueta', 'method', 'distance'],
    graficos: ['pizza', 'barras', 'dendrograma'],
    params: [
      { 
        id: 'method', 
        nome: 'Método de Ligação', 
        tipo: 'select',
        options: [
          { value: 'ward', label: 'Ward' },
          { value: 'single', label: 'Single' },
          { value: 'complete', label: 'Complete' },
          { value: 'average', label: 'Average' }
        ],
        default: 'ward',
        descricao: 'Método usado para calcular distância entre clusters'
      },
      { 
        id: 'distance', 
        nome: 'Distância', 
        tipo: 'select',
        options: [
          { value: 'euclidean', label: 'Euclidiana' },
          { value: 'manhattan', label: 'Manhattan' },
          { value: 'maximum', label: 'Maximum' }
        ],
        default: 'euclidean',
        descricao: 'Métrica de distância entre pontos'
      },
      { 
        id: 'n_clusters', 
        nome: 'Número de Clusters', 
        tipo: 'range', 
        min: 2, 
        max: 10,
        default: 3,
        descricao: 'Quantidade de grupos a serem formados'
      }
    ]
  },
  gmm: {
    nome: 'GMM',
    icone: '📊',
    descricao: 'Modelo de Misturas Gaussianas, assume que os dados são gerados por distribuições normais',
    pacote: 'mclust',
    metricas: ['silhueta', 'bic', 'loglik', 'n_components'],
    graficos: ['pizza', 'barras', 'probabilidades'],
    params: [
      { 
        id: 'n_components', 
        nome: 'Componentes', 
        tipo: 'range', 
        min: 2, 
        max: 10,
        default: 3,
        descricao: 'Número de componentes da mistura'
      },
      { 
        id: 'covariance_type', 
        nome: 'Tipo de Covariância', 
        tipo: 'select',
        options: [
          { value: 'full', label: 'Completa' },
          { value: 'diag', label: 'Diagonal' },
          { value: 'tied', label: 'Amarrada' },
          { value: 'spherical', label: 'Esférica' }
        ],
        default: 'full',
        descricao: 'Estrutura da matriz de covariância'
      }
    ]
  }
};

// ============ FUNÇÕES AUXILIARES ============
const calcularClassificacao = (resultado) => {
  if (!resultado || !resultado.metricas) return "MODERADA";
  
  const silhueta = resultado.metricas.silhueta || 0;
  
  if (silhueta >= 0.7) return "EXCELENTE";
  if (silhueta >= 0.5) return "BOA";
  if (silhueta >= 0.25) return "MODERADA";
  return "FRACA";
};

const extrairMetrics = (resultado) => {
  if (!resultado || !resultado.metricas) return {};
  
  return {
    silhueta: resultado.metricas.silhueta,
    inercia: resultado.metricas.inercia,
    davies_bouldin: resultado.metricas.davies_bouldin,
    n_clusters: resultado.metricas.n_clusters,
    noise_ratio: resultado.metricas.noise_ratio,
    bic: resultado.metricas.bic,
    loglik: resultado.metricas.loglik,
    ...resultado.metricas
  };
};

export default function Clustering({ dados, infoDados, onResultadoModelo }) {
  // ============================================
  // ESTADOS
  // ============================================
  const [algoritmo, setAlgoritmo] = useState('kmeans');
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
      
      const nomeModelo = `Clustering - ${config.nome} (${variaveisSelecionadas.length} variáveis)`;
      
      const dadosParaDashboard = {
        nome: nomeModelo,
        tipo: "data_mining",
        dados: dadosAnalise,
        categoria: 'clustering',
        algoritmo: algoritmo,
        parametros: {
          ...parametros,
          variaveis: variaveisSelecionadas
        },
        metricas: dadosAnalise.metricas || {},
        timestamp: new Date().toISOString(),
        resumo: `${dadosAnalise.clusters?.length || 0} clusters • ${variaveisSelecionadas.length} variáveis • Silhueta: ${dadosAnalise.metricas?.silhueta?.toFixed(3) || 'N/A'}`
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
        classificacao: calcularClassificacao(dadosAnalise),
        timestamp: new Date().toISOString(),
        metrics: extrairMetrics(dadosAnalise),
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
        'clustering',
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
        
        // Chama a função de envio
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
              value={parametros[param.id] || param.default}
              onChange={(e) => handleParamChange(param.id, parseFloat(e.target.value))}
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
            onChange={(e) => handleParamChange(param.id, parseFloat(e.target.value))}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        )}

        {param.tipo === 'float' && (
          <input
            type="number"
            min={param.min}
            max={param.max}
            step={param.step || 0.1}
            value={parametros[param.id] || param.default}
            onChange={(e) => handleParamChange(param.id, parseFloat(e.target.value))}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        )}

        {param.tipo === 'select' && (
          <select
            value={parametros[param.id] || param.default}
            onChange={(e) => handleParamChange(param.id, e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
  // RENDERIZAÇÃO DE MÉTRICAS ESPECÍFICAS
  // ============================================
  const renderMetricasEspecificas = () => {
    const config = ALGORITMOS_CONFIG[algoritmo];
    if (!resultado?.metricas) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-xs text-blue-200">Clusters</div>
          <div className="text-2xl font-bold">{resultado.clusters.length}</div>
        </div>

        {resultado.metricas.silhueta !== undefined && (
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Silhueta</div>
            <div className="text-2xl font-bold">{resultado.metricas.silhueta.toFixed(3)}</div>
          </div>
        )}

        {algoritmo === 'kmeans' && resultado.metricas.inercia !== undefined && (
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Inércia</div>
            <div className="text-2xl font-bold">{resultado.metricas.inercia.toExponential(2)}</div>
          </div>
        )}

        {algoritmo === 'kmeans' && resultado.metricas.davies_bouldin !== undefined && (
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Davies-Bouldin</div>
            <div className="text-2xl font-bold">{resultado.metricas.davies_bouldin.toFixed(3)}</div>
          </div>
        )}

        {algoritmo === 'dbscan' && resultado.metricas.n_clusters !== undefined && (
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Clusters</div>
            <div className="text-2xl font-bold">{resultado.metricas.n_clusters}</div>
          </div>
        )}

        {algoritmo === 'dbscan' && resultado.metricas.noise_ratio !== undefined && (
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Taxa de Ruído</div>
            <div className="text-2xl font-bold">{(resultado.metricas.noise_ratio * 100).toFixed(1)}%</div>
          </div>
        )}

        {algoritmo === 'gmm' && resultado.metricas.bic !== undefined && (
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">BIC</div>
            <div className="text-xl font-bold">{resultado.metricas.bic.toFixed(2)}</div>
          </div>
        )}

        {algoritmo === 'gmm' && resultado.metricas.loglik !== undefined && (
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Log-Likelihood</div>
            <div className="text-xl font-bold">{resultado.metricas.loglik.toFixed(2)}</div>
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // RENDERIZAÇÃO DE GRÁFICOS ESPECÍFICOS
  // ============================================
  const renderGraficosEspecificos = (dadosGrafico) => {
    const config = ALGORITMOS_CONFIG[algoritmo];
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {config.graficos.includes('pizza') && (
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
              <CardTitle className="flex items-center gap-2">
                <PieIcon className="w-5 h-5" />
                Distribuição dos Clusters
              </CardTitle>
              <CardDescription>
                Proporção de elementos em cada cluster
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosGrafico}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={e => `${e.name} (${e.percentual}%)`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {dadosGrafico.map((_, i) => (
                        <Cell key={i} fill={CORES[i % CORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} elementos`, 'Tamanho']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {config.graficos.includes('barras') && (
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
              <CardTitle className="flex items-center gap-2">
                <BarIcon className="w-5 h-5" />
                Comparação de Tamanhos
              </CardTitle>
              <CardDescription>
                Distribuição por cluster
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3B82F6">
                      {dadosGrafico.map((_, i) => (
                        <Cell key={i} fill={CORES[i % CORES.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // ============================================
  // RENDERIZAÇÃO DOS RESULTADOS
  // ============================================
  const renderResultados = () => {
    if (!resultado) return null;

    const config = ALGORITMOS_CONFIG[algoritmo];
    const total = resultado.clusters.reduce((acc, c) => acc + c.tamanho, 0);

    const dadosGrafico = resultado.clusters.map((c, i) => ({
      name: `Cluster ${i + 1}`,
      value: c.tamanho,
      percentual: ((c.tamanho / total) * 100).toFixed(1)
    }));

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
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

        {resultado.fallback && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  ⚠️ {algoritmo === 'gmm' ? 'GMM' : 'Algoritmo'} não convergiu com os parâmetros solicitados. 
                  Usando K-Means como fallback.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{config.nome}</h2>
              <p className="text-blue-100 mt-1">{config.descricao}</p>
            </div>
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              <Cpu className="w-3 h-3 mr-2" />
              {config.pacote}
            </Badge>
          </div>
          
          {renderMetricasEspecificas()}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {resultado.clusters.map((cluster, idx) => (
            <motion.div
              key={idx}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-5 border-l-4 hover:shadow-xl transition-shadow"
              style={{ borderLeftColor: CORES[idx % CORES.length] }}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-700">
                  Cluster {idx + 1}
                </span>
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: CORES[idx % CORES.length] }}
                />
              </div>
              <div className="text-3xl font-bold mt-3">{cluster.tamanho}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-500">elementos</span>
                <Badge variant="info" className="bg-blue-50">
                  {((cluster.tamanho / total) * 100).toFixed(1)}%
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>

        {renderGraficosEspecificos(dadosGrafico)}

        {resultado.centroides && resultado.centroides.length > 0 && (
          <Card>
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Centróides dos Clusters
              </CardTitle>
              <CardDescription>
                Valores médios das variáveis em cada cluster
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cluster
                      </th>
                      {variaveisSelecionadas.map((variavel) => (
                        <th key={variavel} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {variavel}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {resultado.centroides.map((centroide, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: CORES[idx % CORES.length] }}
                            />
                            <span className="font-medium">Cluster {idx + 1}</span>
                          </div>
                        </td>
                        {centroide.map((valor, i) => (
                          <td key={i} className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                            {typeof valor === 'number' ? valor.toFixed(4) : valor}
                          </td>
                        ))}
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
      {!resultado && (
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Brain className="w-6 h-6" />
                </div>
                <span>Configurações do Clustering</span>
              </div>
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                <GitBranch className="w-3 h-3 mr-2" />
                {ALGORITMOS_CONFIG[algoritmo].nome}
              </Badge>
            </CardTitle>
            <CardDescription className="text-blue-100">
              Configure os parâmetros e execute a análise
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  Algoritmo
                </h3>
                
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {Object.entries(ALGORITMOS_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setAlgoritmo(key)}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        algoritmo === key
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-500 shadow-md'
                          : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{config.icone}</span>
                        <div>
                          <div className="font-medium">{config.nome}</div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {config.descricao}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-700 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-green-500" />
                    Parâmetros
                  </h3>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {showAdvanced ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showAdvanced ? 'Ocultar' : 'Mostrar'} avançados
                  </button>
                </div>

                <div className="space-y-4 bg-gray-50 p-4 rounded-xl max-h-[400px] overflow-y-auto">
                  {renderParametros()}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-500" />
                  Variáveis ({variaveisSelecionadas.length} selecionadas)
                </h3>

                <div className="bg-gray-50 p-4 rounded-xl max-h-[400px] overflow-y-auto">
                  {infoDados.variaveis.map(variavel => (
                    <label
                      key={variavel}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        variaveisSelecionadas.includes(variavel)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={variaveisSelecionadas.includes(variavel)}
                        onChange={() => handleToggleVariavel(variavel)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium flex-1">{variavel}</span>
                      {variaveisSelecionadas.includes(variavel) && (
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                      )}
                    </label>
                  ))}
                  {infoDados.variaveis.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Nenhuma variável disponível</p>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleExecutar}
                  disabled={executando || variaveisSelecionadas.length < 2}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 font-medium text-lg"
                >
                  {executando ? (
                    <><RefreshCw className="w-5 h-5 animate-spin mr-2" /> Processando...</>
                  ) : (
                    <><Play className="w-5 h-5 mr-2" /> Executar Análise</>
                  )}
                </Button>
              </div>
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