# sql_distribuido.R - Consultas SQL Distribuídas
# VERSÃO CORRIGIDA - sem erros de sintaxe

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
if (!requireNamespace("DBI", quietly = TRUE)) {
  install.packages("DBI", quiet = TRUE)
}

library(jsonlite)
library(dplyr)
library(tidyr)
library(DBI)

# ============================================
# FUNÇÕES UTILITÁRIAS
# ============================================

#' Prepara dados para SQL
#' @param dados Lista de dados
#' @return Data frame
preparar_dados_sql <- function(dados) {
  cat("   🔍 Preparando dados para SQL...\n")
  
  df <- as.data.frame(dados)
  cat(paste("   📊 Data frame original:", nrow(df), "linhas,", ncol(df), "colunas\n"))
  
  # Garantir nomes de colunas válidos para SQL
  names(df) <- make.names(names(df), unique = TRUE)
  
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

#' Executa consulta SQL simulada
#' @param df Data frame
#' @param query Consulta SQL
#' @param engine Motor de execução
#' @return Resultado da consulta
executar_consulta <- function(df, query, engine) {
  cat(paste("   🔧 Executando consulta com", engine, "...\n"))
  
  # Parse simples da consulta (simulado)
  query_lower <- tolower(query)
  
  # Detectar tipo de consulta
  resultado <- NULL
  plano_execucao <- NULL
  
  # Simular diferentes tipos de consulta
  if (grepl("select\\s+\\*", query_lower)) {
    # SELECT * 
    resultado <- head(df, 100)
    plano_execucao <- "Full Table Scan (100 linhas)"
    
  } else if (grepl("count\\(\\*\\)", query_lower)) {
    # COUNT(*)
    resultado <- data.frame(total = nrow(df))
    plano_execucao <- "Aggregate: COUNT(*)"
    
  } else if (grepl("group\\s+by", query_lower)) {
    # GROUP BY
    # Tentar extrair coluna de group by
    colunas_group <- names(df)[sapply(df, function(x) is.character(x) || is.factor(x))]
    if (length(colunas_group) > 0) {
      col_group <- colunas_group[1]
      resultado <- df %>%
        group_by(!!sym(col_group)) %>%
        summarise(
          count = n(),
          .groups = 'drop'
        ) %>%
        head(50)
      plano_execucao <- paste("HashAggregate on", col_group)
    } else {
      resultado <- data.frame(mensagem = "Nenhuma coluna categórica para GROUP BY")
      plano_execucao <- "Fallback: Full Scan"
    }
    
  } else if (grepl("where", query_lower)) {
    # WHERE
    resultado <- head(df, 50)
    plano_execucao <- "Filter + Limit 50"
    
  } else if (grepl("join", query_lower)) {
    # JOIN
    # Criar segundo dataset para join
    df2 <- df[sample(1:nrow(df), min(20, nrow(df))), ]
    resultado <- head(cbind(df[1:min(20, nrow(df)), ], 
                            data.frame(extra = runif(min(20, nrow(df)), 0, 100))), 20)
    plano_execucao <- "BroadcastHashJoin (simulado)"
    
  } else {
    # Default
    resultado <- head(df, 50)
    plano_execucao <- "Full Scan + Limit 50"
  }
  
  return(list(
    dados = resultado,
    plano = plano_execucao
  ))
}

#' Calcula estatísticas de execução
#' @param df Data frame original
#' @param n_particoes Número de partições
#' @param resultado_consulta Resultado da consulta
#' @param engine Motor de execução
#' @return Lista com estatísticas
calcular_estatisticas <- function(df, n_particoes, resultado_consulta, engine) {
  
  # Estatísticas simuladas baseadas no engine
  if (engine == "spark") {
    tempo_parse <- round(runif(1, 0.1, 0.3), 2)
    tempo_otimizacao <- round(runif(1, 0.2, 0.5), 2)
    tempo_execucao_fisico <- round(runif(1, 1.0, 3.0), 2)
    bytes_scaneados <- round(runif(1, 1, 10) * 1024 * 1024)
  } else if (engine == "hive") {
    tempo_parse <- round(runif(1, 0.2, 0.4), 2)
    tempo_otimizacao <- round(runif(1, 0.1, 0.3), 2)
    tempo_execucao_fisico <- round(runif(1, 2.0, 5.0), 2)
    bytes_scaneados <- round(runif(1, 2, 20) * 1024 * 1024)
  } else { # presto
    tempo_parse <- round(runif(1, 0.05, 0.2), 2)
    tempo_otimizacao <- round(runif(1, 0.1, 0.2), 2)
    tempo_execucao_fisico <- round(runif(1, 0.5, 2.0), 2)
    bytes_scaneados <- round(runif(1, 0.5, 5) * 1024 * 1024)
  }
  
  tempo_total <- tempo_parse + tempo_otimizacao + tempo_execucao_fisico
  
  # Número de linhas retornadas
  if (is.data.frame(resultado_consulta$dados)) {
    linhas_retornadas <- nrow(resultado_consulta$dados)
  } else {
    linhas_retornadas <- 1
  }
  
  list(
    tempo_parse = tempo_parse,
    tempo_otimizacao = tempo_otimizacao,
    tempo_execucao_fisico = tempo_execucao_fisico,
    tempo_execucao = tempo_total,
    linhas_retornadas = linhas_retornadas,
    bytes_scaneados = bytes_scaneados,
    particoes_processadas = n_particoes,
    engine = engine
  )
}

#' Gera plano de execução formatado
#' @param plano Plano simples
#' @param engine Motor de execução
#' @return String com plano detalhado
gerar_plano_detalhado <- function(plano, engine) {
  
  planos_detalhados <- list(
    spark = paste(
      "== Physical Plan ==\n",
      "*(1) Project [*]\n",
      "+- *(1) Filter (isnotnull(*))\n",
      "   +- *(1) FileScan parquet [*] Batched: true, DataFilters: [], Format: Parquet\n",
      "      +- *(1) Scan parquet  [*] PartitionFilters: [], PushedFilters: []\n",
      "         Output: [*]",
      sep = ""
    ),
    hive = paste(
      "STAGE DEPENDENCIES:\n",
      "  Stage-1 is a root stage\n",
      "  Stage-0 depends on stages: Stage-1\n",
      "\n",
      "STAGE PLANS:\n",
      "  Stage: Stage-1\n",
      "    Map Reduce\n",
      "      Map Operator Tree:\n",
      "          TableScan\n",
      "            alias: dados\n",
      "            Statistics: Num rows: 12 Data size: 1234\n",
      "            Select Operator\n",
      "              output: [*]\n",
      "              Statistics: Num rows: 12\n",
      "              Limit\n",
      "                Number of rows: 100",
      sep = ""
    ),
    presto = paste(
      "Query Plan\n",
      "==========\n",
      "Output: [*, ...]\n",
      "│   Layout: [*]\n",
      "│   Estimates: {rows: ??}\n",
      "└─ RemoteExchange\n",
      "   │   Layout: [*]\n",
      "   │   Estimates: {rows: ??}\n",
      "   └─ ScanFilterProject\n",
      "         Layout: [*]\n",
      "         Estimates: {rows: 12}\n",
      "         assignments: {}\n",
      "         predicates: []",
      sep = ""
    )
  )
  
  if (!is.null(plano) && plano != "") {
    return(paste(planos_detalhados[[engine]], "\n\n→ ", plano))
  } else {
    return(planos_detalhados[[engine]])
  }
}

# ============================================
# FUNÇÃO PRINCIPAL
# ============================================
main <- function() {
  cat("\n📊 MOTOR BIG DATA - SQL DISTRIBUÍDO")
  cat("\n==================================================\n")
  
  tryCatch({
    args <- commandArgs(trailingOnly = TRUE)
    
    if (length(args) < 2) {
      stop("Uso: Rscript sql_distribuido.R <input.json> <output.json>")
    }
    
    input_file <- args[1]
    output_file <- args[2]
    
    cat(paste("   📁 Arquivo de entrada:", input_file, "\n"))
    cat(paste("   📁 Arquivo de saída:", output_file, "\n"))
    
    if (!file.exists(input_file)) {
      stop(paste("Arquivo de entrada não encontrado:", input_file))
    }
    
    input_data <- fromJSON(input_file)
    
    dados <- input_data$dados
    parametros <- input_data$parametros
    
    query <- parametros$query
    n_particoes <- ifelse(is.null(parametros$n_particioes), 10, as.numeric(parametros$n_particioes))
    engine <- ifelse(is.null(parametros$engine), "spark", as.character(parametros$engine))
    otimizar <- ifelse(is.null(parametros$otimizar), TRUE, as.logical(parametros$otimizar))
    cache <- ifelse(is.null(parametros$cache), FALSE, as.logical(parametros$cache))
    
    cat(paste("   🔧 Query:", substr(query, 1, 50), ifelse(nchar(query) > 50, "...", ""), "\n"))
    cat(paste("   📊 Engine:", engine, "\n"))
    cat(paste("   📈 Partições:", n_particoes, "\n"))
    cat(paste("   ⚡ Otimizar:", ifelse(otimizar, "Sim", "Não"), "\n"))
    cat(paste("   💾 Cache:", ifelse(cache, "Sim", "Não"), "\n"))
    
    # Preparar dados
    df <- preparar_dados_sql(dados)
    
    if (nrow(df) == 0) {
      stop("Nenhum dado válido para processar")
    }
    
    # Executar consulta
    resultado_consulta <- executar_consulta(df, query, engine)
    
    # Calcular estatísticas
    estatisticas <- calcular_estatisticas(df, n_particoes, resultado_consulta, engine)
    
    # Gerar plano de execução
    plano_execucao <- gerar_plano_detalhado(resultado_consulta$plano, engine)
    
    resultado <- list(
      success = TRUE,
      resultado = list(
        dados = resultado_consulta$dados,
        plano_execucao = plano_execucao,
        estatisticas = estatisticas,
        query = query,
        tempo_execucao = estatisticas$tempo_execucao,
        linhas_retornadas = estatisticas$linhas_retornadas,
        bytes_scaneados = estatisticas$bytes_scaneados,
        particoes_processadas = estatisticas$particoes_processadas,
        engine = engine,
        cache_utilizado = cache,
        otimizacao_aplicada = otimizar
      )
    )
    
    cat("\n✅ SQL DISTRIBUÍDO EXECUTADO COM SUCESSO\n")
    cat(paste("   Tempo execução:", round(estatisticas$tempo_execucao, 2), "s\n"))
    cat(paste("   Linhas retornadas:", estatisticas$linhas_retornadas, "\n"))
    cat(paste("   Partições processadas:", n_particoes, "\n"))
    
    write_json(resultado, output_file)
    
  }, error = function(e) {
    cat(paste("\n❌ ERRO:", e$message, "\n"))
    
    erro <- list(
      success = FALSE,
      error = e$message,
      timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S")
    )
    
    if (exists("output_file")) {
      tryCatch({
        write_json(erro, output_file)
      }, error = function(e2) {
        cat(paste("❌ Erro ao escrever arquivo de erro:", e2$message, "\n"))
      })
    }
    
    quit(status = 1)
  })
}

main()