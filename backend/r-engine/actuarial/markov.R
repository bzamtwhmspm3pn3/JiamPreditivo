#!/usr/bin/env Rscript

library(jsonlite)
library(dplyr)
library(markovchain)

main <- function() {
  args <- commandArgs(trailingOnly = TRUE)
  
  if (length(args) < 2) {
    stop("Uso: Rscript markov.R <input_file> <output_file>")
  }
  
  input_file <- args[1]
  output_file <- args[2]
  
  cat("📊 Executando análise de Cadeias de Markov...\n")
  
  tryCatch({
    # Ler dados de entrada
    dados_json <- fromJSON(input_file)
    dados <- dados_json$dados
    parametros <- dados_json$parametros
    
    cat("   Registros:", nrow(dados), "\n")
    cat("   Tipo: Análise de Markov\n")
    
    # Converter para data.frame
    df <- as.data.frame(dados)
    
    # Extrair parâmetros
    var_analise <- if(!is.null(parametros$var_analise)) parametros$var_analise else names(df)[1]
    n_estados <- if(!is.null(parametros$n_estados)) as.numeric(parametros$n_estados) else 3
    
    # 🔥 CORREÇÃO AQUI: nomes_estados pode vir como string ou array
    nomes_estados <- if(!is.null(parametros$nomes_estados)) {
      if(is.character(parametros$nomes_estados) && length(parametros$nomes_estados) == 1) {
        # Se for string única, fazer split
        strsplit(parametros$nomes_estados, ",")[[1]]
      } else {
        # Se já for array, usar diretamente
        as.character(parametros$nomes_estados)
      }
    } else {
      c("Baixo", "Médio", "Alto")
    }
    
    # Garantir que temos o número correto de nomes
    if(length(nomes_estados) < n_estados) {
      nomes_estados <- c(nomes_estados, paste0("Estado", (length(nomes_estados)+1):n_estados))
    } else if(length(nomes_estados) > n_estados) {
      nomes_estados <- nomes_estados[1:n_estados]
    }
    
    metodo <- if(!is.null(parametros$metodo)) parametros$metodo else "MLE"
    
    cat("   Variável de análise:", var_analise, "\n")
    cat("   Número de estados:", n_estados, "\n")
    cat("   Nomes estados:", paste(nomes_estados, collapse = ", "), "\n")
    cat("   Método:", metodo, "\n")
    
    # Verificar se variável existe
    if (!var_analise %in% names(df)) {
      stop(paste("Variável", var_analise, "não encontrada"))
    }
    
    # Converter para numérico
    df[[var_analise]] <- as.numeric(as.character(df[[var_analise]]))
    
    # Remover NAs
    df_clean <- df[!is.na(df[[var_analise]]), , drop = FALSE]
    
    if (nrow(df_clean) < 20) {
      stop("Mínimo 20 observações necessárias para análise de Markov")
    }
    
    cat("   Dados limpos:", nrow(df_clean), "observações\n")
    cat("   Valor médio:", round(mean(df_clean[[var_analise]]), 2), "\n")
    cat("   Desvio padrão:", round(sd(df_clean[[var_analise]]), 2), "\n")
    
    # Criar estados
    cat("   ⚙️  Discretizando em estados...\n")
    
    # Determinar cortes
    if (n_estados == 2) {
      breaks <- quantile(df_clean[[var_analise]], probs = c(0, 0.5, 1), na.rm = TRUE)
    } else if (n_estados == 3) {
      breaks <- quantile(df_clean[[var_analise]], probs = c(0, 0.33, 0.67, 1), na.rm = TRUE)
    } else if (n_estados == 4) {
      breaks <- quantile(df_clean[[var_analise]], probs = c(0, 0.25, 0.5, 0.75, 1), na.rm = TRUE)
    } else {
      breaks <- quantile(df_clean[[var_analise]], 
                        probs = seq(0, 1, length.out = n_estados + 1), 
                        na.rm = TRUE)
    }
    
    # Garantir que breaks são únicos
    breaks <- unique(breaks)
    if (length(breaks) < 3) {
      breaks <- seq(min(df_clean[[var_analise]]), 
                   max(df_clean[[var_analise]]), 
                   length.out = n_estados + 1)
    }
    
    # Criar estados
    df_clean$estado <- cut(df_clean[[var_analise]], 
                          breaks = breaks, 
                          labels = nomes_estados[1:(length(breaks)-1)],
                          include.lowest = TRUE)
    
    cat("   Distribuição inicial:\n")
    tab_estados <- table(df_clean$estado)
    for (estado in names(tab_estados)) {
      cat(sprintf("     %s: %d (%.1f%%)\n", 
                  estado, 
                  tab_estados[estado],
                  tab_estados[estado]/sum(tab_estados)*100))
    }
    
    # Criar sequência de estados
    estados_seq <- as.character(df_clean$estado)
    
    # Verificar se há transições suficientes
    if (length(estados_seq) < 10) {
      stop("Sequência de estados muito curta")
    }
    
    # Criar matriz de transição manualmente
    cat("   📈 Calculando matriz de transição...\n")
    
    n_estados <- length(nomes_estados)
    trans_matrix <- matrix(0, nrow = n_estados, ncol = n_estados,
                          dimnames = list(nomes_estados, nomes_estados))
    
    for (i in 1:(length(estados_seq) - 1)) {
      from <- estados_seq[i]
      to <- estados_seq[i + 1]
      trans_matrix[from, to] <- trans_matrix[from, to] + 1
    }
    
    # Normalizar
    row_sums <- rowSums(trans_matrix)
    row_sums[row_sums == 0] <- 1  # Evitar divisão por zero
    trans_matrix_norm <- trans_matrix / row_sums
    
    # Calcular distribuição estacionária
    cat("   🧮 Calculando distribuição estacionária...\n")
    
    eigen_result <- eigen(t(trans_matrix_norm))
    
    # Encontrar autovetor associado ao autovalor 1 (ou próximo)
    idx <- which.min(abs(eigen_result$values - 1))
    stat_dist <- abs(Re(eigen_result$vectors[, idx]))
    stat_dist <- stat_dist / sum(stat_dist)
    names(stat_dist) <- nomes_estados
    
    # Calcular probabilidades de primeira passagem
    cat("   🔄 Calculando probabilidades de primeira passagem...\n")
    
    first_passage <- matrix(NA, nrow = n_estados, ncol = n_estados,
                           dimnames = list(nomes_estados, nomes_estados))
    
    for (i in 1:n_estados) {
      for (j in 1:n_estados) {
        if (i == j) {
          first_passage[i, j] <- 1 / stat_dist[i]
        } else {
          # Aproximação simples (em produção usar fórmula exata)
          first_passage[i, j] <- 1 / trans_matrix_norm[i, j] * sum(stat_dist)
        }
      }
    }
    
    # Calcular classificações por período
    periodos <- list(
      ultimo_ano = tail(estados_seq, 12),
      ultimos_6_meses = tail(estados_seq, 6),
      ultimo_trimestre = tail(estados_seq, 3)
    )
    
    # 🔥 CORREÇÃO: Converter tabelas para listas antes de salvar
    tabela_ultimo_ano <- as.list(table(periodos$ultimo_ano))
    tabela_ultimos_6_meses <- as.list(table(periodos$ultimos_6_meses))
    tabela_ultimo_trimestre <- as.list(table(periodos$ultimo_trimestre))
    
    # Calcular tendência com segurança
    tendencia <- 0
    if(length(estados_seq) >= 3) {
      estados_numericos <- as.numeric(factor(estados_seq, levels = nomes_estados))
      if(length(unique(estados_numericos)) > 1) {
        modelo_tendencia <- tryCatch({
          lm(estados_numericos ~ seq_along(estados_numericos))
        }, error = function(e) NULL)
        if(!is.null(modelo_tendencia)) {
          tendencia <- coef(modelo_tendencia)[2]
        }
      }
    }
    
    # Preparar resultado
    resultado <- list(
      success = TRUE,
      tipo = "markov_chain",
      parametros = list(
        var_analise = var_analise,
        n_estados = n_estados,
        nomes_estados = nomes_estados,
        metodo = metodo,
        n_observacoes = nrow(df_clean)
      ),
      dados_classificados = list(
        estados = estados_seq,
        valores = df_clean[[var_analise]],
        breaks = as.numeric(breaks),
        n_por_estado = as.list(tab_estados)
      ),
      matriz_transicao = list(
        contagem = as.data.frame(as.table(trans_matrix)),
        normalizada = as.data.frame(as.table(trans_matrix_norm))
      ),
      distribuicao_estacionaria = as.list(round(stat_dist, 4)),
      metricas = list(
        estabilidade = round(max(abs(eigen_result$values[-idx])), 4),
        entropia = -sum(stat_dist * log(stat_dist + 1e-10)),
        convergencia_estimada = round(1 / min(stat_dist[stat_dist > 0], na.rm = TRUE), 0)
      ),
      probabilidades_primeira_passagem = as.data.frame(as.table(first_passage)),
      analise_temporal = list(
        ultimo_ano = tabela_ultimo_ano,
        ultimos_6_meses = tabela_ultimos_6_meses,
        ultimo_trimestre = tabela_ultimo_trimestre,
        tendencia = tendencia
      ),
      interpretacao = list(
        estado_mais_provavel = names(which.max(stat_dist)),
        estabilidade_sistema = max(abs(eigen_result$values[-idx])) < 0.9,
        recomendacao_tarifacao = if(stat_dist["Alto"] > 0.3) "Aumentar prêmios" else "Estável"
      )
    )
    
    # Salvar resultado
    write_json(resultado, output_file, auto_unbox = TRUE, pretty = TRUE, digits = NA)
    
    cat("\n✅ Análise de Markov concluída com sucesso!\n")
    cat("   Distribuição estacionária:\n")
    for (estado in nomes_estados) {
      cat(sprintf("     %s: %.1f%%\n", estado, stat_dist[estado] * 100))
    }
    cat("   Estado mais provável:", names(which.max(stat_dist)), "\n")
    
  }, error = function(e) {
    cat("❌ Erro na análise de Markov:", e$message, "\n")
    
    resultado <- list(
      success = FALSE,
      error = e$message,
      tipo = "markov_chain",
      recomendacoes = c(
        "Verifique se a variável de análise tem variação suficiente",
        "Aumente o número de observações (mínimo 20)",
        "Considere reduzir o número de estados"
      )
    )
    
    write_json(resultado, output_file, auto_unbox = TRUE, pretty = TRUE)
  })
}

main()