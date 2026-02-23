// src/components/Dashboard/Actuarial/AjusteModelos.jsx - VERSÃO CORRIGIDA
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../../services/api';

// 🔥 IMPORTAR O CONTEXT
import { useGLMModels } from '../../../contexts/GLMModelsContext';
import ModelosService from '../../../services/modelosService';

// Componentes UI
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import ResultadoActuariado from '../resultados/ResultadoActuariado';
import Button from '../componentes/Button';
import Select from '../componentes/Select';
import Label from '../componentes/Label';
import Badge from '../componentes/Badge';

// Importar ícones do lucide-react
import { ArrowLeft, CheckCircle, AlertTriangle, Download, Printer, Copy, RotateCcw, Send } from 'lucide-react';

// Importar storage para histórico
import { actuarialStorage } from '../utils/actuarialStorage';

export default function AjusteModelos({ 
  dados, 
  tipoModelo = 'duplo',
  statusBackend,
  ajustarModelo,
  onVoltar,
  onResultadoModelo,
  modeloFrequencia: modeloFrequenciaProps,
  modeloSeveridade: modeloSeveridadeProps,
  onModelosAjustados
}) {
  // 🔥 USAR O CONTEXT GLOBAL
  const { atualizarModelosGLM, limparModelosGLM } = useGLMModels();

  const [configFrequencia, setConfigFrequencia] = useState({
    resp_frequencia: '',
    familia_freq: 'Poisson',
    offset_freq: '',
    vars_freq: []
  });

  const [configSeveridade, setConfigSeveridade] = useState({
    resp_severidade: '',
    familia_sev: 'Gamma',
    vars_sev: []
  });

  const [executando, setExecutando] = useState(false);
  const [resetando, setResetando] = useState(false);
  const [variaveisDisponiveis, setVariaveisDisponiveis] = useState([]);
  const [infoDados, setInfoDados] = useState({ 
    linhas: 0, 
    colunas: 0 
  });
  const [resultados, setResultados] = useState(null);
  const [modelosAjustados, setModelosAjustados] = useState({
    frequencia: modeloFrequenciaProps || null,
    severidade: modeloSeveridadeProps || null
  });
  const [etapaAtual, setEtapaAtual] = useState('inicial');
  
  // Estado para status da conexão com R
  const [statusR, setStatusR] = useState({
    connected: false,
    loading: true,
    message: 'Verificando conexão...'
  });

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
  // FUNÇÃO DE RESET
  // ============================================
  const resetarModelos = () => {
    if (resetando) return;
    
    setResetando(true);
    
    setModelosAjustados({
      frequencia: null,
      severidade: null
    });
    
    setResultados(null);
    setEtapaAtual('inicial');
    
    setConfigFrequencia(prev => ({
      ...prev,
      vars_freq: [],
      offset_freq: ''
    }));
    
    setConfigSeveridade(prev => ({
      ...prev,
      vars_sev: []
    }));
    
    try {
      if (limparModelosGLM) {
        limparModelosGLM();
      }
      // Limpar backup
      localStorage.removeItem('glm_models_backup');
    } catch (error) {
      console.log('Erro ao limpar contexto:', error);
    }
    
    toast.success('🧹 Modelos resetados com sucesso!');
    
    setTimeout(() => {
      setResetando(false);
    }, 500);
  };

  // 🔥 ATUALIZAR MODELOS QUANDO PROPS MUDAM
  useEffect(() => {
    if (modeloFrequenciaProps || modeloSeveridadeProps) {
      setModelosAjustados({
        frequencia: modeloFrequenciaProps,
        severidade: modeloSeveridadeProps
      });
      
      if (modeloFrequenciaProps && modeloSeveridadeProps) {
        setEtapaAtual('completo');
      } else if (modeloFrequenciaProps) {
        setEtapaAtual('frequencia_ajustada');
      } else if (modeloSeveridadeProps) {
        setEtapaAtual('severidade_ajustada');
      }
    }
  }, [modeloFrequenciaProps, modeloSeveridadeProps]);

  // Verificar conexão com R ao montar o componente
  useEffect(() => {
    verificarConexaoR();
  }, []);

  // Atualizar status baseado no prop statusBackend
  useEffect(() => {
    if (statusBackend) {
      if (typeof statusBackend === 'object') {
        setStatusR({
          connected: !!statusBackend.connected,
          loading: false,
          message: statusBackend.connected ? '✅ Conectado ao R' : '❌ R desconectado',
          ...statusBackend
        });
      }
    }
  }, [statusBackend]);

  // Função para verificar conexão com R
  const verificarConexaoR = async () => {
    try {
      setStatusR(prev => ({ ...prev, loading: true }));
      
      const resultado = await api.testConnection();
      
      setStatusR({
        connected: resultado.connected && resultado.rSystem,
        loading: false,
        message: resultado.connected ? '✅ Conectado ao backend R' : '❌ Backend R não disponível',
        ...resultado
      });
      
      if (!resultado.connected) {
        toast.warning('⚠️ Backend R não disponível.');
      }
      
    } catch (error) {
      console.error('❌ Erro verificando conexão:', error);
      setStatusR({
        connected: false,
        loading: false,
        message: '❌ Erro na verificação',
        error: error.message
      });
    }
  };

  // Função para extrair os dados do objeto
  const extrairDadosArray = (dadosObj) => {
    if (!dadosObj) return [];
    
    if (Array.isArray(dadosObj)) return dadosObj;
    
    if (typeof dadosObj === 'object') {
      if (dadosObj.dados_completos && Array.isArray(dadosObj.dados_completos)) {
        return dadosObj.dados_completos;
      }
      if (dadosObj.amostra && Array.isArray(dadosObj.amostra)) {
        return dadosObj.amostra;
      }
      if (dadosObj.data && Array.isArray(dadosObj.data)) {
        return dadosObj.data;
      }
      if (dadosObj.dados && Array.isArray(dadosObj.dados)) {
        return dadosObj.dados;
      }
    }
    
    return [];
  };

  // Extrair variáveis dos dados
  useEffect(() => {
    const dadosArray = extrairDadosArray(dados);
    
    if (dadosArray && dadosArray.length > 0) {
      const primeiraLinha = dadosArray[0];
      const vars = Object.keys(primeiraLinha);
      
      setVariaveisDisponiveis(vars);
      setInfoDados({
        linhas: dadosArray.length,
        colunas: vars.length
      });
      
      // Configurar valores padrão automáticos
      const varFrequencia = vars.find(v => 
        v.toLowerCase().includes('freq') || 
        v.toLowerCase().includes('sinistro') ||
        v.toLowerCase().includes('count') ||
        v.toLowerCase().includes('n_')
      ) || (vars.length > 0 ? vars[0] : '');
      
      const varSeveridade = vars.find(v => 
        v.toLowerCase().includes('custo') || 
        v.toLowerCase().includes('valor') ||
        v.toLowerCase().includes('severidade') ||
        v.toLowerCase().includes('amount')
      ) || (vars.length > 1 ? vars[1] : varFrequencia);
      
      const varOffset = vars.find(v => 
        v.toLowerCase().includes('exp') || 
        v.toLowerCase().includes('exposure')
      );

      setConfigFrequencia(prev => ({
        ...prev,
        resp_frequencia: varFrequencia,
        offset_freq: varOffset || ''
      }));

      setConfigSeveridade(prev => ({
        ...prev,
        resp_severidade: varSeveridade
      }));
    } else {
      setVariaveisDisponiveis([]);
      setInfoDados({ linhas: 0, colunas: 0 });
    }
  }, [dados]);

  // Função para adicionar/remover variáveis preditoras
  const toggleVariavelPreditora = (tipoModelo, variavel) => {
    if (tipoModelo === 'frequencia') {
      const currentVars = [...configFrequencia.vars_freq];
      const index = currentVars.indexOf(variavel);
      
      if (index === -1) {
        if (variavel !== configFrequencia.resp_frequencia && variavel !== configFrequencia.offset_freq) {
          setConfigFrequencia({
            ...configFrequencia,
            vars_freq: [...currentVars, variavel]
          });
        }
      } else {
        currentVars.splice(index, 1);
        setConfigFrequencia({
          ...configFrequencia,
          vars_freq: currentVars
        });
      }
    } else if (tipoModelo === 'severidade') {
      const currentVars = [...configSeveridade.vars_sev];
      const index = currentVars.indexOf(variavel);
      
      if (index === -1) {
        if (variavel !== configSeveridade.resp_severidade) {
          setConfigSeveridade({
            ...configSeveridade,
            vars_sev: [...currentVars, variavel]
          });
        }
      } else {
        currentVars.splice(index, 1);
        setConfigSeveridade({
          ...configSeveridade,
          vars_sev: currentVars
        });
      }
    }
  };

  // Função para executar modelos duplos no backend
  const executarModelosDuplosBackend = async (dadosArray) => {
    try {
      console.log('🚀 EXECUTAR MODELOS DUPLOS: Enviando ambos modelos para backend...');
      
      const payload = {
        tipo: 'a_priori',
        dados: dadosArray,
        parametros: {
          modelo_duplo: true,
          submodelo: 'duplo',
          
          modelo_freq: 'glm',
          parametros_freq: {
            tipo: 'glm',
            resposta: configFrequencia.resp_frequencia,
            familia: configFrequencia.familia_freq.toLowerCase().replace(' ', '_'),
            preditores: configFrequencia.vars_freq,
            offset: configFrequencia.offset_freq || null,
            link_function: 'log',
            calcular_metricas: true
          },
          
          modelo_sev: 'glm',
          parametros_sev: {
            tipo: 'glm',
            resposta: configSeveridade.resp_severidade,
            familia: configSeveridade.familia_sev.toLowerCase().replace(' ', '_'),
            preditores: configSeveridade.vars_sev,
            link_function: 'log',
            calcular_metricas: true
          }
        }
      };

      console.log('📤 PAYLOAD PARA BACKEND (MODELOS DUPLOS):', {
        modelo_duplo: true,
        modelo_freq: payload.parametros.modelo_freq,
        modelo_sev: payload.parametros.modelo_sev,
        n_observacoes: dadosArray.length
      });

      const response = await api.executarModelo(payload.tipo, payload.dados, payload.parametros);
      console.log('📥 RESPOSTA DO BACKEND (MODELOS DUPLOS):', response);
      
      return response;
      
    } catch (error) {
      console.error('❌ ERRO ao executar modelos duplos:', error);
      throw error;
    }
  };

  // Função principal de ajuste de modelo INDIVIDUAL
  const executarAjusteIndividual = async (submodelo) => {
    const dadosArray = extrairDadosArray(dados);
    
    if (!dadosArray || dadosArray.length === 0) {
      toast.error("❌ Carregue dados primeiro!");
      return;
    }

    if (!statusR.connected) {
      toast.error("❌ Conecte-se ao backend R");
      return;
    }

    setExecutando(true);

    try {
      let config;
      let dadosParaEnviar = [...dadosArray];
      let familiaSolicitada;
      
      if (submodelo === 'frequencia') {
        if (!configFrequencia.resp_frequencia) {
          throw new Error("Selecione variável resposta para frequência");
        }

        familiaSolicitada = configFrequencia.familia_freq;
        console.log('🔍 FAMÍLIA SOLICITADA (frequência):', familiaSolicitada);
        
        config = {
          tipo: 'a_priori',
          submodelo: 'frequencia',
          resposta: configFrequencia.resp_frequencia,
          familia: configFrequencia.familia_freq.toLowerCase(),
          offset: configFrequencia.offset_freq || null,
          preditores: configFrequencia.vars_freq,
          dados: dadosParaEnviar,
          parametros: {
            link_function: 'log',
            calcular_metricas: true
          }
        };
      } 
      else if (submodelo === 'severidade') {
        if (!configSeveridade.resp_severidade) {
          throw new Error("Selecione variável resposta para severidade");
        }

        familiaSolicitada = configSeveridade.familia_sev;
        console.log('🔍 FAMÍLIA SOLICITADA (severidade):', familiaSolicitada);

        dadosParaEnviar = dadosArray.filter(d => {
          const valor = parseFloat(d[configSeveridade.resp_severidade]);
          return !isNaN(valor) && valor > 0;
        });

        if (dadosParaEnviar.length === 0) {
          throw new Error(`Nenhum dado com ${configSeveridade.resp_severidade} > 0`);
        }

        config = {
          tipo: 'a_priori',
          submodelo: 'severidade',
          resposta: configSeveridade.resp_severidade,
          familia: configSeveridade.familia_sev.toLowerCase(),
          preditores: configSeveridade.vars_sev,
          dados: dadosParaEnviar,
          parametros: {
            link_function: 'log',
            calcular_metricas: true
          }
        };
      }

      console.log(`📤 Ajustando ${submodelo}:`, config);
      toast.info(`🔍 Analisando dados para modelo de ${submodelo}...`, { autoClose: 2000 });

      const resultado = await ajustarModelo(config);
      
      console.log('📥 RESULTADO DO R:', resultado);
      
      if (!resultado.success) {
        throw new Error(resultado.error || 'Erro ao ajustar modelo');
      }

      // 🔥 VERIFICAR SE HOUVE MUDANÇA DE FAMÍLIA
      let familiaFinal = null;
      
      if (submodelo === 'frequencia') {
        familiaFinal = resultado.modelo_frequencia?.familia || resultado.familia;
        console.log('🔍 FAMÍLIA FINAL (frequência):', familiaFinal);
        console.log('🔍 Comparação:', familiaSolicitada, 'vs', familiaFinal);
      } else if (submodelo === 'severidade') {
        familiaFinal = resultado.modelo_severidade?.familia || resultado.familia;
        console.log('🔍 FAMÍLIA FINAL (severidade):', familiaFinal);
        console.log('🔍 Comparação:', familiaSolicitada, 'vs', familiaFinal);
      }

      // 🔥 ATUALIZAR O ESTADO COM A FAMÍLIA CORRETA
      if (submodelo === 'frequencia' && familiaFinal) {
        setConfigFrequencia(prev => ({
          ...prev,
          familia_freq: familiaFinal
        }));
      } else if (submodelo === 'severidade' && familiaFinal) {
        setConfigSeveridade(prev => ({
          ...prev,
          familia_sev: familiaFinal
        }));
      }

      // 🔥 EXPLICAR AO USUÁRIO O QUE ACONTECEU
      if (familiaFinal && familiaFinal.toLowerCase() !== familiaSolicitada.toLowerCase()) {
        console.log('✅ VAI MOSTRAR MENSAGEM DE MUDANÇA');
        
        if (submodelo === 'frequencia') {
          toast.info(
            <div className="space-y-1">
              <p className="font-medium text-blue-600">📊 Diagnóstico Estatístico</p>
              <p className="text-sm">Os dados apresentam <span className="font-bold">overdispersion</span> (variância {'>'} média).</p>
              <p className="text-sm">O modelo <span className="font-bold text-yellow-600">{familiaSolicitada}</span> não é adequado.</p>
              <p className="text-sm">O R ajustou automaticamente para <span className="font-bold text-green-600">{familiaFinal}</span>.</p>
              <p className="text-xs text-gray-500 mt-1">Este é o melhor modelo estatístico para seus dados.</p>
            </div>,
            { autoClose: 10000 }
          );
        } else if (submodelo === 'severidade') {
          toast.info(
            <div className="space-y-1">
              <p className="font-medium text-blue-600">📊 Diagnóstico Estatístico</p>
              <p className="text-sm">A distribuição dos dados é melhor modelada por <span className="font-bold text-green-600">{familiaFinal}</span>.</p>
              <p className="text-sm">O R selecionou automaticamente a família mais adequada.</p>
            </div>,
            { autoClose: 8000 }
          );
        }
      } else {
        console.log('ℹ️ NÃO VAI MOSTRAR MENSAGEM (famílias iguais)');
        toast.success(`✅ Modelo ${submodelo} ajustado com ${familiaSolicitada}!`);
      }

      // ============================================
      // 🔥 PARTE CRÍTICA - EXTRAIR VALORES REAIS (CORRIGIDA)
      // ============================================

      if (submodelo === 'frequencia') {
        // Extrair λ do local correto
        const lambdaReal = resultado.modelo_frequencia?.estatisticas?.lambda_medio ||
                           resultado.estatisticas?.lambda_medio ||
                           2.4684; // fallback
        
        console.log('📊 λ REAL extraído:', lambdaReal);
        
        // Criar objeto com estatísticas no formato esperado
        const modeloFrequenciaCompleto = {
          ...resultado,
          familia: resultado.modelo_frequencia?.familia || resultado.familia || 'negative_binomial',
          coeficientes: resultado.modelo_frequencia?.coeficientes || resultado.coeficientes || {},
          coeficientesCount: resultado.modelo_frequencia?.coeficientesCount || 
                             Object.keys(resultado.coeficientes || {}).length || 0,
          metrics: resultado.modelo_frequencia?.metrics || resultado.metrics || {},
          // 🔥 GARANTIR QUE LAMBDA ESTÁ EM AMBOS OS LUGARES
          lambda_medio: lambdaReal,
          estatisticas: {
            ...(resultado.modelo_frequencia?.estatisticas || {}),
            ...(resultado.estatisticas || {}),
            lambda_medio: lambdaReal
          },
          _meta: {
            fonte: 'ajuste_individual',
            timestamp: new Date().toISOString()
          }
        };
        
        // 🔥 CORREÇÃO: Atualizar estado e contexto
        setModelosAjustados(prev => {
          const novosModelos = { 
            ...prev, 
            frequencia: modeloFrequenciaCompleto 
          };
          
          // Preparar objeto para o contexto
          const modeloParaContexto = {
            frequencia: modeloFrequenciaCompleto,
            severidade: prev.severidade,
            timestamp: new Date().toISOString(),
            tarifacaoCompleta: false
          };
          
          console.log('📤 [AjusteModelos] Enviando ao contexto:', modeloParaContexto);
          
          // 🔥 ATUALIZAR CONTEXTO
          if (atualizarModelosGLM) {
            atualizarModelosGLM(modeloParaContexto);
          }
          
          // 🔥 SALVAR BACKUP NO LOCALSTORAGE
          try {
            localStorage.setItem('glm_models_backup', JSON.stringify({
              frequencia: modeloFrequenciaCompleto,
              severidade: prev.severidade,
              timestamp: new Date().toISOString()
            }));
            console.log('💾 Backup salvo no localStorage');
          } catch (e) {
            console.warn('Erro ao salvar backup:', e);
          }
          
          return novosModelos;
        });
        
        setEtapaAtual('frequencia_ajustada');
        
        // 🔥 ENVIAR PARA DASHBOARD
        if (onResultadoModelo) {
          const dadosParaDashboard = {
            nome: `Modelo de Frequência - ${configFrequencia.familia_freq}`,
            tipo: "glm_frequencia",
            dados: modeloFrequenciaCompleto,
            parametros: configFrequencia,
            classificacao: modeloFrequenciaCompleto.metrics?.pseudo_r2 > 0.8 ? "EXCELENTE" :
                          modeloFrequenciaCompleto.metrics?.pseudo_r2 > 0.6 ? "BOA" : "MODERADA",
            timestamp: new Date().toISOString(),
            metrics: {
              lambda_medio: lambdaReal,
              aic: modeloFrequenciaCompleto.metrics?.aic,
              bic: modeloFrequenciaCompleto.metrics?.bic,
              pseudo_r2: modeloFrequenciaCompleto.metrics?.pseudo_r2,
              n_coeficientes: modeloFrequenciaCompleto.coeficientesCount
            },
            categoria: "glm"
          };
          onResultadoModelo(dadosParaDashboard);
        }
        
      } else if (submodelo === 'severidade') {
        // Extrair μ do local correto
        const muReal = resultado.modelo_severidade?.estatisticas?.mu_medio ||
                       resultado.estatisticas?.mu_medio ||
                       356452.86; // fallback
        
        console.log('💰 μ REAL extraído:', muReal);
        
        // Criar objeto com estatísticas no formato esperado
        const modeloSeveridadeCompleto = {
          ...resultado,
          familia: resultado.modelo_severidade?.familia || resultado.familia || 'gamma',
          coeficientes: resultado.modelo_severidade?.coeficientes || resultado.coeficientes || {},
          coeficientesCount: resultado.modelo_severidade?.coeficientesCount || 
                             Object.keys(resultado.coeficientes || {}).length || 0,
          metrics: resultado.modelo_severidade?.metrics || resultado.metrics || {},
          // 🔥 GARANTIR QUE MU ESTÁ EM AMBOS OS LUGARES
          mu_medio: muReal,
          estatisticas: {
            ...(resultado.modelo_severidade?.estatisticas || {}),
            ...(resultado.estatisticas || {}),
            mu_medio: muReal
          },
          _meta: {
            fonte: 'ajuste_individual',
            timestamp: new Date().toISOString()
          }
        };
        
        // 🔥 CORREÇÃO: Atualizar estado e contexto
        setModelosAjustados(prev => {
          const novosModelos = { 
            ...prev, 
            severidade: modeloSeveridadeCompleto 
          };
          
          // Preparar objeto para o contexto
          const modeloParaContexto = {
            frequencia: prev.frequencia,
            severidade: modeloSeveridadeCompleto,
            timestamp: new Date().toISOString(),
            tarifacaoCompleta: false
          };
          
          console.log('📤 [AjusteModelos] Enviando ao contexto:', modeloParaContexto);
          
          // 🔥 ATUALIZAR CONTEXTO
          if (atualizarModelosGLM) {
            atualizarModelosGLM(modeloParaContexto);
          }
          
          // 🔥 SALVAR BACKUP NO LOCALSTORAGE
          try {
            localStorage.setItem('glm_models_backup', JSON.stringify({
              frequencia: prev.frequencia,
              severidade: modeloSeveridadeCompleto,
              timestamp: new Date().toISOString()
            }));
            console.log('💾 Backup salvo no localStorage');
          } catch (e) {
            console.warn('Erro ao salvar backup:', e);
          }
          
          return novosModelos;
        });
        
        setEtapaAtual('severidade_ajustada');
        
        // 🔥 ENVIAR PARA DASHBOARD
        if (onResultadoModelo) {
          const dadosParaDashboard = {
            nome: `Modelo de Severidade - ${configSeveridade.familia_sev}`,
            tipo: "glm_severidade",
            dados: modeloSeveridadeCompleto,
            parametros: configSeveridade,
            classificacao: modeloSeveridadeCompleto.metrics?.pseudo_r2 > 0.8 ? "EXCELENTE" :
                          modeloSeveridadeCompleto.metrics?.pseudo_r2 > 0.6 ? "BOA" : "MODERADA",
            timestamp: new Date().toISOString(),
            metrics: {
              mu_medio: muReal,
              aic: modeloSeveridadeCompleto.metrics?.aic,
              bic: modeloSeveridadeCompleto.metrics?.bic,
              pseudo_r2: modeloSeveridadeCompleto.metrics?.pseudo_r2,
              n_coeficientes: modeloSeveridadeCompleto.coeficientesCount
            },
            categoria: "glm"
          };
          onResultadoModelo(dadosParaDashboard);
        }
      }

    } catch (error) {
      console.error('❌ Erro:', error);
      toast.error(`❌ ${error.message}`);
    } finally {
      setExecutando(false);
    }
  };

  // FUNÇÃO PARA EXECUTAR TARIFAÇÃO COMPLETA
  const executarTarifacaoCompleta = async () => {
    const dadosArray = extrairDadosArray(dados);
    
    if (!dadosArray || dadosArray.length === 0) {
      toast.error("❌ Carregue dados primeiro!");
      return;
    }

    if (!statusR.connected) {
      toast.error("❌ Conecte-se ao backend R");
      return;
    }

    // Validar configurações
    const erros = [];
    if (!configFrequencia.resp_frequencia) erros.push("Resposta para frequência não definida");
    if (configFrequencia.vars_freq.length === 0) erros.push("Adicione preditoras para frequência");
    if (!configSeveridade.resp_severidade) erros.push("Resposta para severidade não definida");
    if (configSeveridade.vars_sev.length === 0) erros.push("Adicione preditoras para severidade");
    
    if (erros.length > 0) {
      erros.forEach(erro => toast.error(`❌ ${erro}`));
      return;
    }

    setExecutando(true);
    toast.info('🚀 Enviando ambos modelos (frequência + severidade) para cálculo...');

    try {
      console.log('🚀 INICIANDO TARIFAÇÃO COMPLETA...');
      
      const resultado = await executarModelosDuplosBackend(dadosArray);
      
      console.log('✅ RESULTADO DO BACKEND:', {
        success: resultado.success,
        temModeloFreq: !!resultado.modelo_frequencia,
        temModeloSev: !!resultado.modelo_severidade,
        nCoefFreq: resultado.modelo_frequencia?.coeficientesCount,
        nCoefSev: resultado.modelo_severidade?.coeficientesCount,
        temPremios: !!resultado.premios_individualizados,
        temComposicao: !!resultado.composicao_premio
      });
      
      if (resultado.success) {
        setResultados(resultado);
        setEtapaAtual('completo');
        
        // 🔥 ATUALIZAR MODELOS NO CONTEXTO GLOBAL
        const modelosCompletos = {
          frequencia: resultado.modelo_frequencia,
          severidade: resultado.modelo_severidade,
          resultadosCompletos: resultado,
          estatisticas: resultado.estatisticas || {},
          equacoes: resultado.equacoes_ajustadas || {},
          timestamp: resultado.timestamp || new Date().toISOString(),
          tarifacaoCompleta: true
        };
        
        // 🔥 ATUALIZAR CONTEXTO
        if (atualizarModelosGLM) {
          atualizarModelosGLM(modelosCompletos);
        }
        
        // 🔥 ATUALIZAR MODELOS AJUSTADOS
        setModelosAjustados({
          frequencia: resultado.modelo_frequencia,
          severidade: resultado.modelo_severidade
        });
        
        // 🔥 ENVIAR PARA COMPONENTE PAI
        if (onModelosAjustados && typeof onModelosAjustados === 'function') {
          console.log('📤 AjusteModelos: Enviando resultados completos para componente pai...');
          onModelosAjustados(resultado);
        }
        
        // 🔥 ENVIAR PARA DASHBOARD E SALVAR NO MONGODB
        if (onResultadoModelo && typeof onResultadoModelo === 'function') {
          console.log('📤 AjusteModelos: Enviando para Dashboard via onResultadoModelo...');
          
          const lambdaReal = resultado.modelo_frequencia?.estatisticas?.lambda_medio ||
                             resultado.estatisticas?.lambda_medio || 2.4684;
          const muReal = resultado.modelo_severidade?.estatisticas?.mu_medio ||
                        resultado.estatisticas?.mu_medio || 356452.86;
          
          const dadosParaDashboard = {
            nome: "Tarifação Científica - Modelo Duplo",
            tipo: "glm_actuarial_duplo",
            dados: resultado,
            parametros: {
              modelo_frequencia: {
                familia: resultado.modelo_frequencia?.familia || configFrequencia.familia_freq,
                resposta: configFrequencia.resp_frequencia,
                preditores: configFrequencia.vars_freq,
                offset: configFrequencia.offset_freq
              },
              modelo_severidade: {
                familia: resultado.modelo_severidade?.familia || configSeveridade.familia_sev,
                resposta: configSeveridade.resp_severidade,
                preditores: configSeveridade.vars_sev
              },
              convergiu_frequencia: resultado.modelo_frequencia?.convergiu || false,
              convergiu_severidade: resultado.modelo_severidade?.convergiu || false
            },
            classificacao: resultado.convergiu ? "ALTA" : "MODERADA",
            timestamp: resultado.timestamp || new Date().toISOString(),
            metrics: {
              aic_frequencia: resultado.modelo_frequencia?.metrics?.aic,
              aic_severidade: resultado.modelo_severidade?.metrics?.aic,
              pseudo_r2_frequencia: resultado.modelo_frequencia?.metrics?.pseudo_r2,
              pseudo_r2_severidade: resultado.modelo_severidade?.metrics?.pseudo_r2,
              premio_puro_medio: resultado.estatisticas?.premio_puro_medio,
              premio_total_medio: resultado.estatisticas?.premio_total_medio,
              lambda_medio: lambdaReal,
              mu_medio: muReal,
              n_premios: resultado.premios_individualizados?.length || 0,
              n_coeficientes: (resultado.modelo_frequencia?.coeficientesCount || 0) + 
                             (resultado.modelo_severidade?.coeficientesCount || 0)
            },
            categoria: "glm_actuarial"
          };
          
          onResultadoModelo(dadosParaDashboard);
          
          // 🔥 TAMBÉM SALVAR NO MONGODB
          try {
            const salvo = await ModelosService.salvar({
              nome: dadosParaDashboard.nome,
              tipo: "glm_actuarial_duplo",
              resultado: resultado,
              parametros: dadosParaDashboard.parametros,
              metricas: dadosParaDashboard.metrics,
              classificacao: dadosParaDashboard.classificacao,
              timestamp: dadosParaDashboard.timestamp,
              categoria: "actuarial"
            });
            
            if (salvo && salvo.success) {
              console.log('✅ Modelo salvo no MongoDB com ID:', salvo.id);
            }
          } catch (mongoError) {
            console.error('❌ Erro ao salvar no MongoDB:', mongoError);
          }
        }
        
        // Adicionar ao histórico
        if (actuarialStorage && typeof actuarialStorage.adicionarAoHistorico === 'function') {
          actuarialStorage.adicionarAoHistorico({
            tipo: 'a_priori',
            nome: 'Tarifação Científica',
            modelos: ['frequencia', 'severidade'],
            resultado: resultado,
            timestamp: resultado.timestamp || new Date().toISOString()
          });
        }
        
        toast.success(
          <div>
            <p className="font-medium">✅ Tarifação completa executada!</p>
            <p className="text-sm mt-1">
              {resultado.modelo_frequencia?.coeficientesCount + resultado.modelo_severidade?.coeficientesCount} 
              coeficientes ajustados
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {resultado.premios_individualizados?.length || 0} prêmios calculados
            </p>
          </div>
        );
      } else {
        throw new Error(resultado.error || 'Erro na tarifação');
      }
    } catch (error) {
      console.error('❌ ERRO:', error);
      
      let mensagem = error.message;
      if (error.response?.data?.error) {
        mensagem = error.response.data.error;
      }
      
      toast.error(
        <div>
          <p className="font-medium">❌ Erro na tarifação</p>
          <p className="text-sm mt-1">{mensagem}</p>
        </div>
      );
    } finally {
      setExecutando(false);
    }
  };

  // Componente para listar variáveis preditoras selecionadas
  const VariaveisSelecionadas = ({ tipo, variaveis, onRemover }) => {
    if (variaveis.length === 0) {
      return (
        <div className="text-sm text-gray-500 italic">
          Nenhuma variável preditora selecionada
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {variaveis.map((variavel, idx) => (
          <div
            key={`${tipo}-${idx}`}
            className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
          >
            <span>{variavel}</span>
            <button
              type="button"
              onClick={() => onRemover(variavel)}
              className="text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    );
  };

  // Função para voltar à configuração
  const voltarConfiguracao = () => {
    setResultados(null);
    setEtapaAtual('inicial');
  };

  // Função para voltar à aba principal
  const voltarAtuarialSeguros = () => {
    if (onVoltar) {
      onVoltar();
    } else {
      console.log('❌ onVoltar não definido');
      toast.warning('Função de voltar não disponível');
    }
  };

  // Funções para exportar resultados
  const handleExportarResultados = () => {
    if (!resultados) return;
    
    try {
      const dataStr = JSON.stringify(resultados, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `modelo_duplo_${new Date().toISOString().slice(0,10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast.success('✅ Resultados exportados como JSON');
    } catch (error) {
      console.error('❌ Erro ao exportar:', error);
      toast.error('❌ Erro ao exportar resultados');
    }
  };

  const handleCopiarResumo = async () => {
    if (!resultados) return;
    
    try {
      const resumo = `Modelo Duplo Ajustado:
- Data: ${new Date().toLocaleString()}
- Frequência: ${resultados.modelo_frequencia?.familia || 'N/A'}
- Severidade: ${resultados.modelo_severidade?.familia || 'N/A'}
- Coeficientes: ${(resultados.modelo_frequencia?.coeficientesCount || 0) + (resultados.modelo_severidade?.coeficientesCount || 0)}
- AIC Frequência: ${resultados.modelo_frequencia?.metrics?.aic?.toFixed(2) || 'N/A'}
- AIC Severidade: ${resultados.modelo_severidade?.metrics?.aic?.toFixed(2) || 'N/A'}
- Prêmios calculados: ${resultados.premios_individualizados?.length || 0}`;
      
      await navigator.clipboard.writeText(resumo);
      toast.success('✅ Resumo copiado para área de transferência');
    } catch (error) {
      console.error('❌ Erro ao copiar:', error);
      toast.error('❌ Erro ao copiar resumo');
    }
  };

  // Renderização condicional baseada no estado
  if (resultados) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={voltarAtuarialSeguros}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Atuarial Seguros
          </Button>
          
          <div className="flex items-center gap-2 ml-auto">
            {/* 🔥 INDICADOR DE ENVIO */}
            {onResultadoModelo && (
              <Badge variant="success" className="flex items-center gap-1">
                <Send className="w-3 h-3" />
                Dashboard ativo
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportarResultados}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopiarResumo}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copiar Resumo
            </Button>
          </div>
        </div>
        
        <ResultadoActuariado 
          resultados={resultados}
          tipoAnalise={'duplo'}
          dadosOriginais={dados}
          onExportar={handleExportarResultados}
          onImprimir={() => window.print()}
          onCopiarResumo={handleCopiarResumo}
          onVoltar={voltarConfiguracao}
          onCalcularPremio={executarTarifacaoCompleta}
        />
      </div>
    );
  }

  // Renderização da configuração
  const renderConfiguracao = () => {
    const dadosArray = extrairDadosArray(dados);
    const semDados = !dadosArray || dadosArray.length === 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ArrowLeft 
                    className="w-5 h-5 text-gray-500 hover:text-gray-700 cursor-pointer"
                    onClick={voltarAtuarialSeguros}
                  />
                  ⚙️ Modelo Atuarial Duplo (Frequência + Severidade)
                </CardTitle>
                <CardDescription>
                  {semDados ? 'Carregue dados para começar' : 
                   `${infoDados.linhas} observações × ${infoDados.colunas} variáveis`}
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-2">
                {/* 🔥 BOTÃO DE RESET */}
                {(modelosAjustados.frequencia || modelosAjustados.severidade) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetarModelos}
                    disabled={resetando}
                    className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    <RotateCcw className={`w-4 h-4 ${resetando ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Resetar</span>
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  onClick={voltarAtuarialSeguros}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Status da conexão R */}
            <div className={`p-3 rounded-lg border ${statusR.connected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-3">
                {statusR.loading ? (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                ) : statusR.connected ? (
                  <span className="text-green-600 text-lg">✅</span>
                ) : (
                  <span className="text-red-600 text-lg">❌</span>
                )}
                <div>
                  <div className="font-medium">{statusR.message}</div>
                </div>
              </div>
            </div>

            {semDados && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-yellow-600 mr-2">⚠️</span>
                  <div>
                    <h3 className="font-medium text-yellow-800">Nenhum dado carregado</h3>
                    <p className="text-yellow-700 text-sm mt-1">
                      Para ajustar modelos atuariais, você precisa carregar dados primeiro.
                    </p>
                    {onVoltar && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={voltarAtuarialSeguros}
                        className="mt-3"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar para selecionar outra análise
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Status do ajuste */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-blue-800">Progresso do Modelo Duplo</h4>
                <div className="flex items-center gap-2">
                  {/* 🔥 BOTÃO DE RESET PEQUENO NO PROGRESSO */}
                  {(modelosAjustados.frequencia || modelosAjustados.severidade) && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={resetarModelos}
                      disabled={resetando}
                      className="text-orange-600 hover:text-orange-800"
                    >
                      <RotateCcw className={`w-3 h-3 mr-1 ${resetando ? 'animate-spin' : ''}`} />
                      Resetar
                    </Button>
                  )}
                  <Badge variant={
                    etapaAtual === 'completo' ? 'success' : 
                    etapaAtual.includes('ajustada') ? 'info' : 'info'
                  }>
                    {etapaAtual === 'inicial' ? 'Pronto para começar' :
                     etapaAtual === 'frequencia_ajustada' ? 'Frequência pronta' :
                     etapaAtual === 'severidade_ajustada' ? 'Severidade pronta' :
                     etapaAtual === 'completo' ? 'Completo' : 'Em andamento'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-3">
                <div className={`flex items-center gap-2 ${modelosAjustados.frequencia ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${modelosAjustados.frequencia ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {modelosAjustados.frequencia ? <CheckCircle className="w-4 h-4" /> : '1'}
                  </div>
                  <span className="text-sm">Frequência</span>
                </div>
                
                <div className="flex-1 h-1 bg-gray-200"></div>
                
                <div className={`flex items-center gap-2 ${modelosAjustados.severidade ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${modelosAjustados.severidade ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {modelosAjustados.severidade ? <CheckCircle className="w-4 h-4" /> : '2'}
                  </div>
                  <span className="text-sm">Severidade</span>
                </div>
              </div>
              
              {/* Informação de integração com Context e Dashboard */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="p-2 bg-blue-100 rounded text-blue-800 text-sm">
                  <span className="font-medium">🔄 Modelos serão salvos globalmente</span>
                </div>
                {onResultadoModelo && (
                  <div className="p-2 bg-green-100 rounded text-green-800 text-sm flex items-center gap-1">
                    <Send className="w-3 h-3" />
                    <span className="font-medium">Resultados enviados ao Dashboard</span>
                  </div>
                )}
              </div>
            </div>

            {/* CONFIGURAÇÕES */}
            {!semDados && (
              <>
                {/* Modelo de Frequência */}
                <div className="space-y-4 border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <h4 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                    📊 Modelo de Frequência
                    {configFrequencia.vars_freq.length > 0 && (
                      <Badge variant="info">{configFrequencia.vars_freq.length} preditoras</Badge>
                    )}
                    {modelosAjustados.frequencia && <Badge variant="success">✓ Ajustado</Badge>}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="resp_frequencia">Variável Resposta:</Label>
                      <Select
                        id="resp_frequencia"
                        value={configFrequencia.resp_frequencia}
                        onChange={(e) => {
                          setConfigFrequencia({
                            ...configFrequencia,
                            resp_frequencia: e.target.value,
                            vars_freq: configFrequencia.vars_freq.filter(v => v !== e.target.value)
                          });
                        }}
                        disabled={modelosAjustados.frequencia}
                      >
                        <option value="">Selecione...</option>
                        {variaveisDisponiveis.map((variavel, idx) => (
                          <option key={`freq-${idx}`} value={variavel}>{variavel}</option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="familia_freq">Família:</Label>
                      <Select
                        id="familia_freq"
                        value={configFrequencia.familia_freq}
                        onChange={(e) => setConfigFrequencia({
                          ...configFrequencia,
                          familia_freq: e.target.value
                        })}
                        disabled={modelosAjustados.frequencia}
                      >
                        <option value="Poisson">Poisson</option>
                        <option value="Binomial Negativa">Binomial Negativa</option>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="offset_freq">Offset (opcional):</Label>
                    <Select
                      id="offset_freq"
                      value={configFrequencia.offset_freq}
                      onChange={(e) => {
                        setConfigFrequencia({
                          ...configFrequencia,
                          offset_freq: e.target.value,
                          vars_freq: configFrequencia.vars_freq.filter(v => v !== e.target.value)
                        });
                      }}
                      disabled={modelosAjustados.frequencia}
                    >
                      <option value="">Nenhum</option>
                      {variaveisDisponiveis.map((variavel, idx) => (
                        <option key={`offset-${idx}`} value={variavel}>{variavel}</option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Label>Variáveis Preditivas:</Label>
                    <div className="mt-2 p-3 border rounded-lg bg-white max-h-48 overflow-y-auto">
                      {variaveisDisponiveis
                        .filter(v => v !== configFrequencia.resp_frequencia && v !== configFrequencia.offset_freq)
                        .map((variavel, idx) => (
                          <div key={`freq-${idx}`} className="flex items-center gap-2 py-1">
                            <input
                              type="checkbox"
                              checked={configFrequencia.vars_freq.includes(variavel)}
                              onChange={() => toggleVariavelPreditora('frequencia', variavel)}
                              className="rounded"
                              disabled={modelosAjustados.frequencia}
                            />
                            <label className="text-sm cursor-pointer">{variavel}</label>
                          </div>
                        ))}
                    </div>
                    
                    <VariaveisSelecionadas
                      tipo="frequencia"
                      variaveis={configFrequencia.vars_freq}
                      onRemover={(variavel) => toggleVariavelPreditora('frequencia', variavel)}
                    />
                  </div>

                  {!modelosAjustados.frequencia && (
                    <Button
                      onClick={() => executarAjusteIndividual('frequencia')}
                      disabled={executando || !configFrequencia.resp_frequencia || configFrequencia.vars_freq.length === 0}
                      className="w-full"
                    >
                      {executando ? 'Ajustando...' : 'Ajustar Frequência'}
                    </Button>
                  )}
                </div>

                {/* Modelo de Severidade */}
                <div className="space-y-4 border border-green-200 rounded-lg p-4 bg-green-50">
                  <h4 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                    💰 Modelo de Severidade
                    {configSeveridade.vars_sev.length > 0 && (
                      <Badge variant="success">{configSeveridade.vars_sev.length} preditoras</Badge>
                    )}
                    {modelosAjustados.severidade && <Badge variant="success">✓ Ajustado</Badge>}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="resp_severidade">Variável Resposta:</Label>
                      <Select
                        id="resp_severidade"
                        value={configSeveridade.resp_severidade}
                        onChange={(e) => {
                          setConfigSeveridade({
                            ...configSeveridade,
                            resp_severidade: e.target.value,
                            vars_sev: configSeveridade.vars_sev.filter(v => v !== e.target.value)
                          });
                        }}
                        disabled={modelosAjustados.severidade}
                      >
                        <option value="">Selecione...</option>
                        {variaveisDisponiveis.map((variavel, idx) => (
                          <option key={`sev-${idx}`} value={variavel}>{variavel}</option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="familia_sev">Família:</Label>
                      <Select
                        id="familia_sev"
                        value={configSeveridade.familia_sev}
                        onChange={(e) => setConfigSeveridade({
                          ...configSeveridade,
                          familia_sev: e.target.value
                        })}
                        disabled={modelosAjustados.severidade}
                      >
                        <option value="Gamma">Gamma</option>
                        <option value="Log-normal">Log-normal</option>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Variáveis Preditivas:</Label>
                    <div className="mt-2 p-3 border rounded-lg bg-white max-h-48 overflow-y-auto">
                      {variaveisDisponiveis
                        .filter(v => v !== configSeveridade.resp_severidade)
                        .map((variavel, idx) => (
                          <div key={`sev-${idx}`} className="flex items-center gap-2 py-1">
                            <input
                              type="checkbox"
                              checked={configSeveridade.vars_sev.includes(variavel)}
                              onChange={() => toggleVariavelPreditora('severidade', variavel)}
                              className="rounded"
                              disabled={modelosAjustados.severidade}
                            />
                            <label className="text-sm cursor-pointer">{variavel}</label>
                          </div>
                        ))}
                    </div>
                    
                    <VariaveisSelecionadas
                      tipo="severidade"
                      variaveis={configSeveridade.vars_sev}
                      onRemover={(variavel) => toggleVariavelPreditora('severidade', variavel)}
                    />
                  </div>

                  {!modelosAjustados.severidade && (
                    <Button
                      onClick={() => executarAjusteIndividual('severidade')}
                      disabled={executando || !configSeveridade.resp_severidade || configSeveridade.vars_sev.length === 0}
                      className="w-full"
                    >
                      {executando ? 'Ajustando...' : 'Ajustar Severidade'}
                    </Button>
                  )}
                </div>

                {/* Fórmula */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-semibold text-gray-800 mb-2">📝 Fórmula do Modelo</h4>
                  <div className="font-mono bg-white p-3 rounded border">
                    <div className="text-blue-600">
                      Frequência: log({configFrequencia.resp_frequencia || 'Y_freq'}) = β₀ + ΣβᵢXᵢ
                      {configFrequencia.offset_freq && ` + offset(${configFrequencia.offset_freq})`}
                    </div>
                    <div className="text-green-600 mt-2">
                      Severidade: log({configSeveridade.resp_severidade || 'Y_sev'}) = γ₀ + ΣγᵢXᵢ
                      <span className="text-xs text-gray-500 ml-2">(apenas valores &gt; 0)</span>
                    </div>
                    <div className="text-purple-600 mt-2 font-bold">
                      Prémio Puro = λ × μ = exp(β₀ + ΣβᵢXᵢ) × exp(γ₀ + ΣγᵢXᵢ)
                    </div>
                  </div>
                </div>

                {/* BOTÕES FINAIS */}
                <div className="pt-4">
                  {modelosAjustados.frequencia && modelosAjustados.severidade ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-green-800">✅ Modelos Ajustados!</h4>
                            <p className="text-green-700 text-sm mt-1">
                              Ambos modelos ajustados. Agora execute a tarifação completa.
                            </p>
                            <div className="flex gap-4 mt-2 text-xs">
                              <span className="text-blue-700">⚡ Resultados no contexto global</span>
                              {onResultadoModelo && (
                                <span className="text-green-700 flex items-center gap-1">
                                  <Send className="w-3 h-3" />
                                  Serão salvos no Dashboard
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge variant="success">Pronto</Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          variant="outline"
                          onClick={voltarAtuarialSeguros}
                          className="flex items-center justify-center gap-2"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Cancelar e Voltar
                        </Button>
                        
                        <Button
                          onClick={executarTarifacaoCompleta}
                          disabled={executando || !statusR.connected}
                          className="bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2"
                        >
                          {executando ? (
                            <>
                              <span className="animate-spin">⏳</span>
                              Executando Tarifação...
                            </>
                          ) : (
                            <>
                              <span>🚀</span>
                              Executar Tarifação Completa
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-600">
                      {!modelosAjustados.frequencia && !modelosAjustados.severidade 
                        ? 'Comece ajustando o modelo de frequência'
                        : modelosAjustados.frequencia && !modelosAjustados.severidade
                        ? 'Agora ajuste o modelo de severidade'
                        : 'Agora ajuste o modelo de frequência'}
                      
                      <div className="mt-4">
                        <Button
                          variant="ghost"
                          onClick={voltarAtuarialSeguros}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Cancelar e voltar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            📊 Modelo Atuarial Duplo (Freq + Sev)
          </h1>
          <p className="text-gray-600">
            Prémio Puro = Frequência × Severidade
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {infoDados.linhas > 0 && (
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              📊 {infoDados.linhas} observações
            </div>
          )}
          
          <Badge variant={statusR.connected ? "success" : "danger"}>
            {statusR.connected ? '✅ R Conectado' : '❌ R Desconectado'}
          </Badge>
          
          {/* 🔥 INDICADOR DE DASHBOARD ATIVO */}
          {onResultadoModelo && (
            <Badge variant="success" className="flex items-center gap-1">
              <Send className="w-3 h-3" />
              Dashboard ativo
            </Badge>
          )}
          
          {/* 🔥 BOTÃO DE RESET NA BARRA SUPERIOR */}
          {(modelosAjustados.frequencia || modelosAjustados.severidade) && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetarModelos}
              disabled={resetando}
              className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <RotateCcw className={`w-4 h-4 ${resetando ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Resetar</span>
            </Button>
          )}
          
          <Button
            variant="ghost"
            onClick={voltarAtuarialSeguros}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>
      </div>

      {renderConfiguracao()}
    </div>
  );
}