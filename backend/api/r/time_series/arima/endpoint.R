library(jsonlite)
library(forecast)
source('../../../r-engine/time_series/arima/engine.R')
source('../../../r-engine/common/utils.R')

input_path <- '../../tmp/input/arima_input.csv'
output_path <- '../../tmp/output/arima_output.csv'

data <- read_input(input_path)
serie <- ts(data$valor, frequency=12)
modelo <- treinar_arima(serie)
preds <- prever_arima(modelo, h=12)

write_output(data.frame(Predicoes = preds), output_path)
cat(toJSON(list(status="success", output=output_path)))
