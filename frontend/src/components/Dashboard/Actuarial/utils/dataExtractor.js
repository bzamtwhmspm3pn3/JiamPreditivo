// src/components/Dashboard/Actuarial/utils/dataExtractor.js
/**
 * Utilitário para extrair dados de forma consistente em todos os componentes atuariais
 */
export const extrairDadosArray = (dadosObj) => {
  if (!dadosObj) return [];
  
  // Se já é array, retorna direto
  if (Array.isArray(dadosObj)) return dadosObj;
  
  if (typeof dadosObj === 'object') {
    // Caso 1: Array de objetos (formato mais comum)
    if (dadosObj[0] && typeof dadosObj[0] === 'object' && !Array.isArray(dadosObj[0])) {
      return dadosObj;
    }
    
    // Caso 2: Objeto com dados_completos
    if (dadosObj.dados_completos && Array.isArray(dadosObj.dados_completos)) {
      return dadosObj.dados_completos;
    }
    
    // Caso 3: Objeto com amostra
    if (dadosObj.amostra && Array.isArray(dadosObj.amostra)) {
      return dadosObj.amostra;
    }
    
    // Caso 4: Objeto com data
    if (dadosObj.data && Array.isArray(dadosObj.data)) {
      return dadosObj.data;
    }
    
    // Caso 5: Formato colunas/dados (matriz)
    if (dadosObj.dados && Array.isArray(dadosObj.dados) && dadosObj.colunas) {
      return dadosObj.dados.map(linha => {
        const obj = {};
        dadosObj.colunas.forEach((col, idx) => {
          obj[col] = linha[idx];
        });
        return obj;
      });
    }
    
    // Caso 6: Objeto com resultados (pode vir do backend)
    if (dadosObj.resultados && Array.isArray(dadosObj.resultados)) {
      return dadosObj.resultados;
    }
  }
  
  return [];
};

/**
 * Extrai informações dos dados (número de linhas, colunas, variáveis)
 */
export const extrairInfoDados = (dadosObj) => {
  const dadosArray = extrairDadosArray(dadosObj);
  
  if (dadosArray && dadosArray.length > 0) {
    const primeiraLinha = dadosArray[0];
    const vars = Object.keys(primeiraLinha || {});
    
    return {
      linhas: dadosArray.length,
      colunas: vars.length,
      variaveis: vars,
      temDados: true
    };
  }
  
  return {
    linhas: 0,
    colunas: 0,
    variaveis: [],
    temDados: false
  };
};

/**
 * Verifica se os dados estão no formato esperado
 */
export const dadosValidos = (dadosObj) => {
  const dadosArray = extrairDadosArray(dadosObj);
  return dadosArray && dadosArray.length > 0;
};