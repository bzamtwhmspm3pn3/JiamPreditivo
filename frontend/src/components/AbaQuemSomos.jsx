import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  // Ícones principais
  BarChart3, LineChart, PieChart, ScatterChart,
  TrendingUp, TrendingDown, Activity, Target, Layers,
  GitBranch, Network, Shield, Zap, Cpu, Database,
  FileText, Monitor, Star, Clock, Calendar,
  AlertTriangle, CheckCircle, Info, HelpCircle,
  Globe, BookOpen, Code, Award, Users,
  DollarSign, Percent, CircleDollarSign, Landmark, Wallet,
  FlaskConical, Microscope, Atom, Dna, Calculator,
  Scale, Ruler, Weight, Thermometer, Gauge,
  TrendingUpDown, Layers as LayersIcon,
  FolderOpen, FolderTree, ChevronDown, ChevronUp,
  Bot, Brain, Sparkles, Rocket, Server, Cloud,
  HardDrive, Binary, Bug, BugOff, Building,
  ChartColumn, ChartLine, ChartArea, ChartPie,
  Copy, Check, ExternalLink
} from "lucide-react";

// ============================================
// CORES
// ============================================
const COLORS = {
  primaryBg: "bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800",
  text: "text-gray-700 dark:text-gray-300"
};

// ============================================
// DADOS DO SISTEMA (BASEADO NOS COMPONENTES REAIS)
// ============================================

const SISTEMA = {
  nome: "JIAM Predictivo",
  nomeCompleto: "Jerónimo Inocêncio Alberto Martins Predictivo",
  significado: "JIAM = Jerónimo Inocêncio Alberto Martins (homenagem ao filho do criador)",
  versao: "2.0.0",
  anoCriacao: 2025,
  anoAtual: new Date().getFullYear(),
  
  descricao: `Framework de previsão para modelagem preditiva, análise de séries temporais, 
  modelos atuariais e previsão macroeconômica utilizando dados angolanos. 
  Integra métodos estatísticos, algoritmos de Machine Learning e análises avançadas 
  para auxiliar na tomada de decisões fundamentadas.`,
  
  premios: [
    {
      nome: "Prêmio Nacional de Ciência e Inovação 2025",
      categoria: "Jovem Inventor",
      concedidoPor: "FUNDECIT e MESCTI"
    }
  ],
  
  modulos: [
    {
      id: "modelagem",
      nome: "📊 Modelagem e Predições",
      icone: BarChart3,
      cor: "#3B82F6",
      descricao: "Módulo principal para análise de dados e predições",
      submodulos: [
        { nome: "Dados", descricao: "Upload e processamento de datasets em múltiplos formatos (CSV, Excel, JSON)" },
        { nome: "Previsões", descricao: "Modelos estatísticos e Machine Learning" },
        { nome: "Actuariado e Seguros", descricao: "Modelos atuariais completos" }
      ]
    },
    {
      id: "previsoes",
      nome: "📈 Previsões",
      icone: TrendingUp,
      cor: "#10B981",
      descricao: "Modelos de regressão, séries temporais e machine learning",
      submodulos: [
        { 
          nome: "Regressão Linear", 
          descricao: "Simples: Y = β₀ + β₁X | Múltipla: Y = β₀ + β₁X₁ + β₂X₂ + ...",
          metricas: ["R²", "R² Ajustado", "p-valor", "F-statistic", "RMSE", "MAE", "VIF", "DW"]
        },
        { 
          nome: "Regressão Logística", 
          descricao: "P = 1/(1 + e⁻ᶻ) para classificação binária",
          metricas: ["AUC", "Acurácia", "Precisão", "Recall", "F1", "Log Loss"]
        },
        { 
          nome: "ARIMA/SARIMA", 
          descricao: "Auto-Regressivo Integrado de Médias Móveis",
          metricas: ["AIC", "BIC", "MAPE", "RMSE", "Ljung-Box"]
        },
        { 
          nome: "ETS", 
          descricao: "Suavização Exponencial (Erro, Tendência, Sazonalidade)",
          metricas: ["AIC", "BIC", "σ²"]
        },
        { 
          nome: "Prophet", 
          descricao: "Modelo do Facebook para séries temporais",
          metricas: ["MAPE", "RMSE", "Cobertura do intervalo"]
        },
        { 
          nome: "Random Forest", 
          descricao: "Floresta aleatória de árvores de decisão",
          metricas: ["OOB error", "Feature Importance", "Acurácia"]
        },
        { 
          nome: "XGBoost", 
          descricao: "Gradient boosting otimizado",
          metricas: ["Log Loss", "AUC", "Feature Importance"]
        }
      ]
    },
    {
      id: "atuarial",
      nome: "🛡️ Actuariado e Seguros",
      icone: Shield,
      cor: "#EF4444",
      descricao: "Modelos especializados para seguros e análises atuariais",
      submodulos: [
        { 
          nome: "Ajuste de Modelos GLM", 
          descricao: "Modelos Lineares Generalizados para frequência e severidade",
          metricas: ["AIC", "BIC", "Deviance", "pseudoR²"]
        },
        { 
          nome: "Tarificação A Posteriori", 
          descricao: "Credibilidade de Bühlmann-Straub",
          metricas: ["Fator de Credibilidade", "Prêmio Puro", "Prêmio Comercial"]
        },
        { 
          nome: "Simulação Monte Carlo", 
          descricao: "Análise de risco e incerteza",
          metricas: ["VaR", "TVaR", "Probabilidade de Ruína"]
        },
        { 
          nome: "Cadeias de Markov", 
          descricao: "Transição de estados",
          metricas: ["Matriz de Transição", "Distribuição Estacionária"]
        },
        { 
          nome: "Seguros de Vida", 
          descricao: "Tábuas de mortalidade",
          metricas: ["qx", "lx", "ex", "dx"]
        }
      ]
    },
    {
      id: "datamining",
      nome: "⛏️ Data Mining",
      icone: GitBranch,
      cor: "#8B5CF6",
      descricao: "Mineração de dados para descoberta de padrões",
      submodulos: [
        { 
          nome: "Clustering", 
          descricao: "K-Means, DBSCAN, Hierárquico, GMM",
          metricas: ["Silhueta", "Inércia", "Davies-Bouldin", "Calinski-Harabasz"]
        },
        { 
          nome: "Associação", 
          descricao: "Apriori, FP-Growth, Eclat",
          metricas: ["Suporte", "Confiança", "Lift"]
        },
        { 
          nome: "Classificação", 
          descricao: "Decision Tree, SVM, Naive Bayes, KNN",
          metricas: ["Acurácia", "Precisão", "Recall", "F1"]
        },
        { 
          nome: "Redução Dimensional", 
          descricao: "PCA, t-SNE, UMAP",
          metricas: ["Variância Explicada", "Perplexidade"]
        },
        { 
          nome: "Anomalias", 
          descricao: "Isolation Forest, LOF, One-Class SVM",
          metricas: ["Taxa de Anomalias", "Threshold"]
        }
      ]
    },
    {
      id: "bigdata",
      nome: "💾 Big Data",
      icone: Database,
      cor: "#F59E0B",
      descricao: "Processamento distribuído em larga escala",
      submodulos: [
        { 
          nome: "Spark Jobs", 
          descricao: "ETL, Análise Exploratória, Agregação, ML",
          metricas: ["Tempo de Execução", "Shuffle", "Partições"]
        },
        { 
          nome: "Hadoop MapReduce", 
          descricao: "WordCount, Agregação, Filtro, Join",
          metricas: ["Map Tasks", "Reduce Tasks", "Bytes Processados"]
        },
        { 
          nome: "Streaming", 
          descricao: "Window Count, Média Móvel, Tendências, Anomalias",
          metricas: ["Latência Média", "Taxa de Processamento", "Eventos/segundo"]
        },
        { 
          nome: "SQL Distribuído", 
          descricao: "Spark SQL, Hive, Presto/Trino",
          metricas: ["Tempo de Execução", "Bytes Scaneados"]
        }
      ]
    },
    {
      id: "relatorios",
      nome: "📋 Relatórios",
      icone: FileText,
      cor: "#EC4899",
      descricao: "Análise de modelos com Inteligência Artificial",
      submodulos: [
        { 
          nome: "Dashboard Inteligente", 
          descricao: "Visão geral com estatísticas, cards de performance e gráficos interativos"
        },
        { 
          nome: "Análise de Modelos com IA", 
          descricao: "Classificação automática (EXCELENTE a FRACA), detecção de anomalias, alertas de fraude"
        },
        { 
          nome: "Chatbot Especialista", 
          descricao: "Consultas sobre modelos, filtros inteligentes, explicações de métricas"
        },
        { 
          nome: "Relatórios Detalhados", 
          descricao: "Por tipo de modelo: Regressão, Séries Temporais, ML, Actuarial"
        }
      ]
    }
  ],
  
  metricas: {
    regressao: ["R²", "R² Ajustado", "p-valor", "F-statistic", "RMSE", "MAE", "VIF", "DW"],
    classificacao: ["Acurácia", "Precisão", "Recall", "F1-Score", "AUC", "Log Loss", "Matriz de Confusão"],
    seriesTemporais: ["AIC", "BIC", "MAPE", "Ljung-Box", "Força Sazonal"],
    clustering: ["Silhueta", "Inércia", "Davies-Bouldin", "Calinski-Harabasz"],
    associacao: ["Suporte", "Confiança", "Lift"],
    bigData: ["Tempo de Execução", "Shuffle", "Latência", "Taxa de Processamento"],
    atuarial: ["VaR", "TVaR", "Probabilidade de Ruína", "Fator de Credibilidade", "qx", "ex", "lx", "dx"]
  },
  
  tecnologias: [
    { nome: "React", icone: "⚛️", descricao: "Interface de usuário" },
    { nome: "Node.js", icone: "🟢", descricao: "Backend" },
    { nome: "R", icone: "📊", descricao: "Motor estatístico" },
    { nome: "Python", icone: "🐍", descricao: "Machine Learning" },
    { nome: "DeepSeek AI", icone: "🧠", descricao: "IA avançada" },
    { nome: "OpenAI ChatGPT", icone: "🤖", descricao: "Processamento de linguagem" }
  ],
  
  fontesDados: [
    { nome: "INE Angola", descricao: "Instituto Nacional de Estatística de Angola" },
    { nome: "BNA", descricao: "Banco Nacional de Angola" },
    { nome: "Economics Trading", descricao: "Dados econômicos internacionais" },
    { nome: "FMI", descricao: "Fundo Monetário Internacional" }
  ],
  
  contextoAngola: {
    destaque: "Modelos calibrados especificamente para dados angolanos",
    indicadores: ["PIB Angola", "Inflação (IPC)", "Taxa de câmbio Kwanza/USD", "Reservas internacionais", "Preço do petróleo"],
    particularidades: [
      "Dualidade cambial (oficial vs paralelo)",
      "Volatilidade da inflação (15-30% ao ano)",
      "Sazonalidade ligada a datas de pagamento",
      "Impacto dos subsídios aos combustíveis"
    ]
  }
};

// ============================================
// COMPONENTES AUXILIARES
// ============================================

const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`p-6 border-b border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3 className={`text-lg font-semibold text-gray-800 dark:text-gray-200 ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = "default", className = "" }) => {
  const variants = {
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    primary: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    danger: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    purple: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    pink: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

const PanelHeader = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-4 mb-8">
    {Icon && (
      <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl shadow-lg">
        <Icon className="h-8 w-8 text-white" />
      </div>
    )}
    <div>
      <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
        {title}
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mt-2">{description}</p>
    </div>
  </div>
);

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function AbaSobre() {
  const [moduloExpandido, setModuloExpandido] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState("visao-geral");
  const [copiado, setCopiado] = useState(null);

  const toggleModulo = (id) => {
    setModuloExpandido(moduloExpandido === id ? null : id);
  };

  const copiarTexto = (texto) => {
    navigator.clipboard.writeText(texto);
    setCopiado(texto);
    setTimeout(() => setCopiado(null), 2000);
  };

  // Visão Geral
  const renderVisaoGeral = () => (
    <div className="space-y-8">
      {/* Cards de destaque */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
                <Award className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Prêmio</p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-200">2025</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              {SISTEMA.premios[0].nome}<br />
              {SISTEMA.premios[0].categoria}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-xl">
                <LayersIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Módulos</p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{SISTEMA.modulos.length}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              {SISTEMA.modulos.map(m => m.nome.split(' ')[1]).join(' • ')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-xl">
                <Database className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Fontes</p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{SISTEMA.fontesDados.length}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              {SISTEMA.fontesDados.map(f => f.nome).join(' • ')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-xl">
                <Rocket className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Versão</p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{SISTEMA.versao}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Lançamento: {SISTEMA.anoCriacao}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Descrição */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">📋 Sobre o Sistema</h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {SISTEMA.descricao}
          </p>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <span className="font-bold">Significado do nome:</span> {SISTEMA.significado}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Módulos em destaque */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SISTEMA.modulos.slice(0, 4).map((modulo) => {
          const Icon = modulo.icone;
          return (
            <Card key={modulo.id}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${modulo.cor}20` }}>
                    <Icon className="h-6 w-6" style={{ color: modulo.cor }} />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200">{modulo.nome}</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{modulo.descricao}</p>
                <div className="flex flex-wrap gap-2">
                  {modulo.submodulos.slice(0, 3).map((sub, idx) => (
                    <Badge key={idx} variant="primary" className="text-xs">
                      {sub.nome}
                    </Badge>
                  ))}
                  {modulo.submodulos.length > 3 && (
                    <Badge variant="default">+{modulo.submodulos.length - 3}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // Módulos detalhados
  const renderModulos = () => (
    <div className="space-y-4">
      {SISTEMA.modulos.map((modulo) => {
        const Icon = modulo.icone;
        const expandido = moduloExpandido === modulo.id;
        
        return (
          <Card key={modulo.id}>
            <div
              className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              onClick={() => toggleModulo(modulo.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: `${modulo.cor}20` }}>
                    <Icon className="h-6 w-6" style={{ color: modulo.cor }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">{modulo.nome}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{modulo.descricao}</p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  {expandido ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {expandido && (
              <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  {modulo.submodulos.map((sub, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">{sub.nome}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{sub.descricao}</p>
                      {sub.metricas && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Métricas:</p>
                          <div className="flex flex-wrap gap-1">
                            {sub.metricas.map((met, i) => (
                              <Badge key={i} variant="outline" className="text-xs bg-white dark:bg-gray-800">
                                {met}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );

  // Tecnologias
  const renderTecnologias = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">⚙️ Stack Tecnológica</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {SISTEMA.tecnologias.map((tech, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                <span className="text-3xl mb-2 block">{tech.icone}</span>
                <p className="font-medium text-gray-800 dark:text-gray-200">{tech.nome}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{tech.descricao}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">📊 Fontes de Dados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SISTEMA.fontesDados.map((fonte, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Database className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{fonte.nome}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{fonte.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">🇦🇴 Contexto Angolano</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{SISTEMA.contextoAngola.destaque}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Indicadores analisados:</h4>
              <ul className="space-y-2">
                {SISTEMA.contextoAngola.indicadores.map((ind, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    {ind}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Particularidades:</h4>
              <ul className="space-y-2">
                {SISTEMA.contextoAngola.particularidades.map((part, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    {part}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Métricas
  const renderMetricas = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Regressão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Regressão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SISTEMA.metricas.regressao.map((met, idx) => (
                <Badge key={idx} variant="primary">{met}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Classificação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Classificação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SISTEMA.metricas.classificacao.map((met, idx) => (
                <Badge key={idx} variant="success">{met}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Séries Temporais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Séries Temporais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SISTEMA.metricas.seriesTemporais.map((met, idx) => (
                <Badge key={idx} variant="purple">{met}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Clustering */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-yellow-600" />
              Clustering
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SISTEMA.metricas.clustering.map((met, idx) => (
                <Badge key={idx} variant="warning">{met}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Associação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-pink-600" />
              Associação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SISTEMA.metricas.associacao.map((met, idx) => (
                <Badge key={idx} variant="pink">{met}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Big Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-orange-600" />
              Big Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SISTEMA.metricas.bigData.map((met, idx) => (
                <Badge key={idx} variant="warning">{met}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Atuarial */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Atuarial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SISTEMA.metricas.atuarial.map((met, idx) => (
                <Badge key={idx} variant="danger">{met}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <main className={`p-8 md:p-12 h-full overflow-y-auto ${COLORS.primaryBg}`}>
      <PanelHeader
        icon={Users}
        title="Sobre o JIAM Predictivo"
        description="Conheça o sistema premiado de previsão e análise de dados"
      />

      {/* Abas de navegação */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8 overflow-x-auto pb-2">
        <button
          onClick={() => setAbaAtiva("visao-geral")}
          className={`px-6 py-3 font-medium text-sm transition-all whitespace-nowrap ${
            abaAtiva === "visao-geral"
              ? "border-b-2 border-blue-600 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20"
              : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          }`}
        >
          🏠 Visão Geral
        </button>
        <button
          onClick={() => setAbaAtiva("modulos")}
          className={`px-6 py-3 font-medium text-sm transition-all whitespace-nowrap ${
            abaAtiva === "modulos"
              ? "border-b-2 border-blue-600 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20"
              : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          }`}
        >
          📦 Módulos
        </button>
        <button
          onClick={() => setAbaAtiva("tecnologias")}
          className={`px-6 py-3 font-medium text-sm transition-all whitespace-nowrap ${
            abaAtiva === "tecnologias"
              ? "border-b-2 border-blue-600 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20"
              : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          }`}
        >
          ⚙️ Tecnologias
        </button>
        <button
          onClick={() => setAbaAtiva("metricas")}
          className={`px-6 py-3 font-medium text-sm transition-all whitespace-nowrap ${
            abaAtiva === "metricas"
              ? "border-b-2 border-blue-600 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20"
              : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          }`}
        >
          📊 Métricas
        </button>
      </div>

      {/* Conteúdo das abas */}
      <div className="mt-6">
        {abaAtiva === "visao-geral" && renderVisaoGeral()}
        {abaAtiva === "modulos" && renderModulos()}
        {abaAtiva === "tecnologias" && renderTecnologias()}
        {abaAtiva === "metricas" && renderMetricas()}
      </div>

      {/* Rodapé com informações de versão */}
      <div className="mt-12 p-6 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-2xl shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold mb-2">📝 JIAM Predictivo</h3>
            <p className="text-sm opacity-90">
              {SISTEMA.nomeCompleto}<br />
              <span className="text-xs opacity-75">{SISTEMA.significado}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">Versão {SISTEMA.versao}</p>
            <p className="text-xs opacity-75">© {SISTEMA.anoCriacao}-{SISTEMA.anoAtual}</p>
            <p className="text-xs opacity-75 mt-1">Todos os direitos reservados</p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-white/20 text-white border-white/30">
            🏆 {SISTEMA.premios[0].nome}
          </Badge>
          <Badge variant="outline" className="bg-white/20 text-white border-white/30">
            {SISTEMA.modulos.length} Módulos
          </Badge>
          <Badge variant="outline" className="bg-white/20 text-white border-white/30">
            {SISTEMA.fontesDados.length} Fontes de Dados
          </Badge>
        </div>
      </div>
    </main>
  );
}