# engine.R - Prophet
library(prophet)
run_model <- function(df) {
  model <- prophet(df)
  return(model)
}