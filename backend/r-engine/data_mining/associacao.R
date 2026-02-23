# associacao.R - Algoritmos de Regras de Associação
# Apriori, FP-Growth, Eclat

# Configurar mirror do CRAN
options(repos = structure(c(CRAN = "https://cloud.r-project.org/")))

# Carregar pacotes necessários
if (!requireNamespace("jsonlite", quietly = TRUE)) {
  install.packages("jsonlite", quiet = TRUE)
}
if (!requireNamespace("arules", quietly = TRUE)) {
  install.packages("arules", quiet = TRUE)
}
if (!requireNamespace("dplyr", quietly = TRUE)) {
  install.packages("dplyr", quiet = TRUE)
}

library(jsonlite)
library(arules)
library(dplyr)

# ============================================
# FUNÇÕES UTILITÁRIAS
# ============================================

#' Prepara dados para análise de associação
#' @param dados Lista de dados
#' @param formato Formato dos dados ("transacoes" ou "dataframe")
#' @return Objeto transactions do arules
preparar_dados_associacao <- function(dados, formato = "transacoes") {
  cat("   🔍 Preparando dados para regras de associação...\n")
  
  if (formato == "transacoes") {
    # Se já veio como lista de transações
    if (is.list(dados) && all(sapply(dados, is.vector))) {
      cat("   📦 Dados já estão no formato de transações\n")
      transacoes <- as(dados, "transactions")
      return(transacoes)
    }
  }
  
  # Tentar converter de dataframe
  df <- as.data.frame(dados)
  cat(paste("   📊 Data frame recebido:", nrow(df), "linhas,", ncol(df), "colunas\n"))
  
  # Se tem coluna de itens, converter
  if ("itens" %in% colnames(df)) {
    cat("   🔄 Convertendo coluna 'itens' para transações...\n")
    # Agrupar por transação se houver ID
    if ("transacao_id" %in% colnames(df)) {
      transacoes_list <- split(df$itens, df$transacao_id)
      transacoes <- as(transacoes_list, "transactions")
    } else {
      # Cada linha é uma transação com um item
      transacoes <- as(split(df$itens, seq(nrow(df))), "transactions")
    }
  } else {
    # Tentar tratar cada coluna como item binário
    cat("   🔄 Convertendo colunas em itens binários...\n")
    # Converter para matriz de presença/ausência
    matriz <- as.matrix(df)
    transacoes <- as(matriz, "transactions")
  }
  
  cat(paste("   ✅ Dados preparados:", length(transacoes), "transações,", 
            ncol(transacoes), "itens distintos\n"))
  return(transacoes)
}

#' Escreve JSON para arquivo
write_json <- function(obj, file) {
  json_str <- toJSON(obj, auto_unbox = TRUE, digits = 10)
  write(json_str, file)
}

# ============================================
# FUNÇÕES DOS ALGORITMOS
# ============================================

#' Executa algoritmo Apriori
#' @param dados DataFrame com os dados
#' @param parametros Lista com parâmetros
#' @return Lista com resultados formatados
executar_apriori <- function(dados, parametros) {
  cat("\n🛒 EXECUTANDO APRIORI (REGRAS DE ASSOCIAÇÃO)")
  cat("\n==================================================\n")
  
  tryCatch({
    # Extrair parâmetros
    suporte_min <- ifelse(is.null(parametros$min_support), 0.1, as.numeric(parametros$min_support))
    confianca_min <- ifelse(is.null(parametros$min_confidence), 0.5, as.numeric(parametros$min_confidence))
    min_len <- ifelse(is.null(parametros$min_length), 1, as.integer(parametros$min_length))
    max_len <- ifelse(is.null(parametros$max_length), 10, as.integer(parametros$max_length))
    
    cat(paste("   📈 Configuração: Apriori\n"))
    cat(paste("   📊 Suporte mínimo:", suporte_min, "\n"))
    cat(paste("   📊 Confiança mínima:", confianca_min, "\n"))
    cat(paste("   📊 Tamanho das regras:", min_len, "-", max_len, "\n"))
    
    # Preparar dados
    transacoes <- preparar_dados_associacao(dados)
    
    cat("   🔧 Executando algoritmo Apriori...\n")
    regras <- apriori(transacoes, 
                      parameter = list(
                        support = suporte_min,
                        confidence = confianca_min,
                        minlen = min_len,
                        maxlen = max_len,
                        target = "rules"
                      ))
    
    cat(paste("   ✅ Apriori concluído:", length(regras), "regras encontradas\n"))
    
    # Ordenar por lift
    regras <- sort(regras, by = "lift")
    
    # Preparar resultados
    regras_list <- list()
    for (i in 1:min(100, length(regras))) {
      regra <- regras[i]
      lhs <- labels(lhs(regra))
      rhs <- labels(rhs(regra))
      
      # Extrair itens
      lhs_itens <- strsplit(gsub("[{}]", "", lhs), ",")[[1]]
      rhs_itens <- strsplit(gsub("[{}]", "", rhs), ",")[[1]]
      
      regras_list[[i]] <- list(
        antecedente = trimws(lhs_itens),
        consequente = trimws(rhs_itens),
        suporte = round(quality(regra)$support, 4),
        confianca = round(quality(regra)$confidence, 4),
        lift = round(quality(regra)$lift, 4),
        count = round(quality(regra)$support * length(transacoes))
      )
    }
    
    # Estatísticas
    stats <- list(
      total_regras = length(regras),
      suporte_medio = mean(quality(regras)$support),
      confianca_media = mean(quality(regras)$confidence),
      lift_medio = mean(quality(regras)$lift),
      regras_alto_lift = sum(quality(regras)$lift > 2)
    )
    
    cat("\n✅ APRIORI EXECUTADO COM SUCESSO")
    cat("\n====================================\n")
    cat(paste("   Regras encontradas:", length(regras), "\n"))
    cat(paste("   Suporte médio:", round(stats$suporte_medio, 4), "\n"))
    cat(paste("   Confiança média:", round(stats$confianca_media, 4), "\n"))
    cat(paste("   Lift médio:", round(stats$lift_medio, 4), "\n"))
    
    resultado <- list(
      regras = regras_list,
      estatisticas = stats,
      parametros = list(
        suporte_min = suporte_min,
        confianca_min = confianca_min,
        min_len = min_len,
        max_len = max_len
      ),
      n_transacoes = length(transacoes),
      n_itens = ncol(transacoes)
    )
    
    return(list(
      success = TRUE, 
      resultado = resultado
    ))
    
  }, error = function(e) {
    cat(paste("❌ Erro no Apriori:", e$message, "\n"))
    return(list(success = FALSE, error = e$message))
  })
}

#' Executa algoritmo FP-Growth
#' @param dados DataFrame com os dados
#' @param parametros Lista com parâmetros
#' @return Lista com resultados formatados
executar_fp_growth <- function(dados, parametros) {
  cat("\n🌲 EXECUTANDO FP-GROWTH")
  cat("\n==================================================\n")
  
  tryCatch({
    # Extrair parâmetros
    suporte_min <- ifelse(is.null(parametros$min_support), 0.1, as.numeric(parametros$min_support))
    min_len <- ifelse(is.null(parametros$min_length), 1, as.integer(parametros$min_length))
    max_len <- ifelse(is.null(parametros$max_length), 5, as.integer(parametros$max_length))
    
    cat(paste("   📈 Configuração: FP-Growth\n"))
    cat(paste("   📊 Suporte mínimo:", suporte_min, "\n"))
    
    # Preparar dados
    transacoes <- preparar_dados_associacao(dados)
    
    cat("   🔧 Executando FP-Growth...\n")
    # No arules, FP-Growth é chamado via mesma função com algoritmo diferente
    itemsets <- apriori(transacoes,
                        parameter = list(
                          support = suporte_min,
                          minlen = min_len,
                          maxlen = max_len,
                          target = "frequent itemsets"
                        ))
    
    cat(paste("   ✅ FP-Growth concluído:", length(itemsets), "itemsets frequentes encontrados\n"))
    
    # Preparar resultados
    itemsets_list <- list()
    for (i in 1:min(50, length(itemsets))) {
      itemset <- itemsets[i]
      itens <- labels(itemset)
      itens_list <- strsplit(gsub("[{}]", "", itens), ",")[[1]]
      
      itemsets_list[[i]] <- list(
        itens = trimws(itens_list),
        suporte = round(quality(itemset)$support, 4),
        count = round(quality(itemset)$support * length(transacoes))
      )
    }
    
    cat("\n✅ FP-GROWTH EXECUTADO COM SUCESSO")
    cat("\n====================================\n")
    cat(paste("   Itemsets frequentes:", length(itemsets), "\n"))
    
    resultado <- list(
      itemsets = itemsets_list,
      n_itemsets = length(itemsets),
      parametros = list(
        suporte_min = suporte_min,
        min_len = min_len,
        max_len = max_len
      ),
      n_transacoes = length(transacoes)
    )
    
    return(list(
      success = TRUE, 
      resultado = resultado
    ))
    
  }, error = function(e) {
    cat(paste("❌ Erro no FP-Growth:", e$message, "\n"))
    return(list(success = FALSE, error = e$message))
  })
}

#' Executa algoritmo Eclat
#' @param dados DataFrame com os dados
#' @param parametros Lista com parâmetros
#' @return Lista com resultados formatados
executar_eclat <- function(dados, parametros) {
  cat("\n⚡ EXECUTANDO ECLAT")
  cat("\n==================================================\n")
  
  tryCatch({
    # Extrair parâmetros
    suporte_min <- ifelse(is.null(parametros$min_support), 0.1, as.numeric(parametros$min_support))
    min_len <- ifelse(is.null(parametros$min_length), 1, as.integer(parametros$min_length))
    max_len <- ifelse(is.null(parametros$max_length), 5, as.integer(parametros$max_length))
    
    cat(paste("   📈 Configuração: Eclat\n"))
    cat(paste("   📊 Suporte mínimo:", suporte_min, "\n"))
    
    # Preparar dados
    transacoes <- preparar_dados_associacao(dados)
    
    cat("   🔧 Executando Eclat...\n")
    itemsets <- eclat(transacoes,
                      parameter = list(
                        support = suporte_min,
                        minlen = min_len,
                        maxlen = max_len,
                        target = "frequent itemsets"
                      ))
    
    cat(paste("   ✅ Eclat concluído:", length(itemsets), "itemsets frequentes encontrados\n"))
    
    # Preparar resultados
    itemsets_list <- list()
    for (i in 1:min(50, length(itemsets))) {
      itemset <- itemsets[i]
      itens <- labels(itemset)
      itens_list <- strsplit(gsub("[{}]", "", itens), ",")[[1]]
      
      itemsets_list[[i]] <- list(
        itens = trimws(itens_list),
        suporte = round(quality(itemset)$support, 4),
        count = round(quality(itemset)$support * length(transacoes))
      )
    }
    
    cat("\n✅ ECLAT EXECUTADO COM SUCESSO")
    cat("\n====================================\n")
    cat(paste("   Itemsets frequentes:", length(itemsets), "\n"))
    
    resultado <- list(
      itemsets = itemsets_list,
      n_itemsets = length(itemsets),
      parametros = list(
        suporte_min = suporte_min,
        min_len = min_len,
        max_len = max_len
      ),
      n_transacoes = length(transacoes)
    )
    
    return(list(
      success = TRUE, 
      resultado = resultado
    ))
    
  }, error = function(e) {
    cat(paste("❌ Erro no Eclat:", e$message, "\n"))
    return(list(success = FALSE, error = e$message))
  })
}

# ============================================
# FUNÇÃO PRINCIPAL
# ============================================
main <- function() {
  cat("\n🔍 MOTOR DE DATA MINING (Associação)")
  cat("\n==================================================\n")
  
  tryCatch({
    args <- commandArgs(trailingOnly = TRUE)
    
    if (length(args) < 2) {
      stop("Uso: Rscript associacao.R <input.json> <output.json>")
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
    algoritmo <- parametros$algoritmo
    
    cat(paste("   🔧 Executando algoritmo:", algoritmo, "\n"))
    
    resultado <- NULL
    
    if (algoritmo == "apriori") {
      resultado <- executar_apriori(dados, parametros)
    } else if (algoritmo == "fp_growth") {
      resultado <- executar_fp_growth(dados, parametros)
    } else if (algoritmo == "eclat") {
      resultado <- executar_eclat(dados, parametros)
    } else {
      stop(paste("Algoritmo não reconhecido:", algoritmo))
    }
    
    resultado$timestamp <- format(Sys.time(), "%Y-%m-%d %H:%M:%S")
    resultado$algoritmo <- algoritmo
    
    cat("   💾 Escrevendo resultado...\n")
    write_json(resultado, output_file)
    
    cat("\n✅ DATA MINING EXECUTADO COM SUCESSO\n")
    
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
      }, error = function(e2) {})
    }
    
    quit(status = 1)
  })
}

main()