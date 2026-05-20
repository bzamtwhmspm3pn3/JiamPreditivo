 // server.js - VERSÃO CORRIGIDA E OTIMIZADA
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const path = require('path');

// Importar rotas existentes
const authRoutes = require("./routes/auth");
const avaliacaoRoutes = require("./routes/avaliacoes");
const chatbotRoutes = require("./routes/chatbot");
const profileRoutes = require('./routes/profileRoutes');
const dashboardRoutes = require("./routes/dashboard");

// 🔥 ROTAS DE MODELOS - UMA PARA API PRINCIPAL, OUTRA PARA R/JS
const modelosRoutes = require('./routes/modelos');               // API principal
const modelosRRoutes = require("./routes/r-api/modelos");       // R/JS (renomeada)
const proxyRoutes = require('./routes/proxy');

// Importar NOVAS rotas R/JS
const processamentoRoutes = require("./routes/r-api/processamento");
const visualizacaoRoutes = require("./routes/r-api/visualizacao");
const interpretacaoRoutes = require("./routes/r-api/interpretacao");
const dadosRoutes = require("./routes/r-api/dados");

// Importar middleware de erro
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// 🔥 CONFIGURAÇÃO CORS - DEVE VIR ANTES DE TUDO!
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  exposedHeaders: ['Content-Length', 'Content-Type', 'Content-Disposition'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept', 'Cache-Control'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
};

app.use(cors(corsOptions));

// 🔥 MIDDLEWARE PERSONALIZADO PARA HEADERS (AGORA DEPOIS DO CORS)
app.use((req, res, next) => {
  // Headers específicos para imagens
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'credentialless');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Content-Disposition');
  
  // Responder a requisições OPTIONS imediatamente
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Middleware de segurança
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // 🔥 PERMITIR CROSS-ORIGIN
  crossOriginEmbedderPolicy: false // 🔥 DESATIVAR PARA IMAGENS
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  message: {
    success: false,
    message: "Muitas requisições deste IP, tente novamente mais tarde."
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api", limiter);

// Middleware para parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 🔥 GARANTIR QUE TODAS AS RESPOSTAS JSON TENHAM CHARSET UTF-8
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    // Define o header com charset UTF-8
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // Chama o método original
    return originalJson.call(this, data);
  };
  next();
});

// 🔥 SERVIÇO DE ARQUIVOS ESTÁTICOS - CONFIGURAÇÃO CORRIGIDA
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || "http://localhost:3000");
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cache-Control', 'public, max-age=31536000');
  next();
}, express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1y',
  immutable: true,
  etag: true,
  lastModified: true
}));

// Conectar ao MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("🔥 MongoDB conectado com sucesso"))
  .catch((err) => {
    console.error("❌ ERRO A CONECTAR MONGO:", err);
    process.exit(1);
  });

// ============ ROTAS EXISTENTES ============
app.use("/api/auth", authRoutes);
app.use("/api/avaliacoes", avaliacaoRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/dashboard", dashboardRoutes);


// ============ ROTAS R/JS ============
app.use("/api/r/processamento", processamentoRoutes);
app.use("/api/r/visualizacao", visualizacaoRoutes);
app.use("/api/r/interpretacao", interpretacaoRoutes);
app.use("/api/r/modelos", modelosRRoutes);  // 🔥 USANDO modelosRRoutes
app.use("/api/r/dados", dadosRoutes);
app.use('/api/proxy', proxyRoutes);

// ============ ROTAS DE MODELOS (API PRINCIPAL) ============
app.use('/api/modelos', modelosRoutes);      // 🔥 USANDO modelosRoutes

// Rota de saúde
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
      r_dados: "/api/r/dados",
      modelos: "/api/modelos"  // 🔥 NOVA ROTA
    }
  });
});

// Rota de status R/JS
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

// Rota raiz
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
          • /api/auth - Autenticação<br>
          • /api/dashboard - Dashboard<br>
          • /api/modelos - Gestão de modelos (salvar, listar, arquivar)
        </div>
      </body>
    </html>
  `);
});

// Middleware de erro (deve ser o último)
app.use(errorHandler);

// Iniciar servidor
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
  console.log("- POST /api/r/dados         → Manipulação de dados");
  console.log("- POST /api/auth/login      → Autenticação");
  console.log("- GET  /api/profile/:userId → Buscar perfil do usuário");
  console.log("- PUT  /api/profile/:userId → Atualizar perfil");
  console.log("- POST /api/profile/:userId/image → Upload de imagem");
  console.log("- POST /api/profile/:userId/activate → Ativar produto");
  console.log("\n📋 ROTAS DE MODELOS (API PRINCIPAL):");
  console.log('- POST /api/modelos/salvar        → Salvar modelo');
  console.log('- GET  /api/modelos/listar/:userId → Listar modelos do usuário');
  console.log('- GET  /api/modelos/carregar/:userId/:modeloId → Carregar modelo completo');
  console.log('- PUT  /api/modelos/status/:userId/:modeloId → Arquivar/Restaurar');
  console.log('- DELETE /api/modelos/eliminar/:userId/:modeloId → Eliminar modelo');
  console.log('- GET  /api/modelos/estatisticas/:userId → Estatísticas do usuário');
  console.log('- GET  /api/modelos/backup/:userId → Backup completo');
  console.log('- POST /api/modelos/arquivar-antigos/:userId → Arquivar modelos antigos');
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