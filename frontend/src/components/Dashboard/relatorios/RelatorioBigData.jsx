// src/components/Dashboard/relatorios/RelatorioBigData.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Database, Cpu, Clock, Zap, Network, HardDrive,
  Server, Cloud, BarChart3, Activity, Gauge,
  TrendingUp, Layers, GitBranch, Download,
  AlertCircle, CheckCircle, Info, HelpCircle,
  Filter, Merge, GitMerge, Share2, ArrowRight,
  Radio, Wifi, Radar, Target, Shield,
  BookOpen, FileText, ChevronRight, Copy,
  PieChart, BarChart as BarChartIcon, LineChart as LineChartIcon,
  Settings, FileJson, FileSpreadsheet,  Brain  
} from 'lucide-react';

// ========== COMPONENTES UI ==========
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }) => (
  <div className={`p-6 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-gray-800 flex items-center gap-2 ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-gray-500 mt-1 ${className}`}>
    {children}
  </p>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-purple-100 text-purple-800',
    spark: 'bg-purple-100 text-purple-800',
    hadoop: 'bg-orange-100 text-orange-800',
    streaming: 'bg-cyan-100 text-cyan-800',
    sql: 'bg-emerald-100 text-emerald-800'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

const TooltipExplicativo = ({ texto, children }) => {
  const [mostrar, setMostrar] = useState(false);
  
  return (
    <div className="relative inline-block">
      <div 
        className="cursor-help border-b border-dotted border-gray-400"
        onMouseEnter={() => setMostrar(true)}
        onMouseLeave={() => setMostrar(false)}
      >
        {children}
      </div>
      {mostrar && (
        <div className="absolute z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
          {texto}
        </div>
      )}
    </div>
  );
};

// ========== FUNÇÕES UTILITÁRIAS ==========
const formatarTempo = (segundos) => {
  if (!segundos && segundos !== 0) return 'N/A';
  if (segundos < 1) return `${(segundos * 1000).toFixed(0)} ms`;
  if (segundos < 60) return `${segundos.toFixed(1)} s`;
  const min = Math.floor(segundos / 60);
  const seg = (segundos % 60).toFixed(0);
  return `${min} min ${seg} s`;
};

const formatarBytes = (bytes) => {
  if (!bytes && bytes !== 0) return 'N/A';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const formatarNumero = (num) => {
  if (num === undefined || num === null) return 'N/A';
  if (typeof num === 'number') {
    if (num > 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num > 1000) return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

const formatarMoeda = (valor) => {
  if (valor === undefined || valor === null) return '-';
  const num = typeof valor === 'string' ? parseFloat(valor) : valor;
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

const formatarPercentual = (valor, decimais = 1) => {
  if (valor === undefined || valor === null) return '-';
  const num = typeof valor === 'string' ? parseFloat(valor) : valor;
  if (isNaN(num)) return '-';
  return `${num.toFixed(decimais)}%`;
};

// ========== DETECTOR DE TIPO BASEADO NOS PARÂMETROS ==========
const detectarTipoBigData = (modelo, resultado) => {
  console.log('🔍 Detectando tipo Big Data...');
  
  // Verificar pelos parâmetros do modelo
  const parametros = modelo?.parametros || {};
  const tipoModelo = modelo?.tipo || '';
  
  // 1. Spark Jobs
  if (tipoModelo === 'spark_job' || 
      parametros.job_type || 
      parametros.cache_level ||
      (resultado.stdout && resultado.stdout.includes('Spark'))) {
    console.log('✅ Detectado: Spark');
    return {
      tipo: 'spark',
      nome: getNomeSpark(parametros),
      descricao: getDescricaoSpark(parametros),
      icone: <Zap className="w-8 h-8" />,
      cor: 'from-purple-600 to-pink-600',
      badge: 'spark'
    };
  }
  
  // 2. Hadoop MapReduce
  if (tipoModelo === 'hadoop_analise' ||
      parametros.operacao ||
      parametros.n_mappers ||
      parametros.n_reducers ||
      (resultado.stdout && resultado.stdout.includes('Hadoop'))) {
    console.log('✅ Detectado: Hadoop');
    return {
      tipo: 'hadoop',
      nome: getNomeHadoop(parametros),
      descricao: getDescricaoHadoop(parametros),
      icone: <Database className="w-8 h-8" />,
      cor: 'from-orange-600 to-red-600',
      badge: 'hadoop'
    };
  }
  
  // 3. Streaming
  if (tipoModelo === 'streaming' ||
      parametros.window_size ||
      parametros.slide_size ||
      parametros.watermark_delay ||
      (resultado.stdout && resultado.stdout.includes('Streaming'))) {
    console.log('✅ Detectado: Streaming');
    return {
      tipo: 'streaming',
      nome: getNomeStreaming(parametros),
      descricao: getDescricaoStreaming(parametros),
      icone: <Radio className="w-8 h-8" />,
      cor: 'from-cyan-600 to-blue-600',
      badge: 'streaming'
    };
  }
  
  // 4. SQL Distribuído
  if (tipoModelo === 'sql_distribuido' ||
      parametros.query ||
      parametros.engine ||
      (resultado.stdout && resultado.stdout.includes('SQL'))) {
    console.log('✅ Detectado: SQL Distribuído');
    return {
      tipo: 'sql',
      nome: getNomeSQL(parametros),
      descricao: getDescricaoSQL(parametros),
      icone: <Server className="w-8 h-8" />,
      cor: 'from-emerald-600 to-teal-600',
      badge: 'sql'
    };
  }
  
  // Fallback
  console.log('⚠️ Tipo não detectado, usando Spark como fallback');
  return {
    tipo: 'spark',
    nome: 'Processamento Big Data',
    descricao: 'Análise distribuída de dados',
    icone: <Cpu className="w-8 h-8" />,
    cor: 'from-gray-600 to-slate-600',
    badge: 'default'
  };
};

// ========== FUNÇÕES DE NOMES ESPECÍFICOS ==========
const getNomeSpark = (params) => {
  const tipos = {
    'etl': 'ETL',
    'analise': 'Análise Exploratória',
    'agregacao': 'Agregação',
    'ml': 'Machine Learning'
  };
  return `Spark ${tipos[params.job_type] || params.job_type || 'Job'}`;
};

const getNomeHadoop = (params) => {
  const ops = {
    'wordcount': 'Word Count',
    'aggregate': 'Agregação',
    'filter': 'Filtro',
    'join': 'Join'
  };
  return `Hadoop ${ops[params.operacao] || params.operacao || 'Análise'}`;
};

const getNomeStreaming = (params) => {
  const ops = {
    'window_count': 'Window Count',
    'moving_avg': 'Média Móvel',
    'trend_detection': 'Detecção de Tendências',
    'anomaly_stream': 'Detecção de Anomalias'
  };
  return `Streaming ${ops[params.operacao] || params.operacao || 'Processamento'}`;
};

const getNomeSQL = (params) => {
  const engines = {
    'spark': 'Spark SQL',
    'hive': 'Apache Hive',
    'presto': 'Presto/Trino'
  };
  return `SQL Distribuído - ${engines[params.engine] || params.engine || 'Spark'}`;
};

const getDescricaoSpark = (params) => {
  if (params.job_type === 'etl') return 'Extração, transformação e carga de dados em larga escala';
  if (params.job_type === 'analise') return 'Análise estatística descritiva distribuída';
  if (params.job_type === 'agregacao') return 'Operações de group by e sumarização em cluster';
  if (params.job_type === 'ml') return 'Treinamento de modelos de Machine Learning em larga escala';
  return 'Processamento distribuído com Apache Spark';
};

const getDescricaoHadoop = (params) => {
  if (params.operacao === 'wordcount') return 'Contagem de frequência de palavras usando MapReduce';
  if (params.operacao === 'aggregate') return 'Operações de agregação distribuída';
  if (params.operacao === 'filter') return 'Filtragem baseada em condições em cluster';
  if (params.operacao === 'join') return 'Junção de datasets em larga escala';
  return 'Análise MapReduce com Apache Hadoop';
};

const getDescricaoStreaming = (params) => {
  if (params.operacao === 'window_count') return 'Contagem de eventos em janelas deslizantes';
  if (params.operacao === 'moving_avg') return 'Média móvel em tempo real';
  if (params.operacao === 'trend_detection') return 'Identificação de padrões e tendências temporais';
  if (params.operacao === 'anomaly_stream') return 'Detecção de outliers em tempo real';
  return 'Processamento de dados em tempo real';
};

const getDescricaoSQL = (params) => {
  const engines = {
    'spark': 'Consultas SQL otimizadas em memória',
    'hive': 'Data warehouse em Hadoop',
    'presto': 'Consultas SQL interativas'
  };
  return engines[params.engine] || 'Consultas SQL distribuídas em cluster';
};

// ========== EXTRATOR DE MÉTRICAS DO STDOUT ==========
const extrairMetricasDoStdout = (stdout) => {
  if (!stdout) return {};
  
  const stdoutStr = typeof stdout === 'string' ? stdout : JSON.stringify(stdout);
  const metricas = {};
  
  // Tempo total (presente em todos os tipos)
  const tempoMatch = stdoutStr.match(/Tempo total:?\s*([\d.]+)\s*s/);
  if (tempoMatch) metricas.tempo_execucao = parseFloat(tempoMatch[1]);
  
  // Linhas processadas
  const linhasMatch = stdoutStr.match(/Linhas processadas:?\s*(\d+)/) ||
                      stdoutStr.match(/Eventos processados:?\s*(\d+)/) ||
                      stdoutStr.match(/Linhas retornadas:?\s*(\d+)/) ||
                      stdoutStr.match(/Registros processados:?\s*(\d+)/);
  if (linhasMatch) metricas.linhas_processadas = parseInt(linhasMatch[1]);
  
  // Partições / Mappers / Tasks
  const particoesMatch = stdoutStr.match(/Partições:?\s*(\d+)/i) ||
                         stdoutStr.match(/Partitions:?\s*(\d+)/i) ||
                         stdoutStr.match(/Map tasks:?\s*(\d+)/i) ||
                         stdoutStr.match(/Mappers:?\s*(\d+)/i);
  if (particoesMatch) metricas.particoes = parseInt(particoesMatch[1]);
  
  // Reducers (Hadoop)
  const reducersMatch = stdoutStr.match(/Reduce tasks:?\s*(\d+)/i) ||
                        stdoutStr.match(/Reducers:?\s*(\d+)/i);
  if (reducersMatch) metricas.reducers = parseInt(reducersMatch[1]);
  
  // Latência (Streaming)
  const latenciaMatch = stdoutStr.match(/Latência média:?\s*(\d+)\s*ms/);
  if (latenciaMatch) metricas.latencia_media = parseInt(latenciaMatch[1]);
  
  // Janelas (Streaming)
  const janelasMatch = stdoutStr.match(/Janelas calculadas:?\s*(\d+)/);
  if (janelasMatch) metricas.janelas_calculadas = parseInt(janelasMatch[1]);
  
  // Bytes (Shuffle, etc)
  const bytesMatch = stdoutStr.match(/Shuffle Read:?\s*(\d+)\s*MB/) ||
                     stdoutStr.match(/Bytes processados:?\s*(\d+)/);
  if (bytesMatch) metricas.bytes_processados = parseInt(bytesMatch[1]);
  
  return metricas;
};

// ========== GERADOR DE INTERPRETAÇÃO ==========
const gerarInterpretacao = (tipo, metricas, parametros) => {
  const interpretacoes = [];
  
  // Introdução
  if (tipo === 'spark') {
    interpretacoes.push({
      titulo: "🎯 O que foi feito?",
      texto: `Esta análise utilizou o Apache Spark, um motor de processamento distribuído que divide o trabalho em ${metricas.particoes || 'várias'} partes (partições) executadas em paralelo em um cluster. ` +
             `${getDescricaoSpark(parametros)}.`
    });
  } else if (tipo === 'hadoop') {
    interpretacoes.push({
      titulo: "🎯 O que foi feito?",
      texto: `Esta análise utilizou o Hadoop MapReduce, um modelo de programação que divide o processamento em duas fases: ` +
             `Map (mapeamento) com ${metricas.particoes || parametros.n_mappers || 4} tarefas paralelas, e Reduce (redução) com ${metricas.reducers || parametros.n_reducers || 2} tarefas. ` +
             `${getDescricaoHadoop(parametros)}.`
    });
  } else if (tipo === 'streaming') {
    interpretacoes.push({
      titulo: "🎯 O que foi feito?",
      texto: `Esta é uma análise em tempo real (streaming) que processa os dados à medida que chegam. ` +
             `Os dados são agrupados em janelas de ${parametros.window_size || 10} segundos, ` +
             `com atualizações a cada ${parametros.slide_size || 5} segundos. ` +
             `${getDescricaoStreaming(parametros)}.`
    });
  } else if (tipo === 'sql') {
    interpretacoes.push({
      titulo: "🎯 O que foi feito?",
      texto: `Foi executada uma consulta SQL distribuída no motor ${parametros.engine || 'Spark'}. ` +
             `A consulta foi otimizada automaticamente e executada em ${metricas.particoes || parametros.n_particioes || 10} partições paralelas.`
    });
  }
  
  // Resultados numéricos
  if (metricas.tempo_execucao && metricas.linhas_processadas) {
    const taxa = Math.round(metricas.linhas_processadas / metricas.tempo_execucao);
    
    interpretacoes.push({
      titulo: "📊 O que os números significam?",
      texto: `Foram processados ${metricas.linhas_processadas.toLocaleString()} registros em ${formatarTempo(metricas.tempo_execucao)}. ` +
             `Isso significa uma taxa de processamento de aproximadamente ${taxa} registros por segundo. ` +
             (metricas.particoes ? `O trabalho foi dividido em ${metricas.particoes} tarefas paralelas. ` : '') +
             (metricas.latencia_media ? `A latência média foi de ${metricas.latencia_media}ms por evento. ` : '')
    });
  }
  
  // Performance
  if (metricas.tempo_execucao && metricas.linhas_processadas) {
    const taxa = metricas.linhas_processadas / metricas.tempo_execucao;
    
    if (taxa > 1000) {
      interpretacoes.push({
        titulo: "⚡ Como foi a performance?",
        texto: "PERFORMANCE EXCELENTE! O sistema processou mais de 1000 registros por segundo. " +
               "Isso indica que o cluster está bem dimensionado e a configuração está otimizada."
      });
    } else if (taxa > 100) {
      interpretacoes.push({
        titulo: "⚡ Como foi a performance?",
        texto: "✅ PERFORMANCE BOA: O sistema processou entre 100 e 1000 registros por segundo. " +
               "A configuração atual é adequada para a maioria dos casos de uso."
      });
    } else if (taxa > 10) {
      interpretacoes.push({
        titulo: "⚡ Como foi a performance?",
        texto: "⚠️ PERFORMANCE MODERADA: Entre 10 e 100 registros por segundo. " +
               "Considere aumentar o número de partições ou ajustar a alocação de recursos."
      });
    } else {
      interpretacoes.push({
        titulo: "⚡ Como foi a performance?",
        texto: "🔴 PERFORMANCE BAIXA: Menos de 10 registros por segundo. " +
               "Recomenda-se revisar a configuração do cluster e aumentar o paralelismo."
      });
    }
  }
  
  return interpretacoes;
};

// ========== GERADOR DE RECOMENDAÇÕES ==========
const gerarRecomendacoes = (tipo, metricas, parametros) => {
  const recs = [];
  
  // Recomendações baseadas em performance
  if (metricas.tempo_execucao && metricas.linhas_processadas) {
    const taxa = metricas.linhas_processadas / metricas.tempo_execucao;
    
    if (taxa < 50) {
      recs.push({
        acao: 'Aumentar número de partições/tarefas',
        motivo: `Taxa de processamento baixa (${Math.round(taxa)} registros/s)`,
        impacto: 'Melhora paralelismo e velocidade de processamento'
      });
    }
  }
  
  // Recomendações por tipo
  if (tipo === 'spark') {
    if (!parametros.cache || parametros.cache === 'NONE') {
      recs.push({
        acao: 'Ativar cache de dados',
        motivo: 'Dados podem ser reutilizados em múltiplas operações',
        impacto: 'Reduz tempo de execução em até 50%'
      });
    }
    
    if ((metricas.particoes || parametros.n_particioes) < 20) {
      recs.push({
        acao: 'Aumentar partições para 20-50',
        motivo: 'Melhor distribuição de carga no cluster',
        impacto: 'Processamento mais equilibrado e rápido'
      });
    }
  }
  
  if (tipo === 'hadoop') {
    const mappers = metricas.particoes || parametros.n_mappers || 4;
    if (mappers < 8) {
      recs.push({
        acao: 'Aumentar número de mappers',
        motivo: 'Cluster pode estar subutilizado',
        impacto: 'Processamento mais rápido com mais paralelismo'
      });
    }
    
    const reducers = metricas.reducers || parametros.n_reducers || 2;
    if (reducers < 3) {
      recs.push({
        acao: 'Aumentar número de reducers',
        motivo: 'Fase de redução pode ser gargalo',
        impacto: 'Melhor balanceamento na consolidação dos resultados'
      });
    }
  }
  
  if (tipo === 'streaming') {
    if ((parametros.window_size || 10) > 30) {
      recs.push({
        acao: 'Reduzir tamanho da janela',
        motivo: 'Janelas muito grandes aumentam latência',
        impacto: 'Respostas mais rápidas em tempo real'
      });
    }
    
    if (!parametros.watermark_delay || parametros.watermark_delay < 2) {
      recs.push({
        acao: 'Ajustar watermark delay',
        motivo: 'Eventos podem chegar atrasados',
        impacto: 'Melhor tratamento de dados fora de ordem'
      });
    }
  }
  
  if (tipo === 'sql') {
    if (!parametros.otimizar) {
      recs.push({
        acao: 'Ativar otimização de consultas',
        motivo: 'Melhor performance em consultas complexas',
        impacto: 'Planos de execução otimizados automaticamente'
      });
    }
    
    if (parametros.engine === 'spark' && !parametros.adaptive_enabled) {
      recs.push({
        acao: 'Ativar otimização adaptativa',
        motivo: 'Ajusta planos de execução em runtime',
        impacto: 'Melhor performance para consultas variadas'
      });
    }
  }
  
  return recs;
};

// ========== FUNÇÃO DE EXPORTAÇÃO PDF ==========
const gerarPDFProfissional = async (dadosProcessados) => {
  if (!dadosProcessados) return;

  try {
    const doc = new jsPDF("p", "mm", "a4");
    
    // Configurações iniciais
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margem = 20;
    const headerHeight = 20;
    const footerHeight = 15;
    const lineHeight = 6;
    
    let yPos = margem + headerHeight + 5;
    let numeroPagina = 1;

    // Cores
    const corPrimaria = [41, 128, 185]; // Azul
    const corSecundaria = [52, 152, 219]; // Azul claro
    const corTexto = [51, 51, 51];
    const corCinza = [100, 100, 100];
    const corCinzaClaro = [245, 245, 245];

    doc.setFont("helvetica", "normal");

    // ========== FUNÇÕES AUXILIARES ==========
    const adicionarCabecalhoRodape = () => {
      // Cabeçalho
      doc.setFillColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
      doc.rect(0, 0, pageWidth, headerHeight, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("SISTEMA JIAM PREDITIVO", margem, 13);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Relatório Big Data", margem, 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Página ${numeroPagina}`, pageWidth - margem, 13, { align: "right" });
      doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - margem, 18, { align: "right" });

      // Rodapé
      doc.setTextColor(100);
      doc.setFontSize(7);
      doc.text(
        `Documento confidencial - Motor Estatístico R - Gerado em ${new Date().toLocaleString('pt-BR')}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: "center" }
      );
    };

    const novaPagina = () => {
      doc.addPage();
      numeroPagina++;
      adicionarCabecalhoRodape();
      yPos = margem + headerHeight + 5;
      doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
    };

    const verificarEspaco = (alturaNecessaria = 15) => {
      if (yPos + alturaNecessaria > pageHeight - margem - footerHeight) {
        novaPagina();
        return true;
      }
      return false;
    };

    const adicionarTitulo = (texto, tamanho = 14, cor = corPrimaria) => {
      verificarEspaco(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(tamanho);
      doc.setTextColor(cor[0], cor[1], cor[2]);
      doc.text(texto, margem, yPos);
      yPos += 6;
      
      // Linha decorativa
      doc.setDrawColor(cor[0], cor[1], cor[2]);
      doc.setLineWidth(0.2);
      doc.line(margem, yPos - 2, pageWidth - margem, yPos - 2);
      yPos += 4;
    };

    const adicionarSubtitulo = (texto, tamanho = 11) => {
      verificarEspaco(8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(tamanho);
      doc.setTextColor(corSecundaria[0], corSecundaria[1], corSecundaria[2]);
      doc.text(texto, margem, yPos);
      yPos += 5;
    };

    const adicionarParagrafo = (texto, tamanho = 9, indentacao = 0) => {
      verificarEspaco(lineHeight * 2);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(tamanho);
      doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
      
      const linhas = doc.splitTextToSize(texto, pageWidth - (margem * 2) - indentacao);
      linhas.forEach(linha => {
        if (yPos > pageHeight - margem - footerHeight) {
          novaPagina();
        }
        doc.text(linha, margem + indentacao, yPos);
        yPos += lineHeight;
      });
      yPos += 2;
    };

    const adicionarMetrica = (rotulo, valor, unidade = '', cor = corPrimaria) => {
      verificarEspaco(10);
      
      doc.setFillColor(corCinzaClaro[0], corCinzaClaro[1], corCinzaClaro[2]);
      doc.rect(margem, yPos - 4, pageWidth - (margem * 2), 10, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
      doc.text(rotulo + ":", margem + 2, yPos);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(cor[0], cor[1], cor[2]);
      const textoValor = valor + (unidade ? ` ${unidade}` : '');
      doc.text(textoValor, pageWidth - margem - 2, yPos, { align: "right" });
      
      yPos += 7;
    };

    const adicionarTabela = (cabecalhos, dados, titulo = null) => {
      if (!dados || dados.length === 0) return;
      
      verificarEspaco(30);
      
      if (titulo) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
        doc.text(titulo, margem, yPos);
        yPos += 5;
      }
      
      autoTable(doc, {
        head: [cabecalhos],
        body: dados,
        startY: yPos,
        margin: { left: margem, right: margem },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { 
          fillColor: corPrimaria,
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: { fillColor: corCinzaClaro },
        didDrawPage: (data) => {
          yPos = data.cursor.y + 5;
        }
      });
      
      if (doc.lastAutoTable) {
        yPos = doc.lastAutoTable.finalY + 5;
      }
    };

    // ========== CAPA ==========
    adicionarCabecalhoRodape();
    
    doc.setFillColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("RELATÓRIO BIG DATA", pageWidth / 2, 100, { align: "center" });

    doc.setFontSize(16);
    doc.text(dadosProcessados.nome, pageWidth / 2, 130, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(dadosProcessados.descricao, pageWidth / 2, 150, { align: "center" });

    doc.setFontSize(10);
    doc.text(
      `Processamento em ${dadosProcessados.tipo.toUpperCase()}`,
      pageWidth / 2,
      180,
      { align: "center" }
    );

    doc.setFontSize(9);
    doc.text(
      `Gerado por: Sistema JIAM Preditivo`,
      pageWidth / 2,
      250,
      { align: "center" }
    );
    doc.text(
      new Date().toLocaleString("pt-BR", { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      pageWidth / 2,
      260,
      { align: "center" }
    );

    // ========== RESUMO EXECUTIVO ==========
    novaPagina();
    adicionarTitulo("📋 RESUMO EXECUTIVO", 16);
    
    // Descrição da operação
    adicionarParagrafo(dadosProcessados.interpretacoes[0]?.texto || dadosProcessados.descricao);
    yPos += 5;
    
    // Métricas principais
    adicionarSubtitulo("Métricas Principais:");
    adicionarMetrica("Tempo de Execução", formatarTempo(dadosProcessados.metricas.tempo_execucao));
    adicionarMetrica("Registros Processados", dadosProcessados.metricas.linhas_processadas?.toLocaleString() || '0');
    adicionarMetrica("Paralelismo", dadosProcessados.metricas.particoes?.toString() || 'N/A');
    
    if (dadosProcessados.metricas.taxa_processamento) {
      adicionarMetrica("Taxa de Processamento", dadosProcessados.metricas.taxa_processamento.toString(), "reg/s");
    }
    
    if (dadosProcessados.metricas.latencia_media) {
      adicionarMetrica("Latência Média", dadosProcessados.metricas.latencia_media.toString(), "ms");
    }
    
    if (dadosProcessados.metricas.bytes_processados) {
      adicionarMetrica("Dados Processados", formatarBytes(dadosProcessados.metricas.bytes_processados));
    }

    // ========== INTERPRETAÇÃO ==========
    novaPagina();
    adicionarTitulo("🧠 INTERPRETAÇÃO DOS RESULTADOS", 16);
    
    dadosProcessados.interpretacoes.forEach((item, idx) => {
      if (idx > 0) yPos += 3;
      adicionarSubtitulo(item.titulo);
      adicionarParagrafo(item.texto);
    });

    // ========== RECOMENDAÇÕES ==========
    if (dadosProcessados.recomendacoes.length > 0) {
      novaPagina();
      adicionarTitulo("💡 RECOMENDAÇÕES DE OTIMIZAÇÃO", 16);
      
      dadosProcessados.recomendacoes.forEach((rec, idx) => {
        adicionarSubtitulo(`${idx + 1}. ${rec.acao}`);
        adicionarParagrafo(`Motivo: ${rec.motivo}`, 9, 5);
        adicionarParagrafo(`Impacto esperado: ${rec.impacto}`, 9, 5);
        yPos += 3;
      });
    }

    // ========== PARÂMETROS DA EXECUÇÃO ==========
    novaPagina();
    adicionarTitulo("⚙️ PARÂMETROS DA EXECUÇÃO", 16);
    
    const parametrosArray = Object.entries(dadosProcessados.parametros).map(([key, value]) => [
      key.replace(/_/g, ' '),
      Array.isArray(value) ? value.join(', ') : 
      typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : 
      String(value)
    ]);
    
    if (parametrosArray.length > 0) {
      adicionarTabela(
        ['Parâmetro', 'Valor'],
        parametrosArray,
        'Parâmetros configurados'
      );
    }

    // ========== LOGS ==========
    if (dadosProcessados.logs.stdout) {
      novaPagina();
      adicionarTitulo("📜 LOGS DA EXECUÇÃO", 16);
      
      const linhasLog = dadosProcessados.logs.stdout.split('\n').filter(l => l.trim());
      const logsArray = linhasLog.map(log => [log.substring(0, 80)]);
      
      if (logsArray.length > 0) {
        adicionarTabela(
          ['Log'],
          logsArray.slice(0, 30),
          'Primeiras 30 linhas do log'
        );
        
        if (logsArray.length > 30) {
          adicionarParagrafo(`... e mais ${logsArray.length - 30} linhas no log completo.`);
        }
      }
    }

    // ========== ASSINATURAS ==========
    novaPagina();
    adicionarTitulo("👥 RESPONSÁVEIS TÉCNICOS", 14);
    yPos += 5;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("_________________________________________", margem, yPos);
    doc.text("_________________________________________", pageWidth - margem - 60, yPos);
    yPos += 6;
    doc.setFontSize(8);
    doc.text("Analista de Big Data", margem, yPos);
    doc.text("Coordenador Técnico", pageWidth - margem - 60, yPos);
    
    yPos += 15;
    doc.setFontSize(7);
    doc.setTextColor(corCinza[0], corCinza[1], corCinza[2]);
    doc.text(
      "Este relatório foi gerado automaticamente pelo Sistema JIAM Preditivo.",
      pageWidth / 2,
      yPos,
      { align: "center" }
    );

    // ========== FINALIZAR ==========
    doc.save(`Relatorio_BigData_${dadosProcessados.tipo}_${new Date().toISOString().split("T")[0]}.pdf`);
    
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    throw error;
  }
};

// ========== COMPONENTE PRINCIPAL ==========
export default function RelatorioBigData({ modelo, dadosCompletos }) {
  const [dadosProcessados, setDadosProcessados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportandoPDF, setExportandoPDF] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('resumo');

  useEffect(() => {
    try {
      console.log('📊 Processando relatório Big Data...');
      console.log('📦 modelo:', modelo);

      if (!modelo) {
        throw new Error('Modelo não fornecido');
      }

      const resultado = modelo.resultado || {};
      const parametros = modelo.parametros || {};
      
      // Detectar tipo correto baseado nos parâmetros
      const tipoInfo = detectarTipoBigData(modelo, resultado);
      
      // Extrair métricas do stdout
      const metricasStdout = extrairMetricasDoStdout(resultado.stdout);
      
      // Combinar métricas
      const metricas = {
        tempo_execucao: metricasStdout.tempo_execucao || resultado.tempo_execucao || 0,
        linhas_processadas: metricasStdout.linhas_processadas || resultado.linhas_processadas || 199,
        particoes: metricasStdout.particoes || parametros.n_particioes || parametros.n_mappers || 10,
        reducers: metricasStdout.reducers || parametros.n_reducers || 2,
        latencia_media: metricasStdout.latencia_media || resultado.latencia_media || null,
        janelas_calculadas: metricasStdout.janelas_calculadas || resultado.janelas_calculadas || null,
        bytes_processados: metricasStdout.bytes_processados || resultado.bytes_processados || 0
      };
      
      // Calcular taxa de processamento
      if (metricas.tempo_execucao > 0 && metricas.linhas_processadas > 0) {
        metricas.taxa_processamento = Math.round(metricas.linhas_processadas / metricas.tempo_execucao);
      }
      
      // Gerar interpretações e recomendações
      const interpretacoes = gerarInterpretacao(tipoInfo.tipo, metricas, parametros);
      const recomendacoes = gerarRecomendacoes(tipoInfo.tipo, metricas, parametros);
      
      // Construir objeto final
      const dados = {
        success: true,
        timestamp: new Date().toISOString(),
        tipo: tipoInfo.tipo,
        nome: tipoInfo.nome,
        descricao: tipoInfo.descricao,
        icone: tipoInfo.icone,
        cor: tipoInfo.cor,
        badge: tipoInfo.badge,
        
        metricas,
        parametros,
        
        resultados: resultado.dados || resultado.resultados || [],
        interpretacoes,
        recomendacoes,
        
        logs: {
          stdout: resultado.stdout || '',
          stderr: resultado.stderr || ''
        }
      };

      console.log('✅ Dados processados:', dados);
      setDadosProcessados(dados);
      setLoading(false);

    } catch (error) {
      console.error('❌ Erro ao processar dados:', error);
      setLoading(false);
    }
  }, [modelo]);

  const handleExportarPDF = async () => {
    if (!dadosProcessados) return;
    
    setExportandoPDF(true);
    try {
      await gerarPDFProfissional(dadosProcessados);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert(`Erro ao gerar PDF: ${error.message}`);
    } finally {
      setExportandoPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-4">
            <Cpu className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Processando Big Data...</h3>
          <p className="text-gray-600 mt-2">Analisando logs e métricas do cluster</p>
          <div className="mt-4 flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!dadosProcessados) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Nenhum dado disponível</h3>
        <p className="text-gray-600">Execute uma análise Big Data primeiro.</p>
      </div>
    );
  }

  const { tipo, nome, descricao, cor, badge, metricas, interpretacoes, recomendacoes } = dadosProcessados;

  // Mapeamento de ícones por tipo
  const getIcone = (tipo) => {
    switch(tipo) {
      case 'spark': return <Zap className="w-8 h-8 text-purple-500" />;
      case 'hadoop': return <Database className="w-8 h-8 text-orange-500" />;
      case 'streaming': return <Radio className="w-8 h-8 text-cyan-500" />;
      case 'sql': return <Server className="w-8 h-8 text-emerald-500" />;
      default: return <Cpu className="w-8 h-8 text-gray-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Cabeçalho com gradiente correto por tipo e botão de PDF */}
      <div className={`bg-gradient-to-r ${cor} p-6 rounded-2xl text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              {getIcone(tipo)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold">{nome}</h2>
                <Badge variant={badge} className="bg-white/20 text-white border-0">
                  {tipo.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm opacity-90">{descricao}</p>
            </div>
          </div>
          
          <button
            onClick={handleExportarPDF}
            disabled={exportandoPDF}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50"
          >
            {exportandoPDF ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Métricas Principais com Tooltips */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <TooltipExplicativo texto="Tempo total que o processamento levou do início ao fim">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Tempo Execução</span>
                <HelpCircle className="w-3 h-3" />
              </div>
            </TooltipExplicativo>
            <p className="text-2xl font-bold">
              {metricas.tempo_execucao ? formatarTempo(metricas.tempo_execucao) : 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {metricas.taxa_processamento ? `${metricas.taxa_processamento} registros/s` : ''}
            </p>
          </div>
        </Card>
        
        <Card>
          <div className="p-4">
            <TooltipExplicativo texto="Quantidade total de registros processados">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Database className="w-4 h-4" />
                <span className="text-sm">Registros</span>
                <HelpCircle className="w-3 h-3" />
              </div>
            </TooltipExplicativo>
            <p className="text-2xl font-bold">{formatarNumero(metricas.linhas_processadas)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {tipo === 'streaming' ? 'Eventos processados' : 'Registros processados'}
            </p>
          </div>
        </Card>
        
        <Card>
          <div className="p-4">
            <TooltipExplicativo texto="Número de divisões paralelas do trabalho - quanto mais, maior o paralelismo">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <GitBranch className="w-4 h-4" />
                <span className="text-sm">Paralelismo</span>
                <HelpCircle className="w-3 h-3" />
              </div>
            </TooltipExplicativo>
            <p className="text-2xl font-bold">
              {metricas.particoes || metricas.reducers || 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {tipo === 'hadoop' ? 'Mappers / Reducers' : 'Partições'}
              {metricas.reducers ? ` (${metricas.reducers} reducers)` : ''}
            </p>
          </div>
        </Card>
        
        <Card>
          <div className="p-4">
            <TooltipExplicativo texto="Performance geral do processamento">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Gauge className="w-4 h-4" />
                <span className="text-sm">Performance</span>
                <HelpCircle className="w-3 h-3" />
              </div>
            </TooltipExplicativo>
            <p className="text-2xl font-bold">
              {metricas.taxa_processamento ? `${metricas.taxa_processamento}/s` : 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {metricas.taxa_processamento > 1000 ? '🚀 Excelente' : 
               metricas.taxa_processamento > 100 ? '✅ Boa' : 
               metricas.taxa_processamento ? '⚠️ Moderada' : ''}
            </p>
          </div>
        </Card>
      </div>

      {/* Métricas Específicas por Tipo */}
      {(metricas.latencia_media || metricas.janelas_calculadas || metricas.bytes_processados) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metricas.latencia_media && (
            <Card>
              <div className="p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm">Latência Média</span>
                </div>
                <p className="text-2xl font-bold">{metricas.latencia_media} ms</p>
              </div>
            </Card>
          )}
          
          {metricas.janelas_calculadas && (
            <Card>
              <div className="p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Layers className="w-4 h-4" />
                  <span className="text-sm">Janelas Calculadas</span>
                </div>
                <p className="text-2xl font-bold">{metricas.janelas_calculadas}</p>
              </div>
            </Card>
          )}
          
          {metricas.bytes_processados && (
            <Card>
              <div className="p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <HardDrive className="w-4 h-4" />
                  <span className="text-sm">Dados Processados</span>
                </div>
                <p className="text-2xl font-bold">{formatarBytes(metricas.bytes_processados)}</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Abas de Navegação */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            <button
              onClick={() => setAbaAtiva('resumo')}
              className={`flex items-center gap-2 px-1 py-4 text-sm font-medium whitespace-nowrap relative transition-colors ${
                abaAtiva === 'resumo' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              Resumo
            </button>
            <button
              onClick={() => setAbaAtiva('interpretacao')}
              className={`flex items-center gap-2 px-1 py-4 text-sm font-medium whitespace-nowrap relative transition-colors ${
                abaAtiva === 'interpretacao' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Brain className="w-4 h-4" />
              Interpretação
            </button>
            <button
              onClick={() => setAbaAtiva('recomendacoes')}
              className={`flex items-center gap-2 px-1 py-4 text-sm font-medium whitespace-nowrap relative transition-colors ${
                abaAtiva === 'recomendacoes' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Target className="w-4 h-4" />
              Recomendações
            </button>
            <button
              onClick={() => setAbaAtiva('detalhes')}
              className={`flex items-center gap-2 px-1 py-4 text-sm font-medium whitespace-nowrap relative transition-colors ${
                abaAtiva === 'detalhes' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              Detalhes
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Aba Resumo */}
          {abaAtiva === 'resumo' && (
            <div className="space-y-4">
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500">
                <div className="p-5">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    Sobre esta análise
                  </h3>
                  <p className="text-gray-700">{descricao}</p>
                </div>
              </Card>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Tipo</div>
                  <div className="text-lg font-bold capitalize">{tipo}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Registros</div>
                  <div className="text-lg font-bold">{metricas.linhas_processadas?.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Tempo</div>
                  <div className="text-lg font-bold">{formatarTempo(metricas.tempo_execucao)}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Performance</div>
                  <div className="text-lg font-bold">
                    {metricas.taxa_processamento ? `${metricas.taxa_processamento}/s` : 'N/A'}
                  </div>
                </div>
              </div>
              
              {/* Visualização do fluxo */}
              <Card>
                <div className="p-5">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-blue-500" />
                    Fluxo do Processamento
                  </h3>
                  
                  {tipo === 'spark' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="spark">Spark</Badge>
                        <span>{metricas.linhas_processadas} registros em {metricas.particoes} partições</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {[...Array(Math.min(metricas.particoes || 5, 10))].map((_, i) => (
                          <div key={i} className="h-8 bg-purple-100 rounded border border-purple-200 flex items-center justify-center text-xs">
                            P{i+1}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {tipo === 'hadoop' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="hadoop">MAP</Badge>
                        <span className="text-sm">{metricas.particoes} tarefas paralelas</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[...Array(Math.min(metricas.particoes || 4, 8))].map((_, i) => (
                          <div key={i} className="h-8 bg-orange-100 rounded border border-orange-200 flex items-center justify-center text-xs">
                            M{i+1}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Merge className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">Shuffle ({metricas.reducers} reducers)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {[...Array(Math.min(metricas.reducers || 2, 4))].map((_, i) => (
                          <div key={i} className="h-8 bg-orange-200 rounded border border-orange-300 flex items-center justify-center text-xs">
                            R{i+1}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {tipo === 'streaming' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-cyan-500" />
                        <span className="text-sm">Fluxo contínuo de {metricas.linhas_processadas} eventos</span>
                      </div>
                      <div className="relative h-16 bg-cyan-50 rounded-lg overflow-hidden">
                        <div className="absolute inset-0 flex items-center">
                          {[...Array(10)].map((_, i) => (
                            <div 
                              key={i}
                              className="h-8 w-8 bg-cyan-400 rounded-full mx-1 animate-pulse"
                              style={{ animationDelay: `${i * 100}ms` }}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm">
                        Janelas de {dadosProcessados.parametros.window_size || 10}s • Latência: {metricas.latencia_media || 'N/A'}ms
                      </p>
                    </div>
                  )}
                  
                  {tipo === 'sql' && (
                    <div className="space-y-3">
                      <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm overflow-x-auto">
                        {dadosProcessados.parametros.query || 'SELECT * FROM dados'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm">Executado em {metricas.particoes} partições paralelas</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Aba Interpretação */}
          {abaAtiva === 'interpretacao' && (
            <div className="space-y-4">
              {interpretacoes.map((item, idx) => (
                <Card key={idx} className="border-l-4 border-l-blue-500">
                  <div className="p-5">
                    <h3 className="font-bold text-gray-800 mb-2">{item.titulo}</h3>
                    <p className="text-gray-700 leading-relaxed">{item.texto}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Aba Recomendações */}
          {abaAtiva === 'recomendacoes' && (
            <div className="space-y-4">
              {recomendacoes.length > 0 ? (
                recomendacoes.map((rec, idx) => (
                  <Card key={idx} className="border-l-4 border-l-green-500">
                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Target className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 mb-1">{rec.acao}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Motivo:</span> {rec.motivo}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Impacto esperado:</span> {rec.impacto}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card>
                  <div className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <h3 className="font-bold text-gray-800 text-lg mb-1">Configuração Otimizada</h3>
                    <p className="text-gray-600">
                      Não foram identificadas oportunidades de melhoria. A configuração atual parece adequada.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Aba Detalhes */}
          {abaAtiva === 'detalhes' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Métricas Detalhadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-4">
                    {Object.entries(metricas).map(([key, value]) => {
                      if (!value && value !== 0) return null;
                      return (
                        <div key={key} className="flex justify-between border-b pb-2">
                          <dt className="text-sm text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</dt>
                          <dd className="text-sm font-mono font-medium">
                            {typeof value === 'number' ? 
                              (key.includes('bytes') ? formatarBytes(value) : 
                               key.includes('tempo') ? formatarTempo(value) : 
                               value.toLocaleString()) : 
                              String(value)}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Parâmetros da Execução</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-4">
                    {Object.entries(dadosProcessados.parametros).map(([key, value]) => {
                      if (!value && value !== false) return null;
                      return (
                        <div key={key} className="flex justify-between border-b pb-2">
                          <dt className="text-sm text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</dt>
                          <dd className="text-sm font-mono font-medium">
                            {Array.isArray(value) ? value.join(', ') : 
                             typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : 
                             String(value)}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </CardContent>
              </Card>
              
              {/* Logs do R */}
              {dadosProcessados.logs.stdout && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Logs da Execução
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-60">
                      {dadosProcessados.logs.stdout.split('\n').map((line, i) => (
                        <div key={i} className="whitespace-pre-wrap">
                          {line}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rodapé */}
      <div className="bg-white rounded-xl shadow-sm p-4 border flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Info className="w-4 h-4" />
          <span>Análise concluída em {new Date(dadosProcessados.timestamp).toLocaleString('pt-BR')}</span>
        </div>
        <Badge variant={badge}>
          {tipo.toUpperCase()} • {metricas.linhas_processadas?.toLocaleString()} registros
        </Badge>
      </div>
    </motion.div>
  );
}