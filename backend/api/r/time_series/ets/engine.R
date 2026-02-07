# engine.R - ETS
library(forecast)
run_model <- function(ts_data) {
  model <- ets(ts_data)
  return(model)
}