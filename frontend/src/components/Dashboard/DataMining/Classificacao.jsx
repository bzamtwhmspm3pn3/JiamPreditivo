// C:\Users\VhenancioMarthinz\Downloads\JiamPreditivo\frontend\src\components\Dashboard\DataMining\Classificacao.jsx
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
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

// Ícones
import { 
  Play, RefreshCw, Filter, TrendingUp, Download, 
  Send, Info, AlertCircle, CheckCircle,
  GitBranch, Layers, Zap, Cpu, Brain,
  Eye, EyeOff, Maximize2, Minimize2, ArrowLeft,
  TreePine, Network, Target, Shield
} from 'lucide-react';

// Utilitário
import { extrairDadosArray } from '../Actuarial/utils/dataExtractor';

const CORES = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#06B6D4'
];

const ALGORITMOS_CONFIG = {
  decision_tree: {
    nome: 'Árvore de Decisão',
    icone: '🌿',
    descricao: 'Algoritmo baseado em regras de decisão hierárquicas',
    pacote: 'rpart',
    metricas: ['acuracia', 'precisao', 'recall', 'f1'],
    graficos: ['barras', 'matriz_confusao'],
    params: [
      { 
        id: 'max_depth', 
        nome: 'Profundidade Máxima', 
        tipo: 'number', 
        min: 2, 
        max: 20,
        default: 10,
        descricao: 'Nível máximo de divisões da árvore'
      },
      { 
        id: 'min_split', 
        nome: 'Mínimo para Divisão', 
        tipo: 'number', 
        min: 2, 
        max: 50,
        default: 20,
        descricao: 'Número mínimo de observações para dividir um nó'
      },
      { 
        id: 'cp', 
        nome: 'Complexidade (cp)', 
        tipo: 'float', 
        min: 0.001, 
        max: 0.1,
        step: 0.001,
        default: 0.01,
        descricao: 'Parâmetro de complexidade para poda'
      }
    ]
  },
  random_forest: {
    nome: 'Random Forest',
    icone: '🌲',
    descricao: 'Conjunto de árvores de decisão para maior precisão',
    pacote: 'randomForest',
    metricas: ['acuracia', 'precisao', 'recall', 'f1', 'oob_error'],
    graficos: ['barras', 'importancia'],
    params: [
      { 
        id: 'n_trees', 
        nome: 'Número de Árvores', 
        tipo: 'number', 
        min: 10, 
        max: 500,
        step: 10,
        default: 100,
        descricao: 'Quantidade de árvores na floresta'
      },
      { 
        id: 'mtry', 
        nome: 'Variáveis por Nó', 
        tipo: 'number', 
        min: 1, 
        max: 20,
        default: 2,
        descricao: 'Número de variáveis consideradas em cada divisão'
      }
    ]
  },
  svm: {
    nome: 'SVM',
    icone: '🎯',
    descricao: 'Máquina de Vetores de Suporte',
    pacote: 'e1071',
    metricas: ['acuracia', 'precisao', 'recall', 'f1'],
    graficos: ['barras'],
    params: [
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
        id: 'cost', 
        nome: 'Custo (C)', 
        tipo: 'float', 
        min: 0.1, 
        max: 10,
        step: 0.1,
        default: 1,
        descricao: 'Penalidade por erro de classificação'
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
  },
  naive_bayes: {
    nome: 'Naive Bayes',
    icone: '📈',
    descricao: 'Classificador probabilístico baseado no Teorema de Bayes',
    pacote: 'e1071',
    metricas: ['acuracia', 'precisao', 'recall', 'f1'],
    graficos: ['barras'],
    params: []
  },
  knn: {
    nome: 'KNN',
    icone: '👥',
    descricao: 'K-Vizinhos Próximos',
    pacote: 'class',
    metricas: ['acuracia', 'precisao', 'recall', 'f1'],
    graficos: ['barras'],
    params: [
      { 
        id: 'k', 
        nome: 'Número de Vizinhos (k)', 
        tipo: 'number', 
        min: 1, 
        max: 20,
        default: 5,
        descricao: 'Quantidade de vizinhos considerados'
      }
    ]
  }
};

// ============ FUNÇÕES AUXILIARES ============
const calcularClassificacao = (resultado) => {
  if (!resultado) return "MODERADA";
  
  const metricas = resultado.metricas?.teste || resultado.metricas;
  const acuracia = metricas?.acuracia || 0;
  
  if (acuracia >= 0.85) return "EXCELENTE";
  if (acuracia >= 0.70) return "BOA";
  if (acuracia >= 0.60) return "MODERADA";
  return "FRACA";
};

const extrairMetrics = (resultado) => {
  if (!resultado) return {};
  
  const metricas = resultado.metricas?.teste || resultado.metricas || {};
  
  return {
    accuracy: metricas.acuracia,
    precision: metricas.precisao,
    recall: metricas.recall,
    f1: metricas.f1,
    oob_error: metricas.oob_error,
    ...metricas
  };
};

export default function Classificacao({ dados, infoDados, onResultadoModelo }) {
  // ============================================
  // ESTADOS
  // ============================================
  const [algoritmo, setAlgoritmo] = useState('decision_tree');
  const [parametros, setParametros] = useState({});
  const [variaveisSelecionadas, setVariaveisSelecionadas] = useState([]);
  const [variavelTarget, setVariavelTarget] = useState('');
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
      setVariaveisSelecionadas(infoDados.variaveis.slice(0, 2));
      setVariavelTarget(infoDados.variaveis[infoDados.variaveis.length - 1]);
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
      const metricas = dadosAnalise.metricas?.teste || dadosAnalise.metricas;
      
      const nomeModelo = `Classificação - ${config.nome} (${variavelTarget})`;
      
      const dadosParaDashboard = {
        nome: nomeModelo,
        tipo: "data_mining",
        dados: dadosAnalise,
        categoria: 'classificacao',
        algoritmo: algoritmo,
        parametros: {
          ...parametros,
          variaveis: variaveisSelecionadas,
          target: variavelTarget
        },
        metricas: metricas || {},
        timestamp: new Date().toISOString(),
        resumo: `Acurácia: ${(metricas?.acuracia * 100).toFixed(1)}% • ${variaveisSelecionadas.length} variáveis`
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
          variaveis: variaveisSelecionadas,
          target: variavelTarget
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
  }, [onResultadoModelo, algoritmo, parametros, variaveisSelecionadas, variavelTarget]);

  // ============ FUNÇÃO DE EXECUÇÃO ============
  const handleExecutar = async () => {
    const dadosArray = extrairDadosArray(dados);
    
    if (!dadosArray || dadosArray.length === 0) {
      toast.error("❌ Carregue dados primeiro!");
      return;
    }

    if (variaveisSelecionadas.length < 1) {
      toast.error("❌ Selecione pelo menos 1 variável preditora");
      return;
    }

    if (!variavelTarget) {
      toast.error("❌ Selecione uma variável alvo");
      return;
    }

    setExecutando(true);
    setResultado(null);
    setEnviadoAoDashboard(false);
    
    try {
      const response = await api.executarModeloR(
        'classificacao',
        dadosArray,
        {
          algoritmo: algoritmo,
          variaveis: variaveisSelecionadas,
          target: variavelTarget,
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
              <span className="font-medium text-blue-600">
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
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
  // RENDERIZAÇÃO DE MÉTRICAS
  // ============================================
  const renderMetricas = (metricas) => {
    if (!metricas) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-xs text-blue-200">Acurácia</div>
          <div className="text-2xl font-bold">{(metricas.acuracia * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-xs text-blue-200">Precisão</div>
          <div className="text-2xl font-bold">{(metricas.precisao * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-xs text-blue-200">Recall</div>
          <div className="text-2xl font-bold">{(metricas.recall * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-xs text-blue-200">F1-Score</div>
          <div className="text-2xl font-bold">{(metricas.f1 * 100).toFixed(1)}%</div>
        </div>
        {metricas.oob_error && (
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Erro OOB</div>
            <div className="text-2xl font-bold">{(metricas.oob_error * 100).toFixed(1)}%</div>
          </div>
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
    const metricasTeste = resultado.metricas?.teste || resultado.metricas;

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
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{config.nome}</h2>
              <p className="text-green-100 mt-1">{config.descricao}</p>
            </div>
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              <Cpu className="w-3 h-3 mr-2" />
              {config.pacote}
            </Badge>
          </div>
          
          {metricasTeste && renderMetricas(metricasTeste)}
        </div>

        {/* Comparação Treino x Teste */}
        {resultado.metricas?.treino && resultado.metricas?.teste && (
          <Card>
            <CardHeader>
              <CardTitle>Desempenho: Treino vs Teste</CardTitle>
              <CardDescription>
                Comparação para detectar overfitting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: 'Acurácia',
                        Treino: resultado.metricas.treino.acuracia * 100,
                        Teste: resultado.metricas.teste.acuracia * 100
                      },
                      {
                        name: 'Precisão',
                        Treino: resultado.metricas.treino.precisao * 100,
                        Teste: resultado.metricas.teste.precisao * 100
                      },
                      {
                        name: 'Recall',
                        Treino: resultado.metricas.treino.recall * 100,
                        Teste: resultado.metricas.teste.recall * 100
                      },
                      {
                        name: 'F1-Score',
                        Treino: resultado.metricas.treino.f1 * 100,
                        Teste: resultado.metricas.teste.f1 * 100
                      }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                    <Legend />
                    <Bar dataKey="Treino" fill="#3B82F6" />
                    <Bar dataKey="Teste" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Matriz de Confusão */}
        {metricasTeste?.matriz_confusao && (
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Confusão</CardTitle>
              <CardDescription>
                Resultados da classificação no conjunto de teste
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="px-4 py-2"></th>
                      {resultado.classes?.map((classe, idx) => (
                        <th key={idx} className="px-4 py-2 text-center bg-gray-50 border">
                          Previsto: {classe}
                        </th>
                      ))}
                      <th className="px-4 py-2 text-center bg-gray-100 border">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metricasTeste.matriz_confusao.map((linha, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 font-medium bg-gray-50 border">
                          Real: {resultado.classes?.[i]}
                        </td>
                        {linha.map((valor, j) => (
                          <td key={j} className="px-4 py-2 text-center border font-mono">
                            {valor}
                          </td>
                        ))}
                        <td className="px-4 py-2 text-center bg-gray-50 border font-mono font-bold">
                          {linha.reduce((a, b) => a + b, 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Importância das Variáveis (Random Forest) */}
        {algoritmo === 'random_forest' && resultado.importancia && (
          <Card>
            <CardHeader>
              <CardTitle>Importância das Variáveis</CardTitle>
              <CardDescription>
                Contribuição de cada variável para o modelo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(resultado.importancia)
                  .sort((a, b) => b[1] - a[1])
                  .map(([variavel, importancia], idx) => (
                    <div key={variavel} className="flex items-center gap-4">
                      <div className="w-32 font-medium truncate">{variavel}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(importancia / Math.max(...Object.values(resultado.importancia))) * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-sm w-16">
                            {importancia.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações adicionais do modelo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {resultado.n_nos && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Nós da Árvore</div>
              <div className="text-xl font-bold">{resultado.n_nos}</div>
            </div>
          )}
          {resultado.profundidade && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Profundidade</div>
              <div className="text-xl font-bold">{resultado.profundidade}</div>
            </div>
          )}
          {resultado.n_support_vectors && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Vetores de Suporte</div>
              <div className="text-xl font-bold">{resultado.n_support_vectors}</div>
            </div>
          )}
          {resultado.oob_error && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Erro OOB</div>
              <div className="text-xl font-bold">{(resultado.oob_error * 100).toFixed(1)}%</div>
            </div>
          )}
        </div>
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
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Target className="w-6 h-6" />
                </div>
                <span>Classificação</span>
              </div>
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                <GitBranch className="w-3 h-3 mr-2" />
                {ALGORITMOS_CONFIG[algoritmo].nome}
              </Badge>
            </CardTitle>
            <CardDescription className="text-green-100">
              Algoritmos de classificação supervisionada
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Algoritmo */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-500" />
                  Algoritmo
                </h3>
                
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {Object.entries(ALGORITMOS_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setAlgoritmo(key)}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        algoritmo === key
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 shadow-md'
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
                  <Filter className="w-4 h-4 text-green-500" />
                  Parâmetros
                </h3>

                <div className="space-y-4 bg-gray-50 p-4 rounded-xl max-h-[400px] overflow-y-auto">
                  {renderParametros()}
                </div>
              </div>

              {/* Variáveis */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-500" />
                  Variáveis
                </h3>

                {/* Target */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Variável Alvo (Target)
                  </label>
                  <select
                    value={variavelTarget}
                    onChange={(e) => setVariavelTarget(e.target.value)}
                    className="w-full p-2 border rounded-lg mb-4"
                  >
                    <option value="">Selecione...</option>
                    {infoDados.variaveis.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* Preditoras */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Variáveis Preditoras ({variaveisSelecionadas.length})
                  </label>
                  <div className="bg-gray-50 p-4 rounded-xl max-h-64 overflow-y-auto">
                    {infoDados.variaveis
                      .filter(v => v !== variavelTarget)
                      .map(variavel => (
                        <label
                          key={variavel}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                            variaveisSelecionadas.includes(variavel)
                              ? 'bg-green-50 border border-green-200'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={variaveisSelecionadas.includes(variavel)}
                            onChange={() => handleToggleVariavel(variavel)}
                            className="w-4 h-4 rounded text-green-600"
                          />
                          <span className="text-sm font-medium flex-1">{variavel}</span>
                          {variaveisSelecionadas.includes(variavel) && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </label>
                      ))}
                  </div>
                </div>

                <Button
                  onClick={handleExecutar}
                  disabled={executando || variaveisSelecionadas.length < 1 || !variavelTarget}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium text-lg mt-4"
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