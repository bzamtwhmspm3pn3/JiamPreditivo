library(jsonlite)
source('../../../r-engine/linear/engine.R')
source('../../../r-engine/common/utils.R')

input_path <- '../../tmp/input/linear_input.csv'
output_path <- '../../tmp/output/linear_output.csv'

data <- read_input(input_path)
modelo <- treinar_modelo(data)
preds <- prever(modelo, data)

write_output(data.frame(Predicoes = preds), output_path)
cat(toJSON(list(status="success", output=output_path)))
