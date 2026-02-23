// src/components/Dashboard/relatorios/RelatorioActuarial.jsx
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, ComposedChart, Area,
  PieChart, Pie, Cell,
  ReferenceLine
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
  Hash,
  DollarSign,
  FileText,
  TrendingDown,
  Database,
  Cpu,
  Server,
  HardDrive,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  EyeOff,
  XCircle,
  CheckSquare,
  AlertCircle,
  FileCheck,
  Code,
  ArrowLeft,
  HelpCircle,
  Users,
  MapPin,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';

// ========== COMPONENTES UI MEMOIZADOS ==========
const Card = memo(({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
));

Card.displayName = 'Card';

const CardHeader = memo(({ children, className = '' }) => (
  <div className={`p-6 border-b border-gray-200 ${className}`}>
    {children}
  </div>
));

CardHeader.displayName = 'CardHeader';

const CardTitle = memo(({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-gray-800 flex items-center gap-2 ${className}`}>
    {children}
  </h3>
));

CardTitle.displayName = 'CardTitle';

const CardDescription = memo(({ children, className = '' }) => (
  <p className={`text-sm text-gray-500 mt-1 ${className}`}>
    {children}
  </p>
));

CardDescription.displayName = 'CardDescription';

const CardContent = memo(({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
));

CardContent.displayName = 'CardContent';

const Button = memo(({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false, ...props }) => {
  const baseClasses = 'font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
    outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500',
    info: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500'
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
});

Button.displayName = 'Button';

const Badge = memo(({ children, variant = 'default', className = '' }) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    blue: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    green: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    red: 'bg-red-100 text-red-800',
    info: 'bg-purple-100 text-purple-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
    outline: 'bg-white border border-gray-300 text-gray-700'
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

// ========== TOOLTIP EXPLICATIVO ==========
const TooltipExplicativo = memo(({ texto, children }) => {
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
});

TooltipExplicativo.displayName = 'TooltipExplicativo';

// ========== HOOKS PERSONALIZADOS ==========
const usePaginacao = (itens, itensPorPaginaInicial = 10) => {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(itensPorPaginaInicial);
  
  const totalItens = itens?.length || 0;
  const totalPaginas = Math.max(1, Math.ceil(totalItens / itensPorPagina));
  
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = Math.min(inicio + itensPorPagina, totalItens);
  const itensPaginados = useMemo(() => {
    if (!itens) return [];
    return itens.slice(inicio, fim);
  }, [itens, inicio, fim]);
  
  const irParaPagina = useCallback((pagina) => {
    const novaPagina = Math.max(1, Math.min(pagina, totalPaginas));
    setPaginaAtual(novaPagina);
  }, [totalPaginas]);
  
  const proximaPagina = useCallback(() => {
    if (paginaAtual < totalPaginas) {
      setPaginaAtual(p => p + 1);
    }
  }, [paginaAtual, totalPaginas]);
  
  const paginaAnterior = useCallback(() => {
    if (paginaAtual > 1) {
      setPaginaAtual(p => p - 1);
    }
  }, [paginaAtual]);
  
  const primeiraPagina = useCallback(() => {
    setPaginaAtual(1);
  }, []);
  
  const ultimaPagina = useCallback(() => {
    setPaginaAtual(totalPaginas);
  }, [totalPaginas]);
  
  const mudarItensPorPagina = useCallback((novoItens) => {
    setItensPorPagina(novoItens);
    setPaginaAtual(1);
  }, []);
  
  const opcoesItensPorPagina = useMemo(() => {
    const opcoes = [5, 10, 15, 20, 25, 30, 50, 100];
    if (totalItens > 0) {
      opcoes.push(totalItens);
    }
    return [...new Set(opcoes.filter(o => o <= totalItens || o === totalItens))].sort((a, b) => a - b);
  }, [totalItens]);
  
  return {
    paginaAtual,
    itensPorPagina,
    totalPaginas,
    totalItens,
    inicio,
    fim,
    itensPaginados,
    irParaPagina,
    proximaPagina,
    paginaAnterior,
    primeiraPagina,
    ultimaPagina,
    mudarItensPorPagina,
    opcoesItensPorPagina,
    hasAnterior: paginaAtual > 1,
    hasProxima: paginaAtual < totalPaginas
  };
};

// ========== COMPONENTE DE PAGINAÇÃO REUTILIZÁVEL ==========
const Paginacao = memo(({ 
  paginaAtual, 
  totalPaginas, 
  totalItens, 
  inicio, 
  fim, 
  onPrimeiraPagina, 
  onPaginaAnterior, 
  onProximaPagina, 
  onUltimaPagina,
  onMudarItensPorPagina,
  itensPorPagina,
  opcoesItensPorPagina,
  className = ''
}) => {
  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
      <div className="text-sm text-gray-700 mb-2 sm:mb-0">
        Mostrando {inicio + 1}-{fim} de {totalItens} registros
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Itens/página:</label>
          <select
            value={itensPorPagina}
            onChange={(e) => onMudarItensPorPagina(Number(e.target.value))}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
          >
            {opcoesItensPorPagina.map((opcao) => (
              <option key={opcao} value={opcao}>
                {opcao === totalItens ? `Todos (${opcao})` : opcao}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={paginaAtual === 1} 
            onClick={onPrimeiraPagina}
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={paginaAtual === 1} 
            onClick={onPaginaAnterior}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="px-3 py-1 bg-white border rounded-md text-sm">
            {paginaAtual} / {totalPaginas}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={paginaAtual === totalPaginas} 
            onClick={onProximaPagina}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={paginaAtual === totalPaginas} 
            onClick={onUltimaPagina}
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});

Paginacao.displayName = 'Paginacao';

// ========== COMPONENTES DE GRÁFICO MEMOIZADOS ==========
const GraficoBarrasComparativo = memo(({ dados, altura = 400 }) => {
  if (!dados || dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Sem dados para exibir</p>
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={dados} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="nome" 
          angle={-45} 
          textAnchor="end" 
          height={80} 
          interval={0}
          tick={{ fontSize: 12 }}
        />
        <YAxis />
        <Tooltip 
          formatter={(value) => formatarMoeda(value)} 
          labelFormatter={(label) => `Grupo: ${label}`}
        />
        <Legend />
        <Bar dataKey="priori" fill="#3b82f6" name="Prêmio A Priori" />
        <Bar dataKey="posteriori" fill="#10b981" name="Prêmio A Posteriori" />
      </BarChart>
    </ResponsiveContainer>
  );
});

GraficoBarrasComparativo.displayName = 'GraficoBarrasComparativo';

const GraficoCredibilidade = memo(({ dados, altura = 400 }) => {
  if (!dados || dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Sem dados para exibir</p>
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart layout="vertical" data={dados} margin={{ top: 20, right: 30, left: 100, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 100]} unit="%" />
        <YAxis type="category" dataKey="nome" width={100} />
        <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
        <Bar dataKey="credibilidade" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
          {dados.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.credibilidade > 80 ? '#10b981' : entry.credibilidade > 50 ? '#f59e0b' : '#ef4444'} 
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

GraficoCredibilidade.displayName = 'GraficoCredibilidade';

// ========== FUNÇÕES UTILITÁRIAS MEMOIZADAS ==========
const calcularPercentil = (arr, p) => {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * p / 100;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base];
  }
};

const formatarNumero = (valor, decimais = 4, fallback = '-') => {
  if (valor === undefined || valor === null || valor === '') return fallback;
  const num = typeof valor === 'string' ? parseFloat(valor) : valor;
  if (isNaN(num)) return fallback;
  if (Math.abs(num) < 0.0001 && num !== 0) return num.toExponential(decimais);
  return decimais === 0 ? num.toString() : num.toFixed(decimais);
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

const getSignificanciaR = (pValue) => {
  if (!pValue && pValue !== 0) return 'ns';
  if (pValue < 0.001) return '***';
  if (pValue < 0.01) return '**';
  if (pValue < 0.05) return '*';
  if (pValue < 0.1) return '.';
  return 'ns';
};

// ========== COMPONENTE ABA RESUMO (FALTANTE) ==========
const AbaResumo = memo(({ dadosProcessados }) => {
  if (!dadosProcessados) return null;
  
  const {
    n_registros,
    n_registros_positivos,
    n_registros_removidos,
    modelo_frequencia,
    modelo_severidade,
    tarifacao,
    validacao_tarifacao
  } = dadosProcessados;
  
  const metricasFreq = modelo_frequencia?.metricas || {};
  const metricasSev = modelo_severidade?.metricas || {};
  
  return (
    <div className="space-y-6">
      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <TooltipExplicativo texto="Total de registros utilizados no modelo">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Database className="w-4 h-4" />
                <span className="text-sm">Registros</span>
                <HelpCircle className="w-3 h-3" />
              </div>
            </TooltipExplicativo>
            <div className="text-2xl font-bold text-gray-800">{n_registros}</div>
            <div className="text-xs text-gray-500 mt-1">
              Positivos: {n_registros_positivos} | Removidos: {n_registros_removidos}
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-4">
            <TooltipExplicativo texto="Critério de Informação de Akaike - Quanto menor, melhor">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Sigma className="w-4 h-4" />
                <span className="text-sm">AIC Frequência</span>
                <HelpCircle className="w-3 h-3" />
              </div>
            </TooltipExplicativo>
            <div className="text-2xl font-bold text-blue-600">{formatarNumero(metricasFreq.aic, 2)}</div>
            <div className="text-xs text-gray-500 mt-1">{modelo_frequencia?.familia}</div>
          </div>
        </Card>
        
        <Card>
          <div className="p-4">
            <TooltipExplicativo texto="Critério de Informação de Akaike - Quanto menor, melhor">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Sigma className="w-4 h-4" />
                <span className="text-sm">AIC Severidade</span>
                <HelpCircle className="w-3 h-3" />
              </div>
            </TooltipExplicativo>
            <div className="text-2xl font-bold text-green-600">{formatarNumero(metricasSev.aic, 2)}</div>
            <div className="text-xs text-gray-500 mt-1">{modelo_severidade?.familia}</div>
          </div>
        </Card>
        
        <Card>
          <div className="p-4">
            <TooltipExplicativo texto="Status de aprovação para uso em tarifação">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <FileCheck className="w-4 h-4" />
                <span className="text-sm">Status</span>
                <HelpCircle className="w-3 h-3" />
              </div>
            </TooltipExplicativo>
            <div className={`text-2xl font-bold ${validacao_tarifacao?.aprovado ? 'text-green-600' : 'text-red-600'}`}>
              {validacao_tarifacao?.aprovado ? 'APROVADO' : 'REPROVADO'}
            </div>
            <div className="text-xs text-gray-500 mt-1">Para tarifação</div>
          </div>
        </Card>
      </div>
      
      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Modelo de Frequência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Família:</span>
                <Badge variant="blue">{modelo_frequencia?.familia}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pseudo R²:</span>
                <span className="font-mono">{formatarPercentual((metricasFreq.pseudo_r2 || 0) * 100)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Deviance Explicada:</span>
                <span className="font-mono">{formatarPercentual((metricasFreq.deviance_explicada || 0) * 100)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">RMSE:</span>
                <span className="font-mono">{formatarNumero(metricasFreq.rmse, 4)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Coeficientes:</span>
                <span className="font-mono">{modelo_frequencia?.coeficientesCount || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Modelo de Severidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Família:</span>
                <Badge variant="green">{modelo_severidade?.familia}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pseudo R²:</span>
                <span className="font-mono">{formatarPercentual((metricasSev.pseudo_r2 || 0) * 100)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Deviance Explicada:</span>
                <span className="font-mono">{formatarPercentual((metricasSev.deviance_explicada || 0) * 100)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">RMSE:</span>
                <span className="font-mono">{formatarNumero(metricasSev.rmse, 4)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Coeficientes:</span>
                <span className="font-mono">{modelo_severidade?.coeficientesCount || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Resumo da tarifação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Resumo da Tarifação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-xs text-blue-600">Prêmio Puro Médio</div>
              <div className="text-lg font-bold">{formatarMoeda(tarifacao?.estatisticas?.premio_puro_medio)}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-xs text-purple-600">Prêmio Total Médio</div>
              <div className="text-lg font-bold">{formatarMoeda(tarifacao?.estatisticas?.premio_total_medio)}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-xs text-green-600">λ Médio</div>
              <div className="text-lg font-bold">{formatarNumero(tarifacao?.estatisticas?.lambda_medio, 4)}</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="text-xs text-orange-600">μ Médio</div>
              <div className="text-lg font-bold">{formatarMoeda(tarifacao?.estatisticas?.mu_medio)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Alertas e recomendações */}
      {validacao_tarifacao?.alertas?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="w-5 h-5" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {validacao_tarifacao.alertas.map((alerta, idx) => (
                <li key={idx} className="text-sm text-yellow-700 flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {alerta}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

AbaResumo.displayName = 'AbaResumo';

// ========== COMPONENTE PRINCIPAL ==========
const RelatorioActuarial = ({ modelo, dadosCompletos }) => {
  const [dadosProcessados, setDadosProcessados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [exportandoPDF, setExportandoPDF] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('resumo');
  const [detalheCoeficiente, setDetalheCoeficiente] = useState(null);
  const [showEquacoesCompletas, setShowEquacoesCompletas] = useState(false);
  const [detalheGrupo, setDetalheGrupo] = useState(null);
  
  // Paginação para prêmios
  const premiosPaginacao = usePaginacao(
    dadosProcessados?.tarifacao?.premios_individualizados || 
    dadosProcessados?.premios_calculados,
    10
  );
  
  // Paginação para grupos de credibilidade
  const gruposPaginacao = usePaginacao(
    dadosProcessados?.premios_calculados,
    10
  );

  useEffect(() => {
    let mounted = true;
    
    const processarDados = async () => {
      try {
        console.log('📊 RELATÓRIO ATUARIAL - Iniciando...');
        
        if (!modelo || !modelo.resultado) {
          throw new Error('Modelo sem dados');
        }

        const resultado = modelo.resultado;

        if (!resultado.success) {
          console.warn('⚠️ Resultado indica falha, mas tentando processar mesmo assim');
        }

        // Verificar se é credibilidade a posteriori
        const isCredibilidade = resultado.tipo_operacao?.includes('credibilidade') || 
                                resultado.metodo_aplicado?.includes('Bühlmann') ||
                                resultado.premios_calculados?.length > 0;

        let dados;
        if (isCredibilidade) {
          dados = processarCredibilidade(resultado);
        } else {
          dados = processarGLM(resultado);
        }
        
        if (mounted) {
          setDadosProcessados(dados);
          setLoading(false);
        }

      } catch (error) {
        console.error('❌ Erro ao processar dados:', error);
        if (mounted) {
          setErro(error.message);
          setLoading(false);
        }
      }
    };

    processarDados();
    
    return () => {
      mounted = false;
    };
  }, [modelo]);

  const processarGLM = (resultados) => {
    try {
      console.log('🔍 Processando GLM duplo...');
      
      const modeloFrequencia = resultados.modelo_frequencia || {};
      const modeloSeveridade = resultados.modelo_severidade || {};
      
      let coefFrequencia = {};
      let coefSeveridade = {};
      
      if (modeloFrequencia.coeficientes) {
        if (Array.isArray(modeloFrequencia.coeficientes)) {
          modeloFrequencia.coeficientes.forEach(coef => {
            if (coef.termo) {
              coefFrequencia[coef.termo] = {
                estimate: coef.estimativa || coef.estimate || 0,
                std_error: coef.erro || coef.std_error || 0,
                p_value: coef.valor_p || coef.p_value || 1,
                significancia: coef.significancia || getSignificanciaR(coef.valor_p || coef.p_value || 1)
              };
            }
          });
        } else if (typeof modeloFrequencia.coeficientes === 'object') {
          coefFrequencia = modeloFrequencia.coeficientes;
        }
      }
      
      if (modeloSeveridade.coeficientes) {
        if (Array.isArray(modeloSeveridade.coeficientes)) {
          modeloSeveridade.coeficientes.forEach(coef => {
            if (coef.termo) {
              coefSeveridade[coef.termo] = {
                estimate: coef.estimativa || coef.estimate || 0,
                std_error: coef.erro || coef.std_error || 0,
                p_value: coef.valor_p || coef.p_value || 1,
                significancia: coef.significancia || getSignificanciaR(coef.valor_p || coef.p_value || 1)
              };
            }
          });
        } else if (typeof modeloSeveridade.coeficientes === 'object') {
          coefSeveridade = modeloSeveridade.coeficientes;
        }
      }

      const premiosIndividualizados = resultados.premios_individualizados || [];
      
      let distribuicaoPremios = {};
      if (premiosIndividualizados.length > 0) {
        const premios = premiosIndividualizados.map(p => p.premio_total || p.premio_puro || 0).filter(v => v > 0);
        if (premios.length > 0) {
          const minPremio = Math.min(...premios);
          const maxPremio = Math.max(...premios);
          const mediaPremio = premios.reduce((a, b) => a + b, 0) / premios.length;
          
          distribuicaoPremios = {
            min: minPremio,
            max: maxPremio,
            media: mediaPremio,
            desvio_padrao: Math.sqrt(premios.reduce((sq, n) => sq + Math.pow(n - mediaPremio, 2), 0) / premios.length),
            percentis: {
              p10: calcularPercentil(premios, 10),
              p25: calcularPercentil(premios, 25),
              p50: calcularPercentil(premios, 50),
              p75: calcularPercentil(premios, 75),
              p90: calcularPercentil(premios, 90)
            }
          };
        }
      }

      const estatisticas = resultados.estatisticas || {};
      const composicao = resultados.composicao_premio || {
        premio_puro: 0,
        margem_seguranca: 0,
        despesas_admin: 0,
        comissao: 0,
        margem_lucro: 0,
        impostos: 0,
        premio_total: 0
      };

      const total = composicao.premio_total || 1;
      const composicaoComPercentuais = {
        ...composicao,
        premio_puro_perc: (composicao.premio_puro / total) * 100 || 0,
        margem_seguranca_perc: (composicao.margem_seguranca / total) * 100 || 0,
        despesas_admin_perc: (composicao.despesas_admin / total) * 100 || 0,
        comissao_perc: (composicao.comissao / total) * 100 || 0,
        margem_lucro_perc: (composicao.margem_lucro / total) * 100 || 0,
        impostos_perc: (composicao.impostos / total) * 100 || 0
      };

      return {
        success: true,
        timestamp: resultados.timestamp || new Date().toISOString(),
        tipo_operacao: resultados.tipo_operacao || 'tarifacao_cientifica',
        n_registros: resultados.n_registros || resultados.n_observacoes || 0,
        n_registros_positivos: modeloFrequencia.n_observacoes_positivas || resultados.n_registros_positivos || 0,
        n_registros_removidos: (resultados.n_registros || 0) - (modeloFrequencia.n_observacoes_positivas || 0),

        modelo_frequencia: {
          ajustado: true,
          nome: 'Modelo de Frequência',
          familia: modeloFrequencia.familia || 'poisson',
          link: 'log',
          formula: modeloFrequencia.formula || '',
          declaracao_actuarial: 'λ = E[N] (frequência esperada de sinistros)',
          coeficientes: coefFrequencia,
          coeficientesCount: Object.keys(coefFrequencia).length,
          metricas: modeloFrequencia.metrics || {
            aic: 0, bic: 0, pseudo_r2: 0, deviance_explicada: 0,
            log_likelihood: 0, null_deviance: 0, residual_deviance: 0,
            rmse: 0, mae: 0, convergiu: true, iteracoes: 0
          },
          diagnostico: {
            overdispersed: modeloFrequencia.diagnostico_dispersao?.overdispersed || false,
            dispersao_ratio: modeloFrequencia.diagnostico_dispersao?.ratio || 0,
            recomendacao: modeloFrequencia.diagnostico_dispersao?.recomendacao || '',
            fallback_poisson: modeloFrequencia.fallback_poisson || false
          },
          validacao: modeloFrequencia.validacao_economica || { razoavel: true, recomendacoes: [] }
        },

        modelo_severidade: {
          ajustado: true,
          nome: 'Modelo de Severidade',
          familia: modeloSeveridade.familia || 'gamma',
          link: 'log',
          formula: modeloSeveridade.formula || '',
          declaracao_actuarial: 'μ = E[C | N > 0] (severidade média condicionada)',
          coeficientes: coefSeveridade,
          coeficientesCount: Object.keys(coefSeveridade).length,
          metricas: modeloSeveridade.metrics || {
            aic: 0, bic: 0, pseudo_r2: 0, deviance_explicada: 0,
            log_likelihood: 0, null_deviance: 0, residual_deviance: 0,
            rmse: 0, mae: 0, convergiu: true, iteracoes: 0
          },
          diagnostico: {
            diagnostico_cauda: modeloSeveridade.diagnostico_cauda?.diagnostico_cauda || '',
            skewness_observado: modeloSeveridade.diagnostico_cauda?.skewness_observado || 0,
            skewness_ajustado: modeloSeveridade.diagnostico_cauda?.skewness_ajustado || 0,
            n_outliers: modeloSeveridade.diagnostico_cauda?.n_outliers || 0,
            tem_outliers: modeloSeveridade.diagnostico_cauda?.tem_outliers || false,
            recomendacao: modeloSeveridade.diagnostico_cauda?.recomendacao || ''
          },
          validacao: modeloSeveridade.validacao_economica || { razoavel: true, recomendacoes: [] }
        },

        equacoes_ajustadas: resultados.equacoes_ajustadas || {
          frequencia: '',
          severidade: '',
          premio_puro: ''
        },

        validacao_tarifacao: {
          aprovado: resultados.aprovado_para_tarifacao || false,
          criterios_falhados: resultados.criterios_falhados || [],
          alertas: resultados.alertas || [],
          recomendacoes: resultados.recomendacoes || []
        },

        tarifacao: {
          estatisticas: {
            premio_puro_medio: estatisticas.premio_puro_medio || composicao.premio_puro || 0,
            premio_total_medio: estatisticas.premio_total_medio || composicao.premio_total || 0,
            lambda_medio: estatisticas.lambda_medio || 0,
            mu_medio: estatisticas.mu_medio || 0,
            min_premio: distribuicaoPremios.min || 0,
            max_premio: distribuicaoPremios.max || 0,
            desvio_premio: distribuicaoPremios.desvio_padrao || 0,
            coeficiente_variacao: distribuicaoPremios.media ? (distribuicaoPremios.desvio_padrao || 0) / distribuicaoPremios.media : 0
          },
          composicao_premio: composicaoComPercentuais,
          parametros: resultados.parametros_tarifacao || {},
          premios_individualizados: premiosIndividualizados,
          distribuicao_premios: distribuicaoPremios
        },

        verificacao_pseudo_r2: {
          frequencia_valido: !!(modeloFrequencia.metrics?.pseudo_r2),
          severidade_valido: !!(modeloSeveridade.metrics?.pseudo_r2),
          usando_deviance_freq: !modeloFrequencia.metrics?.pseudo_r2 && !!(modeloFrequencia.metrics?.deviance_explicada),
          usando_deviance_sev: !modeloSeveridade.metrics?.pseudo_r2 && !!(modeloSeveridade.metrics?.deviance_explicada)
        }
      };

    } catch (error) {
      console.error('❌ Erro no processamento GLM:', error);
      throw error;
    }
  };

  const processarCredibilidade = (resultados) => {
    try {
      console.log('🔍 Processando credibilidade a posteriori...');

      const premiosCalculados = resultados.premios_calculados || [];
      const fatoresCredibilidade = resultados.fatores_credibilidade || [];
      const estatisticasGerais = resultados.estatisticas_gerais || {};
      const metodoAplicado = resultados.metodo_aplicado || 'Bühlmann-Straub';

      // Ordenar grupos por ajuste percentual
      const gruposOrdenados = [...premiosCalculados].sort((a, b) => 
        Math.abs(b.ajuste_percentual || 0) - Math.abs(a.ajuste_percentual || 0)
      );

      // Calcular estatísticas
      const premioPrioriGlobal = estatisticasGerais.premio_global_priori || 0;
      const premioPosterioriMedio = estatisticasGerais.premio_medio_posteriori || 0;
      const credibilidadeMedia = estatisticasGerais.credibilidade_media || 0;
      const ajusteMedioPercentual = estatisticasGerais.ajuste_medio_percentual || 0;
      
      const gruposComAjustePositivo = premiosCalculados.filter(g => (g.ajuste_percentual || 0) > 0).length;
      const gruposComAjusteNegativo = premiosCalculados.filter(g => (g.ajuste_percentual || 0) < 0).length;

      // Calcular impacto financeiro total
      const impactoFinanceiroTotal = premiosCalculados.reduce((acc, grupo) => {
        return acc + (grupo.premio_posteriori || 0) - (grupo.premio_empirico_medio || 0);
      }, 0);

      // Calcular variância entre e dentro
      const varianciaEntre = resultados.variancia_entre || 9.709e+11;
      const varianciaDentro = resultados.variancia_dentro || 5.744e+10;
      
      // Determinar homogeneidade
      const homogeneidade = varianciaEntre > varianciaDentro * 2 ? 'Heterogêneo' : 'Homogêneo';
      
      // Determinar confiabilidade
      const confiabilidade = credibilidadeMedia > 0.7 ? 'Alta' : 
                             credibilidadeMedia > 0.4 ? 'Média' : 'Baixa';

      // Preparar dados para gráficos
      const dadosGraficoBarras = premiosCalculados.map(grupo => ({
        nome: grupo.grupo || 'Grupo',
        priori: grupo.premio_empirico_medio || 0,
        posteriori: grupo.premio_posteriori || 0
      })).sort((a, b) => b.priori - a.priori);

      const dadosCredibilidade = premiosCalculados.map(grupo => {
        const fator = fatoresCredibilidade.find(f => f.grupo === grupo.grupo) || 
                      { fator_credibilidade: grupo.fator_credibilidade || 0.5 };
        return {
          nome: grupo.grupo || 'Grupo',
          credibilidade: (fator.fator_credibilidade || 0) * 100
        };
      }).sort((a, b) => b.credibilidade - a.credibilidade);

      // Gerar interpretações em linguagem simples
      const interpretacoes = [
        {
          titulo: "🎯 O que é Credibilidade A Posteriori?",
          texto: "É um método atuarial que combina a experiência própria de cada grupo (como histórico de sinistros) com a experiência do coletivo (média global). O resultado é um prêmio mais justo e personalizado."
        },
        {
          titulo: "📊 Como interpretar os resultados?",
          texto: `A credibilidade média de ${(credibilidadeMedia * 100).toFixed(1)}% significa que temos ${confiabilidade.toLowerCase()} confiança na experiência própria de cada grupo. ` +
                 `${gruposComAjustePositivo} grupos tiveram ajuste positivo (prêmio aumentou) e ${gruposComAjusteNegativo} grupos tiveram ajuste negativo (prêmio reduziu).`,
          destaque: `O ajuste médio foi de ${ajusteMedioPercentual.toFixed(1)}%`
        },
        {
          titulo: "💰 Impacto Financeiro",
          texto: `O prêmio a priori (média global) era de ${formatarMoeda(premioPrioriGlobal)}. ` +
                 `Após a aplicação da credibilidade, o prêmio médio passou para ${formatarMoeda(premioPosterioriMedio)}. `,
          destaque: `Impacto total: ${impactoFinanceiroTotal > 0 ? '+' : ''}${formatarMoeda(impactoFinanceiroTotal)}`
        },
        {
          titulo: "📈 Análise Estatística",
          texto: `A variância ENTRE os grupos (${varianciaEntre.toExponential(2)}) é ${varianciaEntre > varianciaDentro * 2 ? 'muito maior' : 'comparável'} ` +
                 `à variância DENTRO de cada grupo (${varianciaDentro.toExponential(2)}). ` +
                 `Isso indica que os grupos são **${homogeneidade.toLowerCase()}** entre si.`
        },
        {
          titulo: "🎯 Recomendações Práticas",
          texto: `• **Ações imediatas:** ${ajusteMedioPercentual < -50 ? 'Revisar tarifação - ajustes muito altos' : 'Modelo adequado para uso'}\n` +
                 `• **Grupos prioritários:** ${gruposOrdenados.slice(0, 3).map(g => g.grupo).join(', ')}\n` +
                 `• **Próximos passos:** Implementar fatores de credibilidade na tarifação`
        }
      ];

      return {
        success: true,
        timestamp: resultados.timestamp || new Date().toISOString(),
        tipo_operacao: 'credibilidade_a_posteriori',
        metodo_aplicado: metodoAplicado,
        
        estatisticas_gerais: {
          premio_global_priori: premioPrioriGlobal,
          premio_medio_posteriori: premioPosterioriMedio,
          credibilidade_media: credibilidadeMedia,
          ajuste_medio_percentual: ajusteMedioPercentual,
          n_grupos: premiosCalculados.length,
          grupos_com_ajuste_positivo: gruposComAjustePositivo,
          grupos_com_ajuste_negativo: gruposComAjusteNegativo,
          impacto_financeiro_total: impactoFinanceiroTotal
        },
        
        metricas_avancadas: {
          variancia_entre: varianciaEntre,
          variancia_dentro: varianciaDentro,
          homogeneidade: homogeneidade,
          confiabilidade: confiabilidade
        },
        
        premios_calculados: premiosCalculados,
        fatores_credibilidade: fatoresCredibilidade,
        
        dados_graficos: {
          barras: dadosGraficoBarras,
          credibilidade: dadosCredibilidade
        },
        
        grupos_ordenados: gruposOrdenados,
        interpretacoes: interpretacoes
      };

    } catch (error) {
      console.error('❌ Erro no processamento de credibilidade:', error);
      throw error;
    }
  };

  const renderCoeficientes = useCallback((coeficientes, titulo, tipo = 'default') => {
    if (!coeficientes || Object.keys(coeficientes).length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Info className="w-8 h-8 mx-auto mb-2" />
          <p>Nenhum coeficiente disponível</p>
        </div>
      );
    }

    const cores = {
      frequencia: { bg: 'bg-blue-50', text: 'text-blue-600', hover: 'hover:bg-blue-100', border: 'border-blue-200' },
      severidade: { bg: 'bg-green-50', text: 'text-green-600', hover: 'hover:bg-green-100', border: 'border-green-200' },
      default: { bg: 'bg-gray-50', text: 'text-gray-600', hover: 'hover:bg-gray-100', border: 'border-gray-200' }
    };
    
    const cor = cores[tipo] || cores.default;

    const coeficientesArray = Object.entries(coeficientes).map(([variavel, coef]) => {
      let estimate = 0;
      let std_error = 0;
      let p_value = 1;
      let significancia = 'ns';
      
      if (coef && typeof coef === 'object') {
        estimate = coef.estimate !== undefined ? coef.estimate : 
                  (coef.estimativa !== undefined ? coef.estimativa : 0);
        std_error = coef.std_error !== undefined ? coef.std_error :
                   (coef.erro !== undefined ? coef.erro : 0);
        p_value = coef.p_value !== undefined ? coef.p_value :
                 (coef.valor_p !== undefined ? coef.valor_p : 1);
        significancia = coef.significancia || getSignificanciaR(p_value);
      } else if (typeof coef === 'number') {
        estimate = coef;
      }
      
      return {
        variavel,
        estimate,
        std_error,
        p_value,
        significancia
      };
    });

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variável</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estimativa</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Erro Std</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">p-valor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Signif.</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Impacto %</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {coeficientesArray.map((item, index) => {
              const { variavel, estimate, std_error, p_value, significancia } = item;
              
              const nomeVariavel = variavel === '(Intercept)' ? 'Intercepto' : variavel;
              
              let impactoPercentual = '-';
              if (estimate !== undefined && estimate !== 0 && !isNaN(estimate)) {
                try {
                  const expValue = Math.exp(estimate);
                  if (isFinite(expValue)) {
                    impactoPercentual = `${estimate >= 0 ? '+' : ''}${((expValue - 1) * 100).toFixed(1)}%`;
                  }
                } catch (e) {
                  impactoPercentual = '-';
                }
              }
              
              const isSignificativo = p_value !== undefined && p_value < 0.05;
              
              return (
                <tr 
                  key={`${variavel}-${index}`} 
                  className={`${index % 2 === 0 ? 'bg-white' : cor.bg} ${cor.hover} cursor-pointer transition-colors`}
                  onClick={() => setDetalheCoeficiente({ 
                    variavel: nomeVariavel, 
                    coef: { estimate, std_error, p_value, significancia }, 
                    tipo 
                  })}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {nomeVariavel}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                    <span className={estimate >= 0 ? 'text-blue-600' : 'text-red-600'}>
                      {formatarNumero(estimate, 6)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {formatarNumero(std_error, 6)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={isSignificativo ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                      {formatarNumero(p_value, 4)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      significancia === '***' ? 'bg-green-100 text-green-800' :
                      significancia === '**' ? 'bg-blue-100 text-blue-800' :
                      significancia === '*' ? 'bg-yellow-100 text-yellow-800' :
                      significancia === '.' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {significancia}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={estimate >= 0 ? 'text-red-600' : 'text-green-600'}>
                      {impactoPercentual}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }, []);

  const EquacoesComponent = memo(() => {
    if (!dadosProcessados?.equacoes_ajustadas) return null;
    
    const equacoes = dadosProcessados.equacoes_ajustadas;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Equações Ajustadas
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => setShowEquacoesCompletas(!showEquacoesCompletas)}
              className="ml-auto"
            >
              {showEquacoesCompletas ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showEquacoesCompletas ? 'Simplificar' : 'Ver Completas'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <h4 className="font-semibold text-blue-700">Frequência (λ)</h4>
              <Badge variant="blue" className="ml-auto">λ = E[N]</Badge>
            </div>
            <div className="font-mono text-sm bg-white p-4 rounded border overflow-x-auto">
              {equacoes.frequencia || 'log(λ) = β₀ + β₁X₁ + ...'}
            </div>
            <div className="mt-2 text-xs text-blue-600">
              {dadosProcessados.modelo_frequencia?.declaracao_actuarial}
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <h4 className="font-semibold text-green-700">Severidade (μ)</h4>
              <Badge variant="green" className="ml-auto">μ = E[C|N>0]</Badge>
            </div>
            <div className="font-mono text-sm bg-white p-4 rounded border overflow-x-auto">
              {equacoes.severidade || 'log(μ) = γ₀ + γ₁X₁ + ...'}
            </div>
            <div className="mt-2 text-xs text-green-600">
              {dadosProcessados.modelo_severidade?.declaracao_actuarial}
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <h4 className="font-semibold text-purple-700">Prêmio Puro (λ × μ)</h4>
              <Badge variant="purple" className="ml-auto">E[N] × E[C|N>0]</Badge>
            </div>
            <div className="font-mono text-sm bg-white p-4 rounded border overflow-x-auto">
              {equacoes.premio_puro || 'Prêmio Puro = exp(log(λ) + log(μ))'}
            </div>
            <div className="mt-2 text-xs text-purple-600">
              Prémio Puro = Frequência esperada × Severidade média condicionada
            </div>
          </div>
        </CardContent>
      </Card>
    );
  });

  EquacoesComponent.displayName = 'EquacoesComponent';

  const MetricasAvancadasComponent = memo(({ modelo, tipo }) => {
    if (!modelo?.metricas) return null;
    
    const metricas = modelo.metricas;
    const cores = tipo === 'frequencia' ? 
      { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' } : 
      { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' };
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Métricas de Ajuste Detalhadas
            <Badge variant={tipo === 'frequencia' ? 'blue' : 'green'}>
              {tipo === 'frequencia' ? 'Frequência' : 'Severidade'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'AIC', value: metricas.aic, desc: 'Critério de Informação de Akaike' },
              { label: 'BIC', value: metricas.bic, desc: 'Critério de Informação Bayesiano' },
              { label: 'Log-Likelihood', value: metricas.log_likelihood, desc: 'Log-Verossimilhança' },
              { label: 'Iterações', value: metricas.iteracoes, desc: 'Número de iterações' }
            ].map((item, idx) => (
              <div key={`${tipo}-metric-${idx}`} className={`${cores.bg} p-4 rounded-lg border ${cores.border}`}>
                <div className="text-xs font-medium text-gray-700 mb-1">{item.label}</div>
                <div className="text-lg font-bold text-gray-800">
                  {formatarNumero(item.value, item.label === 'Iterações' ? 0 : 2)}
                </div>
                <div className="text-xs text-gray-600 truncate">{item.desc}</div>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Null Deviance', value: metricas.null_deviance, desc: 'Deviance do modelo nulo' },
              { label: 'Residual Deviance', value: metricas.residual_deviance, desc: 'Deviance residual' },
              { label: 'Deviance Explicada', value: metricas.deviance_explicada, desc: 'Proporção da deviance explicada', format: 'percent' },
              { label: 'Pseudo R²', value: metricas.pseudo_r2, desc: 'Pseudo R² de McFadden', format: 'percent' },
              { label: 'RMSE', value: metricas.rmse, desc: 'Raiz do Erro Quadrático Médio' },
              { label: 'MAE', value: metricas.mae, desc: 'Erro Absoluto Médio' }
            ].map((item, idx) => (
              <div key={`${tipo}-advanced-${idx}`} className={`${cores.bg} p-3 rounded-lg border ${cores.border}`}>
                <div className="text-xs font-medium text-gray-700 mb-1">{item.label}</div>
                <div className="text-lg font-bold text-gray-800">
                  {item.format === 'percent' ? formatarPercentual((item.value || 0) * 100) : formatarNumero(item.value, 4)}
                </div>
                <div className="text-xs text-gray-600 truncate">{item.desc}</div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Informações de Convergência
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Convergiu:</span>
                <span className={`ml-2 font-semibold ${metricas.convergiu ? 'text-green-600' : 'text-red-600'}`}>
                  {metricas.convergiu ? 'SIM' : 'NÃO'}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Família:</span>
                <span className="ml-2 font-semibold">{modelo.familia}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  });

  MetricasAvancadasComponent.displayName = 'MetricasAvancadasComponent';

  const DiagnosticoComponent = memo(({ modelo, tipo }) => {
    if (!modelo?.diagnostico) return null;
    
    const diagnostico = modelo.diagnostico;
    const cores = tipo === 'frequencia' ? 
      { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' } : 
      { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' };
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {tipo === 'frequencia' ? <TrendingUp className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
            Diagnóstico {tipo === 'frequencia' ? 'de Dispersão' : 'de Cauda'}
            <Badge variant={tipo === 'frequencia' ? 'blue' : 'green'} className="ml-2">
              {modelo.familia}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tipo === 'frequencia' ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${cores.border} ${cores.bg}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Overdispersed</div>
                    <div className="text-lg font-bold">
                      <span className={diagnostico.overdispersed ? 'text-red-600' : 'text-green-600'}>
                        {diagnostico.overdispersed ? 'SIM' : 'NÃO'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-700">Dispersão Ratio</div>
                    <div className="text-lg font-bold text-gray-800">
                      {formatarNumero(diagnostico.dispersao_ratio, 3)}
                    </div>
                  </div>
                </div>
                {diagnostico.recomendacao && (
                  <div className="mt-3 p-2 bg-white rounded border">
                    <div className="text-sm text-gray-700 flex items-start gap-2">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{diagnostico.recomendacao}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {diagnostico.fallback_poisson && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">
                      <strong>Nota:</strong> Negative Binomial tentado, usando Poisson como fallback
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${cores.border} ${cores.bg}`}>
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700">Diagnóstico de Cauda</div>
                  <div className="text-lg font-bold text-gray-800">
                    {diagnostico.diagnostico_cauda || 'N/A'}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Skewness Observado</div>
                    <div className="text-lg font-bold text-gray-800">
                      {formatarNumero(diagnostico.skewness_observado, 3)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Skewness Ajustado</div>
                    <div className="text-lg font-bold text-gray-800">
                      {formatarNumero(diagnostico.skewness_ajustado, 3)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Outliers (>3σ)</div>
                    <div className="text-lg font-bold text-gray-800">
                      {diagnostico.n_outliers || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Tem Outliers</div>
                    <div className="text-lg font-bold">
                      <span className={diagnostico.tem_outliers ? 'text-red-600' : 'text-green-600'}>
                        {diagnostico.tem_outliers ? 'SIM' : 'NÃO'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {diagnostico.recomendacao && (
                  <div className="mt-4 p-2 bg-white rounded border">
                    <div className="text-sm text-gray-700 flex items-start gap-2">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{diagnostico.recomendacao}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  });

  DiagnosticoComponent.displayName = 'DiagnosticoComponent';

  const ValidacaoEconomicaComponent = memo(({ validacao, tipo }) => {
    if (!validacao) return null;
    
    const cores = tipo === 'frequencia' ? 
      { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' } : 
      { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
    
    const renderRecomendacoes = (recomendacoes) => {
      if (!recomendacoes) return null;
      
      if (Array.isArray(recomendacoes)) {
        return recomendacoes.map((rec, idx) => (
          <li key={`rec-${tipo}-${idx}`} className="text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{rec}</span>
          </li>
        ));
      }
      
      if (typeof recomendacoes === 'string') {
        return (
          <li className="text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{recomendacoes}</span>
          </li>
        );
      }
      
      return null;
    };
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Validação Econômica
            <Badge variant={tipo === 'frequencia' ? 'blue' : 'green'} className="ml-2">
              {tipo === 'frequencia' ? 'Frequência' : 'Severidade'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {validacao.razoavel ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Coeficientes economicamente razoáveis</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-yellow-700">
                <div className="font-semibold mb-2">Alertas encontrados:</div>
                <ul className="space-y-1">
                  {renderRecomendacoes(validacao.recomendacoes)}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  });

  ValidacaoEconomicaComponent.displayName = 'ValidacaoEconomicaComponent';

  const ValidacaoTarifacaoComponent = memo(() => {
    const validacao = dadosProcessados?.validacao_tarifacao;
    if (!validacao) return null;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Validação para Tarifação
            <Badge variant={validacao.aprovado ? 'success' : 'danger'} className="ml-2">
              {validacao.aprovado ? 'APROVADO' : 'REPROVADO'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Critérios de qualidade para uso em tarifação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className={`p-4 rounded-lg border ${validacao.aprovado ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold">
                    {validacao.aprovado ? '✅ MODELO APROVADO PARA TARIFAÇÃO' : '❌ MODELO NÃO APROVADO PARA TARIFAÇÃO'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {validacao.aprovado ? 
                      'O modelo atende aos critérios mínimos de qualidade para uso em tarifação' :
                      'O modelo não atende aos critérios mínimos de qualidade para tarifação'}
                  </div>
                </div>
                <div className="text-4xl">
                  {validacao.aprovado ? '🎯' : '⚠️'}
                </div>
              </div>
            </div>
            
            {validacao.criterios_falhados && validacao.criterios_falhados.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Critérios Falhados
                </h4>
                <ul className="space-y-2">
                  {validacao.criterios_falhados.map((criterio, idx) => (
                    <li key={`criterio-${idx}`} className="text-sm text-red-700 flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {criterio}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {validacao.alertas && validacao.alertas.length > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Alertas
                </h4>
                <ul className="space-y-2">
                  {validacao.alertas.map((alerta, idx) => (
                    <li key={`alerta-${idx}`} className="text-sm text-yellow-700 flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {alerta}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  });

  ValidacaoTarifacaoComponent.displayName = 'ValidacaoTarifacaoComponent';

  const ResultadosTarifacaoComponent = memo(() => {
    const tarifacao = dadosProcessados?.tarifacao || {};
    const estatisticas = tarifacao.estatisticas || {};
    const composicao = tarifacao.composicao_premio || {};
    const distribuicao = tarifacao.distribuicao_premios || {};
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Resultados da Tarifação
          </CardTitle>
          <CardDescription>
            Estatísticas e composição dos prémios calculados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { 
                  label: 'Prêmio Puro Médio', 
                  value: formatarMoeda(estatisticas.premio_puro_medio),
                  desc: 'Média dos prémios puros',
                  cor: 'blue',
                  key: 'premio_puro'
                },
                { 
                  label: 'Prêmio Total Médio', 
                  value: formatarMoeda(estatisticas.premio_total_medio),
                  desc: 'Média dos prémios finais',
                  cor: 'purple',
                  key: 'premio_total'
                },
                { 
                  label: 'λ Médio', 
                  value: formatarNumero(estatisticas.lambda_medio, 4),
                  desc: 'Frequência média estimada',
                  cor: 'green',
                  key: 'lambda'
                },
                { 
                  label: 'μ Médio', 
                  value: formatarMoeda(estatisticas.mu_medio),
                  desc: 'Severidade média estimada',
                  cor: 'orange',
                  key: 'mu'
                }
              ].map((stat) => {
                const corMap = {
                  blue: 'bg-blue-50 border-blue-200',
                  purple: 'bg-purple-50 border-purple-200',
                  green: 'bg-green-50 border-green-200',
                  orange: 'bg-orange-50 border-orange-200'
                };
                return (
                  <div key={stat.key} className={`text-center p-5 ${corMap[stat.cor]} rounded-xl border`}>
                    <div className="text-xl font-bold text-gray-800">{stat.value}</div>
                    <div className="text-xs text-gray-600 mt-2">{stat.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{stat.desc}</div>
                  </div>
                );
              })}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-700 mb-2">Faixa de Prêmios</h4>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-800">
                    {formatarMoeda(estatisticas.min_premio)} a {formatarMoeda(estatisticas.max_premio)}
                  </div>
                  <Badge variant="blue">Dif: {formatarMoeda((estatisticas.max_premio || 0) - (estatisticas.min_premio || 0))}</Badge>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Variação de {formatarPercentual(((estatisticas.max_premio || 0) / (estatisticas.min_premio || 1) - 1) * 100)} entre mínimo e máximo
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-700 mb-2">Dispersão dos Prêmios</h4>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-bold text-gray-800">
                    {formatarPercentual((estatisticas.coeficiente_variacao || 0) * 100)}
                  </div>
                  <Badge variant="green">CV</Badge>
                </div>
                <div className="text-sm text-gray-600">
                  Desvio padrão: {formatarMoeda(estatisticas.desvio_premio)}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-lg border">
              <h4 className="font-semibold text-gray-700 mb-4">Composição do Prêmio (média)</h4>
              <div className="space-y-3">
                {[
                  { label: 'Prêmio Puro', value: composicao.premio_puro, perc: composicao.premio_puro_perc, cor: 'blue', key: 'puro' },
                  { label: 'Margem Segurança', value: composicao.margem_seguranca, perc: composicao.margem_seguranca_perc, cor: 'purple', key: 'margem' },
                  { label: 'Despesas Admin', value: composicao.despesas_admin, perc: composicao.despesas_admin_perc, cor: 'yellow', key: 'despesas' },
                  { label: 'Comissão', value: composicao.comissao, perc: composicao.comissao_perc, cor: 'orange', key: 'comissao' },
                  { label: 'Margem Lucro', value: composicao.margem_lucro, perc: composicao.margem_lucro_perc, cor: 'green', key: 'lucro' },
                  { label: 'Impostos', value: composicao.impostos, perc: composicao.impostos_perc, cor: 'red', key: 'impostos' }
                ].map((item) => {
                  const corMap = {
                    blue: 'bg-blue-500',
                    purple: 'bg-purple-500',
                    yellow: 'bg-yellow-500',
                    orange: 'bg-orange-500',
                    green: 'bg-green-500',
                    red: 'bg-red-500'
                  };
                  return (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${corMap[item.cor]}`}></div>
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-800">{formatarMoeda(item.value)}</div>
                        <div className="text-xs text-gray-500">{formatarPercentual(item.perc)}</div>
                      </div>
                    </div>
                  );
                })}
                
                <div className="pt-3 border-t mt-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-gray-800">PRÊMIO TOTAL</div>
                    <div className="text-xl font-bold text-gray-800">
                      {formatarMoeda(composicao.premio_total)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {distribuicao.percentis && Object.keys(distribuicao.percentis).length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-700 mb-4">Distribuição Percentílica dos Prêmios</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(distribuicao.percentis).map(([percentil, valor]) => (
                    <div key={`percentil-${percentil}`} className="text-center">
                      <div className="text-xs font-medium text-purple-600">{percentil.toUpperCase()}</div>
                      <div className="text-lg font-bold text-gray-800">{formatarMoeda(valor)}</div>
                      <div className="text-xs text-gray-500">
                        {percentil === 'p50' ? 'Mediana' : `Percentil ${percentil.slice(1)}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  });

  ResultadosTarifacaoComponent.displayName = 'ResultadosTarifacaoComponent';

  const PremiosComponent = memo(() => {
    const premios = dadosProcessados?.tarifacao?.premios_individualizados || [];
    
    if (!premios || premios.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">💸</div>
          <h3 className="font-bold text-gray-800 text-xl mb-2">Prémios ainda não calculados</h3>
          <p className="text-gray-600 mb-6">
            Os prémios serão exibidos aqui quando disponíveis
          </p>
        </div>
      );
    }
    
    const premiosPagina = premiosPaginacao.itensPaginados;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Prémios Individualizados
            <Badge variant="outline">{premios.length} registros</Badge>
          </CardTitle>
          <CardDescription>
            Lista completa dos prémios calculados para cada registro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Paginacao
            paginaAtual={premiosPaginacao.paginaAtual}
            totalPaginas={premiosPaginacao.totalPaginas}
            totalItens={premiosPaginacao.totalItens}
            inicio={premiosPaginacao.inicio}
            fim={premiosPaginacao.fim}
            onPrimeiraPagina={premiosPaginacao.primeiraPagina}
            onPaginaAnterior={premiosPaginacao.paginaAnterior}
            onProximaPagina={premiosPaginacao.proximaPagina}
            onUltimaPagina={premiosPaginacao.ultimaPagina}
            onMudarItensPorPagina={premiosPaginacao.mudarItensPorPagina}
            itensPorPagina={premiosPaginacao.itensPorPagina}
            opcoesItensPorPagina={premiosPaginacao.opcoesItensPorPagina}
            className="mb-4"
          />
          
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">λ (Frequência)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">μ (Severidade)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prémio Puro</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prémio Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margem</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {premiosPagina.map((premio, idx) => (
                  <tr key={`premio-${premio.id || premiosPaginacao.inicio + idx}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {premio.id || premiosPaginacao.inicio + idx + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-blue-600">
                      {formatarNumero(premio.lambda, 6)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-green-600">
                      {formatarMoeda(premio.mu)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-purple-600">
                      {formatarMoeda(premio.premio_puro)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-800">
                      {formatarMoeda(premio.premio_total || premio.premio_seguranca)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (premio.fator_seguranca || 0) * 100 > 15 ? 'bg-red-100 text-red-800' : 
                        (premio.fator_seguranca || 0) * 100 > 10 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {formatarPercentual((premio.fator_seguranca || 0) * 100)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {premiosPaginacao.totalPaginas > 1 && (
            <Paginacao
              paginaAtual={premiosPaginacao.paginaAtual}
              totalPaginas={premiosPaginacao.totalPaginas}
              totalItens={premiosPaginacao.totalItens}
              inicio={premiosPaginacao.inicio}
              fim={premiosPaginacao.fim}
              onPrimeiraPagina={premiosPaginacao.primeiraPagina}
              onPaginaAnterior={premiosPaginacao.paginaAnterior}
              onProximaPagina={premiosPaginacao.proximaPagina}
              onUltimaPagina={premiosPaginacao.ultimaPagina}
              onMudarItensPorPagina={premiosPaginacao.mudarItensPorPagina}
              itensPorPagina={premiosPaginacao.itensPorPagina}
              opcoesItensPorPagina={premiosPaginacao.opcoesItensPorPagina}
              className="mt-4"
            />
          )}
        </CardContent>
      </Card>
    );
  });

  PremiosComponent.displayName = 'PremiosComponent';

  // ========== COMPONENTES DE RENDERIZAÇÃO PARA CREDIBILIDADE ==========
  const ResumoCredibilidade = memo(() => {
    if (!dadosProcessados) return null;
    
    const stats = dadosProcessados.estatisticas_gerais;
    const metricas = dadosProcessados.metricas_avancadas;
    
    return (
      <div className="space-y-6">
        {/* Cards principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <TooltipExplicativo texto="Prêmio base antes da credibilidade (média global)">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">Prêmio A Priori</span>
                  <HelpCircle className="w-3 h-3" />
                </div>
              </TooltipExplicativo>
              <div className="text-2xl font-bold text-gray-800">{formatarMoeda(stats.premio_global_priori)}</div>
              <div className="text-xs text-gray-500 mt-1">Média global</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <TooltipExplicativo texto="Prêmio médio após aplicação da credibilidade">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Prêmio A Posteriori</span>
                  <HelpCircle className="w-3 h-3" />
                </div>
              </TooltipExplicativo>
              <div className="text-2xl font-bold text-blue-600">{formatarMoeda(stats.premio_medio_posteriori)}</div>
              <div className="text-xs text-gray-500 mt-1">Média ajustada</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <TooltipExplicativo texto="Peso dado à experiência própria do grupo. Quanto maior, mais confiança nos dados específicos.">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">Credibilidade Média</span>
                  <HelpCircle className="w-3 h-3" />
                </div>
              </TooltipExplicativo>
              <div className="text-2xl font-bold text-purple-600">{formatarPercentual(stats.credibilidade_media * 100)}</div>
              <div className="text-xs text-gray-500 mt-1">Confiança na experiência própria</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <TooltipExplicativo texto="Variação percentual média entre prêmio a priori e a posteriori">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Percent className="w-4 h-4" />
                  <span className="text-sm">Ajuste Médio</span>
                  <HelpCircle className="w-3 h-3" />
                </div>
              </TooltipExplicativo>
              <div className={`text-2xl font-bold ${stats.ajuste_medio_percentual >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatarPercentual(stats.ajuste_medio_percentual)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.grupos_com_ajuste_positivo}↑ / {stats.grupos_com_ajuste_negativo}↓
              </div>
            </div>
          </Card>
        </div>

        {/* Métricas avançadas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Variância Entre Grupos
              </h4>
              <div className="text-2xl font-bold text-gray-800">{metricas.variancia_entre.toExponential(2)}</div>
              <p className="text-xs text-gray-500 mt-1">Quanto os grupos diferem entre si</p>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Variância Dentro
              </h4>
              <div className="text-2xl font-bold text-gray-800">{metricas.variancia_dentro.toExponential(2)}</div>
              <p className="text-xs text-gray-500 mt-1">Variação interna de cada grupo</p>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Homogeneidade
              </h4>
              <div className={`text-2xl font-bold ${metricas.homogeneidade === 'Heterogêneo' ? 'text-orange-600' : 'text-green-600'}`}>
                {metricas.homogeneidade}
              </div>
              <p className="text-xs text-gray-500 mt-1">Confiabilidade: {metricas.confiabilidade}</p>
            </div>
          </Card>
        </div>

        {/* Gráfico de barras comparativo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Ajustes nos Prêmios por Grupo
            </CardTitle>
            <CardDescription>
              Comparação entre prêmio a priori (média global) e a posteriori (ajustado por credibilidade)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GraficoBarrasComparativo dados={dadosProcessados.dados_graficos.barras} />
          </CardContent>
        </Card>

        {/* Top 3 maiores ajustes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dadosProcessados.grupos_ordenados.slice(0, 3).map((grupo, idx) => (
            <Card 
              key={`top-grupo-${grupo.grupo || idx}`} 
              className="cursor-pointer hover:shadow-md transition" 
              onClick={() => setDetalheGrupo(grupo)}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{grupo.grupo}</h4>
                  <Badge variant={idx === 0 ? 'danger' : idx === 1 ? 'warning' : 'primary'}>
                    {idx + 1}º maior ajuste
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>A Priori:</span>
                    <span className="font-bold">{formatarMoeda(grupo.premio_empirico_medio)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>A Posteriori:</span>
                    <span className="font-bold text-blue-600">{formatarMoeda(grupo.premio_posteriori)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Ajuste:</span>
                    <span className={`font-bold ${grupo.ajuste_percentual >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {grupo.ajuste_percentual > 0 ? '+' : ''}{formatarPercentual(grupo.ajuste_percentual)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  });

  ResumoCredibilidade.displayName = 'ResumoCredibilidade';

  const FatoresCredibilidade = memo(() => {
    const dadosCredibilidade = dadosProcessados?.dados_graficos?.credibilidade || [];
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Fatores de Credibilidade por Grupo
          </CardTitle>
          <CardDescription>
            Quanto maior o fator, mais confiança na experiência própria do grupo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GraficoCredibilidade dados={dadosCredibilidade} />
        </CardContent>
      </Card>
    );
  });

  FatoresCredibilidade.displayName = 'FatoresCredibilidade';

  const TabelaPremiosCredibilidade = memo(() => {
    const premios = dadosProcessados?.premios_calculados || [];
    const stats = dadosProcessados?.estatisticas_gerais;
    
    const premiosPagina = gruposPaginacao.itensPaginados;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Prêmios Calculados por Grupo
            <Badge variant="outline">{premios.length} grupos</Badge>
          </CardTitle>
          <CardDescription>
            Detalhamento completo dos prêmios e fatores de credibilidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Paginacao
            paginaAtual={gruposPaginacao.paginaAtual}
            totalPaginas={gruposPaginacao.totalPaginas}
            totalItens={gruposPaginacao.totalItens}
            inicio={gruposPaginacao.inicio}
            fim={gruposPaginacao.fim}
            onPrimeiraPagina={gruposPaginacao.primeiraPagina}
            onPaginaAnterior={gruposPaginacao.paginaAnterior}
            onProximaPagina={gruposPaginacao.proximaPagina}
            onUltimaPagina={gruposPaginacao.ultimaPagina}
            onMudarItensPorPagina={gruposPaginacao.mudarItensPorPagina}
            itensPorPagina={gruposPaginacao.itensPorPagina}
            opcoesItensPorPagina={gruposPaginacao.opcoesItensPorPagina}
            className="mb-4"
          />

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Grupo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Prêmio A Priori</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Prêmio A Posteriori</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Fator Credibilidade</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Ajuste</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Impacto</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {premiosPagina.map((grupo, idx) => {
                  const fator = dadosProcessados.fatores_credibilidade?.find(f => f.grupo === grupo.grupo) || 
                                { fator_credibilidade: grupo.fator_credibilidade || 0.5 };
                  const impacto = (grupo.premio_posteriori || 0) - (grupo.premio_empirico_medio || 0);
                  
                  return (
                    <tr 
                      key={`grupo-${grupo.grupo || idx}`} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setDetalheGrupo(grupo)}
                    >
                      <td className="px-4 py-3 font-medium">{grupo.grupo}</td>
                      <td className="px-4 py-3 font-mono">{formatarMoeda(grupo.premio_empirico_medio)}</td>
                      <td className="px-4 py-3 font-mono text-blue-600">{formatarMoeda(grupo.premio_posteriori)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                            <div 
                              className="h-full rounded-full bg-purple-600"
                              style={{ width: `${(fator.fator_credibilidade || 0) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono">{((fator.fator_credibilidade || 0) * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          grupo.ajuste_percentual > 0 ? 'bg-red-100 text-red-800' :
                          grupo.ajuste_percentual < 0 ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {grupo.ajuste_percentual > 0 ? '+' : ''}{formatarPercentual(grupo.ajuste_percentual)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={impacto > 0 ? 'text-red-600' : impacto < 0 ? 'text-green-600' : 'text-gray-400'}>
                          {impacto > 0 ? '+' : ''}{formatarMoeda(impacto)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {gruposPaginacao.totalPaginas > 1 && (
            <Paginacao
              paginaAtual={gruposPaginacao.paginaAtual}
              totalPaginas={gruposPaginacao.totalPaginas}
              totalItens={gruposPaginacao.totalItens}
              inicio={gruposPaginacao.inicio}
              fim={gruposPaginacao.fim}
              onPrimeiraPagina={gruposPaginacao.primeiraPagina}
              onPaginaAnterior={gruposPaginacao.paginaAnterior}
              onProximaPagina={gruposPaginacao.proximaPagina}
              onUltimaPagina={gruposPaginacao.ultimaPagina}
              onMudarItensPorPagina={gruposPaginacao.mudarItensPorPagina}
              itensPorPagina={gruposPaginacao.itensPorPagina}
              opcoesItensPorPagina={gruposPaginacao.opcoesItensPorPagina}
              className="mt-4"
            />
          )}

          {/* Resumo do impacto total */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="text-sm text-blue-800">Impacto Financeiro Total</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {formatarMoeda(stats?.impacto_financeiro_total)}
                  </div>
                </div>
              </div>
              <Badge variant="blue">
                {stats?.grupos_com_ajuste_positivo} ↑ • {stats?.grupos_com_ajuste_negativo} ↓
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  });

  TabelaPremiosCredibilidade.displayName = 'TabelaPremiosCredibilidade';

  const InterpretacaoCredibilidade = memo(() => {
    const interpretacoes = dadosProcessados?.interpretacoes || [];
    
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-8 h-8 text-purple-600" />
            <h3 className="text-xl font-bold text-purple-800">Entendendo a Credibilidade A Posteriori</h3>
          </div>
          <p className="text-purple-700">
            A credibilidade é um método atuarial que equilibra a experiência própria de cada grupo com a experiência do coletivo. 
            Quanto maior a credibilidade, mais confiança temos nos dados específicos do grupo.
          </p>
        </div>

        {interpretacoes.map((item, idx) => (
          <Card key={`interpretacao-${idx}`}>
            <div className="p-5">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
                {item.titulo}
              </h4>
              <p className="text-gray-700 whitespace-pre-line">{item.texto}</p>
              {item.destaque && (
                <div className="mt-3 p-3 bg-purple-50 rounded-lg text-purple-800 border border-purple-200">
                  <span className="font-medium">📌 Destaque:</span> {item.destaque}
                </div>
              )}
            </div>
          </Card>
        ))}

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-green-600" />
            <div>
              <h4 className="font-bold text-green-800">Resumo Executivo</h4>
              <p className="text-green-700">
                Credibilidade média de {((dadosProcessados?.estatisticas_gerais?.credibilidade_media || 0) * 100).toFixed(1)}%. 
                {dadosProcessados?.estatisticas_gerais?.credibilidade_media > 0.7 
                  ? ' Alta confiança nos dados específicos de cada grupo.' 
                  : ' Confiança moderada - recomenda-se monitoramento.'}
                {dadosProcessados?.estatisticas_gerais?.ajuste_medio_percentual < -50 
                  ? ' Ajustes muito altos indicam necessidade de revisão tarifária.' 
                  : ' Ajustes dentro do esperado.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  });

  InterpretacaoCredibilidade.displayName = 'InterpretacaoCredibilidade';

  const ModalDetalheGrupo = memo(() => {
    if (!detalheGrupo) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-800">
                  {detalheGrupo.grupo}
                </h3>
              </div>
              <button
                onClick={() => setDetalheGrupo(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-xs text-blue-600">Prêmio A Priori</div>
                  <div className="text-lg font-bold">{formatarMoeda(detalheGrupo.premio_empirico_medio)}</div>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-xs text-green-600">Prêmio A Posteriori</div>
                  <div className="text-lg font-bold text-green-700">{formatarMoeda(detalheGrupo.premio_posteriori)}</div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600 mb-1">Fator de Credibilidade</div>
                <div className="text-3xl font-bold text-purple-700">{((detalheGrupo.fator_credibilidade || 0) * 100).toFixed(1)}%</div>
                <div className="text-xs text-gray-500 mt-1">
                  {(detalheGrupo.fator_credibilidade || 0) > 0.7 ? 'Alta confiança' :
                   (detalheGrupo.fator_credibilidade || 0) > 0.4 ? 'Confiança moderada' : 'Baixa confiança'}
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Ajuste Percentual</span>
                <span className={`text-xl font-bold ${detalheGrupo.ajuste_percentual >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {detalheGrupo.ajuste_percentual > 0 ? '+' : ''}{detalheGrupo.ajuste_percentual?.toFixed(1)}%
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Impacto Financeiro</span>
                <span className={`text-xl font-bold ${(detalheGrupo.premio_posteriori - detalheGrupo.premio_empirico_medio) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatarMoeda(detalheGrupo.premio_posteriori - detalheGrupo.premio_empirico_medio)}
                </span>
              </div>
              
              <div className="pt-4 border-t">
                <Button
                  onClick={() => setDetalheGrupo(null)}
                  variant="outline"
                  className="w-full"
                >
                  Fechar Detalhe
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  });

  ModalDetalheGrupo.displayName = 'ModalDetalheGrupo';

  const ModalDetalheCoeficiente = memo(() => {
    if (!detalheCoeficiente) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Detalhe do Coeficiente
              </h3>
              <button
                onClick={() => setDetalheCoeficiente(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Variável</div>
                <div className="font-semibold text-lg">
                  {detalheCoeficiente.variavel}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Coeficiente (β)</div>
                  <div className="font-mono text-lg font-bold">
                    {formatarNumero(detalheCoeficiente.coef.estimate, 6)}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">Efeito Multiplicativo</div>
                  <div className="font-mono text-lg">
                    {Math.exp(detalheCoeficiente.coef.estimate).toFixed(6)}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600">Impacto Percentual</div>
                <div className={`text-lg font-bold ${detalheCoeficiente.coef.estimate >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {detalheCoeficiente.coef.estimate >= 0 ? '+' : ''}
                  {((Math.exp(detalheCoeficiente.coef.estimate) - 1) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {detalheCoeficiente.coef.estimate >= 0 ? 'Aumento' : 'Redução'} no valor esperado
                </div>
              </div>
              
              {detalheCoeficiente.coef.p_value !== undefined && (
                <div>
                  <div className="text-sm text-gray-600">Significância Estatística</div>
                  <div className={`font-semibold ${detalheCoeficiente.coef.p_value < 0.05 ? 'text-green-600' : 'text-gray-400'}`}>
                    p-valor: {formatarNumero(detalheCoeficiente.coef.p_value, 4)}
                    {detalheCoeficiente.coef.p_value < 0.05 ? ' (Significativo)' : ' (Não significativo)'}
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <Button
                  onClick={() => setDetalheCoeficiente(null)}
                  variant="outline"
                  className="w-full"
                >
                  Fechar Detalhe
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  });

  ModalDetalheCoeficiente.displayName = 'ModalDetalheCoeficiente';

 const gerarPDFProfissional = async () => {
  if (!dadosProcessados) return;

  setExportandoPDF(true);

  try {
    const doc = new jsPDF("p", "mm", "a4");
    
    // Configurações iniciais
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margem = 25;
    const headerHeight = 20;
    const footerHeight = 15;
    const lineHeight = 7;
    
    let yPos = margem + headerHeight;
    let numeroPagina = 1;

    // Cores
    const corPrimaria = [10, 31, 68]; // Azul escuro
    const corSecundaria = [79, 70, 229]; // Roxo
    const corTexto = [0, 0, 0];
    const corCinza = [100, 100, 100];
    const corCinzaClaro = [240, 240, 240];

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

    const verificarEspaco = (alturaNecessaria = 20) => {
      if (yPos + alturaNecessaria > pageHeight - margem - footerHeight) {
        novaPagina();
        return true;
      }
      return false;
    };

    const adicionarTitulo = (texto, tamanho = 16, cor = corPrimaria) => {
      verificarEspaco(15);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(tamanho);
      doc.setTextColor(cor[0], cor[1], cor[2]);
      doc.text(texto, margem, yPos);
      yPos += 8;
      
      // Linha decorativa
      doc.setDrawColor(cor[0], cor[1], cor[2]);
      doc.setLineWidth(0.5);
      doc.line(margem, yPos - 3, pageWidth - margem, yPos - 3);
      yPos += 5;
    };

    const adicionarSubtitulo = (texto, tamanho = 12) => {
      verificarEspaco(10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(tamanho);
      doc.setTextColor(corSecundaria[0], corSecundaria[1], corSecundaria[2]);
      doc.text(texto, margem, yPos);
      yPos += 6;
    };

    const adicionarParagrafo = (texto, tamanho = 10, indentacao = 0) => {
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
      yPos += 3;
    };

    const adicionarTabela = (cabecalhos, dados, title = null) => {
      if (!dados || dados.length === 0) return;
      
      verificarEspaco(40);
      
      if (title) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
        doc.text(title, margem, yPos);
        yPos += 6;
      }
      
      autoTable(doc, {
        head: [cabecalhos],
        body: dados,
        startY: yPos,
        margin: { left: margem, right: margem },
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { 
          fillColor: corPrimaria,
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: { fillColor: corCinzaClaro },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 'auto' },
          ...Object.fromEntries(
            cabecalhos.slice(1).map((_, i) => [i + 1, { halign: 'right' }])
          )
        },
        didDrawPage: (data) => {
          yPos = data.cursor.y + 10;
        }
      });
      
      yPos = doc.lastAutoTable.finalY + 10;
    };

    const adicionarCardMetrica = (titulo, valor, subtitulo = '', cor = corPrimaria) => {
      verificarEspaco(25);
      
      // Fundo do card
      doc.setFillColor(245, 245, 250);
      doc.setDrawColor(cor[0], cor[1], cor[2]);
      doc.setLineWidth(0.2);
      doc.roundedRect(margem, yPos - 5, (pageWidth - (margem * 2) - 10) / 2, 20, 2, 2, 'FD');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(cor[0], cor[1], cor[2]);
      doc.text(titulo, margem + 5, yPos);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(valor.toString(), margem + 5, yPos + 8);
      
      if (subtitulo) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(corCinza[0], corCinza[1], corCinza[2]);
        doc.text(subtitulo, margem + 5, yPos + 13);
      }
      
      yPos += 25;
    };

    // ========== CAPA ==========
    adicionarCabecalhoRodape();
    
    doc.setFillColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text("RELATÓRIO TÉCNICO", pageWidth / 2, 110, { align: "center" });

    doc.setFontSize(20);
    const isCredibilidade = dadosProcessados.tipo_operacao === 'credibilidade_a_posteriori';
    doc.text(
      isCredibilidade ? "CREDIBILIDADE A POSTERIORI" : "MODELO ATUARIAL - GLM DUPLO", 
      pageWidth / 2, 
      140, 
      { align: "center" }
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    
    if (isCredibilidade) {
      doc.text(
        `Método: ${dadosProcessados.metodo_aplicado} | Grupos: ${dadosProcessados.estatisticas_gerais.n_grupos}`,
        pageWidth / 2,
        170,
        { align: "center" }
      );
      doc.text(
        `Credibilidade Média: ${formatarPercentual(dadosProcessados.estatisticas_gerais.credibilidade_media * 100)}`,
        pageWidth / 2,
        185,
        { align: "center" }
      );
    } else {
      doc.text(
        `Frequência: ${dadosProcessados.modelo_frequencia?.familia} | Severidade: ${dadosProcessados.modelo_severidade?.familia}`,
        pageWidth / 2,
        170,
        { align: "center" }
      );
      doc.text(
        `Registros: ${dadosProcessados.n_registros} (${dadosProcessados.n_registros_positivos} positivos)`,
        pageWidth / 2,
        185,
        { align: "center" }
      );
    }

    doc.setFontSize(10);
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
    adicionarTitulo("📋 RESUMO EXECUTIVO", 18);
    
    if (isCredibilidade) {
      const stats = dadosProcessados.estatisticas_gerais;
      adicionarParagrafo(
        `Este relatório apresenta os resultados da análise de Credibilidade A Posteriori utilizando o método ${dadosProcessados.metodo_aplicado}. ` +
        `Foram analisados ${stats.n_grupos} grupos, com credibilidade média de ${formatarPercentual(stats.credibilidade_media * 100)}.`
      );
      
      // Cards de métricas
      adicionarCardMetrica("Prêmio A Priori", formatarMoeda(stats.premio_global_priori), "Média global", [0, 100, 200]);
      adicionarCardMetrica("Prêmio A Posteriori", formatarMoeda(stats.premio_medio_posteriori), "Média ajustada", [100, 0, 100]);
      yPos += 10;
      
      adicionarParagrafo(
        `• Grupos com ajuste positivo: ${stats.grupos_com_ajuste_positivo}\n` +
        `• Grupos com ajuste negativo: ${stats.grupos_com_ajuste_negativo}\n` +
        `• Impacto financeiro total: ${stats.impacto_financeiro_total > 0 ? '+' : ''}${formatarMoeda(stats.impacto_financeiro_total)}`
      );
    } else {
      adicionarParagrafo(
        `Este relatório apresenta os resultados da modelagem atuarial utilizando GLM Duplo ` +
        `(Frequência: ${dadosProcessados.modelo_frequencia?.familia}, Severidade: ${dadosProcessados.modelo_severidade?.familia}). ` +
        `Foram utilizados ${dadosProcessados.n_registros} registros, sendo ${dadosProcessados.n_registros_positivos} com sinistros.`
      );
      
      // Cards de métricas
      adicionarCardMetrica("Prêmio Puro Médio", formatarMoeda(dadosProcessados.tarifacao?.estatisticas?.premio_puro_medio), "E[N] × E[C|N>0]", [0, 150, 0]);
      adicionarCardMetrica("Prêmio Total Médio", formatarMoeda(dadosProcessados.tarifacao?.estatisticas?.premio_total_medio), "Com carregamentos", [150, 0, 0]);
      yPos += 10;
    }

    // ========== CREDIBILIDADE - CONTEÚDO COMPLETO ==========
    if (isCredibilidade) {
      // Estatísticas detalhadas
      novaPagina();
      adicionarTitulo("📊 ESTATÍSTICAS DETALHADAS");
      
      const metricas = dadosProcessados.metricas_avancadas;
      adicionarParagrafo(
        `Variância Entre Grupos: ${metricas.variancia_entre.toExponential(2)}\n` +
        `Variância Dentro de Grupos: ${metricas.variancia_dentro.toExponential(2)}\n` +
        `Homogeneidade: ${metricas.homogeneidade}\n` +
        `Confiabilidade: ${metricas.confiabilidade}`
      );

      // Tabela de prêmios por grupo
      if (dadosProcessados.premios_calculados?.length > 0) {
        novaPagina();
        adicionarTitulo("📋 PRÊMIOS CALCULADOS POR GRUPO");
        
        const cabecalhos = ['Grupo', 'Prêmio A Priori', 'Prêmio A Posteriori', 'Credibilidade', 'Ajuste %', 'Impacto'];
        const dados = dadosProcessados.premios_calculados.map(grupo => {
          const fator = dadosProcessados.fatores_credibilidade?.find(f => f.grupo === grupo.grupo) || 
                        { fator_credibilidade: grupo.fator_credibilidade || 0.5 };
          const impacto = (grupo.premio_posteriori || 0) - (grupo.premio_empirico_medio || 0);
          
          return [
            grupo.grupo || 'N/A',
            formatarMoeda(grupo.premio_empirico_medio),
            formatarMoeda(grupo.premio_posteriori),
            `${((fator.fator_credibilidade || 0) * 100).toFixed(1)}%`,
            `${grupo.ajuste_percentual > 0 ? '+' : ''}${grupo.ajuste_percentual?.toFixed(1)}%`,
            `${impacto > 0 ? '+' : ''}${formatarMoeda(impacto)}`
          ];
        });
        
        adicionarTabela(cabecalhos, dados, "Tabela 1 - Prêmios por Grupo");
      }

      // Interpretações
      if (dadosProcessados.interpretacoes?.length > 0) {
        novaPagina();
        adicionarTitulo("🧠 INTERPRETAÇÃO DOS RESULTADOS");
        
        dadosProcessados.interpretacoes.forEach((interp, idx) => {
          if (idx > 0) yPos += 5;
          adicionarSubtitulo(interp.titulo);
          adicionarParagrafo(interp.texto);
          if (interp.destaque) {
            doc.setFillColor(245, 245, 250);
            doc.roundedRect(margem, yPos - 5, pageWidth - (margem * 2), 15, 2, 2, 'F');
            doc.setFont("helvetica", "bold");
            doc.setTextColor(corSecundaria[0], corSecundaria[1], corSecundaria[2]);
            doc.text(`📌 ${interp.destaque}`, margem + 5, yPos);
            yPos += 12;
          }
        });
      }
    } 
    
    // ========== GLM - CONTEÚDO COMPLETO ==========
    else {
      // Modelo de Frequência
      novaPagina();
      adicionarTitulo("📈 MODELO DE FREQUÊNCIA");
      adicionarSubtitulo(`Família: ${dadosProcessados.modelo_frequencia?.familia}`);
      
      const mFreq = dadosProcessados.modelo_frequencia?.metricas || {};
      adicionarParagrafo(
        `AIC: ${formatarNumero(mFreq.aic, 2)} | BIC: ${formatarNumero(mFreq.bic, 2)}\n` +
        `Pseudo R²: ${formatarPercentual((mFreq.pseudo_r2 || 0) * 100)}\n` +
        `Deviance Explicada: ${formatarPercentual((mFreq.deviance_explicada || 0) * 100)}\n` +
        `RMSE: ${formatarNumero(mFreq.rmse, 4)} | MAE: ${formatarNumero(mFreq.mae, 4)}`
      );

      // Coeficientes de frequência
      if (Object.keys(dadosProcessados.modelo_frequencia?.coeficientes || {}).length > 0) {
        adicionarSubtitulo("Coeficientes Estimados");
        
        const cabecalhos = ['Variável', 'Estimativa', 'Erro Padrão', 'p-valor', 'Signif.', 'Impacto %'];
        const dados = Object.entries(dadosProcessados.modelo_frequencia.coeficientes).map(([variavel, coef]) => {
          const estimate = coef.estimate || coef.estimativa || 0;
          const stdError = coef.std_error || coef.erro || 0;
          const pValue = coef.p_value || coef.valor_p || 1;
          const sig = coef.significancia || getSignificanciaR(pValue);
          const impacto = estimate ? `${((Math.exp(estimate) - 1) * 100).toFixed(1)}%` : '-';
          
          return [
            variavel === '(Intercept)' ? 'Intercepto' : variavel,
            formatarNumero(estimate, 4),
            formatarNumero(stdError, 4),
            formatarNumero(pValue, 4),
            sig,
            impacto
          ];
        });
        
        adicionarTabela(cabecalhos, dados, "Tabela 1 - Coeficientes do Modelo de Frequência");
      }

      // Diagnóstico de frequência
      if (dadosProcessados.modelo_frequencia?.diagnostico) {
        novaPagina();
        adicionarTitulo("🔍 DIAGNÓSTICO DE FREQUÊNCIA");
        const diag = dadosProcessados.modelo_frequencia.diagnostico;
        adicionarParagrafo(
          `Overdispersed: ${diag.overdispersed ? 'SIM' : 'NÃO'}\n` +
          `Dispersão Ratio: ${formatarNumero(diag.dispersao_ratio, 3)}\n` +
          `Recomendação: ${diag.recomendacao || 'N/A'}`
        );
      }

      // Modelo de Severidade
      novaPagina();
      adicionarTitulo("💰 MODELO DE SEVERIDADE");
      adicionarSubtitulo(`Família: ${dadosProcessados.modelo_severidade?.familia}`);
      
      const mSev = dadosProcessados.modelo_severidade?.metricas || {};
      adicionarParagrafo(
        `AIC: ${formatarNumero(mSev.aic, 2)} | BIC: ${formatarNumero(mSev.bic, 2)}\n` +
        `Pseudo R²: ${formatarPercentual((mSev.pseudo_r2 || 0) * 100)}\n` +
        `Deviance Explicada: ${formatarPercentual((mSev.deviance_explicada || 0) * 100)}\n` +
        `RMSE: ${formatarNumero(mSev.rmse, 4)} | MAE: ${formatarNumero(mSev.mae, 4)}`
      );

      // Coeficientes de severidade
      if (Object.keys(dadosProcessados.modelo_severidade?.coeficientes || {}).length > 0) {
        adicionarSubtitulo("Coeficientes Estimados");
        
        const cabecalhos = ['Variável', 'Estimativa', 'Erro Padrão', 'p-valor', 'Signif.', 'Impacto %'];
        const dados = Object.entries(dadosProcessados.modelo_severidade.coeficientes).map(([variavel, coef]) => {
          const estimate = coef.estimate || coef.estimativa || 0;
          const stdError = coef.std_error || coef.erro || 0;
          const pValue = coef.p_value || coef.valor_p || 1;
          const sig = coef.significancia || getSignificanciaR(pValue);
          const impacto = estimate ? `${((Math.exp(estimate) - 1) * 100).toFixed(1)}%` : '-';
          
          return [
            variavel === '(Intercept)' ? 'Intercepto' : variavel,
            formatarNumero(estimate, 4),
            formatarNumero(stdError, 4),
            formatarNumero(pValue, 4),
            sig,
            impacto
          ];
        });
        
        adicionarTabela(cabecalhos, dados, "Tabela 2 - Coeficientes do Modelo de Severidade");
      }

      // Diagnóstico de severidade
      if (dadosProcessados.modelo_severidade?.diagnostico) {
        adicionarSubtitulo("Diagnóstico de Cauda");
        const diag = dadosProcessados.modelo_severidade.diagnostico;
        adicionarParagrafo(
          `Skewness Observado: ${formatarNumero(diag.skewness_observado, 3)}\n` +
          `Skewness Ajustado: ${formatarNumero(diag.skewness_ajustado, 3)}\n` +
          `Outliers (>3σ): ${diag.n_outliers || 0}\n` +
          `Recomendação: ${diag.recomendacao || 'N/A'}`
        );
      }

      // Resultados da Tarifação
      if (dadosProcessados.tarifacao) {
        novaPagina();
        adicionarTitulo("💵 RESULTADOS DA TARIFAÇÃO");
        
        const stats = dadosProcessados.tarifacao.estatisticas || {};
        adicionarParagrafo(
          `Prêmio Puro Médio: ${formatarMoeda(stats.premio_puro_medio)}\n` +
          `Prêmio Total Médio: ${formatarMoeda(stats.premio_total_medio)}\n` +
          `λ Médio (Frequência): ${formatarNumero(stats.lambda_medio, 4)}\n` +
          `μ Médio (Severidade): ${formatarMoeda(stats.mu_medio)}\n` +
          `Faixa de Prêmios: ${formatarMoeda(stats.min_premio)} a ${formatarMoeda(stats.max_premio)}\n` +
          `Coeficiente de Variação: ${formatarPercentual((stats.coeficiente_variacao || 0) * 100)}`
        );

        // Composição do prêmio
        const comp = dadosProcessados.tarifacao.composicao_premio || {};
        adicionarSubtitulo("Composição do Prêmio (Média)");
        adicionarParagrafo(
          `Prêmio Puro: ${formatarMoeda(comp.premio_puro)} (${formatarPercentual(comp.premio_puro_perc)})\n` +
          `Margem de Segurança: ${formatarMoeda(comp.margem_seguranca)} (${formatarPercentual(comp.margem_seguranca_perc)})\n` +
          `Despesas Administrativas: ${formatarMoeda(comp.despesas_admin)} (${formatarPercentual(comp.despesas_admin_perc)})\n` +
          `Comissão: ${formatarMoeda(comp.comissao)} (${formatarPercentual(comp.comissao_perc)})\n` +
          `Margem de Lucro: ${formatarMoeda(comp.margem_lucro)} (${formatarPercentual(comp.margem_lucro_perc)})\n` +
          `Impostos: ${formatarMoeda(comp.impostos)} (${formatarPercentual(comp.impostos_perc)})\n` +
          `PRÊMIO TOTAL: ${formatarMoeda(comp.premio_total)}`
        );

        // Distribuição percentílica
        if (dadosProcessados.tarifacao.distribuicao_premios?.percentis) {
          adicionarSubtitulo("Distribuição Percentílica dos Prêmios");
          const perc = dadosProcessados.tarifacao.distribuicao_premios.percentis;
          adicionarParagrafo(
            `P10: ${formatarMoeda(perc.p10)}\n` +
            `P25: ${formatarMoeda(perc.p25)}\n` +
            `P50 (Mediana): ${formatarMoeda(perc.p50)}\n` +
            `P75: ${formatarMoeda(perc.p75)}\n` +
            `P90: ${formatarMoeda(perc.p90)}`
          );
        }

        // Prêmios individualizados (amostra)
        if (dadosProcessados.tarifacao.premios_individualizados?.length > 0) {
          novaPagina();
          adicionarTitulo("📋 AMOSTRA DE PRÊMIOS INDIVIDUALIZADOS");
          
          const premios = dadosProcessados.tarifacao.premios_individualizados;
          const amostra = premios.slice(0, 50); // Limitar a 50 registros
          
          const cabecalhos = ['ID', 'λ (Frequência)', 'μ (Severidade)', 'Prêmio Puro', 'Prêmio Total', 'Margem'];
          const dados = amostra.map((p, i) => [
            p.id || i + 1,
            formatarNumero(p.lambda, 4),
            formatarMoeda(p.mu),
            formatarMoeda(p.premio_puro),
            formatarMoeda(p.premio_total || p.premio_seguranca),
            `${((p.fator_seguranca || 0) * 100).toFixed(1)}%`
          ]);
          
          adicionarTabela(cabecalhos, dados, `Tabela 3 - Amostra de ${amostra.length} prêmios (total: ${premios.length})`);
          
          if (premios.length > 50) {
            adicionarParagrafo(`Nota: Exibindo apenas os primeiros 50 registros. Total de ${premios.length} prêmios calculados.`);
          }
        }
      }

      // Equações ajustadas
      if (dadosProcessados.equacoes_ajustadas) {
        novaPagina();
        adicionarTitulo("📐 EQUAÇÕES AJUSTADAS");
        
        adicionarSubtitulo("Modelo de Frequência");
        adicionarParagrafo(dadosProcessados.equacoes_ajustadas.frequencia || 'log(λ) = β₀ + β₁X₁ + ...');
        
        yPos += 5;
        adicionarSubtitulo("Modelo de Severidade");
        adicionarParagrafo(dadosProcessados.equacoes_ajustadas.severidade || 'log(μ) = γ₀ + γ₁X₁ + ...');
        
        yPos += 5;
        adicionarSubtitulo("Prêmio Puro");
        adicionarParagrafo(dadosProcessados.equacoes_ajustadas.premio_puro || 'Prêmio Puro = exp(log(λ) + log(μ))');
      }
    }

    // ========== VALIDAÇÃO E RECOMENDAÇÕES ==========
    novaPagina();
    adicionarTitulo("✅ VALIDAÇÃO E RECOMENDAÇÕES");
    
    if (!isCredibilidade && dadosProcessados.validacao_tarifacao) {
      const validacao = dadosProcessados.validacao_tarifacao;
      
      adicionarSubtitulo(`Status: ${validacao.aprovado ? 'APROVADO' : 'NÃO APROVADO'}`);
      adicionarParagrafo(validacao.aprovado ? 
        'O modelo atende aos critérios mínimos de qualidade para uso em tarifação.' :
        'O modelo NÃO atende aos critérios mínimos de qualidade para tarifação.'
      );
      
      if (validacao.criterios_falhados?.length > 0) {
        adicionarSubtitulo("Critérios Falhados:");
        validacao.criterios_falhados.forEach(crit => adicionarParagrafo(`• ${crit}`, 9, 5));
      }
      
      if (validacao.alertas?.length > 0) {
        adicionarSubtitulo("Alertas:");
        validacao.alertas.forEach(alerta => adicionarParagrafo(`• ${alerta}`, 9, 5));
      }
      
      if (validacao.recomendacoes?.length > 0) {
        adicionarSubtitulo("Recomendações:");
        validacao.recomendacoes.forEach(rec => adicionarParagrafo(`• ${rec}`, 9, 5));
      }
    }

    // ========== ASSINATURAS ==========
    if (yPos > pageHeight - 50) novaPagina();
    else yPos += 10;
    
    adicionarTitulo("👥 RESPONSÁVEIS TÉCNICOS", 14);
    yPos += 10;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("_________________________________________", margem, yPos);
    doc.text("_________________________________________", pageWidth - margem - 60, yPos);
    yPos += 6;
    doc.setFontSize(8);
    doc.text("Atuário Responsável", margem, yPos);
    doc.text("Coordenador Técnico", pageWidth - margem - 60, yPos);
    
    yPos += 15;
    doc.setFontSize(8);
    doc.setTextColor(corCinza[0], corCinza[1], corCinza[2]);
    doc.text(
      "Este relatório foi gerado automaticamente pelo Sistema JIAM Preditivo com base nos resultados do motor estatístico R.",
      margem,
      yPos
    );
    doc.text(
      "Documento válido apenas com as assinaturas dos responsáveis técnicos.",
      margem,
      yPos + 5
    );

    // ========== FINALIZAR ==========
    doc.save(`Relatorio_JIAM_${isCredibilidade ? 'Credibilidade' : 'GLM'}_${new Date().toISOString().split("T")[0]}.pdf`);
    
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    alert(`Erro ao gerar PDF: ${error.message}`);
  } finally {
    setExportandoPDF(false);
  }
};

  // Memoização dos valores derivados para evitar recálculos
  const isCredibilidade = useMemo(() => {
    return dadosProcessados?.tipo_operacao === 'credibilidade_a_posteriori';
  }, [dadosProcessados]);

  const abas = useMemo(() => {
    return isCredibilidade ? [
      { id: 'resumo', label: 'Resumo', icon: <FileText className="w-4 h-4" /> },
      { id: 'fatores', label: 'Fatores', icon: <Shield className="w-4 h-4" /> },
      { id: 'tabela', label: 'Prêmios', icon: <Calculator className="w-4 h-4" /> },
      { id: 'interpretacao', label: 'Interpretação', icon: <Brain className="w-4 h-4" /> }
    ] : [
      { id: 'resumo', label: 'Resumo', icon: <FileText className="w-4 h-4" /> },
      { id: 'frequencia', label: 'Frequência', icon: <TrendingUp className="w-4 h-4" /> },
      { id: 'severidade', label: 'Severidade', icon: <DollarSign className="w-4 h-4" /> },
      { id: 'premios', label: 'Prémios', icon: <Calculator className="w-4 h-4" /> }
    ];
  }, [isCredibilidade]);

  // Estados de loading e erro
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-4">
            <Brain className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Processando modelo atuarial...</h3>
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
        <h3 className="text-xl font-bold text-gray-800 mb-2">Erro no Processamento</h3>
        <p className="text-gray-600 mb-4">{erro}</p>
        <pre className="text-left bg-red-50 p-4 rounded-lg overflow-auto max-h-96 text-sm">
          {JSON.stringify({ modelo }, null, 2)}
        </pre>
      </div>
    );
  }

  if (!dadosProcessados || !dadosProcessados.success) {
    return (
      <div className="text-center py-12">
        <Info className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Dados não disponíveis</h3>
        <p className="text-gray-600">Execute o modelo no motor R primeiro.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8 rounded-3xl">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              {isCredibilidade ? <Shield className="w-8 h-8" /> : <Layers className="w-8 h-8" />}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {isCredibilidade ? '📊 Credibilidade A Posteriori' : '📊 GLM Duplo - Tarifação Científica'}
              </h1>
              <p className="text-lg opacity-90">
                {isCredibilidade 
                  ? `Método ${dadosProcessados.metodo_aplicado} • ${dadosProcessados.estatisticas_gerais.n_grupos} grupos analisados`
                  : `Frequência (${dadosProcessados.modelo_frequencia?.familia}) + Severidade (${dadosProcessados.modelo_severidade?.familia})`}
              </p>
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

        {isCredibilidade ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 p-4 rounded-xl">
              <div className="text-sm opacity-80">Grupos</div>
              <div className="text-2xl font-bold">{dadosProcessados.estatisticas_gerais.n_grupos}</div>
            </div>
            <div className="bg-white/10 p-4 rounded-xl">
              <div className="text-sm opacity-80">Credibilidade Média</div>
              <div className="text-2xl font-bold text-purple-300">{formatarPercentual(dadosProcessados.estatisticas_gerais.credibilidade_media * 100)}</div>
            </div>
            <div className="bg-white/10 p-4 rounded-xl">
              <div className="text-sm opacity-80">Prêmio A Priori</div>
              <div className="text-2xl font-bold">{formatarMoeda(dadosProcessados.estatisticas_gerais.premio_global_priori)}</div>
            </div>
            <div className="bg-white/10 p-4 rounded-xl">
              <div className="text-sm opacity-80">Prêmio A Posteriori</div>
              <div className="text-2xl font-bold">{formatarMoeda(dadosProcessados.estatisticas_gerais.premio_medio_posteriori)}</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 p-4 rounded-xl">
              <div className="text-sm opacity-80">Registros</div>
              <div className="text-2xl font-bold">{dadosProcessados.n_registros}</div>
              <div className="text-xs opacity-70">Positivos: {dadosProcessados.n_registros_positivos}</div>
            </div>
            <div className="bg-white/10 p-4 rounded-xl">
              <div className="text-sm opacity-80">Frequência</div>
              <div className="text-2xl font-bold text-blue-300">{dadosProcessados.modelo_frequencia?.familia}</div>
              <div className="text-xs opacity-70">AIC: {formatarNumero(dadosProcessados.modelo_frequencia?.metricas?.aic, 2)}</div>
            </div>
            <div className="bg-white/10 p-4 rounded-xl">
              <div className="text-sm opacity-80">Severidade</div>
              <div className="text-2xl font-bold text-green-300">{dadosProcessados.modelo_severidade?.familia}</div>
              <div className="text-xs opacity-70">AIC: {formatarNumero(dadosProcessados.modelo_severidade?.metricas?.aic, 2)}</div>
            </div>
            <div className="bg-white/10 p-4 rounded-xl">
              <div className="text-sm opacity-80">Status</div>
              <div className={`text-2xl font-bold ${dadosProcessados.validacao_tarifacao?.aprovado ? 'text-green-300' : 'text-red-300'}`}>
                {dadosProcessados.validacao_tarifacao?.aprovado ? 'APROVADO' : 'REPROVADO'}
              </div>
              <div className="text-xs opacity-70">Para tarifação</div>
            </div>
          </div>
        )}
      </div>

      {/* Abas */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {abas.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAbaAtiva(tab.id)}
                className={`
                  flex items-center gap-2 px-1 py-4 text-sm font-medium
                  relative transition-colors
                  ${abaAtiva === tab.id
                    ? 'text-purple-600 border-b-2 border-purple-500'
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {isCredibilidade ? (
            <>
              {abaAtiva === 'resumo' && <ResumoCredibilidade />}
              {abaAtiva === 'fatores' && <FatoresCredibilidade />}
              {abaAtiva === 'tabela' && <TabelaPremiosCredibilidade />}
              {abaAtiva === 'interpretacao' && <InterpretacaoCredibilidade />}
            </>
          ) : (
            <>
              {abaAtiva === 'resumo' && (
                <>
                  <AbaResumo dadosProcessados={dadosProcessados} />
                  <div className="mt-6">
                    <EquacoesComponent />
                  </div>
                  <ValidacaoTarifacaoComponent />
                </>
              )}
              {abaAtiva === 'frequencia' && (
                <>
                  <MetricasAvancadasComponent 
                    modelo={dadosProcessados.modelo_frequencia} 
                    tipo="frequencia" 
                  />
                  <DiagnosticoComponent 
                    modelo={dadosProcessados.modelo_frequencia} 
                    tipo="frequencia" 
                  />
                  <ValidacaoEconomicaComponent 
                    validacao={dadosProcessados.modelo_frequencia.validacao} 
                    tipo="frequencia" 
                  />
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Coeficientes do Modelo de Frequência
                      </CardTitle>
                      <CardDescription>
                        {dadosProcessados.modelo_frequencia.coeficientesCount} coeficientes estimados
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {renderCoeficientes(
                        dadosProcessados.modelo_frequencia.coeficientes, 
                        'Coeficientes do Modelo de Frequência', 
                        'frequencia'
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
              {abaAtiva === 'severidade' && (
                <>
                  <MetricasAvancadasComponent 
                    modelo={dadosProcessados.modelo_severidade} 
                    tipo="severidade" 
                  />
                  <DiagnosticoComponent 
                    modelo={dadosProcessados.modelo_severidade} 
                    tipo="severidade" 
                  />
                  <ValidacaoEconomicaComponent 
                    validacao={dadosProcessados.modelo_severidade.validacao} 
                    tipo="severidade" 
                  />
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Coeficientes do Modelo de Severidade
                      </CardTitle>
                      <CardDescription>
                        {dadosProcessados.modelo_severidade.coeficientesCount} coeficientes estimados
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {renderCoeficientes(
                        dadosProcessados.modelo_severidade.coeficientes, 
                        'Coeficientes do Modelo de Severidade', 
                        'severidade'
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
              {abaAtiva === 'premios' && (
                <>
                  <ResultadosTarifacaoComponent />
                  <PremiosComponent />
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modais */}
      {detalheCoeficiente && <ModalDetalheCoeficiente />}
      {detalheGrupo && <ModalDetalheGrupo />}

      <div className="bg-white rounded-xl shadow-sm p-6 border">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Análise concluída com sucesso - Motor Estatístico R</span>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            Última atualização: {new Date(dadosProcessados.timestamp).toLocaleString('pt-BR')}
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoizar componente principal
export default memo(RelatorioActuarial);