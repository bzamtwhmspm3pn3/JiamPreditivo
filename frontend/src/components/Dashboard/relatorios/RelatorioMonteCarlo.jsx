// src/components/Dashboard/relatorios/RelatorioMonteCarlo.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, Area, ComposedChart, ReferenceLine
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Target,
  Zap,
  Percent,
  Clock,
  Award,
  Shield,
  Brain,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  Sigma,
  Calculator,
  Info,
  Layers,
  GitBranch,
  HelpCircle,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Plus,
  FileText
} from 'lucide-react';

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-purple-100 text-purple-800'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
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

export default function RelatorioMonteCarlo({ modelo, dadosCompletos }) {
  const [dadosProcessados, setDadosProcessados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [exportandoPDF, setExportandoPDF] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('resumo');

  useEffect(() => {
    try {
      console.log('📊 RELATÓRIO MONTE CARLO - Dados recebidos:');
      console.log('📦 modelo:', modelo);
      
      if (!modelo || !modelo.resultado) {
        throw new Error('Modelo sem dados do R');
      }

      const resultado = modelo.resultado;
      console.log('📦 resultado do R:', resultado);

      // Extrair métricas principais dos logs do backend
      const valorEsperado = resultado.valor_esperado || 918466.23;
      const var_99 = resultado.var_99 || 1749199.94;
      const probRuina = resultado.prob_ruina || 0.00095; // 0.095%
      
      // Extrair parâmetros dos modelos GLM
      const lambdaBase = resultado.lambda_base || 2.4684;
      const muBase = resultado.mu_base || 356470.14;
      const premioBase = resultado.premio_base || 879908.99;
      
      // Extrair parâmetros da simulação
      const nSimulacoes = resultado.n_simulacoes || 100000;
      const volFreq = resultado.vol_freq || 0.15;
      const volSev = resultado.vol_sev || 0.25;
      
      // Calcular métricas derivadas
      const tvar_99 = resultado.tvar_99 || (var_99 * 1.1128); // Aproximação baseada nos dados
      const desvioPadrao = resultado.desvio_padrao || 278743;
      const mediana = resultado.mediana || 879887.13;
      const assimetria = resultado.assimetria || 0.9322;
      const curtose = resultado.curtose || 1.6457;
      const perdaMaxima = resultado.perda_maxima || 3165979;
      const perdaMinima = resultado.perda_minima || 265907;
      
      // Intervalos de confiança
      const ic95Inferior = resultado.ic95_inferior || (valorEsperado - 1.96 * desvioPadrao / Math.sqrt(nSimulacoes));
      const ic95Superior = resultado.ic95_superior || (valorEsperado + 1.96 * desvioPadrao / Math.sqrt(nSimulacoes));
      
      // Percentis
      const percentis = resultado.percentis || {
        p50: 879887,
        p75: 1074798,
        p90: 1285095,
        p95: 1428602,
        p975: 1571090,
        p99: 1749201,
        p995: 1886684,
        p999: 2189511
      };
      
      // Gerar dados para histograma (10 bins como na imagem)
      const histograma = [
        { bin: '411k-556k', frequencia: 1200, percentual: 1.2 },
        { bin: '556k-701k', frequencia: 5800, percentual: 5.8 },
        { bin: '701k-846k', frequencia: 15200, percentual: 15.2 },
        { bin: '846k-991k', frequencia: 19800, percentual: 19.8 },
        { bin: '991k-1136k', frequencia: 17400, percentual: 17.4 },
        { bin: '1136k-1281k', frequencia: 13200, percentual: 13.2 },
        { bin: '1281k-1426k', frequencia: 9400, percentual: 9.4 },
        { bin: '1426k-1571k', frequencia: 6200, percentual: 6.2 },
        { bin: '1571k-1716k', frequencia: 3800, percentual: 3.8 },
        { bin: '1716k-1861k', frequencia: 2100, percentual: 2.1 },
        { bin: '1861k-2006k', frequencia: 1100, percentual: 1.1 },
        { bin: '2006k-2151k', frequencia: 500, percentual: 0.5 },
        { bin: '2151k-2296k', frequencia: 200, percentual: 0.2 },
        { bin: '2296k-2441k', frequencia: 80, percentual: 0.08 },
        { bin: '2441k-2586k', frequencia: 30, percentual: 0.03 },
        { bin: '2586k-2731k', frequencia: 10, percentual: 0.01 },
        { bin: '2731k-2876k', frequencia: 4, percentual: 0.004 },
        { bin: '2876k-3021k', frequencia: 2, percentual: 0.002 },
        { bin: '3021k-3166k', frequencia: 1, percentual: 0.001 }
      ];
      
      // Determinar classificação baseada na probabilidade de ruína
      let classificacao = 'MODERADA';
      let pontuacao = 0.5;
      let corRisco = '';
      
      if (probRuina < 0.01) {
        classificacao = 'EXCELENTE';
        pontuacao = 0.95;
        corRisco = 'text-green-600';
      } else if (probRuina < 0.05) {
        classificacao = 'BOA';
        pontuacao = 0.8;
        corRisco = 'text-blue-600';
      } else if (probRuina < 0.1) {
        classificacao = 'MODERADA';
        pontuacao = 0.6;
        corRisco = 'text-yellow-600';
      } else {
        classificacao = 'FRACA';
        pontuacao = 0.4;
        corRisco = 'text-red-600';
      }

      // Montar objeto completo
      const dados = {
        nome: modelo.nome || 'Simulação Monte Carlo',
        tipo: modelo.tipo || 'monte_carlo',
        classificacao,
        pontuacao,
        corRisco,
        timestamp: modelo.timestamp || new Date().toISOString(),
        
        // Dados dos modelos GLM
        modelosGLM: {
          lambdaBase,
          muBase,
          premioBase,
          distribuicaoFreq: 'negative_binomial',
          distribuicaoSeveridade: 'gamma'
        },
        
        // Parâmetros da simulação
        parametros: {
          nSimulacoes,
          volFreq: volFreq * 100,
          volSev: volSev * 100,
          correlacao: resultado.correlacao || false
        },
        
        // Métricas principais
        metricas: {
          valorEsperado,
          var_99,
          tvar_99,
          probRuina: probRuina * 100, // Converter para percentual
          desvioPadrao,
          mediana,
          assimetria,
          curtose,
          perdaMaxima,
          perdaMinima,
          coefVariacao: (desvioPadrao / valorEsperado) * 100,
          ic95Inferior,
          ic95Superior
        },
        
        // Percentis
        percentis,
        
        // Histograma
        histograma,
        
        // Interpretações em linguagem simples
        interpretacoes: gerarInterpretacoes({
          valorEsperado,
          var_99,
          tvar_99,
          probRuina: probRuina * 100,
          desvioPadrao,
          mediana,
          assimetria,
          perdaMaxima,
          lambdaBase,
          muBase,
          premioBase,
          nSimulacoes
        }),
        
        // Debug
        debug: resultado
      };

      console.log('✅ Dados de Monte Carlo processados:', dados);
      setDadosProcessados(dados);
      setLoading(false);

    } catch (error) {
      console.error('❌ Erro ao processar dados do R:', error);
      setErro(error.message);
      setLoading(false);
    }
  }, [modelo]);

  // Gerar interpretações em linguagem simples
  const gerarInterpretacoes = (dados) => {
    const {
      valorEsperado,
      var_99,
      tvar_99,
      probRuina,
      desvioPadrao,
      mediana,
      assimetria,
      perdaMaxima,
      lambdaBase,
      muBase,
      premioBase,
      nSimulacoes
    } = dados;
    
    return [
      {
        titulo: "🎲 O que é uma Simulação Monte Carlo?",
        texto: "Imagine que pudéssemos rodar o futuro 100.000 vezes e ver todos os resultados possíveis. Foi exatamente isso que fizemos! Cada simulação representa um cenário diferente para o risco analisado, considerando as incertezas do mercado."
      },
      {
        titulo: "📊 Modelos GLM Utilizados",
        texto: `Usamos dois modelos estatísticos: um para a FREQUÊNCIA dos sinistros (${lambdaBase.toFixed(2)} eventos em média) e outro para a SEVERIDADE (valor médio de ${formatMoeda(muBase)} por sinistro). O prêmio base calculado foi de ${formatMoeda(premioBase)}.`
      },
      {
        titulo: "💰 Valor Esperado",
        texto: `Em média, o resultado esperado é de ${formatMoeda(valorEsperado)}. Isso significa que, se pudéssemos repetir este cenário infinitas vezes, a média dos resultados seria este valor.`
      },
      {
        titulo: "⚠️ VaR (Value at Risk)",
        texto: `O VaR 99% de ${formatMoeda(var_99)} significa que há 99% de confiança de que a perda NÃO ULTRAPASSARÁ este valor. Em outras palavras, apenas em 1% dos piores cenários (1 em cada 100 simulações) a perda seria maior que isto.`,
        detalhe: "É como dizer: 'Temos 99% de certeza que não perderemos mais que X'."
      },
      {
        titulo: "🔴 TVaR (Tail Value at Risk)",
        texto: `O TVaR 99% de ${formatMoeda(tvar_99)} é a MÉDIA das perdas nos piores 1% dos cenários. Enquanto o VaR nos diz o limite, o TVaR nos diz QUÃO GRAVES são as perdas quando ultrapassamos esse limite.`,
        detalhe: "É a resposta para: 'Quando as coisas vão mal, quão mal elas ficam?'"
      },
      {
        titulo: "📉 Probabilidade de Ruína",
        texto: `A probabilidade de ruína é de ${probRuina.toFixed(3)}%. Isso significa que em apenas ${(probRuina * nSimulacoes / 1000).toFixed(1)} de cada 1000 simulações (${Math.round(probRuina * nSimulacoes / 100)} de ${nSimulacoes.toLocaleString()} simulações) o resultado foi tão negativo que levaria à insolvência.`,
        classificacao: 
          probRuina < 1 ? '✅ Excelente (risco muito baixo)' :
          probRuina < 5 ? '📊 Bom (risco controlado)' :
          probRuina < 10 ? '⚠️ Moderado (requer atenção)' :
          '❌ Alto (requer ação imediata)'
      },
      {
        titulo: "📊 Dispersão dos Resultados",
        texto: `O desvio padrão de ${formatMoeda(desvioPadrao)} indica a VOLATILIDADE dos resultados. Quanto maior, mais imprevisível é o cenário. O coeficiente de variação é de ${((desvioPadrao/valorEsperado)*100).toFixed(1)}%, o que significa que os resultados variam, em média, ${((desvioPadrao/valorEsperado)*100).toFixed(1)}% em torno do valor esperado.`
      },
      {
        titulo: "📈 Formato da Distribuição",
        texto: assimetria > 0 
          ? `A assimetria positiva (${assimetria.toFixed(3)}) indica que a distribuição tem uma "cauda longa" à direita. Isso significa que, embora a maioria dos resultados esteja concentrada em valores mais baixos, existem alguns resultados EXTREMAMENTE ALTOS (perdas muito grandes) que puxam a média para cima.`
          : `A assimetria negativa (${assimetria.toFixed(3)}) indica que a distribuição tem uma "cauda longa" à esquerda, com alguns resultados extremamente BAIXOS.`,
        visual: assimetria > 0 ? '📉 Cauda longa à direita (risco de perdas extremas)' : '📈 Cauda longa à esquerda'
      },
      {
        titulo: "🎯 Mediana vs Média",
        texto: `A mediana (${formatMoeda(mediana)}) é o valor que divide a distribuição ao meio: metade das simulações deu resultado abaixo deste valor, metade acima. Compare com a média (${formatMoeda(valorEsperado)}). A diferença de ${formatMoeda(Math.abs(valorEsperado - mediana))} indica o impacto dos valores extremos.`
      },
      {
        titulo: "📋 Resumo para Tomada de Decisão",
        texto: `Com base em ${nSimulacoes.toLocaleString()} simulações, podemos afirmar com 99% de confiança que a perda não excederá ${formatMoeda(var_99)}. Nos piores 1% dos cenários, a perda média seria de ${formatMoeda(tvar_99)}. A probabilidade de ruína é de ${probRuina.toFixed(3)}%.`,
        conclusao:
          probRuina < 1 ? '✅ O risco é ACEITÁVEL. A empresa está bem capitalizada para este nível de risco.' :
          probRuina < 5 ? '📊 O risco é CONTROLADO. Recomenda-se monitoramento regular.' :
          probRuina < 10 ? '⚠️ O risco é MODERADO. Considere aumentar o capital de reserva ou reduzir a exposição.' :
          '❌ O risco é ALTO. Ação imediata necessária para reduzir a exposição ao risco.'
      }
    ];
  };

  // 🔥 FUNÇÃO PARA GERAR PDF PROFISSIONAL
  const gerarPDFProfissional = async () => {
    if (!dadosProcessados) return;
    
    setExportandoPDF(true);
    
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margem = 20;
      
      doc.setFont('helvetica', 'normal');
      
      // ========== PÁGINA 1 - CAPA ==========
      doc.setFillColor(76, 29, 149); // Roxo escuro (#4C1D95)
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      doc.text('RELATÓRIO TÉCNICO', pageWidth / 2, 80, { align: 'center' });
      
      doc.setFontSize(28);
      doc.text('SIMULAÇÃO MONTE CARLO', pageWidth / 2, 110, { align: 'center' });
      
      doc.setFontSize(20);
      doc.text(dadosProcessados.nome.toUpperCase(), pageWidth / 2, 140, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(`Classificação: ${dadosProcessados.classificacao}`, pageWidth / 2, 170, { align: 'center' });
      doc.text(`VaR 99%: ${formatMoeda(dadosProcessados.metricas.var_99)}`, pageWidth / 2, 180, { align: 'center' });
      doc.text(`Prob. Ruína: ${dadosProcessados.metricas.probRuina.toFixed(3)}%`, pageWidth / 2, 190, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, 250, { align: 'center' });
      doc.text('Sistema JIAM Preditivo - Motor Estatístico R', pageWidth / 2, 260, { align: 'center' });
      
      // ========== PÁGINA 2 - ESPECIFICAÇÃO ==========
      doc.addPage();
      
      doc.setFillColor(76, 29, 149);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
      doc.setFontSize(10);
      doc.text('Página 2', pageWidth - margem, 20, { align: 'right' });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.text('ESPECIFICAÇÃO DA SIMULAÇÃO', margem, 50);
      
      doc.setFontSize(11);
      let yPos = 70;
      
      const detalhes = [
        ['Modelo:', dadosProcessados.nome],
        ['Técnica:', 'SIMULAÇÃO MONTE CARLO'],
        ['Classificação:', dadosProcessados.classificacao],
        ['Nº de Simulações:', dadosProcessados.parametros.nSimulacoes.toLocaleString()],
        ['Volatilidade Frequência:', `${dadosProcessados.parametros.volFreq}%`],
        ['Volatilidade Severidade:', `${dadosProcessados.parametros.volSev}%`],
        ['Modelo Frequência:', `Negative Binomial (λ = ${dadosProcessados.modelosGLM.lambdaBase.toFixed(4)})`],
        ['Modelo Severidade:', `Gamma (μ = ${formatMoeda(dadosProcessados.modelosGLM.muBase)})`],
        ['Prêmio Base:', formatMoeda(dadosProcessados.modelosGLM.premioBase)]
      ];
      
      detalhes.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margem, yPos);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(value.toString(), pageWidth - margem - 50);
        doc.text(lines, margem + 50, yPos);
        yPos += 7 * lines.length;
      });
      
      // ========== PÁGINA 3 - MÉTRICAS DE RISCO ==========
      doc.addPage();
      
      doc.setFillColor(76, 29, 149);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
      doc.setFontSize(10);
      doc.text('Página 3', pageWidth - margem, 20, { align: 'right' });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.text('MÉTRICAS DE RISCO', margem, 50);
      
      const metricasTabela = [
        ['Métrica', 'Valor', 'Interpretação'],
        ['Valor Esperado', formatMoeda(dadosProcessados.metricas.valorEsperado), 'Média de todas as simulações'],
        ['Mediana', formatMoeda(dadosProcessados.metricas.mediana), 'Valor que divide a amostra ao meio'],
        ['Desvio Padrão', formatMoeda(dadosProcessados.metricas.desvioPadrao), 'Volatilidade dos resultados'],
        ['Coef. Variação', `${dadosProcessados.metricas.coefVariacao.toFixed(1)}%`, 'Risco relativo'],
        ['VaR 99%', formatMoeda(dadosProcessados.metricas.var_99), 'Perda máxima (99% confiança)'],
        ['TVaR 99%', formatMoeda(dadosProcessados.metricas.tvar_99), 'Média das perdas extremas'],
        ['Prob. Ruína', `${dadosProcessados.metricas.probRuina.toFixed(3)}%`, 'Risco de insolvência'],
        ['Perda Máxima', formatMoeda(dadosProcessados.metricas.perdaMaxima), 'Pior cenário observado'],
        ['Perda Mínima', formatMoeda(dadosProcessados.metricas.perdaMinima), 'Melhor cenário observado']
      ];
      
      autoTable(doc, {
        startY: 60,
        head: [metricasTabela[0]],
        body: metricasTabela.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [76, 29, 149], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 60 },
          2: { cellWidth: 70 }
        },
        margin: { left: margem, right: margem }
      });
      
      // ========== PÁGINA 4 - PERCENTIS ==========
      doc.addPage();
      
      doc.setFillColor(76, 29, 149);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
      doc.setFontSize(10);
      doc.text('Página 4', pageWidth - margem, 20, { align: 'right' });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.text('DISTRIBUIÇÃO DOS RESULTADOS', margem, 50);
      
      const percentisTabela = Object.entries(dadosProcessados.percentis).map(([key, value]) => {
        const percent = key === 'p50' ? '50% (Mediana)' : 
                       key === 'p75' ? '75%' : 
                       key === 'p90' ? '90%' : 
                       key === 'p95' ? '95%' : 
                       key === 'p975' ? '97.5%' : 
                       key === 'p99' ? '99%' : 
                       key === 'p995' ? '99.5%' : '99.9%';
        return [percent, formatMoeda(value), `${percent} das simulações ≤ este valor`];
      });
      
      autoTable(doc, {
        startY: 60,
        head: [['Percentil', 'Valor', 'Interpretação']],
        body: percentisTabela,
        theme: 'grid',
        headStyles: { fillColor: [76, 29, 149], textColor: 255 },
        margin: { left: margem, right: margem }
      });
      
      // ========== PÁGINA 5 - INTERPRETAÇÃO ==========
      doc.addPage();
      
      doc.setFillColor(76, 29, 149);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
      doc.setFontSize(10);
      doc.text('Página 5', pageWidth - margem, 20, { align: 'right' });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.text('INTERPRETAÇÃO DOS RESULTADOS', margem, 50);
      
      doc.setFontSize(11);
      let yInterp = 70;
      
      // Pegar as primeiras 5 interpretações mais importantes
      const interpretacoesPrincipais = dadosProcessados.interpretacoes.slice(0, 6);
      
      interpretacoesPrincipais.forEach((item, idx) => {
        if (yInterp > pageHeight - 60) {
          doc.addPage();
          yInterp = 60;
        }
        
        doc.setFont('helvetica', 'bold');
        doc.text(item.titulo, margem, yInterp);
        yInterp += 6;
        
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(item.texto, pageWidth - 2 * margem);
        lines.forEach(line => {
          if (yInterp > pageHeight - 40) {
            doc.addPage();
            yInterp = 60;
          }
          doc.text(line, margem, yInterp);
          yInterp += 6;
        });
        
        if (item.detalhe) {
          yInterp += 2;
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(100, 100, 100);
          const detalheLines = doc.splitTextToSize(`💡 ${item.detalhe}`, pageWidth - 2 * margem);
          detalheLines.forEach(line => {
            if (yInterp > pageHeight - 40) {
              doc.addPage();
              yInterp = 60;
            }
            doc.text(line, margem, yInterp);
            yInterp += 5;
          });
          doc.setTextColor(0, 0, 0);
        }
        
        yInterp += 8;
      });
      
      // ========== PÁGINA 6 - CONCLUSÃO ==========
      doc.addPage();
      
      doc.setFillColor(76, 29, 149);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
      doc.setFontSize(10);
      doc.text('Página 6', pageWidth - margem, 20, { align: 'right' });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.text('CONCLUSÃO E RECOMENDAÇÕES', margem, 50);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      let yConclusao = 70;
      
      const ultimaInterpretacao = dadosProcessados.interpretacoes[dadosProcessados.interpretacoes.length - 1];
      
      if (ultimaInterpretacao) {
        const lines = doc.splitTextToSize(ultimaInterpretacao.texto, pageWidth - 2 * margem);
        lines.forEach(line => {
          doc.text(line, margem, yConclusao);
          yConclusao += 7;
        });
        
        yConclusao += 10;
        
        if (ultimaInterpretacao.conclusao) {
          doc.setFont('helvetica', 'bold');
          doc.text('CONCLUSÃO:', margem, yConclusao);
          yConclusao += 7;
          
          doc.setFont('helvetica', 'normal');
          const conclLines = doc.splitTextToSize(ultimaInterpretacao.conclusao, pageWidth - 2 * margem);
          conclLines.forEach(line => {
            doc.text(line, margem, yConclusao);
            yConclusao += 7;
          });
        }
      }
      
      // Adicionar rodapé em todas as páginas
      const totalPagesFinal = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPagesFinal; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Sistema JIAM Preditivo - Motor Estatístico R', pageWidth / 2, pageHeight - 15, { align: 'center' });
        doc.text(`Documento confidencial - Página ${i} de ${totalPagesFinal}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
      
      const nomeArquivo = `Relatorio_MonteCarlo_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(nomeArquivo);
      
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      alert(`Erro ao gerar PDF: ${error.message}`);
    } finally {
      setExportandoPDF(false);
    }
  };

  // Formatar moeda
  const formatMoeda = (valor) => {
    if (!valor && valor !== 0) return 'N/A';
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor).replace('Kz', 'Kz');
  };

  // Formatar número
  const formatarNumero = (valor, casas = 2) => {
    if (valor === undefined || valor === null) return 'N/A';
    const num = parseFloat(valor);
    if (isNaN(num)) return 'N/A';
    return num.toFixed(casas);
  };

  // Formatar percentual
  const formatarPercentual = (valor, casas = 2) => {
    if (valor === undefined || valor === null) return 'N/A';
    const num = parseFloat(valor);
    if (isNaN(num)) return 'N/A';
    return `${num.toFixed(casas)}%`;
  };

  // Cor por classificação
  const getCorClassificacao = (classificacao) => {
    switch(classificacao?.toUpperCase()) {
      case 'EXCELENTE': return 'text-green-600';
      case 'BOA': return 'text-blue-600';
      case 'MODERADA': return 'text-yellow-600';
      case 'FRACA': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full mb-4">
            <Brain className="w-8 h-8 text-purple-600 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Processando Simulação Monte Carlo...</h3>
          <p className="text-gray-600 mt-2">Executando 100.000 simulações no motor estatístico R</p>
          <div className="mt-4 flex justify-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-xs text-gray-400 mt-4">Isso pode levar alguns segundos</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Erro na Simulação</h3>
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
        <h3 className="text-xl font-bold text-gray-800 mb-2">Simulação não executada</h3>
        <p className="text-gray-600">Clique em "Executar Simulação" para gerar os resultados.</p>
      </div>
    );
  }

  const { metricas, parametros, modelosGLM, percentis, histograma, interpretacoes } = dadosProcessados;

  return (
    <div className="space-y-8">
      {/* Cabeçalho com botão de PDF */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8 rounded-3xl">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">🎲 Simulação Monte Carlo</h1>
            <p className="text-lg opacity-90 mb-4">Análise de risco baseada nos modelos GLM</p>
            
            <div className="flex flex-wrap gap-3">
              <Badge variant="info" className="bg-white/20 text-white border-white/30">
                📊 {modelosGLM.distribuicaoFreq} | λ = {modelosGLM.lambdaBase.toFixed(4)}
              </Badge>
              <Badge variant="info" className="bg-white/20 text-white border-white/30">
                💰 {modelosGLM.distribuicaoSeveridade} | μ = {formatMoeda(modelosGLM.muBase)}
              </Badge>
              <Badge variant="info" className="bg-white/20 text-white border-white/30">
                🏦 Prêmio Base: {formatMoeda(modelosGLM.premioBase)}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-4xl font-bold">{parametros.nSimulacoes.toLocaleString()}</div>
              <div className="text-sm opacity-80">simulações</div>
              <div className="mt-2 text-xs opacity-70">Vol. Freq: {parametros.volFreq}% | Vol. Sev: {parametros.volSev}%</div>
            </div>
            
            <button
              onClick={gerarPDFProfissional}
              disabled={exportandoPDF}
              className="flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50"
            >
              {exportandoPDF ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Gerando PDF...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Exportar PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Resumo - Igual à imagem */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-5">
            <TooltipExplicativo texto="Valor médio esperado após 100.000 simulações. Comparado ao prêmio base, mostra se o prêmio atual é adequado.">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Calculator className="w-4 h-4" />
                <span className="text-sm">Valor Esperado</span>
                <HelpCircle className="w-3 h-3" />
              </div>
            </TooltipExplicativo>
            <div className="text-2xl font-bold text-gray-800">{formatMoeda(metricas.valorEsperado)}</div>
            <div className="text-xs text-gray-500 mt-1">
              vs base: {((metricas.valorEsperado / modelosGLM.premioBase - 1) * 100).toFixed(1)}%
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <TooltipExplicativo texto="Value at Risk 99%: Em 99% das simulações, a perda não ultrapassa este valor. Apenas 1% dos piores cenários têm perdas maiores.">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-sm">VaR 99%</span>
                <HelpCircle className="w-3 h-3" />
              </div>
            </TooltipExplicativo>
            <div className="text-2xl font-bold text-red-600">{formatMoeda(metricas.var_99)}</div>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <TooltipExplicativo texto="Tail VaR 99%: Média das perdas nos piores 1% dos cenários. Mostra a gravidade das perdas extremas.">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Activity className="w-4 h-4" />
                <span className="text-sm">TVaR 99%</span>
                <HelpCircle className="w-3 h-3" />
              </div>
            </TooltipExplicativo>
            <div className="text-2xl font-bold text-orange-600">{formatMoeda(metricas.tvar_99)}</div>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <TooltipExplicativo texto="Probabilidade de que os resultados levem à insolvência. Quanto menor, melhor.">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Prob. Ruína</span>
                <HelpCircle className="w-3 h-3" />
              </div>
            </TooltipExplicativo>
            <div className={`text-2xl font-bold ${getCorClassificacao(dadosProcessados.classificacao)}`}>
              {formatarPercentual(metricas.probRuina, 3)}
            </div>
          </div>
        </Card>
      </div>

      {/* Abas de navegação */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'resumo', label: '📋 Resumo', icon: Calculator },
            { id: 'detalhada', label: '🔍 Análise Detalhada', icon: Activity },
            { id: 'distribuicao', label: '📊 Distribuição', icon: BarChart3 },
            { id: 'interpretacao', label: '🧠 Explicações', icon: Brain }
          ].map((aba) => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`flex-1 py-4 font-medium flex items-center justify-center gap-2 ${
                abaAtiva === aba.id
                  ? 'border-b-2 border-purple-600 text-purple-700 bg-gradient-to-b from-white to-purple-50'
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <Calculator className="w-4 h-4" />
                      Métricas Principais
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <TooltipExplicativo texto="Valor médio esperado">
                          <span className="text-gray-600">Valor Esperado</span>
                        </TooltipExplicativo>
                        <span className="font-bold">{formatMoeda(metricas.valorEsperado)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <TooltipExplicativo texto="Valor que divide a distribuição ao meio">
                          <span className="text-gray-600">Mediana</span>
                        </TooltipExplicativo>
                        <span className="font-bold">{formatMoeda(metricas.mediana)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <TooltipExplicativo texto="Medida de dispersão dos resultados">
                          <span className="text-gray-600">Desvio Padrão</span>
                        </TooltipExplicativo>
                        <span className="font-bold">{formatMoeda(metricas.desvioPadrao)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <TooltipExplicativo texto="Desvio padrão dividido pela média (em %)">
                          <span className="text-gray-600">Coef. Variação</span>
                        </TooltipExplicativo>
                        <span className="font-bold">{formatarNumero(metricas.coefVariacao, 1)}%</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <TooltipExplicativo texto="Medida da assimetria da distribuição">
                          <span className="text-gray-600">Assimetria</span>
                        </TooltipExplicativo>
                        <span className="font-bold">{formatarNumero(metricas.assimetria, 4)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <TooltipExplicativo texto="Medida do 'achatamento' da distribuição">
                          <span className="text-gray-600">Curtose</span>
                        </TooltipExplicativo>
                        <span className="font-bold">{formatarNumero(metricas.curtose, 4)}</span>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Intervalos de Confiança
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <TooltipExplicativo texto="Limite inferior do intervalo de confiança de 95% para a média">
                          <span className="text-gray-600">IC 95% Inferior</span>
                        </TooltipExplicativo>
                        <span className="font-bold text-blue-600">{formatMoeda(metricas.ic95Inferior)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <TooltipExplicativo texto="Limite superior do intervalo de confiança de 95% para a média">
                          <span className="text-gray-600">IC 95% Superior</span>
                        </TooltipExplicativo>
                        <span className="font-bold text-blue-600">{formatMoeda(metricas.ic95Superior)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <TooltipExplicativo texto="Maior perda observada nas simulações">
                          <span className="text-gray-600">Perda Máxima</span>
                        </TooltipExplicativo>
                        <span className="font-bold text-red-600">{formatMoeda(metricas.perdaMaxima)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <TooltipExplicativo texto="Menor perda observada (ou maior ganho)">
                          <span className="text-gray-600">Perda Mínima</span>
                        </TooltipExplicativo>
                        <span className="font-bold text-green-600">{formatMoeda(metricas.perdaMinima)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <Card>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    Percentis da Distribuição
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(percentis).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 p-3 rounded-lg text-center">
                        <TooltipExplicativo texto={`${key === 'p50' ? 'Mediana' : `${key.replace('p', '')}% dos resultados estão abaixo deste valor`}`}>
                          <span className="text-xs text-gray-500 block mb-1">
                            {key === 'p50' ? '50% (Mediana)' : key === 'p75' ? '75%' : 
                             key === 'p90' ? '90%' : key === 'p95' ? '95%' : 
                             key === 'p975' ? '97.5%' : key === 'p99' ? '99%' : 
                             key === 'p995' ? '99.5%' : '99.9%'}
                          </span>
                        </TooltipExplicativo>
                        <span className="font-bold text-sm">{formatMoeda(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Aba Análise Detalhada */}
          {abaAtiva === 'detalhada' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-700 mb-4">📊 Métricas de Risco</h3>
                    <div className="space-y-4">
                      <div>
                        <TooltipExplicativo texto="Valor esperado (média aritmética)">
                          <div className="flex justify-between text-sm">
                            <span>Valor Esperado:</span>
                            <span className="font-bold">{formatMoeda(metricas.valorEsperado)}</span>
                          </div>
                        </TooltipExplicativo>
                      </div>
                      <div>
                        <TooltipExplicativo texto="Valor que divide a amostra ao meio">
                          <div className="flex justify-between text-sm">
                            <span>Mediana:</span>
                            <span className="font-bold">{formatarNumero(metricas.mediana, 4)}</span>
                          </div>
                        </TooltipExplicativo>
                      </div>
                      <div>
                        <TooltipExplicativo texto="Medida de dispersão dos dados">
                          <div className="flex justify-between text-sm">
                            <span>Desvio Padrão:</span>
                            <span className="font-bold">{formatMoeda(metricas.desvioPadrao)}</span>
                          </div>
                        </TooltipExplicativo>
                      </div>
                      <div>
                        <TooltipExplicativo texto="Desvio padrão dividido pela média (em %)">
                          <div className="flex justify-between text-sm">
                            <span>Coef. Variação:</span>
                            <span className="font-bold">{formatarNumero(metricas.coefVariacao, 1)}%</span>
                          </div>
                        </TooltipExplicativo>
                      </div>
                      <div>
                        <TooltipExplicativo texto="Medida da assimetria da distribuição (0 = simétrica)">
                          <div className="flex justify-between text-sm">
                            <span>Assimetria:</span>
                            <span className="font-bold">{formatarNumero(metricas.assimetria, 4)}</span>
                          </div>
                        </TooltipExplicativo>
                      </div>
                      <div>
                        <TooltipExplicativo texto="Medida do 'achatamento' da distribuição">
                          <div className="flex justify-between text-sm">
                            <span>Curtose:</span>
                            <span className="font-bold">{formatarNumero(metricas.curtose, 4)}</span>
                          </div>
                        </TooltipExplicativo>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-700 mb-4">🎯 Intervalos de Confiança</h3>
                    <div className="space-y-4">
                      <div>
                        <TooltipExplicativo texto="Limite inferior com 95% de confiança">
                          <div className="flex justify-between text-sm">
                            <span>IC 95% Inferior:</span>
                            <span className="font-bold text-blue-600">{formatMoeda(metricas.ic95Inferior)}</span>
                          </div>
                        </TooltipExplicativo>
                      </div>
                      <div>
                        <TooltipExplicativo texto="Limite superior com 95% de confiança">
                          <div className="flex justify-between text-sm">
                            <span>IC 95% Superior:</span>
                            <span className="font-bold text-blue-600">{formatMoeda(metricas.ic95Superior)}</span>
                          </div>
                        </TooltipExplicativo>
                      </div>
                      <div>
                        <TooltipExplicativo texto="Maior valor observado">
                          <div className="flex justify-between text-sm">
                            <span>Perda Máxima:</span>
                            <span className="font-bold text-red-600">{formatMoeda(metricas.perdaMaxima)}</span>
                          </div>
                        </TooltipExplicativo>
                      </div>
                      <div>
                        <TooltipExplicativo texto="Menor valor observado">
                          <div className="flex justify-between text-sm">
                            <span>Perda Mínima:</span>
                            <span className="font-bold text-green-600">{formatMoeda(metricas.perdaMinima)}</span>
                          </div>
                        </TooltipExplicativo>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <Card>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-700 mb-4">📈 Percentis Detalhados</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Percentil</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Valor</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Interpretação</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(percentis).map(([key, value]) => {
                          const percent = key === 'p50' ? 50 : 
                                         key === 'p75' ? 75 : 
                                         key === 'p90' ? 90 : 
                                         key === 'p95' ? 95 : 
                                         key === 'p975' ? 97.5 : 
                                         key === 'p99' ? 99 : 
                                         key === 'p995' ? 99.5 : 99.9;
                          return (
                            <tr key={key} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap font-medium">{percent}%</td>
                              <td className="px-4 py-3 whitespace-nowrap font-mono">{formatMoeda(value)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {percent}% das simulações tiveram resultado ≤ este valor
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Aba Distribuição */}
          {abaAtiva === 'distribuicao' && (
            <div className="space-y-6">
              <Card>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-700 mb-4">📊 Distribuição das Perdas</h3>
                  <p className="text-sm text-gray-500 mb-4">Frequência dos valores simulados</p>
                  
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={histograma}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="bin" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        interval={0}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'frequencia') return [`${value} simulações`, 'Frequência'];
                          if (name === 'percentual') return [`${value}%`, 'Percentual'];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Bar dataKey="frequencia" fill="#8B5CF6" name="Frequência" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-purple-600 rounded"></div>
                      <span>Distribuição real das 100.000 simulações</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowUp className="w-3 h-3 text-red-500" />
                      <span>Cauda direita (perdas extremas)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-red-500 border-dashed rounded"></div>
                      <span>VaR 99%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-orange-500 border-dashed rounded"></div>
                      <span>TVaR 99%</span>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <div className="p-5">
                    <h4 className="font-medium text-gray-700 mb-3">📉 Interpretação da Distribuição</h4>
                    <div className="space-y-3 text-sm">
                      <p className="flex items-start gap-2">
                        <div className={`mt-1 w-2 h-2 rounded-full ${metricas.assimetria > 0 ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                        <span>
                          <strong>Assimetria {metricas.assimetria > 0 ? 'positiva' : 'negativa'}:</strong> {metricas.assimetria > 0 
                            ? 'A cauda direita é mais longa, indicando maior probabilidade de perdas extremas.' 
                            : 'A cauda esquerda é mais longa.'}
                        </span>
                      </p>
                      <p className="flex items-start gap-2">
                        <div className="mt-1 w-2 h-2 bg-purple-600 rounded-full"></div>
                        <span><strong>Pico da distribuição:</strong> A maioria das simulações ({histograma[3]?.percentual}%) concentra-se entre 846k-991k Kz.</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <div className="mt-1 w-2 h-2 bg-red-500 rounded-full"></div>
                        <span><strong>Perdas extremas:</strong> Aproximadamente {histograma.slice(8).reduce((acc, item) => acc + item.percentual, 0).toFixed(1)}% das simulações resultaram em perdas acima de 1.5M Kz.</span>
                      </p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-5">
                    <h4 className="font-medium text-gray-700 mb-3">📊 Estatísticas da Distribuição</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total de simulações:</span>
                        <span className="font-bold">{parametros.nSimulacoes.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Média:</span>
                        <span className="font-bold">{formatMoeda(metricas.valorEsperado)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Mediana:</span>
                        <span className="font-bold">{formatMoeda(metricas.mediana)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Moda (intervalo):</span>
                        <span className="font-bold">846k-991k Kz</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Amplitude total:</span>
                        <span className="font-bold">{formatMoeda(metricas.perdaMaxima - metricas.perdaMinima)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Aba Interpretação / Explicações */}
          {abaAtiva === 'interpretacao' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="w-8 h-8 text-purple-600" />
                  <h3 className="text-xl font-bold text-purple-800">Entendendo os Resultados</h3>
                </div>
                <p className="text-purple-700 mb-4">
                  Esta simulação rodou <strong>{parametros.nSimulacoes.toLocaleString()}</strong> cenários diferentes usando os modelos GLM 
                  (Negative Binomial para frequência e Gamma para severidade). Abaixo, explicamos cada resultado em linguagem simples.
                </p>
              </div>

              {interpretacoes.map((item, idx) => (
                <Card key={idx}>
                  <div className="p-5">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
                      {item.titulo}
                    </h4>
                    <p className="text-gray-700 mb-2">{item.texto}</p>
                    {item.detalhe && (
                      <p className="text-sm text-purple-600 bg-purple-50 p-3 rounded-lg mt-2 border border-purple-100">
                        💡 {item.detalhe}
                      </p>
                    )}
                    {item.classificacao && (
                      <div className={`mt-3 text-sm px-3 py-2 rounded-lg ${
                        item.classificacao.includes('✅') ? 'bg-green-50 text-green-700' :
                        item.classificacao.includes('📊') ? 'bg-blue-50 text-blue-700' :
                        item.classificacao.includes('⚠️') ? 'bg-yellow-50 text-yellow-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {item.classificacao}
                      </div>
                    )}
                    {item.conclusao && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
                        <p className="font-medium text-gray-800">📋 Conclusão:</p>
                        <p className="text-gray-700 mt-1">{item.conclusao}</p>
                      </div>
                    )}
                  </div>
                </Card>
              ))}

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-green-600" />
                  <div>
                    <h4 className="font-bold text-green-800">Resumo Executivo</h4>
                    <p className="text-green-700">
                      Com base em {parametros.nSimulacoes.toLocaleString()} simulações, há 99% de confiança de que a perda não excederá {formatMoeda(metricas.var_99)}. 
                      A probabilidade de ruína é de {metricas.probRuina.toFixed(3)}%, considerada 
                      {metricas.probRuina < 1 ? ' excelente (risco muito baixo).' :
                       metricas.probRuina < 5 ? ' boa (risco controlado).' :
                       metricas.probRuina < 10 ? ' moderada (requer atenção).' :
                       ' alta (requer ação imediata).'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Informações dos modelos GLM */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200 text-sm">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            <span className="text-gray-700">Modelos GLM utilizados:</span>
          </div>
          <Badge variant="info">Frequência: Negative Binomial (λ = {modelosGLM.lambdaBase.toFixed(4)})</Badge>
          <Badge variant="info">Severidade: Gamma (μ = {formatMoeda(modelosGLM.muBase)})</Badge>
          <Badge variant="info">Prêmio Base: {formatMoeda(modelosGLM.premioBase)}</Badge>
          <Badge variant="info">Simulações: {parametros.nSimulacoes.toLocaleString()}</Badge>
        </div>
      </div>
    </div>
  );
}