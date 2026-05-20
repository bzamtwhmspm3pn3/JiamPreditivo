// frontend/src/services/modelosService.js (VERSÃO CORRIGIDA)

import api from './api';

const ModelosService = {
  
  getUserId() {
    return localStorage.getItem('userId') || 
           localStorage.getItem('jiam_usuario_id') || 
           'usuario_padrao';
  },

  calcularPerformance(modelo) {
    try {
      if (!modelo || !modelo.resultado) {
        return { pontuacao: 0.5, classificacao: 'MODERADA' };
      }

      const resultado = modelo.resultado;
      const metricas = [];

      // Regressão Linear
      if (modelo.tipo === 'linear_simples' || modelo.tipo === 'linear_multipla') {
        if (resultado.r2 && !isNaN(resultado.r2)) metricas.push(Number(resultado.r2));
        if (resultado.qualidade?.R2 && !isNaN(resultado.qualidade.R2)) metricas.push(Number(resultado.qualidade.R2));
        if (resultado.qualidade?.R2ajustado && !isNaN(resultado.qualidade.R2ajustado)) {
          metricas.push(Number(resultado.qualidade.R2ajustado));
        }
      }

      // Classificação
      if (['regressao_logistica', 'random_forest', 'xgboost'].includes(modelo.tipo)) {
        if (resultado.acuracia && !isNaN(resultado.acuracia)) metricas.push(Number(resultado.acuracia));
        if (resultado.qualidade?.accuracy && !isNaN(resultado.qualidade.accuracy)) metricas.push(Number(resultado.qualidade.accuracy));
        if (resultado.qualidade?.auc && !isNaN(resultado.qualidade.auc)) metricas.push(Number(resultado.qualidade.auc));
        if (resultado.qualidade?.f1 && !isNaN(resultado.qualidade.f1)) metricas.push(Number(resultado.qualidade.f1));
      }

      // Séries Temporais
      if (['arima', 'sarima', 'ets', 'prophet'].includes(modelo.tipo)) {
        if (resultado.mape && !isNaN(resultado.mape)) {
          const mape = Number(resultado.mape);
          metricas.push(Math.max(0, Math.min(1, 1 - mape / 100)));
        }
        if (resultado.qualidade?.MAPE && !isNaN(resultado.qualidade.MAPE)) {
          const mape = Number(resultado.qualidade.MAPE);
          metricas.push(Math.max(0, Math.min(1, 1 - mape / 100)));
        }
      }

      // Clustering
      if (['kmeans', 'dbscan', 'hierarchical'].includes(modelo.tipo)) {
        if (resultado.metricas?.silhueta && !isNaN(resultado.metricas.silhueta)) {
          metricas.push((Number(resultado.metricas.silhueta) + 1) / 2);
        }
      }

      // Associação
      if (['apriori', 'fp_growth'].includes(modelo.tipo)) {
        if (resultado.estatisticas?.lift_medio && !isNaN(resultado.estatisticas.lift_medio)) {
          metricas.push(Math.min(1, Number(resultado.estatisticas.lift_medio) / 3));
        }
      }

      const metricasValidas = metricas.filter(m => !isNaN(m) && m >= 0 && m <= 1);
      
      const pontuacao = metricasValidas.length > 0 
        ? metricasValidas.reduce((a, b) => a + b, 0) / metricasValidas.length 
        : 0.6;

      const pontuacaoFinal = Math.max(0, Math.min(1, Number(pontuacao.toFixed(2))));

      let classificacao = 'MODERADA';
      if (pontuacaoFinal >= 0.8) classificacao = 'EXCELENTE';
      else if (pontuacaoFinal >= 0.6) classificacao = 'BOA';
      else if (pontuacaoFinal >= 0.4) classificacao = 'MODERADA';
      else classificacao = 'FRACA';

      return {
        pontuacao: pontuacaoFinal,
        classificacao,
        metricasUtilizadas: metricasValidas.length
      };
    } catch (error) {
      console.error('Erro ao calcular performance:', error);
      return { pontuacao: 0.5, classificacao: 'MODERADA' };
    }
  },

  async salvar(modelo) {
    try {
      console.log('📤 Salvando modelo:', modelo.nome);
      
      const performance = this.calcularPerformance(modelo);
      const pontuacao = isNaN(performance.pontuacao) ? 0.5 : performance.pontuacao;
      
      // 🔥 GARANTIR QUE O ID EXISTA
      const modeloId = modelo.id || `modelo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const modeloParaSalvar = {
        id: modeloId,
        nome: modelo.nome || 'Modelo sem nome',
        tipo: modelo.tipo || 'desconhecido',
        timestamp: modelo.timestamp || new Date().toISOString(),
        resultado: modelo.resultado || {},
        parametros: modelo.parametros || {},
        pontuacao: pontuacao,
        classificacao: performance.classificacao,
        qualidade: modelo.qualidade || modelo.resultado?.qualidade || {},
        coeficientes: modelo.coeficientes || modelo.resultado?.coeficientes || [],
        arquivado: false,
        dataArquivamento: null
      };
      
      // 🔥 USAR O AXIOS DO API.JS CORRETAMENTE
      const response = await api.axios.post('/modelos/salvar', {
        userId: this.getUserId(),
        modelo: modeloParaSalvar
      });
      
      console.log('✅ Modelo salvo:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao salvar:', error.response?.data || error.message);
      console.error('📡 URL da requisição:', error.config?.url);
      console.error('🌐 Base URL:', api.axios.defaults.baseURL);
      return { success: false, error: error.message };
    }
  },

  async carregar(modeloId) {
    try {
      console.log(`📥 Carregando modelo ${modeloId}...`);
      const userId = this.getUserId();
      console.log(`👤 Usuário: ${userId}`);
      console.log(`🔗 URL: /modelos/carregar/${userId}/${modeloId}`);
      
      const response = await api.axios.get(`/modelos/carregar/${userId}/${modeloId}`);
      console.log('✅ Modelo carregado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao carregar modelo:', error);
      console.error('📡 Status:', error.response?.status);
      console.error('📡 Data:', error.response?.data);
      return { success: false, error: error.message };
    }
  },

  async listarAtivos() {
    try {
      const userId = this.getUserId();
      console.log(`📋 Listando modelos ativos para: ${userId}`);
      
      const response = await api.axios.get(`/modelos/listar/${userId}`, {
        params: { arquivados: false }
      });
      
      console.log(`✅ ${response.data.total || response.data.modelos?.length || 0} modelos ativos`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar ativos:', error);
      console.error('📡 Status:', error.response?.status);
      return { success: false, modelos: [], total: 0 };
    }
  },

  async listarArquivados() {
    try {
      const userId = this.getUserId();
      console.log(`📋 Listando modelos arquivados para: ${userId}`);
      
      const response = await api.axios.get(`/modelos/listar/${userId}`, {
        params: { arquivados: true }
      });
      
      console.log(`✅ ${response.data.total || response.data.modelos?.length || 0} modelos arquivados`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar arquivados:', error);
      return { success: false, modelos: [], total: 0 };
    }
  },

  async estatisticas() {
    try {
      const userId = this.getUserId();
      console.log(`📊 Buscando estatísticas para: ${userId}`);
      
      const response = await api.axios.get(`/modelos/estatisticas/${userId}`);
      console.log('✅ Estatísticas carregadas');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      return { 
        success: false, 
        estatisticas: {
          total: 0,
          porClassificacao: {},
          performanceMedia: 0,
          tiposUnicos: [],
          distribuicaoTipos: [],
          distribuicaoClassificacao: [],
          totalAnomalias: 0,
          totalFraudes: 0
        } 
      };
    }
  },

  async eliminar(modeloId) {
    try {
      const userId = this.getUserId();
      console.log(`🗑️ Eliminando modelo ${modeloId}...`);
      
      const response = await api.axios.delete(`/modelos/eliminar/${userId}/${modeloId}`);
      console.log('✅ Modelo eliminado');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao eliminar:', error);
      return { success: false };
    }
  },

  async arquivar(modeloId) {
    try {
      const userId = this.getUserId();
      console.log(`📦 Arquivando modelo ${modeloId}...`);
      
      const response = await api.axios.put(`/modelos/status/${userId}/${modeloId}`, {
        arquivar: true
      });
      console.log('✅ Modelo arquivado');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao arquivar:', error);
      return { success: false };
    }
  },

  async restaurar(modeloId) {
    try {
      const userId = this.getUserId();
      console.log(`🔄 Restaurando modelo ${modeloId}...`);
      
      const response = await api.axios.put(`/modelos/status/${userId}/${modeloId}`, {
        arquivar: false
      });
      console.log('✅ Modelo restaurado');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao restaurar:', error);
      return { success: false };
    }
  },

  // 🔥 NOVO: Verificar conexão com API de modelos
  async testarConexao() {
    try {
      const userId = this.getUserId();
      const response = await api.axios.get(`/modelos/listar/${userId}?limit=1`);
      return { success: true, message: 'API de modelos OK' };
    } catch (error) {
      console.error('❌ Teste de conexão falhou:', error);
      return { success: false, error: error.message };
    }
  }
};

export default ModelosService;