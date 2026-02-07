#!/usr/bin/env Rscript

library(jsonlite)
library(randomForest)
library(dplyr)

args <- commandArgs(trailingOnly = TRUE)

if (length(args) < 2) {
  stop("Uso: Rscript random_forest.R <input.json> <output.json>")
}

input_file <- args[1]
output_file <- args[2]

# Função auxiliar para valor padrão
`%||%` <- function(x, y) if (is.null(x)) y else x

# Função para calcular métricas
calcular_metricas_rf <- function(y_real, y_pred, is_regression) {
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
    tipo <- input_data$tipo %||% "random_forest"
    dados <- input_data$dados
    parametros <- input_data$parametros
    
    cat("========================================\n")
    cat("🌲 PROCESSANDO RANDOM FOREST\n")
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
    
    cat(sprintf("🎯 Tipo: %s\n", if (is_regression) "Regressão" else "Classificação"))
    
    # Remover NAs
    df_clean <- df[complete.cases(df[, c(y_var, features)]), ]
    if (nrow(df_clean) < 5) {
      stop("❌ Dados insuficientes")
    }
    
    cat(sprintf("📊 Dados limpos: %d observações\n", nrow(df_clean)))
    
    # Extrair parâmetros
    n_estimators <- as.integer(parametros$n_estimators %||% 100)
    max_depth <- as.integer(parametros$max_depth %||% if (is_regression) 10 else 6)
    
    # Calcular mtry
    if (!is.null(parametros$mtry)) {
      if (parametros$mtry == "sqrt") {
        mtry <- floor(sqrt(length(features)))
      } else if (parametros$mtry == "all") {
        mtry <- length(features)
      } else {
        mtry <- as.integer(parametros$mtry)
      }
    } else {
      mtry <- if (is_regression) max(floor(length(features)/3), 1) else floor(sqrt(length(features)))
    }
    
    nodesize <- as.integer(parametros$nodesize %||% if (is_regression) 5 else 1)
    replace <- TRUE
    sampsize <- if (nrow(df_clean) > 100) floor(nrow(df_clean) * 0.632) else nrow(df_clean)
    
    cat(sprintf("⚙️  Parâmetros: n_estimators=%d, mtry=%d, nodesize=%d\n",
                n_estimators, mtry, nodesize))
    
    # Preparar fórmula
    formula_str <- paste(y_var, "~", paste(features, collapse = " + "))
    
    # Treinar modelo
    cat("🌳 Treinando Random Forest...\n")
    
    if (is_regression) {
      modelo <- randomForest(
        as.formula(formula_str),
        data = df_clean,
        ntree = n_estimators,
        mtry = mtry,
        nodesize = nodesize,
        importance = TRUE,
        na.action = na.omit
      )
    } else {
      modelo <- randomForest(
        as.formula(formula_str),
        data = df_clean,
        ntree = n_estimators,
        mtry = mtry,
        nodesize = nodesize,
        importance = TRUE,
        na.action = na.omit
      )
    }
    
    cat("✅ Modelo treinado com sucesso!\n")
    
    # Previsões
    y_real <- df_clean[[y_var]]
    predicoes <- predict(modelo, df_clean)
    
    # Calcular métricas
    metricas <- calcular_metricas_rf(y_real, predicoes, is_regression)
    
    # Importância das variáveis
    tryCatch({
      importancia_raw <- importance(modelo)
      
      if (!is.null(importancia_raw) && nrow(importancia_raw) > 0) {
        if (is_regression) {
          if ("%IncMSE" %in% colnames(importancia_raw)) {
            importancia_df <- data.frame(
              variavel = rownames(importancia_raw),
              inc_mse = importancia_raw[, "%IncMSE"],
              inc_node_purity = if ("IncNodePurity" %in% colnames(importancia_raw)) 
                importancia_raw[, "IncNodePurity"] else NA,
              ranking = 1:nrow(importancia_raw)
            )
          } else {
            stop("Métricas de importância não disponíveis")
          }
        } else {
          if ("MeanDecreaseAccuracy" %in% colnames(importancia_raw)) {
            importancia_df <- data.frame(
              variavel = rownames(importancia_raw),
              mean_decrease_accuracy = importancia_raw[, "MeanDecreaseAccuracy"],
              mean_decrease_gini = if ("MeanDecreaseGini" %in% colnames(importancia_raw))
                importancia_raw[, "MeanDecreaseGini"] else NA,
              ranking = 1:nrow(importancia_raw)
            )
          } else {
            stop("Métricas de importância não disponíveis")
          }
        }
        
        # Ordenar
        if (is_regression) {
          importancia_df <- importancia_df[order(-importancia_df$inc_mse), ]
          importancia_df$inc_mse_percentual <- round(importancia_df$inc_mse / sum(importancia_df$inc_mse) * 100, 2)
        } else {
          importancia_df <- importancia_df[order(-importancia_df$mean_decrease_accuracy), ]
          importancia_df$mda_percentual <- round(importancia_df$mean_decrease_accuracy / sum(importancia_df$mean_decrease_accuracy) * 100, 2)
        }
        
        importancia_df$ranking <- 1:nrow(importancia_df)
        
      } else {
        stop("Importância não disponível")
      }
    }, error = function(e) {
      cat("⚠️  Não foi possível calcular importância:", e$message, "\n")
      importancia_df <- data.frame(
        variavel = features,
        inc_mse = if (is_regression) 1/length(features) else NA,
        mean_decrease_accuracy = if (!is_regression) 1/length(features) else NA,
        ranking = 1:length(features),
        inc_mse_percentual = if (is_regression) round(100/length(features), 2) else NA,
        mda_percentual = if (!is_regression) round(100/length(features), 2) else NA
      )
    })
    
    # OOB Error
    oob_error <- if (!is.null(modelo$err.rate)) {
      tail(modelo$err.rate[, 1], 1)
    } else {
      NA
    }
    
    # Amostra de previsões
    n_amostra <- min(10, length(y_real))
    predicoes_amostra <- data.frame(
      id = 1:n_amostra,
      real = head(y_real, n_amostra),
      predito = head(predicoes, n_amostra)
    )
    
    # Resultado final SIMPLIFICADO
    resultado <- list(
      success = TRUE,
      tipo_modelo = "random_forest",
      
      # Métricas Random Forest
      metricas_rf = list(
        importancia = importancia_df,
        estatisticas = list(
          oob_error = oob_error,
          n_trees = n_estimators,
          mtry = mtry,
          nodesize = nodesize
        )
      ),
      
      # Métricas de performance
      qualidade = metricas,
      
      # Parâmetros usados
      parametros = list(
        n_estimators = n_estimators,
        max_depth = max_depth,
        mtry = mtry,
        nodesize = nodesize,
        n_observacoes = nrow(df_clean),
        n_features = length(features),
        is_regression = is_regression
      ),
      
      # Resumo
      resumo = if (is_regression) {
        sprintf("🌲 Random Forest (Regressão) | RMSE = %.4f | R² = %.4f | OOB = %.4f", 
                metricas$RMSE, metricas$R2, oob_error)
      } else {
        sprintf("🌲 Random Forest (Classificação) | Accuracy = %.2f%% | OOB = %.2f%%", 
                metricas$Accuracy * 100, oob_error * 100)
      },
      
      # Dados de previsão
      predicoes_amostra = predicoes_amostra
    )
    
    # Salvar resultado
    write_json(resultado, output_file, auto_unbox = TRUE, pretty = TRUE)
    
    cat("========================================\n")
    cat("✅ RANDOM FOREST EXECUTADO COM SUCESSO!\n")
    cat("========================================\n")
    
    return(resultado)
    
  }, error = function(e) {
    cat("❌ ERRO Random Forest:", e$message, "\n")
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