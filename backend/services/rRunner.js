// backend/services/rRunner.js (VERSÃO COMPLETA COM ATUARIAIS E BITDATA)
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class RRunner {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.rEngineDir = path.join(__dirname, '../r-engine');
    this.ensureTempDir();
    this.setupSpecialValidators();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  // Configurar validadores especiais para todos os modelos
  setupSpecialValidators() {
    this.specialValidators = {
      // ====================================================================
      // MODELOS ATUARIAIS
      // ====================================================================
      'monte_carlo': (parametros) => {
        const errors = [];
        if (!parametros.modelo_freq && !parametros.modelo_sev) {
          errors.push('Modelos de frequência e severidade são obrigatórios');
        }
        if (parametros.n_sim && (parametros.n_sim < 100 || parametros.n_sim > 100000)) {
          errors.push('Número de simulações deve estar entre 100 e 100000');
        }
        return errors;
      },
      
      'a_priori': (parametros) => {
        const errors = [];
        if (!parametros.modelo_freq && !parametros.modelo_sev) {
          errors.push('Modelos de frequência e severidade são obrigatórios');
        }
        return errors;
      },
      
      'a_posteriori': (parametros, dados) => {
        const errors = [];
        if (!parametros.grupo_var) errors.push('Variável de grupo é obrigatória');
        if (!parametros.tempo_var) errors.push('Variável de tempo é obrigatória');
        if (!parametros.sinistro_var) errors.push('Variável de sinistro é obrigatória');
        if (!parametros.custo_var) errors.push('Variável de custo é obrigatória');
        
        // Verificar se temos múltiplos grupos
        if (dados && dados.length > 0 && parametros.grupo_var) {
          const grupos = [...new Set(dados.map(d => d[parametros.grupo_var]))];
          if (grupos.length < 2) {
            errors.push('Tarifação a posteriori requer pelo menos 2 grupos distintos');
          }
        }
        return errors;
      },
      
      'markov': (parametros) => {
        const errors = [];
        if (!parametros.var_analise) errors.push('Variável de análise é obrigatória');
        if (parametros.n_estados && (parametros.n_estados < 2 || parametros.n_estados > 10)) {
          errors.push('Número de estados deve estar entre 2 e 10');
        }
        return errors;
      },
      
      'mortality_table': (parametros) => {
        const errors = [];
        if (parametros.idade_min && parametros.idade_max && 
            parametros.idade_min >= parametros.idade_max) {
          errors.push('Idade mínima deve ser menor que idade máxima');
        }
        return errors;
      },

     // ================================================================
// DATA MINING
// ================================================================
'clustering': (parametros) => {
  const errors = [];
  const algoritmos = ['kmeans', 'dbscan', 'hierarchical', 'gmm'];
  if (parametros.algoritmo && !algoritmos.includes(parametros.algoritmo)) {
    errors.push(`Algoritmo deve ser um de: ${algoritmos.join(', ')}`);
  }
  if (parametros.n_clusters && parametros.n_clusters < 2) {
    errors.push('Número de clusters deve ser pelo menos 2');
  }
  return errors;
},

'associacao': (parametros) => {
  const errors = [];
  const algoritmos = ['apriori', 'fp_growth', 'eclat'];
  if (parametros.algoritmo && !algoritmos.includes(parametros.algoritmo)) {
    errors.push(`Algoritmo deve ser um de: ${algoritmos.join(', ')}`);
  }
  if (parametros.suporte_min && (parametros.suporte_min < 0 || parametros.suporte_min > 1)) {
    errors.push('Suporte mínimo deve estar entre 0 e 1');
  }
  if (parametros.confianca_min && (parametros.confianca_min < 0 || parametros.confianca_min > 1)) {
    errors.push('Confiança mínima deve estar entre 0 e 1');
  }
  return errors;
},

'classificacao': (parametros) => {
  const errors = [];
  const algoritmos = ['decision_tree', 'random_forest', 'svm', 'naive_bayes', 'knn'];
  if (parametros.algoritmo && !algoritmos.includes(parametros.algoritmo)) {
    errors.push(`Algoritmo deve ser um de: ${algoritmos.join(', ')}`);
  }
  if (!parametros.target) {
    errors.push('Variável alvo (target) é obrigatória');
  }
  return errors;
},

'reducao': (parametros) => {
  const errors = [];
  const algoritmos = ['pca', 'tsne', 'umap', 'mds'];
  if (parametros.algoritmo && !algoritmos.includes(parametros.algoritmo)) {
    errors.push(`Algoritmo deve ser um de: ${algoritmos.join(', ')}`);
  }
  if (parametros.n_componentes && parametros.n_componentes < 1) {
    errors.push('Número de componentes deve ser pelo menos 1');
  }
  return errors;
},

'anomalias': (parametros) => {
  const errors = [];
  const algoritmos = ['isolation_forest', 'lof', 'one_class_svm', 'dbscan_outlier'];
  if (parametros.algoritmo && !algoritmos.includes(parametros.algoritmo)) {
    errors.push(`Algoritmo deve ser um de: ${algoritmos.join(', ')}`);
  }
  if (parametros.contamination && (parametros.contamination < 0 || parametros.contamination > 0.5)) {
    errors.push('Contamination deve estar entre 0 e 0.5');
  }
  return errors;
},

// ================================================================
// BIG DATA
// ================================================================
'spark_job': (parametros) => {
  const errors = [];
  const jobTypes = ['etl', 'analise', 'agregacao', 'ml'];
  if (parametros.job_type && !jobTypes.includes(parametros.job_type)) {
    errors.push(`Tipo de job deve ser um de: ${jobTypes.join(', ')}`);
  }
  return errors;
},

'hadoop_analise': (parametros) => {
  const errors = [];
  const operacoes = ['wordcount', 'aggregate', 'filter', 'join'];
  if (parametros.operacao && !operacoes.includes(parametros.operacao)) {
    errors.push(`Operação deve ser um de: ${operacoes.join(', ')}`);
  }
  return errors;
},

'streaming': (parametros) => {
  const errors = [];
  if (parametros.window_size && parametros.window_size < 1) {
    errors.push('Tamanho da janela deve ser pelo menos 1');
  }
  return errors;
},

'sql_distribuido': (parametros) => {
  const errors = [];
  if (!parametros.query) {
    errors.push('Query SQL é obrigatória');
  }
  return errors;
}
    };
  }

  // Executar modelo R específico
  async execRModel(tipo, dados, parametros = {}) {
    return new Promise((resolve, reject) => {
      try {
        const execId = uuidv4();
        const inputFile = path.join(this.tempDir, `${execId}_input.json`);
        const outputFile = path.join(this.tempDir, `${execId}_output.json`);

        // Validar dados
        if (!dados || !Array.isArray(dados)) {
          return reject(new Error('Dados inválidos'));
        }

        // Aplicar validações especiais
        if (this.specialValidators[tipo]) {
          const specialErrors = this.specialValidators[tipo](parametros, dados);
          if (specialErrors.length > 0) {
            return reject(new Error(`Validação ${tipo} falhou: ${specialErrors.join(', ')}`));
          }
        }

        // Ajustar validação mínima baseada no tipo
        let minObservacoes = 3;
        let validationMessage = '';
        
        switch(tipo) {
          // Atuariais
          case 'monte_carlo':
            minObservacoes = 10;
            validationMessage = 'Monte Carlo requer histórico suficiente';
            break;
          case 'markov':
            minObservacoes = 20;
            validationMessage = 'Markov requer série temporal extensa';
            break;
          case 'a_posteriori':
            minObservacoes = 15;
            break;
          case 'mortality_table':
            minObservacoes = 0; // Tábua não precisa de dados
            if (dados.length === 0) dados = [{ dummy: 1 }];
            break;
          case 'a_priori':
            minObservacoes = 10;
            break;
          
          // BitData
          case 'apriori':
          case 'fp_growth':
            minObservacoes = 10;
            validationMessage = 'Requer pelo menos 10 transações';
            break;
          case 'kmeans':
          case 'hierarchical':
          case 'pca':
            minObservacoes = 5;
            validationMessage = 'Requer pelo menos 5 observações';
            break;
        }
        
        if (dados.length < minObservacoes && tipo !== 'mortality_table') {
          return reject(new Error(`${validationMessage || 'Dados insuficientes'}. Necessário: ${minObservacoes}, Fornecido: ${dados.length}`));
        }

        // Preparar dados para R
        const rData = {
          tipo,
          dados: this.preprocessDataForModel(tipo, dados, parametros),
          parametros,
          execId,
          timestamp: new Date().toISOString(),
          metadata: {
            source: 'nodejs-backend',
            validation: 'passed',
            rows: dados.length,
            modelType: tipo
          }
        };

        // Escrever arquivo de entrada
        fs.writeFileSync(inputFile, JSON.stringify(rData, null, 2));
        
        // Determinar script R
        const scriptPath = this.getRScriptPath(tipo);

        // Verificar se o script existe
        if (!fs.existsSync(scriptPath)) {
          console.error(`❌ Script R não encontrado: ${scriptPath}`);
          this.safeCleanup(inputFile);
          return reject(new Error(`Modelo '${tipo}' não implementado`));
        }

        console.log(`🚀 Executando modelo R: ${tipo}`);
        console.log(`   Script: ${scriptPath}`);
        console.log(`   Observações: ${dados.length}`);
        console.log(`   Parâmetros:`, JSON.stringify(parametros).substring(0, 200) + '...');

        // Configurar timeout baseado no tipo
        const timeoutConfig = {
          'monte_carlo': 180000,     // 3 minutos
          'markov': 120000,          // 2 minutos
          'a_posteriori': 90000,     // 1.5 minutos
          'apriori': 60000,          // 1 minuto
          'fp_growth': 60000,        // 1 minuto
          'kmeans': 30000,           // 30 segundos
          'hierarchical': 45000,     // 45 segundos
          'pca': 30000,              // 30 segundos
          'default': 60000           // 1 minuto padrão
        };
        
        const timeout = timeoutConfig[tipo] || timeoutConfig.default;
        const rCommand = `Rscript "${scriptPath}" "${inputFile}" "${outputFile}"`;

        console.log(`   Timeout: ${timeout/1000}s, Comando: ${rCommand.substring(0, 100)}...`);

        exec(rCommand, { timeout: timeout }, (error, stdout, stderr) => {
          // Limpar arquivo de input sempre
          this.safeCleanup(inputFile);

          // Registrar logs do R
          if (stdout && stdout.trim()) {
            const logPrefix = this.getLogPrefix(tipo);
            console.log(`${logPrefix} R stdout (${tipo}):`, stdout.substring(0, 800) + (stdout.length > 800 ? '...' : ''));
          }
          if (stderr && stderr.trim()) {
            console.error(`❌ R stderr (${tipo}):`, stderr.substring(0, 500));
          }

          if (error) {
            console.error(`❌ Erro executando R (${tipo}):`, error.message);
            this.safeCleanup(outputFile);
            
            let userMessage = `Falha na execução do modelo ${tipo}`;
            if (error.killed) {
              userMessage = `Modelo ${tipo} excedeu o tempo limite (${timeout/1000}s)`;
            } else if (error.code === 1) {
              userMessage = `Erro no script R para ${tipo}`;
            }
            
            return reject(new Error(`${userMessage}: ${error.message}\n${stderr || ''}`));
          }

          try {
            if (!fs.existsSync(outputFile)) {
              console.error(`❌ Arquivo de saída não criado para ${tipo}`);
              return reject(new Error(`O script R não gerou resultado`));
            }

            const outputContent = fs.readFileSync(outputFile, 'utf8');
            const outputData = JSON.parse(outputContent);
            
            // Limpar arquivo de output
            this.safeCleanup(outputFile);

            // ✅ REMOVIDA A VERIFICAÇÃO DE SIMULAÇÃO QUE CAUSAVA PROBLEMAS

            // Verificar estrutura mínima
            if (!outputData.success && outputData.success !== undefined) {
              console.error(`❌ Script ${tipo} retornou sucesso=false`);
              console.error(`   Erro:`, outputData.error || 'Erro desconhecido');
              
              const recommendations = this.getRecommendations(tipo, outputData.error);
              if (recommendations) outputData.recommendations = recommendations;
              
              return reject(new Error(outputData.error || `O modelo R não foi executado com sucesso`));
            }

            console.log(`✅ Modelo R ${tipo} executado com sucesso`);
            
            // Enriquecer resultado com metadados
            const enrichedResult = this.enrichResult(tipo, outputData, {
              executionId: execId,
              executionTime: new Date().toISOString(),
              modelType: tipo,
              inputSize: dados.length,
              parameters: parametros
            });
            
            resolve(enrichedResult);

          } catch (parseError) {
            console.error(`❌ Erro ao processar resultado do R (${tipo}):`, parseError.message);
            this.safeCleanup(outputFile);
            return reject(new Error(`Erro ao processar resultado do modelo R: ${parseError.message}`));
          }
        });

      } catch (error) {
        console.error(`❌ Erro no execRModel (${tipo}):`, error.message);
        reject(error);
      }
    });
  }

  // Pré-processar dados baseado no tipo de modelo
  preprocessDataForModel(tipo, dados, parametros) {
    switch(tipo) {
      case 'a_posteriori':
        const requiredVars = ['grupo_var', 'tempo_var', 'sinistro_var', 'custo_var'];
        for (const varName of requiredVars) {
          const actualVar = parametros[varName];
          if (actualVar && dados.length > 0 && !dados[0].hasOwnProperty(actualVar)) {
            console.warn(`⚠️  Variável ${actualVar} (${varName}) não encontrada nos dados`);
          }
        }
        break;
        
      case 'apriori':
      case 'fp_growth':
        // Converter dados para formato de transações se necessário
        return this.formatForAssociationRules(dados, parametros);
        
      case 'kmeans':
      case 'hierarchical':
      case 'pca':
        // Garantir dados numéricos
        return this.ensureNumericData(dados, parametros);
    }
    
    return dados;
  }

  // Formatar dados para regras de associação
  formatForAssociationRules(dados, parametros) {
    if (!dados || dados.length === 0) return dados;
    
    // Se já está no formato de lista de itens, retornar
    if (Array.isArray(dados[0]) && typeof dados[0][0] === 'string') {
      return dados;
    }
    
    // Tentar converter do formato de dataframe
    const colunaItens = parametros.coluna_itens || 'itens';
    const colunaTransacao = parametros.coluna_transacao || 'transacao';
    
    if (dados[0][colunaItens]) {
      // Formato: cada linha tem um item e ID de transação
      const transacoes = {};
      dados.forEach(row => {
        const transId = row[colunaTransacao] || 'trans1';
        if (!transacoes[transId]) transacoes[transId] = [];
        transacoes[transId].push(row[colunaItens]);
      });
      return Object.values(transacoes);
    }
    
    return dados;
  }

  // Garantir dados numéricos para clustering/PCA
  ensureNumericData(dados, parametros) {
    if (!dados || dados.length === 0) return dados;
    
    const colunasNumericas = parametros.colunas || Object.keys(dados[0]).filter(key => {
      return typeof dados[0][key] === 'number';
    });
    
    if (colunasNumericas.length === 0) {
      console.warn('⚠️  Nenhuma coluna numérica encontrada para análise');
      return dados;
    }
    
    return dados.map(row => {
      const numericRow = {};
      colunasNumericas.forEach(col => {
        numericRow[col] = parseFloat(row[col]) || 0;
      });
      return numericRow;
    });
  }

  // Obter prefixo de log baseado no tipo
  getLogPrefix(tipo) {
    const prefixes = {
      'monte_carlo': '🎲',
      'markov': '📊',
      'mortality_table': '📈',
      'a_priori': '💰',
      'a_posteriori': '📉',
      'apriori': '🔍',
      'fp_growth': '🌳',
      'kmeans': '🎯',
      'hierarchical': '🌲',
      'pca': '📐'
    };
    return prefixes[tipo] || '📥';
  }

  // Enriquecer resultado com informações específicas do modelo
  enrichResult(tipo, outputData, metadata) {
    const enriched = { ...outputData };
    
    switch(tipo) {
      case 'monte_carlo':
        enriched.riskMetrics = {
          hasVaR: !!outputData.metricas_risco?.var_99,
          hasCVaR: !!outputData.metricas_risco?.tvar_99,
          simulationCount: outputData.estatisticas?.n_simulacoes_validas || 0
        };
        break;
        
      case 'markov':
        enriched.markovInfo = {
          hasStationaryDistribution: !!outputData.distribuicao_estacionaria,
          states: outputData.parametros?.n_estados || 3,
          transitionMatrixSize: outputData.matriz_transicao ? 'available' : 'missing'
        };
        break;
        
      case 'mortality_table':
        enriched.mortalityInfo = {
          ageRange: outputData.parametros ? 
            `${outputData.parametros.idade_min || 20}-${outputData.parametros.idade_max || 100}` : 'unknown',
          lifeExpectancy: outputData.resumo?.expectativa_vida_nascimento,
          tableSize: outputData.tabua?.length || 0
        };
        break;
        
      case 'a_priori':
        enriched.premiumInfo = {
          hasPremiumBreakdown: !!outputData.composicao_premio,
          premiumRange: outputData.estatisticas ? 
            `${outputData.estatisticas.min_premio} - ${outputData.estatisticas.max_premio}` : 'unknown'
        };
        break;
        
      case 'a_posteriori':
        enriched.credibilityInfo = {
          groupsAnalyzed: outputData.estatisticas_gerais?.n_grupos || 0,
          credibilityFactorRange: outputData.estatisticas_gerais?.credibilidade_media ? 
            `avg: ${(outputData.estatisticas_gerais.credibilidade_media * 100).toFixed(1)}%` : 'unknown'
        };
        break;
        
      case 'apriori':
        enriched.associationInfo = {
          rulesCount: outputData.regras?.length || 0,
          itemsetsCount: outputData.itemsets_frequentes?.length || 0,
          topRules: outputData.regras?.slice(0, 3).map(r => ({
            rule: `${r.lhs?.join(',')} → ${r.rhs?.join(',')}`,
            confidence: r.confianca
          }))
        };
        break;
        
      case 'kmeans':
      case 'hierarchical':
        enriched.clusterInfo = {
          clustersCount: outputData.clusters?.length || 0,
          totalInertia: outputData.metricas?.inercia_total,
          silhouetteScore: outputData.metricas?.silhouette_score
        };
        break;
        
      case 'pca':
        enriched.pcaInfo = {
          componentsCount: outputData.componentes?.length || 0,
          explainedVariance: outputData.componentes?.map(c => c.variancia_explicada),
          totalExplained: outputData.componentes?.reduce((a, c) => a + c.variancia_explicada, 0)
        };
        break;
    }
    
    enriched.metadata = {
      ...metadata,
      processingTime: new Date().toISOString(),
      modelCategory: this.getModelCategory(tipo)
    };
    
    return enriched;
  }

  // Obter recomendações baseadas no erro
  getRecommendations(tipo, errorMessage) {
    const recommendations = {
      'monte_carlo': [
        'Verifique se os modelos de frequência e severidade foram ajustados corretamente',
        'Reduza o número de simulações se estiver demorando muito',
        'Aumente a volatilidade se os resultados estiverem muito concentrados'
      ],
      'markov': [
        'Aumente o número de observações para melhor estimativa',
        'Considere reduzir o número de estados',
        'Verifique se a variável de análise tem variabilidade suficiente'
      ],
      'a_posteriori': [
        'Garanta que há dados para múltiplos grupos/anos',
        'Verifique as variáveis de agrupamento e tempo',
        'Considere usar um método mais simples (Bühlmann em vez de Straub)'
      ],
      'mortality_table': [
        'Verifique os parâmetros de idade (mínima < máxima)',
        'Ajuste o fator qx se as probabilidades parecerem irrealistas',
        'Considere usar uma base de mortalidade diferente'
      ],
      'apriori': [
        'Reduza o suporte mínimo se nenhuma regra for encontrada',
        'Aumente o suporte mínimo se houver muitas regras',
        'Verifique o formato dos dados (devem ser transações)'
      ],
      'kmeans': [
        'Tente diferentes números de clusters',
        'Normalize os dados antes da clusterização',
        'Verifique se há outliers nos dados'
      ],
      'pca': [
        'Verifique se as variáveis são numéricas',
        'Considere normalizar os dados (scale=true)',
        'Analise a matriz de correlação antes da PCA'
      ]
    };
    
    return recommendations[tipo] || [
      'Verifique os dados de entrada',
      'Confirme os parâmetros do modelo',
      'Consulte a documentação para requisitos específicos'
    ];
  }

  // Categorizar modelo
  getModelCategory(tipo) {
    const categories = {
      'monte_carlo': 'risco',
      'markov': 'series_temporais',
      'mortality_table': 'vida',
      'a_priori': 'tarifacao',
      'a_posteriori': 'credibilidade',
      'apriori': 'associacao',
      'fp_growth': 'associacao',
      'kmeans': 'clusterizacao',
      'hierarchical': 'clusterizacao',
      'pca': 'dimensionalidade'
    };
    return categories[tipo] || 'outros';
  }

  // Executar comando R genérico
  async execRCommand(comando, dados = {}) {
    return new Promise((resolve, reject) => {
      try {
        const execId = uuidv4();
        const inputFile = path.join(this.tempDir, `${execId}_input.json`);
        const outputFile = path.join(this.tempDir, `${execId}_output.json`);

        const rData = { comando, dados, execId, timestamp: new Date().toISOString() };
        fs.writeFileSync(inputFile, JSON.stringify(rData, null, 2));

        const scriptPath = this.getRScriptPath(comando);

        if (!fs.existsSync(scriptPath)) {
          console.error(`❌ Script R não encontrado para comando: ${comando}`);
          this.safeCleanup(inputFile);
          return reject(new Error(`Comando '${comando}' não implementado`));
        }

        console.log(`🚀 Executando comando R: ${comando}`);
        const rCommand = `Rscript "${scriptPath}" "${inputFile}" "${outputFile}"`;

        exec(rCommand, { timeout: 30000 }, (error, stdout, stderr) => {
          this.safeCleanup(inputFile);

          if (error) {
            console.error(`❌ Erro no comando R (${comando}):`, error.message);
            this.safeCleanup(outputFile);
            return reject(new Error(`Erro executando comando R: ${error.message}`));
          }

          try {
            if (!fs.existsSync(outputFile)) {
              return reject(new Error(`O script R não gerou resultado`));
            }

            const outputData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
            this.safeCleanup(outputFile);

            // ✅ REMOVIDA VERIFICAÇÃO DE SIMULAÇÃO

            resolve(outputData);

          } catch (parseError) {
            console.error(`❌ Erro parseando resultado (${comando}):`, parseError);
            this.safeCleanup(outputFile);
            reject(new Error(`Erro processando resultado do R: ${parseError.message}`));
          }
        });

      } catch (error) {
        console.error(`❌ Erro no execRCommand (${comando}):`, error);
        reject(error);
      }
    });
  }

  getRScriptPath(tipo) {
    const basePath = this.rEngineDir;
    
    const scriptMap = {
      // Regressão
      'glm': path.join(basePath, 'regression/linear.R'),
      'linear': path.join(basePath, 'regression/linear.R'),
      'multiple': path.join(basePath, 'regression/multiple.R'),
      'logistic': path.join(basePath, 'regression/logistic.R'),
      'logistica': path.join(basePath, 'regression/logistica.R'),
      
      // Machine Learning
      'random_forest': path.join(basePath, 'ml/random_forest.R'),
      'xgboost': path.join(basePath, 'ml/xgboost.R'),
      
      // Séries Temporais
      'arima': path.join(basePath, 'time_series/arima.R'),
      'sarima': path.join(basePath, 'time_series/sarima.R'),
      'ets': path.join(basePath, 'time_series/ets.R'),
      'prophet': path.join(basePath, 'time_series/prophet.R'),
      
      // Modelos Atuariais
      'monte_carlo': path.join(basePath, 'actuarial/monte_carlo.R'),
      'markov': path.join(basePath, 'actuarial/markov.R'),
      'mortality_table': path.join(basePath, 'actuarial/mortality_table.R'),
      'tabua_mortalidade': path.join(basePath, 'actuarial/mortality_table.R'),
      'a_priori': path.join(basePath, 'actuarial/a_priori.R'),
      'a_posteriori': path.join(basePath, 'actuarial/a_posteriori.R'),
      
      // ================================================================
    // DATA MINING (com seus nomes de scripts)
    // ================================================================
    'clustering': path.join(basePath, 'data_mining/clustering.R'),
    'associacao': path.join(basePath, 'data_mining/associacao.R'),
    'classificacao': path.join(basePath, 'data_mining/classificacao.R'),
    'reducao': path.join(basePath, 'data_mining/reducao.R'),
    'anomalias': path.join(basePath, 'data_mining/anomalias.R'),
    
    // ================================================================
    // BIG DATA (com seus nomes de scripts)
    // ================================================================
    'spark_job': path.join(basePath, 'big_data/spark_jobs.R'),
    'spark': path.join(basePath, 'big_data/spark_jobs.R'),
    'hadoop_analise': path.join(basePath, 'big_data/hadoop_analise.R'),
    'hadoop': path.join(basePath, 'big_data/hadoop_analise.R'),
    'streaming': path.join(basePath, 'big_data/streaming.R'),
    'sql_distribuido': path.join(basePath, 'big_data/sql_distribuido.R'),
    'sql': path.join(basePath, 'big_data/sql_distribuido.R'),
      
      // Processamento
      'processamento': path.join(basePath, 'data/processing.R'),
      'visualizacao': path.join(basePath, 'data/visualization.R'),
      'interpretacao': path.join(basePath, 'data/interpretation.R'),
      'dados': path.join(basePath, 'data/processing.R')
    };

    if (scriptMap[tipo]) return scriptMap[tipo];
    
    // Tentar encontrar por similaridade
    const possiblePaths = [
      path.join(basePath, 'actuarial', `${tipo}.R`),
      path.join(basePath, 'bitdata', `${tipo}.R`),
      path.join(basePath, 'regression', `${tipo}.R`),
      path.join(basePath, 'time_series', `${tipo}.R`),
      path.join(basePath, 'ml', `${tipo}.R`),
      path.join(basePath, 'data', `${tipo}.R`)
    ];
    
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        console.log(`🔍 Encontrado script por similaridade: ${possiblePath}`);
        return possiblePath;
      }
    }
    
    console.warn(`⚠️  Usando script padrão para tipo: ${tipo}`);
    return path.join(basePath, 'common/utils.R');
  }

  // Testar conexão com R
  async testRConnection() {
    return new Promise((resolve) => {
      try {
        const testCommand = 'Rscript --version';
        
        console.log('🔍 Testando conexão com R...');
        
        exec(testCommand, { timeout: 10000 }, (error, stdout, stderr) => {
          if (error) {
            console.error('❌ R não disponível:', error.message);
            resolve({ connected: false, error: error.message, stderr: stderr });
          } else {
            console.log('✅ R está disponível:', stdout.trim());
            
            // Testar pacotes essenciais
            const packageTest = `
              cat("📦 Testando pacotes R essenciais...\\n")
              pacotes_essenciais <- c(
                "jsonlite", "dplyr", "tidyr", 
                "markovchain", "lifecontingencies",
                "arules", "cluster", "FactoMineR"
              )
              disponiveis <- sapply(pacotes_essenciais, require, character.only = TRUE, quietly = TRUE)
              cat("Pacotes disponíveis:", paste(pacotes_essenciais[disponiveis], collapse=", "), "\\n")
              cat("Pacotes faltando:", paste(pacotes_essenciais[!disponiveis], collapse=", "), "\\n")
              
              resultado <- list(
                success = TRUE,
                r_version = R.version.string,
                platform = R.version.platform,
                packages_available = pacotes_essenciais[disponiveis],
                packages_missing = pacotes_essenciais[!disponiveis],
                actuarial_ready = "lifecontingencies" %in% pacotes_essenciais[disponiveis],
                bitdata_ready = all(c("arules", "cluster", "FactoMineR") %in% pacotes_essenciais[disponiveis])
              )
              cat("\\n✅ Teste de pacotes completo\\n")
            `;
            
            const tempFile = path.join(this.tempDir, `package_test_${uuidv4()}.R`);
            fs.writeFileSync(tempFile, packageTest);
            
            exec(`Rscript "${tempFile}"`, (pkgError, pkgStdout, pkgStderr) => {
              this.safeCleanup(tempFile);
              
              if (pkgStdout) console.log(pkgStdout);
              if (pkgStderr) console.error('Erro pacotes:', pkgStderr);
              
              resolve({
                connected: true,
                version: stdout.trim(),
                message: 'R está funcionando corretamente',
                stdout: stdout,
                packageTest: pkgStdout,
                actuarialReady: pkgStdout && pkgStdout.includes('actuarial_ready'),
                bitdataReady: pkgStdout && pkgStdout.includes('bitdata_ready')
              });
            });
          }
        });

      } catch (error) {
        console.error('❌ Erro testando conexão R:', error);
        resolve({ connected: false, error: error.message });
      }
    });
  }

  // Métodos auxiliares
  safeCleanup(filePath) {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (error) {
      console.warn(`⚠️  Não foi possível limpar arquivo ${filePath}:`, error.message);
    }
  }

  cleanupOldTempFiles(maxAgeHours = 24) {
    try {
      if (!fs.existsSync(this.tempDir)) return;

      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();
      const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

      files.forEach(file => {
        const filePath = path.join(this.tempDir, file);
        try {
          const stats = fs.statSync(filePath);
          const fileAge = now - stats.mtimeMs;

          if (fileAge > maxAgeMs) {
            fs.unlinkSync(filePath);
            console.log(`🧹 Limpou arquivo temporário antigo: ${file}`);
          }
        } catch (error) {
          console.warn(`⚠️  Não foi possível processar arquivo ${file}:`, error.message);
        }
      });
    } catch (error) {
      console.error('❌ Erro limpando arquivos temporários:', error.message);
    }
  }

  // Verificar se um script específico existe
  async scriptExists(tipo) {
    const scriptPath = this.getRScriptPath(tipo);
    const exists = fs.existsSync(scriptPath);
    
    console.log(`🔍 Verificando script ${tipo}: ${exists ? '✅ Existe' : '❌ Não existe'} (${scriptPath})`);
    
    return {
      exists,
      path: scriptPath,
      tipo: tipo,
      isActuarial: ['monte_carlo', 'markov', 'mortality_table', 'a_priori', 'a_posteriori'].includes(tipo),
      isBitData: ['apriori', 'fp_growth', 'kmeans', 'hierarchical', 'pca'].includes(tipo)
    };
  }

  // Listar todos os scripts disponíveis
  async listAvailableScripts() {
    const basePath = this.rEngineDir;
    const scripts = [];
    
    const scanDir = (dir, category) => {
      try {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          files.forEach(file => {
            if (file.endsWith('.R')) {
              const scriptName = file.replace('.R', '');
              scripts.push({
                name: scriptName,
                displayName: this.getDisplayName(scriptName, category),
                path: path.relative(basePath, path.join(dir, file)),
                category: category,
                fullPath: path.join(dir, file),
                exists: true,
                isActuarial: category === 'atuaria',
                isBitData: category === 'bitdata',
                description: this.getScriptDescription(scriptName, category)
              });
            }
          });
        }
      } catch (error) {
        console.warn(`⚠️  Não foi possível escanear diretório ${dir}:`, error.message);
      }
    };
    
    // Escanear todas as categorias
    scanDir(path.join(basePath, 'regression'), 'regressao');
    scanDir(path.join(basePath, 'time_series'), 'series_temporais');
    scanDir(path.join(basePath, 'ml'), 'machine_learning');
    scanDir(path.join(basePath, 'actuarial'), 'atuaria');
    scanDir(path.join(basePath, 'bitdata'), 'bitdata');  // NOVO
    scanDir(path.join(basePath, 'data'), 'processamento');
    scanDir(path.join(basePath, 'common'), 'utils');
    
    return scripts;
  }

  // Nomes amigáveis
  getDisplayName(scriptName, category) {
    const displayNames = {
      'monte_carlo': 'Simulação Monte Carlo',
      'markov': 'Cadeias de Markov',
      'mortality_table': 'Tábua de Mortalidade',
      'a_priori': 'Tarifação A Priori',
      'a_posteriori': 'Tarifação A Posteriori',
      'apriori': 'Apriori (Regras de Associação)',
      'fp_growth': 'FP-Growth',
      'kmeans': 'K-Means Clustering',
      'hierarchical': 'Cluster Hierárquico',
      'pca': 'Análise de Componentes Principais',
      'logistica': 'Regressão Logística',
      'arima': 'ARIMA',
      'prophet': 'Prophet',
      'random_forest': 'Random Forest'
    };
    
    return displayNames[scriptName] || scriptName.replace(/_/g, ' ');
  }

  // Descrições
  getScriptDescription(scriptName, category) {
    const descriptions = {
      'monte_carlo': 'Simulação de risco atuarial com incerteza',
      'markov': 'Análise de transição de estados de sinistralidade',
      'mortality_table': 'Criação e análise de tábuas de mortalidade',
      'a_priori': 'Cálculo de prêmios baseado em modelos estatísticos',
      'a_posteriori': 'Ajuste de prêmios usando teoria da credibilidade',
      'apriori': 'Mineração de regras de associação',
      'fp_growth': 'Algoritmo eficiente para padrões frequentes',
      'kmeans': 'Agrupamento por centróides',
      'hierarchical': 'Agrupamento hierárquico com dendrograma',
      'pca': 'Redução de dimensionalidade e análise de fatores'
    };
    
    return descriptions[scriptName] || `Modelo de ${category}`;
  }

  // Testar execução de um script específico
  async testScriptExecution(tipo) {
    try {
      console.log(`🧪 Testando execução do script: ${tipo}`);
      
      const testData = this.getTestDataForModel(tipo);
      const testParams = this.getTestParamsForModel(tipo);
      
      const result = await this.execRModel(tipo, testData, testParams);
      
      return {
        success: true,
        script: tipo,
        testPassed: result.success === true,
        executionTime: new Date().toISOString(),
        details: `Script ${tipo} executou com sucesso`
      };
      
    } catch (error) {
      return {
        success: false,
        script: tipo,
        testPassed: false,
        error: error.message,
        executionTime: new Date().toISOString(),
        details: `Falha na execução: ${error.message}`
      };
    }
  }

  // Dados de teste
  getTestDataForModel(tipo) {
    switch(tipo) {
      case 'monte_carlo':
      case 'a_priori':
        return Array.from({length: 50}, (_, i) => ({
          idade: 20 + Math.floor(i / 10),
          sexo: i % 2 === 0 ? 'M' : 'F',
          sinistros: Math.floor(Math.random() * 3),
          custo: Math.random() * 1000 + 100
        }));
        
      case 'markov':
        return Array.from({length: 100}, (_, i) => ({
          periodo: i,
          estado: ['Baixo', 'Médio', 'Alto'][Math.floor(Math.random() * 3)]
        }));
        
      case 'a_posteriori':
        return Array.from({length: 100}, (_, i) => ({
          grupo: `G${Math.floor(i / 10) + 1}`,
          ano: 2020 + (i % 3),
          sinistros: Math.floor(Math.random() * 5),
          custo: Math.random() * 5000 + 500
        }));
        
      case 'apriori':
        return [
          ['leite', 'pão', 'ovos'],
          ['leite', 'café'],
          ['pão', 'manteiga'],
          ['leite', 'pão', 'manteiga', 'café'],
          ['café', 'açúcar'],
          ['leite', 'café', 'açúcar']
        ];
        
      case 'kmeans':
      case 'hierarchical':
      case 'pca':
        return Array.from({length: 50}, (_, i) => ({
          x: Math.random() * 100,
          y: Math.random() * 100,
          z: Math.random() * 100
        }));
        
      default:
        return [{test: 1}];
    }
  }

  // Parâmetros de teste
  getTestParamsForModel(tipo) {
    switch(tipo) {
      case 'monte_carlo':
        return {
          modelo_freq: { coeficientes: { '(Intercept)': { estimate: -1.5 } } },
          modelo_sev: { coeficientes: { '(Intercept)': { estimate: 6.0 } } },
          n_sim: 100,
          vol_freq: 0.2,
          vol_sev: 0.3
        };
        
      case 'markov':
        return {
          var_analise: 'estado',
          n_estados: 3,
          nomes_estados: 'Baixo,Médio,Alto'
        };
        
      case 'mortality_table':
        return {
          base_mortalidade: 'BR-EMS2020',
          idade_min: 20,
          idade_max: 80,
          qx_adjust: 1.0,
          sexo: 'unisex'
        };
        
      case 'a_priori':
        return {
          modelo_freq: { coeficientes: { '(Intercept)': { estimate: -1.5 } } },
          modelo_sev: { coeficientes: { '(Intercept)': { estimate: 6.0 } } },
          margem_seguranca: 10,
          despesas_admin: 20
        };
        
      case 'a_posteriori':
        return {
          grupo_var: 'grupo',
          tempo_var: 'ano',
          sinistro_var: 'sinistros',
          custo_var: 'custo',
          metodo: 'Bühlmann-Straub'
        };
        
      case 'apriori':
        return {
          suporte_min: 0.3,
          confianca_min: 0.5,
          lift_min: 1.1,
          max_len: 3
        };
        
      case 'kmeans':
        return {
          n_clusters: 3,
          max_iter: 100,
          n_init: 10,
          random_state: 42
        };
        
      case 'pca':
        return {
          n_componentes: 2,
          scale: true,
          center: true
        };
        
      default:
        return {};
    }
  }
}

// Exportar como singleton
const runnerInstance = new RRunner();
runnerInstance.cleanupOldTempFiles();

module.exports = {
  execRModel: (tipo, dados, parametros) => runnerInstance.execRModel(tipo, dados, parametros),
  execRCommand: (comando, dados) => runnerInstance.execRCommand(comando, dados),
  testRConnection: () => runnerInstance.testRConnection(),
  scriptExists: (tipo) => runnerInstance.scriptExists(tipo),
  listAvailableScripts: () => runnerInstance.listAvailableScripts(),
  testScriptExecution: (tipo) => runnerInstance.testScriptExecution(tipo),
  RRunner
};