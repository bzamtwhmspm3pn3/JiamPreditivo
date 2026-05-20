
#!/bin/bash
# .render-build.sh

echo "📦 Instalando dependências do sistema..."
apt-get update
apt-get install -y libcurl4-openssl-dev libssl-dev libxml2-dev

echo "📦 Instalando pacotes R..."
Rscript -e "
  options(repos = c(CRAN = 'https://cloud.r-project.org/'))
  packages <- c('jsonlite', 'dplyr', 'lubridate', 'prophet', 'forecast', 'tseries')
  for (pkg in packages) {
    if (!require(pkg, character.only = TRUE, quietly = TRUE)) {
      install.packages(pkg, quiet = FALSE)
    }
  }
  print('✅ Pacotes R instalados!')
"

echo "📦 Instalando dependências Node..."
npm install

echo "✅ Build concluído!"