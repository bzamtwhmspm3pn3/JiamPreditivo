# backend/r-engine/regression/linear.R (VERSÃO CORRIGIDA)
#!/usr/bin/env Rscript

library(jsonlite)

args <- commandArgs(trailingOnly = TRUE)

if (length(args) < 2) {
  stop("Uso: Rscript linear.R <input.json> <output.json>")
}

input_file <- args[1]
output_file <- args[2]

main <- function() {
  tryCatch({
    # Ler dados de entrada
    input_data <- fromJSON(input_file)
    
    tipo <- input_data$tipo
    dados <- input_data$dados
    parametros <- input_data$parametros
    
    cat("📊 Processando modelo:", tipo, "\n")
    cat("📈 Número de registros recebidos:", length(dados), "\n")
    
    # Converter para dataframe
    df <- as.data.frame(dados)
    
    # Extrair variáveis
    y_var <- parametros$y
    
    if (is.null(y_var) || y_var == "") {
      stop("❌ Variável Y não especificada")
    }
    
    # Determinar variáveis X
    x_vars <- character(0)
    
    if (!is.null(parametros$x_multiplas) && parametros$x_multiplas != "") {
      x_vars <- unlist(strsplit(parametros$x_multiplas, ","))
    } else if (!is.null(parametros$x) && parametros$x != "") {
      x_vars <- parametros$x
    } else {
      x_vars <- names(df)[names(df) != y_var]
    }
    
    # Verificar se variáveis existem
    all_vars <- c(y_var, x_vars)
    missing_vars <- setdiff(all_vars, names(df))
    if (length(missing_vars) > 0) {
      stop(paste("❌ Variáveis não encontradas:", paste(missing_vars, collapse = ", ")))
    }
    
    # Converter para numérico
    for (var in all_vars) {
      if (!is.numeric(df[[var]])) {
        num_col <- suppressWarnings(as.numeric(df[[var]]))
        if (all(is.na(num_col))) {
          stop(paste("❌ Variável", var, "não pode ser convertida para numérico"))
        }
        df[[var]] <- num_col
      }
    }
    
    # Remover NA
    df_clean <- df[complete.cases(df[, all_vars]), ]
    
    # Executar regressão
    formula_str <- paste(y_var, "~", paste(x_vars, collapse = " + "))
    modelo <- lm(as.formula(formula_str), data = df_clean)
    
    # Resumo
    resumo <- summary(modelo)
    
    # Coeficientes com formatação correta
    coef_table <- resumo$coefficients
    coeficientes <- lapply(1:nrow(coef_table), function(i) {
      list(
        termo = rownames(coef_table)[i],
        estimativa = as.numeric(coef_table[i, 1]),
        erro = as.numeric(coef_table[i, 2]),
        estatistica = as.numeric(coef_table[i, 3]),
        valor_p = as.numeric(coef_table[i, 4]),
        significancia = ifelse(coef_table[i, 4] < 0.001, "***",
                              ifelse(coef_table[i, 4] < 0.01, "**",
                                    ifelse(coef_table[i, 4] < 0.05, "*", "ns")))
      )
    })
    
    # Métricas
    r2 <- resumo$r.squared
    r2_adj <- resumo$adj.r.squared
    residuos <- residuals(modelo)
    rmse <- sqrt(mean(residuos^2))
    mae <- mean(abs(residuos))
    
    # Teste F
    f_stat <- resumo$fstatistic[1]
    p_valor_global <- pf(f_stat, resumo$fstatistic[2], resumo$fstatistic[3], lower.tail = FALSE)
    
    # AIC e BIC
    aic_val <- AIC(modelo)
    bic_val <- BIC(modelo)
    
    # ANOVA
    anova_table <- anova(modelo)
    anova_result <- lapply(1:nrow(anova_table), function(i) {
      list(
        fonte = rownames(anova_table)[i],
        df = as.numeric(anova_table$Df[i]),
        sq = as.numeric(anova_table$`Sum Sq`[i]),
        qm = as.numeric(anova_table$`Mean Sq`[i]),
        f = as.numeric(anova_table$`F value`[i]),
        p = as.numeric(anova_table$`Pr(>F)`[i])
      )
    })
    
    # Equação estimada
    coef_vals <- coef(modelo)
    equacao_parts <- character()
    
    for (i in seq_along(coef_vals)) {
      coef_name <- names(coef_vals)[i]
      coef_value <- coef_vals[i]
      
      if (coef_name == "(Intercept)") {
        equacao_parts <- c(equacao_parts, sprintf("%.8f", coef_value))
      } else {
        if (abs(coef_value) < 0.0001) {
          equacao_parts <- c(equacao_parts, sprintf("%.4e * %s", coef_value, coef_name))
        } else {
          equacao_parts <- c(equacao_parts, sprintf("%.8f * %s", coef_value, coef_name))
        }
      }
    }
    
    equacao_estimada <- paste(y_var, "=", paste(equacao_parts, collapse = " + "))
    equacao_estimada <- gsub("\\+ -", "- ", equacao_estimada)
    
    # Resultado
    resultado <- list(
      success = TRUE,
      simulacao = FALSE,
      tipo_modelo = tipo,
      coeficientes = coeficientes,
      qualidade = list(
        R2 = r2,
        R2ajustado = r2_adj,
        RMSE = rmse,
        MAE = mae,
        AIC = aic_val,
        BIC = bic_val,
        F_statistic = f_stat,
        p_valor_global = p_valor_global,
        n_observacoes = nrow(df_clean),
        n_variaveis = length(x_vars)
      ),
      anova = anova_result,
      equacao_estimada = equacao_estimada,
      formula = formula_str,
      variaveis_simulacao = x_vars,
      resumo = paste(
        "Modelo de regressão linear executado com sucesso.",
        sprintf("R² = %.4f", r2),
        sprintf("R² ajustado = %.4f", r2_adj),
        sprintf("RMSE = %.4f", rmse),
        sep = " | "
      )
    )
    
    write_json(resultado, output_file, auto_unbox = TRUE, pretty = TRUE)
    
    cat("✅ Modelo executado com sucesso!\n")
    
  }, error = function(e) {
    resultado <- list(
      success = FALSE,
      error = e$message,
      simulacao = FALSE
    )
    write_json(resultado, output_file, auto_unbox = TRUE, pretty = TRUE)
  })
}

main()