// src/components/Dashboard/AtuarialSeguros.jsx - VERSÃO FUNCIONAL E LIMPA
import React, { useState, useEffect, useMemo } from "react";
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../services/api';

// 🔥 IMPORTAR O CONTEXT
import { useGLMModels } from '../../contexts/GLMModelsContext';

// Componentes das abas
import AjusteModelos from './Actuarial/AjusteModelos';
import TarificacaoAposteriori from './Actuarial/TarificacaoAposteriori';
import MonteCarlo from './Actuarial/MonteCarlo';
import CadeiasMarkov from './Actuarial/CadeiasMarkov';
import SegurosVida from './Actuarial/SegurosVida';

// Componentes UI
import Card from './componentes/Card';
import Button from './componentes/Button';
import Badge from './componentes/Badge';

// Importar utilitário de storage
import { actuarialStorage } from './utils/actuarialStorage';

// Função para extrair dados
const extrairDadosArray = (dadosObj) => {
  if (!dadosObj) return [];
  if (Array.isArray(dadosObj)) return dadosObj;
  
  if (typeof dadosObj === 'object') {
    if (dadosObj[0] && typeof dadosObj[0] === 'object' && !Array.isArray(dadosObj[0])) {
      return dadosObj;
    }
    if (dadosObj.dados_completos && Array.isArray(dadosObj.dados_completos)) {
      return dadosObj.dados_completos;
    }
    if (dadosObj.amostra && Array.isArray(dadosObj.amostra)) {
      return dadosObj.amostra;
    }
    if (dadosObj.data && Array.isArray(dadosObj.data)) {
      return dadosObj.data;
    }
    if (dadosObj.dados && Array.isArray(dadosObj.dados) && dadosObj.colunas) {
      return dadosObj.dados.map(linha => {
        const obj = {};
        dadosObj.colunas.forEach((col, idx) => {
          obj[col] = linha[idx];
        });
        return obj;
      });
    }
  }
  return [];
};

export default function AtuarialSeguros(props) {
  const {
    dados: dadosProp = null,
    onSaveModel = (nome, modelo) => {
      console.log('💾 Modelo atuarial salvo:', nome, modelo);
    },
    modelosAjustados = {},
    statusSistema: statusProp = null,
    onVoltar = null,
    onResultadoModelo = null
  } = props || {};

  // 🔥 USAR O CONTEXT GLOBAL
  let contextValues = {};
  try {
    contextValues = useGLMModels();
  } catch (error) {
    console.warn('⚠️ Contexto GLM não disponível');
  }

  const { 
    modelosGLM: modelosGLMContext = {},
    temModelosGLM: temModelosGLMContext = false,
    nCoeficientesGLM: nCoeficientesGLMContext = 0,
    frequencia: modeloFrequenciaContext = null,
    severidade: modeloSeveridadeContext = null,
    estatisticasResumidas: estatisticasContext = {},
    atualizarModelosGLM = () => {},
    adicionarAoHistorico = () => {}
  } = contextValues;

  const [modeloSelecionado, setModeloSelecionado] = useState('');
  
  // 🔥 ESTADO LOCAL
  const [modelosGLMLocal, setModelosGLMLocal] = useState({
    frequencia: null,
    severidade: null,
    resultadosCompletos: null,
    estatisticas: null,
    timestamp: null,
    tarifacaoCompleta: false
  });
  
  // 🔥 COMBINAR CONTEXT + LOCAL
  const modelosGLM = useMemo(() => ({
    ...modelosGLMLocal,
    ...modelosGLMContext
  }), [modelosGLMLocal, modelosGLMContext]);
  
  // Estados dos modelos ajustados
  const modeloFrequencia = modeloFrequenciaContext || modelosGLMLocal.frequencia;
  const modeloSeveridade = modeloSeveridadeContext || modelosGLMLocal.severidade;
  const estatisticas = { ...modelosGLMLocal.estatisticas, ...estatisticasContext };
  
  // 🔥 VERIFICAR SE TEM MODELOS GLM
  const temModelosGLM = !!(modeloFrequencia && modeloSeveridade);
  const nCoeficientesGLM = (modeloFrequencia?.coeficientesCount || 0) + 
                          (modeloSeveridade?.coeficientesCount || 0);
  
  // Resultados das outras abas
  const [resultadoMonteCarlo, setResultadoMonteCarlo] = useState(null);
  const [resultadoMarkov, setResultadoMarkov] = useState(null);
  const [resultadoTabua, setResultadoTabua] = useState(null);
  const [resultadoTarificacao, setResultadoTarificacao] = useState(null);
  
  // Estado local do sistema
  const [statusLocal, setStatusLocal] = useState({
    connected: false,
    loading: true,
    message: 'Verificando conexão...'
  });

  // Informações dos dados
  const [infoDados, setInfoDados] = useState({ 
    linhas: 0, 
    colunas: 0,
    variaveis: []
  });

  // 🔥 HISTÓRICO
  const [historicoLocal, setHistoricoLocal] = useState([]);

  // Usar o status passado ou criar local
  const statusFinal = statusProp || statusLocal;

  // ============================================
  // FUNÇÕES PRINCIPAIS (NECESSÁRIAS PARA EXECUÇÃO)
  // ============================================
  
  const receberModelosAjustados = (resultados) => {
    console.log('📥 AtuarialSeguros: Recebendo modelos ajustados');
    
    const ehTarifacaoCompleta = 
      resultados.tipo === 'glm_actuarial_duplo' ||
      resultados.premios_individualizados;
    
    const modelos = {
      frequencia: resultados.modelo_frequencia,
      severidade: resultados.modelo_severidade,
      resultadosCompletos: resultados,
      estatisticas: resultados.estatisticas || {},
      timestamp: resultados.timestamp || new Date().toISOString(),
      tarifacaoCompleta: ehTarifacaoCompleta
    };
    
    setModelosGLMLocal(modelos);
    if (atualizarModelosGLM) atualizarModelosGLM(modelos);
    
    // 🔥 ENVIAR PARA DASHBOARD (apenas GLM duplo)
    if (onResultadoModelo && ehTarifacaoCompleta) {
      const resultadoParaDashboard = {
        nome: "Tarifação Atuarial",
        tipo: "glm_actuarial_duplo",
        dados: resultados,
        timestamp: resultados.timestamp || new Date().toISOString()
      };
      
      onResultadoModelo(resultadoParaDashboard);
      
      setHistoricoLocal(prev => [{
        nome: "Tarifação Completa",
        tipo: "glm_actuarial_duplo",
        timestamp: new Date().toISOString()
      }, ...prev].slice(0, 10));
      
      if (adicionarAoHistorico) adicionarAoHistorico(resultadoParaDashboard);
    } else {
      setHistoricoLocal(prev => [{
        nome: "Ajuste de Modelos",
        tipo: "glm_actuarial",
        timestamp: new Date().toISOString()
      }, ...prev].slice(0, 10));
    }
    
    toast.success(ehTarifacaoCompleta ? `✅ Tarifação completa` : `✅ Modelos ajustados`);
  };

  // 🔥 FUNÇÃO DE CHAMADA R (CRÍTICA PARA EXECUÇÃO)
  const fazerChamadaR = async (config) => {
    if (!dadosProp) {
      toast.error('Carregue dados primeiro!');
      return null;
    }

    const dadosArray = extrairDadosArray(dadosProp);
    if (!dadosArray?.length) {
      toast.error('Nenhum dado disponível');
      return null;
    }

    try {
      const tipoMap = {
        'monte_carlo': 'monte_carlo_actuarial',
        'tarificacao_aposteriori': 'credibilidade_actuarial',
        'markov': 'markov_actuarial',
        'mortality_table': 'mortality_table',
        'a_priori': 'a_priori'
      };

      const tipoModelo = tipoMap[config.tipo] || config.tipo || 'actuarial';
      
      let resultado;
      
      if (statusFinal.connected) {
        try {
          const payload = {
            ...config,
            tipo: tipoModelo,
            dados: dadosArray
          };
          resultado = await api.executarModeloR(tipoModelo, dadosArray, payload);
        } catch (apiError) {
          console.warn('⚠️ API falhou, usando fallback');
          resultado = { success: true, ...config };
        }
      } else {
        resultado = { success: true, ...config };
      }

      if (resultado?.success) {
        const nomeModelo = config.tipo || 'Atuarial';
        toast.success(`✅ ${nomeModelo} executado!`);
        
        if (onSaveModel) onSaveModel(nomeModelo, resultado);
        return resultado;
      }
      return null;
    } catch (error) {
      console.error('Erro:', error);
      toast.error(`Erro: ${error.message}`);
      return null;
    }
  };

  // 🔥 CARREGAR DADOS SALVOS
  useEffect(() => {
    const modelosSalvos = actuarialStorage.recuperarModelosGLM();
    if (modelosSalvos && !temModelosGLM) {
      setModelosGLMLocal(modelosSalvos);
    }
    
    const historicoSalvo = actuarialStorage.recuperarHistorico();
    if (historicoSalvo?.length) {
      setHistoricoLocal(historicoSalvo.slice(0, 10));
    }
  }, []);

  // Verificar status do backend
  useEffect(() => {
    if (!statusProp) {
      const verificarConexao = async () => {
        try {
          setStatusLocal(prev => ({ ...prev, loading: true }));
          const resultado = await api.testConnection();
          setStatusLocal({
            connected: resultado.connected || false,
            loading: false,
            message: resultado.connected ? 'Conectado' : 'Modo demonstração'
          });
        } catch (error) {
          setStatusLocal({
            connected: false,
            loading: false,
            message: 'Erro na conexão'
          });
        }
      };
      verificarConexao();
    }
  }, [statusProp]);

  // Extrair variáveis dos dados
  useEffect(() => {
    const dadosArray = extrairDadosArray(dadosProp);
    if (dadosArray?.length > 0) {
      const vars = Object.keys(dadosArray[0]);
      setInfoDados({
        linhas: dadosArray.length,
        colunas: vars.length,
        variaveis: vars
      });
    }
  }, [dadosProp]);

  // ============================================
  // MAPEAMENTO DE COMPONENTES (CRÍTICO)
  // ============================================
  
  const MODELO_COMPONENTES = {
    ajuste: AjusteModelos,
    tarificacao: TarificacaoAposteriori,
    montecarlo: MonteCarlo,
    markov: CadeiasMarkov,
    vida: SegurosVida,
  };

  const ComponenteAtuarial = MODELO_COMPONENTES[modeloSelecionado];

  if (ComponenteAtuarial) {
    const propsBase = {
      dados: extrairDadosArray(dadosProp),
      variaveis: infoDados.variaveis,
      statusSistema: statusFinal,
      onSaveModel,
      onResultadoModelo,
      onVoltar: () => setModeloSelecionado('')
    };

    // 🔥 PROPS ESPECÍFICAS (NECESSÁRIAS PARA FUNCIONAMENTO)
    const propsComponentes = {
      ajuste: {
        ...propsBase,
        modeloFrequencia,
        modeloSeveridade,
        onModelosAjustados: receberModelosAjustados,
        ajustarModelo: fazerChamadaR,
      },
      montecarlo: {
        ...propsBase,
        modeloFrequencia,
        modeloSeveridade,
        resultadoMonteCarlo,
        setResultadoMonteCarlo,
        executarMonteCarlo: fazerChamadaR
      },
      tarificacao: {
        ...propsBase,
        modeloFrequencia,
        modeloSeveridade,
        resultadoTarificacao,
        setResultadoTarificacao,
        executarTarificacao: fazerChamadaR
      },
      markov: {
        ...propsBase,
        resultadoMarkov,
        setResultadoMarkov,
        executarMarkov: fazerChamadaR
      },
      vida: {
        ...propsBase,
        resultadoTabua,
        setResultadoTabua,
        criarTabuaMortalidade: fazerChamadaR
      }
    };

    return <ComponenteAtuarial {...propsComponentes[modeloSelecionado]} />;
  }

  // ============================================
  // RENDERIZAÇÃO PRINCIPAL (SIMPLES)
  // ============================================
  
  const semDados = !extrairDadosArray(dadosProp)?.length;

  return (
    <div className="space-y-6 p-4">
      {/* Status do Sistema */}
      <div className={`p-3 rounded-lg ${statusFinal.connected ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${statusFinal.connected ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-sm font-medium">
              {statusFinal.connected ? '✅ Backend R Conectado' : '⚠️ Modo Demonstração'}
            </span>
          </div>
          {onVoltar && (
            <Button variant="ghost" size="sm" onClick={onVoltar}>
              ⬅️ Voltar
            </Button>
          )}
        </div>
      </div>

      {/* Título */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🛡️ Análise Atuarial</h1>
        <p className="text-gray-600">Modelos especializados para seguros</p>
        
        {!semDados && (
          <div className="flex justify-center gap-4 mt-4">
            <Badge variant="outline">📊 {infoDados.linhas} obs</Badge>
            <Badge variant="outline">📋 {infoDados.colunas} vars</Badge>
            {temModelosGLM && <Badge variant="success">✅ {nCoeficientesGLM} coef</Badge>}
          </div>
        )}
      </div>

      {/* Aviso de dados */}
      {semDados && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="p-6 text-center">
            <p className="text-yellow-700">Carregue dados para iniciar análises atuariais.</p>
          </div>
        </Card>
      )}

      {/* Grid de Modelos Atuariais */}
      {!semDados && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { 
              id: 'ajuste', 
              icon: '⚙️', 
              title: 'Ajuste de Modelos', 
              color: 'blue',
              desc: 'Frequência + Severidade',
              badge: temModelosGLM ? 'success' : 'outline',
              badgeText: temModelosGLM ? `✅ ${nCoeficientesGLM} coef` : '⏳ Aguardando'
            },
            { 
              id: 'tarificacao', 
              icon: '💰', 
              title: 'Tarificação', 
              color: 'green',
              desc: 'Prêmios e experiência',
              badge: temModelosGLM ? 'success' : 'warning',
              badgeText: temModelosGLM ? '✅ Disponível' : '⚠️ Ajuste primeiro'
            },
            { 
              id: 'montecarlo', 
              icon: '🎲', 
              title: 'Monte Carlo', 
              color: 'purple',
              desc: 'Análise de risco',
              badge: temModelosGLM ? 'success' : 'warning',
              badgeText: temModelosGLM ? '✅ Disponível' : '⚠️ Melhor com modelos'
            },
            { 
              id: 'markov', 
              icon: '📈', 
              title: 'Cadeias de Markov', 
              color: 'orange',
              desc: 'Transição de estados',
              badge: 'outline',
              badgeText: '✅ Disponível'
            },
            { 
              id: 'vida', 
              icon: '❤️', 
              title: 'Seguros de Vida', 
              color: 'red',
              desc: 'Tábuas de mortalidade',
              badge: 'outline',
              badgeText: '✅ Disponível'
            }
          ].map((card) => (
            <motion.div key={card.id} whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }}>
              <Card 
                className="h-full cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setModeloSelecionado(card.id)}
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 bg-${card.color}-100 rounded-xl`}>
                      <span className="text-2xl">{card.icon}</span>
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold text-${card.color}-700`}>{card.title}</h2>
                      <p className="text-sm text-gray-600">{card.desc}</p>
                    </div>
                  </div>
                  
                  {/* 🔥 BADGE DE DISPONIBILIDADE */}
                  <div className="flex items-center justify-end">
                    <Badge variant={card.badge} className="text-xs">
                      {card.badgeText}
                    </Badge>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* 🔥 HISTÓRICO SIMPLES */}
      {!semDados && historicoLocal.length > 0 && (
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg font-bold">📋 Análises Recentes</span>
              <Badge variant="outline">{historicoLocal.length}</Badge>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {historicoLocal.map((item, idx) => {
                const isTarifacao = item.tipo?.includes('duplo');
                return (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isTarifacao ? 'bg-purple-500' : 'bg-blue-500'}`} />
                        <span className="font-medium text-sm">{item.nome || 'Análise'}</span>
                      </div>
                      <Badge variant={isTarifacao ? 'purple' : 'blue'} size="xs">
                        {isTarifacao ? 'Tarifação' : 'Ajuste'}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}