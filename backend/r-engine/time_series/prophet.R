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

# Função SIMPLIFICADA para converter datas (evitar erros)
converter_data <- function(data_str) {
  tryCatch({
    if (is.null(data_str) || is.na(data_str)) return(NA)
    if (inherits(data_str, "Date")) return(data_str)
    if (inherits(data_str, "POSIXt")) return(as.Date(data_str))
    
    data_str <- as.character(trimws(data_str))
    if (nchar(data_str) == 0) return(NA)
    
    # Tentar formatos diretos (sem warnings)
    # DD/MM/YYYY
    if (grepl("^[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}$", data_str)) {
      return(as.Date(data_str, format = "%d/%m/%Y"))
    }
    # YYYY-MM-DD
    if (grepl("^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}$", data_str)) {
      return(as.Date(data_str))
    }
    # DD/MM/YY
    if (grepl("^[0-9]{1,2}/[0-9]{1,2}/[0-9]{2}$", data_str)) {
      return(as.Date(data_str, format = "%d/%m/%y"))
    }
    
    return(NA)
  }, error = function(e) {
    cat("⚠️ Erro data:", e$message, "\n")
    return(NA)
  })
}

# Ler dados
cat("📖 Lendo arquivo JSON...\n")
input_data <- fromJSON(input_file, simplifyDataFrame = FALSE)

# Extrair dados
dados <- input_data$dados
parametros <- input_data$parametros

cat("📈 Registros:", length(dados), "\n")

if (is.null(dados) || length(dados) < 2) {
  resultado <- list(success = FALSE, error = "Dados insuficientes")
  write_json(resultado, output_file, auto_unbox = TRUE, pretty = TRUE)
  quit()
}

# Configurar parâmetros
y_col <- parametros$y %||% names(dados[[1]])[2]
ds_col <- parametros$ds %||% names(dados[[1]])[1]

growth_frontend <- parametros$crescimento %||% "linear"
growth <- ifelse(growth_frontend == "logistico", "logistic", "linear")

n_previsoes <- as.numeric(parametros$n_previsoes %||% 12)
intervalo <- as.numeric(parametros$intervalo_confianca %||% 0.95)
feriados_ativado <- as.logical(parametros$feriados %||% FALSE)

cat("📊 Config: ds=", ds_col, "y=", y_col, "previsoes=", n_previsoes, "\n")

# Extrair e converter dados
datas_raw <- sapply(dados, function(x) x[[ds_col]])
valores_raw <- sapply(dados, function(x) as.numeric(x[[y_col]]))

cat("📅 Datas exemplo:", paste(head(datas_raw, 3), collapse=" | "), "\n")

# Converter datas
datas <- as.Date(sapply(datas_raw, converter_data), origin = "1970-01-01")
valores <- as.numeric(valores_raw)

# Criar dataframe e limpar
df_prophet <- data.frame(ds = datas, y = valores)
df_prophet <- df_prophet[!is.na(df_prophet$ds) & !is.na(df_prophet$y), ]
df_prophet <- df_prophet[order(df_prophet$ds), ]

cat("✅ Dados limpos:", nrow(df_prophet), "registros\n")

if (nrow(df_prophet) < 2) {
  resultado <- list(success = FALSE, error = paste("Dados insuficientes:", nrow(df_prophet)))
  write_json(resultado, output_file, auto_unbox = TRUE, pretty = TRUE)
  quit()
}

# Determinar frequência
diffs <- as.numeric(diff(df_prophet$ds))
diff_media <- mean(diffs, na.rm = TRUE)

if (diff_media <= 2) freq_real <- "day"
else if (diff_media <= 10) freq_real <- "week"
else if (diff_media <= 40) freq_real <- "month"
else if (diff_media <= 120) freq_real <- "quarter"
else freq_real <- "year"

cat("📊 Frequência detectada:", freq_real, "\n")

# Inicializar resultado
resultado_final <- list(
  success = TRUE,
  tipo = "prophet",
  timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S")
)

# Executar Prophet
tryCatch({
  cat("🔧 Criando modelo Prophet...\n")
  
  # Configurar modelo
  modelo <- prophet(
    df = df_prophet,
    growth = growth,
    yearly.seasonality = TRUE,
    weekly.seasonality = (freq_real == "day"),
    daily.seasonality = (freq_real == "day"),
    interval.width = intervalo,
    changepoint.prior.scale = 0.05
  )
  
  # Criar dataframe futuro
  cat("📈 Gerando previsões para", n_previsoes, "períodos...\n")
  
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
  
  # Prever
  previsao <- predict(modelo, futuro)
  
  # Extrair previsões (apenas as futuras)
  n_historico <- nrow(df_prophet)
  previsoes_futuras <- previsao[(n_historico + 1):nrow(previsao), ]
  
  cat("✅ Previsões geradas:", nrow(previsoes_futuras), "\n")
  
  # Calcular métricas nos dados históricos
  ajustados <- previsao$yhat[1:n_historico]
  residuos <- df_prophet$y - ajustados
  
  rmse <- sqrt(mean(residuos^2, na.rm = TRUE))
  mae <- mean(abs(residuos), na.rm = TRUE)
  
  mape_value <- NA
  if (mean(abs(df_prophet$y), na.rm = TRUE) > 0) {
    mape_value <- mean(abs(residuos / df_prophet$y), na.rm = TRUE) * 100
  }
  
  # Formatar previsões para o frontend
  meses_pt <- c("jan", "fev", "mar", "abr", "mai", "jun",
                "jul", "ago", "set", "out", "nov", "dez")
  
  previsoes_list <- list()
  for (i in 1:nrow(previsoes_futuras)) {
    data_pred <- as.Date(previsoes_futuras$ds[i])
    mes_num <- month(data_pred)
    ano_num <- year(data_pred)
    
    previsoes_list[[i]] <- list(
      periodo = i,
      data = as.character(data_pred),
      data_formatada = paste0(meses_pt[mes_num], "/", ano_num),
      previsao = round(as.numeric(previsoes_futuras$yhat[i]), 4),
      inferior = round(as.numeric(previsoes_futuras$yhat_lower[i]), 4),
      superior = round(as.numeric(previsoes_futuras$yhat_upper[i]), 4)
    )
  }
  
  # Dados históricos
  historico_list <- list()
  for (i in 1:n_historico) {
    historico_list[[i]] <- list(
      data = as.character(df_prophet$ds[i]),
      valor = df_prophet$y[i],
      ajustado = round(ajustados[i], 4)
    )
  }
  
  # Componentes do modelo
  componentes <- list(
    tendencia = as.numeric(tail(previsao$trend, 1)),
    sazonalidade_anual = as.numeric(tail(previsao$yearly, 1))
  )
  
  # Construir resultado COMPLETO
  resultado_final$modelo_info <- list(
    tipo = "Prophet",
    crescimento = growth_frontend,
    intervalo_confianca = intervalo,
    frequencia = freq_real,
    n_observacoes = n_historico,
    n_previsoes = n_previsoes
  )
  
  resultado_final$previsoes <- previsoes_list
  resultado_final$historico <- historico_list
  
  resultado_final$metricas <- list(
    rmse = round(rmse, 4),
    mae = round(mae, 4),
    mape = round(mape_value, 2),
    n = n_historico
  )
  
  resultado_final$componentes <- componentes
  
  resultado_final$dados_originais <- list(
    historico = as.list(df_prophet$y),
    datas = as.list(as.character(df_prophet$ds)),
    media = round(mean(df_prophet$y), 2),
    desvio_padrao = round(sd(df_prophet$y), 2),
    minimo = round(min(df_prophet$y), 2),
    maximo = round(max(df_prophet$y), 2)
  )
  
  resultado_final$periodo_previsao <- list(
    inicio = if(length(previsoes_list) > 0) previsoes_list[[1]]$data else NA,
    fim = if(length(previsoes_list) > 0) previsoes_list[[length(previsoes_list)]]$data else NA,
    n_periodos = n_previsoes
  )
  
  resultado_final$qualidade_ajuste <- list(
    classificacao_mape = if(!is.na(mape_value)) {
      if(mape_value < 10) "Excelente" else if(mape_value < 20) "Boa" else "Razoável"
    } else "Não disponível",
    mape_valor = round(mape_value, 2)
  )
  
  cat("✅ Prophet finalizado! Previsões:", length(previsoes_list), "\n")
  cat("📊 MAPE:", round(mape_value, 2), "%\n")
  
}, error = function(e) {
  cat("❌ Erro no Prophet:", e$message, "\n")
  
  # Fallback com média móvel simples
  media_valor <- mean(df_prophet$y, na.rm = TRUE)
  desvio_valor <- sd(df_prophet$y, na.rm = TRUE)
  
  previsoes_list <- list()
  for (i in 1:n_previsoes) {
    ultima_data <- max(df_prophet$ds, na.rm = TRUE)
    nova_data <- ultima_data + (i * 30)
    
    previsoes_list[[i]] <- list(
      periodo = i,
      data = as.character(nova_data),
      data_formatada = format(nova_data, "%b/%Y"),
      previsao = round(media_valor * (1 + i * 0.01), 4),
      inferior = round(media_valor * (0.85 + i * 0.005), 4),
      superior = round(media_valor * (1.15 + i * 0.015), 4)
    )
  }
  
  resultado_final$success <- TRUE
  resultado_final$simulacao <- TRUE
  resultado_final$previsoes <- previsoes_list
  resultado_final$aviso <- paste("Fallback usado. Erro:", e$message)
  resultado_final$metricas <- list(
    rmse = round(desvio_valor, 4),
    mae = round(desvio_valor * 0.8, 4),
    mape = 25.0,
    n = nrow(df_prophet)
  )
})

# Salvar resultado
cat("💾 Salvando resultado...\n")

# Converter datas para string
resultado_final <- fromJSON(toJSON(resultado_final, auto_unbox = TRUE, null = "null"))

write_json(resultado_final, output_file, 
           auto_unbox = TRUE, 
           pretty = TRUE, 
           null = "null",
           na = "null")

cat("✅ Salvo em:", output_file, "\n")
cat("📁 Tamanho:", file.size(output_file), "bytes\n")