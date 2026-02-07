// utils/data-processing.js
class DataProcessor {
  // ... (manter todas as funções anteriores que já criamos)

  // Novas funções para análise de dados
  static analyzeData(data, options = {}) {
    if (!Array.isArray(data) || data.length === 0) {
      return {
        error: 'Dados vazios ou inválidos',
        variable_types: [],
        missing_values: { total: 0, by_variable: {} },
        statistics: {}
      };
    }

    const firstRow = data[0];
    const variables = Object.keys(firstRow);
    
    const analysis = {
      variable_types: [],
      missing_values: {
        total: 0,
        by_variable: {}
      },
      statistics: {},
      recommendations: []
    };

    // Analisar cada variável
    variables.forEach(variable => {
      const values = data.map(row => row[variable]);
      
      // Determinar tipo
      const type = this.detectVariableType(values);
      analysis.variable_types.push({ variable, type });
      
      // Contar valores ausentes
      const missing = values.filter(v => 
        v === null || v === undefined || v === '' || isNaN(v)
      ).length;
      
      analysis.missing_values.by_variable[variable] = missing;
      analysis.missing_values.total += missing;
      
      // Estatísticas para variáveis numéricas
      if (type === 'number') {
        const numericValues = values.filter(v => typeof v === 'number' && !isNaN(v));
        
        if (numericValues.length > 0) {
          analysis.statistics[variable] = {
            count: numericValues.length,
            mean: this.mean(numericValues),
            median: this.median(numericValues),
            min: Math.min(...numericValues),
            max: Math.max(...numericValues),
            std: this.standardDeviation(numericValues),
            q1: this.percentile(numericValues, 25),
            q3: this.percentile(numericValues, 75),
            iqr: this.percentile(numericValues, 75) - this.percentile(numericValues, 25),
            outliers: this.detectOutliers(numericValues).length
          };
        }
      }
      
      // Estatísticas para variáveis categóricas
      if (type === 'string') {
        const stringValues = values.filter(v => typeof v === 'string');
        const uniqueValues = [...new Set(stringValues)];
        const valueCounts = {};
        
        uniqueValues.forEach(value => {
          valueCounts[value] = stringValues.filter(v => v === value).length;
        });
        
        analysis.statistics[variable] = {
          count: stringValues.length,
          unique: uniqueValues.length,
          top_values: Object.entries(valueCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([value, count]) => ({ value, count, percentage: (count / stringValues.length * 100).toFixed(1) + '%' }))
        };
      }
    });

    // Gerar recomendações
    if (analysis.missing_values.total > 0) {
      analysis.recommendations.push(
        `Encontrados ${analysis.missing_values.total} valores ausentes. Considere imputação.`
      );
    }

    const numericVars = analysis.variable_types.filter(v => v.type === 'number').length;
    if (numericVars > 10) {
      analysis.recommendations.push(
        `Muitas variáveis numéricas (${numericVars}). Considere redução de dimensionalidade.`
      );
    }

    return analysis;
  }

  static detectVariableType(values) {
    const sample = values.slice(0, 100).filter(v => v != null);
    
    if (sample.length === 0) return 'unknown';
    
    // Verificar se é número
    const numericCount = sample.filter(v => typeof v === 'number' && !isNaN(v)).length;
    if (numericCount / sample.length > 0.8) return 'number';
    
    // Verificar se é data
    const dateCount = sample.filter(v => !isNaN(Date.parse(v))).length;
    if (dateCount / sample.length > 0.8) return 'date';
    
    // Padrão: string
    return 'string';
  }

  static mean(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  static median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  static standardDeviation(values) {
    const avg = this.mean(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = this.mean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }

  static percentile(values, p) {
    const sorted = [...values].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * p / 100;
    const base = Math.floor(pos);
    const rest = pos - base;
    
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
      return sorted[base];
    }
  }

  static detectOutliers(values) {
    const q1 = this.percentile(values, 25);
    const q3 = this.percentile(values, 75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return values.filter(v => v < lowerBound || v > upperBound);
  }

  // Funções de transformação estilo dplyr
  static filterData(data, condition) {
    // condition: { variable: 'age', operator: '>', value: 30 }
    return data.filter(row => {
      if (typeof condition === 'function') {
        return condition(row);
      }
      
      const { variable, operator, value } = condition;
      const rowValue = row[variable];
      
      switch (operator) {
        case '>': return rowValue > value;
        case '>=': return rowValue >= value;
        case '<': return rowValue < value;
        case '<=': return rowValue <= value;
        case '==': return rowValue == value;
        case '!=': return rowValue != value;
        case 'in': return Array.isArray(value) && value.includes(rowValue);
        case 'not in': return Array.isArray(value) && !value.includes(rowValue);
        default: return true;
      }
    });
  }

  static mutateData(data, mutations) {
    // mutations: { new_var: 'age * 2', another_var: 'income / 1000' }
    return data.map(row => {
      const newRow = { ...row };
      
      Object.entries(mutations).forEach(([newVar, formula]) => {
        try {
          // Avaliar fórmula simples
          const evalFormula = formula.replace(/(\w+)/g, (match) => {
            if (row[match] !== undefined) return `row['${match}']`;
            return match;
          });
          
          // Cuidado: eval pode ser perigoso, usar em ambiente controlado
          newRow[newVar] = eval(`(${evalFormula})`);
        } catch (error) {
          newRow[newVar] = null;
        }
      });
      
      return newRow;
    });
  }

  static selectColumns(data, columns) {
    return data.map(row => {
      const selected = {};
      columns.forEach(col => {
        if (row[col] !== undefined) {
          selected[col] = row[col];
        }
      });
      return selected;
    });
  }

  static groupBy(data, column) {
    const groups = {};
    
    data.forEach(row => {
      const key = row[column];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(row);
    });
    
    return groups;
  }

  static summarizeData(data, operations) {
    // operations: { mean_age: { variable: 'age', operation: 'mean' } }
    const summary = {};
    
    Object.entries(operations).forEach(([name, op]) => {
      const { variable, operation } = op;
      const values = data.map(row => row[variable]).filter(v => v != null);
      
      switch (operation) {
        case 'mean':
          summary[name] = this.mean(values);
          break;
        case 'median':
          summary[name] = this.median(values);
          break;
        case 'sum':
          summary[name] = values.reduce((a, b) => a + b, 0);
          break;
        case 'count':
          summary[name] = values.length;
          break;
        case 'min':
          summary[name] = Math.min(...values);
          break;
        case 'max':
          summary[name] = Math.max(...values);
          break;
        case 'std':
          summary[name] = this.standardDeviation(values);
          break;
        default:
          summary[name] = null;
      }
    });
    
    return summary;
  }
}

module.exports = DataProcessor;