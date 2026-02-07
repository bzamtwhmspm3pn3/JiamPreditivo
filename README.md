
# JIAM Predictive - AI-Powered Predictive Analytics Platform

**Author:** Venâncio Elavoco Cassova Martins  
**ORCID:** [0009-0006-5893-7738](https://orcid.org/0009-0006-5893-7738)  
**Status:** Production Ready | **Version:** 2.0.0 | **License:** MIT


![JIAM Preditivo](./assets/logo.png)

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-2.0.0-yellow)


## Overview

JIAM Predictive is an enterprise-grade predictive analytics platform that combines cutting-edge machine learning algorithms with statistical modeling in R to deliver accurate forecasts, intelligent insights, and actionable recommendations through an intuitive React-based dashboard.

## Key Features

- **Advanced Time Series Forecasting** (ARIMA, SARIMA, ETS, Prophet)
- **Machine Learning Models** (Random Forest, XGBoost, Linear/Logistic Regression)
- **Actuarial & Statistical Models** (GLM, A Priori Analysis)
- **Interactive Dashboard** with real-time visualization
- **Professional PDF Reporting** with AI-powered insights
- **R Integration** for statistical computing and modeling
- **Enterprise Security** with JWT authentication
- **Scalable Architecture** with microservices design

## Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **R** 4.0.0 or higher (with required packages)
- **MongoDB** 7.0.0 or higher
- **npm** or **yarn** package manager
- **RStudio** or R environment (optional, for R scripts)


## Screenshots / GIFs

![Dashboard](./assets/screenshots/Dashboard.jpeg)  
![Sobre](./assets/screenshots/Sobre.jpeg)  
![Ajuda](./assets/screenshots/Ajuda.jpeg)  


### Installation

```bash
# Clone the repository
git clone https://github.com/bzamtwhmspm3pn3/JiamPreditivo
cd jiam-predictive

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Set up environment variables
cp .env.example .env
```

### Configuration

**Backend Configuration (backend/.env):**
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/jiam_predictive
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_REFRESH_EXPIRE=30d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
EMAIL_FROM=noreply@jiampredictive.com
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=200
USE_R_PLUMBER=false
R_API_URL=http://localhost:8000
R_SCRIPT_PATH=./r-engine
LOG_LEVEL=info
```

**Frontend Configuration (frontend/.env):**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_VERSION=2.0.0
REACT_APP_ENVIRONMENT=development
```

### Running the Application

```bash
# Start Backend Server
cd backend
npm start
# Server runs on http://localhost:5000

# Start Frontend Application
cd ../frontend
npm start
# Frontend runs on http://localhost:3000

# Start R API Server (optional)
cd backend/r-engine
Rscript -e "plumber::plumb('api.R')$run(port=8000)"
```

## Project Architecture

```
jiam-predictive/
├── backend/                    # Node.js + Express API Server
│   ├── api/                    # API Controllers
│   ├── controllers/            # Business Logic
│   ├── middleware/             # Express Middleware
│   ├── models/                 # MongoDB Models
│   ├── r-engine/               # R Statistical Engine
│   ├── routes/                 # API Routes
│   ├── scripts/                # Utility Scripts
│   ├── services/               # Business Services
│   └── utils/                  # Helper Functions
├── frontend/                   # React Application
│   ├── public/                 # Static Assets
│   ├── src/
│   │   ├── components/         # React Components
│   │   ├── contexts/           # React Contexts
│   │   ├── pages/              # Application Pages
│   │   ├── services/           # API Services
│   │   └── utils/              # Utility Functions
├── docs/                       # Documentation
├── scripts/                    # Deployment Scripts
├── tests/                      # Test Suites
├── .env.example               # Environment Template
├── docker-compose.yml         # Docker Configuration
├── LICENSE                    # MIT License
└── README.md                  # This File
```

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Statistical Engine**: R 4.0+
- **Authentication**: JWT + bcrypt
- **Visualization**: Recharts + D3.js
- **PDF Generation**: jsPDF + autoTable
- **Containerization**: Docker
- **Testing**: Jest + React Testing Library

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints
- `POST /auth/register` - User Registration
- `POST /auth/login` - User Login
- `POST /auth/refresh` - Refresh Token
- `GET /auth/profile` - Get User Profile

### Model Endpoints
- `POST /models/linear` - Linear Regression
- `POST /models/logistic` - Logistic Regression
- `POST /models/random-forest` - Random Forest
- `POST /models/xgboost` - XGBoost Model
- `POST /models/arima` - ARIMA Time Series
- `POST /models/prophet` - Prophet Forecasting
- `POST /models/actuarial` - Actuarial Models

### Data Management
- `POST /data/upload` - Upload Dataset
- `GET /data/datasets` - List Datasets
- `GET /data/:id` - Get Dataset
- `DELETE /data/:id` - Delete Dataset

## Model Capabilities

### 1. Time Series Analysis
- **ARIMA/SARIMA**: Auto-regressive integrated moving average
- **ETS**: Exponential smoothing state space
- **Prophet**: Facebook's forecasting procedure
- **Multi-seasonal**: Handle complex seasonal patterns

### 2. Machine Learning
- **Random Forest**: Ensemble learning for classification/regression
- **XGBoost**: Gradient boosting with optimization
- **Linear Regression**: Simple and multiple regression
- **Logistic Regression**: Binary and multiclass classification

### 3. Statistical Modeling
- **Generalized Linear Models (GLM)**: Flexible regression models
- **A Priori Analysis**: Statistical inference
- **Hypothesis Testing**: Confidence intervals, p-values
- **Model Diagnostics**: Residual analysis, goodness of fit

## Development

### Setting Up Development Environment

```bash
# Clone the repository
git clone https://github.com/bzamtwhmspm3pn3/JiamPreditivo
cd jiam-predictive

# Install all dependencies
npm run setup:all

# Start development servers
npm run dev
```

### Available Scripts

```bash
# Backend Commands
npm run start:backend     # Start backend server
npm run dev:backend       # Start with nodemon
npm run test:backend      # Run backend tests

# Frontend Commands
npm run start:frontend    # Start React app
npm run build:frontend    # Build for production
npm run test:frontend     # Run frontend tests

# Full Application
npm run dev              # Start all services
npm run test            # Run all tests
npm run build           # Build for production
```

## Deployment

### Production Build

```bash
# Build both frontend and backend
npm run build:all

# Start production server
npm start
```

### Docker Deployment

```yaml
# docker-compose.yml
version: '3.8'
services:
  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongodb:27017/jiam_predictive
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the Repository**
2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit Your Changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the Branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines
- Follow the existing code style
- Write unit tests for new features
- Update documentation as needed
- Ensure backward compatibility

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support & Contact

For support, questions, or contributions:
- **GitHub Issues**: Create an issue
- **Email**: venaciomartinse@gmail.com
- **Documentation**: Read the docs

## Future Roadmap
- Real-time streaming predictions
- AutoML capabilities
- Mobile application
- Additional ML models (Neural Networks, SVM)
- Multilingual support
- API marketplace
- Advanced collaboration features

*Last Updated: December 2025 | Version 2.0.0*