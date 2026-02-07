// src/services/storage.js
export const saveUserData = (userId, data) => {
  try {
    const key = `jiam_user_${userId}_data`;
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Erro ao salvar dados do usuário:', error);
    return false;
  }
};

export const loadUserData = (userId) => {
  try {
    const key = `jiam_user_${userId}_data`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Erro ao carregar dados do usuário:', error);
    return null;
  }
};

export const saveSessionData = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Erro ao salvar dados da sessão:', error);
    return false;
  }
};

export const loadSessionData = (key) => {
  try {
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Erro ao carregar dados da sessão:', error);
    return null;
  }
};

export const clearUserData = (userId) => {
  try {
    const key = `jiam_user_${userId}_data`;
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Erro ao limpar dados do usuário:', error);
    return false;
  }
};

export const isOnline = () => navigator.onLine;