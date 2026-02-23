// src/App.jsx
import React, { useState, useEffect } from "react";

// Abas internas
import AbaQuemSomos from "./components/AbaQuemSomos";
import AbaAjuda from "./components/AbaAjuda";

import PublicMetrics from "./components/PublicMetrics";

// Footer atualizado
import FooterJIAMUpdated from "./components/FooterJIAM";

// Dashboard pós-login
import Dashboard from "./components/Dashboard";

// Modais
import LoginModal from "./components/LoginModal";
import RegisterModal from "./components/RegisterModal";

// AuthService
import { logout } from "./services/auth";

// Traduções
const translations = {
  pt: {
    iniciar: "Iniciar Sessão",
    cadastrar: "Cadastrar",
    bemVindo: "JIAM Preditivo",
    subtitulo: "Indicadores Macroeconómicos de Angola em Tempo Real",
    descricao: "Dados oficiais atualizados automaticamente do INE, BNA e FMI",
    footer: "© 2026 JIAM Preditivo. Todos os direitos reservados.",
    loginTitle: "Login para acessar a plataforma",
    usuarioPlaceholder: "Usuário",
    senhaPlaceholder: "Senha",
    entrar: "Entrar",
    recuperar: "Recuperar senha",
  },
  en: {
    iniciar: "Sign In",
    cadastrar: "Sign Up",
    bemVindo: "JIAM Predictive",
    subtitulo: "Angola's Macroeconomic Indicators in Real Time",
    descricao: "Official data auto-updated from INE, BNA and IMF",
    footer: "© 2026 JIAM Predictive. All rights reserved.",
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
function TopBar({ lang, setLang, onAuthClick, usuarioLogado, onLogout }) {
  const t = translations[lang];

  if (usuarioLogado) {
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

          {/* Nome do usuário */}
          <span className="text-white font-medium">
            {usuarioLogado.username || usuarioLogado.email}
          </span>

          {/* Botão de logout */}
          <button
            onClick={onLogout}
            className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition"
          >
            Sair
          </button>
        </div>
      </header>
    );
  }

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
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [abaAtiva, setAbaAtiva] = useState(null);
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "pt");

  // Verificar autenticação ao carregar o App
  useEffect(() => {
    const checkAuth = () => {
      console.log('🔍 Verificando autenticação no App...');
      
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('jiam_user');
      
      console.log('Token:', token ? 'Presente' : 'Ausente');
      console.log('Saved User:', savedUser ? 'Presente' : 'Ausente');
      
      if (token && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          console.log('✅ Usuário recuperado:', parsedUser);
          setUsuarioLogado(parsedUser);
        } catch (error) {
          console.error('❌ Erro ao parsear usuário:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('jiam_user');
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Guardar idioma no localStorage
  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  // Logout
  const handleLogout = () => {
    console.log('🚪 Fazendo logout...');
    
    // Limpar todos os dados de autenticação
    localStorage.removeItem('token');
    localStorage.removeItem('jiam_user');
    localStorage.removeItem('jiam_dashboard_data');
    
    // Limpar estado
    setUsuarioLogado(null);
    
    // Chamar a função logout do serviço se existir
    try {
      logout();
    } catch (error) {
      console.error('Erro no logout service:', error);
    }
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
  const handleLoginSuccess = (user, token) => {
    console.log('✅ Login bem-sucedido:', user);
    
    // Salvar no localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('jiam_user', JSON.stringify(user));
    
    // Atualizar estado
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

  const renderLanding = () => {
    const t = translations[lang];

    switch (abaAtiva) {
      case "QuemSomos":
        return <AbaQuemSomos />;
      case "Ajuda":
        return <AbaAjuda />;
      default:
        return (
          <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-[#0A1F44] to-[#1a3a6e] text-white py-12 px-6">
  <div className="container mx-auto text-center max-w-4xl">
    <h1 className="text-3xl md:text-4xl font-bold mb-3">
      {t.bemVindo}
    </h1>
    <p className="text-lg md:text-xl text-gray-300">
      {t.subtitulo}
    </p>
  </div>
</section>

<section className="container mx-auto px-4 -mt-6 pb-8">
  <PublicMetrics lang={lang} />
</section>
          </div>
        );
    }
  };

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A1F44]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00CFFF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se estiver logado, mostrar Dashboard
  if (usuarioLogado) {
    return (
      <div className="App bg-white text-[#0A1F44] min-h-screen flex flex-col">
        <TopBar 
          lang={lang} 
          setLang={setLang} 
          usuarioLogado={usuarioLogado}
          onLogout={handleLogout}
        />
        <Dashboard 
          user={usuarioLogado} 
          lang={lang} 
          onLogout={handleLogout} 
        />
      </div>
    );
  }

  // Se não estiver logado, mostrar landing page
  return (
    <div className="App bg-white text-[#0A1F44] min-h-screen flex flex-col">
      <TopBar 
        lang={lang} 
        setLang={setLang} 
        onAuthClick={handleAuthClick}
        usuarioLogado={null}
      />

      <main className="flex-1 pt-20">
        {renderLanding()}
      </main>

      <FooterJIAMUpdated setAbaAtiva={setAbaAtiva} lang={lang} />

      {/* Renderizar o modal correto baseado no authMode */}
      {showAuthModal && authMode === "login" && (
        <LoginModal
          onClose={handleCloseModal}
          lang={lang}
          onLoginSuccess={handleLoginSuccess}
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
    </div>
  );
}

export default App;