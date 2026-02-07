#!/usr/bin/env Rscript
args <- commandArgs(trailingOnly = TRUE)

if (length(args) != 2) {
  stop("Uso: Rscript prophet.R input.json output.json")
}

input_file <- args[1]
output_file <- args[2]

# Carregar bibliotecas
library(jsonlite)
library(prophet)
library(lubridate)
library(dplyr)

cat("📊 Processando modelo Prophet\n")

# Definir operador %||% 
`%||%` <- function(x, y) {
  if (is.null(x) || is.na(x) || x == "") y else x
}

# Função melhorada para converter datas
converter_data <- function(data_str) {
  tryCatch({
    # Se já for Date
    if (inherits(data_str, "Date")) return(data_str)
    
    # Se for NULL ou NA
    if (is.null(data_str) || is.na(data_str)) return(as.Date(NA))
    
    # Converter para string
    data_str <- as.character(data_str)
    
    # Tentar formatos comuns
    # Formato brasileiro DD/MM/YYYY
    if (grepl("^\\d{1,2}/\\d{1,2}/\\d{4}$", data_str)) {
      return(dmy(data_str))
    }
    
    # Formato YYYY-MM-DD
    if (grepl("^\\d{4}-\\d{1,2}-\\d{1,2}$", data_str)) {
      return(ymd(data_str))
    }
    
    # Formato DD/MM/YY
    if (grepl("^\\d{1,2}/\\d{1,2}/\\d{2}$", data_str)) {
      return(dmy(data_str))
    }
    
    # Número Excel serial (> 40000)
    if (grepl("^\\d+$", data_str)) {
      num <- as.numeric(data_str)
      if (num > 40000 && num < 50000) {
        return(as.Date("1899-12-30") + num)
      }
      if (num > 10000) {
        return(as.Date(num, origin = "1970-01-01"))
      }
    }
    
    # Tentar outros formatos com lubridate
    formats <- c(
      "ymd", "dmy", "mdy",
      "ymd HMS", "dmy HMS", "mdy HMS",
      "ymd HM", "dmy HM", "mdy HM"
    )
    
    for (fmt in formats) {
      result <- parse_date_time(data_str, orders = fmt, quiet = TRUE)
      if (!is.na(result)) {
        return(as.Date(result))
      }
    }
    
    # Se nada funcionar, retornar NA
    cat("⚠️ Não foi possível converter data:", data_str, "\n")
    return(as.Date(NA))
    
  }, error = function(e) {
    cat("❌ Erro ao converter data:", data_str, "-", e$message, "\n")
    return(as.Date(NA))
  })
}

# Função para determinar frequência
determinar_frequencia <- function(datas) {
  if (length(datas) < 2) return("month")
  
  # Calcular diferenças médias entre datas
  datas_ord <- sort(datas)
  diffs <- diff(datas_ord)
  diff_media <- mean(diffs, na.rm = TRUE)
  
  # Converter para dias
  diff_dias <- as.numeric(diff_media)
  
  if (diff_dias <= 2) return("day")
  if (diff_dias > 2 && diff_dias <= 10) return("week")
  if (diff_dias > 10 && diff_dias <= 40) return("month")
  if (diff_dias > 40 && diff_dias <= 120) return("quarter")
  return("year")
}

# Função para criar dataframe de feriados brasileiros
criar_feriados_brasileiros <- function() {
  cat("🎅 Criando feriados brasileiros...\n")
  
  # Feriados nacionais fixos
  feriados <- data.frame(
    holiday = c(
      "Ano Novo", "Tiradentes", "Dia do Trabalho", "Independência", 
      "Nossa Senhora Aparecida", "Finados", "Proclamação República", "Natal"
    ),
    ds = as.Date(c(
      "2024-01-01", "2024-04-21", "2024-05-01", "2024-09-07",
      "2024-10-12", "2024-11-02", "2024-11-15", "2024-12-25"
    ))
  )
  
  # Adicionar feriados móveis (aproximados para 2024-2025)
  # Carnaval: 47 dias antes da Páscoa
  # Sexta-feira Santa: 2 dias antes da Páscoa
  # Páscoa: domingo após a primeira lua cheia após 21 de março
  
  # Para 2024
  pascoa_2024 <- as.Date("2024-03-31")
  carnaval_2024 <- pascoa_2024 - 47
  sexta_santa_2024 <- pascoa_2024 - 2
  
  feriados <- rbind(feriados, data.frame(
    holiday = c("Carnaval 2024", "Sexta-feira Santa 2024", "Páscoa 2024"),
    ds = c(carnaval_2024, sexta_santa_2024, pascoa_2024)
  ))
  
  # Para 2025
  pascoa_2025 <- as.Date("2025-04-20")
  carnaval_2025 <- pascoa_2025 - 47
  sexta_santa_2025 <- pascoa_2025 - 2
  
  feriados <- rbind(feriados, data.frame(
    holiday = c("Carnaval 2025", "Sexta-feira Santa 2025", "Páscoa 2025"),
    ds = c(carnaval_2025, sexta_santa_2025, pascoa_2025)
  ))
  
  return(feriados)
}

# Ler dados
cat("📖 Lendo arquivo JSON...\n")
input_data <- fromJSON(input_file, simplifyDataFrame = FALSE)

# Extrair dados
dados <- input_data$dados
parametros <- input_data$parametros

cat("📈 Número de registros recebidos:", length(dados), "\n")
cat("⚙️ Parâmetros recebidos:\n")
print(parametros)

# Verificar se temos dados
if (is.null(dados) || length(dados) < 2) {
  cat("❌ Dados insuficientes: menos de 2 registros\n")
  resultado <- list(
    success = FALSE,
    error = "Dados insuficientes para Prophet (menos de 2 registros)",
    simulacao = FALSE
  )
  write_json(resultado, output_file, auto_unbox = TRUE, pretty = TRUE, null = "null")
  quit()
}

# Configurar parâmetros - CORRIGIDO: mapear nomes do frontend para o Prophet
y_col <- parametros$y %||% names(dados[[1]])[2]
ds_col <- parametros$ds %||% names(dados[[1]])[1]

# Mapear tipo de crescimento do frontend para o Prophet
growth_frontend <- parametros$crescimento %||% "linear"
growth <- switch(growth_frontend,
  "linear" = "linear",
  "logistico" = "logistic",
  "plano" = "flat",
  "linear"  # padrão
)

n_previsoes <- as.numeric(parametros$n_previsoes %||% 12)
intervalo <- as.numeric(parametros$intervalo_confianca %||% 0.95)
feriados_ativado <- as.logical(parametros$feriados %||% FALSE)

cat("📊 Configuração:\n")
cat("  - Coluna de data:", ds_col, "\n")
cat("  - Coluna de valor:", y_col, "\n")
cat("  - Crescimento (frontend):", growth_frontend, "\n")
cat("  - Crescimento (prophet):", growth, "\n")
cat("  - Previsões:", n_previsoes, "\n")
cat("  - Feriados ativado:", feriados_ativado, "\n")

# Extrair dados em formato tabular
cat("🔄 Convertendo dados para dataframe...\n")

# Verificar estrutura dos dados
primeiro_item <- dados[[1]]

# Extrair valores
datas_raw <- sapply(dados, function(x) x[[ds_col]])
valores_raw <- sapply(dados, function(x) x[[y_col]])

cat("📅 Primeiras 3 datas brutas:", paste(head(datas_raw, 3), collapse=" | "), "\n")
cat("📈 Primeiros 3 valores brutos:", paste(head(valores_raw, 3), collapse=" | "), "\n")

# Converter datas
cat("🔄 Convertendo datas...\n")
datas <- as.Date(sapply(datas_raw, converter_data), origin = "1970-01-01")

# Converter valores para numérico
valores <- as.numeric(valores_raw)

# Criar dataframe
df_prophet <- data.frame(
  ds = datas,
  y = valores
)

# Remover NA
na_count <- sum(!complete.cases(df_prophet))
df_prophet <- df_prophet[complete.cases(df_prophet), ]

cat("✅ Dados após limpeza:", nrow(df_prophet), "registros (removidos", na_count, "NA)\n")

if (nrow(df_prophet) < 2) {
  cat("❌ Dados insuficientes após limpeza\n")
  resultado <- list(
    success = FALSE,
    error = paste("Dados insuficientes após limpeza de NA. Apenas", nrow(df_prophet), "registros válidos."),
    simulacao = FALSE
  )
  write_json(resultado, output_file, auto_unbox = TRUE, pretty = TRUE, null = "null")
  quit()
}

# Ordenar por data
df_prophet <- df_prophet[order(df_prophet$ds), ]

cat("📅 Período: de", as.character(min(df_prophet$ds)), "até", as.character(max(df_prophet$ds)), "\n")
cat("📈 Valores: média =", round(mean(df_prophet$y, na.rm = TRUE), 2), 
    ", min =", round(min(df_prophet$y, na.rm = TRUE), 2), 
    ", max =", round(max(df_prophet$y, na.rm = TRUE), 2), "\n")

# Determinar frequência real dos dados
freq_real <- determinar_frequencia(df_prophet$ds)
cat("📊 Frequência detectada:", freq_real, "\n")

# Inicializar resultado
resultado_final <- list(
  success = TRUE,
  simulacao = FALSE,
  tipo = "prophet",
  temCoeficientes = FALSE,
  coeficientesCount = 0
)

# Executar Prophet
tryCatch({
  cat("🔧 Criando modelo Prophet...\n")
  
  # Configurar sazonalidades
  yearly_seasonality <- TRUE
  weekly_seasonality <- if (freq_real == "day") TRUE else FALSE
  daily_seasonality <- if (freq_real == "day") TRUE else FALSE
  
  # Configurar opções avançadas
  seasonality_mode <- "additive"
  if (!is.null(parametros$sazonalidade)) {
    if (parametros$sazonalidade == "multiplicativa") {
      seasonality_mode <- "multiplicative"
    } else if (parametros$sazonalidade == "nenhuma") {
      yearly_seasonality <- FALSE
      weekly_seasonality <- FALSE
      daily_seasonality <- FALSE
    }
  }
  
  cat("🔧 Configurações do modelo:\n")
  cat("  - Crescimento:", growth, "\n")
  cat("  - Sazonalidade:", seasonality_mode, "\n")
  cat("  - Feriados:", feriados_ativado, "\n")
  
  # Preparar configuração do modelo
  model_args <- list(
    df = df_prophet,
    growth = growth,
    yearly.seasonality = yearly_seasonality,
    weekly.seasonality = weekly_seasonality,
    daily.seasonality = daily_seasonality,
    seasonality.mode = seasonality_mode,
    interval.width = intervalo,
    changepoint.prior.scale = 0.05
  )
  
  # Adicionar feriados se solicitado
  if (feriados_ativado) {
    feriados_df <- criar_feriados_brasileiros()
    model_args$holidays <- feriados_df
    cat("✅ Feriados adicionados ao modelo\n")
  }
  
  # Criar modelo
  modelo <- do.call(prophet, model_args)
  
  # Fazer previsão
  cat("📈 Gerando previsões...\n")
  
  # Criar datas futuras
  if (freq_real == "day") {
    futuro <- make_future_dataframe(modelo, periods = n_previsoes, freq = 'day')
  } else if (freq_real == "week") {
    futuro <- make_future_dataframe(modelo, periods = n_previsoes, freq = 'week')
  } else if (freq_real == "month") {
    futuro <- make_future_dataframe(modelo, periods = n_previsoes, freq = 'month')
  } else if (freq_real == "quarter") {
    futuro <- make_future_dataframe(modelo, periods = n_previsoes, freq = 'quarter')
  } else {
    futuro <- make_future_dataframe(modelo, periods = n_previsoes, freq = 'year')
  }
  
  previsao <- predict(modelo, futuro)
  
  # Calcular métricas
  ajustados <- as.numeric(previsao$yhat[1:nrow(df_prophet)])
  residuos <- as.numeric(df_prophet$y - ajustados)
  
  mse <- mean(residuos^2, na.rm = TRUE)
  rmse <- sqrt(mse)
  mae <- mean(abs(residuos), na.rm = TRUE)
  mape_value <- if (mean(abs(df_prophet$y), na.rm = TRUE) > 0) {
    mean(abs(residuos / df_prophet$y), na.rm = TRUE) * 100
  } else NA_real_
  
  # Gerar datas futuras para output
  datas_futuras <- tail(futuro$ds, n_previsoes)
  
  # Formatar datas em português
  meses <- c("jan", "fev", "mar", "abr", "mai", "jun",
             "jul", "ago", "set", "out", "nov", "dez")
  meses_completo <- c("janeiro", "fevereiro", "março", "abril", "maio", "junho",
                     "julho", "agosto", "setembro", "outubro", "novembro", "dezembro")
  
  # Criar lista de previsões
  previsoes_list <- list()
  for (i in 1:n_previsoes) {
    idx <- nrow(df_prophet) + i
    
    data_futura <- datas_futuras[i]
    mes_num <- month(data_futura)
    ano_num <- year(data_futura)
    
    previsoes_list[[i]] <- list(
      periodo = i,
      data = as.character(data_futura),
      data_formatada = paste0(meses[mes_num], "/", ano_num),
      data_completa = paste(meses_completo[mes_num], "de", ano_num),
      previsao = round(as.numeric(previsao$yhat[idx]), 4),
      inferior = round(as.numeric(previsao$yhat_lower[idx]), 4),
      superior = round(as.numeric(previsao$yhat_upper[idx]), 4),
      amplitude = round(as.numeric(previsao$yhat_upper[idx] - previsao$yhat_lower[idx]), 4)
    )
  }
  
  # Calcular tendência
  tendencia <- "Estável"
  if (n_previsoes >= 2) {
    valor_inicial <- previsoes_list[[1]]$previsao
    valor_final <- previsoes_list[[n_previsoes]]$previsao
    
    if (!is.na(valor_inicial) && valor_inicial != 0) {
      variacao_percentual <- ((valor_final - valor_inicial) / abs(valor_inicial)) * 100
      
      if (variacao_percentual > 10) {
        tendencia <- "Alta (crescimento)"
      } else if (variacao_percentual > 5) {
        tendencia <- "Moderada (crescimento)"
      } else if (variacao_percentual < -10) {
        tendencia <- "Baixa (decrescimento)"
      } else if (variacao_percentual < -5) {
        tendencia <- "Moderada (decrescimento)"
      }
    }
  }
  
  # Classificar MAPE
  classificacao_mape <- if (!is.na(mape_value)) {
    if (mape_value < 10) "Excelente"
    else if (mape_value < 20) "Boa"
    else if (mape_value < 50) "Razoável"
    else "Ruim"
  } else "Não disponível"
  
  # Construir resultado completo
  resultado_final$modelo_info <- list(
    tipo = "Prophet",
    crescimento = growth_frontend,  # Usar nome do frontend
    crescimento_original = growth,   # Manter o nome original também
    intervalo_confianca = intervalo,
    changepoints = length(modelo$changepoints),
    feriados_incluidos = feriados_ativado,
    sazonalidade = seasonality_mode,
    frequencia = freq_real
  )
  
  resultado_final$previsoes <- previsoes_list
  resultado_final$ajustados <- as.list(round(ajustados, 4))
  resultado_final$residuos <- as.list(round(residuos, 4))
  
  resultado_final$metricas <- list(
    mse = round(mse, 4),
    rmse = round(rmse, 4),
    mae = round(mae, 4),
    mape = round(mape_value, 2)
  )
  
  resultado_final$interpretacao_tecnica <- list(
    variavel = y_col,
    variavel_data = ds_col,
    n_observacoes = nrow(df_prophet),
    n_previsoes = n_previsoes,
    tendencia_global = tendencia,
    intervalo_medio_confianca = round(mean(previsao$yhat_upper - previsao$yhat_lower, na.rm = TRUE) / 2, 4),
    primeira_data = as.character(min(df_prophet$ds)),
    ultima_data = as.character(max(df_prophet$ds)),
    frequencia = freq_real
  )
  
  resultado_final$dados_originais <- list(
    primeira_data = as.character(min(df_prophet$ds)),
    ultima_data = as.character(max(df_prophet$ds)),
    media = round(mean(df_prophet$y, na.rm = TRUE), 2),
    desvio_padrao = round(sd(df_prophet$y, na.rm = TRUE), 2),
    minimo = round(min(df_prophet$y, na.rm = TRUE), 2),
    maximo = round(max(df_prophet$y, na.rm = TRUE), 2)
  )
  
  resultado_final$periodo_previsao <- list(
    inicio = previsoes_list[[1]]$data,
    fim = previsoes_list[[n_previsoes]]$data,
    inicio_completo = previsoes_list[[1]]$data_completa,
    fim_completo = previsoes_list[[n_previsoes]]$data_completa,
    n_periodos = n_previsoes
  )
  
  resultado_final$qualidade_ajuste <- list(
    classificacao_mape = classificacao_mape,
    mape_valor = round(mape_value, 2)
  )
  
  cat("✅ Prophet executado com sucesso! Previsões:", length(previsoes_list), "\n")
  cat("📊 Métricas: RMSE =", round(rmse, 2), "| MAE =", round(mae, 2), 
      "| MAPE =", round(mape_value, 2), "%\n")
  
}, error = function(e) {
  cat("❌ Erro no Prophet:", e$message, "\n")
  cat("🔍 Traceback:\n")
  print(traceback())
  
  # Criar fallback com dados básicos
  media_valor <- mean(df_prophet$y, na.rm = TRUE)
  desvio_valor <- sd(df_prophet$y, na.rm = TRUE)
  
  previsoes_list <- list()
  for (i in 1:n_previsoes) {
    previsoes_list[[i]] <- list(
      periodo = i,
      data = as.character(max(df_prophet$ds) + i * 30),
      data_formatada = paste("Período", i),
      data_completa = paste("Período", i),
      previsao = round(media_valor * (1 + i * 0.01), 4),
      inferior = round(media_valor * (0.9 + i * 0.01), 4),
      superior = round(media_valor * (1.1 + i * 0.01), 4),
      amplitude = round(media_valor * 0.2, 4)
    )
  }
  
  resultado_final$success <- TRUE
  resultado_final$simulacao <- TRUE
  resultado_final$previsoes <- previsoes_list
  resultado_final$ajustados <- as.list(rep(round(media_valor, 4), nrow(df_prophet)))
  resultado_final$residuos <- as.list(round(df_prophet$y - media_valor, 4))
  resultado_final$metricas <- list(
    mse = round(var(df_prophet$y, na.rm = TRUE), 4),
    rmse = round(sd(df_prophet$y, na.rm = TRUE), 4),
    mae = round(mean(abs(df_prophet$y - media_valor), na.rm = TRUE), 4),
    mape = if (mean(abs(df_prophet$y), na.rm = TRUE) > 0) {
      round(mean(abs((df_prophet$y - media_valor) / df_prophet$y), na.rm = TRUE) * 100, 2)
    } else NA_real_
  )
  resultado_final$aviso <- paste("Usando fallback. Erro original:", e$message)
})

# DEBUG: Mostrar estrutura do resultado
cat("🔍 Estrutura do resultado final:\n")
cat("  - success:", resultado_final$success, "\n")
cat("  - previsoes:", length(resultado_final$previsoes), "\n")
cat("  - ajustados:", length(resultado_final$ajustados), "\n")
if (length(resultado_final$previsoes) > 0) {
  cat("  - primeira previsão:", resultado_final$previsoes[[1]]$previsao, "\n")
}

# Salvar resultado - IMPORTANTE: usar null = "null" para NA
cat("💾 Salvando resultado...\n")

# Converter todos os objetos Date para character
convert_dates <- function(obj) {
  if (is.list(obj)) {
    return(lapply(obj, convert_dates))
  }
  if (inherits(obj, "Date")) {
    return(as.character(obj))
  }
  if (inherits(obj, "POSIXt")) {
    return(as.character(obj))
  }
  return(obj)
}

resultado_final <- convert_dates(resultado_final)

# Salvar com configurações específicas para JSON
write_json(resultado_final, output_file, 
           auto_unbox = TRUE, 
           pretty = TRUE, 
           null = "null",
           na = "null")

cat("✅ Resultado salvo em:", output_file, "\n")
cat("📁 Tamanho do arquivo:", file.size(output_file), "bytes\n")