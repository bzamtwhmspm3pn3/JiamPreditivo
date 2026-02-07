// src/App.jsx
import React, { useState, useEffect } from "react";

// Abas internas
import AbaQuemSomos from "./components/AbaQuemSomos";
import AbaAjuda from "./components/AbaAjuda";

// Landing import
import FreeLanding from "./components/FreeLanding";

// Footer atualizado
import FooterJIAMUpdated from "./components/FooterJIAM";

// Dashboard pós-login
import Dashboard from "./components/Dashboard";

// Modais
import LoginModal from "./components/LoginModal";
import RegisterModal from "./components/RegisterModal";

// AuthService
import { getSession, logout } from "./services/auth";

// Traduções
const translations = {
  pt: {
    iniciar: "Iniciar Sessão",
    cadastrar: "Cadastrar",
    indicadores: "Indicadores Macroeconómicos",
    indicadoresDesc: "Visualize previsões em tempo real de inflação, PIB, desemprego e outros indicadores críticos.",
    historicos: "Análise de Dados Históricos",
    historicosDesc: "Acesse dados históricos e veja tendências para apoiar decisões estratégicas.",
    modelos: "Modelos Preditivos",
    modelosDesc: "Saiba como nossos modelos estatísticos e de Machine Learning prevêem cenários futuros.",
    bemVindo: "Bem-vindo ao JIAM Preditivo",
    selecioneOpcao: "Escolha uma opção para explorar a plataforma:",
    footer: "© 2025 JIAM Preditivo. Todos os direitos reservados.",
    loginTitle: "Login para acessar a plataforma",
    usuarioPlaceholder: "Usuário",
    senhaPlaceholder: "Senha",
    entrar: "Entrar",
    recuperar: "Recuperar senha",
  },
  en: {
    iniciar: "Sign In",
    cadastrar: "Sign Up",
    indicadores: "Macroeconomic Indicators",
    indicadoresDesc: "View real-time forecasts for inflation, GDP, unemployment, and other critical indicators.",
    historicos: "Historical Data Analysis",
    historicosDesc: "Access historical data and see trends to support strategic decisions.",
    modelos: "Predictive Models",
    modelosDesc: "Learn how our statistical and Machine Learning models forecast future scenarios.",
    bemVindo: "Welcome to JIAM Predictive",
    selecioneOpcao: "Choose an option to explore the platform:",
    footer: "© 2025 JIAM Predictive. All rights reserved.",
    loginTitle: "Login to access the platform",
    usuarioPlaceholder: "Username",
    senhaPlaceholder: "Password",
    entrar: "Enter",
    recuperar: "Recover password",
  },
};

/* ============================
   TOPBAR
============================ */
function TopBar({ lang, setLang, onAuthClick }) {
  const t = translations[lang];

  return (
    <header className="fixed w-full z-50 flex items-center justify-between p-4 bg-[#0A1F44] shadow-lg">
      <div className="text-2xl font-bold text-white">JIAM Preditivo</div>

      <div className="flex items-center gap-4">
        {/* SELECT MULTILINGUE */}
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="rounded-lg p-2 bg-white text-[#0A1F44] focus:outline-none focus:ring-2 focus:ring-[#00CFFF]"
        >
          <option value="pt">Português 🇦🇴</option>
          <option value="en">English 🇺🇸</option>
        </select>

        {/* BOTÃO DE LOGIN/CADASTRO */}
        <button
          onClick={onAuthClick}
          className="bg-[#00CFFF] text-[#0A1F44] font-bold py-2 px-4 rounded-lg hover:bg-[#00E0FF] transition"
        >
          {t.iniciar} / {t.cadastrar}
        </button>
      </div>
    </header>
  );
}

/* ============================
   APP PRINCIPAL
============================ */
function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(getSession());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" ou "register"
  const [abaAtiva, setAbaAtiva] = useState(null);
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "pt");

  // Guardar idioma no localStorage
  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  // Logout
  const handleLogout = () => {
    logout();
    setUsuarioLogado(null);
  };

  // Abrir modal de autenticação
  const handleAuthClick = () => {
    setAuthMode("login");
    setShowAuthModal(true);
  };

  // Mudar para modo de cadastro
  const handleSwitchToRegister = () => {
    setAuthMode("register");
  };

  // Mudar para modo de login
  const handleSwitchToLogin = () => {
    setAuthMode("login");
  };

  // Sucesso no login
  const handleLoginSuccess = (user) => {
    setUsuarioLogado(user);
    setShowAuthModal(false);
  };

  // Sucesso no cadastro
  const handleRegisterSuccess = () => {
    setAuthMode("login");
    alert("Cadastro realizado com sucesso! Agora faça login.");
  };

  // Fechar modal
  const handleCloseModal = () => {
    setShowAuthModal(false);
  };

  // Renderiza abas padrão do landing page
  const renderLanding = () => {
    switch (abaAtiva) {
      case "QuemSomos":
        return <AbaQuemSomos />;
      case "Ajuda":
        return <AbaAjuda />;
      default:
        return <FreeLanding lang={lang} translations={translations} />;
    }
  };

  if (usuarioLogado) {
    return <Dashboard user={usuarioLogado} lang={lang} onLogout={handleLogout} />;
  }

  return (
    <div className="App bg-white text-[#0A1F44] min-h-screen flex flex-col">
      <TopBar 
        lang={lang} 
        setLang={setLang} 
        onAuthClick={handleAuthClick}
      />

      <div className="flex-1 w-full pt-16">{renderLanding()}</div>

      {/* Renderizar o modal correto baseado no authMode */}
      {showAuthModal && authMode === "login" && (
        <LoginModal
          onClose={handleCloseModal}
          lang={lang}
          onAuth={handleLoginSuccess}
          onSwitchToRegister={handleSwitchToRegister}
        />
      )}

      {showAuthModal && authMode === "register" && (
        <RegisterModal
          onClose={handleCloseModal}
          lang={lang}
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}

      <FooterJIAMUpdated setAbaAtiva={setAbaAtiva} lang={lang} />
    </div>
  );
}

export default App;