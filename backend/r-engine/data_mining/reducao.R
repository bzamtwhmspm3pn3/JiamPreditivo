# reducao.R - Algoritmos de Redução Dimensional
# PCA, t-SNE, UMAP
# VERSÃO CORRIGIDA - t-SNE com ajuste automático de perplexidade

options(repos = structure(c(CRAN = "https://cloud.r-project.org/")))

# Carregar pacotes necessários
if (!requireNamespace("jsonlite", quietly = TRUE)) {
  install.packages("jsonlite", quiet = TRUE)
}
if (!requireNamespace("stats", quietly = TRUE)) {
  install.packages("stats", quiet = TRUE)
}
if (!requireNamespace("Rtsne", quietly = TRUE)) {
  install.packages("Rtsne", quiet = TRUE)
}
if (!requireNamespace("umap", quietly = TRUE)) {
  install.packages("umap", quiet = TRUE)
}
if (!requireNamespace("dplyr", quietly = TRUE)) {
  install.packages("dplyr", quiet = TRUE)
}

library(jsonlite)
library(stats)
library(Rtsne)
library(umap)
library(dplyr)

# ============================================
# FUNÇÕES UTILITÁRIAS
# ============================================

#' Prepara dados para redução dimensional
#' @param dados Lista de dados
#' @param variaveis Vetor com nomes das variáveis
#' @return Matriz numérica padronizada
preparar_dados_reducao <- function(dados, variaveis, scale = TRUE) {
  cat("   🔍 Preparando dados para redução dimensional...\n")
  
  df <- as.data.frame(dados)
  cat(paste("   📊 Data frame original:", nrow(df), "linhas,", ncol(df), "colunas\n"))
  
  # Selecionar variáveis
  dados_numericos <- df[, variaveis, drop = FALSE]
  
  # Converter para matriz numérica
  matriz <- as.matrix(dados_numericos)
  
  # Remover NA
  n_antes <- nrow(matriz)
  matriz <- matriz[complete.cases(matriz), , drop = FALSE]
  n_depois <- nrow(matriz)
  
  if (n_antes > n_depois) {
    cat(paste("   🧹 Removidas", n_antes - n_depois, "linhas com NA\n"))
  }
  
  # Verificar se há dados suficientes
  if (n_depois < 3) {
    stop("Dados insuficientes para redução dimensional (mínimo 3 observações)")
  }
  
  # Padronizar se solicitado
  if (scale) {
    cat("   📏 Padronizando dados (média=0, desvio=1)...\n")
    matriz <- scale(matriz)
  }
  
  cat(paste("   ✅ Dados preparados:", n_depois, "observações,", ncol(matriz), "variáveis\n"))
  return(matriz)
}

#' Ajusta perplexidade para t-SNE baseado no número de amostras
#' @param n_samples Número de amostras
#' @param requested_perplexity Perplexidade solicitada
#' @return Perplexidade ajustada
ajustar_perplexidade <- function(n_samples, requested_perplexity) {
  # Regra: perplexidade deve ser menor que n_samples/3
  max_perplexity <- floor((n_samples - 1) / 3)
  
  if (requested_perplexity > max_perplexity) {
    cat(paste("   ⚠️ Perplexidade solicitada (", requested_perplexity, 
              ") muito alta para ", n_samples, " amostras.\n", sep=""))
    adjusted <- max(5, max_perplexity)
    cat(paste("   📊 Ajustando para:", adjusted, "\n"))
    return(adjusted)
  }
  
  if (requested_perplexity < 2) {
    cat("   ⚠️ Perplexidade muito baixa, ajustando para 5\n")
    return(5)
  }
  
  return(requested_perplexity)
}

#' Escreve JSON
write_json <- function(obj, file) {
  json_str <- toJSON(obj, auto_unbox = TRUE, digits = 10)
  write(json_str, file)
}

# ============================================
# ALGORITMOS
# ============================================

#' Executa PCA (Análise de Componentes Principais)
#' @param dados DataFrame com os dados
#' @param parametros Lista com parâmetros
#' @return Lista com resultados
executar_pca <- function(dados, parametros) {
  cat("\n📉 EXECUTANDO PCA")
  cat("\n==================================================\n")
  
  tryCatch({
    variaveis <- parametros$variaveis
    n_components <- ifelse(is.null(parametros$n_components), 2, as.integer(parametros$n_components))
    scale <- ifelse(is.null(parametros$scale), TRUE, as.logical(parametros$scale))
    
    cat(paste("   📈 Configuração: n_components=", n_components, ", scale=", scale, "\n"))
    
    # Preparar dados
    dados_matrix <- preparar_dados_reducao(dados, variaveis, scale)
    
    # Ajustar n_components se necessário
    max_components <- min(ncol(dados_matrix), nrow(dados_matrix) - 1)
    if (n_components > max_components) {
      cat(paste("   ⚠️ n_components muito alto, ajustando para", max_components, "\n"))
      n_components <- max_components
    }
    
    cat("   🔧 Executando PCA...\n")
    pca_result <- prcomp(dados_matrix, center = FALSE, scale. = FALSE)
    
    # Variância explicada
    variancia <- pca_result$sdev^2
    variancia_explicada <- variancia / sum(variancia)
    variancia_acumulada <- cumsum(variancia_explicada)
    
    # Componentes (primeiras n_components)
    componentes <- pca_result$x[, 1:min(n_components, ncol(pca_result$x)), drop = FALSE]
    
    # Loadings
    loadings <- pca_result$rotation[, 1:min(n_components, ncol(pca_result$rotation)), drop = FALSE]
    
    # Preparar para JSON
    componentes_list <- list()
    for (i in 1:nrow(componentes)) {
      componentes_list[[i]] <- as.numeric(componentes[i, ])
    }
    
    loadings_list <- list()
    for (j in 1:ncol(loadings)) {
      loadings_list[[paste0("PC", j)]] <- as.numeric(loadings[, j])
    }
    
    cat("\n✅ PCA EXECUTADO COM SUCESSO")
    cat("\n====================================\n")
    cat(paste("   Variância explicada (PC1):", round(variancia_explicada[1] * 100, 1), "%\n"))
    if (n_components >= 2) {
      cat(paste("   Variância explicada (PC2):", round(variancia_explicada[2] * 100, 1), "%\n"))
    }
    cat(paste("   Variância acumulada:", round(variancia_acumulada[n_components] * 100, 1), "%\n"))
    
    resultado <- list(
      componentes = componentes_list,
      variancia_explicada = as.numeric(variancia_explicada[1:n_components]),
      variancia_acumulada = as.numeric(variancia_acumulada[n_components]),
      loadings = loadings_list,
      autovalores = as.numeric(variancia[1:n_components]),
      n_componentes = n_components
    )
    
    return(list(success = TRUE, resultado = resultado))
    
  }, error = function(e) {
    cat(paste("❌ Erro no PCA:", e$message, "\n"))
    return(list(success = FALSE, error = e$message))
  })
}

#' Executa t-SNE (CORRIGIDO)
#' @param dados DataFrame com os dados
#' @param parametros Lista com parâmetros
#' @return Lista com resultados
executar_tsne <- function(dados, parametros) {
  cat("\n🌀 EXECUTANDO T-SNE")
  cat("\n==================================================\n")
  
  tryCatch({
    variaveis <- parametros$variaveis
    n_components <- ifelse(is.null(parametros$n_components), 2, as.integer(parametros$n_components))
    requested_perplexity <- ifelse(is.null(parametros$perplexity), 30, as.numeric(parametros$perplexity))
    max_iter <- ifelse(is.null(parametros$max_iter), 1000, as.integer(parametros$max_iter))
    
    cat(paste("   📈 Configuração: n_components=", n_components, 
              ", perplexity=", requested_perplexity, ", max_iter=", max_iter, "\n"))
    
    # Preparar dados
    dados_matrix <- preparar_dados_reducao(dados, variaveis, scale = TRUE)
    n_samples <- nrow(dados_matrix)
    
    # 🔥 CORREÇÃO: Ajustar perplexidade automaticamente
    perplexity <- ajustar_perplexidade(n_samples, requested_perplexity)
    
    cat(paste("   🔧 Executando t-SNE com perplexity =", perplexity, "...\n"))
    set.seed(42)
    
    tsne_result <- Rtsne(
      dados_matrix,
      dims = n_components,
      perplexity = perplexity,
      max_iter = max_iter,
      verbose = FALSE,
      pca = TRUE,
      normalize = TRUE
    )
    
    # Preparar componentes
    componentes <- tsne_result$Y
    componentes_list <- list()
    for (i in 1:nrow(componentes)) {
      componentes_list[[i]] <- as.numeric(componentes[i, ])
    }
    
    # Calcular KL divergência final
    kl_div <- ifelse(length(tsne_result$costs) > 0, 
                     tsne_result$costs[length(tsne_result$costs)], 
                     0)
    
    cat("\n✅ T-SNE EXECUTADO COM SUCESSO")
    cat("\n====================================\n")
    cat(paste("   Iterações:", length(tsne_result$itercosts), "\n"))
    cat(paste("   KL-divergência final:", round(kl_div, 4), "\n"))
    cat(paste("   Perplexidade utilizada:", perplexity, "\n"))
    
    resultado <- list(
      componentes = componentes_list,
      n_componentes = n_components,
      perplexity = perplexity,
      perplexity_original = requested_perplexity,
      iteracoes = length(tsne_result$itercosts),
      kl_divergencia = kl_div
    )
    
    return(list(success = TRUE, resultado = resultado))
    
  }, error = function(e) {
    cat(paste("❌ Erro no t-SNE:", e$message, "\n"))
    return(list(success = FALSE, error = e$message))
  })
}

#' Executa UMAP
#' @param dados DataFrame com os dados
#' @param parametros Lista com parâmetros
#' @return Lista com resultados
executar_umap <- function(dados, parametros) {
  cat("\n🌌 EXECUTANDO UMAP")
  cat("\n==================================================\n")
  
  tryCatch({
    variaveis <- parametros$variaveis
    n_components <- ifelse(is.null(parametros$n_components), 2, as.integer(parametros$n_components))
    n_neighbors <- ifelse(is.null(parametros$n_neighbors), 15, as.integer(parametros$n_neighbors))
    min_dist <- ifelse(is.null(parametros$min_dist), 0.1, as.numeric(parametros$min_dist))
    
    cat(paste("   📈 Configuração: n_components=", n_components, 
              ", n_neighbors=", n_neighbors, ", min_dist=", min_dist, "\n"))
    
    # Preparar dados
    dados_matrix <- preparar_dados_reducao(dados, variaveis, scale = TRUE)
    
    # Ajustar n_neighbors se necessário
    if (n_neighbors >= nrow(dados_matrix)) {
      cat("   ⚠️ n_neighbors muito alto, ajustando...\n")
      n_neighbors <- max(3, floor(nrow(dados_matrix) / 2))
      cat(paste("   📊 Novo n_neighbors:", n_neighbors, "\n"))
    }
    
    cat("   🔧 Executando UMAP...\n")
    set.seed(42)
    
    # Configuração do UMAP
    config <- umap.defaults
    config$n_components <- n_components
    config$n_neighbors <- n_neighbors
    config$min_dist <- min_dist
    config$random_state <- 42
    
    umap_result <- umap(dados_matrix, config = config)
    
    # Preparar componentes
    componentes <- umap_result$layout
    componentes_list <- list()
    for (i in 1:nrow(componentes)) {
      componentes_list[[i]] <- as.numeric(componentes[i, ])
    }
    
    cat("\n✅ UMAP EXECUTADO COM SUCESSO")
    cat("\n====================================\n")
    cat(paste("   Dimensões reduzidas:", n_components, "\n"))
    cat(paste("   n_neighbors utilizado:", n_neighbors, "\n"))
    
    resultado <- list(
      componentes = componentes_list,
      n_componentes = n_components,
      n_neighbors = n_neighbors,
      min_dist = min_dist
    )
    
    return(list(success = TRUE, resultado = resultado))
    
  }, error = function(e) {
    cat(paste("❌ Erro no UMAP:", e$message, "\n"))
    return(list(success = FALSE, error = e$message))
  })
}

# ============================================
# FUNÇÃO PRINCIPAL
# ============================================
main <- function() {
  cat("\n🔍 MOTOR DE DATA MINING (Redução Dimensional)")
  cat("\n==================================================\n")
  
  tryCatch({
    args <- commandArgs(trailingOnly = TRUE)
    
    if (length(args) < 2) {
      stop("Uso: Rscript reducao.R <input.json> <output.json>")
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
    
    if (algoritmo == "pca") {
      resultado <- executar_pca(dados, parametros)
    } else if (algoritmo == "tsne") {
      resultado <- executar_tsne(dados, parametros)
    } else if (algoritmo == "umap") {
      resultado <- executar_umap(dados, parametros)
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