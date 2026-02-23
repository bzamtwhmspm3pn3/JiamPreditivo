// src/components/Dashboard/utils/actuarialStorage.js - VERSÃO COMPLETA CORRIGIDA

const STORAGE_KEYS = {
  MODELOS_GLM: 'modelosGLM_Atuarial',
  ULTIMO_MONTE_CARLO: 'ultimo_monte_carlo',
  MODELOS_AJUSTADOS: 'modelosAjustados_Atuarial',
  HISTORICO_ANALISES: 'historicoAnalisesAtuariais',
  RESULTADOS: 'resultados_atuariais'
};

export const actuarialStorage = {
  // ============================================
  // MODELOS GLM
  // ============================================
  
  // Salvar modelos GLM
  salvarModelosGLM: function(modelos) {
    try {
      console.log('💾 Salvando modelos GLM no storage:', {
        temFrequencia: !!modelos.frequencia,
        temSeveridade: !!modelos.severidade,
        nCoefFreq: modelos.frequencia?.coeficientesCount || 0,
        nCoefSev: modelos.severidade?.coeficientesCount || 0
      });
      
      const data = {
        ...modelos,
        timestamp: new Date().toISOString(),
        version: '2.0',
        metadata: {
          dataSize: JSON.stringify(modelos).length,
          source: 'AjusteModelos'
        }
      };
      
      localStorage.setItem(STORAGE_KEYS.MODELOS_GLM, JSON.stringify(data));
      console.log('✅ Modelos GLM salvos com sucesso');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Erro ao salvar modelos GLM:', error);
      return { success: false, error: error.message };
    }
  },

  // Recuperar modelos GLM
  recuperarModelosGLM: function() {
    try {
      console.log('📥 Recuperando modelos GLM do storage...');
      const data = localStorage.getItem(STORAGE_KEYS.MODELOS_GLM);
      
      if (!data) {
        console.log('ℹ️ Nenhum modelo GLM encontrado no storage');
        return null;
      }
      
      const parsed = JSON.parse(data);
      
      if (!parsed.frequencia || !parsed.severidade) {
        console.warn('⚠️ Modelos GLM incompletos no storage');
        return null;
      }
      
      console.log('✅ Modelos GLM recuperados:', {
        timestamp: parsed.timestamp,
        nCoefFreq: parsed.frequencia?.coeficientesCount || 0,
        nCoefSev: parsed.severidade?.coeficientesCount || 0
      });
      
      return parsed;
    } catch (error) {
      console.error('❌ Erro ao recuperar modelos GLM:', error);
      return null;
    }
  },

  // ============================================
  // MONTE CARLO
  // ============================================
  
  salvarMonteCarlo: function(resultado) {
    try {
      const data = {
        resultado,
        timestamp: new Date().toISOString(),
        usando_modelos_glm: resultado.parametros_simulacao?.usando_modelos_glm || false
      };
      
      localStorage.setItem(STORAGE_KEYS.ULTIMO_MONTE_CARLO, JSON.stringify(data));
      console.log('✅ Monte Carlo salvo no storage');
      return true;
    } catch (error) {
      console.error('Erro ao salvar Monte Carlo:', error);
      return false;
    }
  },

  recuperarMonteCarlo: function() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ULTIMO_MONTE_CARLO);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erro ao recuperar Monte Carlo:', error);
      return null;
    }
  },

  // ============================================
  // HISTÓRICO DE ANÁLISES
  // ============================================
  
  // 🔥 CORRIGIDO: Método salvarHistorico adicionado
  salvarHistorico: function(historico) {
    try {
      if (!historico || !Array.isArray(historico)) {
        console.warn('⚠️ Histórico inválido para salvar');
        return false;
      }
      
      localStorage.setItem(STORAGE_KEYS.HISTORICO_ANALISES, JSON.stringify(historico));
      console.log('✅ Histórico salvo no storage:', historico.length, 'itens');
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar histórico:', error);
      return false;
    }
  },

  recuperarHistorico: function() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORICO_ANALISES);
      if (!data) {
        console.log('ℹ️ Nenhum histórico encontrado');
        return [];
      }
      const parsed = JSON.parse(data);
      console.log('📥 Histórico recuperado:', parsed.length, 'itens');
      return parsed;
    } catch (error) {
      console.error('❌ Erro ao recuperar histórico:', error);
      return [];
    }
  },

  adicionarAoHistorico: function(analise) {
    try {
      const historico = this.recuperarHistorico() || [];
      const novaAnalise = {
        ...analise,
        id: Date.now(),
        timestamp: new Date().toISOString()
      };
      
      historico.unshift(novaAnalise);
      
      if (historico.length > 20) {
        historico.length = 20;
      }
      
      this.salvarHistorico(historico);
      console.log('✅ Análise adicionada ao histórico:', novaAnalise.nome || 'Sem nome');
      return true;
    } catch (error) {
      console.error('❌ Erro ao adicionar ao histórico:', error);
      return false;
    }
  },

  // ============================================
  // RESULTADOS ESPECÍFICOS
  // ============================================
  
  salvarResultado: function(tipo, dados) {
    try {
      const chave = `${STORAGE_KEYS.RESULTADOS}_${tipo}`;
      localStorage.setItem(chave, JSON.stringify({
        ...dados,
        timestamp: new Date().toISOString()
      }));
      console.log(`💾 Resultado ${tipo} salvo no storage`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao salvar resultado ${tipo}:`, error);
      return false;
    }
  },

  recuperarResultado: function(tipo) {
    try {
      const chave = `${STORAGE_KEYS.RESULTADOS}_${tipo}`;
      const dados = localStorage.getItem(chave);
      return dados ? JSON.parse(dados) : null;
    } catch (error) {
      console.error(`❌ Erro ao recuperar resultado ${tipo}:`, error);
      return null;
    }
  },

  // ============================================
  // UTILITÁRIOS
  // ============================================
  
  limparDadosAtuariais: function() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_KEYS.RESULTADOS)) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('🧹 Dados atuariais limpos do storage');
      return true;
    } catch (error) {
      console.error('Erro ao limpar dados atuariais:', error);
      return false;
    }
  },

  limparModelosGLM: function() {
    try {
      localStorage.removeItem(STORAGE_KEYS.MODELOS_GLM);
      console.log('🧹 Modelos GLM removidos');
      return true;
    } catch (error) {
      console.error('Erro ao limpar modelos GLM:', error);
      return false;
    }
  },

  temModelosSalvos: function() {
    const modelos = localStorage.getItem(STORAGE_KEYS.MODELOS_GLM);
    if (!modelos) return false;
    
    try {
      const parsed = JSON.parse(modelos);
      return !!(parsed.frequencia && parsed.severidade);
    } catch {
      return false;
    }
  },

  getEstatisticas: function() {
    const modelos = localStorage.getItem(STORAGE_KEYS.MODELOS_GLM);
    const monteCarlo = localStorage.getItem(STORAGE_KEYS.ULTIMO_MONTE_CARLO);
    const historico = localStorage.getItem(STORAGE_KEYS.HISTORICO_ANALISES);
    
    let modelosData = null;
    let monteCarloData = null;
    let historicoData = null;
    
    try {
      modelosData = modelos ? JSON.parse(modelos) : null;
      monteCarloData = monteCarlo ? JSON.parse(monteCarlo) : null;
      historicoData = historico ? JSON.parse(historico) : [];
    } catch (error) {
      console.error('Erro ao parsear estatísticas:', error);
    }
    
    return {
      temModelosGLM: !!modelosData,
      temMonteCarlo: !!monteCarloData,
      tamanhoHistorico: historicoData.length,
      timestampModelos: modelosData?.timestamp,
      timestampMonteCarlo: monteCarloData?.timestamp,
      usandoModelosGLM: monteCarloData?.usando_modelos_glm || false,
      
      metricasModelos: modelosData ? {
        nCoeficientes: (modelosData.frequencia?.coeficientesCount || 0) + 
                       (modelosData.severidade?.coeficientesCount || 0),
        familiaFreq: modelosData.frequencia?.familia,
        familiaSev: modelosData.severidade?.familia,
        pseudoR2Freq: modelosData.frequencia?.metrics?.pseudo_r2,
        pseudoR2Sev: modelosData.severidade?.metrics?.pseudo_r2
      } : null
    };
  },

  exportarDados: function() {
    try {
      const dados = {};
      Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
        const value = localStorage.getItem(storageKey);
        if (value) {
          dados[key] = JSON.parse(value);
        }
      });
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        dados,
        metadata: {
          version: '2.0',
          exportDate: new Date().toLocaleString('pt-BR')
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  importarDados: function(dados) {
    try {
      Object.entries(dados).forEach(([key, value]) => {
        const storageKey = STORAGE_KEYS[key];
        if (storageKey && value) {
          localStorage.setItem(storageKey, JSON.stringify(value));
        }
      });
      
      console.log('✅ Dados importados com sucesso');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao importar dados:', error);
      return { success: false, error: error.message };
    }
  },

  validarIntegridade: function() {
    const problemas = [];
    
    const modelos = this.recuperarModelosGLM();
    if (modelos) {
      if (!modelos.frequencia) problemas.push('Modelo de frequência ausente');
      if (!modelos.severidade) problemas.push('Modelo de severidade ausente');
      if (!modelos.timestamp) problemas.push('Timestamp ausente nos modelos');
    }
    
    try {
      const historico = this.recuperarHistorico();
      if (!Array.isArray(historico)) {
        problemas.push('Histórico não é um array válido');
      }
    } catch (e) {
      problemas.push('Erro ao ler histórico: ' + e.message);
    }
    
    return {
      valido: problemas.length === 0,
      problemas,
      estatisticas: this.getEstatisticas()
    };
  }
};

// 🔥 Adicionar ao window para debug (opcional)
if (typeof window !== 'undefined') {
  window.actuarialStorage = actuarialStorage;
}