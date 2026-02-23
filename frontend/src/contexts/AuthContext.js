// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { getSession, logout as authLogout } from '../services/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inicializarAuth();
  }, []);

  const inicializarAuth = () => {
    const session = getSession();
    if (session?.token && session?.user) {
      setUsuario(session.user);
      setToken(session.token);
      apiClient.setToken(session.token);
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    try {
      const data = await apiClient.login(credentials);
      if (data.success && data.token && data.user) {
        setUsuario(data.user);
        setToken(data.token);
        apiClient.setToken(data.token);
        
        // Salvar no localStorage via auth.js
        const session = {
          token: data.token,
          user: data.user,
          timestamp: Date.now()
        };
        localStorage.setItem('jiam_user_session', JSON.stringify(session));
      }
      return data;
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    setUsuario(null);
    setToken(null);
    apiClient.removeToken();
    authLogout(); // limpa localStorage
  };

  const updateUser = (userData) => {
    setUsuario(prev => ({ ...prev, ...userData }));
    
    // Atualizar na sessão
    const session = getSession();
    if (session) {
      const newSession = {
        ...session,
        user: { ...session.user, ...userData }
      };
      localStorage.setItem('jiam_user_session', JSON.stringify(newSession));
    }
  };

  return (
    <AuthContext.Provider value={{
      usuario,
      token,
      loading,
      login,
      logout,
      updateUser,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
};