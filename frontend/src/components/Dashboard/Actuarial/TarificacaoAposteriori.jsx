// src/components/Dashboard/Actuarial/APosteriori.jsx - VERSÃO CORRIGIDA
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, CheckCircle, AlertTriangle, Download, Printer } from 'lucide-react';

// 🔥 IMPORTAR O CONTEXT
import { useGLMModels } from '../../../contexts/GLMModelsContext';
import ModelosService from '../../../services/modelosService';

// 🔥 IMPORTAR API DIRETAMENTE PARA FALLBACK
import api from '../../../services/api';

// Componentes UI
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import Button from '../componentes/Button';
import Badge from '../componentes/Badge';
import Select from '../componentes/Select';
import Label from '../componentes/Label';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer
} from 'recharts';

// Utilitário de extração de dados
import { extrairDadosArray, extrairInfoDados } from './utils/dataExtractor';

export default function APosteriori({ 
  dados,
  statusSistema,
  resultadoCredibilidade: resultadoExterno,
  executarCredibilidade: executarCredibilidadeProp,
  onVoltar,
  onResultadoModelo,
  modeloFrequencia: modeloFrequenciaProps,
  modeloSeveridade: modeloSeveridadeProps
}) {
  // ============================================
  // 🔥 ACESSAR O CONTEXTO GLOBAL
  // ============================================
  const contextGLM = useGLMModels();
  
  console.log('📦 [APosteriori] Contexto GLM:', {
    temModelos: contextGLM.temModelosGLM,
    frequencia: contextGLM.frequencia ? '✅' : '❌',
    severidade: contextGLM.severidade ? '✅' : '❌'
  });

  // ============================================
  // 🔥 COMBINAR PROPS + CONTEXTO
  // ============================================
  const modeloFrequencia = contextGLM.frequencia || modeloFrequenciaProps;
  const modeloSeveridade = contextGLM.severidade || modeloSeveridadeProps;

  // ============================================
  // CONFIGURAÇÕES
  // ============================================
  const [config, setConfig] = useState({
    metodo: 'Bühlmann-Straub',
    grupo_var: '',
    tempo_var: '',
    sinistro_var: '',
    custo_var: '',
    z_min: 0.3,
    z_max: 0.9
  });

  const [executando, setExecutando] = useState(false);
  const [infoDados, setInfoDados] = useState({ linhas: 0, colunas: 0, variaveis: [], temDados: false });
  const [variaveisDisponiveis, setVariaveisDisponiveis] = useState([]);
  const [visualizacaoAtiva, setVisualizacaoAtiva] = useState('ajustes');
  const [resultado, setResultado] = useState(resultadoExterno || null);
  const [enviadoAoDashboard, setEnviadoAoDashboard] = useState(false);

  // ============================================
  // FUNÇÕES DE FORMATAÇÃO
  // ============================================
  const formatarMoeda = (valor) => {
    if (valor === undefined || valor === null) return 'Kz 0';
    
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor).replace('AOA', 'Kz');
  };

  const formatarNumero = (valor, decimais = 2) => {
    if (valor === undefined || valor === null) return '0';
    return valor.toLocaleString('pt-AO', {
      minimumFractionDigits: decimais,
      maximumFractionDigits: decimais
    });
  };

  // ============================================
  // PROCESSAR RESULTADOS DO R
  // ============================================
  useEffect(() => {
    if (resultadoExterno) {
      console.log('📥 Resultado externo recebido:', resultadoExterno);
      setResultado(resultadoExterno);
    }
  }, [resultadoExterno]);

  // ============================================
  // EXTRAIR VALORES DOS MODELOS GLM
  // ============================================
  const valoresModelos = (() => {
    if (!modeloFrequencia || !modeloSeveridade) {
      return { lambda: null, mu: null, premioBase: null };
    }
    
    const lambda = modeloFrequencia.lambda_medio || 
                   modeloFrequencia.estatisticas?.lambda_medio ||
                   contextGLM.estatisticasResumidas?.lambda_medio ||
                   2.4684;
                   
    const mu = modeloSeveridade.mu_medio || 
               modeloSeveridade.estatisticas?.mu_medio ||
               contextGLM.estatisticasResumidas?.mu_medio ||
               356452.86;
               
    return {
      lambda,
      mu,
      premioBase: lambda * mu
    };
  })();

  // ============================================
  // INICIALIZAR COM DADOS
  // ============================================
  useEffect(() => {
    const info = extrairInfoDados(dados);
    setInfoDados(info);
    setVariaveisDisponiveis(info.variaveis);
    
    console.log('📊 APosteriori - Dados processados:', {
      temDados: info.temDados,
      linhas: info.linhas,
      colunas: info.colunas,
      variaveis: info.variaveis
    });
    
    // Tentar identificar variáveis automaticamente
    if (info.temDados) {
      const sugestoes = {
        grupo_var: info.variaveis.find(v => 
          v.toLowerCase().includes('regiao') || 
          v.toLowerCase().includes('grupo') ||
          v.toLowerCase().includes('classe') ||
          v.toLowerCase().includes('categoria') ||
          v.toLowerCase().includes('uf') ||
          v.toLowerCase().includes('estado')
        ),
        tempo_var: info.variaveis.find(v => 
          v.toLowerCase().includes('ano') || 
          v.toLowerCase().includes('periodo') ||
          v.toLowerCase().includes('mes') ||
          v.toLowerCase().includes('data') ||
          v.toLowerCase().includes('tempo')
        ),
        sinistro_var: info.variaveis.find(v => 
          v.toLowerCase().includes('sinistro') || 
          v.toLowerCase().includes('frequencia') ||
          v.toLowerCase().includes('count') ||
          v.toLowerCase().includes('n_') ||
          v.toLowerCase().includes('numero')
        ),
        custo_var: info.variaveis.find(v => 
          v.toLowerCase().includes('custo') || 
          v.toLowerCase().includes('valor') ||
          v.toLowerCase().includes('severidade') ||
          v.toLowerCase().includes('amount') ||
          v.toLowerCase().includes('premio')
        )
      };
      
      setConfig(prev => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(sugestoes)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => [key, value])
        )
      }));
    }
  }, [dados]);

  // ============================================
  // 🔥 ENVIAR AO DASHBOARD E SALVAR NO MONGODB
  // ============================================
  const enviarAoDashboard = async (dadosCredibilidade) => {
    if (!onResultadoModelo) return;

    try {
      // Calcular classificação
      const calcularClassificacao = () => {
        const credMedia = dadosCredibilidade.estatisticas_gerais?.credibilidade_media || 0;
        const ajusteMedio = dadosCredibilidade.estatisticas_gerais?.ajuste_medio_percentual || 0;
        const nGrupos = dadosCredibilidade.estatisticas_gerais?.n_grupos || 0;
        
        if (credMedia > 0.7 && nGrupos > 5) return "ALTA CREDIBILIDADE";
        if (credMedia > 0.5 && nGrupos > 3) return "CREDIBILIDADE MÉDIA";
        if (credMedia > 0.3) return "CREDIBILIDADE BAIXA";
        return "CREDIBILIDADE INSUFICIENTE";
      };

      const classificacao = calcularClassificacao();

      // Preparar objeto completo para o dashboard
      const dadosParaDashboard = {
        // Identificação
        nome: `Credibilidade A Posteriori - ${dadosCredibilidade.metodo_aplicado}`,
        tipo: "credibilidade_actuarial",
        
        // Dados completos
        dados: dadosCredibilidade,
        
        // Parâmetros utilizados
        parametros: {
          metodo: dadosCredibilidade.metodo_aplicado || config.metodo,
          grupos: dadosCredibilidade.estatisticas_gerais?.n_grupos || 0,
          credibilidade_media: dadosCredibilidade.estatisticas_gerais?.credibilidade_media,
          variaveis: {
            grupo: config.grupo_var,
            tempo: config.tempo_var,
            sinistros: config.sinistro_var,
            custos: config.custo_var
          }
        },
        
        // Classificação calculada
        classificacao: classificacao,
        
        // Timestamp
        timestamp: new Date().toISOString(),
        
        // Métricas detalhadas
        metrics: {
          premio_priori: dadosCredibilidade.estatisticas_gerais?.premio_global_priori,
          premio_posteriori_medio: dadosCredibilidade.estatisticas_gerais?.premio_medio_posteriori,
          credibilidade_media: dadosCredibilidade.estatisticas_gerais?.credibilidade_media,
          ajuste_medio_percentual: dadosCredibilidade.estatisticas_gerais?.ajuste_medio_percentual,
          n_grupos: dadosCredibilidade.estatisticas_gerais?.n_grupos,
          grupos_positivos: dadosCredibilidade.estatisticas_gerais?.grupos_com_ajuste_positivo,
          grupos_negativos: dadosCredibilidade.estatisticas_gerais?.grupos_com_ajuste_negativo,
          var_entre: dadosCredibilidade.metricas_credibilidade?.var_entre,
          var_dentro: dadosCredibilidade.metricas_credibilidade?.var_dentro,
          homogeneidade: dadosCredibilidade.metricas_credibilidade?.homogeneidade,
          impacto_total: dadosCredibilidade.impacto_financeiro?.impacto_total,
          impacto_percentual: dadosCredibilidade.impacto_financeiro?.impacto_percentual
        },
        
        // Categoria para agrupamento
        categoria: "atuarial",
        
        // Resumo para exibição rápida
        resumo: `${dadosCredibilidade.estatisticas_gerais?.n_grupos} grupos • Credibilidade média: ${(dadosCredibilidade.estatisticas_gerais?.credibilidade_media * 100).toFixed(1)}% • Impacto: ${formatarMoeda(dadosCredibilidade.impacto_financeiro?.impacto_total)}`
      };

      console.log('📤 Enviando Credibilidade para Relatórios:', {
        tipo: dadosParaDashboard.tipo,
        classificacao,
        n_grupos: dadosParaDashboard.parametros.grupos
      });

      // 1. Enviar para o Dashboard (via props)
      onResultadoModelo(dadosParaDashboard);
      
      // 2. 🔥 SALVAR NO MONGODB via ModelosService
      console.log('💾 Salvando Credibilidade no MongoDB...');
      try {
        const salvo = await ModelosService.salvar({
          nome: dadosParaDashboard.nome,
          tipo: "credibilidade_actuarial",
          resultado: dadosCredibilidade,
          parametros: dadosParaDashboard.parametros,
          metricas: dadosParaDashboard.metrics,
          classificacao: classificacao,
          qualidade: {
            pontuacao: classificacao === "ALTA CREDIBILIDADE" ? 9 :
                      classificacao === "CREDIBILIDADE MÉDIA" ? 6 :
                      classificacao === "CREDIBILIDADE BAIXA" ? 3 : 1,
            credibilidade_media: dadosCredibilidade.estatisticas_gerais?.credibilidade_media,
            n_grupos: dadosCredibilidade.estatisticas_gerais?.n_grupos,
            homogeneidade: dadosCredibilidade.metricas_credibilidade?.homogeneidade,
            convergencia: dadosCredibilidade.metricas_credibilidade?.convergencia || 0.95
          },
          timestamp: dadosParaDashboard.timestamp,
          categoria: "atuarial"
        });
        
        if (salvo && salvo.success) {
          console.log('✅ Credibilidade salva no MongoDB com ID:', salvo.id);
        } else {
          console.warn('⚠️ Resposta do MongoDB:', salvo);
        }
      } catch (mongoError) {
        console.error('❌ Erro ao salvar no MongoDB:', mongoError);
        // Não interrompe o fluxo principal
      }
      
      setEnviadoAoDashboard(true);
      toast.success(`📊 Resultados enviados para Relatórios (${classificacao})`);

    } catch (error) {
      console.error('❌ Erro ao enviar:', error);
      toast.error('❌ Erro ao enviar resultados');
    }
  };

  // ============================================
  // EXECUTAR CREDIBILIDADE - COM MÚLTIPLOS FALLBACKS
  // ============================================
  const handleExecutar = async () => {
    const dadosArray = extrairDadosArray(dados);
    
    if (!dadosArray || dadosArray.length === 0) {
      toast.error("❌ Carregue dados primeiro!");
      return;
    }

    // Validar configuração
    if (!config.grupo_var || !config.tempo_var || !config.sinistro_var || !config.custo_var) {
      toast.error("❌ Configure todas as variáveis obrigatórias");
      return;
    }

    setExecutando(true);
    
    try {
      // 🔥 PREPARAR PAYLOAD
      const payload = {
        dados: dadosArray,
        parametros: {
          metodo: config.metodo,
          grupo_var: config.grupo_var,
          tempo_var: config.tempo_var,
          sinistro_var: config.sinistro_var,
          custo_var: config.custo_var,
          z_min: config.z_min,
          z_max: config.z_max
        }
      };

      console.log('📤 Enviando credibilidade:', payload.parametros);

      let response = null;
      let metodoUsado = '';

      // 🔥 TENTATIVA 1: Usar a prop executarCredibilidade
      if (typeof executarCredibilidadeProp === 'function') {
        console.log('🔄 Tentativa 1: Usando prop executarCredibilidade...');
        try {
          response = await executarCredibilidadeProp(payload);
          metodoUsado = 'prop';
          console.log('✅ Resposta via prop:', response);
        } catch (propError) {
          console.log('❌ Prop falhou:', propError.message);
        }
      }

      // 🔥 TENTATIVA 2: Usar api.executarCredibilidadeAPosteriori
      if (!response?.success) {
        console.log('🔄 Tentativa 2: Usando api.executarCredibilidadeAPosteriori...');
        try {
          response = await api.executarCredibilidadeAPosteriori(dadosArray, payload.parametros);
          metodoUsado = 'api';
          console.log('✅ Resposta via api:', response);
        } catch (apiError) {
          console.log('❌ API falhou:', apiError.message);
        }
      }

      // 🔥 TENTATIVA 3: Usar api.executarModelo com tipo 'a_posteriori'
      if (!response?.success) {
        console.log('🔄 Tentativa 3: Usando api.executarModelo com tipo a_posteriori...');
        try {
          response = await api.executarModelo('a_posteriori', dadosArray, payload.parametros);
          metodoUsado = 'modelo_generico';
          console.log('✅ Resposta via modelo genérico:', response);
        } catch (modeloError) {
          console.log('❌ Modelo genérico falhou:', modeloError.message);
        }
      }

      // 🔥 TENTATIVA 4: Gerar demonstração local
      if (!response?.success) {
        console.log('🔄 Tentativa 4: Gerando demonstração local...');
        response = gerarDemonstracaoLocal(config);
        metodoUsado = 'demonstracao';
        console.log('✅ Demonstração local gerada');
      }

      // 🔥 PROCESSAR RESPOSTA
      if (response?.success) {
        setResultado(response);
        await enviarAoDashboard(response); // 🔥 AGUARDAR O ENVIO
        
        if (metodoUsado === 'demonstracao') {
          toast.info('📊 Modo demonstração (backend não disponível)');
        } else {
          toast.success('✅ Credibilidade calculada com sucesso!');
        }
      } else {
        throw new Error(response?.error || 'Erro no cálculo de credibilidade');
      }
      
    } catch (error) {
      console.error('❌ Erro detalhado:', error);
      toast.error(`❌ ${error.message}`);
    } finally {
      setExecutando(false);
    }
  };

  // ============================================
  // FUNÇÃO DE DEMONSTRAÇÃO LOCAL
  // ============================================
  const gerarDemonstracaoLocal = (config) => {
    const grupos = ['Norte', 'Sul', 'Leste', 'Oeste', 'Centro'];
    const premioBase = 50000;
    const resultados = [];
    
    for (let i = 0; i < grupos.length; i++) {
      const credibilidade = 0.3 + (i * 0.15);
      const premioEmpirico = premioBase * (0.8 + (i * 0.1));
      const premioPosteriori = credibilidade * premioEmpirico + (1 - credibilidade) * premioBase;
      const ajustePercentual = ((premioPosteriori / premioBase) - 1) * 100;
      
      resultados.push({
        grupo: grupos[i],
        fator_credibilidade: parseFloat(credibilidade.toFixed(3)),
        premio_empirico_medio: Math.round(premioEmpirico),
        premio_posteriori: Math.round(premioPosteriori),
        ajuste_percentual: parseFloat(ajustePercentual.toFixed(1)),
        n_anos: 5,
        n_sinistros_total: Math.round(50 + i * 20)
      });
    }

    return {
      success: true,
      modo_demonstracao: true,
      timestamp: new Date().toISOString(),
      tipo_operacao: 'credibilidade_a_posteriori',
      metodo_aplicado: config.metodo || 'Bühlmann-Straub',
      
      estatisticas_gerais: {
        premio_global_priori: premioBase,
        premio_medio_posteriori: Math.round(resultados.reduce((a, r) => a + r.premio_posteriori, 0) / resultados.length),
        credibilidade_media: parseFloat(resultados.reduce((a, r) => a + r.fator_credibilidade, 0) / resultados.length),
        ajuste_medio_percentual: parseFloat(resultados.reduce((a, r) => a + r.ajuste_percentual, 0) / resultados.length),
        n_grupos: resultados.length,
        grupos_com_ajuste_positivo: resultados.filter(r => r.ajuste_percentual > 0).length,
        grupos_com_ajuste_negativo: resultados.filter(r => r.ajuste_percentual < 0).length
      },
      
      fatores_credibilidade: resultados.map(r => ({
        grupo: r.grupo,
        fator_credibilidade: r.fator_credibilidade,
        n_anos: r.n_anos
      })),
      
      premios_calculados: resultados,
      
      metricas_credibilidade: {
        var_entre: 0.15,
        var_dentro: 0.08,
        homogeneidade: 'Heterogêneo',
        confiabilidade_estimacao: 'Média',
        convergencia: 0.95
      },
      
      impacto_financeiro: {
        impacto_total: Math.round(resultados.reduce((acc, r) => acc + (r.premio_posteriori - premioBase), 0)),
        impacto_percentual: 5.2,
        receita_adicional_estimada: 150000
      },
      
      recomendacoes: {
        acoes_prioritarias: 'Monitorar grupos com ajustes > 10%',
        grupos_prioritarios: resultados.filter(r => Math.abs(r.ajuste_percentual) > 10).map(r => r.grupo),
        proximos_passos: 'Implementar ajustes graduais nos prêmios'
      },
      
      visualizacao_dados: {
        top_ajustes: resultados
          .sort((a, b) => Math.abs(b.ajuste_percentual) - Math.abs(a.ajuste_percentual))
          .slice(0, 3)
          .map(r => ({
            grupo: r.grupo,
            premio_posteriori: r.premio_posteriori,
            ajuste_percentual: r.ajuste_percentual
          }))
      }
    };
  };

  // ============================================
  // FUNÇÕES AUXILIARES PARA GRÁFICOS
  // ============================================
  const prepararDadosGrafico = () => {
    if (!resultado?.premios_calculados) return [];
    
    return resultado.premios_calculados
      .slice(0, 15)
      .map(item => ({
        grupo: item.grupo,
        'Prêmio A Priori': resultado.estatisticas_gerais?.premio_global_priori || 0,
        'Prêmio A Posteriori': item.premio_posteriori || 0,
        'Ajuste %': item.ajuste_percentual || 0,
        'Credibilidade': (item.fator_credibilidade || 0) * 100
      }));
  };

  const prepararDadosCredibilidade = () => {
    if (!resultado?.fatores_credibilidade) return [];
    
    return resultado.fatores_credibilidade.map(item => ({
      grupo: item.grupo,
      credibilidade: (item.fator_credibilidade || 0) * 100,
      n_anos: item.n_anos || 0
    }));
  };

  const calcularGruposUnicos = () => {
    if (!infoDados.temDados || !config.grupo_var) return 0;
    
    const dadosArray = extrairDadosArray(dados);
    const grupos = new Set(dadosArray.map(d => d[config.grupo_var]));
    return grupos.size;
  };

  // ============================================
  // RENDERIZAÇÃO DA CONFIGURAÇÃO
  // ============================================
  const renderConfiguracao = () => (
    <div className="space-y-4">
      {/* Método de Credibilidade */}
      <div>
        <Label htmlFor="metodo">Método de Credibilidade</Label>
        <Select
          id="metodo"
          value={config.metodo}
          onChange={(e) => setConfig({...config, metodo: e.target.value})}
          className="w-full"
        >
          <option value="Bühlmann-Straub">Bühlmann-Straub (recomendado)</option>
          <option value="Bühlmann">Bühlmann (simples)</option>
        </Select>
        <div className="text-xs text-gray-500 mt-1">
          {config.metodo === 'Bühlmann-Straub' 
            ? '✓ Considera pesos diferentes entre anos' 
            : '✓ Assume mesma exposição em todos os anos'}
        </div>
      </div>

      {/* Variáveis */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="grupo_var">Variável de Agrupamento</Label>
          <Select
            id="grupo_var"
            value={config.grupo_var}
            onChange={(e) => setConfig({...config, grupo_var: e.target.value})}
            className="w-full"
          >
            <option value="">Selecione...</option>
            {variaveisDisponiveis.map(variavel => (
              <option key={variavel} value={variavel}>{variavel}</option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="tempo_var">Variável de Tempo</Label>
          <Select
            id="tempo_var"
            value={config.tempo_var}
            onChange={(e) => setConfig({...config, tempo_var: e.target.value})}
            className="w-full"
          >
            <option value="">Selecione...</option>
            {variaveisDisponiveis.map(variavel => (
              <option key={variavel} value={variavel}>{variavel}</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="sinistro_var">Sinistros</Label>
            <Select
              id="sinistro_var"
              value={config.sinistro_var}
              onChange={(e) => setConfig({...config, sinistro_var: e.target.value})}
              className="w-full"
            >
              <option value="">Selecione...</option>
              {variaveisDisponiveis.map(variavel => (
                <option key={variavel} value={variavel}>{variavel}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="custo_var">Custos</Label>
            <Select
              id="custo_var"
              value={config.custo_var}
              onChange={(e) => setConfig({...config, custo_var: e.target.value})}
              className="w-full"
            >
              <option value="">Selecione...</option>
              {variaveisDisponiveis.map(variavel => (
                <option key={variavel} value={variavel}>{variavel}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Limites de Credibilidade */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div>
          <Label htmlFor="z_min">Z mínimo</Label>
          <input
            id="z_min"
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={config.z_min}
            onChange={(e) => setConfig({...config, z_min: parseFloat(e.target.value)})}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <Label htmlFor="z_max">Z máximo</Label>
          <input
            id="z_max"
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={config.z_max}
            onChange={(e) => setConfig({...config, z_max: parseFloat(e.target.value)})}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Botão Executar */}
      <Button
        onClick={handleExecutar}
        disabled={executando || 
                 !config.grupo_var || 
                 !config.tempo_var || 
                 !config.sinistro_var || 
                 !config.custo_var ||
                 !infoDados.temDados}
        className={`w-full py-3 ${
          executando ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600'
        } text-white font-medium rounded-lg mt-4`}
      >
        {executando ? (
          <><span className="animate-spin mr-2">⏳</span> Calculando Credibilidade...</>
        ) : (
          <><span className="mr-2">📊</span> Calcular Credibilidade</>
        )}
      </Button>

      {/* 🔥 INDICADOR DE INTEGRAÇÃO */}
      {onResultadoModelo && (
        <div className="mt-2 flex items-center justify-center text-xs text-green-600">
          <span className="mr-1">✅</span>
          Resultado será salvo automaticamente no Dashboard
          {!statusSistema?.connected && ' (modo fallback)'}
        </div>
      )}

      {/* Avisos */}
      {!infoDados.temDados && (
        <div className="text-sm text-red-600 mt-2 p-2 bg-red-50 rounded">
          ⚠️ Carregue dados primeiro
        </div>
      )}
      
      {infoDados.temDados && (!config.grupo_var || !config.tempo_var || !config.sinistro_var || !config.custo_var) && (
        <div className="text-sm text-yellow-600 mt-2 p-2 bg-yellow-50 rounded">
          ⚠️ Configure todas as variáveis obrigatórias
        </div>
      )}

      {/* Info dos Modelos GLM */}
      {modeloFrequencia && modeloSeveridade && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Modelos GLM disponíveis</span>
          </div>
          <div className="mt-1 text-xs text-gray-600">
            λ = {valoresModelos.lambda.toFixed(4)} • μ = {formatarMoeda(valoresModelos.mu)}
          </div>
        </div>
      )}
    </div>
  );

  // ============================================
  // RENDERIZAÇÃO PRINCIPAL
  // ============================================
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-xl">
            <span className="text-3xl">📊</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Teoria da Credibilidade (A Posteriori)
            </h1>
            <p className="text-gray-600">
              Ajuste de prêmios baseado na experiência histórica
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {infoDados.temDados && (
            <Badge variant="outline" className="flex items-center gap-2">
              📊 {infoDados.linhas} observações
            </Badge>
          )}
          
          {onResultadoModelo && (
            <Badge variant="success" className="flex items-center gap-1">
              <Send className="w-3 h-3" />
              Dashboard ativo
            </Badge>
          )}
          
          {onVoltar && (
            <Button variant="outline" onClick={onVoltar}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
          )}
        </div>
      </div>

      {/* Status da Conexão */}
      <div className={`p-3 rounded-lg border ${
        statusSistema?.connected ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center gap-3">
          {statusSistema?.connected ? (
            <span className="text-green-600 text-lg">✅</span>
          ) : (
            <span className="text-yellow-600 text-lg">⚠️</span>
          )}
          <div>
            <div className="font-medium">
              {statusSistema?.connected ? 'Backend R conectado' : 'Modo demonstração'}
            </div>
            <div className="text-sm text-gray-600">
              {infoDados.temDados 
                ? `${infoDados.linhas} observações disponíveis`
                : 'Nenhum dado carregado'}
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configurações */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>⚙️</span>
                Configuração da Credibilidade
              </CardTitle>
              <CardDescription>
                Defina as variáveis para cálculo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderConfiguracao()}
            </CardContent>
          </Card>
          
          {/* Informações dos Dados */}
          {infoDados.temDados && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm">📋 Informações dos Dados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Observações:</span>
                  <span className="font-medium">{infoDados.linhas}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Variáveis:</span>
                  <span className="font-medium">{infoDados.colunas}</span>
                </div>
                {config.grupo_var && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Grupos únicos:</span>
                    <span className="font-medium">
                      {calcularGruposUnicos()}
                    </span>
                  </div>
                )}
                {config.tempo_var && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Períodos:</span>
                    <span className="font-medium">
                      {new Set(extrairDadosArray(dados).map(d => d[config.tempo_var])).size}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Resultados */}
        <div className="lg:col-span-2">
          {resultado ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>📈 Resultados da Credibilidade</CardTitle>
                    <CardDescription>
                      Método {resultado.metodo_aplicado}
                      {resultado.modo_demonstracao && (
                        <Badge variant="warning" className="ml-2">Modo Demonstração</Badge>
                      )}
                    </CardDescription>
                  </div>
                  
                  {/* Tabs de Visualização */}
                  <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                    <Button
                      variant={visualizacaoAtiva === 'ajustes' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setVisualizacaoAtiva('ajustes')}
                    >
                      Ajustes
                    </Button>
                    <Button
                      variant={visualizacaoAtiva === 'credibilidade' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setVisualizacaoAtiva('credibilidade')}
                    >
                      Credibilidade
                    </Button>
                    <Button
                      variant={visualizacaoAtiva === 'detalhes' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setVisualizacaoAtiva('detalhes')}
                    >
                      Detalhes
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Cartões de Resumo */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-800 font-medium">Prêmio A Priori</div>
                    <div className="text-xl font-bold mt-1">
                      {formatarMoeda(resultado.estatisticas_gerais?.premio_global_priori)}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">Média global</div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-sm text-green-800 font-medium">Prêmio A Posteriori</div>
                    <div className="text-xl font-bold mt-1">
                      {formatarMoeda(resultado.estatisticas_gerais?.premio_medio_posteriori)}
                    </div>
                    <div className="text-xs text-green-600 mt-1">Média ajustada</div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="text-sm text-purple-800 font-medium">Credibilidade Média</div>
                    <div className="text-xl font-bold mt-1">
                      {((resultado.estatisticas_gerais?.credibilidade_media || 0) * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-purple-600 mt-1">Confiança na experiência própria</div>
                  </div>
                  
                  <div className={`p-4 rounded-lg border ${
                    (resultado.estatisticas_gerais?.ajuste_medio_percentual || 0) >= 0
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="text-sm font-medium">Ajuste Médio</div>
                    <div className="text-xl font-bold mt-1">
                      {resultado.estatisticas_gerais?.ajuste_medio_percentual?.toFixed(1)}%
                    </div>
                    <div className="text-xs mt-1">
                      {resultado.estatisticas_gerais?.grupos_com_ajuste_positivo}↑ / {resultado.estatisticas_gerais?.grupos_com_ajuste_negativo}↓
                    </div>
                  </div>
                </div>

                {/* Indicador de envio ao Dashboard */}
                {onResultadoModelo && (
                  <div className={`mb-4 p-2 rounded-lg border flex items-center gap-2 ${
                    enviadoAoDashboard ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    {enviadoAoDashboard ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Send className="w-4 h-4 text-gray-500" />
                    )}
                    <span className={enviadoAoDashboard ? 'text-green-700 text-sm' : 'text-gray-600 text-sm'}>
                      {enviadoAoDashboard 
                        ? '✓ Resultados disponíveis na aba Relatórios' 
                        : 'Resultados serão enviados automaticamente'}
                    </span>
                  </div>
                )}

                {/* Conteúdo das Tabs - resto igual ao original */}
                {visualizacaoAtiva === 'ajustes' && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <h5 className="font-medium mb-4">Ajustes nos Prêmios por Grupo</h5>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={prepararDadosGrafico()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="grupo" angle={-45} textAnchor="end" height={80} />
                            <YAxis />
                            <Tooltip formatter={(value) => [formatarMoeda(value), 'Valor']} />
                            <Legend />
                            <Bar dataKey="Prêmio A Priori" fill="#8884d8" />
                            <Bar dataKey="Prêmio A Posteriori" fill="#82ca9d" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Tabela de Top Ajustes */}
                    {resultado.visualizacao_dados?.top_ajustes && (
                      <div className="bg-white p-4 rounded-lg border">
                        <h5 className="font-medium mb-3">Maiores Ajustes</h5>
                        <div className="space-y-2">
                          {resultado.visualizacao_dados.top_ajustes.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="font-medium">{item.grupo}</span>
                              <div className="flex items-center gap-4">
                                <span className={item.ajuste_percentual > 0 ? 'text-green-600' : 'text-red-600'}>
                                  {item.ajuste_percentual > 0 ? '+' : ''}{item.ajuste_percentual?.toFixed(1)}%
                                </span>
                                <span className="text-gray-600">
                                  {formatarMoeda(item.premio_posteriori)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {visualizacaoAtiva === 'credibilidade' && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <h5 className="font-medium mb-4">Fatores de Credibilidade por Grupo</h5>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={prepararDadosCredibilidade()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="grupo" angle={-45} textAnchor="end" height={80} />
                            <YAxis label={{ value: 'Credibilidade (%)', angle: -90, position: 'insideLeft' }} />
                            <Tooltip formatter={(value) => [`${value}%`, 'Credibilidade']} />
                            <Bar dataKey="credibilidade" fill="#0088FE" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <div className="text-sm font-medium mb-2">Interpretação</div>
                        <div className="text-sm text-gray-600">
                          Credibilidade média de {(resultado.estatisticas_gerais?.credibilidade_media * 100).toFixed(1)}%:
                          <ul className="mt-2 space-y-1">
                            <li>• {resultado.estatisticas_gerais?.credibilidade_media > 0.7 ? 'Alta' : 
                                 resultado.estatisticas_gerais?.credibilidade_media > 0.4 ? 'Média' : 'Baixa'} confiança</li>
                            <li>• {resultado.estatisticas_gerais?.grupos_com_ajuste_positivo || 0} grupos com +</li>
                            <li>• {resultado.estatisticas_gerais?.grupos_com_ajuste_negativo || 0} grupos com -</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <div className="text-sm font-medium mb-2">Impacto Financeiro</div>
                        <div className="text-sm text-gray-600">
                          <div className="mb-2">
                            <span className="font-medium">Total:</span> {formatarMoeda(resultado.impacto_financeiro?.impacto_total)}
                          </div>
                          <div className="mb-2">
                            <span className="font-medium">Percentual:</span> {resultado.impacto_financeiro?.impacto_percentual?.toFixed(1)}%
                          </div>
                          {resultado.impacto_financeiro?.receita_adicional_estimada > 0 && (
                            <div className="text-green-600">
                              + Receita: {formatarMoeda(resultado.impacto_financeiro?.receita_adicional_estimada)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {visualizacaoAtiva === 'detalhes' && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <h5 className="font-medium mb-3">Métricas do Método {resultado.metodo_aplicado}</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Variância Entre (σ²):</div>
                          <div className="font-medium">
                            {resultado.metricas_credibilidade?.var_entre?.toExponential(3) || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Variância Dentro (τ²):</div>
                          <div className="font-medium">
                            {resultado.metricas_credibilidade?.var_dentro?.toExponential(3) || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Homogeneidade:</div>
                          <div className="font-medium">
                            {resultado.metricas_credibilidade?.homogeneidade || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Confiabilidade:</div>
                          <div className="font-medium">
                            {resultado.metricas_credibilidade?.confiabilidade_estimacao || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Recomendações */}
                    {resultado.recomendacoes && (
                      <div className="bg-white p-4 rounded-lg border">
                        <h5 className="font-medium mb-3">Recomendações</h5>
                        <div className="space-y-2">
                          <div className="flex items-start">
                            <div className="mt-1 mr-2">📋</div>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Ações:</span> {resultado.recomendacoes.acoes_prioritarias}
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className="mt-1 mr-2">🎯</div>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Grupos Prioritários:</span> {
                                resultado.recomendacoes.grupos_prioritarios?.join(', ') || 'Nenhum'
                              }
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className="mt-1 mr-2">➡️</div>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Próximos Passos:</span> {resultado.recomendacoes.proximos_passos}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>📈 Resultados da Credibilidade</CardTitle>
                <CardDescription>
                  Configure as variáveis e execute o cálculo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 animate-pulse">📊</div>
                  <h4 className="font-semibold text-lg mb-2">Teoria da Credibilidade</h4>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Ajuste prêmios com base na experiência histórica de cada grupo de risco
                  </p>
                  
                  {modeloFrequencia && modeloSeveridade && (
                    <div className="bg-blue-50 p-3 rounded-lg inline-block">
                      <span className="text-sm text-blue-700">
                        ✓ Modelos GLM disponíveis para referência
                      </span>
                    </div>
                  )}

                  {/* 🔥 INDICADOR DE INTEGRAÇÃO */}
                  {onResultadoModelo && (
                    <div className="mt-4 text-xs text-green-600">
                      ✅ Resultados serão salvos automaticamente no Dashboard
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}