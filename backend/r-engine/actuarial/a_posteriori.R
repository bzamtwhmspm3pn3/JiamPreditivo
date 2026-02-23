#!/usr/bin/env Rscript

library(jsonlite)
library(dplyr)
library(tidyr)
library(stats)

# ============================================
# FUNÇÃO PARA CONVERTER TABELAS PARA JSON
# ============================================
toJSON_safe <- function(x, ...) {
  # Se for table, converter para data frame primeiro
  if (inherits(x, "table")) {
    x <- as.data.frame(x, stringsAsFactors = FALSE)
  }
  # Se for matrix, converter para data frame
  if (is.matrix(x)) {
    x <- as.data.frame(x)
  }
  # Usar toJSON padrão
  return(toJSON(x, auto_unbox = TRUE, ...))
}

# ============================================
# FUNÇÕES AUXILIARES
# ============================================

`%||%` <- function(x, y) if (is.null(x)) y else x

limpar_nomes_variaveis <- function(nomes) {
  if (is.null(nomes)) return(character(0))
  nomes <- gsub('[\"\']', '', nomes)
  nomes <- trimws(nomes)
  return(make.names(nomes))
}

# ============================================
# FUNÇÕES DE CREDIBILIDADE
# ============================================

calcular_estatisticas_grupo <- function(dados, grupo_var, tempo_var, sinistro_var, custo_var) {
  cat("   📊 Calculando estatísticas por grupo...\n")
  
  cols_necessarias <- c(grupo_var, tempo_var, sinistro_var, custo_var)
  missing_cols <- setdiff(cols_necessarias, names(dados))
  
  if (length(missing_cols) > 0) {
    stop(paste("Colunas faltando:", paste(missing_cols, collapse = ", ")))
  }
  
  dados_converted <- dados %>%
    mutate(
      !!sym(grupo_var) := as.character(!!sym(grupo_var)),
      !!sym(tempo_var) := as.numeric(as.character(!!sym(tempo_var))),
      !!sym(sinistro_var) := as.numeric(as.character(!!sym(sinistro_var))),
      !!sym(custo_var) := as.numeric(as.character(!!sym(custo_var)))
    )
  
  dados_clean <- na.omit(dados_converted[cols_necessarias])
  
  if (nrow(dados_clean) == 0) {
    stop("Nenhum dado válido após limpeza")
  }
  
  cat(sprintf("   ✅ Dados limpos: %d observações\n", nrow(dados_clean)))
  
  estatisticas <- dados_clean %>%
    group_by(!!sym(grupo_var), !!sym(tempo_var)) %>%
    summarise(
      n_sinistros = sum(!!sym(sinistro_var), na.rm = TRUE),
      custo_total = sum(!!sym(custo_var), na.rm = TRUE),
      .groups = 'drop'
    ) %>%
    mutate(
      severidade = ifelse(n_sinistros > 0, custo_total / n_sinistros, 0),
      frequencia = n_sinistros,
      premio_empirico = frequencia * severidade
    )
  
  cat(sprintf("   📈 Estatísticas calculadas para %d grupos\n", 
              length(unique(estatisticas[[grupo_var]]))))
  
  return(estatisticas)
}

aplicar_buhlmann_straub_cientifico <- function(estatisticas, grupo_var) {
  grupos <- unique(estatisticas[[grupo_var]])
  
  cat("   🔧 Aplicando método Bühlmann-Straub...\n")
  
  estat_grupo <- estatisticas %>%
    group_by(!!sym(grupo_var)) %>%
    summarise(
      n_anos = n(),
      peso_total = sum(n_sinistros, na.rm = TRUE),
      media_ponderada = ifelse(peso_total > 0, 
                               sum(premio_empirico * n_sinistros) / peso_total, 
                               0),
      .groups = 'drop'
    )
  
  estat_grupo <- estat_grupo %>% filter(peso_total > 0)
  
  if (nrow(estat_grupo) < 2) {
    stop("Dados insuficientes para Bühlmann-Straub (mínimo 2 grupos com exposição)")
  }
  
  var_dentro <- estatisticas %>%
    left_join(estat_grupo %>% select(!!sym(grupo_var), media_ponderada), 
              by = grupo_var) %>%
    group_by(!!sym(grupo_var)) %>%
    summarise(
      var_grupo = sum(n_sinistros * (premio_empirico - first(media_ponderada))^2) / 
                  (sum(n_sinistros) - 1),
      .groups = 'drop'
    ) %>%
    summarise(var_dentro_media = mean(var_grupo, na.rm = TRUE)) %>%
    pull(var_dentro_media)
  
  peso_total_global <- sum(estat_grupo$peso_total)
  media_global_ponderada <- sum(estat_grupo$media_ponderada * estat_grupo$peso_total) / 
                           peso_total_global
  
  numerador <- sum(estat_grupo$peso_total * 
                   (estat_grupo$media_ponderada - media_global_ponderada)^2)
  denom <- peso_total_global - sum(estat_grupo$peso_total^2) / peso_total_global
  
  if (denom > 0) {
    var_entre <- max(0, (numerador - (nrow(estat_grupo) - 1) * var_dentro) / denom)
  } else {
    var_entre <- 0
  }
  
  estat_grupo$fator_credibilidade <- if (var_entre > 0) {
    estat_grupo$peso_total / (estat_grupo$peso_total + var_dentro / var_entre)
  } else {
    rep(0, nrow(estat_grupo))
  }
  
  estat_grupo$fator_credibilidade <- pmin(pmax(estat_grupo$fator_credibilidade, 0), 1)
  
  return(list(
    estat_grupo = estat_grupo,
    media_global = media_global_ponderada,
    var_entre = var_entre,
    var_dentro = var_dentro,
    n_grupos = nrow(estat_grupo)
  ))
}

aplicar_buhlmann_simplificado <- function(estatisticas, grupo_var) {
  grupos <- unique(estatisticas[[grupo_var]])
  
  cat("   🔧 Aplicando método Bühlmann simplificado...\n")
  
  estat_grupo <- estatisticas %>%
    group_by(!!sym(grupo_var)) %>%
    summarise(
      n_anos = n(),
      media_premio = mean(premio_empirico, na.rm = TRUE),
      var_grupo = var(premio_empirico, na.rm = TRUE),
      .groups = 'drop'
    )
  
  if (nrow(estat_grupo) < 2) {
    stop("Dados insuficientes para Bühlmann (mínimo 2 grupos)")
  }
  
  media_global <- mean(estat_grupo$media_premio, na.rm = TRUE)
  var_entre <- var(estat_grupo$media_premio, na.rm = TRUE)
  var_dentro <- mean(estat_grupo$var_grupo / estat_grupo$n_anos, na.rm = TRUE)
  
  estat_grupo$fator_credibilidade <- if (var_entre > 0) {
    estat_grupo$n_anos / (estat_grupo$n_anos + var_dentro / var_entre)
  } else {
    rep(0, nrow(estat_grupo))
  }
  
  estat_grupo$fator_credibilidade <- pmin(pmax(estat_grupo$fator_credibilidade, 0), 1)
  
  return(list(
    estat_grupo = estat_grupo,
    media_global = media_global,
    var_entre = var_entre,
    var_dentro = var_dentro,
    n_grupos = nrow(estat_grupo)
  ))
}

calcular_premios_posteriori <- function(metodo_resultados, estatisticas, grupo_var, 
                                       z_min = 0.3, z_max = 0.9) {
  
  if ("estat_grupo" %in% names(metodo_resultados)) {
    dados_cred <- metodo_resultados$estat_grupo
    media_global <- metodo_resultados$media_global
  } else {
    stop("Resultados do método de credibilidade mal formatados")
  }
  
  dados_cred$fator_credibilidade_ajustado <- pmin(
    pmax(dados_cred$fator_credibilidade, z_min), 
    z_max
  )
  
  estat_grupo <- estatisticas %>%
    group_by(!!sym(grupo_var)) %>%
    summarise(
      frequencia_media = mean(frequencia, na.rm = TRUE),
      severidade_media = mean(severidade[severidade > 0], na.rm = TRUE),
      premio_empirico_medio = mean(premio_empirico, na.rm = TRUE),
      n_anos = n(),
      n_sinistros_total = sum(n_sinistros, na.rm = TRUE),
      .groups = 'drop'
    )
  
  premios <- dados_cred %>%
    select(grupo = !!sym(grupo_var), fator_credibilidade = fator_credibilidade_ajustado) %>%
    left_join(estat_grupo, by = c("grupo" = grupo_var)) %>%
    mutate(
      premio_posteriori = fator_credibilidade * premio_empirico_medio + 
                         (1 - fator_credibilidade) * media_global,
      ajuste_percentual = (premio_posteriori / media_global - 1) * 100,
      ajuste_absoluto = premio_posteriori - media_global
    ) %>%
    arrange(desc(abs(ajuste_percentual)))
  
  return(list(
    premios = premios,
    media_global = media_global,
    credibilidade_media = mean(premios$fator_credibilidade, na.rm = TRUE)
  ))
}

validar_dados_credibilidade <- function(dados, parametros) {
  cat("   🔍 Validando dados para credibilidade...\n")
  
  obrigatorios <- c("grupo_var", "tempo_var", "sinistro_var", "custo_var")
  missing_params <- setdiff(obrigatorios, names(parametros))
  
  if (length(missing_params) > 0) {
    stop(paste("Parâmetros faltando:", paste(missing_params, collapse = ", ")))
  }
  
  cols_necessarias <- c(
    parametros$grupo_var,
    parametros$tempo_var,
    parametros$sinistro_var,
    parametros$custo_var
  )
  
  missing_cols <- setdiff(cols_necessarias, names(dados))
  
  if (length(missing_cols) > 0) {
    stop(paste("Colunas faltando nos dados:", paste(missing_cols, collapse = ", ")))
  }
  
  n_grupos <- length(unique(dados[[parametros$grupo_var]]))
  n_periodos <- length(unique(dados[[parametros$tempo_var]]))
  
  if (n_grupos < 2) {
    warning("⚠️ Apenas 1 grupo encontrado - credibilidade limitada")
  }
  
  if (n_periodos < 2) {
    warning("⚠️ Apenas 1 período encontrado - usar método simplificado")
  }
  
  return(list(
    n_grupos = n_grupos,
    n_periodos = n_periodos,
    n_observacoes = nrow(dados),
    valido = n_grupos >= 1 && n_periodos >= 1
  ))
}

# ============================================
# FUNÇÃO PRINCIPAL
# ============================================

main <- function() {
  args <- commandArgs(trailingOnly = TRUE)
  
  if (length(args) < 2) {
    stop("Uso: Rscript a_posteriori.R <input_file> <output_file>")
  }
  
  input_file <- args[1]
  output_file <- args[2]
  
  cat("📊 MOTOR DE CREDIBILIDADE ACTUARIAL (A Posteriori)\n")
  cat("==================================================\n")
  
  tryCatch({
    dados_json <- fromJSON(input_file)
    
    cat("   📁 Arquivo de entrada lido\n")
    
    if ("dados" %in% names(dados_json)) {
      dados <- as.data.frame(dados_json$dados)
      cat(sprintf("   ✅ Dados extraídos: %d observações\n", nrow(dados)))
    } else {
      stop("❌ Estrutura inválida: campo 'dados' não encontrado")
    }
    
    if ("parametros" %in% names(dados_json)) {
      parametros <- dados_json$parametros
      cat("   ✅ Parâmetros extraídos\n")
    } else {
      stop("❌ Estrutura inválida: campo 'parametros' não encontrado")
    }
    
    metodo <- parametros$metodo %||% "Bühlmann-Straub"
    grupo_var <- parametros$grupo_var %||% "grupo"
    tempo_var <- parametros$tempo_var %||% "ano"
    sinistro_var <- parametros$sinistro_var %||% "n_sinistros"
    custo_var <- parametros$custo_var %||% "custo_total"
    z_min <- as.numeric(parametros$z_min %||% 0.3)
    z_max <- as.numeric(parametros$z_max %||% 0.9)
    
    cat(sprintf("   📈 Configuração: %s, grupo=%s, tempo=%s\n", 
                metodo, grupo_var, tempo_var))
    
    validacao <- validar_dados_credibilidade(dados, parametros)
    
    if (!validacao$valido) {
      warning("⚠️ Dados podem não ser adequados para análise de credibilidade")
    }
    
    estatisticas <- calcular_estatisticas_grupo(
      dados, grupo_var, tempo_var, sinistro_var, custo_var
    )
    
    cat(sprintf("   🔧 Aplicando método %s...\n", metodo))
    
    if (metodo %in% c("Bühlmann-Straub", "Bühlmann-Straub (com peso)")) {
      resultados_metodo <- aplicar_buhlmann_straub_cientifico(estatisticas, grupo_var)
    } else if (metodo %in% c("Bühlmann", "Bühlmann (simples)")) {
      resultados_metodo <- aplicar_buhlmann_simplificado(estatisticas, grupo_var)
    } else {
      warning(sprintf("Método '%s' não reconhecido, usando Bühlmann-Straub", metodo))
      resultados_metodo <- aplicar_buhlmann_straub_cientifico(estatisticas, grupo_var)
    }
    
    premios_resultado <- calcular_premios_posteriori(
      resultados_metodo, estatisticas, grupo_var, z_min, z_max
    )
    
    estat_finais <- list(
      premio_global_priori = round(premios_resultado$media_global, 2),
      premio_medio_posteriori = round(mean(premios_resultado$premios$premio_posteriori, na.rm = TRUE), 2),
      credibilidade_media = round(premios_resultado$credibilidade_media, 3),
      ajuste_medio_percentual = round(mean(premios_resultado$premios$ajuste_percentual, na.rm = TRUE), 1),
      desvio_ajustes = round(sd(premios_resultado$premios$ajuste_percentual, na.rm = TRUE), 1),
      n_grupos = nrow(premios_resultado$premios),
      grupos_com_ajuste_positivo = sum(premios_resultado$premios$ajuste_percentual > 0, na.rm = TRUE),
      grupos_com_ajuste_negativo = sum(premios_resultado$premios$ajuste_percentual < 0, na.rm = TRUE)
    )
    
    impacto_total <- sum(premios_resultado$premios$ajuste_absoluto, na.rm = TRUE)
    impacto_percentual <- if (estat_finais$premio_global_priori > 0 && estat_finais$n_grupos > 0) {
      impacto_total / (estat_finais$premio_global_priori * estat_finais$n_grupos) * 100
    } else {
      0
    }
    
    # ============================================
    # PREPARAR RESULTADO - SEM TABELAS PROBLEMÁTICAS
    # ============================================
    resultado <- list(
      success = TRUE,
      tipo_operacao = "credibilidade_a_posteriori",
      timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S"),
      
      metodo_aplicado = metodo,
      parametros_usados = list(
        grupo_var = grupo_var,
        tempo_var = tempo_var,
        sinistro_var = sinistro_var,
        custo_var = custo_var,
        metodo = metodo,
        z_min = z_min,
        z_max = z_max
      ),
      
      validacao = validacao,
      estatisticas_gerais = estat_finais,
      
      # 🔥 CONVERTER PARA DATA FRAME ANTES DE JSON
      fatores_credibilidade = as.data.frame(premios_resultado$premios) %>%
        select(grupo, fator_credibilidade, n_anos, n_sinistros_total),
      
      premios_calculados = as.data.frame(premios_resultado$premios) %>%
        mutate(across(where(is.numeric), ~ round(., 2))) %>%
        arrange(desc(ajuste_percentual)),
      
      metricas_credibilidade = list(
        var_entre = round(resultados_metodo$var_entre, 6),
        var_dentro = round(resultados_metodo$var_dentro, 6),
        homogeneidade = if(resultados_metodo$var_entre > 0) 
          "Heterogêneo (grupos diferem)" else 
          "Homogêneo (grupos similares)",
        confiabilidade_estimacao = if(estat_finais$credibilidade_media > 0.7) "Alta" else
                                  if(estat_finais$credibilidade_media > 0.4) "Média" else "Baixa"
      ),
      
      impacto_financeiro = list(
        impacto_total = round(impacto_total, 2),
        impacto_percentual = round(impacto_percentual, 2),
        receita_adicional_estimada = round(max(impacto_total, 0), 2),
        economia_estimada = round(abs(min(impacto_total, 0)), 2)
      ),
      
      # 🔥 SUBSTITUIR summary() que retorna table
      visualizacao_dados = list(
        distribuicao_credibilidade = as.list(summary(premios_resultado$premios$fator_credibilidade)),
        distribuicao_ajustes = as.list(summary(premios_resultado$premios$ajuste_percentual)),
        top_ajustes = as.data.frame(premios_resultado$premios) %>%
          slice_max(abs(ajuste_percentual), n = 5) %>%
          select(grupo, ajuste_percentual, premio_posteriori)
      ),
      
      recomendacoes = list(
        acoes_prioritarias = if(abs(estat_finais$ajuste_medio_percentual) > 20) 
          "Revisar tarifação - ajustes muito altos" else 
          if(abs(estat_finais$ajuste_medio_percentual) > 10)
          "Monitorar ajustes moderados" else
          "Tarifação estável",
        grupos_prioritarios = as.character(premios_resultado$premios$grupo[1:min(3, nrow(premios_resultado$premios))]),
        proximos_passos = if(validacao$n_grupos < 3) 
          "Coletar mais dados para melhor estimativa" else
          "Implementar fatores de credibilidade na tarifação"
      )
    )
    
    # 🔥 USAR toJSON com tratamento especial
    json_output <- toJSON(resultado, auto_unbox = TRUE, pretty = TRUE, 
                          force = TRUE, digits = NA)
    
    write(json_output, output_file)
    
    cat("\n✅ CREDIBILIDADE CALCULADA COM SUCESSO\n")
    cat("====================================\n")
    cat(sprintf("   Prêmio global (a priori): Kz %.2f\n", estat_finais$premio_global_priori))
    cat(sprintf("   Prêmio médio (a posteriori): Kz %.2f\n", estat_finais$premio_medio_posteriori))
    cat(sprintf("   Credibilidade média: %.1f%%\n", estat_finais$credibilidade_media * 100))
    cat(sprintf("   Grupos analisados: %d\n", estat_finais$n_grupos))
    
  }, error = function(e) {
    cat(paste("❌ ERRO NA CREDIBILIDADE:", e$message, "\n"))
    
    resultado <- list(
      success = FALSE,
      error = e$message,
      tipo_operacao = "credibilidade_a_posteriori",
      timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S")
    )
    
    write_json(resultado, output_file, auto_unbox = TRUE, pretty = TRUE)
  })
}

# Executar
if (!interactive()) {
  main()
}