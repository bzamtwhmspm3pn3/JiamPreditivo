// src/components/LoginModal.jsx
import React, { useState } from "react";
import { loginUser } from "../services/auth";

export default function LoginModal({ onClose, lang, onLoginSuccess, onSwitchToRegister }) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);

  const translations = {
    pt: {
      loginTitle: "Login para acessar a plataforma", 
      usuarioPlaceholder: "Usuário ou Email", 
      senhaPlaceholder: "Senha", 
      entrar: "Entrar", 
      cadastrar: "Cadastrar", 
      naoTemConta: "Não tem conta?",
      processando: "Entrando..."
    },
    en: {
      loginTitle: "Login to access the platform", 
      usuarioPlaceholder: "Username or Email", 
      senhaPlaceholder: "Password", 
      entrar: "Enter", 
      cadastrar: "Sign Up", 
      naoTemConta: "Don't have an account?",
      processando: "Logging in..."
    }
  };
  
  const t = translations[lang] || translations.pt;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem("");
    setLoading(true);

    try {
      console.log('📝 Tentando login com:', usuario);
      
      const result = await loginUser({ username: usuario, password: senha });
      console.log('📊 Resultado do login:', result);
      
      if (!result.success) {
        setMensagem(result.message);
        setLoading(false);
        return;
      }
      
      if (!result.user) {
        setMensagem("Erro ao receber os dados do usuário. Tente novamente.");
        setLoading(false);
        return;
      }

      if (!result.token) {
        setMensagem("Token não recebido do servidor.");
        setLoading(false);
        return;
      }

      // Estruturar os dados do usuário de forma consistente
      const userData = {
        id: result.user.id || result.user._id,
        userId: result.user.id || result.user._id,
        _id: result.user.id || result.user._id,
        username: result.user.name || result.user.username || usuario.split('@')[0],
        email: result.user.email || usuario,
        role: result.user.role || 'user',
        email_confirmado: result.user.email_confirmado || false
      };

      console.log('✅ Login bem-sucedido, userData:', userData);
      
      // Chamar o callback com os dados do usuário e token
      onLoginSuccess(userData, result.token);
      
      // Fechar o modal
      onClose();
      
    } catch (error) {
      console.error('❌ Erro no login:', error);
      setMensagem("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#0A1F44] p-10 rounded-3xl text-white w-96 max-w-md">
        <div className="flex justify-center mb-4">
          <img src="/logojiam.png" className="h-16 w-16" alt="JIAM Logo" onError={(e) => e.target.style.display = 'none'} />
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-2">JIAM Preditivo</h1>
        <p className="text-center mb-6 text-gray-300">{t.loginTitle}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder={t.usuarioPlaceholder} 
            value={usuario} 
            onChange={e => setUsuario(e.target.value)} 
            autoComplete="username" 
            className="p-3 rounded-lg bg-white/20 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-[#00CFFF]" 
            required
            disabled={loading}
          />
          
          <input 
            type="password" 
            placeholder={t.senhaPlaceholder} 
            value={senha} 
            onChange={e => setSenha(e.target.value)} 
            autoComplete="current-password" 
            className="p-3 rounded-lg bg-white/20 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-[#00CFFF]" 
            required
            disabled={loading}
          />
          
          {mensagem && (
            <p className="p-2 rounded text-sm bg-red-900/50 text-red-300">
              {mensagem}
            </p>
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            className="bg-[#00CFFF] text-[#0A1F44] font-bold py-3 rounded-lg hover:bg-[#00E0FF] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t.processando : t.entrar}
          </button>

          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-gray-400">{t.naoTemConta}</span>
            <button 
              type="button" 
              onClick={onSwitchToRegister} 
              className="text-[#00CFFF] font-semibold hover:underline"
              disabled={loading}
            >
              {t.cadastrar}
            </button>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="text-center text-gray-400 hover:text-white transition mt-4"
            disabled={loading}
          >
            Fechar
          </button>
        </form>
      </div>
    </div>
  );
}