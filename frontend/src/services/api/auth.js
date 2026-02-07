// src/services/auth.js

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const STORAGE_KEY = "jiam_user_session";

/**
 * =========================
 * REGISTRO DE USUÁRIO
 * =========================
 */
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro no registro:", error);
    return {
      success: false,
      message: "Erro ao conectar com o servidor"
    };
  }
};

/**
 * =========================
 * LOGIN
 * =========================
 */
export const loginUser = async ({ username, password }) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (data.success && data.token && data.user) {
      const session = {
        token: data.token,
        user: data.user,
        isAuthenticated: true,
        timestamp: Date.now()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }

    return data;
  } catch (error) {
    console.error("Erro no login:", error);
    return {
      success: false,
      message: "Erro ao conectar com o servidor"
    };
  }
};

/**
 * =========================
 * OBTER SESSÃO ATUAL
 * =========================
 */
export const getSession = () => {
  try {
    const session = localStorage.getItem(STORAGE_KEY);
    if (!session) return null;

    const data = JSON.parse(session);

    // Sessão expira em 7 dias
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > maxAge) {
      logout();
      return null;
    }

    return data;
  } catch (error) {
    console.error("Erro ao obter sessão:", error);
    return null;
  }
};

/**
 * =========================
 * LOGOUT
 * =========================
 */
export const logout = () => {
  localStorage.removeItem(STORAGE_KEY);
  return { success: true };
};

/**
 * =========================
 * RECUPERAÇÃO DE SENHA
 * ⚠️ ATENÇÃO:
 * O BACKEND AINDA NÃO TEM ESTA ROTA
 * =========================
 */
export const recoverPassword = async (email) => {
  try {
    const response = await fetch(`${API_URL}/auth/recover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: "Funcionalidade ainda não disponível"
    };
  }
};

/**
 * =========================
 * OBTER PERFIL (rota real)
 * =========================
 */
export const getUserProfile = async () => {
  try {
    const session = getSession();
    if (!session?.token) {
      return { success: false, message: "Não autenticado" };
    }

    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${session.token}`
      }
    });

    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: "Erro ao buscar perfil"
    };
  }
};

/**
 * =========================
 * ATUALIZAR PERFIL
 * (rota /api/profile — já existe no server)
 * =========================
 */
export const updateUserProfile = async (updates) => {
  try {
    const session = getSession();
    if (!session?.token) {
      return { success: false, message: "Não autenticado" };
    }

    const response = await fetch(`${API_URL}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`
      },
      body: JSON.stringify(updates)
    });

    const data = await response.json();

    if (data.success) {
      const newSession = {
        ...session,
        user: { ...session.user, ...updates }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    }

    return data;
  } catch (error) {
    return {
      success: false,
      message: "Erro ao atualizar perfil"
    };
  }
};

/**
 * =========================
 * CONFIRMAR EMAIL
 * =========================
 */
export const confirmEmail = async (token) => {
  try {
    const response = await fetch(`${API_URL}/auth/confirm-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token })
    });

    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: "Erro ao confirmar email"
    };
  }
};
