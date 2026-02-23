# clustering.R - Algoritmos de clustering
# VERSÃO CORRIGIDA - COM MIRROR CONFIGURADO

# Configurar mirror do CRAN (resolver problema de instalação)
options(repos = structure(c(CRAN = "https://cloud.r-project.org/")))

# Carregar pacotes necessários
if (!requireNamespace("jsonlite", quietly = TRUE)) {
  install.packages("jsonlite", quiet = TRUE)
}
if (!requireNamespace("cluster", quietly = TRUE)) {
  install.packages("cluster", quiet = TRUE)
}
if (!requireNamespace("dplyr", quietly = TRUE)) {
  install.packages("dplyr", quiet = TRUE)
}

library(jsonlite)
library(cluster)
library(dplyr)

# ============================================
# FUNÇÕES UTILITÁRIAS
# ============================================

#' Prepara dados para análise
#' @param dados Lista de dados
#' @param variaveis Vetor com nomes das variáveis
#' @return Matriz numérica
preparar_dados_para_analise <- function(dados, variaveis) {
  cat("   🔍 Preparando dados para clustering...\n")
  
  # Converter para data frame
  df <- as.data.frame(dados)
  cat(paste("   📊 Data frame criado:", nrow(df), "linhas,", ncol(df), "colunas\n"))
  
  # Selecionar apenas as variáveis numéricas
  dados_numericos <- df[, variaveis, drop = FALSE]
  cat(paste("   📊 Variáveis selecionadas:", paste(variaveis, collapse = ", "), "\n"))
  
  # Converter para matriz numérica
  matriz <- as.matrix(dados_numericos)
  
  # Remover linhas com NA
  n_antes <- nrow(matriz)
  matriz <- matriz[complete.cases(matriz), , drop = FALSE]
  n_depois <- nrow(matriz)
  
  if (n_antes > n_depois) {
    cat(paste("   🧹 Removidas", n_antes - n_depois, "linhas com NA\n"))
  }
  
  cat(paste("   ✅ Dados preparados:", n_depois, "observações válidas\n"))
  return(matriz)
}

#' Escreve JSON para arquivo
#' @param obj Objeto a ser escrito
#' @param file Caminho do arquivo
write_json <- function(obj, file) {
  json_str <- toJSON(obj, auto_unbox = TRUE, digits = 10)
  write(json_str, file)
}

# ============================================
# FUNÇÕES DOS ALGORITMOS
# ============================================

#' Executa algoritmo K-Means
#' @param dados DataFrame com os dados
#' @param parametros Lista com parâmetros
#' @return Lista com resultados formatados
executar_kmeans <- function(dados, parametros) {
  cat("\n📊 EXECUTANDO K-MEANS CLUSTERING")
  cat("\n==================================================\n")
  
  tryCatch({
    # Extrair parâmetros
    n_clusters <- ifelse(is.null(parametros$n_clusters), 3, as.numeric(parametros$n_clusters))
    max_iter <- ifelse(is.null(parametros$max_iter), 300, as.numeric(parametros$max_iter))
    random_state <- ifelse(is.null(parametros$random_state), 42, as.numeric(parametros$random_state))
    variaveis <- parametros$variaveis
    
    cat(paste("   📈 Configuração: K-Means, n_clusters=", n_clusters, ", max_iter=", max_iter, "\n"))
    cat(paste("   📊 Variáveis selecionadas:", paste(variaveis, collapse = ", "), "\n"))
    
    # Preparar dados
    dados_matrix <- preparar_dados_para_analise(dados, variaveis)
    
    cat("   🔧 Executando algoritmo K-Means...\n")
    set.seed(random_state)
    kmeans_result <- kmeans(dados_matrix, centers = n_clusters, iter.max = max_iter)
    cat("   ✅ K-Means convergiu com sucesso\n")
    
    # Calcular silhueta
    cat("   📐 Calculando métricas de qualidade...\n")
    silhueta_valor <- 0
    if (nrow(dados_matrix) > 1 && length(unique(kmeans_result$cluster)) > 1) {
      tryCatch({
        distancia <- dist(dados_matrix)
        silhueta_obj <- silhouette(kmeans_result$cluster, distancia)
        silhueta_valor <- mean(silhueta_obj[, 3])
        cat(paste("   📊 Silhueta média calculada:", round(silhueta_valor, 4), "\n"))
      }, error = function(e) {
        cat(paste("   ⚠️ Erro ao calcular silhueta:", e$message, "\n"))
      })
    }
    
    # Calcular Davies-Bouldin
    davies_bouldin_valor <- 0
    tryCatch({
      centroides <- kmeans_result$centers
      cluster_means <- list()
      
      for (i in 1:n_clusters) {
        pontos_cluster <- dados_matrix[kmeans_result$cluster == i, , drop = FALSE]
        if (nrow(pontos_cluster) > 0) {
          dist_media <- mean(sqrt(rowSums((pontos_cluster - matrix(centroides[i, ], 
                                                                   nrow = nrow(pontos_cluster), 
                                                                   ncol = ncol(pontos_cluster), 
                                                                   byrow = TRUE))^2)))
          cluster_means[[i]] <- dist_media
        } else {
          cluster_means[[i]] <- 0
        }
      }
      
      db_sum <- 0
      for (i in 1:n_clusters) {
        max_ratio <- 0
        for (j in 1:n_clusters) {
          if (i != j) {
            dist_centroides <- sqrt(sum((centroides[i, ] - centroides[j, ])^2))
            if (dist_centroides > 0) {
              ratio <- (cluster_means[[i]] + cluster_means[[j]]) / dist_centroides
              if (ratio > max_ratio) max_ratio <- ratio
            }
          }
        }
        db_sum <- db_sum + max_ratio
      }
      davies_bouldin_valor <- db_sum / n_clusters
      cat(paste("   📊 Davies-Bouldin calculado:", round(davies_bouldin_valor, 4), "\n"))
      
    }, error = function(e) {
      cat(paste("   ⚠️ Erro ao calcular Davies-Bouldin:", e$message, "\n"))
    })
    
    # Preparar clusters
    cat("   📦 Preparando resultados...\n")
    clusters_list <- list()
    for (i in 1:n_clusters) {
      tamanho <- sum(kmeans_result$cluster == i)
      itens <- which(kmeans_result$cluster == i)
      
      clusters_list[[i]] <- list(
        tamanho = tamanho,
        itens = itens
      )
      cat(paste("   📊 Cluster", i, ":", tamanho, "elementos (", round(tamanho/nrow(dados_matrix)*100, 1), "%)\n"))
    }
    
    # Preparar centroides
    centroides_list <- list()
    for (i in 1:nrow(kmeans_result$centers)) {
      centroides_list[[i]] <- as.numeric(kmeans_result$centers[i, ])
    }
    
    cat("\n✅ K-MEANS EXECUTADO COM SUCESSO")
    cat("\n====================================\n")
    cat(paste("   Clusters formados:", n_clusters, "\n"))
    cat(paste("   Inércia total:", round(kmeans_result$tot.withinss, 2), "\n"))
    cat(paste("   Silhueta média:", round(silhueta_valor, 4), "\n"))
    
    resultado <- list(
      clusters = clusters_list,
      centroides = centroides_list,
      metricas = list(
        silhueta = silhueta_valor,
        inercia = kmeans_result$tot.withinss,
        davies_bouldin = davies_bouldin_valor
      ),
      rotulos = as.vector(kmeans_result$cluster)
    )
    
    return(list(
      success = TRUE, 
      resultado = resultado
    ))
    
  }, error = function(e) {
    cat(paste("❌ Erro no K-Means:", e$message, "\n"))
    return(list(success = FALSE, error = e$message))
  })
}

#' Executa algoritmo DBSCAN
#' @param dados DataFrame com os dados
#' @param parametros Lista com parâmetros
#' @return Lista com resultados formatados
executar_dbscan <- function(dados, parametros) {
  cat("\n🌐 EXECUTANDO DBSCAN CLUSTERING")
  cat("\n==================================================\n")
  
  tryCatch({
    # Verificar se pacote dbscan está disponível
    if (!requireNamespace("dbscan", quietly = TRUE)) {
      cat("   📦 Instalando pacote dbscan...\n")
      install.packages("dbscan", quiet = TRUE)
    }
    library(dbscan)
    
    # Extrair parâmetros
    eps <- ifelse(is.null(parametros$eps), 0.5, as.numeric(parametros$eps))
    min_samples <- ifelse(is.null(parametros$min_samples), 5, as.integer(parametros$min_samples))
    variaveis <- parametros$variaveis
    
    cat(paste("   📈 Configuração: DBSCAN, eps=", eps, ", minPts=", min_samples, "\n"))
    
    # Preparar dados
    dados_matrix <- preparar_dados_para_analise(dados, variaveis)
    
    cat("   🔧 Executando algoritmo DBSCAN...\n")
    dbscan_result <- dbscan(dados_matrix, eps = eps, minPts = min_samples)
    
    # Identificar clusters
    clusters_validos <- unique(dbscan_result$cluster[dbscan_result$cluster > 0])
    n_clusters <- length(clusters_validos)
    noise_count <- sum(dbscan_result$cluster == 0)
    
    cat(paste("   ✅ DBSCAN concluído:", n_clusters, "clusters encontrados\n"))
    cat(paste("   📊 Pontos classificados como ruído:", noise_count, "(", round(noise_count/nrow(dados_matrix)*100, 1), "%)\n"))
    
    # Preparar clusters
    clusters_list <- list()
    for (i in seq_along(clusters_validos)) {
      cluster_id <- clusters_validos[i]
      tamanho <- sum(dbscan_result$cluster == cluster_id)
      itens <- which(dbscan_result$cluster == cluster_id)
      
      clusters_list[[i]] <- list(
        tamanho = tamanho,
        itens = itens
      )
      cat(paste("   📊 Cluster", i, ":", tamanho, "elementos\n"))
    }
    
    # Adicionar cluster de ruído se existir
    if (noise_count > 0) {
      clusters_list[[length(clusters_list) + 1]] <- list(
        tamanho = noise_count,
        itens = which(dbscan_result$cluster == 0)
      )
      cat(paste("   📊 Cluster de ruído:", noise_count, "elementos\n"))
    }
    
    # Calcular métricas
    cat("   📐 Calculando métricas de qualidade...\n")
    silhueta_valor <- 0
    if (n_clusters > 1) {
      tryCatch({
        pontos_validos <- dbscan_result$cluster > 0
        if (sum(pontos_validos) > 1) {
          distancia <- dist(dados_matrix[pontos_validos, ])
          silhueta_obj <- silhouette(
            dbscan_result$cluster[pontos_validos], 
            distancia
          )
          silhueta_valor <- mean(silhueta_obj[, 3])
          cat(paste("   📊 Silhueta média (excluindo ruído):", round(silhueta_valor, 4), "\n"))
        }
      }, error = function(e) {
        cat(paste("   ⚠️ Erro ao calcular silhueta:", e$message, "\n"))
      })
    }
    
    cat("\n✅ DBSCAN EXECUTADO COM SUCESSO")
    cat("\n====================================\n")
    cat(paste("   Clusters (excluindo ruído):", n_clusters, "\n"))
    cat(paste("   Taxa de ruído:", round(noise_count/nrow(dados_matrix)*100, 1), "%\n"))
    
    resultado <- list(
      clusters = clusters_list,
      metricas = list(
        silhueta = silhueta_valor,
        n_clusters = n_clusters,
        noise_ratio = noise_count / nrow(dados_matrix)
      ),
      rotulos = as.vector(dbscan_result$cluster)
    )
    
    return(list(
      success = TRUE, 
      resultado = resultado
    ))
    
  }, error = function(e) {
    cat(paste("❌ Erro no DBSCAN:", e$message, "\n"))
    return(list(success = FALSE, error = e$message))
  })
}

#' Executa algoritmo Hierárquico
#' @param dados DataFrame com os dados
#' @param parametros Lista com parâmetros
#' @return Lista com resultados formatados
executar_hierarchical <- function(dados, parametros) {
  cat("\n🌳 EXECUTANDO CLUSTERING HIERÁRQUICO")
  cat("\n==================================================\n")
  
  tryCatch({
    # Extrair parâmetros
    method <- ifelse(is.null(parametros$method), "ward.D", parametros$method)
    distance <- ifelse(is.null(parametros$distance), "euclidean", parametros$distance)
    n_clusters <- ifelse(is.null(parametros$n_clusters), 3, as.numeric(parametros$n_clusters))
    variaveis <- parametros$variaveis
    
    cat(paste("   📈 Configuração: Hierárquico, method=", method, ", distance=", distance, ", n_clusters=", n_clusters, "\n"))
    
    # Preparar dados
    dados_matrix <- preparar_dados_para_analise(dados, variaveis)
    
    cat("   📐 Calculando matriz de distâncias...\n")
    distancia <- dist(dados_matrix, method = distance)
    
    cat("   🔧 Executando clustering hierárquico...\n")
    hc <- hclust(distancia, method = method)
    
    cat("   ✂️ Cortando dendrograma para obter clusters...\n")
    clusters <- cutree(hc, k = n_clusters)
    
    # Preparar clusters
    clusters_list <- list()
    for (i in 1:n_clusters) {
      tamanho <- sum(clusters == i)
      itens <- which(clusters == i)
      
      clusters_list[[i]] <- list(
        tamanho = tamanho,
        itens = itens
      )
      cat(paste("   📊 Cluster", i, ":", tamanho, "elementos (", round(tamanho/nrow(dados_matrix)*100, 1), "%)\n"))
    }
    
    # Calcular silhueta
    cat("   📐 Calculando métricas de qualidade...\n")
    silhueta_valor <- 0
    tryCatch({
      if (length(unique(clusters)) > 1) {
        silhueta_obj <- silhouette(clusters, distancia)
        silhueta_valor <- mean(silhueta_obj[, 3])
        cat(paste("   📊 Silhueta média:", round(silhueta_valor, 4), "\n"))
      }
    }, error = function(e) {
      cat(paste("   ⚠️ Erro ao calcular silhueta:", e$message, "\n"))
    })
    
    cat("\n✅ CLUSTERING HIERÁRQUICO EXECUTADO COM SUCESSO")
    cat("\n====================================\n")
    cat(paste("   Clusters formados:", n_clusters, "\n"))
    cat(paste("   Método de ligação:", method, "\n"))
    cat(paste("   Distância utilizada:", distance, "\n"))
    
    resultado <- list(
      clusters = clusters_list,
      metricas = list(
        silhueta = silhueta_valor,
        method = method,
        distance = distance
      ),
      rotulos = as.vector(clusters)
    )
    
    return(list(
      success = TRUE, 
      resultado = resultado
    ))
    
  }, error = function(e) {
    cat(paste("❌ Erro no Hierárquico:", e$message, "\n"))
    return(list(success = FALSE, error = e$message))
  })
}

#' Executa algoritmo GMM
#' @param dados DataFrame com os dados
#' @param parametros Lista com parâmetros
#' @return Lista com resultados formatados
executar_gmm <- function(dados, parametros) {
  cat("\n📊 EXECUTANDO GMM (Gaussian Mixture Models)")
  cat("\n==================================================\n")
  
  tryCatch({
    # Verificar se pacote mclust está disponível
    if (!requireNamespace("mclust", quietly = TRUE)) {
      cat("   📦 Instalando pacote mclust...\n")
      install.packages("mclust", quiet = TRUE)
    }
    library(mclust)
    
    # Extrair parâmetros
    n_components <- ifelse(is.null(parametros$n_components), 3, as.numeric(parametros$n_components))
    covariance_type <- ifelse(is.null(parametros$covariance_type), "full", parametros$covariance_type)
    variaveis <- parametros$variaveis
    
    cat(paste("   📈 Configuração: GMM, n_components=", n_components, ", covariance=", covariance_type, "\n"))
    
    # Preparar dados
    dados_matrix <- preparar_dados_para_analise(dados, variaveis)
    
    # Verificar se há dados suficientes
    if (nrow(dados_matrix) < n_components * 2) {
      cat("   ⚠️ Dados insuficientes para o número de componentes solicitado\n")
      cat("   🔄 Reduzindo número de componentes...\n")
      n_components <- max(2, floor(nrow(dados_matrix) / 5))
      cat(paste("   📊 Novo número de componentes:", n_components, "\n"))
    }
    
    # Mapear tipo de covariância
    model_names <- c("full" = "VVV", "diag" = "VVI", "tied" = "EEE", "spherical" = "VII")
    model_name <- ifelse(covariance_type %in% names(model_names), 
                         model_names[covariance_type], 
                         "VVV")
    
    cat(paste("   🔧 Executando GMM com modelo", model_name, "...\n"))
    set.seed(42)
    
    # Tentar com diferentes números de componentes se falhar
    gmm_result <- NULL
    tentativas <- c(n_components, n_components - 1, n_components + 1, 2)
    tentativas <- unique(tentativas[tentativas >= 2 & tentativas <= 10])
    
    for (g in tentativas) {
      cat(paste("   🔄 Tentando com", g, "componentes...\n"))
      tryCatch({
        gmm_result <- Mclust(dados_matrix, G = g, modelNames = model_name)
        if (!is.null(gmm_result$classification)) {
          cat(paste("   ✅ Sucesso com", g, "componentes\n"))
          n_components <- g
          break
        }
      }, error = function(e) {
        cat(paste("   ⚠️ Falha com", g, "componentes:", e$message, "\n"))
      })
    }
    
    # Se ainda não conseguiu, tentar com modelo mais simples
    if (is.null(gmm_result$classification)) {
      cat("   ⚠️ Tentando com modelo mais simples (VII)...\n")
      gmm_result <- Mclust(dados_matrix, G = 2, modelNames = "VII")
    }
    
    # Se ainda falhar, usar K-Means como fallback
    if (is.null(gmm_result$classification)) {
      cat("   ⚠️ GMM não convergiu, usando K-Means como fallback\n")
      set.seed(42)
      kmeans_result <- kmeans(dados_matrix, centers = min(3, nrow(dados_matrix)))
      
      clusters <- kmeans_result$cluster
      clusters_list <- list()
      for (i in 1:max(clusters)) {
        tamanho <- sum(clusters == i)
        itens <- which(clusters == i)
        clusters_list[[i]] <- list(
          tamanho = tamanho,
          itens = itens
        )
        cat(paste("   📊 Cluster (fallback)", i, ":", tamanho, "elementos\n"))
      }
      
      resultado <- list(
        clusters = clusters_list,
        centroides = split(as.data.frame(kmeans_result$centers), seq(nrow(kmeans_result$centers))),
        metricas = list(
          silhueta = 0,
          inercia = kmeans_result$tot.withinss,
          metodo = "K-Means (fallback)"
        ),
        rotulos = as.vector(clusters),
        fallback = TRUE
      )
      
      cat("\n✅ GMM (FALLBACK) EXECUTADO COM SUCESSO")
      cat("\n====================================\n")
      
      return(list(
        success = TRUE, 
        resultado = resultado
      ))
    }
    
    cat("   ✅ GMM convergiu com sucesso\n")
    
    # Preparar clusters
    clusters <- gmm_result$classification
    clusters_list <- list()
    for (i in 1:max(clusters)) {
      tamanho <- sum(clusters == i)
      itens <- which(clusters == i)
      
      clusters_list[[i]] <- list(
        tamanho = tamanho,
        itens = itens
      )
      cat(paste("   📊 Cluster", i, ":", tamanho, "elementos (", round(tamanho/nrow(dados_matrix)*100, 1), "%)\n"))
    }
    
    # Calcular silhueta
    cat("   📐 Calculando métricas de qualidade...\n")
    silhueta_valor <- 0
    tryCatch({
      if (length(unique(clusters)) > 1) {
        distancia <- dist(dados_matrix)
        silhueta_obj <- silhouette(clusters, distancia)
        silhueta_valor <- mean(silhueta_obj[, 3])
        cat(paste("   📊 Silhueta média:", round(silhueta_valor, 4), "\n"))
      }
    }, error = function(e) {})
    
    cat("\n✅ GMM EXECUTADO COM SUCESSO")
    cat("\n====================================\n")
    cat(paste("   Componentes:", n_components, "\n"))
    cat(paste("   BIC:", round(gmm_result$BIC[1], 2), "\n"))
    cat(paste("   Log-likelihood:", round(gmm_result$loglik, 2), "\n"))
    
    resultado <- list(
      clusters = clusters_list,
      metricas = list(
        silhueta = silhueta_valor,
        bic = ifelse(is.null(gmm_result$BIC), 0, gmm_result$BIC[1]),
        loglik = ifelse(is.null(gmm_result$loglik), 0, gmm_result$loglik)
      ),
      rotulos = as.vector(clusters),
      probabilidades = as.data.frame(gmm_result$z)
    )
    
    return(list(
      success = TRUE, 
      resultado = resultado
    ))
    
  }, error = function(e) {
    cat(paste("❌ Erro no GMM:", e$message, "\n"))
    
    # Fallback: tentar K-Means em caso de erro
    cat("   🔄 Usando K-Means como fallback devido a erro\n")
    tryCatch({
      set.seed(42)
      kmeans_result <- kmeans(dados_matrix, centers = min(3, nrow(dados_matrix)))
      
      clusters <- kmeans_result$cluster
      clusters_list <- list()
      for (i in 1:max(clusters)) {
        tamanho <- sum(clusters == i)
        itens <- which(clusters == i)
        clusters_list[[i]] <- list(
          tamanho = tamanho,
          itens = itens
        )
      }
      
      resultado_fallback <- list(
        clusters = clusters_list,
        centroides = split(as.data.frame(kmeans_result$centers), seq(nrow(kmeans_result$centers))),
        metricas = list(
          silhueta = 0,
          inercia = kmeans_result$tot.withinss,
          metodo = "K-Means (fallback após erro)"
        ),
        rotulos = as.vector(clusters),
        fallback = TRUE,
        erro_original = e$message
      )
      
      return(list(
        success = TRUE, 
        resultado = resultado_fallback
      ))
    }, error = function(e2) {
      return(list(success = FALSE, error = paste("GMM falhou e fallback também:", e2$message)))
    })
  })
}
# ============================================
# FUNÇÃO PRINCIPAL
# ============================================

#' Função principal chamada pelo backend
main <- function() {
  cat("\n🔍 MOTOR DE DATA MINING (Clustering)")
  cat("\n==================================================\n")
  
  tryCatch({
    # Obter argumentos da linha de comando
    args <- commandArgs(trailingOnly = TRUE)
    
    # Verificar argumentos
    if (length(args) < 2) {
      stop("Uso: Rscript clustering.R <input.json> <output.json>")
    }
    
    input_file <- args[1]
    output_file <- args[2]
    
    cat(paste("   📁 Arquivo de entrada:", input_file, "\n"))
    cat(paste("   📁 Arquivo de saída:", output_file, "\n"))
    
    # Verificar se arquivo de entrada existe
    if (!file.exists(input_file)) {
      stop(paste("Arquivo de entrada não encontrado:", input_file))
    }
    
    # Ler dados de entrada
    cat("   📂 Lendo dados de entrada...\n")
    input_data <- fromJSON(input_file)
    cat(paste("   ✅ Dados extraídos:", length(input_data$dados), "observações\n"))
    
    # Extrair dados e parâmetros
    dados <- input_data$dados
    parametros <- input_data$parametros
    
    cat("   ✅ Parâmetros extraídos\n")
    
    # Verificar qual função executar
    algoritmo <- parametros$algoritmo
    
    cat(paste("   🔧 Executando algoritmo:", algoritmo, "\n"))
    
    # Executar a função apropriada
    resultado <- NULL
    
    if (algoritmo == "kmeans") {
      resultado <- executar_kmeans(dados, parametros)
    } else if (algoritmo == "dbscan") {
      resultado <- executar_dbscan(dados, parametros)
    } else if (algoritmo == "hierarchical") {
      resultado <- executar_hierarchical(dados, parametros)
    } else if (algoritmo == "gmm") {
      resultado <- executar_gmm(dados, parametros)
    } else {
      # Tentar pela função (para compatibilidade)
      funcao <- parametros$funcao
      if (!is.null(funcao)) {
        if (funcao == "executar_kmeans") {
          resultado <- executar_kmeans(dados, parametros)
        } else if (funcao == "executar_dbscan") {
          resultado <- executar_dbscan(dados, parametros)
        } else if (funcao == "executar_hierarchical") {
          resultado <- executar_hierarchical(dados, parametros)
        } else if (funcao == "executar_gmm") {
          resultado <- executar_gmm(dados, parametros)
        } else {
          stop(paste("Função não reconhecida:", funcao))
        }
      } else {
        stop(paste("Algoritmo não reconhecido:", algoritmo))
      }
    }
    
    # Adicionar metadados
    resultado$timestamp <- format(Sys.time(), "%Y-%m-%d %H:%M:%S")
    resultado$algoritmo <- algoritmo
    
    # Escrever resultado
    cat("   💾 Escrevendo resultado...\n")
    write_json(resultado, output_file)
    
    cat("\n✅ DATA MINING EXECUTADO COM SUCESSO")
    cat("\n====================================\n")
    cat(paste("   Algoritmo:", algoritmo, "\n"))
    cat(paste("   Observações processadas:", length(dados), "\n"))
    cat(paste("   Resultado escrito em:", output_file, "\n"))
    
  }, error = function(e) {
    cat(paste("\n❌ ERRO NA EXECUÇÃO:", e$message, "\n"))
    
    # Criar resposta de erro
    erro <- list(
      success = FALSE,
      error = e$message,
      timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S")
    )
    
    # Tentar escrever erro no arquivo de saída
    if (exists("output_file")) {
      tryCatch({
        write_json(erro, output_file)
        cat("   💾 Arquivo de erro escrito\n")
      }, error = function(e2) {
        cat(paste("❌ Erro ao escrever arquivo de erro:", e2$message, "\n"))
      })
    }
    
    quit(status = 1)
  })
}

# ============================================
# EXECUÇÃO
# ============================================

# Executar função principal
main()