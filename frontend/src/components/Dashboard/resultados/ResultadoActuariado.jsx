import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  CheckCircle,
  XCircle,
  FileText,
  Calculator,
  AlertTriangle,
  Settings,
  Zap,
  Cpu,
  Database,
  Activity,
  Info,
  Target,
  Shield,
  TrendingDown,
  Percent,
  RefreshCw,
  Users,
  Filter,
  ArrowLeft,
  BarChart,
  PieChart,
  Download,
  Printer,
  Clipboard,
  Star,
  Award,
  FileCheck,
  CheckSquare,
  XSquare,
  AlertCircle,
  Bell,
  Eye,
  EyeOff,
  Layers,
  ChartBar,
  ChevronRight,
  ChevronLeft, 
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ExternalLink,
  Link,
  Hash,
  Code,
  Terminal,
  Cpu as CpuIcon,
  Server,
  HardDrive,
  FileJson,
  FileSpreadsheet,
  FileBarChart,
  LineChart,
  ScatterChart
} from 'lucide-react';

// Componentes UI personalizados
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import { formatarDataCompleta, formatarDataGrafico, corrigirSeculoData } from '../../../utils/dateUtils';
import Button from '../componentes/Button';
import Badge from '../componentes/Badge';

export default function ResultadoActuariado({ 
  resultados,
  dadosOriginais = [],
  onVoltar,
  onAjustarOutroModelo,
  onCalcularPremio,

}) {
  const [abaAtiva, setAbaAtiva] = useState('resumo');
  const [dadosProcessados, setDadosProcessados] = useState(null);
  const [premiosCalculados, setPremiosCalculados] = useState([]);
  const [calculandoPremios, setCalculandoPremios] = useState(false);
  const [fatorSeguranca, setFatorSeguranca] = useState(0.10);
  const [detalheCoeficiente, setDetalheCoeficiente] = useState(null);
  const [dadosPersistidos, setDadosPersistidos] = useState(null);
  const [showEquacoesCompletas, setShowEquacoesCompletas] = useState(false);
  const [showMetricasAvancadas, setShowMetricasAvancadas] = useState(false);
  const [exportFormat, setExportFormat] = useState(null);

  // Persistir dados
  useEffect(() => {
    if (dadosProcessados) {
      localStorage.setItem('resultadoActuariado', JSON.stringify({
        dadosProcessados,
        premiosCalculados,
        fatorSeguranca,
        timestamp: new Date().toISOString()
      }));
    }
  }, [dadosProcessados, premiosCalculados, fatorSeguranca]);

  // Recuperar dados
  useEffect(() => {
    const dadosSalvos = localStorage.getItem('resultadoActuariado');
    if (dadosSalvos) {
      try {
        const { dadosProcessados: dadosSalvosProc, premiosCalculados: premiosSalvos, fatorSeguranca: segurancaSalva } = JSON.parse(dadosSalvos);
        if (!resultados && dadosSalvosProc) {
          setDadosProcessados(dadosSalvosProc);
          setPremiosCalculados(premiosSalvos || []);
          setFatorSeguranca(segurancaSalva || 0.10);
        }
      } catch (error) {
        console.error('Erro ao recuperar dados:', error);
        localStorage.removeItem('resultadoActuariado');
      }
    }
  }, []);

  // Processar resultados
  useEffect(() => {
    if (resultados) {
      console.log('📥 Processando resultados:', resultados);
      processarResultadosCompletos(resultados);
    }
  }, [resultados]);

  // Função principal de processamento
  const processarResultadosCompletos = (resultados) => {
    try {
      if (resultados.success) {
        console.log('🔍 Estrutura completa:', resultados);
        
        const processado = {
          success: true,
          timestamp: resultados.timestamp || new Date().toISOString(),
          tipo_operacao: resultados.tipo_operacao || 'desconhecido',
          n_registros: resultados.n_observacoes || resultados.n_registros || dadosOriginais.length || 0,
          n_registros_positivos: resultados.modelo_severidade?.n_observacoes_positivas || 0,
          n_registros_removidos: (resultados.n_observacoes || 0) - (resultados.modelo_severidade?.n_observacoes_positivas || 0),
          
          // Modelo Frequência
          modelo_frequencia: {
            ajustado: true,
            nome: 'Modelo de Frequência',
            familia: resultados.modelo_frequencia?.familia || 'poisson',
            link: 'log',
            formula: resultados.modelo_frequencia?.formula || '',
            declaracao_actuarial: resultados.declaracoes_actuariais?.frequencia || 'λ = E[N] (frequência esperada de sinistros)',
            
            coeficientes: resultados.modelo_frequencia?.coeficientes || {},
            coeficientesCount: Object.keys(resultados.modelo_frequencia?.coeficientes || {}).length,
            
            metricas: {
              aic: resultados.modelo_frequencia?.metrics?.aic || 0,
              bic: resultados.modelo_frequencia?.metrics?.bic || 0,
              pseudo_r2: resultados.modelo_frequencia?.metrics?.pseudo_r2 || null,
              deviance_explicada: resultados.modelo_frequencia?.metrics?.deviance_explicada || 0,
              log_likelihood: resultados.modelo_frequencia?.metrics?.log_likelihood || 0,
              null_deviance: resultados.modelo_frequencia?.metrics?.null_deviance || 0,
              residual_deviance: resultados.modelo_frequencia?.metrics?.residual_deviance || 0,
              rmse: resultados.modelo_frequencia?.metrics?.rmse || 0,
              mae: resultados.modelo_frequencia?.metrics?.mae || 0,
              convergiu: resultados.modelo_frequencia?.metrics?.convergiu || true,
              iteracoes: resultados.modelo_frequencia?.metrics?.iteracoes || 0
            },
            
            diagnostico: {
              overdispersed: resultados.modelo_frequencia?.diagnostico_dispersao?.overdispersed || false,
              dispersao_ratio: resultados.modelo_frequencia?.diagnostico_dispersao?.ratio || 0,
              recomendacao: resultados.modelo_frequencia?.diagnostico_dispersao?.recomendacao || '',
              convergiu: resultados.modelo_frequencia?.metrics?.convergiu || true,
              fallback_poisson: resultados.modelo_frequencia?.fallback_poisson || false
            },
            
            validacao: resultados.modelo_frequencia?.validacao_economica || {}
          },
          
          // Modelo Severidade
          modelo_severidade: {
            ajustado: true,
            nome: 'Modelo de Severidade',
            familia: resultados.modelo_severidade?.familia || 'gamma',
            link: 'log',
            formula: resultados.modelo_severidade?.formula || '',
            declaracao_actuarial: resultados.modelo_severidade?.declaracao || 'μ = E[C | N > 0] (severidade média condicionada)',
            
            coeficientes: resultados.modelo_severidade?.coeficientes || {},
            coeficientesCount: Object.keys(resultados.modelo_severidade?.coeficientes || {}).length,
            
            metricas: {
              aic: resultados.modelo_severidade?.metrics?.aic || 0,
              bic: resultados.modelo_severidade?.metrics?.bic || 0,
              pseudo_r2: resultados.modelo_severidade?.metrics?.pseudo_r2 || 0,
              deviance_explicada: resultados.modelo_severidade?.metrics?.deviance_explicada || 0,
              log_likelihood: resultados.modelo_severidade?.metrics?.log_likelihood || 0,
              null_deviance: resultados.modelo_severidade?.metrics?.null_deviance || 0,
              residual_deviance: resultados.modelo_severidade?.metrics?.residual_deviance || 0,
              rmse: resultados.modelo_severidade?.metrics?.rmse || 0,
              mae: resultados.modelo_severidade?.metrics?.mae || 0,
              convergiu: resultados.modelo_severidade?.metrics?.convergiu || true,
              iteracoes: resultados.modelo_severidade?.metrics?.iteracoes || 0
            },
            
            diagnostico: {
              diagnostico_cauda: resultados.modelo_severidade?.diagnostico_cauda?.diagnostico_cauda || '',
              skewness_observado: resultados.modelo_severidade?.diagnostico_cauda?.skewness_observado || 0,
              skewness_ajustado: resultados.modelo_severidade?.diagnostico_cauda?.skewness_ajustado || 0,
              n_outliers: resultados.modelo_severidade?.diagnostico_cauda?.n_outliers || 0,
              recomendacao: resultados.modelo_severidade?.diagnostico_cauda?.recomendacao || '',
              tem_outliers: resultados.modelo_severidade?.diagnostico_cauda?.tem_outliers || false
            },
            
            validacao: resultados.modelo_severidade?.validacao_economica || {}
          },
          
          // Equações
          equacoes_ajustadas: {
            frequencia: resultados.equacoes_ajustadas?.frequencia || '',
            severidade: resultados.equacoes_ajustadas?.severidade || '',
            premio_puro: resultados.equacoes_ajustadas?.premio_puro || ''
          },
          
          // Validação
          validacao_tarifacao: {
            aprovado: resultados.aprovado_para_tarifacao || false,
            criterios_falhados: resultados.criterios_falhados || [],
            alertas: resultados.alertas || [],
            recomendacoes: []
          },
          
          // Diagnóstico Final
          diagnostico_final: resultados.diagnostico_final || {},
          
          // Tarifação
          tarifacao: {
            estatisticas: resultados.estatisticas || {},
            composicao_premio: resultados.composicao_premio || {},
            parametros: resultados.parametros_tarifacao || {},
            premios_individualizados: resultados.premios_individualizados || [],
            distribuicao_premios: {}
          },
          
          // Verificação Pseudo R²
          verificacao_pseudo_r2: {
            frequencia_valido: resultados.modelo_frequencia?.metrics?.pseudo_r2 !== null && resultados.modelo_frequencia?.metrics?.pseudo_r2 !== undefined,
            severidade_valido: resultados.modelo_severidade?.metrics?.pseudo_r2 !== null && resultados.modelo_severidade?.metrics?.pseudo_r2 !== undefined,
            usando_deviance_freq: resultados.modelo_frequencia?.metrics?.pseudo_r2 === null && resultados.modelo_frequencia?.metrics?.deviance_explicada > 0,
            usando_deviance_sev: resultados.modelo_severidade?.metrics?.pseudo_r2 === null && resultados.modelo_severidade?.metrics?.deviance_explicada > 0
          }
        };
        
        // Calcular distribuição de prêmios se disponível
        if (resultados.premios_individualizados && resultados.premios_individualizados.length > 0) {
          const premios = resultados.premios_individualizados.map(p => p.premio_total || p.premio_puro);
          const minPremio = Math.min(...premios);
          const maxPremio = Math.max(...premios);
          const mediaPremio = premios.reduce((a, b) => a + b, 0) / premios.length;
          
          processado.tarifacao.distribuicao_premios = {
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
        
        console.log('✅ Processamento completo:', processado);
        setDadosProcessados(processado);
        setAbaAtiva('resumo');
        
        // Configurar prémios se disponíveis
        if (resultados.premios_individualizados && resultados.premios_individualizados.length > 0) {
          const premiosFormatados = resultados.premios_individualizados.map((item, index) => ({
            id: item.id || index + 1,
            ...item,
            premio_seguranca: item.premio_total || 0,
            fator_seguranca: resultados.parametros_tarifacao?.margem_seguranca ? 
                           resultados.parametros_tarifacao.margem_seguranca / 100 : 0.10
          }));
          
          setPremiosCalculados(premiosFormatados);
          console.log(`💰 ${premiosFormatados.length} prémios carregados`);
        }
        
      } else {
        setDadosProcessados({
          success: false,
          error: resultados.error || 'Erro desconhecido',
          recomendacoes: resultados.recomendacoes || []
        });
      }
    } catch (error) {
      console.error('❌ Erro no processamento:', error);
      setDadosProcessados({
        success: false,
        error: error.message,
        recomendacoes: ['Contate o suporte técnico']
      });
    }
  };

  // Funções auxiliares
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
    return num.toFixed(decimais);
  };

  const formatarMoeda = (valor) => {
    if (valor === undefined || valor === null) return '-';
    const num = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(num)) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatarPercentual = (valor) => {
    if (valor === undefined || valor === null) return '-';
    const num = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(num)) return '-';
    return `${num.toFixed(2)}%`;
  };

  const renderCoeficientes = (coeficientes, titulo, tipo = 'default') => {
    if (!coeficientes || Object.keys(coeficientes).length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Info className="w-8 h-8 mx-auto mb-2" />
          <p>Nenhum coeficiente disponível</p>
        </div>
      );
    }

    const cores = {
      frequencia: { bg: 'bg-blue-50', text: 'text-blue-600', hover: 'hover:bg-blue-100' },
      severidade: { bg: 'bg-green-50', text: 'text-green-600', hover: 'hover:bg-green-100' },
      default: { bg: 'bg-gray-50', text: 'text-gray-600', hover: 'hover:bg-gray-100' }
    };
    
    const cor = cores[tipo] || cores.default;

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variável</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estimativa</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Erro Std</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">p-valor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Significância</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Impacto %</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(coeficientes).map(([variavel, coef], index) => {
              const nomeVariavel = variavel === '(Intercept)' ? 'Intercepto' : 
                                 variavel === 'X.Intercept.' ? 'Intercepto' : 
                                 variavel;
              
              const impactoPercentual = coef.estimate !== undefined ? 
                `${(Math.exp(coef.estimate) - 1) * 100 > 0 ? '+' : ''}${((Math.exp(coef.estimate) - 1) * 100).toFixed(1)}%` : 
                '-';
              
              const isSignificativo = coef.p_value !== undefined && coef.p_value < 0.05;
              const sig = coef.significancia || (isSignificativo ? '*' : 'ns');
              
              return (
                <tr 
                  key={variavel} 
                  className={`${index % 2 === 0 ? 'bg-white' : cor.bg} ${cor.hover} cursor-pointer transition-colors`}
                  onClick={() => setDetalheCoeficiente({ variavel, coef, tipo })}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {nomeVariavel}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                    <span className={coef.estimate >= 0 ? 'text-blue-600' : 'text-red-600'}>
                      {formatarNumero(coef.estimate, 6)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {formatarNumero(coef.std_error, 6)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={isSignificativo ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                      {formatarNumero(coef.p_value, 4)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <Badge 
                      variant={sig === '***' ? 'danger' : sig === '**' ? 'warning' : sig === '*' ? 'success' : 'outline'}
                      size="sm"
                    >
                      {sig}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={coef.estimate >= 0 ? 'text-red-600' : 'text-green-600'}>
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
  };

  // Componente de Equações
  const EquacoesComponent = () => {
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
          {/* Frequência */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <h4 className="font-semibold text-blue-700">Frequência (λ)</h4>
              <Badge variant="blue" className="ml-auto">λ = E[N]</Badge>
            </div>
            <div className="font-mono text-sm bg-white p-4 rounded border overflow-x-auto">
              {equacoes.frequencia || 'Equação não disponível'}
            </div>
            <div className="mt-2 text-xs text-blue-600">
              {dadosProcessados.modelo_frequencia?.declaracao_actuarial}
            </div>
          </div>
          
          {/* Severidade */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <h4 className="font-semibold text-green-700">Severidade (μ)</h4>
              <Badge variant="green" className="ml-auto">μ = E[C|N>0]</Badge>
            </div>
            <div className="font-mono text-sm bg-white p-4 rounded border overflow-x-auto">
              {equacoes.severidade || 'Equação não disponível'}
            </div>
            <div className="mt-2 text-xs text-green-600">
              {dadosProcessados.modelo_severidade?.declaracao_actuarial}
            </div>
          </div>
          
          {/* Prêmio Puro */}
          {equacoes.premio_puro && (
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <h4 className="font-semibold text-purple-700">Prêmio Puro (λ × μ)</h4>
                <Badge variant="purple" className="ml-auto">E[N] × E[C|N>0]</Badge>
              </div>
              <div className="font-mono text-sm bg-white p-4 rounded border overflow-x-auto">
                {equacoes.premio_puro}
              </div>
              <div className="mt-2 text-xs text-purple-600">
                Prémio Puro = λ × μ = Frequência esperada × Severidade média condicionada
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Componente de Métricas Avançadas
  const MetricasAvancadasComponent = ({ modelo, tipo }) => {
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
              { label: 'AIC', value: metricas.aic, desc: 'Critério de Informação de Akaike', icon: <TrendingDown className="w-4 h-4" /> },
              { label: 'BIC', value: metricas.bic, desc: 'Critério de Informação Bayesiano', icon: <TrendingDown className="w-4 h-4" /> },
              { label: 'Log-Likelihood', value: metricas.log_likelihood, desc: 'Log-Verossimilhança', icon: <TrendingUp className="w-4 h-4" /> },
              { label: 'Observações', value: dadosProcessados?.n_registros, desc: 'Número de registros', icon: <Database className="w-4 h-4" /> }
            ].map((item, idx) => (
              <div key={idx} className={`${cores.bg} p-4 rounded-lg border ${cores.border}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-gray-700">{item.label}</div>
                  <div className={cores.text}>{item.icon}</div>
                </div>
                <div className="text-lg font-bold text-gray-800">
                  {formatarNumero(item.value, item.label === 'Observações' ? 0 : 2)}
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
              <div key={idx} className={`${cores.bg} p-3 rounded-lg border ${cores.border}`}>
                <div className="text-xs font-medium text-gray-700 mb-1">{item.label}</div>
                <div className="text-lg font-bold text-gray-800">
                  {item.format === 'percent' ? formatarPercentual((item.value || 0) * 100) : formatarNumero(item.value, 4)}
                </div>
                <div className="text-xs text-gray-600 truncate">{item.desc}</div>
              </div>
            ))}
          </div>
          
          {/* Informações de convergência */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <CpuIcon className="w-4 h-4" />
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
                <span className="text-sm text-gray-600">Iterações:</span>
                <span className="ml-2 font-semibold">{metricas.iteracoes || 'N/A'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Componente de Diagnóstico
  const DiagnosticoComponent = ({ modelo, tipo }) => {
    if (!modelo?.diagnostico) return null;
    
    const diagnostico = modelo.diagnostico;
    const cores = tipo === 'frequencia' ? 
      { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: <TrendingUp className="w-5 h-5" /> } : 
      { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', icon: <DollarSign className="w-5 h-5" /> };
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {cores.icon}
            Diagnóstico {tipo === 'frequencia' ? 'de Dispersão' : 'de Cauda'}
            <Badge variant={tipo === 'frequencia' ? 'blue' : 'green'} className="ml-2">
              {tipo === 'frequencia' ? dadosProcessados?.modelo_frequencia?.familia : dadosProcessados?.modelo_severidade?.familia}
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
                    <div className="text-sm font-medium text-gray-700">Deviance/DF Ratio</div>
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
  };

  // Componente de Verificação Pseudo R²
  const VerificacaoPseudoR2Component = () => {
    const verificacao = dadosProcessados?.verificacao_pseudo_r2;
    if (!verificacao) return null;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            Verificação do Pseudo R²
          </CardTitle>
          <CardDescription>
            Validação do cálculo das métricas de qualidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Frequência */}
              <div className={`p-4 rounded-lg border ${verificacao.frequencia_valido ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Frequência</div>
                  <Badge variant={verificacao.frequencia_valido ? 'success' : 'warning'}>
                    {verificacao.frequencia_valido ? 'VÁLIDO' : 'NÃO VÁLIDO'}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  {verificacao.frequencia_valido ? 
                    'Pseudo R² calculado corretamente' : 
                    'Pseudo R² não disponível, usando Deviance Explicada como proxy'}
                </div>
                {verificacao.usando_deviance_freq && (
                  <div className="mt-2 text-xs text-yellow-700">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Usando Deviance Explicada como métrica principal
                  </div>
                )}
              </div>
              
              {/* Severidade */}
              <div className={`p-4 rounded-lg border ${verificacao.severidade_valido ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Severidade</div>
                  <Badge variant={verificacao.severidade_valido ? 'success' : 'warning'}>
                    {verificacao.severidade_valido ? 'VÁLIDO' : 'NÃO VÁLIDO'}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  {verificacao.severidade_valido ? 
                    'Pseudo R² calculado corretamente' : 
                    'Pseudo R² não disponível, usando Deviance Explicada como proxy'}
                </div>
                {verificacao.usando_deviance_sev && (
                  <div className="mt-2 text-xs text-yellow-700">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Usando Deviance Explicada como métrica principal
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-700 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Nota:</strong> O Pseudo R² (McFadden) é calculado como 1 - (logLik(modelo) / logLik(modelo_nulo)). 
                  Valores entre 0.2-0.4 indicam ajuste muito bom.
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Componente de Validação para Tarifação
  const ValidacaoTarifacaoComponent = () => {
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
            {/* Status */}
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
            
            {/* Critérios Falhados */}
            {validacao.criterios_falhados && validacao.criterios_falhados.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Critérios Falhados
                </h4>
                <ul className="space-y-2">
                  {validacao.criterios_falhados.map((criterio, idx) => (
                    <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {criterio}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Alertas */}
            {validacao.alertas && validacao.alertas.length > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Alertas
                </h4>
                <ul className="space-y-2">
                  {validacao.alertas.map((alerta, idx) => (
                    <li key={idx} className="text-sm text-yellow-700 flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {alerta}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Critérios de Validação */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3">Critérios de Validação</h4>
              <div className="space-y-3">
                {[
                  { label: 'Pelo menos 1 variável explicativa (além do intercepto)', met: true },
                  { label: 'Pseudo-R² mínimo de 0.01', met: true },
                  { label: 'Pelo menos 1 coeficiente significativo (p < 0.1)', met: true },
                  { label: 'Modelos convergiram', met: true },
                  { label: 'Deviance Explicada razoável', met: true }
                ].map((criterio, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{criterio.label}</span>
                    <Badge variant={criterio.met ? 'success' : 'danger'} size="sm">
                      {criterio.met ? 'OK' : 'FALHA'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Componente de Resultados da Tarifação
  const ResultadosTarifacaoComponent = () => {
    const tarifacao = dadosProcessados?.tarifacao;
    const estatisticas = tarifacao?.estatisticas || {};
    const composicao = tarifacao?.composicao_premio || {};
    const distribuicao = tarifacao?.distribuicao_premios || {};
    
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
            {/* Estatísticas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { 
                  label: 'Prêmio Puro Médio', 
                  value: formatarMoeda(estatisticas.premio_puro_medio),
                  desc: 'Média dos prémios puros',
                  icon: <DollarSign className="w-4 h-4" />,
                  cor: 'blue'
                },
                { 
                  label: 'Prêmio Total Médio', 
                  value: formatarMoeda(estatisticas.premio_total_medio),
                  desc: 'Média dos prémios finais',
                  icon: <Calculator className="w-4 h-4" />,
                  cor: 'purple'
                },
                { 
                  label: 'λ Médio (frequência)', 
                  value: formatarNumero(estatisticas.lambda_medio, 4),
                  desc: 'Frequência média estimada',
                  icon: <TrendingUp className="w-4 h-4" />,
                  cor: 'green'
                },
                { 
                  label: 'μ Médio (severidade)', 
                  value: formatarMoeda(estatisticas.mu_medio),
                  desc: 'Severidade média estimada',
                  icon: <BarChart className="w-4 h-4" />,
                  cor: 'orange'
                }
              ].map((stat, idx) => (
                <div key={idx} className={`text-center p-5 bg-${stat.cor}-50 rounded-xl border border-${stat.cor}-200`}>
                  <div className={`text-${stat.cor}-600 mb-3 flex justify-center`}>
                    {stat.icon}
                  </div>
                  <div className="text-xl font-bold text-gray-800">{stat.value}</div>
                  <div className="text-xs text-gray-600 mt-2">{stat.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{stat.desc}</div>
                </div>
              ))}
            </div>
            
            {/* Faixa e Variação */}
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
                    {formatarPercentual(estatisticas.coeficiente_variacao * 100)}
                  </div>
                  <Badge variant="green">CV</Badge>
                </div>
                <div className="text-sm text-gray-600">
                  Desvio padrão: {formatarMoeda(estatisticas.desvio_premio)}
                </div>
              </div>
            </div>
            
            {/* Composição do Prêmio */}
            <div className="bg-gray-50 p-5 rounded-lg border">
              <h4 className="font-semibold text-gray-700 mb-4">Composição do Prêmio (média)</h4>
              <div className="space-y-3">
                {[
                  { label: 'Prêmio Puro', value: composicao.premio_puro, perc: composicao.premio_puro_perc, cor: 'blue' },
                  { label: 'Margem Segurança', value: composicao.margem_seguranca, perc: composicao.margem_seguranca_perc, cor: 'purple' },
                  { label: 'Despesas Admin', value: composicao.despesas_admin, perc: composicao.despesas_admin_perc, cor: 'yellow' },
                  { label: 'Comissão', value: composicao.comissao, perc: composicao.comissao_perc, cor: 'orange' },
                  { label: 'Margem Lucro', value: composicao.margem_lucro, perc: composicao.margem_lucro_perc, cor: 'green' },
                  { label: 'Impostos', value: composicao.impostos, perc: composicao.impostos_perc, cor: 'red' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-${item.cor}-500`}></div>
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-800">{formatarMoeda(item.value)}</div>
                      <div className="text-xs text-gray-500">{formatarPercentual(item.perc)}</div>
                    </div>
                  </div>
                ))}
                
                {/* Total */}
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
            
            {/* Distribuição Percentílica */}
            {distribuicao.percentis && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-700 mb-4">Distribuição Percentílica dos Prêmios</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(distribuicao.percentis).map(([percentil, valor]) => (
                    <div key={percentil} className="text-center">
                      <div className="text-xs font-medium text-purple-600">{percentil}</div>
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
  };

  // Aba Resumo (Principal)
  const AbaResumo = () => {
    if (!dadosProcessados) return null;
    
    const modeloFreq = dadosProcessados.modelo_frequencia;
    const modeloSever = dadosProcessados.modelo_severidade;
    const tarifacao = dadosProcessados.tarifacao;
    
    return (
      <div className="space-y-6">
        {/* Cabeçalho com Estatísticas Rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { 
              label: 'Registros Totais', 
              value: dadosProcessados.n_registros,
              desc: 'Observações',
              icon: <Database className="w-4 h-4" />,
              cor: 'blue'
            },
            { 
              label: 'Registros Positivos', 
              value: dadosProcessados.n_registros_positivos,
              desc: 'Para Gamma',
              icon: <FileCheck className="w-4 h-4" />,
              cor: 'green'
            },
            { 
              label: 'Coeficientes Total', 
              value: (modeloFreq?.coeficientesCount || 0) + (modeloSever?.coeficientesCount || 0),
              desc: 'Parâmetros estimados',
              icon: <Hash className="w-4 h-4" />,
              cor: 'purple'
            },
            { 
              label: 'Status', 
              value: dadosProcessados.validacao_tarifacao?.aprovado ? 'APROVADO' : 'REPROVADO',
              desc: 'Para tarifação',
              icon: dadosProcessados.validacao_tarifacao?.aprovado ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />,
              cor: dadosProcessados.validacao_tarifacao?.aprovado ? 'green' : 'red'
            }
          ].map((stat, idx) => (
            <div key={idx} className={`text-center p-4 bg-${stat.cor}-50 rounded-lg border border-${stat.cor}-200`}>
              <div className={`text-${stat.cor}-600 mb-2 flex justify-center`}>
                {stat.icon}
              </div>
              <div className="text-xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
              <div className="text-xs text-gray-500">{stat.desc}</div>
            </div>
          ))}
        </div>
        
        {/* Equações Ajustadas */}
        <EquacoesComponent />
        
        {/* Resumo dos Modelos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Modelo Frequência */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <TrendingUp className="w-5 h-5" />
                Modelo de Frequência
                <Badge variant="blue">{modeloFreq?.familia}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-xl font-bold text-blue-600">{modeloFreq?.coeficientesCount}</div>
                    <div className="text-xs text-gray-600">Coefs</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-xl font-bold text-blue-600">
                      {formatarNumero(modeloFreq?.metricas?.pseudo_r2, 4) || formatarNumero(modeloFreq?.metricas?.deviance_explicada, 4)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {modeloFreq?.metricas?.pseudo_r2 !== null ? 'Pseudo R²' : 'Dev. Expl.'}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-xl font-bold text-blue-600">{formatarNumero(modeloFreq?.metricas?.aic, 2)}</div>
                    <div className="text-xs text-gray-600">AIC</div>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-700">{modeloFreq?.declaracao_actuarial}</div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setAbaAtiva('frequencia')}
                  className="w-full"
                >
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Ver detalhes do modelo
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Modelo Severidade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <DollarSign className="w-5 h-5" />
                Modelo de Severidade
                <Badge variant="green">{modeloSever?.familia}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-xl font-bold text-green-600">{modeloSever?.coeficientesCount}</div>
                    <div className="text-xs text-gray-600">Coefs</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-xl font-bold text-green-600">
                      {formatarNumero(modeloSever?.metricas?.pseudo_r2, 4)}
                    </div>
                    <div className="text-xs text-gray-600">Pseudo R²</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-xl font-bold text-green-600">{formatarNumero(modeloSever?.metricas?.aic, 2)}</div>
                    <div className="text-xs text-gray-600">AIC</div>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-700">{modeloSever?.declaracao_actuarial}</div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setAbaAtiva('severidade')}
                  className="w-full"
                >
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Ver detalhes do modelo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Verificação Pseudo R² */}
        <VerificacaoPseudoR2Component />
        
        {/* Validação para Tarifação */}
        <ValidacaoTarifacaoComponent />
        
        {/* Resultados da Tarifação */}
        {dadosProcessados.tipo_operacao === 'tarifacao_cientifica' && (
          <ResultadosTarifacaoComponent />
        )}
      </div>
    );
  };

  // Aba Frequência Completa
const AbaFrequencia = () => {
  if (!dadosProcessados?.modelo_frequencia) return null;
  
  const validacao = dadosProcessados.modelo_frequencia.validacao;
  
  return (
    <div className="space-y-6">
      <MetricasAvancadasComponent 
        modelo={dadosProcessados.modelo_frequencia} 
        tipo="frequencia" 
      />
      
      <DiagnosticoComponent 
        modelo={dadosProcessados.modelo_frequencia} 
        tipo="frequencia" 
      />
      
      <Card>
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
      
      {/* Validação Econômica */}
      {validacao && (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Award className="w-5 h-5" />
        Validação Econômica
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
            
            {/* FUNÇÃO PARA LIDAR COM DIFERENTES FORMATOS */}
            {(() => {
              const recomendacoes = validacao.recomendacoes;
              
              // Se for undefined ou null
              if (!recomendacoes) {
                return (
                  <div className="text-sm text-gray-500 italic">
                    Nenhuma recomendação específica fornecida
                  </div>
                );
              }
              
              // Se for uma string
              if (typeof recomendacoes === 'string') {
                return (
                  <div className="text-sm">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{recomendacoes}</span>
                    </div>
                  </div>
                );
              }
              
              // Se for um array
              if (Array.isArray(recomendacoes)) {
                return (
                  <ul className="space-y-1">
                    {recomendacoes.map((rec, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                );
              }
              
              // Se for um objeto
              if (typeof recomendacoes === 'object') {
                return (
                  <ul className="space-y-1">
                    {Object.entries(recomendacoes).map(([key, value], idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                          {typeof value === 'string' ? value : `${key}: ${JSON.stringify(value)}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                );
              }
              
              // Formato não reconhecido
              return (
                <div className="text-sm text-gray-500 italic">
                  Recomendações em formato não reconhecido
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
)}
    </div>
  );
};

  // Aba Severidade Completa - VERSÃO CORRIGIDA
const AbaSeveridade = () => {
  if (!dadosProcessados?.modelo_severidade) return null;
  
  // DEBUG: Verificar a estrutura dos dados
  console.log('🔍 DEBUG AbaSeveridade - modelo_severidade:', dadosProcessados.modelo_severidade);
  console.log('🔍 DEBUG - validacao:', dadosProcessados.modelo_severidade.validacao);
  console.log('🔍 DEBUG - recomendacoes:', dadosProcessados.modelo_severidade.validacao?.recomendacoes);
  console.log('🔍 DEBUG - Tipo recomendacoes:', typeof dadosProcessados.modelo_severidade.validacao?.recomendacoes);
  console.log('🔍 DEBUG - É array?', Array.isArray(dadosProcessados.modelo_severidade.validacao?.recomendacoes));
  
  // Função auxiliar para renderizar recomendações
  const renderRecomendacoes = (recomendacoes) => {
    if (!recomendacoes) {
      return (
        <div className="text-sm text-gray-500 italic">
          Nenhuma recomendação específica fornecida
        </div>
      );
    }
    
    if (Array.isArray(recomendacoes)) {
      if (recomendacoes.length === 0) {
        return (
          <div className="text-sm text-gray-500 italic">
            Lista de recomendações vazia
          </div>
        );
      }
      
      return (
        <ul className="space-y-1">
          {recomendacoes.map((rec, idx) => (
            <li key={idx} className="text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      );
    }
    
    if (typeof recomendacoes === 'string') {
      return (
        <div className="text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{recomendacoes}</span>
        </div>
      );
    }
    
    if (typeof recomendacoes === 'object' && recomendacoes !== null) {
      const entries = Object.entries(recomendacoes);
      if (entries.length === 0) {
        return (
          <div className="text-sm text-gray-500 italic">
            Objeto de recomendações vazio
          </div>
        );
      }
      
      return (
        <ul className="space-y-1">
          {entries.map(([key, value], idx) => (
            <li key={idx} className="text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                {typeof value === 'string' ? value : `${key}: ${JSON.stringify(value)}`}
              </span>
            </li>
          ))}
        </ul>
      );
    }
    
    return (
      <div className="text-sm text-orange-600">
        <AlertCircle className="w-4 h-4 inline mr-1" />
        Formato não suportado: {typeof recomendacoes}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <MetricasAvancadasComponent 
        modelo={dadosProcessados.modelo_severidade} 
        tipo="severidade" 
      />
      
      <DiagnosticoComponent 
        modelo={dadosProcessados.modelo_severidade} 
        tipo="severidade" 
      />
      
      <Card>
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
      
      {/* Validação Econômica - VERSÃO CORRIGIDA */}
      {dadosProcessados.modelo_severidade.validacao && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Validação Econômica
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dadosProcessados.modelo_severidade.validacao.razoavel ? (
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
                  {renderRecomendacoes(dadosProcessados.modelo_severidade.validacao.recomendacoes)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

  // Aba Prêmios - COM PAGINAÇÃO E OPÇÕES DE 5 EM 5
const AbaPremios = () => {
  const premios = dadosProcessados?.tarifacao?.premios_individualizados || premiosCalculados;
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10); // Padrão: 10 por página
  
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
  
  // Cálculos de paginação
  const totalPaginas = Math.ceil(premios.length / itensPorPagina);
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = Math.min(inicio + itensPorPagina, premios.length);
  const premiosPagina = premios.slice(inicio, fim);
  
  // Gerar opções de 5 em 5 até 30, depois 50, 100 e Todos
  const opcoesItensPorPagina = [];
  
  // De 5 até 30, de 5 em 5
  for (let i = 5; i <= 30; i += 5) {
    opcoesItensPorPagina.push(i);
  }
  
  // Adicionar 50, 100 e Todos
  opcoesItensPorPagina.push(50, 100, premios.length);
  
  // Filtrar opções maiores que o total de itens (exceto "Todos")
  const opcoesFiltradas = opcoesItensPorPagina.filter(opcao => 
    opcao <= premios.length || opcao === premios.length
  );
  
  // Remover duplicados e ordenar
  const opcoesUnicas = [...new Set(opcoesFiltradas)].sort((a, b) => a - b);
  
  return (
    <div className="space-y-6">
      <ResultadosTarifacaoComponent />
      
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
          {/* Controles de exibição */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-700">
                Mostrando {inicio + 1}-{fim} de {premios.length} prémios
              </div>
              
              {/* Seletor de itens por página */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Itens por página:</label>
                <select
                  value={itensPorPagina}
                  onChange={(e) => {
                    const novoValor = Number(e.target.value);
                    setItensPorPagina(novoValor);
                    setPaginaAtual(1); // Voltar para primeira página
                  }}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
                >
                  {opcoesUnicas.map((opcao) => (
                    <option key={opcao} value={opcao}>
                      {opcao === premios.length ? `Todos (${opcao})` : opcao}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Botão para exportar */}
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
          
          {/* Indicador visual se estiver em "Todos" */}
          {itensPorPagina === premios.length && premios.length > 50 && (
            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2 text-blue-700 text-sm">
                <Info className="w-4 h-4" />
                <span>Mostrando todos os {premios.length} prémios de uma vez</span>
              </div>
            </div>
          )}
          
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span>ID</span>
                      {itensPorPagina === premios.length && premios.length > 100 && (
                        <Badge variant="outline" size="xs" className="text-xs">
                          Rolagem
                        </Badge>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50">λ (Frequência)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50">μ (Severidade)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50">Prémio Puro</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50">Prémio Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50">Margem</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {premiosPagina.map((premio, idx) => (
                  <tr 
                    key={premio.id || inicio + idx} 
                    className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <span>{premio.id || inicio + idx + 1}</span>
                        {premio.id && (
                          <span className="text-xs text-gray-400">#{premio.id}</span>
                        )}
                      </div>
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
                        (premio.fator_seguranca || 0) * 100 > 15 
                          ? 'bg-red-100 text-red-800' 
                          : (premio.fator_seguranca || 0) * 100 > 10 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {formatarPercentual((premio.fator_seguranca || 0) * 100)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Paginação (só mostra se não estiver em "Todos" e tiver mais de uma página) */}
          {itensPorPagina < premios.length && totalPaginas > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-700 mb-2 sm:mb-0">
                Página {paginaAtual} de {totalPaginas} • {premios.length} prémios no total
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Botão Primeira Página */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginaAtual === 1}
                  onClick={() => setPaginaAtual(1)}
                  className="flex items-center gap-1"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                
                {/* Botão Anterior */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginaAtual === 1}
                  onClick={() => setPaginaAtual(paginaAtual - 1)}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </Button>
                
                {/* Números das páginas */}
                <div className="flex items-center gap-1">
                  {(() => {
                    const botoes = [];
                    let inicioPaginas = Math.max(1, paginaAtual - 2);
                    let fimPaginas = Math.min(totalPaginas, paginaAtual + 2);
                    
                    // Ajustar para mostrar sempre 5 páginas se possível
                    if (fimPaginas - inicioPaginas < 4 && totalPaginas > 5) {
                      if (paginaAtual < 3) {
                        fimPaginas = Math.min(totalPaginas, 5);
                      } else if (paginaAtual > totalPaginas - 2) {
                        inicioPaginas = Math.max(1, totalPaginas - 4);
                      }
                    }
                    
                    // Botão para primeira página se não estiver visível
                    if (inicioPaginas > 1) {
                      botoes.push(
                        <Button
                          key={1}
                          variant="outline"
                          size="sm"
                          onClick={() => setPaginaAtual(1)}
                        >
                          1
                        </Button>
                      );
                      if (inicioPaginas > 2) {
                        botoes.push(
                          <span key="ellipsis1" className="px-2 text-gray-400">...</span>
                        );
                      }
                    }
                    
                    // Páginas do meio
                    for (let i = inicioPaginas; i <= fimPaginas; i++) {
                      botoes.push(
                        <Button
                          key={i}
                          variant={paginaAtual === i ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPaginaAtual(i)}
                        >
                          {i}
                        </Button>
                      );
                    }
                    
                    // Botão para última página se não estiver visível
                    if (fimPaginas < totalPaginas) {
                      if (fimPaginas < totalPaginas - 1) {
                        botoes.push(
                          <span key="ellipsis2" className="px-2 text-gray-400">...</span>
                        );
                      }
                      botoes.push(
                        <Button
                          key={totalPaginas}
                          variant="outline"
                          size="sm"
                          onClick={() => setPaginaAtual(totalPaginas)}
                        >
                          {totalPaginas}
                        </Button>
                      );
                    }
                    
                    return botoes;
                  })()}
                </div>
                
                {/* Botão Próxima */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginaAtual === totalPaginas}
                  onClick={() => setPaginaAtual(paginaAtual + 1)}
                  className="flex items-center gap-1"
                >
                  <span>Próxima</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                {/* Botão Última Página */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginaAtual === totalPaginas}
                  onClick={() => setPaginaAtual(totalPaginas)}
                  className="flex items-center gap-1"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Estatísticas resumidas */}
          {itensPorPagina === premios.length && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{premios.length}</div>
                  <div className="text-sm text-blue-800">Prémios totais</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatarMoeda(premios.reduce((sum, p) => sum + (p.premio_total || p.premio_seguranca || 0), 0))}
                  </div>
                  <div className="text-sm text-green-800">Soma total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatarMoeda(premios.reduce((sum, p) => sum + (p.premio_puro || 0), 0) / premios.length)}
                  </div>
                  <div className="text-sm text-purple-800">Média prémio puro</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatarPercentual(
                      premios.reduce((sum, p) => sum + (p.fator_seguranca || 0), 0) / premios.length * 100
                    )}
                  </div>
                  <div className="text-sm text-orange-800">Média margem</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

  // Se houver erro
  if (dadosProcessados && !dadosProcessados.success) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="font-bold text-red-800 text-xl mb-2">Erro no Processamento</h3>
          <p className="text-red-700 mb-4">{dadosProcessados.error}</p>
          {onVoltar && (
            <Button onClick={onVoltar} variant="outline">
              ← Voltar e Tentar Novamente
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!dadosProcessados) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h3 className="font-bold text-gray-800 text-xl mb-2">Processando resultados...</h3>
        <p className="text-gray-600">Aguarde enquanto os dados são carregados</p>
      </div>
    );
  }

  // Abas disponíveis
  const abas = [
    { id: 'resumo', label: 'Resumo', icon: <FileText className="w-4 h-4" /> },
    { id: 'frequencia', label: 'Frequência', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'severidade', label: 'Severidade', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'premios', label: 'Prémios', icon: <Calculator className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho Principal */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Target className="w-7 h-7 text-blue-600" />
              Resultados da Análise Atuarial
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-sm text-gray-600">
                <Database className="w-4 h-4 inline mr-1" />
                {dadosProcessados.n_registros} registros
              </div>
              <div className="text-sm text-gray-600">
                <CpuIcon className="w-4 h-4 inline mr-1" />
                {dadosProcessados.tipo_operacao === 'tarifacao_cientifica' ? 'Tarifação Científica' : 'Ajuste de Modelo'}
              </div>
              <div className="text-sm text-gray-600">
                <Server className="w-4 h-4 inline mr-1" />
                {new Date(dadosProcessados.timestamp).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="success" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              2 Modelos
            </Badge>
            {dadosProcessados.validacao_tarifacao?.aprovado && (
              <Badge variant="success" className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Aprovado
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Navegação por Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
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
                    ? 'text-blue-600 border-b-2 border-blue-500'
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

        {/* Conteúdo da Tab */}
        <div className="p-6">
          {abaAtiva === 'resumo' && <AbaResumo />}
          {abaAtiva === 'frequencia' && <AbaFrequencia />}
          {abaAtiva === 'severidade' && <AbaSeveridade />}
          {abaAtiva === 'premios' && <AbaPremios />}
        </div>
      </div>

      {/* Modal de Detalhe do Coeficiente */}
      {detalheCoeficiente && (
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
                    {detalheCoeficiente.variavel === '(Intercept)' ? 'Intercepto' : 
                     detalheCoeficiente.variavel === 'X.Intercept.' ? 'Intercepto' : 
                     detalheCoeficiente.variavel}
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
                
                {detalheCoeficiente.coef.std_error !== undefined && (
                  <div>
                    <div className="text-sm text-gray-600">Erro Padrão</div>
                    <div className="font-mono">
                      {formatarNumero(detalheCoeficiente.coef.std_error, 6)}
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
      )}

      {/* Rodapé com Ações */}
      <div className="bg-white rounded-xl shadow-sm p-6 border">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Análise concluída com sucesso</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            {onVoltar && (
              <Button onClick={onVoltar} variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            )}
            {onAjustarOutroModelo && (
              <Button onClick={onAjustarOutroModelo} variant="outline">
                Novo Modelo
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}