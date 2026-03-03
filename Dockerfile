# Usar Node.js como base
FROM node:20-slim

# Instalar R e dependências necessárias
RUN apt-get update && apt-get install -y \
    r-base \
    r-base-dev \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    && R -e "install.packages(c('plumber', 'jsonlite', 'glmnet', 'MASS', 'randomForest', 'xgboost', 'caret', 'forecast', 'tseries', 'markovchain', 'actuar'), repos='https://cloud.r-project.org/')" \
    && rm -rf /var/lib/apt/lists/*

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependência do backend
COPY backend/package*.json ./backend/

# Instalar dependências Node.js
RUN cd backend && npm install

# Copiar todo o código do backend
COPY backend/ ./backend/

# Copiar frontend (opcional, se quiser servir via backend)
COPY frontend/ ./frontend/

# Expor a porta que o backend usa
EXPOSE 5000

# Comando para iniciar o servidor
CMD ["node", "backend/server.js"]