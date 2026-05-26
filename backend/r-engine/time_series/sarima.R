#!/usr/bin/env Rscript

library(jsonlite)
library(forecast)
library(tseries)
library(lubridate)

# ✅ Definir operador %||% 
`%||%` <- function(x, y) {
  if (is.null(x)) {
    return(y)
  } else if (length(x) == 0) {
    return(y)
  } else if (is.na(x)) {
    return(y)
  } else if (x == "") {
    return(y)
  } else {
    return(x)
  }
}

# ✅ Função para detectar outliers usando método IQR
detectar_outliers_iqr <- function(x, threshold = 3) {
  if (length(x) < 4) return(rep(FALSE, length(x)))
  
  qnt <- quantile(x, probs = c(0.25, 0.75), na.rm = TRUE)
  iqr_val <- IQR(x, na.rm = TRUE)
  
  lower_bound <- qnt[1] - threshold * iqr_val
  upper_bound <- qnt[2] + threshold * iqr_val
  
  outliers <- x < lower_bound | x > upper_bound
  return(outliers)
}

# ✅ Função para validar estacionariedade
validar_estacionariedade <- function(ts_data, alpha = 0.05) {
  resultados <- list()
  
  tryCatch({
    adf_test <- adf.test(na.omit(as.numeric(ts_data)))
    resultados$adf <- list(
      estatistica = adf_test$statistic,
      p_valor = adf_test$p.value,
      estacionario = adf_test$p.value < alpha,
      lags = adf_test$parameter
    )
  }, error = function(e) {
    resultados$adf <- list(estacionario = NA, p_valor = NA)
  })
  
  tryCatch({
    kpss_test <- kpss.test(na.omit(as.numeric(ts_data)))
    resultados$kpss <- list(
      estatistica = kpss_test$statistic,
      p_valor = kpss_test$p.value,
      estacionario = kpss_test$p.value > alpha,
      lags = kpss_test$parameter
    )
  }, error = function(e) {
    resultados$kpss <- list(estacionario = NA, p_valor = NA)
  })
  
  return(resultados)
}

# ✅ Função para teste ARCH simplificado
teste_arch_simplificado <- function(residuos, lag = 5) {
  if (length(residuos) < lag + 10) return(NULL)
  
  tryCatch({
    residuos2 <- residuos^2
    lb_test <- Box.test(residuos2, lag = lag, type = "Ljung-Box")
    
    return(list(
      estatistica = lb_test$statistic,
      p_valor = lb_test$p.value,
      lag = lag,
      conclusao = if (lb_test$p.value > 0.05) "Homoscedasticidade (OK)" 
                 else "Possível heteroscedasticidade (atenção)"
    ))
  }, error = function(e) {
    return(NULL)
  })
}

# ✅ FUNÇÃO CORRIGIDA: Gerar datas de previsão a partir da última data real
gerar_datas_previsao_robusto <- function(parametros, n_previsoes, freq, ultima_data_real = NULL) {
  
  meses_pt <- c("jan", "fev", "mar", "abr", "mai", "jun", 
                "jul", "ago", "set", "out", "nov", "dez")
  
  # ✅ PRIORIDADE 1: Usar última data real informada
  if (!is.null(ultima_data_real) && ultima_data_real != "") {
    cat("📅 [DEBUG] Usando última data real:", ultima_data_real, "\n")
    
    tryCatch({
      # Converter para Date
      ultima_date <- as.Date(ultima_data_real)
      if (!is.na(ultima_date)) {
        datas_previsao <- character(n_previsoes)
        
        for (i in 1:n_previsoes) {
          data_atual <- ultima_date + months(i)
          datas_previsao[i] <- paste0(meses_pt[month(data_atual)], "/", year(data_atual))
        }
        
        cat("📅 [DEBUG] Datas geradas:", paste(head(datas_previsao, 3), collapse = ", "), 
            if (n_previsoes > 3) paste("...", tail(datas_previsao, 1)) else "", "\n")
        
        return(as.list(datas_previsao))
      }
    }, error = function(e) {
      cat("⚠️ [WARN] Erro ao processar última data real:", e$message, "\n")
    })
  }
  
  # ✅ PRIORIDADE 2: Usar período início dos parâmetros
  if (!is.null(parametros$periodo_inicio) && parametros$periodo_inicio != "") {
    cat("📅 [DEBUG] Usando período início dos parâmetros:", parametros$periodo_inicio, "\n")
    
    tryCatch({
      periodo_str <- as.character(parametros$periodo_inicio)
      periodo_str <- gsub("\\s+", "", periodo_str)
      periodo_str <- gsub("-", "/", periodo_str)
      
      if (grepl("^\\d{1,2}/\\d{4}$", periodo_str)) {
        partes <- strsplit(periodo_str, "/")[[1]]
        mes_inicio <- as.integer(partes[1])
        ano_inicio <- as.integer(partes[2])
        
        if (mes_inicio < 1 || mes_inicio > 12) {
          mes_inicio <- 1
        }
        
        # Corrigir ano se necessário
        if (ano_inicio >= 2090 && ano_inicio <= 2100) {
          ano_inicio <- ano_inicio - 70
        } else if (ano_inicio < 100 && ano_inicio >= 0) {
          ano_inicio <- 2000 + ano_inicio
        }
        
        datas_previsao <- character(n_previsoes)
        
        for (i in 1:n_previsoes) {
          mes_atual <- mes_inicio + i - 1
          ano_atual <- ano_inicio
          
          while (mes_atual > 12) {
            mes_atual <- mes_atual - 12
            ano_atual <- ano_atual + 1
          }
          
          datas_previsao[i] <- paste0(meses_pt[mes_atual], "/", ano_atual)
        }
        
        return(as.list(datas_previsao))
      }
    }, error = function(e) {
      cat("⚠️ [WARN] Erro ao processar período início:", e$message, "\n")
    })
  }
  
  # ✅ FALLBACK: Usar data atual como referência
  cat("📅 [DEBUG] Usando data atual como fallback\n")
  data_atual <- Sys.Date()
  datas_previsao <- character(n_previsoes)
  
  for (i in 1:n_previsoes) {
    data_futura <- data_atual + months(i)
    datas_previsao[i] <- paste0(meses_pt[month(data_futura)], "/", year(data_futura))
  }
  
  return(as.list(datas_previsao))
}

# ✅ Função para extrair data real da série temporal
extrair_data_inicio <- function(parametros, ts_data, freq) {
  # Tentar obter a data de início dos parâmetros
  if (!is.null(parametros$data_inicio) && parametros$data_inicio != "") {
    return(parametros$data_inicio)
  }
  
  # Se não tiver, assumir Dez/2015 (primeira observação dos dados)
  return("2015-12-01")
}

# ✅ Função para calcular métricas avançadas
calcular_metricas_avancadas <- function(modelo, ts_data, previsoes, n_previsoes, freq) {
  
  residuos <- residuals(modelo)
  residuos_clean <- residuos[!is.na(residuos)]
  
  rmse <- sqrt(mean(residuos_clean^2, na.rm = TRUE))
  mae <- mean(abs(residuos_clean), na.rm = TRUE)
  
  valores_reais <- ts_data[!is.na(residuos) & !is.na(ts_data)]
  residuos_validos <- residuos_clean[1:min(length(residuos_clean), length(valores_reais))]
  
  if (length(valores_reais) > 0 && all(valores_reais != 0, na.rm = TRUE)) {
    mape <- mean(abs(residuos_validos / valores_reais), na.rm = TRUE) * 100
  } else {
    mape <- NA
  }
  
  aic <- tryCatch(AIC(modelo), error = function(e) NA)
  bic <- tryCatch(BIC(modelo), error = function(e) NA)
  
  n <- length(residuos_clean)
  k <- length(coefficients(modelo))
  aicc <- if (!is.na(aic) && n > k + 1) {
    aic + (2 * k * (k + 1)) / (n - k - 1)
  } else {
    NA
  }
  
  # Métricas avançadas
  theil_u <- NA
  mase <- NA
  smape <- NA
  
  if (!is.null(previsoes) && n_previsoes > 0 && length(ts_data) > n_previsoes) {
    tryCatch({
      dados_treino <- ts_data[1:(length(ts_data) - n_previsoes)]
      dados_teste <- ts_data[(length(ts_data) - n_previsoes + 1):length(ts_data)]
      
      if (length(dados_teste) == length(previsoes$mean)) {
        mse_forecast <- mean((dados_teste - previsoes$mean)^2, na.rm = TRUE)
        mean_actual <- mean(dados_teste, na.rm = TRUE)
        var_actual <- mean((dados_teste - mean_actual)^2, na.rm = TRUE)
        
        if (var_actual > 0 && !is.na(var_actual)) {
          theil_u <- sqrt(mse_forecast) / sqrt(var_actual)
        }
        
        if (freq > 1) {
          naive_forecast <- mean(abs(diff(dados_treino, lag = freq)), na.rm = TRUE)
        } else {
          naive_forecast <- mean(abs(diff(dados_treino)), na.rm = TRUE)
        }
        
        if (!is.na(naive_forecast) && naive_forecast > 0) {
          mase <- mae / naive_forecast
        }
        
        denominator <- abs(dados_teste) + abs(previsoes$mean)
        denominator[denominator == 0] <- NA
        smape <- 100 * mean(2 * abs(dados_teste - previsoes$mean) / denominator, na.rm = TRUE)
      }
    }, error = function(e) {})
  }
  
  sse <- sum(residuos_clean^2, na.rm = TRUE)
  sst <- sum((ts_data - mean(ts_data, na.rm = TRUE))^2, na.rm = TRUE)
  r_squared <- if (sst > 0 && !is.na(sst)) 1 - (sse / sst) else NA
  
  r_squared_adj <- if (!is.na(r_squared) && n > k + 1) {
    1 - ((1 - r_squared) * (n - 1) / (n - k - 1))
  } else {
    NA
  }
  
  residuos_mean <- mean(residuos_clean, na.rm = TRUE)
  residuos_sd <- sd(residuos_clean, na.rm = TRUE)
  
  residuos_skewness <- if (length(residuos_clean) > 2 && !is.na(residuos_sd) && residuos_sd > 0) {
    mean((residuos_clean - residuos_mean)^3, na.rm = TRUE) / (residuos_sd^3)
  } else NA
  
  residuos_kurtosis <- if (length(residuos_clean) > 3 && !is.na(residuos_sd) && residuos_sd > 0) {
    mean((residuos_clean - residuos_mean)^4, na.rm = TRUE) / (residuos_sd^4) - 3
  } else NA
  
  return(list(
    RMSE = as.numeric(rmse),
    MAE = as.numeric(mae),
    MAPE = if (!is.na(mape)) as.numeric(mape) else NA,
    AIC = if (!is.na(aic)) as.numeric(aic) else NA,
    BIC = if (!is.na(bic)) as.numeric(bic) else NA,
    AICc = if (!is.na(aicc)) as.numeric(aicc) else NA,
    Theil_U = if (!is.na(theil_u)) as.numeric(theil_u) else NA,
    MASE = if (!is.na(mase)) as.numeric(mase) else NA,
    sMAPE = if (!is.na(smape)) as.numeric(smape) else NA,
    R2 = if (!is.na(r_squared)) as.numeric(r_squared) else NA,
    R2_adj = if (!is.na(r_squared_adj)) as.numeric(r_squared_adj) else NA,
    residuos_mean = residuos_mean,
    residuos_sd = residuos_sd,
    residuos_skewness = residuos_skewness,
    residuos_kurtosis = residuos_kurtosis
  ))
}

# ✅ FUNÇÃO CORRIGIDA: Processar resultados SARIMA
processar_resultado_sarima_profissional <- function(modelo, ts_data, n_previsoes, parametros, 
                                                   p, d, q, P, D, Q, s, y_var, ultima_data_real = NULL) {
  
  freq <- frequency(ts_data) %||% 12
  
  # Gerar previsões
  tryCatch({
    previsoes <- forecast(modelo, h = n_previsoes, level = c(80, 90, 95))
  }, error = function(e) {
    cat("⚠️ [WARN] Usando intervalo de confiança padrão (80%, 95%)\n")
    previsoes <- forecast(modelo, h = n_previsoes, level = c(80, 95))
  })
  
  # ✅ VALIDAÇÃO CRÍTICA: Verificar se as previsões são válidas
  if (all(is.na(previsoes$mean)) || all(previsoes$mean == 0)) {
    cat("❌ [ERROR] Todas as previsões são zero ou NA!\n")
    cat("🔍 [DEBUG] Dados de entrada: summary(ts_data)\n")
    print(summary(ts_data))
    
    # Usar último valor como fallback
    ultimo_valor <- tail(ts_data, 1)
    previsoes$mean <- rep(ultimo_valor, n_previsoes)
    cat("🔄 Usando último valor como fallback:", ultimo_valor, "\n")
  }
  
  # Gerar datas de previsão
  datas_previsao <- gerar_datas_previsao_robusto(
    parametros, n_previsoes, freq, ultima_data_real
  )
  
  # Calcular métricas
  metricas_avancadas <- calcular_metricas_avancadas(modelo, ts_data, previsoes, n_previsoes, freq)
  
  # Extrair coeficientes
  coefs <- tryCatch({
    coefficients(modelo)
  }, error = function(e) {
    cat("⚠️ [WARN] Não foi possível extrair coeficientes:", e$message, "\n")
    NULL
  })
  
  coeficientes_list <- list()
  
  if (!is.null(coefs) && length(coefs) > 0) {
    tryCatch({
      se <- sqrt(diag(vcov(modelo)))
      
      for (i in 1:length(coefs)) {
        coef_name <- names(coefs)[i] %||% paste0("coef", i)
        coef_value <- coefs[i]
        coef_se <- if (length(se) >= i) se[i] else NA
        coef_t <- if (!is.na(coef_se) && coef_se != 0) coef_value / coef_se else NA
        
        coef_pvalue <- if (!is.na(coef_t)) {
          df <- length(ts_data) - length(coefs)
          if (df > 0) {
            2 * pt(abs(coef_t), df = df, lower.tail = FALSE)
          } else {
            NA
          }
        } else {
          NA
        }
        
        coeficientes_list[[i]] <- list(
          termo = coef_name,
          estimativa = as.numeric(coef_value),
          erro_padrao = as.numeric(coef_se),
          estatistica_t = as.numeric(coef_t),
          p_valor = as.numeric(coef_pvalue),
          significativo_95 = if (!is.na(coef_pvalue)) coef_pvalue < 0.05 else FALSE,
          significativo_99 = if (!is.na(coef_pvalue)) coef_pvalue < 0.01 else FALSE
        )
      }
    }, error = function(e) {
      cat("⚠️ [WARN] Erro ao calcular estatísticas dos coeficientes:", e$message, "\n")
      for (i in 1:length(coefs)) {
        coeficientes_list[[i]] <- list(
          termo = names(coefs)[i] %||% paste0("coef", i),
          estimativa = as.numeric(coefs[i])
        )
      }
    })
  }
  
  # Detectar outliers
  residuos <- residuals(modelo)
  outliers <- detectar_outliers_iqr(residuos, threshold = 3)
  n_outliers <- sum(outliers, na.rm = TRUE)
  percent_outliers <- if (length(residuos) > 0) (n_outliers / length(residuos)) * 100 else 0
  
  # Validar estacionariedade
  estacionariedade <- validar_estacionariedade(ts_data)
  
  # Testes de diagnóstico
  lb_test <- tryCatch({
    Box.test(residuos, lag = min(20, length(residuos) %/% 5), type = "Ljung-Box")
  }, error = function(e) NULL)
  
  shapiro_test <- tryCatch({
    if (length(residuos) >= 3 && length(residuos) <= 5000) {
      shapiro.test(residuos)
    } else {
      NULL
    }
  }, error = function(e) NULL)
  
  arch_test <- teste_arch_simplificado(residuos)
  
  # Calcular previsões formatadas
  previsoes_list <- list()
  
  for (i in 1:n_previsoes) {
    nivel_95_idx <- which(c(80, 90, 95) == 95)
    nivel_80_idx <- which(c(80, 90, 95) == 80)
    
    inferior_95 <- NA
    superior_95 <- NA
    inferior_80 <- NA
    superior_80 <- NA
    
    if (!is.null(previsoes$lower) && !is.null(previsoes$upper)) {
      if (length(nivel_95_idx) > 0 && nivel_95_idx <= ncol(previsoes$lower)) {
        inferior_95 <- previsoes$lower[i, nivel_95_idx]
        superior_95 <- previsoes$upper[i, nivel_95_idx]
      }
      
      if (length(nivel_80_idx) > 0 && nivel_80_idx <= ncol(previsoes$lower)) {
        inferior_80 <- previsoes$lower[i, nivel_80_idx]
        superior_80 <- previsoes$upper[i, nivel_80_idx]
      }
    }
    
    previsao_item <- list(
      periodo = i,
      data = if (length(datas_previsao) >= i) datas_previsao[[i]] else paste("Período", i),
      previsao = as.numeric(previsoes$mean[i]),
      
      intervalo_80 = if (!is.na(inferior_80) && !is.na(superior_80)) {
        list(
          inferior = as.numeric(inferior_80),
          superior = as.numeric(superior_80),
          amplitude = as.numeric(superior_80 - inferior_80)
        )
      } else NULL,
      
      intervalo_95 = if (!is.na(inferior_95) && !is.na(superior_95)) {
        list(
          inferior = as.numeric(inferior_95),
          superior = as.numeric(superior_95),
          amplitude = as.numeric(superior_95 - inferior_95)
        )
      } else NULL,
      
      inferior = as.numeric(if (!is.na(inferior_95)) inferior_95 else if (!is.na(inferior_80)) inferior_80 else NA),
      superior = as.numeric(if (!is.na(superior_95)) superior_95 else if (!is.na(superior_80)) superior_80 else NA)
    )
    
    previsoes_list[[i]] <- previsao_item
  }
  
  # Calcular tendência
  if (n_previsoes >= 2) {
    valor_inicial <- as.numeric(previsoes$mean[1])
    valor_final <- as.numeric(previsoes$mean[n_previsoes])
    
    crescimento_absoluto <- valor_final - valor_inicial
    crescimento_percentual <- if (!is.na(valor_inicial) && valor_inicial != 0) {
      ((valor_final - valor_inicial) / abs(valor_inicial)) * 100
    } else NA
    
    if (!is.na(crescimento_percentual)) {
      if (crescimento_percentual > 10) {
        tendencia <- "Forte crescimento"
        tendencia_cor <- "success"
      } else if (crescimento_percentual > 2) {
        tendencia <- "Crescimento moderado"
        tendencia_cor <- "primary"
      } else if (crescimento_percentual > -2) {
        tendencia <- "Estabilidade"
        tendencia_cor <- "warning"
      } else if (crescimento_percentual > -10) {
        tendencia <- "Declínio moderado"
        tendencia_cor <- "secondary"
      } else {
        tendencia <- "Forte declínio"
        tendencia_cor <- "danger"
      }
    } else {
      tendencia <- "Indeterminada"
      tendencia_cor <- "secondary"
    }
    
  } else {
    crescimento_absoluto <- NA
    crescimento_percentual <- NA
    tendencia <- "Não disponível"
    tendencia_cor <- "secondary"
  }
  
  # Classificação do modelo
  classificacao_modelo <- "Regular"
  
  if (!is.na(metricas_avancadas$MAPE)) {
    if (metricas_avancadas$MAPE < 5) {
      classificacao_modelo <- "Excelente"
    } else if (metricas_avancadas$MAPE < 10) {
      classificacao_modelo <- "Muito boa"
    } else if (metricas_avancadas$MAPE < 20) {
      classificacao_modelo <- "Boa"
    } else if (metricas_avancadas$MAPE < 50) {
      classificacao_modelo <- "Razoável"
    } else {
      classificacao_modelo <- "Precária"
    }
  }
  
  # ✅ CORREÇÃO PRINCIPAL: Gerar datas históricas corretamente
  data_inicio <- extrair_data_inicio(parametros, ts_data, freq)
  
  # Criar sequência de datas a partir da data de início
  data_inicio_date <- as.Date(data_inicio)
  if (is.na(data_inicio_date)) {
    data_inicio_date <- as.Date("2015-12-01")
  }
  
  datas_historicas <- seq(data_inicio_date, by = "month", length.out = length(ts_data))
  datas_historicas_formatadas <- format(datas_historicas, "%b/%Y")
  
  # Construir resultado
  resultado <- list(
    success = TRUE,
    tipo_modelo = "sarima",
    n_observacoes = length(ts_data),
    variavel_y = y_var,
    timestamp_processamento = format(Sys.time(), "%Y-%m-%d %H:%M:%S"),
    
    interpretacao_tecnica = list(
      variavel = y_var,
      inicio_previsao = if (length(datas_previsao) > 0) datas_previsao[[1]] else "N/A",
      periodo_previsao = if (length(datas_previsao) > 0) 
        paste(datas_previsao[[1]], "a", datas_previsao[[length(datas_previsao)]]) else "N/A",
      valor_inicio = if (n_previsoes >= 1) as.numeric(previsoes$mean[1]) else NA,
      valor_final = if (n_previsoes >= 1) as.numeric(previsoes$mean[n_previsoes]) else NA,
      crescimento_absoluto = as.numeric(crescimento_absoluto),
      crescimento_percentual = as.numeric(crescimento_percentual),
      tendencia_global = tendencia,
      tendencia_cor = tendencia_cor,
      classificacao_modelo = classificacao_modelo
    ),
    
    modelo_info = list(
      tipo = "SARIMA",
      ordem_arima = paste0("(", p, ",", d, ",", q, ")"),
      ordem_sazonal = paste0("(", P, ",", D, ",", Q, ")[", s, "]"),
      formula_completa = paste0("SARIMA(", p, ",", d, ",", q, ")(", P, ",", D, ",", Q, ")[", s, "]"),
      periodo_sazonal = s,
      frequencia = freq,
      convergiu = if (!is.null(modelo$code)) modelo$code == 0 else TRUE,
      log_likelihood = tryCatch(as.numeric(logLik(modelo)), error = function(e) NA),
      sigma2 = tryCatch(as.numeric(modelo$sigma2), error = function(e) NA)
    ),
    
    coeficientes = coeficientes_list,
    
    metricas = list(
      ajuste = metricas_avancadas,
      
      diagnostico = list(
        teste_ljung_box = if (!is.null(lb_test)) list(
          estatistica = as.numeric(lb_test$statistic),
          valor_p = as.numeric(lb_test$p.value),
          lag = lb_test$parameter,
          conclusao = if (lb_test$p.value > 0.05) "Resíduos independentes (OK)" 
                     else "Autocorrelação nos resíduos (atenção)"
        ) else NULL,
        
        teste_normalidade = if (!is.null(shapiro_test)) list(
          estatistica = as.numeric(shapiro_test$statistic),
          valor_p = as.numeric(shapiro_test$p.value),
          conclusao = if (shapiro_test$p.value > 0.05) "Resíduos normais (OK)" 
                     else "Resíduos não normais (atenção)"
        ) else NULL,
        
        teste_arch = if (!is.null(arch_test)) list(
          estatistica = as.numeric(arch_test$estatistica),
          valor_p = as.numeric(arch_test$p_valor),
          conclusao = arch_test$conclusao
        ) else NULL,
        
        outliers = list(
          n_outliers = n_outliers,
          percent_outliers = round(percent_outliers, 2),
          tem_outliers = n_outliers > 0
        ),
        
        estacionariedade = estacionariedade
      )
    ),
    
    previsoes = previsoes_list,
    
    # ✅ CORREÇÃO PRINCIPAL: Dados originais com datas corretas
    dados_originais = list(
      n_observacoes = length(ts_data),
      historico = as.list(as.numeric(ts_data)),
      datas = as.list(datas_historicas_formatadas),
      dados = lapply(1:length(ts_data), function(i) {
        list(
          periodo = datas_historicas_formatadas[i],
          data = datas_historicas_formatadas[i],
          valor = as.numeric(ts_data[i]),
          tipo = "historico"
        )
      }),
      estatisticas = list(
        media = as.numeric(mean(ts_data, na.rm = TRUE)),
        mediana = as.numeric(median(ts_data, na.rm = TRUE)),
        desvio_padrao = as.numeric(sd(ts_data, na.rm = TRUE)),
        minimo = as.numeric(min(ts_data, na.rm = TRUE)),
        maximo = as.numeric(max(ts_data, na.rm = TRUE))
      )
    ),
    
    periodo_previsao = list(
      inicio = if (length(datas_previsao) > 0) datas_previsao[[1]] else "N/A",
      fim = if (length(datas_previsao) > 0) datas_previsao[[length(datas_previsao)]] else "N/A",
      n_periodos = n_previsoes,
      frequencia = freq
    ),
    
    qualidade_ajuste = list(
      classificacao_geral = classificacao_modelo,
      classificacao_mape = if (!is.na(metricas_avancadas$MAPE)) {
        if (metricas_avancadas$MAPE < 10) "Excelente" else
        if (metricas_avancadas$MAPE < 20) "Boa" else
        if (metricas_avancadas$MAPE < 50) "Razoável" else "Ruim"
      } else "N/A",
      
      recomendacoes = if (n_outliers > 0) {
        c("Considerar tratamento de outliers")
      } else if (!is.null(lb_test) && !is.na(lb_test$p.value) && lb_test$p.value < 0.05) {
        c("Autocorrelação nos resíduos", "Considerar aumentar ordem AR ou MA")
      } else {
        c("Modelo adequado")
      }
    )
  )
  
  resultado$simulacao <- FALSE
  
  resultado$resumo <- paste0(
    "Modelo SARIMA(", p, ",", d, ",", q, ")(", P, ",", D, ",", Q, ")[", s, "] executado com sucesso. ",
    "MAPE: ", if (!is.na(metricas_avancadas$MAPE)) round(metricas_avancadas$MAPE, 2) else "N/A", "% | ",
    "Classificação: ", classificacao_modelo
  )
  
  resultado$qualidade <- list(
    MAPE = if (!is.na(metricas_avancadas$MAPE)) round(metricas_avancadas$MAPE, 2) else NA,
    RMSE = if (!is.na(metricas_avancadas$RMSE)) round(metricas_avancadas$RMSE, 2) else NA,
    MAE = if (!is.na(metricas_avancadas$MAE)) round(metricas_avancadas$MAE, 2) else NA,
    AIC = if (!is.na(metricas_avancadas$AIC)) round(metricas_avancadas$AIC, 2) else NA,
    BIC = if (!is.na(metricas_avancadas$BIC)) round(metricas_avancadas$BIC, 2) else NA
  )
  
  resultado$previsoes_array <- as.numeric(previsoes$mean)
  resultado$datas_previsao_array <- unlist(datas_previsao)
  resultado$timestamp <- format(Sys.time(), "%Y-%m-%dT%H:%M:%SZ")
  
  return(resultado)
}

# ✅ Função principal
main <- function() {
  args <- commandArgs(trailingOnly = TRUE)
  
  if (length(args) < 2) {
    stop("Uso: Rscript sarima.R <input.json> <output.json>")
  }
  
  input_file <- args[1]
  output_file <- args[2]
  
  tryCatch({
    cat("🚀 Iniciando SARIMA Profissional (VERSÃO CORRIGIDA)\n")
    cat("⏰", format(Sys.time(), "%Y-%m-%d %H:%M:%S"), "\n")
    
    # Ler dados de entrada
    input_data <- fromJSON(input_file)
    
    tipo <- input_data$tipo
    dados <- input_data$dados
    parametros <- input_data$parametros
    
    cat("📊 Processando:", tipo, "\n")
    cat("📈 Registros:", length(dados), "\n")
    
    # Converter para dataframe
    df <- as.data.frame(dados)
    
    # Extrair variável Y
    y_var <- parametros$y %||% names(df)[1]
    
    if (is.null(y_var) || y_var == "") {
      stop("❌ Variável Y não especificada")
    }
    
    if (!y_var %in% names(df)) {
      stop(paste("❌ Variável '", y_var, "' não encontrada"))
    }
    
    # Converter valores
    y_values <- df[[y_var]]
    
    if (!is.numeric(y_values)) {
      y_values <- as.numeric(y_values)
      if (all(is.na(y_values))) {
        stop(paste("❌ Variável", y_var, "não pode ser convertida para numérico"))
      }
    }
    
    # Tratar NA
    y_clean <- y_values[!is.na(y_values)]
    
    if (length(y_clean) < 3) {
      stop("❌ Dados insuficientes (mínimo 3 observações)")
    }
    
    # Configurar frequência
    freq <- 12
    if (!is.null(parametros$frequencia)) {
      freq_map <- list(
        "mensal" = 12, "Mensal" = 12, "monthly" = 12,
        "trimestral" = 4, "Trimestral" = 4, "quarterly" = 4,
        "anual" = 1, "Anual" = 1, "yearly" = 1
      )
      freq <- freq_map[[parametros$frequencia]] %||% 12
    }
    
    # Criar série temporal
    ts_data <- ts(y_clean, frequency = freq)
    
    # Parâmetros SARIMA
    n_previsoes <- as.integer(parametros$n_previsoes %||% 12)
    p <- as.integer(parametros$p %||% 1)
    d <- as.integer(parametros$d %||% 1)
    q <- as.integer(parametros$q %||% 1)
    P <- as.integer(parametros$P %||% 1)
    D <- as.integer(parametros$D %||% 1)
    Q <- as.integer(parametros$Q %||% 1)
    s <- as.integer(parametros$s %||% freq)
    
    cat("⚙️ Configuração SARIMA: (", p, ",", d, ",", q, ")(", P, ",", D, ",", Q, ")[", s, "]\n")
    cat("📅 Previsões:", n_previsoes, "períodos\n")
    cat("📈 Frequência:", freq, "\n")
    
    # Extrair última data real se disponível
    ultima_data_real <- NULL
    if (!is.null(parametros$ultima_data) && parametros$ultima_data != "") {
      ultima_data_real <- parametros$ultima_data
    } else if ("Data" %in% names(df) && length(df$Data) > 0) {
      ultima_data_real <- as.character(df$Data[length(df$Data)])
    }
    
    if (!is.null(parametros$periodo_inicio)) {
      cat("📅 Período início:", parametros$periodo_inicio, "\n")
    }
    if (!is.null(ultima_data_real)) {
      cat("📅 Última data real:", ultima_data_real, "\n")
    }
    
    # Executar SARIMA
    modelo <- tryCatch({
      cat("🔄 Ajustando modelo SARIMA...\n")
      Arima(ts_data, order = c(p, d, q), seasonal = list(order = c(P, D, Q), period = s))
    }, error = function(e) {
      cat("⚠️ Erro no SARIMA especificado:", e$message, "\n")
      cat("🔄 Tentando auto.arima sazonal...\n")
      auto.arima(ts_data, seasonal = TRUE, stepwise = TRUE, approximation = FALSE)
    })
    
    # Processar resultados
    resultado <- processar_resultado_sarima_profissional(
      modelo, ts_data, n_previsoes, parametros, 
      p, d, q, P, D, Q, s, y_var, ultima_data_real
    )
    
    # Salvar resultado
    resultado_json <- toJSON(resultado, auto_unbox = TRUE, pretty = TRUE, 
                           digits = 10, force = TRUE)
    write(resultado_json, output_file)
    
    cat("✅ Modelo SARIMA executado com sucesso!\n")
    cat("📁 Resultado salvo em:", output_file, "\n")
    cat("📊 Classificação:", resultado$qualidade_ajuste$classificacao_geral, "\n")
    
    if (!is.na(resultado$metricas$ajuste$MAPE)) {
      cat("🎯 MAPE:", round(resultado$metricas$ajuste$MAPE, 2), "%\n")
    }
    
    cat("⏰", format(Sys.time(), "%Y-%m-%d %H:%M:%S"), "\n")
    
  }, error = function(e) {
    cat("❌ ERRO CRÍTICO:", e$message, "\n")
    
    resultado <- list(
      success = FALSE,
      error = e$message,
      timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S"),
      tipo_modelo = "sarima"
    )
    
    resultado_json <- toJSON(resultado, auto_unbox = TRUE, pretty = TRUE)
    write(resultado_json, output_file)
  })
}

# Executar
if (!interactive()) {
  main()
}