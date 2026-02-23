// src/components/Dashboard/Actuarial/SegurosVida.jsx - VERSÃO CORRIGIDA COM ENVIO AOS RELATÓRIOS
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Send, CheckCircle, AlertTriangle, Cpu, Heart, 
  Activity, TrendingUp, RefreshCw, Play, Minimize2, Maximize2,
  Filter, Layers, Zap, Brain, Info, Eye, EyeOff, Settings,
  Download, FileJson, FileText, BarChart3, LineChart,
  GitBranch, Users, DollarSign, Percent, Calendar, Shield,
  PieChart as PieChartIcon, Database, Table as TableIcon,
  ChevronDown, ChevronUp, BookOpen, Award, Target, TrendingDown,
  User, MapPin
} from 'lucide-react';

// Importar o Context
import { useGLMModels } from '../../../contexts/GLMModelsContext';

// Importar API e Services
import api from '../../../services/api';
import ModelosService from '../../../services/modelosService';

// Componentes UI
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import Button from '../componentes/Button';
import Badge from '../componentes/Badge';
import Tabs from '../componentes/Tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ComposedChart, Line, Area, AreaChart,
  PieChart, Pie, Cell, ScatterChart, Scatter
} from 'recharts';

// Utilitário de extração de dados
import { extrairDadosArray, extrairInfoDados } from './utils/dataExtractor';

const CORES = {
  masculino: '#3b82f6',
  feminino: '#ec4899',
  unisex: '#8b5cf6',
  qx: '#f97316',
  lx: '#3b82f6',
  ex: '#10b981',
  premio: '#8b5cf6',
  reserva: '#f59e0b',
  mortalidade: '#ef4444',
  sobrevivencia: '#3b82f6',
  expectativa: '#10b981'
};

const CORES_ARRAY = ['#3b82f6', '#ec4899', '#8b5cf6', '#f97316', '#10b981', '#f59e0b', '#ef4444'];

const BASES_MORTALIDADE = [
  { id: 'BR-EMS-2020', nome: 'BR-EMS 2020', pais: 'Brasil', ano: 2020, 
    descricao: 'Experiência do Mercado Segurador Brasileiro - SUSEP',
    fonte: 'Superintendência de Seguros Privados' },
  { id: 'AT-2000', nome: 'AT-2000', pais: 'EUA', ano: 2000, 
    descricao: 'Annuity 2000 Mortality Table',
    fonte: 'Society of Actuaries' },
  { id: 'CSO-2017', nome: 'CSO 2017', pais: 'EUA', ano: 2017, 
    descricao: 'Commissioners Standard Ordinary',
    fonte: 'American Academy of Actuaries' },
  { id: 'GAM-94', nome: 'GAM-94', pais: 'EUA', ano: 1994, 
    descricao: 'Group Annuity Mortality',
    fonte: 'Society of Actuaries' },
  { id: 'UP-94', nome: 'UP-94', pais: 'Internacional', ano: 1994, 
    descricao: 'Unisex Pension 1994',
    fonte: 'Society of Actuaries' },
  { id: 'IBGE-2022', nome: 'IBGE 2022', pais: 'Brasil', ano: 2022, 
    descricao: 'Tábua Completa de Mortalidade - IBGE',
    fonte: 'Instituto Brasileiro de Geografia e Estatística' }
];

const SEXOS = [
  { id: 'unisex', nome: 'Unissex', icone: '👥', cor: CORES.unisex },
  { id: 'masculino', nome: 'Masculino', icone: '👨', cor: CORES.masculino },
  { id: 'feminino', nome: 'Feminino', icone: '👩', cor: CORES.feminino }
];

export default function SegurosVida({ 
  dados,
  statusSistema,
  resultadoTabua: resultadoExterno,
  criarTabuaMortalidade: criarTabuaProp,
  onVoltar,
  onResultadoModelo,
  modeloFrequencia: modeloFrequenciaProps,
  modeloSeveridade: modeloSeveridadeProps
}) {
  // Contexto GLM
  const contextGLM = useGLMModels();
  const modeloFrequencia = contextGLM.frequencia || modeloFrequenciaProps;
  const modeloSeveridade = contextGLM.severidade || modeloSeveridadeProps;

  // ============================================
  // ESTADOS PRINCIPAIS
  // ============================================
  const [config, setConfig] = useState({
    base_mortalidade: 'BR-EMS-2020',
    idade_min: 20,
    idade_max: 100,
    sexo: 'unisex',
    l0: 100000,
    qx_adjust: 1.0,
    juros: 0.03,
    inflacao: 0.04,
    capital_segurado: 100000,
    prazo: 20,
    carregamento_despesas: 0.25,
    carregamento_lucro: 0.08,
    carregamento_impostos: 0.02
  });

  const [infoDados, setInfoDados] = useState({ linhas: 0, colunas: 0, variaveis: [], temDados: false });
  const [variaveisSelecionadas, setVariaveisSelecionadas] = useState([]);
  const [variavelIdade, setVariavelIdade] = useState('');
  const [variavelSexo, setVariavelSexo] = useState('');
  const [variavelLocalizacao, setVariavelLocalizacao] = useState('');
  const [dadosProcessados, setDadosProcessados] = useState([]);
  
  const [executando, setExecutando] = useState(false);
  const [resultado, setResultado] = useState(resultadoExterno || null);
  const [resultadoRaw, setResultadoRaw] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [enviadoAoDashboard, setEnviadoAoDashboard] = useState(false);
  const [modoDebug, setModoDebug] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Estados processados
  const [tabuaProcessada, setTabuaProcessada] = useState([]);
  const [idades, setIdades] = useState([]);
  const [qx, setQx] = useState([]);
  const [lx, setLx] = useState([]);
  const [ex, setEx] = useState([]);
  const [dx, setDx] = useState([]);
  const [Lx, setLxArray] = useState([]);
  const [Tx, setTx] = useState([]);
  
  // Estatísticas dos dados reais
  const [estatisticasDados, setEstatisticasDados] = useState({
    mediaIdade: 0,
    medianaIdade: 0,
    distribuicaoSexo: {},
    distribuicaoLocalizacao: {}
  });
  
  // Visualização
  const [abaAtiva, setAbaAtiva] = useState('tabua');
  const [idadeSelecionada, setIdadeSelecionada] = useState(30);
  const [calculos, setCalculos] = useState(null);
  const [projecoes, setProjecoes] = useState([]);
  const [exportando, setExportando] = useState(false);
  const [mostrarInsights, setMostrarInsights] = useState(true);
  const [estatisticas, setEstatisticas] = useState(null);
  const [premiosExemplo, setPremiosExemplo] = useState(null);

  // ============================================
  // FUNÇÕES DE UTILIDADE PARA O DASHBOARD
  // ============================================
  
  /**
   * 🔥 CALCULAR CLASSIFICAÇÃO DA TÁBUA (QUALIDADE)
   * Baseado em métricas atuariais
   */
  const calcularClassificacao = (dadosTabua, estatisticasDados) => {
    if (!dadosTabua || !dadosTabua.tabua || dadosTabua.tabua.length === 0) {
      return "MODERADA"; // Default
    }
    
    const tabua = dadosTabua.tabua;
    const ex0 = tabua[0]?.ex || 0;
    const qx0 = tabua[0]?.qx || 0;
    const qx60 = tabua.find(item => item.idade === 60)?.qx || 0.01;
    
    // Critérios de qualidade atuarial
    const expectativaVidaAdequada = ex0 > 65 && ex0 < 85; // Faixa razoável
    const mortalidadeInfantilBaixa = qx0 < 0.02; // < 2%
    const mortalidade60Razoavel = qx60 > 0.001 && qx60 < 0.05;
    const dadosConsistentes = tabua.length > 50; // Cobre todas as idades
    
    // Pontuação
    let pontuacao = 0;
    if (expectativaVidaAdequada) pontuacao += 3;
    if (mortalidadeInfantilBaixa) pontuacao += 2;
    if (mortalidade60Razoavel) pontuacao += 2;
    if (dadosConsistentes) pontuacao += 3;
    
    // Ajuste baseado nos dados reais
    if (estatisticasDados?.mediaIdade > 0) {
      const diferencaMedia = Math.abs(estatisticasDados.mediaIdade - 35);
      if (diferencaMedia < 5) pontuacao += 2;
      else if (diferencaMedia < 10) pontuacao += 1;
    }
    
    // Classificação
    if (pontuacao >= 8) return "EXCELENTE";
    if (pontuacao >= 6) return "BOA";
    if (pontuacao >= 4) return "MODERADA";
    if (pontuacao >= 2) return "BAIXA";
    return "MUITO BAIXA";
  };

  /**
   * 🔥 EXTRAIR MÉTRICAS DA TÁBUA
   * Padronizado para o dashboard
   */
  const extrairMetrics = (dadosTabua) => {
    if (!dadosTabua || !dadosTabua.tabua || dadosTabua.tabua.length === 0) {
      return {};
    }
    
    const tabua = dadosTabua.tabua;
    const ex0 = tabua[0]?.ex || 0;
    const qx0 = tabua[0]?.qx || 0;
    const lxMax = Math.max(...tabua.map(item => item.lx || 0));
    const qxMedio = tabua.reduce((acc, item) => acc + (item.qx || 0), 0) / tabua.length;
    
    // Calcular expectativa de vida aos 60
    const item60 = tabua.find(item => item.idade === 60);
    const ex60 = item60?.ex || 0;
    
    // Taxa de mortalidade aos 60 (‰)
    const qx60 = item60?.qx || 0;
    
    // Proporção que atinge 80 anos
    const item80 = tabua.find(item => item.idade === 80);
    const lx80 = item80?.lx || 0;
    const proporcao80 = lxMax > 0 ? lx80 / lxMax : 0;
    
    return {
      expectativa_vida_nascer: ex0.toFixed(2),
      expectativa_vida_60: ex60.toFixed(2),
      mortalidade_infantil_por_mil: (qx0 * 1000).toFixed(2),
      mortalidade_60_por_mil: (qx60 * 1000).toFixed(2),
      qx_medio_por_mil: (qxMedio * 1000).toFixed(2),
      proporcao_sobreviventes_80: (proporcao80 * 100).toFixed(1),
      idades_cobertas: tabua.length,
      idade_maxima: Math.max(...tabua.map(item => item.idade || 0)),
      qualidade_ajuste: dadosTabua.qualidade_ajuste || 0.85,
      ...dadosTabua.estatisticas
    };
  };

  /**
   * 🔥 SALVAR RESULTADO NO DASHBOARD E MONGODB
   * Versão melhorada baseada no RandomForest
   */
  const salvarResultadoNoDashboard = useCallback(async (dadosAnalise, configAtual) => {
    if (!onResultadoModelo) return;
    
    try {
      const base = BASES_MORTALIDADE.find(b => b.id === configAtual.base_mortalidade);
      const sexo = SEXOS.find(s => s.id === configAtual.sexo);
      
      // Calcular métricas e classificação
      const metrics = extrairMetrics(dadosAnalise);
      const classificacao = calcularClassificacao(dadosAnalise, estatisticasDados);
      
      // Calcular expectativa de vida (e₀)
      const expectativaVida = ex.length > 0 && !isNaN(ex[0]) ? ex[0] : 0;
      
      // Preparar objeto para o dashboard (mesmo padrão do RandomForest)
      const dadosParaDashboard = {
        nome: `Tábua de Mortalidade - ${base?.nome || configAtual.base_mortalidade} (${sexo?.nome})`,
        tipo: "actuarial",
        subtipo: "mortality_table",
        categoria: "atuarial", // 🔥 IMPORTANTE: mesma categoria
        dados: dadosAnalise,
        parametros: {
          ...configAtual,
          variaveis_usadas: {
            idade: variavelIdade,
            sexo: variavelSexo,
            localizacao: variavelLocalizacao
          },
          estatisticas_dados: estatisticasDados,
          base_usada: base,
          sexo_usado: sexo
        },
        metricas: {
          idade_min: configAtual.idade_min,
          idade_max: configAtual.idade_max,
          expectativa_vida: expectativaVida.toFixed(2),
          qx_medio: (qx.reduce((a, b) => a + b, 0) / qx.length * 1000).toFixed(2),
          sobreviventes_finais: lx[lx.length-1] || 0,
          premio_base: formatarMoeda(calculos?.premio_comercial || 0),
          media_idade_dados: estatisticasDados.mediaIdade.toFixed(1)
        },
        // 🔥 Campos obrigatórios para o dashboard (padrão RandomForest)
        classificacao: classificacao,
        timestamp: new Date().toISOString(),
        idadeSelecionada: idadeSelecionada,
        metrics: metrics, // Métricas detalhadas
        qualidade: {
          pontuacao: classificacao === "EXCELENTE" ? 9 : 
                     classificacao === "BOA" ? 7 : 
                     classificacao === "MODERADA" ? 5 : 
                     classificacao === "BAIXA" ? 3 : 1,
          expectativa_vida: expectativaVida,
          cobertura_idades: tabuaProcessada.length,
          usa_dados_reais: variavelIdade ? true : false,
          ...dadosAnalise.qualidade
        },
        resumo: `${configAtual.idade_min}-${configAtual.idade_max} anos • ${expectativaVida.toFixed(1)} anos expectativa • Média dados: ${estatisticasDados.mediaIdade.toFixed(1)} anos • Prêmio: ${formatarMoeda(calculos?.premio_comercial || 0)}`
      };

      console.log('📤 Enviando para relatórios:', {
        nome: dadosParaDashboard.nome,
        classificacao,
        expectativaVida
      });

      // 1. Enviar para o dashboard (via props)
      onResultadoModelo(dadosParaDashboard);
      
      // 2. 🔥 SALVAR NO MONGODB via ModelosService (igual ao RandomForest)
      console.log('💾 Salvando modelo atuarial no MongoDB...');
      try {
        const salvo = await ModelosService.salvar({
          nome: dadosParaDashboard.nome,
          tipo: "actuarial",
          subtipo: "mortality_table",
          resultado: dadosAnalise,
          parametros: dadosParaDashboard.parametros,
          metricas: dadosParaDashboard.metricas,
          classificacao: classificacao,
          qualidade: dadosParaDashboard.qualidade,
          timestamp: dadosParaDashboard.timestamp,
          categoria: "atuarial"
        });
        
        if (salvo && salvo.success) {
          console.log('✅ Modelo atuarial salvo no MongoDB com ID:', salvo.id);
        } else {
          console.warn('⚠️ Resposta do MongoDB:', salvo);
        }
      } catch (mongoError) {
        console.error('❌ Erro ao salvar no MongoDB:', mongoError);
        // Não interrompe o fluxo principal
      }
      
      setEnviadoAoDashboard(true);
      toast.success(`📊 Resultados enviados para Relatórios (${classificacao})`);
      
      return true;
    } catch (error) {
      console.error('Erro ao enviar para dashboard:', error);
      toast.error('❌ Erro ao enviar resultados');
      return false;
    }
  }, [onResultadoModelo, ex, lx, qx, calculos, estatisticasDados, variavelIdade, variavelSexo, variavelLocalizacao, idadeSelecionada, tabuaProcessada]);

  // ============================================
  // PROCESSAR DADOS REAIS
  // ============================================
  useEffect(() => {
    if (dados) {
      const dadosArray = extrairDadosArray(dados);
      const info = extrairInfoDados(dados);
      
      setInfoDados(info);
      setDadosProcessados(dadosArray);
      
      // Detectar possíveis variáveis de idade
      const possiveisIdade = info.variaveis.filter(v => 
        v.toLowerCase().includes('idade') || 
        v.toLowerCase().includes('anos') || 
        v.toLowerCase().includes('age')
      );
      
      // Detectar possíveis variáveis de sexo
      const possiveisSexo = info.variaveis.filter(v => 
        v.toLowerCase().includes('sexo') || 
        v.toLowerCase().includes('genero') || 
        v.toLowerCase().includes('gender')
      );
      
      // Detectar possíveis variáveis de localização
      const possiveisLocalizacao = info.variaveis.filter(v => 
        v.toLowerCase().includes('local') || 
        v.toLowerCase().includes('cidade') || 
        v.toLowerCase().includes('estado') || 
        v.toLowerCase().includes('uf') ||
        v.toLowerCase().includes('regiao')
      );
      
      if (possiveisIdade.length > 0) {
        setVariavelIdade(possiveisIdade[0]);
      }
      
      if (possiveisSexo.length > 0) {
        setVariavelSexo(possiveisSexo[0]);
      }
      
      if (possiveisLocalizacao.length > 0) {
        setVariavelLocalizacao(possiveisLocalizacao[0]);
      }
      
      // Calcular estatísticas dos dados
      if (dadosArray.length > 0) {
        // Estatísticas de idade
        if (possiveisIdade.length > 0) {
          const idadesReais = dadosArray
            .map(item => parseFloat(item[possiveisIdade[0]]))
            .filter(v => !isNaN(v) && v > 0);
          
          if (idadesReais.length > 0) {
            const media = idadesReais.reduce((a, b) => a + b, 0) / idadesReais.length;
            const sorted = [...idadesReais].sort((a, b) => a - b);
            const mediana = sorted[Math.floor(sorted.length / 2)];
            
            setEstatisticasDados(prev => ({
              ...prev,
              mediaIdade: media,
              medianaIdade: mediana
            }));
          }
        }
        
        // Distribuição por sexo
        if (possiveisSexo.length > 0) {
          const sexos = {};
          dadosArray.forEach(item => {
            const valor = item[possiveisSexo[0]];
            if (valor) {
              sexos[valor] = (sexos[valor] || 0) + 1;
            }
          });
          setEstatisticasDados(prev => ({
            ...prev,
            distribuicaoSexo: sexos
          }));
        }
        
        // Distribuição por localização
        if (possiveisLocalizacao.length > 0) {
          const locs = {};
          dadosArray.forEach(item => {
            const valor = item[possiveisLocalizacao[0]];
            if (valor) {
              locs[valor] = (locs[valor] || 0) + 1;
            }
          });
          setEstatisticasDados(prev => ({
            ...prev,
            distribuicaoLocalizacao: locs
          }));
        }
      }
      
      console.log('📊 Dados carregados no SegurosVida:', {
        info,
        estatisticas: estatisticasDados,
        possiveisIdade,
        possiveisSexo,
        possiveisLocalizacao
      });
    }
  }, [dados]);

  // Processar resultado externo
  useEffect(() => {
    if (resultadoExterno && resultadoExterno.success) {
      processarResultado(resultadoExterno);
    }
  }, [resultadoExterno]);

  // Processar resultado interno
  useEffect(() => {
    if (resultado && resultado.success) {
      processarResultado(resultado);
    }
  }, [resultado]);

  // ============================================
  // EFEITO PARA CALCULAR PRÊMIOS QUANDO IDADE MUDAR
  // ============================================
  useEffect(() => {
    if (tabuaProcessada.length > 0 && idades.length > 0 && idadeSelecionada) {
      console.log('🔄 Idade selecionada mudou para:', idadeSelecionada);
      calcularPremios(idadeSelecionada);
      gerarProjecoes();
    }
  }, [idadeSelecionada, tabuaProcessada, config, idades]);

  // ============================================
  // FUNÇÕES DE UTILIDADE
  // ============================================
  const handleToggleVariavel = (variavel) => {
    if (variaveisSelecionadas.includes(variavel)) {
      setVariaveisSelecionadas(variaveisSelecionadas.filter(v => v !== variavel));
    } else {
      setVariaveisSelecionadas([...variaveisSelecionadas, variavel]);
    }
  };

  const handleParamChange = (paramId, value) => {
    setConfig(prev => ({
      ...prev,
      [paramId]: value
    }));
  };

  const formatarMoeda = (valor) => {
    if (!valor || isNaN(valor)) return 'Kz 0';
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor).replace('AOA', 'Kz');
  };

  const formatarNumero = (valor, casas = 2) => {
    if (valor === undefined || valor === null || isNaN(valor)) return '0';
    if (typeof valor === 'number') return valor.toFixed(casas);
    if (typeof valor === 'string') {
      const num = parseFloat(valor);
      return isNaN(num) ? '0' : num.toFixed(casas);
    }
    return '0';
  };

  const formatarPercentual = (valor, casas = 1) => {
    if (!valor || isNaN(valor)) return '0%';
    return `${(valor * 100).toFixed(casas)}%`;
  };

  // ============================================
  // PROCESSAR RESULTADO DO R - VERSÃO CORRIGIDA
  // ============================================
  const processarResultado = (dadosR) => {
    console.log('🔍 Processando resultado da tábua:', dadosR);

    const dadosTabua = dadosR.resultado || dadosR;
    
    console.log('📊 Dados da tábua:', dadosTabua);

    if (dadosTabua.tabua && Array.isArray(dadosTabua.tabua) && dadosTabua.tabua.length > 0) {
      const tabua = dadosTabua.tabua;
      console.log('✅ Tábua encontrada com', tabua.length, 'idades');
      console.log('✅ Primeiro item:', tabua[0]);
      
      // Extrair arrays
      const idadesArray = tabua.map(item => Number(item.idade) || 0);
      const qxArray = tabua.map(item => Number(item.qx) || 0);
      const lxArray = tabua.map(item => Number(item.lx) || 0);
      const exArray = tabua.map(item => Number(item.ex) || 0);
      const dxArray = tabua.map(item => Number(item.dx) || 0);
      const LxArray = tabua.map(item => Number(item.Lx) || 0);
      const TxArray = tabua.map(item => Number(item.Tx) || 0);
      
      console.log('📊 Primeiros valores:', {
        idade: idadesArray[0],
        qx: qxArray[0],
        lx: lxArray[0],
        ex: exArray[0],
        e0: exArray[0]
      });
      
      // ATUALIZAR TODOS OS ESTADOS
      setTabuaProcessada(tabua);
      setIdades(idadesArray);
      setQx(qxArray);
      setLx(lxArray);
      setEx(exArray);
      setDx(dxArray);
      setLxArray(LxArray);
      setTx(TxArray);
      
      // Guardar estatísticas
      if (dadosTabua.estatisticas) {
        console.log('📊 Estatísticas recebidas:', dadosTabua.estatisticas);
        setEstatisticas(dadosTabua.estatisticas);
      }
      
      if (dadosTabua.premios_exemplo) {
        console.log('💰 Prêmios exemplo:', dadosTabua.premios_exemplo);
        setPremiosExemplo(dadosTabua.premios_exemplo);
      }
      
      // Mostrar ajuste
      if (dadosTabua.dados_utilizados?.fator_ajuste) {
        const fator = dadosTabua.dados_utilizados.fator_ajuste;
        toast.info(`📊 Tábua ajustada com fator ${fator.toFixed(3)} baseado nos seus dados`);
      }
      
      // Definir idade selecionada
      const idadeMedia = estatisticasDados.mediaIdade > 0 
        ? Math.round(estatisticasDados.mediaIdade)
        : Math.floor((config.idade_min + config.idade_max) / 2);
      
      const idadeEncontrada = idadesArray.find(i => Math.abs(i - idadeMedia) < 5) || idadeMedia;
      if (idadesArray.includes(idadeEncontrada)) {
        setIdadeSelecionada(idadeEncontrada);
      } else {
        setIdadeSelecionada(idadesArray[Math.floor(idadesArray.length / 2)] || 30);
      }
      
      // Forçar cálculo imediato
      setTimeout(() => {
        calcularPremios(idadeSelecionada);
      }, 100);
      
      toast.success(`✅ Tábua carregada com ${tabua.length} idades`);
    } else {
      console.error('❌ Tábua não encontrada ou vazia');
      gerarTabuaExemplo();
    }
  };

  // ============================================
  // GERAR TÁBUA DE EXEMPLO (FALLBACK)
  // ============================================
  const gerarTabuaExemplo = () => {
    const tabuaExemplo = [];
    let lx_atual = config.l0;
    
    for (let idade = config.idade_min; idade <= config.idade_max; idade++) {
      // Ajustar mortalidade baseada nos dados reais
      let fatorIdade = 1.0;
      if (estatisticasDados.mediaIdade > 0) {
        fatorIdade = 1.0 + (estatisticasDados.mediaIdade - 35) * 0.01;
      }
      
      const A = config.sexo === 'feminino' ? 0.0003 * fatorIdade : 0.0004 * fatorIdade;
      const B = config.sexo === 'feminino' ? 0.000004 * fatorIdade : 0.000006 * fatorIdade;
      const c = 1.098;
      const mu = A + B * Math.pow(c, idade);
      const qx_idade = Math.min(1 - Math.exp(-mu), 0.999999);
      const ex_idade = config.sexo === 'feminino' 
        ? Math.max(0, (85 - idade) * 0.8) 
        : Math.max(0, (80 - idade) * 0.7);
      
      tabuaExemplo.push({
        idade,
        qx: qx_idade,
        lx: Math.round(lx_atual),
        dx: Math.round(lx_atual * qx_idade),
        ex: ex_idade
      });
      
      lx_atual = lx_atual * (1 - qx_idade);
      if (lx_atual < 1) break;
    }
    
    setTabuaProcessada(tabuaExemplo);
    toast.info('📊 Usando tábua de exemplo');
  };

  // ============================================
  // CALCULAR PRÊMIOS COM DADOS REAIS
  // ============================================
  const calcularPremios = (idade) => {
    console.log('💰 Calculando prêmios para idade:', idade);
    
    if (!qx.length || !idades.length) {
      console.log('⚠️ Arrays vazios:', { qxLength: qx.length, idadesLength: idades.length });
      return;
    }

    const idx = idades.indexOf(idade);
    if (idx === -1) {
      console.log('⚠️ Idade não encontrada:', idade, 'Idades disponíveis:', idades);
      return;
    }

    const qx_idade = qx[idx];
    const ex_idade = ex[idx] || 60;
    const fator_desconto = 1 / (1 + config.juros);
    
    console.log('📊 Valores para cálculo:', {
      idade,
      qx: qx_idade,
      ex: ex_idade,
      capital: config.capital_segurado,
      juros: config.juros
    });
    
    // Ajustar prêmio baseado nos dados reais
    let fatorRisco = 1.0;
    if (estatisticasDados.mediaIdade > 0) {
      fatorRisco = 1.0 + (estatisticasDados.mediaIdade - 35) * 0.02;
    }
    
    const premio_puro = config.capital_segurado * qx_idade * fator_desconto;
    const fator_carregamento = 1 + config.carregamento_despesas + config.carregamento_lucro + config.carregamento_impostos;
    const premio_comercial = premio_puro * fator_carregamento;
    const premio_nivelado = config.capital_segurado * qx_idade * (1 - Math.pow(fator_desconto, config.prazo)) / (1 - fator_desconto) * fatorRisco;
    const anuidade = ex_idade * premio_puro * 0.8;
    const reserva = config.capital_segurado * (1 - Math.pow(fator_desconto, config.prazo - 10)) * fatorRisco;

    const novosCalculos = {
      idade: idade,
      qx: qx_idade,
      ex: ex_idade,
      premio_puro: premio_puro,
      premio_comercial: premio_comercial,
      premio_nivelado: premio_nivelado,
      anuidade: anuidade,
      reserva: reserva,
      componentes: {
        risco: formatarPercentual(1/fator_carregamento),
        despesas: formatarPercentual(config.carregamento_despesas),
        lucro: formatarPercentual(config.carregamento_lucro),
        impostos: formatarPercentual(config.carregamento_impostos),
        fatorDados: fatorRisco > 1 ? `+${((fatorRisco-1)*100).toFixed(0)}%` : `${((fatorRisco-1)*100).toFixed(0)}%`
      }
    };

    console.log('💰 Novos cálculos:', novosCalculos);
    setCalculos(novosCalculos);
  };

  // ============================================
  // GERAR PROJEÇÕES
  // ============================================
  const gerarProjecoes = () => {
    if (!qx.length || !idades.length || !idadeSelecionada) return;

    const proj = [];
    const idxInicial = idades.indexOf(idadeSelecionada);
    
    if (idxInicial === -1) return;

    for (let i = 0; i < 5; i++) {
      const taxa = 0.02 + i * 0.01;
      const fator = 1 / (1 + taxa);
      const premio_projetado = config.capital_segurado * qx[idxInicial] * fator;
      
      proj.push({
        ano: 2024 + i,
        taxa: formatarPercentual(taxa),
        premio: premio_projetado,
        reserva: premio_projetado * 10
      });
    }
    
    setProjecoes(proj);
  };

  // ============================================
  // ENVIAR PARA DASHBOARD (VERSÃO LEGADO)
  // ============================================
  const enviarAoDashboard = useCallback((dadosAnalise) => {
    // 🔥 USAR A NOVA FUNÇÃO salvarResultadoNoDashboard
    salvarResultadoNoDashboard(dadosAnalise, config);
  }, [salvarResultadoNoDashboard, config]);

  // ============================================
  // EXPORTAR RESULTADOS
  // ============================================
  const handleExportar = async (formato = 'json') => {
    if (!resultado) return;
    
    setExportando(true);
    try {
      let conteudo, filename, type;
      
      if (formato === 'json') {
        conteudo = JSON.stringify({ 
          resultado, 
          resultadoRaw, 
          config,
          estatisticas_dados: estatisticasDados,
          variaveis_utilizadas: {
            idade: variavelIdade,
            sexo: variavelSexo,
            localizacao: variavelLocalizacao
          }
        }, null, 2);
        filename = `tabua_mortalidade_${config.base_mortalidade}_${new Date().toISOString()}.json`;
        type = 'application/json';
      } else {
        // CSV
        const linhas = [['idade', 'qx', 'lx', 'dx', 'Lx', 'Tx', 'ex']];
        tabuaProcessada.forEach(item => {
          linhas.push([
            item.idade || 0,
            (item.qx || 0).toFixed(6),
            item.lx || 0,
            item.dx || 0,
            item.Lx || 0,
            item.Tx || 0,
            (item.ex || 0).toFixed(2)
          ]);
        });
        conteudo = linhas.map(l => l.join(',')).join('\n');
        filename = `tabua_mortalidade_${config.base_mortalidade}_${new Date().toISOString()}.csv`;
        type = 'text/csv';
      }
      
      const blob = new Blob([conteudo], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success(`✅ Exportado como ${formato.toUpperCase()}`);
    } catch (error) {
      toast.error('❌ Erro ao exportar');
    } finally {
      setExportando(false);
    }
  };

  // ============================================
  // EXECUTAR ANÁLISE
  // ============================================
  const handleGerarTabua = async () => {
    const dadosArray = extrairDadosArray(dados);
    
    if (!dadosArray || dadosArray.length === 0) {
      toast.error("❌ Carregue dados primeiro!");
      return;
    }

    setExecutando(true);
    setResultado(null);
    setTabuaProcessada([]);
    setEnviadoAoDashboard(false);
    
    try {
      console.log('📤 Enviando requisição para mortality_table:', config);

      const response = await api.executarModeloR(
        'mortality_table',
        dadosArray,
        {
          ...config,
          variaveis: variaveisSelecionadas,
          mapeamento: {
            idade: variavelIdade,
            sexo: variavelSexo,
            localizacao: variavelLocalizacao
          },
          estatisticas_dados: estatisticasDados
        }
      );
      
      console.log('📥 Resposta completa:', response);
      setResultadoRaw(response);
      
      if (response?.success) {
        const dadosResultado = response.resultado || response;
        
        console.log('📊 Dados do resultado:', dadosResultado);
        
        setResultado(dadosResultado);
        
        // PROCESSAR IMEDIATAMENTE
        if (dadosResultado.tabua && dadosResultado.tabua.length > 0) {
          console.log('✅ Processando tábua com', dadosResultado.tabua.length, 'idades');
          processarResultado({ resultado: dadosResultado });
          
          // 🔥 SALVAR NO DASHBOARD APÓS PROCESSAR
          // Aguarda um pouco para os estados serem atualizados
          setTimeout(() => {
            salvarResultadoNoDashboard(dadosResultado, config);
          }, 500);
        } else {
          console.error('❌ Tábua não encontrada no resultado');
        }
        
        toast.success("✅ Tábua de mortalidade gerada!");
      } else {
        toast.error("❌ Erro na resposta do servidor");
      }
      
    } catch (error) {
      console.error('❌ Erro:', error);
      toast.error(`❌ ${error.message || 'Erro na geração'}`);
      gerarTabuaExemplo();
      
      // Criar resultado simulado para fallback
      const resultadoFallback = { 
        success: true, 
        modo_demonstracao: true,
        tabua: tabuaProcessada,
        estatisticas: estatisticas
      };
      
      setResultado(resultadoFallback);
      
      // 🔥 SALVAR FALLBACK NO DASHBOARD
      setTimeout(() => {
        salvarResultadoNoDashboard(resultadoFallback, config);
      }, 500);
    } finally {
      setExecutando(false);
    }
  };

  const handleNovaAnalise = () => {
    setResultado(null);
    setTabuaProcessada([]);
    setEnviadoAoDashboard(false);
    setAbaAtiva('tabua');
  };

  // ============================================
  // RENDERIZAR CONFIGURAÇÕES
  // ============================================
  const renderConfiguracoes = () => {
    return (
      <Card className="overflow-hidden border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Settings className="w-6 h-6" />
              </div>
              <span>Configurações da Tábua</span>
            </div>
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              <GitBranch className="w-3 h-3 mr-2" />
              {BASES_MORTALIDADE.find(b => b.id === config.base_mortalidade)?.nome}
            </Badge>
          </CardTitle>
          <CardDescription className="text-green-100">
            Parâmetros atuariais para geração da tábua
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Grid principal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coluna 1: Parâmetros Básicos */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-500" />
                  Parâmetros Básicos
                </h3>

                {/* Base de Mortalidade */}
                <div>
                  <label className="block text-sm font-medium mb-2">Base de Mortalidade</label>
                  <select
                    value={config.base_mortalidade}
                    onChange={(e) => handleParamChange('base_mortalidade', e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    {BASES_MORTALIDADE.map(base => (
                      <option key={base.id} value={base.id}>
                        {base.nome} ({base.pais} - {base.ano})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {BASES_MORTALIDADE.find(b => b.id === config.base_mortalidade)?.descricao}
                  </p>
                </div>

                {/* Sexo com ícones */}
                <div>
                  <label className="block text-sm font-medium mb-2">Sexo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {SEXOS.map(sexo => (
                      <button
                        key={sexo.id}
                        onClick={() => handleParamChange('sexo', sexo.id)}
                        className={`p-3 rounded-xl text-center transition-all ${
                          config.sexo === sexo.id
                            ? `bg-gradient-to-r from-${sexo.cor === '#3b82f6' ? 'blue' : sexo.cor === '#ec4899' ? 'pink' : 'purple'}-50 border-2 border-${sexo.cor === '#3b82f6' ? 'blue' : sexo.cor === '#ec4899' ? 'pink' : 'purple'}-500`
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        style={config.sexo === sexo.id ? { borderColor: sexo.cor } : {}}
                      >
                        <span className="text-2xl">{sexo.icone}</span>
                        <div className="text-sm font-medium mt-1">{sexo.nome}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Idades */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">Idade Mínima</label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={config.idade_min}
                      onChange={(e) => handleParamChange('idade_min', parseInt(e.target.value))}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Idade Máxima</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={config.idade_max}
                      onChange={(e) => handleParamChange('idade_max', parseInt(e.target.value))}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </div>

                {/* População Inicial */}
                <div>
                  <label className="block text-sm font-medium mb-2">População Inicial (l₀)</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={config.l0}
                    onChange={(e) => handleParamChange('l0', parseInt(e.target.value))}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Coluna 2: Parâmetros Financeiros */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-500" />
                  Parâmetros Financeiros
                </h3>

                {/* Capital Segurado */}
                <div>
                  <label className="block text-sm font-medium mb-2">Capital Segurado (Kz)</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={config.capital_segurado}
                    onChange={(e) => handleParamChange('capital_segurado', parseInt(e.target.value))}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>

                {/* Prazo */}
                <div>
                  <label className="block text-sm font-medium mb-2">Prazo (anos)</label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={config.prazo}
                    onChange={(e) => handleParamChange('prazo', parseInt(e.target.value))}
                    className="w-full accent-green-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>{config.prazo} anos</span>
                    <span>50</span>
                  </div>
                </div>

                {/* Taxa de Juros */}
                <div>
                  <label className="block text-sm font-medium mb-2">Taxa de Juros (%)</label>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="0.5"
                    value={config.juros * 100}
                    onChange={(e) => handleParamChange('juros', parseFloat(e.target.value) / 100)}
                    className="w-full accent-green-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>{formatarPercentual(config.juros)}</span>
                    <span>15%</span>
                  </div>
                </div>

                {/* Botão para mostrar avançados */}
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2"
                >
                  {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showAdvanced ? 'Ocultar' : 'Mostrar'} parâmetros avançados
                </button>
              </div>
            </div>

            {/* Parâmetros Avançados */}
            {showAdvanced && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-700 flex items-center gap-2 mb-4">
                  <Brain className="w-4 h-4 text-purple-500" />
                  Parâmetros Avançados
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Ajuste qx</label>
                    <input
                      type="number"
                      min="0.5"
                      max="2"
                      step="0.05"
                      value={config.qx_adjust}
                      onChange={(e) => handleParamChange('qx_adjust', parseFloat(e.target.value))}
                      className="w-full p-2 border rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Fator multiplicador da mortalidade</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Inflação (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      value={config.inflacao * 100}
                      onChange={(e) => handleParamChange('inflacao', parseFloat(e.target.value) / 100)}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Carreg. Despesas (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="1"
                      value={config.carregamento_despesas * 100}
                      onChange={(e) => handleParamChange('carregamento_despesas', parseFloat(e.target.value) / 100)}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Mapeamento de Variáveis */}
            {infoDados.variaveis.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-700 flex items-center gap-2 mb-4">
                  <Database className="w-4 h-4 text-purple-500" />
                  Mapeamento de Variáveis dos Dados
                </h3>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-blue-700">
                    ✅ {infoDados.linhas} observações carregadas
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Mapeie as variáveis dos seus dados para personalizar a tábua
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                      <User className="w-4 h-4" /> Idade
                    </label>
                    <select
                      value={variavelIdade}
                      onChange={(e) => setVariavelIdade(e.target.value)}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="">Não usar</option>
                      {infoDados.variaveis.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    {estatisticasDados.mediaIdade > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Média: {estatisticasDados.mediaIdade.toFixed(1)} anos
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                      <Users className="w-4 h-4" /> Sexo/Gênero
                    </label>
                    <select
                      value={variavelSexo}
                      onChange={(e) => setVariavelSexo(e.target.value)}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="">Não usar</option>
                      {infoDados.variaveis.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    {Object.keys(estatisticasDados.distribuicaoSexo).length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {Object.entries(estatisticasDados.distribuicaoSexo)
                          .map(([k, v]) => `${k}: ${v}`).join(' • ')}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> Localização
                    </label>
                    <select
                      value={variavelLocalizacao}
                      onChange={(e) => setVariavelLocalizacao(e.target.value)}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="">Não usar</option>
                      {infoDados.variaveis.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    {Object.keys(estatisticasDados.distribuicaoLocalizacao).length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {Object.keys(estatisticasDados.distribuicaoLocalizacao).length} regiões
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Botão Gerar */}
            <Button
              onClick={handleGerarTabua}
              disabled={executando}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-medium text-lg hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 mt-6"
            >
              {executando ? (
                <><RefreshCw className="w-5 h-5 animate-spin mr-2" /> Gerando...</>
              ) : (
                <><Play className="w-5 h-5 mr-2" /> Gerar Tábua</>
              )}
            </Button>
            
            {/* 🔥 INDICADOR DE INTEGRAÇÃO COM DASHBOARD */}
            {onResultadoModelo && (
              <div className="mt-2 flex items-center justify-center text-xs text-green-600">
                <span className="mr-1">✅</span>
                Resultado será salvo automaticamente no Dashboard
                {!statusSistema?.connected && ' (modo fallback)'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ============================================
  // RENDERIZAR INSIGHTS CIENTÍFICOS
  // ============================================
  const renderInsights = () => {
    if (!estatisticas && tabuaProcessada.length === 0) return null;

    const base = BASES_MORTALIDADE.find(b => b.id === config.base_mortalidade);
    
    const expectativaVida = ex[0] && !isNaN(ex[0]) ? ex[0] : 0;
    const mortalidadeInfantil = qx[0] || 0;
    const sobrevivencia60 = estatisticas?.sobrevivencia_60;
    
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              <span>Insights Atuariais</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMostrarInsights(!mostrarInsights)}
            >
              {mostrarInsights ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        
        {mostrarInsights && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  Expectativa de Vida
                </h4>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {expectativaVida > 0 ? expectativaVida.toFixed(2) : 'N/A'} anos
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {expectativaVida > 0 
                    ? `Um recém-nascido pode esperar viver em média ${expectativaVida.toFixed(1)} anos.`
                    : 'Calcule a tábua para ver a expectativa de vida.'}
                </p>
                {estatisticasDados.mediaIdade > 0 && (
                  <p className="text-xs text-blue-600 mt-2">
                    📊 Média da idade nos dados: {estatisticasDados.mediaIdade.toFixed(1)} anos
                  </p>
                )}
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-orange-500" />
                  Mortalidade Infantil
                </h4>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {mortalidadeInfantil > 0 ? (mortalidadeInfantil * 1000).toFixed(2) + '‰' : 'N/A'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {mortalidadeInfantil > 0 
                    ? `A probabilidade de óbito no primeiro ano de vida é de ${(mortalidadeInfantil * 100).toFixed(2)}%.`
                    : 'Calcule para ver a mortalidade infantil.'}
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-500" />
                  Sobrevivência aos 60 anos
                </h4>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {sobrevivencia60 ? `${sobrevivencia60}%` : 'N/A'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {sobrevivencia60 
                    ? `${sobrevivencia60}% dos recém-nascidos atingem os 60 anos.`
                    : 'Calcule para ver a taxa de sobrevivência aos 60 anos.'}
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  Fonte dos Dados
                </h4>
                <p className="text-lg font-semibold text-purple-600 mt-2">{base?.nome || config.base_mortalidade}</p>
                <p className="text-sm text-gray-600 mt-1">{base?.fonte || 'Base atuarial'}</p>
                {variavelIdade && (
                  <p className="text-xs text-purple-600 mt-2">
                    🎯 Usando idade de: {variavelIdade}
                  </p>
                )}
              </div>
            </div>
            
            {premiosExemplo && (
              <div className="bg-white p-4 rounded-lg shadow-sm mt-2">
                <h4 className="font-semibold text-gray-700 mb-2">Exemplo de Tarifação</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Prêmio Puro</p>
                    <p className="text-lg font-bold text-green-600">
                      {premiosExemplo.premio_puro ? formatarMoeda(premiosExemplo.premio_puro) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Prêmio Comercial</p>
                    <p className="text-lg font-bold text-blue-600">
                      {premiosExemplo.premio_comercial ? formatarMoeda(premiosExemplo.premio_comercial) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Anuidade</p>
                    <p className="text-lg font-bold text-purple-600">
                      {premiosExemplo.anuidade ? formatarMoeda(premiosExemplo.anuidade) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Reserva</p>
                    <p className="text-lg font-bold text-orange-600">
                      {premiosExemplo.reserva ? formatarMoeda(premiosExemplo.reserva) : 'N/A'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * Para idade {premiosExemplo.idade_exemplo} anos, capital de {formatarMoeda(config.capital_segurado)}
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  // ============================================
  // RENDERIZAR TÁBUA
  // ============================================
  const renderTabua = () => {
    if (tabuaProcessada.length === 0) {
      return null;
    }

    // VALORES DIRETAMENTE DOS ARRAYS
    const expectativaVida = ex.length > 0 && !isNaN(ex[0]) ? ex[0] : 0;
    const populacaoInicial = lx.length > 0 && !isNaN(lx[0]) ? lx[0] : 0;
    const qxMedio = qx.length > 0 ? qx.reduce((a, b) => a + b, 0) / qx.length : 0;
    const premioAtual = calculos?.premio_comercial || 0;

    console.log('📊 Renderizando cards com:', {
      expectativaVida,
      populacaoInicial,
      qxMedio: qxMedio * 1000,
      premioAtual
    });

    // Preparar dados para gráficos
    const step = Math.max(1, Math.floor(tabuaProcessada.length / 20));
    const dadosGrafico = tabuaProcessada
      .filter((_, i) => i % step === 0 || i === tabuaProcessada.length - 1)
      .map(item => ({
        idade: item.idade || 0,
        qx: (item.qx || 0) * 1000,
        lx: (item.lx || 0) / 1000,
        ex: item.ex || 0,
        dx: (item.dx || ((item.lx || 0) * (item.qx || 0))) / 1000
      }));

    // Dados para o gráfico de pizza
    const faixasEtarias = [
      { min: config.idade_min, max: 40, nome: '20-40 anos' },
      { min: 41, max: 60, nome: '41-60 anos' },
      { min: 61, max: 80, nome: '61-80 anos' },
      { min: 81, max: config.idade_max, nome: '80+ anos' }
    ];
    
    const dadosPizza = faixasEtarias.map(faixa => {
      const indices = idades.filter(i => i >= faixa.min && i <= faixa.max);
      const valor = indices.reduce((acc, idade) => {
        const idx = idades.indexOf(idade);
        return acc + (lx[idx] || 0);
      }, 0);
      
      return {
        name: faixa.nome,
        value: valor > 0 ? valor : 0
      };
    }).filter(item => item.value > 0);

    return (
      <div className="space-y-6">
        {/* Cards de resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <Heart className="w-5 h-5 text-blue-600" />
              <Badge variant="info" className="bg-blue-100">Expectativa</Badge>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-blue-900">
                {expectativaVida > 0 ? expectativaVida.toFixed(1) : 'N/A'}
              </div>
              <div className="text-sm text-blue-600">anos ao nascer</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <Users className="w-5 h-5 text-green-600" />
              <Badge variant="success" className="bg-green-100">População</Badge>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-green-900">
                {populacaoInicial > 0 ? (populacaoInicial / 1000).toFixed(0) + 'k' : 'N/A'}
              </div>
              <div className="text-sm text-green-600">vidas aos {config.idade_min} anos</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-xl border border-orange-200">
            <div className="flex items-center justify-between">
              <Activity className="w-5 h-5 text-orange-600" />
              <Badge variant="warning" className="bg-orange-100">Mortalidade</Badge>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-orange-900">
                {qxMedio > 0 ? (qxMedio * 1000).toFixed(2) + '‰' : 'N/A'}
              </div>
              <div className="text-sm text-orange-600">qx médio</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <Badge variant="info" className="bg-purple-100">Prêmio</Badge>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-purple-900">
                {premioAtual > 0 ? formatarMoeda(premioAtual) : 'N/A'}
              </div>
              <div className="text-sm text-purple-600">aos {idadeSelecionada} anos</div>
            </div>
          </div>
        </div>

        {/* Insights Científicos */}
        {renderInsights()}

        {/* Gráfico principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="w-5 h-5" />
              Análise Atuarial da Tábua
            </CardTitle>
            <CardDescription>
              Comparação entre sobrevivência (lx), mortalidade (qx) e expectativa (ex)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dadosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="idade" label="Idade" />
                  <YAxis yAxisId="left" orientation="left" label="Sobreviventes (milhares)" />
                  <YAxis yAxisId="right" orientation="right" label="Mortalidade (‰) / Expectativa" />
                  <Tooltip />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="lx"
                    stroke={CORES.lx}
                    fill={CORES.lx}
                    fillOpacity={0.2}
                    name="Sobreviventes (lx/1000)"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="qx"
                    fill={CORES.qx}
                    name="Mortalidade (qx ‰)"
                    barSize={10}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="ex"
                    stroke={CORES.ex}
                    strokeWidth={3}
                    name="Expectativa (ex)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Grid de gráficos secundários */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Óbitos (dx)</CardTitle>
              <CardDescription>Número de óbitos por idade</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="idade" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="dx" fill="#f97316" name="Óbitos (milhares)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição Populacional</CardTitle>
              <CardDescription>Proporção por faixa etária</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosPizza}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={e => `${e.name}: ${(e.value/1000).toFixed(1)}k`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {dadosPizza.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CORES_ARRAY[index % CORES_ARRAY.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela da tábua */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TableIcon className="w-5 h-5" />
              Tábua de Mortalidade
            </CardTitle>
            <CardDescription>
              Detalhamento completo das funções biométricas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full border-collapse">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="p-3 border">Idade</th>
                    <th className="p-3 border">qₓ (‰)</th>
                    <th className="p-3 border">lₓ</th>
                    <th className="p-3 border">dₓ</th>
                    <th className="p-3 border">Lₓ</th>
                    <th className="p-3 border">Tₓ</th>
                    <th className="p-3 border">eₓ</th>
                  </tr>
                </thead>
                <tbody>
                  {tabuaProcessada.filter((_, i) => i % 5 === 0).map((item, idx) => {
                    const idade = item.idade || 0;
                    const qxVal = (item.qx || 0) * 1000;
                    const lxVal = item.lx || 0;
                    const dxVal = item.dx || (lxVal * (item.qx || 0));
                    const LxVal = item.Lx || 0;
                    const TxVal = item.Tx || 0;
                    return (
                      <tr
                        key={idx}
                        className={`cursor-pointer transition-colors ${
                          idade === idadeSelecionada
                            ? 'bg-green-100 hover:bg-green-200'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setIdadeSelecionada(idade)}
                      >
                        <td className="p-3 border text-center font-medium">{idade}</td>
                        <td className="p-3 border text-right font-mono">{qxVal.toFixed(2)}‰</td>
                        <td className="p-3 border text-right font-mono">{lxVal.toLocaleString()}</td>
                        <td className="p-3 border text-right font-mono">{Math.round(dxVal).toLocaleString()}</td>
                        <td className="p-3 border text-right font-mono">{Math.round(LxVal).toLocaleString()}</td>
                        <td className="p-3 border text-right font-mono">{Math.round(TxVal).toLocaleString()}</td>
                        <td className="p-3 border text-right font-mono">{(item.ex || 0).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Seletor de idade */}
        <div className="bg-gray-50 p-6 rounded-xl border">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-medium text-gray-700">Seletor de Idade</h3>
              <p className="text-sm text-gray-500">Clique na tabela ou use o slider para ver os cálculos atuariais</p>
            </div>
            <Badge variant="info" className="text-lg px-4 py-2">
              Idade: {idadeSelecionada} anos
            </Badge>
          </div>
          <input
            type="range"
            min={Math.min(...idades.filter(v => !isNaN(v)))}
            max={Math.max(...idades.filter(v => !isNaN(v)))}
            value={idadeSelecionada}
            onChange={(e) => setIdadeSelecionada(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
          />
          {variavelIdade && estatisticasDados.mediaIdade > 0 && (
            <p className="text-xs text-blue-600 mt-2 text-center">
              📊 Média dos dados: {estatisticasDados.mediaIdade.toFixed(1)} anos
            </p>
          )}
        </div>
      </div>
    );
  };

  // ============================================
  // RENDERIZAR CÁLCULOS ATUARIAIS
  // ============================================
  const renderCalculos = () => {
    if (!calculos) {
      return (
        <Card>
          <CardContent className="text-center py-16">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Cálculos Atuariais</h3>
            <p className="text-gray-500">Selecione uma idade na aba "Tábua" para ver os cálculos</p>
            {idadeSelecionada && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg inline-block">
                <span className="text-sm text-blue-700">
                  🎯 Idade selecionada: {idadeSelecionada} anos
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Cards de informação da idade */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm text-blue-600">Idade selecionada</div>
                <div className="text-2xl font-bold text-blue-900">{calculos.idade} anos</div>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 p-5 rounded-xl border border-orange-200">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-sm text-orange-600">Prob. de morte</div>
                <div className="text-2xl font-bold text-orange-900">{(calculos.qx * 1000).toFixed(2)}‰</div>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-5 rounded-xl border border-green-200">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-sm text-green-600">Expectativa</div>
                <div className="text-2xl font-bold text-green-900">{calculos.ex?.toFixed(1)} anos</div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de prêmios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Prêmio Puro */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Prêmio Puro
              </CardTitle>
              <CardDescription>Apenas o risco de morte</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">
                {formatarMoeda(calculos.premio_puro)}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                C = {formatarMoeda(config.capital_segurado)} × qₓ({(calculos.qx * 1000).toFixed(2)}‰) × v({formatarPercentual(config.juros)})
              </p>
            </CardContent>
          </Card>

          {/* Prêmio Comercial */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Prêmio Comercial
              </CardTitle>
              <CardDescription>Com carregamentos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">
                {formatarMoeda(calculos.premio_comercial)}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Risco:</span>
                  <span className="ml-2 font-medium">{calculos.componentes.risco}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Despesas:</span>
                  <span className="ml-2 font-medium">{calculos.componentes.despesas}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Lucro:</span>
                  <span className="ml-2 font-medium">{calculos.componentes.lucro}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Impostos:</span>
                  <span className="ml-2 font-medium">{calculos.componentes.impostos}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grid de outros cálculos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prêmio Nivelado</CardTitle>
              <CardDescription>{config.prazo} anos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatarMoeda(calculos.premio_nivelado)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Anuidade</CardTitle>
              <CardDescription>Vitalícia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-600">
                {formatarMoeda(calculos.anuidade)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reserva</CardTitle>
              <CardDescription>Matemática</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatarMoeda(calculos.reserva)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projeções futuras */}
        {projecoes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Projeções com Diferentes Taxas de Juros</CardTitle>
              <CardDescription>Impacto da taxa no prêmio e reserva</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projecoes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ano" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="premio" fill="#3b82f6" name="Prêmio" />
                    <Bar yAxisId="right" dataKey="reserva" fill="#f59e0b" name="Reserva" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // ============================================
  // RENDER PRINCIPAL
  // ============================================
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Heart className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Seguros de Vida</h1>
              <p className="text-green-100">Tábuas de mortalidade com seus dados</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {infoDados.temDados && (
              <Badge variant="outline" className="bg-white/20 text-white">
                <Database className="w-3 h-3 mr-2" />
                {infoDados.linhas} registros
              </Badge>
            )}
            <Badge 
              variant={statusSistema?.connected ? "success" : "warning"} 
              className={statusSistema?.connected ? "bg-green-500/20" : "bg-yellow-500/20"}
            >
              {statusSistema?.connected ? '✅ R Online' : '⚠️ Offline'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setModoDebug(!modoDebug)}
              className="bg-white/10 hover:bg-white/20"
            >
              <Brain className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configurações - SÓ MOSTRA SE NÃO TIVER RESULTADO */}
        {!resultado && (
          <div className="lg:col-span-1 space-y-6">
            {renderConfiguracoes()}
          </div>
        )}

        {/* Resultados - OCUPA TELA TODA QUANDO APARECE */}
        <div className={resultado ? "lg:col-span-3" : "lg:col-span-2"}>
          {tabuaProcessada.length > 0 ? (
            <div className="space-y-6">
              {/* Botões de ação */}
              <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
                <Button variant="outline" onClick={handleNovaAnalise} className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Nova Análise
                </Button>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setExpanded(!expanded)} className="flex items-center gap-2">
                    {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    {expanded ? 'Minimizar' : 'Expandir'}
                  </Button>
                  
                  <Button variant="outline" onClick={() => handleExportar('json')} disabled={exportando}>
                    <FileJson className="w-4 h-4 mr-2" /> JSON
                  </Button>
                  
                  <Button variant="outline" onClick={() => handleExportar('csv')} disabled={exportando}>
                    <FileText className="w-4 h-4 mr-2" /> CSV
                  </Button>
                  
                  {onResultadoModelo && (
                    <Button
                      onClick={() => enviarAoDashboard(resultado)}
                      disabled={enviadoAoDashboard}
                      className={`flex items-center gap-2 ${
                        enviadoAoDashboard
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                      } text-white`}
                    >
                      {enviadoAoDashboard ? (
                        <><CheckCircle className="w-4 h-4" /> Enviado</>
                      ) : (
                        <><Send className="w-4 h-4" /> Enviar</>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Abas */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setAbaAtiva('tabua')}
                    className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                      abaAtiva === 'tabua'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    📊 Tábua de Mortalidade
                  </button>
                  <button
                    onClick={() => setAbaAtiva('calculos')}
                    className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                      abaAtiva === 'calculos'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    💰 Cálculos Atuariais
                  </button>
                  {modoDebug && (
                    <button
                      onClick={() => setAbaAtiva('debug')}
                      className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                        abaAtiva === 'debug'
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      🔧 Debug
                    </button>
                  )}
                </nav>
              </div>

              {/* Conteúdo das abas */}
              {abaAtiva === 'tabua' && renderTabua()}
              {abaAtiva === 'calculos' && renderCalculos()}
              {abaAtiva === 'debug' && resultadoRaw && (
                <Card>
                  <CardHeader>
                    <CardTitle>Debug - Resposta do R</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 text-sm">
                      {JSON.stringify({ resultado, resultadoRaw }, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-16">
                <Heart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Seguros de Vida</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Configure os parâmetros ao lado e gere uma tábua de mortalidade personalizada com seus dados
                </p>
                {infoDados.temDados && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg inline-block">
                    <span className="text-sm text-green-700">
                      ✅ {infoDados.linhas} registros carregados
                    </span>
                    {variavelIdade && (
                      <span className="text-sm text-blue-700 block mt-1">
                        🎯 Usando idade de: {variavelIdade}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}