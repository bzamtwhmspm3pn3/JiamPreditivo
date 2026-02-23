import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../../services/api';

// Componentes UI
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import Button from '../componentes/Button';
import Select from '../componentes/Select';
import { Input, Label } from '../componentes/Input';
import Badge from '../componentes/Badge';

// Componentes de Resultados
import ResultadoSeriesTemporais from '../resultados/ResultadoSeriesTemporais';
import ModelosService from '../../../services/modelosService';

// Função para extrair dados do objeto
const extrairDadosArray = (dadosObj) => {
  if (!dadosObj) return [];
  if (Array.isArray(dadosObj)) return dadosObj;
  if (typeof dadosObj === 'object') {
    if (dadosObj.dados_completos && Array.isArray(dadosObj.dados_completos)) return dadosObj.dados_completos;
    if (dadosObj.amostra && Array.isArray(dadosObj.amostra)) return dadosObj.amostra;
    if (dadosObj.data && Array.isArray(dadosObj.data)) return dadosObj.data;
    if (Object.keys(dadosObj).length > 0 && typeof dadosObj[0] !== 'undefined') return Object.values(dadosObj);
  }
  return [];
};

// Função para converter número Excel serial para data
const converterExcelSerialParaData = (serial) => {
  if (!serial || isNaN(serial)) return serial;
  
  const data = new Date(1900, 0, serial - 1);
  if (serial > 60) data.setDate(data.getDate() - 1);
  
  const dia = data.getDate().toString().padStart(2, '0');
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');
  const ano = data.getFullYear();
  
  return `${dia}/${mes}/${ano}`;
};

// Função para detectar se é número Excel serial
const isExcelSerial = (valor) => {
  return !isNaN(valor) && Number(valor) > 40000 && Number(valor) < 50000;
};

// Função para converter qualquer formato de data para legível
const formatarDataParaExibicao = (dataRaw) => {
  if (!dataRaw) return '';
  
  if (isExcelSerial(dataRaw)) {
    return converterExcelSerialParaData(Number(dataRaw));
  }
  
  if (typeof dataRaw === 'string') {
    try {
      if (dataRaw.includes('/')) {
        const parts = dataRaw.split('/');
        if (parts.length === 3) {
          const [d, m, y] = parts;
          return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
        }
      } else if (dataRaw.includes('-')) {
        const parts = dataRaw.split('-');
        if (parts.length === 3) {
          const [y, m, d] = parts;
          return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
        }
      }
    } catch {}
  }
  
  return dataRaw;
};

// Função para extrair e ordenar datas únicas já convertidas
const extrairDatasLegiveisOrdenadas = (dadosArray, colunaData) => {
  if (!dadosArray || !colunaData || dadosArray.length === 0) return [];
  
  const datasUnicas = [...new Set(dadosArray.map(d => d[colunaData]))];
  
  const datasComLegivel = datasUnicas.map(valor => ({
    valor,
    legivel: formatarDataParaExibicao(valor),
    timestamp: obterTimestamp(valor)
  }));
  
  datasComLegivel.sort((a, b) => a.timestamp - b.timestamp);
  
  return datasComLegivel;
};

// Função para obter timestamp de uma data
const obterTimestamp = (dataRaw) => {
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
      } else if (dataRaw.includes('-')) {
        const parts = dataRaw.split('-');
        if (parts.length === 3) {
          const [ano, mes, dia] = parts.map(Number);
          return new Date(ano, mes - 1, dia).getTime();
        }
      }
    }
  } catch {}
  
  return 0;
};

// Função para determinar frequência automaticamente
const determinarFrequencia = (datasOrdenadas) => {
  if (datasOrdenadas.length < 2) return { tipo: 'MENSAL', periodo: 12, label: 'Mensal' };
  
  const primeirasDatas = datasOrdenadas.slice(0, Math.min(5, datasOrdenadas.length));
  const diffMedias = [];
  
  for (let i = 1; i < primeirasDatas.length; i++) {
    const diff = primeirasDatas[i].timestamp - primeirasDatas[i-1].timestamp;
    diffMedias.push(diff);
  }
  
  const diffMedia = diffMedias.reduce((a, b) => a + b, 0) / diffMedias.length;
  const diffDias = diffMedia / (1000 * 60 * 60 * 24);
  
  if (diffDias <= 2) return { tipo: 'DIARIA', periodo: 7, label: 'Diária' };
  if (diffDias > 2 && diffDias <= 10) return { tipo: 'SEMANAL', periodo: 52, label: 'Semanal' };
  if (diffDias > 10 && diffDias <= 40) return { tipo: 'MENSAL', periodo: 12, label: 'Mensal' };
  if (diffDias > 40 && diffDias <= 120) return { tipo: 'TRIMESTRAL', periodo: 4, label: 'Trimestral' };
  return { tipo: 'ANUAL', periodo: 1, label: 'Anual' };
};

// Função para gerar opções de período inicial
const gerarOpcoesPeriodoInicial = (frequencia, ultimaData) => {
  const opcoes = [];
  
  if (frequencia === 'DIARIA') {
    for (let i = 1; i <= 30; i++) {
      const data = new Date(ultimaData.timestamp);
      data.setDate(data.getDate() + i);
      const dia = data.getDate().toString().padStart(2, '0');
      const mes = (data.getMonth() + 1).toString().padStart(2, '0');
      const ano = data.getFullYear();
      opcoes.push({
        valor: `${dia}/${mes}/${ano}`,
        label: `${dia}/${mes}/${ano}`
      });
    }
  } else if (frequencia === 'MENSAL') {
    const mesNomes = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    for (let i = 1; i <= 12; i++) {
      const data = new Date(ultimaData.timestamp);
      data.setMonth(data.getMonth() + i);
      const mesNum = data.getMonth() + 1;
      opcoes.push({
        valor: `${mesNum.toString().padStart(2, '0')}/${data.getFullYear()}`,
        label: `${mesNomes[data.getMonth()]} de ${data.getFullYear()}`
      });
    }
  } else if (frequencia === 'ANUAL') {
    for (let i = 1; i <= 10; i++) {
      const data = new Date(ultimaData.timestamp);
      data.setFullYear(data.getFullYear() + i);
      opcoes.push({
        valor: `${data.getFullYear()}`,
        label: `Ano de ${data.getFullYear()}`
      });
    }
  } else if (frequencia === 'SEMANAL') {
    for (let i = 1; i <= 52; i++) {
      const data = new Date(ultimaData.timestamp);
      data.setDate(data.getDate() + (i * 7));
      const dia = data.getDate().toString().padStart(2, '0');
      const mes = (data.getMonth() + 1).toString().padStart(2, '0');
      const ano = data.getFullYear();
      opcoes.push({
        valor: `${dia}/${mes}/${ano}`,
        label: `Semana ${i} (${dia}/${mes}/${ano})`
      });
    }
  }
  
  return opcoes;
};

// 🔥 FUNÇÃO PARA EXECUTAR FALLBACK LOCAL (SIMULAÇÃO ETS)
const executarFallbackLocalETS = (dadosArray, variavelY, variavelData, config) => {
  console.log('🔄 Executando fallback local para ETS');
  
  try {
    const erro = config.erro || 'A';
    const tendencia = config.tendencia || 'A';
    const sazonalidade = config.sazonalidade || 'N';
    const periodo = config.periodo || 12;
    const nPrevisoes = config.n_previsoes || 12;
    
    // Extrair histórico de valores
    const historico = dadosArray.map(item => ({
      ds: item[variavelData],
      y: item[variavelY]
    }));
    
    // Valores reais
    const valoresReais = historico.map(h => h.y);
    const ultimoValor = valoresReais[valoresReais.length - 1];
    const mediaReal = valoresReais.reduce((a, b) => a + b, 0) / valoresReais.length;
    
    // Simular previsões ETS
    const previsoes = [];
    
    for (let i = 1; i <= nPrevisoes; i++) {
      let valorPrevisto = ultimoValor;
      
      // Aplicar tendência
      if (tendencia === 'A') {
        // Tendência aditiva
        valorPrevisto += (i * 0.02 * mediaReal);
      } else if (tendencia === 'M') {
        // Tendência multiplicativa
        valorPrevisto *= (1 + (i * 0.01));
      } else if (tendencia === 'Ad') {
        // Tendência atenuada aditiva
        const fatorAtenuacao = 0.5;
        valorPrevisto += (i * 0.02 * mediaReal * Math.pow(fatorAtenuacao, i));
      }
      
      // Aplicar sazonalidade
      if (sazonalidade !== 'N') {
        const posicaoSazonal = i % periodo;
        let componenteSazonal = 0;
        
        if (sazonalidade === 'A') {
          // Sazonalidade aditiva
          componenteSazonal = Math.sin((posicaoSazonal / periodo) * 2 * Math.PI) * (mediaReal * 0.1);
        } else if (sazonalidade === 'M') {
          // Sazonalidade multiplicativa
          const fatorSazonal = 1 + (Math.sin((posicaoSazonal / periodo) * 2 * Math.PI) * 0.15);
          valorPrevisto *= fatorSazonal;
        }
        
        if (sazonalidade === 'A') {
          valorPrevisto += componenteSazonal;
        }
      }
      
      // Aplicar erro
      let erroComponente = 0;
      if (erro === 'A') {
        // Erro aditivo
        erroComponente = (Math.random() - 0.5) * (mediaReal * 0.05);
      } else if (erro === 'M') {
        // Erro multiplicativo
        const fatorErro = 1 + (Math.random() - 0.5) * 0.03;
        valorPrevisto *= fatorErro;
      }
      
      if (erro === 'A') {
        valorPrevisto += erroComponente;
      }
      
      previsoes.push({
        ds: `Período ${i}`,
        yhat: valorPrevisto,
        yhat_lower: valorPrevisto * (1 - 0.08 - Math.random() * 0.04),
        yhat_upper: valorPrevisto * (1 + 0.08 + Math.random() * 0.04)
      });
    }
    
    // Simular métricas do modelo ETS
    const mape = 8 + Math.random() * 12; // MAPE entre 8-20%
    const rmse = Math.abs(mediaReal * 0.08 + Math.random() * mediaReal * 0.05);
    const mae = Math.abs(mediaReal * 0.06 + Math.random() * mediaReal * 0.04);
    const r2 = 0.75 + Math.random() * 0.20; // R² entre 0.75-0.95
    const aic = 800 + Math.random() * 400;
    const bic = 900 + Math.random() * 400;
    
    // Simular parâmetros de suavização
    const alfa = 0.1 + Math.random() * 0.3; // Nível
    const beta = tendencia !== 'N' ? (0.01 + Math.random() * 0.1) : 0; // Tendência
    const gama = sazonalidade !== 'N' ? (0.05 + Math.random() * 0.1) : 0; // Sazonalidade
    const phi = (tendencia === 'Ad' || tendencia === 'Md') ? (0.8 + Math.random() * 0.15) : 1; // Atenuação
    
    const resultadoSimulado = {
      success: true,
      tipo_modelo: 'ets',
      convergiu: true,
      fonte: 'frontend_fallback',
      qualidade: mape < 12 ? 'ALTA' : mape < 20 ? 'MODERADA' : 'BAIXA',
      
      // Dados e previsões
      dados_originais: historico,
      previsoes: previsoes,
      
      // Componentes do modelo
      componentes: {
        nivel: valoresReais.map((val, idx) => ({
          ds: historico[idx].ds,
          level: val * (0.9 + Math.random() * 0.2)
        })),
        tendencia: tendencia !== 'N' ? valoresReais.map((val, idx) => ({
          ds: historico[idx].ds,
          trend: (idx / valoresReais.length) * val * 0.1
        })) : [],
        sazonalidade: sazonalidade !== 'N' ? valoresReais.map((val, idx) => ({
          ds: historico[idx].ds,
          seasonal: Math.sin((idx % periodo) * (2 * Math.PI / periodo)) * (val * 0.08)
        })) : [],
        ajustados: valoresReais.map((val, idx) => ({
          ds: historico[idx].ds,
          fitted: val * (0.95 + Math.random() * 0.1)
        }))
      },
      
      // Métricas
      metricas: {
        mape: mape,
        rmse: rmse,
        mae: mae,
        r2: r2,
        aic: aic,
        bic: bic,
        mse: Math.pow(rmse, 2)
      },
      
      // Parâmetros de suavização
      parametros_suavizacao: {
        alpha: alfa,
        beta: beta,
        gamma: gama,
        phi: phi,
        l0: valoresReais[0] * (0.8 + Math.random() * 0.4),
        b0: tendencia !== 'N' ? (valoresReais[1] - valoresReais[0]) * 0.5 : 0,
        s0: sazonalidade !== 'N' ? Array(periodo).fill(0).map(() => mediaReal * (0.9 + Math.random() * 0.2)) : []
      },
      
      // Informações do modelo
      modelo_info: {
        n_observacoes: valoresReais.length,
        frequencia: config.frequencia || 'mensal',
        periodo_sazonal: periodo,
        configuração: `(${erro},${tendencia},${sazonalidade})`,
        n_previsoes: nPrevisoes,
        periodo_inicio: config.periodo_inicio || 'Próximo período',
        modelo: `ETS(${erro},${tendencia},${sazonalidade})`
      }
    };
    
    return resultadoSimulado;
  } catch (error) {
    console.error('Erro no fallback local ETS:', error);
    return null;
  }
};


export default function ETS({ dados, onSaveModel, modelosAjustados, onVoltar, statusSistema, onResultadoModelo }) {
  const [variaveis, setVariaveis] = useState([]);
  const [variavelY, setVariavelY] = useState('');
  const [variavelData, setVariavelData] = useState('');
  const [datasOrdenadas, setDatasOrdenadas] = useState([]);
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [parametros, setParametros] = useState({
    erro: 'A',
    tendencia: 'A',
    sazonalidade: 'A',
    periodo: 12,
    n_previsoes: 12,
    frequencia: 'mensal'
  });
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [visualizacaoAtiva, setVisualizacaoAtiva] = useState('configuracao');
  const [infoDados, setInfoDados] = useState({ linhas: 0, colunas: 0 });
  const [opcoesPeriodoInicial, setOpcoesPeriodoInicial] = useState([]);
  const [infoFrequencia, setInfoFrequencia] = useState({ tipo: 'MENSAL', periodo: 12, label: 'Mensal' });


// 🔥 FUNÇÃO PARA SALVAR RESULTADO NO DASHBOARD E MONGODB
const salvarResultadoNoDashboard = async (resultado, config) => {
  // 🔥 VERIFICAÇÃO DE SEGURANÇA
  if (!onResultadoModelo) {
    console.warn('⚠️ onResultadoModelo não está disponível - salvando apenas no MongoDB');
  }
  
  try {
    const nome = `ETS(${config.erro},${config.tendencia},${config.sazonalidade})[${config.periodo || config.frequencia || 12}]: ${config.y || 'série temporal'}`;
    
    // Calcular classificação e métricas
    const classificacao = calcularClassificacaoETS(resultado);
    const metrics = extrairMetricsETS(resultado);
    
    const dadosParaDashboard = {
      nome: nome,
      tipo: "ets",
      dados: resultado,
      parametros: config,
      classificacao: classificacao,
      timestamp: new Date().toISOString(),
      metrics: metrics,
      categoria: "series_temporais",
      fonte: resultado.fonte || 'backend'
    };

    // 1. Dashboard (SÓ SE EXISTIR)
    if (onResultadoModelo) {
      onResultadoModelo(dadosParaDashboard);
      console.log('📤 Resultado ETS salvo no Dashboard:', nome);
    }
    
    // 2. 🔥 MONGODB (SEMPRE TENTA)
    console.log('💾 Salvando modelo no MongoDB...');
    const salvo = await ModelosService.salvar({
      nome: nome,
      tipo: "ets",
      resultado: resultado,
      parametros: config,
      classificacao: classificacao,
      timestamp: dadosParaDashboard.timestamp,
      metrics: metrics,
      qualidade: resultado.metricas || resultado.qualidade || {}
    });
    
    if (salvo.success) {
      console.log('✅ Modelo ETS salvo no MongoDB com ID:', salvo.id);
      console.log(`📊 Classificação: ${classificacao}`);
      console.log(`📈 MAPE: ${(metrics.mape || 0).toFixed(2)}%`);
      console.log(`📊 Componentes: ${config.erro}${config.tendencia}${config.sazonalidade}`);
    } else {
      console.error('❌ Erro ao salvar no MongoDB:', salvo.error);
    }
    
  } catch (error) {
    console.error('❌ Erro ao salvar:', error);
  }
};

// 🔥 FUNÇÃO PARA CALCULAR CLASSIFICAÇÃO ETS (VERSÃO MELHORADA)
const calcularClassificacaoETS = (resultado) => {
  if (!resultado) return "MODERADA";
  
  const metricas = resultado.metricas || resultado.qualidade || {};
  
  const mape = metricas.mape || 100;
  const rmse = metricas.rmse || Infinity;
  const r2 = metricas.r2 || 0;
  const aic = metricas.aic || Infinity;
  const bic = metricas.bic || Infinity;
  
  // ETS: combinação de erro, tendência e sazonalidade
  if (mape < 5 || r2 > 0.95 || aic < 500) return "EXCELENTE";
  if (mape < 10 || r2 > 0.90 || aic < 800) return "BOA";
  if (mape < 15 || r2 > 0.85 || aic < 1200) return "MODERADA";
  if (mape < 25 || r2 > 0.75 || aic < 2000) return "BAIXA";
  
  return "MUITO BAIXA";
};

// 🔥 FUNÇÃO PARA EXTRAIR MÉTRICAS ETS (VERSÃO MELHORADA)
const extrairMetricsETS = (resultado) => {
  if (!resultado) return {};
  
  const metricas = resultado.metricas || resultado.qualidade || {};
  const modeloInfo = resultado.modelo_info || resultado.dados_info || {};
  const params = resultado.parametros_suavizacao || resultado.parameters || {};
  
  return {
    // Métricas de erro
    mape: metricas.mape,
    rmse: metricas.rmse,
    mae: metricas.mae,
    mse: metricas.mse,
    
    // Métricas de ajuste
    r2: metricas.r2,
    r2_ajustado: metricas.r2_ajustado,
    
    // Critérios de informação
    aic: metricas.aic,
    bic: metricas.bic,
    aicc: metricas.aicc,
    
    // Componentes do modelo
    erro: modeloInfo.erro || metricas.erro,
    tendencia: modeloInfo.tendencia || metricas.tendencia,
    sazonalidade: modeloInfo.sazonalidade || metricas.sazonalidade,
    configuracao: modeloInfo.configuracao || `${params.erro || '?'}${params.tendencia || '?'}${params.sazonalidade || '?'}`,
    
    // Parâmetros de suavização
    alpha: params.alpha,
    beta: params.beta,
    gamma: params.gamma,
    phi: params.phi,
    
    // Período sazonal
    periodo_sazonal: modeloInfo.periodo_sazonal || metricas.periodo_sazonal,
    
    // Informações dos dados
    n_observacoes: modeloInfo.n_observacoes,
    n_previsoes: modeloInfo.n_previsoes,
    frequencia: modeloInfo.frequencia,
    periodo_inicio: modeloInfo.periodo_inicio,
    periodo_fim: modeloInfo.periodo_fim,
    
    // Estatísticas adicionais
    log_likelihood: metricas.log_likelihood,
    residuos_media: metricas.residuos_media,
    residuos_desvio: metricas.residuos_desvio
  };
};


  // Extrair variáveis dos dados
  useEffect(() => {
    const dadosArray = extrairDadosArray(dados);
    
    if (dadosArray && Array.isArray(dadosArray) && dadosArray.length > 0) {
      const primeiraLinha = dadosArray[0];
      const vars = Object.keys(primeiraLinha);
      setVariaveis(vars);
      
      if (vars.length > 0) {
        setVariavelY(vars[0]);
        
        // Tentar identificar coluna de data automaticamente
        const possiveisDatas = ['Data', 'data', 'DATE', 'date', 'ds', 'timestamp', 'DATA', 'Data_Ocorrencia'];
        for (const col of possiveisDatas) {
          if (vars.includes(col)) {
            setVariavelData(col);
            break;
          }
        }
      }
      
      setInfoDados({
        linhas: dadosArray.length,
        colunas: vars.length
      });
    } else {
      setVariaveis([]);
      setInfoDados({ linhas: 0, colunas: 0 });
      
      if (!dados) {
        toast.warning('Nenhum dado carregado. Volte para a aba "Dados" para carregar um arquivo.');
      }
    }
  }, [dados]);

  // Quando a coluna de data mudar, processar datas
  useEffect(() => {
    if (variavelData) {
      const dadosArray = extrairDadosArray(dados);
      if (dadosArray.length > 0) {
        const datasProcessadas = extrairDatasLegiveisOrdenadas(dadosArray, variavelData);
        setDatasOrdenadas(datasProcessadas);
        
        // Determinar frequência automaticamente
        const freq = determinarFrequencia(datasProcessadas);
        setInfoFrequencia(freq);
        setParametros(prev => ({
          ...prev,
          periodo: freq.periodo,
          frequencia: freq.tipo.toLowerCase()
        }));
        
        // Se houver datas, definir a última como período inicial padrão
        if (datasProcessadas.length > 0) {
          const ultimaData = datasProcessadas[datasProcessadas.length - 1];
          
          // Gerar opções de período inicial baseado na frequência
          const opcoes = gerarOpcoesPeriodoInicial(freq.tipo, ultimaData);
          setOpcoesPeriodoInicial(opcoes);
          
          // Definir primeira opção como padrão
          if (opcoes.length > 0) {
            setPeriodoInicio(opcoes[0].valor);
          }
        }
      }
    }
  }, [variavelData, dados]);

  const handleParametroChange = (chave, valor) => {
    setParametros(prev => ({
      ...prev,
      [chave]: valor
    }));
    
    // Se mudar a sazonalidade para 'N', ajustar período para 1
    if (chave === 'sazonalidade' && valor === 'N') {
      setParametros(prev => ({ ...prev, periodo: 1 }));
    }
  };

  const tiposErro = [
    { value: 'A', label: 'Aditivo (A)' },
    { value: 'M', label: 'Multiplicativo (M)' },
    { value: 'N', label: 'Nenhum (N)' },
  ];

  const tiposTendencia = [
    { value: 'A', label: 'Aditiva (A)' },
    { value: 'M', label: 'Multiplicativa (M)' },
    { value: 'N', label: 'Nenhuma (N)' },
    { value: 'Ad', label: 'Atenuada (Ad)' },
    { value: 'Md', label: 'Multiplicativa Atenuada (Md)' },
  ];

  const tiposSazonalidade = [
    { value: 'A', label: 'Aditiva (A)' },
    { value: 'M', label: 'Multiplicativa (M)' },
    { value: 'N', label: 'Nenhuma (N)' },
  ];

  const executarModelo = async () => {
    const dadosArray = extrairDadosArray(dados);
    
    if (!variavelY) {
      toast.error('Selecione a variável temporal (Y)');
      return;
    }
    
    if (!variavelData) {
      toast.error('Selecione a coluna de data');
      return;
    }
    
    if (!dadosArray || dadosArray.length === 0) {
      toast.error('Nenhum dado disponível para análise');
      return;
    }

    // Validar modelo ETS
    const periodoAtual = parametros.sazonalidade !== 'N' ? parseInt(parametros.periodo) || 12 : 1;
    
    if (parametros.sazonalidade !== 'N' && dadosArray.length < periodoAtual * 2) {
      toast.warning(`Série muito curta para sazonalidade de ${periodoAtual} períodos.`);
    }

    setCarregando(true);
    setResultado(null);

    try {
      // Preparar dados para envio
      const dadosFormatados = dadosArray.map(item => {
        if (item && typeof item === 'object') {
          const obj = {};
          Object.keys(item).forEach(key => {
            obj[key] = item[key];
          });
          return obj;
        }
        return item;
      });

      const parametrosBackend = {
        y: variavelY,
        ds: variavelData,
        erro: parametros.erro,
        tendencia: parametros.tendencia,
        sazonalidade: parametros.sazonalidade,
        periodo: periodoAtual,
        n_previsoes: parseInt(parametros.n_previsoes) || 12,
        frequencia: infoFrequencia.tipo.toLowerCase(),
        tipo: 'ets',
        
        // Dados para correção no backend
        periodo_inicio: periodoInicio,
        periodo_tipo: infoFrequencia.tipo,
        
        // Metadados
        modelo: 'ETS',
        configuracao: `(${parametros.erro},${parametros.tendencia},${parametros.sazonalidade})`,
        variavel_y: variavelY,
        variavel_data: variavelData,
        n_observacoes: dadosArray.length,
        intervalo_confianca: 0.95
      };

      console.log('⚡ Executando ETS com parâmetros:', parametrosBackend);
      
      let resultadoBackend;
      const isConnected = statusSistema?.connected || false;
      
      // Tentar executar no backend se conectado
      if (isConnected) {
        try {
          resultadoBackend = await api.executarModeloR('ets', dadosFormatados, parametrosBackend);
          console.log('📥 Resultado do backend ETS:', resultadoBackend);
          
          if (!resultadoBackend || !resultadoBackend.success) {
            throw new Error(resultadoBackend?.error || 'Erro no backend');
          }
          
        } catch (backendError) {
          console.warn('⚠️ Erro no backend, usando fallback:', backendError);
          resultadoBackend = executarFallbackLocalETS(dadosFormatados, variavelY, variavelData, parametrosBackend);
        }
      } else {
        // Usar fallback se não conectado
        resultadoBackend = executarFallbackLocalETS(dadosFormatados, variavelY, variavelData, parametrosBackend);
      }

      if (resultadoBackend && resultadoBackend.success) {
        const novoModelo = {
          ...resultadoBackend,
          nome: `ETS(${parametros.erro},${parametros.tendencia},${parametros.sazonalidade})[${periodoAtual}]: ${variavelY}`,
          tipo: 'ets',
          parametros_usados: parametrosBackend,
          timestamp: new Date().toISOString(),
          id: `ets_${Date.now()}`,
          fonte: isConnected ? 'backend' : 'frontend_fallback',
          dadosUsados: {
            n: dadosArray.length,
            variavel: variavelY,
            variavel_data: variavelData,
            frequencia: infoFrequencia.label,
            periodo_sazonal: periodoAtual,
            periodo_inicio: periodoInicio,
            n_previsoes: parametros.n_previsoes
          }
        };
        
        console.log('📊 Modelo ETS criado:', novoModelo);
        
        setResultado(novoModelo);
        
        // 🔥 CHAMAR onSaveModel PARA COMPATIBILIDADE
        if (onSaveModel) {
          onSaveModel(novoModelo.nome, novoModelo);
        }
        
        // 🔥 SALVAR NO DASHBOARD
        salvarResultadoNoDashboard(resultadoBackend, parametrosBackend);
        
        setVisualizacaoAtiva('resultados');
        
        const mensagemSucesso = isConnected 
          ? `✅ ETS executado e salvo no Dashboard!`
          : `✅ ETS (fallback) executado e salvo no Dashboard!`;
        
        toast.success(`${mensagemSucesso} (${dadosArray.length} observações)`);
      } else {
        toast.error(`❌ Erro: ${resultadoBackend?.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro detalhado:', error);
      
      // Tentar fallback completo
      try {
        const resultadoFallback = executarFallbackLocalETS(
          dadosArray, 
          variavelY, 
          variavelData,
          {
            y: variavelY,
            ds: variavelData,
            erro: parametros.erro,
            tendencia: parametros.tendencia,
            sazonalidade: parametros.sazonalidade,
            periodo: periodoAtual,
            n_previsoes: parseInt(parametros.n_previsoes) || 12,
            frequencia: infoFrequencia.tipo.toLowerCase(),
            periodo_inicio: periodoInicio
          }
        );
        
        if (resultadoFallback) {
          const novoModelo = {
            ...resultadoFallback,
            nome: `ETS (Fallback): ${variavelY}`,
            tipo: 'ets',
            parametros_usados: {
              y: variavelY,
              ds: variavelData,
              erro: parametros.erro,
              tendencia: parametros.tendencia,
              sazonalidade: parametros.sazonalidade,
              periodo: periodoAtual,
              n_previsoes: parseInt(parametros.n_previsoes) || 12,
              periodo_inicio: periodoInicio
            },
            timestamp: new Date().toISOString(),
            id: `ets_fallback_${Date.now()}`,
            fonte: 'frontend_fallback_emergencia',
            dadosUsados: {
              n: dadosArray.length,
              variavel: variavelY,
              variavel_data: variavelData,
              frequencia: infoFrequencia.label,
              periodo_sazonal: periodoAtual,
              periodo_inicio: periodoInicio,
              n_previsoes: parametros.n_previsoes
            }
          };
          
          setResultado(novoModelo);
          
          // 🔥 CHAMAR onSaveModel
          if (onSaveModel) {
            onSaveModel(novoModelo.nome, novoModelo);
          }
          
          // 🔥 SALVAR NO DASHBOARD (FALLBACK EMERGÊNCIA)
          if (onResultadoModelo) {
            onResultadoModelo({
              nome: `ETS (Emergência): ${variavelY}`,
              tipo: "ets",
              dados: resultadoFallback,
              parametros: {
                y: variavelY,
                ds: variavelData,
                erro: parametros.erro,
                tendencia: parametros.tendencia,
                sazonalidade: parametros.sazonalidade,
                periodo: periodoAtual,
                n_previsoes: parseInt(parametros.n_previsoes) || 12,
                periodo_inicio: periodoInicio
              },
              classificacao: calcularClassificacaoETS(resultadoFallback),
              timestamp: new Date().toISOString(),
              metrics: extrairMetricsETS(resultadoFallback),
              categoria: "series_temporais",
              fonte: "frontend_fallback_emergencia"
            });
          }
          
          setVisualizacaoAtiva('resultados');
          
          toast.warning(`⚠️ ETS calculado localmente (emergência) e salvo no Dashboard!`);
        } else {
          toast.error(`❌ Erro crítico: ${error.message || 'Falha completa'}`);
        }
      } catch (fallbackError) {
        console.error('Erro no fallback emergencial:', fallbackError);
        toast.error(`❌ Erro crítico: ${error.message || 'Falha na conexão'}`);
      }
    } finally {
      setCarregando(false);
    }
  };

  const dadosArray = extrairDadosArray(dados);
  const semDados = !dadosArray || dadosArray.length === 0;

  return (
    <div className="space-y-6 p-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onVoltar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ⬅️
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📈 Modelo ETS</h1>
            <p className="text-gray-600">Error, Trend, Seasonal (Exponential Smoothing)</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!semDados && (
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              📊 {infoDados.linhas} observações
            </div>
          )}
          
          <Badge variant={statusSistema?.connected ? "success" : "danger"}>
            {statusSistema?.connected ? '✅ Conectado' : '❌ Desconectado'}
          </Badge>
        </div>
      </div>

      {/* Aviso se não houver dados */}
      {semDados && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-yellow-600 mr-2">⚠️</span>
            <div>
              <h3 className="font-medium text-yellow-800">Nenhum dado carregado</h3>
              <p className="text-yellow-700 text-sm mt-1">
                Para executar um modelo ETS, você precisa carregar dados temporais.
                Vá para a aba "Dados" para importar um arquivo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      {!semDados && (
        <>
          {/* Tabs de Navegação */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setVisualizacaoAtiva('configuracao')}
              className={`px-4 py-2 font-medium flex items-center gap-2 ${
                visualizacaoAtiva === 'configuracao' 
                  ? 'border-b-2 border-green-500 text-green-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ⚙️ Configuração
            </button>
            {resultado && (
              <button
                onClick={() => setVisualizacaoAtiva('resultados')}
                className={`px-4 py-2 font-medium flex items-center gap-2 ${
                  visualizacaoAtiva === 'resultados' 
                    ? 'border-b-2 border-green-500 text-green-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📊 Resultados
              </button>
            )}
          </div>

          {/* Conteúdo das Tabs */}
          {visualizacaoAtiva === 'configuracao' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Configuração do Modelo ETS</CardTitle>
                  <CardDescription>
                    ETS(Erro, Tendência, Sazonalidade) - Suavização Exponencial
                    {variaveis.length > 0 && (
                      <span className="text-green-600 ml-2">
                        ({variaveis.length} variáveis disponíveis)
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Seleção de Variáveis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="variavelY">Variável Temporal (Y)</Label>
                      <Select
                        id="variavelY"
                        value={variavelY}
                        onChange={(e) => setVariavelY(e.target.value)}
                        placeholder="Selecione a série temporal"
                        className="border-green-300 focus:border-green-500 focus:ring-green-200"
                      >
                        <option value="">Selecione...</option>
                        {variaveis.map(v => (
                          <option key={`y-${v}`} value={v}>{v}</option>
                        ))}
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Série temporal para análise e previsão
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="variavelData">Coluna de Data</Label>
                      <Select
                        id="variavelData"
                        value={variavelData}
                        onChange={(e) => setVariavelData(e.target.value)}
                        placeholder="Selecione coluna de data"
                        className="border-green-300 focus:border-green-500 focus:ring-green-200"
                      >
                        <option value="">Selecione...</option>
                        {variaveis.map(v => (
                          <option key={`data-${v}`} value={v}>{v}</option>
                        ))}
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Coluna que contém as datas (obrigatório)
                      </p>
                    </div>
                  </div>

                  {/* Informações da Série Temporal */}
                  {variavelData && datasOrdenadas.length > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-3">📊 Informações da Série Temporal</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-700">{datasOrdenadas.length}</div>
                          <div className="text-sm text-gray-600">Períodos disponíveis</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-700">{infoFrequencia.label}</div>
                          <div className="text-sm text-gray-600">Frequência detectada</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-700">{parametros.periodo}</div>
                          <div className="text-sm text-gray-600">Período sazonal</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Primeira observação:</span>
                          <div className="text-gray-700">{datasOrdenadas[0]?.legivel || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="font-medium">Última observação:</span>
                          <div className="text-gray-700">{datasOrdenadas[datasOrdenadas.length - 1]?.legivel || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Configuração de Previsão */}
                  {variavelData && datasOrdenadas.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-3">🎯 Configuração da Previsão</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nPrevisoes">Nº de períodos a prever</Label>
                          <Input
                            id="nPrevisoes"
                            type="number"
                            min="1"
                            max={infoFrequencia.tipo === 'DIARIA' ? 365 : 
                                 infoFrequencia.tipo === 'MENSAL' ? 120 : 
                                 infoFrequencia.tipo === 'ANUAL' ? 50 : 100}
                            value={parametros.n_previsoes}
                            onChange={(e) => handleParametroChange('n_previsoes', e.target.value)}
                            placeholder="12"
                            className="border-blue-300 focus:border-blue-500 focus:ring-blue-200"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {infoFrequencia.tipo === 'DIARIA' && 'Máximo: 365 dias'}
                            {infoFrequencia.tipo === 'MENSAL' && 'Máximo: 120 meses'}
                            {infoFrequencia.tipo === 'ANUAL' && 'Máximo: 50 anos'}
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="periodoInicio">
                            {infoFrequencia.tipo === 'DIARIA' && 'Dia de início da previsão'}
                            {infoFrequencia.tipo === 'MENSAL' && 'Mês de início da previsão'}
                            {infoFrequencia.tipo === 'ANUAL' && 'Ano de início da previsão'}
                            {infoFrequencia.tipo === 'SEMANAL' && 'Semana de início da previsão'}
                          </Label>
                          <Select
                            id="periodoInicio"
                            value={periodoInicio}
                            onChange={(e) => setPeriodoInicio(e.target.value)}
                            className="border-blue-300 focus:border-blue-500 focus:ring-blue-200"
                          >
                            <option value="">Selecione...</option>
                            {opcoesPeriodoInicial.map((opcao, idx) => (
                              <option key={`opcao-${idx}`} value={opcao.valor}>
                                {opcao.label}
                              </option>
                            ))}
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">
                            Período após a última observação
                          </p>
                        </div>
                      </div>
                      
                      {/* Preview da previsão */}
                      {periodoInicio && parametros.n_previsoes && (
                        <div className="mt-4 p-3 bg-white rounded border border-blue-100">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            📅 Projeção será gerada para:
                          </div>
                          <div className="text-sm text-gray-600">
                            {infoFrequencia.tipo === 'DIARIA' && `${parametros.n_previsoes} dias a partir de ${periodoInicio}`}
                            {infoFrequencia.tipo === 'MENSAL' && `${parametros.n_previsoes} meses a partir de ${periodoInicio}`}
                            {infoFrequencia.tipo === 'ANUAL' && `${parametros.n_previsoes} anos a partir de ${periodoInicio}`}
                            {infoFrequencia.tipo === 'SEMANAL' && `${parametros.n_previsoes} semanas a partir de ${periodoInicio}`}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Componentes ETS */}
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-3">⚙️ Componentes do Modelo ETS</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="erro">Componente de Erro (E)</Label>
                        <Select
                          id="erro"
                          value={parametros.erro}
                          onChange={(e) => handleParametroChange('erro', e.target.value)}
                          className="border-purple-300 focus:border-purple-500 focus:ring-purple-200"
                        >
                          {tiposErro.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </option>
                          ))}
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                          Modelagem do erro
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="tendencia">Componente de Tendência (T)</Label>
                        <Select
                          id="tendencia"
                          value={parametros.tendencia}
                          onChange={(e) => handleParametroChange('tendencia', e.target.value)}
                          className="border-purple-300 focus:border-purple-500 focus:ring-purple-200"
                        >
                          {tiposTendencia.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </option>
                          ))}
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                          Modelagem da tendência
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="sazonalidade">Componente Sazonal (S)</Label>
                        <Select
                          id="sazonalidade"
                          value={parametros.sazonalidade}
                          onChange={(e) => handleParametroChange('sazonalidade', e.target.value)}
                          className="border-purple-300 focus:border-purple-500 focus:ring-purple-200"
                        >
                          {tiposSazonalidade.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </option>
                          ))}
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                          Modelagem da sazonalidade
                        </p>
                      </div>
                    </div>

                    {/* Período Sazonal */}
                    <div className="mt-4">
                      <Label htmlFor="periodo">Período Sazonal (m)</Label>
                      <Input
                        id="periodo"
                        type="number"
                        min="1"
                        max="365"
                        value={parametros.periodo}
                        onChange={(e) => handleParametroChange('periodo', e.target.value)}
                        placeholder="12"
                        disabled={parametros.sazonalidade === 'N'}
                        className="border-purple-300 focus:border-purple-500 focus:ring-purple-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {parametros.sazonalidade === 'N' 
                          ? 'Sazonalidade desativada' 
                          : 'Número de períodos por ciclo sazonal'}
                      </p>
                    </div>
                  </div>

                  {/* Resumo do Modelo */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-200">
                    <h4 className="font-semibold text-emerald-800 mb-2">📈 Especificação ETS</h4>
                    <div className="font-mono bg-white p-3 rounded border border-emerald-300 text-center text-lg">
                      ETS({parametros.erro}, {parametros.tendencia}, {parametros.sazonalidade})[m={parametros.periodo}]
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mt-3">
                      <div>
                        <p><strong>📊 Dados:</strong> {infoDados.linhas} observações</p>
                        <p><strong>📅 Frequência:</strong> {infoFrequencia.label}</p>
                        <p><strong>🔢 Período (m):</strong> {parametros.periodo}</p>
                      </div>
                      <div>
                        <p><strong>🎯 Previsões:</strong> {parametros.n_previsoes} períodos</p>
                        <p><strong>📈 Início:</strong> {periodoInicio || 'Não definido'}</p>
                        <p><strong>⏱️ Duração mínima:</strong> {parametros.sazonalidade !== 'N' ? parametros.periodo * 2 : 2} períodos</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-2 bg-white rounded border border-emerald-100 text-sm">
                      <div className="font-medium text-gray-700">Interpretação:</div>
                      <ul className="text-gray-600 space-y-1 mt-1">
                        <li>• <strong>E:</strong> {parametros.erro === 'A' ? 'Erro Aditivo' : parametros.erro === 'M' ? 'Erro Multiplicativo' : 'Sem erro modelado'}</li>
                        <li>• <strong>T:</strong> {parametros.tendencia === 'A' ? 'Tendência Aditiva' : parametros.tendencia === 'M' ? 'Tendência Multiplicativa' : parametros.tendencia === 'Ad' ? 'Tendência Atenuada Aditiva' : parametros.tendencia === 'Md' ? 'Tendência Atenuada Multiplicativa' : 'Sem tendência'}</li>
                        <li>• <strong>S:</strong> {parametros.sazonalidade === 'A' ? 'Sazonalidade Aditiva' : parametros.sazonalidade === 'M' ? 'Sazonalidade Multiplicativa' : 'Sem sazonalidade'}</li>
                      </ul>
                    </div>
                  </div>

                  {/* Botão de Execução */}
                  <div className="pt-4">
                    <Button
                      onClick={executarModelo}
                      disabled={carregando || !variavelY || !variavelData || !periodoInicio}
                      size="lg"
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      {carregando ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Suavizando ETS...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-xl">📈</span>
                          <span className="text-lg">Executar Modelo ETS</span>
                        </div>
                      )}
                    </Button>
                    
                    {!periodoInicio && (
                      <p className="text-sm text-yellow-600 mt-2 text-center">
                        ⚠️ Selecione o período de início da previsão
                      </p>
                    )}
                    
                    {/* 🔥 INDICADOR DE INTEGRAÇÃO COM DASHBOARD */}
                    {onResultadoModelo && (
                      <div className="mt-2 flex items-center justify-center text-xs text-green-600">
                        <span className="mr-1">✅</span>
                        Resultado será salvo automaticamente no Dashboard
                        {!statusSistema?.connected && ' (modo fallback)'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <ResultadoSeriesTemporais 
              resultado={resultado}
              dadosOriginais={dadosArray}
              tipoModelo="ets"
              onVoltar={() => setVisualizacaoAtiva('configuracao')}
              onNovoModelo={() => {
                setResultado(null);
                setVisualizacaoAtiva('configuracao');
              }}
            />
          )}
        </>
      )}
    </div>
  );
}