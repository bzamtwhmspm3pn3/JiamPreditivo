// C:\Users\VhenancioMarthinz\Downloads\JiamPreditivo\frontend\src\components\Dashboard\relatorios\RelatorioML.jsx

import React, { useState, useEffect } from 'react';
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
  BookOpen,
  Scale,
  Calculator as CalculatorIcon,
  BarChart4,
  LineChart as LineChartIcon,
  Gauge,
  GitBranch,
  Trees,
  Sparkles,
  Network,
  Workflow,
  Flower2,
  Leaf,
  TreePine,
  Settings
} from 'lucide-react';

// Componentes UI personalizados
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import Button from '../componentes/Button';
import Badge from '../componentes/Badge';

const RelatorioML = ({ modelo, dadosCompletos }) => {
  const [dadosProcessados, setDadosProcessados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [exportandoPDF, setExportandoPDF] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('resumo');
  const [detalheVariavel, setDetalheVariavel] = useState(null);
  const [graficoAtivo, setGraficoAtivo] = useState('importancia');

  useEffect(() => {
    try {
      console.log('📊 RELATÓRIO ML - Dados recebidos:');
      console.log('📦 modelo:', modelo);
      
      // VERIFICAR SE TEM DADOS DO R
      if (!modelo || !modelo.resultado) {
        throw new Error('Modelo sem dados do R');
      }

      const resultado = modelo.resultado;
      console.log('📦 resultado do R:', resultado);

      // DETECTAR TIPO DE MODELO
      const tipoModelo = modelo.tipo || 'desconhecido';
      const isXGBoost = tipoModelo === 'xgboost';
      const isRandomForest = tipoModelo === 'random_forest';
      const isRegression = resultado.parametros?.is_regression || false;
      
      console.log('🔍 Tipo de modelo detectado:', { tipoModelo, isXGBoost, isRandomForest, isRegression });

      // PROCESSAR RESULTADOS COMPLETOS
      processarResultadosCompletos(resultado, tipoModelo, isXGBoost, isRandomForest, isRegression);

    } catch (error) {
      console.error('❌ Erro ao processar dados:', error);
      setErro(error.message);
      setLoading(false);
    }
  }, [modelo]);

  // Função principal de processamento
  const processarResultadosCompletos = (resultados, tipoModelo, isXGBoost, isRandomForest, isRegression) => {
    try {
      console.log('🔍 Processando dados do modelo ML...');

      // EXTRAIR PARÂMETROS
      const parametros = resultados.parametros || {};

      // EXTRAIR QUALIDADE
      const qualidade = resultados.qualidade || {};

      // EXTRAIR PREDIÇÕES AMOSTRA
      const predicoesAmostra = resultados.predicoes_amostra || [];

      // EXTRAIR IMPORTÂNCIA DAS VARIÁVEIS
      let importanciaData = [];
      
      if (isXGBoost && resultados.metricas_xgboost?.importancia) {
        const impXGB = resultados.metricas_xgboost.importancia;
        if (Array.isArray(impXGB)) {
          importanciaData = impXGB.map(item => ({
            variavel: item.variavel || 'Variável',
            ganho: parseFloat(item.ganho) || 0,
            ganho_percentual: parseFloat(item.ganho_percentual) || 0,
            cobertura: parseFloat(item.cobertura) || 0,
            cobertura_percentual: parseFloat(item.cobertura_percentual) || 0,
            frequencia: parseInt(item.frequencia) || 0,
            frequencia_percentual: parseFloat(item.frequencia_percentual) || 0
          }));
        } else if (typeof impXGB === 'object') {
          importanciaData = Object.entries(impXGB).map(([variavel, valores]) => ({
            variavel,
            ganho: parseFloat(valores.ganho) || 0,
            ganho_percentual: parseFloat(valores.ganho_percentual) || 0,
            cobertura: parseFloat(valores.cobertura) || 0,
            cobertura_percentual: parseFloat(valores.cobertura_percentual) || 0,
            frequencia: parseInt(valores.frequencia) || 0,
            frequencia_percentual: parseFloat(valores.frequencia_percentual) || 0
          }));
        }
      } else if (isRandomForest && resultados.metricas_rf?.importancia) {
        const impRF = resultados.metricas_rf.importancia;
        if (Array.isArray(impRF)) {
          importanciaData = impRF.map(item => ({
            variavel: item.variavel || 'Variável',
            inc_mse: parseFloat(item.inc_mse) || 0,
            inc_mse_percentual: parseFloat(item.inc_mse_percentual) || 0,
            mean_decrease_accuracy: parseFloat(item.mean_decrease_accuracy) || 0,
            mda_percentual: parseFloat(item.mda_percentual) || 0,
            mean_decrease_gini: parseFloat(item.mean_decrease_gini) || 0,
            mdg_percentual: parseFloat(item.mdg_percentual) || 0
          }));
        } else if (typeof impRF === 'object') {
          importanciaData = Object.entries(impRF).map(([variavel, valores]) => ({
            variavel,
            inc_mse: parseFloat(valores.inc_mse) || 0,
            inc_mse_percentual: parseFloat(valores.inc_mse_percentual) || 0,
            mean_decrease_accuracy: parseFloat(valores.mean_decrease_accuracy) || 0,
            mda_percentual: parseFloat(valores.mda_percentual) || 0,
            mean_decrease_gini: parseFloat(valores.mean_decrease_gini) || 0,
            mdg_percentual: parseFloat(valores.mdg_percentual) || 0
          }));
        }
      }

      // ORDENAR POR IMPORTÂNCIA (maior primeiro)
      if (isXGBoost) {
        importanciaData.sort((a, b) => b.ganho - a.ganho);
      } else if (isRandomForest) {
        if (isRegression) {
          importanciaData.sort((a, b) => b.inc_mse - a.inc_mse);
        } else {
          importanciaData.sort((a, b) => b.mean_decrease_accuracy - a.mean_decrease_accuracy);
        }
      }

      // EXTRAIR MATRIZ DE CONFUSÃO (para classificação)
      let matrizConfusao = {};
      let metricsByClass = [];
      
      if (!isRegression && qualidade.ConfusionMatrix) {
        matrizConfusao = qualidade.ConfusionMatrix;
        metricsByClass = qualidade.MetricsByClass || [];
      }

      // EXTRAIR ESTATÍSTICAS ESPECÍFICAS
      const estatisticasEspecificas = isXGBoost 
        ? resultados.metricas_xgboost?.resumo_importancia || {}
        : resultados.metricas_rf?.estatisticas || {};

      // PREPARAR MÉTRICAS
      const metricas = {
        // Regressão
        rmse: parseFloat(qualidade.RMSE) || null,
        r2: parseFloat(qualidade.R2) || null,
        mae: parseFloat(qualidade.MAE) || null,
        mse: parseFloat(qualidade.MSE) || null,
        mape: parseFloat(qualidade.MAPE) || null,
        r2_adj: parseFloat(qualidade.R2_adj) || null,
        oob_error: parseFloat(qualidade.OOB) || parseFloat(estatisticasEspecificas.oob_error) || null,
        
        // Classificação
        accuracy: parseFloat(qualidade.Accuracy) || null,
        precision: parseFloat(qualidade.Precision) || null,
        recall: parseFloat(qualidade.Recall) || null,
        f1_score: parseFloat(qualidade.F1_Score) || null,
        auc: parseFloat(qualidade.AUC) || null
      };

      // CRIAR DADOS PARA GRÁFICOS

      // 1. Importância das Variáveis
      const importanciaGrafico = importanciaData.slice(0, 20).map(item => {
        if (isXGBoost) {
          return {
            name: item.variavel,
            value: item.ganho,
            percentual: item.ganho_percentual,
            cobertura: item.cobertura,
            frequencia: item.frequencia
          };
        } else {
          if (isRegression) {
            return {
              name: item.variavel,
              value: item.inc_mse,
              percentual: item.inc_mse_percentual,
              mda: item.mean_decrease_accuracy,
              mdg: item.mean_decrease_gini
            };
          } else {
            return {
              name: item.variavel,
              value: item.mean_decrease_accuracy,
              percentual: item.mda_percentual,
              mdg: item.mean_decrease_gini,
              mdg_percentual: item.mdg_percentual
            };
          }
        }
      });

      // 2. Predições vs Reais (para regressão)
      let predicoesData = [];
      if (isRegression && predicoesAmostra.length > 0) {
        predicoesData = predicoesAmostra.slice(0, 100).map(p => ({
          id: p.id || Math.random(),
          real: parseFloat(p.real) || 0,
          predito: parseFloat(p.predito) || 0,
          erro: (parseFloat(p.real) || 0) - (parseFloat(p.predito) || 0)
        }));
      }

      // 3. Distribuição de Erros
      let errosData = [];
      if (isRegression && predicoesAmostra.length > 0) {
        errosData = predicoesAmostra.slice(0, 30).map((p, idx) => ({
          id: idx + 1,
          erro: (parseFloat(p.real) || 0) - (parseFloat(p.predito) || 0),
          real: parseFloat(p.real) || 0,
          predito: parseFloat(p.predito) || 0
        }));
      }

      // 4. Matriz de Confusão (para classificação)
      let matrizData = [];
      if (!isRegression && Object.keys(matrizConfusao).length > 0) {
        const classes = Object.keys(matrizConfusao);
        classes.forEach((predClasse) => {
          classes.forEach((realClasse) => {
            const valor = matrizConfusao[predClasse]?.[realClasse] || 0;
            if (valor > 0) {
              matrizData.push({
                previsto: predClasse,
                real: realClasse,
                valor,
                acerto: predClasse === realClasse
              });
            }
          });
        });
      }

      // 5. Métricas por Classe
      let metricasClasseData = [];
      if (!isRegression && metricsByClass.length > 0) {
        metricasClasseData = metricsByClass.map(cls => ({
          classe: cls.Classe || 'Classe',
          precisao: parseFloat(cls.Precision) || 0,
          recall: parseFloat(cls.Recall) || 0,
          f1: parseFloat(cls.F1_Score) || 0,
          suporte: parseInt(cls.Support) || 0
        }));
      }

      // MONTAR OBJETO COMPLETO
      const dados = {
        success: true,
        timestamp: resultados.timestamp || new Date().toISOString(),
        tipoModelo,
        isXGBoost,
        isRandomForest,
        isRegression,
        
        // Informações básicas
        nome: modelo.nome || (isXGBoost ? 'XGBoost' : 'Random Forest'),
        n_observacoes: parametros.n_observacoes || predicoesAmostra.length || 0,
        n_features: parametros.n_features || importanciaData.length || 0,

        // Parâmetros do modelo
        parametros: {
          n_estimators: parametros.n_estimators || (isXGBoost ? 100 : 500),
          max_depth: parametros.max_depth || (isXGBoost ? 6 : null),
          learning_rate: parametros.learning_rate || (isXGBoost ? 0.1 : null),
          objective: parametros.objective || (isXGBoost ? 'reg:squarederror' : null),
          mtry: parametros.mtry || (isRandomForest ? 'sqrt' : null),
          nodesize: parametros.nodesize || (isRandomForest ? 1 : null),
          n_trees: estatisticasEspecificas.n_trees || parametros.n_estimators || 100
        },

        // Métricas
        metricas,

        // Importância das variáveis
        importancia: importanciaData,
        importanciaGrafico,

        // Predições
        predicoesAmostra,
        predicoesData,
        errosData,

        // Classificação
        matrizConfusao,
        matrizData,
        metricsByClass,
        metricasClasseData,

        // Estatísticas específicas
        estatisticasEspecificas,

        // Diagnósticos
        diagnosticos: resultados.diagnosticos || {},

        // Resumo
        resumo: resultados.resumo || ''
      };

      console.log('✅ Dados ML processados:', dados);
      setDadosProcessados(dados);
      setLoading(false);

    } catch (error) {
      console.error('❌ Erro no processamento:', error);
      setErro(error.message);
      setLoading(false);
    }
  };

  // Funções auxiliares
  const formatarNumero = (valor, decimais = 4, fallback = '-') => {
    if (valor === undefined || valor === null || valor === '' || valor === 'NA') return fallback;
    const num = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(num)) return fallback;
    if (Math.abs(num) < 0.0001 && num !== 0) return num.toExponential(decimais);
    return decimais === 0 ? num.toString() : num.toFixed(decimais);
  };

  const formatarPercentual = (valor) => {
    if (valor === undefined || valor === null || valor === 'NA') return '-';
    const num = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(num)) return '-';
    return `${(num * 100).toFixed(2)}%`;
  };

  const getCorImportancia = (valor, maxValor) => {
    if (maxValor === 0) return '#3B82F6';
    const intensidade = valor / maxValor;
    if (intensidade > 0.8) return '#10B981';
    if (intensidade > 0.5) return '#3B82F6';
    if (intensidade > 0.2) return '#F59E0B';
    return '#EF4444';
  };

  const getIconeModelo = () => {
    if (!dadosProcessados) return <Brain className="w-8 h-8" />;
    if (dadosProcessados.isXGBoost) return <Sparkles className="w-8 h-8" />;
    if (dadosProcessados.isRandomForest) return <TreePine className="w-8 h-8" />;
    return <Brain className="w-8 h-8" />;
  };

  const getCorModelo = () => {
    if (!dadosProcessados) return 'from-purple-600 to-indigo-600';
    if (dadosProcessados.isXGBoost) return 'from-orange-500 to-red-600';
    if (dadosProcessados.isRandomForest) return 'from-green-500 to-emerald-600';
    return 'from-purple-600 to-indigo-600';
  };

  // Renderizar métricas
  const renderMetricas = () => {
    if (!dadosProcessados) return null;
    
    const { metricas, isRegression } = dadosProcessados;
    
    const metricasRegressao = [
      { key: 'r2', label: 'R²', valor: metricas.r2, formato: 'percentual', desc: 'Coeficiente de Determinação' },
      { key: 'rmse', label: 'RMSE', valor: metricas.rmse, formato: 'numero', desc: 'Raiz do Erro Quadrático Médio' },
      { key: 'mae', label: 'MAE', valor: metricas.mae, formato: 'numero', desc: 'Erro Absoluto Médio' },
      { key: 'mse', label: 'MSE', valor: metricas.mse, formato: 'numero', desc: 'Erro Quadrático Médio' },
      { key: 'mape', label: 'MAPE', valor: metricas.mape, formato: 'percentual', desc: 'Erro Percentual Absoluto Médio' },
      { key: 'r2_adj', label: 'R² Ajustado', valor: metricas.r2_adj, formato: 'percentual', desc: 'R² ajustado por graus de liberdade' },
      { key: 'oob_error', label: 'Erro OOB', valor: metricas.oob_error, formato: metricas.oob_error < 1 ? 'percentual' : 'numero', desc: 'Erro Out-of-Bag' }
    ];

    const metricasClassificacao = [
      { key: 'accuracy', label: 'Acurácia', valor: metricas.accuracy, formato: 'percentual', desc: 'Taxa de acerto geral' },
      { key: 'precision', label: 'Precisão', valor: metricas.precision, formato: 'percentual', desc: 'VP / (VP + FP)' },
      { key: 'recall', label: 'Revocação', valor: metricas.recall, formato: 'percentual', desc: 'VP / (VP + FN)' },
      { key: 'f1_score', label: 'F1-Score', valor: metricas.f1_score, formato: 'percentual', desc: 'Média harmônica' },
      { key: 'auc', label: 'AUC', valor: metricas.auc, formato: 'numero', desc: 'Área sob a curva ROC' },
      { key: 'oob_error', label: 'Erro OOB', valor: metricas.oob_error, formato: 'percentual', desc: 'Erro Out-of-Bag' }
    ];

    const metricasLista = isRegression ? metricasRegressao : metricasClassificacao;
    const metricasValidas = metricasLista.filter(m => m.valor !== null && m.valor !== undefined);

    if (metricasValidas.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Info className="w-8 h-8 mx-auto mb-2" />
          <p>Nenhuma métrica disponível</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricasValidas.map((metrica, idx) => {
          let valorFormatado = '';
          if (metrica.formato === 'percentual') {
            valorFormatado = formatarPercentual(metrica.valor);
          } else {
            valorFormatado = formatarNumero(metrica.valor, metrica.key === 'auc' ? 3 : 4);
          }

          let bgColor = 'bg-gray-50';
          if (metrica.key === 'r2' || metrica.key === 'accuracy') {
            if (metrica.valor >= 0.8) bgColor = 'bg-green-50';
            else if (metrica.valor >= 0.6) bgColor = 'bg-blue-50';
            else if (metrica.valor >= 0.4) bgColor = 'bg-yellow-50';
            else bgColor = 'bg-red-50';
          }

          return (
            <div key={idx} className={`p-4 rounded-lg border ${bgColor}`}>
              <div className="text-sm font-medium text-gray-600">{metrica.label}</div>
              <div className="text-2xl font-bold mt-1">{valorFormatado}</div>
              <div className="text-xs text-gray-500 mt-1">{metrica.desc}</div>
            </div>
          );
        })}
      </div>
    );
  };

  // Renderizar importância das variáveis
  const renderImportancia = () => {
    if (!dadosProcessados || dadosProcessados.importancia.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Info className="w-8 h-8 mx-auto mb-2" />
          <p>Dados de importância não disponíveis</p>
        </div>
      );
    }

    const { isXGBoost, isRegression, importancia } = dadosProcessados;
    const topImportancia = importancia.slice(0, 20);

    // Determinar colunas baseado no modelo
    const colunas = isXGBoost 
      ? [
          { key: 'ganho', label: 'Ganho', formato: 'numero' },
          { key: 'ganho_percentual', label: '% Ganho', formato: 'percentual' },
          { key: 'cobertura', label: 'Cobertura', formato: 'numero' },
          { key: 'frequencia', label: 'Frequência', formato: 'numero' }
        ]
      : isRegression
        ? [
            { key: 'inc_mse', label: '%IncMSE', formato: 'percentual' },
            { key: 'mean_decrease_accuracy', label: 'MDA', formato: 'numero' },
            { key: 'mean_decrease_gini', label: 'MDG', formato: 'numero' }
          ]
        : [
            { key: 'mean_decrease_accuracy', label: 'MDA', formato: 'percentual' },
            { key: 'mdg_percentual', label: '%MDG', formato: 'percentual' },
            { key: 'mean_decrease_gini', label: 'MDG', formato: 'numero' }
          ];

    return (
      <div className="space-y-6">
        {/* Gráfico de Importância */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {isXGBoost ? '⚡ Importância por Ganho' : '🌲 Importância das Variáveis'}
            </h3>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart 
                data={topImportancia.slice(0, 15).reverse()} 
                layout="vertical"
                margin={{ left: 100, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="variavel" 
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'ganho_percentual' || name === 'inc_mse_percentual' || name === 'mda_percentual' || name === 'mdg_percentual') {
                      return [formatarPercentual(value / 100), name];
                    }
                    return [formatarNumero(value, 6), name];
                  }}
                />
                <Bar 
                  dataKey={isXGBoost ? 'ganho' : (isRegression ? 'inc_mse' : 'mean_decrease_accuracy')} 
                  fill={isXGBoost ? '#F59E0B' : '#10B981'}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tabela detalhada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Importância Detalhada
            </CardTitle>
            <CardDescription>
              Top {topImportancia.length} variáveis mais importantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variável</th>
                    {colunas.map(col => (
                      <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topImportancia.map((item, idx) => (
                    <tr 
                      key={idx} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setDetalheVariavel(item)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{idx + 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.variavel}
                      </td>
                      {colunas.map(col => {
                        let valorFormatado = '';
                        if (col.formato === 'percentual') {
                          valorFormatado = formatarPercentual((item[col.key] || 0) / 100);
                        } else {
                          valorFormatado = formatarNumero(item[col.key] || 0, 6);
                        }
                        return (
                          <td key={col.key} className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                            {valorFormatado}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderizar predições vs reais
  const renderPredicoes = () => {
    if (!dadosProcessados || !dadosProcessados.isRegression || dadosProcessados.predicoesData.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Info className="w-8 h-8 mx-auto mb-2" />
          <p>Dados de predições não disponíveis para este modelo</p>
        </div>
      );
    }

    const { predicoesData, metricas } = dadosProcessados;
    const r2 = metricas.r2 || 0;

    // Calcular limites para o gráfico
    const todosValores = [...predicoesData.map(p => p.real), ...predicoesData.map(p => p.predito)];
    const minVal = Math.min(...todosValores) * 0.9;
    const maxVal = Math.max(...todosValores) * 1.1;

    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Predições vs Valores Reais (R² = {formatarNumero(r2, 4)})
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="real" 
                  name="Real" 
                  domain={[minVal, maxVal]}
                  label={{ value: 'Valor Real', position: 'bottom' }}
                />
                <YAxis 
                  type="number" 
                  dataKey="predito" 
                  name="Previsto" 
                  domain={[minVal, maxVal]}
                  label={{ value: 'Valor Previsto', angle: -90, position: 'left' }}
                />
                <Tooltip 
                  formatter={(value, name) => [formatarNumero(value, 4), name]}
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border rounded shadow-lg">
                        <p>Real: {formatarNumero(data.real, 4)}</p>
                        <p>Previsto: {formatarNumero(data.predito, 4)}</p>
                        <p>Erro: {formatarNumero(data.erro, 4)}</p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Scatter 
                  name="Predições" 
                  data={predicoesData} 
                  fill="#3B82F6" 
                  shape="circle"
                />
                <ReferenceLine 
                  segment={[{ x: minVal, y: minVal }, { x: maxVal, y: maxVal }]} 
                  stroke="#EF4444" 
                  strokeDasharray="5 5"
                  label="Linha Ideal (y=x)"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Erros */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Distribuição dos Erros
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosProcessados.errosData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="id" label={{ value: 'Observação', position: 'bottom' }} />
                <YAxis label={{ value: 'Erro (Real - Previsto)', angle: -90, position: 'left' }} />
                <Tooltip 
                  formatter={(value, name) => [formatarNumero(value, 4), 'Erro']}
                />
                <Bar 
                  dataKey="erro" 
                  fill="#EF4444" 
                  radius={[4, 4, 0, 0]}
                >
                  {dadosProcessados.errosData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.erro >= 0 ? '#EF4444' : '#10B981'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tabela de Predições */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Amostra de Predições
            </CardTitle>
            <CardDescription>
              Primeiras 20 observações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Real</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Previsto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Erro</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Erro %</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dadosProcessados.predicoesAmostra.slice(0, 20).map((pred, idx) => {
                    const real = parseFloat(pred.real) || 0;
                    const predito = parseFloat(pred.predito) || 0;
                    const erro = real - predito;
                    const erroPerc = real !== 0 ? Math.abs(erro / real) * 100 : 0;
                    
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                          #{pred.id || idx + 1}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                          {formatarNumero(real, 4)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                          {formatarNumero(predito, 4)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                          <span className={erro >= 0 ? 'text-red-600' : 'text-green-600'}>
                            {formatarNumero(erro, 4)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <Badge variant={erroPerc > 10 ? 'danger' : erroPerc > 5 ? 'warning' : 'success'}>
                            {erroPerc.toFixed(2)}%
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderizar classificação (matriz de confusão e métricas por classe)
  const renderClassificacao = () => {
    if (dadosProcessados?.isRegression || dadosProcessados?.matrizData.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Info className="w-8 h-8 mx-auto mb-2" />
          <p>Dados de classificação não disponíveis para este modelo</p>
        </div>
      );
    }

    const { matrizData, metricasClasseData } = dadosProcessados;

    return (
      <div className="space-y-6">
        {/* Matriz de Confusão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Grid className="w-5 h-5" />
              Matriz de Confusão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border border-gray-300 p-3 bg-gray-100"></th>
                    <th className="border border-gray-300 p-3 bg-gray-100 text-center" colSpan={matrizData.length ? Math.sqrt(matrizData.length) : 2}>
                      Previsto
                    </th>
                  </tr>
                  <tr>
                    <th className="border border-gray-300 p-3 bg-gray-100">Real</th>
                    {Array.from(new Set(matrizData.map(d => d.previsto))).map(cls => (
                      <th key={cls} className="border border-gray-300 p-3 bg-gray-100 font-medium">
                        {cls}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from(new Set(matrizData.map(d => d.real))).map(realCls => (
                    <tr key={realCls}>
                      <td className="border border-gray-300 p-3 bg-gray-100 font-medium">{realCls}</td>
                      {Array.from(new Set(matrizData.map(d => d.previsto))).map(prevCls => {
                        const item = matrizData.find(d => d.real === realCls && d.previsto === prevCls);
                        const valor = item?.valor || 0;
                        const isCorrect = realCls === prevCls;
                        
                        return (
                          <td key={prevCls} className={`border border-gray-300 p-4 text-center ${
                            isCorrect ? 'bg-green-50' : 'bg-red-50'
                          }`}>
                            <div className="text-lg font-bold">{valor}</div>
                            <div className="text-xs mt-1">
                              {isCorrect ? '✓ Acerto' : '✗ Erro'}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Métricas por Classe */}
        {metricasClasseData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Métricas por Classe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classe</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precisão</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revocação</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">F1-Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Suporte</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {metricasClasseData.map((cls, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap font-medium">{cls.classe}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={cls.precisao >= 0.8 ? 'success' : cls.precisao >= 0.6 ? 'warning' : 'danger'}>
                            {formatarPercentual(cls.precisao)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={cls.recall >= 0.8 ? 'success' : cls.recall >= 0.6 ? 'warning' : 'danger'}>
                            {formatarPercentual(cls.recall)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={cls.f1 >= 0.8 ? 'success' : cls.f1 >= 0.6 ? 'warning' : 'danger'}>
                            {formatarPercentual(cls.f1)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono">{cls.suporte}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Renderizar detalhes do modelo
  const renderDetalhes = () => {
    if (!dadosProcessados) return null;

    const { isXGBoost, isRandomForest, parametros, estatisticasEspecificas, n_observacoes, n_features } = dadosProcessados;

    return (
      <div className="space-y-6">
        {/* Parâmetros do Modelo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Parâmetros do Modelo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {isXGBoost && (
                <>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="text-sm text-orange-700 font-medium">⚡ Árvores</div>
                    <div className="text-2xl font-bold text-orange-800">{parametros.n_estimators}</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="text-sm text-red-700 font-medium">📏 Profundidade Máxima</div>
                    <div className="text-2xl font-bold text-red-800">{parametros.max_depth}</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-700 font-medium">📈 Taxa de Aprendizado</div>
                    <div className="text-2xl font-bold text-blue-800">{parametros.learning_rate}</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="text-sm text-purple-700 font-medium">🎯 Função de Perda</div>
                    <div className="text-lg font-bold text-purple-800 truncate">
                      {parametros.objective || 'reg:squarederror'}
                    </div>
                  </div>
                </>
              )}

              {isRandomForest && (
                <>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-sm text-green-700 font-medium">🌳 Árvores</div>
                    <div className="text-2xl font-bold text-green-800">{parametros.n_estimators}</div>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <div className="text-sm text-emerald-700 font-medium">🔧 Variáveis por Divisão</div>
                    <div className="text-2xl font-bold text-emerald-800">{parametros.mtry}</div>
                  </div>
                  <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                    <div className="text-sm text-teal-700 font-medium">🍃 Tamanho do Nó</div>
                    <div className="text-2xl font-bold text-teal-800">{parametros.nodesize}</div>
                  </div>
                  <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                    <div className="text-sm text-cyan-700 font-medium">📊 Erro OOB</div>
                    <div className="text-2xl font-bold text-cyan-800">
                      {formatarPercentual(dadosProcessados.metricas.oob_error / 100)}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Estatísticas Gerais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Observações</div>
                <div className="text-2xl font-bold">{n_observacoes}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Variáveis</div>
                <div className="text-2xl font-bold">{n_features}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Tipo</div>
                <div className="text-xl font-bold">
                  {dadosProcessados.isRegression ? 'Regressão' : 'Classificação'}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Timestamp</div>
                <div className="text-sm font-mono">
                  {new Date(dadosProcessados.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Específicas */}
        {isRandomForest && estatisticasEspecificas && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TreePine className="w-5 h-5" />
                Informações do Random Forest
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Número de árvores:</span>
                  <div className="text-lg font-bold">{estatisticasEspecificas.n_trees || parametros.n_estimators}</div>
                </div>
                {estatisticasEspecificas.oob_error !== undefined && (
                  <div>
                    <span className="text-sm text-gray-600">Erro OOB:</span>
                    <div className="text-lg font-bold">
                      {dadosProcessados.isRegression 
                        ? formatarNumero(estatisticasEspecificas.oob_error, 4)
                        : formatarPercentual(estatisticasEspecificas.oob_error / 100)}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {isXGBoost && estatisticasEspecificas && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Informações do XGBoost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Variável mais importante:</span>
                  <div className="text-lg font-bold">{estatisticasEspecificas.variavel_mais_importante || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Ganho Total:</span>
                  <div className="text-lg font-bold">{formatarNumero(estatisticasEspecificas.total_ganho, 4) || 'N/A'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Aba Resumo
  const AbaResumo = () => {
    if (!dadosProcessados) return null;

    const { isXGBoost, isRegression, metricas, importancia } = dadosProcessados;
    const topVariavel = importancia.length > 0 ? importancia[0].variavel : 'N/A';
    const topValor = importancia.length > 0 
      ? (isXGBoost ? importancia[0].ganho : (isRegression ? importancia[0].inc_mse : importancia[0].mean_decrease_accuracy))
      : 0;

    return (
      <div className="space-y-6">
        {/* Cards rápidos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Observações', value: dadosProcessados.n_observacoes, desc: 'Registros', cor: 'blue' },
            { label: 'Variáveis', value: dadosProcessados.n_features, desc: 'Preditoras', cor: 'purple' },
            { 
              label: isRegression ? 'R²' : 'Acurácia', 
              value: isRegression 
                ? formatarNumero(metricas.r2, 4) 
                : formatarPercentual(metricas.accuracy),
              desc: isRegression ? 'Coef. Determinação' : 'Taxa de acerto',
              cor: metricas.r2 >= 0.8 || metricas.accuracy >= 0.8 ? 'green' : 'yellow'
            },
            { 
              label: 'Top Variável', 
              value: topVariavel.length > 15 ? topVariavel.substring(0, 12) + '...' : topVariavel,
              desc: `Importância: ${formatarNumero(topValor, 4)}`,
              cor: 'orange'
            }
          ].map((stat, idx) => {
            const corClasses = {
              blue: 'bg-blue-50 border-blue-200',
              purple: 'bg-purple-50 border-purple-200',
              green: 'bg-green-50 border-green-200',
              yellow: 'bg-yellow-50 border-yellow-200',
              orange: 'bg-orange-50 border-orange-200'
            };
            return (
              <div key={idx} className={`text-center p-4 ${corClasses[stat.cor]} rounded-lg border`}>
                <div className="text-xl font-bold text-gray-800">{stat.value}</div>
                <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
                <div className="text-xs text-gray-500">{stat.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Métricas principais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="w-5 h-5" />
              Métricas de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderMetricas()}
          </CardContent>
        </Card>

        {/* Top variáveis */}
        {importancia.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Top 5 Variáveis Mais Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {importancia.slice(0, 5).map((item, idx) => {
                  const valor = isXGBoost 
                    ? item.ganho 
                    : (isRegression ? item.inc_mse : item.mean_decrease_accuracy);
                  const maxValor = isXGBoost 
                    ? importancia[0].ganho 
                    : (isRegression ? importancia[0].inc_mse : importancia[0].mean_decrease_accuracy);
                  
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.variavel}</span>
                        <span className="font-mono">{formatarNumero(valor, 4)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{ 
                            width: `${(valor / maxValor) * 100}%`,
                            backgroundColor: getCorImportancia(valor, maxValor)
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
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
      const titulo = dadosProcessados.isXGBoost ? 'XGBOOST' : 'RANDOM FOREST';
      doc.text(titulo, pageWidth / 2, 110, { align: 'center' });
      
      doc.setFontSize(20);
      doc.text(dadosProcessados.nome?.toUpperCase() || 'MODELO DE MACHINE LEARNING', pageWidth / 2, 140, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(`Tipo: ${dadosProcessados.isRegression ? 'Regressão' : 'Classificação'}`, pageWidth / 2, 170, { align: 'center' });
      doc.text(`Observações: ${dadosProcessados.n_observacoes} | Variáveis: ${dadosProcessados.n_features}`, pageWidth / 2, 180, { align: 'center' });
      
      if (dadosProcessados.isRegression) {
        doc.text(`R²: ${formatarNumero(dadosProcessados.metricas.r2, 4)} | RMSE: ${formatarNumero(dadosProcessados.metricas.rmse, 4)}`, pageWidth / 2, 190, { align: 'center' });
      } else {
        doc.text(`Acurácia: ${formatarPercentual(dadosProcessados.metricas.accuracy)} | F1: ${formatarPercentual(dadosProcessados.metricas.f1_score)}`, pageWidth / 2, 190, { align: 'center' });
      }
      
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
        ['Modelo:', dadosProcessados.isXGBoost ? 'XGBoost' : 'Random Forest'],
        ['Tipo:', dadosProcessados.isRegression ? 'Regressão' : 'Classificação'],
        ['Observações:', dadosProcessados.n_observacoes.toString()],
        ['Variáveis:', dadosProcessados.n_features.toString()],
        ['Nº Estimadores:', dadosProcessados.parametros.n_estimators.toString()],
      ];
      
      if (dadosProcessados.isXGBoost) {
        detalhes.push(
          ['Profundidade Máxima:', dadosProcessados.parametros.max_depth.toString()],
          ['Taxa de Aprendizado:', dadosProcessados.parametros.learning_rate.toString()],
          ['Função de Perda:', dadosProcessados.parametros.objective || 'reg:squarederror']
        );
      } else {
        detalhes.push(
          ['Variáveis por Divisão:', dadosProcessados.parametros.mtry],
          ['Tamanho do Nó:', dadosProcessados.parametros.nodesize.toString()]
        );
      }
      
      detalhes.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margem, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margem + 60, yPos);
        yPos += 8;
      });
      
      // PÁGINA 3: MÉTRICAS
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
      doc.text('MÉTRICAS DE PERFORMANCE', margem, 50);
      
      const metricasArray = [];
      if (dadosProcessados.isRegression) {
        if (dadosProcessados.metricas.r2 !== null) metricasArray.push(['R²', formatarNumero(dadosProcessados.metricas.r2, 4)]);
        if (dadosProcessados.metricas.rmse !== null) metricasArray.push(['RMSE', formatarNumero(dadosProcessados.metricas.rmse, 4)]);
        if (dadosProcessados.metricas.mae !== null) metricasArray.push(['MAE', formatarNumero(dadosProcessados.metricas.mae, 4)]);
        if (dadosProcessados.metricas.mse !== null) metricasArray.push(['MSE', formatarNumero(dadosProcessados.metricas.mse, 4)]);
        if (dadosProcessados.metricas.mape !== null) metricasArray.push(['MAPE', formatarPercentual(dadosProcessados.metricas.mape / 100)]);
        if (dadosProcessados.metricas.r2_adj !== null) metricasArray.push(['R² Ajustado', formatarNumero(dadosProcessados.metricas.r2_adj, 4)]);
        if (dadosProcessados.metricas.oob_error !== null) metricasArray.push(['Erro OOB', formatarNumero(dadosProcessados.metricas.oob_error, 4)]);
      } else {
        if (dadosProcessados.metricas.accuracy !== null) metricasArray.push(['Acurácia', formatarPercentual(dadosProcessados.metricas.accuracy)]);
        if (dadosProcessados.metricas.precision !== null) metricasArray.push(['Precisão', formatarPercentual(dadosProcessados.metricas.precision)]);
        if (dadosProcessados.metricas.recall !== null) metricasArray.push(['Revocação', formatarPercentual(dadosProcessados.metricas.recall)]);
        if (dadosProcessados.metricas.f1_score !== null) metricasArray.push(['F1-Score', formatarPercentual(dadosProcessados.metricas.f1_score)]);
        if (dadosProcessados.metricas.auc !== null) metricasArray.push(['AUC', formatarNumero(dadosProcessados.metricas.auc, 3)]);
        if (dadosProcessados.metricas.oob_error !== null) metricasArray.push(['Erro OOB', formatarPercentual(dadosProcessados.metricas.oob_error / 100)]);
      }
      
      autoTable(doc, {
        startY: 60,
        body: metricasArray,
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 5 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: 60 } },
        margin: { left: margem, right: margem }
      });
      
      // PÁGINA 4: IMPORTÂNCIA DAS VARIÁVEIS
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
      doc.text('IMPORTÂNCIA DAS VARIÁVEIS', margem, 50);
      
      const importData = dadosProcessados.importancia.slice(0, 15).map(item => {
        if (dadosProcessados.isXGBoost) {
          return [
            item.variavel,
            formatarNumero(item.ganho, 6),
            formatarPercentual((item.ganho_percentual || 0) / 100),
            item.frequencia?.toString() || '-'
          ];
        } else {
          if (dadosProcessados.isRegression) {
            return [
              item.variavel,
              formatarNumero(item.inc_mse, 6),
              formatarPercentual((item.inc_mse_percentual || 0) / 100),
              formatarNumero(item.mean_decrease_accuracy, 6)
            ];
          } else {
            return [
              item.variavel,
              formatarNumero(item.mean_decrease_accuracy, 6),
              formatarPercentual((item.mda_percentual || 0) / 100),
              formatarNumero(item.mean_decrease_gini, 6)
            ];
          }
        }
      });
      
      const importHead = dadosProcessados.isXGBoost
        ? ['Variável', 'Ganho', '% Ganho', 'Frequência']
        : dadosProcessados.isRegression
          ? ['Variável', '%IncMSE', '% IncMSE', 'MDA']
          : ['Variável', 'MDA', '% MDA', 'MDG'];
      
      autoTable(doc, {
        startY: 60,
        head: [importHead],
        body: importData,
        theme: 'grid',
        headStyles: { fillColor: [10, 31, 68], textColor: 255 },
        margin: { left: margem, right: margem }
      });
      
      // PÁGINA 5: MATRIZ DE CONFUSÃO (se aplicável)
      if (!dadosProcessados.isRegression && dadosProcessados.matrizData.length > 0) {
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
        doc.text('MATRIZ DE CONFUSÃO', margem, 50);
        
        const classes = Array.from(new Set(dadosProcessados.matrizData.map(d => d.real))).sort();
        const matrizTable = [['', ...classes.map(c => `Previsto ${c}`)]];
        
        classes.forEach(realCls => {
          const row = [`Real ${realCls}`];
          classes.forEach(prevCls => {
            const item = dadosProcessados.matrizData.find(d => d.real === realCls && d.previsto === prevCls);
            row.push(item?.valor?.toString() || '0');
          });
          matrizTable.push(row);
        });
        
        autoTable(doc, {
          startY: 60,
          body: matrizTable,
          theme: 'grid',
          headStyles: { fillColor: [10, 31, 68], textColor: 255 },
          margin: { left: margem, right: margem }
        });
      }
      
      // PÁGINA FINAL: CONCLUSÃO
      const currentPage = doc.internal.getNumberOfPages();
      doc.setPage(currentPage);
      doc.addPage();
      
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
      
      let conclusao = '';
      if (dadosProcessados.isRegression) {
        const r2 = dadosProcessados.metricas.r2 || 0;
        const rmse = dadosProcessados.metricas.rmse || 0;
        
        conclusao = `O modelo de ${dadosProcessados.isXGBoost ? 'XGBoost' : 'Random Forest'} para regressão `;
        conclusao += `apresenta um R² de ${formatarNumero(r2, 4)}, indicando que `;
        conclusao += `${(r2 * 100).toFixed(1)}% da variabilidade é explicada pelo modelo. `;
        conclusao += `O RMSE de ${formatarNumero(rmse, 4)} representa o erro médio das predições. `;
        
        if (r2 >= 0.8) {
          conclusao += `O modelo tem excelente poder preditivo. `;
        } else if (r2 >= 0.6) {
          conclusao += `O modelo tem bom poder preditivo. `;
        } else {
          conclusao += `O modelo tem poder preditivo limitado. Considere adicionar mais variáveis ou ajustar parâmetros. `;
        }
      } else {
        const accuracy = dadosProcessados.metricas.accuracy || 0;
        const f1 = dadosProcessados.metricas.f1_score || 0;
        
        conclusao = `O modelo de ${dadosProcessados.isXGBoost ? 'XGBoost' : 'Random Forest'} para classificação `;
        conclusao += `apresenta acurácia de ${formatarPercentual(accuracy)} e F1-Score de ${formatarPercentual(f1)}. `;
        
        if (accuracy >= 0.8) {
          conclusao += `O modelo tem excelente capacidade de classificação. `;
        } else if (accuracy >= 0.6) {
          conclusao += `O modelo tem boa capacidade de classificação. `;
        } else {
          conclusao += `O modelo tem capacidade de classificação limitada. Considere balancear as classes ou ajustar parâmetros. `;
        }
      }
      
      if (dadosProcessados.importancia.length > 0) {
        const topVar = dadosProcessados.importancia[0].variavel;
        conclusao += `A variável mais importante é "${topVar}". `;
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
      
      const nomeModelo = dadosProcessados.isXGBoost ? 'XGBoost' : 'RandomForest';
      const nomeArquivo = `Relatorio_JIAM_${nomeModelo}_${new Date().toISOString().split('T')[0]}.pdf`;
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
          <h3 className="text-xl font-bold text-gray-800">Processando modelo de Machine Learning...</h3>
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

  // Abas disponíveis
  const abas = [
    { id: 'resumo', label: '📋 Resumo', icon: FileText },
    { id: 'importancia', label: '🎯 Importância', icon: BarChart3 },
    { id: 'metricas', label: '📊 Métricas', icon: Gauge },
    { id: 'detalhes', label: '⚙️ Detalhes', icon: Settings }
  ];

  if (dadosProcessados.isRegression) {
    abas.splice(2, 0, { id: 'predicoes', label: '📈 Predições', icon: Target });
  } else {
    abas.splice(2, 0, { id: 'classificacao', label: '🎯 Classificação', icon: Grid });
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho Principal com botão PDF */}
      <div className={`bg-gradient-to-r ${getCorModelo()} text-white p-8 rounded-3xl`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              {getIconeModelo()}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {dadosProcessados.isXGBoost ? '⚡ XGBoost' : '🌲 Random Forest'}
              </h1>
              <p className="text-lg opacity-90">
                {dadosProcessados.isRegression ? 'Regressão' : 'Classificação'}
                {' • '}{dadosProcessados.n_features} variáveis • {dadosProcessados.n_observacoes} observações
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-sm opacity-80">Observações</div>
            <div className="text-2xl font-bold">{dadosProcessados.n_observacoes}</div>
          </div>
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-sm opacity-80">Variáveis</div>
            <div className="text-2xl font-bold">{dadosProcessados.n_features}</div>
          </div>
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-sm opacity-80">Estimadores</div>
            <div className="text-2xl font-bold">{dadosProcessados.parametros.n_estimators}</div>
          </div>
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-sm opacity-80">
              {dadosProcessados.isRegression ? 'R²' : 'Acurácia'}
            </div>
            <div className="text-2xl font-bold">
              {dadosProcessados.isRegression 
                ? formatarNumero(dadosProcessados.metricas.r2, 4)
                : formatarPercentual(dadosProcessados.metricas.accuracy)}
            </div>
          </div>
        </div>
      </div>

      {/* Navegação por Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {abas.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAbaAtiva(tab.id)}
                  className={`
                    flex items-center gap-2 px-1 py-4 text-sm font-medium whitespace-nowrap
                    relative transition-colors
                    ${abaAtiva === tab.id
                      ? `text-${dadosProcessados.isXGBoost ? 'orange' : 'green'}-600 border-b-2 border-${dadosProcessados.isXGBoost ? 'orange' : 'green'}-500`
                      : 'text-gray-500 hover:text-gray-700'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Conteúdo da Tab */}
        <div className="p-6">
          {abaAtiva === 'resumo' && <AbaResumo />}
          {abaAtiva === 'importancia' && renderImportancia()}
          {abaAtiva === 'metricas' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="w-5 h-5" />
                  Métricas Detalhadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderMetricas()}
              </CardContent>
            </Card>
          )}
          {abaAtiva === 'predicoes' && renderPredicoes()}
          {abaAtiva === 'classificacao' && renderClassificacao()}
          {abaAtiva === 'detalhes' && renderDetalhes()}
        </div>
      </div>

      {/* Modal de Detalhe da Variável */}
      {detalheVariavel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  Detalhe da Variável
                </h3>
                <button
                  onClick={() => setDetalheVariavel(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Variável</div>
                  <div className="font-semibold text-lg">
                    {detalheVariavel.variavel}
                  </div>
                </div>

                {dadosProcessados.isXGBoost ? (
                  <>
                    <div>
                      <div className="text-sm text-gray-600">Ganho</div>
                      <div className="font-mono text-lg">{formatarNumero(detalheVariavel.ganho, 6)}</div>
                    </div>
                    {detalheVariavel.ganho_percentual !== undefined && (
                      <div>
                        <div className="text-sm text-gray-600">Percentual do Ganho</div>
                        <div className="font-mono text-lg">{formatarPercentual(detalheVariavel.ganho_percentual / 100)}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm text-gray-600">Cobertura</div>
                      <div className="font-mono text-lg">{formatarNumero(detalheVariavel.cobertura, 4)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Frequência</div>
                      <div className="font-mono text-lg">{detalheVariavel.frequencia}</div>
                    </div>
                  </>
                ) : dadosProcessados.isRegression ? (
                  <>
                    <div>
                      <div className="text-sm text-gray-600">%IncMSE</div>
                      <div className="font-mono text-lg">{formatarNumero(detalheVariavel.inc_mse, 6)}</div>
                    </div>
                    {detalheVariavel.inc_mse_percentual !== undefined && (
                      <div>
                        <div className="text-sm text-gray-600">Percentual %IncMSE</div>
                        <div className="font-mono text-lg">{formatarPercentual(detalheVariavel.inc_mse_percentual / 100)}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm text-gray-600">Mean Decrease Accuracy</div>
                      <div className="font-mono text-lg">{formatarNumero(detalheVariavel.mean_decrease_accuracy, 6)}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="text-sm text-gray-600">Mean Decrease Accuracy</div>
                      <div className="font-mono text-lg">{formatarNumero(detalheVariavel.mean_decrease_accuracy, 6)}</div>
                    </div>
                    {detalheVariavel.mda_percentual !== undefined && (
                      <div>
                        <div className="text-sm text-gray-600">Percentual MDA</div>
                        <div className="font-mono text-lg">{formatarPercentual(detalheVariavel.mda_percentual / 100)}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm text-gray-600">Mean Decrease Gini</div>
                      <div className="font-mono text-lg">{formatarNumero(detalheVariavel.mean_decrease_gini, 6)}</div>
                    </div>
                  </>
                )}
                
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => setDetalheVariavel(null)}
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
              <span>Modelo treinado com sucesso - Motor Estatístico R</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelatorioML;