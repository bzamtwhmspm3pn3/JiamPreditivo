// src/components/Dashboard/Actuarial/AjusteModelos.jsx (VERSÃO COM BOTÃO VOLTAR E INTEGRAÇÃO COMPLETA)
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../../services/api';

// Componentes UI
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import ResultadoActuariado from '../resultados/ResultadoActuariado';
import Button from '../componentes/Button';
import Select from '../componentes/Select';
import Label from '../componentes/Label';
import Badge from '../componentes/Badge';

// Importar ícones do lucide-react
import { ArrowLeft, CheckCircle, AlertTriangle, Download, Printer, Copy } from 'lucide-react';

// Importar storage para histórico
import { actuarialStorage } from '../utils/actuarialStorage';

export default function AjusteModelos({ 
  dados, 
  tipoModelo = 'duplo', // 🔥 FORÇAR modelo duplo
  statusBackend,
  ajustarModelo,
  onVoltar, // 🔥 callback para voltar à aba principal
  onResultadoModelo // 🔥 NOVO: callback para enviar resultados ao componente pai
}) {
  // 🔥 REMOVER estados não usados
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
  const [variaveisDisponiveis, setVariaveisDisponiveis] = useState([]);
  const [infoDados, setInfoDados] = useState({ 
    linhas: 0, 
    colunas: 0 
  });
  const [resultados, setResultados] = useState(null);
  const [modelosAjustados, setModelosAjustados] = useState({
    frequencia: null,
    severidade: null
  });
  const [etapaAtual, setEtapaAtual] = useState('inicial');
  
  // Estado para status da conexão com R
  const [statusR, setStatusR] = useState({
    connected: false,
    loading: true,
    message: 'Verificando conexão...'
  });

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

  // Função para validar modelo GLM
  const validarModeloGLM = (resultado, tipo) => {
    if (!resultado || !resultado.success) return false;
    if (!resultado.coeficientes || typeof resultado.coeficientes !== 'object') return false;
    if (Object.keys(resultado.coeficientes).length === 0) return false;
    
    return true;
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

  // 🔥 FUNÇÃO CRÍTICA: Enviar ambos modelos ao backend
  const executarModelosDuplosBackend = async (dadosArray) => {
    try {
      console.log('🚀 EXECUTAR MODELOS DUPLOS: Enviando ambos modelos para backend...');
      
      // 🔥 PAYLOAD COM AMBOS MODELOS
      const payload = {
        tipo: 'a_priori',
        dados: dadosArray,
        parametros: {
          // 🔥 INFORMAR QUE SÃO MODELOS DUPLOS
          modelo_duplo: true,
          submodelo: 'duplo',
          
          // 🔥 Modelo de frequência
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
          
          // 🔥 Modelo de severidade
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

      // 🔥 Chamar a API diretamente
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
      
      if (submodelo === 'frequencia') {
        if (!configFrequencia.resp_frequencia) {
          throw new Error("Selecione variável resposta para frequência");
        }

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

        // Filtrar dados positivos para severidade
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

      const resultado = await ajustarModelo(config);
      
      if (!resultado.success) {
        throw new Error(resultado.error || 'Erro ao ajustar modelo');
      }

      // Atualizar estado
      if (submodelo === 'frequencia') {
        setModelosAjustados(prev => ({ ...prev, frequencia: resultado }));
        setEtapaAtual('frequencia_ajustada');
        
        // 🔥 Enviar resultado individual para o componente pai
        if (onResultadoModelo) {
          onResultadoModelo({
            tipo: 'frequencia',
            modelo: resultado,
            config: configFrequencia
          });
        }
      } else if (submodelo === 'severidade') {
        setModelosAjustados(prev => ({ ...prev, severidade: resultado }));
        setEtapaAtual('severidade_ajustada');
        
        // 🔥 Enviar resultado individual para o componente pai
        if (onResultadoModelo) {
          onResultadoModelo({
            tipo: 'severidade',
            modelo: resultado,
            config: configSeveridade
          });
        }
      }

      toast.success(`✅ ${submodelo === 'frequencia' ? 'Frequência' : 'Severidade'} ajustada!`);

    } catch (error) {
      console.error('❌ Erro:', error);
      toast.error(`❌ ${error.message}`);
    } finally {
      setExecutando(false);
    }
  };

// 🔥 FUNÇÃO PARA EXECUTAR TARIFAÇÃO COMPLETA (AMBOS MODELOS) - VERSÃO CORRIGIDA
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
    
    // 🔥 ENVIAR AMBOS MODELOS
    const resultado = await executarModelosDuplosBackend(dadosArray);
    
    console.log('✅ RESULTADO DO BACKEND:', {
      success: resultado.success,
      temModeloFreq: !!resultado.modelo_frequencia,
      temModeloSev: !!resultado.modelo_severidade,
      nCoefFreq: resultado.modelo_frequencia?.coeficientesCount,
      nCoefSev: resultado.modelo_severidade?.coeficientesCount,
      // 🔥 VERIFICAR SE TEM RESULTADOS DE TARIFAÇÃO
      temPremios: !!resultado.premios_individualizados,
      temComposicao: !!resultado.composicao_premio
    });
    
    if (resultado.success) {
      setResultados(resultado);
      setEtapaAtual('completo');
      
      // 🔥 CRÍTICO: CORRIGIR O NOME DA FUNÇÃO E ENVIAR O RESULTADO COMPLETO
      if (onResultadoModelo && typeof onResultadoModelo === 'function') {
        console.log('📤 AjusteModelos: Enviando RESULTADO COMPLETO para componente pai...');
        
        // 🔥 ESTRUTURA COMPLETA PARA O DASHBOARD
        const resultadoParaDashboard = {
          nome: "Tarifação Científica - Modelo Duplo",
          tipo: "glm_actuarial_duplo",
          dados: resultado, // 🔥 ENVIA O RESULTADO COMPLETO
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
          // 🔥 MÉTRICAS DE TARIFAÇÃO (NÃO SÓ DOS MODELOS)
          metrics: {
            // Métricas dos modelos
            aic_frequencia: resultado.modelo_frequencia?.metrics?.aic,
            aic_severidade: resultado.modelo_severidade?.metrics?.aic,
            pseudo_r2_frequencia: resultado.modelo_frequencia?.metrics?.pseudo_r2,
            pseudo_r2_severidade: resultado.modelo_severidade?.metrics?.pseudo_r2,
            
            // 🔥 MÉTRICAS DE TARIFAÇÃO (SE EXISTIREM)
            premio_puro_medio: resultado.estatisticas?.premio_puro_medio,
            premio_total_medio: resultado.estatisticas?.premio_total_medio,
            lambda_medio: resultado.estatisticas?.lambda_medio,
            mu_medio: resultado.estatisticas?.mu_medio,
            
            // Informações do resultado
            n_premios: resultado.premios_individualizados?.length || 0,
            n_coeficientes: (resultado.modelo_frequencia?.coeficientesCount || 0) + 
                           (resultado.modelo_severidade?.coeficientesCount || 0)
          },
          // 🔥 DADOS ADICIONAIS PARA VISUALIZAÇÃO
          visualizacao: {
            tipo: "duplo",
            tem_graficos: !!resultado.graficos,
            tem_premios: !!resultado.premios_individualizados,
            tem_composicao: !!resultado.composicao_premio
          }
        };
        
        // 🔥 CHAMAR A FUNÇÃO CORRETA: onResultadoModelo (SEM S)
        onResultadoModelo(resultadoParaDashboard);
        
        // 🔥 Adicionar ao histórico
        if (actuarialStorage && typeof actuarialStorage.adicionarAoHistorico === 'function') {
          actuarialStorage.adicionarAoHistorico({
            tipo: 'a_priori',
            nome: 'Tarifação Científica',
            modelos: ['frequencia', 'severidade'],
            resultado: resultado, // 🔥 GUARDA O RESULTADO COMPLETO
            timestamp: resultado.timestamp || new Date().toISOString()
          });
        }
      } else {
        console.warn('⚠️ AjusteModelos: onResultadoModelo não disponível ou não é função');
      }
      
      toast.success(
        <div>
          <p className="font-medium">✅ Tarifação completa executada!</p>
          <p className="text-sm mt-1">
            {resultado.modelo_frequencia?.coeficientesCount + resultado.modelo_severidade?.coeficientesCount} 
            coeficientes ajustados e disponíveis para outras análises
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

// 🔥 FUNÇÃO ALTERNATIVA PARA ENVIAR RESULTADOS COMPLETOS - VERSÃO CORRIGIDA
const onModelosAjustados = (resultadosCompletos) => {
  if (onResultadoModelo && typeof onResultadoModelo === 'function') {
    console.log('📤 AjusteModelos (alternativo): Enviando resultados completos...');
    
    // 🔥 ESTRUTURA PARA O DASHBOARD
    const resultadoFormatado = {
      nome: "Ajuste de Modelos Atuariais",
      tipo: "glm_actuarial",
      dados: resultadosCompletos,
      parametros: {
        modelo_frequencia: {
          familia: resultadosCompletos.modelo_frequencia?.familia,
          resposta: configFrequencia.resp_frequencia,
          preditores: configFrequencia.vars_freq
        },
        modelo_severidade: {
          familia: resultadosCompletos.modelo_severidade?.familia,
          resposta: configSeveridade.resp_severidade,
          preditores: configSeveridade.vars_sev
        }
      },
      classificacao: "ALTA",
      timestamp: new Date().toISOString(),
      metrics: {
        n_coeficientes: (resultadosCompletos.modelo_frequencia?.coeficientesCount || 0) + 
                       (resultadosCompletos.modelo_severidade?.coeficientesCount || 0),
        convergiu_frequencia: resultadosCompletos.modelo_frequencia?.convergiu,
        convergiu_severidade: resultadosCompletos.modelo_severidade?.convergiu
      }
    };
    
    onResultadoModelo(resultadoFormatado);
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
    setModelosAjustados({ frequencia: null, severidade: null });
    setEtapaAtual('inicial');
  };

  // 🔥 FUNÇÃO PARA VOLTAR À ABA PRINCIPAL
  const voltarAtuarialSeguros = () => {
    if (onVoltar) {
      onVoltar();
    } else {
      console.log('❌ onVoltar não definido');
      toast.warning('Função de voltar não disponível');
    }
  };

  // 🔥 Funções para exportar resultados
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
        - Coeficientes: ${resultados.modelo_frequencia?.coeficientesCount + resultados.modelo_severidade?.coeficientesCount}
        - AIC Total: ${(resultados.modelo_frequencia?.metricas?.aic || 0) + (resultados.modelo_severidade?.metricas?.aic || 0)}
        - Acurácia: ${resultados.modelo_frequencia?.metricas?.acuracia || 'N/A'}`;
      
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
        {/* Botão para voltar à aba principal - NOVO */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={voltarAtuarialSeguros}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Atuarial Seguros
          </Button>
          
          {/* Botões de ação para resultados */}
          <div className="flex items-center gap-2 ml-auto">
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
              
              {/* Botão de voltar - NOVO */}
              <Button
                variant="ghost"
                onClick={voltarAtuarialSeguros}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
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
                  <div className="text-sm text-gray-600 mt-1">
                    {onVoltar ? (
                      <button 
                        onClick={voltarAtuarialSeguros}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Clique para voltar à seleção de análises
                      </button>
                    ) : (
                      'Voltar para seleção de análises'
                    )}
                  </div>
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
              
              {/* 🔥 Informação de integração */}
              {onResultadoModelo && (
                <div className="mt-3 p-2 bg-blue-100 rounded text-blue-800 text-sm">
                  <span className="font-medium">🔄 Integração ativa:</span> Os modelos ajustados serão enviados ao sistema principal.
                </div>
              )}
              
              {/* Botão de cancelar/voltar */}
              {etapaAtual !== 'inicial' && (
                <div className="mt-4 pt-3 border-t border-blue-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={voltarAtuarialSeguros}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Cancelar e voltar para seleção de análises
                  </Button>
                </div>
              )}
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
                            {onResultadoModelo && (
                              <p className="text-blue-700 text-xs mt-2">
                                ⚡ Resultados serão integrados automaticamente
                              </p>
                            )}
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
                      
                      {/* Botão de cancelar */}
                      <div className="mt-4">
                        <Button
                          variant="ghost"
                          onClick={voltarAtuarialSeguros}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Cancelar e voltar para seleção de análises
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
          
          {/* Botão para voltar - NOVO */}
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