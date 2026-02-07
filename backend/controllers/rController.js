// backend/controllers/rController.js
const { execRModel, execRCommand } = require('../services/rRunner');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');

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
  case 'glm':
  case 'linear':
    scriptPath = path.join(scriptDir, 'regression/linear.R');
    break;
  case 'multiple':
    scriptPath = path.join(scriptDir, 'regression/multiple.R');
    break;
  case 'logistica':  // <-- ADICIONAR ESTE CASO
    scriptPath = path.join(scriptDir, 'regression/logistica.R');
    break;
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
  case 'random_forest':
    scriptPath = path.join(scriptDir, 'ml/random_forest.R');
    break;
  case 'xgboost':
    scriptPath = path.join(scriptDir, 'ml/xgboost.R');
    break;
  // Adicione este case no switch (tipo) no método executarModelo:

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
  default:
    return res.status(400).json({
      success: false,
      error: `Modelo '${tipo}' não implementado`
    });
}


      // Verificar se o script existe
      if (!fs.existsSync(scriptPath)) {
        console.error('❌ Script R não encontrado:', scriptPath);
        return res.status(404).json({
          success: false,
          error: `Script R para modelo '${tipo}' não encontrado`
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
            console.log('📊 Resultado do R:', {
  success: resultado.success,
  simulacao: resultado.simulacao,
  temCoeficientes: resultado.coeficientes && typeof resultado.coeficientes === 'object',
  coeficientesCount: resultado.coeficientes ? Object.keys(resultado.coeficientes).length : 0
});

            // VERIFICAÇÃO CRÍTICA: Rejeitar se for simulação
            if (resultado.simulacao === true) {
              console.error('❌ ATENÇÃO: Script R retornou dados simulados!');
              
              // Limpar output
              try {
                fs.unlinkSync(outputFile);
              } catch (e) {
                console.warn('⚠️  Não foi possível limpar output:', e.message);
              }
              
              return reject({
                success: false,
                error: 'O script R retornou dados simulados. Verifique o script.',
                code: 'SIMULATION_DETECTED'
              });
            }

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
console.log('   Coeficientes encontrados:', resultado.coeficientes ? Object.keys(resultado.coeficientes).length : 0);
            resolve({
              success: true,
              ...resultado
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

      // Usar o runner R existente ou implementar específico para processamento
      const resultado = await execRCommand('processamento', {
        dados,
        operacao,
        parametros: parametros || {}
      });

      // Verificar se resultado não é simulação
      if (resultado.simulacao === true) {
        console.error('❌ Processamento retornou dados simulados');
        return res.status(500).json({
          success: false,
          error: 'Erro no processamento: dados simulados detectados'
        });
      }

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

      // Verificar se resultado não é simulação
      if (resultado.simulacao === true) {
        console.error('❌ Visualização retornou dados simulados');
        return res.status(500).json({
          success: false,
          error: 'Erro na visualização: dados simulados detectados'
        });
      }

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

      // Verificar se resultado não é simulação
      if (resultado.simulacao === true) {
        console.error('❌ Interpretação retornou dados simulados');
        return res.status(500).json({
          success: false,
          error: 'Erro na interpretação: dados simulados detectados'
        });
      }

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
      
      // Validar dados
      if (!dados || !Array.isArray(dados) || dados.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos ou vazios'
        });
      }

      // Processar dados (normalizar, limpar, etc.)
      const resultado = await execRCommand('dados', {
        operacao: 'upload',
        dados,
        parametros: req.body.parametros || {}
      });

      // Verificar se resultado não é simulação
      if (resultado.simulacao === true) {
        console.error('❌ Upload retornou dados simulados');
        return res.status(500).json({
          success: false,
          error: 'Erro no upload: dados simulados detectados'
        });
      }

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
        id: 'logistica',  // <-- ADICIONAR ESTE
        nome: 'Regressão Logística',
        descricao: 'Modelo para classificação binária (0/1) - DADOS REAIS',
        categoria: 'regressao',
        parametros: ['y', 'x', 'link', 'familia'],
        script: 'regression/logistica.R'
      },
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
        
        // No método getModelosDisponiveis, adicione estes modelos à lista:

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
        total: modelosDisponiveis.length
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

  // Novo método para testar conexão com R
  async testarConexao(req, res) {
    try {
      console.log('🔍 Testando conexão com R...');
      
      const testScript = `
        cat("✅ R está funcionando!\\n")
        cat("Versão do R:", R.version.string, "\\n")
        cat("Plataforma:", R.version.platform, "\\n")
        
        # Testar pacotes essenciais
        pacotes <- c("jsonlite", "dplyr", "caret")
        for (pkg in pacotes) {
          if (require(pkg, character.only = TRUE, quietly = TRUE)) {
            cat("✅ Pacote", pkg, "disponível\\n")
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
          packages_available = pacotes[sapply(pacotes, require, character.only = TRUE, quietly = TRUE)]
        )
        
        cat("\\n✅ Teste de conexão completo\\n")
        print(resultado)
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
}

module.exports = new RController();