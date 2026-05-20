// C:\Users\VhenancioMarthinz\Downloads\JiamPreditivo\frontend\src\components\Dashboard\Relatorios.jsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter, ComposedChart,
  Area, AreaChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import {
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
  Activity,
  Award,
  Shield,
  Globe,
  Clock,
  Database,
  Search,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon2,
  CalendarDays,
  Tag,
  BarChart4,
  FileBarChart,
  Brain,
  Target as TargetIcon,
  Layers,
  Cpu,
  Home,
  Calculator,
  Info,
  X,
  ChevronRight,
  BookOpen,
  AlertCircle,
  CheckSquare,
  XCircle,
  HelpCircle,
  GitCompare,
  GitBranch,
  History,
  Sparkles,
  Lightbulb,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Minus,
  Plus,
  Star,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Copy,
  Share2,
  Printer,
  Bookmark,
  BookmarkCheck,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Settings,
  Sliders,
  List,
  Grid,
  Table,
  Layout,
  Columns,
  Rows,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCw,
  RotateCcw,
  FolderOpen,
  FolderTree,
  FolderPlus,
  FolderMinus,
  Folders,
  Archive,
  ArchiveRestore,
  ArchiveX,
  Binary,
  Bug,
  BugOff,
  Building,
  Building2,
  CandlestickChart,
  ChartCandlestick,
  ChartColumn,
  ChartColumnIncreasing,
  ChartColumnDecreasing,
  ChartLine,
  ChartNetwork,
  ChartNoAxesColumn,
  ChartPie,
  ChartSpline,
  ChartScatter,
  ChartBarStacked,
  ChartBarBig,
  CircleDollarSign,
  CircleEuro,
  CirclePoundSterling,
  CircleYen,
  Coins,
  CreditCard,
  DollarSign,
  Euro,
  Landmark,
  Percent,
  PiggyBank,
  Wallet,
  Banknote,
  BanknoteArrowDown,
  BanknoteArrowUp,
  BanknoteX,
  TrendingUpDown,
  TrendUpDown,
  ChartColumnBig,
  ChartBar,
  ChartLine as ChartLineIcon,
  ChartArea,
  ChartBubble,
  ChartDonut,
  ChartDonut3,
  ChartDonut4,
  ChartFunnel,
  ChartGantt,
  ChartHeatmap,
  ChartHistogram,
  ChartNetwork as ChartNetworkIcon,
  ChartNoAxesColumnIncreasing,
  ChartNoAxesColumnDecreasing,
  ChartPie as ChartPieIcon,
  ChartRadar,
  ChartSankey,
  ChartScatter as ChartScatterIcon,
  ChartWaterfall,
  Bot,
  MessageSquare,
  Send,
  Loader,
  Trash2,
  AlertOctagon,
  Flag,
  Thermometer,
  Gauge,
  Scale,
  Ruler,
  Weight,
  Zap as ZapIcon,
  Wind,
  Droplet,
  Flame,
  Snowflake,
  Cloud,
  Umbrella,
  Sun as SunIcon,
  Moon as MoonIcon,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Cloudy,
  Tornado,
  Hurricane,
  Earthquake,
  Volcano,
  Mountain,
  TreePine,
  Flower,
  Leaf,
  Sprout,
  Wheat,
  Apple,
  Citrus,
  Coffee,
  Droplets,
  Waves,
  Anchor,
  Ship,
  Train,
  Bus,
  Car,
  Bike,
  Footprints,
  Plane,
  Rocket,
  Satellite,
  Space,
  Globe2,
  Compass,
  Map,
  MapPin,
  Navigation,
  Locate,
  LocateFixed,
  LocateOff,
  Crosshair,
  Aim,
  Bullseye,
  Circle,
  CircleDot,
  CircleDashed,
  CircleDotDashed,
  Square,
  SquareStack,
  Triangle,
  Hexagon,
  Octagon,
  Pentagon,
  Diamond,
  Gem,
  Crystal,
  GlassWater,
  Wine,
  Beer,
  Coffee as CoffeeIcon,
  Pizza,
  Sandwich,
  Hamburger,
  Cake,
  Candy,
  Cookie,
  IceCream,
  Croissant,
  Bagel,
  Egg,
  Milk,
  Cheese,
  Fish,
  Shellfish,
  Beef,
  Chicken,
  PawPrint,
  Bone,
  Dog,
  Cat,
  Rabbit,
  Turtle,
  Bird,
  FishIcon,
  BugIcon,
  Bee,
  Butterfly,
  Spider,
  Scorpion,
  Dragonfly,
  Feather,
  EggIcon,
  Nest,
  Tree,
  Mushroom,
  MountainIcon,
  Campfire,
  Tent,
  CompassIcon,
  MapIcon,
  Binoculars,
  Telescope,
  Microscope,
  Flask,
  Beaker,
  TestTube,
  Dna,
  Atom,
  Radiation,
  Biohazard,
  Nuclear,
  Magnet,
  Puzzle,
  Blocks,
  BrickWall,
  Hammer,
  Wrench,
  Screwdriver,
  Saw,
  Drill,
  Tool,
  Pickaxe,
  Shovel,
  Axe,
  Sword,
  Shield as ShieldIcon,
  Helmet,
  Armor,
  Crown,
  Medal,
  Ribbon,
  Trophy,
  Cup,
  FlaskConical,
  FlaskRound,
  Erlenmeyer,
  Pipette,
  Syringe,
  Stethoscope,
  Pill,
  Tablet,
  Capsule,
  Bandage,
  FirstAid,
  Heart,
  HeartPulse,
  HeartCrack,
  HeartOff,
  ActivityIcon,
  Pulse,
  ThermometerIcon,
  DropletIcon,
  WindIcon,
  Fan,
  AirVent,
  WashingMachine,
  Refrigerator,
  Oven,
  Microwave,
  Toaster,
  Blender,
  ScaleIcon,
  WeightIcon,
  RulerIcon,
  Tape,
  CompassIcon as CompassIcon2,
  SquareIcon,
  CircleIcon,
  TriangleIcon,
  HexagonIcon,
  OctagonIcon,
  PentagonIcon,
  DiamondIcon,
  GemIcon,
  CrystalIcon,
  GlassWaterIcon,
  WineIcon,
  BeerIcon,
  PizzaIcon,
  SandwichIcon,
  HamburgerIcon,
  CakeIcon,
  CandyIcon,
  CookieIcon,
  IceCreamIcon,
  CroissantIcon,
  EggIcon2,
  MilkIcon,
  CheeseIcon,
  FishIcon2,
  ShellfishIcon,
  BeefIcon,
  ChickenIcon,
  PawPrintIcon,
  BoneIcon,
  DogIcon,
  CatIcon,
  RabbitIcon,
  TurtleIcon,
  BirdIcon,
  FishIcon3,
  BugIcon2,
  BeeIcon,
  ButterflyIcon,
  SpiderIcon,
  ScorpionIcon,
  DragonflyIcon,
  FeatherIcon,
  NestIcon,
  TreeIcon,
  MushroomIcon,
  MountainIcon2,
  CampfireIcon,
  TentIcon,
  BinocularsIcon,
  TelescopeIcon,
  MicroscopeIcon,
  FlaskIcon,
  BeakerIcon,
  TestTubeIcon,
  DnaIcon,
  AtomIcon,
  RadiationIcon,
  BiohazardIcon,
  NuclearIcon,
  MagnetIcon,
  PuzzleIcon,
  BlocksIcon,
  BrickWallIcon,
  HammerIcon,
  WrenchIcon,
  ScrewdriverIcon,
  SawIcon,
  DrillIcon,
  ToolIcon,
  PickaxeIcon,
  ShovelIcon,
  AxeIcon,
  SwordIcon,
  ShieldIcon2,
  HelmetIcon,
  ArmorIcon,
  CrownIcon,
  MedalIcon,
  RibbonIcon,
  TrophyIcon,
  CupIcon,
  FlaskConicalIcon,
  FlaskRoundIcon,
  ErlenmeyerIcon,
  PipetteIcon,
  SyringeIcon,
  StethoscopeIcon,
  PillIcon,
  TabletIcon,
  CapsuleIcon,
  BandageIcon,
  FirstAidIcon,
  HeartIcon,
  HeartPulseIcon,
  HeartCrackIcon,
  HeartOffIcon,
  ActivityIcon2,
  PulseIcon,
  ThermometerIcon2,
  DropletIcon2,
  WindIcon2,
  FanIcon,
  AirVentIcon,
  WashingMachineIcon,
  RefrigeratorIcon,
  OvenIcon,
  MicrowaveIcon,
  ToasterIcon,
  BlenderIcon,
  ScaleIcon2,
  WeightIcon2,
  RulerIcon2,
  TapeIcon,
  CompassIcon3,
  SquareIcon2,
  CircleIcon2,
  TriangleIcon2,
  HexagonIcon2,
  OctagonIcon2,
  PentagonIcon2,
  DiamondIcon2,
  GemIcon2,
  CrystalIcon2,
  GlassWaterIcon2,
  WineIcon2,
  BeerIcon2,
  PizzaIcon2,
  SandwichIcon2,
  HamburgerIcon2,
  CakeIcon2,
  CandyIcon2,
  CookieIcon2,
  IceCreamIcon2,
  CroissantIcon2,
  EggIcon3,
  MilkIcon2,
  CheeseIcon2,
  FishIcon4,
  ShellfishIcon2,
  BeefIcon2,
  ChickenIcon2,
  PawPrintIcon2,
  BoneIcon2,
  DogIcon2,
  CatIcon2,
  RabbitIcon2,
  TurtleIcon2,
  BirdIcon2,
  FishIcon5,
  BugIcon3,
  BeeIcon2,
  ButterflyIcon2,
  SpiderIcon2,
  ScorpionIcon2,
  DragonflyIcon2,
  FeatherIcon2,
  NestIcon2,
  TreeIcon2,
  MushroomIcon2,
  MountainIcon3,
  CampfireIcon2,
  TentIcon2,
  BinocularsIcon2,
  TelescopeIcon2,
  MicroscopeIcon2,
  FlaskIcon2,
  BeakerIcon2,
  TestTubeIcon2,
  DnaIcon2,
  AtomIcon2,
  RadiationIcon2,
  BiohazardIcon2,
  NuclearIcon2,
  MagnetIcon2,
  PuzzleIcon2,
  BlocksIcon2,
  BrickWallIcon2,
  HammerIcon2,
  WrenchIcon2,
  ScrewdriverIcon2,
  SawIcon2,
  DrillIcon2,
  ToolIcon2,
  PickaxeIcon2,
  ShovelIcon2,
  AxeIcon2,
  SwordIcon2,
  ShieldIcon3,
  HelmetIcon2,
  ArmorIcon2,
  CrownIcon2,
  MedalIcon2,
  RibbonIcon2,
  TrophyIcon2,
  CupIcon2,
  FlaskConicalIcon2,
  FlaskRoundIcon2,
  ErlenmeyerIcon2,
  PipetteIcon2,
  SyringeIcon2,
  StethoscopeIcon2,
  PillIcon2,
  TabletIcon2,
  CapsuleIcon2,
  BandageIcon2,
  FirstAidIcon2,
  HeartIcon2,
  HeartPulseIcon2,
  HeartCrackIcon2,
  HeartOffIcon2,
  ActivityIcon3,
  PulseIcon2,
  ThermometerIcon3,
  DropletIcon3,
  WindIcon3
} from 'lucide-react';

import { analisarQualquerModelo } from '../../utils/analiseModelos';
import ModelosService from '../../services/modelosService';

// Importar relatórios específicos
import RelatorioRegressaoSimples from './relatorios/RelatorioRegressaoSimples';
import RelatorioRegressaoMultipla from './relatorios/RelatorioRegressaoMultipla';
import RelatorioRegressaoLogistica from './relatorios/RelatorioRegressaoLogistica';
import RelatorioSeriesTemporais from './relatorios/RelatorioSeriesTemporais';
import RelatorioML from './relatorios/RelatorioML';
import RelatorioActuarial from './relatorios/RelatorioActuarial';
import RelatorioBigData from './relatorios/RelatorioBigData';
import RelatorioDataMining from './relatorios/RelatorioDataMining';
import RelatorioMonteCarlo from './relatorios/RelatorioMonteCarlo';
import RelatorioMarkov from './relatorios/RelatorioMarkov';
import RelatorioSegurosVida from './relatorios/RelatorioSegurosVida';
import RelatorioGenerico from './relatorios/RelatorioGenerico';

// ============ COMPONENTES UI SIMPLIFICADOS ============

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
  <h3 className={`text-lg font-semibold text-gray-800 ${className}`}>
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

const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false, ...props }) => {
  const baseClasses = 'font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
    outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500',
    info: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, variant = 'default', className = '' }) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-purple-100 text-purple-800',
    outline: 'bg-white border border-gray-300 text-gray-700'
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};


// ============ FUNÇÕES DE SEGURANÇA PARA EXIBIÇÃO ============

// Formatar data com segurança
const formatarDataSegura = (timestamp) => {
  if (!timestamp) return 'Data não disponível';
  try {
    let data;
    if (typeof timestamp === 'string') {
      data = new Date(timestamp);
    } else if (typeof timestamp === 'number') {
      data = new Date(timestamp);
    } else if (timestamp._seconds) {
      data = new Date(timestamp._seconds * 1000);
    } else if (timestamp instanceof Date) {
      data = timestamp;
    } else {
      return 'Data inválida';
    }
    
    if (isNaN(data.getTime())) return 'Data inválida';
    return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch(e) {
    return 'Data inválida';
  }
};

// Extrair MAPE de diferentes estruturas
const extrairMAPE = (modelo) => {
  if (!modelo) return '0%';
  
  // Tentar diferentes caminhos onde o MAPE pode estar
  const mape = 
    modelo.metrics?.mape ||
    modelo.qualidade?.mape ||
    modelo.resultado?.metricas?.ajuste?.MAPE ||
    modelo.resultado?.metricas?.MAPE ||
    modelo.metricas?.ajuste?.MAPE ||
    modelo.metricas?.MAPE ||
    modelo.qualidade_ajuste?.mape_valor ||
    modelo.MAPE ||
    modelo.mape;
  
  if (mape && !isNaN(mape)) {
    return typeof mape === 'number' ? mape.toFixed(1) + '%' : mape;
  }
  return '0%';
};

// Extrair classificação
const extrairClassificacao = (modelo) => {
  if (!modelo) return 'Não classificado';
  
  const classMap = {
    'EXCELENTE': 'Excelente',
    'EXCELLENT': 'Excelente',
    'BOA': 'Boa',
    'GOOD': 'Boa',
    'MODERADA': 'Moderada',
    'MODERATE': 'Moderada',
    'BAIXA': 'Baixa',
    'POOR': 'Baixa',
    'FRACA': 'Fraca'
  };
  
  const classificacao = 
    modelo.classificacao ||
    modelo.qualidade?.classificacao ||
    modelo.qualidade_ajuste?.classificacao_geral ||
    modelo.resultado?.qualidade_ajuste?.classificacao_geral;
  
  return classMap[classificacao] || classificacao || 'Não classificado';
};

// ============ CHATBOT PARA CONSULTAS SOBRE MODELOS E ANOMALIAS ============

const ChatbotModelos = ({ modelosAnalisados, onFiltrar }) => {
  const [mensagens, setMensagens] = useState([
    { 
      id: 1, 
      tipo: 'bot', 
      texto: 'Olá! Sou o assistente IA do JIAM. Posso ajudar você a filtrar modelos e explicar anomalias detectadas. Como posso ajudar?',
      opcoes: [
        'Mostrar modelos com anomalias',
        'Explicar anomalias detectadas',
        'Filtrar por tipo de modelo',
        'Modelos com melhor performance'
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [processando, setProcessando] = useState(false);
  const [chatAberto, setChatAberto] = useState(false);
  const mensagensEndRef = useRef(null);

  const scrollParaBaixo = () => {
    mensagensEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollParaBaixo();
  }, [mensagens]);

  const processarMensagem = (texto) => {
    const mensagemLower = texto.toLowerCase();
    
    const novaMensagem = { id: Date.now(), tipo: 'usuario', texto };
    setMensagens(prev => [...prev, novaMensagem]);
    setProcessando(true);

    setTimeout(() => {
      let resposta = '';
      let acao = null;

      if (mensagemLower.includes('anomalia') || mensagemLower.includes('problema') || mensagemLower.includes('erro')) {
        const modelosComAnomalias = modelosAnalisados.filter(m => m.anomalias?.length > 0 || m.fraudes?.length > 0);
        
        if (modelosComAnomalias.length === 0) {
          resposta = '✅ Não há modelos com anomalias detectadas no momento.';
        } else {
          resposta = `🔍 Encontrei ${modelosComAnomalias.length} modelo(s) com anomalias:\n\n`;
          modelosComAnomalias.slice(0, 3).forEach(m => {
            const totalAnomalias = (m.anomalias?.length || 0) + (m.fraudes?.length || 0);
            resposta += `• **${m.nome}** (${m.tipo}): ${totalAnomalias} problema(s)\n`;
          });
          acao = 'anomalias';
        }
      }
      else if (mensagemLower.includes('explicar') || mensagemLower.includes('detalhe')) {
        const palavras = texto.split(' ');
        let modeloEncontrado = null;
        
        for (const palavra of palavras) {
          modeloEncontrado = modelosAnalisados.find(m => 
            m.nome.toLowerCase().includes(palavra.toLowerCase()) ||
            m.tipo.toLowerCase().includes(palavra.toLowerCase())
          );
          if (modeloEncontrado) break;
        }

        if (modeloEncontrado) {
          resposta = `📊 **Detalhes do modelo: ${modeloEncontrado.nome}**\n\n`;
          resposta += `• **Tipo:** ${modeloEncontrado.tipo}\n`;
          resposta += `• **Classificação:** ${modeloEncontrado.classificacao}\n`;
          resposta += `• **Performance:** ${(modeloEncontrado.pontuacao * 100).toFixed(1)}%\n\n`;
          
          if (modeloEncontrado.anomalias?.length > 0) {
            resposta += `**Anomalias:**\n`;
            modeloEncontrado.anomalias.forEach(a => {
              resposta += `• ${a.titulo}\n`;
            });
          }
        } else {
          resposta = '❓ Não consegui identificar qual modelo você quer analisar.';
        }
      }
      else if (mensagemLower.includes('filtrar') || mensagemLower.includes('mostrar')) {
        if (mensagemLower.includes('linear')) {
          acao = 'tipo:linear_simples';
          resposta = '📊 Mostrando apenas modelos de regressão linear.';
        } else if (mensagemLower.includes('logística') || mensagemLower.includes('logistica')) {
          acao = 'tipo:regressao_logistica';
          resposta = '📈 Mostrando apenas modelos de regressão logística.';
        } else if (mensagemLower.includes('temporal') || mensagemLower.includes('arima')) {
          acao = 'tipo:arima,sarima,ets,prophet';
          resposta = '📅 Mostrando apenas modelos de séries temporais.';
        } else if (mensagemLower.includes('ml') || mensagemLower.includes('machine')) {
          acao = 'tipo:xgboost,random_forest';
          resposta = '🤖 Mostrando apenas modelos de Machine Learning.';
        } else if (mensagemLower.includes('actuarial')) {
          acao = 'tipo:glm_actuarial_duplo';
          resposta = '💰 Mostrando apenas modelos atuariais.';
        } else if (mensagemLower.includes('excelente') || mensagemLower.includes('melhor')) {
          acao = 'classificacao:EXCELENTE';
          resposta = '🏆 Mostrando apenas modelos com classificação EXCELENTE.';
        } else if (mensagemLower.includes('fraco') || mensagemLower.includes('pior')) {
          acao = 'classificacao:FRACA';
          resposta = '⚠️ Mostrando apenas modelos com classificação FRACA.';
        } else {
          resposta = '❓ Não entendi qual filtro aplicar.';
        }
      }
      else if (mensagemLower.includes('olá') || mensagemLower.includes('oi')) {
        resposta = '👋 Olá! Como posso ajudar?';
      } else {
        resposta = '🤔 Desculpe, não entendi. Você pode pedir:\n• "Mostrar modelos com anomalias"\n• "Filtrar por [tipo]"\n• "Mostrar modelos excelentes"';
      }

      setMensagens(prev => [...prev, { id: Date.now() + 1, tipo: 'bot', texto: resposta }]);
      setProcessando(false);

      if (acao) onFiltrar(acao);
    }, 1000);
  };

  const enviarMensagem = () => {
    if (!inputValue.trim()) return;
    processarMensagem(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') enviarMensagem();
  };

  return (
    <>
      <button
        onClick={() => setChatAberto(!chatAberto)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300"
      >
        {chatAberto ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {chatAberto && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6" />
                <div>
                  <h3 className="font-bold">Assistente IA</h3>
                  <p className="text-xs opacity-90">Consultas sobre modelos</p>
                </div>
              </div>
            </div>

            <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {mensagens.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      msg.tipo === 'usuario'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-none'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                    }`}
                  >
                    {msg.tipo === 'bot' && msg.opcoes ? (
                      <>
                        <p className="text-sm mb-2 whitespace-pre-line">{msg.texto}</p>
                        <div className="flex flex-wrap gap-2">
                          {msg.opcoes.map((opcao, idx) => (
                            <button
                              key={idx}
                              onClick={() => processarMensagem(opcao)}
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition"
                            >
                              {opcao}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm whitespace-pre-line">{msg.texto}</p>
                    )}
                  </div>
                </div>
              ))}
              {processando && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none">
                    <Loader className="w-5 h-5 animate-spin text-purple-600" />
                  </div>
                </div>
              )}
              <div ref={mensagensEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua pergunta..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  disabled={processando}
                />
                <button
                  onClick={enviarMensagem}
                  disabled={processando || !inputValue.trim()}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ============ FUNÇÕES AUXILIARES ============

const extrairTextoInsight = (insight) => {
  if (!insight) return '';
  if (typeof insight === 'string') return insight;
  if (typeof insight === 'object') {
    return insight.texto || insight.titulo || insight.mensagem || JSON.stringify(insight);
  }
  return String(insight);
};

const extrairTextoRecomendacao = (rec) => {
  if (!rec) return '';
  if (typeof rec === 'string') return rec;
  if (typeof rec === 'object') {
    return rec.acao || rec.titulo || rec.mensagem || JSON.stringify(rec);
  }
  return String(rec);
};

const mapearClassificacao = (pontuacao) => {
  if (pontuacao >= 0.8) return 'EXCELENTE';
  if (pontuacao >= 0.6) return 'BOA';
  if (pontuacao >= 0.4) return 'MODERADA';
  return 'FRACA';
};

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
  'regressao_logistica': '#F43F5E',
  'desconhecido': '#6B7280'
};

const CORES_CLASSIFICACAO = {
  'EXCELENTE': '#10B981',
  'BOA': '#3B82F6',
  'MODERADA': '#F59E0B',
  'FRACA': '#EF4444'
};

// ============ IA AVANÇADA ============

class AnalisadorIA {
  constructor() {
    this.baseConhecimento = {
      contextoAngola: {
        inflacao: {
          mediaHistorica: 25.3,
          volatilidade: 15.2,
          tendenciaAtual: 'alta',
          fatoresRelevantes: ['cambio', 'subsidios', 'precos-internacionais'],
          paradoxosConhecidos: [
            'alta-inflacao-com-kwanza-valorizado',
            'desconexao-cambio-paralelo-oficial'
          ]
        },
        cambio: {
          oficial: 900,
          paralelo: 950,
          spread: 50,
          volatilidade: 'alta'
        },
        contextoEconomico: 'desafios-estruturais'
      }
    };
  }

  analisarModelo(modelo, todosModelos = []) {
    try {
      if (!modelo) {
        return this._criarAnaliseVazia('Modelo não fornecido');
      }

      const dados = this._extrairDadosCompletos(modelo);
      const metricas = this._calcularMetricasAvancadas(dados);
      const anomalias = this._detectarAnomaliasCientificas(modelo, dados, metricas);
      const fraudes = this._detectarFraudesCientificas(modelo, dados, metricas, todosModelos);
      const paradoxos = this._detectarParadoxosContextuais(modelo, dados);
      const insights = this._gerarInsightsCientificos(modelo, dados, anomalias, fraudes, paradoxos);
      const recomendacoes = this._gerarRecomendacoesCientificas(modelo, dados, anomalias, fraudes, paradoxos);
      
      return {
        dados,
        metricas,
        anomalias,
        fraudes,
        paradoxos,
        insights,
        recomendacoes,
        pontuacao: this._calcularPontuacaoGeral(metricas, anomalias, fraudes, paradoxos, dados),
        nivelConfianca: this._calcularNivelConfianca(metricas, anomalias.length, fraudes.length, dados)
      };
    } catch (error) {
      console.error('Erro na análise IA:', error);
      return this._criarAnaliseVazia(`Erro: ${error.message}`);
    }
  }

  _criarAnaliseVazia(motivo) {
    return {
      dados: {},
      metricas: {},
      anomalias: [],
      fraudes: [],
      paradoxos: [],
      insights: [{
        tipo: 'info',
        nivel: 'informativo',
        titulo: 'ℹ️ ANÁLISE BÁSICA',
        descricao: `Análise simplificada: ${motivo || 'dados insuficientes'}.`
      }],
      recomendacoes: [{
        tipo: 'informativo',
        acao: '📋 RECOMENDAÇÕES GERAIS',
        itens: [
          '1. Verificar a estrutura dos dados do modelo',
          '2. Confirmar se as métricas foram calculadas corretamente',
          '3. Consultar a documentação do modelo'
        ],
        justificativa: 'Não foi possível realizar uma análise detalhada.'
      }],
      pontuacao: 0.5,
      nivelConfianca: 'moderado'
    };
  }

  _extrairDadosCompletos(modelo) {
    if (!modelo) return { metricas: {} };
    
    const resultado = modelo.resultado || {};
    const qualidade = resultado.qualidade || resultado.metrics || resultado.analise || {};
    const parametros = modelo.parametros || {};
    
    const metricas = this._extrairMetricasPorTipo(modelo.tipo, qualidade, resultado);
    
    let mape = 0;
    if (qualidade.MAPE !== undefined) mape = Number(qualidade.MAPE);
    else if (qualidade.mape !== undefined) mape = Number(qualidade.mape);
    else if (resultado.MAPE !== undefined) mape = Number(resultado.MAPE);
    else if (resultado.mape !== undefined) mape = Number(resultado.mape);
    else if (metricas.mape !== undefined) mape = Number(metricas.mape);
    
    let nObservacoes = 0;
    if (qualidade.n_observacoes !== undefined) nObservacoes = Number(qualidade.n_observacoes);
    else if (qualidade.n !== undefined) nObservacoes = Number(qualidade.n);
    else if (resultado.n_observacoes !== undefined) nObservacoes = Number(resultado.n_observacoes);
    else if (resultado.n !== undefined) nObservacoes = Number(resultado.n);
    else if (resultado.tamanho_amostra !== undefined) nObservacoes = Number(resultado.tamanho_amostra);
    else if (modelo.dados?.length) nObservacoes = modelo.dados.length;
    else if (parametros.dados?.length) nObservacoes = parametros.dados.length;
    
    return {
      tipo: modelo.tipo || 'desconhecido',
      nome: modelo.nome || 'Modelo sem nome',
      timestamp: modelo.timestamp || new Date().toISOString(),
      nObservacoes: isNaN(nObservacoes) ? 0 : nObservacoes,
      mape: isNaN(mape) ? 0 : mape,
      metricas: metricas,
      coeficientes: (resultado.coeficientes || []).map(c => ({
        termo: c.termo || c.name || 'variável',
        estimativa: Number(c.estimativa || c.estimate || 0),
        erro: Number(c.erro || c.std_error || 0),
        estatistica: Number(c.estatistica || c.t_value || 0),
        valor_p: Number(c.valor_p || c.p_value || 0)
      })),
      dadosOriginais: modelo.dadosOriginais || [],
      periodoAnalise: modelo.periodoAnalise || {},
      contexto: modelo.contexto || {},
      previsoes: resultado.previsoes || [],
      residuos: resultado.residuos || []
    };
  }

  _extrairMetricasPorTipo(tipo, qualidade, resultado) {
    const metricas = {};
    
    const safeNumber = (value) => {
      if (value === undefined || value === null || value === 'NA' || value === '') return 0;
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };
    
    const fontes = [qualidade, resultado];
    
    const mapeamentos = {
      r2: ['R2', 'r2', 'R_quadrado', 'r_quadrado'],
      r2Ajustado: ['R2ajustado', 'r2_ajustado', 'R2_ajustado'],
      rmse: ['RMSE', 'rmse', 'Raiz_erro_quadratico_medio'],
      mae: ['MAE', 'mae', 'Erro_absoluto_medio'],
      mse: ['MSE', 'mse', 'Erro_quadratico_medio'],
      aic: ['AIC', 'aic'],
      bic: ['BIC', 'bic'],
      accuracy: ['Accuracy', 'accuracy', 'Acurácia', 'acuracia'],
      precision: ['Precision', 'precision', 'Precisão', 'precisao'],
      recall: ['Recall', 'recall', 'Sensibilidade', 'sensibilidade'],
      f1: ['F1_Score', 'f1_score', 'F1'],
      auc: ['AUC', 'auc'],
      mape: ['MAPE', 'mape']
    };
    
    Object.entries(mapeamentos).forEach(([chave, nomes]) => {
      for (const fonte of fontes) {
        for (const nome of nomes) {
          if (fonte[nome] !== undefined && fonte[nome] !== null) {
            metricas[chave] = safeNumber(fonte[nome]);
            break;
          }
        }
        if (metricas[chave] !== undefined) break;
      }
    });
    
    return metricas;
  }

  _calcularMetricasAvancadas(dados) {
    const metricasAvancadas = {};
    
    if (!dados || !dados.tipo || dados.nObservacoes < 10) return metricasAvancadas;
    
    switch(dados.tipo) {
      case 'linear_simples':
      case 'linear_multipla':
        metricasAvancadas.vif = 1.0;
        metricasAvancadas.durbinWatson = 2.0;
        break;
      case 'regressao_logistica':
        metricasAvancadas.matrizConfusao = {};
        break;
      case 'arima':
      case 'sarima':
        metricasAvancadas.ljungBox = { p_valor: 0.5 };
        break;
    }
    
    return metricasAvancadas;
  }

  _detectarAnomaliasCientificas(modelo, dados, metricas) {
    const anomalias = [];
    
    if (!dados || dados.nObservacoes === 0) return anomalias;
    
    if (dados.nObservacoes < 30) {
      anomalias.push({
        tipo: 'dados_insuficientes',
        severidade: 'media',
        titulo: '📉 AMOSTRA LIMITADA',
        descricao: `O modelo utiliza ${dados.nObservacoes} observações. Amostras menores que 30 podem ter limitações estatísticas.`,
        evidencias: [`n = ${dados.nObservacoes} < 30`],
        recomendacao: 'Considere aumentar o tamanho da amostra se possível.'
      });
    }
    
    if (dados.mape > 0) {
      if (dados.mape > 50) {
        anomalias.push({
          tipo: 'mape_critico',
          severidade: 'alta',
          titulo: '📈 ERRO DE PREVISÃO ELEVADO',
          descricao: `MAPE de ${dados.mape.toFixed(1)}% está acima do recomendado.`,
          evidencias: [`MAPE = ${dados.mape.toFixed(1)}%`],
          recomendacao: 'Avalie a possibilidade de melhorar o modelo ou coletar mais dados.'
        });
      } else if (dados.mape > 20) {
        anomalias.push({
          tipo: 'mape_elevado',
          severidade: 'baixa',
          titulo: '⚠️ ATENÇÃO AO ERRO DE PREVISÃO',
          descricao: `MAPE de ${dados.mape.toFixed(1)}% é aceitável, mas pode ser melhorado.`,
          evidencias: [`MAPE = ${dados.mape.toFixed(1)}%`],
          recomendacao: 'Monitore a performance e considere ajustes se necessário.'
        });
      }
    }
    
    return anomalias;
  }

  _detectarFraudesCientificas(modelo, dados, metricas, todosModelos) {
    const fraudes = [];
    
    if (!dados || dados.nObservacoes === 0) return fraudes;
    
    if ((dados.metricas.accuracy === 1) || (dados.metricas.r2 === 1)) {
      fraudes.push({
        tipo: 'perfeicao_suspeita',
        severidade: 'media',
        titulo: '🔍 PERFORMANCE EXCEPCIONAL',
        descricao: 'O modelo apresenta performance perfeita, o que é incomum em dados reais.',
        evidencias: [
          dados.metricas.accuracy === 1 ? 'Acurácia = 100%' : 'R² = 1.0',
          'Verifique se não há vazamento de dados'
        ],
        recomendacao: 'Valide o modelo em dados completamente novos.'
      });
    }
    
    if (dados.mape < 3 && modelo.nome && modelo.nome.toLowerCase().includes('inflacao')) {
      fraudes.push({
        tipo: 'paradoxo_inflacao',
        severidade: 'baixa',
        titulo: '🇦🇴 MODELO DE INFLAÇÃO MUITO PRECISO',
        descricao: `MAPE de ${dados.mape.toFixed(1)}% é excepcionalmente baixo para inflação angolana.`,
        evidencias: [
          `MAPE = ${dados.mape.toFixed(1)}%`,
          'Volatilidade típica da inflação em Angola: 15-30%'
        ],
        recomendacao: 'Validar com walk-forward e testar em períodos de alta volatilidade.'
      });
    }
    
    return fraudes;
  }

  _detectarParadoxosContextuais(modelo, dados) {
    const paradoxos = [];
    
    if (!modelo || !dados || dados.nObservacoes < 10) return paradoxos;
    
    if (modelo.nome && modelo.nome.toLowerCase().includes('inflacao') && dados.nObservacoes > 20) {
      paradoxos.push({
        tipo: 'contextual',
        severidade: 'informativo',
        titulo: '🌍 CONTEXTO ECONÔMICO ANGOLANO',
        descricao: 'Considere o contexto econômico de Angola na interpretação dos resultados.',
        fatores: [
          'Dualidade cambial (oficial vs paralelo)',
          'Subsídios aos combustíveis',
          'Sazonalidade das datas de pagamento'
        ],
        recomendacao: 'Inclua variáveis contextuais para melhorar a robustez do modelo.'
      });
    }
    
    return paradoxos;
  }

  _gerarInsightsCientificos(modelo, dados, anomalias, fraudes, paradoxos) {
    const insights = [];
    
    if (!dados) return insights;
    
    if (dados.nObservacoes > 0) {
      let qualidade = 'regular';
      let cor = '📊';
      
      if (dados.mape > 0) {
        if (dados.mape < 5) {
          qualidade = 'excelente';
          cor = '🏆';
        } else if (dados.mape < 10) {
          qualidade = 'boa';
          cor = '📈';
        } else if (dados.mape < 20) {
          qualidade = 'moderada';
          cor = '📊';
        } else {
          qualidade = 'precisa de melhorias';
          cor = '⚠️';
        }
      }
      
      insights.push({
        tipo: 'qualidade',
        nivel: 'informativo',
        titulo: `${cor} QUALIDADE DO MODELO`,
        descricao: `Modelo com ${dados.nObservacoes} observações e MAPE de ${dados.mape > 0 ? dados.mape.toFixed(2) + '%' : 'não calculado'}. Qualidade ${qualidade}.`,
        metricas: {
          'Observações': dados.nObservacoes,
          'MAPE': dados.mape > 0 ? `${dados.mape.toFixed(2)}%` : 'N/A',
          'Tipo': dados.tipo || 'N/A'
        }
      });
    }
    
    if (anomalias.length > 0) {
      insights.push({
        tipo: 'alerta',
        nivel: 'informativo',
        titulo: '🔍 PONTOS DE ATENÇÃO',
        descricao: `Foram identificados ${anomalias.length} ponto(s) que merecem atenção.`,
        detalhes: anomalias.map(a => a.titulo)
      });
    }
    
    return insights;
  }

  _gerarRecomendacoesCientificas(modelo, dados, anomalias, fraudes, paradoxos) {
    const recomendacoes = [];
    
    if (!dados) return recomendacoes;
    
    if (dados.nObservacoes > 30 && dados.mape > 0 && dados.mape < 10) {
      recomendacoes.push({
        tipo: 'positivo',
        acao: '✅ RECOMENDAÇÃO PARA PRODUÇÃO',
        itens: [
          '✓ Modelo com boa performance e amostra adequada',
          '✓ Implementar monitoramento contínuo',
          '✓ Documentar os resultados para referência'
        ],
        justificativa: 'O modelo apresenta características adequadas para uso em produção, com monitoramento.'
      });
    } else if (dados.nObservacoes > 0) {
      recomendacoes.push({
        tipo: 'informativo',
        acao: '📋 RECOMENDAÇÕES DE MELHORIA',
        itens: [
          '• Validar o modelo em dados fora da amostra',
          '• Considerar técnicas de validação cruzada',
          '• Documentar limitações e pressupostos'
        ],
        justificativa: 'Recomendações para aumentar a robustez do modelo.'
      });
    }
    
    return recomendacoes;
  }

  _calcularPontuacaoGeral(metricas, anomalias, fraudes, paradoxos, dados) {
    let pontuacao = 0.6;
    
    if (!dados) return pontuacao;
    
    if (dados.nObservacoes > 100) pontuacao += 0.15;
    else if (dados.nObservacoes > 50) pontuacao += 0.1;
    else if (dados.nObservacoes > 30) pontuacao += 0.05;
    else if (dados.nObservacoes < 30 && dados.nObservacoes > 0) pontuacao -= 0.1;
    
    if (dados.mape > 0) {
      if (dados.mape < 5) pontuacao += 0.2;
      else if (dados.mape < 10) pontuacao += 0.1;
      else if (dados.mape > 20) pontuacao -= 0.1;
    }
    
    pontuacao -= anomalias.length * 0.05;
    pontuacao -= fraudes.length * 0.1;
    
    return Math.max(0.1, Math.min(1, pontuacao));
  }

  _calcularNivelConfianca(metricas, numAnomalias, numFraudes, dados) {
    if (!dados || dados.nObservacoes === 0) return 'baixo';
    
    if (dados.nObservacoes > 100 && dados.mape < 10 && numFraudes === 0) return 'excelente';
    if (dados.nObservacoes > 50 && dados.mape < 15 && numFraudes < 2) return 'bom';
    if (dados.nObservacoes > 30) return 'moderado';
    return 'baixo';
  }
}

const iaAnalisador = new AnalisadorIA();

const getSignificanciaLabel = (pValue) => {
  if (!pValue && pValue !== 0) return 'ns';
  if (pValue < 0.001) return '***';
  if (pValue < 0.01) return '**';
  if (pValue < 0.05) return '*';
  if (pValue < 0.1) return '.';
  return 'ns';
};

const prepararDadosParaRelatorio = (modelo) => {
  if (!modelo) return null;

  const resultado = modelo.resultado || modelo.dados || {};
  const tipo = modelo.tipo || 'desconhecido';
  const parametros = modelo.parametros || {};
  
  const dadosProcessados = {
    nome: modelo.nome || 'Modelo sem nome',
    tipo: tipo,
    classificacao: modelo.classificacao || 'MODERADA',
    pontuacao: modelo.pontuacao || 0.5,
    
    metricas: {
      r2: resultado.qualidade?.R2 || resultado.r2 || 0,
      r2Ajustado: resultado.qualidade?.R2ajustado || resultado.r2_ajustado || 0,
      rmse: resultado.qualidade?.RMSE || resultado.rmse || 0,
      mae: resultado.qualidade?.MAE || resultado.mae || 0,
      mse: resultado.qualidade?.MSE || resultado.mse || 0,
      aic: resultado.qualidade?.AIC || resultado.aic || 0,
      bic: resultado.qualidade?.BIC || resultado.bic || 0,
      fStatistic: resultado.qualidade?.F_statistic || resultado.f_statistic || 0,
      pValue: resultado.qualidade?.p_valor_global || resultado.p_value || 0,
      nObservacoes: resultado.qualidade?.n_observacoes || 0,
      accuracy: resultado.qualidade?.Accuracy || resultado.accuracy || 0,
      auc: resultado.qualidade?.AUC || resultado.auc || 0,
      mape: resultado.qualidade?.MAPE || resultado.mape || 0
    },
    
    coeficientes: [],
    
    equacao: resultado.equacao_estimada || '',
    
    intercepto: 0,
    coeficienteX: 0,
    nomeVariavelX: parametros.x || 'X',
    nomeVariavelY: parametros.y || 'Y',
    
    dadosGrafico: []
  };

  if (resultado.coeficientes && Array.isArray(resultado.coeficientes)) {
    dadosProcessados.coeficientes = resultado.coeficientes.map(coef => ({
      termo: coef.termo || coef.name || '',
      estimativa: coef.estimativa || coef.estimate || 0,
      erro: coef.erro || coef.std_error || 0,
      estatistica: coef.estatistica || coef.t_value || 0,
      valor_p: coef.valor_p || coef.p_value || 0,
      significancia: getSignificanciaLabel(coef.valor_p || coef.p_value || 0)
    }));
  }

  return dadosProcessados;
};

const selecionarRelatorioPorTipo = (modelo, dadosProcessados) => {
  const tipo = modelo.tipo || 'desconhecido';
  
  const props = {
    modelo: modelo,
    dadosCompletos: dadosProcessados
  };
  
  switch(tipo) {
    case 'linear_simples':
      return <RelatorioRegressaoSimples key="linear_simples" {...props} />;
    case 'linear_multipla':
      return <RelatorioRegressaoMultipla key="linear_multipla" {...props} />;
    case 'regressao_logistica':
    case 'logistica':
      return <RelatorioRegressaoLogistica key="regressao_logistica" {...props} />;
    case 'arima':
    case 'sarima':
    case 'ets':
    case 'prophet':
      return <RelatorioSeriesTemporais key={tipo} {...props} />;
    case 'random_forest':
    case 'xgboost':
      return <RelatorioML key={tipo} {...props} />;
    case 'glm_actuarial_duplo':
    case 'credibilidade_actuarial':
    case 'a_posteriori':
    case 'credibilidade':
      return <RelatorioActuarial key={tipo} {...props} />;
    case 'monte_carlo':
      return <RelatorioMonteCarlo key="monte_carlo" {...props} />;
    case 'markov':
    case 'markov_actuarial':
      return <RelatorioMarkov key="markov" {...props} />;
    case 'mortality_table':
    case 'tabua_mortalidade':
    case 'actuarial':
      return <RelatorioSegurosVida key="mortality" {...props} />;
    case 'spark':
    case 'hadoop':
    case 'streaming':
    case 'sql_distribuido':
    case 'big_data':
      if (modelo.nome?.toLowerCase().includes('spark')) {
        return <RelatorioBigData key="spark" {...props} />;
      }
      if (modelo.nome?.toLowerCase().includes('hadoop')) {
        return <RelatorioBigData key="hadoop" {...props} />;
      }
      if (modelo.nome?.toLowerCase().includes('streaming')) {
        return <RelatorioBigData key="streaming" {...props} />;
      }
      if (modelo.nome?.toLowerCase().includes('sql')) {
        return <RelatorioBigData key="sql" {...props} />;
      }
      return <RelatorioBigData key={tipo} {...props} />;
    case 'kmeans':
    case 'dbscan':
    case 'hierarchical':
    case 'gmm':
    case 'apriori':
    case 'fp_growth':
    case 'eclat':
    case 'decision_tree':
    case 'svm':
    case 'naive_bayes':
    case 'knn':
    case 'pca':
    case 'tsne':
    case 'umap':
    case 'isolation_forest':
    case 'lof':
    case 'one_class_svm':
    case 'data_mining':
      if (modelo.nome?.toLowerCase().includes('k-means') || modelo.nome?.toLowerCase().includes('kmeans')) {
        return <RelatorioDataMining key="kmeans" {...props} />;
      }
      if (modelo.nome?.toLowerCase().includes('apriori')) {
        return <RelatorioDataMining key="apriori" {...props} />;
      }
      if (modelo.nome?.toLowerCase().includes('árvore') || modelo.nome?.toLowerCase().includes('arvore')) {
        return <RelatorioDataMining key="decision_tree" {...props} />;
      }
      if (modelo.nome?.toLowerCase().includes('pca')) {
        return <RelatorioDataMining key="pca" {...props} />;
      }
      if (modelo.nome?.toLowerCase().includes('isolation')) {
        return <RelatorioDataMining key="isolation_forest" {...props} />;
      }
      return <RelatorioDataMining key={tipo} {...props} />;
    default:
      return <RelatorioGenerico key="generico" {...props} />;
  }
};

// ============ COMPONENTE PRINCIPAL ============

export default function Relatorios({ resultados = [], modelosSalvos = {}, dados = [], atividades = [] }) {
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroClassificacao, setFiltroClassificacao] = useState('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [pesquisa, setPesquisa] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('data');
  const [ordemCrescente, setOrdemCrescente] = useState(false);
  const [modelosAtivos, setModelosAtivos] = useState([]);
  const [modelosArquivados, setModelosArquivados] = useState([]);
  const [modelosComIA, setModelosComIA] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [relatorioDetalhado, setRelatorioDetalhado] = useState(null);
  const [dadosProcessadosRelatorio, setDadosProcessadosRelatorio] = useState(null);
  const [modelosAgrupados, setModelosAgrupados] = useState([]);
  const [agrupamentoAtivo, setAgrupamentoAtivo] = useState('nome');
  const [pastasExpandidas, setPastasExpandidas] = useState({});
  const [loading, setLoading] = useState(true);
  const [processandoAnalises, setProcessandoAnalises] = useState(false);
  const [filtroChat, setFiltroChat] = useState(null);
  const [modeloParaEliminar, setModeloParaEliminar] = useState(null);
  const [mostrarConfirmacaoExclusao, setMostrarConfirmacaoExclusao] = useState(false);
  const [usuarioId, setUsuarioId] = useState(null);

  // ============ INICIALIZAÇÃO ============

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId') || localStorage.getItem('jiam_usuario_id');
    if (storedUserId) {
      setUsuarioId(storedUserId);
    } else {
      const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('jiam_usuario_id', newUserId);
      setUsuarioId(newUserId);
    }
  }, []);

  useEffect(() => {
    if (usuarioId) {
      carregarModelosDoBackend();
    }
  }, [usuarioId]);

  useEffect(() => {
    if (filtroChat) {
      if (filtroChat.startsWith('tipo:')) {
        const tipos = filtroChat.substring(5).split(',');
        setFiltroTipo(tipos.length > 1 ? 'todos' : tipos[0]);
      } else if (filtroChat.startsWith('classificacao:')) {
        setFiltroClassificacao(filtroChat.substring(14));
      }
      setFiltroChat(null);
    }
  }, [filtroChat]);

  useEffect(() => {
    try {
      const expandidasSalvas = localStorage.getItem('jiam_pastas_expandidas');
      if (expandidasSalvas) {
        setPastasExpandidas(JSON.parse(expandidasSalvas));
      }
    } catch (error) {
      console.error('Erro ao carregar estado das pastas:', error);
    }
  }, []);

  // ============ FUNÇÕES PRINCIPAIS ============

  const carregarModelosDoBackend = async () => {
    setLoading(true);
    try {
      console.log('📥 Carregando modelos do backend...');
      
      const [ativosRes, arquivadosRes, statsRes] = await Promise.all([
        ModelosService.listarAtivos(),
        ModelosService.listarArquivados(),
        ModelosService.estatisticas()
      ]);
      
      if (ativosRes.success) {
        console.log(`✅ ${ativosRes.total} modelos ativos carregados`);
        setModelosAtivos(ativosRes.modelos || []);
        
        const modelosProcessados = (ativosRes.modelos || []).map(modelo => 
          analisarModeloComIA(modelo, ativosRes.modelos || [])
        );
        setModelosComIA(modelosProcessados);
        
        const stats = calcularEstatisticas(ativosRes.modelos || []);
        setEstatisticas(stats);
        
        const agrupados = agruparModelosInteligente(ativosRes.modelos || []);
        setModelosAgrupados(agrupados);
      }
      
      if (arquivadosRes.success) {
        console.log(`✅ ${arquivadosRes.total} modelos arquivados carregados`);
        setModelosArquivados(arquivadosRes.modelos || []);
      }
      
      if (statsRes.success) {
        console.log('✅ Estatísticas carregadas');
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar do backend:', error);
    } finally {
      setLoading(false);
    }
  };

  const processarAnalises = async () => {
    if (processandoAnalises) return;
    
    setProcessandoAnalises(true);
    console.log('📦 Processando novos resultados...');
    
    try {
      let salvos = 0;
      
      if (resultados && resultados.length > 0) {
        for (const resultado of resultados) {
          const res = await ModelosService.salvar(resultado);
          if (res.success) salvos++;
        }
      }
      
      if (modelosSalvos && Object.keys(modelosSalvos).length > 0) {
        for (const [nome, dados] of Object.entries(modelosSalvos)) {
          const res = await ModelosService.salvar({ nome, ...dados });
          if (res.success) salvos++;
        }
      }
      
      console.log(`✅ ${salvos} modelos salvos`);
      
      if (salvos > 0) {
        await carregarModelosDoBackend();
      }
      
    } catch (error) {
      console.error('❌ Erro no processamento:', error);
    } finally {
      setProcessandoAnalises(false);
    }
  };

  const analisarModeloComIA = (modelo, todosModelos) => {
    try {
      const analiseBase = analisarQualquerModelo({
        tipo: modelo.tipo,
        ...modelo.resultado
      }, modelo.parametros);
      
      const analiseIA = iaAnalisador.analisarModelo(modelo, todosModelos);
      
      return {
        ...modelo,
        analise: {
          ...analiseBase,
          ...analiseIA,
          insights: analiseIA.insights || [],
          recomendacoes: analiseIA.recomendacoes || []
        },
        classificacao: modelo.classificacao || mapearClassificacao(analiseIA.pontuacao || 0.5),
        pontuacao: modelo.pontuacao || analiseIA.pontuacao || 0.5,
        nivelConfianca: analiseIA.nivelConfianca || 'moderado',
        anomalias: analiseIA.anomalias || [],
        fraudes: analiseIA.fraudes || [],
        paradoxos: analiseIA.paradoxos || [],
        analiseIA
      };
    } catch (error) {
      console.error('Erro na análise IA:', error);
      return {
        ...modelo,
        analise: {
          classificacao: 'FRACA',
          pontuacao: 0.3,
          insights: [{ tipo: 'erro', nivel: 'critico', titulo: '❌ ERRO NA ANÁLISE IA', texto: error.message }],
          recomendacoes: []
        },
        classificacao: 'FRACA',
        pontuacao: 0.3,
        nivelConfianca: 'baixo',
        anomalias: [],
        fraudes: [],
        paradoxos: []
      };
    }
  };

  const arquivarModelo = async (modeloId) => {
    const result = await ModelosService.arquivar(modeloId);
    if (result.success) {
      await carregarModelosDoBackend();
    }
  };

  const restaurarModelo = async (modeloId) => {
    const result = await ModelosService.restaurar(modeloId);
    if (result.success) {
      await carregarModelosDoBackend();
    }
  };

  const eliminarPermanente = async (modeloId) => {
    const result = await ModelosService.eliminar(modeloId);
    if (result.success) {
      await carregarModelosDoBackend();
    }
    setModeloParaEliminar(null);
    setMostrarConfirmacaoExclusao(false);
  };

  const togglePasta = (nome) => {
    setPastasExpandidas(prev => {
      const novo = { ...prev, [nome]: !prev[nome] };
      localStorage.setItem('jiam_pastas_expandidas', JSON.stringify(novo));
      return novo;
    });
  };

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
        piorModelo: null,
        evolucaoTemporal: [],
        totalAnomalias: 0,
        totalFraudes: 0
      };
    }
    
    const porTipo = {};
    const porClassificacao = {};
    let somaPerformance = 0;
    let totalAnomalias = 0;
    let totalFraudes = 0;
    
    modelos.forEach((modelo) => {
      const tipo = modelo.tipo || 'desconhecido';
      porTipo[tipo] = (porTipo[tipo] || 0) + 1;
      
      const classificacao = modelo.classificacao || 'FRACA';
      porClassificacao[classificacao] = (porClassificacao[classificacao] || 0) + 1;
      
      somaPerformance += modelo.pontuacao || 0;
      totalAnomalias += modelo.anomalias?.length || 0;
      totalFraudes += modelo.fraudes?.length || 0;
    });
    
    const distribuicaoTipos = Object.entries(porTipo)
      .map(([tipo, count]) => ({
        tipo,
        count,
        percentual: ((count / modelos.length) * 100).toFixed(1),
        cor: CORES_MODELOS[tipo] || '#6B7280'
      }))
      .sort((a, b) => b.count - a.count);
    
    const distribuicaoClassificacao = Object.entries(porClassificacao)
      .map(([classificacao, count]) => ({
        classificacao,
        count,
        percentual: ((count / modelos.length) * 100).toFixed(1),
        cor: CORES_CLASSIFICACAO[classificacao] || '#6B7280'
      }));
    
    const modelosComPontuacao = modelos.filter(m => m.pontuacao !== undefined);
    const melhorModelo = modelosComPontuacao.length > 0 
      ? modelosComPontuacao.reduce((a, b) => (a.pontuacao > b.pontuacao ? a : b), modelosComPontuacao[0])
      : null;
    
    const piorModelo = modelosComPontuacao.length > 0
      ? modelosComPontuacao.reduce((a, b) => (a.pontuacao < b.pontuacao ? a : b), modelosComPontuacao[0])
      : null;
    
    const evolucaoTemporal = modelosComPontuacao
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(m => ({
        data: new Date(m.timestamp).toLocaleDateString('pt-BR'),
        pontuacao: m.pontuacao,
        tipo: m.tipo,
        nome: m.nome
      }));
    
    return {
      total: modelos.length,
      porTipo,
      porClassificacao,
      performanceMedia: Number((somaPerformance / modelos.length).toFixed(2)),
      tiposUnicos: Object.keys(porTipo),
      distribuicaoTipos,
      distribuicaoClassificacao,
      melhorModelo,
      piorModelo,
      evolucaoTemporal,
      totalAnomalias,
      totalFraudes
    };
  };

  const agruparModelosInteligente = (modelos) => {
    const gruposPorNome = {};
    
    modelos.forEach(modelo => {
      const nomeBase = modelo.nome?.toLowerCase().trim() || 'sem_nome';
      if (!gruposPorNome[nomeBase]) {
        gruposPorNome[nomeBase] = [];
      }
      gruposPorNome[nomeBase].push(modelo);
    });
    
    Object.keys(gruposPorNome).forEach(nome => {
      gruposPorNome[nome].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    });
    
    return Object.entries(gruposPorNome).map(([nome, modelos]) => ({
      nome: modelos[0]?.nome || nome,
      modelos,
      total: modelos.length,
      mediaPontuacao: Number((modelos.reduce((sum, m) => sum + (m.pontuacao || 0), 0) / modelos.length).toFixed(2)),
      tipos: [...new Set(modelos.map(m => m.tipo))],
      cor: modelos[0]?.tipo ? (CORES_MODELOS[modelos[0].tipo] || '#6B7280') : '#6B7280',
      periodo: {
        inicio: new Date(modelos[modelos.length - 1]?.timestamp).toLocaleDateString(),
        fim: new Date(modelos[0]?.timestamp).toLocaleDateString()
      },
      exibirComoPasta: modelos.length > 1
    })).sort((a, b) => b.total - a.total);
  };

  const modelosFiltrados = useMemo(() => {
    let modelosBase = filtroStatus === 'ativos' ? modelosAtivos : 
                      filtroStatus === 'arquivados' ? modelosArquivados : 
                      [...modelosAtivos, ...modelosArquivados];
    
    if (agrupamentoAtivo === 'nome') {
      return agruparModelosInteligente(modelosBase);
    }
    
    return modelosBase.filter(modelo => {
      if (filtroTipo !== 'todos' && modelo.tipo !== filtroTipo) return false;
      if (filtroClassificacao !== 'todos' && modelo.classificacao !== filtroClassificacao) return false;
      
      if (filtroPeriodo !== 'todos') {
        const data = new Date(modelo.timestamp);
        const hoje = new Date();
        const diff = hoje - data;
        const dias = diff / (1000 * 60 * 60 * 24);
        
        if (filtroPeriodo === 'hoje' && dias > 1) return false;
        if (filtroPeriodo === 'semana' && dias > 7) return false;
        if (filtroPeriodo === 'mes' && dias > 30) return false;
        if (filtroPeriodo === 'trimestre' && dias > 90) return false;
      }
      
      if (pesquisa) {
        const termo = pesquisa.toLowerCase();
        return (
          (modelo.nome && modelo.nome.toLowerCase().includes(termo)) ||
          (modelo.tipo && modelo.tipo.toLowerCase().includes(termo)) ||
          (modelo.classificacao && modelo.classificacao.toLowerCase().includes(termo)) ||
          modelo.anomalias?.some(a => a.titulo?.toLowerCase().includes(termo))
        );
      }
      
      return true;
    }).sort((a, b) => {
      const ordem = ordemCrescente ? 1 : -1;
      
      switch (ordenarPor) {
        case 'nome': return ordem * (a.nome || '').localeCompare(b.nome || '');
        case 'tipo': return ordem * (a.tipo || '').localeCompare(b.tipo || '');
        case 'classificacao':
          const ordemClass = { 'EXCELENTE': 4, 'BOA': 3, 'MODERADA': 2, 'FRACA': 1 };
          return ordem * ((ordemClass[a.classificacao] || 0) - (ordemClass[b.classificacao] || 0));
        case 'pontuacao': return ordem * ((a.pontuacao || 0) - (b.pontuacao || 0));
        default: return ordem * (new Date(b.timestamp) - new Date(a.timestamp));
      }
    });
  }, [modelosAtivos, modelosArquivados, filtroStatus, agrupamentoAtivo, filtroTipo, filtroClassificacao, filtroPeriodo, pesquisa, ordenarPor, ordemCrescente]);

const abrirRelatorioDetalhado = async (modelo) => {
  try {
    setLoading(true);
    
    // Buscar o modelo completo do MongoDB
    const response = await ModelosService.carregar(modelo.id);
    
    if (response.success) {
      const modeloCompleto = response.modelo;
      console.log('📦 Modelo completo carregado:', modeloCompleto);
      
      // Preparar dados para o relatório
      const dadosProcessados = prepararDadosParaRelatorio(modeloCompleto);
      
      setRelatorioDetalhado(modeloCompleto);
      setDadosProcessadosRelatorio(dadosProcessados);
    } else {
      console.error('❌ Erro ao carregar modelo:', response.error);
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    setLoading(false);
  }
};

  // ============ RENDERIZAÇÕES ============

  const renderPasta = (pasta) => {
    const expandida = pastasExpandidas[pasta.nome];
    
    return (
      <div key={pasta.nome} className="mb-4">
        <div 
          className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-all"
          onClick={() => togglePasta(pasta.nome)}
        >
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${pasta.cor}20` }}>
                {pasta.exibirComoPasta ? <FolderOpen className="w-6 h-6" style={{ color: pasta.cor }} /> : <FileText className="w-6 h-6" style={{ color: pasta.cor }} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-gray-800">{pasta.nome}</h4>
                  {pasta.exibirComoPasta && (
                    <Badge variant="info" className="ml-2">
                      <FolderOpen className="w-3 h-3 mr-1" />
                      {pasta.total} versões
                    </Badge>
                  )}
                  {pasta.tipos.length > 1 && (
                    <Badge variant="primary" className="ml-2">
                      {pasta.tipos.length} técnicas
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span>📅 {pasta.periodo.inicio} - {pasta.periodo.fim}</span>
                  <span>📊 Média: {pasta.mediaPontuacao}%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold" style={{ color: pasta.cor }}>{pasta.total}</div>
              {expandida ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>
          </div>
        </div>
        
        <AnimatePresence>
          {expandida && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pl-12 pr-4 overflow-hidden"
            >
              <div className="py-2 space-y-2">
                {pasta.modelos.map((modelo) => (
                  <div
                    key={modelo.id}
                    className="bg-gray-50 rounded-lg p-3 flex items-center justify-between hover:bg-gray-100 transition"
                  >
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => abrirRelatorioDetalhado(modelo)}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CORES_MODELOS[modelo.tipo] || '#888' }} />
                      <div>
                        <p className="font-medium text-gray-800">{modelo.nome}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{formatarDataSegura(modelo.timestamp)}</span>
                          <span>•</span>
                          <Badge variant={
                            modelo.classificacao === 'EXCELENTE' ? 'success' :
                            modelo.classificacao === 'BOA' ? 'primary' :
                            modelo.classificacao === 'MODERADA' ? 'warning' : 'danger'
                          } className="text-[10px] px-1.5 py-0">
                            {modelo.classificacao}
                          </Badge>
                          <span>•</span>
                          <span>{((modelo.pontuacao || 0) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      {filtroStatus !== 'arquivados' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); arquivarModelo(modelo.id); }}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          title="Arquivar modelo"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                      {filtroStatus === 'arquivados' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); restaurarModelo(modelo.id); }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Restaurar modelo"
                        >
                          <ArchiveRestore className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setModeloParaEliminar(modelo); setMostrarConfirmacaoExclusao(true); }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Eliminar permanentemente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderDashboard = () => {
    if (!estatisticas) return (
      <div className="text-center py-12">
        <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p className="mt-4 text-gray-600">Carregando estatísticas...</p>
      </div>
    );
    
    const { distribuicaoTipos = [], distribuicaoClassificacao = [], evolucaoTemporal = [] } = estatisticas;
    
    return (
      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6 rounded-2xl shadow-2xl relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total de Modelos</p>
                  <p className="text-5xl font-bold mt-3">{estatisticas.total || 0}</p>
                </div>
                <Database className="w-12 h-12 opacity-90" />
              </div>
              <div className="mt-4 text-xs opacity-80">
                {(estatisticas.tiposUnicos || []).length} técnicas
              </div>
            </div>
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full"></div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500 to-emerald-700 text-white p-6 rounded-2xl shadow-2xl relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Performance Média</p>
                  <p className="text-5xl font-bold mt-3">
                    {((estatisticas.performanceMedia || 0) * 100).toFixed(1)}%
                  </p>
                </div>
                <Brain className="w-12 h-12 opacity-90" />
              </div>
              <div className="mt-4 text-xs opacity-80">
                Classificação média
              </div>
            </div>
            <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full"></div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6 rounded-2xl shadow-2xl relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Excelência</p>
                  <p className="text-5xl font-bold mt-3">
                    {estatisticas.porClassificacao?.EXCELENTE || 0}
                  </p>
                </div>
                <Award className="w-12 h-12 opacity-90" />
              </div>
              <div className="mt-4 text-xs opacity-80">
                Modelos excepcionais
              </div>
            </div>
            <div className="absolute right-6 top-6 w-24 h-24 bg-white/10 rounded-full"></div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-red-500 to-orange-600 text-white p-6 rounded-2xl shadow-2xl relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Alertas IA</p>
                  <p className="text-5xl font-bold mt-3">
                    {(estatisticas.totalAnomalias || 0) + (estatisticas.totalFraudes || 0)}
                  </p>
                </div>
                <AlertTriangle className="w-12 h-12 opacity-90" />
              </div>
              <div className="mt-4 text-xs opacity-80">
                {estatisticas.totalAnomalias || 0} anomalias • {estatisticas.totalFraudes || 0} fraudes
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/10 rounded-full"></div>
          </motion.div>
        </div>

        {estatisticas.melhorModelo && estatisticas.piorModelo && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-200"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-500 rounded-xl">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-green-800 mb-1">🏆 Melhor Modelo</h4>
                  <p className="text-xl font-bold text-gray-800">{estatisticas.melhorModelo.nome}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="success">{estatisticas.melhorModelo.tipo}</Badge>
                    <Badge variant="success">{((estatisticas.melhorModelo.pontuacao || 0) * 100).toFixed(1)}%</Badge>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-2xl border-2 border-red-200"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-500 rounded-xl">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-red-800 mb-1">⚠️ Precisa de Atenção</h4>
                  <p className="text-xl font-bold text-gray-800">{estatisticas.piorModelo.nome}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="danger">{estatisticas.piorModelo.tipo}</Badge>
                    <Badge variant="danger">{((estatisticas.piorModelo.pontuacao || 0) * 100).toFixed(1)}%</Badge>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold text-[#0A1F44] mb-4">Distribuição por Técnica</h3>
            <div className="h-80">
              {distribuicaoTipos.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribuicaoTipos} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="tipo" width={120} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {distribuicaoTipos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Nenhum dado disponível
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold text-[#0A1F44] mb-4">Performance por Classificação</h3>
            <div className="h-80">
              {distribuicaoClassificacao.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribuicaoClassificacao}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="classificacao" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {distribuicaoClassificacao.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Nenhum dado disponível
                </div>
              )}
            </div>
          </div>
        </div>

        {evolucaoTemporal.length > 1 && (
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold text-[#0A1F44] mb-4">Evolução da Performance</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolucaoTemporal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis domain={[0, 1]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="pontuacao" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderModelos = () => (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Buscar modelos..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3"
          >
            <option value="todos">Todos</option>
            <option value="ativos">Ativos</option>
            <option value="arquivados">Arquivados</option>
          </select>
          
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3"
          >
            <option value="todos">Todos os tipos</option>
            {estatisticas?.tiposUnicos?.map(tipo => (
              <option key={tipo} value={tipo}>
                {tipo.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </option>
            ))}
          </select>
          
          <select
            value={filtroClassificacao}
            onChange={(e) => setFiltroClassificacao(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3"
          >
            <option value="todos">Todas classificações</option>
            {Object.keys(CORES_CLASSIFICACAO).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          
          <select
            value={filtroPeriodo}
            onChange={(e) => setFiltroPeriodo(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3"
          >
            <option value="todos">Todos os períodos</option>
            <option value="hoje">Hoje</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mês</option>
            <option value="trimestre">Este trimestre</option>
          </select>
        </div>
        
        <div className="flex flex-wrap items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Ordenar:</span>
            <select
              value={ordenarPor}
              onChange={(e) => setOrdenarPor(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-sm"
            >
              <option value="data">Data</option>
              <option value="nome">Nome</option>
              <option value="tipo">Tipo</option>
              <option value="classificacao">Classificação</option>
              <option value="pontuacao">Performance</option>
            </select>
            
            <button
              onClick={() => setOrdemCrescente(!ordemCrescente)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              {ordemCrescente ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            <button
              onClick={() => setAgrupamentoAtivo(agrupamentoAtivo === 'nome' ? 'normal' : 'nome')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                agrupamentoAtivo === 'nome' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              {agrupamentoAtivo === 'nome' ? 'Agrupado' : 'Normal'}
            </button>
          </div>
          
          <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
            <span className="font-bold">{modelosFiltrados.length}</span> de <span className="font-bold">
              {filtroStatus === 'ativos' ? modelosAtivos.length : 
               filtroStatus === 'arquivados' ? modelosArquivados.length : 
               modelosAtivos.length + modelosArquivados.length}
            </span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {agrupamentoAtivo === 'nome' ? (
          modelosFiltrados.map(pasta => renderPasta(pasta))
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {modelosFiltrados.map((modelo) => (
              <motion.div
                key={modelo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl shadow-xl border ${
                  modelo.dataArquivamento ? 'border-gray-300 bg-gray-50' : 'border-gray-100'
                } overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-3 h-3 rounded-full shadow-lg"
                          style={{ backgroundColor: CORES_MODELOS[modelo.tipo] || '#888' }}
                        />
                        <span className="text-xs font-medium text-gray-500">{modelo.tipo}</span>
                        {modelo.dataArquivamento && (
                          <Badge variant="outline" className="ml-2">
                            <Archive className="w-3 h-3 mr-1" />
                            Arquivado
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-[#0A1F44]">{modelo.nome}</h3>
                    </div>
                    
                    <div className="flex gap-1">
                      {!modelo.dataArquivamento && (
                        <button
                          onClick={() => arquivarModelo(modelo.id)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          title="Arquivar"
                        >
                          <Archive className="w-5 h-5" />
                        </button>
                      )}
                      {modelo.dataArquivamento && (
                        <button
                          onClick={() => restaurarModelo(modelo.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Restaurar"
                        >
                          <ArchiveRestore className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => { setModeloParaEliminar(modelo); setMostrarConfirmacaoExclusao(true); }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Performance</span>
                      <span className="font-bold" style={{ color: CORES_CLASSIFICACAO[modelo.classificacao] }}>
  {extrairMAPE(modelo)}
</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${(modelo.pontuacao || 0) * 100}%`,
                          backgroundColor: CORES_CLASSIFICACAO[modelo.classificacao]
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4 flex items-center gap-2">
                    <Badge variant={
                      modelo.classificacao === 'EXCELENTE' ? 'success' :
                      modelo.classificacao === 'BOA' ? 'primary' :
                      modelo.classificacao === 'MODERADA' ? 'warning' : 'danger'
                    }>
                      {modelo.classificacao}
                    </Badge>
                    {modelo.nivelConfianca && (
                      <Badge variant={
                        modelo.nivelConfianca === 'excelente' ? 'success' :
                        modelo.nivelConfianca === 'bom' ? 'primary' :
                        modelo.nivelConfianca === 'moderado' ? 'warning' : 'danger'
                      }>
                        Confiança: {modelo.nivelConfianca}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => abrirRelatorioDetalhado(modelo)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-xl transition font-medium flex items-center justify-center gap-2 shadow-md"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Análise
                    </button>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
  <ClockIcon className="w-3 h-3" />
  {formatarDataSegura(modelo.timestamp)}
</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderRelatorioDetalhado = () => {
    if (!relatorioDetalhado || !dadosProcessadosRelatorio) return null;
    
    return (
      <AnimatePresence>
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto"
          onClick={() => setRelatorioDetalhado(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-3xl max-w-7xl w-full max-h-[95vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#0A1F44] to-[#1a3a6e] text-white p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <img src="/logojiam.png" alt="JIAM" className="w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">JIAM Preditivo</h2>
                    <p className="text-sm opacity-90">Relatório com IA</p>
                  </div>
                </div>
                <button
                  onClick={() => setRelatorioDetalhado(null)}
                  className="text-white hover:text-gray-300 text-2xl bg-white/20 p-2 rounded-full hover:bg-white/30 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-180px)]">
              {selecionarRelatorioPorTipo(relatorioDetalhado, dadosProcessadosRelatorio)}
            </div>
          </div>
        </div>
      </AnimatePresence>
    );
  };

  const renderModalConfirmacaoExclusao = () => {
    if (!mostrarConfirmacaoExclusao || !modeloParaEliminar) return null;
    
    return (
      <AnimatePresence>
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]"
          onClick={() => setMostrarConfirmacaoExclusao(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Confirmar Exclusão</h3>
              <p className="text-gray-600">
                Tem certeza que deseja eliminar o modelo <span className="font-bold">{modeloParaEliminar.nome}</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => eliminarPermanente(modeloParaEliminar.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl transition font-medium"
              >
                Sim, Eliminar
              </button>
              <button
                onClick={() => setMostrarConfirmacaoExclusao(false)}
                className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-50 transition font-medium"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  };

  // ============ RENDER PRINCIPAL ============

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="relative">
          <div className="w-32 h-32 border-4 border-blue-100 rounded-full"></div>
          <div className="absolute top-0 left-0 w-32 h-32 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h3 className="mt-8 text-2xl font-bold text-gray-800">JIAM Preditivo</h3>
        <p className="mt-2 text-gray-600">Carregando modelos...</p>
      </div>
    );
  }

  if (modelosAtivos.length === 0 && modelosArquivados.length === 0 && !processandoAnalises) {
    return (
      <div className="text-center py-24">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-8">
          <img src="/logojiam.png" alt="JIAM" className="w-12 h-12" />
        </div>
        <h3 className="text-3xl font-bold text-gray-800 mb-4">JIAM Preditivo</h3>
        <p className="text-gray-600 max-w-2xl mx-auto mb-10 text-lg">
          Nenhum modelo encontrado.
        </p>
        <button
          onClick={processarAnalises}
          className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all"
        >
          <RefreshCw className="w-5 h-5" />
          Verificar Novos Modelos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#0A1F44] via-[#1a3a6e] to-[#0A1F44] rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <img src="/logojiam.png" alt="JIAM" className="w-16 h-16" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">JIAM Preditivo</h1>
                <p className="text-lg opacity-90">
                  Inteligência Artificial para Modelos Preditivos
                </p>
                {usuarioId && (
                  <p className="text-xs opacity-70 mt-1">
                    ID: {usuarioId.substring(0, 8)}...
                  </p>
                )}
              </div>
            </div>
            
            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm min-w-[250px]">
              <div className="flex items-center gap-3 mb-3">
                <Brain className="w-5 h-5 text-purple-300" />
                <span className="text-sm font-medium">IA Ativa</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-auto"></div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{modelosAtivos.length}</div>
                <div className="text-xs opacity-80 mt-1">Modelos Ativos</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setAbaAtiva('dashboard')}
            className={`flex-1 py-4 font-bold text-lg flex items-center justify-center gap-2 transition-all ${
              abaAtiva === 'dashboard'
                ? 'border-b-2 border-[#0A1F44] text-[#0A1F44] bg-gradient-to-b from-white to-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => setAbaAtiva('modelos')}
            className={`flex-1 py-4 font-bold text-lg flex items-center justify-center gap-2 transition-all ${
              abaAtiva === 'modelos'
                ? 'border-b-2 border-[#0A1F44] text-[#0A1F44] bg-gradient-to-b from-white to-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Layers className="w-5 h-5" />
            Modelos ({modelosAtivos.length} ativos • {modelosArquivados.length} arquivados)
          </button>
        </div>

        <div className="p-6">
          {abaAtiva === 'dashboard' && renderDashboard()}
          {abaAtiva === 'modelos' && renderModelos()}
        </div>
      </div>

      {renderRelatorioDetalhado()}
      {renderModalConfirmacaoExclusao()}

      <ChatbotModelos 
        modelosAnalisados={[...modelosAtivos, ...modelosArquivados]} 
        onFiltrar={(filtro) => {
          if (filtro.startsWith('tipo:')) setFiltroTipo(filtro.substring(5));
          else if (filtro.startsWith('classificacao:')) setFiltroClassificacao(filtro.substring(14));
          else if (filtro === 'anomalias') setPesquisa('anomalia');
          setAbaAtiva('modelos');
        }}
      />
    </div>
  );
}