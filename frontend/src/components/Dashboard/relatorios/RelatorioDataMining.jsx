// src/components/Dashboard/relatorios/RelatorioDataMining.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  GitBranch, Network, Target, Layers, Activity,
  PieChart, BarChart3, ScatterChart, AlertTriangle,
  GitMerge, Share2, Filter, Minimize2, Maximize2,
  Zap, Award, TrendingUp, ChevronRight,
  Database, Cpu, Clock, Download, Info, HelpCircle,
  AlertCircle, CheckCircle, ArrowLeft, Settings,
  BookOpen, FileText, Brain, Eye, EyeOff,
  PieChart as PieIcon, BarChart as BarIcon, LineChart as LineIcon,
  ScatterChart as ScatterIcon, TreePine, ShoppingCart,
  Package, Link, Target as TargetIcon, Shield,
  FileJson, FileSpreadsheet
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
    clustering: 'bg-blue-100 text-blue-800',
    classificacao: 'bg-green-100 text-green-800',
    associacao: 'bg-purple-100 text-purple-800',
    reducao: 'bg-orange-100 text-orange-800',
    anomalias: 'bg-red-100 text-red-800'
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

const formatarNumero = (num) => {
  if (num === undefined || num === null) return 'N/A';
  if (typeof num === 'number') {
    if (num > 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num > 1000) return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

const formatarPercentual = (valor, decimais = 1) => {
  if (valor === undefined || valor === null) return '-';
  const num = typeof valor === 'string' ? parseFloat(valor) : valor;
  if (isNaN(num)) return '-';
  return `${num.toFixed(decimais)}%`;
};

// ========== MAPEAMENTO DE ALGORITMOS ==========
const ALGORITMOS = {
  // Clustering
  kmeans: { nome: 'K-Means', categoria: 'clustering', icone: '🎯' },
  dbscan: { nome: 'DBSCAN', categoria: 'clustering', icone: '🌐' },
  hierarchical: { nome: 'Hierárquico', categoria: 'clustering', icone: '🌳' },
  gmm: { nome: 'GMM', categoria: 'clustering', icone: '📊' },
  
  // Classificação
  decision_tree: { nome: 'Árvore de Decisão', categoria: 'classificacao', icone: '🌿' },
  random_forest: { nome: 'Random Forest', categoria: 'classificacao', icone: '🌲' },
  svm: { nome: 'SVM', categoria: 'classificacao', icone: '🎯' },
  naive_bayes: { nome: 'Naive Bayes', categoria: 'classificacao', icone: '📈' },
  knn: { nome: 'KNN', categoria: 'classificacao', icone: '👥' },
  
  // Associação
  apriori: { nome: 'Apriori', categoria: 'associacao', icone: '🛒' },
  fp_growth: { nome: 'FP-Growth', categoria: 'associacao', icone: '🌲' },
  eclat: { nome: 'Eclat', categoria: 'associacao', icone: '⚡' },
  
  // Redução
  pca: { nome: 'PCA', categoria: 'reducao', icone: '📉' },
  tsne: { nome: 't-SNE', categoria: 'reducao', icone: '🌀' },
  umap: { nome: 'UMAP', categoria: 'reducao', icone: '🌌' },
  
  // Anomalias
  isolation_forest: { nome: 'Isolation Forest', categoria: 'anomalias', icone: '🌲' },
  lof: { nome: 'LOF', categoria: 'anomalias', icone: '📊' },
  one_class_svm: { nome: 'One-Class SVM', categoria: 'anomalias', icone: '🎯' }
};

// ========== DETECTOR DE TIPO BASEADO NOS PARÂMETROS ==========
const detectarTipoDataMining = (modelo, resultado) => {
  console.log('🔍 Detectando tipo Data Mining...');
  console.log('📦 modelo:', modelo);
  console.log('📦 resultado:', resultado);
  
  // Extrair parâmetros de diferentes lugares possíveis
  const parametros = modelo?.parametros || modelo?.dados?.parametros || resultado?.parametros || {};
  const tipoModelo = modelo?.tipo || modelo?.categoria || resultado?.tipo || '';
  const algoritmoRaw = parametros.algoritmo || 
                       parametros.metodo || 
                       modelo?.algoritmo || 
                       resultado?.algoritmo || 
                       '';
  
  // Normalizar algoritmo (remover espaços, lower case)
  const algoritmo = typeof algoritmoRaw === 'string' ? algoritmoRaw.toLowerCase().trim() : '';
  
  console.log('🔧 Algoritmo detectado (raw):', algoritmoRaw);
  console.log('🔧 Algoritmo normalizado:', algoritmo);
  console.log('🔧 Tipo modelo:', tipoModelo);
  
  // Verificar se temos um algoritmo conhecido
  const algInfo = ALGORITMOS[algoritmo] || 
                  ALGORITMOS[algoritmo.replace('_', '')] || 
                  ALGORITMOS[algoritmo.replace('-', '_')] ||
                  Object.values(ALGORITMOS).find(a => a.nome.toLowerCase() === algoritmo.toLowerCase());
  
  if (algInfo) {
    console.log('✅ Algoritmo conhecido:', algInfo);
    return {
      categoria: algInfo.categoria,
      algoritmo: algInfo.nome,
      algoritmoId: algoritmo,
      nome: `${algInfo.categoria === 'clustering' ? 'Clustering' : 
              algInfo.categoria === 'classificacao' ? 'Classificação' :
              algInfo.categoria === 'associacao' ? 'Associação' :
              algInfo.categoria === 'reducao' ? 'Redução' : 'Anomalias'} - ${algInfo.nome}`,
      descricao: getDescricaoPorAlgoritmo(algoritmo, algInfo.categoria),
      icone: getIconePorCategoria(algInfo.categoria),
      cor: getCorPorCategoria(algInfo.categoria),
      badge: algInfo.categoria
    };
  }
  
  // Se não encontrou por algoritmo, tenta detectar pela estrutura do resultado
  if (resultado?.clusters || resultado?.centroides) {
    console.log('✅ Detectado clustering por estrutura');
    return {
      categoria: 'clustering',
      algoritmo: algoritmo || 'K-Means',
      algoritmoId: algoritmo || 'kmeans',
      nome: `Clustering - ${algoritmo ? getNomeAlgoritmo(algoritmo) : 'K-Means'}`,
      descricao: 'Agrupamento de dados em clusters baseado em similaridade',
      icone: <Target className="w-8 h-8" />,
      cor: 'from-blue-600 to-indigo-600',
      badge: 'clustering'
    };
  }
  
  if (resultado?.metricas?.acuracia !== undefined || resultado?.metricas?.teste) {
    console.log('✅ Detectado classificação por estrutura');
    return {
      categoria: 'classificacao',
      algoritmo: algoritmo || 'Árvore de Decisão',
      algoritmoId: algoritmo || 'decision_tree',
      nome: `Classificação - ${algoritmo ? getNomeAlgoritmo(algoritmo) : 'Árvore de Decisão'}`,
      descricao: 'Classificação supervisionada de dados',
      icone: <TargetIcon className="w-8 h-8" />,
      cor: 'from-green-600 to-emerald-600',
      badge: 'classificacao'
    };
  }
  
  if (resultado?.regras || resultado?.itemsets) {
    console.log('✅ Detectado associação por estrutura');
    return {
      categoria: 'associacao',
      algoritmo: algoritmo || 'Apriori',
      algoritmoId: algoritmo || 'apriori',
      nome: `Associação - ${algoritmo ? getNomeAlgoritmo(algoritmo) : 'Apriori'}`,
      descricao: 'Mineração de regras de associação',
      icone: <ShoppingCart className="w-8 h-8" />,
      cor: 'from-purple-600 to-pink-600',
      badge: 'associacao'
    };
  }
  
  if (resultado?.componentes || resultado?.variancia_explicada) {
    console.log('✅ Detectado redução por estrutura');
    return {
      categoria: 'reducao',
      algoritmo: algoritmo || 'PCA',
      algoritmoId: algoritmo || 'pca',
      nome: `Redução - ${algoritmo ? getNomeAlgoritmo(algoritmo) : 'PCA'}`,
      descricao: 'Redução de dimensionalidade',
      icone: <Minimize2 className="w-8 h-8" />,
      cor: 'from-orange-600 to-amber-600',
      badge: 'reducao'
    };
  }
  
  if (resultado?.anomalias || resultado?.n_anomalias !== undefined || resultado?.outliers) {
    console.log('✅ Detectado anomalias por estrutura');
    return {
      categoria: 'anomalias',
      algoritmo: algoritmo || 'Isolation Forest',
      algoritmoId: algoritmo || 'isolation_forest',
      nome: `Anomalias - ${algoritmo ? getNomeAlgoritmo(algoritmo) : 'Isolation Forest'}`,
      descricao: 'Detecção de pontos anômalos e outliers',
      icone: <AlertTriangle className="w-8 h-8" />,
      cor: 'from-red-600 to-pink-600',
      badge: 'anomalias'
    };
  }
  
  // Fallback genérico
  console.log('⚠️ Tipo não detectado, usando fallback');
  return {
    categoria: 'clustering',
    algoritmo: algoritmo || 'não especificado',
    algoritmoId: algoritmo || 'unknown',
    nome: 'Análise de Data Mining',
    descricao: 'Descoberta de padrões em dados',
    icone: <Brain className="w-8 h-8" />,
    cor: 'from-gray-600 to-slate-600',
    badge: 'default'
  };
};

// ========== FUNÇÕES AUXILIARES ==========
const getNomeAlgoritmo = (algoritmo) => {
  const nomes = {
    'kmeans': 'K-Means',
    'dbscan': 'DBSCAN',
    'hierarchical': 'Hierárquico',
    'gmm': 'GMM',
    'decision_tree': 'Árvore de Decisão',
    'random_forest': 'Random Forest',
    'svm': 'SVM',
    'naive_bayes': 'Naive Bayes',
    'knn': 'KNN',
    'apriori': 'Apriori',
    'fp_growth': 'FP-Growth',
    'eclat': 'Eclat',
    'pca': 'PCA',
    'tsne': 't-SNE',
    'umap': 'UMAP',
    'isolation_forest': 'Isolation Forest',
    'lof': 'LOF',
    'one_class_svm': 'One-Class SVM'
  };
  return nomes[algoritmo] || algoritmo || 'Algoritmo';
};

const getDescricaoPorAlgoritmo = (algoritmo, categoria) => {
  const descricoes = {
    kmeans: 'Agrupa dados em K grupos baseados em similaridade',
    dbscan: 'Agrupamento baseado em densidade, identifica clusters de formatos arbitrários',
    hierarchical: 'Constrói uma hierarquia de clusters através de aglomerações',
    gmm: 'Modelo de Misturas Gaussianas, assume distribuições normais',
    decision_tree: 'Árvore de decisão para classificação baseada em regras',
    random_forest: 'Conjunto de árvores de decisão para maior precisão',
    svm: 'Máquina de Vetores de Suporte para classificação',
    naive_bayes: 'Classificador probabilístico baseado no Teorema de Bayes',
    knn: 'Classificação baseada nos K vizinhos mais próximos',
    apriori: 'Encontra regras de associação entre itens',
    fp_growth: 'Mineração eficiente de padrões frequentes',
    eclat: 'Algoritmo para mining de itemsets frequentes',
    pca: 'Redução linear de dimensionalidade preservando variância',
    tsne: 'Visualização de dados de alta dimensão em 2D/3D',
    umap: 'Projeção de manifold para redução não-linear',
    isolation_forest: 'Isola anomalias através de partições aleatórias',
    lof: 'Detecta outliers baseado em densidade local',
    one_class_svm: 'Máquina de vetores de suporte para uma classe'
  };
  
  if (descricoes[algoritmo]) return descricoes[algoritmo];
  
  // Fallback por categoria
  const fallbacks = {
    clustering: 'Agrupamento de dados baseado em similaridade',
    classificacao: 'Classificação supervisionada de dados',
    associacao: 'Mineração de regras de associação',
    reducao: 'Redução de dimensionalidade',
    anomalias: 'Detecção de pontos anômalos e outliers'
  };
  
  return fallbacks[categoria] || 'Análise de Data Mining';
};

const getIconePorCategoria = (categoria) => {
  switch(categoria) {
    case 'clustering': return <Target className="w-8 h-8" />;
    case 'classificacao': return <TargetIcon className="w-8 h-8" />;
    case 'associacao': return <ShoppingCart className="w-8 h-8" />;
    case 'reducao': return <Minimize2 className="w-8 h-8" />;
    case 'anomalias': return <AlertTriangle className="w-8 h-8" />;
    default: return <Brain className="w-8 h-8" />;
  }
};

const getCorPorCategoria = (categoria) => {
  switch(categoria) {
    case 'clustering': return 'from-blue-600 to-indigo-600';
    case 'classificacao': return 'from-green-600 to-emerald-600';
    case 'associacao': return 'from-purple-600 to-pink-600';
    case 'reducao': return 'from-orange-600 to-amber-600';
    case 'anomalias': return 'from-red-600 to-pink-600';
    default: return 'from-gray-600 to-slate-600';
  }
};

// ========== GERADOR DE INTERPRETAÇÃO ==========
const gerarInterpretacao = (categoria, algoritmo, metricas, parametros, resultado) => {
  const interpretacoes = [];
  
  // Introdução
  if (categoria === 'clustering') {
    interpretacoes.push({
      titulo: "🎯 O que foi feito?",
      texto: `Esta análise utilizou o algoritmo **${algoritmo}** para agrupar os dados em **${resultado.clusters?.length || 'N/A'} grupos (clusters)** baseados em similaridade. ` +
             `O algoritmo encontra grupos naturais nos dados onde elementos dentro do mesmo grupo são similares entre si e diferentes de elementos de outros grupos.`
    });
    
    if (resultado.metricas?.silhueta !== undefined) {
      const silhueta = resultado.metricas.silhueta;
      let qualidade = '';
      let explicacao = '';
      
      if (silhueta > 0.7) {
        qualidade = '🏆 EXCELENTE';
        explicacao = 'Os clusters estão muito bem separados, indicando uma estrutura muito clara nos dados.';
      } else if (silhueta > 0.5) {
        qualidade = '✅ BOA';
        explicacao = 'Os clusters estão razoavelmente separados, com boa definição dos grupos.';
      } else if (silhueta > 0.25) {
        qualidade = '⚠️ FRACA';
        explicacao = 'Os clusters apresentam alguma sobreposição, pode haver grupos menos definidos.';
      } else {
        qualidade = '❌ RUIM';
        explicacao = 'Os clusters estão mal definidos, com muita sobreposição entre grupos.';
      }
      
      interpretacoes.push({
        titulo: "📊 Qualidade dos Clusters",
        texto: `A **silhueta média de ${silhueta.toFixed(3)}** indica uma qualidade **${qualidade}**. ${explicacao}`
      });
    }
  }
  
  else if (categoria === 'classificacao') {
    interpretacoes.push({
      titulo: "🎯 O que foi feito?",
      texto: `Foi treinado um modelo de classificação usando **${algoritmo}** para prever a variável alvo **"${parametros.target || 'target'}"** com base em **${parametros.variaveis?.length || 0} variáveis preditoras**.`
    });
    
    if (resultado.metricas?.teste?.acuracia) {
      const acuracia = resultado.metricas.teste.acuracia * 100;
      let avaliacao = '';
      
      if (acuracia > 90) avaliacao = '🏆 EXCELENTE - modelo muito preciso';
      else if (acuracia > 80) avaliacao = '✅ MUITO BOA - modelo confiável';
      else if (acuracia > 70) avaliacao = '👍 BOA - modelo adequado';
      else if (acuracia > 60) avaliacao = '⚠️ RAZOÁVEL - pode melhorar';
      else avaliacao = '❌ FRACA - precisa de ajustes';
      
      interpretacoes.push({
        titulo: "📊 Performance do Modelo",
        texto: `O modelo atingiu uma **acurácia de ${acuracia.toFixed(1)}%** no conjunto de teste. ` +
               `Isso significa que ele classifica corretamente **${acuracia.toFixed(1)}%** dos novos casos. ` +
               `Avaliação: **${avaliacao}**.`
      });
      
      // Comparação treino vs teste para detectar overfitting
      if (resultado.metricas?.treino?.acuracia) {
        const diff = (resultado.metricas.treino.acuracia - resultado.metricas.teste.acuracia) * 100;
        if (diff > 20) {
          interpretacoes.push({
            titulo: "⚠️ Atenção: Overfitting Detectado",
            texto: `O modelo tem performance muito melhor no treino (${(resultado.metricas.treino.acuracia * 100).toFixed(1)}%) do que no teste (${acuracia.toFixed(1)}%). ` +
                   `Diferença de ${diff.toFixed(1)}% indica que o modelo **decorou os dados de treino** e pode não generalizar bem para novos dados.`
          });
        }
      }
    }
  }
  
  else if (categoria === 'associacao') {
    interpretacoes.push({
      titulo: "🎯 O que foi feito?",
      texto: `Foi aplicado o algoritmo **${algoritmo}** para encontrar regras de associação entre os itens. ` +
             `Foram descobertas **${resultado.regras?.length || resultado.n_itemsets || 0} relações** entre as variáveis.`
    });
    
    if (resultado.estatisticas) {
      const suporte = (resultado.estatisticas.suporte_medio * 100).toFixed(1);
      const confianca = (resultado.estatisticas.confianca_media * 100).toFixed(1);
      const lift = resultado.estatisticas.lift_medio?.toFixed(2) || 'N/A';
      
      let avaliacaoLift = '';
      if (lift > 3) avaliacaoLift = 'associações muito fortes';
      else if (lift > 1.5) avaliacaoLift = 'associações significativas';
      else if (lift > 1) avaliacaoLift = 'associações positivas';
      else avaliacaoLift = 'associações fracas ou negativas';
      
      interpretacoes.push({
        titulo: "📊 Principais Métricas",
        texto: `• **Suporte médio:** ${suporte}% (frequência das regras nos dados)\n` +
               `• **Confiança média:** ${confianca}% (probabilidade da regra ser verdadeira)\n` +
               `• **Lift médio:** ${lift} (${avaliacaoLift})`
      });
    }
  }
  
  else if (categoria === 'reducao') {
    interpretacoes.push({
      titulo: "🎯 O que foi feito?",
      texto: `Foi aplicada redução dimensional usando **${algoritmo}** para transformar **${parametros.variaveis?.length || 0} variáveis originais** em **${resultado.n_componentes || 2} componentes principais**.`
    });
    
    if (resultado.variancia_explicada) {
      const varianciaTotal = resultado.variancia_explicada.reduce((a, b) => a + b, 0) * 100;
      
      let avaliacao = '';
      if (varianciaTotal > 90) avaliacao = 'excelente preservação da informação';
      else if (varianciaTotal > 70) avaliacao = 'boa preservação';
      else if (varianciaTotal > 50) avaliacao = 'preservação moderada';
      else avaliacao = 'perda significativa de informação';
      
      interpretacoes.push({
        titulo: "📊 Informação Preservada",
        texto: `Os **${resultado.n_componentes} componentes principais** explicam **${varianciaTotal.toFixed(1)}%** da variância total dos dados originais. ` +
               `Isso significa que a redução manteve **${varianciaTotal.toFixed(1)}% da informação original**, o que é considerado **${avaliacao}**.`
      });
      
      // Detalhar cada componente
      const detalhes = resultado.variancia_explicada.map((v, i) => 
        `PC${i+1}: ${(v * 100).toFixed(1)}%`
      ).join(' • ');
      
      interpretacoes.push({
        titulo: "📈 Distribuição por Componente",
        texto: detalhes
      });
    }
  }
  
  else if (categoria === 'anomalias') {
    const taxa = (resultado.taxa_anomalias * 100).toFixed(1);
    let avaliacao = '';
    
    if (resultado.taxa_anomalias < 0.01) avaliacao = 'muito baixa (menos de 1% dos dados)';
    else if (resultado.taxa_anomalias < 0.05) avaliacao = 'baixa (1-5% dos dados)';
    else if (resultado.taxa_anomalias < 0.1) avaliacao = 'moderada (5-10% dos dados)';
    else if (resultado.taxa_anomalias < 0.2) avaliacao = 'alta (10-20% dos dados)';
    else avaliacao = 'muito alta (mais de 20% dos dados)';
    
    interpretacoes.push({
      titulo: "🎯 O que foi feito?",
      texto: `Foi aplicado o algoritmo **${algoritmo}** para detectar pontos anômalos nos dados. ` +
             `Foram identificadas **${resultado.n_anomalias} anomalias**, representando **${taxa}%** do total de registros. ` +
             `Esta taxa é considerada **${avaliacao}**.`
    });
    
    if (resultado.threshold) {
      interpretacoes.push({
        titulo: "⚙️ Limiar de Detecção",
        texto: `O algoritmo utilizou um threshold de **${resultado.threshold.toFixed(3)}** para classificar pontos como anômalos. ` +
               `Pontos com score acima deste valor são considerados anomalias.`
      });
    }
  }
  
  return interpretacoes;
};

// ========== GERADOR DE RECOMENDAÇÕES ==========
const gerarRecomendacoes = (categoria, algoritmo, metricas, parametros, resultado) => {
  const recs = [];
  
  if (categoria === 'clustering') {
    if (resultado.metricas?.silhueta !== undefined) {
      if (resultado.metricas.silhueta < 0.25) {
        recs.push({
          acao: 'Ajustar número de clusters',
          motivo: `Silhueta muito baixa (${resultado.metricas.silhueta.toFixed(3)}) indica clusters sobrepostos`,
          impacto: 'Melhor separação entre grupos e clusters mais definidos'
        });
      }
      
      if (resultado.metricas.silhueta > 0.7) {
        recs.push({
          acao: 'Considerar redução do número de clusters',
          motivo: 'Silhueta muito alta pode indicar subsegmentação',
          impacto: 'Clusters mais granulares e específicos'
        });
      }
    }
    
    if (parametros.algoritmo === 'kmeans' && resultado.clusters?.some(c => c.tamanho < 5)) {
      recs.push({
        acao: 'Reduzir número de clusters ou aumentar dados',
        motivo: 'Clusters muito pequenos (menos de 5 elementos) podem não ser significativos',
        impacto: 'Agrupamentos mais robustos e estatisticamente relevantes'
      });
    }
    
    if (parametros.algoritmo === 'dbscan' && resultado.metricas?.noise_ratio > 0.3) {
      recs.push({
        acao: 'Ajustar parâmetros eps e min_samples',
        motivo: `Taxa de ruído elevada (${(resultado.metricas.noise_ratio * 100).toFixed(1)}%)`,
        impacto: 'Menos pontos classificados como ruído'
      });
    }
  }
  
  else if (categoria === 'classificacao') {
    if (metricas?.teste?.acuracia) {
      if (metricas.teste.acuracia < 0.6) {
        recs.push({
          acao: 'Aumentar dados de treino ou ajustar parâmetros',
          motivo: `Acurácia baixa (${(metricas.teste.acuracia * 100).toFixed(1)}%) indica modelo subajustado`,
          impacto: 'Melhor capacidade de generalização e precisão'
        });
      }
      
      if (metricas.teste.acuracia > 0.95) {
        recs.push({
          acao: 'Validar com mais dados ou reduzir complexidade',
          motivo: 'Acurácia muito alta pode indicar overfitting ou dados muito simples',
          impacto: 'Modelo mais robusto para novos dados'
        });
      }
    }
    
    if (metricas?.treino?.acuracia && metricas?.teste?.acuracia) {
      const diff = (metricas.treino.acuracia - metricas.teste.acuracia) * 100;
      if (diff > 15) {
        recs.push({
          acao: 'Reduzir complexidade do modelo (regularização)',
          motivo: `Overfitting detectado: treino ${(metricas.treino.acuracia * 100).toFixed(1)}% vs teste ${(metricas.teste.acuracia * 100).toFixed(1)}%`,
          impacto: 'Melhor balanceamento entre viés e variância'
        });
      }
    }
    
    if (parametros.algoritmo === 'svm' && !parametros.kernel) {
      recs.push({
        acao: 'Experimentar diferentes kernels (RBF, linear, polinomial)',
        motivo: 'Kernel padrão pode não ser ideal para seus dados',
        impacto: 'Melhor separação das classes'
      });
    }
  }
  
  else if (categoria === 'associacao') {
    if (parametros.min_support < 0.05 && resultado.regras?.length > 1000) {
      recs.push({
        acao: 'Aumentar suporte mínimo',
        motivo: `Muitas regras (${resultado.regras.length}) podem incluir relações espúrias`,
        impacto: 'Regras mais relevantes e confiáveis, menos ruído'
      });
    }
    
    if (resultado.estatisticas?.lift_medio < 1.2) {
      recs.push({
        acao: 'Aumentar thresholds de suporte e confiança',
        motivo: `Lift médio baixo (${resultado.estatisticas.lift_medio?.toFixed(2)}) indica associações fracas`,
        impacto: 'Regras com maior poder preditivo'
      });
    }
    
    if (resultado.estatisticas?.lift_medio > 5) {
      recs.push({
        acao: 'Investigar regras com lift muito alto',
        motivo: 'Lift muito alto pode indicar relações óbvias ou redundantes',
        impacto: 'Foco em insights não triviais'
      });
    }
  }
  
  else if (categoria === 'reducao') {
    const varianciaExplicada = resultado.variancia_explicada?.reduce((a, b) => a + b, 0) * 100 || 0;
    
    if (varianciaExplicada < 60) {
      recs.push({
        acao: 'Aumentar número de componentes',
        motivo: `Apenas ${varianciaExplicada.toFixed(1)}% da variância explicada`,
        impacto: 'Preservar mais informação original'
      });
    }
    
    if (varianciaExplicada > 95 && resultado.n_componentes > 2) {
      recs.push({
        acao: 'Reduzir para 2 componentes',
        motivo: 'Alta variância explicada permite visualização 2D',
        impacto: 'Melhor visualização e interpretação'
      });
    }
    
    if (parametros.algoritmo === 'pca' && !parametros.scale) {
      recs.push({
        acao: 'Ativar padronização dos dados',
        motivo: 'PCA é sensível a escalas diferentes das variáveis',
        impacto: 'Componentes mais representativos'
      });
    }
  }
  
  else if (categoria === 'anomalias') {
    const taxa = resultado.taxa_anomalias || 0;
    
    if (taxa > 0.2) {
      recs.push({
        acao: 'Ajustar threshold ou contamination',
        motivo: `Taxa de anomalias muito alta (${(taxa * 100).toFixed(1)}%)`,
        impacto: 'Reduzir falsos positivos'
      });
    }
    
    if (taxa === 0) {
      recs.push({
        acao: 'Reduzir threshold ou contamination',
        motivo: 'Nenhuma anomalia detectada',
        impacto: 'Identificar outliers mais sutis'
      });
    }
    
    if (parametros.algoritmo === 'isolation_forest' && parametros.n_trees < 100) {
      recs.push({
        acao: 'Aumentar número de árvores',
        motivo: 'Isolation Forest com poucas árvores pode ser instável',
        impacto: 'Detecção mais robusta e consistente'
      });
    }
    
    if (parametros.algoritmo === 'lof' && parametros.k < 10) {
      recs.push({
        acao: 'Aumentar número de vizinhos (k)',
        motivo: 'LOF com poucos vizinhos pode ser sensível a ruído',
        impacto: 'Detecção mais estável'
      });
    }
  }
  
  // Recomendação genérica se não houver específicas
  if (recs.length === 0) {
    recs.push({
      acao: 'Experimentar diferentes parâmetros',
      motivo: 'Explorar configurações alternativas pode trazer melhores resultados',
      impacto: 'Possível melhoria na qualidade do modelo'
    });
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

    // Cores baseadas na categoria
    const coresPorCategoria = {
      clustering: [41, 128, 185],     // Azul
      classificacao: [46, 204, 113],   // Verde
      associacao: [155, 89, 182],      // Roxo
      reducao: [230, 126, 34],         // Laranja
      anomalias: [231, 76, 60]         // Vermelho
    };
    
    const corPrimaria = coresPorCategoria[dadosProcessados.categoria] || [52, 73, 94];
    const corSecundaria = corPrimaria.map(c => Math.min(c + 30, 255));
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
      doc.text("Relatório Data Mining", margem, 18);

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
    doc.text("RELATÓRIO DATA MINING", pageWidth / 2, 100, { align: "center" });

    doc.setFontSize(16);
    doc.text(dadosProcessados.nome, pageWidth / 2, 130, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(dadosProcessados.descricao, pageWidth / 2, 150, { align: "center" });

    doc.setFontSize(10);
    doc.text(
      `Algoritmo: ${dadosProcessados.algoritmo}`,
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
    
    adicionarParagrafo(`Algoritmo utilizado: **${dadosProcessados.algoritmo}**`);
    adicionarParagrafo(dadosProcessados.interpretacoes[0]?.texto || dadosProcessados.descricao);
    yPos += 5;
    
    adicionarSubtitulo("Métricas Principais:");
    
    // Métricas específicas por categoria
    if (dadosProcessados.categoria === 'clustering' && dadosProcessados.resultado?.clusters) {
      adicionarMetrica("Número de Clusters", dadosProcessados.resultado.clusters.length.toString());
      if (dadosProcessados.resultado.metricas?.silhueta) {
        adicionarMetrica("Silhueta", dadosProcessados.resultado.metricas.silhueta.toFixed(3));
      }
    }
    
    else if (dadosProcessados.categoria === 'classificacao' && dadosProcessados.resultado?.metricas?.teste) {
      const m = dadosProcessados.resultado.metricas.teste;
      adicionarMetrica("Acurácia", (m.acuracia * 100).toFixed(1), "%");
      adicionarMetrica("Precisão", (m.precisao * 100).toFixed(1), "%");
    }
    
    else if (dadosProcessados.categoria === 'associacao' && dadosProcessados.resultado?.estatisticas) {
      const e = dadosProcessados.resultado.estatisticas;
      adicionarMetrica("Total de Regras", e.total_regras?.toString() || '0');
      adicionarMetrica("Suporte Médio", (e.suporte_medio * 100).toFixed(1), "%");
    }
    
    else if (dadosProcessados.categoria === 'reducao' && dadosProcessados.resultado?.variancia_explicada) {
      const total = dadosProcessados.resultado.variancia_explicada.reduce((a, b) => a + b, 0) * 100;
      adicionarMetrica("Variância Explicada", total.toFixed(1), "%");
    }
    
    else if (dadosProcessados.categoria === 'anomalias' && dadosProcessados.resultado) {
      adicionarMetrica("Anomalias", dadosProcessados.resultado.n_anomalias?.toString() || '0');
      adicionarMetrica("Taxa de Anomalias", (dadosProcessados.resultado.taxa_anomalias * 100).toFixed(1), "%");
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
    } else {
      adicionarParagrafo("Não foram identificadas oportunidades de melhoria. O modelo atual parece adequado.");
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
    doc.text("Cientista de Dados", margem, yPos);
    doc.text("Coordenador de Analytics", pageWidth - margem - 60, yPos);
    
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
    doc.save(`Relatorio_DataMining_${dadosProcessados.categoria}_${new Date().toISOString().split("T")[0]}.pdf`);
    
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    throw error;
  }
};

// ========== COMPONENTE PRINCIPAL ==========
export default function RelatorioDataMining({ modelo, dadosCompletos }) {
  const [dadosProcessados, setDadosProcessados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportandoPDF, setExportandoPDF] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('resumo');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    try {
      console.log('📊 Processando relatório Data Mining...');
      console.log('📦 modelo:', modelo);

      if (!modelo) {
        throw new Error('Modelo não fornecido');
      }

      const resultado = modelo.resultado || {};
      const parametros = modelo.parametros || {};
      
      // Detectar categoria e algoritmo corretamente
      const tipoInfo = detectarTipoDataMining(modelo, resultado);
      
      console.log('✅ Tipo detectado:', tipoInfo);
      
      // Gerar interpretações e recomendações
      const interpretacoes = gerarInterpretacao(
        tipoInfo.categoria, 
        tipoInfo.algoritmo, 
        resultado.metricas, 
        parametros, 
        resultado
      );
      
      const recomendacoes = gerarRecomendacoes(
        tipoInfo.categoria, 
        tipoInfo.algoritmo, 
        resultado.metricas, 
        parametros, 
        resultado
      );
      
      // Construir objeto final
      const dados = {
        success: true,
        timestamp: new Date().toISOString(),
        categoria: tipoInfo.categoria,
        algoritmo: tipoInfo.algoritmo,
        algoritmoId: tipoInfo.algoritmoId,
        nome: tipoInfo.nome,
        descricao: tipoInfo.descricao,
        cor: tipoInfo.cor,
        badge: tipoInfo.badge,
        
        parametros,
        resultado,
        
        interpretacoes,
        recomendacoes,
        
        metricas_resumo: {
          tempo_execucao: resultado.tempo_execucao || 0,
          n_registros: resultado.n_registros || 0
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
            <Brain className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Processando Data Mining...</h3>
          <p className="text-gray-600 mt-2">Analisando padrões nos dados</p>
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
        <p className="text-gray-600">Execute uma análise de Data Mining primeiro.</p>
      </div>
    );
  }

  const { categoria, algoritmo, nome, descricao, cor, badge, interpretacoes, recomendacoes, resultado, parametros } = dadosProcessados;

  // Mapeamento de ícones por categoria
  const getIcone = (categoria) => {
    switch(categoria) {
      case 'clustering': return <Target className="w-8 h-8 text-blue-500" />;
      case 'classificacao': return <TargetIcon className="w-8 h-8 text-green-500" />;
      case 'associacao': return <ShoppingCart className="w-8 h-8 text-purple-500" />;
      case 'reducao': return <Minimize2 className="w-8 h-8 text-orange-500" />;
      case 'anomalias': return <AlertTriangle className="w-8 h-8 text-red-500" />;
      default: return <Brain className="w-8 h-8 text-gray-500" />;
    }
  };

  // Renderizar métricas específicas da categoria
  const renderMetricasPrincipais = () => {
    if (categoria === 'clustering' && resultado.clusters) {
      const total = resultado.clusters.reduce((acc, c) => acc + c.tamanho, 0);
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Clusters</div>
            <div className="text-2xl font-bold">{resultado.clusters.length}</div>
          </div>
          {resultado.metricas?.silhueta !== undefined && (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs text-blue-200">Silhueta</div>
              <div className="text-2xl font-bold">{resultado.metricas.silhueta.toFixed(3)}</div>
            </div>
          )}
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Total Elementos</div>
            <div className="text-2xl font-bold">{total}</div>
          </div>
        </div>
      );
    }

    if (categoria === 'classificacao' && resultado.metricas?.teste) {
      const m = resultado.metricas.teste;
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-green-200">Acurácia</div>
            <div className="text-2xl font-bold">{(m.acuracia * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-green-200">Precisão</div>
            <div className="text-2xl font-bold">{(m.precisao * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-green-200">Recall</div>
            <div className="text-2xl font-bold">{(m.recall * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-green-200">F1-Score</div>
            <div className="text-2xl font-bold">{(m.f1 * 100).toFixed(1)}%</div>
          </div>
        </div>
      );
    }

    if (categoria === 'associacao' && resultado.estatisticas) {
      const e = resultado.estatisticas;
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-purple-200">Regras</div>
            <div className="text-2xl font-bold">{e.total_regras || resultado.regras?.length || 0}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-purple-200">Suporte Médio</div>
            <div className="text-2xl font-bold">{(e.suporte_medio * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-purple-200">Confiança Média</div>
            <div className="text-2xl font-bold">{(e.confianca_media * 100).toFixed(1)}%</div>
          </div>
          {e.lift_medio && (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs text-purple-200">Lift Médio</div>
              <div className="text-2xl font-bold">{e.lift_medio.toFixed(2)}</div>
            </div>
          )}
        </div>
      );
    }

    if (categoria === 'reducao' && resultado.componentes) {
      const varianciaTotal = resultado.variancia_explicada ? 
        (resultado.variancia_explicada.reduce((a, b) => a + b, 0) * 100).toFixed(1) : 'N/A';
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-orange-200">Componentes</div>
            <div className="text-2xl font-bold">{resultado.n_componentes || 2}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-orange-200">Variância Explicada</div>
            <div className="text-2xl font-bold">{varianciaTotal}%</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-orange-200">Pontos Projetados</div>
            <div className="text-2xl font-bold">{resultado.componentes?.length || 0}</div>
          </div>
        </div>
      );
    }

    if (categoria === 'anomalias' && resultado) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-red-200">Anomalias</div>
            <div className="text-2xl font-bold">{resultado.n_anomalias || 0}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-red-200">Taxa de Anomalias</div>
            <div className="text-2xl font-bold">{(resultado.taxa_anomalias * 100).toFixed(1)}%</div>
          </div>
          {resultado.threshold && (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs text-red-200">Threshold</div>
              <div className="text-2xl font-bold">{resultado.threshold.toFixed(3)}</div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Cabeçalho */}
      <div className={`bg-gradient-to-r ${cor} p-6 rounded-2xl text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              {getIcone(categoria)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold">{nome}</h2>
                <Badge variant={badge} className="bg-white/20 text-white border-0">
                  {categoria.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm opacity-90">{descricao}</p>
              <p className="text-xs opacity-75 mt-1">
                <span className="font-semibold">Algoritmo:</span> {algoritmo}
              </p>
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

        {/* Métricas específicas da categoria */}
        {renderMetricasPrincipais()}
      </div>

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
              <Card className="bg-gradient-to-r from-gray-50 to-white border-l-4 border-l-blue-500">
                <div className="p-5">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    Sobre esta análise
                  </h3>
                  <p className="text-gray-700">{descricao}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="primary">Algoritmo: {algoritmo}</Badge>
                    <Badge variant="info">{categoria}</Badge>
                  </div>
                </div>
              </Card>
              
              {/* Cards de métricas resumidas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Algoritmo</div>
                  <div className="text-lg font-bold">{algoritmo}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Variáveis</div>
                  <div className="text-lg font-bold">{parametros.variaveis?.length || 0}</div>
                </div>
                {resultado.clusters && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Clusters</div>
                    <div className="text-lg font-bold">{resultado.clusters.length}</div>
                  </div>
                )}
                {resultado.metricas?.teste?.acuracia && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Acurácia</div>
                    <div className="text-lg font-bold">{(resultado.metricas.teste.acuracia * 100).toFixed(1)}%</div>
                  </div>
                )}
                {resultado.n_anomalias !== undefined && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Anomalias</div>
                    <div className="text-lg font-bold">{resultado.n_anomalias}</div>
                  </div>
                )}
                {resultado.regras && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Regras</div>
                    <div className="text-lg font-bold">{resultado.regras.length}</div>
                  </div>
                )}
              </div>

              {/* Exemplos de resultados */}
              {categoria === 'clustering' && resultado.clusters && (
                <Card>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-800 mb-3">Distribuição dos Clusters</h3>
                    <div className="space-y-2">
                      {resultado.clusters.map((cluster, idx) => {
                        const total = resultado.clusters.reduce((acc, c) => acc + c.tamanho, 0);
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-24 text-sm">Cluster {idx + 1}:</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${(cluster.tamanho / total) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-mono w-16">
                                  {cluster.tamanho} ({((cluster.tamanho / total) * 100).toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Aba Interpretação */}
          {abaAtiva === 'interpretacao' && (
            <div className="space-y-4">
              {interpretacoes.map((item, idx) => (
                <Card key={idx} className="border-l-4 border-l-blue-500">
                  <div className="p-5">
                    <h3 className="font-bold text-gray-800 mb-2">{item.titulo}</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{item.texto}</p>
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
                    <h3 className="font-bold text-gray-800 text-lg mb-1">Modelo Otimizado</h3>
                    <p className="text-gray-600">
                      Não foram identificadas oportunidades de melhoria. O modelo atual parece adequado para o algoritmo {algoritmo}.
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
                  <CardTitle>Parâmetros da Execução</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-4">
                    {Object.entries(parametros).map(([key, value]) => {
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

              {/* Métricas detalhadas */}
              {resultado.metricas && Object.keys(resultado.metricas).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Métricas do Modelo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-2 gap-4">
                      {Object.entries(resultado.metricas).map(([key, value]) => {
                        if (typeof value === 'object') return null;
                        return (
                          <div key={key} className="flex justify-between border-b pb-2">
                            <dt className="text-sm text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</dt>
                            <dd className="text-sm font-mono font-medium">
                              {typeof value === 'number' ? 
                                (key.includes('taxa') || key.includes('acuracia') || key.includes('silhueta') ? 
                                  (value * 100).toFixed(2) + '%' : 
                                  value.toFixed(4)) : 
                                String(value)}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </CardContent>
                </Card>
              )}

              {/* Informações adicionais */}
              {resultado.clusters && (
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes dos Clusters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-2 text-left">Cluster</th>
                            <th className="px-4 py-2 text-right">Tamanho</th>
                            <th className="px-4 py-2 text-right">Percentual</th>
                            {resultado.clusters[0]?.inercia !== undefined && (
                              <th className="px-4 py-2 text-right">Inércia</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {resultado.clusters.map((cluster, idx) => {
                            const total = resultado.clusters.reduce((acc, c) => acc + c.tamanho, 0);
                            return (
                              <tr key={idx} className="border-t">
                                <td className="px-4 py-2 font-medium">Cluster {idx + 1}</td>
                                <td className="px-4 py-2 text-right font-mono">{cluster.tamanho}</td>
                                <td className="px-4 py-2 text-right font-mono">
                                  {((cluster.tamanho / total) * 100).toFixed(1)}%
                                </td>
                                {cluster.inercia !== undefined && (
                                  <td className="px-4 py-2 text-right font-mono">
                                    {cluster.inercia.toFixed(2)}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
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
          {categoria.toUpperCase()} • {algoritmo}
        </Badge>
      </div>
    </motion.div>
  );
}