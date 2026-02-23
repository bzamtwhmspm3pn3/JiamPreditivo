#!/usr/bin/env Rscript

# mortality_table.R - Geração de Tábuas de Mortalidade
# Versão com processamento de dados reais corrigido

library(jsonlite)

# ============================================
# FUNÇÕES AUXILIARES
# ============================================

#' Converte string para booleano
#' @param x Valor a converter
#' @return TRUE/FALSE
as_boolean <- function(x) {
  if (is.null(x)) return(FALSE)
  if (is.logical(x)) return(x)
  if (is.character(x)) {
    return(tolower(x) %in% c("true", "t", "yes", "y", "1", "sim", "s"))
  }
  if (is.numeric(x)) return(x != 0)
  return(FALSE)
}

#' Formata número para saída
#' @param x Número
#' @param digits Casas decimais
#' @return Número formatado
fmt <- function(x, digits = 6) {
  round(as.numeric(x), digits)
}

#' Função de debug para imprimir estrutura de dados
#' @param obj Objeto a ser debugado
#' @param nome Nome do objeto
debug_print <- function(obj, nome = "objeto") {
  cat(paste("\n🔍 DEBUG -", nome, ":\n"))
  cat("   Tipo:", typeof(obj), "\n")
  cat("   Classe:", class(obj), "\n")
  if (is.list(obj)) {
    cat("   Comprimento:", length(obj), "\n")
    cat("   Nomes:", paste(names(obj), collapse = ", "), "\n")
  } else if (is.data.frame(obj)) {
    cat("   Dimensões:", dim(obj), "\n")
    cat("   Colunas:", paste(names(obj), collapse = ", "), "\n")
  }
}

# ============================================
# MODELOS DE MORTALIDADE
# ============================================

#' Modelo de Makeham
#' @param idade Idade
#' @param A Parâmetro A
#' @param B Parâmetro B
#' @param c Parâmetro c
#' @return Taxa de mortalidade instantânea (mu)
makeham_mu <- function(idade, A, B, c) {
  A + B * c^idade
}

#' Modelo de Gompertz
#' @param idade Idade
#' @param B Parâmetro B
#' @param c Parâmetro c
#' @return Taxa de mortalidade instantânea (mu)
gompertz_mu <- function(idade, B, c) {
  B * c^idade
}

#' Obtém parâmetros da base de mortalidade
#' @param base Nome da base
#' @param sexo Sexo ('masculino', 'feminino', 'unisex')
#' @return Lista com parâmetros
get_base_params <- function(base, sexo = "unisex") {
  
  # Parâmetros por base e sexo
  bases <- list(
    "BR-EMS-2020" = list(
      masculino = list(modelo = "makeham", A = 0.00042, B = 0.0000058, c = 1.098),
      feminino = list(modelo = "makeham", A = 0.00031, B = 0.0000042, c = 1.095),
      unisex = list(modelo = "makeham", A = 0.000365, B = 0.0000050, c = 1.0965)
    ),
    "AT-2000" = list(
      masculino = list(modelo = "makeham", A = 0.00038, B = 0.0000052, c = 1.097),
      feminino = list(modelo = "makeham", A = 0.00028, B = 0.0000039, c = 1.094),
      unisex = list(modelo = "makeham", A = 0.00033, B = 0.0000045, c = 1.0955)
    ),
    "CSO-2017" = list(
      masculino = list(modelo = "gompertz", B = 0.000045, c = 1.105),
      feminino = list(modelo = "gompertz", B = 0.000032, c = 1.102),
      unisex = list(modelo = "gompertz", B = 0.000038, c = 1.1035)
    ),
    "GAM-94" = list(
      masculino = list(modelo = "makeham", A = 0.00044, B = 0.0000062, c = 1.099),
      feminino = list(modelo = "makeham", A = 0.00035, B = 0.0000048, c = 1.096),
      unisex = list(modelo = "makeham", A = 0.000395, B = 0.0000055, c = 1.0975)
    ),
    "UP-94" = list(
      masculino = list(modelo = "makeham", A = 0.00041, B = 0.0000055, c = 1.098),
      feminino = list(modelo = "makeham", A = 0.00032, B = 0.0000045, c = 1.095),
      unisex = list(modelo = "makeham", A = 0.000365, B = 0.0000050, c = 1.0965)
    ),
    "IBGE-2022" = list(
      masculino = list(modelo = "makeham", A = 0.00039, B = 0.0000054, c = 1.098),
      feminino = list(modelo = "makeham", A = 0.00030, B = 0.0000041, c = 1.095),
      unisex = list(modelo = "makeham", A = 0.000345, B = 0.00000475, c = 1.0965)
    )
  )
  
  # Fallback se base não encontrada
  if (!base %in% names(bases)) {
    base <- "BR-EMS-2020"
  }
  
  # Fallback se sexo não encontrado
  if (!sexo %in% names(bases[[base]])) {
    sexo <- "unisex"
  }
  
  return(bases[[base]][[sexo]])
}

#' Calcula qx para uma idade
#' @param idade Idade
#' @param params Parâmetros do modelo
#' @param qx_adjust Fator de ajuste
#' @return Probabilidade de morte (qx)
calcular_qx <- function(idade, params, qx_adjust = 1.0) {
  
  modelo <- params$modelo
  
  if (modelo == "makeham") {
    mu <- makeham_mu(idade, params$A, params$B, params$c)
  } else if (modelo == "gompertz") {
    mu <- gompertz_mu(idade, params$B, params$c)
  } else {
    # Fallback para makeham
    mu <- makeham_mu(idade, 0.0004, 0.000006, 1.098)
  }
  
  qx <- 1 - exp(-mu)
  qx <- min(qx * qx_adjust, 0.999999)
  
  return(qx)
}

#' Extrai idades dos dados reais de forma segura
#' @param dados_reais Lista de dados
#' @param nome_variavel Nome da variável de idade
#' @return Vetor de idades válidas
extrair_idades <- function(dados_reais, nome_variavel) {
  idades <- c()
  
  if (is.null(dados_reais) || length(dados_reais) == 0 || is.null(nome_variavel) || nome_variavel == "") {
    return(idades)
  }
  
  # Converter para data frame se for lista
  if (is.list(dados_reais) && !is.data.frame(dados_reais)) {
    # Tentar converter para data frame
    tryCatch({
      df <- as.data.frame(dados_reais)
      if (nome_variavel %in% names(df)) {
        vals <- as.numeric(df[[nome_variavel]])
        idades <- vals[!is.na(vals) & vals > 0 & vals < 120]
      }
    }, error = function(e) {
      cat("   ⚠️ Erro ao converter dados:", e$message, "\n")
    })
  } else if (is.data.frame(dados_reais)) {
    if (nome_variavel %in% names(dados_reais)) {
      vals <- as.numeric(dados_reais[[nome_variavel]])
      idades <- vals[!is.na(vals) & vals > 0 & vals < 120]
    }
  } else if (is.list(dados_reais) && length(dados_reais) > 0) {
    # Tentar acessar como lista de objetos
    for (i in 1:min(length(dados_reais), 1000)) {
      item <- dados_reais[[i]]
      if (is.list(item) && nome_variavel %in% names(item)) {
        val <- as.numeric(item[[nome_variavel]])
        if (!is.na(val) && val > 0 && val < 120) {
          idades <- c(idades, val)
        }
      }
    }
  }
  
  return(idades)
}

#' Calcula tábua completa
#' @param idades Vetor de idades
#' @param params Parâmetros do modelo
#' @param qx_adjust Fator de ajuste
#' @param l0 População inicial
#' @param dados_reais Dados reais para ajuste (opcional)
#' @param mapeamento Mapeamento de variáveis (opcional)
#' @return Data frame com a tábua
calcular_tabua <- function(idades, params, qx_adjust = 1.0, l0 = 100000, dados_reais = NULL, mapeamento = NULL) {
  
  n <- length(idades)
  
  # Se temos dados reais, ajustar parâmetros
  fator_dados <- 1.0
  if (!is.null(dados_reais) && length(dados_reais) > 0 && !is.null(mapeamento$idade) && mapeamento$idade != "") {
    cat("\n📊 AJUSTANDO COM DADOS REAIS:\n")
    
    # Extrair idades dos dados
    idades_reais <- extrair_idades(dados_reais, mapeamento$idade)
    
    if (length(idades_reais) > 0) {
      media_idade <- mean(idades_reais)
      cat("   📊 Média de idade nos dados:", round(media_idade, 2), "anos\n")
      cat("   📊 Número de observações:", length(idades_reais), "\n")
      
      # Ajustar fator baseado na média de idade
      # Quanto maior a média, maior a mortalidade
      fator_dados <- 1.0 + (media_idade - 35) * 0.01
      cat("   🔧 Fator de ajuste por dados:", round(fator_dados, 3), "\n")
    } else {
      cat("   ⚠️ Nenhuma idade válida encontrada nos dados\n")
    }
    
    # Verificar distribuição por sexo (opcional)
    if (!is.null(mapeamento$sexo) && mapeamento$sexo != "") {
      cat("   📊 Análise de sexo disponível (não implementada)\n")
    }
  }
  
  # Aplicar fator de dados ao qx_adjust
  qx_adjust_total <- qx_adjust * fator_dados
  
  # Calcular qx com ajuste total
  qx_values <- sapply(idades, function(i) calcular_qx(i, params, qx_adjust_total))
  
  # Calcular lx
  lx_values <- numeric(n)
  lx_values[1] <- l0
  for (i in 2:n) {
    lx_values[i] <- lx_values[i-1] * (1 - qx_values[i-1])
    if (lx_values[i] < 0.5) {
      lx_values[i:n] <- 0
      break
    }
  }
  
  # Calcular dx (óbitos)
  dx_values <- lx_values * qx_values
  
  # Calcular Lx (anos-pessoa vividos)
  Lx_values <- numeric(n)
  for (i in 1:(n-1)) {
    if (lx_values[i] > 0 && lx_values[i+1] > 0) {
      Lx_values[i] <- (lx_values[i] + lx_values[i+1]) / 2
    } else if (lx_values[i] > 0) {
      Lx_values[i] <- lx_values[i] / 2
    } else {
      Lx_values[i] <- 0
    }
  }
  if (lx_values[n] > 0) {
    Lx_values[n] <- lx_values[n] / 2
  }
  
  # Calcular Tx (total de anos futuros)
  Tx_values <- numeric(n)
  soma_acumulada <- 0
  for (i in n:1) {
    soma_acumulada <- soma_acumulada + Lx_values[i]
    Tx_values[i] <- soma_acumulada
  }
  
  # Calcular ex (expectativa de vida)
  ex_values <- numeric(n)
  for (i in 1:n) {
    if (lx_values[i] > 0) {
      ex_values[i] <- Tx_values[i] / lx_values[i]
    } else {
      ex_values[i] <- 0
    }
  }
  
  # Criar data frame
  tabua <- data.frame(
    idade = idades,
    qx = fmt(qx_values, 6),
    lx = round(lx_values, 0),
    dx = round(dx_values, 0),
    Lx = round(Lx_values, 0),
    Tx = round(Tx_values, 0),
    ex = fmt(ex_values, 2)
  )
  
  attr(tabua, "fator_dados") <- fator_dados
  attr(tabua, "media_idade_dados") <- ifelse(exists("media_idade"), media_idade, NA)
  return(tabua)
}

# ============================================
# FUNÇÃO PRINCIPAL
# ============================================
main <- function() {
  args <- commandArgs(trailingOnly = TRUE)
  
  if (length(args) < 2) {
    stop("Uso: Rscript mortality_table.R <input_file> <output_file>")
  }
  
  input_file <- args[1]
  output_file <- args[2]
  
  cat("\n📈 TÁBUA DE MORTALIDADE")
  cat("\n==================================================\n")
  cat("📥 Input:", input_file, "\n")
  cat("📤 Output:", output_file, "\n")
  
  tryCatch({
    # Verificar se arquivo existe
    if (!file.exists(input_file)) {
      stop(paste("Arquivo não encontrado:", input_file))
    }
    
    # Ler dados
    dados_json <- fromJSON(input_file)
    cat("✅ JSON lido com sucesso\n")
    
    # DEBUG: Mostrar estrutura
    cat("\n🔍 Estrutura do JSON:\n")
    cat("   Campos principais:", paste(names(dados_json), collapse = ", "), "\n")
    
    # Extrair dados reais (se existirem)
    dados_reais <- NULL
    if (!is.null(dados_json$dados)) {
      dados_reais <- dados_json$dados
      cat("\n📊 DADOS REAIS CARREGADOS:", length(dados_reais), "registros\n")
      
      # Mostrar amostra
      if (length(dados_reais) > 0) {
        cat("   Primeiros 3 registros:\n")
        for (i in 1:min(3, length(dados_reais))) {
          cat("   ", i, ": ")
          print(dados_reais[[i]])
        }
      }
    }
    
    # Extrair parâmetros
    if (!is.null(dados_json$parametros)) {
      parametros <- dados_json$parametros
    } else {
      parametros <- list()
    }
    
    # Extrair mapeamento de variáveis
    mapeamento <- list(idade = "", sexo = "", localizacao = "")
    if (!is.null(parametros$mapeamento)) {
      mapeamento <- parametros$mapeamento
      cat("\n🗺️ MAPEAMENTO DE VARIÁVEIS:\n")
      cat("   Idade:", ifelse(is.null(mapeamento$idade), "não definido", mapeamento$idade), "\n")
      cat("   Sexo:", ifelse(is.null(mapeamento$sexo), "não definido", mapeamento$sexo), "\n")
      cat("   Localização:", ifelse(is.null(mapeamento$localizacao), "não definido", mapeamento$localizacao), "\n")
    }
    
    # Extrair estatísticas dos dados (enviadas pelo frontend)
    estatisticas_dados <- NULL
    if (!is.null(parametros$estatisticas_dados)) {
      estatisticas_dados <- parametros$estatisticas_dados
      cat("\n📊 ESTATÍSTICAS DOS DADOS (frontend):\n")
      if (!is.null(estatisticas_dados$mediaIdade)) {
        cat("   Média de idade:", estatisticas_dados$mediaIdade, "\n")
      }
    }
    
    cat("\n📊 PARÂMETROS RECEBIDOS:\n")
    cat("==================================================\n")
    
    # Parâmetros com valores padrão
    base_mortalidade <- if(!is.null(parametros$base_mortalidade)) as.character(parametros$base_mortalidade) else "BR-EMS-2020"
    idade_min <- if(!is.null(parametros$idade_min)) as.numeric(parametros$idade_min) else 20
    idade_max <- if(!is.null(parametros$idade_max)) as.numeric(parametros$idade_max) else 100
    sexo <- if(!is.null(parametros$sexo)) as.character(parametros$sexo) else "unisex"
    l0 <- if(!is.null(parametros$l0)) as.numeric(parametros$l0) else 100000
    qx_adjust <- if(!is.null(parametros$qx_adjust)) as.numeric(parametros$qx_adjust) else 1.0
    juros <- if(!is.null(parametros$juros)) as.numeric(parametros$juros) else 0.03
    inflacao <- if(!is.null(parametros$inflacao)) as.numeric(parametros$inflacao) else 0.04
    capital_segurado <- if(!is.null(parametros$capital_segurado)) as.numeric(parametros$capital_segurado) else 100000
    prazo <- if(!is.null(parametros$prazo)) as.integer(parametros$prazo) else 20
    carregamento_despesas <- if(!is.null(parametros$carregamento_despesas)) as.numeric(parametros$carregamento_despesas) else 0.25
    carregamento_lucro <- if(!is.null(parametros$carregamento_lucro)) as.numeric(parametros$carregamento_lucro) else 0.08
    carregamento_impostos <- if(!is.null(parametros$carregamento_impostos)) as.numeric(parametros$carregamento_impostos) else 0.02
    
    cat("   Base de Mortalidade:", base_mortalidade, "\n")
    cat("   Idade Mínima:", idade_min, "\n")
    cat("   Idade Máxima:", idade_max, "\n")
    cat("   Sexo:", sexo, "\n")
    cat("   População Inicial (l₀):", l0, "\n")
    cat("   Ajuste qx:", qx_adjust, "\n")
    cat("   Taxa de Juros:", round(juros * 100, 1), "%\n")
    cat("   Inflação:", round(inflacao * 100, 1), "%\n")
    cat("   Capital Segurado:", capital_segurado, "\n")
    cat("   Prazo:", prazo, "anos\n")
    cat("   Carregamento Despesas:", round(carregamento_despesas * 100, 1), "%\n")
    cat("   Carregamento Lucro:", round(carregamento_lucro * 100, 1), "%\n")
    cat("   Carregamento Impostos:", round(carregamento_impostos * 100, 1), "%\n")
    
    # Obter parâmetros do modelo
    params <- get_base_params(base_mortalidade, sexo)
    cat("\n📐 MODELO:", toupper(params$modelo), "\n")
    if (params$modelo == "makeham") {
      cat("   A =", params$A, "\n")
      cat("   B =", params$B, "\n")
      cat("   c =", params$c, "\n")
    } else if (params$modelo == "gompertz") {
      cat("   B =", params$B, "\n")
      cat("   c =", params$c, "\n")
    }
    
    # Gerar idades
    idades <- idade_min:idade_max
    
    # Calcular tábua completa com dados reais
    tabua <- calcular_tabua(idades, params, qx_adjust, l0, dados_reais, mapeamento)
    
    # Obter metadados
    fator_dados <- attr(tabua, "fator_dados")
    media_idade_dados <- attr(tabua, "media_idade_dados")
    
    cat("\n✅ TÁBUA CALCULADA:", nrow(tabua), "idades\n")
    cat("   e₀ =", round(tabua$ex[1], 2), "anos\n")
    cat("   l₍ₘₐₓ₎ =", round(tabua$lx[nrow(tabua)], 0), "sobreviventes\n")
    cat("   qx médio =", round(mean(tabua$qx) * 1000, 2), "‰\n")
    cat("   Fator de dados aplicado:", round(fator_dados, 3), "\n")
    
    # Calcular estatísticas adicionais
    estatisticas <- list(
      n_idades = nrow(tabua),
      e0 = round(tabua$ex[1], 2),
      ex_media = round(mean(tabua$ex[tabua$ex > 0]), 2),
      qx_medio = round(mean(tabua$qx), 6),
      qx_max = round(max(tabua$qx), 6),
      qx_min = round(min(tabua$qx[tabua$qx > 0]), 6),
      lx_inicial = round(tabua$lx[1], 0),
      lx_final = round(tabua$lx[nrow(tabua)], 0),
      total_obitos = round(tabua$lx[1] - tabua$lx[nrow(tabua)], 0),
      sobrevivencia_60 = ifelse(60 %in% tabua$idade, 
                                 round(tabua$lx[tabua$idade == 60] / tabua$lx[1] * 100, 1), 
                                 NA),
      fator_dados_aplicado = round(fator_dados, 3)
    )
    
    # Calcular prêmios para idade 30 como exemplo
    idade_exemplo <- 30
    if (idade_exemplo %in% tabua$idade) {
      idx <- which(tabua$idade == idade_exemplo)
      qx_exemplo <- tabua$qx[idx]
      ex_exemplo <- tabua$ex[idx]
      
      fator_desconto <- 1 / (1 + juros)
      premio_puro <- capital_segurado * qx_exemplo * fator_desconto
      
      fator_carregamento <- 1 + carregamento_despesas + carregamento_lucro + carregamento_impostos
      premio_comercial <- premio_puro * fator_carregamento
      
      premio_nivelado <- capital_segurado * qx_exemplo * (1 - fator_desconto^prazo) / (1 - fator_desconto)
      anuidade <- ex_exemplo * premio_puro * 0.8
      reserva <- capital_segurado * (1 - fator_desconto^(prazo - 10))
      
      premios <- list(
        idade_exemplo = idade_exemplo,
        qx_exemplo = round(qx_exemplo, 6),
        ex_exemplo = round(ex_exemplo, 2),
        premio_puro = round(premio_puro, 2),
        premio_comercial = round(premio_comercial, 2),
        premio_nivelado = round(premio_nivelado, 2),
        anuidade = round(anuidade, 2),
        reserva = round(reserva, 2)
      )
    } else {
      premios <- NULL
    }
    
    # Preparar resultado
    resultado <- list(
      success = TRUE,
      timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S"),
      tipo = "mortality_table",
      parametros = list(
        base_mortalidade = base_mortalidade,
        idade_min = idade_min,
        idade_max = idade_max,
        sexo = sexo,
        l0 = l0,
        qx_adjust = qx_adjust,
        juros = juros,
        inflacao = inflacao,
        capital_segurado = capital_segurado,
        prazo = prazo,
        carregamento_despesas = carregamento_despesas,
        carregamento_lucro = carregamento_lucro,
        carregamento_impostos = carregamento_impostos,
        modelo = params$modelo
      ),
      tabua = tabua,
      estatisticas = estatisticas,
      premios_exemplo = premios,
      dados_utilizados = list(
        n_registros = ifelse(is.null(dados_reais), 0, length(dados_reais)),
        mapeamento_aplicado = mapeamento,
        fator_ajuste = fator_dados,
        media_idade_dados = ifelse(is.na(media_idade_dados), "não calculada", media_idade_dados)
      )
    )
    
    # Salvar resultado
    json_str <- toJSON(resultado, auto_unbox = TRUE, pretty = TRUE, digits = 6)
    write(json_str, output_file)
    
    cat("\n✅ RESULTADO SALVO EM:", output_file, "\n")
    cat("   Tamanho:", file.size(output_file), "bytes\n")
    cat("   Fator de dados aplicado:", round(fator_dados, 3), "\n")
    
  }, error = function(e) {
    cat("\n❌ ERRO:", e$message, "\n")
    traceback()
    
    resultado <- list(
      success = FALSE,
      error = e$message,
      timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S")
    )
    
    json_str <- toJSON(resultado, auto_unbox = TRUE, pretty = TRUE)
    write(json_str, output_file)
    
    quit(status = 1)
  })
}

# ============================================
# EXECUÇÃO
# ============================================
main()