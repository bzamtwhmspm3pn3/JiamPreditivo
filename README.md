# JIAM Preditivo

![JIAM Preditivo](./assets/logo.png)

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-2.0.0-yellow)

---

## Descrição

JIAM Preditivo é uma plataforma de previsão e análise de dados utilizando Machine Learning e séries temporais, com integração backend (Node.js + R) e frontend React.  
O sistema permite realizar previsões, análises interativas e exportação de resultados.

---

## Funcionalidades

- Previsões de séries temporais (ARIMA, SARIMA, ETS, Prophet)  
- Modelos ML: Random Forest, Regressão Linear, Regressão Logística, XGBoost  
- Dashboard interativo em React  
- Exportação de resultados em PDF  

---

## Screenshots / GIFs

![Dashboard](./assets/screenshots/Dashboard.jpeg)  
![Sobre](./assets/screenshots/Sobre.jpeg)  
![Ajuda](./assets/screenshots/Ajuda.jpeg)  

---

## Instalação

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/JiamPreditivo.git

# Backend
cd JiamPreditivo/backend
npm install

# Frontend
cd ../frontend
npm install

PORT=5000
MONGO_URI=mongodb://usuario:senha@host:porta/db
JWT_SECRET=sua_chave_secreta
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=sua_chave_refresh
JWT_REFRESH_EXPIRE=30d

APP_NAME=JIAM Preditivo
EMAIL_HOST=smtp.exemplo.com
EMAIL_PORT=587
EMAIL_USER=usuario@exemplo.com
EMAIL_PASS=sua_senha
EMAIL_FROM=usuario@exemplo.com
SUPPORT_EMAIL=suporte@jiamapp.com
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

CLOUD_NAME=cloud_name_exemplo
CLOUD_API_KEY=cloud_api_key_exemplo
CLOUD_API_SECRET=cloud_api_secret_exemplo

GOOGLE_API_KEY=sua_google_api_key
GOOGLE_CX=seu_google_cx
USE_R_PLUMBER=true
R_API_URL=http://localhost:8000

RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=200
LOG_LEVEL=info


REACT_APP_API_URL=http://localhost:5000/api

# Backend
cd backend
npm start

# Frontend
cd frontend
npm start




JiamPreditivo/
├── .gitignore
├── README.md
├── assets/
│   ├── logo.png
│   └── screenshots/
│       ├── Dashboard.jpeg
│       ├── Sobre.jpeg
│       └── Ajuda.jpeg
├── backend/
│   ├── api/
│   │   ├── r/
│   │   │   ├── actuary/
│   │   │   ├── linear/
│   │   │   ├── logistic/
│   │   │   ├── random_forest/
│   │   │   ├── time_series/
│   │   │   │   ├── arima/
│   │   │   │   ├── ets/
│   │   │   │   └── prophet/
│   │   │   └── xgboost/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── r-engine/
│   │   ├── actuarial/
│   │   ├── common/
│   │   ├── ml/
│   │   ├── regression/
│   │   └── time_series/
│   ├── routes/
│   │   ├── r/
│   │   └── r-api/
│   ├── scripts/
│   ├── services/
│   └── utils/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   │   └── jiam/
│   │   │       └── Nova pasta/
│   │   ├── components/
│   │   │   ├── Dashboard/
│   │   │   │   ├── Actuarial/
│   │   │   │   ├── componentes/
│   │   │   │   ├── MachineLearning/
│   │   │   │   ├── RegressaoLinear/
│   │   │   │   ├── relatorios/
│   │   │   │   ├── resultados/
│   │   │   │   ├── SeriesTemporais/
│   │   │   │   └── utils/
│   │   │   ├── DataTable/
│   │   │   ├── StatCard/
│   │   │   └── theme/
│   │   ├── contexts/
│   │   ├── data/
│   │   ├── pages/
│   │   ├── services/
│   │   │   └── api/
│   │   └── utils/


GET /api/predict
POST /api/data

git checkout -b feature/nome
git commit -m 'Descrição'
git push origin feature/nome


MIT © 2026 Venâncio Martins
