// C:\Users\VhenancioMarthinz\Downloads\JiamPreditivo\frontend\src\components\Dashboard\DataMining\Associacao.jsx
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
  ShoppingCart, Package, Link
} from 'lucide-react';

// Utilitário
import { extrairDadosArray } from '../Actuarial/utils/dataExtractor';

const CORES = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#06B6D4'
];

const ALGORITMOS_CONFIG = {
  apriori: {
    nome: 'Apriori',
    icone: '🛒',
    descricao: 'Algoritmo clássico para mineração de regras de associação',
    pacote: 'arules',
    metricas: ['total_regras', 'suporte_medio', 'confianca_media', 'lift_medio'],
    graficos: ['barras', 'pizza'],
    params: [
      { 
        id: 'min_support', 
        nome: 'Suporte Mínimo', 
        tipo: 'float', 
        min: 0.01, 
        max: 0.5, 
        step: 0.01,
        default: 0.1,
        descricao: 'Frequência mínima do itemset (0.01 = 1%)'
      },
      { 
        id: 'min_confidence', 
        nome: 'Confiança Mínima', 
        tipo: 'float', 
        min: 0.1, 
        max: 0.9, 
        step: 0.05,
        default: 0.5,
        descricao: 'Probabilidade mínima da regra (0.5 = 50%)'
      },
      { 
        id: 'min_length', 
        nome: 'Tamanho Mínimo', 
        tipo: 'number', 
        min: 1, 
        max: 5,
        default: 1,
        descricao: 'Número mínimo de itens na regra'
      },
      { 
        id: 'max_length', 
        nome: 'Tamanho Máximo', 
        tipo: 'number', 
        min: 2, 
        max: 10,
        default: 4,
        descricao: 'Número máximo de itens na regra'
      }
    ]
  },
  fp_growth: {
    nome: 'FP-Growth',
    icone: '🌲',
    descricao: 'Algoritmo eficiente para mining de padrões frequentes',
    pacote: 'arules',
    metricas: ['n_itemsets', 'suporte_medio'],
    graficos: ['barras'],
    params: [
      { 
        id: 'min_support', 
        nome: 'Suporte Mínimo', 
        tipo: 'float', 
        min: 0.01, 
        max: 0.5, 
        step: 0.01,
        default: 0.1,
        descricao: 'Frequência mínima do itemset'
      },
      { 
        id: 'min_length', 
        nome: 'Tamanho Mínimo', 
        tipo: 'number', 
        min: 1, 
        max: 5,
        default: 1,
        descricao: 'Número mínimo de itens'
      },
      { 
        id: 'max_length', 
        nome: 'Tamanho Máximo', 
        tipo: 'number', 
        min: 2, 
        max: 10,
        default: 5,
        descricao: 'Número máximo de itens'
      }
    ]
  },
  eclat: {
    nome: 'Eclat',
    icone: '⚡',
    descricao: 'Algoritmo para mining de itemsets frequentes',
    pacote: 'arules',
    metricas: ['n_itemsets', 'suporte_medio'],
    graficos: ['barras'],
    params: [
      { 
        id: 'min_support', 
        nome: 'Suporte Mínimo', 
        tipo: 'float', 
        min: 0.01, 
        max: 0.5, 
        step: 0.01,
        default: 0.1,
        descricao: 'Frequência mínima do itemset'
      },
      { 
        id: 'min_length', 
        nome: 'Tamanho Mínimo', 
        tipo: 'number', 
        min: 1, 
        max: 5,
        default: 1,
        descricao: 'Número mínimo de itens'
      },
      { 
        id: 'max_length', 
        nome: 'Tamanho Máximo', 
        tipo: 'number', 
        min: 2, 
        max: 10,
        default: 5,
        descricao: 'Número máximo de itens'
      }
    ]
  }
};

// ============ FUNÇÕES AUXILIARES ============
const calcularClassificacao = (resultado, algoritmo) => {
  if (!resultado) return "MODERADA";
  
  if (algoritmo === 'apriori' && resultado.estatisticas) {
    const liftMedio = resultado.estatisticas.lift_medio || 0;
    if (liftMedio > 3) return "EXCELENTE";
    if (liftMedio > 2) return "BOA";
    if (liftMedio > 1.5) return "MODERADA";
    return "FRACA";
  }
  
  if (algoritmo === 'fp_growth' || algoritmo === 'eclat') {
    const nItemsets = resultado.n_itemsets || 0;
    if (nItemsets > 50) return "EXCELENTE";
    if (nItemsets > 30) return "BOA";
    if (nItemsets > 10) return "MODERADA";
    return "FRACA";
  }
  
  return "MODERADA";
};

const extrairMetrics = (resultado, algoritmo) => {
  if (!resultado) return {};
  
  if (algoritmo === 'apriori' && resultado.estatisticas) {
    return {
      total_regras: resultado.estatisticas.total_regras,
      suporte_medio: resultado.estatisticas.suporte_medio,
      confianca_media: resultado.estatisticas.confianca_media,
      lift_medio: resultado.estatisticas.lift_medio,
      ...resultado.estatisticas
    };
  }
  
  if (algoritmo === 'fp_growth' || algoritmo === 'eclat') {
    return {
      n_itemsets: resultado.n_itemsets,
      n_transacoes: resultado.n_transacoes,
      suporte_medio: resultado.suporte_medio,
      ...resultado
    };
  }
  
  return {};
};

export default function Associacao({ dados, infoDados, onResultadoModelo }) {
  // ============================================
  // ESTADOS
  // ============================================
  const [algoritmo, setAlgoritmo] = useState('apriori');
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
      
      const nomeModelo = `Associação - ${config.nome}`;
      
      const dadosParaDashboard = {
        nome: nomeModelo,
        tipo: "data_mining",
        dados: dadosAnalise,
        categoria: 'associacao',
        algoritmo: algoritmo,
        parametros: {
          ...parametros,
          variaveis: variaveisSelecionadas
        },
        metricas: dadosAnalise.estatisticas || {},
        timestamp: new Date().toISOString(),
        resumo: `${dadosAnalise.regras?.length || dadosAnalise.n_itemsets || 0} regras • Suporte: ${parametros.min_support}`
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
        qualidade: dadosAnalise.estatisticas || {}
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
        'associacao',
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
        
        // Chama a função de envio (agora com await)
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
      </div>
    ));
  };

  // ============================================
  // RENDERIZAÇÃO DE MÉTRICAS
  // ============================================
  const renderMetricas = () => {
    const config = ALGORITMOS_CONFIG[algoritmo];
    if (!resultado) return null;

    if (algoritmo === 'apriori' && resultado.estatisticas) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Total de Regras</div>
            <div className="text-2xl font-bold">{resultado.estatisticas.total_regras}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Suporte Médio</div>
            <div className="text-2xl font-bold">{(resultado.estatisticas.suporte_medio * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Confiança Média</div>
            <div className="text-2xl font-bold">{(resultado.estatisticas.confianca_media * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Lift Médio</div>
            <div className="text-2xl font-bold">{resultado.estatisticas.lift_medio?.toFixed(2)}</div>
          </div>
        </div>
      );
    }

    if ((algoritmo === 'fp_growth' || algoritmo === 'eclat') && resultado.n_itemsets) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Itemsets Frequentes</div>
            <div className="text-2xl font-bold">{resultado.n_itemsets}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Transações</div>
            <div className="text-2xl font-bold">{resultado.n_transacoes}</div>
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
    if (!resultado) return null;

    const config = ALGORITMOS_CONFIG[algoritmo];

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
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{config.nome}</h2>
              <p className="text-purple-100 mt-1">{config.descricao}</p>
            </div>
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              <Cpu className="w-3 h-3 mr-2" />
              {config.pacote}
            </Badge>
          </div>
          
          {renderMetricas()}
        </div>

        {/* Regras de Associação (Apriori) */}
        {algoritmo === 'apriori' && resultado.regras && resultado.regras.length > 0 && (
          <Card>
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
              <CardTitle className="flex items-center gap-2">
                <Link className="w-5 h-5" />
                Regras de Associação
              </CardTitle>
              <CardDescription>
                Top {Math.min(20, resultado.regras.length)} regras ordenadas por lift
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left">Antecedente</th>
                      <th className="px-4 py-2 text-left">Consequente</th>
                      <th className="px-4 py-2 text-right">Suporte</th>
                      <th className="px-4 py-2 text-right">Confiança</th>
                      <th className="px-4 py-2 text-right">Lift</th>
                      <th className="px-4 py-2 text-right">Contagem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.regras.slice(0, 20).map((regra, idx) => (
                      <tr key={idx} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-1">
                            {regra.antecedente.map((item, i) => (
                              <Badge key={i} variant="info" className="bg-blue-100">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-1">
                            {regra.consequente.map((item, i) => (
                              <Badge key={i} variant="success" className="bg-green-100">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right font-mono">
                          {(regra.suporte * 100).toFixed(1)}%
                        </td>
                        <td className="px-4 py-2 text-right font-mono">
                          {(regra.confianca * 100).toFixed(1)}%
                        </td>
                        <td className="px-4 py-2 text-right font-mono">
                          {regra.lift.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono">
                          {regra.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Itemsets Frequentes (FP-Growth / Eclat) */}
        {(algoritmo === 'fp_growth' || algoritmo === 'eclat') && resultado.itemsets && (
          <Card>
            <CardHeader>
              <CardTitle>Itemsets Frequentes</CardTitle>
              <CardDescription>
                {resultado.itemsets.length} itemsets encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resultado.itemsets.map((itemset, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {itemset.itens.map((item, i) => (
                        <Badge key={i} variant="info" className="bg-purple-100">
                          {item}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Suporte:</span>
                      <span className="font-mono">{(itemset.suporte * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Contagem:</span>
                      <span className="font-mono">{itemset.count}</span>
                    </div>
                  </div>
                ))}
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
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <span>Associação</span>
              </div>
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                <GitBranch className="w-3 h-3 mr-2" />
                {ALGORITMOS_CONFIG[algoritmo].nome}
              </Badge>
            </CardTitle>
            <CardDescription className="text-purple-100">
              Mineração de regras de associação e padrões frequentes
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Algoritmo */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-500" />
                  Algoritmo
                </h3>
                
                <div className="space-y-2">
                  {Object.entries(ALGORITMOS_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setAlgoritmo(key)}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        algoritmo === key
                          ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-500 shadow-md'
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

                <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
                  {renderParametros()}
                </div>
              </div>

              {/* Variáveis */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-500" />
                  Itens/Variáveis
                </h3>

                <div className="bg-gray-50 p-4 rounded-xl max-h-64 overflow-y-auto">
                  {infoDados.variaveis.map(variavel => (
                    <label
                      key={variavel}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        variaveisSelecionadas.includes(variavel)
                          ? 'bg-purple-50 border border-purple-200'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={variaveisSelecionadas.includes(variavel)}
                        onChange={() => handleToggleVariavel(variavel)}
                        className="w-4 h-4 rounded text-purple-600"
                      />
                      <span className="text-sm font-medium flex-1">{variavel}</span>
                      {variaveisSelecionadas.includes(variavel) && (
                        <CheckCircle className="w-4 h-4 text-purple-500" />
                      )}
                    </label>
                  ))}
                </div>

                <Button
                  onClick={handleExecutar}
                  disabled={executando || variaveisSelecionadas.length < 2}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium text-lg"
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