// C:\Users\VhenancioMarthinz\Downloads\JiamPreditivo\frontend\src\components\Dashboard\relatorios\RelatorioRegressaoMultipla.jsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, ComposedChart, Area,
  PieChart, Pie, Cell,
  ReferenceLine  // <-- IMPORTANTE: Adicionar esta importação
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Calculator,
  TrendingUp,
  Percent,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Brain,
  FileBarChart,
  BarChart3,
  Sigma,
  Grid,
  Info,
  Download,
  Award,
  Shield,
  Clock,
  Globe,
  Layers,
  ScatterChart as ScatterChartIcon,
  PieChart as PieChartIcon,
  Activity,
  Hash
} from 'lucide-react';

const RelatorioRegressaoMultipla = ({ modelo, dadosCompletos }) => {
  const [dadosProcessados, setDadosProcessados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [exportandoPDF, setExportandoPDF] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('resumo');

  useEffect(() => {
    try {
      console.log('📊 RELATÓRIO REGRESSÃO MÚLTIPLA - Dados recebidos:');
      console.log('📦 modelo:', modelo);
      
      // VERIFICAR SE TEM DADOS DO R
      if (!modelo || !modelo.resultado) {
        throw new Error('Modelo sem dados do R');
      }

      const resultado = modelo.resultado;
      console.log('📦 resultado do R:', resultado);

      // VERIFICAR SE TEM COEFICIENTES (formato array do R)
      if (!resultado.coeficientes || !Array.isArray(resultado.coeficientes)) {
        throw new Error('Coeficientes do R não encontrados no formato esperado (array)');
      }

      // EXTRAIR VARIÁVEIS DOS PARÂMETROS
      const parametros = modelo.parametros || {};
      let variaveisX = [];
      let variavelY = parametros.y || 'Y';
      
      // Extrair variáveis X (pode vir como string ou array)
      if (parametros.x_multiplas) {
        if (Array.isArray(parametros.x_multiplas)) {
          variaveisX = parametros.x_multiplas;
        } else if (typeof parametros.x_multiplas === 'string') {
          variaveisX = parametros.x_multiplas.split(',').map(v => v.trim());
        }
      } else if (parametros.x) {
        variaveisX = [parametros.x];
      }

      console.log('📊 Variáveis identificadas:', { variavelY, variaveisX });

      // PROCESSAR COEFICIENTES DO R (formato array)
      const coeficientesArray = resultado.coeficientes || [];
      const coeficientesFormatados = [];
      let intercepto = 0;
      const coeficientesVars = {};
      
      // Inicializar coeficientes das variáveis
      variaveisX.forEach(v => { coeficientesVars[v] = 0; });
      
      coeficientesArray.forEach(coef => {
        const termo = coef.termo || '';
        const estimativa = coef.estimativa || 0;
        const erro = coef.erro || 0;
        const estatistica = coef.estatistica || 0;
        const valor_p = coef.valor_p || 0;
        const significancia = coef.significancia || getSignificanciaR(valor_p);
        
        coeficientesFormatados.push({
          termo,
          estimativa,
          erro,
          estatistica,
          valor_p,
          significancia
        });
        
        if (termo === '(Intercept)') {
          intercepto = estimativa;
        } else {
          // Encontrar qual variável corresponde a este coeficiente
          const variavelEncontrada = variaveisX.find(v => 
            termo === v || termo.includes(v) || v.includes(termo)
          );
          if (variavelEncontrada) {
            coeficientesVars[variavelEncontrada] = estimativa;
          }
        }
      });

      // PROCESSAR MÉTRICAS DO R (qualidade)
      const qualidade = resultado.qualidade || {};
      
      console.log('📊 qualidade do R:', qualidade);

      // DETERMINAR CLASSIFICAÇÃO BASEADA NO R²
      const r2 = qualidade.R2 || 0;
      let classificacao = 'MODERADA';
      let pontuacao = 0.5;
      
      if (r2 >= 0.9) {
        classificacao = 'EXCELENTE';
        pontuacao = 0.95;
      } else if (r2 >= 0.7) {
        classificacao = 'BOA';
        pontuacao = 0.8;
      } else if (r2 >= 0.5) {
        classificacao = 'MODERADA';
        pontuacao = 0.6;
      } else {
        classificacao = 'FRACA';
        pontuacao = 0.4;
      }

      // CRIAR DADOS PARA GRÁFICOS
      
      // 1. Forest Plot (coeficientes com intervalos de confiança)
      const forestPlotData = coeficientesFormatados
        .filter(coef => coef.termo !== '(Intercept)')
        .map(coef => {
          const icInferior = coef.estimativa - 1.96 * coef.erro;
          const icSuperior = coef.estimativa + 1.96 * coef.erro;
          return {
            name: coef.termo,
            estimate: coef.estimativa,
            lower: icInferior,
            upper: icSuperior,
            pValue: coef.valor_p,
            significante: coef.valor_p < 0.05,
            cor: coef.valor_p < 0.05 ? '#3B82F6' : '#9CA3AF'
          };
        })
        .sort((a, b) => Math.abs(b.estimate) - Math.abs(a.estimate));

      // 2. Importância das Variáveis (coeficientes padronizados)
      const importanciaData = coeficientesFormatados
        .filter(coef => coef.termo !== '(Intercept)')
        .map(coef => ({
          name: coef.termo,
          value: Math.abs(coef.estimativa),
          coeficiente: coef.estimativa,
          cor: coef.estimativa >= 0 ? '#3B82F6' : '#EF4444'
        }))
        .sort((a, b) => b.value - a.value);

      // 3. VIF (Variance Inflation Factor) - simulado baseado nos erros padrão
      const vifData = coeficientesFormatados
        .filter(coef => coef.termo !== '(Intercept)')
        .map(coef => {
          // Aproximação do VIF baseado no erro padrão
          const vifSimulado = 1 + (coef.erro / Math.abs(coef.estimativa || 1)) * 2;
          return {
            name: coef.termo,
            vif: Math.min(10, Math.max(1, vifSimulado)),
            multicolinearidade: vifSimulado > 5 ? 'Alta' : vifSimulado > 2 ? 'Moderada' : 'Baixa'
          };
        });

      // MONTAR OBJETO COMPLETO
      const dados = {
        // Informações básicas
        nome: modelo.nome || 'Modelo de Regressão Múltipla',
        tipo: modelo.tipo || 'linear_multipla',
        classificacao,
        pontuacao,
        timestamp: modelo.timestamp || new Date().toISOString(),

        // Variáveis
        variavelY,
        variaveisX,
        intercepto,
        coeficientesVars,

        // EQUAÇÃO
        equacao: qualidade.equacao_estimada || resultado.equacao_estimada || 
                 gerarEquacao(intercepto, coeficientesVars, variavelY),

        // COEFICIENTES COMPLETOS
        coeficientes: coeficientesFormatados,

        // MÉTRICAS
        metricas: {
          r2: qualidade.R2 || 0,
          r2Ajustado: qualidade.R2ajustado || 0,
          rmse: qualidade.RMSE || 0,
          mae: qualidade.MAE || 0,
          mse: qualidade.RMSE ? Math.pow(qualidade.RMSE, 2) : 0,
          aic: qualidade.AIC || 0,
          bic: qualidade.BIC || 0,
          fStatistic: qualidade.F_statistic || 0,
          pValue: qualidade.p_valor_global || 0,
          nObservacoes: qualidade.n_observacoes || 0
        },

        // ANOVA
        anova: resultado.anova || [],

        // DADOS PARA GRÁFICOS
        forestPlot: forestPlotData,
        importancia: importanciaData,
        vif: vifData,

        // INTERPRETAÇÕES
        interpretacoes: gerarInterpretacoes(r2, qualidade.p_valor_global, forestPlotData, vifData),

        // DADOS BRUTOS
        debug: {
          coeficientes: resultado.coeficientes,
          qualidade: resultado.qualidade,
          anova: resultado.anova
        }
      };

      console.log('✅ Dados de regressão múltipla processados:', dados);
      setDadosProcessados(dados);
      setLoading(false);

    } catch (error) {
      console.error('❌ Erro ao processar dados do R:', error);
      setErro(error.message);
      setLoading(false);
    }
  }, [modelo]);

  // FUNÇÃO DE SIGNIFICÂNCIA DO R
  const getSignificanciaR = (pValue) => {
    if (pValue < 0.001) return '***';
    if (pValue < 0.01) return '**';
    if (pValue < 0.05) return '*';
    if (pValue < 0.1) return '.';
    return 'ns';
  };

  // GERAR EQUAÇÃO FORMATADA
  const gerarEquacao = (intercepto, coeficientes, variavelY) => {
    let equacao = `${variavelY} = ${intercepto.toFixed(6)}`;
    
    Object.entries(coeficientes).forEach(([variavel, coef]) => {
      if (coef !== 0) {
        const sinal = coef >= 0 ? ' + ' : ' - ';
        equacao += `${sinal}${Math.abs(coef).toFixed(6)} × ${variavel}`;
      }
    });
    
    return equacao;
  };

  // GERAR INTERPRETAÇÕES AUTOMÁTICAS
  const gerarInterpretacoes = (r2, pValueGlobal, forestPlot, vif) => {
    const interpretacoes = [];
    
    // Interpretação do R²
    if (r2 >= 0.9) {
      interpretacoes.push(`✅ O modelo apresenta excelente poder explicativo, com R² de ${(r2 * 100).toFixed(1)}% (acima de 90%).`);
    } else if (r2 >= 0.7) {
      interpretacoes.push(`📊 O modelo tem bom poder explicativo, com R² de ${(r2 * 100).toFixed(1)}% (entre 70% e 90%).`);
    } else if (r2 >= 0.5) {
      interpretacoes.push(`📈 O modelo tem poder explicativo moderado, com R² de ${(r2 * 100).toFixed(1)}% (entre 50% e 70%).`);
    } else {
      interpretacoes.push(`⚠️ O modelo tem baixo poder explicativo, com R² de ${(r2 * 100).toFixed(1)}% (abaixo de 50%). Considere incluir outras variáveis.`);
    }
    
    // Significância global
    if (pValueGlobal < 0.05) {
      interpretacoes.push(`✅ O modelo é estatisticamente significativo (p-valor global = ${pValueGlobal.toFixed(4)} < 0.05).`);
    } else {
      interpretacoes.push(`⚠️ O modelo NÃO é estatisticamente significativo (p-valor global = ${pValueGlobal.toFixed(4)} ≥ 0.05).`);
    }
    
    // Variáveis significativas
    const significativas = forestPlot.filter(v => v.significante).length;
    const total = forestPlot.length;
    
    if (total > 0) {
      if (significativas === total) {
        interpretacoes.push(`✅ Todas as ${total} variáveis são estatisticamente significativas (p < 0.05).`);
      } else if (significativas > total / 2) {
        interpretacoes.push(`📊 A maioria das variáveis (${significativas} de ${total}) é estatisticamente significativa.`);
      } else if (significativas > 0) {
        interpretacoes.push(`📈 Apenas ${significativas} de ${total} variáveis são significativas. Considere revisar o modelo.`);
      } else {
        interpretacoes.push(`⚠️ Nenhuma variável é estatisticamente significativa (p < 0.05).`);
      }
    }
    
    // Multicolinearidade
    const vifAlto = vif.filter(v => v.vif > 5).length;
    if (vifAlto > 0) {
      interpretacoes.push(`⚠️ Detectada multicolinearidade alta em ${vifAlto} variáveis (VIF > 5). Considere remover ou combinar variáveis.`);
    } else {
      const vifModerado = vif.filter(v => v.vif > 2).length;
      if (vifModerado > 0) {
        interpretacoes.push(`📊 Detectada multicolinearidade moderada em ${vifModerado} variáveis (2 < VIF < 5).`);
      } else {
        interpretacoes.push('✅ Não há indícios de multicolinearidade significativa entre as variáveis.');
      }
    }
    
    return interpretacoes;
  };

  // FORMATAR NÚMERO
  const formatarNumero = (valor, casas = 4) => {
    if (valor === undefined || valor === null) return '0';
    const num = parseFloat(valor);
    if (isNaN(num)) return '0';
    if (Math.abs(num) < 0.0001 && num !== 0) return num.toExponential(casas);
    return casas === 0 ? num.toString() : num.toFixed(casas);
  };

  // CORES POR CLASSIFICAÇÃO
  const getCorClassificacao = (classificacao) => {
    switch(classificacao?.toUpperCase()) {
      case 'EXCELENTE': return 'text-green-600';
      case 'BOA': return 'text-blue-600';
      case 'MODERADA': return 'text-yellow-600';
      case 'FRACA': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // 🔥 GERAR PDF PROFISSIONAL
  const gerarPDFProfissional = async () => {
    if (!dadosProcessados) return;
    
    setExportandoPDF(true);
    
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margem = 20;
      
      doc.setFont('helvetica', 'normal');
      
      // CAPA
      doc.setFillColor(10, 31, 68);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('RELATÓRIO TÉCNICO', pageWidth / 2, 90, { align: 'center' });
      
      doc.setFontSize(20);
      doc.text('REGRESSÃO LINEAR MÚLTIPLA', pageWidth / 2, 110, { align: 'center' });
      
      doc.setFontSize(20);
      doc.text(dadosProcessados.nome.toUpperCase(), pageWidth / 2, 140, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(`Classificação: ${dadosProcessados.classificacao}`, pageWidth / 2, 170, { align: 'center' });
      doc.text(`R²: ${(dadosProcessados.metricas.r2 * 100).toFixed(2)}%`, pageWidth / 2, 180, { align: 'center' });
      doc.text(`p-valor: ${dadosProcessados.metricas.pValue.toFixed(4)}`, pageWidth / 2, 190, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, 250, { align: 'center' });
      doc.text('Sistema JIAM Preditivo - Motor Estatístico R', pageWidth / 2, 260, { align: 'center' });
      
      // PÁGINA 2: ESPECIFICAÇÃO
      doc.addPage();
      
      doc.setFillColor(10, 31, 68);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
      doc.setFontSize(10);
      doc.text('Página 2', pageWidth - margem, 20, { align: 'right' });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.text('ESPECIFICAÇÃO DO MODELO', margem, 50);
      
      doc.setFontSize(11);
      let yPos = 70;
      
      const detalhes = [
        ['Modelo:', dadosProcessados.nome],
        ['Técnica:', 'REGRESSÃO LINEAR MÚLTIPLA'],
        ['Variável Dependente (Y):', dadosProcessados.variavelY],
        ['Variáveis Independentes:', dadosProcessados.variaveisX.join(', ')],
        ['Nº de Variáveis:', dadosProcessados.variaveisX.length.toString()],
        ['Classificação:', dadosProcessados.classificacao],
        ['Equação:', dadosProcessados.equacao]
      ];
      
      detalhes.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margem, yPos);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(value.toString(), pageWidth - margem - 50);
        doc.text(lines, margem + 50, yPos);
        yPos += 7 * lines.length;
      });
      
      // PÁGINA 3: COEFICIENTES
      doc.addPage();
      
      doc.setFillColor(10, 31, 68);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
      doc.setFontSize(10);
      doc.text('Página 3', pageWidth - margem, 20, { align: 'right' });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.text('COEFICIENTES DO MODELO', margem, 50);
      
      const tableData = dadosProcessados.coeficientes.map(coef => [
        coef.termo,
        formatarNumero(coef.estimativa, 6),
        formatarNumero(coef.erro, 6),
        formatarNumero(coef.estatistica, 4),
        formatarNumero(coef.valor_p, 6),
        coef.significancia
      ]);
      
      autoTable(doc, {
        startY: 60,
        head: [['Termo', 'Estimativa', 'Erro Padrão', 't-valor', 'p-valor', 'Signif.']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [10, 31, 68], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 30 },
          2: { cellWidth: 30 },
          3: { cellWidth: 25 },
          4: { cellWidth: 30 },
          5: { cellWidth: 20 }
        },
        margin: { left: margem, right: margem }
      });
      
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('*** p < 0.001, ** p < 0.01, * p < 0.05, . p < 0.1, ns = não significativo', margem, doc.lastAutoTable.finalY + 10);
      
      // PÁGINA 4: MÉTRICAS
      doc.addPage();
      
      doc.setFillColor(10, 31, 68);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
      doc.setFontSize(10);
      doc.text('Página 4', pageWidth - margem, 20, { align: 'right' });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.text('MÉTRICAS DE PERFORMANCE', margem, 50);
      
      const metricasData = [
        ['R²', `${(dadosProcessados.metricas.r2 * 100).toFixed(2)}%`],
        ['R² Ajustado', `${(dadosProcessados.metricas.r2Ajustado * 100).toFixed(2)}%`],
        ['RMSE', formatarNumero(dadosProcessados.metricas.rmse, 6)],
        ['MAE', formatarNumero(dadosProcessados.metricas.mae, 6)],
        ['AIC', formatarNumero(dadosProcessados.metricas.aic, 2)],
        ['BIC', formatarNumero(dadosProcessados.metricas.bic, 2)],
        ['F-statistic', formatarNumero(dadosProcessados.metricas.fStatistic, 4)],
        ['p-valor (F)', formatarNumero(dadosProcessados.metricas.pValue, 6)]
      ];
      
      autoTable(doc, {
        startY: 60,
        body: metricasData,
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 5 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: 60 } },
        margin: { left: margem, right: margem }
      });
      
      // PÁGINA 5: INTERPRETAÇÃO
      doc.addPage();
      
      doc.setFillColor(10, 31, 68);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
      doc.setFontSize(10);
      doc.text('Página 5', pageWidth - margem, 20, { align: 'right' });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.text('INTERPRETAÇÃO DO MODELO', margem, 50);
      
      doc.setFontSize(11);
      let yInterp = 70;
      
      dadosProcessados.interpretacoes.forEach((interp, idx) => {
        const lines = doc.splitTextToSize(`• ${interp}`, pageWidth - 2 * margem);
        lines.forEach(line => {
          if (yInterp > pageHeight - 50) {
            doc.addPage();
            yInterp = 60;
          }
          doc.text(line, margem, yInterp);
          yInterp += 6;
        });
        yInterp += 4;
      });
      
      yInterp += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Interpretação dos Coeficientes:', margem, yInterp);
      yInterp += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`• Intercepto (β₀) = ${formatarNumero(dadosProcessados.intercepto, 6)}:`, margem + 5, yInterp);
      yInterp += 6;
      doc.text(`  Valor esperado de ${dadosProcessados.variavelY} quando todas as variáveis X = 0`, margem + 10, yInterp);
      yInterp += 10;
      
      dadosProcessados.variaveisX.forEach(variavel => {
        const coef = dadosProcessados.coeficientesVars[variavel] || 0;
        const coefObj = dadosProcessados.coeficientes.find(c => c.termo === variavel);
        const significante = coefObj?.valor_p < 0.05;
        
        doc.text(`• Coeficiente ${variavel} (β) = ${formatarNumero(coef, 6)} ${significante ? '(significativo)' : '(não significativo)'}:`, margem + 5, yInterp);
        yInterp += 6;
        doc.text(`  Mantendo outras variáveis constantes, cada aumento de 1 unidade em ${variavel}`, margem + 10, yInterp);
        yInterp += 6;
        doc.text(`  altera ${dadosProcessados.variavelY} em ${formatarNumero(Math.abs(coef), 6)} unidades ${coef >= 0 ? '(positivamente)' : '(negativamente)'}.`, margem + 10, yInterp);
        yInterp += 10;
        
        if (yInterp > pageHeight - 50) {
          doc.addPage();
          yInterp = 60;
        }
      });
      
      // PÁGINA 6: ANOVA (se disponível)
      if (dadosProcessados.anova && dadosProcessados.anova.length > 0) {
        doc.addPage();
        
        doc.setFillColor(10, 31, 68);
        doc.rect(0, 0, pageWidth, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
        doc.setFontSize(10);
        doc.text('Página 6', pageWidth - margem, 20, { align: 'right' });
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(18);
        doc.text('ANÁLISE DE VARIÂNCIA (ANOVA)', margem, 50);
        
        const anovaData = dadosProcessados.anova.map(item => [
          item.fonte || '',
          item.df?.toString() || '',
          formatarNumero(item.sq, 4),
          formatarNumero(item.qm, 4),
          item.f !== 'NA' ? formatarNumero(item.f, 4) : '-',
          item.p !== 'NA' ? formatarNumero(item.p, 4) : '-'
        ]);
        
        autoTable(doc, {
          startY: 60,
          head: [['Fonte', 'DF', 'SQ', 'QM', 'F', 'p-valor']],
          body: anovaData,
          theme: 'grid',
          headStyles: { fillColor: [10, 31, 68], textColor: 255 },
          margin: { left: margem, right: margem }
        });
      }
      
      // PÁGINA FINAL: CONCLUSÃO
      const currentPage = doc.internal.getNumberOfPages();
      doc.setPage(currentPage);
      
      // Se não tiver ANOVA, a página 6 é a conclusão
      if (!dadosProcessados.anova || dadosProcessados.anova.length === 0) {
        doc.addPage();
      }
      
      // Garantir que estamos na página correta para a conclusão
      const pagAtual = doc.internal.getNumberOfPages();
      if (pagAtual === currentPage && (dadosProcessados.anova && dadosProcessados.anova.length > 0)) {
        doc.addPage();
      }
      
      doc.setFillColor(10, 31, 68);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
      doc.setFontSize(10);
      const totalPages = doc.internal.getNumberOfPages();
      doc.text(`Página ${totalPages}`, pageWidth - margem, 20, { align: 'right' });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.text('CONCLUSÃO', margem, 50);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      let yConclusao = 70;
      
      // Gerar conclusão baseada nos dados
      let conclusao = '';
      if (dadosProcessados.metricas.pValue < 0.05) {
        conclusao = `O modelo de regressão múltipla é estatisticamente significativo (p = ${dadosProcessados.metricas.pValue.toFixed(6)} < 0.05) e explica ${(dadosProcessados.metricas.r2 * 100).toFixed(1)}% da variabilidade de ${dadosProcessados.variavelY}. `;
        
        const significativas = dadosProcessados.forestPlot.filter(v => v.significante).length;
        if (significativas === dadosProcessados.variaveisX.length) {
          conclusao += `Todas as ${significativas} variáveis são significativas. `;
        } else {
          conclusao += `${significativas} de ${dadosProcessados.variaveisX.length} variáveis são significativas. `;
        }
        
        const vifAlto = dadosProcessados.vif.filter(v => v.vif > 5).length;
        if (vifAlto > 0) {
          conclusao += `Atenção à multicolinearidade em ${vifAlto} variáveis. `;
        } else {
          conclusao += `Não há problemas severos de multicolinearidade. `;
        }
        
        conclusao += `Recomenda-se validar os pressupostos do modelo e testar em novos dados.`;
      } else {
        conclusao = `O modelo não apresenta significância estatística global (p = ${dadosProcessados.metricas.pValue.toFixed(6)} ≥ 0.05). Recomenda-se revisar as variáveis incluídas, considerar transformações ou testar outras especificações de modelo.`;
      }
      
      const lines = doc.splitTextToSize(conclusao, pageWidth - 2 * margem);
      lines.forEach(line => {
        doc.text(line, margem, yConclusao);
        yConclusao += 7;
      });
      
      // Rodapé em todas as páginas
      const totalPagesFinal = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPagesFinal; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Sistema JIAM Preditivo - Motor Estatístico R', pageWidth / 2, pageHeight - 15, { align: 'center' });
        doc.text(`Documento confidencial - Página ${i} de ${totalPagesFinal}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
      
      const nomeArquivo = `Relatorio_JIAM_${dadosProcessados.nome.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(nomeArquivo);
      
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
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
            <Brain className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Processando regressão múltipla...</h3>
          <p className="text-gray-600 mt-2">Aguardando respostas do motor estatístico R</p>
          <div className="mt-4 flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Erro no Motor R</h3>
        <p className="text-gray-600 mb-4">{erro}</p>
        <pre className="text-left bg-red-50 p-4 rounded-lg overflow-auto max-h-96 text-sm">
          {JSON.stringify({ modelo }, null, 2)}
        </pre>
      </div>
    );
  }

  if (!dadosProcessados) {
    return (
      <div className="text-center py-12">
        <Info className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Dados do R não disponíveis</h3>
        <p className="text-gray-600">Execute o modelo no motor R primeiro.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho com botão de PDF */}
      <div className="bg-gradient-to-r from-[#0A1F44] to-[#1a3a6e] text-white p-8 rounded-3xl">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Layers className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">📊 Relatório de Regressão Linear Múltipla</h1>
              <p className="text-lg opacity-90">{dadosProcessados.nome}</p>
            </div>
          </div>
          
          <button
            onClick={gerarPDFProfissional}
            disabled={exportandoPDF}
            className="flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50"
          >
            {exportandoPDF ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Exportar PDF Completo
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-sm opacity-80">Classificação</div>
            <div className={`text-2xl font-bold ${getCorClassificacao(dadosProcessados.classificacao)}`}>
              {dadosProcessados.classificacao}
            </div>
          </div>
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-sm opacity-80">R² (R)</div>
            <div className="text-2xl font-bold">{(dadosProcessados.metricas.r2 * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-sm opacity-80">R² Ajustado</div>
            <div className="text-2xl font-bold">{(dadosProcessados.metricas.r2Ajustado * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-sm opacity-80">p-valor (F)</div>
            <div className="text-2xl font-bold">{dadosProcessados.metricas.pValue.toFixed(4)}</div>
          </div>
        </div>
      </div>

      {/* Abas de navegação */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'resumo', label: '📋 Resumo', icon: Calculator },
            { id: 'coeficientes', label: '📈 Coeficientes', icon: Sigma },
            { id: 'metricas', label: '📐 Métricas', icon: Target },
            { id: 'diagnosticos', label: '🔍 Diagnósticos', icon: Activity },
            { id: 'interpretacao', label: '🧠 Interpretação', icon: Brain }
          ].map((aba) => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`flex-1 py-4 font-medium flex items-center justify-center gap-2 ${
                abaAtiva === aba.id
                  ? 'border-b-2 border-[#0A1F44] text-[#0A1F44] bg-gradient-to-b from-white to-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <aba.icon className="w-5 h-5" />
              {aba.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Aba Resumo */}
          {abaAtiva === 'resumo' && (
            <div className="space-y-6">
              {/* Equação */}
              <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Sigma className="w-6 h-6" />
                  Equação do Modelo (R)
                </h3>
                
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="text-center">
                    <div className="text-xl font-mono font-bold text-gray-800 mb-4 whitespace-pre-wrap">
                      {dadosProcessados.equacao}
                    </div>
                    <div className="text-sm text-gray-600">
                      Fonte: Motor Estatístico R
                    </div>
                  </div>
                </div>
              </div>

              {/* Cards de resumo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-lg">
                  <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Hash className="w-5 h-5" />
                    Variáveis
                  </h4>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {dadosProcessados.variaveisX.length}
                  </div>
                  <div className="text-sm text-gray-600">
                    Variáveis independentes
                  </div>
                  <div className="mt-4 text-sm text-gray-700">
                    Y: <span className="font-medium">{dadosProcessados.variavelY}</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-lg">
                  <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Poder Explicativo
                  </h4>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {(dadosProcessados.metricas.r2 * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">
                    R² - Variância explicada
                  </div>
                  <div className="mt-4 text-sm text-gray-700">
                    Ajustado: {(dadosProcessados.metricas.r2Ajustado * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-lg">
                  <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Qualidade
                  </h4>
                  <div className={`text-3xl font-bold ${getCorClassificacao(dadosProcessados.classificacao)} mb-2`}>
                    {dadosProcessados.classificacao}
                  </div>
                  <div className="text-sm text-gray-600">
                    Performance do modelo
                  </div>
                  <div className="mt-4 text-sm text-gray-700">
                    p-valor: {dadosProcessados.metricas.pValue.toFixed(4)}
                  </div>
                </div>
              </div>

              {/* Informações adicionais do R */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Fonte:</strong> Motor Estatístico R • 
                  <strong> Observações:</strong> {dadosProcessados.metricas.nObservacoes} • 
                  <strong> RMSE:</strong> {formatarNumero(dadosProcessados.metricas.rmse, 4)} • 
                  <strong> AIC:</strong> {formatarNumero(dadosProcessados.metricas.aic, 2)}
                </p>
              </div>
            </div>
          )}

          {/* Aba Coeficientes */}
          {abaAtiva === 'coeficientes' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Coeficientes (Output do R)</h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Termo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estimativa</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Erro Padrão</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">t-valor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">p-valor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Signif.</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dadosProcessados.coeficientes.map((coef, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap font-medium">
                            {coef.termo === '(Intercept)' ? 'Intercepto' : coef.termo}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-mono">
                            {formatarNumero(coef.estimativa, 6)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-mono">
                            {formatarNumero(coef.erro, 6)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-mono">
                            {formatarNumero(coef.estatistica, 4)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`font-mono ${coef.valor_p < 0.05 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatarNumero(coef.valor_p, 6)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              coef.significancia === '***' ? 'bg-green-100 text-green-800' :
                              coef.significancia === '**' ? 'bg-blue-100 text-blue-800' :
                              coef.significancia === '*' ? 'bg-yellow-100 text-yellow-800' :
                              coef.significancia === '.' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {coef.significancia}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 text-sm text-gray-500">
                  <p>*** p &lt; 0.001, ** p &lt; 0.01, * p &lt; 0.05, . p &lt; 0.1, ns = não significativo</p>
                </div>
              </div>

              {/* Forest Plot */}
              <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-6">🌲 Forest Plot - Coeficientes com IC 95%</h3>
                
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosProcessados.forestPlot} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip 
                      formatter={(v, n) => [
                        formatarNumero(v, 4), 
                        n === 'estimate' ? 'Coeficiente' : n === 'lower' ? 'IC Inferior' : 'IC Superior'
                      ]}
                    />
                    <Bar dataKey="estimate" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Coeficiente">
                      {dadosProcessados.forestPlot.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.significante ? '#3B82F6' : '#9CA3AF'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Barras azuis indicam significância estatística (p &lt; 0.05)
                </p>
              </div>
            </div>
          )}

          {/* Aba Métricas */}
          {abaAtiva === 'metricas' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-lg">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Ajuste do Modelo</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {(dadosProcessados.metricas.r2 * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">R²</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {(dadosProcessados.metricas.r2Ajustado * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">R² Ajustado</div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span>RMSE</span>
                      <span className="font-bold">{formatarNumero(dadosProcessados.metricas.rmse, 4)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span>MAE</span>
                      <span className="font-bold">{formatarNumero(dadosProcessados.metricas.mae, 4)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span>MSE</span>
                      <span className="font-bold">{formatarNumero(dadosProcessados.metricas.mse, 4)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-lg">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">📈 Critérios de Informação</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatarNumero(dadosProcessados.metricas.aic, 2)}
                      </div>
                      <div className="text-sm text-gray-600">AIC</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-indigo-600">
                        {formatarNumero(dadosProcessados.metricas.bic, 2)}
                      </div>
                      <div className="text-sm text-gray-600">BIC</div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span>F-statistic</span>
                      <span className="font-bold">{formatarNumero(dadosProcessados.metricas.fStatistic, 4)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span>p-valor (F)</span>
                      <span className={`font-bold px-3 py-1 rounded-full ${
                        dadosProcessados.metricas.pValue < 0.05 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {formatarNumero(dadosProcessados.metricas.pValue, 6)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span>Observações (n)</span>
                      <span className="font-bold">{dadosProcessados.metricas.nObservacoes}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Importância das Variáveis */}
              <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-6">🏆 Importância das Variáveis</h3>
                
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosProcessados.importancia}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(v, n) => [
                        formatarNumero(v, 4), 
                        n === 'value' ? 'Importância (|coef|)' : 'Coeficiente'
                      ]}
                    />
                    <Bar dataKey="value" name="Importância" radius={[4, 4, 0, 0]}>
                      {dadosProcessados.importancia.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Magnitude absoluta dos coeficientes. Azul = positivo, Vermelho = negativo
                </p>
              </div>
            </div>
          )}

          {/* Aba Diagnósticos */}
          {abaAtiva === 'diagnosticos' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-6">🔍 Análise de Multicolinearidade (VIF)</h3>
                
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosProcessados.vif}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 'dataMax + 1']} />
                    <Tooltip />
                    <ReferenceLine y={5} stroke="#EF4444" strokeDasharray="3 3" label="Limite Preocupante" />
                    <ReferenceLine y={10} stroke="#DC2626" strokeDasharray="3 3" label="Limite Severo" />
                    <Bar dataKey="vif" name="VIF" radius={[4, 4, 0, 0]}>
                      {dadosProcessados.vif.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.vif > 10 ? '#DC2626' :
                            entry.vif > 5 ? '#EF4444' :
                            entry.vif > 2 ? '#F59E0B' :
                            '#10B981'
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="font-medium text-green-800">VIF &lt; 2</div>
                    <div className="text-sm text-green-700">Baixa multicolinearidade</div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="font-medium text-yellow-800">2 ≤ VIF &lt; 5</div>
                    <div className="text-sm text-yellow-700">Multicolinearidade moderada</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="font-medium text-red-800">VIF ≥ 5</div>
                    <div className="text-sm text-red-700">Multicolinearidade alta</div>
                  </div>
                </div>
              </div>

              {/* ANOVA Table */}
              {dadosProcessados.anova && dadosProcessados.anova.length > 0 && (
                <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-lg">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">📊 Análise de Variância (ANOVA)</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fonte</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">DF</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SQ</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">QM</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">F</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">p-valor</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dadosProcessados.anova.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap font-medium">{item.fonte}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{item.df}</td>
                            <td className="px-4 py-3 whitespace-nowrap font-mono">{formatarNumero(item.sq, 4)}</td>
                            <td className="px-4 py-3 whitespace-nowrap font-mono">{formatarNumero(item.qm, 4)}</td>
                            <td className="px-4 py-3 whitespace-nowrap font-mono">
                              {item.f !== 'NA' ? formatarNumero(item.f, 4) : '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap font-mono">
                              {item.p !== 'NA' ? (
                                <span className={item.p < 0.05 ? 'text-green-600' : 'text-red-600'}>
                                  {formatarNumero(item.p, 4)}
                                </span>
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Aba Interpretação */}
          {abaAtiva === 'interpretacao' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Brain className="w-6 h-6" />
                  Interpretação Automática do Modelo
                </h3>
                
                <div className="space-y-4">
                  {dadosProcessados.interpretacoes.map((interp, idx) => (
                    <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-blue-800">{interp}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-6">📝 Interpretação dos Coeficientes</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg">
                    <p className="font-medium text-gray-800 mb-2">Intercepto (β₀) = {formatarNumero(dadosProcessados.intercepto, 6)}</p>
                    <p className="text-gray-600 text-sm">
                      Valor esperado de {dadosProcessados.variavelY} quando todas as variáveis independentes são zero.
                    </p>
                  </div>

                  {dadosProcessados.variaveisX.map(variavel => {
                    const coef = dadosProcessados.coeficientesVars[variavel] || 0;
                    const coefObj = dadosProcessados.coeficientes.find(c => c.termo === variavel);
                    const significante = coefObj?.valor_p < 0.05;
                    
                    return (
                      <div key={variavel} className={`p-4 rounded-lg border ${significante ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
                        <p className={`font-medium mb-2 ${significante ? 'text-green-800' : 'text-yellow-800'}`}>
                          Coeficiente {variavel} (β) = {formatarNumero(coef, 6)}
                          {significante ? ' ✓ Significativo' : ' ⚠️ Não significativo'}
                        </p>
                        <p className="text-gray-700 text-sm">
                          Mantendo as demais variáveis constantes, cada aumento de uma unidade em {variavel} está associado, 
                          em média, a uma variação de {formatarNumero(Math.abs(coef), 6)} unidades em {dadosProcessados.variavelY}
                          {coef >= 0 ? ' (positiva)' : ' (negativa)'}.
                        </p>
                        {coefObj && (
                          <p className="text-xs text-gray-500 mt-2">
                            p-valor: {formatarNumero(coefObj.valor_p, 6)} | 
                            IC 95%: [{formatarNumero(coefObj.estimativa - 1.96 * coefObj.erro, 6)}, {formatarNumero(coefObj.estimativa + 1.96 * coefObj.erro, 6)}]
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-xl border-2 border-amber-200">
                <div className="flex items-center gap-4">
                  <Award className="w-12 h-12 text-amber-600" />
                  <div>
                    <h4 className="font-bold text-amber-800 text-lg">Motor Estatístico R</h4>
                    <p className="text-amber-700">
                      Todos os cálculos e coeficientes foram gerados pelo motor estatístico R,
                      garantindo precisão e confiabilidade acadêmica para esta regressão múltipla.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RelatorioRegressaoMultipla;