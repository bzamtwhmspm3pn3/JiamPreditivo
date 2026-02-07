import React, { createContext, useContext, useState } from 'react';
import { Cpu, Database, BarChart2, Users } from 'lucide-react';

// --- Cores globais ---
export const COLORS = {
  primaryBg: 'bg-gray-100',
  secondaryBg: 'bg-white',
  text: 'text-gray-800',
};

// --- Header de painel ---
export const PanelHeader = ({ icon: Icon, title, description }) => (
  <div className="mb-6">
    <div className="flex items-center space-x-3">
      <Icon className="w-6 h-6" />
      <h2 className="text-xl font-bold">{title}</h2>
    </div>
    <p className="text-gray-500">{description}</p>
  </div>
);

// --- Hook de tradução (simples placeholder) ---
export const useTranslation = () => {
  const t = (key) => key; // Substitua por i18n real se tiver
  return { t };
};

// --- AuthContext opcional ---
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);

  const login = ({ usuario, token }) => {
    setUsuario(usuario);
    setToken(token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setUsuario(null);
    setToken(null);
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
