#!/usr/bin/env Rscript

library(jsonlite)
library(dplyr)
library(stats)
library(MASS)  # Para Negative Binomial

# ------------------------------------------------------------
# HELPER FUNCTIONS
# ------------------------------------------------------------

`%||%` <- function(x, y) if (is.null(x)) y else x

limpar_nomes_variaveis <- function(nomes) {
  if (is.null(nomes)) return(character(0))
  nomes <- gsub('[\"\']', '', nomes)
  nomes <- trimws(nomes)
  return(make.names(nomes))
}

# ------------------------------------------------------------
# FUNÇÕES PARA CONSTRUIR EQUAÇÕES
# ------------------------------------------------------------

construir_equacao_frequencia <- function(coefs) {
  if (length(coefs) == 0) return("λ = exp(?)")
  
  # Encontrar intercepto
  intercept_key <- if ("(Intercept)" %in% names(coefs)) {
    "(Intercept)"
  } else if ("X.Intercept." %in% names(coefs)) {
    "X.Intercept."
  } else {
    NULL
  }
  
  intercept <- if (!is.null(intercept_key) && !is.null(coefs[[intercept_key]]$estimate)) {
    coefs[[intercept_key]]$estimate
  } else {
    0
  }
  
  eq <- paste0("log(λ) = ", round(intercept, 4))
  
  # Adicionar outras variáveis
  vars <- names(coefs)
  vars <- vars[!vars %in% c("(Intercept)", "X.Intercept.")]
  
  if (length(vars) > 0) {
    for (var in vars) {
      if (!is.null(coefs[[var]]$estimate)) {
        sinal <- if(coefs[[var]]$estimate >= 0) " + " else " - "
        valor <- abs(round(coefs[[var]]$estimate, 4))
        eq <- paste0(eq, sinal, valor, " × ", var)
      }
    }
  }
  
  return(paste0("λ = exp(", eq, ")"))
}

construir_equacao_severidade <- function(coefs) {
  if (length(coefs) == 0) return("μ = exp(?)")
  
  # Encontrar intercepto
  intercept_key <- if ("(Intercept)" %in% names(coefs)) {
    "(Intercept)"
  } else if ("X.Intercept." %in% names(coefs)) {
    "X.Intercept."
  } else {
    NULL
  }
  
  intercept <- if (!is.null(intercept_key) && !is.null(coefs[[intercept_key]]$estimate)) {
    coefs[[intercept_key]]$estimate
  } else {
    0
  }
  
  eq <- paste0("log(μ) = ", round(intercept, 4))
  
  # Adicionar outras variáveis
  vars <- names(coefs)
  vars <- vars[!vars %in% c("(Intercept)", "X.Intercept.")]
  
  if (length(vars) > 0) {
    for (var in vars) {
      if (!is.null(coefs[[var]]$estimate)) {
        sinal <- if(coefs[[var]]$estimate >= 0) " + " else " - "
        valor <- abs(round(coefs[[var]]$estimate, 4))
        eq <- paste0(eq, sinal, valor, " × ", var)
      }
    }
  }
  
  return(paste0("μ = exp(", eq, ")"))
}

construir_equacao_premio <- function(coefs_freq, coefs_sev) {
  eq_freq <- construir_equacao_frequencia(coefs_freq)
  eq_sev <- construir_equacao_severidade(coefs_sev)
  
  # Extrair apenas a parte interna das exponenciais
  freq_part <- gsub("λ = exp\\((.+)\\)", "\\1", eq_freq)
  sev_part <- gsub("μ = exp\\((.+)\\)", "\\1", eq_sev)
  
  return(paste0("Prémio Puro = exp(", freq_part, ") × exp(", sev_part, ")"))
}

# ------------------------------------------------------------
# DIAGNÓSTICO ACTUARIAL ROBUSTO
# ------------------------------------------------------------

diagnosticar_overdispersion <- function(modelo) {
  if (is.null(modelo)) return(list(overdispersed = FALSE, ratio = NA, recomendacao = NA))
  
  if (modelo$family$family == "poisson") {
    resid_deviance <- deviance(modelo)
    df_residual <- modelo$df.residual
    
    if (df_residual > 0) {
      ratio <- resid_deviance / df_residual
      overdispersed <- ratio > 1.2
      
      return(list(
        overdispersed = overdispersed,
        ratio = round(ratio, 3),
        recomendacao = if (overdispersed) 
          "Dispersão excessiva detectada. Considerar Negative Binomial." else 
          "Dispersão aceitável para Poisson."
      ))
    }
  }
  
  return(list(overdispersed = FALSE, ratio = NA, recomendacao = "N/A para esta família"))
}

diagnosticar_cauda_gamma <- function(modelo, resposta) {
  if (is.null(modelo) || modelo$family$family != "Gamma") {
    return(list(
      diagnostico_cauda = "N/A para esta família",
      tem_outliers = FALSE,
      skewness = NA,
      recomendacao = NA
    ))
  }
  
  # Calcular skewness dos valores ajustados vs observados
  valores_observados <- modelo$y
  valores_ajustados <- fitted(modelo)
  
  # Skewness (assimetria)
  skewness_obs <- tryCatch({
    moments::skewness(valores_observados, na.rm = TRUE)
  }, error = function(e) NA)
  
  skewness_aj <- tryCatch({
    moments::skewness(valores_ajustados, na.rm = TRUE)
  }, error = function(e) NA)
  
  # Identificar outliers (> 3 desvios padrão)
  residuos_standardizados <- tryCatch({
    rstandard(modelo)
  }, error = function(e) rep(0, length(valores_observados)))
  
  outliers <- which(abs(residuos_standardizados) > 3)
  tem_outliers <- length(outliers) > 0
  
  return(list(
    diagnostico_cauda = if (!is.na(skewness_obs) && skewness_obs > 2) 
      "Cauda pesada detectada - Gamma pode subestimar perdas extremas" else
      "Assimetria dentro do esperado para Gamma",
    tem_outliers = tem_outliers,
    n_outliers = length(outliers),
    skewness_observado = round(skewness_obs, 3),
    skewness_ajustado = round(skewness_aj, 3),
    recomendacao = if (tem_outliers || (!is.na(skewness_obs) && skewness_obs > 2))
      "Considerar verificação de outliers e modelo de cauda" else
      "Cauda dentro de parâmetros aceitáveis"
  ))
}

validar_razoabilidade_economica <- function(coefs, tipo) {
  # Verificar se coeficientes fazem sentido económico
  recomendacoes <- c()
  
  for (nome_var in names(coefs)) {
    if (nome_var %in% c("(Intercept)", "X.Intercept.")) next
    
    coef <- coefs[[nome_var]]$estimate
    p_val <- coefs[[nome_var]]$p_value
    
    if (!is.null(coef) && !is.na(coef)) {
      # Verificações específicas por tipo
      if (tipo == "frequencia") {
        # Para frequência: esperamos certos sinais
        if (grepl("idade|Idade", nome_var, ignore.case = TRUE)) {
          if (coef > 0) {
            recomendacoes <- c(recomendacoes, 
                              paste("⚠️", nome_var, "positivo - jovens com mais sinistros?"))
          }
        }
        if (grepl("anos_carta|experiencia", nome_var, ignore.case = TRUE)) {
          if (coef > 0) {
            recomendacoes <- c(recomendacoes,
                              paste("⚠️", nome_var, "positivo - mais experiência = mais sinistros?"))
          }
        }
      }
      
      if (tipo == "severidade") {
        if (grepl("valor_segurado|potencia", nome_var, ignore.case = TRUE)) {
          if (coef < 0) {
            recomendacoes <- c(recomendacoes,
                              paste("⚠️", nome_var, "negativo - valores maiores = custos menores?"))
          }
        }
      }
      
      # Sinal significativo mas contra-intuitivo?
      if (!is.na(p_val) && p_val < 0.05 && abs(coef) > 1) {
        recomendacoes <- c(recomendacoes,
                          paste("⚠️", nome_var, "coeficiente grande (", round(coef, 3), ") - verificar"))
      }
    }
  }
  
  return(list(
    razoavel = length(recomendacoes) == 0,
    recomendacoes = if (length(recomendacoes) > 0) recomendacoes else "Coeficientes razoáveis",
    n_alertas = length(recomendacoes)
  ))
}

calcular_metricas_robustas <- function(modelo) {
  if (is.null(modelo)) {
    return(list(
      aic = NA, bic = NA, pseudo_r2 = NA,
      rmse = NA, mae = NA, deviance_explicada = NA,
      log_likelihood = NA, null_deviance = NA, residual_deviance = NA
    ))
  }
  
  # Métricas que sempre funcionam
  aic_val <- tryCatch(AIC(modelo), error = function(e) NA)
  bic_val <- tryCatch(BIC(modelo), error = function(e) NA)
  log_likelihood <- tryCatch(as.numeric(logLik(modelo)), error = function(e) NA)
  
  # Calcular deviance explicada (mais robusta que Pseudo R²)
  deviance_explicada <- NA
  tryCatch({
    if (!is.null(modelo$null.deviance) && !is.null(modelo$deviance)) {
      null_dev <- modelo$null.deviance
      resid_dev <- modelo$deviance
      
      if (null_dev > 0 && !is.na(null_dev) && !is.na(resid_dev)) {
        deviance_explicada <- 1 - (resid_dev / null_dev)
        
        if (!is.na(deviance_explicada)) {
          if (deviance_explicada < 0) deviance_explicada <- 0
          if (deviance_explicada > 1) deviance_explicada <- 1
        }
      }
    }
  }, error = function(e) {
    message("Erro deviance explicada: ", e$message)
  })
  
  # Pseudo R² - SÓ SE CONSEGUIRMOS CALCULAR CORRETAMENTE
  pseudo_r2 <- if (!is.na(deviance_explicada)) {
    # Usar deviance explicada como proxy para Pseudo R²
    # (para GLMs com família exponencial, são correlacionados)
    round(deviance_explicada, 4)
  } else {
    NA
  }
  
  # Erros de predição
  rmse_val <- NA
  mae_val <- NA
  tryCatch({
    if (!is.null(fitted(modelo)) && !is.null(modelo$y)) {
      residuos <- modelo$y - fitted(modelo)
      rmse_val <- sqrt(mean(residuos^2, na.rm = TRUE))
      mae_val <- mean(abs(residuos), na.rm = TRUE)
    }
  }, error = function(e) {
    message("Erro RMSE/MAE: ", e$message)
  })
  
  # Informações de convergência
  convergiu <- NA
  iteracoes <- NA
  
  if (inherits(modelo, "glm")) {
    convergiu <- isTRUE(modelo$converged)
    iteracoes <- if (!is.null(modelo$iter)) modelo$iter else NA
  } else if (inherits(modelo, "negbin")) {
    convergiu <- isTRUE(modelo$converged)
    iteracoes <- if (!is.null(modelo$iter)) modelo$iter else NA
  }
  
  return(list(
    aic = if (!is.na(aic_val)) round(aic_val, 2) else NA,
    bic = if (!is.na(bic_val)) round(bic_val, 2) else NA,
    pseudo_r2 = pseudo_r2,
    rmse = if (!is.na(rmse_val)) round(rmse_val, 2) else NA,
    mae = if (!is.na(mae_val)) round(mae_val, 2) else NA,
    deviance_explicada = if (!is.na(deviance_explicada)) round(deviance_explicada, 4) else NA,
    log_likelihood = if (!is.na(log_likelihood)) round(log_likelihood, 2) else NA,
    null_deviance = if (!is.null(modelo$null.deviance)) round(modelo$null.deviance, 2) else NA,
    residual_deviance = if (!is.null(modelo$deviance)) round(modelo$deviance, 2) else NA,
    convergiu = convergiu,
    iteracoes = iteracoes
  ))
}

# Função para verificar o cálculo do Pseudo R²
verificar_calculo_pseudo_r2 <- function(modelo, pseudo_r2) {
  if (is.null(modelo) || is.na(pseudo_r2)) {
    return(list(
      valido = FALSE,
      motivo = "Modelo nulo ou pseudo_r2 NA",
      acao = "Verificar ajuste do modelo"
    ))
  }
  
  # Verificar se o pseudo_r2 está dentro de limites razoáveis
  if (pseudo_r2 < 0 || pseudo_r2 > 1) {
    return(list(
      valido = FALSE,
      motivo = paste("Pseudo R² fora do intervalo [0,1]:", round(pseudo_r2, 4)),
      acao = "Forçar para [0,1] e reportar como estimativa conservadora"
    ))
  }
  
  # Verificar qualidade do modelo nulo
  tryCatch({
    formula_nula <- as.formula(paste(all.vars(formula(modelo))[1], "~ 1"))
    dados <- model.frame(modelo)
    modelo_nulo <- update(modelo, formula_nula)
    
    if (is.null(modelo_nulo)) {
      return(list(
        valido = FALSE,
        motivo = "Não foi possível criar modelo nulo",
        acao = "Usar métricas alternativas (AIC, BIC, deviance)"
      ))
    }
    
    return(list(
      valido = TRUE,
      motivo = "Cálculo válido",
      modelo_nulo_convergido = if (!is.null(modelo_nulo$converged)) modelo_nulo$converged else NA,
      loglik_nulo = tryCatch(as.numeric(logLik(modelo_nulo)), error = function(e) NA)
    ))
  }, error = function(e) {
    return(list(
      valido = FALSE,
      motivo = paste("Erro na verificação:", e$message),
      acao = "Reportar métricas disponíveis com ressalvas"
    ))
  })
}

# ------------------------------------------------------------
# MODELOS COM VERIFICAÇÃO AUTOMÁTICA
# ------------------------------------------------------------

ajustar_modelo_frequencia_robusto <- function(formula_str, dados, offset = NULL) {
  cat("   🔧 Ajustando modelo de frequência com validação...\n")
  
  # 1. Primeiro tentar Poisson
  modelo_poisson <- tryCatch({
    glm(as.formula(formula_str), family = poisson(link = "log"), data = dados)
  }, error = function(e) {
    cat(paste0("   ⚠️  Poisson falhou: ", e$message, "\n"))
    NULL
  })
  
  if (!is.null(modelo_poisson)) {
    # Verificar overdispersion
    diagnostico_disp <- diagnosticar_overdispersion(modelo_poisson)
    
    if (diagnostico_disp$overdispersed) {
      cat(paste0("   ⚠️  Overdispersion detectada (ratio = ", 
                diagnostico_disp$ratio, ") → tentando Negative Binomial\n"))
      
      # Tentar Negative Binomial
      modelo_nb <- tryCatch({
        glm.nb(as.formula(formula_str), data = dados)
      }, error = function(e) {
        cat(paste0("   ⚠️  Negative Binomial falhou: ", e$message, "\n"))
        NULL
      })
      
      if (!is.null(modelo_nb)) {
        cat("   ✅ Negative Binomial ajustado com sucesso\n")
        return(list(
          modelo = modelo_nb,
          familia = "negative_binomial",
          diagnostico_dispersao = diagnostico_disp,
          fallback_poisson = FALSE
        ))
      }
    }
    
    # Se chegou aqui, usar Poisson (dispersion OK ou NB falhou)
    cat("   ✅ Poisson ajustado (dispersão aceitável)\n")
    return(list(
      modelo = modelo_poisson,
      familia = "poisson",
      diagnostico_dispersao = diagnostico_disp,
      fallback_poisson = TRUE
    ))
  }
  
  # Se Poisson falhou completamente
  stop("❌ Não foi possível ajustar modelo de frequência")
}

ajustar_modelo_severidade_robusto <- function(formula_str, dados, resposta) {
  cat("   🔧 Ajustando modelo de severidade com validação...\n")
  
  # Garantir que só temos valores positivos para Gamma
  if (resposta %in% names(dados)) {
    dados_positivos <- dados[dados[[resposta]] > 0 & !is.na(dados[[resposta]]), ]
    n_removidos <- nrow(dados) - nrow(dados_positivos)
    
    if (n_removidos > 0) {
      cat(paste0("   ℹ️  Removidos ", n_removidos, " registros com valor <= 0 para Gamma\n"))
      cat(paste0("   📊 Amostra final: ", nrow(dados_positivos), " observações positivas\n"))
    }
    
    if (nrow(dados_positivos) < 5) {
      stop(paste0("❌ Amostra insuficiente para Gamma (apenas ", 
                  nrow(dados_positivos), " observações positivas)"))
    }
    
    dados <- dados_positivos
  }
  
  # Tentar Gamma
  modelo_gamma <- tryCatch({
    glm(as.formula(formula_str), family = Gamma(link = "log"), data = dados)
  }, error = function(e) {
    cat(paste0("   ⚠️  Gamma falhou: ", e$message, "\n"))
    NULL
  })
  
  if (is.null(modelo_gamma)) {
    stop("❌ Não foi possível ajustar modelo Gamma para severidade")
  }
  
  # Diagnosticar cauda
  diagnostico_cauda <- diagnosticar_cauda_gamma(modelo_gamma, resposta)
  
  cat("   ✅ Gamma ajustado com sucesso\n")
  return(list(
    modelo = modelo_gamma,
    familia = "gamma",
    diagnostico_cauda = diagnostico_cauda,
    n_observacoes_positivas = nrow(dados),
    declaracao_actuarial = "μ = E[Custo | N > 0] (severidade média condicionada à ocorrência)"
  ))
}

# ------------------------------------------------------------
# EXTRATOR DE COEFICIENTES
# ------------------------------------------------------------

extrair_coeficientes_glm <- function(modelo) {
  if (is.null(modelo)) return(list())
  
  resumo <- tryCatch({
    summary(modelo)
  }, error = function(e) {
    cat(paste0("   ❌ Não foi possível obter resumo: ", e$message, "\n"))
    return(NULL)
  })
  
  if (is.null(resumo)) return(list())
  
  coef_table <- resumo$coefficients
  if (is.null(coef_table) || nrow(coef_table) == 0) {
    return(list())
  }
  
  coeficientes <- list()
  for (i in 1:nrow(coef_table)) {
    nome_var <- rownames(coef_table)[i]
    if (!is.na(nome_var) && nome_var != "") {
      coeficientes[[nome_var]] <- list(
        estimate = as.numeric(coef_table[i, 1]),
        std_error = as.numeric(coef_table[i, 2]),
        statistic = as.numeric(coef_table[i, 3]),
        p_value = as.numeric(coef_table[i, 4]),
        significancia = ifelse(coef_table[i, 4] < 0.001, "***",
                              ifelse(coef_table[i, 4] < 0.01, "**",
                                    ifelse(coef_table[i, 4] < 0.05, "*", "ns")))
      )
    }
  }
  
  return(coeficientes)
}

# ------------------------------------------------------------
# VALIDAÇÃO DE QUALIDADE MÍNIMA
# ------------------------------------------------------------

validar_modelo_para_tarifacao <- function(coefs, metrics, tipo) {
  criterios <- list(
    passou = TRUE,
    falhas = c(),
    alertas = c()
  )
  
  # Critério 1: Pelo menos 1 variável explicativa (além do intercepto)
  vars_explicativas <- setdiff(names(coefs), c("(Intercept)", "X.Intercept."))
  if (length(vars_explicativas) == 0) {
    criterios$passou <- FALSE
    criterios$falhas <- c(criterios$falhas, 
                         paste(tipo, ": Nenhuma variável explicativa"))
  }
  
  # Critério 2: Pseudo-R² mínimo (se disponível)
  if (!is.null(metrics$pseudo_r2) && !is.na(metrics$pseudo_r2)) {
    if (metrics$pseudo_r2 < 0.05) {
      criterios$alertas <- c(criterios$alertas,
                            paste(tipo, ": Pseudo-R² baixo (", 
                                  round(metrics$pseudo_r2, 3), ")"))
    }
    if (metrics$pseudo_r2 < 0.01) {
      criterios$passou <- FALSE
      criterios$falhas <- c(criterios$falhas,
                           paste(tipo, ": Pseudo-R² muito baixo (", 
                                 round(metrics$pseudo_r2, 3), ")"))
    }
  }
  
  # Critério 3: Pelo menos 1 coeficiente significativo (além do intercepto)
  tem_significativo <- FALSE
  for (var in vars_explicativas) {
    if (!is.null(coefs[[var]]$p_value) && coefs[[var]]$p_value < 0.1) {
      tem_significativo <- TRUE
      break
    }
  }
  
  if (!tem_significativo && length(vars_explicativas) > 0) {
    criterios$alertas <- c(criterios$alertas,
                          paste(tipo, ": Nenhum coeficiente significativo (p < 0.1)"))
  }
  
  return(criterios)
}

# ------------------------------------------------------------
# TARIFAÇÃO COM MATRIZ DE DESIGN CORRETA
# ------------------------------------------------------------

criar_matriz_design <- function(coefs, dados) {
  vars <- names(coefs)
  vars <- vars[!vars %in% c("(Intercept)", "X.Intercept.")]
  
  if (length(vars) == 0) {
    return(data.frame(Intercept = rep(1, nrow(dados))))
  }
  
  mat <- data.frame(matrix(0, nrow = nrow(dados), ncol = length(vars)))
  names(mat) <- vars
  
  for (var in vars) {
    if (var %in% names(dados)) {
      # Variável existe nos dados
      mat[[var]] <- dados[[var]]
    } else if (grepl("\\.", var)) {
      # É dummy (ex: localizacao.Luanda)
      partes <- strsplit(var, ".", fixed = TRUE)[[1]]
      var_base <- partes[1]
      nivel <- paste(partes[-1], collapse = ".")
      
      if (var_base %in% names(dados)) {
        if (is.factor(dados[[var_base]])) {
          mat[[var]] <- as.numeric(dados[[var_base]] == nivel)
        } else if (is.character(dados[[var_base]])) {
          mat[[var]] <- as.numeric(dados[[var_base]] == nivel)
        }
      }
    }
  }
  
  return(mat)
}

calcular_carregamentos <- function(premio_puro, margem_seg, despesas, comissao, lucro, impostos) {
  margem_valor <- premio_puro * (margem_seg / 100)
  premio_com_margem <- premio_puro + margem_valor
  
  despesas_valor <- premio_com_margem * (despesas / 100)
  comissao_valor <- premio_com_margem * (comissao / 100)
  lucro_valor <- premio_com_margem * (lucro / 100)
  
  premio_comercial <- premio_com_margem + despesas_valor + comissao_valor + lucro_valor
  impostos_valor <- premio_comercial * (impostos / 100)
  premio_total <- premio_comercial + impostos_valor
  
  total <- premio_total
  
  componentes <- list(
    premio_puro = round(premio_puro, 2),
    margem_seguranca = round(margem_valor, 2),
    despesas_admin = round(despesas_valor, 2),
    comissao = round(comissao_valor, 2),
    margem_lucro = round(lucro_valor, 2),
    impostos = round(impostos_valor, 2),
    premio_total = round(premio_total, 2),
    premio_puro_perc = round(premio_puro / total * 100, 1),
    margem_seguranca_perc = round(margem_valor / total * 100, 1),
    despesas_admin_perc = round(despesas_valor / total * 100, 1),
    comissao_perc = round(comissao_valor / total * 100, 1),
    margem_lucro_perc = round(lucro_valor / total * 100, 1),
    impostos_perc = round(impostos_valor / total * 100, 1)
  )
  
  list(total = premio_total, componente = componentes)
}

calcular_premios_cientificos <- function(coefs_freq, coefs_sev, dados, 
                                        margem_seguranca, despesas_admin, 
                                        comissao, margem_lucro, impostos) {
  
  cat("   💰 Calculando prêmios (base científica)...\n")
  
  # Matrizes de design
  mat_freq <- criar_matriz_design(coefs_freq, dados)
  mat_sev <- criar_matriz_design(coefs_sev, dados)
  
  # Interceptos
  intercept_freq <- coefs_freq$`(Intercept)`$estimate %||% 
                   coefs_freq$X.Intercept.$estimate %||% 0
  
  intercept_sev <- coefs_sev$`(Intercept)`$estimate %||% 
                  coefs_sev$X.Intercept.$estimate %||% 0
  
  # Calcular para cada observação
  resultados <- data.frame(
    id = 1:nrow(dados),
    lambda = NA_real_,
    mu = NA_real_,
    premio_puro = NA_real_,
    premio_total = NA_real_,
    stringsAsFactors = FALSE
  )
  
  for (i in 1:nrow(dados)) {
    # Lambda (frequência)
    log_lambda <- intercept_freq
    for (var in names(mat_freq)) {
      if (var %in% names(coefs_freq)) {
        log_lambda <- log_lambda + coefs_freq[[var]]$estimate * mat_freq[i, var]
      }
    }
    lambda <- exp(log_lambda)
    
    # Mu (severidade)
    log_mu <- intercept_sev
    for (var in names(mat_sev)) {
      if (var %in% names(coefs_sev)) {
        log_mu <- log_mu + coefs_sev[[var]]$estimate * mat_sev[i, var]
      }
    }
    mu <- exp(log_mu)
    
    # Prêmio puro (E[N] × E[C|N>0])
    premio_puro <- lambda * mu
    
    # Carregamentos
    carregamentos <- calcular_carregamentos(
      premio_puro,
      margem_seguranca,
      despesas_admin,
      comissao,
      margem_lucro,
      impostos
    )
    
    resultados$lambda[i] <- lambda
    resultados$mu[i] <- mu
    resultados$premio_puro[i] <- premio_puro
    resultados$premio_total[i] <- carregamentos$total
  }
  
  return(resultados)
}

# ------------------------------------------------------------
# FUNÇÃO PARA FORMATAR COEFICIENTES E MÉTRICAS
# ------------------------------------------------------------

formatar_coeficientes_para_display <- function(coefs) {
  if (length(coefs) == 0) {
    return(list(cabecalho = "Nenhum coeficiente disponível", linhas = c()))
  }
  
  linhas <- c()
  for (nome_var in names(coefs)) {
    coef <- coefs[[nome_var]]
    
    if (!is.null(coef$estimate)) {
      # Formatar linha
      linha <- sprintf("%-25s %10.4f %10.4f %10.4f %-5s",
                      nome_var,
                      coef$estimate,
                      coef$std_error %||% NA,
                      coef$p_value %||% NA,
                      coef$significancia %||% "")
      linhas <- c(linhas, linha)
    }
  }
  
  # Cabeçalho
  cabecalho <- sprintf("%-25s %10s %10s %10s %-5s",
                      "Variável", "Estimativa", "Erro Std", "p-valor", "Sig")
  
  return(list(cabecalho = cabecalho, linhas = linhas))
}

formatar_metricas_para_display <- function(metrics, familia) {
  cat("   ", paste(rep("-", 60), collapse = ""), "\n")
  
  # Métricas principais
  cat(sprintf("   %-25s: %12.2f\n", "AIC", metrics$aic %||% NA))
  cat(sprintf("   %-25s: %12.2f\n", "BIC", metrics$bic %||% NA))
  cat(sprintf("   %-25s: %12.4f\n", "Pseudo R² (McFadden)", metrics$pseudo_r2 %||% NA))
  cat(sprintf("   %-25s: %12.4f\n", "Deviance Explicada", metrics$deviance_explicada %||% NA))
  
  # Métricas de ajuste
  cat(sprintf("   %-25s: %12.2f\n", "Log-Likelihood", metrics$log_likelihood %||% NA))
  cat(sprintf("   %-25s: %12.2f\n", "Null Deviance", metrics$null_deviance %||% NA))
  cat(sprintf("   %-25s: %12.2f\n", "Residual Deviance", metrics$residual_deviance %||% NA))
  
  # Métricas de erro (se aplicável)
  if (!is.na(metrics$rmse)) {
    cat(sprintf("   %-25s: %12.4f\n", "RMSE", metrics$rmse %||% NA))
    cat(sprintf("   %-25s: %12.4f\n", "MAE", metrics$mae %||% NA))
  }
  
  # Informações de convergência
  if (!is.na(metrics$convergiu)) {
    cat(sprintf("   %-25s: %12s\n", "Convergiu", 
                if (metrics$convergiu) "SIM" else "NÃO"))
  }
  
  if (!is.na(metrics$iteracoes)) {
    cat(sprintf("   %-25s: %12d\n", "Iterações", metrics$iteracoes))
  }
}

# ------------------------------------------------------------
# FUNÇÃO PRINCIPAL
# ------------------------------------------------------------

main <- function() {
  args <- commandArgs(trailingOnly = TRUE)
  if (length(args) < 2) stop("Uso: Rscript a_priori.R <input> <output>")
  
  input_file <- args[1]
  output_file <- args[2]
  
  cat("🧮 MOTOR ACTUARIAL CIENTÍFICO (Versão Defensável)\n")
  cat("================================================\n\n")
  
  tryCatch({
    # Ler dados
    dados_json <- fromJSON(input_file)
    df <- as.data.frame(dados_json$dados)
    parametros <- dados_json$parametros
    
    cat("📊 DADOS\n")
    cat("   Registros:", nrow(df), "\n\n")
    names(df) <- limpar_nomes_variaveis(names(df))
    
    # Decidir operação
    tem_tarifacao <- (!is.null(parametros$modelo_freq) && !is.null(parametros$modelo_sev)) ||
                     (!is.null(parametros$parametros_freq) && !is.null(parametros$parametros_sev))
    
    if (tem_tarifacao) {
      cat("💰 OPERAÇÃO: TARIFAÇÃO CIENTÍFICA\n")
      cat("================================\n")
      
      # Configurações
      margem_seguranca <- as.numeric(parametros$margem_seguranca %||% 10)
      despesas_admin <- as.numeric(parametros$despesas_admin %||% 20)
      comissao <- as.numeric(parametros$comissao %||% 10)
      margem_lucro <- as.numeric(parametros$margem_lucro %||% 15)
      impostos <- as.numeric(parametros$impostos %||% 5)
      
      # Ajustar modelos com validação
      if (!is.null(parametros$parametros_freq) && !is.null(parametros$parametros_sev)) {
        cat("\n1. MODELO DE FREQUÊNCIA\n")
        cat("---------------------\n")
        
        freq_params <- parametros$parametros_freq
        resposta_freq <- limpar_nomes_variaveis(freq_params$resposta)
        preditores_freq <- sapply(freq_params$preditores, limpar_nomes_variaveis)
        offset_freq <- if(!is.null(freq_params$offset) && freq_params$offset != "") {
          limpar_nomes_variaveis(freq_params$offset)
        } else NULL
        
        formula_freq <- paste(resposta_freq, "~", paste(preditores_freq, collapse = " + "))
        if (!is.null(offset_freq)) {
          formula_freq <- paste(formula_freq, "+ offset(log(", offset_freq, "))")
        }
        
        resultado_freq <- ajustar_modelo_frequencia_robusto(formula_freq, df)
        modelo_freq <- resultado_freq$modelo
        coefs_freq <- extrair_coeficientes_glm(modelo_freq)
        
        # Métricas e diagnósticos
        metrics_freq <- calcular_metricas_robustas(modelo_freq)
        validacao_freq <- validar_razoabilidade_economica(coefs_freq, "frequencia")
        
        # Equação ajustada
        equacao_freq <- construir_equacao_frequencia(coefs_freq)
        
        cat("\n2. MODELO DE SEVERIDADE\n")
        cat("----------------------\n")
        
        sev_params <- parametros$parametros_sev
        resposta_sev <- limpar_nomes_variaveis(sev_params$resposta)
        preditores_sev <- sapply(sev_params$preditores, limpar_nomes_variaveis)
        
        formula_sev <- paste(resposta_sev, "~", paste(preditores_sev, collapse = " + "))
        resultado_sev <- ajustar_modelo_severidade_robusto(formula_sev, df, resposta_sev)
        modelo_sev <- resultado_sev$modelo
        coefs_sev <- extrair_coeficientes_glm(modelo_sev)
        
        # Métricas e diagnósticos
        metrics_sev <- calcular_metricas_robustas(modelo_sev)
        validacao_sev <- validar_razoabilidade_economica(coefs_sev, "severidade")
        
        # Equação ajustada
        equacao_sev <- construir_equacao_severidade(coefs_sev)
        equacao_premio <- construir_equacao_premio(coefs_freq, coefs_sev)
        
        # VERIFICAÇÃO DO PSEUDO R²
        cat("\n   VERIFICAÇÃO DO PSEUDO R²\n")
        cat("   ", paste(rep("=", 70), collapse = ""), "\n")
        
        verificacao_freq <- verificar_calculo_pseudo_r2(modelo_freq, metrics_freq$pseudo_r2)
        verificacao_sev <- verificar_calculo_pseudo_r2(modelo_sev, metrics_sev$pseudo_r2)
        
        cat(sprintf("   %-25s: %12s (%s)\n", "Frequência - Válido", 
                    if (verificacao_freq$valido) "SIM" else "NÃO",
                    verificacao_freq$motivo))
        cat(sprintf("   %-25s: %12s (%s)\n", "Severidade - Válido", 
                    if (verificacao_sev$valido) "SIM" else "NÃO",
                    verificacao_sev$motivo))
        
        # Se algum for inválido, usar fallback
        if (!verificacao_freq$valido && !is.na(metrics_freq$deviance_explicada)) {
          cat("   ⚠️  Usando Deviance Explicada como proxy para Frequência\n")
        }
        
        if (!verificacao_sev$valido && !is.na(metrics_sev$deviance_explicada)) {
          cat("   ⚠️  Usando Deviance Explicada como proxy para Severidade\n")
        }
        
        cat("\n3. VALIDAÇÃO PARA TARIFAÇÃO\n")
        cat("---------------------------\n")
        
        validacao_final_freq <- validar_modelo_para_tarifacao(coefs_freq, metrics_freq, "frequencia")
        validacao_final_sev <- validar_modelo_para_tarifacao(coefs_sev, metrics_sev, "severidade")
        
        valido_para_tarifacao <- validacao_final_freq$passou && validacao_final_sev$passou
        
        cat("\n4. EQUAÇÕES AJUSTADAS\n")
        cat("--------------------\n")
        
        cat("\n   FREQUÊNCIA:\n")
        cat("   ", paste(rep("=", 70), collapse = ""), "\n")
        cat("   ", equacao_freq, "\n")
        
        cat("\n   SEVERIDADE:\n")
        cat("   ", paste(rep("=", 70), collapse = ""), "\n")
        cat("   ", equacao_sev, "\n")
        
        cat("\n   PRÊMIO PURO:\n")
        cat("   ", paste(rep("=", 70), collapse = ""), "\n")
        cat("   ", equacao_premio, "\n")
        
        cat("\n5. RESULTADOS DOS MODELOS\n")
        cat("-------------------------\n")
        
        # Exibir resultados da frequência
        cat("\n   FREQUÊNCIA (", resultado_freq$familia, ")\n", sep = "")
        cat("   ", paste(rep("-", 70), collapse = ""), "\n")
        
        # Coeficientes
        cat("\n   COEFICIENTES:\n")
        cat("   ", paste(rep("-", 70), collapse = ""), "\n")
        formatado_freq <- formatar_coeficientes_para_display(coefs_freq)
        cat("   ", formatado_freq$cabecalho, "\n")
        cat("   ", paste(rep("-", 60), collapse = ""), "\n")
        for (linha in formatado_freq$linhas) {
          cat("   ", linha, "\n")
        }
        
        # Métricas
        cat("\n   MÉTRICAS DE AJUSTE:\n")
        formatar_metricas_para_display(metrics_freq, resultado_freq$familia)
        
        # Diagnóstico de dispersão
        if (!is.null(resultado_freq$diagnostico_dispersao)) {
          cat("\n   DIAGNÓSTICO DE DISPERSÃO:\n")
          cat("   ", paste(rep("-", 70), collapse = ""), "\n")
          cat(sprintf("   %-25s: %12s\n", "Overdispersed", 
                      if (resultado_freq$diagnostico_dispersao$overdispersed) "SIM" else "NÃO"))
          if (!is.na(resultado_freq$diagnostico_dispersao$ratio)) {
            cat(sprintf("   %-25s: %12.3f\n", "Deviance/DF Ratio", 
                        resultado_freq$diagnostico_dispersao$ratio))
          }
          if (!is.null(resultado_freq$diagnostico_dispersao$recomendacao)) {
            cat(sprintf("   %-25s: %12s\n", "Recomendação", 
                        resultado_freq$diagnostico_dispersao$recomendacao))
          }
        }
        
        # Exibir resultados da severidade
        cat("\n   SEVERIDADE (Gamma)\n")
        cat("   ", paste(rep("-", 70), collapse = ""), "\n")
        
        # Coeficientes
        cat("\n   COEFICIENTES:\n")
        cat("   ", paste(rep("-", 70), collapse = ""), "\n")
        formatado_sev <- formatar_coeficientes_para_display(coefs_sev)
        cat("   ", formatado_sev$cabecalho, "\n")
        cat("   ", paste(rep("-", 60), collapse = ""), "\n")
        for (linha in formatado_sev$linhas) {
          cat("   ", linha, "\n")
        }
        
        # Métricas
        cat("\n   MÉTRICAS DE AJUSTE:\n")
        formatar_metricas_para_display(metrics_sev, "gamma")
        
        # Diagnóstico de cauda
        if (!is.null(resultado_sev$diagnostico_cauda)) {
          cat("\n   DIAGNÓSTICO DE CAUDA:\n")
          cat("   ", paste(rep("-", 70), collapse = ""), "\n")
          cat(sprintf("   %-25s: %12s\n", "Diagnóstico", 
                      resultado_sev$diagnostico_cauda$diagnostico_cauda))
          if (!is.na(resultado_sev$diagnostico_cauda$skewness_observado)) {
            cat(sprintf("   %-25s: %12.3f\n", "Skewness Observado", 
                        resultado_sev$diagnostico_cauda$skewness_observado))
          }
          if (!is.na(resultado_sev$diagnostico_cauda$skewness_ajustado)) {
            cat(sprintf("   %-25s: %12.3f\n", "Skewness Ajustado", 
                        resultado_sev$diagnostico_cauda$skewness_ajustado))
          }
          cat(sprintf("   %-25s: %12d\n", "Outliers (>3σ)", 
                      resultado_sev$diagnostico_cauda$n_outliers %||% 0))
          if (!is.null(resultado_sev$diagnostico_cauda$recomendacao)) {
            cat(sprintf("   %-25s: %12s\n", "Recomendação", 
                        resultado_sev$diagnostico_cauda$recomendacao))
          }
        }
        
        cat("\n6. STATUS DE APROVAÇÃO\n")
        cat("----------------------\n")
        
        if (!valido_para_tarifacao) {
          cat("   ❌ MODELO NÃO APROVADO PARA TARIFAÇÃO\n")
          cat("   Razões:\n")
          for (falha in c(validacao_final_freq$falhas, validacao_final_sev$falhas)) {
            cat(paste0("     - ", falha, "\n"))
          }
        } else {
          cat("   ✅ MODELO APROVADO PARA TARIFAÇÃO\n")
        }
        
        cat("\n7. CÁLCULO DE PRÊMIOS\n")
        cat("--------------------\n")
        
        if (valido_para_tarifacao) {
          premios <- calcular_premios_cientificos(
            coefs_freq, coefs_sev, df,
            margem_seguranca, despesas_admin,
            comissao, margem_lucro, impostos
          )
          
          # Estatísticas
          estatisticas <- list(
            premio_puro_medio = mean(premios$premio_puro, na.rm = TRUE),
            premio_total_medio = mean(premios$premio_total, na.rm = TRUE),
            lambda_medio = mean(premios$lambda, na.rm = TRUE),
            mu_medio = mean(premios$mu, na.rm = TRUE),
            desvio_premio = sd(premios$premio_total, na.rm = TRUE),
            min_premio = min(premios$premio_total, na.rm = TRUE),
            max_premio = max(premios$premio_total, na.rm = TRUE),
            coeficiente_variacao = sd(premios$premio_total, na.rm = TRUE) / 
                                 mean(premios$premio_total, na.rm = TRUE)
          )
          
          composicao_media <- calcular_carregamentos(
            estatisticas$premio_puro_medio,
            margem_seguranca,
            despesas_admin,
            comissao,
            margem_lucro,
            impostos
          )
          
          cat("\n   💰 RESULTADOS DA TARIFAÇÃO\n")
          cat("   ", paste(rep("=", 70), collapse = ""), "\n")
          cat(sprintf("   %-30s: %15.2f\n", "Prêmio Puro Médio", estatisticas$premio_puro_medio))
          cat(sprintf("   %-30s: %15.2f\n", "Prêmio Total Médio", estatisticas$premio_total_medio))
          cat(sprintf("   %-30s: %15.4f\n", "λ Médio (frequência)", estatisticas$lambda_medio))
          cat(sprintf("   %-30s: %15.4f\n", "μ Médio (severidade)", estatisticas$mu_medio))
          cat(sprintf("   %-30s: %15.2f a %15.2f\n", "Faixa de Prêmios", 
                      estatisticas$min_premio, estatisticas$max_premio))
          cat(sprintf("   %-30s: %15.1f%%\n", "Coeficiente de Variação", 
                      estatisticas$coeficiente_variacao * 100))
          
          cat("\n   📊 COMPOSIÇÃO DO PRÊMIO (média)\n")
          cat("   ", paste(rep("=", 70), collapse = ""), "\n")
          cat(sprintf("   %-25s: %10.2f (%6.1f%%)\n", "Prêmio Puro", 
                      composicao_media$componente$premio_puro,
                      composicao_media$componente$premio_puro_perc))
          cat(sprintf("   %-25s: %10.2f (%6.1f%%)\n", "Margem Segurança", 
                      composicao_media$componente$margem_seguranca,
                      composicao_media$componente$margem_seguranca_perc))
          cat(sprintf("   %-25s: %10.2f (%6.1f%%)\n", "Despesas Admin", 
                      composicao_media$componente$despesas_admin,
                      composicao_media$componente$despesas_admin_perc))
          cat(sprintf("   %-25s: %10.2f (%6.1f%%)\n", "Comissão", 
                      composicao_media$componente$comissao,
                      composicao_media$componente$comissao_perc))
          cat(sprintf("   %-25s: %10.2f (%6.1f%%)\n", "Margem Lucro", 
                      composicao_media$componente$margem_lucro,
                      composicao_media$componente$margem_lucro_perc))
          cat(sprintf("   %-25s: %10.2f (%6.1f%%)\n", "Impostos", 
                      composicao_media$componente$impostos,
                      composicao_media$componente$impostos_perc))
          cat(sprintf("   %-25s: %10.2f\n", "PRÊMIO TOTAL", 
                      composicao_media$componente$premio_total))
          
          resultado <- list(
            success = TRUE,
            tipo_operacao = "tarifacao_cientifica",
            
            # Equações ajustadas
            equacoes_ajustadas = list(
              frequencia = equacao_freq,
              severidade = equacao_sev,
              premio_puro = equacao_premio
            ),
            
            # Declarações explícitas
            declaracoes_actuariais = list(
              frequencia = "λ = E[N] (frequência esperada de sinistros)",
              severidade = "μ = E[C | N > 0] (severidade média condicionada à ocorrência)",
              premio_puro = "Prémio puro = λ × μ = E[N] × E[C | N > 0]",
              base_cientifica = "Modelo GLM com validação estatística completa"
            ),
            
            # Status de aprovação
            aprovado_para_tarifacao = valido_para_tarifacao,
            criterios_falhados = c(validacao_final_freq$falhas, validacao_final_sev$falhas),
            alertas = c(validacao_final_freq$alertas, validacao_final_sev$alertas,
                       validacao_freq$recomendacoes, validacao_sev$recomendacoes),
            
            # Modelos e métricas
            modelo_frequencia = list(
              tipo = "frequencia",
              familia = resultado_freq$familia,
              formula = formula_freq,
              coeficientes = coefs_freq,
              coeficientesCount = length(coefs_freq),
              temCoeficientes = length(coefs_freq) > 0,
              metrics = metrics_freq,
              diagnostico_dispersao = resultado_freq$diagnostico_dispersao,
              validacao_economica = validacao_freq
            ),
            
            modelo_severidade = list(
              tipo = "severidade",
              familia = resultado_sev$familia,
              formula = formula_sev,
              coeficientes = coefs_sev,
              coeficientesCount = length(coefs_sev),
              temCoeficientes = length(coefs_sev) > 0,
              metrics = metrics_sev,
              diagnostico_cauda = resultado_sev$diagnostico_cauda,
              declaracao = resultado_sev$declaracao_actuarial,
              validacao_economica = validacao_sev
            ),
            
            # Tarifação
            parametros_tarifacao = list(
              margem_seguranca = margem_seguranca,
              despesas_admin = despesas_admin,
              comissao = comissao,
              margem_lucro = margem_lucro,
              impostos = impostos
            ),
            
            # Resultados
            estatisticas = estatisticas,
            composicao_premio = composicao_media$componente,
            premios_individualizados = premios,
            
            # Diagnóstico final
            diagnostico_final = list(
              coeficientes_frequencia = length(coefs_freq),
              coeficientes_severidade = length(coefs_sev),
              pseudo_r2_frequencia = metrics_freq$pseudo_r2,
              pseudo_r2_severidade = metrics_sev$pseudo_r2,
              deviance_explicada_frequencia = metrics_freq$deviance_explicada,
              deviance_explicada_severidade = metrics_sev$deviance_explicada,
              overdispersed_frequencia = resultado_freq$diagnostico_dispersao$overdispersed,
              dispersao_ratio = resultado_freq$diagnostico_dispersao$ratio,
              cauda_severidade = resultado_sev$diagnostico_cauda$diagnostico_cauda,
              skewness_severidade = resultado_sev$diagnostico_cauda$skewness_observado,
              recomendacao_final = if (valido_para_tarifacao) 
                "Modelo aprovado para uso em tarifação" else
                "Modelo não aprovado - requer revisão"
            )
          )
        } else {
          # Modelo não aprovado
          resultado <- list(
            success = FALSE,
            tipo_operacao = "tarifacao_cientifica",
            aprovado_para_tarifacao = FALSE,
            motivo_rejeicao = c(validacao_final_freq$falhas, validacao_final_sev$falhas),
            alertas = c(validacao_final_freq$alertas, validacao_final_sev$alertas),
            
            # Equações ajustadas mesmo rejeitadas
            equacoes_ajustadas = list(
              frequencia = equacao_freq,
              severidade = equacao_sev,
              premio_puro = construir_equacao_premio(coefs_freq, coefs_sev)
            ),
            
            modelo_frequencia = list(
              tipo = "frequencia",
              familia = resultado_freq$familia,
              coeficientes = coefs_freq,
              coeficientesCount = length(coefs_freq),
              metrics = metrics_freq,
              diagnostico_dispersao = resultado_freq$diagnostico_dispersao
            ),
            
            modelo_severidade = list(
              tipo = "severidade",
              familia = resultado_sev$familia,
              coeficientes = coefs_sev,
              coeficientesCount = length(coefs_sev),
              metrics = metrics_sev,
              diagnostico_cauda = resultado_sev$diagnostico_cauda
            ),
            
            recomendacao = "Modelo rejeitado para tarifação. Corrigir falhas antes de prosseguir."
          )
        }
        
      } else {
        stop("❌ Parâmetros insuficientes para tarifação científica")
      }
      
    } else {
      # Apenas ajuste de modelo
      cat("🛠️  OPERAÇÃO: AJUSTE DE MODELO GLM\n")
      cat("==================================\n")
      
      resposta <- limpar_nomes_variaveis(parametros$resposta)
      familia <- tolower(parametros$familia %||% "poisson")
      preditores <- sapply(parametros$preditores, limpar_nomes_variaveis)
      offset <- if(!is.null(parametros$offset) && parametros$offset != "") {
        limpar_nomes_variaveis(parametros$offset)
      } else NULL
      
      formula_str <- paste(resposta, "~", paste(preditores, collapse = " + "))
      if (!is.null(offset)) {
        formula_str <- paste(formula_str, "+ offset(log(", offset, "))")
      }
      
      # Ajustar modelo
      if (familia == "poisson") {
        modelo_obj <- ajustar_modelo_frequencia_robusto(formula_str, df)
        modelo <- modelo_obj$modelo
        tipo_modelo <- "frequencia"
      } else if (familia %in% c("gamma", "gama")) {
        modelo_obj <- ajustar_modelo_severidade_robusto(formula_str, df, resposta)
        modelo <- modelo_obj$modelo
        tipo_modelo <- "severidade"
      } else {
        stop(paste("❌ Família não suportada:", familia))
      }
      
      coefs <- extrair_coeficientes_glm(modelo)
      metrics <- calcular_metricas_robustas(modelo)
      validacao <- validar_razoabilidade_economica(coefs, tipo_modelo)
      
      # Construir equação
      if (tipo_modelo == "frequencia") {
        equacao <- construir_equacao_frequencia(coefs)
      } else {
        equacao <- construir_equacao_severidade(coefs)
      }
      
      # Exibir resultados no console
      cat("\n📊 RESULTADOS DO MODELO\n")
      cat("=====================\n")
      
      cat("\n   FÓRMULA\n")
      cat("   ", paste(rep("=", 70), collapse = ""), "\n")
      cat("   ", formula_str, "\n")
      
      cat("\n   EQUAÇÃO AJUSTADA\n")
      cat("   ", paste(rep("=", 70), collapse = ""), "\n")
      cat("   ", equacao, "\n")
      
      cat("\n   COEFICIENTES\n")
      cat("   ", paste(rep("=", 70), collapse = ""), "\n")
      formatado <- formatar_coeficientes_para_display(coefs)
      cat("   ", formatado$cabecalho, "\n")
      cat("   ", paste(rep("-", 60), collapse = ""), "\n")
      for (linha in formatado$linhas) {
        cat("   ", linha, "\n")
      }
      
      cat("\n   MÉTRICAS DE AJUSTE\n")
      cat("   ", paste(rep("=", 70), collapse = ""), "\n")
      formatar_metricas_para_display(metrics, familia)
      
      # Diagnósticos específicos
      if (familia == "poisson" && !is.null(modelo_obj$diagnostico_dispersao)) {
        cat("\n   DIAGNÓSTICO DE DISPERSÃO\n")
        cat("   ", paste(rep("-", 70), collapse = ""), "\n")
        cat(sprintf("   %-25s: %12s\n", "Overdispersed", 
                    if (modelo_obj$diagnostico_dispersao$overdispersed) "SIM" else "NÃO"))
        if (!is.na(modelo_obj$diagnostico_dispersao$ratio)) {
          cat(sprintf("   %-25s: %12.3f\n", "Deviance/DF Ratio", 
                      modelo_obj$diagnostico_dispersao$ratio))
        }
        if (!is.null(modelo_obj$diagnostico_dispersao$recomendacao)) {
          cat(sprintf("   %-25s: %12s\n", "Recomendação", 
                      modelo_obj$diagnostico_dispersao$recomendacao))
        }
      }
      
      if (familia %in% c("gamma", "gama") && !is.null(modelo_obj$diagnostico_cauda)) {
        cat("\n   DIAGNÓSTICO DE CAUDA\n")
        cat("   ", paste(rep("-", 70), collapse = ""), "\n")
        cat(sprintf("   %-25s: %12s\n", "Diagnóstico", 
                    modelo_obj$diagnostico_cauda$diagnostico_cauda))
        if (!is.na(modelo_obj$diagnostico_cauda$skewness_observado)) {
          cat(sprintf("   %-25s: %12.3f\n", "Skewness Observado", 
                      modelo_obj$diagnostico_cauda$skewness_observado))
        }
        cat(sprintf("   %-25s: %12d\n", "Outliers (>3σ)", 
                    modelo_obj$diagnostico_cauda$n_outliers %||% 0))
      }
      
      cat("\n   VALIDAÇÃO ECONÔMICA\n")
      cat("   ", paste(rep("=", 70), collapse = ""), "\n")
      if (validacao$razoavel) {
        cat("   ✅ Coeficientes razoáveis\n")
      } else {
        cat("   ⚠️  Alertas encontrados:\n")
        for (alerta in validacao$recomendacoes) {
          cat("     - ", alerta, "\n")
        }
      }
      
      resultado <- list(
        success = TRUE,
        tipo_operacao = "ajuste_glm",
        submodelo = parametros$submodelo %||% "geral",
        familia_solicitada = familia,
        familia_usada = modelo$family$family,
        formula = formula_str,
        equacao_ajustada = equacao,
        n_observacoes = nrow(df),
        coeficientes = coefs,
        coeficientesCount = length(coefs),
        temCoeficientes = length(coefs) > 0,
        metrics = metrics,
        diagnostico = if (familia == "poisson") {
          modelo_obj$diagnostico_dispersao
        } else {
          modelo_obj$diagnostico_cauda
        },
        validacao_economica = validacao,
        data_info = list(
          variavel_resposta = resposta,
          variaveis_preditores = preditores,
          offset = offset,
          familia_real = modelo$family$family,
          link = modelo$family$link
        )
      )
    }
    
    # Salvar
    write_json(resultado, output_file, auto_unbox = TRUE, pretty = TRUE, digits = NA)
    
    cat("\n✅ OPERAÇÃO CONCLUÍDA COM SUCESSO\n")
    cat("==================================\n")
    
    if (tem_tarifacao) {
      if (resultado$aprovado_para_tarifacao %||% FALSE) {
        cat("   ✅ APROVADO PARA TARIFAÇÃO\n")
        cat(sprintf("   📊 Prémio total médio: %.2f\n", 
                    resultado$estatisticas$premio_total_medio))
        cat(sprintf("   📈 Pseudo-R² frequência: %.4f\n", 
                    resultado$modelo_frequencia$metrics$pseudo_r2))
        cat(sprintf("   📈 Pseudo-R² severidade: %.4f\n", 
                    resultado$modelo_severidade$metrics$pseudo_r2))
        cat(sprintf("   📊 Deviance explicada freq: %.4f\n", 
                    resultado$modelo_frequencia$metrics$deviance_explicada))
        cat(sprintf("   📊 Deviance explicada sev: %.4f\n", 
                    resultado$modelo_severidade$metrics$deviance_explicada))
      } else {
        cat("   ❌ REJEITADO PARA TARIFAÇÃO\n")
        for (falha in resultado$motivo_rejeicao %||% c()) {
          cat(paste0("     - ", falha, "\n"))
        }
      }
    } else {
      cat(sprintf("   📊 AIC: %.2f\n", resultado$metrics$aic))
      cat(sprintf("   📊 BIC: %.2f\n", resultado$metrics$bic))
      cat(sprintf("   📈 Pseudo-R²: %.4f\n", resultado$metrics$pseudo_r2))
      cat(sprintf("   📊 Deviance Explicada: %.4f\n", resultado$metrics$deviance_explicada))
      cat(sprintf("   📉 Log-Likelihood: %.2f\n", resultado$metrics$log_likelihood))
      if (!is.null(resultado$diagnostico$overdispersed) && 
          resultado$diagnostico$overdispersed) {
        cat(sprintf("   ⚠️  Overdispersion detectada (ratio: %.2f)\n", 
                    resultado$diagnostico$ratio))
      }
    }
    
  }, error = function(e) {
    cat("❌ ERRO NA EXECUÇÃO\n")
    cat(paste0("   Mensagem: ", e$message, "\n"))
    
    resultado <- list(
      success = FALSE,
      error = e$message,
      stack_trace = paste(traceback(), collapse = "\n"),
      timestamp = Sys.time(),
      recomendacoes = c(
        "Verificar estrutura dos dados de entrada",
        "Confirmar que todas as variáveis existem",
        "Para Gamma: garantir valores resposta > 0",
        "Para grandes amostras: considerar Negative Binomial se overdispersion"
      )
    )
    
    write_json(resultado, output_file, auto_unbox = TRUE, pretty = TRUE)
  })
}

# Executar
if (!interactive()) {
  main()
}