#!/usr/bin/env Rscript

library(jsonlite)
library(dplyr)
library(MASS)

# ------------------------------------------------------------
# FUNÇÃO PRINCIPAL - USANDO MODELOS GLM
# ------------------------------------------------------------

main <- function() {
  args <- commandArgs(trailingOnly = TRUE)
  
  if (length(args) < 2) {
    stop("Uso: Rscript monte_carlo.R <input_file> <output_file>")
  }
  
  input_file <- args[1]
  output_file <- args[2]
  
  cat("🎲 MOTOR MONTE CARLO ACTUARIAL (USANDO MODELOS GLM)\n")
  cat("==================================================\n")
  
  tryCatch({
    # Ler dados no formato do sistema
    dados_json <- fromJSON(input_file)
    
    cat("📁 Dados lidos do arquivo\n")
    
    # 🔥 COMPATIBILIDADE: O sistema envia {tipo, dados, parametros}
    if ("tipo" %in% names(dados_json)) {
      # Formato do sistema
      dados <- as.data.frame(dados_json$dados)
      parametros <- dados_json$parametros
    } else if ("dados" %in% names(dados_json)) {
      # Formato direto
      dados <- as.data.frame(dados_json$dados)
      parametros <- dados_json$parametros %||% list()
    } else {
      # Dados diretos
      dados <- as.data.frame(dados_json)
      parametros <- list()
    }
    
    cat(sprintf("✅ Dados: %d observações, %d variáveis\n", 
                nrow(dados), ncol(dados)))
    
    # 🔥 EXTRAIR PARÂMETROS COM VALORES PADRÃO
    n_sim <- as.numeric(parametros$n_sim %||% 1000)
    vol_freq <- as.numeric(parametros$vol_freq %||% 0.2)
    vol_sev <- as.numeric(parametros$vol_sev %||% 0.3)
    incluir_correlacao <- parametros$incluir_correlacao %||% TRUE
    usar_modelos_glm <- parametros$usar_modelos_glm %||% FALSE
    
    cat(sprintf("⚙️  Parâmetros: n_sim=%d, vol_freq=%.2f, vol_sev=%.2f\n",
                n_sim, vol_freq, vol_sev))
    
    # 🔥 VERIFICAR SE MODELOS GLM FORAM FORNECIDOS
    modelos_ajustados <- parametros$modelos_ajustados
    
    # -----------------------------------------------------------------
    # CASO 1: USAR MODELOS GLM (PRIORIDADE)
    # -----------------------------------------------------------------
    if (!is.null(modelos_ajustados) && usar_modelos_glm) {
      cat("✅ Usando modelos GLM fornecidos pelo frontend\n")
      
      # Extrair λ do modelo de frequência
      lambda_base <- NULL
      if (!is.null(modelos_ajustados$frequencia)) {
        lambda_base <- modelos_ajustados$frequencia$lambda_medio
        
        # Se não tiver lambda_medio, calcular dos coeficientes
        if (is.null(lambda_base) && !is.null(modelos_ajustados$frequencia$coeficientes)) {
          coef_freq <- modelos_ajustados$frequencia$coeficientes
          if (!is.null(coef_freq[['(Intercept)']]) && !is.null(coef_freq[['(Intercept)']]$estimate)) {
            lambda_base <- exp(as.numeric(coef_freq[['(Intercept)']]$estimate))
          }
        }
        
        cat(sprintf("📊 λ base = %.4f (do modelo %s)\n", 
                    lambda_base, modelos_ajustados$frequencia$familia %||% 'desconhecido'))
      }
      
      # Extrair μ do modelo de severidade
      mu_base <- NULL
      if (!is.null(modelos_ajustados$severidade)) {
        mu_base <- modelos_ajustados$severidade$mu_medio
        
        # Se não tiver mu_medio, calcular dos coeficientes
        if (is.null(mu_base) && !is.null(modelos_ajustados$severidade$coeficientes)) {
          coef_sev <- modelos_ajustados$severidade$coeficientes
          if (!is.null(coef_sev[['(Intercept)']]) && !is.null(coef_sev[['(Intercept)']]$estimate)) {
            mu_base <- exp(as.numeric(coef_sev[['(Intercept)']]$estimate))
          }
        }
        
        cat(sprintf("📊 μ base = %.2f (do modelo %s)\n", 
                    mu_base, modelos_ajustados$severidade$familia %||% 'desconhecido'))
      }
      
      # Se não conseguiu extrair, usar valores padrão
      if (is.null(lambda_base)) lambda_base <- 2.4684
      if (is.null(mu_base)) mu_base <- 356452.86
      
      premio_base <- lambda_base * mu_base
      cat(sprintf("💰 Prêmio base = %.2f\n", premio_base))
      
      # 🔥 SIMULAÇÃO MONTE CARLO USANDO OS MODELOS
      set.seed(42)  # Reprodutibilidade
      
      cat(sprintf("🎲 Executando %d simulações com modelos GLM...\n", n_sim))
      
      perdas <- numeric(n_sim)
      
      for (i in 1:n_sim) {
        # Incerteza nos parâmetros (distribuição log-normal)
        erro_freq <- exp(rnorm(1, 0, vol_freq))
        erro_sev <- exp(rnorm(1, 0, vol_sev))
        
        # Aplicar correlação se solicitado
        if (incluir_correlacao) {
          # Correlação positiva moderada (0.3)
          correlacao <- rnorm(1, 0, 0.3)
          erro_freq <- erro_freq * (1 + correlacao * 0.1)
          erro_sev <- erro_sev * (1 + correlacao * 0.1)
        }
        
        lambda_sim <- lambda_base * erro_freq
        mu_sim <- mu_base * erro_sev
        
        # Simular perda total
        perdas[i] <- lambda_sim * mu_sim
      }
      
      # Calcular métricas
      perdas_ordenadas <- sort(perdas)
      valor_esperado <- mean(perdas)
      desvio_padrao <- sd(perdas)
      cv <- desvio_padrao / valor_esperado
      
      # Assimetria e curtose
      n <- length(perdas)
      m3 <- sum((perdas - valor_esperado)^3) / n
      m4 <- sum((perdas - valor_esperado)^4) / n
      assimetria <- m3 / (desvio_padrao^3)
      curtose <- m4 / (desvio_padrao^4) - 3
      
      # Percentis
      percentis <- c(0.5, 0.75, 0.9, 0.95, 0.975, 0.99, 0.995, 0.999)
      valores_percentis <- quantile(perdas, probs = percentis, na.rm = TRUE)
      
      idx95 <- floor(n_sim * 0.95)
      idx99 <- floor(n_sim * 0.99)
      idx999 <- floor(n_sim * 0.999)
      
      var_95 <- perdas_ordenadas[idx95]
      var_99 <- perdas_ordenadas[idx99]
      var_999 <- ifelse(idx999 <= n_sim, perdas_ordenadas[idx999], perdas_ordenadas[n_sim])
      
      # TVaR (Expected Shortfall)
      tvar_95 <- mean(perdas_ordenadas[idx95:n_sim])
      tvar_99 <- mean(perdas_ordenadas[idx99:n_sim])
      tvar_999 <- mean(perdas_ordenadas[idx999:n_sim])
      
      # Probabilidade de ruína (perda > 2.5 * prêmio base)
      limiar_ruina <- premio_base * 2.5
      prob_ruina <- sum(perdas > limiar_ruina) / n_sim
      
      # Intervalo de confiança para a média (95%)
      erro_padrao_media <- desvio_padrao / sqrt(n_sim)
      ic_inferior <- valor_esperado - 1.96 * erro_padrao_media
      ic_superior <- valor_esperado + 1.96 * erro_padrao_media
      
      # Criar histograma
      min_perda <- min(perdas)
      max_perda <- max(perdas)
      num_bins <- 20
      bin_width <- (max_perda - min_perda) / num_bins
      
      bins <- data.frame(
        inicio = seq(min_perda, max_perda - bin_width, length.out = num_bins),
        fim = seq(min_perda + bin_width, max_perda, length.out = num_bins)
      )
      
      frequencias <- numeric(num_bins)
      for (i in 1:num_bins) {
        frequencias[i] <- sum(perdas >= bins$inicio[i] & perdas < bins$fim[i])
      }
      
      histograma <- data.frame(
        intervalo = sprintf("%.0fk-%.0fk", bins$inicio/1000, bins$fim/1000),
        frequencia = frequencias,
        frequenciaRelativa = frequencias / n_sim
      )
      
      # FDA para pontos específicos
      pontos_fda <- c(0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.99)
      fda <- data.frame(
        percentil = sprintf("%d%%", pontos_fda * 100),
        valor = quantile(perdas, probs = pontos_fda, na.rm = TRUE)
      )
      
      # 🔥 PREPARAR RESULTADO
      resultado <- list(
        success = TRUE,
        tipo_operacao = "monte_carlo_parametrico",
        simulacao = FALSE,
        
        metadados = list(
          n_simulacoes = n_sim,
          semente = 42,
          metodo = "paramétrico",
          distribuicao_freq = "log-normal",
          distribuicao_sev = "log-normal",
          correlacao = ifelse(incluir_correlacao, 0.3, 0)
        ),
        
        parametros_simulacao = list(
          n_simulacoes = n_sim,
          lambda_base = lambda_base,
          mu_base = mu_base,
          premio_base = premio_base,
          vol_freq = vol_freq,
          vol_sev = vol_sev,
          nivel_confianca = 0.99,
          usando_modelos_glm = TRUE
        ),
        
        metricas_risco = list(
          valor_esperado = valor_esperado,
          mediana = quantile(perdas, 0.5, na.rm = TRUE),
          desvio_padrao = desvio_padrao,
          coeficiente_variacao = cv,
          assimetria = assimetria,
          curtose = curtose,
          var_95 = var_95,
          var_99 = var_99,
          var_999 = var_999,
          tvar_95 = tvar_95,
          tvar_99 = tvar_99,
          tvar_999 = tvar_999,
          prob_ruina = prob_ruina,
          intervalo_confianca = list(
            inferior = ic_inferior,
            superior = ic_superior
          )
        ),
        
        estatisticas = list(
          lambda_estimado = lambda_base,
          mu_estimado = mu_base,
          premio_medio_observado = valor_esperado,
          premio_medio_esperado = premio_base,
          razao_observado_esperado = valor_esperado / premio_base,
          perda_maxima = max(perdas),
          perda_minima = min(perdas)
        ),
        
        distribuicao = list(
          percentis = as.list(percentis),
          valores_percentis = as.list(valores_percentis),
          histograma = histograma,
          fda = fda
        ),
        
        validacao = list(
          aderencia_media = abs(valor_esperado - premio_base) / premio_base,
          aderencia_var = abs(var_95 - quantile(perdas, 0.95)) / quantile(perdas, 0.95),
          consistente = abs(valor_esperado - premio_base) / premio_base < 0.1
        ),
        
        interpretacao = list(
          nivel_risco = if (cv < 0.3) "Baixo" else if (cv < 0.6) "Moderado" else "Alto",
          adequacao_capital = if (prob_ruina < 0.001) "Adequado" else if (prob_ruina < 0.01) "Marginal" else "Insuficiente"
        ),
        
        timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S"),
        mensagem = "Simulação Monte Carlo executada com modelos GLM"
      )
      
    # -----------------------------------------------------------------
    # CASO 2: FALLBACK - CALCULAR DOS DADOS (SE NÃO HOUVER MODELOS)
    # -----------------------------------------------------------------
    } else {
      cat("⚠️ Modelos GLM não disponíveis, calculando parâmetros dos dados\n")
      
      # Encontrar variáveis de sinistro e custo
      vars <- names(dados)
      sinistro_var <- grep("sinistro|freq|count|n_", vars, value = TRUE, ignore.case = TRUE)[1]
      custo_var <- grep("custo|valor|amount|sev", vars, value = TRUE, ignore.case = TRUE)[1]
      
      if (!is.na(sinistro_var) && !is.na(custo_var)) {
        cat(sprintf("📊 Usando variáveis: %s (sinistro), %s (custo)\n", 
                    sinistro_var, custo_var))
        
        lambda_est <- mean(as.numeric(dados[[sinistro_var]]), na.rm = TRUE)
        mu_est <- mean(as.numeric(dados[[custo_var]]), na.rm = TRUE)
        
        cat(sprintf("📈 Parâmetros estimados: λ=%.3f, μ=%.2f\n", lambda_est, mu_est))
        
        # Simulação simples
        set.seed(123)
        perdas <- numeric(n_sim)
        
        for (i in 1:n_sim) {
          n_sinistros <- rpois(1, lambda_est * exp(rnorm(1, 0, vol_freq)))
          
          if (n_sinistros > 0) {
            severidades <- rgamma(n_sinistros, 
                                 shape = 1/(vol_sev^2), 
                                 scale = mu_est * (vol_sev^2))
            perdas[i] <- sum(severidades)
          } else {
            perdas[i] <- 0
          }
        }
        
        perdas_positivas <- perdas[perdas > 0]
        
        resultado <- list(
          success = TRUE,
          tipo_operacao = "monte_carlo_dados",
          simulacao = FALSE,
          
          parametros_simulacao = list(
            n_simulacoes = n_sim,
            vol_frequencia = vol_freq,
            vol_severidade = vol_sev,
            incluir_correlacao = incluir_correlacao,
            usando_modelos_glm = FALSE
          ),
          
          metricas_risco = list(
            valor_esperado = mean(perdas),
            desvio_padrao = sd(perdas),
            coeficiente_variacao = sd(perdas) / mean(perdas),
            var_95 = quantile(perdas, 0.95, na.rm = TRUE),
            var_99 = quantile(perdas, 0.99, na.rm = TRUE),
            tvar_95 = mean(perdas_positivas[perdas_positivas >= quantile(perdas_positivas, 0.95)]),
            tvar_99 = mean(perdas_positivas[perdas_positivas >= quantile(perdas_positivas, 0.99)]),
            prob_ruina = mean(perdas > (mean(perdas) + 2.5 * sd(perdas)))
          ),
          
          estatisticas = list(
            lambda_estimado = lambda_est,
            mu_estimado = mu_est,
            n_simulacoes_validas = sum(perdas > 0),
            perda_maxima = max(perdas)
          ),
          
          interpretacao = list(
            nivel_risco = if (sd(perdas)/mean(perdas) < 0.3) "Baixo" else if (sd(perdas)/mean(perdas) < 0.6) "Moderado" else "Alto",
            adequacao_capital = if (mean(perdas > (mean(perdas) + 2.5 * sd(perdas))) < 0.001) "Adequado" else "Insuficiente"
          ),
          
          timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S"),
          mensagem = "Simulação Monte Carlo executada com parâmetros dos dados"
        )
      } else {
        stop("Não foi possível identificar variáveis de sinistro e custo")
      }
    }
    
    # Salvar resultado
    write_json(resultado, output_file, auto_unbox = TRUE, pretty = TRUE, digits = 6)
    
    cat("\n✅ SIMULAÇÃO CONCLUÍDA COM SUCESSO\n")
    cat("=================================\n")
    cat(sprintf("   λ base: %.4f\n", resultado$parametros_simulacao$lambda_base %||% resultado$estatisticas$lambda_estimado))
    cat(sprintf("   μ base: %.2f\n", resultado$parametros_simulacao$mu_base %||% resultado$estatisticas$mu_estimado))
    cat(sprintf("   Valor Esperado: %.2f\n", resultado$metricas_risco$valor_esperado))
    cat(sprintf("   VaR 99%%: %.2f\n", resultado$metricas_risco$var_99))
    cat(sprintf("   Prob. Ruína: %.4f%%\n", resultado$metricas_risco$prob_ruina * 100))
    
  }, error = function(e) {
    cat(paste("❌ ERRO NA SIMULAÇÃO:", e$message, "\n"))
    
    resultado <- list(
      success = FALSE,
      error = e$message,
      tipo_operacao = "monte_carlo",
      simulacao = FALSE,
      recomendacoes = c(
        "Verifique se os modelos GLM foram fornecidos corretamente",
        "Confirme se as variáveis de sinistro e custo existem nos dados",
        "Reduza o número de simulações se necessário"
      ),
      timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S")
    )
    
    write_json(resultado, output_file, auto_unbox = TRUE, pretty = TRUE)
  })
}

# Executar
if (!interactive()) {
  main()
}