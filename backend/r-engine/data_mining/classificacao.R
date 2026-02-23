# classificacao.R - Algoritmos de Classificação
# Decision Tree, Random Forest, SVM, Naive Bayes, KNN
# VERSÃO CORRIGIDA

options(repos = structure(c(CRAN = "https://cloud.r-project.org/")))

# Carregar pacotes necessários
if (!requireNamespace("jsonlite", quietly = TRUE)) {
  install.packages("jsonlite", quiet = TRUE)
}
if (!requireNamespace("rpart", quietly = TRUE)) {
  install.packages("rpart", quiet = TRUE)
}
if (!requireNamespace("randomForest", quietly = TRUE)) {
  install.packages("randomForest", quiet = TRUE)
}
if (!requireNamespace("e1071", quietly = TRUE)) {
  install.packages("e1071", quiet = TRUE)
}
if (!requireNamespace("class", quietly = TRUE)) {
  install.packages("class", quiet = TRUE)  # 🔥 Para KNN
}
if (!requireNamespace("caret", quietly = TRUE)) {
  install.packages("caret", quiet = TRUE)
}
if (!requireNamespace("dplyr", quietly = TRUE)) {
  install.packages("dplyr", quiet = TRUE)
}

library(jsonlite)
library(rpart)
library(randomForest)
library(e1071)
library(class)  # 🔥 Para KNN
library(caret)
library(dplyr)

# ============================================
# FUNÇÕES UTILITÁRIAS
# ============================================

#' Converte tabela para lista (evita erro de JSON)
#' @param tabela Objeto table do R
#' @return Lista conversível para JSON
table_to_list <- function(tabela) {
  matriz <- as.matrix(tabela)
  lista <- list()
  for (i in 1:nrow(matriz)) {
    lista[[i]] <- as.numeric(matriz[i, ])
  }
  return(lista)
}

#' Prepara dados para classificação
#' @param dados Lista de dados
#' @param target Nome da variável alvo
#' @param variaveis Vetor com nomes das variáveis preditoras
#' @return Lista com dados preparados
preparar_dados_classificacao <- function(dados, target, variaveis) {
  cat("   🔍 Preparando dados para classificação...\n")
  
  df <- as.data.frame(dados)
  cat(paste("   📊 Data frame original:", nrow(df), "linhas,", ncol(df), "colunas\n"))
  
  # Separar features e target
  if (!target %in% colnames(df)) {
    stop(paste("Variável alvo", target, "não encontrada"))
  }
  
  # Features
  features <- df[, variaveis, drop = FALSE]
  
  # Target - FORÇAR COMO FATOR para classificação
  y <- as.factor(df[, target])
  
  cat(paste("   🎯 Target convertido para fator com", length(levels(y)), "classes:", 
            paste(levels(y), collapse = ", "), "\n"))
  
  # Remover linhas com NA
  complete_idx <- complete.cases(features)
  features <- features[complete_idx, , drop = FALSE]
  y <- y[complete_idx]
  
  cat(paste("   ✅ Dados preparados:", nrow(features), "observações válidas\n"))
  cat(paste("   📊 Features:", ncol(features), "variáveis\n"))
  
  return(list(
    features = features,
    target = y,
    n_obs = nrow(features),
    n_features = ncol(features),
    classes = levels(y)
  ))
}

#' Calcula métricas de classificação
#' @param real Valores reais
#' @param previsto Valores previstos
#' @return Lista com métricas
calcular_metricas <- function(real, previsto) {
  # Garantir que são fatores com mesmos níveis
  real <- as.factor(real)
  previsto <- factor(previsto, levels = levels(real))
  
  # Matriz de confusão
  cm <- table(Real = real, Previsto = previsto)
  
  # Acurácia
  acuracia <- sum(diag(cm)) / sum(cm)
  
  # Precision, Recall, F1 por classe
  n_classes <- nrow(cm)
  precision <- c()
  recall <- c()
  f1 <- c()
  
  for (i in 1:n_classes) {
    tp <- cm[i, i]
    fp <- ifelse(i <= ncol(cm), sum(cm[, i]) - tp, 0)
    fn <- sum(cm[i, ]) - tp
    
    precision[i] <- ifelse(tp + fp > 0, tp / (tp + fp), 0)
    recall[i] <- ifelse(tp + fn > 0, tp / (tp + fn), 0)
    f1[i] <- ifelse(precision[i] + recall[i] > 0, 
                    2 * precision[i] * recall[i] / (precision[i] + recall[i]), 0)
  }
  
  # Médias
  precision_media <- mean(precision, na.rm = TRUE)
  recall_media <- mean(recall, na.rm = TRUE)
  f1_media <- mean(f1, na.rm = TRUE)
  
  return(list(
    acuracia = acuracia,
    precisao = precision_media,
    recall = recall_media,
    f1 = f1_media,
    matriz_confusao = table_to_list(cm),  # 🔥 Converter para lista
    classes = rownames(cm),
    precisao_por_classe = as.numeric(precision),
    recall_por_classe = as.numeric(recall),
    f1_por_classe = as.numeric(f1)
  ))
}

#' Divide dados em treino e teste
#' @param features Matriz de features
#' @param target Vetor alvo
#' @param train_ratio Proporção para treino
#' @return Lista com dados divididos
split_train_test <- function(features, target, train_ratio = 0.7) {
  set.seed(42)
  n <- nrow(features)
  train_idx <- sample(1:n, size = floor(n * train_ratio))
  
  list(
    train = list(
      features = features[train_idx, , drop = FALSE],
      target = target[train_idx]
    ),
    test = list(
      features = features[-train_idx, , drop = FALSE],
      target = target[-train_idx]
    )
  )
}

#' Escreve JSON
write_json <- function(obj, file) {
  json_str <- toJSON(obj, auto_unbox = TRUE, digits = 10)
  write(json_str, file)
}

# ============================================
# ALGORITMOS
# ============================================

#' Executa Árvore de Decisão
executar_decision_tree <- function(dados, parametros) {
  cat("\n🌿 EXECUTANDO ÁRVORE DE DECISÃO")
  cat("\n==================================================\n")
  
  tryCatch({
    target <- parametros$target
    variaveis <- parametros$variaveis
    
    # Parâmetros
    max_depth <- ifelse(is.null(parametros$max_depth), 10, as.integer(parametros$max_depth))
    min_split <- ifelse(is.null(parametros$min_split), 20, as.integer(parametros$min_split))
    cp <- ifelse(is.null(parametros$cp), 0.01, as.numeric(parametros$cp))
    
    cat(paste("   📈 Configuração: max_depth=", max_depth, ", min_split=", min_split, ", cp=", cp, "\n"))
    
    # Preparar dados
    prepared <- preparar_dados_classificacao(dados, target, variaveis)
    
    # Dividir treino/teste
    split <- split_train_test(prepared$features, prepared$target)
    
    cat(paste("   📊 Treino:", nrow(split$train$features), "observações\n"))
    cat(paste("   📊 Teste:", nrow(split$test$features), "observações\n"))
    
    # Criar fórmula
    df_train <- cbind(split$train$features, target = split$train$target)
    formula <- as.formula("target ~ .")
    
    # Treinar modelo
    cat("   🔧 Treinando árvore de decisão...\n")
    modelo <- rpart(formula, data = df_train, 
                    control = rpart.control(
                      maxdepth = max_depth,
                      minsplit = min_split,
                      cp = cp
                    ))
    
    # Fazer predições
    previsto_treino <- predict(modelo, split$train$features, type = "class")
    previsto_teste <- predict(modelo, split$test$features, type = "class")
    
    # Calcular métricas
    metricas_treino <- calcular_metricas(split$train$target, previsto_treino)
    metricas_teste <- calcular_metricas(split$test$target, previsto_teste)
    
    # Importância das variáveis
    importancia <- modelo$variable.importance
    if (is.null(importancia)) importancia <- c()
    
    cat("\n✅ ÁRVORE DE DECISÃO EXECUTADA COM SUCESSO")
    cat("\n====================================\n")
    cat(paste("   Acurácia (treino):", round(metricas_treino$acuracia, 4), "\n"))
    cat(paste("   Acurácia (teste):", round(metricas_teste$acuracia, 4), "\n"))
    
    resultado <- list(
      metricas = list(
        treino = metricas_treino,
        teste = metricas_teste
      ),
      importancia = importancia,
      n_nos = nrow(modelo$frame),
      profundidade = max(rpart:::tree.depth(as.numeric(rownames(modelo$frame)))),
      classes = prepared$classes
    )
    
    return(list(success = TRUE, resultado = resultado))
    
  }, error = function(e) {
    cat(paste("❌ Erro:", e$message, "\n"))
    return(list(success = FALSE, error = e$message))
  })
}

#' Executa Random Forest
executar_random_forest <- function(dados, parametros) {
  cat("\n🌲 EXECUTANDO RANDOM FOREST")
  cat("\n==================================================\n")
  
  tryCatch({
    target <- parametros$target
    variaveis <- parametros$variaveis
    
    # Parâmetros
    n_trees <- ifelse(is.null(parametros$n_trees), 100, as.integer(parametros$n_trees))
    mtry <- ifelse(is.null(parametros$mtry), floor(sqrt(length(variaveis))), as.integer(parametros$mtry))
    
    cat(paste("   📈 Configuração: n_trees=", n_trees, ", mtry=", mtry, "\n"))
    
    prepared <- preparar_dados_classificacao(dados, target, variaveis)
    split <- split_train_test(prepared$features, prepared$target)
    
    df_train <- cbind(split$train$features, target = split$train$target)
    
    cat("   🔧 Treinando Random Forest...\n")
    set.seed(42)
    modelo <- randomForest(
      formula = as.formula("target ~ ."),
      data = df_train,
      ntree = n_trees,
      mtry = mtry,
      importance = TRUE
    )
    
    previsto_treino <- predict(modelo, split$train$features)
    previsto_teste <- predict(modelo, split$test$features)
    
    metricas_treino <- calcular_metricas(split$train$target, previsto_treino)
    metricas_teste <- calcular_metricas(split$test$target, previsto_teste)
    
    importancia <- importance(modelo)
    
    # Converter importância para lista
    importancia_list <- list()
    if (!is.null(importancia)) {
      for (i in 1:nrow(importancia)) {
        nome <- rownames(importancia)[i]
        importancia_list[[nome]] <- as.numeric(importancia[i, 1])
      }
    }
    
    cat("\n✅ RANDOM FOREST EXECUTADO COM SUCESSO")
    cat("\n====================================\n")
    cat(paste("   Acurácia (treino):", round(metricas_treino$acuracia, 4), "\n"))
    cat(paste("   Acurácia (teste):", round(metricas_teste$acuracia, 4), "\n"))
    cat(paste("   OOB Error:", round(modelo$err.rate[nrow(modelo$err.rate), 1], 4), "\n"))
    
    resultado <- list(
      metricas = list(
        treino = metricas_treino,
        teste = metricas_teste
      ),
      importancia = importancia_list,
      oob_error = modelo$err.rate[nrow(modelo$err.rate), 1],
      n_trees = n_trees,
      classes = prepared$classes
    )
    
    return(list(success = TRUE, resultado = resultado))
    
  }, error = function(e) {
    cat(paste("❌ Erro:", e$message, "\n"))
    return(list(success = FALSE, error = e$message))
  })
}

#' Executa SVM
executar_svm <- function(dados, parametros) {
  cat("\n🎯 EXECUTANDO SVM")
  cat("\n==================================================\n")
  
  tryCatch({
    target <- parametros$target
    variaveis <- parametros$variaveis
    
    # Parâmetros
    kernel <- ifelse(is.null(parametros$kernel), "radial", parametros$kernel)
    cost <- ifelse(is.null(parametros$cost), 1, as.numeric(parametros$cost))
    gamma <- ifelse(is.null(parametros$gamma), 0.1, as.numeric(parametros$gamma))
    
    cat(paste("   📈 Configuração: kernel=", kernel, ", cost=", cost, ", gamma=", gamma, "\n"))
    
    prepared <- preparar_dados_classificacao(dados, target, variaveis)
    split <- split_train_test(prepared$features, prepared$target)
    
    df_train <- cbind(split$train$features, target = split$train$target)
    
    cat("   🔧 Treinando SVM...\n")
    set.seed(42)
    modelo <- svm(
      formula = as.formula("target ~ ."),
      data = df_train,
      kernel = kernel,
      cost = cost,
      gamma = gamma,
      probability = TRUE
    )
    
    previsto_treino <- predict(modelo, split$train$features)
    previsto_teste <- predict(modelo, split$test$features)
    
    metricas_treino <- calcular_metricas(split$train$target, previsto_treino)
    metricas_teste <- calcular_metricas(split$test$target, previsto_teste)
    
    cat("\n✅ SVM EXECUTADO COM SUCESSO")
    cat("\n====================================\n")
    cat(paste("   Acurácia (treino):", round(metricas_treino$acuracia, 4), "\n"))
    cat(paste("   Acurácia (teste):", round(metricas_teste$acuracia, 4), "\n"))
    
    resultado <- list(
      metricas = list(
        treino = metricas_treino,
        teste = metricas_teste
      ),
      n_support_vectors = nrow(modelo$SV),
      classes = prepared$classes
    )
    
    return(list(success = TRUE, resultado = resultado))
    
  }, error = function(e) {
    cat(paste("❌ Erro:", e$message, "\n"))
    return(list(success = FALSE, error = e$message))
  })
}

#' Executa Naive Bayes
executar_naive_bayes <- function(dados, parametros) {
  cat("\n📈 EXECUTANDO NAIVE BAYES")
  cat("\n==================================================\n")
  
  tryCatch({
    target <- parametros$target
    variaveis <- parametros$variaveis
    
    cat("   📈 Configuração: Naive Bayes\n")
    
    prepared <- preparar_dados_classificacao(dados, target, variaveis)
    split <- split_train_test(prepared$features, prepared$target)
    
    df_train <- cbind(split$train$features, target = split$train$target)
    
    cat("   🔧 Treinando Naive Bayes...\n")
    set.seed(42)
    modelo <- naiveBayes(
      formula = as.formula("target ~ ."),
      data = df_train
    )
    
    previsto_treino <- predict(modelo, split$train$features)
    previsto_teste <- predict(modelo, split$test$features)
    
    metricas_treino <- calcular_metricas(split$train$target, previsto_treino)
    metricas_teste <- calcular_metricas(split$test$target, previsto_teste)
    
    cat("\n✅ NAIVE BAYES EXECUTADO COM SUCESSO")
    cat("\n====================================\n")
    cat(paste("   Acurácia (treino):", round(metricas_treino$acuracia, 4), "\n"))
    cat(paste("   Acurácia (teste):", round(metricas_teste$acuracia, 4), "\n"))
    
    resultado <- list(
      metricas = list(
        treino = metricas_treino,
        teste = metricas_teste
      ),
      classes = prepared$classes
    )
    
    return(list(success = TRUE, resultado = resultado))
    
  }, error = function(e) {
    cat(paste("❌ Erro:", e$message, "\n"))
    return(list(success = FALSE, error = e$message))
  })
}

#' Executa KNN
executar_knn <- function(dados, parametros) {
  cat("\n👥 EXECUTANDO KNN")
  cat("\n==================================================\n")
  
  tryCatch({
    target <- parametros$target
    variaveis <- parametros$variaveis
    
    # Parâmetros
    k <- ifelse(is.null(parametros$k), 5, as.integer(parametros$k))
    
    cat(paste("   📈 Configuração: k=", k, "\n"))
    
    prepared <- preparar_dados_classificacao(dados, target, variaveis)
    split <- split_train_test(prepared$features, prepared$target)
    
    cat("   🔧 Executando KNN...\n")
    set.seed(42)
    
    # Treinar e testar
    previsto_treino <- knn(
      train = split$train$features,
      test = split$train$features,
      cl = split$train$target,
      k = k
    )
    
    previsto_teste <- knn(
      train = split$train$features,
      test = split$test$features,
      cl = split$train$target,
      k = k
    )
    
    metricas_treino <- calcular_metricas(split$train$target, previsto_treino)
    metricas_teste <- calcular_metricas(split$test$target, previsto_teste)
    
    cat("\n✅ KNN EXECUTADO COM SUCESSO")
    cat("\n====================================\n")
    cat(paste("   Acurácia (treino):", round(metricas_treino$acuracia, 4), "\n"))
    cat(paste("   Acurácia (teste):", round(metricas_teste$acuracia, 4), "\n"))
    
    resultado <- list(
      metricas = list(
        treino = metricas_treino,
        teste = metricas_teste
      ),
      k = k,
      classes = prepared$classes
    )
    
    return(list(success = TRUE, resultado = resultado))
    
  }, error = function(e) {
    cat(paste("❌ Erro:", e$message, "\n"))
    return(list(success = FALSE, error = e$message))
  })
}

# ============================================
# FUNÇÃO PRINCIPAL
# ============================================
main <- function() {
  cat("\n🔍 MOTOR DE DATA MINING (Classificação)")
  cat("\n==================================================\n")
  
  tryCatch({
    args <- commandArgs(trailingOnly = TRUE)
    
    if (length(args) < 2) {
      stop("Uso: Rscript classificacao.R <input.json> <output.json>")
    }
    
    input_file <- args[1]
    output_file <- args[2]
    
    cat(paste("   📁 Arquivo de entrada:", input_file, "\n"))
    cat(paste("   📁 Arquivo de saída:", output_file, "\n"))
    
    input_data <- fromJSON(input_file)
    
    dados <- input_data$dados
    parametros <- input_data$parametros
    algoritmo <- parametros$algoritmo
    
    cat(paste("   🔧 Executando algoritmo:", algoritmo, "\n"))
    
    resultado <- NULL
    
    if (algoritmo == "decision_tree") {
      resultado <- executar_decision_tree(dados, parametros)
    } else if (algoritmo == "random_forest") {
      resultado <- executar_random_forest(dados, parametros)
    } else if (algoritmo == "svm") {
      resultado <- executar_svm(dados, parametros)
    } else if (algoritmo == "naive_bayes") {
      resultado <- executar_naive_bayes(dados, parametros)
    } else if (algoritmo == "knn") {
      resultado <- executar_knn(dados, parametros)
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