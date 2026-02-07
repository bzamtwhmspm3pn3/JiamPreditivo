library(jsonlite)
source('../../../r-engine/actuary/engine.R')
source('../../../r-engine/common/utils.R')

input_path <- '../../tmp/input/actuary_input.csv'
output_path <- '../../tmp/output/actuary_output.csv'
sinistros_path <- '../../tmp/input/sinistros.csv'

dados <- read_input(input_path)
sinistros <- read_input(sinistros_path)

dados <- tarif_apriori(dados)
dados <- tarif_aposteriori(dados, sinistros)

write_output(dados, output_path)
cat(toJSON(list(status="success", output=output_path)))
