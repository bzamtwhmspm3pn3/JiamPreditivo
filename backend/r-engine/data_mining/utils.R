#!/usr/bin/env Rscript

# ============================================
# UTILITÁRIOS PARA DATA MINING
# ============================================

library(jsonlite)
library(dplyr)
library(tidyr)

# Função para validar dados de entrada
validar_dados <- function(dados) {
  if (is.null(dados) || length(dados) == 0) {
    stop("Dados vazios ou nulos")
  }
  
  if (!is.data.frame(dados)) {
    dados <- as.data.frame(dados)
  }
  
  return(dados)
}

# Função para extrair variáveis numéricas
extrair_numericas <- function(dados) {
  dados_numericos <- dados %>% select(where(is.numeric))
  
  if (ncol(dados_numericos) == 0) {
    stop("Nenhuma variável numérica encontrada")
  }
  
  return(dados_numericos)
}

# Função para normalizar dados
normalizar_dados <- function(dados, metodo = "minmax") {
  if (metodo == "minmax") {
    normalizado <- as.data.frame(scale(dados, center = apply(dados, 2, min), 
                                       scale = apply(dados, 2, function(x) diff(range(x)))))
  } else if (metodo == "zscore") {
    normalizado <- as.data.frame(scale(dados))
  } else {
    stop("Método de normalização não reconhecido")
  }
  
  return(normalizado)
}

# Função para calcular métricas de clustering
calcular_metricas_clustering <- function(dados, clusters, centroides) {
  n_clusters <- length(unique(clusters))
  
  # Silhueta
  silhueta <- tryCatch({
    if (require(cluster, quietly = TRUE)) {
      sil <- silhouette(clusters, dist(dados))
      mean(sil[, 3])
    } else {
      NA
    }
  }, error = function(e) NA)
  
  # Inércia (soma dos quadrados intra-cluster)
  inercia <- sum(sapply(1:n_clusters, function(k) {
    if (sum(clusters == k) > 0) {
      sum(rowSums((scale(dados[clusters == k, ], center = centroides[k, ], scale = FALSE))^2))
    } else {
      0
    }
  }))
  
  # Davies-Bouldin
  davies_bouldin <- tryCatch({
    if (require(clusterSim, quietly = TRUE)) {
      index.DB(dados, clusters)$DB
    } else {
      NA
    }
  }, error = function(e) NA)
  
  return(list(
    silhueta = silhueta,
    inercia = inercia,
    davies_bouldin = davies_bouldin,
    n_clusters = n_clusters
  ))
}

# Função para criar template de resposta
criar_resposta <- function(success = TRUE, data = NULL, error = NULL, warnings = NULL) {
  resposta <- list(
    success = success,
    timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S"),
    r_version = R.version.string
  )
  
  if (!is.null(data)) {
    resposta$data <- data
  }
  
  if (!is.null(error)) {
    resposta$error <- error
  }
  
  if (!is.null(warnings)) {
    resposta$warnings <- warnings
  }
  
  return(resposta)
}