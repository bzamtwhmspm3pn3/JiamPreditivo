#!/usr/bin/env Rscript

library(jsonlite)
library(xgboost)
library(dplyr)

args <- commandArgs(trailingOnly = TRUE)

if (length(args) < 2) {
  stop("Uso: Rscript xgboost.R <input.json> <output.json>")
}

input_file <- args[1]
output_file <- args[2]

# Função auxiliar para valor padrão
`%||%` <- function(x, y) if (is.null(x)) y else x

# Função para calcular métricas XGBoost
calcular_metricas_xgboost <- function(y_real, y_pred, is_regression) {
  if (is_regression) {
    residuos <- y_real - y_pred
    mse <- mean(residuos^2, na.rm = TRUE)
    rmse <- sqrt(mse)
    mae <- mean(abs(residuos), na.rm = TRUE)
    mape <- if (all(y_real != 0)) {
      mean(abs(residuos / y_real) * 100, na.rm = TRUE)
    } else {
      mean(abs(residuos) * 100, na.rm = TRUE)
    }
    
    sst <- sum((y_real - mean(y_real, na.rm = TRUE))^2, na.rm = TRUE)
    sse <- sum(residuos^2, na.rm = TRUE)
    r_squared <- if (sst > 0) 1 - (sse / sst) else NA
    
    n <- length(y_real)
    p <- length(unique(y_real)) - 1
    r_squared_adj <- if (n > p + 1) 1 - ((1 - r_squared) * (n - 1) / (n - p - 1)) else NA
    
    return(list(
      RMSE = round(rmse, 4),
      MAE = round(mae, 4),
      MSE = round(mse, 4),
      MAPE = round(mape, 2),
      R2 = round(r_squared, 4),
      R2_adj = round(r_squared_adj, 4),
      tipo = "regressao"
    ))
  } else {
    accuracy <- mean(y_real == y_pred, na.rm = TRUE)
    
    if (length(unique(y_real)) <= 20) {
      matriz_confusao <- table(Predito = y_pred, Real = y_real)
      confusion_df <- as.data.frame.matrix(matriz_confusao)
      
      if (nrow(matriz_confusao) == ncol(matriz_confusao)) {
        tp <- diag(matriz_confusao)
        fp <- rowSums(matriz_confusao) - tp
        fn <- colSums(matriz_confusao) - tp
        
        precision <- ifelse((tp + fp) > 0, tp / (tp + fp), 0)
        recall <- ifelse((tp + fn) > 0, tp / (tp + fn), 0)
        f1_score <- ifelse((precision + recall) > 0, 
                           2 * (precision * recall) / (precision + recall), 0)
        
        metrics_by_class <- data.frame(
          Classe = rownames(matriz_confusao),
          Precision = round(precision, 4),
          Recall = round(recall, 4),
          F1_Score = round(f1_score, 4),
          Support = colSums(matriz_confusao)
        )
      } else {
        metrics_by_class <- data.frame(Note = "Matriz não quadrada")
      }
    } else {
      confusion_df <- data.frame(Note = "Matriz muito grande")
      metrics_by_class <- data.frame(Note = "Muitas classes")
    }
    
    if (length(unique(y_real)) == 2) {
      tp <- sum(y_real == 1 & y_pred == 1, na.rm = TRUE)
      fp <- sum(y_real == 0 & y_pred == 1, na.rm = TRUE)
      fn <- sum(y_real == 1 & y_pred == 0, na.rm = TRUE)
      tn <- sum(y_real == 0 & y_pred == 0, na.rm = TRUE)
      
      precision_bin <- if (tp + fp > 0) tp / (tp + fp) else 0
      recall_bin <- if (tp + fn > 0) tp / (tp + fn) else 0
      f1_bin <- if (precision_bin + recall_bin > 0) 
        2 * (precision_bin * recall_bin) / (precision_bin + recall_bin) else 0
      
      return(list(
        Accuracy = round(accuracy, 4),
        Precision = round(precision_bin, 4),
        Recall = round(recall_bin, 4),
        F1_Score = round(f1_bin, 4),
        ConfusionMatrix = confusion_df,
        MetricsByClass = metrics_by_class,
        tipo = "classificacao"
      ))
    } else {
      return(list(
        Accuracy = round(accuracy, 4),
        ConfusionMatrix = confusion_df,
        MetricsByClass = metrics_by_class,
        tipo = "classificacao"
      ))
    }
  }
}

main <- function() {
  tryCatch({
    input_data <- fromJSON(input_file)
    tipo <- input_data$tipo %||% "xgboost"
    dados <- input_data$dados
    parametros <- input_data$parametros
    
    cat("========================================\n")
    cat("⚡ PROCESSANDO XGBOOST\n")
    cat("========================================\n")
    
    # Converter para dataframe
    if (is.data.frame(dados)) {
      df <- dados
    } else if (is.list(dados)) {
      df <- as.data.frame(do.call(rbind, dados))
    } else {
      stop("❌ Formato de dados não suportado")
    }
    
    # Extrair variáveis
    y_var <- parametros$y %||% names(df)[1]
    if (is.null(y_var) || y_var == "") {
      stop("❌ Variável Y não especificada")
    }
    
    if (!y_var %in% names(df)) {
      stop(sprintf("❌ Variável Y '%s' não encontrada", y_var))
    }
    
    # Extrair features
    if (!is.null(parametros$features) && parametros$features != "") {
      features <- unlist(strsplit(parametros$features, ","))
      features <- trimws(features)
    } else {
      features <- setdiff(names(df), y_var)
    }
    
    features <- intersect(features, names(df))
    if (length(features) == 0) {
      stop("❌ Nenhuma feature disponível")
    }
    
    cat(sprintf("🎯 Variável Y: %s\n", y_var))
    cat(sprintf("🔧 Features: %s\n", paste(features, collapse = ", ")))
    
    # Determinar tipo
    if (!is.numeric(df[[y_var]])) {
      # Tentar converter para numérico
      y_numeric <- suppressWarnings(as.numeric(as.character(df[[y_var]])))
      if (sum(is.na(y_numeric)) / length(y_numeric) < 0.3) {
        df[[y_var]] <- y_numeric
        is_regression <- TRUE
        cat("✅ Y convertido para regressão\n")
      } else {
        df[[y_var]] <- as.factor(df[[y_var]])
        is_regression <- FALSE
        cat("✅ Y tratado como classificação\n")
      }
    } else {
      is_regression <- TRUE
    }
    
    if (is_regression) {
      objective <- "reg:squarederror"
      cat("🎯 Tipo: Regressão\n")
    } else {
      num_classes <- length(unique(df[[y_var]]))
      if (num_classes == 2) {
        objective <- "binary:logistic"
      } else {
        objective <- "multi:softprob"
      }
      cat(sprintf("🎯 Tipo: Classificação (%d classes)\n", num_classes))
    }
    
    # Remover NAs
    df_clean <- df[complete.cases(df[, c(y_var, features)]), ]
    if (nrow(df_clean) < 5) {
      stop("❌ Dados insuficientes")
    }
    
    cat(sprintf("📊 Dados limpos: %d observações\n", nrow(df_clean)))
    
    # Converter fatores para numéricos
    for (var in c(y_var, features)) {
      if (is.factor(df_clean[[var]])) {
        df_clean[[var]] <- as.numeric(df_clean[[var]]) - 1
      }
    }
    
    # Preparar dados
    X <- as.matrix(df_clean[, features, drop = FALSE])
    Y <- df_clean[[y_var]]
    
    # Extrair parâmetros
    n_estimators <- as.integer(parametros$n_estimators %||% 100)
    max_depth <- as.integer(parametros$max_depth %||% 6)
    learning_rate <- as.numeric(parametros$learning_rate %||% 0.1)
    subsample <- as.numeric(parametros$subsample %||% 0.8)
    colsample_bytree <- as.numeric(parametros$colsample_bytree %||% 0.8)
    reg_alpha <- as.numeric(parametros$reg_alpha %||% 0)
    reg_lambda <- as.numeric(parametros$reg_lambda %||% 1)
    min_child_weight <- as.numeric(parametros$min_child_weight %||% 1)
    gamma <- as.numeric(parametros$gamma %||% 0)
    
    cat(sprintf("⚙️  Parâmetros: n_estimators=%d, max_depth=%d, learning_rate=%.3f\n",
                n_estimators, max_depth, learning_rate))
    
    # Configurar parâmetros
    params <- list(
      objective = objective,
      max_depth = max_depth,
      eta = learning_rate,
      subsample = subsample,
      colsample_bytree = colsample_bytree,
      alpha = reg_alpha,
      lambda = reg_lambda,
      min_child_weight = min_child_weight,
      gamma = gamma
    )
    
    if (!is_regression && objective == "multi:softprob") {
      params$num_class <- length(unique(Y))
    }
    
    # Treinar modelo
    dtrain <- xgb.DMatrix(data = X, label = Y)
    modelo <- xgb.train(
      params = params,
      data = dtrain,
      nrounds = n_estimators,
      verbose = 0
    )
    
    cat("✅ Modelo treinado com sucesso!\n")
    
    # Previsões
    preds <- predict(modelo, X)
    
    # Processar previsões
    if (!is_regression) {
      if (objective == "binary:logistic") {
        y_pred_class <- ifelse(preds > 0.5, 1, 0)
      } else if (objective == "multi:softprob") {
        pred_matrix <- matrix(preds, nrow = length(Y), ncol = params$num_class, byrow = TRUE)
        y_pred_class <- max.col(pred_matrix) - 1
      }
    } else {
      y_pred_class <- preds
    }
    
    # Calcular métricas
    metricas <- calcular_metricas_xgboost(Y, y_pred_class, is_regression)
    
    # Importância das variáveis
    tryCatch({
      importancia_raw <- xgb.importance(model = modelo)
      
      if (!is.null(importancia_raw) && nrow(importancia_raw) > 0) {
        importancia_df <- data.frame(
          variavel = importancia_raw$Feature,
          ganho = importancia_raw$Gain,
          cobertura = if ("Cover" %in% names(importancia_raw)) importancia_raw$Cover else NA,
          frequencia = if ("Frequency" %in% names(importancia_raw)) importancia_raw$Frequency else NA,
          ranking = 1:nrow(importancia_raw)
        )
        
        importancia_df <- importancia_df[order(-importancia_df$ganho), ]
        importancia_df$ranking <- 1:nrow(importancia_df)
        importancia_df$ganho_percentual <- round(importancia_df$ganho / sum(importancia_df$ganho) * 100, 2)
        
        if (!all(is.na(importancia_df$cobertura))) {
          importancia_df$cobertura_percentual <- round(importancia_df$cobertura / sum(importancia_df$cobertura, na.rm = TRUE) * 100, 2)
        }
        
      } else {
        stop("Importância não disponível")
      }
    }, error = function(e) {
      cat("⚠️  Não foi possível calcular importância:", e$message, "\n")
      importancia_df <- data.frame(
        variavel = features,
        ganho = 1/length(features),
        cobertura = NA,
        frequencia = NA,
        ranking = 1:length(features),
        ganho_percentual = round(100/length(features), 2)
      )
    })
    
    # Amostra de previsões
    n_amostra <- min(10, length(Y))
    predicoes_amostra <- data.frame(
      id = 1:n_amostra,
      real = head(Y, n_amostra),
      predito = head(y_pred_class, n_amostra)
    )
    
    # Resultado final SIMPLIFICADO
    resultado <- list(
      success = TRUE,
      tipo_modelo = "xgboost",
      
      # Métricas XGBoost
      metricas_xgboost = list(
        importancia = importancia_df,
        resumo_importancia = list(
          total_ganho = sum(importancia_df$ganho, na.rm = TRUE),
          n_variaveis = nrow(importancia_df),
          variavel_mais_importante = if (nrow(importancia_df) > 0) importancia_df$variavel[1] else NA
        )
      ),
      
      # Métricas de performance
      qualidade = metricas,
      
      # Parâmetros usados
      parametros = list(
        n_estimators = n_estimators,
        max_depth = max_depth,
        learning_rate = learning_rate,
        subsample = subsample,
        colsample_bytree = colsample_bytree,
        n_observacoes = nrow(df_clean),
        n_features = length(features),
        is_regression = is_regression,
        objective = objective
      ),
      
      # Estatísticas
      estatisticas = list(
        n_trees = n_estimators,
        tipo_problema = if (is_regression) "regressao" else "classificacao"
      ),
      
      # Resumo
      resumo = if (is_regression) {
        sprintf("⚡ XGBoost (Regressão) | RMSE = %.4f | R² = %.4f", 
                metricas$RMSE, metricas$R2)
      } else {
        sprintf("⚡ XGBoost (Classificação) | Accuracy = %.2f%%", 
                metricas$Accuracy * 100)
      },
      
      # Dados de previsão
      predicoes_amostra = predicoes_amostra
    )
    
    # Salvar resultado (remover objetos complexos)
    write_json(resultado, output_file, auto_unbox = TRUE, pretty = TRUE)
    
    cat("========================================\n")
    cat("✅ XGBOOST EXECUTADO COM SUCESSO!\n")
    cat("========================================\n")
    
    return(resultado)
    
  }, error = function(e) {
    cat("❌ ERRO XGBoost:", e$message, "\n")
    resultado <- list(
      success = FALSE,
      error = e$message
    )
    write_json(resultado, output_file, auto_unbox = TRUE, pretty = TRUE)
    return(resultado)
  })
}

# Executar
main()