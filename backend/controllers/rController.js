// backend/controllers/rController.js
const { execRModel, execRCommand } = require('../services/rRunner');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// === SOLUÇÃO BLINDADA PARA UUID ===
let uuidv4;
try {
  // Tenta importar como CommonJS
  ({ v4: uuidv4 } = require('uuid'));
} catch (e) {
  console.log('⚠️ uuid CommonJS falhou no rController, usando fallback...');
  // Fallback simples (apenas para gerar IDs únicos)
  uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
  console.log('✅ Fallback de UUID ativado no rController');
}

class RController {
  async executarModelo(req, res) {
    try {
      const { tipo, dados, parametros } = req.body;

      console.log('🔍 RController: Executando modelo', tipo);
      console.log('   Registros:', dados?.length || 0);
      console.log('   Parâmetros:', parametros || 'Nenhum');

      if (!tipo || !dados) {
        return res.status(400).json({
          success: false,
          error: 'Tipo e dados são obrigatórios'
        });
      }

      if (!Array.isArray(dados) || dados.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Dados devem ser um array não vazio'
        });
      }

      // Validar dados mínimos
      if (dados.length < 3) {
        return res.status(400).json({
          success: false,
          error: 'É necessário pelo menos 3 observações'
        });
      }

      // Determinar qual script R usar baseado no tipo
      let scriptPath;
      let scriptDir = path.join(__dirname, '../r-engine');

      switch (tipo) {
        // ====================================================================
        // REGRESSÃO (JÁ FUNCIONAM)
        // ====================================================================
        case 'glm':
        case 'linear':
          scriptPath = path.join(scriptDir, 'regression/linear.R');
          break;
        case 'multiple':
          scriptPath = path.join(scriptDir, 'regression/multiple.R');
          break;
        case 'logistica':
          scriptPath = path.join(scriptDir, 'regression/logistica.R');
          break;

        // ====================================================================
        // SÉRIES TEMPORAIS (JÁ FUNCIONAM)
        // ====================================================================
        case 'arima':
          scriptPath = path.join(scriptDir, 'time_series/arima.R');
          break;
        case 'sarima':
          scriptPath = path.join(scriptDir, 'time_series/sarima.R');
          break;
        case 'ets':
          scriptPath = path.join(scriptDir, 'time_series/ets.R');
          break;
        case 'prophet':
          scriptPath = path.join(scriptDir, 'time_series/prophet.R');
          break;

        // ====================================================================
        // MACHINE LEARNING (JÁ FUNCIONAM)
        // ====================================================================
        case 'random_forest':
          scriptPath = path.join(scriptDir, 'ml/random_forest.R');
          break;
        case 'xgboost':
          scriptPath = path.join(scriptDir, 'ml/xgboost.R');
          break;

        // ====================================================================
        // MODELOS ATUARIAIS (JÁ FUNCIONAM)
        // ====================================================================
        case 'monte_carlo':
          scriptPath = path.join(scriptDir, 'actuarial/monte_carlo.R');
          break;
        case 'markov':
          scriptPath = path.join(scriptDir, 'actuarial/markov.R');
          break;
        case 'mortality_table':
        case 'tabua_mortalidade':
          scriptPath = path.join(scriptDir, 'actuarial/mortality_table.R');
          break;
        case 'a_priori':
          scriptPath = path.join(scriptDir, 'actuarial/a_priori.R');
          break;
        case 'a_posteriori':
          scriptPath = path.join(scriptDir, 'actuarial/a_posteriori.R');
          break;

        // ====================================================================
        // DATA MINING (com seus nomes de scripts)
        // ====================================================================
        case 'clustering':
          scriptPath = path.join(scriptDir, 'data_mining/clustering.R');
          break;
        case 'associacao':
          scriptPath = path.join(scriptDir, 'data_mining/associacao.R');
          break;
        case 'classificacao':
          scriptPath = path.join(scriptDir, 'data_mining/classificacao.R');
          break;
        case 'reducao':
          scriptPath = path.join(scriptDir, 'data_mining/reducao.R');
          break;
        case 'anomalias':
          scriptPath = path.join(scriptDir, 'data_mining/anomalias.R');
          break;

        // ====================================================================
        // BIG DATA (com seus nomes de scripts)
        // ====================================================================
        case 'spark_job':
        case 'spark':
          scriptPath = path.join(scriptDir, 'big_data/spark_jobs.R');
          break;
        case 'hadoop_analise':
        case 'hadoop':
          scriptPath = path.join(scriptDir, 'big_data/hadoop_analise.R');
          break;
        case 'streaming':
          scriptPath = path.join(scriptDir, 'big_data/streaming.R');
          break;
        case 'sql_distribuido':
        case 'sql':
          scriptPath = path.join(scriptDir, 'big_data/sql_distribuido.R');
          break;
        case 'bitdata':
        case 'data_mining':
          // Se vier genérico, tentar detectar pelo parâmetro
          if (parametros?.algoritmo) {
            const algoritmo = parametros.algoritmo.toLowerCase();
            const mapaBitData = {
              'apriori': 'apriori.R',
              'fp-growth': 'fp_growth.R',
              'fp_growth': 'fp_growth.R',
              'kmeans': 'kmeans.R',
              'k-means': 'kmeans.R',
              'hierarchical': 'hierarchical.R',
              'pca': 'pca.R'
            };
            if (mapaBitData[algoritmo]) {
              scriptPath = path.join(scriptDir, 'bitdata', mapaBitData[algoritmo]);
            } else {
              return res.status(400).json({
                success: false,
                error: `Algoritmo BitData '${algoritmo}' não reconhecido`,
                algoritmos_disponiveis: Object.keys(mapaBitData)
              });
            }
          } else {
            return res.status(400).json({
              success: false,
              error: 'Para BitData, especifique o algoritmo (apriori, fp_growth, kmeans, hierarchical, pca)'
            });
          }
          break;

        // ====================================================================
        // FALLBACK
        // ====================================================================
        default:
          return res.status(400).json({
            success: false,
            error: `Modelo '${tipo}' não implementado`,
            tipos_disponiveis: [
              'glm', 'multiple', 'logistica', 'arima', 'sarima', 'ets', 'prophet',
              'random_forest', 'xgboost', 'monte_carlo', 'markov', 'mortality_table',
              'a_priori', 'a_posteriori', 
              'clustering', 'associacao', 'classificacao', 'reducao', 'anomalias',
              'spark_job', 'hadoop_analise', 'streaming', 'sql_distribuido'
            ]
          });
      }

      // Verificar se o script existe
      if (!fs.existsSync(scriptPath)) {
        console.error('❌ Script R não encontrado:', scriptPath);
        return res.status(404).json({
          success: false,
          error: `Script R para modelo '${tipo}' não encontrado`,
          caminho_esperado: scriptPath
        });
      }

      console.log('📝 Usando script:', scriptPath);

      // Criar diretório temporário se não existir
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Criar arquivos temporários
      const inputFile = path.join(tempDir, `${uuidv4()}_input.json`);
      const outputFile = path.join(tempDir, `${uuidv4()}_output.json`);

      // Preparar dados para o R
      const inputData = {
        tipo: tipo,
        dados: dados,
        parametros: parametros || {}
      };

      // Salvar arquivo de input
      fs.writeFileSync(inputFile, JSON.stringify(inputData, null, 2));
      console.log('📄 Input criado:', inputFile);

      // Executar script R
      const command = `Rscript "${scriptPath}" "${inputFile}" "${outputFile}"`;
      console.log('🚀 Executando:', command);

      return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          console.log('📥 STDOUT do R:', stdout);
          if (stderr && stderr.trim()) {
            console.error('📥 STDERR do R:', stderr);
          }

          // Limpar arquivos temporários
          try {
            if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
          } catch (e) {
            console.warn('⚠️  Não foi possível limpar input:', e.message);
          }

          if (error) {
            console.error('❌ Erro executando R:', error.message);
            
            // Limpar output se existir
            try {
              if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
            } catch (e) {
              console.warn('⚠️  Não foi possível limpar output:', e.message);
            }

            return reject({
              success: false,
              error: `Erro executando modelo R: ${error.message}`,
              details: stderr || 'Sem detalhes adicionais'
            });
          }

          // Verificar se output foi criado
          if (!fs.existsSync(outputFile)) {
            console.error('❌ Output não criado pelo R');
            return reject({
              success: false,
              error: 'O script R não gerou resultado'
            });
          }

          // Ler resultado
          try {
            const resultado = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
            
            // 🔥 CORREÇÃO: Verificar se os dados estão em resultado ou em resultado.resultado
            const dadosResultado = resultado.resultado || resultado;
            
            console.log('📊 Resultado do R:', {
              success: resultado.success,
              temResultado: !!resultado.resultado,
              temClusters: dadosResultado.clusters ? dadosResultado.clusters.length : 0,
              temCentroides: dadosResultado.centroides ? dadosResultado.centroides.length : 0,
              temMetricas: !!dadosResultado.metricas
            });

            // Adicionar metadados
            resultado.timestamp = new Date().toISOString();
            resultado.tipo_modelo = tipo;
            resultado.n_registros = dados.length;

            // Limpar output
            try {
              fs.unlinkSync(outputFile);
            } catch (e) {
              console.warn('⚠️  Não foi possível limpar output:', e.message);
            }

            console.log('✅ Modelo executado com sucesso');
            
            resolve({
              success: true,
              ...resultado  // Mantém a estrutura original com resultado.resultado
            });

          } catch (parseError) {
            console.error('❌ Erro parseando resultado:', parseError.message);
            
            // Limpar output
            try {
              if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
            } catch (e) {
              console.warn('⚠️  Não foi possível limpar output:', e.message);
            }
            
            reject({
              success: false,
              error: 'Erro processando resultado do R',
              details: parseError.message
            });
          }
        });
      }).then(resultado => {
        res.json(resultado);
      }).catch(error => {
        res.status(500).json(error);
      });

    } catch (error) {
      console.error('❌ Erro no RController:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno no servidor',
        details: error.message || 'Erro desconhecido'
      });
    }
  }

  async processarDados(req, res) {
    try {
      const { dados, operacao, parametros } = req.body;

      console.log('🔍 Processando dados:', operacao);
      
      if (!dados || !Array.isArray(dados)) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos'
        });
      }

      const resultado = await execRCommand('processamento', {
        dados,
        operacao,
        parametros: parametros || {}
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        ...resultado
      });

    } catch (error) {
      console.error('Erro no processamento:', error);
      res.status(500).json({
        success: false,
        error: 'Erro no processamento de dados',
        details: error.message
      });
    }
  }

  async gerarVisualizacao(req, res) {
    try {
      const { dados, tipo, parametros } = req.body;

      console.log('🔍 Gerando visualização:', tipo);
      
      if (!dados || !Array.isArray(dados)) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos para visualização'
        });
      }

      const resultado = await execRCommand('visualizacao', {
        dados,
        tipo,
        parametros: parametros || {}
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        ...resultado
      });

    } catch (error) {
      console.error('Erro na visualização:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao gerar visualização',
        details: error.message
      });
    }
  }

  async interpretarResultados(req, res) {
    try {
      const { dados, modelo, parametros } = req.body;

      console.log('🔍 Interpretando resultados para modelo:', modelo);
      
      if (!dados || !modelo) {
        return res.status(400).json({
          success: false,
          error: 'Dados e modelo são obrigatórios'
        });
      }

      const resultado = await execRCommand('interpretacao', {
        dados,
        modelo,
        parametros: parametros || {}
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        ...resultado
      });

    } catch (error) {
      console.error('Erro na interpretação:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao interpretar resultados',
        details: error.message
      });
    }
  }

  async uploadDados(req, res) {
    try {
      const dados = req.body.dados || req.body;

      console.log('🔍 Upload de dados:', dados?.length || 0, 'registros');
      
      if (!dados || !Array.isArray(dados) || dados.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos ou vazios'
        });
      }

      const resultado = await execRCommand('dados', {
        operacao: 'upload',
        dados,
        parametros: req.body.parametros || {}
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        mensagem: 'Dados processados com sucesso',
        n_registros: dados.length,
        ...resultado
      });

    } catch (error) {
      console.error('Erro no upload de dados:', error);
      res.status(500).json({
        success: false,
        error: 'Erro no upload de dados',
        details: error.message
      });
    }
  }

  async getModelosDisponiveis(req, res) {
    try {
      console.log('🔍 Listando modelos disponíveis');
      
      const modelos = [
        // ====================================================================
        // REGRESSÃO
        // ====================================================================
        {
          id: 'glm',
          nome: 'Regressão Linear (GLM)',
          descricao: 'Modelo linear generalizado - DADOS REAIS',
          categoria: 'regressao',
          parametros: ['y', 'x', 'family'],
          script: 'regression/linear.R'
        },
        {
          id: 'multiple',
          nome: 'Regressão Linear Múltipla',
          descricao: 'Regressão com múltiplas variáveis preditoras - DADOS REAIS',
          categoria: 'regressao',
          parametros: ['y', 'x_multiplas'],
          script: 'regression/multiple.R'
        },
        {
          id: 'logistica',
          nome: 'Regressão Logística',
          descricao: 'Modelo para classificação binária (0/1) - DADOS REAIS',
          categoria: 'regressao',
          parametros: ['y', 'x', 'link', 'familia'],
          script: 'regression/logistica.R'
        },

        // ====================================================================
        // SÉRIES TEMPORAIS
        // ====================================================================
        {
          id: 'arima',
          nome: 'ARIMA',
          descricao: 'Modelo de séries temporais - DADOS REAIS',
          categoria: 'series_temporais',
          parametros: ['y', 'p', 'd', 'q', 'frequencia'],
          script: 'time_series/arima.R'
        },
        {
          id: 'sarima',
          nome: 'SARIMA',
          descricao: 'Modelo ARIMA sazonal - DADOS REAIS',
          categoria: 'series_temporais',
          parametros: ['y', 'p', 'd', 'q', 'P', 'D', 'Q', 'frequencia'],
          script: 'time_series/sarima.R'
        },
        {
          id: 'ets',
          nome: 'ETS',
          descricao: 'Suavização exponencial - DADOS REAIS',
          categoria: 'series_temporais',
          parametros: ['y', 'model', 'seasonal'],
          script: 'time_series/ets.R'
        },
        {
          id: 'prophet',
          nome: 'Prophet',
          descricao: 'Modelo de séries temporais do Facebook - DADOS REAIS',
          categoria: 'series_temporais',
          parametros: ['y', 'date_column', 'seasonality'],
          script: 'time_series/prophet.R'
        },

        // ====================================================================
        // MACHINE LEARNING
        // ====================================================================
        {
          id: 'random_forest',
          nome: 'Random Forest',
          descricao: 'Floresta aleatória para classificação/regressão - DADOS REAIS',
          categoria: 'ml',
          parametros: ['y', 'n_trees', 'max_depth'],
          script: 'ml/random_forest.R'
        },
        {
          id: 'xgboost',
          nome: 'XGBoost',
          descricao: 'Gradient boosting extremo - DADOS REAIS',
          categoria: 'ml',
          parametros: ['y', 'n_estimators', 'learning_rate'],
          script: 'ml/xgboost.R'
        },

        // ====================================================================
        // MODELOS ATUARIAIS
        // ====================================================================
        {
          id: 'monte_carlo',
          nome: 'Simulação Monte Carlo Atuarial',
          descricao: 'Simulação de risco e cálculo de prêmios com incerteza - DADOS REAIS',
          categoria: 'atuaria',
          parametros: ['modelo_freq', 'modelo_sev', 'n_sim', 'vol_freq', 'vol_sev'],
          script: 'actuarial/monte_carlo.R'
        },
        {
          id: 'markov',
          nome: 'Cadeias de Markov',
          descricao: 'Análise de transição de estados de sinistralidade - DADOS REAIS',
          categoria: 'atuaria',
          parametros: ['var_analise', 'n_estados', 'nomes_estados', 'metodo'],
          script: 'actuarial/markov.R'
        },
        {
          id: 'mortality_table',
          nome: 'Tábua de Mortalidade',
          descricao: 'Criação e análise de tábuas de mortalidade - DADOS REAIS',
          categoria: 'atuaria',
          parametros: ['base_mortalidade', 'idade_min', 'idade_max', 'qx_adjust', 'sexo'],
          script: 'actuarial/mortality_table.R'
        },
        {
          id: 'a_priori',
          nome: 'Tarifação A Priori',
          descricao: 'Cálculo de prêmios baseado em modelos GLM - DADOS REAIS',
          categoria: 'atuaria',
          parametros: ['modelo_freq', 'modelo_sev', 'margem_seguranca', 'despesas_admin'],
          script: 'actuarial/a_priori.R'
        },
        {
          id: 'a_posteriori',
          nome: 'Tarifação A Posteriori (Credibility)',
          descricao: 'Ajuste de prêmios baseado em experiência histórica - DADOS REAIS',
          categoria: 'atuaria',
          parametros: ['grupo_var', 'tempo_var', 'sinistro_var', 'custo_var', 'metodo'],
          script: 'actuarial/a_posteriori.R'
        },

        // ====================================================================
        // DATA MINING (NOVOS)
        // ====================================================================
        {
          id: 'clustering',
          nome: 'Clustering (Agrupamento)',
          descricao: 'Algoritmos de agrupamento: K-Means, DBSCAN, Hierárquico - DADOS REAIS',
          categoria: 'data_mining',
          parametros: ['algoritmo', 'n_clusters', 'metodo_linkage'],
          script: 'data_mining/clustering.R'
        },
        {
          id: 'associacao',
          nome: 'Associação (Regras)',
          descricao: 'Regras de associação: Apriori, FP-Growth - DADOS REAIS',
          categoria: 'data_mining',
          parametros: ['algoritmo', 'suporte_min', 'confianca_min'],
          script: 'data_mining/associacao.R'
        },
        {
          id: 'classificacao',
          nome: 'Classificação',
          descricao: 'Algoritmos de classificação supervisionada - DADOS REAIS',
          categoria: 'data_mining',
          parametros: ['algoritmo', 'target', 'features'],
          script: 'data_mining/classificacao.R'
        },
        {
          id: 'reducao',
          nome: 'Redução de Dimensionalidade',
          descricao: 'PCA, t-SNE, UMAP - DADOS REAIS',
          categoria: 'data_mining',
          parametros: ['algoritmo', 'n_componentes'],
          script: 'data_mining/reducao.R'
        },
        {
          id: 'anomalias',
          nome: 'Detecção de Anomalias',
          descricao: 'Isolation Forest, LOF, One-Class SVM - DADOS REAIS',
          categoria: 'data_mining',
          parametros: ['algoritmo', 'contamination'],
          script: 'data_mining/anomalias.R'
        },

        // ====================================================================
        // BIG DATA (NOVOS)
        // ====================================================================
        {
          id: 'spark_job',
          nome: 'Spark Jobs',
          descricao: 'Processamento distribuído com Apache Spark - DADOS REAIS',
          categoria: 'big_data',
          parametros: ['job_type', 'colunas', 'n_particioes'],
          script: 'big_data/spark_jobs.R'
        },
        {
          id: 'hadoop_analise',
          nome: 'Hadoop Análise',
          descricao: 'Análise estilo MapReduce - DADOS REAIS',
          categoria: 'big_data',
          parametros: ['operacao', 'n_mappers', 'n_reducers'],
          script: 'big_data/hadoop_analise.R'
        },
        {
          id: 'streaming',
          nome: 'Streaming',
          descricao: 'Processamento de dados em tempo real - DADOS REAIS',
          categoria: 'big_data',
          parametros: ['window_size', 'slide_size', 'operacao'],
          script: 'big_data/streaming.R'
        },
        {
          id: 'sql_distribuido',
          nome: 'SQL Distribuído',
          descricao: 'Consultas SQL em dados distribuídos - DADOS REAIS',
          categoria: 'big_data',
          parametros: ['query', 'n_particioes'],
          script: 'big_data/sql_distribuido.R'
        }
      ];

      // Verificar quais scripts realmente existem
      const modelosDisponiveis = modelos.filter(modelo => {
        const scriptPath = path.join(__dirname, '../r-engine', modelo.script);
        const existe = fs.existsSync(scriptPath);
        if (!existe) {
          console.warn(`⚠️  Script não encontrado: ${modelo.script}`);
        }
        return existe;
      });

      console.log(`✅ Modelos disponíveis: ${modelosDisponiveis.length} de ${modelos.length}`);

      res.json({
        success: true,
        modelos: modelosDisponiveis,
        timestamp: new Date().toISOString(),
        mensagem: 'Modelos disponíveis carregados',
        total: modelosDisponiveis.length,
        categorias: [...new Set(modelosDisponiveis.map(m => m.categoria))]
      });

    } catch (error) {
      console.error('Erro ao obter modelos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter modelos disponíveis',
        details: error.message
      });
    }
  }

  // Método para testar conexão com R
  async testarConexao(req, res) {
    try {
      console.log('🔍 Testando conexão com R...');
      
      const testScript = `
        cat("✅ R está funcionando!\\n")
        cat("Versão do R:", R.version.string, "\\n")
        cat("Plataforma:", R.version.platform, "\\n")
        
        # Testar pacotes essenciais
        pacotes <- c("jsonlite", "dplyr", "caret", "arules", "cluster", "FactoMineR")
        disponiveis <- c()
        
        for (pkg in pacotes) {
          if (require(pkg, character.only = TRUE, quietly = TRUE)) {
            cat("✅ Pacote", pkg, "disponível\\n")
            disponiveis <- c(disponiveis, pkg)
          } else {
            cat("❌ Pacote", pkg, "NÃO disponível\\n")
          }
        }
        
        # Retornar resultado
        resultado <- list(
          success = TRUE,
          r_version = R.version.string,
          platform = R.version.platform,
          timestamp = Sys.time(),
          packages_available = disponiveis,
          working_directory = getwd()
        )
        
        cat("\\n✅ Teste de conexão completo\\n")
        cat(toJSON(resultado, auto_unbox = TRUE, pretty = TRUE))
      `;

      // Criar arquivo temporário
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const testFile = path.join(tempDir, `test_${uuidv4()}.R`);
      fs.writeFileSync(testFile, testScript);

      // Executar teste
      return new Promise((resolve, reject) => {
        exec(`Rscript "${testFile}"`, (error, stdout, stderr) => {
          // Limpar arquivo
          try {
            fs.unlinkSync(testFile);
          } catch (e) {
            console.warn('⚠️  Não foi possível limpar arquivo de teste:', e.message);
          }

          console.log('📥 Output do teste R:', stdout);
          if (stderr) console.error('📥 Stderr do teste R:', stderr);

          if (error) {
            console.error('❌ Falha no teste de conexão R:', error.message);
            resolve({
              connected: false,
              error: error.message,
              stdout: stdout,
              stderr: stderr
            });
          } else {
            console.log('✅ Conexão com R testada com sucesso');
            resolve({
              connected: true,
              message: 'R está funcionando corretamente',
              stdout: stdout,
              timestamp: new Date().toISOString()
            });
          }
        });
      }).then(resultado => {
        res.json({
          success: true,
          ...resultado
        });
      });

    } catch (error) {
      console.error('❌ Erro no teste de conexão:', error);
      res.json({
        success: true,
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // ========================================================================
  // MÉTODOS AUXILIARES (NOVOS)
  // ========================================================================

  // Verificar scripts atuariais
  async verificarScriptsAtuariais(req, res) {
    try {
      const scriptDir = path.join(__dirname, '../r-engine/actuarial');
      const scripts = [
        'monte_carlo.R',
        'markov.R', 
        'mortality_table.R',
        'a_priori.R',
        'a_posteriori.R'
      ];
      
      const resultados = {};
      for (const script of scripts) {
        const scriptPath = path.join(scriptDir, script);
        resultados[script] = fs.existsSync(scriptPath);
        if (!resultados[script]) {
          console.warn(`⚠️ Script atuarial não encontrado: ${script}`);
        }
      }
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        scripts: resultados,
        todosExistem: Object.values(resultados).every(v => v === true)
      });
    } catch (error) {
      console.error('Erro ao verificar scripts:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao verificar scripts',
        details: error.message
      });
    }
  }

  // Verificar scripts BitData
  async verificarScriptsBitData(req, res) {
    try {
      const scriptDir = path.join(__dirname, '../r-engine/bitdata');
      const scripts = [
        'apriori.R',
        'fp_growth.R', 
        'kmeans.R',
        'hierarchical.R',
        'pca.R'
      ];
      
      const resultados = {};
      for (const script of scripts) {
        const scriptPath = path.join(scriptDir, script);
        resultados[script] = fs.existsSync(scriptPath);
        if (!resultados[script]) {
          console.warn(`⚠️ Script BitData não encontrado: ${script}`);
        }
      }
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        scripts: resultados,
        todosExistem: Object.values(resultados).every(v => v === true)
      });
    } catch (error) {
      console.error('Erro ao verificar scripts BitData:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao verificar scripts BitData',
        details: error.message
      });
    }
  }

  // Rota de saúde simplificada
  async health(req, res) {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'R Controller está funcionando'
    });
  }
}

module.exports = new RController();