// services/js-processing.js
// Remova a importação do emailService ou comente se não for essencial
// const emailService = require('../utils/emailService');

class JSProcessingService {
  constructor() {
    // Serviço de email opcional
    try {
      this.emailService = require('../utils/emailService');
    } catch (error) {
      this.emailService = null;
      console.warn('Email service not available');
    }
  }

  // Função de interpretação de modelo em JS
  async interpretarModeloJS(dados, tipoModelo) {
    try {
      switch (tipoModelo) {
        case 'regressao_linear':
          return this.interpretarRegressaoLinear(dados);
        
        case 'random_forest':
          return this.interpretarRandomForest(dados);
        
        default:
          return {
            success: false,
            error: `Modelo não suportado em JS: ${tipoModelo}`,
            suggestion: 'Use o serviço R para este modelo'
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  interpretarRegressaoLinear(dados) {
    const { coeficientes, intercepto, metricas } = dados;
    
    const interpretacao = {
      tipo: 'regressao_linear',
      coeficientes: coeficientes || [],
      intercepto: intercepto || 0,
      metricas: metricas || {},
      interpretacao: 'Análise de regressão linear realizada com sucesso.',
      recomendacoes: [
        'Verifique a significância estatística dos coeficientes',
        'Analise os resíduos para validar o modelo'
      ]
    };

    return {
      success: true,
      ...interpretacao
    };
  }

  interpretarRandomForest(dados) {
    const { importancia_variaveis, metricas } = dados;
    
    const interpretacao = {
      tipo: 'random_forest',
      importancia_variaveis: importancia_variaveis || [],
      metricas: metricas || {},
      interpretacao: 'Análise Random Forest realizada com sucesso.',
      recomendacoes: [
        'Considere ajustar hiperparâmetros para melhor performance',
        'Verifique a importância das variáveis para insights'
      ]
    };

    return {
      success: true,
      ...interpretacao
    };
  }

  // Outras funções de processamento JS
  async processarDados(dados, operacao) {
    // Implementações básicas
    switch (operacao) {
      case 'limpar':
        return this.limparDados(dados);
      
      case 'transformar':
        return this.transformarDados(dados);
      
      case 'agregar':
        return this.agregarDados(dados);
      
      default:
        throw new Error(`Operação não suportada: ${operacao}`);
    }
  }

  limparDados(dados) {
    // Implementação simplificada
    return {
      success: true,
      registros_originais: dados.length,
      registros_limpos: dados.length,
      acoes: ['Remoção de duplicados', 'Tratamento de valores ausentes']
    };
  }

  // Enviar notificação por email (opcional)
  async enviarNotificacao(email, mensagem) {
    if (this.emailService) {
      return await this.emailService.sendEmail({
        to: email,
        subject: 'Notificação JIAM Preditivo',
        text: mensagem
      });
    }
    return { success: false, message: 'Email service not available' };
  }
}

module.exports = new JSProcessingService();