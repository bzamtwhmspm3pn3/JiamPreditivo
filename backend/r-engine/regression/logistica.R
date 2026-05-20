#!/usr/bin/env Rscript

library(jsonlite)
library(dplyr)
library(pROC)

main <- function() {
  args <- commandArgs(trailingOnly = TRUE)
  
  if (length(args) < 2) {
    stop("Uso: Rscript logistica.R <input_file> <output_file>")
  }
  
  input_file <- args[1]
  output_file <- args[2]
  
  cat("📊 Executando regressão logística...\n")
  
  tryCatch({
    # Ler dados de entrada
    dados_json <- fromJSON(input_file)
    dados <- dados_json$dados
    parametros <- dados_json$parametros
    
    cat("   Registros recebidos:", nrow(dados), "\n")
    cat("   Tipo:", parametros$tipo_regressao, "\n")
    
    # Converter para data.frame
    df <- as.data.frame(dados, stringsAsFactors = FALSE)
    
    # Extrair parâmetros
    y_var <- parametros$y
    x_vars <- parametros$x
    
    # Validar x_vars
    if (is.null(x_vars) || length(x_vars) == 0) {
      stop("Nenhuma variável preditora especificada")
    }
    
    # Determinar tipo baseado nos parâmetros
    if (parametros$tipo_regressao == "simples" || 
        (is.character(x_vars) && length(x_vars) == 1)) {
      tipo <- "simples"
      x_var <- if(is.character(x_vars)) x_vars else x_vars[1]
      cat("   Regressão LOGÍSTICA SIMPLES\n")
    } else {
      tipo <- "multipla"
      cat("   Regressão LOGÍSTICA MÚLTIPLA\n")
    }
    
    cat("   Variável Y:", y_var, "\n")
    if (tipo == "simples") {
      cat("   Variável X:", x_var, "\n")
    } else {
      cat("   Variáveis X:", paste(x_vars, collapse = ", "), "\n")
    }
    
    # Verificar nomes das colunas
    names_df <- names(df)
    cat("   Nomes das colunas:", paste(names_df, collapse = ", "), "\n")
    
    # Encontrar variável Y por similaridade
    if (!y_var %in% names_df) {
      matching_vars <- grep(paste0("^", y_var, "$|", y_var, "|", tolower(y_var)), 
                            names_df, ignore.case = TRUE, value = TRUE)
      if (length(matching_vars) > 0) {
        y_var <- matching_vars[1]
        cat("   ✅ Variável Y encontrada como:", y_var, "\n")
      } else {
        stop(paste("Variável Y não encontrada. Disponível:", paste(names_df, collapse = ", ")))
      }
    }
    
    # Encontrar variáveis X por similaridade
    if (tipo == "simples") {
      if (!x_var %in% names_df) {
        matching_vars <- grep(paste0("^", x_var, "$|", x_var, "|", tolower(x_var)), 
                              names_df, ignore.case = TRUE, value = TRUE)
        if (length(matching_vars) > 0) {
          x_var <- matching_vars[1]
          cat("   ✅ Variável X encontrada como:", x_var, "\n")
        } else {
          stop(paste("Variável X não encontrada. Disponível:", paste(names_df, collapse = ", ")))
        }
      }
    } else {
      x_vars_clean <- c()
      for (xv in x_vars) {
        if (!xv %in% names_df) {
          matching_vars <- grep(paste0("^", xv, "$|", xv, "|", tolower(xv)), 
                                names_df, ignore.case = TRUE, value = TRUE)
          if (length(matching_vars) > 0) {
            xv_clean <- matching_vars[1]
            cat("   ✅ Variável X", xv, "encontrada como:", xv_clean, "\n")
            x_vars_clean <- c(x_vars_clean, xv_clean)
          } else {
            cat("   ⚠️ Variável X", xv, "não encontrada, pulando...\n")
          }
        } else {
          x_vars_clean <- c(x_vars_clean, xv)
        }
      }
      
      if (length(x_vars_clean) == 0) {
        stop("Nenhuma variável preditora válida encontrada")
      }
      
      x_vars <- x_vars_clean
    }
    
    # Limpeza da variável Y
    cat("\n   🔍 LIMPEZA DE DADOS:\n")
    
    # Verificar valores únicos de Y
    y_raw <- df[[y_var]]
    cat("   Valores únicos de Y (raw):", paste(unique(y_raw), collapse = ", "), "\n")
    
    # Converter Y para 0/1
    df[[y_var]] <- as.character(df[[y_var]])
    
    # Padrões para valores positivos e negativos
    positive_patterns <- c("1", "TRUE", "true", "YES", "Yes", "yes", "SIM", "Sim", "sim", 
                          "S", "s", "POSITIVO", "Positivo", "positivo", "POS", "Pos", "pos")
    negative_patterns <- c("0", "FALSE", "false", "NO", "No", "no", "NAO", "Nao", "nao",
                          "N", "n", "NEGATIVO", "Negativo", "negativo", "NEG", "Neg", "neg")
    
    df[[y_var]] <- sapply(df[[y_var]], function(val) {
      if (is.na(val)) return(NA)
      val_char <- as.character(val)
      if (val_char %in% positive_patterns) return("1")
      if (val_char %in% negative_patterns) return("0")
      num_val <- suppressWarnings(as.numeric(val_char))
      if (!is.na(num_val)) {
        if (num_val == 1) return("1")
        if (num_val == 0) return("0")
      }
      return(NA)
    })
    
    # Remover NAs
    df <- df[!is.na(df[[y_var]]), ]
    cat("   Após limpeza Y:", nrow(df), "registros\n")
    
    # Verificar classes
    y_classes <- unique(df[[y_var]])
    cat("   Classes Y:", paste(y_classes, collapse = ", "), "\n")
    
    if (length(y_classes) < 2) {
      stop("Variável Y precisa ter pelo menos 2 classes (0 e 1)")
    }
    
    # Converter para fator
    df[[y_var]] <- factor(df[[y_var]], levels = c("0", "1"))
    
    # Limpeza das variáveis X
    if (tipo == "simples") {
      df[[x_var]] <- suppressWarnings(as.numeric(as.character(df[[x_var]])))
      df <- df[!is.na(df[[x_var]]), ]
      cat("   Após limpeza X:", nrow(df), "registros\n")
    } else {
      for (xv in x_vars) {
        df[[xv]] <- suppressWarnings(as.numeric(as.character(df[[xv]])))
        df <- df[!is.na(df[[xv]]), ]
      }
      cat("   Após limpeza variáveis X:", nrow(df), "registros\n")
    }
    
    # Verificar tamanho mínimo
    cat("\n   📊 DADOS FINAIS:", nrow(df), "observações\n")
    
    if (nrow(df) < 5) {
      stop(paste("Dados insuficientes após limpeza (", nrow(df), " observações). Mínimo necessário: 5"))
    }
    
    # Distribuição das classes
    classe_counts <- table(df[[y_var]])
    cat("   Distribuição das classes:\n")
    cat("     Classe 0:", classe_counts["0"], "\n")
    cat("     Classe 1:", classe_counts["1"], "\n")
    
    min_class_size <- min(classe_counts)
    if (min_class_size < 3) {
      cat("   ⚠️ AVISO: Classe minoritária tem apenas", min_class_size, "observações\n")
      cat("   🔧 Os resultados podem ser instáveis\n")
    }
    
    # Criar fórmula
    if (tipo == "simples") {
      formula_str <- paste(y_var, "~", x_var)
    } else {
      formula_str <- paste(y_var, "~", paste(x_vars, collapse = " + "))
    }
    formula_obj <- as.formula(formula_str)
    cat("\n   📈 Fórmula:", formula_str, "\n")
    
    # Ajustar modelo
    modelo <- NULL
    metodo_usado <- "glm"
    
    # Para dados muito pequenos, usar regressão simples com uma variável
    if (tipo == "multipla" && nrow(df) < 20) {
      cat("   ⚠️ Dados muito pequenos para múltipla, usando modelo simples\n")
      
      # Encontrar melhor variável
      correlations <- sapply(x_vars, function(xv) {
        cor_val <- suppressWarnings(cor(as.numeric(df[[xv]]), as.numeric(df[[y_var]]) - 1, use = "complete.obs"))
        if(is.na(cor_val)) 0 else abs(cor_val)
      })
      best_var <- names(which.max(correlations))
      
      formula_str <- paste(y_var, "~", best_var)
      formula_obj <- as.formula(formula_str)
      tipo <- "simples"
      x_var <- best_var
      
      cat("   ✅ Usando melhor variável:", best_var, "\n")
    }
    
    # Ajustar GLM
    tryCatch({
      modelo <- glm(formula_obj, data = df, family = binomial(link = "logit"),
                   control = list(maxit = 1000))
      
      if (!modelo$converged) {
        cat("   ⚠️ GLM não convergiu, tentando com mais iterações...\n")
        modelo <- glm(formula_obj, data = df, family = binomial(link = "logit"),
                     control = list(maxit = 10000))
      }
      
      metodo_usado <- "glm"
      cat("   ✅ GLM executado com sucesso\n")
      
    }, error = function(e) {
      cat("   ⚠️ GLM falhou:", e$message, "\n")
      
      # Tentar com pacote logistf se disponível
      if (requireNamespace("logistf", quietly = TRUE)) {
        cat("   🔧 Tentando regressão de Firth...\n")
        tryCatch({
          library(logistf)
          modelo <- logistf(formula_obj, data = df)
          metodo_usado <- "firth"
          cat("   ✅ Regressão de Firth executada\n")
        }, error = function(e2) {
          cat("   ❌ Firth também falhou:", e2$message, "\n")
          stop("Nenhum método conseguiu ajustar o modelo")
        })
      } else {
        # Tentar fórmula simplificada
        if (tipo == "multipla" && length(x_vars) > 1) {
          cat("   🔧 Tentando com a primeira variável apenas...\n")
          formula_simple <- as.formula(paste(y_var, "~", x_vars[1]))
          modelo <- glm(formula_simple, data = df, family = binomial(link = "logit"),
                       control = list(maxit = 1000))
          tipo <- "simples"
          x_var <- x_vars[1]
          metodo_usado <- "glm_simplificado"
          cat("   ✅ Modelo simplificado executado\n")
        } else {
          stop("Não foi possível ajustar o modelo")
        }
      }
    })
    
    if (is.null(modelo)) {
      stop("Falha ao criar o modelo")
    }
    
    # Extrair resultados
    if (metodo_usado == "firth") {
      # Resultados para Firth
      coefs <- modelo$coefficients
      p_values <- modelo$prob
      se <- sqrt(diag(modelo$var))
      z_values <- coefs / se
      
      coef_matrix <- cbind(
        Estimate = coefs,
        `Std. Error` = se,
        `z value` = z_values,
        `Pr(>|z|)` = p_values
      )
      
      # Predições para Firth
      predicted_probs <- predict(modelo, type = "response")
      predicted_class <- ifelse(predicted_probs > 0.5, 1, 0)
      
      # Métricas
      accuracy <- mean(predicted_class == (as.numeric(df[[y_var]]) - 1))
      
      # AUC
      actual_numeric <- as.numeric(df[[y_var]]) - 1
      if (length(unique(actual_numeric)) == 2) {
        roc_obj <- roc(actual_numeric, predicted_probs, quiet = TRUE)
        auc_value <- as.numeric(auc(roc_obj))
      } else {
        auc_value <- NA
      }
      
      # AIC aproximado
      loglik_val <- modelo$loglik[2]
      k <- length(coefs)
      aic_val <- -2 * loglik_val + 2 * k
      bic_val <- -2 * loglik_val + k * log(nrow(df))
      
    } else {
      # Resultados para GLM
      sumario <- summary(modelo)
      coef_matrix <- sumario$coefficients
      
      # Predições
      predicted_probs <- predict(modelo, type = "response")
      predicted_class <- ifelse(predicted_probs > 0.5, 1, 0)
      actual_class <- as.numeric(df[[y_var]]) - 1
      
      # Métricas
      accuracy <- mean(predicted_class == actual_class, na.rm = TRUE)
      
      # AUC
      if (length(unique(actual_class)) == 2) {
        roc_obj <- roc(actual_class, predicted_probs, quiet = TRUE)
        auc_value <- as.numeric(auc(roc_obj))
      } else {
        auc_value <- NA
      }
      
      # AIC/BIC
      aic_val <- AIC(modelo)
      bic_val <- BIC(modelo)
    }
    
    # Criar lista de coeficientes
    coeficientes <- list()
    for (i in 1:nrow(coef_matrix)) {
      var_name <- rownames(coef_matrix)[i]
      p_val <- as.numeric(coef_matrix[i, ncol(coef_matrix)])
      
      coeficientes[[var_name]] <- list(
        estimate = as.numeric(coef_matrix[i, 1]),
        std_error = as.numeric(coef_matrix[i, 2]),
        z_value = as.numeric(coef_matrix[i, 3]),
        p_value = p_val,
        odds_ratio = as.numeric(exp(coef_matrix[i, 1])),
        odds_ratio_ci_lower = as.numeric(exp(coef_matrix[i, 1] - 1.96 * coef_matrix[i, 2])),
        odds_ratio_ci_upper = as.numeric(exp(coef_matrix[i, 1] + 1.96 * coef_matrix[i, 2])),
        significativo_95 = p_val < 0.05,
        significativo_99 = p_val < 0.01,
        significativo_999 = p_val < 0.001,
        significancia_estrelas = if(p_val < 0.001) "***" else if(p_val < 0.01) "**" else if(p_val < 0.05) "*" else if(p_val < 0.1) "." else ""
      )
    }
    
    # Matriz de confusão
    conf_matrix <- table(Predicted = predicted_class, Actual = actual_class)
    
    # Métricas de classificação
    if (nrow(conf_matrix) == 2 && ncol(conf_matrix) == 2) {
      TP <- as.numeric(conf_matrix[2, 2])
      TN <- as.numeric(conf_matrix[1, 1])
      FP <- as.numeric(conf_matrix[2, 1])
      FN <- as.numeric(conf_matrix[1, 2])
      
      precision <- if(TP + FP > 0) TP / (TP + FP) else NA
      recall <- if(TP + FN > 0) TP / (TP + FN) else NA
      specificity <- if(TN + FP > 0) TN / (TN + FP) else NA
      f1_score <- if(!is.na(precision) && !is.na(recall) && (precision + recall) > 0) {
        2 * (precision * recall) / (precision + recall)
      } else NA
      
    } else {
      precision <- NA
      recall <- NA
      specificity <- NA
      f1_score <- NA
    }
    
    # Equações
    intercept <- as.numeric(coef_matrix[1, 1])
    
    format_coef <- function(x) {
      if (is.na(x)) return("NA")
      if (abs(x) < 0.0001 && x != 0) {
        return(format(x, scientific = TRUE, digits = 4))
      }
      return(sprintf("%.6f", x))
    }
    
    if (tipo == "simples") {
      slope <- as.numeric(coef_matrix[2, 1])
      equacao_texto <- sprintf("P(%s = 1) = 1 / (1 + exp(-(%s + %s * %s)))", 
                              y_var, format_coef(intercept), format_coef(slope), x_var)
    } else {
      slopes <- as.numeric(coef_matrix[-1, 1])
      var_names <- rownames(coef_matrix)[-1]
      terms <- paste(format_coef(slopes), "*", var_names, collapse = " + ")
      equacao_texto <- sprintf("P(%s = 1) = 1 / (1 + exp(-(%s + %s)))", 
                              y_var, format_coef(intercept), terms)
    }
    
    # Resultado final
    resultado <- list(
      success = TRUE,
      tipo = tipo,
      metodo = metodo_usado,
      formula = formula_str,
      timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S"),
      
      coeficientes = coeficientes,
      
      metricas = list(
        aic = as.numeric(aic_val),
        bic = as.numeric(bic_val),
        log_likelihood = if(metodo_usado == "firth") as.numeric(loglik_val) else as.numeric(logLik(modelo)),
        n_observacoes = as.numeric(nrow(df)),
        n_predictors = if(tipo == "simples") 1 else length(x_vars),
        convergiu = if(metodo_usado == "firth") TRUE else as.logical(modelo$converged)
      ),
      
      classificacao = list(
        accuracy = as.numeric(accuracy),
        precision = as.numeric(precision),
        recall = as.numeric(recall),
        specificity = as.numeric(specificity),
        f1_score = as.numeric(f1_score),
        auc = if(!is.na(auc_value)) as.numeric(auc_value) else NA
      ),
      
      matriz_confusao = list(
        true_negatives = if(exists("TN")) as.numeric(TN) else 0,
        false_positives = if(exists("FP")) as.numeric(FP) else 0,
        false_negatives = if(exists("FN")) as.numeric(FN) else 0,
        true_positives = if(exists("TP")) as.numeric(TP) else 0
      ),
      
      equacao = equacao_texto,
      
      distribuicao_classes = list(
        classe_0 = as.numeric(classe_counts["0"]),
        classe_1 = as.numeric(classe_counts["1"]),
        proporcao_0 = sprintf("%.1f%%", (classe_counts["0"] / nrow(df)) * 100),
        proporcao_1 = sprintf("%.1f%%", (classe_counts["1"] / nrow(df)) * 100)
      ),
      
      predicoes = list(
        probabilidades = as.numeric(predicted_probs),
        classes_previstas = as.numeric(predicted_class),
        classes_reais = as.numeric(actual_class)
      )
    )
    
    cat("\n✅ Regressão logística executada com sucesso!\n")
    cat("   Tipo:", tipo, "\n")
    cat("   Método:", metodo_usado, "\n")
    cat("   Observações:", nrow(df), "\n")
    cat("   AIC:", round(aic_val, 2), "\n")
    cat("   Acurácia:", paste0(round(accuracy * 100, 1), "%"), "\n")
    if (!is.na(auc_value)) cat("   AUC:", round(auc_value, 4), "\n")
    
    # Salvar resultado
    write_json(resultado, output_file, auto_unbox = TRUE, pretty = TRUE, digits = 6)
    
  }, error = function(e) {
    cat("❌ Erro na regressão logística:", e$message, "\n")
    
    resultado <- list(
      success = FALSE,
      error = e$message,
      tipo = "logistica",
      timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S"),
      recomendacoes = c(
        "Verifique se a variável Y tem pelo menos 2 classes distintas (0 e 1)",
        "Certifique-se de que há pelo menos 5-10 observações válidas após limpeza",
        "Verifique se as variáveis X são numéricas (ou podem ser convertidas)",
        "Tente usar uma única variável preditora primeiro",
        "Verifique se não há valores ausentes (NA) nos dados"
      )
    )
    
    write_json(resultado, output_file, auto_unbox = TRUE, pretty = TRUE)
  })
}

main()