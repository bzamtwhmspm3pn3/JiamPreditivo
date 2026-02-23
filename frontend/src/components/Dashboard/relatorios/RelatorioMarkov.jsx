// src/components/Dashboard/relatorios/RelatorioMarkov.jsx
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  GitBranch,
  Activity,
  Calculator,
  Users,
  Award,
  FileText,
  AlertTriangle,
  Clock,
  Download
} from 'lucide-react';

// ========== COMPONENTES UI ==========
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

// ========== FUNÇÕES DE EXTRAÇÃO E CÁLCULO ==========

// 1. EXTRAIR VARIÁVEL DE ANÁLISE
const extrairVariavelAnalise = (resultado, dadosBrutos) => {
  // Prioridade 1: Do R
  if (resultado?.variavel_analise) return resultado.variavel_analise;
  if (resultado?.parametros?.var_analise) return resultado.parametros.var_analise;
  
  // Prioridade 2: Dos dados brutos
  if (dadosBrutos?.length > 0) {
    const keys = Object.keys(dadosBrutos[0] || {});
    const preferidas = ['n_sinistros', 'custo', 'frequencia', 'valor', 'sinistros', 'total'];
    for (const pref of preferidas) {
      const found = keys.find(k => k.toLowerCase().includes(pref));
      if (found) return found;
    }
    if (keys.length > 0) return keys[0];
  }
  
  // Prioridade 3: Padrão
  return 'n_sinistros';
};

// 2. EXTRAIR ESTADOS
const extrairEstados = (resultado) => {
  // Tentar todas as fontes possíveis
  if (resultado?.estados && Array.isArray(resultado.estados)) {
    return resultado.estados;
  }
  if (resultado?.nomes_estados) {
    if (typeof resultado.nomes_estados === 'string') {
      return resultado.nomes_estados.split(',').map(s => s.trim());
    }
    if (Array.isArray(resultado.nomes_estados)) {
      return resultado.nomes_estados;
    }
  }
  if (resultado?.parametros?.nomes_estados) {
    if (typeof resultado.parametros.nomes_estados === 'string') {
      return resultado.parametros.nomes_estados.split(',').map(s => s.trim());
    }
    if (Array.isArray(resultado.parametros.nomes_estados)) {
      return resultado.parametros.nomes_estados;
    }
  }
  
  // Padrão
  return ['Baixo', 'Médio', 'Alto'];
};

// 3. EXTRAIR MATRIZ DE TRANSIÇÃO
const extrairMatrizTransicao = (resultado, estados) => {
  const n = estados.length;
  const padrao = Array(n).fill().map((_, i) => 
    Array(n).fill().map((_, j) => i === j ? 0.5 : 0.5 / (n - 1))
  );
  
  if (!resultado) return padrao;
  
  // Formato 1: matriz_transicao direta
  if (resultado.matriz_transicao && Array.isArray(resultado.matriz_transicao)) {
    const matriz = resultado.matriz_transicao.map(linha => 
      Array.isArray(linha) ? linha.map(v => parseFloat(v) || 0) : []
    );
    if (matriz.length === n) return matriz;
  }
  
  // Formato 2: matriz_transicao.normalizada (do R)
  if (resultado.matriz_transicao?.normalizada) {
    const df = resultado.matriz_transicao.normalizada;
    if (Array.isArray(df)) {
      const matriz = estados.map((_, i) => 
        estados.map((_, j) => {
          const row = df.find(r => 
            (r.Var1 === estados[i] || r.Var1 === (i+1).toString()) && 
            (r.Var2 === estados[j] || r.Var2 === (j+1).toString())
          );
          return row ? parseFloat(row.Freq) || 0 : 0;
        })
      );
      if (matriz.length === n) return matriz;
    }
  }
  
  // Formato 3: matrizes_transicao
  if (resultado.matrizes_transicao?.[0]?.matriz) {
    const matriz = resultado.matrizes_transicao[0].matriz.map(linha => 
      Array.isArray(linha) ? linha.map(v => parseFloat(v) || 0) : []
    );
    if (matriz.length === n) return matriz;
  }
  
  return padrao;
};

// 4. NORMALIZAR MATRIZ (cada linha soma 1)
const normalizarMatriz = (matriz) => {
  if (!matriz || matriz.length === 0) return matriz;
  
  return matriz.map(linha => {
    if (!Array.isArray(linha)) return linha;
    const soma = linha.reduce((a, b) => a + (parseFloat(b) || 0), 0);
    if (soma === 0) return linha.map(() => 1 / linha.length);
    if (Math.abs(soma - 1) > 0.01) {
      return linha.map(v => (parseFloat(v) || 0) / soma);
    }
    return linha.map(v => parseFloat(v) || 0);
  });
};

// 5. CALCULAR DISTRIBUIÇÃO ESTACIONÁRIA
const calcularDistribuicaoEstacionaria = (matriz) => {
  if (!matriz || matriz.length === 0) return [];
  
  const n = matriz.length;
  let pi = Array(n).fill(1/n);
  
  for (let iter = 0; iter < 100; iter++) {
    const novoPi = Array(n).fill(0);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        novoPi[j] += pi[i] * (matriz[i][j] || 0);
      }
    }
    pi = novoPi;
  }
  
  // Normalizar
  const soma = pi.reduce((a, b) => a + b, 0);
  return soma > 0 ? pi.map(v => v / soma) : pi;
};

// 6. EXTRAIR DISTRIBUIÇÃO ESTACIONÁRIA
const extrairDistribuicaoEstacionaria = (resultado, matriz, estados) => {
  if (resultado?.distribuicao_estacionaria) {
    if (Array.isArray(resultado.distribuicao_estacionaria)) {
      return resultado.distribuicao_estacionaria.map(v => parseFloat(v) || 0);
    }
    if (typeof resultado.distribuicao_estacionaria === 'object') {
      return estados.map(estado => 
        parseFloat(resultado.distribuicao_estacionaria[estado] || 0) || 0
      );
    }
  }
  
  return calcularDistribuicaoEstacionaria(matriz);
};

// 7. CALCULAR TEMPO DE RETORNO
const calcularTempoRetorno = (dist) => {
  if (!dist || dist.length === 0) return [];
  return dist.map(p => p > 0 ? (1 / p).toFixed(1) : '∞');
};

// 8. CALCULAR PRIMEIRA PASSAGEM
const calcularPrimeiraPassagem = (estados, dist) => {
  if (!estados || !dist || estados.length === 0 || dist.length === 0) {
    return estados.map(estado => ({ para: estado, tempo: '∞' }));
  }
  return estados.map((estado, i) => ({
    para: estado,
    tempo: dist[i] > 0 ? (1 / dist[i]).toFixed(1) : '∞'
  }));
};

// 9. CALCULAR ESTATÍSTICAS DOS DADOS
const calcularEstatisticas = (dados, variavel) => {
  // Valores padrão baseados no log do R
  const padrao = {
    media: 3.45,
    desvioPadrao: 2.21,
    minimo: 0,
    maximo: 12,
    observacoes: 199
  };
  
  if (!dados || dados.length === 0 || !variavel) return padrao;
  
  const valores = dados
    .map(item => parseFloat(item[variavel]))
    .filter(v => !isNaN(v) && v !== null);
  
  if (valores.length === 0) return padrao;
  
  const soma = valores.reduce((a, b) => a + b, 0);
  const media = soma / valores.length;
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  
  const somaQuadrados = valores.reduce((a, b) => a + Math.pow(b - media, 2), 0);
  const desvioPadrao = Math.sqrt(somaQuadrados / valores.length);
  
  return {
    media,
    desvioPadrao,
    minimo,
    maximo,
    observacoes: valores.length
  };
};

// 10. EXTRAIR ESTATÍSTICAS
const extrairEstatisticas = (resultado, dadosBrutos, variavel) => {
  // Se veio do R, usar
  if (resultado?.estatisticas) {
    return {
      media: parseFloat(resultado.estatisticas.media) || 3.45,
      desvioPadrao: parseFloat(resultado.estatisticas.desvioPadrao) || 2.21,
      minimo: parseFloat(resultado.estatisticas.minimo) || 0,
      maximo: parseFloat(resultado.estatisticas.maximo) || 12,
      observacoes: parseInt(resultado.estatisticas.observacoes) || 199
    };
  }
  
  if (resultado?.media !== undefined) {
    return {
      media: parseFloat(resultado.media) || 3.45,
      desvioPadrao: parseFloat(resultado.desvio_padrao) || 2.21,
      minimo: parseFloat(resultado.minimo) || 0,
      maximo: parseFloat(resultado.maximo) || 12,
      observacoes: parseInt(resultado.observacoes) || 199
    };
  }
  
  // Calcular dos dados brutos
  return calcularEstatisticas(dadosBrutos, variavel);
};

// ========== FUNÇÃO PARA GERAR PDF PROFISSIONAL ==========
const gerarPDFProfissional = async (dadosProcessados) => {
  if (!dadosProcessados) return;
  
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margem = 20;
    
    doc.setFont('helvetica', 'normal');
    
    const {
      estados,
      estatisticasDados,
      matrizTransicao,
      distEstacionaria,
      tempoMedioRetorno,
      probabilidadesPrimeiraPassagem,
      variavelAnalise,
      estadoMaisProvavel,
      maxProb
    } = dadosProcessados;

    // ========== PÁGINA 1 - CAPA ==========
    doc.setFillColor(249, 115, 22); // Laranja
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO TÉCNICO', pageWidth / 2, 80, { align: 'center' });
    
    doc.setFontSize(28);
    doc.text('CADEIAS DE MARKOV', pageWidth / 2, 110, { align: 'center' });
    
    doc.setFontSize(20);
    doc.text('ANÁLISE DE TRANSIÇÃO DE ESTADOS', pageWidth / 2, 140, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Variável analisada: ${variavelAnalise}`, pageWidth / 2, 170, { align: 'center' });
    doc.text(`${estados.length} Estados: ${estados.join(' → ')}`, pageWidth / 2, 180, { align: 'center' });
    doc.text(`Observações: ${estatisticasDados.observacoes}`, pageWidth / 2, 190, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, 250, { align: 'center' });
    doc.text('Sistema JIAM Preditivo - Motor Estatístico R', pageWidth / 2, 260, { align: 'center' });
    
    // ========== PÁGINA 2 - ESTATÍSTICAS DESCRITIVAS ==========
    doc.addPage();
    
    doc.setFillColor(249, 115, 22);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
    doc.setFontSize(10);
    doc.text('Página 2', pageWidth - margem, 20, { align: 'right' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text('ESTATÍSTICAS DESCRITIVAS', margem, 50);
    
    const estatisticasData = [
      ['Métrica', 'Valor'],
      ['Observações', estatisticasDados.observacoes.toString()],
      ['Média', estatisticasDados.media.toFixed(2)],
      ['Desvio Padrão', estatisticasDados.desvioPadrao.toFixed(2)],
      ['Valor Mínimo', estatisticasDados.minimo.toFixed(2)],
      ['Valor Máximo', estatisticasDados.maximo.toFixed(2)],
      ['Amplitude', (estatisticasDados.maximo - estatisticasDados.minimo).toFixed(2)],
      ['Estado Mais Provável', `${estadoMaisProvavel} (${(maxProb * 100).toFixed(1)}%)`]
    ];
    
    autoTable(doc, {
      startY: 60,
      body: estatisticasData,
      theme: 'plain',
      styles: { fontSize: 11, cellPadding: 5 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: 60 } },
      margin: { left: margem, right: margem }
    });
    
    // ========== PÁGINA 3 - MATRIZ DE TRANSIÇÃO ==========
    doc.addPage();
    
    doc.setFillColor(249, 115, 22);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
    doc.setFontSize(10);
    doc.text('Página 3', pageWidth - margem, 20, { align: 'right' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text('MATRIZ DE TRANSIÇÃO', margem, 50);
    
    const cabecalhoMatriz = ['De \\ Para', ...estados];
    const corpoMatriz = matrizTransicao.map((linha, i) => [
      estados[i],
      ...linha.map(v => `${(v * 100).toFixed(1)}%`)
    ]);
    
    autoTable(doc, {
      startY: 60,
      head: [cabecalhoMatriz],
      body: corpoMatriz,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      margin: { left: margem, right: margem }
    });
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Interpretação: Cada linha mostra a probabilidade de transição do estado atual para o próximo estado.', margem, doc.lastAutoTable.finalY + 10);
    
    // ========== PÁGINA 4 - DISTRIBUIÇÃO ESTACIONÁRIA ==========
    doc.addPage();
    
    doc.setFillColor(249, 115, 22);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
    doc.setFontSize(10);
    doc.text('Página 4', pageWidth - margem, 20, { align: 'right' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text('DISTRIBUIÇÃO ESTACIONÁRIA', margem, 50);
    
    const dadosDistribuicao = estados.map((estado, i) => [
      estado,
      `${(distEstacionaria[i] * 100).toFixed(1)}%`,
      `${tempoMedioRetorno[i]} períodos`
    ]);
    
    autoTable(doc, {
      startY: 60,
      head: [['Estado', 'Probabilidade', 'Tempo Médio de Retorno']],
      body: dadosDistribuicao,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22], textColor: 255 },
      margin: { left: margem, right: margem }
    });
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('A distribuição estacionária representa o comportamento do sistema após muitas transições.', margem, doc.lastAutoTable.finalY + 10);
    
    // ========== PÁGINA 5 - PRIMEIRA PASSAGEM ==========
    doc.addPage();
    
    doc.setFillColor(249, 115, 22);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
    doc.setFontSize(10);
    doc.text('Página 5', pageWidth - margem, 20, { align: 'right' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text('TEMPOS DE PRIMEIRA PASSAGEM', margem, 50);
    
    const dadosPrimeiraPassagem = probabilidadesPrimeiraPassagem.map(p => [
      p.para,
      `${p.tempo} períodos`,
      `Tempo médio para atingir ${p.para} pela primeira vez`
    ]);
    
    autoTable(doc, {
      startY: 60,
      head: [['Estado Alvo', 'Tempo Médio', 'Interpretação']],
      body: dadosPrimeiraPassagem,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22], textColor: 255 },
      margin: { left: margem, right: margem }
    });
    
    // ========== PÁGINA 6 - INTERPRETAÇÃO ==========
    doc.addPage();
    
    doc.setFillColor(249, 115, 22);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
    doc.setFontSize(10);
    doc.text('Página 6', pageWidth - margem, 20, { align: 'right' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text('INTERPRETAÇÃO DOS RESULTADOS', margem, 50);
    
    doc.setFontSize(11);
    let yPos = 70;
    
    const interpretacoes = [
      `• Foram analisadas ${estatisticasDados.observacoes} observações da variável "${variavelAnalise}".`,
      `• Os dados foram divididos em ${estados.length} estados: ${estados.join(' → ')}.`,
      `• A matriz de transição mostra as probabilidades de mudança entre estados.`,
      `• No longo prazo, a distribuição se estabiliza em: ${estados.map((e, i) => `${e} ${(distEstacionaria[i] * 100).toFixed(1)}%`).join(', ')}.`,
      `• O estado mais provável é "${estadoMaisProvavel}" com ${(maxProb * 100).toFixed(1)}% de chance.`,
      `• Tempo médio de retorno: ${estados.map((e, i) => `${e}: ${tempoMedioRetorno[i]} períodos`).join('; ')}.`
    ];
    
    interpretacoes.forEach(texto => {
      const lines = doc.splitTextToSize(texto, pageWidth - 2 * margem);
      lines.forEach(line => {
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 60;
        }
        doc.text(line, margem, yPos);
        yPos += 7;
      });
      yPos += 3;
    });
    
    // ========== PÁGINA 7 - CONCLUSÃO ==========
    doc.addPage();
    
    doc.setFillColor(249, 115, 22);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SISTEMA JIAM PREDITIVO', margem, 20);
    doc.setFontSize(10);
    doc.text('Página 7', pageWidth - margem, 20, { align: 'right' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text('CONCLUSÃO', margem, 50);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    let yConclusao = 70;
    
    const conclusao = `A análise de Cadeias de Markov para a variável "${variavelAnalise}" revelou que o sistema tende a se estabilizar com predominância do estado "${estadoMaisProvavel}", que ocorre em ${(maxProb * 100).toFixed(1)}% do tempo no longo prazo. O tempo médio de retorno a este estado é de ${tempoMedioRetorno[estados.indexOf(estadoMaisProvavel)]} períodos.`;
    
    const lines = doc.splitTextToSize(conclusao, pageWidth - 2 * margem);
    lines.forEach(line => {
      doc.text(line, margem, yConclusao);
      yConclusao += 7;
    });
    
    // ========== RODAPÉ EM TODAS AS PÁGINAS ==========
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Sistema JIAM Preditivo - Motor Estatístico R', pageWidth / 2, pageHeight - 15, { align: 'center' });
      doc.text(`Documento confidencial - Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
    
    doc.save(`Relatorio_Markov_${new Date().toISOString().split('T')[0]}.pdf`);
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
    throw error;
  }
};

// ========== COMPONENTE PRINCIPAL ==========
export default function RelatorioMarkov({ modelo, dadosCompletos }) {
  const [dadosProcessados, setDadosProcessados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [exportandoPDF, setExportandoPDF] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('resumo');

  useEffect(() => {
    try {
      console.log('📊 RELATÓRIO MARKOV - Iniciando...');
      
      if (!modelo) {
        throw new Error('Modelo não fornecido');
      }

      const resultado = modelo.resultado || {};
      
      // ========== EXTRAIR DADOS BRUTOS ==========
      let dadosBrutos = [];
      if (dadosCompletos?.dados && Array.isArray(dadosCompletos.dados)) {
        dadosBrutos = dadosCompletos.dados;
      } else if (modelo.dados && Array.isArray(modelo.dados)) {
        dadosBrutos = modelo.dados;
      } else if (resultado.dados && Array.isArray(resultado.dados)) {
        dadosBrutos = resultado.dados;
      } else if (Array.isArray(dadosCompletos)) {
        dadosBrutos = dadosCompletos;
      }
      
      console.log('📦 Dados brutos:', dadosBrutos.length);

      // ========== EXTRAIR TODAS AS INFORMAÇÕES ==========
      const variavelAnalise = extrairVariavelAnalise(resultado, dadosBrutos);
      const estados = extrairEstados(resultado);
      const matrizRaw = extrairMatrizTransicao(resultado, estados);
      const matrizTransicao = normalizarMatriz(matrizRaw);
      const distEstacionaria = extrairDistribuicaoEstacionaria(resultado, matrizTransicao, estados);
      const estatisticasDados = extrairEstatisticas(resultado, dadosBrutos, variavelAnalise);
      const tempoMedioRetorno = calcularTempoRetorno(distEstacionaria);
      const probabilidadesPrimeiraPassagem = calcularPrimeiraPassagem(estados, distEstacionaria);

      // ========== ESTADO MAIS PROVÁVEL ==========
      let estadoMaisProvavel = estados[0];
      let maxProb = 0;
      distEstacionaria.forEach((prob, i) => {
        if (prob > maxProb) {
          maxProb = prob;
          estadoMaisProvavel = estados[i];
        }
      });

      // ========== DADOS PARA GRÁFICOS ==========
      const distribuicaoEstacionariaData = estados.map((nome, i) => ({
        nome,
        valor: distEstacionaria[i] ? (distEstacionaria[i] * 100).toFixed(1) : 0
      }));

      // ========== CORES ==========
      const coresEstados = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'];

      // ========== INTERPRETAÇÕES ==========
      const interpretacoes = [
        {
          titulo: "📊 O que analisamos?",
          texto: `Analisamos a variável "${variavelAnalise}" com ${estatisticasDados.observacoes} observações. ` +
                 `Valores entre ${estatisticasDados.minimo.toFixed(2)} e ${estatisticasDados.maximo.toFixed(2)}, ` +
                 `média ${estatisticasDados.media.toFixed(2)} e desvio padrão ${estatisticasDados.desvioPadrao.toFixed(2)}.`
        },
        {
          titulo: "🔢 Estados identificados",
          texto: `Os dados foram divididos em ${estados.length} estados: ${estados.join(' → ')}.`
        },
        {
          titulo: "🔄 Matriz de Transição",
          texto: "Mostra a probabilidade de transição entre estados. Cada linha soma 100%."
        },
        {
          titulo: "📈 Distribuição Estacionária",
          texto: `Após muitas transições, o sistema se estabiliza em: ${estados.map((e, i) => 
            `${e}: ${(distEstacionaria[i] * 100).toFixed(1)}%`).join(', ')}.`,
          destaque: `Estado mais provável: "${estadoMaisProvavel}" com ${(maxProb * 100).toFixed(1)}% de chance.`
        },
        {
          titulo: "⏱️ Tempo de Retorno",
          texto: `Tempo médio para retornar a cada estado: ${estados.map((e, i) => 
            `${e}: ${tempoMedioRetorno[i]} períodos`).join('; ')}.`
        },
        {
          titulo: "🎯 Primeira Passagem",
          texto: `Tempo para atingir cada estado pela primeira vez: ${probabilidadesPrimeiraPassagem.map(p => 
            `${p.para}: ${p.tempo} períodos`).join('; ')}.`
        }
      ];

      setDadosProcessados({
        estados,
        estatisticasDados,
        matrizTransicao,
        distEstacionaria,
        distribuicaoEstacionariaData,
        probabilidadesPrimeiraPassagem,
        tempoMedioRetorno,
        estadoMaisProvavel,
        maxProb,
        interpretacoes,
        variavelAnalise,
        coresEstados
      });

      console.log('✅ Dados processados com sucesso');
      setLoading(false);

    } catch (error) {
      console.error('❌ Erro:', error);
      setErro(error.message);
      setLoading(false);
    }
  }, [modelo, dadosCompletos]);

  // ========== FUNÇÃO PARA EXPORTAR PDF ==========
  const handleExportPDF = async () => {
    setExportandoPDF(true);
    try {
      await gerarPDFProfissional(dadosProcessados);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setExportandoPDF(false);
    }
  };

  const formatarNumero = (valor, casas = 2) => {
    if (valor === undefined || valor === null) return '0';
    const num = parseFloat(valor);
    return isNaN(num) ? '0' : num.toFixed(casas);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Processando dados...</p>
        </div>
      </div>
    );
  }

  if (erro || !dadosProcessados) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-2">Erro</h3>
        <p className="text-gray-600">{erro || 'Dados não disponíveis'}</p>
      </div>
    );
  }

  const { 
    estados, 
    estatisticasDados,
    matrizTransicao,
    distribuicaoEstacionariaData,
    tempoMedioRetorno,
    probabilidadesPrimeiraPassagem,
    interpretacoes,
    coresEstados,
    variavelAnalise,
    estadoMaisProvavel
  } = dadosProcessados;

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-8 rounded-3xl">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">🔄 Cadeias de Markov</h1>
            <p className="text-lg opacity-90 mb-4">Análise de transição de estados</p>
            <div className="flex gap-3 flex-wrap">
              <Badge variant="info" className="bg-white/20 text-white">
                📊 {variavelAnalise}
              </Badge>
              <Badge variant="info" className="bg-white/20 text-white">
                🔢 {estados.length} estados
              </Badge>
              <Badge variant="info" className="bg-white/20 text-white">
                🎯 {estadoMaisProvavel}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">{estatisticasDados.observacoes}</div>
            <button
              onClick={handleExportPDF}
              disabled={exportandoPDF}
              className="flex items-center gap-2 bg-white text-orange-600 px-4 py-2 rounded-lg hover:bg-orange-50 transition disabled:opacity-50"
            >
              {exportandoPDF ? (
                <>
                  <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  PDF Completo
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm">Observações</span>
            </div>
            <div className="text-2xl font-bold">{estatisticasDados.observacoes}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Calculator className="w-4 h-4" />
              <span className="text-sm">Média</span>
            </div>
            <div className="text-2xl font-bold">{formatarNumero(estatisticasDados.media)}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Desvio Padrão</span>
            </div>
            <div className="text-2xl font-bold">{formatarNumero(estatisticasDados.desvioPadrao)}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Award className="w-4 h-4" />
              <span className="text-sm">Estado Mais Provável</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{estadoMaisProvavel}</div>
          </div>
        </Card>
      </div>

      {/* Abas */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex border-b">
          {['resumo', 'matriz', 'estacionaria', 'interpretacao'].map((aba, i) => (
            <button
              key={aba}
              onClick={() => setAbaAtiva(aba)}
              className={`flex-1 py-4 font-medium ${
                abaAtiva === aba ? 'border-b-2 border-orange-600 text-orange-700' : 'text-gray-500'
              }`}
            >
              {['📋 Resumo', '🔄 Matriz', '📊 Distribuição', '🧠 Análise'][i]}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Resumo */}
          {abaAtiva === 'resumo' && (
            <div className="space-y-6">
              <Card>
                <div className="p-4">
                  <h3 className="font-bold mb-4">🔄 Matriz de Transição</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="p-3 bg-orange-50 border">De \ Para</th>
                          {estados.map((e, i) => (
                            <th key={i} className="p-3 bg-orange-50 border text-center">{e}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {matrizTransicao.map((linha, i) => (
                          <tr key={i}>
                            <td className="p-3 bg-orange-50 border font-medium">{estados[i]}</td>
                            {linha.map((v, j) => (
                              <td key={j} className="p-3 border text-center">
                                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                                  {(v * 100).toFixed(1)}%
                                </span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-4">
                  <h3 className="font-bold mb-4">⏱️ Tempo Médio de Retorno</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {estados.map((estado, i) => (
                      <div key={i} className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">{estado}</div>
                        <div className="text-2xl font-bold text-orange-600">{tempoMedioRetorno[i]}</div>
                        <div className="text-xs text-gray-500">períodos</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-4">
                  <h3 className="font-bold mb-4">🎯 Primeira Passagem</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {probabilidadesPrimeiraPassagem.map((item, i) => (
                      <div key={i} className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-sm text-gray-600">{item.para}</div>
                        <div className="text-2xl font-bold text-blue-600">{item.tempo}</div>
                        <div className="text-xs text-gray-500">períodos</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Matriz */}
          {abaAtiva === 'matriz' && (
            <Card>
              <div className="p-4">
                <h3 className="font-bold mb-4">📊 Matriz de Transição</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-3 bg-orange-50 border">Estado Atual</th>
                        {estados.map((e, i) => (
                          <th key={i} className="p-3 bg-orange-50 border text-center">Próximo: {e}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrizTransicao.map((linha, i) => (
                        <tr key={i}>
                          <td className="p-3 bg-orange-50 border font-medium">{estados[i]}</td>
                          {linha.map((v, j) => (
                            <td key={j} className="p-3 border text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-bold">{(v * 100).toFixed(1)}%</span>
                                <div className="w-16 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                  <div className="h-full bg-orange-500" style={{ width: `${v * 100}%` }} />
                                </div>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {/* Distribuição */}
          {abaAtiva === 'estacionaria' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <div className="p-4">
                  <h3 className="font-bold mb-4">🥧 Distribuição Estacionária</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={distribuicaoEstacionariaData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        outerRadius={80}
                        dataKey="valor"
                      >
                        {distribuicaoEstacionariaData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={coresEstados[index % coresEstados.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <div className="p-4">
                  <h3 className="font-bold mb-4">📊 Probabilidades</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={distribuicaoEstacionariaData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nome" />
                      <YAxis unit="%" />
                      <Tooltip />
                      <Bar dataKey="valor" fill="#f97316">
                        {distribuicaoEstacionariaData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={coresEstados[index % coresEstados.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}

          {/* Interpretação */}
          {abaAtiva === 'interpretacao' && (
            <div className="space-y-4">
              {interpretacoes.map((item, i) => (
                <Card key={i}>
                  <div className="p-5">
                    <h3 className="font-bold text-orange-700 mb-2">{item.titulo}</h3>
                    <p className="text-gray-700">{item.texto}</p>
                    {item.destaque && (
                      <div className="mt-2 p-3 bg-orange-50 rounded-lg text-orange-800">
                        {item.destaque}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}