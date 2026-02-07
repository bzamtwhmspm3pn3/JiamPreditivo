# metrics.R - Funções para cálculo de métricas

# Calcular métricas de erro
calculate_metrics <- function(actual, predicted) {
  if (length(actual) != length(predicted)) {
    stop("Actual and predicted vectors must have the same length")
  }
  
  # Remover NAs
  valid <- !is.na(actual) & !is.na(predicted)
  actual <- actual[valid]
  predicted <- predicted[valid]
  
  if (length(actual) == 0) {
    return(list(
      mae = NA,
      rmse = NA,
      mape = NA,
      r2 = NA,
      mse = NA
    ))
  }
  
  # Cálculo das métricas
  errors <- actual - predicted
  mae <- mean(abs(errors))
  mse <- mean(errors^2)
  rmse <- sqrt(mse)
  
  # MAPE (evitar divisão por zero)
  if (all(actual != 0)) {
    mape <- mean(abs(errors / actual)) * 100
  } else {
    mape <- NA
  }
  
  # R²
  ss_total <- sum((actual - mean(actual))^2)
  ss_residual <- sum(errors^2)
  r2 <- if (ss_total > 0) 1 - (ss_residual / ss_total) else NA
  
  return(list(
    mae = mae,
    rmse = rmse,
    mape = mape,
    r2 = r2,
    mse = mse
  ))
}

# Função para imprimir métricas formatadas
print_metrics <- function(metrics) {
  cat("\n📊 MÉTRICAS DO MODELO:\n")
  cat("──────────────────────\n")
  cat(sprintf("MAE:  %.4f\n", metrics$mae))
  cat(sprintf("RMSE: %.4f\n", metrics$rmse))
  cat(sprintf("MSE:  %.4f\n", metrics$mse))
  if (!is.na(metrics$mape)) {
    cat(sprintf("MAPE: %.2f%%\n", metrics$mape))
  }
  if (!is.na(metrics$r2)) {
    cat(sprintf("R²:   %.4f\n", metrics$r2))
  }
  cat("──────────────────────\n")
}

# Exportar funções
list(
  calculate_metrics = calculate_metrics,
  print_metrics = print_metrics
)