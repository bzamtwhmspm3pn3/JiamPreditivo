# Usar Node.js como base
FROM node:20-slim

# Instalar R e dependências de compilação
RUN apt-get update && apt-get install -y \
    r-base \
    r-base-dev \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    libgit2-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    libfreetype6-dev \
    libpng-dev \
    libtiff5-dev \
    libjpeg-dev \
    cmake \
    make \
    g++ \
    gcc \
    fort77 \
    libreadline-dev \
    libx11-dev \
    libxt-dev \
    && rm -rf /var/lib/apt/lists/*

# 🔥 CONFIGURAR COMPILAÇÃO MAIS RÁPIDA
RUN echo 'MAKEFLAGS = -j4' > ~/.R/Makevars
RUN echo 'CXXFLAGS = -O3 -mtune=native' >> ~/.R/Makevars

# 🔥 INSTALAR PACOTES EM CAMADAS PARA CACHE (do mais leve ao mais pesado)
# Camada 1: Pacotes leves e sem dependências complexas
RUN R -e "install.packages(c('jsonlite', 'plumber', 'MASS'), repos='https://cloud.r-project.org/', Ncpus=2)"

# Camada 2: Pacotes médios
RUN R -e "install.packages(c('glmnet', 'tseries', 'lubridate', 'markovchain'), repos='https://cloud.r-project.org/', Ncpus=2)"

# Camada 3: forecast (moderado)
RUN R -e "install.packages('forecast', repos='https://cloud.r-project.org/', Ncpus=2)"

# Camada 4: randomForest e actuar
RUN R -e "install.packages(c('randomForest', 'actuar'), repos='https://cloud.r-project.org/', Ncpus=2)"

# Camada 5: xgboost (mais pesado - usar pre-compilado se possível)
RUN R -e "install.packages('xgboost', repos='https://cloud.r-project.org/', Ncpus=2)"

# Camada 6: caret (depende de muitos pacotes)
RUN R -e "install.packages('caret', repos='https://cloud.r-project.org/', Ncpus=2)"

# Verificar instalação
RUN R -e "library(jsonlite); library(plumber); library(glmnet); library(MASS); library(randomForest); library(xgboost); library(caret); library(forecast); library(tseries); library(markovchain); library(actuar); print('✅ Todos os pacotes instalados com sucesso')"

WORKDIR /app

# Copiar apenas package.json primeiro (para cache do npm)
COPY backend/package*.json ./backend/

# Instalar dependências Node.js
RUN cd backend && npm ci --only=production 2>/dev/null || cd backend && npm install

# Copiar código do backend
COPY backend/ ./backend/

# Copiar frontend build se existir
COPY frontend/build ./frontend/build 2>/dev/null || echo "Frontend build não encontrado"

EXPOSE 5000

CMD ["node", "backend/server.js"]