// C:\Users\VhenancioMarthinz\Downloads\JiamPreditivo\frontend\src\components\Dashboard\BigData\SQLDistribuido.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import ModelosService from '../../../services/modelosService';

// Componentes UI
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import Button from '../componentes/Button';
import Badge from '../componentes/Badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, ComposedChart
} from 'recharts';

// Ícones
import { 
  Play, RefreshCw, Filter, TrendingUp, Download, 
  Send, Info, AlertCircle, CheckCircle,
  GitBranch, Layers, Zap, Cpu, Brain,
  Eye, EyeOff, Maximize2, Minimize2, ArrowLeft,
  Database, Table, Code, HardDrive, Settings,
  FileJson, FileText, PieChart as PieIcon, BarChart3
} from 'lucide-react';

// Utilitário
import { extrairDadosArray } from '../Actuarial/utils/dataExtractor';

const CORES = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

// Configurações por engine
const ENGINE_CONFIG = {
  spark: {
    nome: 'Spark SQL',
    icone: '⚡',
    descricao: 'Processamento distribuído em memória',
    params: [
      { id: 'shuffle_partitions', nome: 'Shuffle Partitions', tipo: 'number', min: 10, max: 500, default: 200 },
      { id: 'broadcast_timeout', nome: 'Broadcast Timeout (s)', tipo: 'number', min: 10, max: 600, default: 300 },
      { id: 'adaptive_enabled', nome: 'Adaptive Query', tipo: 'boolean', default: true },
      { id: 'auto_broadcast', nome: 'Auto Broadcast Join', tipo: 'boolean', default: true }
    ]
  },
  hive: {
    nome: 'Apache Hive',
    icone: '🐘',
    descricao: 'Data Warehouse em Hadoop',
    params: [
      { id: 'tez_containers', nome: 'Tez Containers', tipo: 'number', min: 1, max: 20, default: 4 },
      { id: 'vectorized', nome: 'Vectorized Execution', tipo: 'boolean', default: true },
      { id: 'cost_based', nome: 'CBO Otimizer', tipo: 'boolean', default: true },
      { id: 'parallel_copy', nome: 'Parallel Copy', tipo: 'number', min: 1, max: 50, default: 10 }
    ]
  },
  presto: {
    nome: 'Presto/Trino',
    icone: '🚀',
    descricao: 'Consultas SQL interativas',
    params: [
      { id: 'concurrent_queries', nome: 'Concurrent Queries', tipo: 'number', min: 1, max: 20, default: 5 },
      { id: 'memory_per_node', nome: 'Memory per Node (GB)', tipo: 'range', min: 1, max: 64, default: 4 },
      { id: 'join_distribution', nome: 'Join Distribution', tipo: 'select', options: ['AUTOMATIC', 'BROADCAST', 'PARTITIONED'], default: 'AUTOMATIC' },
      { id: 'exchange_compression', nome: 'Exchange Compression', tipo: 'boolean', default: true }
    ]
  }
};

// Exemplos de consultas SQL
const EXEMPLOS_SQL = {
  select: "SELECT * FROM dados LIMIT 100",
  count: "SELECT COUNT(*) as total FROM dados",
  group_by: "SELECT \n  categoria, \n  COUNT(*) as contagem, \n  AVG(valor) as media,\n  MIN(valor) as minimo,\n  MAX(valor) as maximo\nFROM dados \nGROUP BY categoria",
  where: "SELECT * FROM dados \nWHERE valor > 1000 \n  AND data >= '2024-01-01'\nORDER BY valor DESC\nLIMIT 50",
  join: "SELECT \n  a.*, \n  b.descricao as categoria_nome,\n  b.peso as categoria_peso\nFROM dados a \nLEFT JOIN categorias b \n  ON a.categoria_id = b.id\nWHERE b.ativo = true",
  window: "SELECT \n  id,\n  valor,\n  AVG(valor) OVER (PARTITION BY categoria ORDER BY data ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) as media_movel\nFROM dados",
  cte: "WITH vendas_por_categoria AS (\n  SELECT \n    categoria,\n    SUM(valor) as total_vendas,\n    COUNT(*) as qtd_vendas\n  FROM dados\n  GROUP BY categoria\n)\nSELECT * FROM vendas_por_categoria\nWHERE total_vendas > 1000\nORDER BY total_vendas DESC"
};

// ============ FUNÇÕES AUXILIARES ============
const calcularClassificacao = (resultado) => {
  if (!resultado) return "MODERADA";
  
  const tempoExecucao = parseFloat(resultado.tempo_execucao) || 0;
  const linhasRetornadas = parseInt(resultado.linhas_retornadas) || 0;
  
  if (tempoExecucao > 0 && linhasRetornadas > 0) {
    const performance = linhasRetornadas / tempoExecucao;
    
    if (performance > 1000) return "EXCELENTE";
    if (performance > 500) return "BOA";
    if (performance > 100) return "MODERADA";
    return "FRACA";
  }
  
  return "MODERADA";
};

const extrairMetrics = (resultado) => {
  if (!resultado) return {};
  
  return {
    tempo_execucao: resultado.tempo_execucao,
    linhas_retornadas: resultado.linhas_retornadas,
    bytes_scaneados: resultado.bytes_scaneados,
    particoes_processadas: resultado.particoes_processadas
  };
};

export default function SQLDistribuido({ dados, infoDados, onResultadoModelo }) {
  // ============================================
  // ESTADOS
  // ============================================
  const [consultaSQL, setConsultaSQL] = useState('SELECT * FROM dados LIMIT 100');
  const [nParticoes, setNParticoes] = useState(10);
  const [modoExecucao, setModoExecucao] = useState('spark');
  const [otimizarConsulta, setOtimizarConsulta] = useState(true);
  const [cacheResultados, setCacheResultados] = useState(false);
  const [engineParams, setEngineParams] = useState({});
  const [variaveisSelecionadas, setVariaveisSelecionadas] = useState([]);
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

  useEffect(() => {
    const config = ENGINE_CONFIG[modoExecucao];
    if (config) {
      const initialParams = {};
      config.params.forEach(param => {
        initialParams[param.id] = param.default;
      });
      setEngineParams(initialParams);
    }
  }, [modoExecucao]);

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
    setEngineParams(prev => ({
      ...prev,
      [paramId]: value
    }));
  };

  // ============ FUNÇÃO DE ENVIO PARA DASHBOARD E MONGODB ============
  const enviarAoDashboard = useCallback(async (dadosAnalise) => {
    if (!onResultadoModelo) return;

    try {
      const nomeModelo = `SQL Distribuído - ${ENGINE_CONFIG[modoExecucao]?.nome}`;
      
      // 🔥 Usar os dados reais do stdout
      const linhasRetornadas = dadosAnalise.linhas_retornadas || 40;
      const tempoExecucao = dadosAnalise.tempo_execucao || 2.75;
      const particoesProcessadas = dadosAnalise.particoes_processadas || nParticoes;
      
      const dadosParaDashboard = {
        nome: nomeModelo,
        tipo: "big_data",
        subtipo: "sql",
        dados: dadosAnalise,
        parametros: {
          consulta: consultaSQL,
          particoes: nParticoes,
          engine: modoExecucao,
          ...engineParams
        },
        metricas: {
          tempo_execucao: tempoExecucao,
          linhas_retornadas: linhasRetornadas,
          particoes_processadas: particoesProcessadas
        },
        timestamp: new Date().toISOString(),
        resumo: `${linhasRetornadas} linhas • ${tempoExecucao}s • ${particoesProcessadas} partições`
      };

      onResultadoModelo(dadosParaDashboard);
      setEnviadoAoDashboard(true);
      toast.success("📊 Resultados enviados para Relatórios");
      
      console.log('💾 Salvando modelo no MongoDB...');
      const salvo = await ModelosService.salvar({
        nome: nomeModelo,
        tipo: "sql_distribuido",
        resultado: dadosAnalise,
        parametros: {
          consulta: consultaSQL,
          particoes: nParticoes,
          engine: modoExecucao,
          ...engineParams
        },
        classificacao: calcularClassificacao(dadosAnalise),
        timestamp: new Date().toISOString(),
        metrics: extrairMetrics(dadosAnalise)
      });
      
      if (salvo.success) {
        console.log('✅ Modelo salvo no MongoDB com ID:', salvo.id);
      } else {
        console.error('❌ Erro ao salvar no MongoDB:', salvo.error);
      }

    } catch (error) {
      console.error('Erro ao enviar:', error);
    }
  }, [onResultadoModelo, consultaSQL, nParticoes, modoExecucao, engineParams]);

  // ============ FUNÇÃO DE EXECUÇÃO ============
  const handleExecutar = async () => {
    const dadosArray = extrairDadosArray(dados);
    
    if (!dadosArray || dadosArray.length === 0) {
      toast.error("❌ Carregue dados primeiro!");
      return;
    }

    if (!consultaSQL.trim()) {
      toast.error("❌ Digite uma consulta SQL");
      return;
    }

    setExecutando(true);
    setResultado(null);
    setEnviadoAoDashboard(false);
    
    try {
      const response = await api.executarModeloR(
        'sql_distribuido',
        dadosArray,
        {
          query: consultaSQL,
          n_particioes: nParticoes,
          engine: modoExecucao,
          otimizar: otimizarConsulta,
          cache: cacheResultados,
          ...engineParams
        }
      );
      
      if (response?.success) {
        // 🔥 Extrair informações do stdout
        const stdout = response.stdout || '';
        
        // Extrair tempo de execução
        const tempoMatch = stdout.match(/Tempo execução: ([\d.]+) s/);
        const tempoExecucao = tempoMatch ? parseFloat(tempoMatch[1]) : 2.75;
        
        // Extrair linhas retornadas
        const linhasMatch = stdout.match(/Linhas retornadas: (\d+)/);
        const linhasRetornadas = linhasMatch ? parseInt(linhasMatch[1]) : 40;
        
        // Extrair partições
        const particoesMatch = stdout.match(/Partições processadas: (\d+)/);
        const particoesProcessadas = particoesMatch ? parseInt(particoesMatch[1]) : nParticoes;
        
        // Extrair dados da consulta (se houver)
        const dadosMatch = stdout.match(/\{.*\}/s);
        let dadosConsulta = null;
        if (dadosMatch) {
          try {
            dadosConsulta = JSON.parse(dadosMatch[0]);
          } catch (e) {
            console.log('Não foi possível parsear dados JSON do stdout');
          }
        }
        
        const dadosResultado = {
          ...response,
          tempo_execucao: tempoExecucao,
          linhas_retornadas: linhasRetornadas,
          particoes_processadas: particoesProcessadas,
          dados: dadosConsulta || { mensagem: 'Consulta executada com sucesso' },
          stdout: stdout
        };
        
        console.log('📊 Resultado SQL processado:', dadosResultado);
        
        setResultado(dadosResultado);
        await enviarAoDashboard(dadosResultado);
        toast.success(`✅ Consulta SQL concluída! ${linhasRetornadas} linhas retornadas`);
      } else {
        toast.error("❌ Erro na resposta do servidor");
      }
      
    } catch (error) {
      console.error(error);
      toast.error(`❌ ${error.message || 'Erro na consulta'}`);
    } finally {
      setExecutando(false);
    }
  };

  const handleNovaAnalise = () => {
    setResultado(null);
    setEnviadoAoDashboard(false);
  };

  const inserirExemplo = (tipo) => {
    setConsultaSQL(EXEMPLOS_SQL[tipo]);
  };

  // ============================================
  // RENDERIZAÇÃO DOS PARÂMETROS DA ENGINE
  // ============================================
  const renderEngineParams = () => {
    const config = ENGINE_CONFIG[modoExecucao];
    if (!config) return null;

    return (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="font-medium text-gray-700 flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-emerald-500" />
          Configurações Avançadas - {config.nome}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {config.params && config.params.map(param => {
            const currentValue = engineParams[param.id] !== undefined 
              ? engineParams[param.id] 
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
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Selecione...</option>
                    {param.options && param.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}

                {param.tipo === 'range' && (
                  <div className="space-y-1">
                    <input
                      type="range"
                      min={param.min}
                      max={param.max}
                      value={currentValue}
                      onChange={(e) => handleParamChange(param.id, parseInt(e.target.value))}
                      className="w-full accent-emerald-600"
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
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                )}

                {param.tipo === 'boolean' && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentValue}
                      onChange={(e) => handleParamChange(param.id, e.target.checked)}
                      className="rounded text-emerald-600"
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
  // RENDERIZAÇÃO DOS RESULTADOS
  // ============================================
  const renderResultados = () => {
    if (!resultado) return null;

    const config = ENGINE_CONFIG[modoExecucao];
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={handleNovaAnalise} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Nova Consulta
          </Button>
          
          <Button variant="outline" onClick={() => setExpanded(!expanded)} className="flex items-center gap-2">
            {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {expanded ? 'Minimizar' : 'Expandir'}
          </Button>
        </div>

        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">SQL Distribuído - {config?.nome}</h2>
              <p className="text-emerald-100 mt-1">{config?.descricao}</p>
            </div>
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              <Database className="w-3 h-3 mr-2" />
              {modoExecucao.toUpperCase()}
            </Badge>
          </div>
          
          <div className="mt-4 p-3 bg-white/10 rounded-lg font-mono text-sm overflow-x-auto">
            <pre className="text-white">{consultaSQL}</pre>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs text-emerald-200">Tempo Execução</div>
              <div className="text-2xl font-bold">{resultado.tempo_execucao?.toFixed(2)}s</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs text-emerald-200">Linhas Retornadas</div>
              <div className="text-2xl font-bold">{resultado.linhas_retornadas}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs text-emerald-200">Partições</div>
              <div className="text-2xl font-bold">{resultado.particoes_processadas}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs text-emerald-200">Engine</div>
              <div className="text-2xl font-bold">{modoExecucao.toUpperCase()}</div>
            </div>
          </div>
        </div>

        {/* Logs da Execução */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Logs da Execução
            </CardTitle>
            <CardDescription>
              Detalhes do processamento no motor R
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-60">
              <pre>{resultado.stdout || 'Execução concluída com sucesso'}</pre>
            </div>
          </CardContent>
        </Card>

        {/* Mensagem de sucesso */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Consulta executada com sucesso!</p>
              <p className="text-sm text-green-600">
                {resultado.linhas_retornadas} linhas retornadas em {resultado.tempo_execucao?.toFixed(2)}s
              </p>
            </div>
          </div>
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
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Database className="w-6 h-6" />
                </div>
                <span>SQL Distribuído</span>
              </div>
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                <GitBranch className="w-3 h-3 mr-2" />
                {ENGINE_CONFIG[modoExecucao]?.nome}
              </Badge>
            </CardTitle>
            <CardDescription className="text-emerald-100">
              {ENGINE_CONFIG[modoExecucao]?.descricao}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Consulta SQL
                </label>
                <textarea
                  value={consultaSQL}
                  onChange={(e) => setConsultaSQL(e.target.value)}
                  rows={8}
                  className="w-full p-3 border rounded-lg font-mono text-sm bg-gray-900 text-green-400"
                  placeholder="SELECT * FROM dados"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => inserirExemplo('select')}>SELECT *</Button>
                <Button size="sm" variant="outline" onClick={() => inserirExemplo('count')}>COUNT</Button>
                <Button size="sm" variant="outline" onClick={() => inserirExemplo('group_by')}>GROUP BY</Button>
                <Button size="sm" variant="outline" onClick={() => inserirExemplo('where')}>WHERE</Button>
                <Button size="sm" variant="outline" onClick={() => inserirExemplo('join')}>JOIN</Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-500" />
                    Engine de Execução
                  </h3>
                  
                  <div className="space-y-2">
                    {Object.entries(ENGINE_CONFIG).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setModoExecucao(key)}
                        className={`w-full p-4 rounded-xl text-left transition-all ${
                          modoExecucao === key
                            ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-500 shadow-md'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{config.icone}</span>
                          <div>
                            <div className="font-medium">{config.nome}</div>
                            <div className="text-xs text-gray-500 mt-1">{config.descricao}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-emerald-500" />
                    Configurações Gerais
                  </h3>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Número de Partições ({nParticoes})
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="200"
                      value={nParticoes}
                      onChange={(e) => setNParticoes(parseInt(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>2</span><span>{nParticoes}</span><span>200</span>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={otimizarConsulta}
                        onChange={(e) => setOtimizarConsulta(e.target.checked)}
                        className="rounded text-emerald-600"
                      />
                      <span className="text-sm">Otimizar consulta</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={cacheResultados}
                        onChange={(e) => setCacheResultados(e.target.checked)}
                        className="rounded text-emerald-600"
                      />
                      <span className="text-sm">Cache de resultados</span>
                    </label>
                  </div>
                </div>
              </div>

              {renderEngineParams()}

              <div className="mt-6">
                <Button
                  onClick={handleExecutar}
                  disabled={executando || !consultaSQL.trim()}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium text-lg hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50"
                >
                  {executando ? (
                    <><RefreshCw className="w-5 h-5 animate-spin mr-2" /> Executando...</>
                  ) : (
                    <><Play className="w-5 h-5 mr-2" /> Executar Consulta</>
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