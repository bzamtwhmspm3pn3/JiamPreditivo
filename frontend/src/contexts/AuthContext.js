import React, { createContext, useState } from 'react';

// Cria o contexto
export const AuthContext = createContext();

// Componente provedor do contexto
export const AuthProvider = ({ children }) => {
  // Estado do usuário e token
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);

  // Função de login: recebe objeto { usuario, token }
  const login = ({ usuario, token }) => {
    setUsuario(usuario);
    setToken(token);
    // opcional: salvar no localStorage para persistência
    localStorage.setItem("usuario", JSON.stringify(usuario));
    localStorage.setItem("token", token);
  };

  // Função de logout
  const logout = () => {
    setUsuario(null);
    setToken(null);
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
  };

  // Função para inicializar estado a partir do localStorage
  const inicializarAuth = () => {
    const storedUsuario = localStorage.getItem("usuario");
    const storedToken = localStorage.getItem("token");
    if (storedUsuario && storedToken) {
      setUsuario(JSON.parse(storedUsuario));
      setToken(storedToken);
    }
  };

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, inicializarAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

