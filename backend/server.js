// server.js - VERSÃO ANTIGA COM NOVAS ROTAS R/JS
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

// Importar rotas existentes
const authRoutes = require("./routes/auth");
const avaliacaoRoutes = require("./routes/avaliacoes");
const chatbotRoutes = require("./routes/chatbot");
const profileRoutes = require("./routes/profile");
const dashboardRoutes = require("./routes/dashboard");

// Importar NOVAS rotas R/JS (comece com uma)
const processamentoRoutes = require("./routes/r-api/processamento");
const visualizacaoRoutes = require("./routes/r-api/visualizacao");
const interpretacaoRoutes = require("./routes/r-api/interpretacao");
const modelosRoutes = require("./routes/r-api/modelos");
const dadosRoutes = require("./routes/r-api/dados");

// Importar middleware de erro
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// Conectar ao MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("🔥 MongoDB conectado com sucesso"))
  .catch((err) => {
    console.error("❌ ERRO A CONECTAR MONGO:", err);
    process.exit(1);
  });

// Middleware de segurança
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  message: {
    success: false,
    message: "Muitas requisições deste IP, tente novamente mais tarde."
  }
});
app.use("/api", limiter);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rotas existentes
app.use("/api/auth", authRoutes);
app.use("/api/avaliacoes", avaliacaoRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/dashboard", dashboardRoutes);

// =============== NOVAS ROTAS R/JS ===============
app.use("/api/r/processamento", processamentoRoutes);

app.use("/api/r/visualizacao", visualizacaoRoutes);
app.use("/api/r/interpretacao", interpretacaoRoutes);
app.use("/api/r/modelos", modelosRoutes);
app.use("/api/r/dados", dadosRoutes);

// Rota de saúde atualizada
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "JIAM Backend está funcionando",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    routes: {
      auth: "/api/auth",
      profile: "/api/profile", 
      dashboard: "/api/dashboard",
      avaliacoes: "/api/avaliacoes",
      chatbot: "/api/chatbot",
      r_processamento: "/api/r/processamento",
      r_visualizacao: "/api/r/visualizacao",
      r_interpretacao: "/api/r/interpretacao",
      r_modelos: "/api/r/modelos",
      r_dados: "/api/r/dados"
    }
  });
});


// Nova rota para status do sistema R/JS
app.get("/api/r/status", (req, res) => {
  res.json({
    success: true,
    message: "Sistema R/JS funcionando",
    timestamp: new Date().toISOString(),
    sistema: "híbrido R/JavaScript",
    rotas_ativas: [
      "/api/r/processamento",
      "/api/r/visualizacao",
      "/api/r/interpretacao",
      "/api/r/modelos",
      "/api/r/dados"
    ],
    funcionalidades: {
      processamento: "Limpeza, formatação e preparação de dados",
      visualizacao: "Gráficos Plotly e Chart.js",
      interpretacao: "Interpretação de modelos estatísticos",
      modelos: "Modelos GLM, Random Forest, Regressão Linear",
      dados: "Upload e manipulação de datasets"
    }
  });
});


// Rota raiz atualizada
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>JIAM Preditivo Backend</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #333; }
          .card { background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>🚀 JIAM Preditivo Backend v2.0.0</h1>
        <div class="card">
          <strong>📊 API Status:</strong> Online<br>
          <strong>📍 Porta:</strong> ${PORT}<br>
          <strong>🌍 Ambiente:</strong> ${process.env.NODE_ENV || "development"}
        </div>
        <div class="card">
          <strong>🔗 Endpoints disponíveis:</strong><br>
          • <a href="/api/health">/api/health</a> - Status do sistema<br>
          • <a href="/api/r/status">/api/r/status</a> - Status R/JS<br>
          • <a href="/api/r/processamento">/api/r/processamento</a> - Processamento de dados<br>
          • /api/auth - Autenticação<br>
          • /api/dashboard - Dashboard
        </div>
      </body>
    </html>
  `);
});

// Middleware de erro (deve ser o último)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 JIAM BACKEND v2.0.0 INICIADO");
  console.log("=".repeat(60));
  console.log(`📍 Porta: ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Frontend: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
  console.log(`📚 API: http://localhost:${PORT}/api`);
  console.log(`🔥 MongoDB: Conectado`);
  console.log("=".repeat(60));
  console.log("\n📋 ROTAS DISPONÍVEIS:");
  console.log("- GET  /api/health          → Status do sistema");
  console.log("- GET  /api/r/status        → Status R/JS");
  console.log("- POST /api/r/processamento → Processamento de dados");
  console.log("- POST /api/r/visualizacao  → Visualização de dados");
  console.log("- POST /api/r/interpretacao → Interpretação de modelos");
  console.log("- POST /api/r/modelos       → Modelos estatísticos");
  console.log("- POST /api/r/dados         → Manipulação de dados");
  console.log("- POST /api/auth/login      → Autenticação");
  console.log("=".repeat(60));
});

// Tratamento de sinais de encerramento
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM recebido. Encerrando servidor...");
  mongoose.connection.close(() => {
    console.log("✅ Conexão com MongoDB fechada");
    process.exit(0);
  });
});

module.exports = app;