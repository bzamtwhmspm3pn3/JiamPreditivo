// routes/r-api/processamento.js - VERSÃO COMPLETA E CORRIGIDA COM TODOS OS DADOS
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const mongoose = require('mongoose');

// =================== CONFIGURAÇÃO MULTER ===================
const storage = multer.memoryStorage(); // Armazenar em memória

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB (aumentado)
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.csv', '.xlsx', '.xls', '.json', '.txt', '.parquet', '.rds'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não suportado. Use: ${allowedExtensions.join(', ')}`));
    }
  }
});

// =================== MODELO DE HISTÓRICO ===================
// Criar modelo dinâmico se não existir
let HistoricoUpload;
try {
  HistoricoUpload = require('../../models/HistoricoUpload');
} catch (e) {
  // Criar esquema dinâmico
  const HistoricoSchema = new mongoose.Schema({
    nomeArquivo: String,
    nomeOriginal: String,
    tamanho: Number,
    tipo: String,
    usuario: { type: String, default: 'admin' },
    dadosProcessados: {
      registros: Number,
      variaveis: Number,
      colunas: [String]
    },
    dataUpload: { type: Date, default: Date.now },
    status: String,
    erro: String
  }, { timestamps: true });
  
  HistoricoUpload = mongoose.model('HistoricoUpload', HistoricoSchema);
}

// =================== FORMATADORES ANGOLANOS ===================
class FormatadorAngola {
  // Formatar Kwanza
  static formatarKwanza(valor, opcoes = {}) {
    const numValor = parseFloat(valor) || 0;
    const casasDecimais = opcoes.casasDecimais || 2;
    const mostrarSimbolo = opcoes.mostrarSimbolo !== false;
    
    // Formato angolano: 1.234,56 Kz
    const formatted = numValor.toFixed(casasDecimais)
      .replace('.', ',')
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return mostrarSimbolo ? `${formatted} Kz` : formatted;
  }

  // Formatar data angolana
  static formatarData(data, formato = 'dd/MM/yyyy') {
    const date = new Date(data);
    if (isNaN(date.getTime())) return data;
    
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const ano = date.getFullYear();
    const horas = date.getHours().toString().padStart(2, '0');
    const minutos = date.getMinutes().toString().padStart(2, '0');
    const segundos = date.getSeconds().toString().padStart(2, '0');
    
    switch(formato) {
      case 'dd/MM/yyyy':
        return `${dia}/${mes}/${ano}`;
      case 'dd/MM/yyyy HH:mm':
        return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
      case 'dd/MM/yyyy HH:mm:ss':
        return `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`;
      default:
        return date.toISOString();
    }
  }

  // Formatar percentual angolano
  static formatarPercentual(valor, casasDecimais = 2) {
    const numValor = parseFloat(valor) || 0;
    return `${numValor.toFixed(casasDecimais).replace('.', ',')}%`;
  }

  // Formatar número com separadores angolanos
  static formatarNumero(valor, casasDecimais = 2) {
    const numValor = parseFloat(valor) || 0;
    const partes = numValor.toFixed(casasDecimais).split('.');
    const inteiro = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const decimal = partes[1] ? `,${partes[1]}` : '';
    return inteiro + decimal;
  }
}

// =================== FUNÇÕES DE PROCESSAMENTO MELHORADAS ===================
function processarCSV(buffer) {
  try {
    const content = buffer.toString('utf8').replace(/\r\n/g, '\n');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      throw new Error('Arquivo CSV vazio');
    }
    
    // Detectar delimitador de colunas
    const firstLine = lines[0];
    let delimiter = ',';
    
    // Verificar delimitadores
    if (firstLine.includes('\t')) {
      delimiter = '\t'; // Arquivo TSV
    } else if (firstLine.includes(';')) {
      delimiter = ';';
    }
    
    console.log(`🔍 Delimitador detectado: "${delimiter}"`);
    console.log(`📄 Primeira linha: "${firstLine}"`);
    
    // Obter cabeçalhos
    const headers = firstLine.split(delimiter).map((h, idx) => {
      const header = h.trim().replace(/^"|"$/g, '');
      return header || `Coluna_${idx + 1}`;
    });
    
    console.log(`📋 Cabeçalhos: ${headers.join(', ')}`);
    
    // Função para detectar formato numérico
    const detectarFormatoNumerico = (valor) => {
      const valorLimpo = valor.trim();
      
      // Verificar se é número com ponto decimal (formato inglês/internacional)
      if (/^-?\d*\.?\d+$/.test(valorLimpo)) {
        return 'ponto_decimal';
      }
      
      // Verificar se é número com vírgula decimal (formato angolano/europeu)
      if (/^-?\d*,\d+$/.test(valorLimpo)) {
        return 'virgula_decimal';
      }
      
      // Verificar se tem notação científica
      if (/^-?\d*[.,]?\d+[eE][+-]?\d+$/.test(valorLimpo)) {
        return 'notacao_cientifica';
      }
      
      return null;
    };
    
    // Analisar algumas linhas para detectar padrão
    let formatoNumericoPredominante = null;
    let valoresTeste = [];
    
    for (let i = 1; i < Math.min(10, lines.length); i++) {
      const line = lines[i];
      if (line.trim() === '') continue;
      
      const values = line.split(delimiter);
      values.forEach((val, idx) => {
        const trimmedVal = val.trim();
        if (trimmedVal && idx < headers.length) {
          const formato = detectarFormatoNumerico(trimmedVal);
          if (formato) {
            valoresTeste.push({ valor: trimmedVal, formato });
          }
        }
      });
    }
    
    // Contar formatos encontrados
    const contagemFormatos = valoresTeste.reduce((acc, item) => {
      acc[item.formato] = (acc[item.formato] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`🔍 Análise de formatos:`, contagemFormatos);
    
    // Determinar formato predominante
    if (contagemFormatos['ponto_decimal'] > 0) {
      formatoNumericoPredominante = 'ponto_decimal';
    } else if (contagemFormatos['virgula_decimal'] > 0) {
      formatoNumericoPredominante = 'virgula_decimal';
    }
    
    console.log(`🔍 Formato numérico predominante: ${formatoNumericoPredominante || 'não detectado'}`);
    
    // Processar dados
    const dados = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === '') continue;
      
      let values = [];
      
      // Processamento robusto para CSV com aspas
      if (line.includes('"') || line.includes("'")) {
        let inQuotes = false;
        let currentValue = '';
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === delimiter && !inQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim());
      } else {
        values = line.split(delimiter).map(v => v.trim());
      }
      
      // Garantir que temos valores para todas as colunas
      while (values.length < headers.length) {
        values.push('');
      }
      
      const obj = {};
      headers.forEach((header, index) => {
        let value = values[index] || '';
        
        // Remover aspas extras
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        
        if (value === '') {
          obj[header] = null;
        } else {
          // DETECÇÃO E CONVERSÃO INTELIGENTE DE NÚMEROS
          
          // Verificar se parece ser número
          const pareceNumero = /^-?\d*[.,]?\d+([eE][+-]?\d+)?$/.test(value);
          
          if (pareceNumero) {
            // Converter baseado no formato detectado
            let valorParaConversao = value;
            
            // Se temos formato predominante, usar regras específicas
            if (formatoNumericoPredominante === 'ponto_decimal') {
              // Formato inglês: ponto decimal, vírgula é separador de milhar
              // REMOVER apenas vírgulas (separadores de milhar)
              valorParaConversao = value.replace(/,/g, '');
            } else if (formatoNumericoPredominante === 'virgula_decimal') {
              // Formato angolano: vírgula decimal, ponto é separador de milhar
              // REMOVER pontos (separadores de milhar) e substituir vírgula por ponto
              valorParaConversao = value.replace(/\./g, '').replace(',', '.');
            } else {
              // Sem formato predominante - tentar heurística
              // Contar pontos e vírgulas
              const pontos = (value.match(/\./g) || []).length;
              const virgulas = (value.match(/,/g) || []).length;
              
              if (pontos === 1 && virgulas === 0) {
                // Provavelmente ponto decimal (ex: 0.011)
                // Manter como está
                valorParaConversao = value;
              } else if (virgulas === 1 && pontos === 0) {
                // Provavelmente vírgula decimal (ex: 0,011)
                valorParaConversao = value.replace(',', '.');
              } else if (pontos > 1 && virgulas === 0) {
                // Múltiplos pontos - provavelmente separadores de milhar com ponto decimal
                // Último ponto é decimal, outros são separadores de milhar
                const partes = value.split('.');
                const inteiro = partes.slice(0, -1).join('');
                const decimal = partes[partes.length - 1];
                valorParaConversao = inteiro + '.' + decimal;
              } else if (virgulas > 1 && pontos === 0) {
                // Múltiplas vírgulas - provavelmente separadores de milhar com vírgula decimal
                // Última vírgula é decimal, outras são separadores de milhar
                const partes = value.split(',');
                const inteiro = partes.slice(0, -1).join('');
                const decimal = partes[partes.length - 1];
                valorParaConversao = inteiro + '.' + decimal;
              } else {
                // Caso complexo - manter string
                obj[header] = value;
                return;
              }
            }
            
            // Tentar converter para número
            const numValue = parseFloat(valorParaConversao);
            
            if (!isNaN(numValue)) {
              // Verificar se o número original era muito pequeno (< 0.1)
              // para garantir que não perca precisão
              if (Math.abs(numValue) < 0.1 && value.includes('.')) {
                // Preservar precisão para números pequenos
                obj[header] = numValue;
              } else {
                obj[header] = numValue;
              }
            } else {
              obj[header] = value;
            }
          } else {
            // Não é número - manter como string
            obj[header] = value;
          }
        }
      });
      
      dados.push(obj);
    }
    
    // DEBUG: Mostrar análise dos valores processados
    console.log('🔍 Análise dos valores processados:');
    headers.forEach(header => {
      const valores = dados.map(item => item[header]).filter(v => v !== null);
      const numeros = valores.filter(v => typeof v === 'number');
      const strings = valores.filter(v => typeof v === 'string');
      
      if (numeros.length > 0) {
        const exemplos = numeros.slice(0, 3);
        console.log(`  ${header}: ${numeros.length} números, ${strings.length} strings`);
        console.log(`    Exemplos numéricos: ${exemplos.join(', ')}`);
        
        // Verificar se há valores pequenos
        const pequenos = numeros.filter(n => Math.abs(n) < 0.1);
        if (pequenos.length > 0) {
          console.log(`    Valores < 0.1: ${pequenos.length} (ex: ${pequenos.slice(0, 3).join(', ')})`);
        }
      }
    });
    
    console.log(`✅ CSV processado: ${dados.length} registros, ${headers.length} colunas`);
    
    return { 
      headers, 
      dados, 
      delimiter,
      metadados: {
        formato_detectado: formatoNumericoPredominante,
        analise_formatos: contagemFormatos,
        aviso: formatoNumericoPredominante ? 
          `Usando formato ${formatoNumericoPredominante}` : 
          'Formato não detectado automaticamente - usando heurística'
      }
    };
  } catch (error) {
    console.error('❌ Erro no processamento CSV:', error);
    throw new Error(`Erro CSV: ${error.message}`);
  }
}

function processarExcel(buffer) {
  try {
    console.log('🔍 PROCESSANDO EXCEL - PRESERVANDO VALORES PEQUENOS');
    
    // Configuração para preservar valores exatos
    const workbook = XLSX.read(buffer, {
      type: 'buffer',
      cellDates: false,        // NÃO converter datas
      cellText: false,         // NÃO converter para texto
      cellNF: false,           // NÃO converter formatos de número
      raw: false,              // IMPORTANTE: false para obter valores brutos como strings
      sheetRows: 0,
      cellFormula: false       // Ignorar fórmulas
    });
    
    const sheetNames = workbook.SheetNames;
    const primeiraSheet = sheetNames[0];
    const worksheet = workbook.Sheets[primeiraSheet];
    
    // Converter para CSV preservando valores exatos
    const csvData = XLSX.utils.sheet_to_csv(worksheet, {
      FS: ';',
      RS: '\n',
      blankrows: false,
      strip: false,
      rawNumbers: false,       // Importante: false para evitar conversão de números
      forceQuotes: false
    });
    
    const linhas = csvData.split('\n').filter(line => line.trim() !== '');
    console.log(`📊 Total de linhas: ${linhas.length}`);
    
    if (linhas.length === 0) {
      throw new Error('Planilha Excel vazia');
    }
    
    // Obter células originais para analisar formatos
    const cellData = {};
    for (let cell in worksheet) {
      if (cell[0] === '!') continue;
      
      const celula = worksheet[cell];
      cellData[cell] = {
        v: celula.v,
        t: celula.t,
        w: celula.w,
        z: celula.z
      };
    }
    
    // Processar MANUALMENTE com controle total sobre valores pequenos
    const dados = [];
    let headers = [];
    
    // Verificar se primeira linha é cabeçalho
    const primeiraLinha = linhas[0].split(';');
    const possuiCabecalhosTextuais = primeiraLinha.some((cell, idx) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: idx });
      const celula = cellData[cellRef];
      
      // Se célula existe e tem tipo 's' (string), provavelmente é cabeçalho
      return celula && celula.t === 's';
    });
    
    if (possuiCabecalhosTextuais) {
      // Usar primeira linha como cabeçalhos
      headers = primeiraLinha.map((cell, idx) => {
        const header = cell.trim();
        if (header === '') {
          const cellRef = XLSX.utils.encode_cell({ r: 0, c: idx });
          const celula = cellData[cellRef];
          
          // Tentar inferir tipo pelo conteúdo
          if (celula && celula.t === 'n') {
            if (celula.z && (celula.z.includes('d') || celula.z.includes('m') || celula.z.includes('y'))) {
              return 'Data';
            }
            return 'Valor';
          }
          return `Coluna_${idx + 1}`;
        }
        return header;
      });
      
      // Processar linhas de dados (começando da linha 1)
      for (let i = 1; i < linhas.length; i++) {
        const linha = linhas[i].split(';');
        const registro = {};
        
        headers.forEach((header, idx) => {
          const cellRef = XLSX.utils.encode_cell({ r: i, c: idx });
          const celula = cellData[cellRef];
          
          let valor;
          
          if (celula) {
            // Obter valor da célula com base no tipo
            if (celula.w !== undefined) {
              // Usar o valor formatado como string (w)
              valor = celula.w;
            } else if (celula.v !== undefined) {
              // Usar valor bruto
              valor = celula.v.toString();
            } else {
              valor = linha[idx] || '';
            }
          } else {
            valor = linha[idx] || '';
          }
          
          valor = valor.trim();
          
          if (valor === '') {
            registro[header] = null;
            return;
          }
          
          // PRESERVAÇÃO CRÍTICA DE VALORES PEQUENOS
          // Verificar se é um número muito pequeno ou notação científica
          const isNotacaoCientifica = /[eE][+-]?\d+/.test(valor);
          const isDecimalPequeno = valor.includes('.') && Math.abs(parseFloat(valor)) < 0.01;
          
          if (isNotacaoCientifica || isDecimalPequeno) {
            // NÃO CONVERTER - manter como string
            // Tentar preservar a formatação original
            registro[header] = valor;
          } else {
            // Tentar converter para número apenas se for seguro
            const numValor = parseFloat(valor.replace(',', '.'));
            
            if (!isNaN(numValor) && /^[\d.,\s-]+$/.test(valor.replace(/\./g, '').replace(',', '.'))) {
              // É um número "seguro" - converter
              registro[header] = numValor;
            } else {
              // Manter como string
              registro[header] = valor;
            }
          }
        });
        
        if (Object.values(registro).some(v => v !== null)) {
          dados.push(registro);
        }
      }
    } else {
      // Não tem cabeçalhos claros - criar automáticos
      const numColunas = primeiraLinha.length;
      
      headers = Array.from({ length: numColunas }, (_, idx) => {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: idx });
        const celula = cellData[cellRef];
        
        // Analisar primeira célula de cada coluna para nomear
        if (celula) {
          if (celula.z && (celula.z.includes('d') || celula.z.includes('m') || celula.z.includes('y'))) {
            return 'Data';
          } else if (celula.t === 'n') {
            // Verificar se é número muito pequeno
            if (celula.v !== undefined && Math.abs(celula.v) < 0.01) {
              return 'Valor_Pequeno';
            }
            return 'Valor';
          } else if (celula.t === 's') {
            // Verificar padrões na string
            const valorStr = celula.v ? celula.v.toString() : '';
            if (valorStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) return 'Data';
            if (valorStr.match(/^\d{4}-\d{2}-\d{2}$/)) return 'Data_ISO';
            if (/^-?\d*[.,]?\d+([eE][+-]?\d+)?$/.test(valorStr)) return 'Numero_Formatado';
          }
        }
        
        return `Coluna_${idx + 1}`;
      });
      
      // Processar todas as linhas como dados
      for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i].split(';');
        const registro = {};
        
        headers.forEach((header, idx) => {
          const cellRef = XLSX.utils.encode_cell({ r: i, c: idx });
          const celula = cellData[cellRef];
          
          let valor;
          
          if (celula) {
            if (celula.w !== undefined) {
              valor = celula.w;
            } else if (celula.v !== undefined) {
              valor = celula.v.toString();
            } else {
              valor = linha[idx] || '';
            }
          } else {
            valor = linha[idx] || '';
          }
          
          valor = valor.trim();
          
          if (valor === '') {
            registro[header] = null;
            return;
          }
          
          // ESTRATÉGIA ESPECÍFICA PARA VALORES PEQUENOS
          // 1. Verificar se parece notação científica
          const pareceNotacaoCientifica = /^-?\d*\.?\d+[eE][+-]?\d+$/.test(valor);
          
          // 2. Verificar se é decimal muito pequeno
          const pareceDecimalPequeno = /^-?0\.0+[1-9]/.test(valor);
          
          // 3. Verificar se contém 'E-' ou 'e-' (notação científica)
          const temNotacaoCientifica = /[eE][+-]\d+/.test(valor);
          
          if (pareceNotacaoCientifica || pareceDecimalPequeno || temNotacaoCientifica) {
            // PRESERVAR COMO STRING - não converter
            registro[header] = valor;
          } else {
            // Tentar conversão normal
            const numValor = parseFloat(valor.replace(',', '.'));
            if (!isNaN(numValor) && /^[\d.,\s-]+$/.test(valor.replace(/\./g, '').replace(',', '.'))) {
              registro[header] = numValor;
            } else {
              registro[header] = valor;
            }
          }
        });
        
        if (Object.values(registro).some(v => v !== null)) {
          dados.push(registro);
        }
      }
    }
    
    // Função auxiliar para detectar valores pequenos
    const detectarValoresPequenos = (dados, headers) => {
      const pequenos = {};
      
      headers.forEach(header => {
        const valores = dados
          .map(item => item[header])
          .filter(v => v !== null && v !== undefined)
          .map(v => {
            if (typeof v === 'string') {
              const num = parseFloat(v.replace(',', '.'));
              return isNaN(num) ? null : Math.abs(num);
            }
            return Math.abs(v);
          })
          .filter(v => v !== null && v < 0.01);
        
        if (valores.length > 0) {
          pequenos[header] = {
            quantidade: valores.length,
            menor: Math.min(...valores),
            maior: Math.max(...valores.filter(v => v < 0.01)),
            exemplos: dados
              .filter(item => {
                const val = item[header];
                if (!val) return false;
                const num = typeof val === 'string' ? 
                  parseFloat(val.replace(',', '.')) : 
                  val;
                return !isNaN(num) && Math.abs(num) < 0.01;
              })
              .slice(0, 3)
              .map(item => item[header])
          };
        }
      });
      
      return pequenos;
    };
    
    const valoresPequenos = detectarValoresPequenos(dados, headers);
    console.log(`🔍 Valores pequenos detectados:`, Object.keys(valoresPequenos).length);
    
    if (Object.keys(valoresPequenos).length > 0) {
      console.log('📊 Detalhes valores pequenos:');
      Object.entries(valoresPequenos).forEach(([coluna, info]) => {
        console.log(`  ${coluna}: ${info.quantidade} valores < 0.01, ex: ${info.exemplos.join(', ')}`);
      });
    }
    
    console.log(`✅ Excel processado: ${dados.length} registros`);
    console.log(`📋 Cabeçalhos: ${headers.join(', ')}`);
    
    return { 
      headers, 
      dados, 
      sheetNames,
      metadados: {
        processamento: 'preservacao_valores_exatos',
        valores_pequenos_detectados: Object.keys(valoresPequenos).length,
        aviso_valores_pequenos: 'Valores < 0.01 preservados como strings para evitar perda de precisão',
        recomendacao: 'Converter strings para números apenas quando necessário, usando parseFloat(valor.replace(",", "."))'
      }
    };
    
  } catch (error) {
    console.error('❌ Erro no processamento Excel:', error);
    throw new Error(`Erro Excel: ${error.message}`);
  }
}

function processarJSON(buffer) {
  try {
    const content = buffer.toString('utf8');
    let dados = JSON.parse(content);
    
    if (!dados) {
      throw new Error('JSON vazio');
    }
    
    let headers = [];
    
    if (Array.isArray(dados)) {
      if (dados.length === 0) {
        throw new Error('Array JSON vazio');
      }
      // MANTER CABEÇALHOS EXATAMENTE COMO ESTÃO
      headers = Object.keys(dados[0]);
      // SEM LIMITE - pegar todos os dados
      // dados = dados; // Comentado para manter todos os dados
    } else if (typeof dados === 'object') {
      // Objeto único - transformar em array
      headers = Object.keys(dados);
      dados = [dados];
    } else {
      throw new Error('Formato JSON inválido');
    }
    
    console.log(`✅ JSON processado: ${dados.length} registros, ${headers.length} colunas`);
    console.log(`📋 Cabeçalhos mantidos originais: ${headers.join(', ')}`);
    
    return { headers, dados };
  } catch (error) {
    console.error('❌ Erro no processamento JSON:', error);
    throw new Error(`Erro JSON: ${error.message}`);
  }
}

function analisarDadosProfundamente(headers, dados) {
  const estatisticas = {
    registros: dados.length,
    variaveis: headers.length,
    tipos: {},
    valores_ausentes: {},
    valores_unicos: {},
    exemplos: {},
    estatisticas_numericas: {}
  };
  
  headers.forEach(header => {
    const valores = dados.map(item => item[header]);
    const valoresValidos = valores.filter(v => 
      v !== null && v !== undefined && v !== '' && v !== 'NULL' && v !== 'null'
    );
    
    // Valores ausentes
    estatisticas.valores_ausentes[header] = valores.length - valoresValidos.length;
    
    // Exemplo (primeiro valor válido)
    estatisticas.exemplos[header] = valoresValidos[0] || null;
    
    // Detectar tipo baseado no primeiro valor válido
    if (valoresValidos.length === 0) {
      estatisticas.tipos[header] = 'desconhecido';
    } else {
      const exemplo = valoresValidos[0];
      
      if (typeof exemplo === 'number') {
        estatisticas.tipos[header] = 'numérico';
        
        // Estatísticas para colunas numéricas
        const numeros = valoresValidos.filter(v => typeof v === 'number');
        if (numeros.length > 0) {
          estatisticas.estatisticas_numericas[header] = {
            min: Math.min(...numeros),
            max: Math.max(...numeros),
            media: numeros.reduce((a, b) => a + b, 0) / numeros.length,
            mediana: numeros.sort((a, b) => a - b)[Math.floor(numeros.length / 2)],
            soma: numeros.reduce((a, b) => a + b, 0),
            contagem: numeros.length
          };
        }
      } else if (typeof exemplo === 'string') {
        // Detectar se é data string
        if (exemplo.match(/^\d{4}-\d{2}-\d{2}/) || exemplo.match(/^\d{2}\/\d{2}\/\d{4}/)) {
          estatisticas.tipos[header] = 'data';
        } else if (!isNaN(parseFloat(exemplo.replace(',', '.'))) && exemplo.trim() !== '') {
          estatisticas.tipos[header] = 'numérico (texto)';
        } else {
          estatisticas.tipos[header] = 'texto';
        }
      } else if (exemplo instanceof Date || (typeof exemplo === 'string' && new Date(exemplo).toString() !== 'Invalid Date')) {
        estatisticas.tipos[header] = 'data';
      } else {
        estatisticas.tipos[header] = 'texto';
      }
    }
    
    // Valores únicos
    const valoresUnicos = new Set(valoresValidos.map(v => 
      v instanceof Date ? v.toISOString() : v.toString()
    ));
    estatisticas.valores_unicos[header] = valoresUnicos.size;
  });
  
  // Totais
  estatisticas.total_valores_ausentes = Object.values(estatisticas.valores_ausentes).reduce((a, b) => a + b, 0);
  estatisticas.taxa_completude = ((dados.length * headers.length - estatisticas.total_valores_ausentes) / (dados.length * headers.length) * 100).toFixed(2);
  
  return estatisticas;
}
// =================== ROTA GET PRINCIPAL ATUALIZADA ===================
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Processamento de Dados - JIAM Angola',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    regional: {
      pais: 'Angola',
      moeda: 'Kwanza (Kz)',
      formato_data: 'dd/MM/yyyy',
      separador_decimal: ',',
      separador_milhar: '.'
    },
    endpoints: {
      upload: 'POST /upload - Upload de arquivos',
      formatar: 'POST /formatar - Formatadores angolanos',
      limpar: 'POST /limpar - Limpeza de dados',
      atuarial: 'POST /atuarial - Processamento atuarial',
      historico: 'GET /historico - Histórico de uploads',
      formatos: 'GET /formatos - Formatos suportados'
    },
    formatos_suportados: [
      'CSV (.csv, .txt) - Valores separados por vírgula ou ponto e vírgula',
      'Excel (.xlsx, .xls) - Microsoft Excel',
      'JSON (.json) - JavaScript Object Notation',
      'Parquet (.parquet) - Apache Parquet',
      'R Data (.rds) - R Data Serialization'
    ],
    funcionalidades: [
      'Formatação Kwanza (ex: 1.234,56 Kz)',
      'Formatação percentual angolana (ex: 12,34%)',
      'Formatação de datas angolanas (dd/MM/yyyy)',
      'Processamento real de Excel',
      'Detecção automática de delimitadores CSV',
      'Análise profunda de dados',
      'Histórico em banco de dados',
      'Limpeza e tratamento de dados'
    ]
  });
});

// =================== ROTA GET PARA FORMATOS ===================
router.get('/formatos', (req, res) => {
  res.json({
    success: true,
    formatos_detalhados: [
      {
        formato: 'CSV',
        extensoes: ['.csv', '.txt'],
        descricao: 'Valores separados por delimitador',
        delimitadores_suportados: [',', ';', '\t'],
        encoding: 'UTF-8',
        exemplo: 'Nome;Idade;Cidade\nJoão;30;Luanda\nMaria;25;Benguela'
      },
      {
        formato: 'Excel',
        extensoes: ['.xlsx', '.xls'],
        descricao: 'Planilhas Microsoft Excel',
        abas_multiplas: true,
        formatacao: 'Suporta formatação, fórmulas e múltiplas abas',
        limite: 'Até 1.000.000 linhas por aba'
      },
      {
        formato: 'JSON',
        extensoes: ['.json'],
        descricao: 'JavaScript Object Notation',
        estrutura: 'Array de objetos ou objeto único',
        uso: 'Ideal para APIs e dados estruturados'
      }
    ]
  });
});

// =================== ROTA GET PARA TESTE DE FORMATADOR ANGOLANO ===================
router.get('/teste-formatador', (req, res) => {
  const { tipo, valor } = req.query;
  const numValor = parseFloat(valor) || 1234567.89;
  const tipoFormatacao = tipo || 'kwanza';
  
  let formatado;
  let descricao;
  
  switch(tipoFormatacao) {
    case 'kwanza':
      formatado = FormatadorAngola.formatarKwanza(numValor);
      descricao = 'Formato Kwanza angolano';
      break;
    case 'percentual':
      formatado = FormatadorAngola.formatarPercentual(numValor * 100);
      descricao = 'Percentual angolano';
      break;
    case 'numero':
      formatado = FormatadorAngola.formatarNumero(numValor);
      descricao = 'Número com separadores angolanos';
      break;
    case 'data':
      formatado = FormatadorAngola.formatarData(new Date(), 'dd/MM/yyyy');
      descricao = 'Data no formato angolano';
      break;
    default:
      formatado = FormatadorAngola.formatarNumero(numValor);
      descricao = 'Formato numérico padrão';
  }
  
  res.json({
    success: true,
    teste: 'Formatador Angolano',
    original: numValor,
    formatado: formatado,
    tipo: tipoFormatacao,
    descricao: descricao,
    exemplo_uso: 'GET /teste-formatador?tipo=kwanza&valor=1234.56'
  });
});

// =================== ROTA DE UPLOAD REAL MELHORADA ===================
router.post('/upload', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('📤 Recebendo upload...');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado. Use o campo "file".'
      });
    }
    
    const file = req.file;
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    console.log(`📄 Processando: ${file.originalname} (${file.size} bytes)`);
    
    let headers = [];
    let dados = [];
    let metadados = {};
    
    // Processar baseado na extensão
    switch(fileExt) {
      case '.csv':
      case '.txt':
        const resultadoCSV = processarCSV(file.buffer);
        headers = resultadoCSV.headers;
        dados = resultadoCSV.dados;
        metadados = {
          formato: 'CSV',
          delimitador: resultadoCSV.delimiter,
          encoding: 'UTF-8',
          processamento_completo: true
        };
        break;
        
      case '.xlsx':
      case '.xls':
        console.log('🔍 Processando arquivo Excel...');
        const resultadoExcel = processarExcel(file.buffer);
        headers = resultadoExcel.headers;
        dados = resultadoExcel.dados;
        console.log(`🔍 Excel processado: ${dados.length} registros`);
        metadados = {
          formato: 'Excel',
          abas: resultadoExcel.sheetNames,
          total_abas: resultadoExcel.sheetNames.length,
          processamento_completo: true
        };
        break;
        
      case '.json':
        const resultadoJSON = processarJSON(file.buffer);
        headers = resultadoJSON.headers;
        dados = resultadoJSON.dados;
        metadados = {
          formato: 'JSON',
          tipo_estrutura: Array.isArray(JSON.parse(file.buffer.toString())) ? 'array' : 'objeto',
          processamento_completo: true
        };
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: `Formato ${fileExt} não suportado para processamento automático`,
          formatos_suportados: ['.csv', '.xlsx', '.xls', '.json', '.txt']
        });
    }
    
    // Validar dados
    if (!headers.length) {
      throw new Error('Não foi possível identificar as colunas do arquivo');
    }
    
    if (!dados.length) {
      throw new Error('O arquivo não contém dados válidos');
    }
    
    console.log(`✅ Dados processados: ${dados.length} registros, ${headers.length} colunas`);
    
    // Analisar dados
    const analise = analisarDadosProfundamente(headers, dados);
    
    // Salvar no histórico
    try {
      const historicoEntry = new HistoricoUpload({
        nomeArquivo: path.parse(file.originalname).name,
        nomeOriginal: file.originalname,
        tamanho: file.size,
        tipo: fileExt.replace('.', ''),
        dadosProcessados: {
          registros: dados.length,
          variaveis: headers.length,
          colunas: headers.slice(0, 20)
        },
        status: 'sucesso',
        dataUpload: new Date()
      });
      
      await historicoEntry.save();
      console.log('📝 Histórico salvo no banco de dados');
    } catch (histError) {
      console.warn('⚠️ Não foi possível salvar no histórico:', histError.message);
    }
    
    // Calcular tamanho dos dados
    const tamanhoDadosJSON = JSON.stringify(dados).length;
    const tamanhoMB = (tamanhoDadosJSON / 1024 / 1024).toFixed(2);
    const tempoProcessamento = Date.now() - startTime;
    
    // CONFIGURAÇÃO CORRIGIDA - ENVIAR TODOS OS DADOS SEM EXCEÇÃO
    console.log(`🔍 PREPARANDO RESPOSTA: ${dados.length} registros para enviar`);
    console.log(`🔍 Primeiro registro:`, dados[0]);
    console.log(`🔍 Último registro:`, dados[dados.length - 1]);
    
    // CRÍTICO: Garantir que estamos enviando TODOS os dados
    const response = {
      success: true,
      message: `Arquivo processado com sucesso! ${dados.length} registros carregados COMPLETAMENTE.`,
      arquivo: {
        nome: file.originalname,
        tamanho: file.size,
        tamanho_formatado: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        tipo: file.mimetype,
        extensao: fileExt,
        data_processamento: new Date().toISOString(),
        registros_totais: dados.length,
        confirmacao: `Arquivo contém ${dados.length} registros`
      },
      dados: {
        registros: dados.length,
        variaveis: headers.length,
        colunas: headers,
        // ENVIAR TODOS OS DADOS SEM EXCEÇÃO
        dados_completos: dados, // TODOS OS REGISTROS
        // Para compatibilidade: amostra também contém todos os dados
        amostra: dados, // MESMO QUE dados_completos
        total_completo: true, // SEMPRE TRUE - estamos enviando tudo
        aviso_performance: `${dados.length} registros enviados completamente`,
        confirmacao_envio: `API está enviando ${dados.length} registros para o frontend`
      },
      analise: analise,
      metadados: metadados,
      performance: {
        tempo_processamento: `${tempoProcessamento}ms`,
        tempo_segundos: (tempoProcessamento / 1000).toFixed(2),
        velocidade: `${Math.round((dados.length / (tempoProcessamento / 1000)))} registros/segundo`,
        status: 'Todos os registros enviados',
        confirmacao: `Processados e enviados ${dados.length} registros`
      },
      informacoes_tecnicas: {
        formato_original: fileExt,
        tamanho_memoria: `${tamanhoMB} MB`,
        tamanho_aproximado_json: tamanhoDadosJSON,
        registros_enviados: dados.length,
        confirmacao_envio: 'API enviando TODOS os registros sem limitação'
      },
      dicas_performance: [
        `Todos os ${dados.length} registros disponíveis para análise`,
        'Use os filtros da tabela para exploração interativa',
        'Para grandes volumes, use a paginação do frontend'
      ],
      proximos_passos: [
        { 
          acao: 'exploracao_interface', 
          descricao: 'Use a tabela com filtros para explorar os dados',
          registros: dados.length,
          endpoint: 'Interface Web /tabela',
          observacao: `${dados.length} registros disponíveis`
        },
        { 
          acao: 'analise_estatistica', 
          endpoint: 'POST /atuarial', 
          descricao: 'Análise estatística dos dados',
          observacao: 'Funciona com qualquer volume de dados',
          registros_suportados: dados.length
        }
      ],
      limites: {
        servidor: 'Nenhum limite de registros na resposta',
        cliente: `${dados.length} registros enviados para o frontend`,
        recomendacao: 'Todos os dados disponíveis para visualização'
      },
      debug: {
        registros_processados: dados.length,
        primeira_data: dados.length > 0 && dados[0][headers[0]] ? dados[0][headers[0]] : 'N/A',
        ultima_data: dados.length > 0 && dados[dados.length - 1][headers[0]] ? dados[dados.length - 1][headers[0]] : 'N/A',
        confirmacao: `Resposta contém ${dados.length} registros em dados_completos`
      }
    };

    // Log detalhado do processamento
    console.log(`✅ Processado COMPLETO: ${dados.length} registros, ${headers.length} variáveis em ${tempoProcessamento}ms`);
    console.log(`📈 Performance: ${Math.round((dados.length / (tempoProcessamento / 1000)))} registros/segundo`);
    console.log(`💾 Tamanho dos dados: ${tamanhoMB} MB em memória`);
    console.log(`🔍 Estrutura resposta: dados_completos = ${response.dados.dados_completos.length} registros`);
    console.log(`🔍 Estrutura resposta: amostra = ${response.dados.amostra.length} registros`);
    console.log(`🔍 Estrutura resposta: total_completo = ${response.dados.total_completo}`);
    console.log(`🔍 DEBUG: Primeiros 2 registros sendo enviados:`, dados.slice(0, 2));
    
    // Ajustar cabeçalhos para melhor performance
    res.setHeader('X-Total-Records', dados.length);
    res.setHeader('X-Processing-Time', `${tempoProcessamento}ms`);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Debug-Info', `Enviados ${dados.length} registros completos`);
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Erro no processamento:', error);
    
    // Salvar erro no histórico
    try {
      const historicoEntry = new HistoricoUpload({
        nomeArquivo: req.file ? path.parse(req.file.originalname).name : 'desconhecido',
        nomeOriginal: req.file ? req.file.originalname : 'desconhecido',
        tamanho: req.file ? req.file.size : 0,
        tipo: req.file ? path.extname(req.file.originalname).replace('.', '') : 'desconhecido',
        status: 'erro',
        erro: error.message,
        stack_trace: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        dataUpload: new Date()
      });
      
      await historicoEntry.save();
    } catch (histError) {
      console.error('Erro ao salvar histórico de erro:', histError);
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro no processamento do arquivo',
      message: error.message,
      detalhes: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      tempo_processamento: `${Date.now() - startTime}ms`
    });
  }
});

// =================== ROTA PARA HISTÓRICO ===================
router.get('/historico', async (req, res) => {
  try {
    const { limite = 20, pagina = 1, buscar } = req.query;
    const skip = (parseInt(pagina) - 1) * parseInt(limite);
    
    let query = {};
    
    if (buscar) {
      query.nomeOriginal = { $regex: buscar, $options: 'i' };
    }
    
    const historicos = await HistoricoUpload.find(query)
      .sort({ dataUpload: -1 })
      .skip(skip)
      .limit(parseInt(limite));
    
    const total = await HistoricoUpload.countDocuments(query);
    
    res.json({
      success: true,
      historicos,
      paginacao: {
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        total,
        paginas: Math.ceil(total / limite)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar histórico',
      message: error.message
    });
  }
});

// =================== MIDDLEWARE DE VALIDAÇÃO ===================
const validateRequest = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Corpo da requisição vazio'
    });
  }
  next();
};

// =================== ROTA FORMATAR ANGOLANA ===================
router.post('/formatar', validateRequest, async (req, res) => {
  try {
    const { tipo, valor, opcoes } = req.body;
    
    let formatado;
    let descricao;
    
    switch(tipo) {
      case 'kwanza':
        formatado = FormatadorAngola.formatarKwanza(valor, opcoes);
        descricao = 'Valor em Kwanza angolano';
        break;
      case 'percentual':
        formatado = FormatadorAngola.formatarPercentual(valor, opcoes?.casas_decimais);
        descricao = 'Percentual formatado';
        break;
      case 'numero':
        formatado = FormatadorAngola.formatarNumero(valor, opcoes?.casas_decimais);
        descricao = 'Número com formatação angolana';
        break;
      case 'data':
        formatado = FormatadorAngola.formatarData(valor, opcoes?.formato);
        descricao = 'Data formatada';
        break;
      case 'cientifico':
        formatado = parseFloat(valor).toExponential(opcoes?.casas_decimais || 2);
        descricao = 'Notação científica';
        break;
      default:
        formatado = valor;
        descricao = 'Valor original';
    }
    
    // Salvar no histórico de formatações
    try {
      const formatacaoEntry = new HistoricoUpload({
        nomeArquivo: 'formatação',
        nomeOriginal: `formatação_${tipo}`,
        tipo: 'formatação',
        dadosProcessados: {
          registros: 1,
          variaveis: 1,
          colunas: ['formatação']
        },
        status: 'sucesso'
      });
      await formatacaoEntry.save();
    } catch (e) {
      // Ignorar erro no histórico
    }
    
    res.json({
      success: true,
      original: valor,
      formatado: formatado,
      tipo_formatacao: tipo,
      descricao: descricao,
      regional: 'Angola',
      opcoes_aplicadas: opcoes || {}
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro na formatação',
      message: error.message
    });
  }
});

// =================== ROTA LIMPAR MELHORADA ===================
router.post('/limpar', validateRequest, async (req, res) => {
  try {
    const { dados, estrategia = 'padrao', configuracoes = {} } = req.body;
    
    if (!dados || !Array.isArray(dados)) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos ou ausentes. Envie um array de objetos.'
      });
    }
    
    let dadosLimpos = [...dados];
    const estatisticas = {
      registros_originais: dados.length,
      variaveis_originais: dados[0] ? Object.keys(dados[0]).length : 0,
      valores_ausentes_antes: 0,
      valores_ausentes_depois: 0,
      duplicatas_removidas: 0,
      outliers_tratados: 0,
      registros_limpos: 0
    };
    
    // Contar valores ausentes antes
    estatisticas.valores_ausentes_antes = dados.reduce((total, linha) => {
      return total + Object.values(linha).filter(v => 
        v === null || v === undefined || v === '' || v === 'NULL' || v === 'null'
      ).length;
    }, 0);
    
    // Aplicar estratégias de limpeza
    if (estrategia.includes('remover_duplicatas')) {
      const unique = new Set();
      dadosLimpos = dadosLimpos.filter(item => {
        const key = JSON.stringify(item);
        if (unique.has(key)) {
          estatisticas.duplicatas_removidas++;
          return false;
        }
        unique.add(key);
        return true;
      });
    }
    
    if (estrategia.includes('remover_vazios')) {
      dadosLimpos = dadosLimpos.filter(linha => {
        return Object.values(linha).some(v => 
          v !== null && v !== undefined && v !== '' && v !== 'NULL' && v !== 'null'
        );
      });
    }
    
    // Tratar valores ausentes
    if (estrategia.includes('imputar')) {
      const metodo = configuracoes.metodo_imputacao || 'media';
      
      // Para cada coluna
      const colunas = Object.keys(dadosLimpos[0] || {});
      colunas.forEach(coluna => {
        const valores = dadosLimpos.map(item => item[coluna]);
        const valoresValidos = valores.filter(v => 
          v !== null && v !== undefined && v !== '' && !isNaN(v)
        );
        
        if (valoresValidos.length > 0) {
          let valorImputacao;
          
          switch(metodo) {
            case 'media':
              valorImputacao = valoresValidos.reduce((a, b) => a + b, 0) / valoresValidos.length;
              break;
            case 'mediana':
              const sorted = [...valoresValidos].sort((a, b) => a - b);
              valorImputacao = sorted[Math.floor(sorted.length / 2)];
              break;
            case 'moda':
              const frequencia = {};
              valoresValidos.forEach(v => {
                frequencia[v] = (frequencia[v] || 0) + 1;
              });
              valorImputacao = Object.keys(frequencia).reduce((a, b) => 
                frequencia[a] > frequencia[b] ? a : b
              );
              break;
            default:
              valorImputacao = 0;
          }
          
          // Aplicar imputação
          dadosLimpos.forEach(item => {
            if (item[coluna] === null || item[coluna] === undefined || item[coluna] === '' || isNaN(item[coluna])) {
              item[coluna] = valorImputacao;
            }
          });
        }
      });
    }
    
    estatisticas.registros_limpos = dadosLimpos.length;
    estatisticas.valores_ausentes_depois = dadosLimpos.reduce((total, linha) => {
      return total + Object.values(linha).filter(v => 
        v === null || v !== undefined || v === '' || v === 'NULL' || v === 'null'
      ).length;
    }, 0);
    
    // Salvar no histórico
    try {
      const limpezaEntry = new HistoricoUpload({
        nomeArquivo: 'limpeza_dados',
        nomeOriginal: `limpeza_${estrategia}`,
        tipo: 'limpeza',
        dadosProcessados: {
          registros: estatisticas.registros_limpos,
          variaveis: estatisticas.variaveis_originais,
          colunas: Object.keys(dadosLimpos[0] || {})
        },
        status: 'sucesso'
      });
      await limpezaEntry.save();
    } catch (e) {
      // Ignorar erro no histórico
    }
    
    res.json({
      success: true,
      estatisticas: estatisticas,
      dados: dadosLimpos.slice(0, Math.min(50, dadosLimpos.length)),
      variaveis_transformadas: [],
      recomendacoes: [
        `Removidas ${estatisticas.duplicatas_removidas} duplicatas`,
        `Valores ausentes tratados: ${estatisticas.valores_ausentes_antes} → ${estatisticas.valores_ausentes_depois}`,
        `Taxa de retenção: ${((estatisticas.registros_limpos / estatisticas.registros_originais) * 100).toFixed(2)}%`,
        'Considere normalização para análise estatística'
      ]
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro na limpeza de dados',
      message: error.message
    });
  }
});

// =================== ROTA ATUARIAL MELHORADA ===================
router.post('/atuarial', validateRequest, async (req, res) => {
  try {
    const { dados, parametros = {} } = req.body;
    
    if (!dados || !Array.isArray(dados)) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos ou ausentes'
      });
    }
    
    // Encontrar coluna de valor
    const primeiraLinha = dados[0] || {};
    const colunaValor = parametros.coluna_valor || 
      Object.keys(primeiraLinha).find(key => 
        key.toLowerCase().includes('valor') || 
        key.toLowerCase().includes('premio') ||
        key.toLowerCase().includes('sinistro')
      ) || 
      Object.keys(primeiraLinha)[0];
    
    // Extrair valores
    const valores = dados
      .map(item => parseFloat(item[colunaValor]) || 0)
      .filter(v => !isNaN(v) && v > 0);
    
    if (valores.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum valor numérico válido encontrado'
      });
    }
    
    // Cálculos atuariais básicos
    const soma = valores.reduce((a, b) => a + b, 0);
    const media = soma / valores.length;
    const max = Math.max(...valores);
    const min = Math.min(...valores);
    
    // Ordenar para percentis
    const sorted = [...valores].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    
    // Sinistralidade (simulação)
    const limiar = media * 1.5;
    const sinistrosGrandes = valores.filter(v => v > limiar).length;
    const sinistralidade = (sinistrosGrandes / valores.length) * 100;
    
    // Reservas (IBNR - Incurred But Not Reported)
    const reservaIBNR = soma * 0.15; // 15% do total
    const reservaCAT = max * 3; // Para catástrofes
    
    const calculos = {
      basico: {
        soma: FormatadorAngola.formatarKwanza(soma),
        media: FormatadorAngola.formatarKwanza(media),
        maximo: FormatadorAngola.formatarKwanza(max),
        minimo: FormatadorAngola.formatarKwanza(min),
        desvio_padrao: FormatadorAngola.formatarKwanza(
          Math.sqrt(valores.map(x => Math.pow(x - media, 2)).reduce((a, b) => a + b, 0) / valores.length)
        )
      },
      percentis: {
        p95: FormatadorAngola.formatarKwanza(p95),
        p99: FormatadorAngola.formatarKwanza(p99),
        variação_95_99: FormatadorAngola.formatarKwanza(p99 - p95)
      },
      sinistralidade: {
        taxa: `${sinistralidade.toFixed(2)}%`,
        sinistros_grandes: sinistrosGrandes,
        total_sinistros: valores.length,
        limiar_grande_sinistro: FormatadorAngola.formatarKwanza(limiar)
      },
      reservas: {
        IBNR: FormatadorAngola.formatarKwanza(reservaIBNR),
        CAT: FormatadorAngola.formatarKwanza(reservaCAT),
        total_reservas: FormatadorAngola.formatarKwanza(reservaIBNR + reservaCAT),
        percentual_sinistros: `${((reservaIBNR / soma) * 100).toFixed(2)}%`
      },
      premios: {
        premio_puro: FormatadorAngola.formatarKwanza(soma * 1.2),
        premio_comercial: FormatadorAngola.formatarKwanza(soma * 1.35),
        margem_seguranca: '15%',
        comissao: '10-15%'
      }
    };
    
    // Salvar no histórico
    try {
      const atuarialEntry = new HistoricoUpload({
        nomeArquivo: 'analise_atuarial',
        nomeOriginal: `atuarial_${new Date().toISOString().slice(0, 10)}`,
        tipo: 'atuarial',
        dadosProcessados: {
          registros: valores.length,
          variaveis: 1,
          colunas: [colunaValor]
        },
        status: 'sucesso'
      });
      await atuarialEntry.save();
    } catch (e) {
      // Ignorar erro no histórico
    }
    
    res.json({
      success: true,
      tipo: 'atuarial',
      coluna_analisada: colunaValor,
      amostra_tamanho: valores.length,
      calculos: calculos,
      relatorio: 'Análise atuarial concluída com sucesso',
      recomendacoes: [
        'Considere aumentar reservas se sinistralidade > 70%',
        'Revise prêmios se margem de segurança < 10%',
        'Monitore sinistros acima do percentil 95',
        'Considere resseguro para exposições acima de Kz 10.000.000'
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro no processamento atuarial',
      message: error.message
    });
  }
});

module.exports = router;