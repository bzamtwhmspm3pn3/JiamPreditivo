import axios from 'axios';

class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    this.axios = axios.create({
      baseURL: this.baseURL,
      timeout: 120000, // Aumentado para modelos atuariais (2 minutos)
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

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
      throw this.handleError(error);
    }
  }

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
          { id: 'logistica', nome: 'Regressão Logística', descricao: 'Modelo para classificação binária (0/1)', categoria: 'regressao' },
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
          { id: 'a_posteriori', nome: 'Tarifação A Posteriori', descricao: 'Credibility theory', categoria: 'atuaria' }
        ]
      };
    }
  }

  async executarModeloR(tipo, dados, parametros = {}) {
    try {
      console.log(`📤 Enviando modelo ${tipo} para API:`, { 
        tipo, 
        n_observacoes: dados.length,
        variaveis: Object.keys(dados[0] || {})
      });

      const payload = {
        tipo,
        dados,
        parametros
      };

      const response = await this.axios.post('/r/modelos/executar', payload);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao executar modelo ${tipo}:`, error);
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // MÉTODOS ESPECÍFICOS POR CATEGORIA
  // ============================================================================

  // --- REGRESSÃO ---
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

  // --- SÉRIES TEMPORAIS ---
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

  // --- MACHINE LEARNING ---
  async executarRandomForest(dados, parametros) {
    return this.executarModeloR('random_forest', dados, parametros);
  }

  async executarXGBoost(dados, parametros) {
    return this.executarModeloR('xgboost', dados, parametros);
  }

  // ============================================================================
  // MODELOS ATUARIAIS (ADICIONADOS)
  // ============================================================================

  async executarMonteCarlo(dados, parametros = {}) {
    try {
      console.log('🎲 Executando simulação Monte Carlo...');
      
      // Parâmetros padrão ajustados para Monte Carlo
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
      throw this.handleError(error);
    }
  }

  async executarMarkov(dados, parametros = {}) {
    try {
      console.log('📊 Executando análise de Markov...');
      
      const paramsPadrao = {
        var_analise: Object.keys(dados[0] || {})[0], // Primeira variável por padrão
        n_estados: 3,
        nomes_estados: 'Baixo,Médio,Alto',
        metodo: 'MLE',
        ...parametros
      };

      return this.executarModeloR('markov', dados, paramsPadrao);
    } catch (error) {
      console.error('❌ Erro no Markov:', error);
      throw this.handleError(error);
    }
  }

  async criarTabuaMortalidade(parametros = {}) {
    try {
      console.log('📈 Criando tábua de mortalidade...');
      
      const paramsPadrao = {
        base_mortalidade: 'BR-EMS2020',
        idade_min: 20,
        idade_max: 100,
        qx_adjust: 1.0,
        sexo: 'unisex',
        l0: 100000,
        ...parametros
      };

      // Tábua não precisa de dados - enviamos array vazio
      return this.executarModeloR('mortality_table', [], paramsPadrao);
    } catch (error) {
      console.error('❌ Erro na tábua de mortalidade:', error);
      throw this.handleError(error);
    }
  }

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

  async executarTarifacaoAPosteriori(dados, parametros = {}) {
    try {
      console.log('📊 Executando tarifação a posteriori...');
      
      // Determinar variáveis automaticamente se não fornecidas
      const sampleRow = dados[0] || {};
      const paramsPadrao = {
        grupo_var: this.findVariableByPattern(sampleRow, ['grupo', 'seguradora', 'regiao', 'categoria']),
        tempo_var: this.findVariableByPattern(sampleRow, ['ano', 'periodo', 'mes', 'data']),
        sinistro_var: this.findVariableByPattern(sampleRow, ['sinistros', 'n_sinistros', 'frequencia']),
        custo_var: this.findVariableByPattern(sampleRow, ['custo', 'valor', 'severidade', 'sinistro_total']),
        metodo: 'Bühlmann-Straub',
        z_min: 0.3,
        z_max: 0.9,
        ...parametros
      };

      return this.executarModeloR('a_posteriori', dados, paramsPadrao);
    } catch (error) {
      console.error('❌ Erro na tarifação a posteriori:', error);
      throw this.handleError(error);
    }
  }

  // Método auxiliar para encontrar variáveis por padrão
  findVariableByPattern(row, patterns) {
    if (!row) return null;
    
    const keys = Object.keys(row);
    for (const pattern of patterns) {
      const found = keys.find(key => 
        key.toLowerCase().includes(pattern.toLowerCase())
      );
      if (found) return found;
    }
    return keys[0]; // Retorna primeira variável como fallback
  }

  // ============================================================================
  // MÉTODOS GENÉRICOS
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
      const response = await this.axios.post('/r/dados/upload', {
        dados,
        parametros
      });
      return response.data;
    } catch (error) {
      console.error('Erro no upload de dados:', error);
      throw this.handleError(error);
    }
  }

  // Método legado (mantido para compatibilidade)
  async executarModeloActuarial(tipo, dados, parametros = {}) {
    console.warn('⚠️ executarModeloActuarial está obsoleto. Use os métodos específicos.');
    
    const actuarialMethods = {
      'monte_carlo': this.executarMonteCarlo,
      'markov': this.executarMarkov,
      'mortality_table': this.criarTabuaMortalidade,
      'a_priori': this.executarTarifacaoAPriori,
      'a_posteriori': this.executarTarifacaoAPosteriori
    };

    if (actuarialMethods[tipo]) {
      return actuarialMethods[tipo].call(this, dados, parametros);
    }
    
    // Fallback para o método genérico
    return this.executarModeloR(tipo, dados, parametros);
  }

  // Método genérico com mapeamento de tipos
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
      'credibility': 'a_posteriori',
      'credibilidade': 'a_posteriori'
    };
    
    const tipoFinal = tipoMap[tipo] || tipo;
    
    // Para modelos atuariais, use os métodos específicos
    if (['monte_carlo', 'markov', 'mortality_table', 'a_priori', 'a_posteriori'].includes(tipoFinal)) {
      return this.executarModeloActuarial(tipoFinal, dados, parametros);
    }
    
    return this.executarModeloR(tipoFinal, dados, parametros);
  }

  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================

  handleError(error) {
    if (error.response) {
      // Erro da API
      const apiError = error.response.data;
      return {
        message: apiError.error || 'Erro na API',
        details: apiError.details || apiError.message,
        status: error.response.status,
        isApiError: true,
        response: apiError,
        recommendations: apiError.recommendations || this.getDefaultRecommendations(error)
      };
    } else if (error.request) {
      // Erro de rede
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
      // Erro de configuração
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
        'Diminua o número de simulações (n_sim)',
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
    
    if (errorMsg.includes('variável') || errorMsg.includes('coluna')) {
      return [
        'Verifique os nomes das variáveis',
        'Confirme se as variáveis existem nos dados',
        'Renomeie as variáveis se necessário'
      ];
    }
    
    return [
      'Verifique os dados de entrada',
      'Confirme os parâmetros do modelo',
      'Consulte a documentação para requisitos específicos'
    ];
  }

  async testConnection() {
    try {
      const [status, rStatus] = await Promise.all([
        this.getStatus(),
        this.getRStatus()
      ]);
      
      return {
        connected: true,
        backend: status.success,
        rSystem: rStatus.success,
        message: 'Conectado ao backend R/JS',
        version: status.version,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        connected: false,
        backend: false,
        rSystem: false,
        message: error.message || 'Não foi possível conectar ao servidor',
        error: error,
        timestamp: new Date().toISOString()
      };
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
      return { 
        disponivel: false, 
        error: 'Não foi possível obter lista de modelos',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { 
        disponivel: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ============================================================================
  // MÉTODOS ESPECÍFICOS PARA SHINY
  // ============================================================================

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
      return {
        success: false,
        categorias: [],
        error: 'Não foi possível obter categorias'
      };
    } catch (error) {
      return {
        success: false,
        categorias: [],
        error: error.message
      };
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
      return {
        success: false,
        modelos: [],
        error: 'Não foi possível filtrar modelos'
      };
    } catch (error) {
      return {
        success: false,
        modelos: [],
        error: error.message
      };
    }
  }

  // Método para preparar dados para modelos atuariais
  async prepararDadosAtuariais(dados, tipoModelo) {
    try {
      console.log(`🔧 Preparando dados para ${tipoModelo}...`);
      
      const preparacao = {
        'monte_carlo': this.prepararDadosMonteCarlo,
        'markov': this.prepararDadosMarkov,
        'a_posteriori': this.prepararDadosAPosteriori,
        'a_priori': this.prepararDadosAPriori
      };

      if (preparacao[tipoModelo]) {
        return preparacao[tipoModelo].call(this, dados);
      }

      return {
        success: true,
        dados: dados,
        message: 'Dados preparados',
        tipo: tipoModelo
      };
    } catch (error) {
      console.error('Erro ao preparar dados:', error);
      return {
        success: false,
        error: error.message,
        dados: dados
      };
    }
  }

  prepararDadosMonteCarlo(dados) {
    // Garantir que há variáveis numéricas para simulação
    const numericVars = Object.keys(dados[0] || {}).filter(key => {
      const sample = dados[0][key];
      return typeof sample === 'number' && !isNaN(sample);
    });

    return {
      success: true,
      dados: dados,
      variaveis_numericas: numericVars,
      recomendacoes: numericVars.length > 0 ? 
        `Use ${numericVars[0]} para simulação` : 
        'Adicione variáveis numéricas para melhor simulação'
    };
  }

  prepararDadosMarkov(dados) {
    // Encontrar variável temporal ou sequencial
    const potentialTimeVars = Object.keys(dados[0] || {}).filter(key => {
      const keyLower = key.toLowerCase();
      return keyLower.includes('data') || keyLower.includes('ano') || 
             keyLower.includes('mes') || keyLower.includes('periodo') ||
             keyLower.includes('tempo') || keyLower.includes('seq');
    });

    return {
      success: true,
      dados: dados,
      variavel_temporal: potentialTimeVars[0] || null,
      recomendacoes: potentialTimeVars[0] ? 
        `Usar ${potentialTimeVars[0]} como variável de sequência` :
        'Ordene os dados temporalmente para melhor análise'
    };
  }

  prepararDadosAPosteriori(dados) {
    // Verificar estrutura para credibility
    const hasGroups = dados.some(row => {
      const values = Object.values(row);
      return values.some(v => typeof v === 'string' && v.length > 0);
    });

    return {
      success: true,
      dados: dados,
      tem_grupos: hasGroups,
      recomendacoes: hasGroups ? 
        'Dados adequados para análise de credibility' :
        'Adicione variáveis categóricas para análise por grupo'
    };
  }

  prepararDadosAPriori(dados) {
    // Verificar variáveis para tarifação
    const sampleRow = dados[0] || {};
    const hasFrequency = Object.keys(sampleRow).some(k => 
      k.toLowerCase().includes('freq') || k.toLowerCase().includes('sinistro')
    );
    const hasSeverity = Object.keys(sampleRow).some(k => 
      k.toLowerCase().includes('custo') || k.toLowerCase().includes('valor')
    );

    return {
      success: true,
      dados: dados,
      tem_frequencia: hasFrequency,
      tem_severidade: hasSeverity,
      recomendacoes: (hasFrequency && hasSeverity) ? 
        'Dados adequados para tarifação' :
        'Para melhor tarifação, inclua variáveis de frequência e severidade'
    };
  }
}

export default new ApiService();