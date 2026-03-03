import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import { formatarDataCompleta, formatarDataGrafico, corrigirSeculoData } from '../../../utils/dateUtils';
import Button from '../componentes/Button';
import Badge from '../componentes/Badge';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  Colors,
  ArcElement,
  RadialLinearScale
} from 'chart.js';
import { Bar, Line, Scatter } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  Colors,
  ArcElement,
  RadialLinearScale
);

// Componente de gráficos unificado para Séries Temporais
const GraficosSeriesTemporais = ({ dados, tipoModelo }) => {
  const [graficoAtivo, setGraficoAtivo] = useState('previsoes');
  const [dadosProcessados, setDadosProcessados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const chartRef = useRef(null);

  // Função para determinar as cores baseadas no tipo de modelo
  const getCoresModelo = () => {
    const cores = {
      arima: {
        primaria: 'rgb(59, 130, 246)',       // Azul
        secundaria: 'rgb(239, 68, 68)',      // Vermelho
        terciaria: 'rgb(245, 158, 11)',      // Laranja
        gradient: 'from-blue-500 to-blue-600'
      },
      sarima: {
        primaria: 'rgb(139, 92, 246)',       // Roxo
        secundaria: 'rgb(59, 130, 246)',     // Azul
        terciaria: 'rgb(168, 85, 247)',      // Lilás
        gradient: 'from-purple-500 to-indigo-600'
      },
      ets: {
        primaria: 'rgb(34, 197, 94)',        // Verde
        secundaria: 'rgb(245, 158, 11)',     // Laranja
        terciaria: 'rgb(59, 130, 246)',      // Azul
        gradient: 'from-green-500 to-emerald-600'
      },
      prophet: {
        primaria: 'rgb(236, 72, 153)',       // Rosa
        secundaria: 'rgb(139, 92, 246)',     // Roxo
        terciaria: 'rgb(245, 158, 11)',      // Laranja
        gradient: 'from-pink-500 to-purple-600'
      }
    };
    
    return cores[tipoModelo] || cores.arima;
  };

  useEffect(() => {
    console.log(`📊 GraficosSeriesTemporais (${tipoModelo}) recebeu dados:`, dados);
    
    if (!dados) {
      console.log('⚠️  GraficosSeriesTemporais: Dados vazios');
      setDadosProcessados(null);
      setCarregando(false);
      return;
    }

    try {
      const { 
        previsoes = [], 
        historico = [], 
        ajustados = [],
        residuos = [], 
        metricas = {},
        interpretacao = {},
        modelo_info = {},
        coeficientes = [],
        dados_originais = {},
        periodo_previsao = {}
      } = dados;
      
      console.log('📊 Dados brutos recebidos:', {
        previsoes: previsoes?.length,
        historico: historico?.length,
        ajustados: ajustados?.length,
        residuos: residuos?.length,
        metricas
      });

      // Processar dados históricos
      let dadosHistoricos = [];
      if (historico && Array.isArray(historico)) {
        dadosHistoricos = historico
          .filter(item => item && (item.data || item.Data || item.ds))
          .map(item => ({
            data: item.data || item.Data || item.ds,
            valor: parseFloat(item.valor || item.value || item.y || 0) || 0,
            tipo: 'historico'
          }));
      }

      // Processar dados ajustados
      let dadosAjustados = [];
      if (ajustados && Array.isArray(ajustados)) {
        dadosAjustados = ajustados
          .filter(item => item && (item.data || item.Data || item.ds))
          .map(item => ({
            data: item.data || item.Data || item.ds,
            valor: parseFloat(item.valor || item.ajustado || item.fitted || 0) || 0,
            tipo: 'ajustado'
          }));
      }

      // Processar previsões
      let dadosPrevisoes = [];
      if (previsoes && Array.isArray(previsoes)) {
        dadosPrevisoes = previsoes
          .filter(item => item && (item.data || item.Data || item.ds))
          .map(item => ({
            data: item.data || item.Data || item.ds,
            previsao: parseFloat(item.previsao || item.value || item.fitted || 0) || 0,
            inferior: parseFloat(item.inferior || item.lower_95 || item.lower || 0) || 0,
            superior: parseFloat(item.superior || item.upper_95 || item.upper || 0) || 0,
            tipo: 'previsao'
          }));
      }

      // Processar resíduos
      let residuosProcessados = [];
      if (residuos && Array.isArray(residuos)) {
        residuosProcessados = residuos
          .filter(r => r !== null && r !== undefined)
          .map((r, i) => ({
            periodo: i + 1,
            residuo: parseFloat(r) || 0
          }));
      }

      // Processar métricas
      const metricasProcessadas = {
        ajuste: metricas?.ajuste || {},
        precisao: metricas?.precisao || {},
        diagnostico: metricas?.diagnostico || {}
      };

      // Processar coeficientes
      let coeficientesProcessados = [];
      if (coeficientes && Array.isArray(coeficientes)) {
        coeficientesProcessados = coeficientes
          .filter(coef => coef && (coef.termo || coef.parameter))
          .map(coef => ({
            termo: coef.termo || coef.parameter || `coef${coeficientesProcessados.length + 1}`,
            estimativa: parseFloat(coef.estimativa || coef.estimate || coef.coef || 0) || 0,
            p_valor: coef.p_valor || coef.pvalue || coef.p_value,
            erro_padrao: coef.erro_padrao || coef.std_error || coef.se
          }));
      }

      const processado = {
        dadosHistoricos,
        dadosAjustados,
        dadosPrevisoes,
        residuos: residuosProcessados,
        metricas: metricasProcessadas,
        coeficientes: coeficientesProcessados,
        interpretacao,
        modelo_info,
        dados_originais,
        periodo_previsao,
        tipoModelo,
        nomeSerie: interpretacao?.variavel || dados.nome || 'Série Temporal',
        ordemModelo: modelo_info?.ordem_arima || modelo_info?.ordem || 'N/A'
      };

      console.log('📊 Dados processados:', processado);
      setDadosProcessados(processado);
    } catch (error) {
      console.error('❌ Erro ao processar dados para gráficos:', error);
      setDadosProcessados(null);
    } finally {
      setCarregando(false);
    }
  }, [dados, tipoModelo]);

  // Função para formatar datas para exibição

const formatarDataGrafico = (dataStr) => {
  if (!dataStr) return 'N/D';
  
  try {
    // Se for número (Excel serial ou timestamp)
    if (typeof dataStr === 'number') {
      // Se for Excel serial (44947)
      if (dataStr > 40000 && dataStr < 50000) {
        const data = new Date(1900, 0, dataStr - 1);
        if (dataStr > 60) data.setDate(data.getDate() - 1);
        
        const mes = data.getMonth() + 1;
        const ano = data.getFullYear();
        const mesesAbr = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dec'];
        return `${mesesAbr[mes - 1]}/${ano.toString().slice(2)}`;
      }
      
      // Se for timestamp
      const data = new Date(dataStr);
      if (!isNaN(data.getTime())) {
        const mesesAbr = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dec'];
        return `${mesesAbr[data.getMonth()]}/${data.getFullYear().toString().slice(2)}`;
      }
    }
    
    // Se for string
    if (typeof dataStr === 'string') {
      const str = dataStr.trim().toLowerCase();
      
      // Formato: YYYY-MM-DD
      if (str.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
        const [anoStr, mesStr] = str.split('-');
        let ano = parseInt(anoStr);
        const mes = parseInt(mesStr);
        
        // Corrigir século se necessário
        if (ano > 2050) ano = 1900 + (ano % 100);
        
        const mesesAbr = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dec'];
        if (mes >= 1 && mes <= 12) {
          return `${mesesAbr[mes - 1]}/${ano.toString().slice(2)}`;
        }
      }
      
      // Formato: DD/MM/YYYY
      if (str.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const [diaStr, mesStr, anoStr] = str.split('/');
        let ano = parseInt(anoStr);
        const mes = parseInt(mesStr);
        
        if (ano > 2050) ano = 1900 + (ano % 100);
        
        const mesesAbr = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dec'];
        if (mes >= 1 && mes <= 12) {
          return `${mesesAbr[mes - 1]}/${ano.toString().slice(2)}`;
        }
      }
      
      // Formato: MM/YYYY
      if (str.match(/^\d{1,2}\/\d{4}$/)) {
        const [mesStr, anoStr] = str.split('/');
        let ano = parseInt(anoStr);
        const mes = parseInt(mesStr);
        
        if (ano > 2050) ano = 1900 + (ano % 100);
        
        const mesesAbr = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dec'];
        if (mes >= 1 && mes <= 12) {
          return `${mesesAbr[mes - 1]}/${ano.toString().slice(2)}`;
        }
      }
      
      // Formato abreviado: mmm/YY (ex: nov/25)
      const matchAbr = str.match(/^([a-z]{3})\/(\d{2,4})$/);
      if (matchAbr) {
        const [, mesAbr, anoStr] = matchAbr;
        const mesesAbr = {
          'jan': 'Jan', 'fev': 'Fev', 'mar': 'Mar', 'abr': 'Abr', 'mai': 'Mai', 'jun': 'Jun',
          'jul': 'Jul', 'ago': 'Ago', 'set': 'Set', 'out': 'Out', 'nov': 'Nov', 'dez': 'Dec'
        };
        const mesFormatado = mesesAbr[mesAbr.toLowerCase()];
        if (mesFormatado) {
          let ano = parseInt(anoStr);
          if (ano < 100) {
            ano = ano >= 95 ? 1900 + ano : 2000 + ano;
          } else if (ano > 2050) {
            ano = 1900 + (ano % 100);
          }
          return `${mesFormatado}/${ano.toString().slice(2)}`;
        }
      }
      
      // Tentar converter para Date
      const data = new Date(str);
      if (!isNaN(data.getTime())) {
        const mesesAbr = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dec'];
        return `${mesesAbr[data.getMonth()]}/${data.getFullYear().toString().slice(2)}`;
      }
    }
  } catch (error) {
    console.warn('Erro ao formatar data:', error, dataStr);
  }
  
  // Fallback: retornar string original truncada
  return String(dataStr).substring(0, 10);
};
  // Função para ordenar dados por data (segura)
  const ordenarPorData = (dadosArray) => {
    if (!dadosArray || !Array.isArray(dadosArray)) return [];
    
    return [...dadosArray].sort((a, b) => {
      const dataA = a.data;
      const dataB = b.data;
      
      if (!dataA && !dataB) return 0;
      if (!dataA) return 1;
      if (!dataB) return -1;
      
      try {
        const dateA = new Date(dataA);
        const dateB = new Date(dataB);
        
        if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
          return dateA.getTime() - dateB.getTime();
        }
        
        return String(dataA).localeCompare(String(dataB));
      } catch {
        return String(dataA).localeCompare(String(dataB));
      }
    });
  };

  // 1. Gráfico de Previsões vs Histórico
 const dadosPrevisoesHistorico = () => {
  console.log('📊 Gerando gráfico Previsões vs Histórico:', dadosProcessados);
  
  if (!dadosProcessados || (!dadosProcessados.dadosHistoricos?.length && !dadosProcessados.dadosPrevisoes?.length)) {
    console.log('❌ Sem dados suficientes para gráfico de previsões');
    return null;
  }

  const { dadosHistoricos, dadosPrevisoes, dadosAjustados, nomeSerie } = dadosProcessados;
  const cores = getCoresModelo();

  // Função auxiliar para formatar números
  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined || isNaN(num)) return 'N/A';
    if (typeof num !== 'number') {
      const parsed = parseFloat(num);
      if (isNaN(parsed)) return 'N/A';
      num = parsed;
    }
    if (Math.abs(num) < 0.0001) return num.toExponential(decimals);
    return Number(num).toFixed(decimals);
  };
  
  // TRATAR DATAS CORRETAMENTE - CONVERTER TODOS PARA TIMESTAMP
  const converterDataParaTimestamp = (dataStr) => {
    if (!dataStr) return null;
    
    try {
      // Se já for timestamp
      if (typeof dataStr === 'number') return dataStr;
      
      // Formato YYYY-MM-DD
      if (dataStr.includes('-')) {
        const parts = dataStr.split('-');
        if (parts.length >= 2) {
          const ano = parseInt(parts[0]);
          const mes = parseInt(parts[1]) - 1;
          const dia = parts.length > 2 ? parseInt(parts[2]) : 1;
          
          // Corrigir século se necessário (para datas como 2095 -> 1995)
          const anoCorrigido = ano > 2050 ? 1900 + (ano % 100) : ano;
          return new Date(anoCorrigido, mes, dia).getTime();
        }
      }
      
      // Formato DD/MM/YYYY
      if (dataStr.includes('/')) {
        const parts = dataStr.split('/');
        if (parts.length === 3) {
          const dia = parseInt(parts[0]);
          const mes = parseInt(parts[1]) - 1;
          let ano = parseInt(parts[2]);
          
          // Corrigir século
          ano = ano > 2050 ? 1900 + (ano % 100) : ano;
          return new Date(ano, mes, dia).getTime();
        }
        if (parts.length === 2) {
          const mes = parseInt(parts[0]) - 1;
          let ano = parseInt(parts[1]);
          
          // Corrigir século
          ano = ano > 2050 ? 1900 + (ano % 100) : ano;
          return new Date(ano, mes, 1).getTime();
        }
      }
      
      // Formato mês/ano abreviado (ex: "nov/95")
      const match = dataStr.match(/([a-z]+)\/(\d{2,4})/i);
      if (match) {
        const meses = {
          'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
          'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
        };
        
        const mesStr = match[1].toLowerCase().substring(0, 3);
        const mes = meses[mesStr];
        let ano = parseInt(match[2]);
        
        if (ano < 100) {
          // Corrigir século: 95 -> 1995, 25 -> 2025
          ano = ano >= 95 ? 1900 + ano : 2000 + ano;
        }
        
        return new Date(ano, mes, 1).getTime();
      }
      
      // Tentar parse direto
      const data = new Date(dataStr);
      if (!isNaN(data.getTime())) return data.getTime();
      
    } catch (error) {
      console.warn('Erro ao converter data:', error, dataStr);
    }
    
    return null;
  };

  // FUNÇÃO PARA ORDENAR E FORMATAR DATAS
  const processarConjuntoDados = (dadosArray, tipo) => {
    if (!dadosArray || !Array.isArray(dadosArray) || dadosArray.length === 0) {
      return { dados: [], labels: [] };
    }
    
    // Converter e adicionar timestamp
    const dadosComTimestamp = dadosArray
      .filter(item => item && item.data)
      .map(item => {
        const timestamp = converterDataParaTimestamp(item.data);
        let valor;
        
        if (tipo === 'historico') valor = item.valor;
        else if (tipo === 'ajustado') valor = item.valor;
        else if (tipo === 'previsao') valor = item.previsao || item.valor;
        
        return {
          ...item,
          timestamp,
          valor: parseFloat(valor) || 0,
          tipo,
          inferior: tipo === 'previsao' ? parseFloat(item.inferior) || 0 : null,
          superior: tipo === 'previsao' ? parseFloat(item.superior) || 0 : null
        };
      })
      .filter(item => item.timestamp !== null)
      .sort((a, b) => a.timestamp - b.timestamp); // Ordenar por timestamp
    
    // Criar labels formatadas
    const labels = dadosComTimestamp.map(item => {
      if (item.data) {
        return formatarDataGrafico(item.data);
      }
      return null;
    }).filter(Boolean);
    
    return {
      dados: dadosComTimestamp,
      labels
    };
  };

  // Processar cada conjunto separadamente
  const historicoProcessado = processarConjuntoDados(dadosHistoricos, 'historico');
  const ajustadosProcessado = processarConjuntoDados(dadosAjustados, 'ajustado');
  const previsoesProcessado = processarConjuntoDados(dadosPrevisoes, 'previsao');
  
  // OBTER TODAS AS DATAS ÚNICAS E ORDENADAS
  const todasDatas = [];
  
  // Adicionar todas as datas processadas
  historicoProcessado.dados.forEach(item => {
    if (item.data && !todasDatas.includes(item.data)) {
      todasDatas.push(item.data);
    }
  });
  
  ajustadosProcessado.dados.forEach(item => {
    if (item.data && !todasDatas.includes(item.data)) {
      todasDatas.push(item.data);
    }
  });
  
  previsoesProcessado.dados.forEach(item => {
    if (item.data && !todasDatas.includes(item.data)) {
      todasDatas.push(item.data);
    }
  });
  
  // Ordenar datas por timestamp
  const datasOrdenadas = [...todasDatas].sort((a, b) => {
    const timestampA = converterDataParaTimestamp(a);
    const timestampB = converterDataParaTimestamp(b);
    return timestampA - timestampB;
  });
  
  // Criar labels formatadas para o eixo X
  const labels = datasOrdenadas.map(data => formatarDataGrafico(data));
  
  // Criar datasets
  const datasets = [];
  
  // Dataset 1: Dados históricos (CORRIGIDO - usar array de valores)
  if (historicoProcessado.dados.length > 0) {
    console.log('📊 Criando dataset histórico com', historicoProcessado.dados.length, 'pontos');
    
    // Criar mapa de valores históricos por data
    const historicoMap = new Map();
    historicoProcessado.dados.forEach(item => {
      historicoMap.set(item.data, item.valor);
    });
    
    // Criar array de valores correspondente às labels
    const valoresHistoricos = datasOrdenadas.map(data => {
      return historicoMap.has(data) ? historicoMap.get(data) : null;
    });
    
    datasets.push({
      label: 'Dados Históricos',
      data: valoresHistoricos,
      borderColor: cores.primaria,
      backgroundColor: cores.primaria.replace('rgb', 'rgba').replace(')', ', 0.1)'),
      borderWidth: 2,
      fill: false,
      tension: 0.1,
      pointRadius: 3,
      pointHoverRadius: 6,
      order: 1
    });
  }
  
  // Dataset 2: Dados ajustados
  if (ajustadosProcessado.dados.length > 0) {
    const ajustadosMap = new Map();
    ajustadosProcessado.dados.forEach(item => {
      ajustadosMap.set(item.data, item.valor);
    });
    
    const valoresAjustados = datasOrdenadas.map(data => {
      return ajustadosMap.has(data) ? ajustadosMap.get(data) : null;
    });
    
    datasets.push({
      label: 'Modelo Ajustado',
      data: valoresAjustados,
      borderColor: cores.terciaria,
      backgroundColor: cores.terciaria.replace('rgb', 'rgba').replace(')', ', 0.1)'),
      borderWidth: 2,
      borderDash: [3, 3],
      fill: false,
      tension: 0.1,
      pointRadius: 2,
      order: 2
    });
  }
  
  // Dataset 3: Previsões com intervalos (CORRIGIDO)
  if (previsoesProcessado.dados.length > 0) {
    console.log('📊 Criando dataset previsões com', previsoesProcessado.dados.length, 'pontos');
    
    // Criar mapas para previsões e intervalos
    const previsoesMap = new Map();
    const inferiorMap = new Map();
    const superiorMap = new Map();
    
    previsoesProcessado.dados.forEach(item => {
      previsoesMap.set(item.data, item.valor);
      if (item.inferior !== null) inferiorMap.set(item.data, item.inferior);
      if (item.superior !== null) superiorMap.set(item.data, item.superior);
    });
    
    // Dataset 3.1: Previsões pontuais
    const valoresPrevisoes = datasOrdenadas.map(data => {
      return previsoesMap.has(data) ? previsoesMap.get(data) : null;
    });
    
    datasets.push({
      label: 'Previsões Futuras',
      data: valoresPrevisoes,
      borderColor: cores.secundaria,
      backgroundColor: cores.secundaria.replace('rgb', 'rgba').replace(')', ', 0.1)'),
      borderWidth: 3,
      fill: false,
      tension: 0.2,
      pointRadius: 4,
      pointHoverRadius: 8,
      order: 3
    });
    
    // Dataset 3.2: Intervalo de confiança (CORRIGIDO)
    // Verificar se temos intervalos válidos
    const temIntervalos = previsoesProcessado.dados.some(p => p.inferior !== null && p.superior !== null);
    
    if (temIntervalos) {
      console.log('📊 Criando intervalo de confiança...');
      
      // Criar arrays para limites inferior e superior
      const valoresInferiores = datasOrdenadas.map(data => {
        return inferiorMap.has(data) ? inferiorMap.get(data) : null;
      });
      
      const valoresSuperiores = datasOrdenadas.map(data => {
        return superiorMap.has(data) ? superiorMap.get(data) : null;
      });
      
      // Dataset para limite superior
      datasets.push({
        label: 'Limite Superior (95%)',
        data: valoresSuperiores,
        borderColor: cores.secundaria.replace('rgb', 'rgba').replace(')', ', 0.5)'),
        backgroundColor: cores.secundaria.replace('rgb', 'rgba').replace(')', ', 0.1)'),
        borderWidth: 1,
        borderDash: [2, 2],
        fill: false,
        tension: 0,
        pointRadius: 0,
        order: 4
      });
      
      // Dataset para limite inferior (com fill para criar área)
      datasets.push({
        label: 'Limite Inferior (95%)',
        data: valoresInferiores,
        borderColor: cores.secundaria.replace('rgb', 'rgba').replace(')', ', 0.5)'),
        backgroundColor: cores.secundaria.replace('rgb', 'rgba').replace(')', ', 0.2)'),
        borderWidth: 1,
        borderDash: [2, 2],
        fill: {
          target: '+1', // Preencher até o dataset anterior (limite superior)
          above: cores.secundaria.replace('rgb', 'rgba').replace(')', ', 0.2)')
        },
        tension: 0,
        pointRadius: 0,
        order: 5
      });
    }
  }
  
  return {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `📈 ${nomeSerie} - Previsões ${tipoModelo.toUpperCase()}`,
          font: { 
            size: 16, 
            weight: 'bold',
            family: "'Inter', 'Segoe UI', sans-serif"
          },
          padding: { top: 10, bottom: 20 }
        },
        legend: {
          position: 'top',
          labels: {
            padding: 15,
            usePointStyle: true,
            font: { size: 12 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.9)',
          titleColor: '#f9fafb',
          bodyColor: '#f3f4f6',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          mode: 'index',
          intersect: false,
          callbacks: {
            title: (items) => {
              if (items.length > 0) {
                const dataIndex = items[0].dataIndex;
                if (labels[dataIndex]) {
                  return labels[dataIndex];
                }
              }
              return 'Período';
            },
            label: (context) => {
              const label = context.dataset.label;
              const value = context.parsed.y;
              
              // Para intervalos de confiança, mostrar mais informações
              if (label.includes('Limite Superior') || label.includes('Limite Inferior')) {
                return `${label}: ${formatNumber(value, 4)}`;
              }
              
              return `${label}: ${formatNumber(value, 4)}`;
            },
            afterBody: (items) => {
              // Adicionar informações extras para previsões com intervalo
              if (items.length > 0) {
                const dataIndex = items[0].dataIndex;
                const previsaoItem = previsoesProcessado.dados.find(d => 
                  d.data === datasOrdenadas[dataIndex]
                );
                
                if (previsaoItem && previsaoItem.inferior && previsaoItem.superior) {
                  const amplitude = previsaoItem.superior - previsaoItem.inferior;
                  return [
                    `Intervalo: ${formatNumber(previsaoItem.inferior, 4)} - ${formatNumber(previsaoItem.superior, 4)}`,
                    `Amplitude: ${formatNumber(amplitude, 4)}`
                  ];
                }
              }
              return [];
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Período',
            font: { size: 12, weight: '600' }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            maxRotation: 45,
            font: { size: 11 },
            color: '#6b7280'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Valor',
            font: { size: 12, weight: '600' }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            font: { size: 11 },
            color: '#6b7280',
            callback: function(value) {
              if (value === null || value === undefined) return '';
              if (Math.abs(value) >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M';
              }
              if (Math.abs(value) >= 1000) {
                return (value / 1000).toFixed(1) + 'k';
              }
              return value.toLocaleString('pt-BR');
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      spanGaps: true // Permitir gaps nos dados
    }
  };
};

  // 2. Gráfico de Análise de Tendência
  const dadosTendencia = () => {
    console.log('📊 Gerando gráfico de Tendência:', dadosProcessados?.dadosHistoricos);
    
    if (!dadosProcessados?.dadosHistoricos || dadosProcessados.dadosHistoricos.length < 10) {
      console.log('❌ Sem dados históricos suficientes para análise de tendência');
      return null;
    }

    const { dadosHistoricos, dadosAjustados, nomeSerie } = dadosProcessados;
    const cores = getCoresModelo();
    
    const dadosOrdenados = ordenarPorData(dadosHistoricos);
    const valores = dadosOrdenados.map(d => d.valor);
    
    // Calcular média móvel simples (5 períodos)
    const mediaMovel = [];
    for (let i = 0; i < valores.length; i++) {
      if (i >= 4) {
        const media = (valores[i-4] + valores[i-3] + valores[i-2] + valores[i-1] + valores[i]) / 5;
        mediaMovel.push(media);
      } else {
        mediaMovel.push(null);
      }
    }

    // Calcular tendência linear
    const n = valores.length;
    const somaX = valores.reduce((sum, _, i) => sum + i, 0);
    const somaY = valores.reduce((sum, val) => sum + val, 0);
    const somaXY = valores.reduce((sum, val, i) => sum + val * i, 0);
    const somaX2 = valores.reduce((sum, _, i) => sum + i * i, 0);
    
    const b = (n * somaXY - somaX * somaY) / (n * somaX2 - somaX * somaX);
    const a = (somaY - b * somaX) / n;
    
    const linhaTendencia = Array(n).fill(0).map((_, i) => a + b * i);

    // Dados ajustados (se disponíveis)
    const ajustadosOrdenados = ordenarPorData(dadosAjustados || []);
    const ajustadosValores = ajustadosOrdenados.map(d => d.valor);

    const labels = dadosOrdenados.map((d, i) => {
      if (d.data) {
        return formatarDataGrafico(d.data);
      }
      return `P${i + 1}`;
    });

    return {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Valores Históricos',
            data: valores,
            borderColor: cores.primaria,
            backgroundColor: cores.primaria.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            borderWidth: 2,
            fill: false,
            tension: 0.2,
            pointRadius: 2,
            order: 1
          },
          {
            label: 'Média Móvel (5 períodos)',
            data: mediaMovel,
            borderColor: cores.terciaria,
            backgroundColor: cores.terciaria.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            borderWidth: 2,
            fill: false,
            tension: 0.2,
            pointRadius: 0,
            order: 2
          },
          {
            label: 'Tendência Linear',
            data: linhaTendencia,
            borderColor: cores.secundaria,
            backgroundColor: cores.secundaria.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0,
            pointRadius: 0,
            order: 3
          },
          ...(ajustadosValores.length > 0 ? [{
            label: 'Ajuste do Modelo',
            data: ajustadosValores,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2,
            borderDash: [2, 2],
            fill: false,
            tension: 0.3,
            pointRadius: 1,
            order: 4
          }] : [])
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `📉 ${nomeSerie} - Análise de Tendência`,
            font: { 
              size: 16, 
              weight: 'bold',
              family: "'Inter', 'Segoe UI', sans-serif"
            },
            padding: { top: 10, bottom: 20 }
          },
          legend: {
            position: 'top',
            labels: {
              padding: 15,
              usePointStyle: true,
              font: { size: 12 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            titleColor: '#f9fafb',
            bodyColor: '#f3f4f6',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Período',
              font: { size: 12, weight: '600' }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: { size: 11 },
              color: '#6b7280',
              maxRotation: 45
            }
          },
          y: {
            title: {
              display: true,
              text: 'Valor',
              font: { size: 12, weight: '600' }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: { size: 11 },
              color: '#6b7280'
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    };
  };

  // 3. Gráfico de Comparação de Previsões (Intervalo de Confiança)
  const dadosComparacaoPrevisoes = () => {
    console.log('📊 Gerando gráfico de Comparação:', dadosProcessados?.dadosPrevisoes);
    
    if (!dadosProcessados?.dadosPrevisoes || dadosProcessados.dadosPrevisoes.length === 0) {
      console.log('❌ Sem dados de previsões para comparação');
      return null;
    }

    const { dadosPrevisoes, nomeSerie } = dadosProcessados;
    const cores = getCoresModelo();
    
    const dadosOrdenados = ordenarPorData(dadosPrevisoes);
    
    const labels = dadosOrdenados.map((item, i) => {
      if (item.data) {
        const dataFormatada = formatarDataGrafico(item.data);
        return dataFormatada;
      }
      return `P${i + 1}`;
    });

    const valores = dadosOrdenados.map(item => item.previsao);
    const inferiores = dadosOrdenados.map(item => item.inferior);
    const superiores = dadosOrdenados.map(item => item.superior);

    return {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Previsão Pontual',
            data: valores,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 8
          },
          {
            label: 'Limite Inferior (95%)',
            data: inferiores,
            borderColor: cores.secundaria.replace('rgb', 'rgba').replace(')', ', 0.5)'),
            backgroundColor: cores.secundaria.replace('rgb', 'rgba').replace(')', ', 0.05)'),
            borderWidth: 1,
            borderDash: [3, 3],
            fill: false,
            tension: 0.3,
            pointRadius: 2
          },
          {
            label: 'Limite Superior (95%)',
            data: superiores,
            borderColor: cores.secundaria.replace('rgb', 'rgba').replace(')', ', 0.5)'),
            backgroundColor: cores.secundaria.replace('rgb', 'rgba').replace(')', ', 0.05)'),
            borderWidth: 1,
            borderDash: [3, 3],
            fill: '+1',
            tension: 0.3,
            pointRadius: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `🎯 ${nomeSerie} - Intervalos de Confiança`,
            font: { 
              size: 16, 
              weight: 'bold',
              family: "'Inter', 'Segoe UI', sans-serif"
            },
            padding: { top: 10, bottom: 20 }
          },
          legend: {
            position: 'top',
            labels: {
              padding: 15,
              usePointStyle: true,
              font: { size: 12 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            titleColor: '#f9fafb',
            bodyColor: '#f3f4f6',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            mode: 'index',
            intersect: false,
            callbacks: {
              title: (items) => {
                const item = items[0];
                const data = dadosOrdenados[item.dataIndex];
                return data.data ? formatarDataGrafico(data.data) : `Período ${item.dataIndex + 1}`;
              },
              label: (context) => {
                const idx = context.dataIndex;
                const label = context.dataset.label;
                const valor = context.parsed.y;
                
                if (label === 'Previsão Pontual') {
                  const amplitude = superiores[idx] - inferiores[idx];
                  return [
                    `Previsão: ${valor.toFixed(4)}`,
                    `Intervalo: ${inferiores[idx].toFixed(4)} a ${superiores[idx].toFixed(4)}`,
                    `Amplitude: ${amplitude.toFixed(4)}`
                  ];
                }
                return `${label}: ${valor.toFixed(4)}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Período de Previsão',
              font: { size: 12, weight: '600' }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: { size: 11 },
              color: '#6b7280'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Valor Previsto',
              font: { size: 12, weight: '600' }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: { size: 11 },
              color: '#6b7280'
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    };
  };

  // 4. Gráfico de Métricas de Performance
  const dadosMetricasPerformance = () => {
    console.log('📊 Gerando gráfico de Métricas:', dadosProcessados?.metricas);
    
    if (!dadosProcessados?.metricas) {
      console.log('❌ Sem métricas disponíveis');
      return null;
    }

    const { metricas } = dadosProcessados;
    const { ajuste, precisao } = metricas;
    const cores = getCoresModelo();
    
    const metricasArray = [];
    const coresGrafico = [
      cores.primaria.replace('rgb', 'rgba').replace(')', ', 0.8)'),
      cores.secundaria.replace('rgb', 'rgba').replace(')', ', 0.8)'),
      cores.terciaria.replace('rgb', 'rgba').replace(')', ', 0.8)'),
      'rgba(168, 85, 247, 0.8)',
      'rgba(245, 158, 11, 0.8)'
    ];

    // Adicionar métricas disponíveis
    if (precisao?.ME !== undefined) {
      metricasArray.push({ label: 'Erro Médio (ME)', valor: Math.abs(precisao.ME), desc: 'Tendência do erro' });
    }
    if (precisao?.MAE !== undefined) {
      metricasArray.push({ label: 'MAE', valor: precisao.MAE, desc: 'Erro Absoluto Médio' });
    }
    if (precisao?.MAPE !== undefined) {
      metricasArray.push({ label: 'MAPE', valor: precisao.MAPE, desc: 'Erro Percentual Absoluto Médio' });
    }
    if (ajuste?.RMSE !== undefined) {
      metricasArray.push({ label: 'RMSE', valor: ajuste.RMSE, desc: 'Raiz do Erro Quadrático Médio' });
    }
    if (ajuste?.AIC !== undefined) {
      metricasArray.push({ label: 'AIC', valor: ajuste.AIC, desc: 'Critério de Informação de Akaike' });
    }
    if (ajuste?.BIC !== undefined) {
      metricasArray.push({ label: 'BIC', valor: ajuste.BIC, desc: 'Critério de Informação Bayesiano' });
    }

    if (metricasArray.length === 0) return null;

    // Ordenar por valor
    metricasArray.sort((a, b) => b.valor - a.valor);

    return {
      type: 'bar',
      data: {
        labels: metricasArray.map(m => m.label),
        datasets: [{
          label: 'Valor',
          data: metricasArray.map(m => m.valor),
          backgroundColor: metricasArray.map((_, i) => coresGrafico[i % coresGrafico.length]),
          borderColor: metricasArray.map((_, i) => 
            coresGrafico[i % coresGrafico.length].replace('0.8', '1')
          ),
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          title: {
            display: true,
            text: `📊 ${tipoModelo.toUpperCase()} - Métricas de Performance`,
            font: { 
              size: 16, 
              weight: 'bold',
              family: "'Inter', 'Segoe UI', sans-serif"
            },
            padding: { top: 10, bottom: 20 }
          },
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            titleColor: '#f9fafb',
            bodyColor: '#f3f4f6',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const metrica = metricasArray[context.dataIndex];
                const valor = context.parsed.x;
                
                let valorFormatado = '';
                if (metrica.label.includes('MAPE')) {
                  valorFormatado = `${valor.toFixed(2)}%`;
                } else if (metrica.label.includes('AIC') || metrica.label.includes('BIC')) {
                  valorFormatado = valor.toFixed(1);
                } else {
                  valorFormatado = valor.toFixed(4);
                }
                
                return [
                  `${metrica.label}: ${valorFormatado}`,
                  metrica.desc ? `(${metrica.desc})` : ''
                ].filter(Boolean);
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Valor da Métrica',
              font: { size: 12, weight: '600' }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: { size: 11 },
              color: '#6b7280'
            }
          },
          y: {
            grid: {
              color: 'rgba(0, 0, 0, 0.03)'
            },
            ticks: {
              font: { size: 12 },
              color: '#374151'
            }
          }
        },
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        }
      }
    };
  };

  // 5. Gráfico de Resíduos
  const dadosResiduos = () => {
    console.log('📊 Gerando gráfico de Resíduos:', dadosProcessados?.residuos);
    
    if (!dadosProcessados?.residuos || dadosProcessados.residuos.length === 0) {
      console.log('❌ Sem dados de resíduos');
      return null;
    }

    const { residuos } = dadosProcessados;
    const cores = getCoresModelo();
    
    const labels = residuos.map(r => `Resíduo ${r.periodo}`);
    const valores = residuos.map(r => r.residuo);

    // Calcular estatísticas
    const mediaResiduos = valores.reduce((a, b) => a + b, 0) / valores.length;
    const desvioPadrao = Math.sqrt(valores.reduce((sum, r) => sum + Math.pow(r - mediaResiduos, 2), 0) / valores.length);
    const limites = valores.map(() => 2 * desvioPadrao);

    return {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Resíduos',
            data: valores,
            backgroundColor: valores.map(v => 
              Math.abs(v) > 2 * desvioPadrao 
                ? cores.secundaria.replace('rgb', 'rgba').replace(')', ', 0.7)')
                : cores.primaria.replace('rgb', 'rgba').replace(')', ', 0.7)')
            ),
            borderColor: valores.map(v => 
              Math.abs(v) > 2 * desvioPadrao 
                ? cores.secundaria
                : cores.primaria
            ),
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Limites (±2σ)',
            data: limites,
            type: 'line',
            borderColor: cores.terciaria.replace('rgb', 'rgba').replace(')', ', 0.5)'),
            borderWidth: 1,
            borderDash: [3, 3],
            fill: false,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `🔍 ${tipoModelo.toUpperCase()} - Análise de Resíduos`,
            font: { 
              size: 16, 
              weight: 'bold',
              family: "'Inter', 'Segoe UI', sans-serif"
            },
            padding: { top: 10, bottom: 20 }
          },
          legend: {
            position: 'top',
            labels: {
              padding: 15,
              usePointStyle: true,
              font: { size: 12 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            titleColor: '#f9fafb',
            bodyColor: '#f3f4f6',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const valor = context.parsed.y;
                const label = context.dataset.label === 'Resíduos' 
                  ? `Resíduo: ${valor.toFixed(4)}` 
                  : `Limite: ±${valor.toFixed(4)}`;
                
                if (context.dataset.label === 'Resíduos' && Math.abs(valor) > 2 * desvioPadrao) {
                  return [label, '⚠️ Fora dos limites (2σ)'];
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'Valor do Resíduo',
              font: { size: 12, weight: '600' }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: { size: 11 },
              color: '#6b7280'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              display: false
            }
          }
        },
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        }
      }
    };
  };

  // 6. Gráfico de Coeficientes (para modelos parametrizados)
  const dadosCoeficientes = () => {
    console.log('📊 Gerando gráfico de Coeficientes:', dadosProcessados?.coeficientes);
    
    if (!dadosProcessados?.coeficientes || dadosProcessados.coeficientes.length === 0) {
      console.log('❌ Sem coeficientes disponíveis');
      return null;
    }

    const { coeficientes } = dadosProcessados;
    const cores = getCoresModelo();
    
    // Ordenar por valor absoluto
    const coeficientesOrdenados = [...coeficientes]
      .filter(c => c.termo && c.estimativa !== undefined)
      .sort((a, b) => Math.abs(b.estimativa) - Math.abs(a.estimativa))
      .slice(0, 10); // Limitar a top 10

    const labels = coeficientesOrdenados.map(c => c.termo);
    const valores = coeficientesOrdenados.map(c => c.estimativa);
    const pValores = coeficientesOrdenados.map(c => c.p_valor);

    // Criar cores baseadas na significância
    const coresBarras = valores.map((valor, i) => {
      const pValor = pValores[i];
      if (pValor !== undefined && pValor < 0.05) {
        return cores.secundaria.replace('rgb', 'rgba').replace(')', ', 0.8)'); // Significativo
      } else if (pValor !== undefined && pValor < 0.1) {
        return cores.terciaria.replace('rgb', 'rgba').replace(')', ', 0.8)'); // Marginalmente significativo
      }
      return cores.primaria.replace('rgb', 'rgba').replace(')', ', 0.5)'); // Não significativo
    });

    return {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Estimativa do Coeficiente',
          data: valores,
          backgroundColor: coresBarras,
          borderColor: coresBarras.map(cor => cor.replace('0.8', '1').replace('0.5', '1')),
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `β ${tipoModelo.toUpperCase()} - Coeficientes do Modelo`,
            font: { 
              size: 16, 
              weight: 'bold',
              family: "'Inter', 'Segoe UI', sans-serif"
            },
            padding: { top: 10, bottom: 20 }
          },
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            titleColor: '#f9fafb',
            bodyColor: '#f3f4f6',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const idx = context.dataIndex;
                const valor = context.parsed.y;
                const pValor = pValores[idx];
                
                const linha1 = `Coeficiente: ${valor.toFixed(6)}`;
                const linha2 = pValor !== undefined ? `p-valor: ${pValor.toFixed(4)}` : '';
                const linha3 = pValor !== undefined && pValor < 0.05 ? '✅ Significativo (p < 0.05)' : 
                              pValor !== undefined && pValor < 0.1 ? '⚠️ Marginalmente significativo (p < 0.1)' : 
                              pValor !== undefined ? '❌ Não significativo' : '';
                
                return [linha1, linha2, linha3].filter(Boolean);
              }
            }
          }
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'Valor do Coeficiente',
              font: { size: 12, weight: '600' }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: { size: 11 },
              color: '#6b7280'
            }
          },
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.03)'
            },
            ticks: {
              font: { size: 11 },
              color: '#374151',
              maxRotation: 45
            }
          }
        },
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        }
      }
    };
  };

  // Renderizar gráfico atual
  const renderizarGrafico = () => {
    if (carregando) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Carregando dados para gráficos...</p>
          </div>
        </div>
      );
    }

    if (!dadosProcessados) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-3xl mb-2">📊</div>
            <p>Nenhum dado disponível para gráficos</p>
            <p className="text-sm mt-2">Execute o modelo primeiro para visualizar os gráficos</p>
          </div>
        </div>
      );
    }

    const graficos = {
      previsoes: dadosPrevisoesHistorico(),
      tendencia: dadosTendencia(),
      comparacao: dadosComparacaoPrevisoes(),
      metricas: dadosMetricasPerformance(),
      residuos: dadosResiduos(),
      coeficientes: dadosCoeficientes()
    };

    console.log('📊 Gráficos disponíveis:', Object.keys(graficos).filter(k => graficos[k]));

    const graficoAtual = graficos[graficoAtivo];

     if (!graficoAtual) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-3xl mb-2">📊</div>
          <p>Dados insuficientes para gerar este gráfico</p>
          <p className="text-sm mt-2">
            {graficoAtivo === 'previsoes' 
              ? 'Este gráfico requer dados históricos e de previsão' 
              : graficoAtivo === 'coeficientes'
              ? 'Este gráfico requer coeficientes do modelo'
              : graficoAtivo === 'residuos'
              ? 'Este gráfico requer dados de resíduos'
              : 'Verifique se o modelo foi treinado com sucesso'}
          </p>
        </div>
      </div>
    );
  }

  // ✅ CORREÇÃO: Para gráficos com dados dinâmicos, usar Line com options
  if (graficoAtual.type === 'line') {
    return (
      <div style={{ position: 'relative', height: '500px' }}>
        <Line
          ref={chartRef}
          data={graficoAtual.data}
          options={graficoAtual.options}
        />
      </div>
    );
  }

    // Renderizar gráfico baseado no tipo
    switch (graficoAtual.type) {
    case 'bar':
      return <Bar ref={chartRef} data={graficoAtual.data} options={graficoAtual.options} />;
    case 'scatter':
      return <Scatter ref={chartRef} data={graficoAtual.data} options={graficoAtual.options} />;
    default:
      return <Bar ref={chartRef} data={graficoAtual.data} options={graficoAtual.options} />;
  }
};

  // Determinar quais gráficos estão disponíveis
  const getGraficosDisponiveis = () => {
    const graficosDisponiveis = [
      { id: 'previsoes', label: '📈 Previsões', disponivel: !!dadosPrevisoesHistorico() },
      { id: 'tendencia', label: '📉 Tendência', disponivel: !!dadosTendencia() },
      { id: 'comparacao', label: '🎯 Intervalos', disponivel: !!dadosComparacaoPrevisoes() },
      { id: 'metricas', label: '📊 Métricas', disponivel: !!dadosMetricasPerformance() },
      { id: 'coeficientes', label: 'β Coeficientes', disponivel: !!dadosCoeficientes() },
      { id: 'residuos', label: '🔍 Resíduos', disponivel: !!dadosResiduos() }
    ];

    return graficosDisponiveis.filter(g => g.disponivel);
  };

  const graficosDisponiveis = getGraficosDisponiveis();

  // Função para exportar gráfico
  const exportarGrafico = () => {
    if (chartRef.current) {
      const link = document.createElement('a');
      link.download = `grafico_${tipoModelo}_${graficoAtivo}_${Date.now()}.png`;
      link.href = chartRef.current.toBase64Image();
      link.click();
    }
  };

  if (carregando) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando gráficos...</p>
      </div>
    );
  }

  if (!dadosProcessados || graficosDisponiveis.length === 0) {
    console.log('❌ Nenhum gráfico disponível:', {
      dadosProcessados: !!dadosProcessados,
      graficosDisponiveis: graficosDisponiveis.length
    });
    
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          Dados insuficientes para gráficos
        </h3>
        <p className="text-gray-500">
          Execute o modelo com dados válidos para visualizar os gráficos
        </p>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
          <p className="text-sm text-gray-600">Dados recebidos:</p>
          <pre className="text-xs mt-2 overflow-auto max-h-40">
            {JSON.stringify(dados || {}, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  const { nomeSerie, ordemModelo, metricas } = dadosProcessados;
  const cores = getCoresModelo();

  // Obter ícone baseado no tipo de modelo
  const getIconeModelo = () => {
    const icones = {
      arima: '📈',
      sarima: '🔄',
      ets: '📊',
      prophet: '🔮'
    };
    return icones[tipoModelo] || '📈';
  };

  return (
    <div className="space-y-6">
      {/* Navegação entre gráficos */}
      {graficosDisponiveis.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {graficosDisponiveis.map((grafico) => (
            <button
              key={grafico.id}
              onClick={() => setGraficoAtivo(grafico.id)}
              className={`px-4 py-3 rounded-lg text-left transition-all flex-1 min-w-[140px] ${
                graficoAtivo === grafico.id
                  ? `bg-gradient-to-r ${cores.gradient} text-white shadow-lg transform scale-105`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="font-medium">{grafico.label}</div>
              <div className="text-xs opacity-80">
                {grafico.id === 'previsoes' ? 'Histórico vs Previsto' :
                 grafico.id === 'tendencia' ? 'Análise de Tendência' :
                 grafico.id === 'comparacao' ? 'Intervalos de Confiança' :
                 grafico.id === 'metricas' ? 'Performance' :
                 grafico.id === 'coeficientes' ? 'Parâmetros do Modelo' :
                 'Análise de Resíduos'}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Gráfico Ativo */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="h-[500px]">
          {renderizarGrafico()}
        </div>
      </div>

      {/* Controles e informações */}
      {graficosDisponiveis.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Controles do gráfico */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-3">🛠️ Controles</div>
            <div className="space-y-3">
              <button
                onClick={exportarGrafico}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                📥 Exportar como PNG
              </button>
              <div className="text-xs text-gray-500">
                💡 Passe o mouse sobre os pontos/barras para ver detalhes
              </div>
            </div>
          </div>
          
          {/* Interpretação */}
          <div className={`p-4 rounded-lg border ${tipoModelo === 'arima' ? 'bg-blue-50 border-blue-200' : 
                                                     tipoModelo === 'sarima' ? 'bg-purple-50 border-purple-200' :
                                                     tipoModelo === 'ets' ? 'bg-green-50 border-green-200' :
                                                     'bg-pink-50 border-pink-200'}`}>
            <div className={`text-sm font-medium mb-2 ${tipoModelo === 'arima' ? 'text-blue-700' : 
                                                         tipoModelo === 'sarima' ? 'text-purple-700' :
                                                         tipoModelo === 'ets' ? 'text-green-700' :
                                                         'text-pink-700'}`}>💡 Interpretação</div>
            <div className={`text-sm space-y-2 ${tipoModelo === 'arima' ? 'text-blue-600' : 
                                                 tipoModelo === 'sarima' ? 'text-purple-600' :
                                                 tipoModelo === 'ets' ? 'text-green-600' :
                                                 'text-pink-600'}`}>
              {graficoAtivo === 'previsoes' && (
                <>
                  <p>Compara dados históricos, ajuste do modelo e previsões futuras.</p>
                  <p><strong>Linha colorida:</strong> Dados históricos observados.</p>
                  <p><strong>Linha tracejada:</strong> Modelo ajustado aos dados.</p>
                  <p><strong>Linha em destaque:</strong> Previsões futuras com intervalo de confiança.</p>
                </>
              )}
              {graficoAtivo === 'tendencia' && (
                <>
                  <p>Análise detalhada da tendência e ajuste do modelo.</p>
                  <p><strong>Linha colorida:</strong> Valores históricos.</p>
                  <p><strong>Linha tracejada:</strong> Média móvel (5 períodos).</p>
                  <p><strong>Linha pontilhada:</strong> Tendência linear.</p>
                </>
              )}
              {graficoAtivo === 'comparacao' && (
                <>
                  <p>Mostra intervalos de confiança das previsões futuras.</p>
                  <p><strong>Linha verde:</strong> Previsão pontual mais provável.</p>
                  <p><strong>Área sombreada:</strong> Intervalo onde há 95% de confiança que o valor real estará.</p>
                  <p><strong>Amplitude pequena:</strong> Maior certeza nas previsões.</p>
                </>
              )}
              {graficoAtivo === 'metricas' && (
                <>
                  <p>Desempenho do modelo {tipoModelo.toUpperCase()}.</p>
                  <p><strong>MAPE:</strong> Erro percentual médio (ideal &lt; 10%).</p>
                  <p><strong>RMSE/MAE:</strong> Medidas de erro absoluto.</p>
                  <p><strong>AIC/BIC:</strong> Critérios de qualidade do ajuste.</p>
                </>
              )}
              {graficoAtivo === 'coeficientes' && (
                <>
                  <p>Parâmetros do modelo {tipoModelo.toUpperCase()}.</p>
                  <p><strong>Coeficientes significativos (p &lt; 0.05):</strong> Impacto real no modelo.</p>
                  <p><strong>Valor positivo:</strong> Relação direta com a série.</p>
                  <p><strong>Valor negativo:</strong> Relação inversa com a série.</p>
                </>
              )}
              {graficoAtivo === 'residuos' && (
                <>
                  <p>Avalia a qualidade do ajuste do modelo.</p>
                  <p><strong>Resíduos:</strong> Diferença entre observado e previsto.</p>
                  <p><strong>Dentro de ±2σ:</strong> Bom ajuste (≈95% dos dados).</p>
                  <p><strong>Padrão aleatório:</strong> Modelo bem especificado.</p>
                </>
              )}
            </div>
          </div>
          
          {/* Dados do modelo */}
          <div className={`p-4 rounded-lg border ${tipoModelo === 'arima' ? 'bg-blue-100 border-blue-300' : 
                                                     tipoModelo === 'sarima' ? 'bg-purple-100 border-purple-300' :
                                                     tipoModelo === 'ets' ? 'bg-green-100 border-green-300' :
                                                     'bg-pink-100 border-pink-300'}`}>
            <div className={`text-sm font-medium mb-2 flex items-center gap-2 ${tipoModelo === 'arima' ? 'text-blue-800' : 
                                                                                 tipoModelo === 'sarima' ? 'text-purple-800' :
                                                                                 tipoModelo === 'ets' ? 'text-green-800' :
                                                                                 'text-pink-800'}`}>
              {getIconeModelo()} {tipoModelo.toUpperCase()} - Informações
            </div>
            <div className={`text-sm space-y-1 ${tipoModelo === 'arima' ? 'text-blue-700' : 
                                                 tipoModelo === 'sarima' ? 'text-purple-700' :
                                                 tipoModelo === 'ets' ? 'text-green-700' :
                                                 'text-pink-700'}`}>
              <div className="flex justify-between">
                <span>Série:</span>
                <span className="font-medium truncate">{nomeSerie}</span>
              </div>
              <div className="flex justify-between">
                <span>Modelo:</span>
                <span className="font-medium">{tipoModelo.toUpperCase()} {ordemModelo !== 'N/A' ? `(${ordemModelo})` : ''}</span>
              </div>
              {dadosProcessados.dadosHistoricos && (
                <div className="flex justify-between">
                  <span>Observações:</span>
                  <span className="font-medium">{dadosProcessados.dadosHistoricos.length}</span>
                </div>
              )}
              {dadosProcessados.dadosPrevisoes && (
                <div className="flex justify-between">
                  <span>Previsões:</span>
                  <span className="font-medium">{dadosProcessados.dadosPrevisoes.length}</span>
                </div>
              )}
              {metricas.ajuste?.RMSE && (
                <div className="flex justify-between">
                  <span>RMSE:</span>
                  <span className="font-medium">{parseFloat(metricas.ajuste.RMSE).toFixed(2)}</span>
                </div>
              )}
              {metricas.precisao?.MAPE && (
                <div className="flex justify-between">
                  <span>MAPE:</span>
                  <span className="font-medium">{parseFloat(metricas.precisao.MAPE).toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente principal ResultadoSeriesTemporais
export default function ResultadoSeriesTemporais({ resultado, tipoModelo, onVoltar, onNovoModelo }) {
  const [abaAtiva, setAbaAtiva] = useState('interpretacao');
  const [todasPrevisoesVisiveis, setTodasPrevisoesVisiveis] = useState(false);

  if (!resultado) return null;

  // ✅ CORREÇÃO: Acessar dados de forma mais robusta
  const dadosResultado = resultado.resultado || resultado;
  
  // ✅ Extrair dados principais com fallbacks seguros
  const interpretacao = dadosResultado.interpretacao_tecnica || {};
  const coeficientes = Array.isArray(dadosResultado.coeficientes) ? dadosResultado.coeficientes : [];
  const metricas = dadosResultado.metricas || {};
  const previsoes = Array.isArray(dadosResultado.previsoes) ? dadosResultado.previsoes : [];
  const modeloInfo = dadosResultado.modelo_info || {};
  const periodoPrevisao = dadosResultado.periodo_previsao || {};
  const qualidadeAjuste = dadosResultado.qualidade_ajuste || {};
  const resumoModelo = dadosResultado.resumo_modelo || {};
  const historico = Array.isArray(dadosResultado.historico) ? dadosResultado.historico : [];
  const residuos = Array.isArray(dadosResultado.residuos) ? dadosResultado.residuos : [];
  
  // ✅ Métricas específicas com verificações
  const metricasAjuste = metricas && typeof metricas.ajuste === 'object' ? metricas.ajuste : {};
  const metricasPrecisao = metricas && typeof metricas.precisao === 'object' ? metricas.precisao : {};
  const metricasDiagnostico = metricas && typeof metricas.diagnostico === 'object' ? metricas.diagnostico : {};

  // Funções de formatação com segurança
  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined || isNaN(num)) return 'N/A';
    if (typeof num !== 'number') {
      const parsed = parseFloat(num);
      if (isNaN(parsed)) return 'N/A';
      num = parsed;
    }
    if (Math.abs(num) < 0.0001) return num.toExponential(decimals);
    return Number(num).toFixed(decimals);
  };

  // ✅ CORREÇÃO CRÍTICA: Função para corrigir datas com século errado
  const corrigirSeculoData = (dataRaw) => {
    if (!dataRaw) return dataRaw;
    
    // Se for string, tentar corrigir o século
    if (typeof dataRaw === 'string') {
      // Padrão: "nov/2095" ou "nov/2095 a out/2096"
      const corrigida = dataRaw
        .replace(/20(\d{2})/g, (match, anoCurto) => {
          const anoInt = parseInt(anoCurto);
          if (anoInt >= 95 && anoInt <= 99) {
            // 95-99 deveria ser 1995-1999, mas no contexto atual é 2025-2029
            // Considerando que estamos em 2025, ajustamos para 20XX
            return `20${anoCurto}`;
          } else if (anoInt >= 0 && anoInt <= 25) {
            // 0-25 ajusta para 2000-2025
            return `20${anoCurto.padStart(2, '0')}`;
          }
          return match;
        });
      
      return corrigida;
    }
    
    return dataRaw;
  };

  // ✅ Função para formatar datas corretamente - VERSÃO CORRIGIDA
  const formatarData = (dataRaw) => {
    if (!dataRaw) return 'N/A';
    
    // Primeiro corrigir o século se necessário
    const dataCorrigida = corrigirSeculoData(dataRaw);
    
    // Se for número Excel serial (como 44947)
    if (!isNaN(dataCorrigida) && Number(dataCorrigida) > 40000 && Number(dataCorrigida) < 50000) {
      const serial = Number(dataCorrigida);
      const data = new Date(1900, 0, serial - 1);
      if (serial > 60) data.setDate(data.getDate() - 1);
      
      const dia = data.getDate().toString().padStart(2, '0');
      const mes = (data.getMonth() + 1).toString().padStart(2, '0');
      const ano = data.getFullYear();
      return `${dia}/${mes}/${ano}`;
    }
    
    // Se já for string formatada
    if (typeof dataCorrigida === 'string') {
      // Verificar se já está no formato DD/MM/YYYY
      if (dataCorrigida.match(/^\d{2}\/\d{2}\/\d{4}$/)) return dataCorrigida;
      
      // Verificar se está no formato MÊS/ANO (ex: "nov/2025" ou "nov/2025 a out/2026")
      if (dataCorrigida.includes('/') && !dataCorrigida.includes('-')) {
        // Verificar se é um período com " a "
        if (dataCorrigida.includes(' a ')) {
          const [inicio, fim] = dataCorrigida.split(' a ');
          return `${formatarMesAno(inicio)} a ${formatarMesAno(fim)}`;
        }
        // Formatar mês/ano individual
        return formatarMesAno(dataCorrigida);
      }
      
      // Verificar se está no formato YYYY-MM-DD
      if (dataCorrigida.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [ano, mes, dia] = dataCorrigida.split('-');
        return `${dia}/${mes}/${ano}`;
      }
      
      // Tentar parsear como data ISO
      try {
        const data = new Date(dataCorrigida);
        if (!isNaN(data.getTime())) {
          const dia = data.getDate().toString().padStart(2, '0');
          const mes = (data.getMonth() + 1).toString().padStart(2, '0');
          const ano = data.getFullYear();
          return `${dia}/${mes}/${ano}`;
        }
      } catch {}
    }
    
    // Se for objeto Date
    if (dataCorrigida instanceof Date) {
      const dia = dataCorrigida.getDate().toString().padStart(2, '0');
      const mes = (dataCorrigida.getMonth() + 1).toString().padStart(2, '0');
      const ano = dataCorrigida.getFullYear();
      return `${dia}/${mes}/${ano}`;
    }
    
    return String(dataCorrigida);
  };

  // ✅ Função para formatar mês/ano
  const formatarMesAno = (mesAnoStr) => {
    if (!mesAnoStr) return 'N/A';
    
    const mesesAbreviados = {
      'jan': 'Janeiro', 'fev': 'Fevereiro', 'mar': 'Março', 'abr': 'Abril',
      'mai': 'Maio', 'jun': 'Junho', 'jul': 'Julho', 'ago': 'Agosto',
      'set': 'Setembro', 'out': 'Outubro', 'nov': 'Novembro', 'dez': 'Dezembro',
      'jan.': 'Janeiro', 'fev.': 'Fevereiro', 'mar.': 'Março', 'abr.': 'Abril',
      'mai.': 'Maio', 'jun.': 'Junho', 'jul.': 'Julho', 'ago.': 'Agosto',
      'set.': 'Setembro', 'out.': 'Outubro', 'nov.': 'Novembro', 'dez.': 'Dezembro',
      '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
      '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
      '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
    };
    
    // Padrão: "nov/2025" ou "10/2025"
    const match = mesAnoStr.match(/^([a-z\d\.]+)\/(\d{4})$/i);
    if (match) {
      const [, mesParte, ano] = match;
      const mesLower = mesParte.toLowerCase();
      const mesCompleto = mesesAbreviados[mesLower] || mesesAbreviados[mesParte] || mesParte;
      return `${mesCompleto} de ${ano}`;
    }
    
    return mesAnoStr;
  };

  // ✅ Função para obter período correto baseado nos dados usados
  const getPeriodoCorreto = () => {
    // Usar os dados da configuração que estão corretos
    if (resultado.dadosUsados) {
      const { periodo_inicio, n_previsoes, frequencia } = resultado.dadosUsados;
      
      if (periodo_inicio) {
        // Corrigir o século do período início
        const inicioCorrigido = corrigirSeculoData(periodo_inicio);
        
        // Calcular período final baseado na frequência
        if (n_previsoes && frequencia) {
          try {
            let mes, ano;
            
            // Parsear início
            if (inicioCorrigido.includes('/')) {
              const [mesStr, anoStr] = inicioCorrigido.split('/');
              mes = parseInt(mesStr);
              ano = parseInt(anoStr);
            }
            
            if (mes && ano) {
              // Calcular mês final (soma n_previsões meses)
              let mesFinal = mes + parseInt(n_previsoes);
              let anoFinal = ano;
              
              while (mesFinal > 12) {
                mesFinal -= 12;
                anoFinal += 1;
              }
              
              const meses = [
                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
              ];
              
              return `${meses[mes - 1]} de ${ano} a ${meses[mesFinal - 1]} de ${anoFinal}`;
            }
          } catch (e) {
            console.warn('Erro ao calcular período:', e);
          }
        }
        
        return formatarMesAno(inicioCorrigido);
      }
    }
    
    return 'Período não especificado';
  };

  // ✅ Função segura para obter valor de texto
  const safeText = (value, defaultValue = 'N/A') => {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'object' && !(value instanceof Date)) {
      try {
        return JSON.stringify(value);
      } catch {
        return defaultValue;
      }
    }
    return String(value);
  };

  // ✅ Função para extrair nome da variável
  const getNomeVariavel = () => {
    return safeText(
      interpretacao.variavel || 
      dadosResultado.variavel_y || 
      resultado.nome || 
      'Série Temporal'
    );
  };

  const getTipoNome = () => {
    const nomes = {
      arima: 'ARIMA',
      sarima: 'SARIMA',
      ets: 'ETS',
      prophet: 'Prophet'
    };
    return nomes[tipoModelo] || tipoModelo;
  };

  // ✅ Preparar dados para gráficos
  const prepararDadosParaGraficos = () => {
    if (!dadosResultado) {
      console.log('⚠️  Sem dados para gráficos');
      return null;
    }

    return {
      previsoes,
      historico,
      metricas,
      interpretacao,
      modelo_info: modeloInfo,
      coeficientes,
      residuos,
      nome: getNomeVariavel(),
      tipoModelo
    };
  };

  const dadosGraficos = prepararDadosParaGraficos();

  // ✅ RENDERIZAR INTERPRETAÇÃO TÉCNICA (COM VERIFICAÇÕES)
  const renderizarInterpretacaoTecnica = () => {
    // ✅ Usar período corrigido
    const periodoCorreto = getPeriodoCorreto();

    return (
      <div className="space-y-6">
        {/* Cabeçalho da Interpretação */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Interpretação Técnica da Série Temporal: <span className="text-blue-600">{getNomeVariavel()}</span>
          </h3>
          <p className="text-gray-600">Análise completa do modelo {getTipoNome()} aplicado</p>
          <div className="mt-2 text-sm text-blue-700">
            📅 Período da previsão: {periodoCorreto}
          </div>
        </div>

        {/* Contexto da Análise */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">🗓️</span> Contexto da Análise
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="font-medium text-gray-700 min-w-[180px]">Início da previsão:</span>
                <span className="text-gray-900 font-semibold">
                  {resultado.dadosUsados?.periodo_inicio 
                    ? formatarMesAno(corrigirSeculoData(resultado.dadosUsados.periodo_inicio))
                    : 'Outubro de 2025'}
                </span>
              </li>
              <li className="flex items-start">
                <span className="font-medium text-gray-700 min-w-[180px]">Período de previsão:</span>
                <span className="text-gray-900 font-semibold">{periodoCorreto}</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium text-gray-700 min-w-[180px]">Observações históricas:</span>
                <span className="text-gray-900 font-semibold">
                  {safeText(dadosResultado.n_observacoes || resultado.dadosUsados?.n || interpretacao.n_observacoes || historico.length || '119')}
                </span>
              </li>
              <li className="flex items-start">
                <span className="font-medium text-gray-700 min-w-[180px]">Frequência:</span>
                <span className="text-gray-900 font-semibold">
                  {safeText(resultado.dadosUsados?.frequencia || interpretacao.frequencia || 'Mensal')}
                </span>
              </li>
              <li className="flex items-start">
                <span className="font-medium text-gray-700 min-w-[180px]">Período histórico:</span>
                <span className="text-gray-900 font-semibold">
                  Novembro de 2015 a Setembro de 2025
                </span>
              </li>
              <li className="flex items-start">
                <span className="font-medium text-gray-700 min-w-[180px]">Períodos previstos:</span>
                <span className="text-gray-900 font-semibold">
                  {safeText(resultado.dadosUsados?.n_previsoes || previsoes?.length || '12')}
                </span>
              </li>
            </ul>
          </div>

          {/* Tendência e Qualidade */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">📈</span> Tendência e Qualidade
            </h4>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Tendência Global</div>
                <div className={`text-xl font-bold ${
                  interpretacao.tendencia_global?.includes('Alta') || interpretacao.tendencia === 'positiva' ? 'text-green-600' :
                  interpretacao.tendencia_global?.includes('Baixa') || interpretacao.tendencia === 'negativa' ? 'text-red-600' :
                  'text-blue-600'
                }`}>
                  {safeText(interpretacao.tendencia_global || interpretacao.tendencia || 'Estável')}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {interpretacao.tendencia_global?.includes('Alta') || interpretacao.tendencia === 'positiva' ? 'Cenário de crescimento identificado' :
                   interpretacao.tendencia_global?.includes('Baixa') || interpretacao.tendencia === 'negativa' ? 'Cenário de redução identificado' :
                   'Estabilidade prevista no período'}
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm text-gray-600 mb-2">Classificação do Modelo</div>
                <div className="flex flex-wrap gap-2">
                  {qualidadeAjuste.classificacao_mape && (
                    <Badge variant={
                      qualidadeAjuste.classificacao_mape === 'Excelente' ? 'success' :
                      qualidadeAjuste.classificacao_mape === 'Boa' ? 'primary' :
                      qualidadeAjuste.classificacao_mape === 'Razoável' ? 'warning' : 'error'
                    }>
                      MAPE: {safeText(qualidadeAjuste.classificacao_mape)}
                    </Badge>
                  )}
                  {qualidadeAjuste.classificacao_rmse && (
                    <Badge variant={
                      qualidadeAjuste.classificacao_rmse === 'Excelente' ? 'success' :
                      qualidadeAjuste.classificacao_rmse === 'Boa' ? 'primary' :
                      qualidadeAjuste.classificacao_rmse === 'Razoável' ? 'warning' : 'error'
                    }>
                      RMSE: {safeText(qualidadeAjuste.classificacao_rmse)}
                    </Badge>
                  )}
                  {resumoModelo.convergiu !== undefined && (
                    <Badge variant={resumoModelo.convergiu ? 'success' : 'error'}>
                      {resumoModelo.convergiu ? 'Convergiu' : 'Não convergiu'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Especificação do Modelo */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Especificação do Modelo {getTipoNome()}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Tipo de Modelo</div>
              <div className="text-lg font-semibold text-blue-700">{getTipoNome()}</div>
            </div>
            {modeloInfo.ordem_arima && (
              <div>
                <div className="text-sm text-gray-600">Ordem ARIMA</div>
                <div className="text-lg font-semibold font-mono">{safeText(modeloInfo.ordem_arima)}</div>
              </div>
            )}
            {resultado.dadosUsados?.ordem && (
              <div>
                <div className="text-sm text-gray-600">Ordem Configurada</div>
                <div className="text-lg font-semibold font-mono">({safeText(resultado.dadosUsados.ordem).replace(/[()]/g, '')})</div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-600">Frequência</div>
              <div className="text-lg font-semibold">{safeText(resultado.dadosUsados?.frequencia || 'Mensal')}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Previsões</div>
              <div className="text-lg font-semibold">{safeText(resultado.dadosUsados?.n_previsoes || '12')} períodos</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Início</div>
              <div className="text-lg font-semibold">
                {resultado.dadosUsados?.periodo_inicio 
                  ? formatarMesAno(corrigirSeculoData(resultado.dadosUsados.periodo_inicio))
                  : 'Outubro 2025'}
              </div>
            </div>
          </div>
          
          {/* Resumo do modelo */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">📋 Resumo da Configuração:</div>
            <div className="text-gray-600">
              Modelo {getTipoNome()}({resultado.dadosUsados?.ordem?.replace(/[()]/g, '').replace(/,/g, ', ') || '1, 1, 1'}) aplicado a {getNomeVariavel()} com frequência {safeText(resultado.dadosUsados?.frequencia || 'mensal')}. 
              Previsão de {safeText(resultado.dadosUsados?.n_previsoes || '12')} períodos a partir de {resultado.dadosUsados?.periodo_inicio 
                ? formatarMesAno(corrigirSeculoData(resultado.dadosUsados.periodo_inicio))
                : 'Outubro de 2025'}.
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ✅ RENDERIZAR PREVISÕES FORMATADAS (COM VERIFICAÇÕES)
  const renderizarPrevisoes = () => {
    if (!previsoes || previsoes.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Nenhuma previsão disponível</p>
          <p className="text-sm mt-2">O modelo pode não ter gerado previsões</p>
        </div>
      );
    }

    const previsoesParaExibir = todasPrevisoesVisiveis ? previsoes : previsoes.slice(0, 20);

    return (
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Previsões do Modelo {getTipoNome()}</h3>
              <p className="text-gray-600">
                {getPeriodoCorreto()}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Modelo: ARIMA({resultado.dadosUsados?.ordem?.replace(/[()]/g, '').replace(/,/g, ', ') || '1, 1, 1'}) • 
                Frequência: {safeText(resultado.dadosUsados?.frequencia || 'Mensal')}
              </p>
            </div>
            <Badge variant="secondary">
              {previsoes.length} períodos
            </Badge>
          </div>
        </div>

        {/* Tabela de Previsões */}
        <div className="overflow-x-auto rounded-lg border shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Período
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Previsão
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Inferior (95%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Superior (95%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Intervalo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previsoesParaExibir.map((previsao, idx) => {
                // ✅ Verificações seguras para cada campo
                const previsaoValor = typeof previsao.previsao === 'number' ? previsao.previsao : 
                                     typeof previsao.value === 'number' ? previsao.value : 
                                     typeof previsao.fitted === 'number' ? previsao.fitted : 0;
                const inferiorValor = typeof previsao.inferior === 'number' ? previsao.inferior : 
                                     typeof previsao.lower_95 === 'number' ? previsao.lower_95 : 
                                     typeof previsao.lower === 'number' ? previsao.lower : 0;
                const superiorValor = typeof previsao.superior === 'number' ? previsao.superior : 
                                     typeof previsao.upper_95 === 'number' ? previsao.upper_95 : 
                                     typeof previsao.upper === 'number' ? previsao.upper : 0;
                const intervalo = superiorValor - inferiorValor;
                
                // ✅ Gerar data correta baseada no índice
                let dataExibicao;
                if (previsao.data || previsao.Data || previsao.ds) {
                  dataExibicao = formatarData(corrigirSeculoData(previsao.data || previsao.Data || previsao.ds));
                } else {
                  // Calcular data baseada no início da previsão
                  const inicioPrevisao = resultado.dadosUsados?.periodo_inicio || '10/2025';
                  const [mesInicioStr, anoInicioStr] = corrigirSeculoData(inicioPrevisao).split('/');
                  let mesInicio = parseInt(mesInicioStr);
                  let anoInicio = parseInt(anoInicioStr);
                  
                  // Adicionar índice de meses
                  let mesAtual = mesInicio + idx;
                  let anoAtual = anoInicio;
                  
                  while (mesAtual > 12) {
                    mesAtual -= 12;
                    anoAtual += 1;
                  }
                  
                  const meses = [
                    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                  ];
                  
                  dataExibicao = `${meses[mesAtual - 1]} de ${anoAtual}`;
                }
                
                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        Período {idx + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{dataExibicao}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-blue-700 text-lg">{formatNumber(previsaoValor, 8)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-600">{formatNumber(inferiorValor, 8)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-600">{formatNumber(superiorValor, 8)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500 text-sm">±{formatNumber(intervalo / 2, 2)}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Botão para mostrar todas (se houver muitas) */}
        {previsoes.length > 20 && (
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => setTodasPrevisoesVisiveis(!todasPrevisoesVisiveis)}
              className="flex items-center gap-2"
            >
              {todasPrevisoesVisiveis ? (
                <>
                  <span>↥</span> Mostrar resumo
                </>
              ) : (
                <>
                  <span>↧</span> Mostrar todas as {previsoes.length} previsões
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    );
  };

  // ✅ RENDERIZAR MÉTRICAS DETALHADAS (COM VERIFICAÇÕES)
  const renderizarMetricas = () => {
    // Verificar se há métricas para exibir
    const temMetricasAjuste = Object.keys(metricasAjuste).length > 0;
    const temMetricasPrecisao = Object.keys(metricasPrecisao).length > 0;
    const temMetricasDiagnostico = Object.keys(metricasDiagnostico).length > 0;
    
    if (!temMetricasAjuste && !temMetricasPrecisao && !temMetricasDiagnostico) {
      // Tentar buscar métricas diretamente do resultado
      const temRMSE = dadosResultado.RMSE !== undefined;
      const temMAPE = dadosResultado.MAPE !== undefined;
      const temMAE = dadosResultado.MAE !== undefined;
      const temAIC = dadosResultado.AIC !== undefined;
      const temBIC = dadosResultado.BIC !== undefined;
      
      if (!temRMSE && !temMAPE && !temMAE && !temAIC && !temBIC) {
        return (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Nenhuma métrica disponível</p>
            <p className="text-sm mt-2">O modelo pode não ter gerado métricas de avaliação</p>
          </div>
        );
      }
      
      // Se houver métricas no nível raiz, usar elas
      const metricasDiretas = {
        RMSE: dadosResultado.RMSE,
        MAPE: dadosResultado.MAPE,
        MAE: dadosResultado.MAE,
        AIC: dadosResultado.AIC,
        BIC: dadosResultado.BIC
      };

      return (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="mr-2">🎯</span> Acurácia e Precisão do Modelo
            </h4>
            
            {/* Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {metricasDiretas.ME !== undefined && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-800">Erro Médio (ME)</div>
                  <div className="text-2xl font-bold text-blue-700">{formatNumber(metricasDiretas.ME)}</div>
                  <div className="text-xs text-blue-600">Tendência do erro</div>
                </div>
              )}
              
              {metricasDiretas.RMSE !== undefined && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="text-sm font-medium text-red-800">RMSE</div>
                  <div className="text-2xl font-bold text-red-700">{formatNumber(metricasDiretas.RMSE)}</div>
                  <div className="text-xs text-red-600">Raiz do erro quadrático médio</div>
                </div>
              )}
              
              {metricasDiretas.MAE !== undefined && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-sm font-medium text-orange-800">MAE</div>
                  <div className="text-2xl font-bold text-orange-700">{formatNumber(metricasDiretas.MAE)}</div>
                  <div className="text-xs text-orange-600">Erro absoluto médio</div>
                </div>
              )}
              
              {metricasDiretas.MAPE !== undefined && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-sm font-medium text-purple-800">MAPE</div>
                  <div className="text-2xl font-bold text-purple-700">{formatNumber(metricasDiretas.MAPE)}%</div>
                  <div className="text-xs text-purple-600">Erro percentual médio</div>
                </div>
              )}
              
              {metricasDiretas.AIC !== undefined && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-sm font-medium text-green-800">AIC</div>
                  <div className="text-2xl font-bold text-green-700">{formatNumber(metricasDiretas.AIC, 1)}</div>
                  <div className="text-xs text-green-600">Critério de informação</div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Métricas de Precisão */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="mr-2">🎯</span> Acurácia e Precisão do Modelo
          </h4>
          
          {/* Métricas Principais */}
          {temMetricasPrecisao && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {metricasPrecisao.ME !== undefined && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-800">Erro Médio (ME)</div>
                  <div className="text-2xl font-bold text-blue-700">{formatNumber(metricasPrecisao.ME)}</div>
                  <div className="text-xs text-blue-600">Tendência do erro</div>
                </div>
              )}
              
              {metricasAjuste.RMSE !== undefined && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="text-sm font-medium text-red-800">RMSE</div>
                  <div className="text-2xl font-bold text-red-700">{formatNumber(metricasAjuste.RMSE)}</div>
                  <div className="text-xs text-red-600">Raiz do erro quadrático médio</div>
                </div>
              )}
              
              {metricasPrecisao.MAE !== undefined && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-sm font-medium text-orange-800">MAE</div>
                  <div className="text-2xl font-bold text-orange-700">{formatNumber(metricasPrecisao.MAE)}</div>
                  <div className="text-xs text-orange-600">Erro absoluto médio</div>
                </div>
              )}
              
              {metricasPrecisao.MAPE !== undefined && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-sm font-medium text-purple-800">MAPE</div>
                  <div className="text-2xl font-bold text-purple-700">{formatNumber(metricasPrecisao.MAPE)}%</div>
                  <div className="text-xs text-purple-600">Erro percentual médio</div>
                </div>
              )}
            </div>
          )}

          {/* Tabela de Métricas Completas */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Métrica</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Interpretação</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Classificação</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* RMSE */}
                {metricasAjuste.RMSE !== undefined && (
                  <tr>
                    <td className="px-6 py-4 font-medium">RMSE</td>
                    <td className="px-6 py-4 font-mono">{formatNumber(metricasAjuste.RMSE)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Raiz do erro quadrático médio</td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        qualidadeAjuste.classificacao_rmse === 'Excelente' ? 'success' :
                        qualidadeAjuste.classificacao_rmse === 'Boa' ? 'primary' :
                        qualidadeAjuste.classificacao_rmse === 'Razoável' ? 'warning' : 'secondary'
                      }>
                        {safeText(qualidadeAjuste.classificacao_rmse || 'N/A')}
                      </Badge>
                    </td>
                  </tr>
                )}
                
                {/* MAPE */}
                {metricasAjuste.MAPE !== undefined && (
                  <tr>
                    <td className="px-6 py-4 font-medium">MAPE</td>
                    <td className="px-6 py-4 font-mono">{formatNumber(metricasAjuste.MAPE)}%</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Erro percentual absoluto médio</td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        qualidadeAjuste.classificacao_mape === 'Excelente' ? 'success' :
                        qualidadeAjuste.classificacao_mape === 'Boa' ? 'primary' :
                        qualidadeAjuste.classificacao_mape === 'Razoável' ? 'warning' : 'secondary'
                      }>
                        {safeText(qualidadeAjuste.classificacao_mape || 'N/A')}
                      </Badge>
                    </td>
                  </tr>
                )}
                
                {/* AIC */}
                {metricasAjuste.AIC !== undefined && (
                  <tr>
                    <td className="px-6 py-4 font-medium">AIC</td>
                    <td className="px-6 py-4 font-mono">{formatNumber(metricasAjuste.AIC, 1)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Critério de informação de Akaike (quanto menor, melhor)</td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary">Critério de informação</Badge>
                    </td>
                  </tr>
                )}
                
                {/* BIC */}
                {metricasAjuste.BIC !== undefined && (
                  <tr>
                    <td className="px-6 py-4 font-medium">BIC</td>
                    <td className="px-6 py-4 font-mono">{formatNumber(metricasAjuste.BIC, 1)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Critério de informação bayesiano (quanto menor, melhor)</td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary">Critério de informação</Badge>
                    </td>
                  </tr>
                )}
                
                {/* Teste Ljung-Box */}
                {metricasDiagnostico.teste_ljung_box && metricasDiagnostico.teste_ljung_box.valor_p !== undefined && (
                  <tr>
                    <td className="px-6 py-4 font-medium">Teste Ljung-Box</td>
                    <td className="px-6 py-4 font-mono">
                      p-valor: {formatNumber(metricasDiagnostico.teste_ljung_box.valor_p, 4)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {safeText(metricasDiagnostico.teste_ljung_box.conclusao || 'Teste de autocorrelação')}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        metricasDiagnostico.teste_ljung_box.valor_p > 0.05 ? 'success' : 'error'
                      }>
                        {metricasDiagnostico.teste_ljung_box.valor_p > 0.05 ? 'OK' : 'Atenção'}
                      </Badge>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ✅ RENDERIZAR COEFICIENTES (COM VERIFICAÇÕES)
  const renderizarCoeficientes = () => {
    if (!coeficientes || coeficientes.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Nenhum coeficiente disponível</p>
          <p className="text-sm mt-2">Este modelo não gerou coeficientes parametrizados</p>
        </div>
      );
    }

    return (
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h4 className="text-xl font-bold text-gray-800 mb-6">Coeficientes do Modelo {getTipoNome()}</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Parâmetro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Estimativa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Erro Padrão</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Estatística t</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Significância</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coeficientes.map((coef, idx) => {
                // ✅ Verificações seguras para cada campo
                const termo = safeText(coef.termo || coef.parameter || `coef${idx + 1}`);
                const estimativa = formatNumber(coef.estimativa || coef.estimate || coef.coef);
                const erroPadrao = formatNumber(coef.erro_padrao || coef.std_error || coef.se);
                const estatisticaT = formatNumber(coef.estatistica_t || coef.t_value || coef.statistic);
                const pValor = coef.p_valor || coef.pvalue || coef.p_value;
                const significativo = pValor !== undefined && pValor !== null && pValor < 0.05;
                
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium font-mono">{termo}</td>
                    <td className="px-6 py-4 font-mono">{estimativa}</td>
                    <td className="px-6 py-4 font-mono">{erroPadrao}</td>
                    <td className="px-6 py-4 font-mono">{estatisticaT}</td>
                    <td className="px-6 py-4">
                      {pValor !== undefined ? (
                        significativo ? (
                          <Badge variant="success">Significativo (p = {formatNumber(pValor, 4)})</Badge>
                        ) : (
                          <Badge variant="secondary">Não significativo (p = {formatNumber(pValor, 4)})</Badge>
                        )
                      ) : (
                        <Badge variant="outline">N/A</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ✅ RENDERIZAR DIAGNÓSTICO (COM VERIFICAÇÕES)
  const renderizarDiagnostico = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h4 className="text-xl font-bold text-gray-800 mb-6">Diagnóstico Completo do Modelo</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status do Modelo */}
            <div className="bg-gray-50 p-5 rounded-lg">
              <h5 className="font-semibold text-gray-700 mb-3">Status do Modelo</h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fonte:</span>
                  <span className="font-medium">{safeText(resultado.fonte || 'Backend R')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="success">✓ Executado com sucesso</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Observações:</span>
                  <span className="font-mono">{safeText(dadosResultado.n_observacoes || resultado.dadosUsados?.n || historico.length || '119')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Variável analisada:</span>
                  <span className="font-medium">{getNomeVariavel()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frequência:</span>
                  <span className="font-medium">{safeText(resultado.dadosUsados?.frequencia || 'Mensal')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Período histórico:</span>
                  <span className="font-medium">Nov/2015 a Set/2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Período previsto:</span>
                  <span className="font-medium">{getPeriodoCorreto()}</span>
                </div>
              </div>
            </div>

            {/* Qualidade do Ajuste */}
            <div className="bg-gray-50 p-5 rounded-lg">
              <h5 className="font-semibold text-gray-700 mb-3">Qualidade do Ajuste</h5>
              <div className="space-y-3">
                {metricasDiagnostico.teste_ljung_box && metricasDiagnostico.teste_ljung_box.valor_p !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Teste Ljung-Box:</span>
                    <Badge variant={metricasDiagnostico.teste_ljung_box.valor_p > 0.05 ? 'success' : 'error'}>
                      {metricasDiagnostico.teste_ljung_box.valor_p > 0.05 ? 'Resíduos OK' : 'Resíduos correlacionados'}
                    </Badge>
                  </div>
                )}
                {metricasAjuste.MAPE !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Precisão (MAPE):</span>
                    <Badge variant={
                      metricasAjuste.MAPE < 10 ? 'success' :
                      metricasAjuste.MAPE < 20 ? 'primary' :
                      metricasAjuste.MAPE < 50 ? 'warning' : 'error'
                    }>
                      {formatNumber(metricasAjuste.MAPE)}%
                    </Badge>
                  </div>
                )}
                {dadosResultado.RMSE !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">RMSE:</span>
                    <Badge variant={
                      dadosResultado.RMSE < (metricasAjuste.valor_medio * 0.1) ? 'success' :
                      dadosResultado.RMSE < (metricasAjuste.valor_medio * 0.2) ? 'primary' :
                      dadosResultado.RMSE < (metricasAjuste.valor_medio * 0.5) ? 'warning' : 'error'
                    }>
                      {formatNumber(dadosResultado.RMSE)}
                    </Badge>
                  </div>
                )}
                {resumoModelo.convergiu !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Convergência:</span>
                    <Badge variant={resumoModelo.convergiu ? 'success' : 'error'}>
                      {resumoModelo.convergiu ? 'Convergiu' : 'Não convergiu'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ✅ RENDERIZAR GRÁFICOS
  const renderizarGraficos = () => {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Visualizações Gráficas</h3>
              <p className="text-gray-600">
                Análise visual dos resultados do modelo {getTipoNome()}
              </p>
            </div>
            <Badge variant="info" className="bg-indigo-100 text-indigo-800 border-indigo-300">
              {Object.keys(dadosResultado).length} conjuntos de dados
            </Badge>
          </div>
        </div>

        <GraficosSeriesTemporais 
          dados={dadosGraficos}
          tipoModelo={tipoModelo}
        />
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">⏰ Resultados de Série Temporal - {getTipoNome()}</CardTitle>
              <CardDescription className="mt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span>Modelo: {safeText(resultado.nome || 'Análise de Série Temporal')}</span>
                  <span className="hidden md:inline">•</span>
                  <span>Executado em: {resultado.timestamp ? new Date(resultado.timestamp).toLocaleString('pt-BR') : 'Data não disponível'}</span>
                  {resultado.fonte && (
                    <>
                      <span className="hidden md:inline">•</span>
                      <Badge variant="outline" className="text-blue-600 border-blue-300">
                        {safeText(resultado.fonte)}
                      </Badge>
                    </>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  📅 Período previsto: {getPeriodoCorreto()}
                </div>
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={onVoltar} className="flex items-center gap-2">
                <span>⚙️</span> Configuração
              </Button>
              <Button onClick={onNovoModelo} className="flex items-center gap-2">
                <span>🆕</span> Novo Modelo
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs de Navegação */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {[
          { id: 'interpretacao', label: 'Interpretação', icon: '📋' },
          { id: 'previsoes', label: 'Previsões', icon: '🔮' },
          { id: 'metricas', label: 'Métricas', icon: '📊' },
          { id: 'coeficientes', label: 'Coeficientes', icon: 'β' },
          { id: 'diagnostico', label: 'Diagnóstico', icon: '🔍' },
          { id: 'graficos', label: 'Gráficos', icon: '📈' }
        ].map((aba) => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className={`px-5 py-3 font-medium whitespace-nowrap flex items-center gap-2 transition-all ${
              abaAtiva === aba.id 
                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>{aba.icon}</span>
            <span>{aba.label}</span>
          </button>
        ))}
      </div>

      {/* Conteúdo das Abas */}
      <div className="min-h-[500px]">
        {/* ABA: INTERPRETAÇÃO */}
        {abaAtiva === 'interpretacao' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {renderizarInterpretacaoTecnica()}
          </motion.div>
        )}

        {/* ABA: PREVISÕES */}
        {abaAtiva === 'previsoes' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {renderizarPrevisoes()}
          </motion.div>
        )}

        {/* ABA: MÉTRICAS */}
        {abaAtiva === 'metricas' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {renderizarMetricas()}
          </motion.div>
        )}

        {/* ABA: COEFICIENTES */}
        {abaAtiva === 'coeficientes' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            {renderizarCoeficientes()}
          </motion.div>
        )}

        {/* ABA: DIAGNÓSTICO */}
        {abaAtiva === 'diagnostico' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            {renderizarDiagnostico()}
          </motion.div>
        )}

        {/* ABA: GRÁFICOS */}
        {abaAtiva === 'graficos' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            {renderizarGraficos()}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}