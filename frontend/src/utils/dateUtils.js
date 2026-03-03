// src/utils/dateUtils.js

// Detecta se o valor é um ano isolado (ex: 1961, "1961")
export const isAnoIsolado = (valor) => {
  if (typeof valor === 'number') return valor >= 1900 && valor <= 2100;
  if (typeof valor === 'string') return /^\d{4}$/.test(valor);
  return false;
};

// Converte número Excel serial para data (ex: 44947 -> "25/01/2023")
export const converterExcelSerialParaData = (serial) => {
  if (!serial || isNaN(serial)) return serial;
  const data = new Date(1900, 0, serial - 1);
  if (serial > 60) data.setDate(data.getDate() - 1);
  const dia = data.getDate().toString().padStart(2, '0');
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
};

// Detecta se é número Excel serial
export const isExcelSerial = (valor) => {
  return !isNaN(valor) && Number(valor) > 40000 && Number(valor) < 50000;
};

// Corrige século para datas que vieram com ano > 2050 (ex: 2095 -> 1995)
export const corrigirSeculoData = (dataRaw) => {
  if (!dataRaw) return dataRaw;
  
  if (typeof dataRaw === 'string') {
    // Substituir anos como 2095 por 1995 (ou 2025 por 2025 se já estiver correto)
    // Ajuste conforme necessário: se estiver no formato "nov/2095", corrigir para "nov/1995"
    const regexAno = /(\d{4})/g;
    return dataRaw.replace(regexAno, (ano) => {
      const anoNum = parseInt(ano);
      if (anoNum > 2050) {
        // Se ano > 2050, subtrair 100? Melhor: se for 2095, deve ser 1995? Depende do contexto.
        // Vamos adotar: se ano > 2050, subtrair 100 (volta para 1900s)
        return (anoNum - 100).toString();
      }
      return ano;
    });
  }
  return dataRaw;
};

// Obtém timestamp a partir de vários formatos
export const obterTimestamp = (dataRaw) => {
  if (isAnoIsolado(dataRaw)) {
    const ano = Number(dataRaw);
    return new Date(ano, 0, 1).getTime();
  }
  if (isExcelSerial(dataRaw)) {
    const data = converterExcelSerialParaData(Number(dataRaw));
    const [dia, mes, ano] = data.split('/').map(Number);
    return new Date(ano, mes - 1, dia).getTime();
  }
  try {
    if (typeof dataRaw === 'string') {
      if (dataRaw.includes('/')) {
        const parts = dataRaw.split('/');
        if (parts.length === 3) {
          const [dia, mes, ano] = parts.map(Number);
          return new Date(ano, mes - 1, dia).getTime();
        }
        if (parts.length === 2) {
          const [mes, ano] = parts.map(Number);
          return new Date(ano, mes - 1, 1).getTime();
        }
      } else if (dataRaw.includes('-')) {
        const parts = dataRaw.split('-');
        if (parts.length === 3) {
          const [ano, mes, dia] = parts.map(Number);
          return new Date(ano, mes - 1, dia).getTime();
        }
        if (parts.length === 2) {
          const [ano, mes] = parts.map(Number);
          return new Date(ano, mes - 1, 1).getTime();
        }
      }
      // Tentar parse direto
      const data = new Date(dataRaw);
      if (!isNaN(data.getTime())) return data.getTime();
    }
  } catch {}
  return 0;
};

// Formata data para exibição em gráficos (ex: "Jan/25")
export const formatarDataGrafico = (dataStr) => {
  if (!dataStr) return '';
  const corrigida = corrigirSeculoData(dataStr);
  if (isAnoIsolado(corrigida)) return corrigida; // ex: "1961"
  
  try {
    const mesesAbr = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dec'];
    
    if (typeof corrigida === 'string') {
      // Formato YYYY-MM-DD
      if (corrigida.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [ano, mes] = corrigida.split('-');
        return `${mesesAbr[parseInt(mes)-1]}/${ano.slice(2)}`;
      }
      // Formato MM/YYYY
      if (corrigida.match(/^\d{1,2}\/\d{4}$/)) {
        const [mes, ano] = corrigida.split('/');
        return `${mesesAbr[parseInt(mes)-1]}/${ano.slice(2)}`;
      }
      // Formato DD/MM/YYYY
      if (corrigida.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [dia, mes, ano] = corrigida.split('/');
        return `${mesesAbr[parseInt(mes)-1]}/${ano.slice(2)}`;
      }
    }
    
    // Se for timestamp, converter
    const timestamp = obterTimestamp(corrigida);
    if (timestamp) {
      const data = new Date(timestamp);
      return `${mesesAbr[data.getMonth()]}/${data.getFullYear().toString().slice(2)}`;
    }
  } catch {}
  
  return String(corrigida).substring(0, 10);
};

// Formata data completa para exibição em tabelas (ex: "Janeiro de 2025")
export const formatarDataCompleta = (dataStr) => {
  if (!dataStr) return 'N/A';
  const corrigida = corrigirSeculoData(dataStr);
  if (isAnoIsolado(corrigida)) return corrigida; // ex: "1961"
  
  try {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    if (typeof corrigida === 'string') {
      // Formato YYYY-MM-DD
      if (corrigida.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [ano, mes] = corrigida.split('-');
        return `${meses[parseInt(mes)-1]} de ${ano}`;
      }
      // Formato MM/YYYY
      if (corrigida.match(/^\d{1,2}\/\d{4}$/)) {
        const [mes, ano] = corrigida.split('/');
        return `${meses[parseInt(mes)-1]} de ${ano}`;
      }
      // Formato DD/MM/YYYY
      if (corrigida.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [dia, mes, ano] = corrigida.split('/');
        return `${meses[parseInt(mes)-1]} de ${ano}`;
      }
      // Formato "nov/2025"
      const matchAbr = corrigida.match(/^([a-z]{3})\/(\d{4})$/i);
      if (matchAbr) {
        const mesesAbr = {
          'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
          'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
        };
        const mesNum = mesesAbr[matchAbr[1].toLowerCase()];
        if (mesNum !== undefined) {
          return `${meses[mesNum]} de ${matchAbr[2]}`;
        }
      }
    }
    
    // Se for timestamp, converter
    const timestamp = obterTimestamp(corrigida);
    if (timestamp) {
      const data = new Date(timestamp);
      return `${meses[data.getMonth()]} de ${data.getFullYear()}`;
    }
  } catch {}
  
  return String(corrigida);
};