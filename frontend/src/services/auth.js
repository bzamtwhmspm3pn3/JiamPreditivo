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
 * OBTER TOKEN
 * =========================
 */
export const getToken = () => {
  const session = getSession();
  return session?.token || null;
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
 * OBTER PERFIL (COM TOKEN)
 * =========================
 */
export const getUserProfile = async (userId) => {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, message: "Não autenticado" };
    }

    const response = await fetch(`${API_URL}/profile/${userId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expirado
        logout();
        return { success: false, message: "Sessão expirada" };
      }
      return { success: false, message: "Erro ao buscar perfil" };
    }

    const data = await response.json();
    return { success: true, profile: data };
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return {
      success: false,
      message: "Erro ao buscar perfil"
    };
  }
};

/**
 * =========================
 * UPLOAD DE IMAGEM
 * =========================
 */
export const uploadProfileImage = async (userId, imageFile) => {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, message: "Não autenticado" };
    }

    const formData = new FormData();
    formData.append('imagemPerfil', imageFile);

    const response = await fetch(`${API_URL}/profile/${userId}/image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
        // NÃO colocar Content-Type - o browser define com boundary
      },
      body: formData
    });

    if (!response.ok) {
      if (response.status === 401) {
        logout();
        return { success: false, message: "Sessão expirada" };
      }
      return { success: false, message: "Erro ao fazer upload" };
    }

    const data = await response.json();
    return { success: true, imageUrl: data.imageUrl };
  } catch (error) {
    console.error("Erro no upload:", error);
    return { success: false, message: "Erro ao fazer upload" };
  }
};

/**
 * =========================
 * ATUALIZAR PERFIL
 * =========================
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, message: "Não autenticado" };
    }

    console.log('📤 Enviando atualização para o backend:', updates);

    const response = await fetch(`${API_URL}/profile/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      if (response.status === 401) {
        logout();
        return { success: false, message: "Sessão expirada" };
      }
      if (response.status === 400) {
        const errorData = await response.json();
        return { success: false, message: errorData.message || "Dados inválidos" };
      }
      return { success: false, message: "Erro ao atualizar perfil" };
    }

    const data = await response.json();
    console.log('📥 Resposta do backend:', data);

    // Atualizar sessão com novos dados
    const session = getSession();
    if (session) {
      const newSession = {
        ...session,
        user: { ...session.user, ...updates }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    }

    return { success: true, profile: data };
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return {
      success: false,
      message: "Erro ao atualizar perfil"
    };
  }
};

/**
 * =========================
 * ATIVAR PRODUTO
 * =========================
 */
export const activateProduct = async (userId, codigo) => {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, message: "Não autenticado" };
    }

    const response = await fetch(`${API_URL}/profile/${userId}/activate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ codigo })
    });

    if (!response.ok) {
      if (response.status === 401) {
        logout();
        return { success: false, message: "Sessão expirada" };
      }
      if (response.status === 400) {
        const errorData = await response.json();
        return { success: false, message: errorData.message || "Código inválido" };
      }
      return { success: false, message: "Erro ao ativar produto" };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Erro ao ativar produto:", error);
    return {
      success: false,
      message: "Erro ao ativar produto"
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
    console.error("Erro ao confirmar email:", error);
    return {
      success: false,
      message: "Erro ao confirmar email"
    };
  }
};