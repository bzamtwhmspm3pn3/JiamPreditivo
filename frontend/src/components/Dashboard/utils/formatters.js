export const formatNumber = (num, decimals = 4) => {
  if (num === null || num === undefined || num === 'N/A' || num === '') return '-';
  if (typeof num === 'string') {
    const numValue = parseFloat(num);
    if (isNaN(numValue)) return num;
    num = numValue;
  }
  if (Math.abs(num) < 0.0001) {
    return num.toExponential(decimals);
  }
  return num.toFixed(decimals);
};

export const formatPValue = (pValue) => {
  if (pValue === null || pValue === undefined || pValue === 'N/A' || pValue === '') return '-';
  if (typeof pValue === 'string') {
    const pNum = parseFloat(pValue);
    if (isNaN(pNum)) return pValue;
    pValue = pNum;
  }
  if (pValue < 0.001) return '< 0.001***';
  if (pValue < 0.01) return pValue.toFixed(4) + '**';
  if (pValue < 0.05) return pValue.toFixed(4) + '*';
  if (pValue < 0.1) return pValue.toFixed(4) + '.';
  return pValue.toFixed(4);
};

export const extrairVariaveis = (dados) => {
  if (!dados) return { variaveis: [], dadosArray: [] };
  
  let variaveis = [];
  let dadosArray = [];
  
  if (Array.isArray(dados)) {
    dadosArray = dados;
    variaveis = Object.keys(dadosArray[0] || {});
  } else if (dados?.dados_completos) {
    dadosArray = dados.dados_completos;
    variaveis = Object.keys(dadosArray[0] || {});
  } else if (dados?.dados) {
    dadosArray = dados.dados.map(linha => {
      const obj = {};
      dados.colunas.forEach((col, idx) => obj[col] = linha[idx]);
      return obj;
    });
    variaveis = dados.colunas || [];
  }
  
  return { variaveis, dadosArray };
};