import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter, ComposedChart,
  Area, AreaChart
} from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
  BarChart as BarChartIcon,
  Download,
  FileText,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Zap,
  Filter,
  Calendar,
  Target,
  Users,
  DollarSign,
  Activity,
  Award,
  Shield,
  Globe,
  Clock,
  Database,
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  RefreshCw,
  DownloadCloud,
  BarChart3,
  PieChart as PieChartIcon2,
  CalendarDays,
  Tag,
  Star,
  BarChart4,
  FileBarChart,
  Brain,
  Target as TargetIcon,
  Layers,
  Cpu,
  Code,
  BarChart2,
  Settings,
  Info,
  ExternalLink,
  X,
  ChevronRight,
  Home,
  File,
  FileCode,
  Network,
  History,
  Play,
  Bell,
  Cloud,
  Wind,
  Thermometer,
  Calculator,
  TrendingDown,
  Percent,
  ArrowUp,
  ArrowDown,
  Hash,
  Grid,
  LineChart as LineChartIcon,
  Activity as ActivityIcon,
  DollarSign as DollarSignIcon,
  Users as UsersIcon,
  Award as AwardIcon,
  Shield as ShieldIcon,
  Globe as GlobeIcon,
  Clock as ClockIcon,
  Database as DatabaseIcon,
  Filter as FilterIcon,
  Search as SearchIcon,
  Printer,
  Share2,
  BookOpen,
  AlertCircle,
  CheckSquare,
  XCircle,
  HelpCircle,
  ScatterChart as ScatterChartIcon
} from 'lucide-react';

import { analisarQualquerModelo } from '../../utils/analiseModelos';

// Importar relatórios específicos
import RelatorioRegressaoSimples from './relatorios/RelatorioRegressaoSimples';
import RelatorioRegressaoMultipla from './relatorios/RelatorioRegressaoMultipla';
import RelatorioRegressaoLogistica from './relatorios/RelatorioRegressaoLogistica';
import RelatorioSeriesTemporais from './relatorios/RelatorioSeriesTemporais';
import RelatorioML from './relatorios/RelatorioML';
import RelatorioActuarial from './relatorios/RelatorioActuarial';
import RelatorioGenerico from './relatorios/RelatorioGenerico';

// Cores para diferentes tipos de modelos
const CORES_MODELOS = {
  'linear_simples': '#3B82F6',
  'linear_multipla': '#10B981',
  'xgboost': '#EF4444',
  'random_forest': '#F59E0B',
  'arima': '#8B5CF6',
  'sarima': '#EC4899',
  'ets': '#06B6D4',
  'prophet': '#84CC16',
  'glm_actuarial_duplo': '#8B5CF6',
  'a_priori': '#F97316',
  'regressao_logistica': '#F43F5E',
  'desconhecido': '#6B7280'
};

const CORES_CLASSIFICACAO = {
  'EXCELENTE': '#10B981',
  'BOA': '#3B82F6',
  'MODERADA': '#F59E0B',
  'FRACA': '#EF4444'
};

// 🔥 FUNÇÃO PARA EXTRAIR DADOS COMPLETOS DO MODELO
const extrairDadosCompletosDoModelo = (modelo) => {
  const dados = modelo.resultado || modelo.dados || {};
  const tipo = modelo.tipo || 'desconhecido';
  
  // Extrair coeficientes
  const extrairCoeficientes = () => {
    let coeficientes = {};
    
    if (dados.coeficientes && typeof dados.coeficientes === 'object') {
      coeficientes = dados.coeficientes;
    } else if (dados.coefficients && typeof dados.coefficients === 'object') {
      coeficientes = dados.coefficients;
    } else if (dados.params && typeof dados.params === 'object') {
      coeficientes = dados.params;
    } else if (dados.slopes && typeof dados.slopes === 'object') {
      coeficientes = { ...dados.slopes };
      if (dados.intercept !== undefined) {
        coeficientes['(Intercept)'] = dados.intercept;
      }
    }
    
    // Normalizar estrutura
    const coeficientesNormalizados = {};
    Object.entries(coeficientes).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (typeof value === 'object') {
          coeficientesNormalizados[key] = value;
        } else {
          coeficientesNormalizados[key] = {
            estimate: typeof value === 'number' ? value : Number(value) || 0,
            std_error: null,
            t_value: null,
            p_value: null
          };
        }
      }
    });
    
    return coeficientesNormalizados;
  };

  // Extrair métricas
  const extrairMetricas = () => {
    const metricas = {};
    const metricasBasicas = [
      'r2', 'rsquared', 'r2_ajustado', 'adj_r_squared', 'rmse', 'mae', 'mse', 'mape',
      'aic', 'bic', 'accuracy', 'precision', 'recall', 'f1_score', 'f1', 'auc'
    ];
    
    metricasBasicas.forEach(key => {
      if (dados[key] !== undefined && dados[key] !== null) {
        metricas[key] = dados[key];
      }
    });
    
    if (dados.metricas && typeof dados.metricas === 'object') {
      Object.assign(metricas, dados.metricas);
    }
    
    return metricas;
  };

  return {
    informacoesBasicas: {
      nome: modelo.nome,
      tipo: modelo.tipo,
      timestamp: modelo.timestamp,
      classificacao: modelo.classificacao || 'MODERADA',
      pontuacao: modelo.pontuacao || 0.5
    },
    coeficientes: extrairCoeficientes(),
    metricas: extrairMetricas(),
    insights: modelo.analise?.insights || [],
    interpretacoes: modelo.analise?.interpretacoes || [],
    diagnosticos: modelo.analise?.diagnosticos || [],
    recomendacoes: modelo.analise?.recomendacoes || []
  };
};

// 🔥 FUNÇÃO PARA SELECIONAR O RELATÓRIO CORRETO
const selecionarRelatorioPorTipo = (modelo, dadosCompletos) => {
  const tipo = modelo.tipo || 'desconhecido';
  const props = { modelo, dadosCompletos };
  
  switch(tipo) {
    case 'linear_simples':
      return <RelatorioRegressaoSimples {...props} />;
    
    case 'linear_multipla':
      return <RelatorioRegressaoMultipla {...props} />;
    
    case 'regressao_logistica':
      return <RelatorioRegressaoLogistica {...props} />;
    
    case 'arima':
    case 'sarima':
    case 'ets':
    case 'prophet':
      return <RelatorioSeriesTemporais {...props} />;
    
    case 'random_forest':
    case 'xgboost':
      return <RelatorioML {...props} />;
    
    case 'a_priori':
    case 'glm_actuarial_duplo':
      return <RelatorioActuarial {...props} />;
    
    default:
      return <RelatorioGenerico {...props} />;
  }
};

// 🔥 FUNÇÃO PARA GERAR PDF SUPER PROFISSIONAL
const gerarPDFProfissional = async (modelo, dadosCompletos, conteudoAbas = {}) => {
  try {
    // Criar PDF A4 com margens
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margem = 20;
    
    // Configurar fonte Times New Roman
    doc.setFont('times', 'normal');
    
    // 🔥 CAPA PROFISSIONAL
    // Fundo corporativo
    doc.setFillColor(10, 31, 68); // #0A1F44
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Logotipo centralizado
    try {
      // Tentar carregar logotipo do sistema JIAM
      const logoUrl = '/logojiam.png';
      const logoWidth = 60;
      const logoHeight = 60;
      const logoX = (pageWidth - logoWidth) / 2;
      const logoY = 50;
      
      doc.addImage(logoUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
    } catch (e) {
      console.log('Logotipo não carregado, usando texto alternativo');
    }
    
    // Título principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('times', 'bold');
    doc.text('RELATÓRIO TÉCNICO', pageWidth / 2, 130, { align: 'center' });
    
    doc.setFontSize(20);
    doc.text('ANÁLISE DE MODELO PREDITIVO', pageWidth / 2, 145, { align: 'center' });
    
    // Nome do modelo
    doc.setFontSize(24);
    doc.text(modelo.nome.toUpperCase(), pageWidth / 2, 165, { align: 'center' });
    
    // Informações técnicas
    doc.setFontSize(14);
    doc.setFont('times', 'normal');
    doc.text(`Tipo: ${modelo.tipo.toUpperCase()}`, pageWidth / 2, 180, { align: 'center' });
    doc.text(`Classificação: ${modelo.classificacao}`, pageWidth / 2, 190, { align: 'center' });
    doc.text(`Performance: ${(modelo.pontuacao * 100).toFixed(1)}%`, pageWidth / 2, 200, { align: 'center' });
    
    // Data e rodapé da capa
    doc.setFontSize(12);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, 250, { align: 'center' });
    doc.text('Sistema JIAM Preditivo - Inteligência Artificial Avançada', pageWidth / 2, 260, { align: 'center' });
    doc.text('Documento confidencial para uso interno', pageWidth / 2, 270, { align: 'center' });
    
    // 🔥 PÁGINA 2: SUMÁRIO
    doc.addPage();
    
    // Cabeçalho de página
    doc.setFillColor(10, 31, 68);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('times', 'bold');
    doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
    doc.setFontSize(10);
    doc.text('Relatório Técnico Completo', pageWidth - margem, 20, { align: 'right' });
    
    // Título do sumário
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('times', 'bold');
    doc.text('SUMÁRIO', margem, 50);
    
    // Linha divisória
    doc.setDrawColor(10, 31, 68);
    doc.setLineWidth(0.5);
    doc.line(margem, 55, pageWidth - margem, 55);
    
    // Itens do sumário
    doc.setFontSize(12);
    let ySumario = 65;
    const secoes = [
      '1. RESUMO EXECUTIVO',
      '2. ESPECIFICAÇÃO DO MODELO',
      '3. COEFICIENTES E PARÂMETROS',
      '4. MÉTRICAS DE PERFORMANCE',
      '5. ANÁLISE E INTERPRETAÇÃO',
      '6. DIAGNÓSTICO TÉCNICO',
      '7. RECOMENDAÇÕES',
      '8. CONCLUSÃO'
    ];
    
    secoes.forEach((secao, index) => {
      doc.setFont('times', 'bold');
      doc.text(secao, margem, ySumario);
      doc.setFont('times', 'normal');
      doc.text(`........................................................................... ${index + 1}`, margem + 70, ySumario);
      ySumario += 10;
    });
    
    // 🔥 PÁGINA 3: RESUMO EXECUTIVO
    doc.addPage();
    
    // Cabeçalho
    doc.setFillColor(10, 31, 68);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('times', 'bold');
    doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
    doc.setFontSize(10);
    doc.text('Página 3', pageWidth - margem, 20, { align: 'right' });
    
    // Título da seção
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text('1. RESUMO EXECUTIVO', margem, 50);
    
    // Conteúdo do resumo
    doc.setFontSize(11);
    doc.setFont('times', 'normal');
    let yResumo = 60;
    
    const resumoText = [
      `O modelo "${modelo.nome}" foi desenvolvido utilizando a técnica de ${modelo.tipo}. `,
      `Após análise completa pelo Sistema JIAM Preditivo, o modelo foi classificado como `,
      `${modelo.classificacao} com pontuação de performance de ${(modelo.pontuacao * 100).toFixed(1)}%. `,
      `Este relatório apresenta análise técnica detalhada, interpretação dos resultados e `,
      `recomendações para implementação em ambiente produtivo.`
    ];
    
    resumoText.forEach(paragrafo => {
      const lines = doc.splitTextToSize(paragrafo, pageWidth - 2 * margem);
      lines.forEach(line => {
        doc.text(line, margem, yResumo);
        yResumo += 6;
      });
      yResumo += 3;
    });
    
    // Destaque da classificação
    yResumo += 10;
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(margem, yResumo, pageWidth - 2 * margem, 25, 3, 3, 'F');
    doc.setTextColor(10, 31, 68);
    doc.setFontSize(14);
    doc.setFont('times', 'bold');
    doc.text('CLASSIFICAÇÃO DO MODELO', margem + 10, yResumo + 8);
    doc.setFontSize(12);
    doc.setFont('times', 'normal');
    doc.text(`Categoria: ${modelo.classificacao}`, margem + 10, yResumo + 16);
    doc.text(`Score: ${(modelo.pontuacao * 100).toFixed(1)}%`, margem + 100, yResumo + 16);
    
    // 🔥 PÁGINA 4: ESPECIFICAÇÃO DO MODELO
    doc.addPage();
    
    // Cabeçalho
    doc.setFillColor(10, 31, 68);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('times', 'bold');
    doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
    doc.setFontSize(10);
    doc.text('Página 4', pageWidth - margem, 20, { align: 'right' });
    
    // Título da seção
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text('2. ESPECIFICAÇÃO DO MODELO', margem, 50);
    
    // Detalhes do modelo
    doc.setFontSize(11);
    let yEspecificacao = 60;
    
    const detalhes = [
      ['Nome do Modelo:', modelo.nome],
      ['Técnica Utilizada:', modelo.tipo.toUpperCase()],
      ['Data de Criação:', new Date(modelo.timestamp).toLocaleDateString('pt-BR')],
      ['Data de Análise:', new Date().toLocaleDateString('pt-BR')],
      ['Responsável:', 'Sistema JIAM Preditivo'],
      ['Versão do Modelo:', '1.0']
    ];
    
    detalhes.forEach(([label, value]) => {
      doc.setFont('times', 'bold');
      doc.text(label, margem, yEspecificacao);
      doc.setFont('times', 'normal');
      doc.text(value, margem + 50, yEspecificacao);
      yEspecificacao += 7;
    });
    
    // Equação do modelo (se houver coeficientes)
    if (dadosCompletos.coeficientes && Object.keys(dadosCompletos.coeficientes).length > 0) {
      yEspecificacao += 10;
      doc.setFontSize(12);
      doc.setFont('times', 'bold');
      doc.text('Equação Matemática do Modelo:', margem, yEspecificacao);
      yEspecificacao += 8;
      
      // Construir equação baseada no tipo
      let equacao = 'Fórmula técnica especializada';
      if (modelo.tipo.includes('linear')) {
        const intercept = dadosCompletos.coeficientes['(Intercept)']?.estimate || 0;
        const outrosCoefs = Object.entries(dadosCompletos.coeficientes)
          .filter(([key]) => key !== '(Intercept)')
          .map(([key, val]) => {
            const estimate = typeof val === 'object' ? val.estimate : val;
            const sinal = estimate >= 0 ? '+' : '';
            return `${sinal}${estimate.toFixed(4)} × ${key}`;
          })
          .join(' ');
        
        equacao = `Ŷ = ${intercept.toFixed(4)} ${outrosCoefs}`;
      }
      
      doc.setFont('times', 'italic');
      doc.text(equacao, margem + 10, yEspecificacao);
    }
    
    // 🔥 PÁGINA 5: COEFICIENTES
    if (dadosCompletos.coeficientes && Object.keys(dadosCompletos.coeficientes).length > 0) {
      doc.addPage();
      
      // Cabeçalho
      doc.setFillColor(10, 31, 68);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('times', 'bold');
      doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
      doc.setFontSize(10);
      doc.text('Página 5', pageWidth - margem, 20, { align: 'right' });
      
      // Título da seção
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.text('3. COEFICIENTES E PARÂMETROS', margem, 50);
      
      // Tabela de coeficientes
      const tableData = [];
      Object.entries(dadosCompletos.coeficientes).forEach(([nome, valor]) => {
        const estimate = typeof valor === 'object' ? valor.estimate : valor;
        const stdError = valor?.std_error || valor?.std_err || '—';
        const tValue = valor?.t_value || valor?.t_statistic || '—';
        const pValue = valor?.p_value || valor?.pValue || '—';
        
        // Determinar significância
        let significancia = 'Não significativo';
        if (typeof pValue === 'number') {
          if (pValue < 0.001) significancia = '*** Altamente significativo';
          else if (pValue < 0.01) significancia = '** Muito significativo';
          else if (pValue < 0.05) significancia = '* Significativo';
          else if (pValue < 0.1) significancia = '. Marginalmente significativo';
        }
        
        tableData.push([
          nome,
          typeof estimate === 'number' ? estimate.toFixed(4) : 'N/A',
          stdError !== '—' && typeof stdError === 'number' ? stdError.toFixed(4) : stdError,
          tValue !== '—' && typeof tValue === 'number' ? tValue.toFixed(2) : tValue,
          pValue !== '—' && typeof pValue === 'number' ? pValue.toFixed(4) : pValue,
          significancia
        ]);
      });
      
      // Criar tabela com jspdf-autotable
      doc.autoTable({
        startY: 60,
        head: [['Variável', 'Estimativa', 'Erro Padrão', 't-valor', 'p-valor', 'Significância']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
          fillColor: [10, 31, 68],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 40 }
        },
        margin: { left: margem, right: margem }
      });
    }
    
    // 🔥 PÁGINA 6: MÉTRICAS DE PERFORMANCE
    if (dadosCompletos.metricas && Object.keys(dadosCompletos.metricas).length > 0) {
      const currentPage = doc.internal.getNumberOfPages();
      doc.setPage(currentPage);
      let yMetrics = doc.lastAutoTable?.finalY || 60;
      
      if (yMetrics > pageHeight - 100) {
        doc.addPage();
        yMetrics = 60;
      }
      
      doc.setFontSize(18);
      doc.setFont('times', 'bold');
      doc.text('4. MÉTRICAS DE PERFORMANCE', margem, yMetrics + 20);
      
      doc.setFontSize(11);
      doc.setFont('times', 'normal');
      let yPos = yMetrics + 35;
      
      // Agrupar métricas por categoria
      const metricasCategorizadas = {
        'Ajuste do Modelo': ['r2', 'r2_ajustado', 'adj_r_squared'],
        'Erros de Previsão': ['rmse', 'mae', 'mse', 'mape'],
        'Critérios de Informação': ['aic', 'bic'],
        'Classificação': ['accuracy', 'precision', 'recall', 'f1', 'auc']
      };
      
      Object.entries(metricasCategorizadas).forEach(([categoria, chaves]) => {
        const metricasCategoria = chaves
          .filter(key => dadosCompletos.metricas[key] !== undefined)
          .map(key => {
            let valor = dadosCompletos.metricas[key];
            let formato = 'número';
            
            // Formatar valores
            if (['r2', 'r2_ajustado', 'adj_r_squared', 'accuracy', 'precision', 'recall', 'f1', 'auc'].includes(key)) {
              formato = 'percentual';
              valor = (valor * 100).toFixed(1) + '%';
            } else if (['mape'].includes(key)) {
              valor = valor.toFixed(2) + '%';
            } else if (typeof valor === 'number') {
              valor = valor.toFixed(4);
            }
            
            return { nome: key.toUpperCase(), valor };
          });
        
        if (metricasCategoria.length > 0) {
          // Verificar se precisa de nova página
          if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = 60;
          }
          
          doc.setFont('times', 'bold');
          doc.text(`${categoria}:`, margem, yPos);
          yPos += 7;
          
          metricasCategoria.forEach(metrica => {
            doc.setFont('times', 'normal');
            doc.text(`  ${metrica.nome}: ${metrica.valor}`, margem + 10, yPos);
            yPos += 6;
          });
          
          yPos += 5;
        }
      });
    }
    
    // 🔥 PÁGINA 7: ANÁLISE E INTERPRETAÇÃO (das abas do relatório)
    doc.addPage();
    
    // Cabeçalho
    doc.setFillColor(10, 31, 68);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('times', 'bold');
    doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
    doc.setFontSize(10);
    doc.text('Página 7', pageWidth - margem, 20, { align: 'right' });
    
    // Título da seção
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text('5. ANÁLISE E INTERPRETAÇÃO', margem, 50);
    
    // Conteúdo das interpretações
    doc.setFontSize(11);
    doc.setFont('times', 'normal');
    let yInterpretacao = 60;
    
    // 🔥 USAR CONTEÚDO DAS ABAS DOS RELATÓRIOS INDIVIDUAIS
    if (dadosCompletos.interpretacoes && dadosCompletos.interpretacoes.length > 0) {
      doc.setFont('times', 'bold');
      doc.text('Interpretações da IA:', margem, yInterpretacao);
      yInterpretacao += 8;
      
      dadosCompletos.interpretacoes.forEach((interpretacao, idx) => {
        const texto = interpretacao.replace(/\*\*/g, '');
        const lines = doc.splitTextToSize(`• ${texto}`, pageWidth - 2 * margem);
        
        lines.forEach(line => {
          if (yInterpretacao > pageHeight - 30) {
            doc.addPage();
            yInterpretacao = 60;
          }
          doc.setFont('times', 'normal');
          doc.text(line, margem + 5, yInterpretacao);
          yInterpretacao += 6;
        });
        yInterpretacao += 2;
      });
    }
    
    // Insights
    if (dadosCompletos.insights && dadosCompletos.insights.length > 0) {
      yInterpretacao += 10;
      
      if (yInterpretacao > pageHeight - 50) {
        doc.addPage();
        yInterpretacao = 60;
      }
      
      doc.setFont('times', 'bold');
      doc.text('Insights Principais:', margem, yInterpretacao);
      yInterpretacao += 8;
      
      dadosCompletos.insights.forEach((insight, idx) => {
        const texto = insight.replace(/\*\*/g, '');
        const lines = doc.splitTextToSize(`• ${texto}`, pageWidth - 2 * margem);
        
        lines.forEach(line => {
          if (yInterpretacao > pageHeight - 30) {
            doc.addPage();
            yInterpretacao = 60;
          }
          doc.setFont('times', 'normal');
          doc.text(line, margem + 5, yInterpretacao);
          yInterpretacao += 6;
        });
        yInterpretacao += 2;
      });
    }
    
    // 🔥 PÁGINA 8: DIAGNÓSTICO TÉCNICO
    doc.addPage();
    
    // Cabeçalho
    doc.setFillColor(10, 31, 68);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('times', 'bold');
    doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
    doc.setFontSize(10);
    doc.text('Página 8', pageWidth - margem, 20, { align: 'right' });
    
    // Título da seção
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text('6. DIAGNÓSTICO TÉCNICO', margem, 50);
    
    // Avaliação do modelo
    doc.setFontSize(11);
    let yDiagnostico = 60;
    
    // Diagnósticos
    if (dadosCompletos.diagnosticos && dadosCompletos.diagnosticos.length > 0) {
      dadosCompletos.diagnosticos.forEach((diagnostico, idx) => {
        if (yDiagnostico > pageHeight - 30) {
          doc.addPage();
          yDiagnostico = 60;
        }
        
        const texto = `${diagnostico.tipo.toUpperCase()}: ${diagnostico.mensagem}`;
        doc.setFont('times', diagnostico.tipo === 'excelente' ? 'bold' : 'normal');
        doc.text(`• ${texto}`, margem, yDiagnostico);
        yDiagnostico += 7;
      });
    }
    
    // Avaliação de qualidade
    yDiagnostico += 10;
    if (yDiagnostico > pageHeight - 50) {
      doc.addPage();
      yDiagnostico = 60;
    }
    
    doc.setFont('times', 'bold');
    doc.text('Avaliação de Qualidade:', margem, yDiagnostico);
    yDiagnostico += 8;
    
    const avaliacao = [
      `Classificação: ${modelo.classificacao}`,
      `Pontuação: ${(modelo.pontuacao * 100).toFixed(1)}%`,
      `Status: ${modelo.pontuacao > 0.8 ? 'Pronto para produção' : modelo.pontuacao > 0.6 ? 'Requer ajustes menores' : 'Revisão necessária'}`
    ];
    
    avaliacao.forEach(item => {
      doc.setFont('times', 'normal');
      doc.text(`• ${item}`, margem + 5, yDiagnostico);
      yDiagnostico += 7;
    });
    
    // 🔥 PÁGINA 9: RECOMENDAÇÕES
    doc.addPage();
    
    // Cabeçalho
    doc.setFillColor(10, 31, 68);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('times', 'bold');
    doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
    doc.setFontSize(10);
    doc.text('Página 9', pageWidth - margem, 20, { align: 'right' });
    
    // Título da seção
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text('7. RECOMENDAÇÕES', margem, 50);
    
    // Recomendações
    doc.setFontSize(11);
    let yRecomendacoes = 60;
    
    if (dadosCompletos.recomendacoes && dadosCompletos.recomendacoes.length > 0) {
      dadosCompletos.recomendacoes.forEach((recomendacao, idx) => {
        if (yRecomendacoes > pageHeight - 30) {
          doc.addPage();
          yRecomendacoes = 60;
        }
        
        doc.setFont('times', 'bold');
        doc.text(`${idx + 1}.`, margem, yRecomendacoes);
        doc.setFont('times', 'normal');
        
        const lines = doc.splitTextToSize(recomendacao, pageWidth - 2 * margem - 10);
        lines.forEach((line, lineIdx) => {
          const xPos = lineIdx === 0 ? margem + 10 : margem;
          doc.text(line, xPos, yRecomendacoes);
          yRecomendacoes += 6;
        });
        
        yRecomendacoes += 2;
      });
    }
    
    // 🔥 PÁGINA FINAL: CONCLUSÃO
    doc.addPage();
    
    // Cabeçalho
    doc.setFillColor(10, 31, 68);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('times', 'bold');
    doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
    doc.setFontSize(10);
    const totalPages = doc.internal.getNumberOfPages();
    doc.text(`Página ${totalPages}`, pageWidth - margem, 20, { align: 'right' });
    
    // Título da seção
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text('8. CONCLUSÃO', margem, 50);
    
    // Texto de conclusão
    doc.setFontSize(12);
    doc.setFont('times', 'normal');
    let yConclusao = 60;
    
    const conclusaoText = [
      `O modelo "${modelo.nome}" apresenta performance classificada como ${modelo.classificacao}`,
      `com pontuação de ${(modelo.pontuacao * 100).toFixed(1)}%. Baseado na análise técnica completa`,
      `realizada pelo Sistema JIAM Preditivo, as seguintes considerações são apresentadas:`,
      '',
      `1. O modelo demonstra ${modelo.pontuacao > 0.8 ? 'capacidade preditiva excepcional' : modelo.pontuacao > 0.6 ? 'bom poder explicativo' : 'potencial para aplicações específicas'}.`,
      `2. As métricas de performance indicam ${modelo.classificacao === 'EXCELENTE' ? 'alta confiabilidade' : modelo.classificacao === 'BOA' ? 'confiabilidade adequada' : 'oportunidades de otimização'}.`,
      `3. A implementação em ambiente produtivo ${modelo.pontuacao > 0.7 ? 'é recomendada com monitoramento contínuo' : 'requer ajustes adicionais antes da implantação'}.`,
      '',
      'Este relatório técnico serve como documento de referência para tomada de decisão',
      'e deve ser considerado em conjunto com testes adicionais de validação.'
    ];
    
    conclusaoText.forEach(paragrafo => {
      if (paragrafo === '') {
        yConclusao += 5;
        return;
      }
      
      const lines = doc.splitTextToSize(paragrafo, pageWidth - 2 * margem);
      lines.forEach(line => {
        if (yConclusao > pageHeight - 50) {
          doc.addPage();
          yConclusao = 60;
        }
        doc.text(line, margem, yConclusao);
        yConclusao += 6;
      });
      yConclusao += 2;
    });
    
    // 🔥 RODAPÉ FINAL EM TODAS AS PÁGINAS
    const totalPagesFinal = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPagesFinal; i++) {
      doc.setPage(i);
      
      // Rodapé corporativo
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Sistema JIAM Preditivo - Inteligência Artificial Avançada', pageWidth / 2, pageHeight - 15, { align: 'center' });
      doc.text(`Documento confidencial - Página ${i} de ${totalPagesFinal}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      // Linha do rodapé
      doc.setDrawColor(200, 200, 200);
      doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
    }
    
    // 🔥 SALVAR PDF
    const nomeArquivo = `Relatorio_JIAM_${modelo.nome.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nomeArquivo);
    
    console.log('✅ PDF profissional gerado:', nomeArquivo, totalPagesFinal, 'páginas');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF profissional:', error);
    throw error;
  }
};

// 🔥 COMPONENTE PRINCIPAL
export default function Relatorios({ resultados = [], modelosSalvos = {}, dados = [], atividades = [], onExportar }) {
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroClassificacao, setFiltroClassificacao] = useState('todos');
  const [pesquisa, setPesquisa] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('data');
  const [ordemCrescente, setOrdemCrescente] = useState(false);
  const [modelosAnalisados, setModelosAnalisados] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [relatorioDetalhado, setRelatorioDetalhado] = useState(null);
  const [dadosCompletosModelo, setDadosCompletosModelo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processandoAnalises, setProcessandoAnalises] = useState(false);
  const [abaDetalheAtiva, setAbaDetalheAtiva] = useState('overview');
  const [exportandoPDF, setExportandoPDF] = useState(false);

  // Efeito inicial
  useEffect(() => {
    console.log('🧠 SISTEMA JIAM: Inicializando análise inteligente...');
    
    const timer = setTimeout(() => {
      setLoading(false);
      if (resultados?.length > 0 || Object.keys(modelosSalvos).length > 0) {
        processarAnalises();
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [resultados, modelosSalvos]);
  
  // Normalizar resultados
  const normalizarResultados = useCallback((resultadosInput) => {
    if (!resultadosInput) return [];
    
    if (Array.isArray(resultadosInput)) {
      return resultadosInput.map((r, idx) => ({
        ...r,
        id: r.id || `modelo_${idx}_${Date.now()}`,
        nome: r.nome || r.titulo || `Modelo ${idx + 1}`,
        tipo: r.tipo || r.resultado?.tipo_modelo || 'desconhecido',
        timestamp: r.timestamp || new Date().toISOString(),
        resultado: r.resultado || r.dados || r,
        parametros: r.parametros || {}
      }));
    }
    
    if (typeof resultadosInput === 'object') {
      return Object.entries(resultadosInput).map(([nome, dados]) => ({
        ...dados,
        id: dados.id || `modelo_${nome}_${Date.now()}`,
        nome: nome,
        tipo: dados.tipo || 'desconhecido',
        timestamp: dados.timestamp || new Date().toISOString(),
        resultado: dados.resultado || dados,
        parametros: dados.parametros || {}
      }));
    }
    
    return [];
  }, []);
  
  // Analisar modelo com inteligência
  const analisarModelo = (modelo) => {
    try {
      console.log(`🧠 SISTEMA JIAM: Analisando "${modelo.nome}" com inteligência avançada`);
      
      const analise = analisarQualquerModelo({
        tipo: modelo.tipo,
        ...modelo.resultado
      }, modelo.parametros);
      
      return {
        ...modelo,
        analise,
        classificacao: analise.classificacao,
        pontuacao: analise.pontuacao || 0
      };
    } catch (error) {
      console.error('❌ Erro na análise inteligente:', error);
      return {
        ...modelo,
        analise: {
          classificacao: 'FRACA',
          pontuacao: 0.3,
          insights: ['⚠️ Análise inicial detectou oportunidades de otimização'],
          interpretacoes: ['📊 Modelo requer revisão técnica detalhada'],
          diagnosticos: [{ tipo: 'melhoria', mensagem: 'Oportunidade para otimização significativa' }],
          recomendacoes: ['🔍 Validar qualidade dos dados de entrada', '⚙️ Revisar configurações do modelo'],
          metricas: {}
        },
        classificacao: 'FRACA',
        pontuacao: 0.3
      };
    }
  };
  
  // Processar análises
  const processarAnalises = useCallback(() => {
    if (processandoAnalises) return;
    
    setProcessandoAnalises(true);
    console.log('🔄 SISTEMA JIAM: Processando análises com IA...');
    
    try {
      const resultadosNormalizados = normalizarResultados(resultados);
      const modelosSalvosNormalizados = normalizarResultados(modelosSalvos);
      
      const todosModelos = [...resultadosNormalizados, ...modelosSalvosNormalizados];
      console.log(`📊 Total de modelos para análise inteligente: ${todosModelos.length}`);
      
      const modelosProcessados = todosModelos.map(modelo => analisarModelo(modelo));
      
      const stats = calcularEstatisticas(modelosProcessados);
      
      setModelosAnalisados(modelosProcessados);
      setEstatisticas(stats);
      
      console.log('✅ Análises inteligentes concluídas:', {
        total: modelosProcessados.length,
        classificacoes: stats.porClassificacao,
        performanceMedia: stats.performanceMedia
      });
      
    } catch (error) {
      console.error('❌ Erro no processamento inteligente:', error);
    } finally {
      setProcessandoAnalises(false);
    }
  }, [resultados, modelosSalvos, normalizarResultados, processandoAnalises]);
  
  // Calcular estatísticas
  const calcularEstatisticas = (modelos) => {
    if (!modelos || modelos.length === 0) {
      return {
        total: 0,
        porTipo: {},
        porClassificacao: {},
        performanceMedia: 0,
        tiposUnicos: [],
        distribuicaoTipos: [],
        distribuicaoClassificacao: [],
        melhorModelo: null,
        piorModelo: null
      };
    }
    
    const porTipo = {};
    const porClassificacao = {};
    let somaPerformance = 0;
    
    modelos.forEach((modelo) => {
      const tipo = modelo.tipo || 'desconhecido';
      porTipo[tipo] = (porTipo[tipo] || 0) + 1;
      
      const classificacao = modelo.classificacao || 'FRACA';
      porClassificacao[classificacao] = (porClassificacao[classificacao] || 0) + 1;
      
      somaPerformance += modelo.pontuacao || 0;
    });
    
    // Distribuição por tipo
    const distribuicaoTipos = Object.entries(porTipo)
      .map(([tipo, count]) => ({
        tipo,
        count,
        percentual: (count / modelos.length * 100).toFixed(1),
        cor: CORES_MODELOS[tipo] || '#6B7280'
      }))
      .sort((a, b) => b.count - a.count);
    
    // Distribuição por classificação
    const distribuicaoClassificacao = Object.entries(porClassificacao)
      .map(([classificacao, count]) => ({
        classificacao,
        count,
        percentual: (count / modelos.length * 100).toFixed(1),
        cor: CORES_CLASSIFICACAO[classificacao] || '#6B7280'
      }));
    
    // Melhor e pior modelo
    const modelosComPontuacao = modelos.filter(m => m.pontuacao !== undefined);
    const melhorModelo = modelosComPontuacao.length > 0 
      ? modelosComPontuacao.reduce((a, b) => (a.pontuacao > b.pontuacao ? a : b), modelosComPontuacao[0])
      : null;
    
    const piorModelo = modelosComPontuacao.length > 0
      ? modelosComPontuacao.reduce((a, b) => (a.pontuacao < b.pontuacao ? a : b), modelosComPontuacao[0])
      : null;
    
    return {
      total: modelos.length,
      porTipo,
      porClassificacao,
      performanceMedia: modelos.length > 0 ? somaPerformance / modelos.length : 0,
      tiposUnicos: Object.keys(porTipo),
      distribuicaoTipos,
      distribuicaoClassificacao,
      melhorModelo,
      piorModelo
    };
  };
  
  // Abrir relatório detalhado
  const abrirRelatorioDetalhado = (modelo) => {
    console.log('📄 SISTEMA JIAM: Gerando relatório detalhado inteligente...');
    const modeloCompleto = analisarModelo(modelo);
    const dadosCompletos = extrairDadosCompletosDoModelo(modeloCompleto);
    setRelatorioDetalhado(modeloCompleto);
    setDadosCompletosModelo(dadosCompletos);
    setAbaDetalheAtiva('overview');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Gerar PDF profissional
  const gerarPDFDetalhado = async (modelo) => {
    setExportandoPDF(true);
    
    try {
      const dadosCompletos = extrairDadosCompletosDoModelo(modelo);
      await gerarPDFProfissional(modelo, dadosCompletos);
      
    } catch (error) {
      console.error('❌ Erro ao gerar PDF profissional:', error);
      alert('Erro ao gerar relatório PDF. Por favor, tente novamente.');
    } finally {
      setExportandoPDF(false);
    }
  };
  
  // Filtrar modelos
  const modelosFiltrados = modelosAnalisados.filter(modelo => {
    if (filtroTipo !== 'todos' && modelo.tipo !== filtroTipo) return false;
    if (filtroClassificacao !== 'todos' && modelo.classificacao !== filtroClassificacao) return false;
    
    if (pesquisa) {
      const termo = pesquisa.toLowerCase();
      return (
        modelo.nome.toLowerCase().includes(termo) ||
        modelo.tipo.toLowerCase().includes(termo) ||
        modelo.classificacao.toLowerCase().includes(termo) ||
        (modelo.analise?.insights?.some(i => i.toLowerCase().includes(termo)) || false)
      );
    }
    
    return true;
  }).sort((a, b) => {
    const ordem = ordemCrescente ? 1 : -1;
    
    switch (ordenarPor) {
      case 'nome': return ordem * a.nome.localeCompare(b.nome);
      case 'tipo': return ordem * a.tipo.localeCompare(b.tipo);
      case 'classificacao':
        const ordemClass = { 'EXCELENTE': 4, 'BOA': 3, 'MODERADA': 2, 'FRACA': 1 };
        return ordem * ((ordemClass[a.classificacao] || 0) - (ordemClass[b.classificacao] || 0));
      case 'pontuacao': return ordem * ((a.pontuacao || 0) - (b.pontuacao || 0));
      case 'data':
      default: return ordem * (new Date(b.timestamp) - new Date(a.timestamp));
    }
  });
  
  // Componente de Loading Inteligente
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="relative">
          <div className="w-32 h-32 border-4 border-blue-100 rounded-full"></div>
          <div className="absolute top-0 left-0 w-32 h-32 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute top-4 left-4 w-24 h-24 border-4 border-purple-600 border-r-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <h3 className="mt-8 text-2xl font-bold text-gray-800">Sistema JIAM Preditivo</h3>
        <p className="mt-2 text-gray-600">Inicializando análise inteligente...</p>
        <div className="mt-6 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    );
  }
  
  // Componente quando não há dados
  if (modelosAnalisados.length === 0 && !processandoAnalises) {
    return (
      <div className="text-center py-24">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-8">
          <div className="relative">
            <img 
              src="/logojiam.png" 
              alt="Logotipo JIAM" 
              className="w-12 h-12"
            />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        <h3 className="text-3xl font-bold text-gray-800 mb-4">Sistema JIAM Preditivo</h3>
        <p className="text-gray-600 max-w-2xl mx-auto mb-10 text-lg">
          Nenhum modelo preditivo detectado para análise inteligente. 
          Execute modelos no sistema para ativar a inteligência artificial avançada.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={processarAnalises}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
          >
            <RefreshCw className="w-5 h-5" />
            Verificar Novos Modelos
          </button>
          <button className="inline-flex items-center gap-3 border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition-all">
            <BookOpen className="w-5 h-5" />
            Ver Tutorial
          </button>
        </div>
      </div>
    );
  }
  
  // Renderizar Dashboard Inteligente
  const renderDashboard = () => {
    if (!estatisticas) return null;
    
    return (
      <div className="space-y-10">
        {/* 🔥 CARDS DE PERFORMANCE INTELIGENTES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-2xl relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 font-medium">Total de Modelos</p>
                  <p className="text-5xl font-bold mt-3">{estatisticas.total}</p>
                  <p className="text-sm opacity-80 mt-2">Analisados com IA</p>
                </div>
                <Database className="w-12 h-12 opacity-90" />
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 text-white p-6 rounded-2xl shadow-2xl relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 font-medium">Performance Média</p>
                  <p className="text-5xl font-bold mt-3">
                    {(estatisticas.performanceMedia * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm opacity-80 mt-2">Score consolidado</p>
                </div>
                <TrendingUp className="w-12 h-12 opacity-90" />
              </div>
            </div>
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/10 rounded-full"></div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white p-6 rounded-2xl shadow-2xl relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 font-medium">Técnicas Utilizadas</p>
                  <p className="text-5xl font-bold mt-3">{estatisticas.tiposUnicos.length}</p>
                  <p className="text-sm opacity-80 mt-2">Algoritmos diferentes</p>
                </div>
                <Cpu className="w-12 h-12 opacity-90" />
              </div>
            </div>
            <div className="absolute top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white p-6 rounded-2xl shadow-2xl relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 font-medium">Alta Performance</p>
                  <p className="text-5xl font-bold mt-3">
                    {(estatisticas.porClassificacao.EXCELENTE || 0) + (estatisticas.porClassificacao.BOA || 0)}
                  </p>
                  <p className="text-sm opacity-80 mt-2">Modelos otimizados</p>
                </div>
                <Award className="w-12 h-12 opacity-90" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
          </motion.div>
        </div>
        
        {/* 🔥 GRÁFICOS INTELIGENTES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Distribuição por Tipo */}
          <div className="bg-white p-8 rounded-3xl shadow-2xl border-2 border-gray-100">
            <h3 className="text-2xl font-bold text-[#0A1F44] mb-8 flex items-center gap-3">
              <PieChartIcon2 className="w-7 h-7 text-purple-600" />
              Distribuição por Técnica
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={estatisticas.distribuicaoTipos}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ tipo, percentual }) => `${tipo}: ${percentual}%`}
                    outerRadius={100}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="count"
                    paddingAngle={2}
                  >
                    {estatisticas.distribuicaoTipos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} strokeWidth={2} stroke="#fff" />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} modelos`, 'Quantidade']}
                    labelFormatter={(label) => `Técnica: ${label}`}
                    contentStyle={{ borderRadius: '12px', border: '2px solid #e5e7eb' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span style={{ color: '#374151', fontWeight: '500' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Performance por Classificação */}
          <div className="bg-white p-8 rounded-3xl shadow-2xl border-2 border-gray-100">
            <h3 className="text-2xl font-bold text-[#0A1F44] mb-8 flex items-center gap-3">
              <BarChart4 className="w-7 h-7 text-blue-600" />
              Performance por Classificação
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={estatisticas.distribuicaoClassificacao}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f0f0f0" vertical={false} />
                  <XAxis 
                    dataKey="classificacao" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontWeight: '500' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontWeight: '500' }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} modelos`, 'Quantidade']}
                    labelFormatter={(label) => `Classificação: ${label}`}
                    contentStyle={{ borderRadius: '12px', border: '2px solid #e5e7eb' }}
                  />
                  <Bar 
                    dataKey="count" 
                    name="Quantidade" 
                    radius={[8, 8, 0, 0]}
                    barSize={50}
                  >
                    {estatisticas.distribuicaoClassificacao.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Renderizar Modelos
  const renderModelos = () => (
    <div className="space-y-8">
      {/* 🔥 FILTROS AVANÇADOS */}
      <div className="bg-white p-8 rounded-3xl shadow-2xl border-2 border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">🔍 Filtros Inteligentes</h3>
            <p className="text-gray-600 mt-2">Encontre modelos específicos com busca avançada</p>
          </div>
          <button
            onClick={() => {
              setFiltroTipo('todos');
              setFiltroClassificacao('todos');
              setPesquisa('');
            }}
            className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl font-medium hover:from-gray-200 hover:to-gray-300 transition-all"
          >
            Limpar filtros
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Buscar por nome, técnica ou insight..."
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-3 focus:ring-blue-500/30 focus:border-blue-500 transition-all bg-gray-50"
            />
          </div>
          
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="border-2 border-gray-200 rounded-xl px-4 py-4 bg-gray-50 focus:ring-3 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          >
            <option value="todos">Todas as técnicas</option>
            {estatisticas?.tiposUnicos.map(tipo => (
              <option key={tipo} value={tipo}>
                {tipo.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </option>
            ))}
          </select>
          
          <select
            value={filtroClassificacao}
            onChange={(e) => setFiltroClassificacao(e.target.value)}
            className="border-2 border-gray-200 rounded-xl px-4 py-4 bg-gray-50 focus:ring-3 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          >
            <option value="todos">Todas as classificações</option>
            {Object.keys(CORES_CLASSIFICACAO).map(classificacao => (
              <option key={classificacao} value={classificacao}>{classificacao}</option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-wrap items-center justify-between mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Ordenar por:</span>
            <select
              value={ordenarPor}
              onChange={(e) => setOrdenarPor(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="data">Data (mais recente)</option>
              <option value="nome">Nome (A-Z)</option>
              <option value="tipo">Técnica</option>
              <option value="classificacao">Classificação</option>
              <option value="pontuacao">Performance</option>
            </select>
            
            <button
              onClick={() => setOrdemCrescente(!ordemCrescente)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              {ordemCrescente ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
            <span className="font-bold">{modelosFiltrados.length}</span> de <span className="font-bold">{modelosAnalisados.length}</span> modelos encontrados
          </div>
        </div>
      </div>
      
      {/* 🔥 LISTA DE MODELOS INTELIGENTE */}
      {modelosFiltrados.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl shadow-2xl border-2 border-gray-100">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-8">
            <Search className="w-12 h-12 text-gray-500" />
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-4">Nenhum modelo encontrado</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-10 text-lg">
            Não encontramos modelos que correspondam aos filtros aplicados.
            Tente ajustar os critérios de busca ou limpar os filtros.
          </p>
          <button
            onClick={() => {
              setFiltroTipo('todos');
              setFiltroClassificacao('todos');
              setPesquisa('');
            }}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
          >
            <Filter className="w-5 h-5" />
            Limpar todos os filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {modelosFiltrados.map((modelo, idx) => (
            <motion.div
              key={modelo.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="p-8">
                {/* Cabeçalho */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-4 h-4 rounded-full shadow-lg"
                        style={{ backgroundColor: CORES_MODELOS[modelo.tipo] || '#8884d8' }}
                      />
                      <h3 className="text-2xl font-bold text-[#0A1F44] truncate group-hover:text-blue-600 transition">
                        {modelo.nome}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                        <Tag className="w-4 h-4" />
                        {modelo.tipo.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </span>
                      <span className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                        <CalendarDays className="w-4 h-4" />
                        {new Date(modelo.timestamp).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span 
                      className={`px-4 py-2 rounded-xl text-sm font-bold shadow-md ${
                        modelo.classificacao === 'EXCELENTE' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300' :
                        modelo.classificacao === 'BOA' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300' :
                        modelo.classificacao === 'MODERADA' ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300' :
                        'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300'
                      }`}
                    >
                      {modelo.classificacao}
                    </span>
                  </div>
                </div>
                
                {/* Performance */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">Score de Performance</span>
                    <span className="text-2xl font-bold" style={{ color: CORES_CLASSIFICACAO[modelo.classificacao] }}>
                      {(modelo.pontuacao * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-1000 shadow-md"
                      style={{ 
                        width: `${Math.min(modelo.pontuacao * 100, 100)}%`,
                        backgroundColor: CORES_CLASSIFICACAO[modelo.classificacao]
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Fraco</span>
                    <span>Moderado</span>
                    <span>Bom</span>
                    <span>Excelente</span>
                  </div>
                </div>
                
                {/* Botões de Ação */}
                <div className="flex gap-3">
                  <button
                    onClick={() => abrirRelatorioDetalhado(modelo)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-xl transition flex items-center justify-center gap-3 font-bold shadow-lg hover:shadow-xl"
                  >
                    <FileBarChart className="w-5 h-5" />
                    Ver Análise Completa
                  </button>
                  <button
                    onClick={() => gerarPDFDetalhado(modelo)}
                    disabled={exportandoPDF}
                    className="px-4 py-4 border-2 border-red-600 text-red-600 hover:bg-red-50 rounded-xl transition flex items-center justify-center disabled:opacity-50"
                    title="Exportar PDF"
                  >
                    {exportandoPDF ? (
                      <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  // Renderizar Relatório Detalhado Inteligente
  const renderRelatorioDetalhado = () => {
    if (!relatorioDetalhado || !dadosCompletosModelo) return null;
    
    const modelo = relatorioDetalhado;
    const dados = dadosCompletosModelo;
    
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-lg overflow-y-auto"
          onClick={() => setRelatorioDetalhado(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="bg-white rounded-3xl shadow-3xl max-w-7xl w-full max-h-[95vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho Premium COM LOGOTIPO */}
            <div className="bg-gradient-to-r from-[#0A1F44] via-[#1a3a6e] to-[#0A1F44] text-white p-8">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      <img 
                        src="/logojiam.png" 
                        alt="Logotipo JIAM" 
                        className="w-12 h-12 object-contain"
                      />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">Sistema JIAM Preditivo</h2>
                      <p className="text-lg opacity-90 mt-1">Relatório de Análise Avançada</p>
                      <p className="text-sm opacity-80 mt-1">Inteligência Artificial para Modelos Preditivos</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setRelatorioDetalhado(null)}
                  className="text-white hover:text-gray-300 text-3xl bg-white/20 p-3 rounded-full hover:bg-white/30 transition backdrop-blur-sm"
                >
                  ×
                </button>
              </div>
              
              {/* Abas de navegação premium */}
              <div className="flex gap-2 mt-8">
                {[
                  { id: 'overview', label: 'Visão Geral', icon: Home },
                  { id: 'modelo', label: 'Especificação', icon: Calculator },
                  { id: 'metricas', label: 'Performance', icon: BarChart3 },
                  { id: 'diagnostico', label: 'Diagnóstico', icon: Shield },
                  { id: 'interpretacao', label: 'Análise IA', icon: Brain },
                  { id: 'recomendacoes', label: 'Plano de Ação', icon: CheckSquare }
                ].map((aba) => (
                  <button
                    key={aba.id}
                    onClick={() => setAbaDetalheAtiva(aba.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                      abaDetalheAtiva === aba.id
                        ? 'bg-white text-[#0A1F44] shadow-lg'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    <aba.icon className="w-4 h-4" />
                    {aba.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Conteúdo - AGORA MOSTRA OS COMPONENTES ESPECÍFICOS */}
            <div className="p-8 overflow-y-auto max-h-[70vh]">
              {abaDetalheAtiva === 'overview' && (
                <div className="space-y-8">
                  {/* Mostrar o componente específico do modelo */}
                  {selecionarRelatorioPorTipo(modelo, dados)}
                </div>
              )}
              
              {abaDetalheAtiva === 'modelo' && (
                <div className="space-y-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl border-2 border-blue-200">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Especificação do Modelo {modelo.tipo.toUpperCase()}</h3>
                    <div className="bg-white/80 p-6 rounded-xl">
                      {selecionarRelatorioPorTipo(modelo, dados)}
                    </div>
                  </div>
                </div>
              )}
              
              {abaDetalheAtiva === 'metricas' && (
                <div className="space-y-8">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl border-2 border-green-200">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Métricas de Performance Detalhadas</h3>
                    <div className="bg-white/80 p-6 rounded-xl">
                      {selecionarRelatorioPorTipo(modelo, dados)}
                    </div>
                  </div>
                </div>
              )}
              
              {abaDetalheAtiva === 'diagnostico' && (
                <div className="space-y-8">
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-8 rounded-2xl border-2 border-orange-200">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Diagnóstico Técnico do Modelo</h3>
                    <div className="bg-white/80 p-6 rounded-xl">
                      {selecionarRelatorioPorTipo(modelo, dados)}
                    </div>
                  </div>
                </div>
              )}
              
              {abaDetalheAtiva === 'interpretacao' && (
                <div className="space-y-8">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl border-2 border-indigo-200">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Interpretação Inteligente da IA</h3>
                    <div className="bg-white/80 p-6 rounded-xl">
                      {selecionarRelatorioPorTipo(modelo, dados)}
                    </div>
                  </div>
                </div>
              )}
              
              {abaDetalheAtiva === 'recomendacoes' && (
                <div className="space-y-8">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-2xl border-2 border-emerald-200">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Plano de Ação Recomendado</h3>
                    <div className="bg-white/80 p-6 rounded-xl">
                      {selecionarRelatorioPorTipo(modelo, dados)}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Rodapé Premium */}
            <div className="p-8 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setRelatorioDetalhado(null)}
                  className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition font-bold"
                >
                  Fechar
                </button>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Sistema JIAM Preditivo • Inteligência Artificial Avançada</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => gerarPDFDetalhado(modelo)}
                  disabled={exportandoPDF}
                  className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition font-bold flex items-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exportandoPDF ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Gerando PDF Profissional...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Exportar PDF Completo
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="space-y-10">
      {/* 🔥 CABEÇALHO PREMIUM COM LOGOTIPO */}
      <div className="bg-gradient-to-r from-[#0A1F44] via-[#1a3a6e] to-[#0A1F44] rounded-3xl p-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <img 
                    src="/logojiam.png" 
                    alt="Logotipo JIAM" 
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">Sistema JIAM Preditivo</h1>
                  <p className="text-xl opacity-90">
                    Inteligência Artificial Avançada para Análise de Modelos Preditivos
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-6 text-sm">
                <span className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full backdrop-blur-sm">
                  <Shield className="w-4 h-4" />
                  Segurança Enterprise
                </span>
                <span className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full backdrop-blur-sm">
                  <Zap className="w-4 h-4" />
                  Análise em Tempo Real
                </span>
                <span className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full backdrop-blur-sm">
                  <Cpu className="w-4 h-4" />
                  IA Avançada
                </span>
                <span className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full backdrop-blur-sm">
                  <Globe className="w-4 h-4" />
                  Suporte Global 24/7
                </span>
              </div>
            </div>
            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm min-w-[280px]">
              <div className="text-center mb-4">
                <div className="text-5xl font-bold">{modelosAnalisados.length}</div>
                <div className="text-sm opacity-90 mt-2">Modelos Analisados</div>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <div 
                  className="h-3 rounded-full bg-gradient-to-r from-green-400 to-blue-500"
                  style={{ width: `${Math.min((modelosAnalisados.length / 50) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs opacity-80 mt-2 text-center">
                Capacidade do sistema: {modelosAnalisados.length}/50 modelos ativos
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 ABAS DE NAVEGAÇÃO PREMIUM */}
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setAbaAtiva('dashboard')}
            className={`flex-1 py-6 font-bold text-lg flex items-center justify-center gap-3 transition-all ${
              abaAtiva === 'dashboard'
                ? 'border-b-4 border-[#0A1F44] text-[#0A1F44] bg-gradient-to-b from-white to-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart4 className="w-6 h-6" />
            Dashboard Inteligente
          </button>
          <button
            onClick={() => setAbaAtiva('modelos')}
            className={`flex-1 py-6 font-bold text-lg flex items-center justify-center gap-3 transition-all ${
              abaAtiva === 'modelos'
                ? 'border-b-4 border-[#0A1F44] text-[#0A1F44] bg-gradient-to-b from-white to-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Activity className="w-6 h-6" />
            Modelos ({modelosAnalisados.length})
          </button>
        </div>

        <div className="p-8">
          {abaAtiva === 'dashboard' && renderDashboard()}
          {abaAtiva === 'modelos' && renderModelos()}
        </div>
      </div>

      {/* 🔥 RENDERIZAR RELATÓRIO DETALHADO */}
      {renderRelatorioDetalhado()}
    </div>
  );
}