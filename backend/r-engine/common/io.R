# io.R - Funções para leitura e escrita de dados
ler_dados <- function(caminho) {
  if (!file.exists(caminho)) stop("Arquivo não encontrado")
  read.csv(caminho, stringsAsFactors = FALSE)
}

salvar_resultado <- function(dados, caminho) {
  write.csv(dados, file = caminho, row.names = FALSE)
}
