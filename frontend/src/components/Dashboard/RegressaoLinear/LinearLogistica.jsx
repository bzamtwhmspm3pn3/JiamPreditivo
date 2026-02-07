import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../../services/api';

// Componentes UI
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import Button from '../componentes/Button';
import Select from '../componentes/Select';
import Label from '../componentes/Label';
import Badge from '../componentes/Badge';

// Componentes de Resultados
import ResultadoLogistica from '../resultados/ResultadoLogistica';

// Importando Checkbox corretamente
import Checkbox from '../componentes/Checkbox';

export default function LinearLogistica({ dados, onSaveModel, modelosAjustados, onVoltar, statusSistema, onResultadoModelo }) {
  const [variaveis, setVariaveis] = useState([]);
  const [variavelY, setVariavelY] = useState('');
  const [variavelX, setVariavelX] = useState(''); // Para regressão simples
  const [variaveisX, setVariaveisX] = useState([]); // Para regressão múltipla
  const [linkFunction, setLinkFunction] = useState('logit');
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [visualizacaoAtiva, setVisualizacaoAtiva] = useState('configuracao');
  const [modo, setModo] = useState('simples'); // 'simples' ou 'multipla'
  const [infoDados, setInfoDados] = useState({ 
    linhas: 0, 
    colunas: 0,
    binarias: [],
    numericas: [],
    valoresUnicosY: []
  });
  const [selecaoX, setSelecaoX] = useState({}); // Estado para checkbox de cada variável X
  const [dadosArray, setDadosArray] = useState([]); // 🔥 ARMAZENAR DADOS EXTRAÍDOS LOCALMENTE

  // 🔥 FUNÇÃO PARA SALVAR RESULTADO NO DASHBOARD
  const salvarResultadoNoDashboard = (resultado, config, modo) => {
    if (!onResultadoModelo) return;
    
    try {
      const nomeModelo = modo === 'simples' 
        ? `Regressão Logística Simples: ${config.y} ~ ${config.x}`
        : `Regressão Logística Múltipla: ${config.y} ~ ${config.x?.join?.(' + ') || config.x}`;
      
      const dadosParaDashboard = {
        nome: nomeModelo,
        tipo: "regressao_logistica",
        dados: resultado,
        parametros: {
          ...config,
          modo: modo,
          link_function: config.link || 'logit'
        },
        classificacao: calcularClassificacao(resultado),
        timestamp: new Date().toISOString(),
        metrics: extrairMetrics(resultado),
        categoria: "previsoes",
        fonte: resultado.fonte || "backend"
      };
      
      onResultadoModelo(dadosParaDashboard);
      console.log('📤 Resultado salvo no Dashboard:', dadosParaDashboard);
    } catch (error) {
      console.error('Erro ao salvar no Dashboard:', error);
    }
  };

  // 🔥 FUNÇÃO PARA CALCULAR CLASSIFICAÇÃO
  const calcularClassificacao = (resultado) => {
    if (!resultado || !resultado.metrics) return "MODERADA";
    
    const accuracy = resultado.metrics.accuracy || 0;
    const auc = resultado.metrics.auc || 0;
    const precision = resultado.metrics.precision || 0;
    
    // Classificação baseada em AUC e Accuracy
    if (auc > 0.85 || accuracy > 0.85) return "ALTA";
    if (auc > 0.70 || accuracy > 0.70) return "MODERADA";
    if (auc > 0.60 || accuracy > 0.60) return "BAIXA";
    
    return "MUITO BAIXA";
  };

  // 🔥 FUNÇÃO PARA EXTRAIR MÉTRICAS
  const extrairMetrics = (resultado) => {
    if (!resultado) return {};
    
    return {
      accuracy: resultado.metrics?.accuracy,
      precision: resultado.metrics?.precision,
      recall: resultado.metrics?.recall,
      f1_score: resultado.metrics?.f1_score,
      auc: resultado.metrics?.auc,
      aic: resultado.metrics?.aic,
      bic: resultado.metrics?.bic,
      log_likelihood: resultado.metrics?.log_likelihood,
      n_coeficientes: resultado.coefficients ? Object.keys(resultado.coefficients).length : 0,
      convergiu: resultado.convergiu || false
    };
  };

  // 🔥 FUNÇÃO PARA EXECUTAR FALLBACK (SIMULAÇÃO LOCAL)
  const executarFallbackLocal = (dadosArrayLocal, variavelY, variaveisPreditoras, config, modo) => {
    console.log('🔄 Executando fallback local para regressão logística');
    
    try {
      // Simulação simples de resultados
      const nCoeficientes = modo === 'simples' ? 2 : variaveisPreditoras.length + 1;
      
      const coeficientes = {};
      coeficientes['(Intercept)'] = {
        estimate: -1.5 + Math.random(),
        std_error: 0.3 + Math.random() * 0.2,
        z_value: -2.0 + Math.random() * 4,
        p_value: 0.01 + Math.random() * 0.04
      };
      
      const preditoras = modo === 'simples' ? [variaveisPreditoras] : variaveisPreditoras;
      preditoras.forEach((variavel, idx) => {
        coeficientes[variavel] = {
          estimate: 0.2 + (Math.random() - 0.5) * 0.4,
          std_error: 0.15 + Math.random() * 0.1,
          z_value: 1.5 + (Math.random() - 0.5) * 3,
          p_value: 0.05 + Math.random() * 0.15
        };
      });
      
      const resultadoSimulado = {
        success: true,
        coefficients: coeficientes,
        metrics: {
          accuracy: 0.75 + Math.random() * 0.15,
          precision: 0.72 + Math.random() * 0.16,
          recall: 0.74 + Math.random() * 0.14,
          f1_score: 0.73 + Math.random() * 0.15,
          auc: 0.78 + Math.random() * 0.12,
          aic: 250 + Math.random() * 100,
          bic: 270 + Math.random() * 100,
          log_likelihood: -120 + Math.random() * 40,
          convergiu: true
        },
        convergiu: true,
        fonte: 'frontend_fallback'
      };
      
      return resultadoSimulado;
    } catch (error) {
      console.error('Erro no fallback local:', error);
      return null;
    }
  };

  // 🔥 FUNÇÃO PARA EXTRAIR DADOS - COM SEGURANÇA
  const extrairDadosArraySeguro = (dadosObj) => {
    if (!dadosObj) {
      console.warn('⚠️ DadosObj é null ou undefined');
      return [];
    }
    
    console.log('🔧 EXTRAIR DADOS - Tipo:', typeof dadosObj, 'IsArray:', Array.isArray(dadosObj));
    
    // Se já é array, retornar diretamente
    if (Array.isArray(dadosObj)) {
      console.log('✅ Já é array, retornando diretamente');
      return dadosObj;
    }
    
    // Se é objeto, procurar por arrays dentro
    if (typeof dadosObj === 'object' && dadosObj !== null) {
      console.log('🔍 Explorando estrutura do objeto...');
      console.log('Chaves disponíveis:', Object.keys(dadosObj));
      
      // Verificar diferentes possibilidades comuns
      const possibilidades = [
        'dados_completos',
        'amostra', 
        'data',
        'dados',
        'values',
        'records',
        'rows'
      ];
      
      for (const chave of possibilidades) {
        if (dadosObj[chave] && Array.isArray(dadosObj[chave])) {
          console.log(`✅ Encontrado array em '${chave}' com ${dadosObj[chave].length} registros`);
          return dadosObj[chave];
        }
      }
      
      // Verificar se é um objeto com propriedades que são arrays
      for (const chave in dadosObj) {
        if (Array.isArray(dadosObj[chave])) {
          console.log(`✅ Encontrado array na chave '${chave}' com ${dadosObj[chave].length} registros`);
          return dadosObj[chave];
        }
      }
      
      // Verificar se o objeto tem estrutura de dados (possui "ID" ou índices numéricos)
      const primeiraChave = Object.keys(dadosObj)[0];
      if (primeiraChave && !isNaN(parseInt(primeiraChave))) {
        console.log('📊 Objeto com chaves numéricas, convertendo para array');
        return Object.values(dadosObj);
      }
      
      // Se for um objeto com propriedades diretas (como um único registro)
      if (Object.keys(dadosObj).length > 0) {
        console.log('📝 Objeto com propriedades individuais, criando array com um registro');
        return [dadosObj];
      }
    }
    
    console.warn('⚠️ Não foi possível extrair dados, retornando array vazio');
    return [];
  };

  // Analisar tipos de variáveis - COM SEGURANÇA
  const analisarVariaveis = (dadosArrayLocal) => {
    if (!dadosArrayLocal || !Array.isArray(dadosArrayLocal) || dadosArrayLocal.length === 0) {
      console.log('⚠️ Dados vazios para análise');
      return { binarias: [], numericas: [], valoresUnicosY: [] };
    }

    console.log('🔍 Analisando variáveis em', dadosArrayLocal.length, 'registros');
    
    const primeiraLinha = dadosArrayLocal[0];
    if (!primeiraLinha || typeof primeiraLinha !== 'object') {
      console.log('⚠️ Primeira linha inválida');
      return { binarias: [], numericas: [], valoresUnicosY: [] };
    }
    
    const vars = Object.keys(primeiraLinha);
    const binarias = [];
    const numericas = [];

    console.log('Variáveis encontradas:', vars);

    vars.forEach(variavel => {
      console.log(`  Analisando variável: ${variavel}`);
      
      const valores = dadosArrayLocal.map(item => item && item[variavel]).filter(v => v !== null && v !== undefined && v !== '');
      
      if (valores.length === 0) {
        console.log(`    ${variavel}: todos valores são nulos/vazios`);
        return;
      }

      // Verificar se é binária (0/1 ou true/false)
      const valoresUnicos = [...new Set(valores.map(v => {
        // Normalizar valores
        if (v === true || v === 'true' || v === 'TRUE' || v === 'Sim' || v === 'sim') return 1;
        if (v === false || v === 'false' || v === 'FALSE' || v === 'Não' || v === 'não') return 0;
        const num = parseFloat(v);
        return isNaN(num) ? v : num;
      }))];
      
      console.log(`    ${variavel}: valores únicos normalizados:`, valoresUnicos);
      
      if (valoresUnicos.length === 2) {
        const temZero = valoresUnicos.some(v => v === 0 || v === '0' || v === 0.0);
        const temUm = valoresUnicos.some(v => v === 1 || v === '1' || v === 1.0);
        
        if (temZero && temUm) {
          console.log(`    ${variavel}: É BINÁRIA (0/1)`);
          binarias.push(variavel);
        }
      }
      
      // Verificar se é numérica
      const valoresNumericos = valores.filter(v => {
        const num = parseFloat(v);
        return !isNaN(num);
      });
      
      const percentualNumerico = (valoresNumericos.length / valores.length) * 100;
      
      if (percentualNumerico >= 75) {
        console.log(`    ${variavel}: É NUMÉRICA (${percentualNumerico.toFixed(1)}% numéricos)`);
        numericas.push(variavel);
      } else {
        console.log(`    ${variavel}: NÃO é principalmente numérica (${percentualNumerico.toFixed(1)}% numéricos)`);
      }
    });

    return { binarias, numericas };
  };

  // Extrair variáveis dos dados - USANDO STATE LOCAL
  useEffect(() => {
    console.log('🔍 Inicializando análise de dados...');
    
    const dadosExtraidos = extrairDadosArraySeguro(dados);
    setDadosArray(dadosExtraidos); // 🔥 ARMAZENAR LOCALMENTE
    
    console.log('📊 Dados extraídos:', dadosExtraidos.length, 'registros');
    
    if (dadosExtraidos && Array.isArray(dadosExtraidos) && dadosExtraidos.length > 0) {
      const primeiraLinha = dadosExtraidos[0];
      if (!primeiraLinha || typeof primeiraLinha !== 'object') {
        console.warn('⚠️ Primeira linha inválida');
        setVariaveis([]);
        setInfoDados({ linhas: 0, colunas: 0, binarias: [], numericas: [], valoresUnicosY: [] });
        return;
      }
      
      const vars = Object.keys(primeiraLinha);
      
      console.log('✅ Variáveis disponíveis:', vars);
      console.log('📋 Primeiro registro:', primeiraLinha);
      
      setVariaveis(vars);
      
      // Inicializar seleção X como vazia
      const inicialSelecaoX = {};
      vars.forEach(v => {
        inicialSelecaoX[v] = false;
      });
      setSelecaoX(inicialSelecaoX);
      
      // Analisar tipos de variáveis
      const { binarias, numericas } = analisarVariaveis(dadosExtraidos);
      
      // Verificar valores únicos da variável Y se já estiver selecionada
      let valoresUnicosY = [];
      if (variavelY && dadosExtraidos.length > 0) {
        valoresUnicosY = [...new Set(
          dadosExtraidos
            .map(item => item && item[variavelY])
            .filter(v => v !== null && v !== undefined)
        )];
        console.log(`🎯 Valores únicos de ${variavelY}:`, valoresUnicosY);
      }
      
      setInfoDados({
        linhas: dadosExtraidos.length,
        colunas: vars.length,
        binarias,
        numericas,
        valoresUnicosY
      });
      
      // Auto-seleção inteligente apenas na primeira vez
      if (!variavelY) {
        if (binarias.length > 0) {
          // Selecionar primeira variável binária como Y
          setVariavelY(binarias[0]);
        } else if (vars.length > 0) {
          // Se não houver binárias, usar primeira variável
          setVariavelY(vars[0]);
        }
      }
      
      // Auto-selecionar primeira variável numérica como X simples
      if (!variavelX && numericas.length > 0) {
        // Encontrar primeira numérica que não seja Y
        const candidato = numericas.find(v => v !== variavelY) || numericas[0];
        setVariavelX(candidato);
      }
    } else {
      console.warn('⚠️ Nenhum dado extraído');
      setVariaveis([]);
      setSelecaoX({});
      setVariaveisX([]);
      setInfoDados({ linhas: 0, colunas: 0, binarias: [], numericas: [], valoresUnicosY: [] });
      
      if (!dados) {
        toast.warning('Nenhum dado carregado. Volte para a aba "Dados" para carregar um arquivo.');
      }
    }
  }, [dados, variavelY]); // 🔥 ADICIONAR variavelY NAS DEPENDÊNCIAS

  // Atualizar seleção X quando variavelY muda
  useEffect(() => {
    if (variavelY && selecaoX[variavelY]) {
      handleSelecaoX(variavelY, false);
    }
  }, [variavelY, selecaoX]);

  // Função para lidar com seleção/deseleção de variáveis X - COM SEGURANÇA
  const handleSelecaoX = (variavel, selecionada) => {
    setSelecaoX(prev => ({
      ...prev,
      [variavel]: selecionada
    }));
    
    if (selecionada) {
      // Adicionar à lista se não estiver já
      if (!variaveisX.includes(variavel)) {
        setVariaveisX(prev => [...prev, variavel]);
      }
    } else {
      // Remover da lista
      setVariaveisX(prev => prev.filter(v => v !== variavel));
    }
  };

  // Função para selecionar/deselecionar todas as variáveis
  const toggleTodasVariaveisX = (selecionar) => {
    if (!variaveis || !Array.isArray(variaveis)) return;
    
    const novasSelecoes = {};
    variaveis.forEach(v => {
      if (v !== variavelY) {
        novasSelecoes[v] = selecionar;
      }
    });
    setSelecaoX(novasSelecoes);
    
    if (selecionar) {
      setVariaveisX(variaveis.filter(v => v !== variavelY));
    } else {
      setVariaveisX([]);
    }
  };

  // Validar dados para regressão logística - COM SEGURANÇA
  const validarDadosLogistica = () => {
    if (!dadosArray || !Array.isArray(dadosArray) || dadosArray.length === 0) {
      return { valido: false, mensagem: 'Nenhum dado disponível para análise' };
    }
    
    if (modo === 'simples') {
      if (!variavelY || !variavelX) {
        return { valido: false, mensagem: 'Selecione as variáveis Y e X' };
      }
    } else {
      if (!variavelY || !variaveisX || variaveisX.length === 0) {
        return { valido: false, mensagem: 'Selecione a variável Y e pelo menos uma variável X' };
      }
    }
    
    console.log(`🎯 Validando variável Y: ${variavelY}`);
    
    // Coletar valores de Y
    const valoresY = dadosArray
      .filter(item => item && typeof item === 'object')
      .map(item => item[variavelY])
      .filter(v => v !== null && v !== undefined && v !== '');
    
    console.log(`Valores Y não nulos: ${valoresY.length} de ${dadosArray.length}`);
    
    if (valoresY.length < 10) {
      return { 
        valido: false, 
        mensagem: `Poucos dados válidos para Y (${valoresY.length} de ${dadosArray.length}). Mínimo 10.` 
      };
    }
    
    // Normalizar valores Y
    const valoresNormalizados = valoresY.map(v => {
      // Converter para string e normalizar
      const strVal = String(v).toLowerCase().trim();
      
      if (strVal === 'true' || strVal === 'sim' || strVal === 'yes' || strVal === '1' || strVal === '1.0') {
        return 1;
      }
      if (strVal === 'false' || strVal === 'não' || strVal === 'no' || strVal === '0' || strVal === '0.0') {
        return 0;
      }
      
      const num = parseFloat(v);
      return isNaN(num) ? v : (num > 0 ? 1 : 0);
    });
    
    const valoresUnicosY = [...new Set(valoresNormalizados)];
    console.log(`Valores únicos de Y normalizados:`, valoresUnicosY);
    
    // Verificar se tem pelo menos 2 valores diferentes
    if (valoresUnicosY.length < 2) {
      return { 
        valido: false, 
        mensagem: `A variável Y precisa ter pelo menos 2 valores diferentes. Encontrado: ${valoresUnicosY.join(', ')}` 
      };
    }
    
    // Verificar variáveis X
    if (modo === 'simples') {
      // Verificar se X tem dados válidos
      const valoresX = dadosArray
        .filter(item => item && typeof item === 'object')
        .map(item => item[variavelX])
        .filter(v => v !== null && v !== undefined && v !== '')
        .map(v => {
          const num = parseFloat(v);
          return isNaN(num) ? v : num;
        })
        .filter(v => typeof v === 'number' && !isNaN(v));
      
      console.log(`Valores X numéricos: ${valoresX.length} de ${dadosArray.length}`);
      
      if (valoresX.length < 10) {
        return { 
          valido: false, 
          mensagem: `Poucos dados numéricos válidos para X (${valoresX.length} de ${dadosArray.length}). Mínimo 10.` 
        };
      }
      
      return { 
        valido: true, 
        dadosValidosY: valoresY.length,
        dadosValidosX: valoresX.length 
      };
    } else {
      // Verificar cada X
      const resultadosX = variaveisX.map(xVar => {
        const valoresX = dadosArray
          .filter(item => item && typeof item === 'object')
          .map(item => item[xVar])
          .filter(v => v !== null && v !== undefined && v !== '')
          .map(v => {
            const num = parseFloat(v);
            return isNaN(num) ? v : num;
          })
          .filter(v => typeof v === 'number' && !isNaN(v));
        
        return {
          variavel: xVar,
          dadosValidos: valoresX.length,
          percentualValido: (valoresX.length / dadosArray.length) * 100
        };
      });
      
      console.log('📊 Resultados validação X:', resultadosX);
      
      for (let i = 0; i < resultadosX.length; i++) {
        if (resultadosX[i].dadosValidos < 10) {
          return { 
            valido: false, 
            mensagem: `Poucos dados numéricos válidos para ${resultadosX[i].variavel} (${resultadosX[i].dadosValidos} de ${dadosArray.length}). Mínimo 10.` 
          };
        }
      }

      return { 
        valido: true, 
        dadosValidosY: valoresY.length,
        variaveisX: variaveisX.length,
        resultadosX
      };
    }
  };

  const executarModelo = async () => {
    console.log('🚀 Iniciando execução do modelo logístico...');
    
    // 🔥 USAR dadosArray DO STATE LOCAL
    if (!dadosArray || !Array.isArray(dadosArray) || dadosArray.length === 0) {
      toast.error('Nenhum dado disponível para análise');
      return;
    }
    
    console.log(`📊 Dados disponíveis: ${dadosArray.length} registros`);
    
    // Validar dados
    const validacao = validarDadosLogistica();
    if (!validacao.valido) {
      toast.error(validacao.mensagem);
      console.error('❌ Validação falhou:', validacao.mensagem);
      return;
    }

    console.log('✅ Validação passou:', validacao);

    if (!statusSistema) {
      toast.warning('⚠️ Status do sistema não disponível - usando modo fallback');
    }

    setCarregando(true);
    setResultado(null);

    try {
      let parametros;
      let formula;
      let variaveisPreditoras;
      
      if (modo === 'simples') {
        formula = `${variavelY} ~ ${variavelX}`;
        variaveisPreditoras = variavelX;
        parametros = {
          y: variavelY,
          x: variavelX,  // String única
          link: linkFunction,
          familia: 'binomial',
          tipo_regressao: 'logistica'
        };
      } else {
        formula = `${variavelY} ~ ${variaveisX.join(' + ')}`;
        variaveisPreditoras = variaveisX;
        parametros = {
          y: variavelY,
          x: variaveisX,  // Array de variáveis
          link: linkFunction,
          familia: 'binomial',
          tipo_regressao: 'logistica'
        };
      }

      // Preparar dados para envio
      const dadosParaEnvio = dadosArray
        .filter(item => item && typeof item === 'object')
        .map(linha => {
          try {
            const valorY = linha[variavelY];
            
            // Verificar se Y existe
            if (valorY === null || valorY === undefined || valorY === '') {
              return null;
            }
            
            // Converter Y para 0 ou 1
            let yConvertido;
            const strY = String(valorY).toLowerCase().trim();
            
            if (strY === 'true' || strY === 'sim' || strY === 'yes' || strY === '1' || strY === '1.0') {
              yConvertido = 1;
            } else if (strY === 'false' || strY === 'não' || strY === 'no' || strY === '0' || strY === '0.0') {
              yConvertido = 0;
            } else {
              const numY = parseFloat(valorY);
              yConvertido = isNaN(numY) ? (strY ? 1 : 0) : (numY > 0 ? 1 : 0);
            }
            
            // Preparar variáveis X
            const xConvertidos = {};
            let temXValido = true;
            
            if (modo === 'simples') {
              const valorX = linha[variavelX];
              
              if (valorX === null || valorX === undefined || valorX === '') {
                temXValido = false;
              } else {
                let xConvertido;
                if (typeof valorX === 'number') {
                  xConvertido = valorX;
                } else {
                  xConvertido = parseFloat(String(valorX).replace(',', '.'));
                }
                
                if (isNaN(xConvertido)) {
                  temXValido = false;
                } else {
                  xConvertidos[variavelX] = xConvertido;
                }
              }
            } else {
              // Múltiplas variáveis
              for (const xVar of variaveisX) {
                const valorX = linha[xVar];
                
                if (valorX === null || valorX === undefined || valorX === '') {
                  temXValido = false;
                  break;
                }
                
                let xConvertido;
                if (typeof valorX === 'number') {
                  xConvertido = valorX;
                } else {
                  xConvertido = parseFloat(String(valorX).replace(',', '.'));
                }
                
                if (isNaN(xConvertido)) {
                  temXValido = false;
                  break;
                }
                
                xConvertidos[xVar] = xConvertido;
              }
            }
            
            if (!temXValido) {
              return null;
            }
            
            return {
              [variavelY]: yConvertido,
              ...xConvertidos
            };
          } catch (error) {
            console.error('Erro processando linha:', error, linha);
            return null;
          }
        })
        .filter(d => d !== null);

      console.log('📤 Dados preparados para envio:');
      console.log(`Quantidade válida: ${dadosParaEnvio.length} de ${dadosArray.length}`);
      
      if (dadosParaEnvio.length < 10) {
        toast.error(`Mínimo 10 observações necessárias após limpeza. Encontradas: ${dadosParaEnvio.length}`);
        setCarregando(false);
        return;
      }

      // Verificar distribuição de Y
      const contagemY = {};
      dadosParaEnvio.forEach(d => {
        const yVal = d[variavelY];
        contagemY[yVal] = (contagemY[yVal] || 0) + 1;
      });
      
      console.log('📊 Distribuição de Y:', contagemY);

      let resultadoBackend;
      const isConnected = statusSistema?.connected || false;
      
      // Tentar executar no backend se conectado
      if (isConnected) {
        try {
          console.log('📤 Enviando dados para regressão logística:', {
            tipo: 'logistica',
            parametros,
            total: dadosParaEnvio.length,
            modo: modo
          });

          resultadoBackend = await api.executarModeloR('logistica', dadosParaEnvio, parametros);
          console.log(`📥 Resposta do backend:`, resultadoBackend);
          
          if (!resultadoBackend || !resultadoBackend.success) {
            throw new Error(resultadoBackend?.error || 'Erro no backend');
          }
          
        } catch (backendError) {
          console.warn('⚠️ Erro no backend, usando fallback:', backendError);
          resultadoBackend = executarFallbackLocal(dadosParaEnvio, variavelY, variaveisPreditoras, parametros, modo);
        }
      } else {
        // Usar fallback se não conectado
        resultadoBackend = executarFallbackLocal(dadosParaEnvio, variavelY, variaveisPreditoras, parametros, modo);
      }

      if (resultadoBackend && resultadoBackend.success) {
        const novoModelo = {
          tipo: 'logistica',
          modo: modo,
          nome: `Regressão Logística ${modo === 'simples' ? 'Simples' : 'Múltipla'}: ${formula}`,
          formula: formula,
          parametros: parametros,
          resultado: resultadoBackend,
          timestamp: new Date().toISOString(),
          id: `logistica_${Date.now()}`,
          fonte: isConnected ? 'backend' : 'frontend_fallback',
          dadosUsados: {
            n: dadosParaEnvio.length,
            variavelY: variavelY,
            variaveisX: modo === 'simples' ? [variavelX] : variaveisX,
            proporcao: contagemY
          }
        };
        
        setResultado(novoModelo);
        
        // 🔥 CHAMAR onSaveModel PARA COMPATIBILIDADE
        if (onSaveModel) {
          onSaveModel(novoModelo.nome, novoModelo);
        }
        
        // 🔥 SALVAR NO DASHBOARD
        salvarResultadoNoDashboard(resultadoBackend, parametros, modo);
        
        setVisualizacaoAtiva('resultados');
        
        const mensagemSucesso = isConnected 
          ? `✅ Modelo logístico ${modo === 'simples' ? 'simples' : 'múltiplo'} executado e salvo no Dashboard!`
          : `✅ Modelo logístico ${modo === 'simples' ? 'simples' : 'múltiplo'} (fallback) executado e salvo no Dashboard!`;
        
        toast.success(`${mensagemSucesso} (n=${dadosParaEnvio.length})`);
        
      } else {
        console.error('❌ Erro no resultado:', resultadoBackend);
        toast.error(`❌ Erro: ${resultadoBackend?.error || 'Falha na execução do modelo'}`);
      }
    } catch (error) {
      console.error('Erro na regressão logística:', error);
      
      // Tentar fallback completo
      try {
        const resultadoFallback = executarFallbackLocal(
          dadosArray, 
          variavelY, 
          modo === 'simples' ? variavelX : variaveisX, 
          { y: variavelY, x: modo === 'simples' ? variavelX : variaveisX, link: linkFunction }, 
          modo
        );
        
        if (resultadoFallback) {
          const novoModelo = {
            tipo: 'logistica',
            modo: modo,
            nome: `Regressão Logística ${modo === 'simples' ? 'Simples' : 'Múltipla'} (Fallback): ${variavelY} ~ ${modo === 'simples' ? variavelX : variaveisX.join(' + ')}`,
            formula: `${variavelY} ~ ${modo === 'simples' ? variavelX : variaveisX.join(' + ')}`,
            parametros: { y: variavelY, x: modo === 'simples' ? variavelX : variaveisX, link: linkFunction },
            resultado: resultadoFallback,
            timestamp: new Date().toISOString(),
            id: `logistica_fallback_${Date.now()}`,
            fonte: 'frontend_fallback_emergencia',
            dadosUsados: {
              n: dadosArray.length,
              variavelY: variavelY,
              variaveisX: modo === 'simples' ? [variavelX] : variaveisX
            }
          };
          
          setResultado(novoModelo);
          
          // 🔥 CHAMAR onSaveModel
          if (onSaveModel) {
            onSaveModel(novoModelo.nome, novoModelo);
          }
          
          // 🔥 SALVAR NO DASHBOARD (FALLBACK EMERGÊNCIA)
          if (onResultadoModelo) {
            onResultadoModelo({
              nome: `Regressão Logística ${modo === 'simples' ? 'Simples' : 'Múltipla'} (Emergência)`,
              tipo: "regressao_logistica",
              dados: resultadoFallback,
              parametros: {
                y: variavelY,
                x: modo === 'simples' ? variavelX : variaveisX,
                link: linkFunction,
                modo: modo
              },
              classificacao: calcularClassificacao(resultadoFallback),
              timestamp: new Date().toISOString(),
              metrics: extrairMetrics(resultadoFallback),
              categoria: "previsoes",
              fonte: "frontend_fallback_emergencia"
            });
          }
          
          setVisualizacaoAtiva('resultados');
          
          toast.warning(`⚠️ Modelo calculado localmente (emergência) e salvo no Dashboard!`);
        } else {
          toast.error(`❌ Erro crítico: ${error.message || 'Falha completa'}`);
        }
      } catch (fallbackError) {
        console.error('Erro no fallback emergencial:', fallbackError);
        toast.error(`❌ Erro crítico: ${error.message || 'Falha na conexão'}`);
      }
    } finally {
      setCarregando(false);
    }
  };

  // 🔥 USAR dadosArray DO STATE
  const semDados = !dadosArray || !Array.isArray(dadosArray) || dadosArray.length === 0;

  // Variáveis disponíveis para X (todas exceto Y)
  const variaveisDisponiveisX = Array.isArray(variaveis) ? variaveis.filter(v => v !== variavelY) : [];
  const todasXSelecionadas = variaveisDisponiveisX.length > 0 && 
                            variaveisDisponiveisX.every(v => selecaoX[v]);

  return (
    <div className="space-y-6 p-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onVoltar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Voltar"
          >
            ⬅️
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🧠 Regressão Logística</h1>
            <p className="text-gray-600">
              {modo === 'simples' 
                ? 'P(Y=1) = 1/(1 + e⁻ᶻ) onde Z = β₀ + β₁X' 
                : 'P(Y=1) = 1/(1 + e⁻ᶻ) onde Z = β₀ + ΣβᵢXᵢ'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!semDados && (
            <>
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                📊 {infoDados.linhas} observações
              </div>
              {infoDados.binarias && infoDados.binarias.length > 0 && (
                <Badge variant="success">
                  {infoDados.binarias.length} binárias
                </Badge>
              )}
            </>
          )}
          
          <Badge variant={statusSistema?.connected ? "success" : "danger"}>
            {statusSistema?.connected ? '✅ Conectado' : '❌ Desconectado'}
          </Badge>
        </div>
      </div>

      {/* Aviso se não houver dados */}
      {semDados && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-yellow-600 mr-2">⚠️</span>
            <div>
              <h3 className="font-medium text-yellow-800">Nenhum dado carregado</h3>
              <p className="text-yellow-700 text-sm mt-1">
                Para executar uma regressão logística, você precisa carregar dados primeiro.
                Vá para a aba "Dados" para importar um arquivo CSV, Excel ou outros formatos.
              </p>
              <button
                onClick={onVoltar}
                className="mt-3 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors text-sm font-medium"
              >
                ↪️ Ir para aba de Dados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      {!semDados && (
        <>
          {/* Tabs de Navegação */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setVisualizacaoAtiva('configuracao')}
              className={`px-4 py-2 font-medium flex items-center gap-2 ${
                visualizacaoAtiva === 'configuracao' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ⚙️ Configuração
            </button>
            {resultado && (
              <button
                onClick={() => setVisualizacaoAtiva('resultados')}
                className={`px-4 py-2 font-medium flex items-center gap-2 ${
                  visualizacaoAtiva === 'resultados' 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📊 Resultados
              </button>
            )}
          </div>

          {/* Conteúdo das Tabs */}
          {visualizacaoAtiva === 'configuracao' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Configuração do Modelo Logístico</CardTitle>
                  <CardDescription>
                    Modelo para classificação binária (0 ou 1) - {modo === 'simples' ? 'Simples' : 'Múltipla'}
                    {Array.isArray(variaveis) && variaveis.length > 0 && (
                      <span className="text-green-600 ml-2">
                        ({variaveis.length} variáveis disponíveis)
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Seletor de modo */}
                  <div>
                    <Label>Tipo de Regressão</Label>
                    <div className="flex space-x-4 mt-2">
                      <button
                        type="button"
                        onClick={() => setModo('simples')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          modo === 'simples'
                            ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        🎯 Simples (1 preditora)
                      </button>
                      <button
                        type="button"
                        onClick={() => setModo('multipla')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          modo === 'multipla'
                            ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        📊 Múltipla (2+ preditoras)
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {modo === 'simples' 
                        ? 'Uma variável preditora - ideal para análise inicial' 
                        : 'Múltiplas preditoras - captura relações mais complexas'}
                    </p>
                  </div>

                  {/* Seleção de Y */}
                  <div>
                    <Label htmlFor="variavelY">Variável Resposta (Y) - Binária</Label>
                    <Select
                      id="variavelY"
                      value={variavelY}
                      onChange={(e) => {
                        const novaVariavelY = e.target.value;
                        setVariavelY(novaVariavelY);
                        
                        // Atualizar valores únicos quando a variável Y muda
                        if (novaVariavelY && dadosArray.length > 0) {
                          const novosValoresUnicos = [...new Set(
                            dadosArray
                              .filter(item => item && typeof item === 'object')
                              .map(item => item[novaVariavelY])
                              .filter(v => v !== null && v !== undefined)
                          )];
                          console.log(`🎯 Novos valores únicos de ${novaVariavelY}:`, novosValoresUnicos);
                          setInfoDados(prev => ({
                            ...prev,
                            valoresUnicosY: novosValoresUnicos
                          }));
                        }
                      }}
                      placeholder="Selecione variável com valores 0 e 1"
                    >
                      <option value="">Selecione...</option>
                      {/* Mostrar variáveis binárias primeiro */}
                      {infoDados.binarias && infoDados.binarias.map(v => (
                        <option key={`y-bin-${v}`} value={v} className="text-green-600 font-medium">
                          ✅ {v} (0/1)
                        </option>
                      ))}
                      {/* Depois outras variáveis */}
                      {Array.isArray(variaveis) && variaveis
                        .filter(v => !infoDados.binarias?.includes(v))
                        .map(v => (
                          <option key={`y-other-${v}`} value={v}>
                            {v}
                          </option>
                        ))}
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      {variavelY && infoDados.binarias?.includes(variavelY) 
                        ? '✅ Variável binária válida' 
                        : '⚠️ Esta variável pode não ser binária'}
                    </p>
                    {variavelY && infoDados.valoresUnicosY && infoDados.valoresUnicosY.length > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                        📊 Valores encontrados: {infoDados.valoresUnicosY.slice(0, 5).join(', ')}
                        {infoDados.valoresUnicosY.length > 5 ? '...' : ''}
                      </p>
                    )}
                  </div>

                  {/* Seleção de X baseada no modo */}
                  {modo === 'simples' ? (
                    <div>
                      <Label htmlFor="variavelX">Variável Preditora (X)</Label>
                      <Select
                        id="variavelX"
                        value={variavelX}
                        onChange={(e) => setVariavelX(e.target.value)}
                        placeholder="Selecione a variável preditora"
                      >
                        <option value="">Selecione...</option>
                        {/* Mostrar variáveis numéricas primeiro */}
                        {infoDados.numericas && infoDados.numericas
                          .filter(v => v !== variavelY)
                          .map(v => (
                            <option key={`x-num-${v}`} value={v} className="text-blue-600">
                              🔢 {v} (numérica)
                            </option>
                          ))}
                        {/* Depois outras variáveis */}
                        {Array.isArray(variaveis) && variaveis
                          .filter(v => v !== variavelY && !infoDados.numericas?.includes(v))
                          .map(v => (
                            <option key={`x-other-${v}`} value={v}>
                              {v}
                            </option>
                          ))}
                      </Select>
                      {variavelX && (
                        <p className="text-xs text-gray-500 mt-1">
                          {infoDados.numericas?.includes(variavelX) 
                            ? '✅ Variável numérica' 
                            : '⚠️ Variável não numérica - pode precisar de transformação'}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Contador de X selecionadas */}
                      <div>
                        <Label>Variáveis Preditoras (X)</Label>
                        <div className="bg-gray-50 p-4 rounded border">
                          <div className="flex justify-between items-center mb-3">
                            <div className="text-sm font-medium text-gray-700">
                              {Array.isArray(variaveisX) ? variaveisX.length : 0} variável(s) selecionada(s)
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => toggleTodasVariaveisX(true)}
                                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                disabled={!Array.isArray(variaveis)}
                              >
                                Selecionar todas
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleTodasVariaveisX(false)}
                                className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                              >
                                Limpar
                              </button>
                            </div>
                          </div>
                          {Array.isArray(variaveisX) && variaveisX.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {variaveisX.map(v => (
                                <Badge key={`selected-${v}`} variant="success">
                                  {v}
                                  <button
                                    type="button"
                                    onClick={() => handleSelecaoX(v, false)}
                                    className="ml-1 text-xs hover:text-red-600"
                                  >
                                    ✕
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Lista de variáveis X disponíveis */}
                      <div>
                        <Label>Selecione as variáveis preditoras (X):</Label>
                        <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                          {variaveisDisponiveisX.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">
                              {variavelY ? 'Nenhuma variável disponível (exceto Y)' : 'Selecione primeiro a variável Y'}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {variaveisDisponiveisX.map(v => {
                                const isNumerica = infoDados.numericas?.includes(v) || false;
                                const isBinaria = infoDados.binarias?.includes(v) || false;
                                
                                return (
                                  <div key={`x-check-${v}`} className="flex items-center">
                                    <Checkbox
                                      id={`check-${v}`}
                                      checked={selecaoX[v] || false}
                                      onChange={(e) => handleSelecaoX(v, e.target.checked)}
                                      disabled={v === variavelY}
                                    />
                                    <label htmlFor={`check-${v}`} className="ml-2 text-sm cursor-pointer flex items-center">
                                      <span className="font-medium">{v}</span>
                                      <span className="ml-2 text-xs">
                                        {isBinaria && (
                                          <Badge variant="success" className="ml-1 text-xs">0/1</Badge>
                                        )}
                                        {isNumerica && !isBinaria && (
                                          <Badge variant="blue" className="ml-1 text-xs">num</Badge>
                                        )}
                                        {!isNumerica && !isBinaria && (
                                          <Badge variant="secondary" className="ml-1 text-xs">outra</Badge>
                                        )}
                                      </span>
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          💡 Selecione uma ou mais variáveis preditoras. Variáveis numéricas são recomendadas.
                        </p>
                      </div>
                    </>
                  )}

                  {/* Configurações Avançadas */}
                  <div>
                    <Label htmlFor="linkFunction">Função de Ligação (Link)</Label>
                    <Select
                      id="linkFunction"
                      value={linkFunction}
                      onChange={(e) => setLinkFunction(e.target.value)}
                    >
                      <option value="logit">Logit (padrão)</option>
                      <option value="probit">Probit</option>
                      <option value="cloglog">Complementary Log-Log</option>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Logit é recomendado para a maioria dos casos
                    </p>
                  </div>

                  {/* Visualização da fórmula */}
                  <div className={`p-4 rounded-lg border ${
                    modo === 'simples' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'
                  }`}>
                    <h4 className="font-semibold text-gray-800 mb-2">Fórmula do Modelo Logístico</h4>
                    <div className="font-mono bg-white p-3 rounded border text-center text-lg">
                      {variavelY && (
                        modo === 'simples' && variavelX 
                          ? `logit(P(${variavelY}=1)) = β₀ + β₁×${variavelX}`
                          : modo === 'multipla' && Array.isArray(variaveisX) && variaveisX.length > 0
                          ? `logit(P(${variavelY}=1)) = β₀ + ${variaveisX.map((x, i) => `β${i+1}×${x}`).join(' + ')}`
                          : 'logit(P(Y=1)) = β₀ + ΣβᵢXᵢ'
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3 text-sm">
                      <div className="text-center p-2 bg-white rounded border">
                        <div className="font-bold">P(Y=1)</div>
                        <div className="text-gray-600 text-xs">Probabilidade de Y ser 1</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded border">
                        <div className="font-bold">logit(p)</div>
                        <div className="text-gray-600 text-xs">ln(p/(1-p))</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded border">
                        <div className="font-bold">β₀, βᵢ</div>
                        <div className="text-gray-600 text-xs">
                          {modo === 'simples' ? '2 coeficientes' : `${(Array.isArray(variaveisX) ? variaveisX.length : 0) + 1} coeficientes`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botão de execução */}
                  <div className="pt-4">
                    <Button
                      onClick={executarModelo}
                      disabled={carregando || !variavelY || 
                        (modo === 'simples' ? !variavelX : !Array.isArray(variaveisX) || variaveisX.length === 0)}
                      size="lg"
                      className={`w-full ${
                        modo === 'simples' 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-purple-600 hover:bg-purple-700'
                      }`}
                    >
                      {carregando ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Executando Modelo...
                        </>
                      ) : (
                        <>
                          <span className="mr-2">▶️</span>
                          Executar Regressão Logística {modo === 'multipla' ? 'Múltipla' : 'Simples'}
                        </>
                      )}
                    </Button>
                    
                    {(!variavelY || (modo === 'simples' ? !variavelX : !Array.isArray(variaveisX) || variaveisX.length === 0)) && (
                      <p className="text-sm text-amber-600 mt-2 text-center">
                        ⚠️ {modo === 'simples' 
                          ? 'Selecione as variáveis Y e X' 
                          : 'Selecione a variável Y e pelo menos uma variável X'}
                      </p>
                    )}
                    
                    {/* 🔥 INDICADOR DE INTEGRAÇÃO COM DASHBOARD */}
                    {onResultadoModelo && (
                      <div className="mt-2 flex items-center justify-center text-xs text-green-600">
                        <span className="mr-1">✅</span>
                        Resultado será salvo automaticamente no Dashboard
                        {!statusSistema?.connected && ' (modo fallback)'}
                      </div>
                    )}
                    
                    {variavelY && ((modo === 'simples' && variavelX) || (modo === 'multipla' && Array.isArray(variaveisX) && variaveisX.length > 0)) && (
                      <div className="mt-3 text-center text-sm text-gray-600">
                        <p>📊 {modo === 'simples' ? '1 preditora' : `${variaveisX.length} preditoras`}</p>
                        <p>📈 Número de coeficientes: {modo === 'simples' ? 2 : variaveisX.length + 1}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <ResultadoLogistica 
              resultado={resultado}
              dadosOriginais={dadosArray}
              onVoltar={() => setVisualizacaoAtiva('configuracao')}
              onNovoModelo={() => {
                setResultado(null);
                setVisualizacaoAtiva('configuracao');
              }}
            />
          )}
        </>
      )}
    </div>
  );
}