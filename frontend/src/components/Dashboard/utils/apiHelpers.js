// Funções auxiliares para chamadas à API
export const validarDadosParaModelo = (dados, tipoModelo) => {
  if (!dados || !Array.isArray(dados) || dados.length === 0) {
    return { valido: false, erro: 'Nenhum dado disponível' };
  }

  // Verificações básicas
  const primeiraLinha = dados[0];
  if (!primeiraLinha || typeof primeiraLinha !== 'object') {
    return { valido: false, erro: 'Formato de dados inválido' };
  }

  // Verificações específicas por tipo de modelo
  switch (tipoModelo) {
    case 'logistica':
      // Verificar se há variáveis binárias
      const todasVariaveis = Object.keys(primeiraLinha);
      const possiveisBinarias = todasVariaveis.filter(v => {
        const valores = [...new Set(dados.map(item => item[v]))];
        return valores.length === 2;
      });
      
      if (possiveisBinarias.length === 0) {
        return { 
          valido: false, 
          erro: 'Para regressão logística, é necessário pelo menos uma variável binária' 
        };
      }
      break;

    case 'arima':
    case 'sarima':
    case 'ets':
    case 'prophet':
      // Verificar se há dados suficientes para séries temporais
      if (dados.length < 10) {
        return { 
          valido: false, 
          erro: 'Para séries temporais, são necessárias pelo menos 10 observações' 
        };
      }
      break;

    case 'random_forest':
    case 'xgboost':
      // Verificar se há dados suficientes para ML
      if (dados.length < 20) {
        return { 
          valido: false, 
          erro: 'Para modelos de ML, são necessárias pelo menos 20 observações' 
        };
      }
      break;
  }

  return { valido: true };
};

export const prepararDadosParaBackend = (dados, parametros) => {
  try {
    // Converter dados para formato esperado pelo backend
    const dadosProcessados = Array.isArray(dados) ? dados : [];
    
    return {
      dados: dadosProcessados,
      parametros: {
        ...parametros,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Erro ao preparar dados:', error);
    throw new Error('Falha ao processar dados para o backend');
  }
};

export const processarRespostaBackend = (resposta, tipoModelo) => {
  if (!resposta || resposta.success === false) {
    throw new Error(resposta?.error || 'Erro desconhecido do backend');
  }

  // Processar resposta baseado no tipo de modelo
  const resultadoBase = {
    success: true,
    tipo_modelo: tipoModelo,
    timestamp: new Date().toISOString()
  };

  switch (tipoModelo) {
    case 'linear_simples':
    case 'linear_multipla':
    case 'logistica':
      return {
        ...resultadoBase,
        coeficientes: resposta.coeficientes || [],
        qualidade: resposta.qualidade || {},
        anova: resposta.anova || [],
        equacao_estimada: resposta.equacao_estimada || '',
        summary: resposta.summary || ''
      };

    case 'arima':
    case 'sarima':
    case 'ets':
    case 'prophet':
      return {
        ...resultadoBase,
        modelo_info: resposta.modelo_info || {},
        coeficientes: resposta.coeficientes || [],
        metricas: resposta.metricas || {},
        previsoes: resposta.previsoes || [],
        resumo_modelo: resposta.resumo_modelo || {}
      };

    case 'random_forest':
    case 'xgboost':
      return {
        ...resultadoBase,
        importancia_variaveis: resposta.importancia_variaveis || [],
        metricas: resposta.metricas || {},
        previsoes: resposta.previsoes || []
      };

    default:
      return { ...resultadoBase, ...resposta };
  }
};