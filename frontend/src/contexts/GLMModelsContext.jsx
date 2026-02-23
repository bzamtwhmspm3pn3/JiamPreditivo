// src/contexts/GLMModelsContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { actuarialStorage } from '../components/Dashboard/utils/actuarialStorage';

// Criar o contexto
const GLMModelsContext = createContext();

// Hook personalizado para usar o contexto
export const useGLMModels = () => {
  const context = useContext(GLMModelsContext);
  if (!context) {
    throw new Error('useGLMModels deve ser usado dentro de GLMModelsProvider');
  }
  return context;
};

// Provider component
export const GLMModelsProvider = ({ children }) => {
  // Estado inicial
  const [modelosGLM, setModelosGLM] = useState({
    frequencia: null,
    severidade: null,
    resultadosCompletos: null,
    estatisticas: null,
    equacoes: null,
    timestamp: null,
    tarifacaoCompleta: false
  });

  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ultimoErro, setUltimoErro] = useState(null);

  // ============================================
  // CARREGAR DADOS DO STORAGE AO INICIAR
  // ============================================
  useEffect(() => {
    const carregarDadosSalvos = async () => {
      try {
        console.log('📥 [CONTEXT] Iniciando carregamento do storage...');
        
        // 1. Carregar modelos GLM
        const modelosSalvos = actuarialStorage.recuperarModelosGLM();
        if (modelosSalvos) {
          console.log('✅ [CONTEXT] Modelos GLM carregados:', {
            timestamp: modelosSalvos.timestamp,
            frequencia: !!modelosSalvos.frequencia,
            severidade: !!modelosSalvos.severidade,
            tarifacaoCompleta: modelosSalvos.tarifacaoCompleta
          });
          setModelosGLM(modelosSalvos);
        } else {
          console.log('ℹ️ [CONTEXT] Nenhum modelo GLM encontrado');
        }

        // 2. Carregar histórico
        const historicoSalvo = actuarialStorage.recuperarHistorico();
        if (historicoSalvo && historicoSalvo.length > 0) {
          console.log('✅ [CONTEXT] Histórico carregado:', historicoSalvo.length, 'itens');
          setHistorico(historicoSalvo);
        }

      } catch (error) {
        console.error('❌ [CONTEXT] Erro ao carregar dados:', error);
        setUltimoErro(error.message);
      } finally {
        setLoading(false);
      }
    };

    carregarDadosSalvos();
  }, []);

  // ============================================
  // FUNÇÕES DE ATUALIZAÇÃO
  // ============================================

  // Atualizar modelos GLM
  const atualizarModelosGLM = (novosModelos) => {
    console.log('📤 [CONTEXT] Atualizando modelos GLM:', {
      temFrequencia: !!novosModelos.frequencia,
      temSeveridade: !!novosModelos.severidade,
      tarifacaoCompleta: novosModelos.tarifacaoCompleta
    });

    // Garantir que temos a estrutura correta
    const modelosParaSalvar = {
      frequencia: novosModelos.frequencia || modelosGLM.frequencia,
      severidade: novosModelos.severidade || modelosGLM.severidade,
      resultadosCompletos: novosModelos.resultadosCompletos || modelosGLM.resultadosCompletos,
      estatisticas: novosModelos.estatisticas || modelosGLM.estatisticas || {},
      equacoes: novosModelos.equacoes || modelosGLM.equacoes || {},
      timestamp: novosModelos.timestamp || new Date().toISOString(),
      tarifacaoCompleta: novosModelos.tarifacaoCompleta || modelosGLM.tarifacaoCompleta || false
    };

    // Atualizar estado
    setModelosGLM(modelosParaSalvar);

    // Salvar no storage
    const salvou = actuarialStorage.salvarModelosGLM(modelosParaSalvar);
    if (salvou) {
      console.log('✅ [CONTEXT] Modelos salvos no storage');
      
      // Se for tarifação completa, adicionar ao histórico
      if (modelosParaSalvar.tarifacaoCompleta) {
        adicionarAoHistorico({
          tipo: 'glm_actuarial_duplo',
          nome: 'Tarifação Completa',
          timestamp: modelosParaSalvar.timestamp,
          estatisticas: modelosParaSalvar.estatisticas
        });
      }
    } else {
      console.error('❌ [CONTEXT] Falha ao salvar modelos no storage');
    }
  };

  // Adicionar ao histórico
  const adicionarAoHistorico = (item) => {
    setHistorico(prev => {
      const novoItem = {
        ...item,
        id: Date.now(),
        timestamp: item.timestamp || new Date().toISOString()
      };
      
      const novoHistorico = [novoItem, ...prev].slice(0, 20);
      
      // Salvar no storage
      actuarialStorage.salvarHistorico(novoHistorico);
      
      return novoHistorico;
    });
  };

  // Limpar todos os dados
  const limparModelosGLM = () => {
    const modelosVazios = {
      frequencia: null,
      severidade: null,
      resultadosCompletos: null,
      estatisticas: null,
      equacoes: null,
      timestamp: null,
      tarifacaoCompleta: false
    };

    setModelosGLM(modelosVazios);
    setHistorico([]);
    
    actuarialStorage.limparDadosAtuariais();
    console.log('🧹 [CONTEXT] Dados limpos');
  };

  // ============================================
  // VALORES COMPUTADOS (DERIVADOS)
  // ============================================
  
  const temModelosGLM = !!(modelosGLM.frequencia && modelosGLM.severidade);
  
  const nCoeficientesGLM = (modelosGLM.frequencia?.coeficientesCount || 0) + 
                          (modelosGLM.severidade?.coeficientesCount || 0);

  const estatisticasResumidas = {
    lambda_medio: modelosGLM.estatisticas?.lambda_medio || 
                  modelosGLM.frequencia?.estatisticas?.lambda_medio || 
                  null,
    mu_medio: modelosGLM.estatisticas?.mu_medio || 
              modelosGLM.severidade?.estatisticas?.mu_medio || 
              null,
    premio_puro_medio: modelosGLM.estatisticas?.premio_puro_medio || null,
    aic_frequencia: modelosGLM.frequencia?.metrics?.aic || null,
    aic_severidade: modelosGLM.severidade?.metrics?.aic || null,
    pseudo_r2_frequencia: modelosGLM.frequencia?.metrics?.pseudo_r2 || null,
    pseudo_r2_severidade: modelosGLM.severidade?.metrics?.pseudo_r2 || null
  };

  // ============================================
  // DEBUG (opcional - expor para window em desenvolvimento)
  // ============================================
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.__GLM_CONTEXT__ = {
        modelosGLM,
        historico,
        temModelosGLM,
        nCoeficientesGLM,
        estatisticasResumidas
      };
      console.log('🔧 [CONTEXT] Exposto em window.__GLM_CONTEXT__ para debug');
    }
  }, [modelosGLM, historico, temModelosGLM, nCoeficientesGLM, estatisticasResumidas]);

  // ============================================
  // VALOR DO CONTEXTO
  // ============================================
  const value = {
    // Estados
    modelosGLM,
    historico,
    loading,
    ultimoErro,
    
    // Funções de atualização
    atualizarModelosGLM,
    adicionarAoHistorico,
    limparModelosGLM,
    
    // Valores computados
    temModelosGLM,
    nCoeficientesGLM,
    estatisticasResumidas,
    
    // Acessores diretos (para facilitar)
    frequencia: modelosGLM.frequencia,
    severidade: modelosGLM.severidade,
    resultadosCompletos: modelosGLM.resultadosCompletos,
    tarifacaoCompleta: modelosGLM.tarifacaoCompleta,
    timestamp: modelosGLM.timestamp
  };

  return (
    <GLMModelsContext.Provider value={value}>
      {children}
    </GLMModelsContext.Provider>
  );
};