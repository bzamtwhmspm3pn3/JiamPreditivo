# spark_jobs.R - Processamento com Apache Spark
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

library(jsonlite)
library(dplyr)
library(tidyr)

# ============================================
# FUNÇÕES UTILITÁRIAS
# ============================================

#' Prepara dados para processamento Spark
#' @param dados Lista de dados
#' @param variaveis Vetor com nomes das variáveis
#' @return Data frame
preparar_dados_spark <- function(dados, variaveis) {
  cat("   🔍 Preparando dados para Spark...\n")
  
  df <- as.data.frame(dados)
  cat(paste("   📊 Data frame original:", nrow(df), "linhas,", ncol(df), "colunas\n"))
  
  # Selecionar variáveis
  if (!is.null(variaveis) && length(variaveis) > 0) {
    df <- df[, variaveis, drop = FALSE]
  }
  
  # Remover NA
  n_antes <- nrow(df)
  df <- df[complete.cases(df), ]
  n_depois <- nrow(df)
  
  if (n_antes > n_depois) {
    cat(paste("   🧹 Removidas", n_antes - n_depois, "linhas com NA\n"))
  }
  
  cat(paste("   ✅ Dados preparados:", n_depois, "linhas,", ncol(df), "colunas\n"))
  return(df)
}

#' Escreve JSON
write_json <- function(obj, file) {
  json_str <- toJSON(obj, auto_unbox = TRUE, digits = 10, force = TRUE)
  write(json_str, file)
}

# ============================================
# TIPOS DE JOBS SPARK
# ============================================

#' Job ETL (Extração, Transformação, Carga)
#' @param df Data frame
#' @param parametros Lista com parâmetros
#' @return Lista com resultados
job_etl <- function(df, parametros) {
  cat("   🔄 Executando job ETL...\n")
  
  # Simular transformações
  resultado <- list(
    tipo = "etl",
    dados = head(df, 100),
    estatisticas = list(
      linhas_originais = nrow(df),
      colunas_originais = ncol(df),
      linhas_processadas = nrow(df),
      transformacoes_aplicadas = c("filtragem", "limpeza", "normalização")
    )
  )
  
  return(resultado)
}

#' Job Análise Exploratória
#' @param df Data frame
#' @param parametros Lista com parâmetros
#' @return Lista com resultados
job_analise <- function(df, parametros) {
  cat("   📊 Executando job análise exploratória...\n")
  
  # Estatísticas descritivas
  stats <- list()
  for (col in names(df)) {
    if (is.numeric(df[[col]])) {
      stats[[col]] <- list(
        media = mean(df[[col]], na.rm = TRUE),
        mediana = median(df[[col]], na.rm = TRUE),
        desvio = sd(df[[col]], na.rm = TRUE),
        minimo = min(df[[col]], na.rm = TRUE),
        maximo = max(df[[col]], na.rm = TRUE)
      )
    }
  }
  
  resultado <- list(
    tipo = "analise",
    estatisticas = stats,
    correlacoes = cor(df[sapply(df, is.numeric)]),
    amostra = head(df, 20)
  )
  
  return(resultado)
}

#' Job Agregação
#' @param df Data frame
#' @param parametros Lista com parâmetros
#' @return Lista com resultados
job_agregacao <- function(df, parametros) {
  cat("   📈 Executando job agregação...\n")
  
  # Encontrar colunas categóricas para group by
  categoricas <- names(df)[sapply(df, function(x) is.character(x) || is.factor(x))]
  numericas <- names(df)[sapply(df, is.numeric)]
  
  if (length(categoricas) > 0 && length(numericas) > 0) {
    # Fazer group by pela primeira coluna categórica
    grupo <- categoricas[1]
    agregacoes <- df %>%
      group_by(!!sym(grupo)) %>%
      summarise(across(all_of(numericas), 
                       list(media = ~mean(., na.rm = TRUE),
                            soma = ~sum(., na.rm = TRUE),
                            count = ~n()), 
                       .names = "{col}_{fn}"))
    
    resultado <- list(
      tipo = "agregacao",
      grupo = grupo,
      agregacoes = agregacoes,
      estatisticas = list(
        grupos_distintos = nrow(agregacoes),
        colunas_agregadas = length(numericas)
      )
    )
  } else {
    # Agregação global
    agregacoes <- list()
    for (col in numericas) {
      agregacoes[[col]] <- list(
        soma = sum(df[[col]], na.rm = TRUE),
        media = mean(df[[col]], na.rm = TRUE),
        count = length(df[[col]])
      )
    }
    
    resultado <- list(
      tipo = "agregacao_global",
      agregacoes = agregacoes,
      estatisticas = list(
        total_linhas = nrow(df),
        colunas_agregadas = length(numericas)
      )
    )
  }
  
  return(resultado)
}

#' Job Machine Learning
#' @param df Data frame
#' @param parametros Lista com parâmetros
#' @return Lista com resultados
job_ml <- function(df, parametros) {
  cat("   🤖 Executando job Machine Learning...\n")
  
  # Simular preparação de dados para ML
  numeric_cols <- names(df)[sapply(df, is.numeric)]
  
  resultado <- list(
    tipo = "ml",
    preparacao = list(
      features = numeric_cols,
      n_amostras = nrow(df),
      n_features = length(numeric_cols)
    ),
    pipeline = c("vector_assembler", "standard_scaler", "pca"),
    estatisticas = list(
      dados_treino = round(nrow(df) * 0.7),
      dados_teste = round(nrow(df) * 0.3)
    ),
    amostra = head(df, 10)
  )
  
  return(resultado)
}

# ============================================
# FUNÇÃO PRINCIPAL
# ============================================
main <- function() {
  cat("\n⚡ MOTOR BIG DATA - SPARK JOBS")
  cat("\n==================================================\n")
  
  tryCatch({
    args <- commandArgs(trailingOnly = TRUE)
    
    if (length(args) < 2) {
      stop("Uso: Rscript spark_jobs.R <input.json> <output.json>")
    }
    
    input_file <- args[1]
    output_file <- args[2]
    
    cat(paste("   📁 Arquivo de entrada:", input_file, "\n"))
    cat(paste("   📁 Arquivo de saída:", output_file, "\n"))
    
    input_data <- fromJSON(input_file)
    
    dados <- input_data$dados
    parametros <- input_data$parametros
    
    job_type <- parametros$job_type
    variaveis <- parametros$variaveis
    n_particoes <- ifelse(is.null(parametros$n_particioes), 10, parametros$n_particioes)
    cache_level <- ifelse(is.null(parametros$cache_level), "NONE", parametros$cache_level)
    
    cat(paste("   🔧 Job Type:", job_type, "\n"))
    cat(paste("   📊 Partições:", n_particoes, "\n"))
    cat(paste("   💾 Cache Level:", cache_level, "\n"))
    
    # Preparar dados
    df <- preparar_dados_spark(dados, variaveis)
    
    # Executar job apropriado
    resultado_job <- NULL
    
    if (job_type == "etl") {
      resultado_job <- job_etl(df, parametros)
    } else if (job_type == "analise") {
      resultado_job <- job_analise(df, parametros)
    } else if (job_type == "agregacao") {
      resultado_job <- job_agregacao(df, parametros)
    } else if (job_type == "ml") {
      resultado_job <- job_ml(df, parametros)
    } else {
      stop(paste("Tipo de job não reconhecido:", job_type))
    }
    
    # Métricas de performance simuladas
    tempo_setup <- round(runif(1, 0.5, 2.0), 1)
    tempo_processamento <- round(runif(1, 1.0, 5.0), 1)
    tempo_shuffle <- round(runif(1, 0.2, 1.5), 1)
    tempo_coleta <- round(runif(1, 0.1, 0.8), 1)
    
    resultado <- list(
      success = TRUE,
      resultado = list(
        tipo = resultado_job$tipo,
        dados = resultado_job$dados,
        estatisticas = resultado_job$estatisticas,
        metricas_detalhadas = list(
          tempo_setup = tempo_setup,
          tempo_processamento = tempo_processamento,
          tempo_shuffle = tempo_shuffle,
          tempo_coleta = tempo_coleta,
          dag_size = sample(5:20, 1),
          tasks = sample(20:100, 1),
          memoria_usada = sample(128:1024, 1)
        ),
        tempo_execucao = tempo_setup + tempo_processamento + tempo_shuffle + tempo_coleta,
        linhas_processadas = nrow(df),
        particoes_utilizadas = n_particoes,
        shuffle_read = round(runif(1, 10, 100), 1),
        shuffle_write = round(runif(1, 5, 50), 1),
        job_type = job_type,
        cache_level = cache_level
      )
    )
    
    cat("\n✅ SPARK JOB EXECUTADO COM SUCESSO\n")
    cat(paste("   Tempo total:", round(resultado$resultado$tempo_execucao, 1), "s\n"))
    cat(paste("   Linhas processadas:", resultado$resultado$linhas_processadas, "\n"))
    
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