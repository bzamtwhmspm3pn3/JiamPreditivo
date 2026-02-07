// backend/services/rRunner.js (VERSÃO COMPLETA COM ATUARIAIS - ATUALIZADA)
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

  // Configurar validadores especiais para modelos atuariais
  setupSpecialValidators() {
    this.specialValidators = {
      'monte_carlo': (parametros) => {
        const errors = [];
        if (!parametros.modelo_freq || !parametros.modelo_sev) {
          errors.push('Modelos de frequência e severidade são obrigatórios');
        }
        if (parametros.n_sim && (parametros.n_sim < 100 || parametros.n_sim > 10000)) {
          errors.push('Número de simulações deve estar entre 100 e 10000');
        }
        return errors;
      },
      
      'a_priori': (parametros) => {
        const errors = [];
        if (!parametros.modelo_freq || !parametros.modelo_sev) {
          errors.push('Modelos de frequência e severidade são obrigatórios');
        }
        return errors;
      },
      
      'a_posteriori': (parametros, dados) => {
        const errors = [];
        if (!parametros.grupo_var) {
          errors.push('Variável de grupo é obrigatória');
        }
        if (!parametros.tempo_var) {
          errors.push('Variável de tempo é obrigatória');
        }
        if (!parametros.sinistro_var) {
          errors.push('Variável de sinistro é obrigatória');
        }
        if (!parametros.custo_var) {
          errors.push('Variável de custo é obrigatória');
        }
        return errors;
      },
      
      'markov': (parametros) => {
        const errors = [];
        if (!parametros.var_analise) {
          errors.push('Variável de análise é obrigatória');
        }
        if (parametros.n_estados && (parametros.n_estados < 2 || parametros.n_estados > 5)) {
          errors.push('Número de estados deve estar entre 2 e 5');
        }
        return errors;
      }
    };
  }

  // Executar modelo R específico - COM VALIDAÇÕES ESPECIAIS
  async execRModel(tipo, dados, parametros = {}) {
    return new Promise((resolve, reject) => {
      try {
        const execId = uuidv4();
        const inputFile = path.join(this.tempDir, `${execId}_input.json`);
        const outputFile = path.join(this.tempDir, `${execId}_output.json`);

        // Validar dados (ajuste para modelos atuariais)
        if (!dados || !Array.isArray(dados)) {
          return reject(new Error('Dados inválidos'));
        }

        // Aplicar validações especiais para modelos atuariais
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
            // Verificar se temos múltiplos grupos
            if (parametros.grupo_var && dados.length > 0) {
              const grupos = [...new Set(dados.map(d => d[parametros.grupo_var]))];
              if (grupos.length < 2) {
                return reject(new Error('Tarifação a posteriori requer pelo menos 2 grupos'));
              }
            }
            break;
          case 'mortality_table':
            // Tábua não precisa de dados - pode rodar com array vazio
            minObservacoes = 0;
            // Se não há dados, criar um dummy
            if (dados.length === 0) {
              dados = [{ dummy: 1 }];
            }
            break;
          case 'a_priori':
            minObservacoes = 10;
            break;
        }
        
        if (dados.length < minObservacoes && tipo !== 'mortality_table') {
          return reject(new Error(`${validationMessage || 'Dados insuficientes'}. Necessário: ${minObservacoes}, Fornecido: ${dados.length}`));
        }

        // Preparar dados para R (com validações adicionais)
        const rData = {
          tipo,
          dados: this.preprocessDataForModel(tipo, dados, parametros),
          parametros,
          execId,
          timestamp: new Date().toISOString(),
          metadata: {
            source: 'nodejs-backend',
            validation: 'passed',
            rows: dados.length
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
          'monte_carlo': 180000,     // 3 minutos para Monte Carlo
          'markov': 120000,          // 2 minutos para Markov
          'a_posteriori': 90000,     // 1.5 minutos para Credibility
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
            const logPrefix = tipo === 'monte_carlo' ? '🎲' : 
                            tipo === 'markov' ? '📊' : 
                            tipo === 'mortality_table' ? '📈' : '📥';
            console.log(`${logPrefix} R stdout (${tipo}):`, stdout.substring(0, 800) + (stdout.length > 800 ? '...' : ''));
          }
          if (stderr && stderr.trim()) {
            console.error(`❌ R stderr (${tipo}):`, stderr.substring(0, 500));
          }

          if (error) {
            console.error(`❌ Erro executando R (${tipo}):`, error.message);
            
            // Limpar output se existir
            this.safeCleanup(outputFile);
            
            // Mensagem de erro amigável
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

            // VERIFICAÇÃO CRÍTICA: Rejeitar se for simulação
            if (outputData.simulacao === true) {
              console.error(`❌ ATENÇÃO: Script ${tipo} retornou dados simulados!`);
              return reject(new Error(`O script R retornou dados simulados`));
            }

            // Verificar estrutura mínima
            if (!outputData.success) {
              console.error(`❌ Script ${tipo} retornou sucesso=false`);
              console.error(`   Erro:`, outputData.error || 'Erro desconhecido');
              
              // Tentar fornecer recomendações baseadas no erro
              const recommendations = this.getRecommendations(tipo, outputData.error);
              if (recommendations) {
                outputData.recommendations = recommendations;
              }
              
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
            
            // Limpar output se existir
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
        // Garantir que variáveis necessárias existem
        const requiredVars = ['grupo_var', 'tempo_var', 'sinistro_var', 'custo_var'];
        for (const varName of requiredVars) {
          const actualVar = parametros[varName];
          if (actualVar && dados.length > 0 && !dados[0].hasOwnProperty(actualVar)) {
            console.warn(`⚠️  Variável ${actualVar} (${varName}) não encontrada nos dados`);
          }
        }
        break;
        
      case 'monte_carlo':
      case 'a_priori':
        // Para modelos que usam outputs de outros modelos
        if (parametros.modelo_freq || parametros.modelo_sev) {
          console.log(`   Usando modelos pré-ajustados para ${tipo}`);
        }
        break;
    }
    
    return dados;
  }

  // Enriquecer resultado com informações específicas do modelo
  enrichResult(tipo, outputData, metadata) {
    const enriched = { ...outputData };
    
    // Adicionar informações específicas por tipo
    switch(tipo) {
      case 'monte_carlo':
        enriched.riskMetrics = {
          hasVaR: !!outputData.resultados?.var_99,
          hasCVaR: !!outputData.resultados?.cvar_99,
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
            `${outputData.parametros.idade_min}-${outputData.parametros.idade_max}` : 'unknown',
          lifeExpectancy: outputData.estatisticas?.expectativa_vida_nascimento,
          tableSize: outputData.tabua_completa?.length || 0
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
          credibilityFactorRange: outputData.estatisticas?.credibilidade_media ? 
            `avg: ${outputData.estatisticas.credibilidade_media}` : 'unknown'
        };
        break;
    }
    
    // Adicionar metadados
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
      'glm': 'regressao',
      'logistica': 'classificacao',
      'arima': 'series_temporais',
      'random_forest': 'machine_learning'
    };
    
    return categories[tipo] || 'outros';
  }

  // Executar comando R genérico - SEM SIMULAÇÕES
  async execRCommand(comando, dados = {}) {
    return new Promise((resolve, reject) => {
      try {
        const execId = uuidv4();
        const inputFile = path.join(this.tempDir, `${execId}_input.json`);
        const outputFile = path.join(this.tempDir, `${execId}_output.json`);

        // Preparar dados
        const rData = {
          comando,
          dados,
          execId,
          timestamp: new Date().toISOString()
        };

        // Escrever arquivo de entrada
        fs.writeFileSync(inputFile, JSON.stringify(rData, null, 2));

        // Determinar script R baseado no comando
        const scriptPath = this.getRScriptPath(comando);

        if (!fs.existsSync(scriptPath)) {
          console.error(`❌ Script R não encontrado para comando: ${comando}`);
          this.safeCleanup(inputFile);
          return reject(new Error(`Comando '${comando}' não implementado`));
        }

        console.log(`🚀 Executando comando R: ${comando}`);

        // Comando R
        const rCommand = `Rscript "${scriptPath}" "${inputFile}" "${outputFile}"`;

        exec(rCommand, { timeout: 30000 }, (error, stdout, stderr) => {
          // Limpar arquivos
          this.safeCleanup(inputFile);

          if (error) {
            console.error(`❌ Erro no comando R (${comando}):`, error.message);
            
            // Limpar output se existir
            this.safeCleanup(outputFile);
            
            return reject(new Error(`Erro executando comando R: ${error.message}`));
          }

          try {
            if (!fs.existsSync(outputFile)) {
              console.error(`❌ Output não criado para comando: ${comando}`);
              return reject(new Error(`O script R não gerou resultado`));
            }

            const outputData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
            this.safeCleanup(outputFile);

            // Verificar se não é simulação
            if (outputData.simulacao === true) {
              console.error(`❌ Comando ${comando} retornou dados simulados`);
              return reject(new Error(`Dados simulados detectados no comando R`));
            }

            resolve(outputData);

          } catch (parseError) {
            console.error(`❌ Erro parseando resultado (${comando}):`, parseError);
            
            // Limpar output se existir
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
      
      // MODELOS ATUARIAIS (ADICIONADOS)
      'monte_carlo': path.join(basePath, 'actuarial/monte_carlo.R'),
      'markov': path.join(basePath, 'actuarial/markov.R'),
      'mortality_table': path.join(basePath, 'actuarial/mortality_table.R'),
      'tabua_mortalidade': path.join(basePath, 'actuarial/mortality_table.R'),
      'a_priori': path.join(basePath, 'actuarial/a_priori.R'),
      'a_posteriori': path.join(basePath, 'actuarial/a_posteriori.R'),
      
      // Processamento de dados
      'processamento': path.join(basePath, 'data/processing.R'),
      'visualizacao': path.join(basePath, 'data/visualization.R'),
      'interpretacao': path.join(basePath, 'data/interpretation.R'),
      'dados': path.join(basePath, 'data/processing.R')
    };

    // Verificar se temos um mapeamento direto
    if (scriptMap[tipo]) {
      return scriptMap[tipo];
    }
    
    // Tentar encontrar por similaridade
    const possiblePaths = [
      path.join(basePath, 'actuarial', `${tipo}.R`),
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
    
    // Fallback
    console.warn(`⚠️  Usando script padrão para tipo: ${tipo}`);
    return path.join(basePath, 'common/utils.R');
  }

  // Verificar se R está disponível
  async testRConnection() {
    return new Promise((resolve) => {
      try {
        const testCommand = 'Rscript --version';
        
        console.log('🔍 Testando conexão com R...');
        
        exec(testCommand, { timeout: 10000 }, (error, stdout, stderr) => {
          if (error) {
            console.error('❌ R não disponível:', error.message);
            resolve({
              connected: false,
              error: error.message,
              stderr: stderr
            });
          } else {
            console.log('✅ R está disponível:', stdout.trim());
            
            // Testar pacotes essenciais (incluindo atuariais)
            const packageTest = `
              cat("📦 Testando pacotes R essenciais...\\n")
              pacotes_essenciais <- c("jsonlite", "dplyr", "tidyr", "markovchain", "lifecontingencies")
              disponiveis <- sapply(pacotes_essenciais, require, character.only = TRUE, quietly = TRUE)
              cat("Pacotes disponíveis:", paste(pacotes_essenciais[disponiveis], collapse=", "), "\\n")
              cat("Pacotes faltando:", paste(pacotes_essenciais[!disponiveis], collapse=", "), "\\n")
              
              # Testar capacidade de criar tábua básica
              if (all(c("jsonlite", "dplyr") %in% pacotes_essenciais[disponiveis])) {
                cat("✅ Pacotes básicos funcionando\\n")
              }
              
              resultado <- list(
                success = TRUE,
                r_version = R.version.string,
                platform = R.version.platform,
                packages_available = pacotes_essenciais[disponiveis],
                packages_missing = pacotes_essenciais[!disponiveis],
                actuarial_ready = "lifecontingencies" %in% pacotes_essenciais[disponiveis]
              )
              cat("\\n✅ Teste de pacotes completo\\n")
            `;
            
            // Testar pacotes
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
                actuarialReady: pkgStdout && pkgStdout.includes('actuarial_ready')
              });
            });
          }
        });

      } catch (error) {
        console.error('❌ Erro testando conexão R:', error);
        resolve({
          connected: false,
          error: error.message
        });
      }
    });
  }

  // Método auxiliar para limpeza segura
  safeCleanup(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      // Apenas log, não falhar por causa de limpeza
      console.warn(`⚠️  Não foi possível limpar arquivo ${filePath}:`, error.message);
    }
  }

  // Limpar todos os arquivos temporários antigos
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

  // NOVO: Método para verificar se um script específico existe
  async scriptExists(tipo) {
    const scriptPath = this.getRScriptPath(tipo);
    const exists = fs.existsSync(scriptPath);
    
    console.log(`🔍 Verificando script ${tipo}: ${exists ? '✅ Existe' : '❌ Não existe'} (${scriptPath})`);
    
    return {
      exists,
      path: scriptPath,
      tipo: tipo,
      isActuarial: tipo.includes('monte_carlo') || tipo.includes('markov') || 
                  tipo.includes('mortality') || tipo.includes('priori') || 
                  tipo.includes('posteriori')
    };
  }

  // NOVO: Método para listar todos os scripts disponíveis
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
    scanDir(path.join(basePath, 'data'), 'processamento');
    scanDir(path.join(basePath, 'common'), 'utils');
    
    return scripts;
  }

  // Helper para nomes amigáveis
  getDisplayName(scriptName, category) {
    const displayNames = {
      'monte_carlo': 'Simulação Monte Carlo',
      'markov': 'Cadeias de Markov',
      'mortality_table': 'Tábua de Mortalidade',
      'a_priori': 'Tarifação A Priori',
      'a_posteriori': 'Tarifação A Posteriori',
      'logistica': 'Regressão Logística',
      'arima': 'ARIMA',
      'prophet': 'Prophet',
      'random_forest': 'Random Forest'
    };
    
    return displayNames[scriptName] || scriptName.replace(/_/g, ' ');
  }

  // Helper para descrições
  getScriptDescription(scriptName, category) {
    const descriptions = {
      'monte_carlo': 'Simulação de risco atuarial com incerteza',
      'markov': 'Análise de transição de estados de sinistralidade',
      'mortality_table': 'Criação e análise de tábuas de mortalidade',
      'a_priori': 'Cálculo de prêmios baseado em modelos estatísticos',
      'a_posteriori': 'Ajuste de prêmios usando teoria da credibilidade'
    };
    
    return descriptions[scriptName] || `Modelo de ${category}`;
  }

  // NOVO: Método para testar execução de um script específico
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

  // Dados de teste para diferentes modelos
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
          sinistralidade: Math.random() * 100 + 50 * Math.sin(i / 10)
        }));
        
      case 'a_posteriori':
        return Array.from({length: 100}, (_, i) => ({
          grupo: `G${Math.floor(i / 10) + 1}`,
          ano: 2020 + (i % 3),
          sinistros: Math.floor(Math.random() * 5),
          custo: Math.random() * 5000 + 500
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
          var_analise: 'sinistralidade',
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
        
      default:
        return {};
    }
  }
}

// Exportar como singleton
const runnerInstance = new RRunner();

// Executar limpeza inicial
runnerInstance.cleanupOldTempFiles();

module.exports = {
  execRModel: (tipo, dados, parametros) => runnerInstance.execRModel(tipo, dados, parametros),
  execRCommand: (comando, dados) => runnerInstance.execRCommand(comando, dados),
  testRConnection: () => runnerInstance.testRConnection(),
  scriptExists: (tipo) => runnerInstance.scriptExists(tipo),
  listAvailableScripts: () => runnerInstance.listAvailableScripts(),
  testScriptExecution: (tipo) => runnerInstance.testScriptExecution(tipo),
  RRunner // Para testes
};