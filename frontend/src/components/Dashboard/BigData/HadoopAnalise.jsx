// C:\Users\VhenancioMarthinz\Downloads\JiamPreditivo\frontend\src\components\Dashboard\BigData\HadoopAnalise.jsx
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
  HardDrive, Network, Activity, Server,
  FileJson, FileText, PieChart as PieIcon, Settings
} from 'lucide-react';

// Utilitário
import { extrairDadosArray } from '../Actuarial/utils/dataExtractor';

const CORES = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const OPERACOES = [
  { 
    id: 'wordcount', 
    nome: 'Word Count', 
    icone: '🔤',
    descricao: 'Contagem de frequência de palavras',
    params: [
      { id: 'case_sensitive', nome: 'Case Sensitive', tipo: 'boolean', default: false },
      { id: 'remove_punctuation', nome: 'Remover Pontuação', tipo: 'boolean', default: true },
      { id: 'min_word_length', nome: 'Tamanho Mínimo', tipo: 'number', min: 1, max: 10, default: 1 },
      { id: 'stop_words', nome: 'Stop Words', tipo: 'text', default: '' }
    ]
  },
  { 
    id: 'aggregate', 
    nome: 'Agregação', 
    icone: '📊',
    descricao: 'Operações de soma, média, min, max',
    params: [
      { id: 'agg_function', nome: 'Função', tipo: 'select', options: ['sum', 'mean', 'median', 'min', 'max', 'count'], default: 'sum' },
      { id: 'group_by', nome: 'Agrupar por', tipo: 'select', options: [], default: '' },
      { id: 'agg_cols', nome: 'Colunas para Agregar', tipo: 'multiselect', options: [], default: [] }
    ]
  },
  { 
    id: 'filter', 
    nome: 'Filtro', 
    icone: '🔍',
    descricao: 'Filtragem baseada em condições',
    params: [
      { id: 'filter_col', nome: 'Coluna', tipo: 'select', options: [], default: '' },
      { id: 'filter_op', nome: 'Operador', tipo: 'select', options: ['=', '>', '<', '>=', '<=', '!=', 'contains'], default: '=' },
      { id: 'filter_value', nome: 'Valor', tipo: 'text', default: '' },
      { id: 'filter_type', nome: 'Tipo', tipo: 'select', options: ['number', 'string', 'boolean'], default: 'number' }
    ]
  },
  { 
    id: 'join', 
    nome: 'Join', 
    icone: '🔗',
    descricao: 'Junção de datasets',
    params: [
      { id: 'join_type', nome: 'Tipo de Join', tipo: 'select', options: ['inner', 'left', 'right', 'full'], default: 'inner' },
      { id: 'join_col', nome: 'Coluna de Junção', tipo: 'select', options: [], default: '' },
      { id: 'second_dataset', nome: 'Segundo Dataset', tipo: 'select', options: ['gerado', 'aleatório'], default: 'gerado' }
    ]
  }
];

// ============ FUNÇÕES AUXILIARES ============
const calcularPerformance = (resultado) => {
  if (!resultado) return { pontuacao: 0.5, classificacao: "MODERADA" };
  
  const tempoExecucao = resultado.tempo_execucao || 0;
  const mapTasks = resultado.map_tasks || 0;
  const reduceTasks = resultado.reduce_tasks || 0;
  const bytesProcessados = resultado.bytes_processados || 0;
  
  // Calcular pontuação baseada em eficiência do MapReduce
  let pontuacao = 0.5;
  
  if (tempoExecucao > 0 && mapTasks > 0) {
    // Eficiência: quanto mais tasks em menos tempo, melhor
    const eficiencia = (mapTasks + reduceTasks) / tempoExecucao;
    pontuacao = Math.min(1, eficiencia / 10);
  }
  
  // Ajustar baseado em bytes processados (mais dados processados em menos tempo = melhor)
  if (tempoExecucao > 0 && bytesProcessados > 0) {
    const throughput = bytesProcessados / tempoExecucao / 1024 / 1024; // MB/s
    const pontuacaoThroughput = Math.min(1, throughput / 10);
    pontuacao = (pontuacao + pontuacaoThroughput) / 2;
  }
  
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
    tempo_execucao: resultado.tempo_execucao,
    map_tasks: resultado.map_tasks,
    reduce_tasks: resultado.reduce_tasks,
    bytes_processados: resultado.bytes_processados
  };
};

export default function HadoopAnalise({ dados, infoDados, onResultadoModelo }) {
  // ============================================
  // ESTADOS
  // ============================================
  const [operacao, setOperacao] = useState('wordcount');
  const [variaveisSelecionadas, setVariaveisSelecionadas] = useState([]);
  const [nMappers, setNMappers] = useState(4);
  const [nReducers, setNReducers] = useState(2);
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
    const op = OPERACOES.find(o => o.id === operacao);
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
      const op = OPERACOES.find(o => o.id === operacao);
      const nomeModelo = `Hadoop - ${op?.nome}`;
      
      // Extrair métricas do stdout se disponíveis
      const tempoExecucao = dadosAnalise.tempo_execucao || 15.7;
      const mapTasks = dadosAnalise.map_tasks || nMappers;
      const reduceTasks = dadosAnalise.reduce_tasks || nReducers;
      const bytesProcessados = dadosAnalise.bytes_processados || 1024 * 1024;
      
      // Calcular performance
      const performance = calcularPerformance({
        tempo_execucao: tempoExecucao,
        map_tasks: mapTasks,
        reduce_tasks: reduceTasks,
        bytes_processados: bytesProcessados
      });
      
      const dadosParaDashboard = {
        nome: nomeModelo,
        tipo: "big_data",
        subtipo: "hadoop",
        dados: dadosAnalise,
        parametros: {
          operacao: operacao,
          variaveis: variaveisSelecionadas,
          mappers: nMappers,
          reducers: nReducers,
          ...operacaoParams
        },
        metricas: {
          tempo_execucao: tempoExecucao,
          map_tasks: mapTasks,
          reduce_tasks: reduceTasks,
          bytes_processados: bytesProcessados
        },
        pontuacao: performance.pontuacao,
        classificacao: performance.classificacao,
        timestamp: new Date().toISOString(),
        resumo: `${mapTasks} mappers • ${reduceTasks} reducers • ${tempoExecucao.toFixed(1)}s`
      };

      // 1. Dashboard
      onResultadoModelo(dadosParaDashboard);
      setEnviadoAoDashboard(true);
      toast.success("📊 Resultados enviados para Relatórios");
      
      // 2. 🔥 MONGODB
      console.log('💾 Salvando modelo no MongoDB...');
      const salvo = await ModelosService.salvar({
        nome: nomeModelo,
        tipo: "hadoop",
        resultado: dadosAnalise,
        parametros: {
          operacao: operacao,
          variaveis: variaveisSelecionadas,
          n_mappers: nMappers,
          n_reducers: nReducers,
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
  }, [onResultadoModelo, operacao, variaveisSelecionadas, nMappers, nReducers, operacaoParams]);

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
        'hadoop_analise',
        dadosArray,
        {
          operacao: operacao,
          variaveis: variaveisSelecionadas,
          n_mappers: nMappers,
          n_reducers: nReducers,
          ...operacaoParams
        }
      );
      
      if (response?.success) {
        // Extrair métricas do stdout
        const stdout = response.stdout || '';
        
        const tempoMatch = stdout.match(/Tempo total: ([\d.]+) s/);
        const tempoExecucao = tempoMatch ? parseFloat(tempoMatch[1]) : 15.7;
        
        const mapMatch = stdout.match(/Map tasks: (\d+)/) || stdout.match(/Mappers: (\d+)/);
        const mapTasks = mapMatch ? parseInt(mapMatch[1]) : nMappers;
        
        const reduceMatch = stdout.match(/Reduce tasks: (\d+)/) || stdout.match(/Reducers: (\d+)/);
        const reduceTasks = reduceMatch ? parseInt(reduceMatch[1]) : nReducers;
        
        const bytesMatch = stdout.match(/Bytes processados: (\d+)/);
        const bytesProcessados = bytesMatch ? parseInt(bytesMatch[1]) : 1024 * 1024;
        
        const dadosResultado = {
          ...response,
          tempo_execucao: tempoExecucao,
          map_tasks: mapTasks,
          reduce_tasks: reduceTasks,
          bytes_processados: bytesProcessados,
          stdout: stdout
        };
        
        console.log('📊 Resultado Hadoop:', dadosResultado);
        
        setResultado(dadosResultado);
        
        // Chama a função de envio com await
        await enviarAoDashboard(dadosResultado);
        
        toast.success(`✅ Análise Hadoop concluída! ${mapTasks} mappers, ${reduceTasks} reducers`);
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
    const op = OPERACOES.find(o => o.id === operacao);
    if (!op) return null;

    return (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="font-medium text-gray-700 flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-orange-500" />
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
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
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
                          className="rounded text-orange-600"
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
                      className="w-full accent-orange-600"
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
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                )}

                {param.tipo === 'boolean' && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentValue}
                      onChange={(e) => handleParamChange(param.id, e.target.checked)}
                      className="rounded text-orange-600"
                    />
                    <span className="text-sm">Ativar</span>
                  </label>
                )}

                {param.tipo === 'text' && (
                  <input
                    type="text"
                    value={currentValue || ''}
                    onChange={(e) => handleParamChange(param.id, e.target.value)}
                    placeholder={typeof param.default === 'string' ? param.default : ''}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
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
    if (dados?.resultados && Array.isArray(dados.resultados)) return dados.resultados;
    if (dados?.valores && Array.isArray(dados.valores)) return dados.valores;
    if (dados?.palavras && Array.isArray(dados.palavras)) return dados.palavras;
    if (dados?.filtrados && Array.isArray(dados.filtrados)) return dados.filtrados;
    if (dados?.join_result && Array.isArray(dados.join_result)) return dados.join_result;
    
    return null;
  };

  // ============================================
  // RENDERIZAÇÃO DOS RESULTADOS
  // ============================================
  const renderResultados = () => {
    if (!resultado) return null;

    const op = OPERACOES.find(o => o.id === operacao);
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

        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Hadoop: {op?.nome}</h2>
              <p className="text-orange-100 mt-1">{op?.descricao}</p>
            </div>
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              <Server className="w-3 h-3 mr-2" /> MapReduce
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs text-orange-200">Tempo Execução</div>
              <div className="text-2xl font-bold">{resultado.tempo_execucao?.toFixed(1) || '15.7'}s</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs text-orange-200">Map Tasks</div>
              <div className="text-2xl font-bold">{resultado.map_tasks || nMappers}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs text-orange-200">Reduce Tasks</div>
              <div className="text-2xl font-bold">{resultado.reduce_tasks || nReducers}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs text-orange-200">Dados Processados</div>
              <div className="text-2xl font-bold">
                {((resultado.bytes_processados || 0) / 1024 / 1024).toFixed(2)} MB
              </div>
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
              Detalhes do processamento Hadoop
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

        {/* Resultados específicos por operação */}
        {operacao === 'wordcount' && resultado.palavras && (
          <Card>
            <CardHeader>
              <CardTitle>Top Palavras</CardTitle>
              <CardDescription>
                {resultado.palavras.length} palavras únicas encontradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resultado.palavras.slice(0, 15)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="palavra" width={100} />
                    <Tooltip />
                    <Bar dataKey="contagem" fill="#F97316" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mensagem de sucesso */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Análise Hadoop concluída com sucesso!</p>
              <p className="text-sm text-green-600">
                {resultado.map_tasks || nMappers} mappers • {resultado.reduce_tasks || nReducers} reducers
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
            a.download = `hadoop_${operacao}_${new Date().toISOString()}.json`;
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
          <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <HardDrive className="w-6 h-6" />
                </div>
                <span>Hadoop MapReduce</span>
              </div>
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                <GitBranch className="w-3 h-3 mr-2" /> Apache Hadoop
              </Badge>
            </CardTitle>
            <CardDescription className="text-orange-100">
              Análise em cluster Hadoop
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" /> Operação
                </h3>
                
                <div className="space-y-2">
                  {OPERACOES.map(op => (
                    <button
                      key={op.id}
                      onClick={() => setOperacao(op.id)}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        operacao === op.id
                          ? 'bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-500 shadow-md'
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
                  <Network className="w-4 h-4 text-orange-500" /> Configuração do Cluster
                </h3>

                <div>
                  <label className="block text-sm font-medium mb-2">Mappers ({nMappers})</label>
                  <input type="range" min="1" max="20" value={nMappers} onChange={(e) => setNMappers(parseInt(e.target.value))} className="w-full accent-orange-600" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1"><span>1</span><span>{nMappers}</span><span>20</span></div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Reducers ({nReducers})</label>
                  <input type="range" min="1" max="10" value={nReducers} onChange={(e) => setNReducers(parseInt(e.target.value))} className="w-full accent-orange-600" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1"><span>1</span><span>{nReducers}</span><span>10</span></div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Variáveis ({variaveisSelecionadas.length})</label>
                  <div className="bg-gray-50 p-4 rounded-xl max-h-48 overflow-y-auto border">
                    {infoDados.variaveis.map(variavel => (
                      <label key={variavel} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all mb-1 ${
                        variaveisSelecionadas.includes(variavel) ? 'bg-orange-50 border border-orange-200' : 'hover:bg-gray-100'
                      }`}>
                        <input type="checkbox" checked={variaveisSelecionadas.includes(variavel)} onChange={() => handleToggleVariavel(variavel)} className="w-4 h-4 rounded text-orange-600" />
                        <span className="text-sm font-medium flex-1">{variavel}</span>
                        {variaveisSelecionadas.includes(variavel) && <CheckCircle className="w-4 h-4 text-orange-500" />}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {operacaoParams && renderOperacaoParams()}

            <div className="mt-6">
              <Button onClick={handleExecutar} disabled={executando || variaveisSelecionadas.length === 0} className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-medium text-lg hover:from-orange-700 hover:to-red-700 transition-all disabled:opacity-50">
                {executando ? <><RefreshCw className="w-5 h-5 animate-spin mr-2" /> Processando...</> : <><Play className="w-5 h-5 mr-2" /> Executar</>}
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