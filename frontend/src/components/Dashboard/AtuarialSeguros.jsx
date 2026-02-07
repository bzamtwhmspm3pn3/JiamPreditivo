// src/components/Dashboard/AtuarialSeguros.jsx - VERSÃO CORRIGIDA
import React, { useState, useEffect, useMemo } from "react";
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../services/api';

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

// Tipos de modelos atuariais
const TIPOS_MODELOS_ATUARIAIS = [
  'glm_actuarial',
  'glm_actuarial_duplo', // 🔥 ADICIONADO ESTE TIPO
  'tarificacao_aposteriori', 
  'monte_carlo',
  'markov',
  'mortality_table',
  'actuarial',
  'poisson',
  'negative_binomial',
  'gamma',
  'inverse_gaussian',
  'two_part_model'
];

// Verifica se um modelo é atuarial
const isModeloAtuarial = (modelo) => {
  if (!modelo || !modelo.tipo) return false;
  
  // Verifica pelo tipo
  if (TIPOS_MODELOS_ATUARIAIS.includes(modelo.tipo)) {
    return true;
  }
  
  // Verifica pelo nome (caso tenha prefixo atuarial)
  const nome = modelo.nome || '';
  if (nome.toLowerCase().includes('atuarial') || 
      nome.toLowerCase().includes('frequencia') ||
      nome.toLowerCase().includes('severidade') ||
      nome.toLowerCase().includes('tarifacao') ||
      nome.toLowerCase().includes('premio') ||
      nome.toLowerCase().includes('monte carlo') ||
      nome.toLowerCase().includes('markov') ||
      nome.toLowerCase().includes('mortalidade') ||
      nome.toLowerCase().includes('tabua')) {
    return true;
  }
  
  return false;
};

export default function AtuarialSeguros(props) {
  const {
    dados: dadosProp = null,
    onSaveModel = (nome, modelo) => {
      console.log('💾 Modelo atuarial salvo:', nome, modelo);
      toast.success(`Modelo atuarial "${nome}" salvo`);
    },
    modelosAjustados = {},
    statusSistema: statusProp = null,
    onVoltar = null,
    onResultadoModelo = null // 🔥 ADICIONADO EXPLICITAMENTE
  } = props || {};

  const [modeloSelecionado, setModeloSelecionado] = useState('');
  
  // 🔥 ESTADO GLOBAL PARA MODELOS GLM AJUSTADOS
  const [modelosGLMAjustados, setModelosGLMAjustados] = useState({
    frequencia: null,
    severidade: null,
    resultadosCompletos: null,
    estatisticas: null,
    equacoes: null,
    timestamp: null,
    tarifacaoCompleta: false // 🔥 INICIALIZADO CORRETAMENTE
  });
  
  // Estados dos modelos ajustados (mantidos para compatibilidade)
  const [modeloFrequencia, setModeloFrequencia] = useState(null);
  const [modeloSeveridade, setModeloSeveridade] = useState(null);
  
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

  // 🔥 ESTADO PARA HISTÓRICO LOCAL (para mostrar na interface)
  const [historicoLocal, setHistoricoLocal] = useState([]);

  // Usar o status passado ou criar local
  const statusFinal = statusProp || statusLocal;

  // 🔥 FUNÇÃO PARA RECEBER MODELOS DO AJUSTEMODELOS - VERSÃO CORRIGIDA
  const receberModelosAjustados = (resultados) => {
    console.log('📥 AtuarialSeguros: Recebendo modelos ajustados:', {
      tipo: resultados.tipo,
      temModelos: !!(resultados.modelo_frequencia && resultados.modelo_severidade),
      temPremios: !!resultados.premios_individualizados,
      temEstatisticas: !!resultados.estatisticas,
      resultadoCompleto: resultados // 🔥 LOG COMPLETO
    });
    
    // 🔥 VERIFICAR SE É RESULTADO DE TARIFAÇÃO COMPLETA
    const ehTarifacaoCompleta = 
      resultados.tipo === 'glm_actuarial_duplo' ||
      resultados.premios_individualizados ||
      resultados.composicao_premio ||
      resultados.estatisticas?.premio_puro_medio;
    
    const modelos = {
      frequencia: resultados.modelo_frequencia,
      severidade: resultados.modelo_severidade,
      resultadosCompletos: resultados,
      estatisticas: resultados.estatisticas || {},
      equacoes: resultados.equacoes_ajustadas || {},
      timestamp: resultados.timestamp || new Date().toISOString(),
      tarifacaoCompleta: ehTarifacaoCompleta
    };
    
    setModelosGLMAjustados(modelos);
    
    // 🔥 SALVAR NO DASHBOARD TAMBÉM
    if (onResultadoModelo && typeof onResultadoModelo === 'function') {
      try {
        // 🔥 SE FOR TARIFAÇÃO COMPLETA, USAR ESTRUTURA ESPECÍFICA
        if (ehTarifacaoCompleta) {
          const resultadoParaDashboard = {
            nome: resultados.nome || "Tarifação Atuarial Completa",
            tipo: "glm_actuarial_duplo",
            dados: resultados,
            parametros: resultados.parametros || {},
            classificacao: resultados.convergiu ? "ALTA" : "MODERADA",
            timestamp: resultados.timestamp || new Date().toISOString(),
            metrics: resultados.metrics || {}
          };
          
          onResultadoModelo(resultadoParaDashboard);
          
          // 🔥 ADICIONAR AO HISTÓRICO LOCAL
          setHistoricoLocal(prev => [resultadoParaDashboard, ...prev].slice(0, 10));
          
        } else {
          // Se for apenas ajuste de modelos
          const resultadoParaDashboard = {
            nome: "Ajuste GLM Atuarial - Frequência + Severidade",
            tipo: "glm_actuarial",
            dados: resultados,
            parametros: {
              modelo_frequencia: resultados.modelo_frequencia?.familia,
              modelo_severidade: resultados.modelo_severidade?.familia,
              convergiu_frequencia: resultados.modelo_frequencia?.convergiu,
              convergiu_severidade: resultados.modelo_severidade?.convergiu
            },
            classificacao: resultados.convergiu ? "ALTA" : "MODERADA",
            timestamp: new Date().toISOString(),
            metrics: {
              aic_frequencia: resultados.modelo_frequencia?.metrics?.aic,
              aic_severidade: resultados.modelo_severidade?.metrics?.aic,
              pseudo_r2_frequencia: resultados.modelo_frequencia?.metrics?.pseudo_r2,
              pseudo_r2_severidade: resultados.modelo_severidade?.metrics?.pseudo_r2
            }
          };
          
          onResultadoModelo(resultadoParaDashboard);
          
          // 🔥 ADICIONAR AO HISTÓRICO LOCAL
          setHistoricoLocal(prev => [resultadoParaDashboard, ...prev].slice(0, 10));
        }
      } catch (error) {
        console.error('❌ Erro ao chamar onResultadoModelo:', error);
      }
    }
    
    // Atualizar estados individuais para compatibilidade
    if (resultados.modelo_frequencia) {
      setModeloFrequencia(resultados.modelo_frequencia);
    }
    if (resultados.modelo_severidade) {
      setModeloSeveridade(resultados.modelo_severidade);
    }
    
    // Armazenar em localStorage para persistência
    try {
      actuarialStorage.salvarModelosGLM(modelos);
      
      // 🔥 TAMBÉM SALVAR NO HISTÓRICO DO STORAGE
      if (ehTarifacaoCompleta) {
        actuarialStorage.adicionarAoHistorico({
          tipo: 'a_priori',
          nome: 'Tarifação Científica',
          modelos: ['frequencia', 'severidade'],
          resultado: resultados,
          timestamp: resultados.timestamp || new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('❌ Erro ao salvar no storage:', error);
    }
    
    // 🔥 MENSAGEM ADAPTADA AO TIPO DE RESULTADO
    if (ehTarifacaoCompleta) {
      toast.success(
        <div>
          <p className="font-medium">✅ Tarifação completa executada!</p>
          <p className="text-sm mt-1">
            {(resultados.premios_individualizados?.length || 0)} prêmios calculados
          </p>
        </div>
      );
    } else {
      toast.success(
        <div>
          <p className="font-medium">✅ Modelos GLM ajustados e armazenados!</p>
          <p className="text-sm mt-1">
            {(resultados.modelo_frequencia?.coeficientesCount || 0) + 
             (resultados.modelo_severidade?.coeficientesCount || 0)} 
            coeficientes disponíveis para análises
          </p>
        </div>
      );
    }
  };

  // 🔥 CARREGAR MODELOS SALVOS AO INICIAR
  useEffect(() => {
    const modelosSalvos = actuarialStorage.recuperarModelosGLM();
    if (modelosSalvos) {
      console.log('📥 Carregando modelos GLM salvos:', modelosSalvos);
      setModelosGLMAjustados(modelosSalvos);
      
      // Atualizar estados individuais
      if (modelosSalvos.frequencia) {
        setModeloFrequencia(modelosSalvos.frequencia);
      }
      if (modelosSalvos.severidade) {
        setModeloSeveridade(modelosSalvos.severidade);
      }
    }
    
    // 🔥 CARREGAR HISTÓRICO DO STORAGE
    const historicoSalvo = actuarialStorage.recuperarHistorico();
    if (historicoSalvo && Array.isArray(historicoSalvo)) {
      setHistoricoLocal(historicoSalvo);
    }
  }, []);

  // Filtrar apenas modelos atuariais - VERSÃO CORRIGIDA
  const modelosAtuariais = useMemo(() => {
    console.log('🔍 Filtrando modelos atuariais de:', Object.keys(modelosAjustados || {}));
    
    if (!modelosAjustados || typeof modelosAjustados !== 'object') {
      return {};
    }
    
    const atuariais = {};
    
    Object.entries(modelosAjustados).forEach(([nome, modelo]) => {
      if (isModeloAtuarial(modelo)) {
        atuariais[nome] = modelo;
      }
    });
    
    // 🔥 ADICIONAR TAMBÉM OS MODELOS DO HISTÓRICO LOCAL
    historicoLocal.forEach((modelo, idx) => {
      const nomeUnico = `${modelo.nome}_${idx}`;
      if (!atuariais[nomeUnico] && isModeloAtuarial(modelo)) {
        atuariais[nomeUnico] = modelo;
      }
    });
    
    console.log('📊 Modelos atuariais filtrados:', {
      total: Object.keys(modelosAjustados).length,
      atuariais: Object.keys(atuariais).length,
      historico: historicoLocal.length,
      tipos: Object.values(atuariais).map(m => m.tipo)
    });
    
    return atuariais;
  }, [modelosAjustados, historicoLocal]);

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
            message: resultado.connected ? 'Conectado ao backend' : 'Modo demonstração',
            ...resultado
          });
          
          if (!resultado.connected) {
            toast.info('Usando modo demonstração. Conecte-se ao backend para funcionalidades completas.');
          }
        } catch (error) {
          console.error('Erro ao verificar conexão:', error);
          setStatusLocal({
            connected: false,
            loading: false,
            message: 'Erro na conexão',
            error: error.message
          });
        }
      };

      verificarConexao();
    }
  }, [statusProp]);

  // Extrair variáveis dos dados
  useEffect(() => {
    const dadosArray = extrairDadosArray(dadosProp);
    
    if (dadosArray && Array.isArray(dadosArray) && dadosArray.length > 0) {
      const primeiraLinha = dadosArray[0];
      const vars = Object.keys(primeiraLinha);
      
      setInfoDados({
        linhas: dadosArray.length,
        colunas: vars.length,
        variaveis: vars
      });
    } else {
      setInfoDados({ linhas: 0, colunas: 0, variaveis: [] });
    }
  }, [dadosProp]);

  // Função fallback para demonstração
  const executarModeloFallback = async (config, dadosArray) => {
    console.log('🔄 Usando modo fallback para:', config);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simular diferentes tipos de resultados
    switch(config.tipo) {
      case 'tarificacao_aposteriori':
        return {
          success: true,
          tipo: 'tarificacao_aposteriori',
          categoria: 'actuarial',
          premios_individualizados: dadosArray.slice(0, 10).map((item, idx) => ({
            id: idx + 1,
            premio_puro: 500 + Math.random() * 1500,
            margem_seguranca: 50 + Math.random() * 100,
            premio_total: 550 + Math.random() * 1600,
            variaveis: Object.keys(item).reduce((acc, key) => {
              acc[key] = item[key];
              return acc;
            }, {})
          })),
          estatisticas: {
            premio_medio: 1250.45,
            desvio_padrao: 450.32,
            coeficiente_variacao: 0.36
          },
          timestamp: new Date().toISOString()
        };
        
      case 'monte_carlo':
        const usandoModelosGLM = config.parametros?.tem_modelos_glm || false;
        
        return {
          success: true,
          tipo: 'monte_carlo',
          categoria: 'actuarial',
          valor_esperado: 1000000,
          var_95: 1250000,
          var_99: 1500000,
          distribuicao: Array.from({length: 10}, (_, i) => ({
            intervalo: `${i*10}%-${(i+1)*10}%`,
            valor: 900000 + Math.random() * 200000
          })),
          parametros_simulacao: {
            n_simulacoes: config.parametros?.n_sim || 1000,
            vol_freq: config.parametros?.vol_freq || 0.2,
            vol_sev: config.parametros?.vol_sev || 0.3,
            usando_modelos_glm: usandoModelosGLM,
            modelos_utilizados: usandoModelosGLM ? ['frequencia', 'severidade'] : ['nenhum']
          },
          timestamp: new Date().toISOString()
        };
        
      case 'markov':
        return {
          success: true,
          tipo: 'markov',
          categoria: 'actuarial',
          matrizes_transicao: [{
            periodo: "Anual",
            matriz: [[0.7, 0.2, 0.1], [0.15, 0.6, 0.25], [0.05, 0.15, 0.8]]
          }],
          estados: ['Baixo', 'Médio', 'Alto'],
          distribuicao_estacionaria: [0.286, 0.381, 0.333],
          tempos_permanencia: [3.33, 2.50, 5.00],
          timestamp: new Date().toISOString()
        };
        
      case 'mortality_table':
        const idade_min = config.idade_min || 20;
        const idade_max = config.idade_max || 80;
        const idades = Array.from(
          {length: idade_max - idade_min + 1}, 
          (_, i) => idade_min + i
        );
        
        return {
          success: true,
          tipo: 'mortality_table',
          categoria: 'actuarial',
          idades,
          qx: idades.map(idade => 0.0005 * Math.exp(0.08 * (idade - idade_min))),
          lx: idades.map(idade => (config.l0 || 100000) * Math.pow(0.99, idade - idade_min)),
          ex: idades.map(idade => Math.max(0, 85 - idade * 0.7)),
          timestamp: new Date().toISOString()
        };
        
      default:
        // GLM padrão atuarial
        const resultadoGLM = {
          success: true,
          tipo: 'glm_actuarial',
          categoria: 'actuarial',
          modelo_frequencia: {
            familia: 'poisson',
            coeficientes: { 
              '(Intercept)': { estimate: 1.5, p_value: 0.001 }, 
              idade: { estimate: -0.02, p_value: 0.005 },
              generoM: { estimate: 0.3, p_value: 0.01 }
            },
            coeficientesCount: 3,
            metrics: {
              aic: 1250.45,
              pseudo_r2: 0.45,
              deviance_explicada: 0.48
            },
            convergiu: true
          },
          modelo_severidade: {
            familia: 'gamma',
            coeficientes: { 
              '(Intercept)': { estimate: 8.2, p_value: 0.001 }, 
              idade: { estimate: 0.15, p_value: 0.003 },
              valor_veiculo: { estimate: 0.0001, p_value: 0.02 }
            },
            coeficientesCount: 3,
            metrics: {
              aic: 2450.78,
              pseudo_r2: 0.62,
              deviance_explicada: 0.65
            },
            convergiu: true
          },
          estatisticas: {
            premio_puro_medio: 12000,
            premio_total_medio: 18000,
            lambda_medio: 0.15,
            mu_medio: 80000,
            desvio_premio: 2500
          },
          equacoes_ajustadas: {
            frequencia: 'λ = exp(1.5 - 0.02×Idade + 0.3×GeneroM)',
            severidade: 'μ = exp(8.2 + 0.15×Idade + 0.0001×Valor_Veiculo)',
            premio_puro: 'Prémio = λ × μ'
          },
          timestamp: new Date().toISOString()
        };
        
        // Se for a_priori, adicionar mais dados
        if (config.tipo === 'a_priori') {
          resultadoGLM.premios_individualizados = dadosArray.slice(0, 10).map((item, idx) => ({
            id: idx + 1,
            lambda: 0.1 + Math.random() * 0.2,
            mu: 50000 + Math.random() * 50000,
            premio_puro: 8000 + Math.random() * 7000,
            premio_total: 12000 + Math.random() * 10000
          }));
          
          resultadoGLM.composicao_premio = {
            premio_puro: 12000,
            margem_seguranca: 1200,
            despesas_admin: 2400,
            comissao: 1200,
            margem_lucro: 1800,
            impostos: 600,
            premio_total: 18000
          };
        }
        
        return resultadoGLM;
    }
  };

  // Função genérica para fazer chamadas R
  const fazerChamadaR = async (config) => {
    if (!dadosProp) {
      toast.error('Carregue dados primeiro!');
      return null;
    }

    const dadosArray = extrairDadosArray(dadosProp);
    
    if (!dadosArray || dadosArray.length === 0) {
      toast.error('Nenhum dado disponível para análise');
      return null;
    }

    try {
      console.log('🔧 Executando análise atuarial:', { 
        config, 
        n: dadosArray.length,
        tem_modelos_glm: !!config.parametros?.modelos_ajustados
      });

      let resultado;
      
      if (statusFinal.connected) {
        resultado = await api.executarModeloR(config.tipo || 'actuarial', dadosArray, config);
        
        if (resultado && !resultado.categoria) {
          resultado.categoria = 'actuarial';
        }
      } else {
        resultado = await executarModeloFallback(config, dadosArray);
      }

      if (resultado && resultado.success) {
        const nomeModelo = config.tipo || 'Atuarial';
        toast.success(`✅ ${nomeModelo} executado com sucesso!`);
        
        // 🔥 SALVAR NO DASHBOARD
        if (onResultadoModelo && !config.skipDashboardSave) {
          const dadosParaDashboard = {
            nome: nomeModelo,
            tipo: config.tipo || 'actuarial',
            dados: resultado,
            parametros: config,
            classificacao: resultado.convergiu ? "ALTA" : "MODERADA",
            timestamp: new Date().toISOString(),
            categoria: resultado.categoria || 'actuarial'
          };
          
          onResultadoModelo(dadosParaDashboard);
          
          // 🔥 ADICIONAR AO HISTÓRICO LOCAL
          setHistoricoLocal(prev => [dadosParaDashboard, ...prev].slice(0, 10));
        }
        
        // Salvar automaticamente no sistema
        if (onSaveModel) {
          onSaveModel(nomeModelo, resultado);
        }
        
        return resultado;
      } else {
        toast.error(`❌ Erro na análise: ${resultado?.error || 'Erro desconhecido'}`);
        return null;
      }
    } catch (error) {
      console.error('Erro na execução:', error);
      toast.error(`Erro: ${error.message}`);
      return null;
    }
  };

  // Mapeamento de componentes
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
      onResultadoModelo: onResultadoModelo,
      onVoltar: () => setModeloSelecionado('')
    };

    // 🔥 PROPS PARA AJUSTE DE MODELOS - CORRIGIDO
    const propsAjuste = {
      ...propsBase,
      modeloFrequencia: modelosGLMAjustados.frequencia,
      modeloSeveridade: modelosGLMAjustados.severidade,
      onModelosAjustados: receberModelosAjustados,
      ajustarModelo: fazerChamadaR,
    };

    // 🔥 PROPS PARA OUTROS COMPONENTES
    const propsOutros = {
      montecarlo: {
        ...propsBase,
        modeloFrequencia: modelosGLMAjustados.frequencia,
        modeloSeveridade: modelosGLMAjustados.severidade,
        resultadosGLM: modelosGLMAjustados.resultadosCompletos,
        resultadoMonteCarlo,
        setResultadoMonteCarlo,
        executarMonteCarlo: fazerChamadaR
      },
      tarificacao: {
        ...propsBase,
        modeloFrequencia: modelosGLMAjustados.frequencia,
        modeloSeveridade: modelosGLMAjustados.severidade,
        resultadosGLM: modelosGLMAjustados.resultadosCompletos,
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

    let propsParaComponente;
    switch (modeloSelecionado) {
      case 'ajuste':
        propsParaComponente = propsAjuste;
        break;
      case 'montecarlo':
        propsParaComponente = propsOutros.montecarlo;
        break;
      case 'tarificacao':
        propsParaComponente = propsOutros.tarificacao;
        break;
      case 'markov':
        propsParaComponente = propsOutros.markov;
        break;
      case 'vida':
        propsParaComponente = propsOutros.vida;
        break;
      default:
        propsParaComponente = propsBase;
    }

    return <ComponenteAtuarial {...propsParaComponente} />;
  }

  // Renderização inicial
  const dadosArray = extrairDadosArray(dadosProp);
  const semDados = !dadosArray || dadosArray.length === 0;
  const temModelosAtuariais = Object.keys(modelosAtuariais).length > 0;
  
  // 🔥 VERIFICAR SE TEM MODELOS GLM
  const temModelosGLM = !!(modelosGLMAjustados.frequencia && modelosGLMAjustados.severidade);
  const nCoeficientesGLM = temModelosGLM 
    ? (modelosGLMAjustados.frequencia.coeficientesCount || 0) + 
      (modelosGLMAjustados.severidade.coeficientesCount || 0)
    : 0;

  return (
    <div className="space-y-6 p-4">
      {/* Status do Sistema */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-3 rounded-lg ${statusFinal.connected ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${statusFinal.connected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-sm font-medium">
              {statusFinal.connected ? '✅ Backend R Conectado' : '⚠️ Modo Demonstração'}
            </span>
          </div>
          {onVoltar && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onVoltar}
              className="text-xs"
            >
              ⬅️ Voltar ao Menu Principal
            </Button>
          )}
        </div>
      </motion.div>

      {/* Título */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🛡️ Análise Atuarial</h1>
        <p className="text-gray-600">Modelos especializados para seguros e gestão de risco</p>
        
        {/* Info Dados */}
        {!semDados && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge variant="outline" className="flex items-center gap-2">
              <span>📊</span>
              {infoDados.linhas} observações
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <span>📋</span>
              {infoDados.colunas} variáveis
            </Badge>
            
            {temModelosGLM && (
              <Badge variant="success" className="flex items-center gap-2">
                <span>✅</span>
                {nCoeficientesGLM} coef. GLM
              </Badge>
            )}
            
            {temModelosAtuariais && (
              <Badge variant="blue" className="flex items-center gap-2">
                <span>📋</span>
                {Object.keys(modelosAtuariais).length} análises
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* 🔥 BANNER DE MODELOS GLM DISPONÍVEIS */}
      {temModelosGLM && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-green-600 text-xl">📊</span>
              </div>
              <div>
                <h3 className="font-bold text-green-800">Modelos GLM Ajustados</h3>
                <p className="text-green-700 text-sm">
                  {nCoeficientesGLM} coeficientes disponíveis para análises avançadas
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="outline" className="text-xs">
                    λ: {modelosGLMAjustados.estatisticas?.lambda_medio?.toFixed(4) || '0.15'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    μ: {modelosGLMAjustados.estatisticas?.mu_medio?.toLocaleString() || '80.000'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    R²: {(modelosGLMAjustados.frequencia?.metrics?.pseudo_r2 || 0.45).toFixed(2)} + {(modelosGLMAjustados.severidade?.metrics?.pseudo_r2 || 0.62).toFixed(2)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('Modelos GLM disponíveis:', modelosGLMAjustados);
                toast.info('Modelos GLM carregados para uso em análises');
              }}
              className="text-green-700 border-green-300 hover:bg-green-50"
            >
              Ver Detalhes
            </Button>
          </div>
        </motion.div>
      )}

      {/* 🔥 BANNER DE TARIFAÇÃO COMPLETA EXECUTADA */}
      {temModelosGLM && modelosGLMAjustados.tarifacaoCompleta && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-purple-600 text-xl">💰</span>
              </div>
              <div>
                <h3 className="font-bold text-purple-800">Tarifação Completa Executada</h3>
                <p className="text-purple-700 text-sm">
                  {modelosGLMAjustados.resultadosCompletos?.premios_individualizados?.length || 0} 
                  prêmios calculados
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="outline" className="text-xs">
                    Prêmio médio: R$ {
                      modelosGLMAjustados.resultadosCompletos?.estatisticas?.premio_puro_medio?.toLocaleString('pt-BR') || 
                      'N/A'
                    }
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    λ: {modelosGLMAjustados.resultadosCompletos?.estatisticas?.lambda_medio?.toFixed(4) || 'N/A'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    μ: R$ {
                      modelosGLMAjustados.resultadosCompletos?.estatisticas?.mu_medio?.toLocaleString('pt-BR') || 
                      'N/A'
                    }
                  </Badge>
                </div>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setModeloSelecionado('ajuste');
                toast.info('Carregando resultados da tarifação...');
              }}
              className="text-purple-700 border-purple-300 hover:bg-purple-50"
            >
              <span className="mr-2">📊</span>
              Ver Resultados
            </Button>
          </div>
        </motion.div>
      )}

      {/* Aviso se não houver dados */}
      {semDados && (
        <Card className="border-yellow-200 bg-yellow-50">
          <div className="p-6">
            <div className="flex items-start">
              <span className="text-yellow-600 text-2xl mr-3">⚠️</span>
              <div>
                <h3 className="font-bold text-yellow-800 text-lg">Nenhum dado carregado</h3>
                <p className="text-yellow-700 mt-2">
                  Para executar análises atuariais, você precisa carregar dados primeiro.
                </p>
                {onVoltar ? (
                  <Button
                    variant="outline"
                    className="mt-3"
                    onClick={onVoltar}
                  >
                    ↪️ Ir para aba de Dados
                  </Button>
                ) : (
                  <p className="text-yellow-600 text-sm mt-3">
                    Vá para a aba "Dados" do sistema para importar dados.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Grid de Modelos Atuariais */}
      {!semDados && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* AJUSTE DE MODELOS */}
          <motion.div
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setModeloSelecionado('ajuste')}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <span className="text-2xl">⚙️</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-blue-700">Ajuste de Modelos</h2>
                    <p className="text-sm text-gray-600">Frequência + Severidade</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-sm text-gray-700">
                    <p>• Modelo Duplo (Two-Part Model)</p>
                    <p>• Frequência: Poisson/Negative Binomial</p>
                    <p>• Severidade: Gamma/Inverse Gaussian</p>
                    <p>• 🔥 Exporta coeficientes para outras análises</p>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    {temModelosGLM ? (
                      <Badge variant="success" className="text-xs">
                        ✅ {nCoeficientesGLM} coef.
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        ⏳ Aguardando
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500 ml-auto">
                      Pré-requisito para outras análises
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* TARIFAÇÃO A POSTERIORI */}
          <motion.div
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setModeloSelecionado('tarificacao')}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-green-700">Tarificação A Posteriori</h2>
                    <p className="text-sm text-gray-600">Prêmios e experiência</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-sm text-gray-700">
                    <p>• Cálculo de prêmios individualizados</p>
                    <p>• Experiência de sinistros</p>
                    <p>• Margens de segurança</p>
                    <p>• 🔥 Usa modelos GLM ajustados</p>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    {temModelosGLM ? (
                      <Badge variant="success" className="text-xs">
                        🚀 Disponível com GLM
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs">
                        ⚠️ Ajuste modelos primeiro
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* SIMULAÇÃO MONTE CARLO */}
          <motion.div
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setModeloSelecionado('montecarlo')}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <span className="text-2xl">🎲</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-purple-700">Simulação Monte Carlo</h2>
                    <p className="text-sm text-gray-600">Análise de risco</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-sm text-gray-700">
                    <p>• Simulação de distribuições</p>
                    <p>• Cálculo de VaR (Value at Risk)</p>
                    <p>• Análise de cauda</p>
                    <p>• 🔥 Simulação baseada em modelos GLM</p>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    {temModelosGLM ? (
                      <Badge variant="success" className="text-xs">
                        🚀 Disponível com GLM
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs">
                        ⚠️ Melhor com modelos ajustados
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* CADEIAS DE MARKOV */}
          <motion.div
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setModeloSelecionado('markov')}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <span className="text-2xl">📈</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-orange-700">Cadeias de Markov</h2>
                    <p className="text-sm text-gray-600">Transição de estados</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-sm text-gray-700">
                    <p>• Matrizes de transição</p>
                    <p>• Distribuição estacionária</p>
                    <p>• Tempos de permanência</p>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <Badge variant="outline" className="text-xs">
                      🚀 Disponível
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* SEGUROS DE VIDA */}
          <motion.div
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setModeloSelecionado('vida')}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <span className="text-2xl">❤️</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-red-700">Seguros de Vida</h2>
                    <p className="text-sm text-gray-600">Tábuas de mortalidade</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-sm text-gray-700">
                    <p>• Construção de tábuas</p>
                    <p>• Probabilidades de sobrevivência</p>
                    <p>• Expectativa de vida</p>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <Badge variant="outline" className="text-xs">
                      🚀 Disponível
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* 🔥 ESTATÍSTICAS DOS MODELOS GLM */}
      {temModelosGLM && !semDados && (
        <Card className="border-blue-100 bg-blue-50">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-blue-800">
                <span>📈</span>
                Estatísticas dos Modelos GLM Ajustados
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  actuarialStorage.limparDadosAtuariais();
                  setModelosGLMAjustados({
                    frequencia: null,
                    severidade: null,
                    resultadosCompletos: null,
                    estatisticas: null,
                    equacoes: null,
                    timestamp: null,
                    tarifacaoCompleta: false
                  });
                  setHistoricoLocal([]);
                  toast.success('Dados atuariais limpos com sucesso!');
                }}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Limpar Dados
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <div className="text-xs text-blue-600 font-medium">Frequência (λ)</div>
                <div className="text-lg font-bold mt-1">
                  {modelosGLMAjustados.frequencia?.coeficientesCount || 0} coef.
                </div>
                <div className="text-xs text-gray-500">
                  {modelosGLMAjustados.frequencia?.familia || 'Poisson'}
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border border-green-200">
                <div className="text-xs text-green-600 font-medium">Severidade (μ)</div>
                <div className="text-lg font-bold mt-1">
                  {modelosGLMAjustados.severidade?.coeficientesCount || 0} coef.
                </div>
                <div className="text-xs text-gray-500">
                  {modelosGLMAjustados.severidade?.familia || 'Gamma'}
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border border-purple-200">
                <div className="text-xs text-purple-600 font-medium">λ Médio</div>
                <div className="text-lg font-bold mt-1">
                  {modelosGLMAjustados.estatisticas?.lambda_medio?.toFixed(4) || '0.1500'}
                </div>
                <div className="text-xs text-gray-500">Frequência esperada</div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border border-orange-200">
                <div className="text-xs text-orange-600 font-medium">μ Médio</div>
                <div className="text-lg font-bold mt-1">
                  {modelosGLMAjustados.estatisticas?.mu_medio 
                    ? `R$ ${modelosGLMAjustados.estatisticas.mu_medio.toLocaleString()}` 
                    : 'R$ 80.000'}
                </div>
                <div className="text-xs text-gray-500">Severidade média</div>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-blue-200">
              <div className="text-sm text-blue-700">
                <span className="font-medium">Última atualização:</span>{' '}
                {modelosGLMAjustados.timestamp 
                  ? new Date(modelosGLMAjustados.timestamp).toLocaleString('pt-BR')
                  : 'Não disponível'}
                {modelosGLMAjustados.tarifacaoCompleta && (
                  <Badge variant="success" className="ml-2 text-xs">
                    💰 Tarifação Completa
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 🔥 HISTÓRICO DE ANÁLISES ATUARIAIS - VERSÃO CORRIGIDA */}
      {!semDados && (temModelosAtuariais || historicoLocal.length > 0) && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span>📋</span>
                Histórico de Análises Atuariais
              </h3>
              <Badge variant="outline" className="text-xs">
                {Math.max(Object.keys(modelosAtuariais).length, historicoLocal.length)} análises
              </Badge>
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {/* 🔥 PRIMEIRO MOSTRA O HISTÓRICO LOCAL (MAIS RECENTE) */}
              {historicoLocal.slice(0, 5).map((modelo, idx) => {
                const tipo = modelo.tipo || 'glm_actuarial';
                const mapeamento = {
                  'glm_actuarial': 'ajuste',
                  'glm_actuarial_duplo': 'ajuste',
                  'tarificacao_aposteriori': 'tarificacao',
                  'monte_carlo': 'montecarlo',
                  'markov': 'markov',
                  'mortality_table': 'vida'
                };
                
                const componente = mapeamento[tipo] || 'ajuste';
                
                return (
                  <div
                    key={`local-${idx}`}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => {
                      setModeloSelecionado(componente);
                      toast.info(`Carregando análise "${modelo.nome}"...`);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-800">{modelo.nome}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                          <span>{new Date(modelo.timestamp || Date.now()).toLocaleDateString('pt-BR')}</span>
                          <span>•</span>
                          <span>{tipo.replace('_', ' ').toUpperCase()}</span>
                        </div>
                      </div>
                      <Badge variant={
                        tipo.includes('glm_actuarial') ? 'blue' :
                        tipo === 'tarificacao_aposteriori' ? 'green' :
                        tipo === 'monte_carlo' ? 'purple' :
                        tipo === 'markov' ? 'orange' :
                        tipo === 'mortality_table' ? 'red' : 'secondary'
                      } className="text-xs">
                        {tipo.includes('glm_actuarial') ? (tipo === 'glm_actuarial_duplo' ? 'Tarifação' : 'Ajuste') :
                         tipo === 'tarificacao_aposteriori' ? 'Tarifação' :
                         tipo === 'monte_carlo' ? 'Monte Carlo' :
                         tipo === 'markov' ? 'Markov' :
                         tipo === 'mortality_table' ? 'Tábua' : tipo}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              
              {/* 🔥 DEPOIS MOSTRA OS MODELOS DO DASHBOARD */}
              {Object.entries(modelosAtuariais)
                .reverse()
                .slice(0, 5 - Math.min(historicoLocal.length, 5))
                .map(([nome, modelo]) => {
                  const tipo = modelo.tipo || 'glm_actuarial';
                  const mapeamento = {
                    'glm_actuarial': 'ajuste',
                    'glm_actuarial_duplo': 'ajuste',
                    'tarificacao_aposteriori': 'tarificacao',
                    'monte_carlo': 'montecarlo',
                    'markov': 'markov',
                    'mortality_table': 'vida'
                  };
                  
                  const componente = mapeamento[tipo] || 'ajuste';
                  
                  return (
                    <div
                      key={`dashboard-${nome}`}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => {
                        setModeloSelecionado(componente);
                        toast.info(`Carregando análise atuarial "${nome}"...`);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-800">{modelo.nome || nome}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                            <span>{new Date(modelo.timestamp || Date.now()).toLocaleDateString('pt-BR')}</span>
                            <span>•</span>
                            <span>{tipo.replace('_', ' ').toUpperCase()}</span>
                          </div>
                        </div>
                        <Badge variant={
                          tipo.includes('glm_actuarial') ? 'blue' :
                          tipo === 'tarificacao_aposteriori' ? 'green' :
                          tipo === 'monte_carlo' ? 'purple' :
                          tipo === 'markov' ? 'orange' :
                          tipo === 'mortality_table' ? 'red' : 'secondary'
                        } className="text-xs">
                          {tipo.includes('glm_actuarial') ? (tipo === 'glm_actuarial_duplo' ? 'Tarifação' : 'Ajuste') :
                           tipo === 'tarificacao_aposteriori' ? 'Tarifação' :
                           tipo === 'monte_carlo' ? 'Monte Carlo' :
                           tipo === 'markov' ? 'Markov' :
                           tipo === 'mortality_table' ? 'Tábua' : tipo}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
            </div>
            
            {(Object.keys(modelosAtuariais).length === 0 && historicoLocal.length === 0) && (
              <div className="text-center py-4">
                <div className="text-gray-400 text-xl mb-2">📭</div>
                <p className="text-gray-500 text-sm">Nenhuma análise atuarial salva ainda</p>
                <p className="text-gray-400 text-xs mt-1">Execute análises para vê-las aqui</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Informações sobre o Backend R */}
      {!semDados && (
        <Card>
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 text-xl">ℹ️</div>
              <div>
                <h4 className="font-semibold text-gray-800">Fluxo de Análises Atuariais</h4>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium text-blue-700">1. Ajuste modelos GLM</span> → 
                  <span className="font-medium text-green-700"> 2. Use em outras análises</span> → 
                  <span className="font-medium text-purple-700"> 3. Simule riscos</span>
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                    🔄 Coeficientes persistentes
                  </div>
                  <div className="text-xs px-3 py-1 bg-green-100 text-green-800 rounded-full">
                    📊 Simulações precisas
                  </div>
                  <div className="text-xs px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
                    💾 Resultados integrados
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}