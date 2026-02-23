import { useState, useRef, useEffect } from "react";
import { 
  // Ícones principais
  X, Send, Database, Cpu, ChevronDown, ChevronUp, Loader2, 
  Brain, Sparkles, Globe, BookOpen, Bot, Code, Zap, Shield,
  TrendingUp, Activity, Target, Layers, GitBranch, Network,
  AlertTriangle, CheckCircle, Info, HelpCircle, Search,
  ExternalLink, Copy, Check, ThumbsUp, ThumbsDown, Star,
  Clock, Calendar, Filter, Settings, Download, Upload,
  FileText, BarChart3, PieChart, LineChart, ScatterChart,
  Phone, Wifi, WifiOff, AlertOctagon, 
  
  // Ícones do autor
  User, Github, Linkedin, Mail, MapPin, Award, Heart, 
  Coffee, Book, GraduationCap, Briefcase, Camera, Video,
  
  // Redes sociais
  Youtube, Twitter, Facebook, Instagram,
  
  // Tecnologia
  Chrome, Terminal, Command, Server, Cloud, HardDrive,
  Network as NetworkIcon, Cpu as CpuIcon,
  
  // Gráficos
  BarChart, PieChart as PieChartIcon, LineChart as LineChartIcon,
  ScatterChart as ScatterChartIcon, Table, Grid, Columns,
  Rows, Maximize2, Minimize2, ZoomIn, ZoomOut, Move,
  RotateCw, RotateCcw, Copy as CopyIcon, Share2, Printer,
  Bookmark, BookmarkCheck, ThumbsUp as ThumbsUpIcon,
  ThumbsDown as ThumbsDownIcon, MessageCircle, Mic, MicOff,
  Volume2, VolumeX, Moon, Sun, Sliders, List, Grid as GridIcon,
  Layout, FolderOpen, FolderTree, FolderPlus, FolderMinus,
  Folders, Archive, ArchiveRestore, ArchiveX, Binary, Bug,
  BugOff, Building, Building2, CandlestickChart, ChartCandlestick,
  ChartColumn, ChartColumnIncreasing, ChartColumnDecreasing,
  ChartLine, ChartNetwork, ChartNoAxesColumn, ChartPie,
  ChartSpline, ChartScatter, ChartBarStacked, ChartBarBig,
  
  // Finanças
  CircleDollarSign, Coins, CreditCard, DollarSign, Euro,
  Landmark, Percent, PiggyBank, Wallet, Banknote,
  BanknoteArrowDown, BanknoteArrowUp, BanknoteX, TrendingUpDown,
  
  // Gráficos adicionais
  ChartColumnBig, ChartBar, ChartLine as ChartLineIcon,
  ChartArea, ChartBubble, ChartDonut, ChartDonut3, ChartDonut4,
  ChartFunnel, ChartGantt, ChartHeatmap, ChartHistogram,
  ChartNetwork as ChartNetworkIcon,
  ChartNoAxesColumnIncreasing, ChartNoAxesColumnDecreasing,
  ChartPie as ChartPieIcon, ChartRadar, ChartSankey,
  ChartScatter as ChartScatterIcon, ChartWaterfall,
  
  // IA e comunicação
  Bot as BotIcon, MessageSquare, Loader, Trash2,
  AlertOctagon as AlertOctagonIcon, Flag, Thermometer, Gauge,
  Scale, Ruler, Weight, Zap as ZapIcon, Wind, Droplet, Flame,
  Snowflake, Cloud as CloudIcon, Umbrella, Sun as SunIcon,
  Moon as MoonIcon, CloudRain, CloudSnow, CloudLightning, Cloudy,
  Tornado, Hurricane, Earthquake, Volcano, Mountain, TreePine,
  
  // Natureza
  Flower, Leaf, Sprout, Wheat, Apple, Citrus, Coffee as CoffeeIcon,
  Droplets, Waves, Anchor, Ship, Train, Bus, Car, Bike, Footprints,
  Plane, Rocket, Satellite, Space, Globe2, Compass, Map as MapIcon,
  Navigation, Locate, LocateFixed, LocateOff, Crosshair, Aim,
  Bullseye, Circle, CircleDot, CircleDashed, CircleDotDashed,
  Square, SquareStack, Triangle, Hexagon, Octagon, Pentagon,
  Diamond, Gem, Crystal, GlassWater, Wine, Beer,
  Pizza, Sandwich, Hamburger, Cake, Candy, Cookie, IceCream,
  Croissant, Bagel, Egg, Milk, Cheese, Fish, Shellfish, Beef,
  Chicken, PawPrint, Bone, Dog, Cat, Rabbit, Turtle, Bird,
  Fish as FishIcon, Bug as BugIcon, Bee, Butterfly, Spider,
  Scorpion, Dragonfly, Feather, Egg as EggIcon, Nest, Tree,
  Mushroom, Mountain as MountainIcon, Campfire, Tent,
  Compass as CompassIcon, Map as MapIcon2,
  Binoculars, Telescope, Microscope, Flask, Beaker, TestTube,
  Dna, Atom, Radiation, Biohazard, Nuclear, Magnet, Puzzle,
  Blocks, BrickWall, Hammer, Wrench, Screwdriver, Saw, Drill,
  Tool, Pickaxe, Shovel, Axe, Sword, Shield as ShieldIcon,
  Helmet, Armor, Crown, Medal, Ribbon, Trophy, Cup,
  
  // Ciência
  FlaskConical, FlaskRound, Erlenmeyer, Pipette, Syringe,
  Stethoscope, Pill, Tablet, Capsule, Bandage, FirstAid,
  Heart as HeartIcon, HeartPulse, HeartCrack, HeartOff,
  Activity as ActivityIcon, Pulse, Thermometer as ThermometerIcon,
  Droplet as DropletIcon, Wind as WindIcon, Fan, AirVent,
  
  // Eletrodomésticos
  WashingMachine, Refrigerator, Oven, Microwave, Toaster,
  Blender, Scale as ScaleIcon, Weight as WeightIcon,
  Ruler as RulerIcon, Tape,
  
  // Formas geométricas (evitando duplicatas)
  Square as SquareIcon, Circle as CircleIcon,
  Triangle as TriangleIcon, Hexagon as HexagonIcon,
  Octagon as OctagonIcon, Pentagon as PentagonIcon,
  Diamond as DiamondIcon, Gem as GemIcon, Crystal as CrystalIcon,
  GlassWater as GlassWaterIcon, Wine as WineIcon, Beer as BeerIcon,
  
  // Comida
  Pizza as PizzaIcon, Sandwich as SandwichIcon,
  Hamburger as HamburgerIcon, Cake as CakeIcon,
  Candy as CandyIcon, Cookie as CookieIcon,
  IceCream as IceCreamIcon, Croissant as CroissantIcon,
  Egg as EggIcon2, Milk as MilkIcon, Cheese as CheeseIcon,
  Fish as FishIcon2, Shellfish as ShellfishIcon,
  Beef as BeefIcon, Chicken as ChickenIcon,
  
  // Animais
  PawPrint as PawPrintIcon, Bone as BoneIcon,
  Dog as DogIcon, Cat as CatIcon, Rabbit as RabbitIcon,
  Turtle as TurtleIcon, Bird as BirdIcon,
  Fish as FishIcon3, Bug as BugIcon2,
  Bee as BeeIcon, Butterfly as ButterflyIcon,
  Spider as SpiderIcon, Scorpion as ScorpionIcon,
  Dragonfly as DragonflyIcon, Feather as FeatherIcon,
  Egg as EggIcon3, Nest as NestIcon, Tree as TreeIcon,
  Mushroom as MushroomIcon, Mountain as MountainIcon2,
  Campfire as CampfireIcon, Tent as TentIcon,
  Compass as CompassIcon2, Map as MapIcon3,
  Binoculars as BinocularsIcon, Telescope as TelescopeIcon,
  Microscope as MicroscopeIcon, Flask as FlaskIcon,
  Beaker as BeakerIcon, TestTube as TestTubeIcon, Dna as DnaIcon,
  Atom as AtomIcon, Radiation as RadiationIcon,
  Biohazard as BiohazardIcon, Nuclear as NuclearIcon,
  Magnet as MagnetIcon, Puzzle as PuzzleIcon, Blocks as BlocksIcon,
  BrickWall as BrickWallIcon, Hammer as HammerIcon,
  Wrench as WrenchIcon, Screwdriver as ScrewdriverIcon,
  Saw as SawIcon, Drill as DrillIcon, Tool as ToolIcon,
  Pickaxe as PickaxeIcon, Shovel as ShovelIcon, Axe as AxeIcon,
  Sword as SwordIcon, Shield as ShieldIcon2,
  Helmet as HelmetIcon, Armor as ArmorIcon, Crown as CrownIcon,
  Medal as MedalIcon, Ribbon as RibbonIcon, Trophy as TrophyIcon,
  Cup as CupIcon, FlaskConical as FlaskConicalIcon,
  FlaskRound as FlaskRoundIcon, Erlenmeyer as ErlenmeyerIcon,
  Pipette as PipetteIcon, Syringe as SyringeIcon,
  Stethoscope as StethoscopeIcon, Pill as PillIcon,
  Tablet as TabletIcon, Capsule as CapsuleIcon,
  Bandage as BandageIcon, FirstAid as FirstAidIcon,
  Heart as HeartIcon2, HeartPulse as HeartPulseIcon,
  HeartCrack as HeartCrackIcon, HeartOff as HeartOffIcon,
  Activity as ActivityIcon2, Pulse as PulseIcon,
  Thermometer as ThermometerIcon2, Droplet as DropletIcon2,
  Wind as WindIcon2, Fan as FanIcon, AirVent as AirVentIcon,
  WashingMachine as WashingMachineIcon,
  Refrigerator as RefrigeratorIcon, Oven as OvenIcon,
  Microwave as MicrowaveIcon, Toaster as ToasterIcon,
  Blender as BlenderIcon, Scale as ScaleIcon2,
  Weight as WeightIcon2, Ruler as RulerIcon2, Tape as TapeIcon
} from "lucide-react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

// ============================================
// CONFIGURAÇÕES DA IA
// ============================================

// 🔥 COMO OBTER UMA CHAVE GRATUITA DO DEEPSEEK:
// 1. Acesse: https://platform.deepseek.com/
// 2. Crie uma conta gratuita (não precisa de cartão de crédito)
// 3. Vá para "API Keys" no painel
// 4. Clique em "Create new API key"
// 5. Copie a chave gerada
// 6. Cole abaixo (substitua pela sua chave real)

// ⚠️ IMPORTANTE: A chave abaixo é um exemplo. Substitua pela sua chave real!
const DEEPSEEK_API_KEY = "sk-1e277055fb1c4b3e913b09cff3a282a1";

const CONFIG = {
  usarDeepSeek: true, // true = tenta DeepSeek, false = só Wikipedia/Google
  modoDemonstracao: false, // true = respostas simuladas (sem API)
  modeloDeepSeek: "deepseek-chat",
  temperatura: 0.7,
  maxTokens: 1000,
  timeout: 30000,
  fallbackAutomatico: true // Se DeepSeek falhar, usa Wikipedia/Google
};

// ============================================
// BASE DE CONHECIMENTO DO SISTEMA JIAM
// ============================================

// Informações sobre o autor - CORRIGIDAS conforme solicitado
const INFORMACOES_AUTOR = {
  nome: "Venâncio Martins",
  nomeCompleto: "Venâncio Elavoco Cassova Martins",
  titulo: "Pesquisador em Economia & Cientista de Dados",
  localizacao: "Huambo, Angola",
  email: "venanciomartinse@gmail.com",
  telefone: "+244 928 565 837",
  linkedin: "https://www.linkedin.com/in/ven%C3%A2ncio-martins-337729263/",
  github: "https://github.com/bzamtwhmspm3pn3",
  orcid: "https://orcid.org/0009-0006-5893-7738",
  
  // Informações do prêmio e actuação atual
  premio: {
    nome: "Prêmio Nacional de Ciência e Inovação 2025",
    categoria: "Jovem Inventor",
    concedidoPor: "FUNDECIT e Ministério do Ensino Superior, Ciência, Tecnologia e Inovação (MESCTI)",
    projeto: "JIAM Predictivo - framework de previsão",
    ano: 2025
  },
  
  // Actuação profissional atualizada
  atuacao: {
    universidade: "Universidade José Eduardo dos Santos (UJES)",
    cargoUniversidade: "Pesquisador em Economia e Cientista de Dados",
    descricaoUniversidade: "Actuação aplicada em modelagem preditiva, análise de séries temporais e previsão macroeconômica utilizando dados angolanos",
    
    empresa: "Grupo Vinech-Formação",
    cargoEmpresa: "Responsável de Orçamento, Projetos, Contas a Receber e Suporte Técnico",
    departamentoEmpresa: "Diretoria Financeira",
    descricaoEmpresa: "Aplicação de análises quantitativas e métodos baseados em dados ao planejamento e à governança financeira"
  },
  
  // Fontes de dados
  fontesDados: [
    "INE Angola",
    "BNA (Banco Nacional de Angola)",
    "Economics Trading",
    "FMI"
  ],
  
  // Significado do JIAM
  significadoJIAM: "Jerónimo Inocêncio Alberto Martins",
  significadoJIAMCompleto: "JIAM significa Jeronomo Inocencio Alberto Martins, nome do meu filho.fonte de inspiração!",
  
  // Links fornecidos
  links: {
    jornalAngola: "https://www.jornaldeangola.ao/noticias/3/sociedade/651303/ven%C3%A2ncio-martins-vence-2.%C2%AA-edi%C3%A7%C3%A3o-do-pr%C3%A9mio-de-ci%C3%AAncia-e-inova%C3%A7%C3%A3o",
    github: "https://github.com/bzamtwhmspm3pn3",
    linkedin: "https://www.linkedin.com/in/ven%C3%A2ncio-martins-337729263/",
    orcid: "https://orcid.org/0009-0006-5893-7738"
  },
  
  // Especialidades (atualizadas)
  especialidades: [
    "Modelagem Preditiva",
    "Análise de Séries Temporais",
    "Previsão Macroeconômica",
    "Dados Angolanos (INE Angola, BNA)",
    "Análises Quantitativas",
    "Governança Financeira",
    "Ciência de Dados Aplicada à Economia"
  ],
  
  // Sobre o autor (texto fornecido)
  sobre: `Venâncio Elavoco Cassova Martins é pesquisador em economia e cientista de dados na Universidade José Eduardo dos Santos (UJES), com actuação aplicada em modelagem preditiva, análise de séries temporais e previsão macroeconômica utilizando dados angolanos.

É vencedor do Prêmio Nacional de Ciência e Inovação (2025), concedido pela FUNDECIT e pelo Ministério do Ensino Superior, Ciência, Tecnologia e Inovação (MESCTI), na categoria Jovem Inventor, pelo desenvolvimento do framework de previsão JIAM Predictivo.

Actualmente, ocupa o cargo de Responsável de Orçamento, Projetos e Contas a Receber na Direcção Financeira do Grupo Vinech-Formação, onde aplica análises quantitativas e métodos baseados em dados ao planejamento e à governança financeira.

JIAM significa Jerónimo Inocêncio Alberto Martins, nome do meu filho. Nunca esquecer isso!

Os dados de validação são dados do INE Angola e BNA, com fontes como Economics Trading e FMI.`,
  
  citacao: "JIAM significa Jerónimo Inocêncio Alberto Martins, nome do meu filho. fonte de inspiração! A tecnologia é a ponte que transforma dados em decisões inteligentes."
};

// Informações sobre o sistema (adicionando significado)
const INFORMACOES_SISTEMA = {
  nome: "JIAM Predictivo",
  nomeCompleto: "Jerónimo Inocêncio Alberto Martins Predictivo",
  significado: "(nome do filho do criador)",
  versao: "2.0.0",
  descricao: "Framework de previsão para modelagem preditiva, análise de séries temporais e previsão macroeconômica utilizando dados angolanos",
  tecnologias: ["React", "Node.js", "R", "Python", "DeepSeek AI", "Opnai ChatGPT AI"],
  modulos: ["Previsões Macroeconômicas", "Séries Temporais", "Modelagem Preditiva"],
  premio: "Prêmio Nacional de Ciência e Inovação 2025 - Categoria Jovem Inventor",
  anoCriacao: 2025,
  anoAtual: new Date().getFullYear(),
};

// Data Mining - TODOS OS ALGORITMOS
const DATA_MINING = {
  descricao: "Mineração de dados para descoberta de padrões",
  clustering: {
    nome: "Clustering",
    descricao: "Algoritmos de agrupamento não-supervisionado",
    algoritmos: [
      { id: "kmeans", nome: "K-Means", descricao: "Agrupamento particional", pacote: "stats" },
      { id: "dbscan", nome: "DBSCAN", descricao: "Agrupamento baseado em densidade", pacote: "dbscan" },
      { id: "hierarchical", nome: "Hierárquico", descricao: "Agrupamento hierárquico", pacote: "stats" },
      { id: "gmm", nome: "GMM", descricao: "Modelo de Misturas Gaussianas", pacote: "mclust" }
    ],
    metricas: ["silhueta", "inercia", "davies_bouldin", "calinski_harabasz"],
    interpretacao: "Silhueta > 0.5 indica boa separação entre clusters"
  },
  associacao: {
    nome: "Associação",
    descricao: "Regras de associação e padrões frequentes",
    algoritmos: [
      { id: "apriori", nome: "Apriori", descricao: "Regras de associação clássicas", pacote: "arules" },
      { id: "fp_growth", nome: "FP-Growth", descricao: "Pattern growth", pacote: "arules" },
      { id: "eclat", nome: "Eclat", descricao: "Mining de itemsets", pacote: "arules" }
    ],
    metricas: ["suporte", "confianca", "lift"],
    interpretacao: "Lift > 1 indica associação positiva"
  },
  classificacao: {
    nome: "Classificação",
    descricao: "Algoritmos supervisionados para predição de categorias",
    algoritmos: [
      { id: "decision_tree", nome: "Árvore de Decisão", descricao: "C4.5, CART", pacote: "rpart" },
      { id: "naive_bayes", nome: "Naive Bayes", descricao: "Classificador Bayesiano", pacote: "e1071" },
      { id: "knn", nome: "KNN", descricao: "K-vizinhos", pacote: "class" },
      { id: "svm", nome: "SVM", descricao: "Máquina de vetores de suporte", pacote: "e1071" },
      { id: "random_forest", nome: "Random Forest", descricao: "Floresta aleatória", pacote: "randomForest" }
    ],
    metricas: ["acuracia", "precisao", "recall", "f1"],
    interpretacao: "Acurácia > 0.8 é excelente"
  },
  reducao: {
    nome: "Redução Dimensional",
    descricao: "Redução de dimensionalidade para visualização",
    algoritmos: [
      { id: "pca", nome: "PCA", descricao: "Análise de componentes principais", pacote: "stats" },
      { id: "tsne", nome: "t-SNE", descricao: "Visualização de alta dimensão", pacote: "Rtsne" },
      { id: "umap", nome: "UMAP", descricao: "Redução não-linear", pacote: "umap" }
    ],
    metricas: ["variancia_explicada", "perplexidade"],
    interpretacao: "PCA com > 80% de variância explicada nos primeiros 2 componentes"
  },
  anomalias: {
    nome: "Anomalias",
    descricao: "Detecção de outliers e pontos anômalos",
    algoritmos: [
      { id: "isolation_forest", nome: "Isolation Forest", descricao: "Detecção baseada em isolamento", pacote: "isotree" },
      { id: "lof", nome: "LOF", descricao: "Fator de outlier local", pacote: "dbscan" },
      { id: "one_class_svm", nome: "One-Class SVM", descricao: "SVM para anomalias", pacote: "e1071" }
    ],
    metricas: ["taxa_anomalias", "threshold"],
    interpretacao: "Taxa de anomalias entre 1-5% é esperada"
  }
};

// Big Data - TODOS OS MOTORES
const BIG_DATA = {
  descricao: "Processamento distribuído em larga escala",
  spark: {
    nome: "Spark Jobs",
    descricao: "Processamento em memória com Apache Spark",
    tipos: [
      { id: "etl", nome: "ETL", descricao: "Extração, Transformação e Carga" },
      { id: "analise", nome: "Análise Exploratória", descricao: "Análise estatística descritiva" },
      { id: "agregacao", nome: "Agregação", descricao: "Operações de group by e sumarização" },
      { id: "ml", nome: "Machine Learning", descricao: "Modelos ML em larga escala" }
    ],
    metricas: ["tempo_execucao", "shuffle_read", "shuffle_write", "particoes"],
    interpretacao: "Shuffle alto pode indicar necessidade de reparticionamento"
  },
  hadoop: {
    nome: "Hadoop MapReduce",
    descricao: "Processamento batch em disco",
    operacoes: [
      { id: "wordcount", nome: "Word Count", descricao: "Contagem de palavras" },
      { id: "aggregate", nome: "Agregação", descricao: "Soma, média, min, max" },
      { id: "filter", nome: "Filtro", descricao: "Filtragem baseada em condições" },
      { id: "join", nome: "Join", descricao: "Junção de datasets" }
    ],
    metricas: ["map_tasks", "reduce_tasks", "bytes_processados"],
    interpretacao: "Mais mappers que reducers é comum"
  },
  streaming: {
    nome: "Streaming",
    descricao: "Processamento em tempo real",
    operacoes: [
      { id: "window_count", nome: "Window Count", descricao: "Contagem em janelas" },
      { id: "moving_avg", nome: "Média Móvel", descricao: "Suavização temporal" },
      { id: "trend_detection", nome: "Tendências", descricao: "Detecção de padrões" },
      { id: "anomaly_stream", nome: "Anomalias", descricao: "Outliers em streaming" }
    ],
    metricas: ["latencia_media", "taxa_processamento", "eventos_por_segundo"],
    interpretacao: "Latência < 100ms é excelente para streaming"
  },
  sql: {
    nome: "SQL Distribuído",
    descricao: "Consultas SQL em larga escala",
    engines: ["Spark SQL", "Hive", "Presto/Trino"],
    metricas: ["tempo_execucao", "bytes_scaneados", "particoes_processadas"],
    interpretacao: "Bytes scaneados altos podem indicar falta de particionamento"
  }
};

// Modelos Atuariais
const ATUARIAL = {
  descricao: "Modelos para seguros e análises atuariais",
  ajusteModelos: {
    nome: "Ajuste de Modelos GLM",
    descricao: "Modelos Lineares Generalizados para frequência e severidade",
    metricas: ["AIC", "BIC", "deviance", "pseudoR2"],
    interpretacao: "Menor AIC indica melhor ajuste"
  },
  tarificacao: {
    nome: "Tarificação A Posteriori",
    descricao: "Credibilidade e ajuste de prêmios",
    metricas: ["fator_credibilidade", "premio_puro", "premio_comercial"],
    interpretacao: "Fator de credibilidade entre 0.3-0.9"
  },
  monteCarlo: {
    nome: "Simulação Monte Carlo",
    descricao: "Análise de risco e incerteza",
    metricas: ["VaR", "TVaR", "prob_ruina"],
    interpretacao: "VaR 99% é o padrão regulatório"
  },
  markov: {
    nome: "Cadeias de Markov",
    descricao: "Transição de estados",
    metricas: ["matriz_transicao", "distribuicao_estacionaria"],
    interpretacao: "Cadeia ergódica converge para distribuição estacionária"
  },
  vida: {
    nome: "Seguros de Vida",
    descricao: "Tábuas de mortalidade",
    metricas: ["qx", "lx", "ex", "dx"],
    interpretacao: "e₀ é a expectativa de vida ao nascer"
  }
};

// Previsões (Modelos Preditivos) - COMPLETO
const PREVISOES = {
  regressao: {
    titulo: "Modelos de Regressão",
    descricao: "Modelos para predição de valores contínuos",
    linear_simples: {
      nome: "Regressão Linear Simples",
      formula: "Y = β₀ + β₁X + ε",
      metricas: ["R²", "R²_ajustado", "p-valor", "F-statistic", "RMSE", "MAE"],
      interpretacao: "R² > 0.7 indica bom ajuste. p-valor < 0.05 indica significância estatística.",
      exemplo: "Prever preço de imóveis baseado no tamanho"
    },
    linear_multipla: {
      nome: "Regressão Linear Múltipla",
      formula: "Y = β₀ + β₁X₁ + β₂X₂ + ... + βₖXₖ + ε",
      metricas: ["R²", "R²_ajustado", "VIF", "DW", "RMSE", "MAE"],
      interpretacao: "VIF > 10 indica multicolinearidade. DW próximo de 2 indica resíduos independentes.",
      exemplo: "Prever preço de imóveis baseado em tamanho, localização, número de quartos"
    },
    logistica_simples: {
      nome: "Regressão Logística Simples",
      formula: "P(Y=1) = 1/(1 + e^-(β₀ + β₁X))",
      metricas: ["AUC", "accuracy", "precision", "recall", "F1", "log_loss"],
      interpretacao: "AUC > 0.8 é excelente. AUC > 0.9 é excepcional.",
      exemplo: "Prever se um cliente vai comprar (sim/não) baseado na idade"
    },
    logistica_multipla: {
      nome: "Regressão Logística Múltipla",
      formula: "P(Y=1) = 1/(1 + e^-(β₀ + β₁X₁ + β₂X₂ + ...))",
      metricas: ["AUC", "accuracy", "precision", "recall", "F1", "log_loss", "confusion_matrix"],
      interpretacao: "Precisão e recall devem ser balanceados. F1 > 0.8 é excelente.",
      exemplo: "Prever churn de clientes baseado em idade, renda, histórico"
    }
  },
  series_temporais: {
    titulo: "Modelos de Séries Temporais",
    descricao: "Modelos para dados sequenciais no tempo",
    arima: {
      nome: "ARIMA",
      descricao: "Auto-Regressivo Integrado de Médias Móveis",
      parametros: ["p (AR)", "d (diferenciação)", "q (MA)"],
      metricas: ["AIC", "BIC", "Ljung-Box", "RMSE", "MAE", "MAPE"],
      interpretacao: "p-valor do Ljung-Box > 0.05 indica resíduos independentes. Menor AIC é melhor.",
      exemplo: "Previsão de vendas mensais, preços de ações"
    },
    sarima: {
      nome: "SARIMA",
      descricao: "ARIMA Sazonal",
      parametros: ["p,d,q + P,D,Q,s (sazonal)"],
      metricas: ["AIC", "BIC", "seasonal_strength", "RMSE", "MAE", "MAPE"],
      interpretacao: "Força sazonal > 0.5 indica sazonalidade significativa.",
      exemplo: "Previsão de vendas com sazonalidade anual, tráfego diário"
    },
    ets: {
      nome: "ETS",
      descricao: "Suavização Exponencial",
      componentes: ["Erro", "Tendência", "Sazonalidade"],
      metricas: ["AIC", "BIC", "sigma²", "RMSE", "MAE", "MAPE"],
      interpretacao: "Modelo com menor AIC é preferível. Sigma² pequeno indica bom ajuste.",
      exemplo: "Previsão de demanda, séries com tendência clara"
    },
    prophet: {
      nome: "Prophet",
      descricao: "Modelo do Facebook para séries temporais",
      componentes: ["tendência", "sazonalidade", "feriados"],
      metricas: ["MAPE", "RMSE", "MAE", "cobertura_intervalo"],
      interpretacao: "MAPE < 10% é excelente. MAPE < 20% é bom.",
      exemplo: "Previsão de tráfego web, vendas com feriados"
    }
  },
  machine_learning: {
    titulo: "Machine Learning",
    descricao: "Algoritmos avançados de aprendizado",
    random_forest: {
      nome: "Random Forest",
      descricao: "Floresta aleatória de árvores de decisão",
      parametros: ["n_estimators", "max_depth", "min_samples_split"],
      metricas: ["OOB_error", "feature_importance", "accuracy", "precision", "recall", "F1"],
      interpretacao: "OOB error < 20% indica boa generalização. Feature importance soma 1.",
      exemplo: "Classificação de clientes, predição de risco de crédito"
    },
    xgboost: {
      nome: "XGBoost",
      descricao: "Gradient Boosting otimizado",
      parametros: ["learning_rate", "n_estimators", "max_depth", "subsample"],
      metricas: ["log_loss", "auc", "feature_importance", "accuracy"],
      interpretacao: "Log_loss menor é melhor. AUC > 0.9 é excelente.",
      exemplo: "Competições Kaggle, detecção de fraudes"
    }
  }
};

// CONHECIMENTO COMBINADO
const CONHECIMENTO_JIAM = {
  sistema: INFORMACOES_SISTEMA,
  autor: INFORMACOES_AUTOR,
  dataMining: DATA_MINING,
  bigData: BIG_DATA,
  atuarial: ATUARIAL,
  previsoes: PREVISOES,
  glossario: {
    "p-value": "Probabilidade de observar os dados se a hipótese nula for verdadeira. p < 0.05 indica significância estatística",
    "r2": "Coeficiente de determinação. Proporção da variância explicada pelo modelo",
    "aic": "Critério de Informação de Akaike. Menor valor indica melhor ajuste",
    "bic": "Critério de Informação Bayesiano. Penaliza mais a complexidade que o AIC",
    "mape": "Mean Absolute Percentage Error. Erro percentual absoluto médio",
    "rmse": "Root Mean Square Error. Raiz do erro quadrático médio",
    "auc": "Area Under the Curve. Área sob a curva ROC",
    "vif": "Variance Inflation Factor. Mede multicolinearidade",
    "dw": "Durbin-Watson. Testa autocorrelação dos resíduos",
    "silhueta": "Medida de qualidade do clustering. Varia de -1 a 1",
    "lift": "Mede a força de uma regra de associação",
    "var": "Value at Risk. Perda máxima esperada",
    "tvar": "Tail Value at Risk. Média das perdas além do VaR"
  }
};

// ============================================
// FUNÇÕES DA IA
// ============================================

/**
 * 🔥 GUIA PARA CONFIGURAR API GRATUITA DO DEEPSEEK:
 * 
 * 1. Acesse: https://platform.deepseek.com/
 * 2. Clique em "Sign Up" e crie uma conta gratuita
 * 3. Verifique seu email
 * 4. No painel, vá para "API Keys" (lateral esquerda)
 * 5. Clique em "Create new API key"
 * 6. Dê um nome (ex: "JIAM App")
 * 7. Copie a chave gerada
 * 8. Substitua a variável DEEPSEEK_API_KEY no topo do arquivo
 * 
 * ✅ PRONTO! Agora você tem acesso gratuito à API DeepSeek.
 * 
 * Limites gratuitos:
 * - 5 milhões de tokens por mês (suficiente para milhares de consultas)
 * - Sem custo inicial, sem necessidade de cartão de crédito
 * - Rate limit: 100 requisições por minuto
 */

/**
 * Verifica se a chave da API DeepSeek é válida
 */
const verificarChaveDeepSeek = async () => {
  try {
    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "user", content: "Teste de conexão" }
        ],
        max_tokens: 5
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
        },
        timeout: 5000
      }
    );
    return response.status === 200;
  } catch (error) {
    console.error("❌ DeepSeek API error:", error.message);
    return false;
  }
};

/**
 * Consulta a API do DeepSeek com fallback automático
 */
const consultarDeepSeek = async (pergunta) => {
  if (CONFIG.modoDemonstracao) {
    return { sucesso: false, resposta: null, erro: "Modo demonstração" };
  }

  try {
    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: CONFIG.modeloDeepSeek,
        messages: [
          {
            role: "system",
            content: `Você é a assistente IA do sistema JIAM Predictivo, criado por Venâncio Elavoco Cassova Martins.
            
            Você conhece profundamente o sistema e seu criador:
            
            AUTOR: ${JSON.stringify(INFORMACOES_AUTOR, null, 2)}
            
            SISTEMA: ${JSON.stringify(CONHECIMENTO_JIAM, null, 2)}
            
            Seja prestativa, explique conceitos técnicos de forma clara e didática.
            Use exemplos práticos quando apropriado.
            Responda em português de Angola (pt-AO) quando apropriado.
            
            Lembre-se sempre:
            - JIAM significa Jerónimo Inocêncio Alberto Martins, nome do filho do criador
            - O autor venceu o Prêmio Nacional de Ciência e Inovação 2025
            - As fontes de dados são INE Angola, BNA, Economics Trading e FMI
            
            Se perguntarem sobre o autor, fale com orgulho sobre Venâncio Martins e seu trabalho.
            Se perguntarem sobre Angola, mostre conhecimento sobre o contexto local.`
          },
          {
            role: "user",
            content: pergunta
          }
        ],
        temperature: CONFIG.temperatura,
        max_tokens: CONFIG.maxTokens
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
        },
        timeout: CONFIG.timeout
      }
    );

    return { 
      sucesso: true, 
      resposta: response.data.choices[0].message.content,
      fonte: "DeepSeek AI"
    };
  } catch (error) {
    console.error("❌ Erro na API DeepSeek:", error);
    
    if (error.response?.status === 401) {
      return { 
        sucesso: false, 
        resposta: null, 
        erro: "Chave da API DeepSeek inválida ou expirada",
        codigo: "invalid_key"
      };
    }
    
    if (error.code === 'ECONNABORTED') {
      return { 
        sucesso: false, 
        resposta: null, 
        erro: "Timeout na conexão com DeepSeek",
        codigo: "timeout"
      };
    }
    
    return { 
      sucesso: false, 
      resposta: null, 
      erro: error.message,
      codigo: "unknown_error"
    };
  }
};

/**
 * Gera resposta de demonstração (quando sem API)
 */
const gerarRespostaDemonstracao = (pergunta, incluirContexto = true) => {
  const perguntaLower = pergunta.toLowerCase();
  
  // Informações sobre o autor - CORRIGIDAS
  if (perguntaLower.includes("venâncio") || perguntaLower.includes("venancio") || 
      perguntaLower.includes("martins") || perguntaLower.includes("criador") ||
      perguntaLower.includes("autor") || perguntaLower.includes("quem criou") ||
      perguntaLower.includes("desenvolvedor")) {
    return `👨‍💻 **Sobre o Autor do JIAM Predictivo:**

O JIAM Predictivo foi criado por **${INFORMACOES_AUTOR.nomeCompleto}**, pesquisador em economia e cientista de dados angolano.

📋 **Informações:**
- **Nome completo:** ${INFORMACOES_AUTOR.nomeCompleto}
- **Título:** ${INFORMACOES_AUTOR.titulo}
- **Localização:** ${INFORMACOES_AUTOR.localizacao}
- **Email:** ${INFORMACOES_AUTOR.email}
- **Telefone:** ${INFORMACOES_AUTOR.telefone}
- **LinkedIn:** ${INFORMACOES_AUTOR.linkedin}
- **GitHub:** ${INFORMACOES_AUTOR.github}
- **ORCID:** ${INFORMACOES_AUTOR.orcid}

🏆 **Prêmio Nacional de Ciência e Inovação 2025:**
- **Categoria:** Jovem Inventor
- **Concedido por:** FUNDECIT e MESCTI
- **Projeto:** JIAM Predictivo

🎓 **Actuação Acadêmica:**
- **Instituição:** ${INFORMACOES_AUTOR.atuacao.universidade}
- **Cargo:** ${INFORMACOES_AUTOR.atuacao.cargoUniversidade}
- **Actuação:** ${INFORMACOES_AUTOR.atuacao.descricaoUniversidade}

💼 **Actuação Profissional:**
- **Empresa:** ${INFORMACOES_AUTOR.atuacao.empresa}
- **Cargo:** ${INFORMACOES_AUTOR.atuacao.cargoEmpresa}
- **Departamento:** ${INFORMACOES_AUTOR.atuacao.departamentoEmpresa}
- **Actuação:** ${INFORMACOES_AUTOR.atuacao.descricaoEmpresa}

📊 **Fontes de Dados:**
${INFORMACOES_AUTOR.fontesDados.map(f => `• ${f}`).join('\n')}

🔧 **Especialidades:**
${INFORMACOES_AUTOR.especialidades.map(e => `• ${e}`).join('\n')}

💭 **Significado do JIAM:**
"${INFORMACOES_AUTOR.significadoJIAMCompleto}"

🔗 **Links:**
- [Jornal de Angola](${INFORMACOES_AUTOR.links.jornalAngola})
- [LinkedIn](${INFORMACOES_AUTOR.links.linkedin})
- [GitHub](${INFORMACOES_AUTOR.links.github})
- [ORCID](${INFORMACOES_AUTOR.links.orcid})`;
  }
  
  // Informações sobre o significado do JIAM
  if (perguntaLower.includes("jiam") || perguntaLower.includes("significado") ||
      perguntaLower.includes("jeronomo") || perguntaLower.includes("filho")) {
    return `👶 **Significado do nome JIAM:**

JIAM significa **J**erónimo **I**nocêncio **A**lberto **M**artins — é o nome do filho do criador, Venâncio Elavoco Cassova Martins.

O sistema JIAM Predictivo carrega este nome como uma homenagem e eternização do nome do filho do criador na tecnologia que desenvolveu.`;
  }
  
  // Informações sobre Angola
  if (perguntaLower.includes("angola") || perguntaLower.includes("angolano") || 
      perguntaLower.includes("luanda") || perguntaLower.includes("ine") ||
      perguntaLower.includes("bna") || perguntaLower.includes("kwanza")) {
    return `🇦🇴 **Contexto Angolano no JIAM Predictivo:**

O JIAM Predictivo foi desenvolvido especialmente para trabalhar com dados angolanos:

📊 **Fontes de dados utilizadas:**
${INFORMACOES_AUTOR.fontesDados.map(f => `• **${f}**`).join('\n')}

📈 **Aplicações:**
- Previsões macroeconômicas para Angola
- Análise de séries temporais com dados do INE Angola
- Modelagem preditiva com dados do BNA
- Validação com fontes internacionais (FMI, Trading Economics)

O sistema  foi construido para auxiliar em pesquisas nas Universidade e no processo de tomada de decisão nas organizações tendo como base sua Monografia.`;
  }
  
  // Data Mining
  if (perguntaLower.includes("data mining") || perguntaLower.includes("mineração") ||
      perguntaLower.includes("cluster") || perguntaLower.includes("associação") ||
      perguntaLower.includes("classificação")) {
    return `⛏️ **Data Mining no JIAM Preditivo:**

O módulo de Data Mining oferece 5 categorias com 15+ algoritmos:

🔹 **Clustering:**
• K-Means: Agrupamento particional
• DBSCAN: Baseado em densidade, detecta outliers
• Hierárquico: Cria dendrograma
• GMM: Modelo probabilístico

🔹 **Associação:**
• Apriori: Regras clássicas
• FP-Growth: Pattern growth
• Eclat: Mining de itemsets

🔹 **Classificação:**
• Decision Tree, Random Forest
• SVM, Naive Bayes, KNN

🔹 **Redução Dimensional:**
• PCA, t-SNE, UMAP

🔹 **Anomalias:**
• Isolation Forest, LOF, One-Class SVM

📊 **Métricas:** Silhueta, Lift, Acurácia, F1, Variância explicada`;
  }
  
  // Big Data
  if (perguntaLower.includes("big data") || perguntaLower.includes("spark") ||
      perguntaLower.includes("hadoop") || perguntaLower.includes("streaming") ||
      perguntaLower.includes("sql distribuído")) {
    return `⚡ **Big Data no JIAM Preditivo:**

4 motores de processamento distribuído:

🔹 **Spark Jobs:** Processamento em memória
• ETL, Análise Exploratória, Agregação, ML

🔹 **Hadoop MapReduce:** Processamento batch
• WordCount, Agregação, Filtro, Join

🔹 **Streaming:** Tempo real (Flink)
• Window Count, Média Móvel, Tendências, Anomalias

🔹 **SQL Distribuído:** Consultas em larga escala
• Spark SQL, Hive, Presto/Trino

📈 **Métricas:** Tempo execução, Shuffle, Latência, Partições`;
  }
  
  // Modelos Atuariais
  if (perguntaLower.includes("atuarial") || perguntaLower.includes("seguro") || 
      perguntaLower.includes("vida") || perguntaLower.includes("tarifação") ||
      perguntaLower.includes("monte carlo") || perguntaLower.includes("markov")) {
    return `🛡️ **Modelos Atuariais no JIAM Preditivo:**

🔹 **Ajuste de Modelos GLM:** Frequência + Severidade
🔹 **Tarificação A Posteriori:** Credibilidade de Bühlmann-Straub
🔹 **Monte Carlo:** Simulação de risco (VaR, TVaR)
🔹 **Cadeias de Markov:** Transição de estados
🔹 **Seguros de Vida:** Tábuas de mortalidade completas

📊 **Tábua de Mortalidade:**
• e₀: expectativa ao nascer
• qx: probabilidade de morte
• lx: sobreviventes
• dx: óbitos

💰 **Prêmios:** Puro, Comercial, Nivelado, Anuidade, Reserva`;
  }
  
  // Previsões - Regressão
  if (perguntaLower.includes("regressão") || perguntaLower.includes("linear") ||
      perguntaLower.includes("logística") || perguntaLower.includes("logistica")) {
    return `📈 **Modelos de Regressão no JIAM Preditivo:**

🔹 **Regressão Linear Simples:** Y = β₀ + β₁X
• R² > 0.7 indica bom ajuste
• p-valor < 0.05 indica significância

🔹 **Regressão Linear Múltipla:** Y = β₀ + β₁X₁ + β₂X₂ + ...
• VIF > 10 indica multicolinearidade
• DW próximo de 2 indica resíduos independentes

🔹 **Regressão Logística Simples:** P = 1/(1 + e^-(β₀ + β₁X))
• AUC > 0.8 é excelente
• Classificação binária

🔹 **Regressão Logística Múltipla:** P = 1/(1 + e^-(β₀ + β₁X₁ + ...))
• Precisão e recall balanceados
• F1 > 0.8 é excelente

📊 **Exemplos:** Prever preços, churn, risco de crédito`;
  }
  
  // Séries Temporais
  if (perguntaLower.includes("série") || perguntaLower.includes("temporal") ||
      perguntaLower.includes("arima") || perguntaLower.includes("sarima") ||
      perguntaLower.includes("ets") || perguntaLower.includes("prophet")) {
    return `📅 **Modelos de Séries Temporais no JIAM Preditivo:**

🔹 **ARIMA:** (p,d,q)
• p: auto-regressivo, d: diferenciação, q: médias móveis
• AIC e BIC para seleção de modelo

🔹 **SARIMA:** (p,d,q) + (P,D,Q,s)
• Adiciona componente sazonal
• Força sazonal > 0.5 indica sazonalidade significativa

🔹 **ETS:** (Erro, Tendência, Sazonalidade)
• Suavização exponencial
• Modelo com menor AIC é preferível

🔹 **Prophet:** Modelo do Facebook
• Tendência, sazonalidade, feriados
• MAPE < 10% é excelente

📊 **Exemplos:** Vendas, tráfego web, demanda, preços`;
  }
  
  // Machine Learning
  if (perguntaLower.includes("machine learning") || perguntaLower.includes("ml") ||
      perguntaLower.includes("random forest") || perguntaLower.includes("xgboost")) {
    return `🤖 **Machine Learning no JIAM Preditivo:**

🔹 **Random Forest:**
• Floresta de árvores de decisão
• OOB error < 20% indica boa generalização
• Feature importance para interpretabilidade

🔹 **XGBoost:**
• Gradient boosting otimizado
• Log_loss menor é melhor
• AUC > 0.9 é excelente

📊 **Métricas comuns:**
• Acurácia, Precisão, Recall, F1
• AUC, Log Loss, Feature Importance

💡 **Aplicações:** Classificação, regressão, ranking`;
  }
  
  // Resposta padrão
  const resposta = `🤖 **Assistente JIAM IA**

Olá! Sou a IA do **JIAM Predictivo**, criado por **${INFORMACOES_AUTOR.nomeCompleto}** — pesquisador em economia e cientista de dados angolano.

🏆 **Prêmio:** Vencedor do Prêmio Nacional de Ciência e Inovação 2025 (FUNDECIT/MESCTI)
👶 **Significado:** JIAM = Jerónimo Inocêncio Alberto Martins (nome do filho do criador)
📊 **Foco:** Previsões macroeconômicas com dados angolanos (INE Angola, BNA)

Posso ajudar com:

📊 **Data Mining** (15+ algoritmos)
⚡ **Big Data** (4 motores)
🛡️ **Modelos Atuariais**
📈 **Previsões** (Regressão, Séries Temporais, Machine Learning)

🔍 **Sobre o autor:** ${INFORMACOES_AUTOR.nomeCompleto} — Pesquisador na UJES e Funcionário no Grupo Vinech-Formação

Como posso ajudar você hoje?`;

  if (incluirContexto) {
    return resposta + `\n\n📌 **Nota**: Esta é uma resposta gerada pelo sistema interno.`;
  }
  
  return resposta;
};

/**
 * Pesquisa na Wikipedia
 */
const pesquisarWikipedia = async (query) => {
  try {
    const res = await axios.get(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
    return {
      sucesso: true,
      title: res.data.title,
      extract: res.data.extract,
      url: res.data.content_urls?.desktop?.page
    };
  } catch {
    return { sucesso: false };
  }
};

/**
 * Pesquisa no Google (via backend proxy)
 */
const pesquisarGoogle = async (query) => {
  try {
    const res = await axios.get("http://localhost:5000/api/google-search", { 
      params: { query } 
    });
    return { sucesso: true, resultados: res.data.results || [] };
  } catch (err) { 
    console.error(err); 
    return { sucesso: false, resultados: [] }; 
  }
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function AbaAjuda({ lang = "pt" }) {
  const [perguntaAtiva, setPerguntaAtiva] = useState(null);
  const [chatAberto, setChatAberto] = useState(false);
  const [mensagens, setMensagens] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modoIA, setModoIA] = useState("auto"); // "auto", "deepseek", "wikipedia", "google", "local"
  const [statusDeepSeek, setStatusDeepSeek] = useState(null); // "checking", "online", "offline"
  const [mostrarInfo, setMostrarInfo] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("faq"); // "faq", "autor", "sistema"

  const chatRef = useRef(null);
  const inputRef = useRef(null);

  // Ano atual dinâmico
  const anoAtual = new Date().getFullYear();

  // Perguntas frequentes do FAQ (atualizadas)
  const perguntas = [
    { 
      titulo: "❓ Quem é Venâncio Martins?",
      resposta: `**Venâncio Elavoco Cassova Martins** é pesquisador em economia e cientista de dados na Universidade José Eduardo dos Santos (UJES), com actuação aplicada em modelagem preditiva, análise de séries temporais e previsão macroeconômica utilizando dados angolanos.

É vencedor do Prêmio Nacional de Ciência e Inovação (2025), concedido pela FUNDECIT e MESCTI, na categoria Jovem Inventor, pelo desenvolvimento do framework de previsão JIAM Predictivo.

Actualmente, ocupa o cargo de Responsável de Orçamento, Projetos e Contas a Receber na Direcção Financeira do Grupo Vinech-Formação.`
    },
    { 
      titulo: "👶 O que significa JIAM?",
      resposta: `**JIAM** significa **J**erónimo **I**nocêncio **A**lberto **M**artins — é o nome do filho do criador, Venâncio Martins.

> *"JIAM significa Jerónimo Inocêncio Alberto Martins, nome do meu filho."* — Venâncio Martins`
    },
    { 
      titulo: "🏆 Qual prêmio o JIAM Predictivo ganhou?",
      resposta: `O JIAM Predictivo foi o vencedor do **Prêmio Nacional de Ciência e Inovação 2025** na categoria **Jovem Inventor**, concedido pela FUNDECIT e pelo Ministério do Ensino Superior, Ciência, Tecnologia e Inovação (MESCTI).

O prêmio reconheceu o desenvolvimento do framework de previsão para modelagem preditiva, análise de séries temporais e previsão macroeconômica utilizando dados angolanos.`
    },
    { 
      titulo: "📊 Quais fontes de dados são utilizadas?",
      resposta: `O JIAM Predictivo utiliza as seguintes fontes de dados para validação e modelagem:

• **INE Angola** - Instituto Nacional de Estatística de Angola
• **BNA** - Banco Nacional de Angola
• **Economics Trading** - Dados econômicos internacionais
• **FMI** - Fundo Monetário Internacional

Estas fontes garantem a precisão e relevância das previsões para o contexto angolano.`
    },
    { 
      titulo: "🔍 Quais algoritmos de Data Mining estão disponíveis?",
      resposta: `📊 O JIAM oferece uma suite completa de algoritmos de Data Mining:

**Clustering**: K-Means, DBSCAN, Hierárquico, GMM
**Associação**: Apriori, FP-Growth, Eclat
**Classificação**: Decision Tree, Random Forest, SVM, Naive Bayes, KNN
**Redução**: PCA, t-SNE, UMAP
**Anomalias**: Isolation Forest, LOF, One-Class SVM

Cada algoritmo possui parâmetros específicos e métricas de avaliação detalhadas.`
    },
    { 
      titulo: "⚡ Como funciona o Big Data no JIAM?",
      resposta: `💾 O módulo Big Data do JIAM integra 4 motores de processamento:

• **Spark Jobs**: Processamento em memória para ETL, análises e ML
• **Hadoop MapReduce**: Processamento batch para grandes volumes
• **Streaming**: Análise em tempo real com janelas deslizantes
• **SQL Distribuído**: Consultas com Spark SQL, Hive e Presto

Você pode processar terabytes de dados com particionamento automático e monitoramento de performance.`
    }
  ];

  // Verificar status da DeepSeek ao iniciar
  useEffect(() => {
    const verificarStatus = async () => {
      setStatusDeepSeek("checking");
      const online = await verificarChaveDeepSeek();
      setStatusDeepSeek(online ? "online" : "offline");
      setModoIA(online ? "auto" : "local");
    };
    
    verificarStatus();
  }, []);

  // Inicializa sessão e histórico
  useEffect(() => {
    let sess = sessionStorage.getItem("jiam-session");
    if (!sess) {
      sess = uuidv4();
      sessionStorage.setItem("jiam-session", sess);
    }
    setSessionId(sess);

    const chatHistorico = localStorage.getItem(`chat-${sess}`);
    if (chatHistorico) {
      setMensagens(JSON.parse(chatHistorico));
    } else {
      setMensagens([
        { 
          remetente: "bot", 
          texto: `👋 Olá! Sou a **JIAM IA** — sua assistente inteligente.

🤖 **Status da IA:** ${statusDeepSeek === "online" ? "DeepSeek AI Conectado ✅" : "Modo Local (sem API) ⚠️"}

👨‍🏫 **Criado por:** ${INFORMACOES_AUTOR.nomeCompleto} - Pesquisador em Economia e Cientista de Dados
🏆 **Prêmio:** Vencedor do Prêmio Nacional de Ciência e Inovação 2025 (FUNDECIT/MESCTI)
👶 **Significado:** JIAM = Jerónimo Inocêncio Alberto Martins (nome do filho do criador)
📊 **Fontes:** INE Angola, BNA, Economics Trading, FMI

💡 **O que posso fazer:**
• Responder perguntas sobre Data Mining, Big Data, Modelos Atuariais
• Explicar métricas e algoritmos
• Ajudar com interpretação de resultados
• Falar sobre o autor e o sistema
• Pesquisar na Wikipedia quando necessário

${statusDeepSeek !== "online" ? "\n⚠️ **Nota:** Modo local ativo - respostas baseadas no conhecimento interno do sistema." : ""}

Como posso ajudar você hoje?` 
        }
      ]);
    }
  }, [statusDeepSeek]);

  // Scroll automático e salva histórico
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
    if (sessionId) {
      localStorage.setItem(`chat-${sessionId}`, JSON.stringify(mensagens));
    }
  }, [mensagens, sessionId]);

  // Foco no input quando chat abre
  useEffect(() => {
    if (chatAberto && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [chatAberto]);

  /**
   * Envia mensagem para a IA com fallback inteligente
   */
  const handleEnviar = async () => {
    if (!input.trim() || !sessionId) return;
    
    const pergunta = input.trim();
    setMensagens(msgs => [...msgs, { remetente: "user", texto: pergunta }]);
    setInput("");
    setLoading(true);

    try {
      let resposta = "";
      let fontes = [];
      let modoUsado = "";

      // Estratégia de fallback baseada no status
      if (statusDeepSeek === "online" && CONFIG.usarDeepSeek) {
        // Tenta DeepSeek primeiro
        const resultadoDeepSeek = await consultarDeepSeek(pergunta);
        
        if (resultadoDeepSeek.sucesso) {
          resposta = resultadoDeepSeek.resposta;
          fontes.push(resultadoDeepSeek.fonte);
          modoUsado = "deepseek";
        } else {
          // DeepSeek falhou, usa fallback
          fontes.push(`Fallback (${resultadoDeepSeek.erro || "erro desconhecido"})`);
          
          // Tenta Wikipedia
          const wiki = await pesquisarWikipedia(pergunta);
          if (wiki.sucesso) {
            resposta += `📚 **Wikipedia:**\n${wiki.title}: ${wiki.extract}\n[Leia mais](${wiki.url})\n\n`;
            fontes.push("Wikipedia");
          }

          // Tenta Google
          const google = await pesquisarGoogle(pergunta);
          if (google.sucesso && google.resultados.length > 0) {
            resposta += "🔎 **Resultados da Web:**\n";
            google.resultados.slice(0, 3).forEach((item, i) => {
              resposta += `${i + 1}. **[${item.title}](${item.link})**\n${item.snippet}\n\n`;
            });
            fontes.push("Google");
          }

          // Se ainda não tem resposta, usa conhecimento interno
          if (!resposta) {
            resposta = gerarRespostaDemonstracao(pergunta, true);
            fontes.push("Conhecimento Interno JIAM");
            modoUsado = "local";
          } else {
            modoUsado = "fallback";
          }
        }
      } else {
        // Modo local (sem DeepSeek)
        const wiki = await pesquisarWikipedia(pergunta);
        if (wiki.sucesso) {
          resposta += `📚 **Wikipedia:**\n${wiki.title}: ${wiki.extract}\n[Leia mais](${wiki.url})\n\n`;
          fontes.push("Wikipedia");
        }

        const google = await pesquisarGoogle(pergunta);
        if (google.sucesso && google.resultados.length > 0) {
          resposta += "🔎 **Resultados da Web:**\n";
          google.resultados.slice(0, 3).forEach((item, i) => {
            resposta += `${i + 1}. **[${item.title}](${item.link})**\n${item.snippet}\n\n`;
          });
          fontes.push("Google");
        }

        if (!resposta) {
          resposta = gerarRespostaDemonstracao(pergunta, true);
          fontes.push("Conhecimento Interno JIAM");
        }
        
        modoUsado = "local";
      }

      // Adiciona informações do modo usado
      if (fontes.length > 0) {
        resposta += `\n\n---\n📋 **Fontes:** ${fontes.join(" • ")}`;
        
        if (modoUsado === "deepseek") {
          resposta += `\n✨ **Modo:** DeepSeek AI (recomendado)`;
        } else if (modoUsado === "local") {
          resposta += `\n⚠️ **Modo:** Conhecimento Interno (offline)`;
        } else if (modoUsado === "fallback") {
          resposta += `\n🔄 **Modo:** Fallback (DeepSeek indisponível)`;
        }
      }

      setMensagens(msgs => [...msgs, { remetente: "bot", texto: resposta }]);
    } catch (err) {
      console.error(err);
      setMensagens(msgs => [...msgs, { 
        remetente: "bot", 
        texto: "❌ **Erro na pesquisa.** Tente novamente ou reformule a pergunta." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formata texto com markdown simples
   */
  const formatarTexto = (texto) => {
    // Links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Bold
    const boldRegex = /\*\*([^*]+)\*\*/g;
    
    // Itálico
    const italicRegex = /\*([^*]+)\*/g;
    
    // Listas
    const lines = texto.split("\n");
    
    return lines.map((linha, i) => {
      let processedLine = linha;
      
      // Processa links
      processedLine = processedLine.replace(linkRegex, (match, text, url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800">${text}</a>`;
      });
      
      processedLine = processedLine.replace(urlRegex, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800">${url}</a>`;
      });
      
      // Processa bold
      processedLine = processedLine.replace(boldRegex, '<strong>$1</strong>');
      
      // Processa itálico
      processedLine = processedLine.replace(italicRegex, '<em>$1</em>');
      
      // Listas
      if (processedLine.startsWith("• ") || processedLine.startsWith("- ")) {
        return <li key={i} className="ml-4 mb-1">{processedLine.substring(2)}</li>;
      }
      
      if (processedLine.match(/^\d+\. /)) {
        return <li key={i} className="ml-4 mb-1 list-decimal">{processedLine.replace(/^\d+\. /, "")}</li>;
      }
      
      return <p key={i} className="mb-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: processedLine }} />;
    });
  };

  /**
   * Alterna pergunta do FAQ
   */
  const togglePergunta = (index) => {
    setPerguntaAtiva(perguntaAtiva === index ? null : index);
  };

  /**
   * Copiar texto para área de transferência
   */
  const copiarTexto = (texto) => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl mt-8 relative">
      {/* Cabeçalho Premium */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl shadow-lg">
            <Brain className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
              Central de Ajuda Inteligente
            </h2>
            <div className="flex items-center gap-2 mt-2">
              {statusDeepSeek === "checking" && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">Verificando conexão com DeepSeek...</span>
                </>
              )}
              {statusDeepSeek === "online" && (
                <>
                  <Wifi className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">DeepSeek AI Conectado</span>
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full ml-2">
                    Premium
                  </span>
                </>
              )}
              {statusDeepSeek === "offline" && (
                <>
                  <WifiOff className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700">Modo Local (DeepSeek indisponível)</span>
                  <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full ml-2">
                    Offline
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setMostrarInfo(!mostrarInfo)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition"
        >
          <Info className="h-4 w-4 text-blue-600" />
          <span>Sobre o Sistema</span>
        </button>
      </div>

      {/* Info do Sistema */}
      {mostrarInfo && (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" /> Prêmio
              </h3>
              <p className="text-sm text-gray-700">
                <span className="font-bold">Prêmio Nacional de Ciência e Inovação 2025</span><br />
                Categoria: Jovem Inventor<br />
                Concedido por: FUNDECIT e MESCTI
              </p>
            </div>
            <div>
              <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                <User className="h-4 w-4" /> Autor
              </h3>
              <p className="text-sm text-gray-700">
                <span className="font-bold">{INFORMACOES_AUTOR.nomeCompleto}</span><br />
                Pesquisador UJES<br />
                Funcionário no Grupo Vinech-Formação
              </p>
            </div>
            <div>
              <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                <Database className="h-4 w-4" /> Fontes
              </h3>
              <p className="text-sm text-gray-700">
                INE Angola • BNA • Trading Economics • FMI
              </p>
              <p className="text-xs text-gray-500 mt-2">
                JIAM = Jerónimo Inocêncio Alberto Martins
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Abas: FAQ, Autor, Sistema */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setAbaAtiva("faq")}
          className={`px-6 py-3 font-medium text-sm transition-all ${
            abaAtiva === "faq"
              ? "border-b-2 border-blue-600 text-blue-700 bg-blue-50/50"
              : "text-gray-600 hover:text-blue-600 hover:bg-blue-50/30"
          }`}
        >
          ❓ Perguntas Frequentes
        </button>
        <button
          onClick={() => setAbaAtiva("autor")}
          className={`px-6 py-3 font-medium text-sm transition-all ${
            abaAtiva === "autor"
              ? "border-b-2 border-blue-600 text-blue-700 bg-blue-50/50"
              : "text-gray-600 hover:text-blue-600 hover:bg-blue-50/30"
          }`}
        >
          👨‍🏫 Sobre o Autor
        </button>
        <button
          onClick={() => setAbaAtiva("sistema")}
          className={`px-6 py-3 font-medium text-sm transition-all ${
            abaAtiva === "sistema"
              ? "border-b-2 border-blue-600 text-blue-700 bg-blue-50/50"
              : "text-gray-600 hover:text-blue-600 hover:bg-blue-50/30"
          }`}
        >
          ⚙️ Sobre o Sistema
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {abaAtiva === "faq" && (
        <div className="space-y-3 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            Perguntas Frequentes
          </h3>
          
          {perguntas.map((p, index) => (
            <div key={index} className="border border-blue-100 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition">
              <button
                className="w-full flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 transition text-left"
                onClick={() => togglePergunta(index)}
              >
                <span className="font-medium text-gray-800">{p.titulo}</span>
                {perguntaAtiva === index ? 
                  <ChevronUp className="h-5 w-5 text-blue-500" /> : 
                  <ChevronDown className="h-5 w-5 text-blue-500" />
                }
              </button>
              {perguntaAtiva === index && (
                <div className="p-4 bg-white text-gray-700 text-sm border-t border-blue-100 animate-fadeIn">
                  {p.resposta.split("\n").map((line, i) => (
                    <p key={i} className="mb-2">{line}</p>
                  ))}
                  <button
                    onClick={() => {
                      setInput(p.titulo);
                      if (inputRef.current) inputRef.current.focus();
                    }}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Send className="h-3 w-3" /> Perguntar à IA sobre isso
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {abaAtiva === "autor" && (
        <div className="mb-8 bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
            <h3 className="text-2xl font-bold mb-2">👨‍🏫 Sobre o Autor</h3>
            <p className="text-sm opacity-90">Conheça o criador do JIAM Predictivo</p>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 flex flex-col items-center">
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl mb-4">
  <img 
    src="/imagens/autor/venancio-martins.jpg" 
    alt={INFORMACOES_AUTOR.nomeCompleto}
    className="w-full h-full object-cover"
    onError={(e) => {
      e.target.onerror = null;
      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(INFORMACOES_AUTOR.nome)}&size=160&background=random&bold=true`;
    }}
  />
</div>              <h4 className="text-xl font-bold text-gray-800 text-center">{INFORMACOES_AUTOR.nomeCompleto}</h4>
              <p className="text-blue-600 text-center mt-1">{INFORMACOES_AUTOR.titulo}</p>
              <div className="flex items-center gap-2 mt-3 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{INFORMACOES_AUTOR.localizacao}</span>
              </div>
              <div className="flex gap-3 mt-4">
                <a href={INFORMACOES_AUTOR.links.github} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                  <Github className="h-5 w-5 text-gray-700" />
                </a>
                <a href={INFORMACOES_AUTOR.links.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-100 rounded-lg hover:bg-blue-200 transition">
                  <Linkedin className="h-5 w-5 text-blue-700" />
                </a>
                <a href={INFORMACOES_AUTOR.links.orcid} target="_blank" rel="noopener noreferrer" className="p-2 bg-green-100 rounded-lg hover:bg-green-200 transition">
                  <Award className="h-5 w-5 text-green-700" />
                </a>
              </div>
            </div>
            
            <div className="md:col-span-2 space-y-4">
              <div>
                <h5 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" /> Sobre
                </h5>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {INFORMACOES_AUTOR.sobre}
                </p>
                <p className="text-sm text-gray-600 italic mt-2 border-l-4 border-blue-400 pl-4">
                  "{INFORMACOES_AUTOR.citacao}"
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="font-bold text-gray-700 mb-2">🏆 Prêmio</h5>
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="font-medium text-yellow-800">{INFORMACOES_AUTOR.premio.nome}</p>
                    <p className="text-xs text-yellow-700">{INFORMACOES_AUTOR.premio.categoria}</p>
                    <p className="text-xs text-gray-600 mt-1">{INFORMACOES_AUTOR.premio.concedidoPor}</p>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-bold text-gray-700 mb-2">👶 Significado</h5>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="font-medium text-blue-800">JIAM =</p>
                    <p className="text-sm text-blue-700">{INFORMACOES_AUTOR.significadoJIAM}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-green-600" /> Actuação
                </h5>
                <div className="space-y-2">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-800">{INFORMACOES_AUTOR.atuacao.cargoUniversidade}</p>
                    <p className="text-sm text-gray-600">{INFORMACOES_AUTOR.atuacao.universidade}</p>
                    <p className="text-xs text-gray-500 mt-1">{INFORMACOES_AUTOR.atuacao.descricaoUniversidade}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-800">{INFORMACOES_AUTOR.atuacao.cargoEmpresa}</p>
                    <p className="text-sm text-gray-600">{INFORMACOES_AUTOR.atuacao.empresa} - {INFORMACOES_AUTOR.atuacao.departamentoEmpresa}</p>
                    <p className="text-xs text-gray-500 mt-1">{INFORMACOES_AUTOR.atuacao.descricaoEmpresa}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="font-bold text-gray-700 mb-2">📊 Fontes de Dados</h5>
                <div className="flex flex-wrap gap-2">
                  {INFORMACOES_AUTOR.fontesDados.map((fonte, idx) => (
                    <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      {fonte}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <a href={`mailto:${INFORMACOES_AUTOR.email}`} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl text-center text-sm font-medium transition flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                </a>
                <a href={`tel:${INFORMACOES_AUTOR.telefone}`} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl text-center text-sm font-medium transition flex items-center justify-center gap-2">
                  <Phone className="h-4 w-4" /> Telefone
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {abaAtiva === "sistema" && (
        <div className="mb-8 bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
            <h3 className="text-2xl font-bold mb-2">⚙️ Sobre o Sistema</h3>
            <p className="text-sm opacity-90">Tecnologias e funcionalidades do JIAM Predictivo</p>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" /> Informações
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="p-1.5 bg-blue-100 rounded-lg mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Nome</p>
                    <p className="text-xs text-gray-600">{INFORMACOES_SISTEMA.nomeCompleto}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="p-1.5 bg-green-100 rounded-lg mt-0.5">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Significado</p>
                    <p className="text-xs text-gray-600">{INFORMACOES_SISTEMA.significado}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="p-1.5 bg-purple-100 rounded-lg mt-0.5">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Prêmio</p>
                    <p className="text-xs text-gray-600">{INFORMACOES_SISTEMA.premio}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="p-1.5 bg-orange-100 rounded-lg mt-0.5">
                    <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Versão</p>
                    <p className="text-xs text-gray-600">{INFORMACOES_SISTEMA.versao}</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Cpu className="h-5 w-5 text-cyan-600" /> Tecnologias
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {INFORMACOES_SISTEMA.tecnologias.map((tech, idx) => (
                  <div key={idx} className="bg-blue-50 p-3 rounded-xl text-center font-medium text-sm text-blue-700">
                    {tech}
                  </div>
                ))}
              </div>
              
              <h4 className="font-bold text-gray-800 mt-6 mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" /> Descrição
              </h4>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-700">{INFORMACOES_SISTEMA.descricao}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contato Direto */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Bot className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Precisa de ajuda personalizada?</h3>
              <p className="text-sm opacity-90">Entre em contato com o autor</p>
            </div>
          </div>
          <div className="flex gap-3">
            <a 
              href={`mailto:${INFORMACOES_AUTOR.email}`} 
              className="px-5 py-2 bg-white text-blue-700 rounded-xl font-medium hover:bg-blue-50 transition flex items-center gap-2"
            >
              <Send className="h-4 w-4" /> {INFORMACOES_AUTOR.email}
            </a>
            <a 
              href={`tel:${INFORMACOES_AUTOR.telefone}`} 
              className="px-5 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl font-medium hover:bg-white/30 transition flex items-center gap-2"
            >
              <Phone className="h-4 w-4" /> {INFORMACOES_AUTOR.telefone}
            </a>
          </div>
        </div>
      </div>

      {/* Botão Flutuante do Chat */}
      <button
        onClick={() => setChatAberto(!chatAberto)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-full p-4 shadow-2xl flex items-center justify-center transition-all transform hover:scale-110"
      >
        {chatAberto ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>

      {/* Janela do Chatbot */}
      {chatAberto && (
        <div className="fixed bottom-24 right-6 z-50 bg-white w-96 md:w-[32rem] rounded-3xl shadow-2xl border border-blue-200 flex flex-col overflow-hidden animate-slideUp">
          {/* Cabeçalho do Chat */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold">JIAM IA - Assistente Virtual</h4>
                <p className="text-xs opacity-90 flex items-center gap-1">
                  {statusDeepSeek === "online" ? (
                    <>
                      <Sparkles className="h-3 w-3" /> DeepSeek AI Ativo
                    </>
                  ) : statusDeepSeek === "checking" ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" /> Verificando...
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3" /> Modo Local
                    </>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setChatAberto(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mensagens */}
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white min-h-[400px] max-h-[500px]">
            {mensagens.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.remetente === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl ${
                    msg.remetente === "user"
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-br-none"
                      : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
                  }`}
                >
                  {msg.remetente === "bot" ? (
                    <div className="prose prose-sm max-w-none">
                      {formatarTexto(msg.texto)}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.texto}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-bl-none">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <p className="text-sm text-gray-600">JIAM IA está pesquisando...</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleEnviar()}
                placeholder="Digite sua pergunta..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={loading}
              />
              <button
                onClick={handleEnviar}
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2 flex justify-between items-center text-xs text-gray-400">
              <span>🔍 Pesquisa em tempo real</span>
              <span>🤖 {statusDeepSeek === "online" ? "DeepSeek AI" : "Modo Local"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}