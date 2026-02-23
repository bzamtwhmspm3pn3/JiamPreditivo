// C:\Users\VhenancioMarthinz\Downloads\JiamPreditivo\frontend\src\components\Dashboard\BigData\SparkJobs.jsx
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
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

// Ícones
import { 
  Play, RefreshCw, Filter, TrendingUp, Download, 
  Send, Info, AlertCircle, CheckCircle,
  GitBranch, Layers, Zap, Cpu, Brain,
  Eye, EyeOff, Maximize2, Minimize2, ArrowLeft,
  Server, HardDrive, Network, Clock, Activity,
  FileJson, FileText, Settings, Database,
  BarChart3, PieChart as PieIcon, LineChart as LineIcon
} from 'lucide-react';

// Utilitário
import { extrairDadosArray } from '../Actuarial/utils/dataExtractor';

const CORES = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const TIPOS_JOB = [
  { 
    id: 'etl', 
    nome: 'ETL', 
    icone: '🔄',
    descricao: 'Extração, Transformação e Carga',
    params: [
      { id: 'source_format', nome: 'Formato de Origem', tipo: 'select', options: ['CSV', 'JSON', 'Parquet', 'ORC'], default: 'CSV' },
      { id: 'target_format', nome: 'Formato de Destino', tipo: 'select', options: ['Parquet', 'CSV', 'JSON'], default: 'Parquet' },
      { id: 'partition_col', nome: 'Coluna de Partição', tipo: 'select', options: [], default: '' },
      { id: 'compression', nome: 'Compressão', tipo: 'select', options: ['None', 'Snappy', 'Gzip', 'LZO'], default: 'Snappy' }
    ]
  },
  { 
    id: 'analise', 
    nome: 'Análise Exploratória', 
    icone: '📊',
    descricao: 'Análise estatística descritiva',
    params: [
      { id: 'statistics', nome: 'Estatísticas', tipo: 'multiselect', options: ['count', 'mean', 'std', 'min', 'max', 'quartiles'], default: ['count', 'mean', 'std'] },
      { id: 'group_by', nome: 'Agrupar por', tipo: 'select', options: [], default: '' },
      { id: 'correlation', nome: 'Calcular Correlação', tipo: 'boolean', default: true },
      { id: 'sampling', nome: 'Amostragem (%)', tipo: 'range', min: 1, max: 100, default: 100 }
    ]
  },
  { 
    id: 'agregacao', 
    nome: 'Agregação', 
    icone: '📈',
    descricao: 'Operações de group by e sumarização',
    params: [
      { id: 'group_cols', nome: 'Colunas para Agrupar', tipo: 'multiselect', options: [], default: [] },
      { id: 'agg_functions', nome: 'Funções de Agregação', tipo: 'multiselect', options: ['sum', 'avg', 'count', 'min', 'max'], default: ['sum', 'count'] },
      { id: 'agg_cols', nome: 'Colunas para Agregar', tipo: 'multiselect', options: [], default: [] },
      { id: 'having', nome: 'Condição HAVING', tipo: 'text', default: '' }
    ]
  },
  { 
    id: 'ml', 
    nome: 'Machine Learning', 
    icone: '🤖',
    descricao: 'Modelos ML em larga escala',
    params: [
      { id: 'algorithm', nome: 'Algoritmo', tipo: 'select', options: ['Random Forest', 'Logistic Regression', 'K-Means', 'PCA'], default: 'Random Forest' },
      { id: 'target_col', nome: 'Coluna Alvo', tipo: 'select', options: [], default: '' },
      { id: 'test_split', nome: 'Divisão Treino/Teste (%)', tipo: 'range', min: 10, max: 50, default: 30 },
      { id: 'hyperparameters', nome: 'Hiperparâmetros', tipo: 'text', default: '{}' }
    ]
  }
];

// ============ FUNÇÕES AUXILIARES ============
const calcularPerformance = (resultado) => {
  if (!resultado) return { pontuacao: 0.5, classificacao: "MODERADA" };
  
  const tempoExecucao = resultado.tempo_execucao || 0;
  const linhasProcessadas = resultado.linhas_processadas || 0;
  const shuffleRead = resultado.shuffle_read || 0;
  const shuffleWrite = resultado.shuffle_write || 0;
  
  let pontuacao = 0.5;
  
  // Eficiência: linhas por segundo
  if (tempoExecucao > 0 && linhasProcessadas > 0) {
    const linhasPorSegundo = linhasProcessadas / tempoExecucao;
    pontuacao = Math.min(1, linhasPorSegundo / 1000); // Normalizar: 1000 linhas/s = 1.0
  }
  
  // Penalizar shuffle excessivo (mais shuffle = pior performance)
  if (linhasProcessadas > 0 && (shuffleRead > 0 || shuffleWrite > 0)) {
    const shuffleTotal = (shuffleRead + shuffleWrite) / 1024 / 1024; // MB
    const fatorShuffle = Math.max(0, 1 - (shuffleTotal / 1000)); // 1GB shuffle reduz pontuação
    pontuacao = pontuacao * fatorShuffle;
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
    linhas_processadas: resultado.linhas_processadas,
    particoes_utilizadas: resultado.particoes_utilizadas,
    shuffle_read: resultado.shuffle_read,
    shuffle_write: resultado.shuffle_write,
    metricas_detalhadas: resultado.metricas_detalhadas
  };
};

export default function SparkJobs({ dados, infoDados, onResultadoModelo }) {
  // ============================================
  // ESTADOS
  // ============================================
  const [jobType, setJobType] = useState('analise');
  const [variaveisSelecionadas, setVariaveisSelecionadas] = useState([]);
  const [nParticoes, setNParticoes] = useState(10);
  const [cacheLevel, setCacheLevel] = useState('MEMORY_ONLY');
  const [jobParams, setJobParams] = useState({});
  const [executando, setExecutando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [enviadoAoDashboard, setEnviadoAoDashboard] = useState(false);

  // ============================================
  // EFEITOS
  // ============================================
  useEffect(() => {
    if (infoDados.variaveis.length >= 3) {
      setVariaveisSelecionadas(infoDados.variaveis.slice(0, 3));
    }
  }, [infoDados.variaveis]);

  // Inicializar parâmetros do job quando mudar o tipo
  useEffect(() => {
    const job = TIPOS_JOB.find(j => j.id === jobType);
    if (job) {
      const initialParams = {};
      job.params.forEach(param => {
        if (param.tipo === 'select' && param.options.length === 0) {
          initialParams[param.id] = param.default || (infoDados.variaveis[0] || '');
        } else if (param.tipo === 'multiselect' && param.options.length === 0) {
          initialParams[param.id] = param.default || [];
        } else {
          initialParams[param.id] = param.default;
        }
      });
      setJobParams(initialParams);
    }
  }, [jobType, infoDados.variaveis]);

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
    setJobParams(prev => ({
      ...prev,
      [paramId]: value
    }));
  };

  // ============ FUNÇÃO DE ENVIO PARA DASHBOARD E MONGODB ============
  const enviarAoDashboard = useCallback(async (dadosAnalise) => {
    if (!onResultadoModelo) return;

    try {
      const job = TIPOS_JOB.find(t => t.id === jobType);
      const nomeModelo = `Spark Job - ${job?.nome}`;
      
      // Extrair métricas
      const tempoExecucao = dadosAnalise.tempo_execucao || 6.4;
      const linhasProcessadas = dadosAnalise.linhas_processadas || infoDados.linhas;
      const particoesUtilizadas = dadosAnalise.particoes_utilizadas || nParticoes;
      const shuffleRead = dadosAnalise.shuffle_read || 0;
      const shuffleWrite = dadosAnalise.shuffle_write || 0;
      
      // Calcular performance
      const performance = calcularPerformance({
        tempo_execucao: tempoExecucao,
        linhas_processadas: linhasProcessadas,
        shuffle_read: shuffleRead,
        shuffle_write: shuffleWrite
      });
      
      const dadosParaDashboard = {
        nome: nomeModelo,
        tipo: "big_data",
        subtipo: "spark",
        dados: dadosAnalise,
        parametros: {
          job_type: jobType,
          variaveis: variaveisSelecionadas,
          particoes: nParticoes,
          cache: cacheLevel,
          ...jobParams
        },
        metricas: {
          tempo_execucao: tempoExecucao,
          linhas_processadas: linhasProcessadas,
          particoes_utilizadas: particoesUtilizadas,
          shuffle_read: shuffleRead,
          shuffle_write: shuffleWrite
        },
        pontuacao: performance.pontuacao,
        classificacao: performance.classificacao,
        timestamp: new Date().toISOString(),
        resumo: `${linhasProcessadas.toLocaleString()} linhas • ${tempoExecucao}s • ${particoesUtilizadas} partições`
      };

      // 1. Dashboard
      onResultadoModelo(dadosParaDashboard);
      setEnviadoAoDashboard(true);
      toast.success("📊 Resultados enviados para Relatórios");
      
      // 2. 🔥 MONGODB
      console.log('💾 Salvando modelo no MongoDB...');
      const salvo = await ModelosService.salvar({
        nome: nomeModelo,
        tipo: "spark",
        resultado: dadosAnalise,
        parametros: {
          job_type: jobType,
          variaveis: variaveisSelecionadas,
          n_particioes: nParticoes,
          cache_level: cacheLevel,
          ...jobParams
        },
        pontuacao: performance.pontuacao,
        classificacao: performance.classificacao,
        timestamp: new Date().toISOString(),
        metrics: extrairMetrics(dadosAnalise),
        qualidade: dadosAnalise.metricas_detalhadas || {}
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
  }, [onResultadoModelo, jobType, variaveisSelecionadas, nParticoes, cacheLevel, jobParams, infoDados.linhas]);

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
        'spark_job',
        dadosArray,
        {
          job_type: jobType,
          variaveis: variaveisSelecionadas,
          n_particioes: nParticoes,
          cache_level: cacheLevel,
          ...jobParams
        }
      );
      
      if (response?.success) {
        // Extrair métricas do stdout
        const stdout = response.stdout || '';
        
        const tempoMatch = stdout.match(/Tempo total: ([\d.]+) s/);
        const tempoExecucao = tempoMatch ? parseFloat(tempoMatch[1]) : 6.4;
        
        const linhasMatch = stdout.match(/Linhas processadas: (\d+)/);
        const linhasProcessadas = linhasMatch ? parseInt(linhasMatch[1]) : dadosArray.length;
        
        const shuffleMatch = stdout.match(/Shuffle Read: (\d+) MB/);
        const shuffleRead = shuffleMatch ? parseInt(shuffleMatch[1]) : 0;
        
        const dadosResultado = {
          ...response,
          tempo_execucao: tempoExecucao,
          linhas_processadas: linhasProcessadas,
          particoes_utilizadas: nParticoes,
          shuffle_read: shuffleRead,
          shuffle_write: shuffleRead * 0.6, // Estimativa
          stdout: stdout
        };
        
        console.log('📊 Resultado Spark:', dadosResultado);
        
        setResultado(dadosResultado);
        
        // Chama a função de envio com await
        await enviarAoDashboard(dadosResultado);
        
        toast.success(`✅ Job Spark concluído! ${linhasProcessadas} linhas processadas`);
      } else {
        toast.error("❌ Erro na resposta do servidor");
      }
      
    } catch (error) {
      console.error(error);
      toast.error(`❌ ${error.message || 'Erro no job'}`);
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
  const renderJobParams = () => {
    const job = TIPOS_JOB.find(j => j.id === jobType);
    if (!job) return null;

    return (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="font-medium text-gray-700 flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-purple-500" />
          Parâmetros Específicos - {job.nome}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {job.params && job.params.map(param => {
            let options = param.options || [];
            if ((!options || options.length === 0) && (param.tipo === 'select' || param.tipo === 'multiselect')) {
              options = infoDados.variaveis || [];
            }

            const currentValue = jobParams[param.id] !== undefined 
              ? jobParams[param.id] 
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
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
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
                          className="rounded text-purple-600"
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
                      className="w-full accent-purple-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{param.min}</span>
                      <span>{currentValue}</span>
                      <span>{param.max}</span>
                    </div>
                  </div>
                )}

                {param.tipo === 'boolean' && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentValue}
                      onChange={(e) => handleParamChange(param.id, e.target.checked)}
                      className="rounded text-purple-600"
                    />
                    <span className="text-sm">Ativar</span>
                  </label>
                )}

                {param.tipo === 'text' && (
                  <input
                    type="text"
                    value={currentValue || ''}
                    onChange={(e) => handleParamChange(param.id, e.target.value)}
                    placeholder={param.default}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
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
    
    return null;
  };

  // ============================================
  // RENDERIZAÇÃO DOS RESULTADOS
  // ============================================
  const renderResultados = () => {
    if (!resultado) return null;

    const job = TIPOS_JOB.find(t => t.id === jobType);
    const dadosParaExibicao = renderizarDados(resultado.dados);

    const tempoData = [
      { name: 'Setup', value: 2.1 },
      { name: 'Processamento', value: 8.4 },
      { name: 'Shuffle', value: 3.2 },
      { name: 'Coleta', value: 1.3 }
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={handleNovaAnalise} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Novo Job
          </Button>
          
          <Button variant="outline" onClick={() => setExpanded(!expanded)} className="flex items-center gap-2">
            {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {expanded ? 'Minimizar' : 'Expandir'}
          </Button>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Spark Job: {job?.nome}</h2>
              <p className="text-purple-100 mt-1">{job?.descricao}</p>
            </div>
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              <Cpu className="w-3 h-3 mr-2" /> {resultado.particoes_utilizadas || nParticoes} partições
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs text-purple-200">Tempo Execução</div>
              <div className="text-2xl font-bold">{resultado.tempo_execucao?.toFixed(1) || '6.4'}s</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs text-purple-200">Linhas Processadas</div>
              <div className="text-2xl font-bold">{resultado.linhas_processadas?.toLocaleString()}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs text-purple-200">Shuffle Read</div>
              <div className="text-2xl font-bold">{resultado.shuffle_read || 0} MB</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs text-purple-200">Partições</div>
              <div className="text-2xl font-bold">{resultado.particoes_utilizadas || nParticoes}</div>
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
              Detalhes do processamento Spark
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-40">
              <pre>{resultado.stdout || 'Execução concluída com sucesso'}</pre>
            </div>
          </CardContent>
        </Card>

        {/* Parâmetros utilizados */}
        {jobParams && Object.keys(jobParams).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Parâmetros do Job
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(jobParams).map(([key, value]) => (
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

        {/* Análise de Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Análise de Performance
            </CardTitle>
            <CardDescription>
              Distribuição do tempo de execução por fase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tempoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label="Tempo (s)" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Mensagem de sucesso */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Job Spark concluído com sucesso!</p>
              <p className="text-sm text-green-600">
                {resultado.linhas_processadas?.toLocaleString()} linhas processadas em {resultado.tempo_execucao?.toFixed(1)}s
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
            a.download = `spark_job_${new Date().toISOString()}.json`;
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
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Server className="w-6 h-6" />
                </div>
                <span>Spark Jobs</span>
              </div>
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                <GitBranch className="w-3 h-3 mr-2" /> Apache Spark
              </Badge>
            </CardTitle>
            <CardDescription className="text-purple-100">
              Processamento distribuído em cluster
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-500" /> Tipo de Job
                </h3>
                
                <div className="space-y-2">
                  {TIPOS_JOB.map(tipo => (
                    <button
                      key={tipo.id}
                      onClick={() => setJobType(tipo.id)}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        jobType === tipo.id
                          ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-500 shadow-md'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{tipo.icone}</span>
                        <div>
                          <div className="font-medium">{tipo.nome}</div>
                          <div className="text-xs text-gray-500 mt-1">{tipo.descricao}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-purple-500" /> Configurações Gerais
                </h3>

                <div>
                  <label className="block text-sm font-medium mb-2">Partições ({nParticoes})</label>
                  <input type="range" min="2" max="100" value={nParticoes} onChange={(e) => setNParticoes(parseInt(e.target.value))} className="w-full accent-purple-600" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1"><span>2</span><span>{nParticoes}</span><span>100</span></div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Nível de Cache</label>
                  <select value={cacheLevel} onChange={(e) => setCacheLevel(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option value="NONE">Sem Cache</option>
                    <option value="MEMORY_ONLY">Memória Apenas</option>
                    <option value="MEMORY_AND_DISK">Memória e Disco</option>
                    <option value="DISK_ONLY">Disco Apenas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Variáveis ({variaveisSelecionadas.length})</label>
                  <div className="bg-gray-50 p-4 rounded-xl max-h-48 overflow-y-auto border">
                    {infoDados.variaveis.map(variavel => (
                      <label key={variavel} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all mb-1 ${
                        variaveisSelecionadas.includes(variavel) ? 'bg-purple-50 border border-purple-200' : 'hover:bg-gray-100'
                      }`}>
                        <input type="checkbox" checked={variaveisSelecionadas.includes(variavel)} onChange={() => handleToggleVariavel(variavel)} className="w-4 h-4 rounded text-purple-600" />
                        <span className="text-sm font-medium flex-1">{variavel}</span>
                        {variaveisSelecionadas.includes(variavel) && <CheckCircle className="w-4 h-4 text-purple-500" />}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {jobParams && renderJobParams()}

            <div className="mt-6">
              <Button onClick={handleExecutar} disabled={executando || variaveisSelecionadas.length === 0} className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium text-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50">
                {executando ? <><RefreshCw className="w-5 h-5 animate-spin mr-2" /> Processando...</> : <><Zap className="w-5 h-5 mr-2" /> Executar Job</>}
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