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
    
    cat("   Registros:", nrow(dados), "\n")
    cat("   Tipo:", parametros$tipo_regressao, "\n")
    
    # Converter para data.frame
    df <- as.data.frame(dados)
    
    # Extrair parâmetros
    y_var <- parametros$y
    x_vars <- parametros$x  # Pode ser string (simples) ou vetor (múltipla)
    link_function <- if(!is.null(parametros$link)) parametros$link else "logit"
    familia <- if(!is.null(parametros$familia)) parametros$familia else "binomial"
    
    # Determinar se é simples ou múltipla
    if (is.character(x_vars) && length(x_vars) == 1) {
      tipo <- "simples"
      x_var <- x_vars
      cat("   Regressão LOGÍSTICA SIMPLES\n")
    } else {
      tipo <- "multipla"
      cat("   Regressão LOGÍSTICA MÚLTIPLA\n")
    }
    
    cat("   Variável Y:", y_var, "\n")
    if (tipo == "simples") {
      cat("   Variável X:", x_var, "\n")
    } else {
      cat("   Variáveis X:", toString(x_vars), "\n")
      cat("   Número de preditoras:", length(x_vars), "\n")
    }
    
    # Verificar se variáveis existem
    if (!y_var %in% names(df)) {
      stop("Variável Y não encontrada no dataframe")
    }
    
    if (tipo == "simples") {
      if (!x_var %in% names(df)) {
        stop("Variável X não encontrada no dataframe")
      }
    } else {
      for (x_var in x_vars) {
        if (!x_var %in% names(df)) {
          stop(paste("Variável X", x_var, "não encontrada no dataframe"))
        }
      }
    }
    
    # Converter Y para fator binário
    df[[y_var]] <- as.character(df[[y_var]])
    df[[y_var]] <- factor(df[[y_var]], levels = c("0", "1"))
    
    # Converter X para numérico
    if (tipo == "simples") {
      df[[x_var]] <- as.numeric(as.character(df[[x_var]]))
    } else {
      for (x_var in x_vars) {
        df[[x_var]] <- as.numeric(as.character(df[[x_var]]))
      }
    }
    
    # Remover NA
    if (tipo == "simples") {
      df_clean <- na.omit(df[c(y_var, x_var)])
    } else {
      df_clean <- na.omit(df[c(y_var, x_vars)])
    }
    
    if (nrow(df_clean) < 10) {
      stop("Dados insuficientes após limpeza (mínimo 10 observações)")
    }
    
    cat("   Dados limpos:", nrow(df_clean), "observações\n")
    
    # DIAGNÓSTICO INICIAL
    cat("\n   🔍 DIAGNÓSTICO INICIAL:\n")
    cat("   Distribuição de", y_var, ":\n")
    table_y <- table(df_clean[[y_var]])
    print(table_y)
    
    # Verificar balanceamento
    prop_classes <- prop.table(table_y)
    cat("   Proporções:", sprintf("%.1f%% / %.1f%%", prop_classes[1]*100, prop_classes[2]*100), "\n")
    
    if (min(prop_classes) < 0.2) {
      cat("   ⚠️  AVISO: Classes desbalanceadas (< 20% na menor classe)\n")
    }
    
    # VERIFICAÇÃO E TRATAMENTO DE MULTICOLINEARIDADE (apenas múltipla)
    if (tipo == "multipla") {
      cat("\n   🔍 VERIFICAÇÃO DE MULTICOLINEARIDADE:\n")
      
      # Calcular matriz de correlação
      cor_matrix <- cor(df_clean[x_vars], use = "complete.obs")
      
      # Identificar variáveis altamente correlacionadas (> 0.9)
      high_cor <- which(abs(cor_matrix) > 0.9 & upper.tri(cor_matrix), arr.ind = TRUE)
      
      if (nrow(high_cor) > 0) {
        cat("   ⚠️  VARIÁVEIS ALTAMENTE CORRELACIONADAS (> 0.9):\n")
        
        for (i in 1:nrow(high_cor)) {
          row_var <- rownames(cor_matrix)[high_cor[i, 1]]
          col_var <- colnames(cor_matrix)[high_cor[i, 2]]
          cor_val <- cor_matrix[high_cor[i, 1], high_cor[i, 2]]
          cat(sprintf("      %s e %s: r = %.3f\n", row_var, col_var, cor_val))
        }
        
        # REMOVER VARIÁVEIS PROBLEMÁTICAS automaticamente
        cat("\n   🔧 REMOVENDO VARIÁVEIS REDUNDANTES...\n")
        
        vars_to_remove <- character(0)
        
        for (i in 1:nrow(high_cor)) {
          row_var <- rownames(cor_matrix)[high_cor[i, 1]]
          col_var <- colnames(cor_matrix)[high_cor[i, 2]]
          
          # Verificar qual variável tem maior correlação com Y
          cor_row_y <- abs(cor(df_clean[[y_var]] == "1", df_clean[[row_var]], use = "complete.obs"))
          cor_col_y <- abs(cor(df_clean[[y_var]] == "1", df_clean[[col_var]], use = "complete.obs"))
          
          # Manter a variável com maior correlação com Y
          if (cor_row_y >= cor_col_y) {
            vars_to_remove <- c(vars_to_remove, col_var)
          } else {
            vars_to_remove <- c(vars_to_remove, row_var)
          }
        }
        
        vars_to_remove <- unique(vars_to_remove)
        vars_to_keep <- setdiff(x_vars, vars_to_remove)
        
        cat("   📝 Variáveis removidas:", toString(vars_to_remove), "\n")
        cat("   📝 Variáveis mantidas:", toString(vars_to_keep), "\n")
        
        # Atualizar variáveis X
        x_vars <- vars_to_keep
        
        if (length(x_vars) < 2) {
          cat("   ⚠️  MUITAS VARIÁVEIS REMOVIDAS! Mantendo todas as variáveis.\n")
          x_vars <- parametros$x  # Voltar às variáveis originais
        }
      } else {
        cat("   ✅ Nenhuma correlação muito alta encontrada (< 0.9).\n")
      }
    }
    
    # Criar fórmula
    if (tipo == "simples") {
      formula_str <- paste(y_var, "~", x_var)
    } else {
      formula_str <- paste(y_var, "~", paste(x_vars, collapse = " + "))
    }
    formula_obj <- as.formula(formula_str)
    cat("\n   📈 Fórmula final:", formula_str, "\n")
    
    # ESTRATÉGIA DE MODELAGEM: GLM primeiro, Firth só se necessário
    cat("   ⚙️  Executando modelo...\n")
    
    modelo <- NULL
    metodo_usado <- "glm"
    warning_messages <- list()
    usar_firth <- FALSE
    
    # PRIMEIRO: Tentar GLM padrão
    tryCatch({
      withCallingHandlers({
        modelo <- glm(
          formula_obj,
          data = df_clean,
          family = binomial(link = link_function),
          control = list(maxit = 1000)
        )
      }, warning = function(w) {
        warning_messages <<- c(warning_messages, w$message)
        invokeRestart("muffleWarning")
      })
      
      # Verificar convergência
      if (!modelo$converged) {
        cat("   ⚠️  GLM não convergiu. Aumentando iterações...\n")
        withCallingHandlers({
          modelo <- glm(
            formula_obj,
            data = df_clean,
            family = binomial(link = link_function),
            control = list(maxit = 5000)
          )
        }, warning = function(w) {
          warning_messages <<- c(warning_messages, w$message)
          invokeRestart("muffleWarning")
        })
      }
      
      # Verificar coeficientes (sinais de separação completa)
      coefs_glm <- coef(modelo)
      if (any(is.na(coefs_glm))) {
        cat("   ⚠️  Coeficientes NA detectados - possível separação completa\n")
        usar_firth <- TRUE
      } else if (any(abs(coefs_glm) > 50, na.rm = TRUE)) {
        cat("   ⚠️  Coeficientes extremamente grandes (> 50) - possível separação completa\n")
        usar_firth <- TRUE
      } else if (!modelo$converged) {
        cat("   ⚠️  GLM não convergiu mesmo com mais iterações\n")
        usar_firth <- TRUE
      }
      
      if (!usar_firth) {
        cat("   ✅ GLM executado com sucesso\n")
      }
      
    }, error = function(e) {
      cat("   ⚠️  GLM falhou:", e$message, "\n")
      usar_firth <- TRUE
    })
    
    # SEGUNDO: Se GLM tem problemas, tentar Firth
    if (usar_firth) {
      cat("   🔧 Tentando regressão de Firth (penalizada)...\n")
      
      tryCatch({
        # Tentar instalar o pacote logistf se necessário
        if (!require("logistf", quietly = TRUE)) {
          cat("   📦 Instalando pacote logistf...\n")
          install.packages("logistf", quiet = TRUE)
        }
        library(logistf, quietly = TRUE)
        
        modelo <- logistf(formula_obj, data = df_clean)
        metodo_usado <- "firth"
        cat("   ✅ Regressão de Firth executada\n")
        
      }, error = function(e) {
        cat("   ❌ Firth também falhou:", e$message, "\n")
        stop("Todos os métodos falharam. Considere simplificar o modelo.")
      })
    }
    
    # Verificar se o modelo foi criado
    if (is.null(modelo)) {
      stop("Falha ao criar o modelo")
    }
    
    # EXTRAIR RESULTADOS CONFORME O MÉTODO
    if (metodo_usado == "firth") {
      # Para Firth
      coefs <- modelo$coefficients
      std_errors <- sqrt(diag(modelo$var))
      p_values <- modelo$prob
      z_values <- coefs / std_errors
      
      coef_matrix <- cbind(
        Estimate = coefs,
        `Std. Error` = std_errors,
        `z value` = z_values,
        `Pr(>|z|)` = p_values
      )
      
      # Métricas para Firth (aproximadas)
      loglik_val <- modelo$loglik[2]
      k <- length(coefs)
      n <- nrow(df_clean)
      
      # AIC aproximado para Firth
      aic_val <- -2 * loglik_val + 2 * k
      
      # BIC aproximado
      bic_val <- -2 * loglik_val + k * log(n)
      
      # Calcular modelo nulo de Firth para pseudo R²
      tryCatch({
        modelo_null <- logistf(as.formula(paste(y_var, "~ 1")), data = df_clean)
        loglik_null <- modelo_null$loglik[2]
        mcfadden_r2 <- 1 - (loglik_val / loglik_null)
        null_deviance <- -2 * loglik_null
        residual_deviance <- -2 * loglik_val
      }, error = function(e) {
        mcfadden_r2 <- NA
        null_deviance <- NA
        residual_deviance <- NA
      })
      
      convergiu <- TRUE
      
    } else {
      # Para GLM
      sumario <- summary(modelo)
      coef_matrix <- sumario$coefficients
      
      aic_val <- AIC(modelo)
      bic_val <- BIC(modelo)
      loglik_val <- logLik(modelo)[1]
      null_deviance <- modelo$null.deviance
      residual_deviance <- modelo$deviance
      mcfadden_r2 <- if(null_deviance > 0) 1 - (residual_deviance / null_deviance) else NA
      convergiu <- modelo$converged
    }
    
    # Criar data.frame de coeficientes
    coef_df <- as.data.frame(coef_matrix)
    names(coef_df) <- c("estimate", "std_error", "z_value", "p_value")
    
    # Calcular Odds Ratio
    odds_ratio <- exp(coef_df$estimate)
    
    # Calcular intervalos de confiança
    conf_int <- tryCatch({
      if (metodo_usado == "firth") {
        exp(confint(modelo))
      } else {
        exp(confint(modelo))
      }
    }, error = function(e) {
      # Calcular ICs aproximados
      ci_lower <- exp(coef_df$estimate - 1.96 * coef_df$std_error)
      ci_upper <- exp(coef_df$estimate + 1.96 * coef_df$std_error)
      matrix(c(ci_lower, ci_upper), ncol = 2,
             dimnames = list(rownames(coef_df), c("2.5 %", "97.5 %")))
    })
    
    # Coeficientes detalhados
    coeficientes <- list()
    for (i in 1:nrow(coef_df)) {
      var_name <- rownames(coef_df)[i]
      
      coeficientes[[var_name]] <- list(
        estimate = as.numeric(coef_df[i, "estimate"]),
        std_error = as.numeric(coef_df[i, "std_error"]),
        z_value = as.numeric(coef_df[i, "z_value"]),
        p_value = as.numeric(coef_df[i, "p_value"]),
        odds_ratio = as.numeric(odds_ratio[i]),
        ci_lower = if(!is.null(conf_int) && !all(is.na(conf_int))) as.numeric(conf_int[i, 1]) else NA,
        ci_upper = if(!is.null(conf_int) && !all(is.na(conf_int))) as.numeric(conf_int[i, 2]) else NA,
        significativo = as.numeric(coef_df[i, "p_value"]) < 0.05
      )
    }
    
    # Predições
    if (metodo_usado == "firth") {
      predicted_probs <- predict(modelo, df_clean, type = "response")
    } else {
      predicted_probs <- predict(modelo, type = "response")
    }
    
    predicted_class <- ifelse(predicted_probs > 0.5, 1, 0)
    actual_class <- as.numeric(as.character(df_clean[[y_var]]))
    
    # Matriz de confusão
    conf_matrix <- table(Predicted = predicted_class, Actual = actual_class)
    
    # Calcular métricas de classificação
    if (nrow(conf_matrix) == 2 && ncol(conf_matrix) == 2) {
      TP <- conf_matrix[2, 2]
      TN <- conf_matrix[1, 1]
      FP <- conf_matrix[2, 1]
      FN <- conf_matrix[1, 2]
      
      accuracy <- (TP + TN) / sum(conf_matrix)
      precision <- if(TP + FP > 0) TP / (TP + FP) else NA
      recall <- if(TP + FN > 0) TP / (TP + FN) else NA
      specificity <- if(TN + FP > 0) TN / (TN + FP) else NA
      f1_score <- if(!is.na(precision) && !is.na(recall) && (precision + recall) > 0) {
        2 * (precision * recall) / (precision + recall)
      } else NA
      
      # Calcular AUC
      if (length(unique(actual_class)) == 2) {
        roc_obj <- roc(actual_class, predicted_probs, quiet = TRUE)
        auc_value <- auc(roc_obj)
      } else {
        auc_value <- NA
      }
    } else {
      accuracy <- mean(predicted_class == actual_class)
      precision <- NA
      recall <- NA
      specificity <- NA
      f1_score <- NA
      auc_value <- NA
    }
    
    # EQUAÇÕES
    coefs_vector <- coef_df$estimate
    names(coefs_vector) <- rownames(coef_df)
    intercept <- coefs_vector[1]
    
    # Formatar coeficientes para display
    format_coef_display <- function(x) {
      if (is.na(x)) return("NA")
      if (abs(x) < 0.0001 && x != 0) {
        return(format(x, scientific = TRUE, digits = 4))
      }
      return(sprintf("%.4f", x))
    }
    
    if (tipo == "simples") {
      slope <- coefs_vector[2]
      
      equacao_texto_simples <- sprintf("P(%s = 1) = 1 / [1 + exp(-(%s + %s * %s))]", 
                                      y_var, format_coef_display(intercept), 
                                      format_coef_display(slope), x_var)
      
      equacao_latex <- sprintf("P(%s = 1) = \\frac{1}{1 + e^{-(%s + %s \\cdot %s)}}", 
                              y_var, format_coef_display(intercept),
                              format_coef_display(slope), x_var)
      
    } else {
      slopes <- coefs_vector[-1]
      var_names <- names(slopes)
      
      terms <- sapply(1:length(slopes), function(i) {
        sprintf("%s * %s", format_coef_display(slopes[i]), var_names[i])
      })
      
      equacao_texto_simples <- sprintf("P(%s = 1) = 1 / [1 + exp(-(%s + %s))]", 
                                      y_var, format_coef_display(intercept),
                                      paste(terms, collapse = " + "))
      
      latex_terms <- sapply(1:length(slopes), function(i) {
        sprintf("%s \\cdot %s", format_coef_display(slopes[i]), var_names[i])
      })
      
      equacao_latex <- sprintf("P(%s = 1) = \\frac{1}{1 + e^{-(%s + %s)}}", 
                              y_var, format_coef_display(intercept),
                              paste(latex_terms, collapse = " + "))
    }
    
    # Preparar resultado
    resultado <- list(
      success = TRUE,
      tipo = tipo,
      metodo = metodo_usado,
      formula = formula_str,
      coeficientes = coeficientes,
      qualidade = list(
        aic = as.numeric(aic_val),
        bic = as.numeric(bic_val),
        log_likelihood = as.numeric(loglik_val),
        null_deviance = as.numeric(null_deviance),
        residual_deviance = as.numeric(residual_deviance),
        mcfadden_r2 = as.numeric(mcfadden_r2),
        accuracy = as.numeric(accuracy),
        precision = as.numeric(precision),
        recall = as.numeric(recall),
        specificity = as.numeric(specificity),
        f1_score = as.numeric(f1_score),
        auc = as.numeric(auc_value),
        n_observacoes = as.numeric(nrow(df_clean)),
        n_predictors = if(tipo == "simples") 1 else length(x_vars),
        convergiu = as.logical(convergiu)
      ),
      matriz_confusao = list(
        "0" = list("0" = if("0" %in% rownames(conf_matrix) && "0" %in% colnames(conf_matrix)) 
                  as.numeric(conf_matrix["0","0"]) else 0,
                  "1" = if("0" %in% rownames(conf_matrix) && "1" %in% colnames(conf_matrix)) 
                  as.numeric(conf_matrix["0","1"]) else 0),
        "1" = list("0" = if("1" %in% rownames(conf_matrix) && "0" %in% colnames(conf_matrix)) 
                  as.numeric(conf_matrix["1","0"]) else 0,
                  "1" = if("1" %in% rownames(conf_matrix) && "1" %in% colnames(conf_matrix)) 
                  as.numeric(conf_matrix["1","1"]) else 0)
      ),
      equacao_estimada = list(
        formula = formula_str,
        tipo = tipo,
        equacao_texto_simples = equacao_texto_simples,
        equacao_latex = equacao_latex,
        intercept = as.numeric(intercept),
        slopes = if(tipo == "simples") {
          setNames(list(as.numeric(coefs_vector[2])), x_var)
        } else {
          as.list(setNames(as.numeric(coefs_vector[-1]), names(coefs_vector[-1])))
        }
      ),
      diagnosticos = list(
        metodo_utilizado = metodo_usado,
        multicolinearidade_tratada = if(tipo == "multipla" && exists("vars_to_remove")) TRUE else FALSE,
        variaveis_removidas = if(exists("vars_to_remove")) vars_to_remove else list(),
        balanceamento_classes = list(
          classe_0 = as.numeric(table_y["0"]),
          classe_1 = as.numeric(table_y["1"]),
          proporcao_classe_0 = sprintf("%.1f%%", prop_classes["0"] * 100),
          proporcao_classe_1 = sprintf("%.1f%%", prop_classes["1"] * 100)
        ),
        warnings = if(length(warning_messages) > 0) unlist(warning_messages) else NA,
        separacao_detectada = usar_firth
      )
    )
    
    # Salvar resultado
    write_json(resultado, output_file, auto_unbox = TRUE, pretty = TRUE, digits = NA)
    
    cat("\n✅ Regressão logística executada com sucesso!\n")
    cat("   Tipo:", tipo, "\n")
    cat("   Método:", metodo_usado, "\n")
    cat("   AIC:", if(!is.na(aic_val)) round(aic_val, 1) else "N/A", "\n")
    cat("   BIC:", if(!is.na(bic_val)) round(bic_val, 1) else "N/A", "\n")
    cat("   Acurácia:", round(accuracy * 100, 1), "%\n")
    if (!is.na(auc_value)) cat("   AUC:", round(as.numeric(auc_value), 3), "\n")
    if (exists("vars_to_remove")) {
      cat("   Variáveis removidas:", toString(vars_to_remove), "\n")
    }
    if (length(warning_messages) > 0) {
      cat("   Warnings capturados:", length(warning_messages), "\n")
    }
    
  }, error = function(e) {
    cat("❌ Erro na regressão logística:", e$message, "\n")
    
    resultado <- list(
      success = FALSE,
      error = e$message,
      tipo = if(exists("tipo")) tipo else "logistica",
      recomendacoes = c(
        "Problema: Dados insuficientes ou separação completa",
        "Solução 1: Verifique o balanceamento das classes",
        "Solução 2: Reduza o número de variáveis preditoras",
        "Solução 3: Aumente o tamanho da amostra",
        "Solução 4: Verifique multicolinearidade entre variáveis"
      )
    )
    
    write_json(resultado, output_file, auto_unbox = TRUE, pretty = TRUE)
  })
}

main()