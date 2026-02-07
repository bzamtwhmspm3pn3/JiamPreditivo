# utils.R - Funções auxiliares
verificar_variaveis <- function(dados, vars) {
  all(vars %in% colnames(dados))
}

limpar_dados <- function(dados) {
  dados[complete.cases(dados), ]
}
