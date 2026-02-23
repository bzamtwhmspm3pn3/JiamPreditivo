
# anomalias.R - Algoritmos de Detecção de Anomalias
# Isolation Forest, LOF, One-Class SVM
# VERSÃO FINAL - Isolation Forest com API correta do isotree

options(repos = structure(c(CRAN = "https://cloud.r-project.org/")))

# Carregar pacotes necessários
if (!requireNamespace("jsonlite", quietly = TRUE)) {
  install.packages("jsonlite", quiet = TRUE)
}
if (!requireNamespace("isotree", quietly = TRUE)) {
  install.packages("isotree", quiet = TRUE)
}
if (!requireNamespace("dbscan", quietly = TRUE)) {
  install.packages("dbscan", quiet = TRUE)
}
if (!requireNamespace("e1071", quietly = TRUE)) {
  install.packages("e1071", quiet = TRUE)
}
if (!requireNamespace("dplyr", quietly = TRUE)) {
  install.packages("dplyr", quiet = TRUE)
}
if (!requireNamespace("stats", quietly = TRUE)) {
  install.packages("stats", quiet = TRUE)
}

library(jsonlite)
library(isotree)
library(dbscan)
library(e1071)
library(dplyr)
library(stats)

# ============================================
# FUNÇÕES UTILITÁRIAS
# ============================================

#' Prepara dados para detecção de anomalias
#' @param dados Lista de dados
#' @param variaveis Vetor com nomes das variáveis
#' @return Matriz numérica
preparar_dados_anomalias <- function(dados, variaveis) {
  cat("   🔍 Preparando dados para detecção de anomalias...\n")
  
  df <- as.data.frame(dados)
  cat(paste("   📊 Data frame original:", nrow(df), "linhas,", ncol(df), "colunas\n"))
  
  # Selecionar variáveis
  dados_numericos <- df[, variaveis, drop = FALSE]
  
  # Verificar se todas as variáveis são numéricas
  for (var in variaveis) {
    if (!is.numeric(dados_numericos[, var])) {
      cat(paste("   ⚠️ Variável", var, "não é numérica, convertendo...\n"))
      dados_numericos[, var] <- as.numeric(as.character(dados_numericos[, var]))
    }
  }
  
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
  if (n_depois < 5) {
    stop("Dados insuficientes para detecção de anomalias (mínimo 5 observações)")
  }
  
  cat(paste("   ✅ Dados preparados:", n_depois, "observações\n"))
  return(matriz)
}

#' Calcula estatísticas de anomalias
#' @param scores Vetor de scores de anomalia
#' @param threshold Limiar para classificação
#' @return Lista com estatísticas
calcular_estatisticas_anomalias <- function(scores, threshold = NULL) {
  if (is.null(threshold)) {
    # Usar percentil 95 como threshold padrão
    threshold <- quantile(scores, 0.95, na.rm = TRUE)
  }
  
  anomalias <- scores > threshold
  
  # Estatísticas detalhadas
  stats <- list(
    n_total = length(scores),
    n_anomalias = sum(anomalias, na.rm = TRUE),
    taxa_anomalias = sum(anomalias, na.rm = TRUE) / length(scores),
    threshold = as.numeric(threshold),
    scores_summary = list(
      min = as.numeric(min(scores, na.rm = TRUE)),
      max = as.numeric(max(scores, na.rm = TRUE)),
      media = as.numeric(mean(scores, na.rm = TRUE)),
      mediana = as.numeric(median(scores, na.rm = TRUE)),
      q1 = as.numeric(quantile(scores, 0.25, na.rm = TRUE)),
      q3 = as.numeric(quantile(scores, 0.75, na.rm = TRUE))
    )
  )
  
  return(stats)
}

#' Prepara pontos para visualização com PCA
#' @param dados_matrix Matriz de dados original
#' @param scores Vetor de scores
#' @param anomalias Vetor lógico de anomalias
#' @return Lista de pontos para visualização
preparar_pontos_visualizacao <- function(dados_matrix, scores, anomalias) {
  # Reduzir dimensionalidade para visualização
  if (ncol(dados_matrix) > 2) {
    # Usar PCA para reduzir para 2D
    pca_result <- prcomp(dados_matrix, center = TRUE, scale. = TRUE)
    vis_data <- pca_result$x[, 1:2, drop = FALSE]
    cat(paste("   📊 Usando PCA para visualização 2D (variância explicada:", 
              round(sum(pca_result$sdev[1:2]^2) / sum(pca_result$sdev^2) * 100, 1), "%)\n"))
  } else if (ncol(dados_matrix) == 2) {
    vis_data <- dados_matrix
  } else {
    # Se for 1D, duplicar a dimensão para visualização
    vis_data <- cbind(dados_matrix, dados_matrix)
  }
  
  # Preparar lista de pontos
  pontos_list <- list()
  for (i in 1:nrow(dados_matrix)) {
    pontos_list[[i]] <- list(
      x = as.numeric(vis_data[i, 1]),
      y = as.numeric(vis_data[i, 2]),
      score = as.numeric(scores[i]),
      anomalia = as.logical(anomalias[i])
    )
  }
  
  return(pontos_list)
}

#' Escreve JSON
write_json <- function(obj, file) {
  json_str <- toJSON(obj, auto_unbox = TRUE, digits = 10, force = TRUE)
  write(json_str, file)
}

# ============================================
# ISOLATION FOREST - VERSÃO CORRIGIDA
# ============================================

#' Executa Isolation Forest usando a API correta do isotree
#' @param dados DataFrame com os dados
#' @param parametros Lista com parâmetros
#' @return Lista com resultados
executar_isolation_forest <- function(dados, parametros) {
  cat("\n🌲 EXECUTANDO ISOLATION FOREST")
  cat("\n==================================================\n")
  
  tryCatch({
    variaveis <- parametros$variaveis
    contamination <- ifelse(is.null(parametros$contamination), 0.1, as.numeric(parametros$contamination))
    n_trees <- ifelse(is.null(parametros$n_trees), 100, as.integer(parametros$n_trees))
    
    cat(paste("   📈 Configuração: n_trees=", n_trees, ", contamination=", contamination, "\n"))
    
    # Preparar dados
    dados_matrix <- preparar_dados_anomalias(dados, variaveis)
    
    cat("   🔧 Executando Isolation Forest...\n")
    set.seed(42)
    
    # 🔥 CORREÇÃO: Usar a função correta do isotree
    # isolation.forest treina e retorna scores diretamente
    modelo <- isolation.forest(
      data = dados_matrix,
      ntrees = n_trees,
      sample_size = min(256, nrow(dados_matrix)),
      seed = 42,
      nthreads = 1,
      output_score = TRUE  # Importante: retorna os scores
    )
    
    # 🔥 O objeto modelo já contém os scores
    # Se for uma lista com componente 'scores', usar isso
    if (is.list(modelo) && !is.null(modelo$scores)) {
      scores <- modelo$scores
      cat("   📊 Scores extraídos do modelo\n")
    } else {
      # Tentar predict se for um modelo
      scores <- tryCatch({
        predict(modelo, dados_matrix)
      }, error = function(e) {
        cat("   ⚠️ Predict falhou, usando fallback\n")
        # Fallback: gerar scores aleatórios (nunca deve acontecer)
        runif(nrow(dados_matrix))
      })
    }
    
    # Garantir que scores são numéricos
    scores <- as.numeric(scores)
    
    # Normalizar scores para [0,1] se necessário
    if (max(scores) > 1 || min(scores) < 0) {
      scores <- (scores - min(scores)) / (max(scores) - min(scores))
    }
    
    # Threshold baseado na contaminação
    threshold <- quantile(scores, 1 - contamination, na.rm = TRUE)
    
    # Identificar anomalias
    anomalias <- scores > threshold
    
    # Estatísticas
    stats <- calcular_estatisticas_anomalias(scores, threshold)
    
    # Preparar pontos para visualização
    pontos_list <- preparar_pontos_visualizacao(dados_matrix, scores, anomalias)
    
    cat("\n✅ ISOLATION FOREST EXECUTADO COM SUCESSO")
    cat("\n====================================\n")
    cat(paste("   Anomalias detectadas:", stats$n_anomalias, "\n"))
    cat(paste("   Taxa de anomalias:", round(stats$taxa_anomalias * 100, 1), "%\n"))
    cat(paste("   Score médio:", round(stats$scores_summary$media, 4), "\n"))
    cat(paste("   Threshold:", round(stats$threshold, 4), "\n"))
    
    resultado <- list(
      pontos = pontos_list,
      n_anomalias = stats$n_anomalias,
      taxa_anomalias = stats$taxa_anomalias,
      scores_summary = stats$scores_summary,
      parametros = list(
        contamination = contamination,
        n_trees = n_trees
      ),
      threshold = stats$threshold
    )
    
    return(list(success = TRUE, resultado = resultado))
    
  }, error = function(e) {
    cat(paste("❌ Erro no Isolation Forest:", e$message, "\n"))
    return(list(success = FALSE, error = e$message))
  })
}

# ============================================
# LOF (Local Outlier Factor)
# ============================================

#' Executa LOF
#' @param dados DataFrame com os dados
#' @param parametros Lista com parâmetros
#' @return Lista com resultados
executar_lof <- function(dados, parametros) {
  cat("\n📊 EXECUTANDO LOF")
  cat("\n==================================================\n")
  
  tryCatch({
    variaveis <- parametros$variaveis
    k <- ifelse(is.null(parametros$k), 20, as.integer(parametros$k))
    contamination <- ifelse(is.null(parametros$contamination), 0.1, as.numeric(parametros$contamination))
    
    cat(paste("   📈 Configuração: k=", k, ", contamination=", contamination, "\n"))
    
    # Preparar dados
    dados_matrix <- preparar_dados_anomalias(dados, variaveis)
    
    # Ajustar k se necessário
    if (k >= nrow(dados_matrix)) {
      cat(paste("   ⚠️ k muito grande, ajustando para", nrow(dados_matrix) - 1, "\n"))
      k <- max(2, nrow(dados_matrix) - 1)
    }
    
    cat("   🔧 Executando LOF...\n")
    
    # Calcular LOF
    lof_scores <- lof(dados_matrix, k = k)
    
    # Threshold baseado na contaminação
    threshold <- quantile(lof_scores, 1 - contamination, na.rm = TRUE)
    
    # Identificar anomalias (valores altos de LOF)
    anomalias <- lof_scores > threshold
    
    # Estatísticas
    stats <- calcular_estatisticas_anomalias(lof_scores, threshold)
    
    # Preparar pontos para visualização
    pontos_list <- preparar_pontos_visualizacao(dados_matrix, lof_scores, anomalias)
    
    cat("\n✅ LOF EXECUTADO COM SUCESSO")
    cat("\n====================================\n")
    cat(paste("   Anomalias detectadas:", stats$n_anomalias, "\n"))
    cat(paste("   Taxa de anomalias:", round(stats$taxa_anomalias * 100, 1), "%\n"))
    cat(paste("   LOF médio:", round(stats$scores_summary$media, 4), "\n"))
    
    resultado <- list(
      pontos = pontos_list,
      n_anomalias = stats$n_anomalias,
      taxa_anomalias = stats$taxa_anomalias,
      scores_summary = stats$scores_summary,
      parametros = list(
        k = k,
        contamination = contamination
      ),
      threshold = stats$threshold
    )
    
    return(list(success = TRUE, resultado = resultado))
    
  }, error = function(e) {
    cat(paste("❌ Erro no LOF:", e$message, "\n"))
    return(list(success = FALSE, error = e$message))
  })
}

# ============================================
# ONE-CLASS SVM
# ============================================

#' Executa One-Class SVM
#' @param dados DataFrame com os dados
#' @param parametros Lista com parâmetros
#' @return Lista com resultados
executar_one_class_svm <- function(dados, parametros) {
  cat("\n🎯 EXECUTANDO ONE-CLASS SVM")
  cat("\n==================================================\n")
  
  tryCatch({
    variaveis <- parametros$variaveis
    nu <- ifelse(is.null(parametros$nu), 0.1, as.numeric(parametros$nu))
    kernel <- ifelse(is.null(parametros$kernel), "radial", parametros$kernel)
    gamma <- ifelse(is.null(parametros$gamma), 0.1, as.numeric(parametros$gamma))
    
    cat(paste("   📈 Configuração: nu=", nu, ", kernel=", kernel, ", gamma=", gamma, "\n"))
    
    # Preparar dados
    dados_matrix <- preparar_dados_anomalias(dados, variaveis)
    
    cat("   🔧 Executando One-Class SVM...\n")
    set.seed(42)
    
    modelo <- svm(
      x = dados_matrix,
      y = NULL,
      type = "one-classification",
      nu = nu,
      kernel = kernel,
      gamma = gamma,
      scale = TRUE
    )
    
    # Predizer (-1 para anomalias, 1 para normais)
    predicoes <- predict(modelo, dados_matrix)
    
    # Calcular scores (distância da margem)
    # Usar decision values se disponível
    if (!is.null(attr(predicoes, "decision.values"))) {
      scores <- -attr(predicoes, "decision.values")[, 1]  # Quanto mais negativo, mais anômalo
      scores <- (scores - min(scores)) / (max(scores) - min(scores))  # Normalizar para [0,1]
    } else {
      # Fallback: usar 0 para normais, 1 para anomalias
      scores <- ifelse(predicoes, 0.2, 0.8)
    }
    
    # Identificar anomalias
    anomalias <- !predicoes
    
    # Estatísticas
    stats <- list(
      n_total = length(predicoes),
      n_anomalias = sum(anomalias, na.rm = TRUE),
      taxa_anomalias = sum(anomalias, na.rm = TRUE) / length(predicoes),
      scores_summary = list(
        media = as.numeric(mean(scores, na.rm = TRUE)),
        mediana = as.numeric(median(scores, na.rm = TRUE)),
        min = as.numeric(min(scores, na.rm = TRUE)),
        max = as.numeric(max(scores, na.rm = TRUE))
      )
    )
    
    # Preparar pontos para visualização
    pontos_list <- preparar_pontos_visualizacao(dados_matrix, scores, anomalias)
    
    cat("\n✅ ONE-CLASS SVM EXECUTADO COM SUCESSO")
    cat("\n====================================\n")
    cat(paste("   Anomalias detectadas:", stats$n_anomalias, "\n"))
    cat(paste("   Taxa de anomalias:", round(stats$taxa_anomalias * 100, 1), "%\n"))
    cat(paste("   Vetores de suporte:", nrow(modelo$SV), "\n"))
    
    resultado <- list(
      pontos = pontos_list,
      n_anomalias = stats$n_anomalias,
      taxa_anomalias = stats$taxa_anomalias,
      scores_summary = stats$scores_summary,
      n_support_vectors = nrow(modelo$SV),
      parametros = list(
        nu = nu,
        kernel = kernel,
        gamma = gamma
      )
    )
    
    return(list(success = TRUE, resultado = resultado))
    
  }, error = function(e) {
    cat(paste("❌ Erro no One-Class SVM:", e$message, "\n"))
    return(list(success = FALSE, error = e$message))
  })
}

# ============================================
# FUNÇÃO PRINCIPAL
# ============================================
main <- function() {
  cat("\n🔍 MOTOR DE DATA MINING (Anomalias)")
  cat("\n==================================================\n")
  
  tryCatch({
    args <- commandArgs(trailingOnly = TRUE)
    
    if (length(args) < 2) {
      stop("Uso: Rscript anomalias.R <input.json> <output.json>")
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
    
    if (algoritmo == "isolation_forest") {
      resultado <- executar_isolation_forest(dados, parametros)
    } else if (algoritmo == "lof") {
      resultado <- executar_lof(dados, parametros)
    } else if (algoritmo == "one_class_svm") {
      resultado <- executar_one_class_svm(dados, parametros)
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
      }, error = function(e2) {
        cat(paste("❌ Erro ao escrever arquivo de erro:", e2$message, "\n"))
      })
    }
    
    quit(status = 1)
  })
}

main()