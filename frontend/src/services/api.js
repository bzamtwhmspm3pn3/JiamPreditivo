// src/services/api.js
import axios from 'axios';

class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    this.axios = axios.create({
      baseURL: this.baseURL,
      timeout: 120000, // 2 minutos
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================

  handleError(error) {
    if (error.response) {
      return {
        message: error.response.data?.error || 'Erro na API',
        details: error.response.data?.details || error.response.data?.message,
        status: error.response.status,
        isApiError: true,
        recommendations: error.response.data?.recommendations || this.getDefaultRecommendations(error)
      };
    } else if (error.request) {
      return {
        message: 'Não foi possível conectar ao servidor',
        details: 'Verifique se o servidor backend está rodando em ' + this.baseURL,
        isNetworkError: true,
        recommendations: [
          'Verifique a conexão de internet',
          'Confirme se o servidor backend está rodando',
          'Tente novamente em alguns instantes'
        ]
      };
    } else {
      return {
        message: 'Erro na configuração da requisição',
        details: error.message,
        isConfigError: true,
        recommendations: [
          'Verifique os dados enviados',
          'Confira os parâmetros do modelo',
          'Consulte a documentação para requisitos específicos'
        ]
      };
    }
  }

  getDefaultRecommendations(error) {
    const errorMsg = error.message || '';
    
    if (errorMsg.includes('tempo limite') || errorMsg.includes('timeout')) {
      return [
        'Reduza o tamanho dos dados',
        'Diminua o número de simulações',
        'Use uma amostra menor dos dados'
      ];
    }
    
    if (errorMsg.includes('observações') || errorMsg.includes('mínimo')) {
      return [
        'Aumente o número de observações',
        'Verifique se os dados não estão vazios',
        'Confira se todas as variáveis necessárias estão presentes'
      ];
    }
    
    return [
      'Verifique os dados de entrada',
      'Confirme os parâmetros do modelo',
      'Consulte a documentação para requisitos específicos'
    ];
  }

  findVariableByPattern(row, patterns) {
    if (!row) return null;
    const keys = Object.keys(row);
    for (const pattern of patterns) {
      const found = keys.find(key => 
        key.toLowerCase().includes(pattern.toLowerCase())
      );
      if (found) return found;
    }
    return keys[0];
  }

  // ============================================================================
  // STATUS E CONEXÃO
  // ============================================================================

  async getStatus() {
    try {
      const response = await this.axios.get('/health');
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      throw this.handleError(error);
    }
  }

  async getRStatus() {
    try {
      const response = await this.axios.get('/r/status');
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar status R:', error);
      return { success: false, connected: false, error: error.message };
    }
  }

  async testConnection() {
    try {
      const [status, rStatus] = await Promise.all([
        this.getStatus().catch(() => ({ success: false })),
        this.getRStatus().catch(() => ({ success: false }))
      ]);
      
      return {
        connected: !!(status.success || rStatus.success),
        backend: status.success || false,
        rSystem: rStatus.success || false,
        message: (status.success || rStatus.success) ? 'Conectado' : 'Modo demonstração',
        version: status.version,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        connected: false,
        backend: false,
        rSystem: false,
        message: 'Modo demonstração',
        timestamp: new Date().toISOString()
      };
    }
  }

  // ============================================================================
  // MODELOS DISPONÍVEIS
  // ============================================================================

  async getModelosDisponiveis() {
    try {
      const response = await this.axios.get('/r/modelos/disponiveis');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter modelos:', error);
      // Fallback COMPLETO incluindo todos os modelos
      return {
        success: true,
        modelos: [
          // Regressão
          { id: 'glm', nome: 'Regressão Linear (GLM)', descricao: 'Modelo linear generalizado', categoria: 'regressao' },
          { id: 'logistica', nome: 'Regressão Logística', descricao: 'Modelo para classificação binária', categoria: 'regressao' },
          { id: 'multiple', nome: 'Regressão Linear Múltipla', descricao: 'Regressão com múltiplas variáveis', categoria: 'regressao' },
          
          // Séries Temporais
          { id: 'arima', nome: 'ARIMA', descricao: 'Modelo de séries temporais', categoria: 'series_temporais' },
          { id: 'sarima', nome: 'SARIMA', descricao: 'ARIMA sazonal', categoria: 'series_temporais' },
          { id: 'ets', nome: 'ETS', descricao: 'Suavização exponencial', categoria: 'series_temporais' },
          { id: 'prophet', nome: 'Prophet', descricao: 'Modelo Facebook para séries temporais', categoria: 'series_temporais' },
          
          // Machine Learning
          { id: 'random_forest', nome: 'Random Forest', descricao: 'Floresta aleatória', categoria: 'machine_learning' },
          { id: 'xgboost', nome: 'XGBoost', descricao: 'Gradient boosting extremo', categoria: 'machine_learning' },
          
          // Modelos Atuariais
          { id: 'monte_carlo', nome: 'Simulação Monte Carlo', descricao: 'Simulação de risco atuarial', categoria: 'atuaria' },
          { id: 'markov', nome: 'Cadeias de Markov', descricao: 'Análise de transição de estados', categoria: 'atuaria' },
          { id: 'mortality_table', nome: 'Tábua de Mortalidade', descricao: 'Criação de tábuas de mortalidade', categoria: 'atuaria' },
          { id: 'a_priori', nome: 'Tarifação A Priori', descricao: 'Cálculo de prêmios base', categoria: 'atuaria' },
          { id: 'a_posteriori', nome: 'Credibilidade A Posteriori', descricao: 'Teoria da credibilidade', categoria: 'atuaria' },
          
          // BitData / Data Mining
          { id: 'bitdata', nome: 'BitData Mining', descricao: 'Análise de padrões e correlações', categoria: 'bitdata' },
          { id: 'apriori', nome: 'Apriori', descricao: 'Regras de associação', categoria: 'bitdata' },
          { id: 'fp_growth', nome: 'FP-Growth', descricao: 'Minerador frequente', categoria: 'bitdata' },
          { id: 'kmeans', nome: 'K-Means', descricao: 'Clusterização', categoria: 'bitdata' },
          { id: 'hierarchical', nome: 'Cluster Hierárquico', descricao: 'Agrupamento hierárquico', categoria: 'bitdata' },
          { id: 'pca', nome: 'PCA', descricao: 'Análise de componentes principais', categoria: 'bitdata' }
        ]
      };
    }
  }

  async getCategoriasModelos() {
    try {
      const modelos = await this.getModelosDisponiveis();
      if (modelos.success && modelos.modelos) {
        const categorias = [...new Set(modelos.modelos.map(m => m.categoria))];
        return {
          success: true,
          categorias: categorias,
          timestamp: new Date().toISOString()
        };
      }
      return { success: false, categorias: [] };
    } catch (error) {
      return { success: false, categorias: [], error: error.message };
    }
  }

  async getModelosPorCategoria(categoria) {
    try {
      const modelos = await this.getModelosDisponiveis();
      if (modelos.success && modelos.modelos) {
        const filtrados = modelos.modelos.filter(m => m.categoria === categoria);
        return {
          success: true,
          modelos: filtrados,
          categoria: categoria,
          count: filtrados.length,
          timestamp: new Date().toISOString()
        };
      }
      return { success: false, modelos: [] };
    } catch (error) {
      return { success: false, modelos: [], error: error.message };
    }
  }

  async verificarModeloDisponivel(tipo) {
    try {
      const modelos = await this.getModelosDisponiveis();
      if (modelos.success && modelos.modelos) {
        const modelo = modelos.modelos.find(m => m.id === tipo);
        return {
          disponivel: !!modelo,
          modelo: modelo,
          todosModelos: modelos.modelos.map(m => m.id),
          categorias: [...new Set(modelos.modelos.map(m => m.categoria))],
          timestamp: new Date().toISOString()
        };
      }
      return { disponivel: false, error: 'Não foi possível obter lista de modelos' };
    } catch (error) {
      return { disponivel: false, error: error.message };
    }
  }

  // ============================================================================
  // EXECUTOR GENÉRICO
  // ============================================================================

  async executarModeloR(tipo, dados, parametros = {}) {
    try {
      console.log(`📤 Enviando modelo ${tipo} para API:`, { 
        tipo, 
        n_observacoes: dados?.length || 0,
        variaveis: dados?.[0] ? Object.keys(dados[0]) : []
      });

      const payload = { tipo, dados, parametros };
      const response = await this.axios.post('/r/modelos/executar', payload);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao executar modelo ${tipo}:`, error);
      throw this.handleError(error);
    }
  }

  async executarModelo(tipo, dados, parametros = {}) {
    const tipoMap = {
      // Regressão
      'linear': 'glm',
      'logistic': 'logistica',
      'logistica': 'logistica',
      'regressao_logistica': 'logistica',
      'regressao_multipla': 'multiple',
      'multiple': 'multiple',
      
      // Séries Temporais
      'sarima': 'sarima',
      'ets': 'ets',
      
      // Machine Learning
      'forest': 'random_forest',
      'rf': 'random_forest',
      'xgboost': 'xgboost',
      
      // Modelos Atuariais
      'montecarlo': 'monte_carlo',
      'monte_carlo': 'monte_carlo',
      'markov': 'markov',
      'tabua': 'mortality_table',
      'mortality': 'mortality_table',
      'tabua_mortalidade': 'mortality_table',
      'priori': 'a_priori',
      'a_priori': 'a_priori',
      'posteriori': 'a_posteriori',
      'a_posteriori': 'a_posteriori',
      'credibilidade': 'a_posteriori',
      'credibility': 'a_posteriori',
      
      // BitData / Data Mining
      'bitdata': 'bitdata',
      'mining': 'bitdata',
      'data_mining': 'bitdata',
      'apriori': 'apriori',
      'associacao': 'apriori',
      'fp_growth': 'fp_growth',
      'kmeans': 'kmeans',
      'cluster': 'kmeans',
      'hierarchical': 'hierarchical',
      'pca': 'pca',
      'componentes_principais': 'pca'
    };
    
    const tipoFinal = tipoMap[tipo] || tipo;
    return this.executarModeloR(tipoFinal, dados, parametros);
  }

  // ============================================================================
  // PROCESSAMENTO DE DADOS
  // ============================================================================

  async processarDados(dados, operacao, parametros = {}) {
    try {
      const response = await this.axios.post('/r/processamento', {
        dados,
        operacao,
        parametros
      });
      return response.data;
    } catch (error) {
      console.error('Erro no processamento de dados:', error);
      throw this.handleError(error);
    }
  }

  async uploadDados(dados, parametros = {}) {
    try {
      const response = await this.axios.post('/r/dados/upload', { dados, parametros });
      return response.data;
    } catch (error) {
      console.error('Erro no upload de dados:', error);
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // MODELOS DE REGRESSÃO (JÁ FUNCIONAM)
  // ============================================================================

  async executarGLM(dados, parametros) {
    return this.executarModeloR('glm', dados, parametros);
  }

  async executarLogistica(dados, parametros) {
    const paramsPadrao = {
      familia: 'binomial',
      link: 'logit',
      calcular_metricas: true,
      ...parametros
    };
    return this.executarModeloR('logistica', dados, paramsPadrao);
  }

  async executarRegressaoMultipla(dados, parametros) {
    return this.executarModeloR('multiple', dados, parametros);
  }

  // ============================================================================
  // SÉRIES TEMPORAIS (JÁ FUNCIONAM)
  // ============================================================================

  async executarARIMA(dados, parametros) {
    return this.executarModeloR('arima', dados, parametros);
  }

  async executarSARIMA(dados, parametros) {
    return this.executarModeloR('sarima', dados, parametros);
  }

  async executarETS(dados, parametros) {
    return this.executarModeloR('ets', dados, parametros);
  }

  async executarProphet(dados, parametros) {
    return this.executarModeloR('prophet', dados, parametros);
  }

  // ============================================================================
  // MACHINE LEARNING (JÁ FUNCIONAM)
  // ============================================================================

  async executarRandomForest(dados, parametros) {
    return this.executarModeloR('random_forest', dados, parametros);
  }

  async executarXGBoost(dados, parametros) {
    return this.executarModeloR('xgboost', dados, parametros);
  }

  // ============================================================================
  // MODELOS ATUARIAIS (TODOS FUNCIONAIS)
  // ============================================================================

  // ---------- MONTE CARLO ----------
  async executarMonteCarlo(dados, parametros = {}) {
    try {
      console.log('🎲 Executando simulação Monte Carlo...');
      const paramsPadrao = {
        n_sim: 1000,
        vol_freq: 0.2,
        vol_sev: 0.3,
        incluir_correlacao: true,
        ...parametros
      };
      return this.executarModeloR('monte_carlo', dados, paramsPadrao);
    } catch (error) {
      console.error('❌ Erro no Monte Carlo:', error);
      return this.gerarResultadoMonteCarloDemonstracao(parametros);
    }
  }

  gerarResultadoMonteCarloDemonstracao(parametros) {
    return {
      success: true,
      modo_demonstracao: true,
      timestamp: new Date().toISOString(),
      metricas_risco: {
        valor_esperado: 52450,
        var_99: 78200,
        tvar_99: 85600,
        desvio_padrao: 12400,
        prob_ruina: 0.023,
        mediana: 51300,
        coeficiente_variacao: 0.236,
        assimetria: 1.2,
        curtose: 4.5
      },
      estatisticas: {
        perda_maxima: 124500,
        perda_minima: 31200
      },
      parametros_simulacao: {
        n_simulacoes: parametros.n_sim || 1000,
        lambda_base: 2.47,
        mu_base: 21235
      },
      distribuicao: {
        histograma: Array.from({ length: 10 }, (_, i) => ({
          intervalo: `${i*10}-${(i+1)*10}`,
          frequencia: Math.floor(Math.random() * 200) + 50
        }))
      }
    };
  }

  // ---------- CADEIAS DE MARKOV (NOVO) ----------
  async executarMarkov(dados, parametros = {}) {
    try {
      console.log('📊 Executando análise de Markov...');
      
      const sampleRow = dados[0] || {};
      const paramsPadrao = {
        var_analise: parametros.var_analise || this.findVariableByPattern(sampleRow, ['estado', 'categoria', 'classe', 'nivel']),
        n_estados: parametros.n_estados || 3,
        nomes_estados: parametros.nomes_estados || 'Baixo,Médio,Alto',
        metodo: parametros.metodo || 'MLE',
        calcular_prob_estacionaria: parametros.calcular_prob_estacionaria ?? true,
        ...parametros
      };

      const response = await this.executarModeloR('markov', dados, paramsPadrao);
      return response;
    } catch (error) {
      console.error('❌ Erro no Markov:', error);
      return this.gerarResultadoMarkovDemonstracao(parametros);
    }
  }

  gerarResultadoMarkovDemonstracao(parametros) {
    const nEstados = parametros.n_estados || 3;
    const estados = parametros.nomes_estados?.split(',') || ['Baixo', 'Médio', 'Alto'];
    
    // Gerar matriz de transição
    const matrizTransicao = [];
    for (let i = 0; i < nEstados; i++) {
      const linha = [];
      let soma = 0;
      for (let j = 0; j < nEstados - 1; j++) {
        const val = Math.random() * 0.3 + 0.1;
        linha.push(val);
        soma += val;
      }
      linha.push(1 - soma);
      matrizTransicao.push(linha.map(v => parseFloat(v.toFixed(3))));
    }

    return {
      success: true,
      modo_demonstracao: true,
      timestamp: new Date().toISOString(),
      tipo_operacao: 'cadeias_markov',
      
      parametros_usados: parametros,
      estados: estados.slice(0, nEstados),
      n_estados: nEstados,
      
      matriz_transicao: matrizTransicao,
      
      distribuicao_estacionaria: Array.from({ length: nEstados }, (_, i) => 
        parseFloat((0.2 + i * 0.1).toFixed(3))
      ),
      
      metricas: {
        tempo_retorno_medio: [3.2, 4.1, 5.8].slice(0, nEstados),
        probabilidades_acumuladas: [0.25, 0.55, 1.0].slice(0, nEstados),
        eigenvalue_maximo: 1.0,
        taxa_convergencia: 0.15
      },
      
      visualizacao: {
        matriz_calor: matrizTransicao,
        grafico_transicao: estados.slice(0, nEstados).map((e, i) => ({
          estado: e,
          auto: matrizTransicao[i][i],
          saida: 1 - matrizTransicao[i][i]
        }))
      },
      
      recomendacoes: {
        estabilidade: 'Cadeia com boa estabilidade',
        convergencia: 'Convergência rápida para distribuição estacionária',
        aplicacoes: 'Útil para previsão de comportamento de sinistros'
      }
    };
  }

// ---------- TÁBUA DE MORTALIDADE (CORRIGIDO) ----------
async criarTabuaMortalidade(parametros = {}) {
  try {
    console.log('📈 Criando tábua de mortalidade...');
    
    // ✅ ORDEM CORRETA: valores padrão + override
    const paramsPadrao = {
      base_mortalidade: 'BR-EMS2020',
      idade_min: 20,
      idade_max: 100,
      qx_adjust: 1.0,
      sexo: 'unisex',
      l0: 100000,
      ...parametros  // ← parametros sobrescrevem os padrões
    };

    // Dados para enviar (podem ser vazios)
    const dadosParaEnviar = parametros.dados || [];
    
    console.log('📤 Enviando para mortality_table:');
    console.log('   📊 Dados:', dadosParaEnviar.length, 'registros');
    console.log('   ⚙️ Parâmetros:', paramsPadrao);
    
    const response = await this.executarModeloR('mortality_table', dadosParaEnviar, paramsPadrao);
    return response;
  } catch (error) {
    console.error('❌ Erro na tábua de mortalidade:', error);
    return this.gerarResultadoTabuaDemonstracao(parametros);
  }
}

  gerarResultadoTabuaDemonstracao(parametros) {
    const idadeMin = parametros.idade_min || 20;
    const idadeMax = parametros.idade_max || 100;
    const l0 = parametros.l0 || 100000;
    const sexo = parametros.sexo || 'unisex';
    
    const tabua = [];
    let lx = l0;
    
    for (let idade = idadeMin; idade <= idadeMax; idade++) {
      const qx = Math.min(0.001 * Math.exp(0.08 * (idade - 20)), 0.5);
      const dx = Math.round(lx * qx);
      const ex = Math.round(60 - idade * 0.5);
      
      tabua.push({
        idade,
        qx: parseFloat(qx.toFixed(4)),
        lx: Math.round(lx),
        dx,
        ex: Math.max(0, ex)
      });
      
      lx = lx - dx;
      if (lx <= 0) break;
    }

    return {
      success: true,
      modo_demonstracao: true,
      timestamp: new Date().toISOString(),
      tipo_operacao: 'mortality_table',
      
      parametros_usados: parametros,
      base_mortalidade: parametros.base_mortalidade || 'BR-EMS2020',
      sexo: sexo,
      
      tabua: tabua,
      resumo: {
        idade_min: idadeMin,
        idade_max: Math.min(idadeMax, tabua[tabua.length - 1].idade),
        expectativa_vida_nascimento: 72.5,
        expectativa_vida_60: 18.3,
        sobreviventes_60: tabua.find(t => t.idade === 60)?.lx || 89234,
        vida_maxima: tabua[tabua.length - 1].idade
      },
      
      metricas: {
        qx_medio: 0.015,
        probabilidade_sobrevivencia_20_60: 0.85,
        probabilidade_morte_60_80: 0.42
      },
      
      visualizacao: {
        curva_sobrevivencia: tabua.filter((_, i) => i % 5 === 0).map(t => ({
          idade: t.idade,
          lx: t.lx
        })),
        taxa_mortalidade: tabua.filter((_, i) => i % 5 === 0).map(t => ({
          idade: t.idade,
          qx: t.qx * 1000
        }))
      }
    };
  }

  // ---------- TARIFAÇÃO A PRIORI ----------
  async executarTarifacaoAPriori(dados, parametros = {}) {
    try {
      console.log('💰 Executando tarifação a priori...');
      const paramsPadrao = {
        margem_seguranca: 10,
        despesas_admin: 20,
        comissao: 10,
        margem_lucro: 15,
        impostos: 5,
        ...parametros
      };
      return this.executarModeloR('a_priori', dados, paramsPadrao);
    } catch (error) {
      console.error('❌ Erro na tarifação a priori:', error);
      throw this.handleError(error);
    }
  }

  // ---------- CREDIBILIDADE A POSTERIORI (CORRIGIDO) ----------
  async executarCredibilidadeAPosteriori(dados, parametros = {}) {
    try {
      console.log('📊 Executando credibilidade a posteriori...');
      
      const paramsPadrao = {
        grupo_var: parametros.grupo_var || this.findVariableByPattern(dados[0] || {}, ['grupo', 'regiao', 'categoria', 'classe', 'uf']),
        tempo_var: parametros.tempo_var || this.findVariableByPattern(dados[0] || {}, ['ano', 'periodo', 'mes', 'data']),
        sinistro_var: parametros.sinistro_var || this.findVariableByPattern(dados[0] || {}, ['sinistro', 'frequencia', 'n_sinistros']),
        custo_var: parametros.custo_var || this.findVariableByPattern(dados[0] || {}, ['custo', 'valor', 'severidade']),
        metodo: parametros.metodo || 'Bühlmann-Straub',
        z_min: parametros.z_min || 0.3,
        z_max: parametros.z_max || 0.9,
        ...parametros
      };

      const tiposPossiveis = ['a_posteriori', 'credibilidade_actuarial', 'credibility', 'posteriori'];
      
      for (const tipo of tiposPossiveis) {
        try {
          const response = await this.executarModeloR(tipo, dados, paramsPadrao);
          if (response?.success) return response;
        } catch (e) {}
      }
      
      return this.gerarResultadoCredibilidadeDemonstracao(paramsPadrao);
      
    } catch (error) {
      console.error('❌ Erro na credibilidade:', error);
      return this.gerarResultadoCredibilidadeDemonstracao(parametros);
    }
  }

  gerarResultadoCredibilidadeDemonstracao(parametros) {
    const gruposBase = ['Grupo A', 'Grupo B', 'Grupo C', 'Grupo D', 'Grupo E'];
    const premioBase = 50000;
    const resultados = [];
    
    for (let i = 0; i < gruposBase.length; i++) {
      const credibilidade = 0.3 + (i * 0.15);
      const premioEmpirico = premioBase * (0.8 + (i * 0.1));
      const premioPosteriori = credibilidade * premioEmpirico + (1 - credibilidade) * premioBase;
      
      resultados.push({
        grupo: gruposBase[i],
        fator_credibilidade: parseFloat(credibilidade.toFixed(3)),
        premio_empirico_medio: Math.round(premioEmpirico),
        premio_posteriori: Math.round(premioPosteriori),
        ajuste_percentual: parseFloat(((premioPosteriori / premioBase - 1) * 100).toFixed(1)),
        n_anos: 5
      });
    }

    return {
      success: true,
      modo_demonstracao: true,
      timestamp: new Date().toISOString(),
      tipo_operacao: 'credibilidade_a_posteriori',
      metodo_aplicado: parametros.metodo || 'Bühlmann-Straub',
      estatisticas_gerais: {
        premio_global_priori: premioBase,
        premio_medio_posteriori: Math.round(resultados.reduce((a, r) => a + r.premio_posteriori, 0) / resultados.length),
        credibilidade_media: parseFloat(resultados.reduce((a, r) => a + r.fator_credibilidade, 0) / resultados.length),
        ajuste_medio_percentual: parseFloat(resultados.reduce((a, r) => a + r.ajuste_percentual, 0) / resultados.length),
        n_grupos: resultados.length,
        grupos_com_ajuste_positivo: resultados.filter(r => r.ajuste_percentual > 0).length,
        grupos_com_ajuste_negativo: resultados.filter(r => r.ajuste_percentual < 0).length
      },
      premios_calculados: resultados,
      fatores_credibilidade: resultados.map(r => ({
        grupo: r.grupo,
        fator_credibilidade: r.fator_credibilidade,
        n_anos: r.n_anos
      }))
    };
  }

  // ============================================================================
  // BITDATA / DATA MINING (NOVO)
  // ============================================================================

  // ---------- APRIORI (REGRAS DE ASSOCIAÇÃO) ----------
  async executarApriori(dados, parametros = {}) {
    try {
      console.log('🔍 Executando Apriori (regras de associação)...');
      
      const paramsPadrao = {
        suporte_min: parametros.suporte_min || 0.1,
        confianca_min: parametros.confianca_min || 0.5,
        lift_min: parametros.lift_min || 1.1,
        max_len: parametros.max_len || 4,
        ...parametros
      };

      const response = await this.executarModeloR('apriori', dados, paramsPadrao);
      return response;
    } catch (error) {
      console.error('❌ Erro no Apriori:', error);
      return this.gerarResultadoAprioriDemonstracao(parametros);
    }
  }

  gerarResultadoAprioriDemonstracao(parametros) {
    const regras = [
      { lhs: ['produto_A'], rhs: ['produto_B'], suporte: 0.15, confianca: 0.72, lift: 2.3 },
      { lhs: ['produto_C'], rhs: ['produto_D'], suporte: 0.12, confianca: 0.68, lift: 1.9 },
      { lhs: ['produto_A', 'produto_C'], rhs: ['produto_E'], suporte: 0.08, confianca: 0.81, lift: 2.7 },
      { lhs: ['produto_B'], rhs: ['produto_F'], suporte: 0.11, confianca: 0.59, lift: 1.5 },
      { lhs: ['produto_D', 'produto_E'], rhs: ['produto_G'], suporte: 0.06, confianca: 0.77, lift: 2.1 }
    ];

    return {
      success: true,
      modo_demonstracao: true,
      timestamp: new Date().toISOString(),
      tipo_operacao: 'apriori',
      
      parametros_usados: parametros,
      n_regras: regras.length,
      n_itemsets: 15,
      
      regras: regras,
      
      itemsets_frequentes: [
        { items: ['produto_A', 'produto_B'], suporte: 0.18 },
        { items: ['produto_C', 'produto_D'], suporte: 0.14 },
        { items: ['produto_A', 'produto_C', 'produto_E'], suporte: 0.09 },
        { items: ['produto_B', 'produto_F'], suporte: 0.13 }
      ],
      
      metricas: {
        suporte_medio: regras.reduce((a, r) => a + r.suporte, 0) / regras.length,
        confianca_media: regras.reduce((a, r) => a + r.confianca, 0) / regras.length,
        lift_medio: regras.reduce((a, r) => a + r.lift, 0) / regras.length,
        regras_significativas: regras.filter(r => r.lift > 2).length
      },
      
      visualizacao: {
        top_regras: regras.slice(0, 3),
        grafico_lift: regras.map((r, i) => ({
          regra: `R${i+1}`,
          lift: r.lift
        }))
      },
      
      recomendacoes: [
        'Associação forte: produto_A → produto_B',
        'Considere promoções conjuntas',
        'Agrupar produtos com alta confiança'
      ]
    };
  }

  // ---------- FP-GROWTH ----------
  async executarFPGrowth(dados, parametros = {}) {
    try {
      console.log('🌳 Executando FP-Growth...');
      
      const paramsPadrao = {
        suporte_min: parametros.suporte_min || 0.1,
        max_len: parametros.max_len || 5,
        ...parametros
      };

      const response = await this.executarModeloR('fp_growth', dados, paramsPadrao);
      return response;
    } catch (error) {
      console.error('❌ Erro no FP-Growth:', error);
      return this.gerarResultadoFPGrowthDemonstracao(parametros);
    }
  }

  gerarResultadoFPGrowthDemonstracao(parametros) {
    return {
      success: true,
      modo_demonstracao: true,
      timestamp: new Date().toISOString(),
      tipo_operacao: 'fp_growth',
      
      itemsets_frequentes: [
        { items: ['A', 'B', 'C'], suporte: 0.22, count: 220 },
        { items: ['A', 'B'], suporte: 0.35, count: 350 },
        { items: ['C', 'D'], suporte: 0.18, count: 180 },
        { items: ['E', 'F', 'G'], suporte: 0.12, count: 120 }
      ],
      
      estatisticas: {
        total_itemsets: 24,
        suporte_maximo: 0.35,
        itemset_mais_frequente: ['A', 'B']
      }
    };
  }

  // ---------- K-MEANS CLUSTERING ----------
  async executarKMeans(dados, parametros = {}) {
    try {
      console.log('🎯 Executando K-Means clustering...');
      
      const paramsPadrao = {
        n_clusters: parametros.n_clusters || 3,
        max_iter: parametros.max_iter || 100,
        n_init: parametros.n_init || 10,
        random_state: parametros.random_state || 42,
        ...parametros
      };

      const response = await this.executarModeloR('kmeans', dados, paramsPadrao);
      return response;
    } catch (error) {
      console.error('❌ Erro no K-Means:', error);
      return this.gerarResultadoKMeansDemonstracao(parametros, dados);
    }
  }

  gerarResultadoKMeansDemonstracao(parametros, dados) {
    const nClusters = parametros.n_clusters || 3;
    const clusters = [];
    
    for (let i = 0; i < nClusters; i++) {
      clusters.push({
        id: i,
        centroide: [Math.random() * 100, Math.random() * 100],
        tamanho: Math.floor(Math.random() * 50) + 20,
        inercia: Math.random() * 1000
      });
    }

    return {
      success: true,
      modo_demonstracao: true,
      timestamp: new Date().toISOString(),
      tipo_operacao: 'kmeans',
      
      parametros_usados: parametros,
      n_clusters: nClusters,
      n_observacoes: dados?.length || 100,
      
      clusters: clusters,
      
      metricas: {
        inercia_total: clusters.reduce((a, c) => a + c.inercia, 0),
        silhouette_score: 0.65,
        calinski_harabasz: 124.3,
        davies_bouldin: 0.42
      },
      
      visualizacao: {
        distribuicao_clusters: clusters.map(c => ({
          cluster: `Cluster ${c.id}`,
          tamanho: c.tamanho
        })),
        grafico_silhueta: Array.from({ length: 10 }, (_, i) => ({
          ponto: i,
          valor: Math.random() * 0.5 + 0.3
        }))
      }
    };
  }

  // ---------- CLUSTER HIERÁRQUICO ----------
  async executarClusterHierarquico(dados, parametros = {}) {
    try {
      console.log('🌲 Executando cluster hierárquico...');
      
      const paramsPadrao = {
        metodo_linkage: parametros.metodo_linkage || 'ward',
        metrica_distancia: parametros.metrica_distancia || 'euclidean',
        n_clusters: parametros.n_clusters || 3,
        ...parametros
      };

      const response = await this.executarModeloR('hierarchical', dados, paramsPadrao);
      return response;
    } catch (error) {
      console.error('❌ Erro no cluster hierárquico:', error);
      return this.gerarResultadoHierarquicoDemonstracao(parametros);
    }
  }

  gerarResultadoHierarquicoDemonstracao(parametros) {
    return {
      success: true,
      modo_demonstracao: true,
      timestamp: new Date().toISOString(),
      tipo_operacao: 'cluster_hierarquico',
      
      dendrograma: {
        height: [5.2, 3.1, 2.4, 1.8, 1.2],
        merge: [[-1, -2], [-3, -4], [1, -5], [2, 3]]
      },
      
      clusters: [
        { id: 0, elementos: [0, 1, 2, 3], tamanho: 4 },
        { id: 1, elementos: [4, 5, 6], tamanho: 3 },
        { id: 2, elementos: [7, 8, 9, 10, 11], tamanho: 5 }
      ],
      
      metricas: {
        coef_cofenetico: 0.82,
        distancias_media: 3.4
      }
    };
  }

  // ---------- PCA (ANÁLISE DE COMPONENTES PRINCIPAIS) ----------
  async executarPCA(dados, parametros = {}) {
    try {
      console.log('📉 Executando PCA...');
      
      const paramsPadrao = {
        n_componentes: parametros.n_componentes || 2,
        scale: parametros.scale ?? true,
        center: parametros.center ?? true,
        ...parametros
      };

      const response = await this.executarModeloR('pca', dados, paramsPadrao);
      return response;
    } catch (error) {
      console.error('❌ Erro no PCA:', error);
      return this.gerarResultadoPCADemonstracao(parametros, dados);
    }
  }

  gerarResultadoPCADemonstracao(parametros, dados) {
    const nComp = parametros.n_componentes || 2;
    const varianciaExplicada = [0.45, 0.22, 0.12, 0.08, 0.05];
    
    return {
      success: true,
      modo_demonstracao: true,
      timestamp: new Date().toISOString(),
      tipo_operacao: 'pca',
      
      parametros_usados: parametros,
      n_componentes: nComp,
      n_variaveis_originais: 8,
      
      componentes: Array.from({ length: nComp }, (_, i) => ({
        componente: `PC${i+1}`,
        variancia_explicada: varianciaExplicada[i],
        variancia_acumulada: varianciaExplicada.slice(0, i+1).reduce((a, v) => a + v, 0),
        autovalor: varianciaExplicada[i] * 10
      })),
      
      cargas_fatoriais: [
        { variavel: 'var1', PC1: 0.82, PC2: -0.34 },
        { variavel: 'var2', PC1: 0.76, PC2: 0.28 },
        { variavel: 'var3', PC1: -0.45, PC2: 0.71 },
        { variavel: 'var4', PC1: 0.23, PC2: 0.82 }
      ],
      
      scores: dados ? Array.from({ length: Math.min(10, dados.length) }, (_, i) => ({
        observacao: i,
        PC1: Math.random() * 4 - 2,
        PC2: Math.random() * 4 - 2
      })) : [],
      
      metricas: {
        variancia_total_explicada: varianciaExplicada.slice(0, nComp).reduce((a, v) => a + v, 0),
        kaiser_meyer_olkin: 0.76,
        bartlett_p_value: 0.001,
        comunalidades_media: 0.68
      }
    };
  }

  // ---------- BITDATA COMPLETO ----------
  async executarBitData(tipo, dados, parametros = {}) {
    const metodos = {
      'apriori': this.executarApriori,
      'fp_growth': this.executarFPGrowth,
      'kmeans': this.executarKMeans,
      'hierarchical': this.executarClusterHierarquico,
      'pca': this.executarPCA
    };

    if (metodos[tipo]) {
      return metodos[tipo].call(this, dados, parametros);
    }

    return {
      success: false,
      error: `Tipo ${tipo} não suportado em BitData`,
      tipos_disponiveis: Object.keys(metodos)
    };
  }


// ============================================================================
// DATA MINING ESPECÍFICO (NOVO)
// ============================================================================

async executarDataMining(tipo, dados, parametros = {}) {
  try {
    console.log(`⛏️ Executando Data Mining: ${tipo}`);
    
    // Mapear algoritmo para o tipo de script correto
    const scriptMap = {
      // Clustering
      'kmeans': 'clustering',
      'dbscan': 'clustering',
      'hierarchical': 'clustering',
      'gmm': 'clustering',
      
      // Associação
      'apriori': 'associacao',
      'fp_growth': 'associacao',
      'eclat': 'associacao',
      
      // Classificação
      'decision_tree': 'classificacao',
      'naive_bayes': 'classificacao',
      'knn': 'classificacao',
      'svm': 'classificacao',
      'random_forest': 'classificacao',
      
      // Redução
      'pca': 'reducao',
      'tsne': 'reducao',
      'umap': 'reducao',
      
      // Anomalias
      'isolation_forest': 'anomalias',
      'lof': 'anomalias',
      'one_class_svm': 'anomalias'
    };

    // Determinar qual script usar baseado no algoritmo
    const scriptTipo = scriptMap[tipo] || 'clustering';
    
    console.log(`   📁 Script: ${scriptTipo}.R, Algoritmo: ${tipo}`);
    
    // Preparar payload no formato que o RRunner espera
    const payload = {
      dados: dados,
      parametros: {
        ...parametros,
        algoritmo: tipo,  // Passar o algoritmo específico
        categoria: scriptTipo  // Passar a categoria também
      }
    };

    // Usar o endpoint genérico que o RRunner já espera
    // O backend tem rota POST /r/modelos/executar que chama execRModel
    const response = await this.axios.post('/r/modelos/executar', {
      tipo: scriptTipo,  // O tipo é o nome do script (clustering, associacao, etc)
      dados: dados,
      parametros: payload.parametros
    });
    
    console.log('📥 Resposta do Data Mining:', response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Erro no Data Mining ${tipo}:`, error);
    
    // Se for erro 404, tentar encontrar o script por similaridade
    if (error.response?.status === 404) {
      console.log('⚠️ Script não encontrado, tentando listar disponíveis...');
      
      // Tentar listar scripts disponíveis
      try {
        const scriptsResponse = await this.axios.get('/r/scripts/disponiveis');
        console.log('📋 Scripts disponíveis:', scriptsResponse.data);
      } catch (e) {}
    }
    
    throw this.handleError(error);
  }
}

  // ============================================================================
  // MÉTODO LEGADO (MANTIDO PARA COMPATIBILIDADE)
  // ============================================================================

  async executarModeloActuarial(tipo, dados, parametros = {}) {
    console.warn('⚠️ executarModeloActuarial está obsoleto. Use os métodos específicos.');
    
    const actuarialMethods = {
      'monte_carlo': this.executarMonteCarlo,
      'markov': this.executarMarkov,
      'mortality_table': this.criarTabuaMortalidade,
      'a_priori': this.executarTarifacaoAPriori,
      'a_posteriori': this.executarCredibilidadeAPosteriori,
      'credibilidade': this.executarCredibilidadeAPosteriori
    };

    if (actuarialMethods[tipo]) {
      return actuarialMethods[tipo].call(this, dados, parametros);
    }
    
    return this.executarModeloR(tipo, dados, parametros);
  }
}

export default new ApiService();