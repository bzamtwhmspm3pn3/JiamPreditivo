#!/usr/bin/env Rscript

library(jsonlite)
library(dplyr)

main <- function() {
  args <- commandArgs(trailingOnly = TRUE)
  
  if (length(args) < 2) {
    stop("Uso: Rscript mortality_table.R <input_file> <output_file>")
  }
  
  input_file <- args[1]
  output_file <- args[2]
  
  cat("📈 Criando tábua de mortalidade...\n")
  
  tryCatch({
    # Ler dados de entrada
    dados_json <- fromJSON(input_file)
    dados <- dados_json$dados
    parametros <- dados_json$parametros
    
    cat("   Registros:", ifelse(is.null(nrow(dados)), length(dados), nrow(dados)), "\n")
    cat("   Tipo: Tábua de Mortalidade\n")
    
    # Extrair parâmetros
    base_mortalidade <- if(!is.null(parametros$base_mortalidade)) parametros$base_mortalidade else "BR-EMS2020"
    idade_min <- if(!is.null(parametros$idade_min)) as.numeric(parametros$idade_min) else 20
    idade_max <- if(!is.null(parametros$idade_max)) as.numeric(parametros$idade_max) else 100
    qx_adjust <- if(!is.null(parametros$qx_adjust)) as.numeric(parametros$qx_adjust) else 1.0
    sexo <- if(!is.null(parametros$sexo)) parametros$sexo else "unisex"
    l0 <- if(!is.null(parametros$l0)) as.numeric(parametros$l0) else 100000
    
    cat("   Base:", base_mortalidade, "\n")
    cat("   Idade min:", idade_min, "\n")
    cat("   Idade max:", idade_max, "\n")
    cat("   Ajuste qx:", qx_adjust, "\n")
    cat("   Sexo:", sexo, "\n")
    cat("   Radix (l0):", format(l0, big.mark = ","), "\n")
    
    # Validar parâmetros
    if (idade_min < 0 || idade_max > 120) {
      stop("Idade deve estar entre 0 e 120 anos")
    }
    
    if (idade_min >= idade_max) {
      stop("Idade mínima deve ser menor que idade máxima")
    }
    
    if (qx_adjust < 0.5 || qx_adjust > 2.0) {
      stop("Ajuste qx deve estar entre 0.5 e 2.0")
    }
    
    # Criar vetor de idades
    idades <- idade_min:idade_max
    n_idades <- length(idades)
    
    cat("   Criando tabela para", n_idades, "idades\n")
    
    # Calcular probabilidades de morte baseado na base selecionada
    cat("   ⚙️  Calculando probabilidades de morte...\n")
    
    qx_base <- calcular_qx_base(idades, base_mortalidade, sexo)
    
    # Aplicar ajuste
    qx <- pmin(qx_base * qx_adjust, 0.999999)  # Limitar para evitar 100%
    
    # Calcular elementos da tábua
    cat("   📊 Calculando lx, dx, px, ex...\n")
    
    # lx: número de sobreviventes na idade x
    lx <- numeric(n_idades)
    lx[1] <- l0
    
    # dx: número de mortes entre x e x+1
    dx <- numeric(n_idades)
    
    # px: probabilidade de sobreviver de x para x+1
    px <- numeric(n_idades)
    
    # ex: expectativa de vida na idade x
    ex <- numeric(n_idades)
    
    # Calcular lx, dx, px
    for (i in 1:(n_idades - 1)) {
      dx[i] <- lx[i] * qx[i]
      lx[i + 1] <- lx[i] - dx[i]
      px[i] <- 1 - qx[i]
    }
    
    # Última idade
    dx[n_idades] <- lx[n_idades]
    px[n_idades] <- 0
    
    # Calcular expectativa de vida
    for (i in 1:n_idades) {
      ex[i] <- sum(lx[i:n_idades]) / lx[i]
    }
    
    # Calutar funções atuariais adicionais
    # Lx: anos vividos entre x e x+1 (aproximação trapezoidal)
    Lx <- numeric(n_idades)
    for (i in 1:(n_idades - 1)) {
      Lx[i] <- (lx[i] + lx[i + 1]) / 2
    }
    Lx[n_idades] <- lx[n_idades] / 2
    
    # Tx: total de anos vividos após idade x
    Tx <- numeric(n_idades)
    for (i in 1:n_idades) {
      Tx[i] <- sum(Lx[i:n_idades])
    }
    
    # mx: taxa central de mortalidade
    mx <- dx / Lx
    mx[is.infinite(mx)] <- NA
    
    # Criar data.frame com a tábua completa
    tabua <- data.frame(
      Idade = idades,
      qx = round(qx, 6),
      px = round(px, 6),
      lx = round(lx, 2),
      dx = round(dx, 2),
      Lx = round(Lx, 2),
      Tx = round(Tx, 2),
      ex = round(ex, 2),
      mx = round(mx, 6)
    )
    
    # Calcular estatísticas resumo
    e0 <- ex[1]  # Expectativa de vida ao nascer
    idade_mediana <- idades[which.max(lx <= l0/2)[1]]
    idade_modal <- idades[which.max(dx)]
    
    # Calcular indicadores atuariais
    cat("   📈 Calculando indicadores atuariais...\n")
    
    indicadores <- list(
      expectativa_vida_nascimento = round(e0, 2),
      idade_mediana_morte = idade_mediana,
      idade_modal_morte = idade_modal,
      taxa_mortalidade_infantil = if(idade_min == 0) round(qx[1] * 1000, 2) else NA,
      sobreviventes_65 = if(65 %in% idades) {
        idx_65 <- which(idades == 65)
        round(lx[idx_65] / l0 * 100, 2)
      } else NA,
      vida_media_futura_20 = if(20 %in% idades) {
        idx_20 <- which(idades == 20)
        round(ex[idx_20], 2)
      } else NA
    )
    
    # Calcular anuidades vitalícias simplificadas
    if (require("lifecontingencies", quietly = TRUE)) {
      library(lifecontingencies)
      
      # Taxa de juros
      i <- 0.03  # 3% ao ano
      
      # Criar objeto de tábua
      vida_table <- new("lifetable",
                       x = idades,
                       lx = lx,
                       name = base_mortalidade)
      
      # Calcular anuidade vitalícia
      ax <- round(axn(vida_table, x = idade_min, i = i), 4)
      
      indicadores$anuidade_vitalicia_20 <- if(20 %in% idades) {
        round(axn(vida_table, x = 20, i = i), 4)
      } else NA
      
      indicadores$apuracao_seguro_vida_20 <- if(20 %in% idades) {
        round(Axn(vida_table, x = 20, i = i), 6)
      } else NA
    }
    
    # Preparar resultado
    resultado <- list(
      success = TRUE,
      tipo = "mortality_table",
      parametros = list(
        base_mortalidade = base_mortalidade,
        idade_min = idade_min,
        idade_max = idade_max,
        qx_adjust = qx_adjust,
        sexo = sexo,
        l0 = l0,
        data_criacao = format(Sys.time(), "%Y-%m-%d %H:%M:%S")
      ),
      tabua_completa = tabua,
      estatisticas = list(
        n_idades = n_idades,
        qx_media = round(mean(qx, na.rm = TRUE), 6),
        qx_max = round(max(qx, na.rm = TRUE), 6),
        qx_min = round(min(qx, na.rm = TRUE), 6),
        lx_final = round(lx[n_idades], 0),
        proporcao_sobreviventes = round(lx[n_idades] / l0 * 100, 4)
      ),
      indicadores_atuariais = indicadores,
      interpretacao = list(
        classificacao_expectativa_vida = if(e0 < 65) "Baixa" else if(e0 < 75) "Média" else "Alta",
        qualidade_ajuste = if(qx_adjust == 1.0) "Base padrão" else "Base ajustada",
        recomendacao_uso = paste("Adequada para produtos de", 
                                if(idade_max >= 80) "vida inteira" else "prazo determinado")
      ),
      projecoes = if(n_idades > 50) {
        list(
          sobreviventes_10_anos = round(lx[which(idades == min(idade_min + 10, idade_max))], 0),
          sobreviventes_20_anos = round(lx[which(idades == min(idade_min + 20, idade_max))], 0),
          probabilidade_chegar_80 = if(80 %in% idades) {
            round(lx[which(idades == 80)] / l0 * 100, 2)
          } else NA
        )
      } else NULL
    )
    
    # Salvar resultado
    write_json(resultado, output_file, auto_unbox = TRUE, pretty = TRUE, digits = NA)
    
    cat("\n✅ Tábua de mortalidade criada com sucesso!\n")
    cat("   Expectativa de vida (e0):", round(e0, 2), "anos\n")
    cat("   Idade modal de morte:", idade_modal, "anos\n")
    cat("   Sobreviventes finais:", format(round(lx[n_idades], 0), big.mark = ","), 
        sprintf("(%.2f%%)\n", lx[n_idades]/l0*100))
    cat("   qx médio:", round(mean(qx), 6), "\n")
    
  }, error = function(e) {
    cat("❌ Erro ao criar tábua de mortalidade:", e$message, "\n")
    
    resultado <- list(
      success = FALSE,
      error = e$message,
      tipo = "mortality_table",
      recomendacoes = c(
        "Verifique os parâmetros de idade (mín < máx)",
        "Ajuste qx deve estar entre 0.5 e 2.0",
        "Para base personalizada, forneça vetor de qx"
      )
    )
    
    write_json(resultado, output_file, auto_unbox = TRUE, pretty = TRUE)
  })
}

# Função para calcular qx baseado na base selecionada
calcular_qx_base <- function(idades, base, sexo = "unisex") {
  n <- length(idades)
  qx <- numeric(n)
  
  # Parâmetros para lei de Makeham: μ(x) = A + B*c^x
  if (base == "BR-EMS2020") {
    if (sexo == "masculino") {
      A <- 0.0005
      B <- 0.000007
      c <- 1.101
    } else if (sexo == "feminino") {
      A <- 0.0003
      B <- 0.000005
      c <- 1.095
    } else { # unisex
      A <- 0.0004
      B <- 0.000006
      c <- 1.098
    }
  } else if (base == "AT-2000") {
    A <- 0.00022
    B <- 0.000005
    c <- 1.1
  } else if (base == "CSO-2017") {
    A <- 0.0003
    B <- 0.0000045
    c <- 1.092
  } else if (base == "GKM-80") {
    A <- 0.0007
    B <- 0.000008
    c <- 1.105
  } else {
    # Base padrão (Makeham simplificada)
    A <- 0.0004
    B <- 0.000006
    c <- 1.098
  }
  
  # Calcular força de mortalidade
  mu <- A + B * (c ^ idades)
  
  # Converter para qx (probabilidade anual de morte)
  # qx ≈ 1 - exp(-μ)
  qx <- 1 - exp(-mu)
  
  # Garantir que qx está entre 0 e 1
  qx <- pmin(pmax(qx, 0), 0.999999)
  
  return(qx)
}

main()

