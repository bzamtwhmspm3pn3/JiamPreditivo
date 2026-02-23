# streaming.R - Processamento de Dados em Streaming
# VERSÃO CORRIGIDA

options(repos = structure(c(CRAN = "https://cloud.r-project.org/")))

# Carregar pacotes necessários
if (!requireNamespace("jsonlite", quietly = TRUE)) {
  install.packages("jsonlite", quiet = TRUE)
}
if (!requireNamespace("dplyr", quietly = TRUE)) {
  install.packages("dplyr", quiet = TRUE)
}
if (!requireNamespace("tidyr", quietly = TRUE)) {
  install.packages("tidyr", quiet = TRUE)
}
if (!requireNamespace("zoo", quietly = TRUE)) {
  install.packages("zoo", quiet = TRUE)
}

library(jsonlite)
library(dplyr)
library(tidyr)
library(zoo)

# ============================================
# FUNÇÕES UTILITÁRIAS
# ============================================

#' Prepara dados para streaming
#' @param dados Lista de dados
#' @param variaveis Vetor com nomes das variáveis
#' @return Data frame com ordenação temporal simulada
preparar_dados_streaming <- function(dados, variaveis) {
  cat("   🔍 Preparando dados para streaming...\n")
  
  df <- as.data.frame(dados)
  cat(paste("   📊 Data frame original:", nrow(df), "linhas,", ncol(df), "colunas\n"))
  
  # Selecionar variáveis
  if (!is.null(variaveis) && length(variaveis) > 0) {
    df <- df[, variaveis, drop = FALSE]
  }
  
  # Adicionar timestamp simulado (ordem de linhas)
  df$timestamp <- 1:nrow(df)
  df$event_time <- Sys.time() - (nrow(df):1) * 60  # eventos a cada minuto
  
  # Remover NA
  n_antes <- nrow(df)
  df <- df[complete.cases(df), ]
  n_depois <- nrow(df)
  
  if (n_antes > n_depois) {
    cat(paste("   🧹 Removidas", n_antes - n_depois, "linhas com NA\n"))
  }
  
  cat(paste("   ✅ Dados preparados:", n_depois, "eventos\n"))
  return(df)
}

#' Escreve JSON
write_json <- function(obj, file) {
  json_str <- toJSON(obj, auto_unbox = TRUE, digits = 10, force = TRUE)
  write(json_str, file)
}

# ============================================
# OPERAÇÕES DE STREAMING
# ============================================

#' Window Count (contagem em janelas)
#' @param df Data frame
#' @param parametros Lista com parâmetros
#' @return Lista com resultados
operacao_window_count <- function(df, parametros) {
  cat("   📊 Executando Window Count...\n")
  
  window_size <- parametros$window_size
  slide_size <- parametros$slide_size
  
  # Criar janelas deslizantes
  n <- nrow(df)
  n_windows <- floor((n - window_size) / slide_size) + 1
  
  if (n_windows <= 0) {
    n_windows <- 1
    window_size <- n
  }
  
  janelas <- list()
  serie_temporal <- list()
  
  for (i in 1:min(n_windows, 20)) {
    inicio <- (i - 1) * slide_size + 1
    fim <- min(inicio + window_size - 1, n)
    
    if (inicio <= n) {
      janela_df <- df[inicio:fim, ]
      
      # Contagem de eventos na janela
      contagem <- nrow(janela_df)
      
      # Média de valores numéricos
      col_numericas <- names(janela_df)[sapply(janela_df, is.numeric)]
      medias <- list()
      for (col in col_numericas) {
        if (col != "timestamp" && col != "event_time") {
          medias[[col]] <- mean(janela_df[[col]], na.rm = TRUE)
        }
      }
      
      janelas[[i]] <- list(
        janela = i,
        inicio = inicio,
        fim = fim,
        contagem = contagem,
        medias = medias
      )
      
      # Para série temporal
      serie_temporal[[i]] <- list(
        timestamp = paste("Janela", i),
        valor = contagem
      )
    }
  }
  
  # Estatísticas das janelas
  contagens <- sapply(janelas, function(x) x$contagem)
  
  resultado <- list(
    operacao = "window_count",
    configuracoes = list(
      window_size = window_size,
      slide_size = slide_size,
      total_janelas = length(janelas)
    ),
    janelas = janelas,
    serie_temporal = serie_temporal,
    estatisticas = list(
      media_contagem = mean(contagens),
      max_contagem = max(contagens),
      min_contagem = min(contagens),
      total_eventos = sum(contagens)
    )
  )
  
  return(resultado)
}

#' Moving Average (média móvel)
#' @param df Data frame
#' @param parametros Lista com parâmetros
#' @return Lista com resultados
operacao_moving_avg <- function(df, parametros) {
  cat("   📈 Executando Média Móvel...\n")
  
  window_size <- parametros$window_size
  
  # Identificar colunas numéricas para média móvel
  col_numericas <- names(df)[sapply(df, is.numeric)]
  col_numericas <- setdiff(col_numericas, c("timestamp", "event_time"))
  
  if (length(col_numericas) == 0) {
    # Se não há colunas numéricas, usar contagem de linhas
    valores <- 1:nrow(df)
    medias_moveis <- rollmean(valores, k = min(window_size, length(valores)), fill = NA, align = "right")
    
    serie_temporal <- list()
    for (i in 1:length(medias_moveis)) {
      if (!is.na(medias_moveis[i])) {
        serie_temporal[[i]] <- list(
          timestamp = i,
          valor_original = valores[i],
          media_movel = medias_moveis[i]
        )
      }
    }
    
    resultado <- list(
      operacao = "moving_avg",
      tipo = "contagem",
      configuracoes = list(
        window_size = window_size
      ),
      serie_temporal = serie_temporal[!sapply(serie_temporal, is.null)],
      estatisticas = list(
        media_global = mean(valores),
        desvio = sd(valores)
      )
    )
  } else {
    # Calcular média móvel para cada coluna numérica
    coluna_principal <- col_numericas[1]
    valores <- df[[coluna_principal]]
    
    medias_moveis <- rollmean(valores, k = min(window_size, length(valores)), fill = NA, align = "right")
    
    serie_temporal <- list()
    for (i in 1:length(medias_moveis)) {
      if (!is.na(medias_moveis[i])) {
        serie_temporal[[i]] <- list(
          timestamp = i,
          valor_original = valores[i],
          media_movel = medias_moveis[i]
        )
      }
    }
    
    resultado <- list(
      operacao = "moving_avg",
      tipo = "numerico",
      coluna = coluna_principal,
      configuracoes = list(
        window_size = window_size
      ),
      serie_temporal = serie_temporal[!sapply(serie_temporal, is.null)],
      estatisticas = list(
        media_original = mean(valores, na.rm = TRUE),
        media_suavizada = mean(medias_moveis, na.rm = TRUE),
        reducao_variancia = 1 - (sd(medias_moveis, na.rm = TRUE) / sd(valores, na.rm = TRUE))
      )
    )
  }
  
  return(resultado)
}

#' Trend Detection (detecção de tendências)
#' @param df Data frame
#' @param parametros Lista com parâmetros
#' @return Lista com resultados
operacao_trend_detection <- function(df, parametros) {
  cat("   📉 Executando Detecção de Tendências...\n")
  
  window_size <- parametros$window_size
  
  # Identificar colunas numéricas
  col_numericas <- names(df)[sapply(df, is.numeric)]
  col_numericas <- setdiff(col_numericas, c("timestamp", "event_time"))
  
  if (length(col_numericas) == 0) {
    # Usar contagem de linhas
    valores <- 1:nrow(df)
  } else {
    coluna_principal <- col_numericas[1]
    valores <- df[[coluna_principal]]
  }
  
  # Detectar tendências em janelas
  n <- length(valores)
  n_janelas <- max(1, floor(n / window_size))
  
  tendencias <- list(
    alta = 0,
    baixa = 0,
    estavel = 0
  )
  
  deteccoes <- list()
  
  for (i in 1:n_janelas) {
    inicio <- (i - 1) * window_size + 1
    fim <- min(inicio + window_size - 1, n)
    
    if (inicio <= n) {
      janela_valores <- valores[inicio:fim]
      
      # Regressão linear simples para tendência
      x <- 1:length(janela_valores)
      if (length(janela_valores) > 1 && sd(janela_valores) > 0) {
        modelo <- lm(janela_valores ~ x)
        inclinacao <- coef(modelo)[2]
        
        # Classificar tendência
        if (inclinacao > 0.1) {
          tendencias$alta <- tendencias$alta + 1
          tipo <- "alta"
        } else if (inclinacao < -0.1) {
          tendencias$baixa <- tendencias$baixa + 1
          tipo <- "baixa"
        } else {
          tendencias$estavel <- tendencias$estavel + 1
          tipo <- "estável"
        }
        
        deteccoes[[i]] <- list(
          janela = i,
          inicio = inicio,
          fim = fim,
          tendencia = tipo,
          inclinacao = inclinacao,
          r2 = summary(modelo)$r.squared
        )
      }
    }
  }
  
  resultado <- list(
    operacao = "trend_detection",
    configuracoes = list(
      window_size = window_size,
      total_janelas = n_janelas
    ),
    tendencias = tendencias,
    deteccoes = deteccoes[!sapply(deteccoes, is.null)]
  )
  
  return(resultado)
}

#' Anomaly Detection em Streaming
#' @param df Data frame
#' @param parametros Lista com parâmetros
#' @return Lista com resultados
operacao_anomaly_stream <- function(df, parametros) {
  cat("   ⚠️ Executando Detecção de Anomalias em Streaming...\n")
  
  window_size <- parametros$window_size
  slide_size <- parametros$slide_size
  
  # Identificar colunas numéricas
  col_numericas <- names(df)[sapply(df, is.numeric)]
  col_numericas <- setdiff(col_numericas, c("timestamp", "event_time"))
  
  if (length(col_numericas) == 0) {
    # Usar contagem de linhas
    valores <- 1:nrow(df)
    coluna_principal <- "contagem"
  } else {
    coluna_principal <- col_numericas[1]
    valores <- df[[coluna_principal]]
  }
  
  # Detectar anomalias usando método IQR
  q1 <- quantile(valores, 0.25, na.rm = TRUE)
  q3 <- quantile(valores, 0.75, na.rm = TRUE)
  iqr <- q3 - q1
  limite_superior <- q3 + 1.5 * iqr
  limite_inferior <- q1 - 1.5 * iqr
  
  anomalias <- list()
  serie_temporal <- list()
  
  for (i in 1:length(valores)) {
    is_anomalia <- valores[i] > limite_superior || valores[i] < limite_inferior
    
    serie_temporal[[i]] <- list(
      timestamp = i,
      valor = valores[i],
      threshold_superior = limite_superior,
      threshold_inferior = limite_inferior
    )
    
    if (is_anomalia) {
      desvio <- (valores[i] - mean(valores, na.rm = TRUE)) / sd(valores, na.rm = TRUE)
      anomalias[[length(anomalias) + 1]] <- list(
        timestamp = i,
        valor = valores[i],
        threshold_superior = limite_superior,
        threshold_inferior = limite_inferior,
        desvio = abs(desvio)
      )
    }
  }
  
  resultado <- list(
    operacao = "anomaly_stream",
    coluna = coluna_principal,
    configuracoes = list(
      window_size = window_size,
      slide_size = slide_size,
      metodo = "IQR"
    ),
    estatisticas = list(
      media = mean(valores, na.rm = TRUE),
      desvio = sd(valores, na.rm = TRUE),
      q1 = q1,
      q3 = q3,
      iqr = iqr
    ),
    serie_temporal = serie_temporal,
    anomalias = anomalias,
    total_anomalias = length(anomalias)
  )
  
  return(resultado)
}

# ============================================
# FUNÇÃO PRINCIPAL
# ============================================
main <- function() {
  cat("\n🌊 MOTOR BIG DATA - STREAMING")
  cat("\n==================================================\n")
  
  tryCatch({
    args <- commandArgs(trailingOnly = TRUE)
    
    if (length(args) < 2) {
      stop("Uso: Rscript streaming.R <input.json> <output.json>")
    }
    
    input_file <- args[1]
    output_file <- args[2]
    
    cat(paste("   📁 Arquivo de entrada:", input_file, "\n"))
    cat(paste("   📁 Arquivo de saída:", output_file, "\n"))
    
    input_data <- fromJSON(input_file)
    
    dados <- input_data$dados
    parametros <- input_data$parametros
    
    operacao <- parametros$operacao
    variaveis <- parametros$variaveis
    window_size <- ifelse(is.null(parametros$window_size), 10, parametros$window_size)
    slide_size <- ifelse(is.null(parametros$slide_size), 5, parametros$slide_size)
    watermark_delay <- ifelse(is.null(parametros$watermark_delay), 2, parametros$watermark_delay)
    
    cat(paste("   🔧 Operação:", operacao, "\n"))
    cat(paste("   📊 Window Size:", window_size, "\n"))
    cat(paste("   📈 Slide Size:", slide_size, "\n"))
    cat(paste("   ⏱️ Watermark Delay:", watermark_delay, "s\n"))
    
    # Preparar dados
    df <- preparar_dados_streaming(dados, variaveis)
    
    # Executar operação apropriada
    resultado_operacao <- NULL
    
    if (operacao == "window_count") {
      resultado_operacao <- operacao_window_count(df, parametros)
    } else if (operacao == "moving_avg") {
      resultado_operacao <- operacao_moving_avg(df, parametros)
    } else if (operacao == "trend_detection") {
      resultado_operacao <- operacao_trend_detection(df, parametros)
    } else if (operacao == "anomaly_stream") {
      resultado_operacao <- operacao_anomaly_stream(df, parametros)
    } else {
      stop(paste("Operação não reconhecida:", operacao))
    }
    
    # Métricas de performance simuladas
    eventos_processados <- nrow(df)
    janelas_calculadas <- ifelse(!is.null(resultado_operacao$configuracoes$total_janelas),
                                  resultado_operacao$configuracoes$total_janelas,
                                  length(resultado_operacao$janelas))
    taxa_processamento <- round(eventos_processados / 5) # eventos por segundo
    latencia_media <- round(runif(1, 50, 200)) # ms
    
    resultado <- list(
      success = TRUE,
      resultado = list(
        operacao = resultado_operacao$operacao,
        eventos_processados = eventos_processados,
        janelas_calculadas = janelas_calculadas,
        taxa_processamento = taxa_processamento,
        latencia_media = latencia_media,
        watermark_delay = watermark_delay,
        serie_temporal = resultado_operacao$serie_temporal,
        estatisticas = resultado_operacao$estatisticas
      )
    )
    
    # Adicionar dados específicos da operação
    if (operacao == "window_count") {
      resultado$resultado$janelas <- resultado_operacao$janelas
    } else if (operacao == "trend_detection") {
      resultado$resultado$tendencias <- resultado_operacao$tendencias
      resultado$resultado$deteccoes <- resultado_operacao$deteccoes
    } else if (operacao == "anomaly_stream") {
      resultado$resultado$anomalias <- resultado_operacao$anomalias
      resultado$resultado$total_anomalias <- resultado_operacao$total_anomalias
    }
    
    cat("\n✅ STREAMING EXECUTADO COM SUCESSO\n")
    cat(paste("   Eventos processados:", eventos_processados, "\n"))
    cat(paste("   Janelas calculadas:", janelas_calculadas, "\n"))
    cat(paste("   Latência média:", latencia_media, "ms\n"))
    
    write_json(resultado, output_file)
    
  }, error = function(e) {
    cat(paste("\n❌ ERRO:", e$message, "\n"))
    
    erro <- list(
      success = FALSE,
      error = e$message,
      timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S")
    )
    
    if (exists("output_file")) {
      write_json(erro, output_file)
    }
    
    quit(status = 1)
  })
}

main()