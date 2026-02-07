const fs = require('fs');
const path = require('path');

// Estrutura completa
const structure = [
  'backend/api/r/linear',
  'backend/api/r/logistic',
  'backend/api/r/random_forest',
  'backend/api/r/xgboost',
  'backend/api/r/time_series/arima',
  'backend/api/r/time_series/ets',
  'backend/api/r/time_series/prophet',
  'backend/r-engine/common',
  'backend/r-engine/linear',
  'backend/r-engine/logistic',
  'backend/r-engine/random_forest',
  'backend/r-engine/xgboost',
  'backend/r-engine/time_series/arima',
  'backend/r-engine/time_series/ets',
  'backend/r-engine/time_series/prophet',
  'backend/actuarial/tarifacao/a_priori',
  'backend/actuarial/tarifacao/a_posteriori',
  'backend/actuarial/tabelas_mortalidade',
  'backend/actuarial/markov',
  'backend/actuarial/monte_carlo',
  'backend/actuarial/definicoes',
  'backend/tmp/input',
  'backend/tmp/output',
  'backend/logs'
];

// Templates por tipo
const templates = {
  linear: `# engine.R - Linear Regression
run_model <- function(input_data) {
  model <- lm(y ~ ., data = input_data)
  return(model)
}`,
  logistic: `# engine.R - Logistic Regression
run_model <- function(input_data) {
  model <- glm(y ~ ., data = input_data, family = binomial)
  return(model)
}`,
  random_forest: `# engine.R - Random Forest
library(randomForest)
run_model <- function(input_data) {
  model <- randomForest(y ~ ., data = input_data)
  return(model)
}`,
  xgboost: `# engine.R - XGBoost
library(xgboost)
run_model <- function(input_data, label) {
  dtrain <- xgb.DMatrix(data = as.matrix(input_data), label = label)
  # TODO: definir parametros e treinar
  return(NULL)
}`,
  arima: `# engine.R - ARIMA
library(forecast)
run_model <- function(ts_data) {
  model <- auto.arima(ts_data)
  return(model)
}`,
  ets: `# engine.R - ETS
library(forecast)
run_model <- function(ts_data) {
  model <- ets(ts_data)
  return(model)
}`,
  prophet: `# engine.R - Prophet
library(prophet)
run_model <- function(df) {
  model <- prophet(df)
  return(model)
}`,
  actuarial: `# engine.R - Actuarial Template
# TODO: Implementar funções de tarifação, tábua de mortalidade, Markov, Monte Carlo, etc.
`
};

// Criação de pastas e ficheiros
structure.forEach(dir => {
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✔ Criado: ${dir}`);
  }

  const baseName = path.basename(dir);

  // Verifica tipo de template
  let template = null;
  if (['linear','logistic','random_forest','xgboost','arima','ets','prophet'].includes(baseName)) {
    template = templates[baseName];
  } else if (dir.includes('actuarial')) {
    template = templates['actuarial'];
  }

  // Cria engine.R se template existir
  if (template) {
    const filePath = path.join(dir, 'engine.R');
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, template);
      console.log(`✔ Ficheiro criado: ${filePath}`);
    }
  }
});

