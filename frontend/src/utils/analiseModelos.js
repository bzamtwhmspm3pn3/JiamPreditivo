// src/utils/analiseModelos.js - VERSÃO CORRIGIDA

// =============================================
// FUNÇÕES AUXILIARES
// =============================================

const classificarPerformance = (pontuacao) => {
  if (pontuacao >= 0.9) return 'EXCELENTE';
  if (pontuacao >= 0.75) return 'BOA';
  if (pontuacao >= 0.6) return 'MODERADA';
  return 'FRACA';
};

// =============================================
// FUNÇÃO PRINCIPAL PARA EXTRAIR MÉTRICAS DE QUALQUER MODELO
// =============================================

const extrairMetricasDeQualquerModelo = (dados) => {
  if (!dados) return { pontuacao: 0.5, metricas: {} };
  
  console.log('🔍 Extraindo métricas de modelo:', {
    tipo: dados.tipo,
    temResultado: !!dados.resultado,
    dadosKeys: Object.keys(dados)
  });
  
  // Dados principais
  const resultado = dados.resultado || dados.dados || dados;
  
  const metricas = {};
  let pontuacao = 0.5;
  
  // 🔥 1. PRIMEIRO: Tentar extrair do objeto "qualidade" (RF, XGBoost)
  if (resultado.qualidade) {
    metricas.r2 = resultado.qualidade.R2;
    metricas.rmse = resultado.qualidade.RMSE;
    metricas.mae = resultado.qualidade.MAE;
    metricas.mse = resultado.qualidade.MSE;
    metricas.mape = resultado.qualidade.MAPE;
    
    if (metricas.r2 !== undefined) {
      pontuacao = metricas.r2;
    }
    console.log('✅ Métricas extraídas de "qualidade"');
  }
  
  // 🔥 2. SEGUNDO: Tentar extrair de "metricas_rf" (Random Forest)
  if (resultado.metricas_rf) {
    metricas.r2 = resultado.metricas_rf.qualidade?.R2;
    metricas.rmse = resultado.metricas_rf.qualidade?.RMSE;
    metricas.importancia_variaveis = resultado.metricas_rf.importancia;
    
    if (metricas.r2 !== undefined) {
      pontuacao = metricas.r2;
    }
    console.log('✅ Métricas extraídas de "metricas_rf"');
  }
  
  // 🔥 3. TERCEIRO: Tentar extrair de "metricas_xgboost" (XGBoost)
  if (resultado.metricas_xgboost) {
    metricas.r2 = resultado.metricas_xgboost.qualidade?.R2;
    metricas.rmse = resultado.metricas_xgboost.qualidade?.RMSE;
    metricas.importancia_variaveis = resultado.metricas_xgboost.importancia;
    
    if (metricas.r2 !== undefined) {
      pontuacao = metricas.r2;
    }
    console.log('✅ Métricas extraídas de "metricas_xgboost"');
  }
  
  // 🔥 4. QUARTO: Tentar extrair métricas diretas (GLM, Regressão)
  if (!metricas.r2 && resultado.r2 !== undefined) {
    metricas.r2 = resultado.r2;
    metricas.rmse = resultado.rmse;
    metricas.mae = resultado.mae;
    metricas.aic = resultado.aic;
    metricas.bic = resultado.bic;
    metricas.n_observacoes = resultado.n_observacoes;
    metricas.n_variaveis = resultado.n_variaveis;
    metricas.coeficientes = resultado.coeficientes;
    
    if (metricas.r2 !== undefined) {
      pontuacao = metricas.r2;
    }
    console.log('✅ Métricas extraídas de propriedades diretas');
  }
  
  // 🔥 5. QUINTO: Tentar extrair de "metricas" (genérico)
  if (resultado.metricas && typeof resultado.metricas === 'object') {
    Object.keys(resultado.metricas).forEach(key => {
      metricas[key] = resultado.metricas[key];
    });
    
    if (metricas.r2 !== undefined && !pontuacao) {
      pontuacao = metricas.r2;
    }
    console.log('✅ Métricas extraídas de "metricas"');
  }
  
  // 🔥 6. SEXTO: Para séries temporais
  if (resultado.mape !== undefined) {
    metricas.mape = resultado.mape;
    metricas.rmse = resultado.rmse;
    metricas.aic = resultado.aic;
    metricas.bic = resultado.bic;
    
    // Para séries temporais, MAPE menor = melhor
    if (metricas.mape < 5) pontuacao = 0.9;
    else if (metricas.mape < 10) pontuacao = 0.8;
    else if (metricas.mape < 20) pontuacao = 0.7;
    else if (metricas.mape < 30) pontuacao = 0.6;
    else pontuacao = 0.4;
    
    console.log('✅ Métricas extraídas para séries temporais');
  }
  
  // 🔥 7. SÉTIMO: Para modelos atuariais
  if (resultado.pseudo_r2_freq !== undefined) {
    metricas.pseudo_r2_freq = resultado.pseudo_r2_freq;
    metricas.pseudo_r2_sev = resultado.pseudo_r2_sev;
    metricas.premio_medio = resultado.premio_medio;
    metricas.frequencia_media = resultado.frequencia_media;
    metricas.severidade_media = resultado.severidade_media;
    
    const mediaPseudoR2 = (metricas.pseudo_r2_freq + metricas.pseudo_r2_sev) / 2;
    pontuacao = Math.min(0.9, mediaPseudoR2 * 5);
    
    console.log('✅ Métricas extraídas para modelos atuariais');
  }
  
  // 🔥 8. OITAVO: Para regressão logística
  if (resultado.accuracy !== undefined) {
    metricas.accuracy = resultado.accuracy;
    metricas.precision = resultado.precision;
    metricas.recall = resultado.recall;
    metricas.f1_score = resultado.f1_score;
    metricas.auc = resultado.auc;
    
    if (metricas.accuracy !== undefined) {
      pontuacao = metricas.accuracy;
    }
    console.log('✅ Métricas extraídas para classificação');
  }
  
  // Garantir que temos pontuação
  pontuacao = Math.max(0.1, Math.min(1, pontuacao || 0.5));
  
  console.log(`🎯 Pontuação final: ${pontuacao}, Métricas extraídas:`, Object.keys(metricas).length);
  
  return { pontuacao, metricas };
};

// =============================================
// FUNÇÕES DE ANÁLISE ESPECÍFICAS
// =============================================

// 🔥 1. MODELOS ATUARIAIS
const analisarGLMActuarial = (dados, parametros = {}) => {
  try {
    const { pontuacao, metricas } = extrairMetricasDeQualquerModelo(dados);
    const classificacao = classificarPerformance(pontuacao);
    
    const insights = [];
    const recomendacoes = [];
    
    // INSIGHTS ESPECÍFICOS
    insights.push('💰 **Modelo Atuarial GLM Duplo**');
    
    if (metricas.pseudo_r2_freq !== undefined) {
      insights.push(`📊 Pseudo R² Frequência: ${(metricas.pseudo_r2_freq * 100).toFixed(2)}%`);
    }
    
    if (metricas.pseudo_r2_sev !== undefined) {
      insights.push(`📈 Pseudo R² Severidade: ${(metricas.pseudo_r2_sev * 100).toFixed(2)}%`);
    }
    
    if (metricas.premio_medio !== undefined) {
      insights.push(`💰 Prêmio Médio: ${metricas.premio_medio.toLocaleString('pt-BR')}`);
    }
    
    // RECOMENDAÇÕES
    if (pontuacao >= 0.7) {
      recomendacoes.push('✅ Modelo robusto para tarifação científica');
      recomendacoes.push('📊 Validar com experiência real de sinistros');
    } else {
      recomendacoes.push('🔧 Revisar seleção de variáveis preditoras');
      recomendacoes.push('⚡ Considerar outros modelos atuariais');
    }
    
    recomendacoes.push('📅 Aplicar teste de back-testing');
    recomendacoes.push('🛡️ Calcular margem de segurança adequada');
    
    return {
      classificacao,
      pontuacao,
      insights: insights.length > 0 ? insights : ['Modelo atuarial GLM analisado'],
      recomendacoes,
      metricas
    };
  } catch (error) {
    console.error('Erro na análise GLM atuarial:', error);
    return criarRespostaPadrao('GLM Atuarial');
  }
};

// 🔥 2. MODELOS DE REGRESSÃO
const analisarRegressaoLinear = (dados, parametros = {}) => {
  try {
    const { pontuacao, metricas } = extrairMetricasDeQualquerModelo(dados);
    const classificacao = classificarPerformance(pontuacao);
    
    const insights = [];
    const recomendacoes = [];
    
    // INSIGHTS
    if (metricas.r2 !== undefined) {
      insights.push(`📊 **R²: ${(metricas.r2 * 100).toFixed(1)}%**`);
      
      if (metricas.r2 >= 0.9) {
        insights.push('🎯 Excelente ajuste linear');
      } else if (metricas.r2 >= 0.7) {
        insights.push('📈 Bom ajuste linear');
      }
    }
    
    if (metricas.coeficientes && typeof metricas.coeficientes === 'object') {
      const numCoef = Object.keys(metricas.coeficientes).length;
      insights.push(`🔢 ${numCoef} coeficientes estimados`);
    }
    
    // RECOMENDAÇÕES
    recomendacoes.push('📐 Verificar normalidade dos resíduos');
    recomendacoes.push('📊 Plotar resíduos vs valores ajustados');
    
    if (pontuacao >= 0.8) {
      recomendacoes.push('✅ Excelente modelo para previsões lineares');
    } else {
      recomendacoes.push('🔧 Considerar transformações nos dados');
    }
    
    return {
      classificacao,
      pontuacao,
      insights: insights.length > 0 ? insights : ['Regressão linear analisada'],
      recomendacoes,
      metricas
    };
  } catch (error) {
    console.error('Erro na análise regressão linear:', error);
    return criarRespostaPadrao('Regressão Linear');
  }
};

// 🔥 3. MODELOS DE SÉRIES TEMPORAIS
const analisarARIMA = (dados, parametros = {}) => {
  try {
    const { pontuacao, metricas } = extrairMetricasDeQualquerModelo(dados);
    const classificacao = classificarPerformance(pontuacao);
    
    const insights = [];
    const recomendacoes = [];
    
    // INSIGHTS
    insights.push('📅 **Modelo ARIMA para Séries Temporais**');
    
    if (metricas.mape !== undefined) {
      insights.push(`🎯 **MAPE: ${metricas.mape.toFixed(2)}%**`);
      
      if (metricas.mape < 5) {
        insights.push('🏆 Precisão excelente');
      } else if (metricas.mape < 10) {
        insights.push('📈 Precisão muito boa');
      }
    }
    
    // RECOMENDAÇÕES
    recomendacoes.push('📊 Validar com walk-forward validation');
    recomendacoes.push('📈 Analisar resíduos para verificar adequação');
    
    if (pontuacao >= 0.8) {
      recomendacoes.push('✅ Modelo excelente para previsão');
    } else {
      recomendacoes.push('🔧 Testar diferentes ordens (p,d,q)');
    }
    
    return {
      classificacao,
      pontuacao,
      insights: insights.length > 0 ? insights : ['Modelo ARIMA analisado'],
      recomendacoes,
      metricas
    };
  } catch (error) {
    console.error('Erro na análise ARIMA:', error);
    return criarRespostaPadrao('ARIMA');
  }
};

// 🔥 4. MODELOS DE MACHINE LEARNING
const analisarRandomForest = (dados, parametros = {}) => {
  try {
    const { pontuacao, metricas } = extrairMetricasDeQualquerModelo(dados);
    const classificacao = classificarPerformance(pontuacao);
    
    const insights = [];
    const recomendacoes = [];
    
    // INSIGHTS
    insights.push('🌲 **Random Forest - Ensemble Learning**');
    
    if (metricas.r2 !== undefined) {
      insights.push(`📊 **R²: ${(metricas.r2 * 100).toFixed(1)}%**`);
      
      if (metricas.r2 >= 0.95) {
        insights.push('🏆 Performance excepcional');
      } else if (metricas.r2 >= 0.85) {
        insights.push('📈 Performance muito boa');
      }
    }
    
    if (metricas.importancia_variaveis) {
      insights.push('🎯 Importância das variáveis calculada');
    }
    
    // RECOMENDAÇÕES
    recomendacoes.push('🌳 Analisar importância das features');
    recomendacoes.push('📊 Usar OOB error para validação');
    
    if (pontuacao >= 0.85) {
      recomendacoes.push('✅ Modelo excelente para decisões críticas');
    } else {
      recomendacoes.push('🔧 Aumentar n_estimators para estabilidade');
    }
    
    return {
      classificacao,
      pontuacao,
      insights: insights.length > 0 ? insights : ['Random Forest analisado'],
      recomendacoes,
      metricas
    };
  } catch (error) {
    console.error('Erro na análise Random Forest:', error);
    return criarRespostaPadrao('Random Forest');
  }
};

// 🔥 FUNÇÃO AUXILIAR PARA RESPOSTAS PADRÃO
const criarRespostaPadrao = (tipo) => ({
  classificacao: 'MODERADA',
  pontuacao: 0.6,
  insights: [`Modelo ${tipo} analisado pelo sistema JIAM`],
  recomendacoes: ['Verificar dados de entrada', 'Validar com diferentes conjuntos'],
  metricas: {}
});

// =============================================
// MAPEAMENTO E FUNÇÃO PRINCIPAL
// =============================================

const MAPEAMENTO_ANALISADORES = {
  // Atuariais
  'a_priori': analisarGLMActuarial,
  'glm_actuarial': analisarGLMActuarial,
  'glm_actuarial_duplo': analisarGLMActuarial,
  
  // Regressão
  'linear_simples': analisarRegressaoLinear,
  'regressao_linear': analisarRegressaoLinear,
  'linear_multipla': analisarRegressaoLinear,
  'regressao_multipla': analisarRegressaoLinear,
  'glm': analisarRegressaoLinear,
  
  // Séries Temporais
  'arima': analisarARIMA,
  'sarima': analisarARIMA,
  'ets': analisarARIMA,
  'prophet': analisarARIMA,
  
  // Machine Learning
  'random_forest': analisarRandomForest,
  'xgboost': analisarRandomForest,
  
  // Default
  'desconhecido': criarRespostaPadrao
};

export const analisarQualquerModelo = (dados, parametros = {}) => {
  const tipo = dados.tipo || parametros.tipo || 'desconhecido';
  const analisador = MAPEAMENTO_ANALISADORES[tipo] || criarRespostaPadrao;
  
  console.log(`🔍 Analisando modelo tipo: ${tipo}`);
  
  try {
    return analisador(dados, parametros);
  } catch (error) {
    console.error(`❌ Erro ao analisar modelo ${tipo}:`, error);
    return criarRespostaPadrao(tipo);
  }
};

// =============================================
// EXPORTAÇÕES
// =============================================

export default {
  analisarQualquerModelo,
  MAPEAMENTO_ANALISADORES,
  classificarPerformance
};