// services/modelInterpretationService.js
const math = require('mathjs');

class ModelInterpretationService {
  constructor() {
    this.formatNumber = this.formatNumber.bind(this);
  }

  // =================== FORMATADOR DE NÚMEROS ===================
  formatNumber(x, options = {}) {
    const { 
      digits = 2, 
      type = 'auto', 
      unit = null,
      locale = 'pt-BR'
    } = options;

    if (x === null || x === undefined || isNaN(x)) return 'N/A';

    const num = parseFloat(x);
    
    const formatScientific = (val, digs = 3) => {
      return val.toExponential(digs);
    };

    let formatted;

    switch(type) {
      case 'contabilistico':
        formatted = num.toLocaleString(locale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          useGrouping: true
        });
        formatted = formatted.replace(/\./g, '|').replace(/,/g, '.').replace(/\|/g, ',');
        break;

      case 'cientifico':
        formatted = formatScientific(num, 3);
        break;

      case 'fixo':
      case 'auto':
        if (Math.abs(num) >= 1e6 || Math.abs(num) < 1e-4) {
          formatted = formatScientific(num, 3);
        } else if (Math.abs(num) >= 1) {
          formatted = num.toFixed(2);
        } else {
          formatted = num.toFixed(4);
        }
        
        if (type === 'auto' || type === 'fixo') {
          formatted = formatted.replace('.', ',');
          formatted = formatted.replace(/,?0+$/, '');
          formatted = formatted.replace(/,$/, '');
        }
        break;

      default:
        formatted = num.toString();
    }

    if (unit) {
      return `${formatted} ${unit}`;
    }

    return formatted;
  }

  // =================== INTERPRETAR MODELO ===================
  async interpretModel(model, data = null, options = {}) {
    try {
      const modelType = this.detectModelType(model);
      
      let interpretation;
      
      switch(modelType) {
        case 'linear_regression':
          interpretation = await this.interpretLinearRegression(model, data);
          break;
        
        case 'random_forest_regression':
        case 'random_forest_classification':
          interpretation = await this.interpretRandomForest(model, data, modelType);
          break;
        
        default:
          throw new Error(`Modelo não suportado: ${modelType}`);
      }

      return {
        success: true,
        model_type: modelType,
        interpretation: interpretation.text,
        metrics: interpretation.metrics,
        coefficients: interpretation.coefficients,
        variable_importance: interpretation.variable_importance,
        recommendations: interpretation.recommendations
      };

    } catch (error) {
      console.error('Erro na interpretação do modelo:', error);
      return {
        success: false,
        error: error.message,
        model_type: 'unknown'
      };
    }
  }

  // =================== DETECTAR TIPO DE MODELO ===================
  detectModelType(model) {
    if (model.$linearRegression) return 'linear_regression';
    if (model.$randomForest) return model.type === 'classification' ? 
      'random_forest_classification' : 'random_forest_regression';
    
    if (model.coefficients && Array.isArray(model.coefficients)) {
      return 'linear_regression';
    }
    
    if (model.importance && model.importance.length > 0) {
      return 'random_forest_regression';
    }
    
    throw new Error('Não foi possível identificar o tipo de modelo');
  }

  // =================== REGRESSÃO LINEAR ===================
  async interpretLinearRegression(model, data) {
    const interpretation = [];
    const metrics = {};
    
    const coefficients = model.coefficients || [];
    const intercept = model.intercept || 0;
    
    let r2 = model.r2;
    if (!r2 && data && data.x && data.y) {
      r2 = this.calculateR2(data.x, data.y, model);
    }
    
    if (data && data.x && data.y) {
      const predictions = this.predictLinear(data.x, model);
      metrics.rmse = this.calculateRMSE(data.y, predictions);
      metrics.mae = this.calculateMAE(data.y, predictions);
      metrics.mse = this.calculateMSE(data.y, predictions);
    }
    
    metrics.r2 = r2 || 0;
    metrics.r2_adj = model.r2_adj || 0;
    metrics.aic = model.aic || 0;
    metrics.bic = model.bic || 0;
    metrics.p_value = model.p_value || 0;
    
    interpretation.push("📊 **Regressão Linear**");
    interpretation.push("Analisa o impacto de cada variável independente sobre a variável dependente.");
    
    if (intercept !== 0) {
      interpretation.push(
        `- **Intercepto:** ${this.formatNumber(intercept, { type: 'contabilistico' })} ` +
        "representa o valor base quando todas as variáveis independentes são zero."
      );
    }
    
    coefficients.forEach((coef, index) => {
      const varName = coef.name || `Variável ${index + 1}`;
      const value = coef.value;
      const pValue = coef.p_value || 0.05;
      const significance = pValue < 0.05 ? "estatisticamente significativo" : "não significativo";
      const direction = value > 0 ? "aumenta" : "diminui";
      
      interpretation.push(
        `- **${varName}:** Coeficiente ${this.formatNumber(value, { type: 'contabilistico' })} ` +
        `indica que, ao aumentar ${varName} em 1 unidade, o resultado ${direction} em ` +
        `${this.formatNumber(Math.abs(value), { type: 'contabilistico' })} unidades ` +
        `(${significance}; p‑valor = ${this.formatNumber(pValue, { type: 'cientifico' })}).`
      );
    });
    
    interpretation.push("");
    interpretation.push("**Métricas de Qualidade do Modelo:**");
    interpretation.push(`- **RMSE:** ${this.formatNumber(metrics.rmse, { type: 'contabilistico' })} (Raiz do erro quadrático médio)`);
    interpretation.push(`- **MAE:** ${this.formatNumber(metrics.mae, { type: 'contabilistico' })} (Erro absoluto médio)`);
    interpretation.push(`- **MSE:** ${this.formatNumber(metrics.mse, { type: 'contabilistico' })} (Erro quadrático médio)`);
    interpretation.push(`- **R²:** ${this.formatNumber(metrics.r2, { type: 'contabilistico' })} (Explica ${this.formatNumber(metrics.r2 * 100, { digits: 1 })}% da variação)`);
    interpretation.push(`- **R² Ajustado:** ${this.formatNumber(metrics.r2_adj, { type: 'contabilistico' })}`);
    interpretation.push(`- **AIC:** ${this.formatNumber(metrics.aic, { type: 'contabilistico' })} (Quanto menor, melhor)`);
    interpretation.push(`- **BIC:** ${this.formatNumber(metrics.bic, { type: 'contabilistico' })}`);
    
    const significantVars = coefficients.filter(c => c.p_value < 0.05).length;
    const recommendations = [];
    
    if (significantVars === 0) {
      recommendations.push(
        "⚠️ **Recomendação:** Nenhuma variável é estatisticamente significativa. " +
        "Considere coletar mais dados ou revisar as variáveis do modelo."
      );
    } else if (significantVars === 1) {
      const significantVar = coefficients.find(c => c.p_value < 0.05);
      recommendations.push(
        `🎯 **Recomendação:** Apenas '${significantVar.name}' é significativa. ` +
        "Foque nessa variável para intervenções práticas."
      );
    } else {
      const topVar = coefficients.reduce((max, c) => 
        Math.abs(c.value) > Math.abs(max.value) ? c : max
      );
      recommendations.push(
        `📊 **Recomendação:** ${significantVars} variáveis são significativas. ` +
        `A variável '${topVar.name}' tem o maior impacto. Considere todas para decisões.`
      );
    }
    
    if (metrics.r2 < 0.5) {
      recommendations.push(
        "📉 **Observação:** R² baixo sugere que outros fatores não incluídos no modelo " +
        "influenciam a variável dependente."
      );
    } else {
      recommendations.push(
        "📈 **Observação:** R² adequado indica boa capacidade explicativa do modelo."
      );
    }
    
    return {
      text: interpretation.join('\n'),
      metrics,
      coefficients,
      variable_importance: this.calculateVariableImportance(coefficients),
      recommendations: recommendations.join('\n')
    };
  }

  // =================== RANDOM FOREST ===================
  async interpretRandomForest(model, data, modelType) {
    const interpretation = [];
    
    interpretation.push(
      modelType === 'random_forest_classification' 
        ? "🌳 **Random Forest - Classificação**"
        : "🌳 **Random Forest - Regressão**"
    );
    
    const importance = model.importance || model.variable_importance || [];
    
    if (importance.length > 0) {
      interpretation.push("**Importância das Variáveis (por Permutação):**");
      
      const maxImportance = Math.max(...importance.map(i => i.value));
      const normalized = importance.map(item => ({
        ...item,
        percentage: (item.value / maxImportance) * 100
      })).sort((a, b) => b.percentage - a.percentage);
      
      normalized.forEach((item, index) => {
        interpretation.push(
          `- **${item.name}:** ${this.formatNumber(item.percentage, { digits: 1 })}%`
        );
      });
      
      // LINHA 295 CORRIGIDA AQUI:
      if (normalized.length >= 2) {
        interpretation.push("");
        interpretation.push(
          `🔍 **Análise:** A variável '${normalized[0].name}' tem a maior importância ` +
          `(${this.formatNumber(normalized[0].percentage, { digits: 1 })}%). ` +
          `Seguida por '${normalized[1].name}' (${this.formatNumber(normalized[1].percentage, { digits: 1 })}%).`
        );
      }
    } else {
      interpretation.push("ℹ️ Importância das variáveis não disponível para este modelo.");
    }
    
    if (model.metrics) {
      interpretation.push("");
      interpretation.push("**Métricas do Modelo:**");
      Object.entries(model.metrics).forEach(([key, value]) => {
        interpretation.push(`- ${key}: ${this.formatNumber(value, { type: 'contabilistico' })}`);
      });
    }
    
    return {
      text: interpretation.join('\n'),
      metrics: model.metrics || {},
      variable_importance: importance,
      coefficients: [],
      recommendations: this.generateRandomForestRecommendations(importance)
    };
  }

  // =================== INTERPRETAR SIMULAÇÃO ===================
  async interpretSimulation(inputValues, model, dependentVariable, options = {}) {
    const interpretation = [];
    
    const coefficients = model.coefficients || [];
    const intercept = model.intercept || 0;
    
    const contributions = {};
    let totalEstimate = intercept;
    
    coefficients.forEach(coef => {
      const varName = coef.name;
      const inputValue = inputValues[varName] || 0;
      const contribution = coef.value * inputValue;
      
      contributions[varName] = {
        coefficient: coef.value,
        input: inputValue,
        contribution: contribution,
        direction: coef.value > 0 ? "positiva" : "negativa"
      };
      
      totalEstimate += contribution;
    });
    
    const positiveVariables = [
      'salario', 'idade', 'tempo', 'clientes', 'funcionarios', 'populacao',
      'anos', 'meses', 'horas', 'turmas', 'experiencia', 'atendimentos',
      'vendas', 'capacidade', 'producao', 'acessos', 'utilizadores',
      'alunos', 'docentes', 'frequencia', 'crescimento', 'visitas',
      'atividades', 'provas', 'cursos', 'empregados', 'investimento',
      'receita', 'matriculas', 'solicitacoes'
    ];
    
    const isPositiveVariable = positiveVariables.some(v => 
      dependentVariable.toLowerCase().includes(v)
    );
    
    const hasNegativeWarning = isPositiveVariable && totalEstimate < 0;
    const finalEstimate = hasNegativeWarning ? 0 : totalEstimate;
    
    interpretation.push("📊 **Interpretação da Simulação do Modelo Preditivo**");
    interpretation.push("");
    interpretation.push(
      `Este resultado foi obtido com base num modelo de regressão linear ` +
      `que estima a variável dependente **${dependentVariable}** a partir de ` +
      `variáveis explicativas selecionadas.`
    );
    interpretation.push("");
    interpretation.push(
      "A variável dependente representa o fenómeno que se pretende prever ou compreender, " +
      "enquanto as variáveis independentes são os fatores que exercem influência direta."
    );
    interpretation.push("");
    interpretation.push(
      `🔹 **Intercepto (constante):** ${this.formatNumber(intercept, { type: 'contabilistico' })}`
    );
    interpretation.push(
      "Este é o valor base estimado quando todas as variáveis explicativas assumem valor zero."
    );
    interpretation.push("");
    
    Object.entries(contributions).forEach(([varName, info]) => {
      interpretation.push(`🔸 **${varName}**`);
      interpretation.push(`- Coeficiente: ${this.formatNumber(info.coefficient, { type: 'contabilistico' })}`);
      interpretation.push(`- Valor informado: ${this.formatNumber(info.input, { type: 'contabilistico' })}`);
      interpretation.push(`- Contribuição: ${this.formatNumber(info.contribution, { type: 'contabilistico' })}`);
      interpretation.push(
        `- Interpretação: Um acréscimo unitário em **${varName}** tende a ` +
        `${info.direction === "positiva" ? "aumentar" : "reduzir"} o valor de **${dependentVariable}** ` +
        `em aproximadamente ${this.formatNumber(Math.abs(info.coefficient), { type: 'contabilistico' })}, ` +
        `mantendo as demais variáveis constantes.`
      );
      interpretation.push("");
    });
    
    interpretation.push(`📌 **Resultado Estimado para ${dependentVariable}:** ${this.formatNumber(finalEstimate, { type: 'contabilistico' })}`);
    interpretation.push("");
    
    if (hasNegativeWarning) {
      interpretation.push(
        "⚠️ O valor estimado original foi negativo, mas foi ajustado para 0 " +
        "por não fazer sentido prático (ex: tempo ou população não pode ser negativo)."
      );
      interpretation.push("");
    } else {
      interpretation.push(
        "Este valor representa a previsão pontual para o cenário simulado, " +
        "podendo embasar decisões, análises de sensibilidade e projeções futuras."
      );
      interpretation.push("");
    }
    
    interpretation.push("📍 **Orientações Práticas:**");
    interpretation.push(
      "- Para **reduzir** o valor estimado, priorize reduzir variáveis com coeficientes positivos mais elevados."
    );
    interpretation.push(
      "- Para **aumentar** o valor estimado, maximize as variáveis com maior peso positivo no modelo."
    );
    interpretation.push(
      "- Use esta simulação como base comparativa entre diferentes cenários " +
      "e para orientar intervenções estratégicas."
    );
    
    return {
      success: true,
      interpretation: interpretation.join('\n'),
      estimate: finalEstimate,
      original_estimate: totalEstimate,
      contributions: contributions,
      has_warning: hasNegativeWarning,
      recommendations: this.generateSimulationRecommendations(contributions, dependentVariable)
    };
  }

  // =================== FUNÇÕES AUXILIARES ===================
  calculateRMSE(actual, predicted) {
    const squaredErrors = actual.map((a, i) => Math.pow(a - predicted[i], 2));
    return Math.sqrt(squaredErrors.reduce((sum, err) => sum + err, 0) / actual.length);
  }

  calculateMAE(actual, predicted) {
    const absoluteErrors = actual.map((a, i) => Math.abs(a - predicted[i]));
    return absoluteErrors.reduce((sum, err) => sum + err, 0) / actual.length;
  }

  calculateMSE(actual, predicted) {
    const squaredErrors = actual.map((a, i) => Math.pow(a - predicted[i], 2));
    return squaredErrors.reduce((sum, err) => sum + err, 0) / actual.length;
  }

  calculateR2(actual, predicted) {
    const meanActual = actual.reduce((sum, val) => sum + val, 0) / actual.length;
    const ssTotal = actual.reduce((sum, val) => sum + Math.pow(val - meanActual, 2), 0);
    const ssResidual = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
    return 1 - (ssResidual / ssTotal);
  }

  calculateVariableImportance(coefficients) {
    const totalAbs = coefficients.reduce((sum, coef) => sum + Math.abs(coef.value), 0);
    return coefficients.map(coef => ({
      name: coef.name,
      importance: (Math.abs(coef.value) / totalAbs) * 100,
      direction: coef.value > 0 ? 'positive' : 'negative'
    }));
  }

  generateRandomForestRecommendations(importance) {
    if (importance.length === 0) return "Considere treinar o modelo com mais dados para obter importância das variáveis.";
    
    const topVar = importance.reduce((max, i) => i.value > max.value ? i : max);
    
    return `Foque na variável '${topVar.name}' que tem a maior importância. ` +
           `Considere coletar dados mais detalhados sobre esta variável para melhorar o modelo.`;
  }

  generateSimulationRecommendations(contributions, dependentVariable) {
    const positiveContribs = Object.entries(contributions)
      .filter(([_, info]) => info.coefficient > 0)
      .sort((a, b) => Math.abs(b[1].coefficient) - Math.abs(a[1].coefficient));
    
    const negativeContribs = Object.entries(contributions)
      .filter(([_, info]) => info.coefficient < 0)
      .sort((a, b) => Math.abs(b[1].coefficient) - Math.abs(a[1].coefficient));
    
    const recommendations = [];
    
    if (positiveContribs.length > 0) {
      recommendations.push(
        `Para aumentar **${dependentVariable}**, foque em aumentar ` +
        `${positiveContribs.slice(0, 2).map(([name]) => `'${name}'`).join(' e ')}.`
      );
    }
    
    if (negativeContribs.length > 0) {
      recommendations.push(
        `Para diminuir **${dependentVariable}**, foque em reduzir ` +
        `${negativeContribs.slice(0, 2).map(([name]) => `'${name}'`).join(' e ')}.`
      );
    }
    
    return recommendations.join(' ');
  }

  predictLinear(features, model) {
    return features.map(feature => {
      let prediction = model.intercept || 0;
      model.coefficients.forEach((coef, index) => {
        prediction += coef.value * (feature[index] || 0);
      });
      return prediction;
    });
  }
}

module.exports = new ModelInterpretationService();