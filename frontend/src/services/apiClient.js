// src/services/apiClient.js
import api from './api';
import { getToken } from './auth';

class ApiClient {
  constructor() {
    this.api = api;
  }

  getAuthHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  setToken(token) {
    if (this.api.axios) {
      this.api.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }

  removeToken() {
    if (this.api.axios) {
      delete this.api.axios.defaults.headers.common['Authorization'];
    }
  }

  // =========================
  // PERFIL
  // =========================
  async getProfile(userId) {
    try {
      const response = await this.api.axios.get(`/profile/${userId}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw this.api.handleError(error);
    }
  }

  async updateProfile(userId, profileData) {
    try {
      const response = await this.api.axios.put(`/profile/${userId}`, profileData, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw this.api.handleError(error);
    }
  }

  async uploadProfileImage(userId, formData) {
    try {
      const response = await this.api.axios.post(`/profile/${userId}/image`, formData, {
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw this.api.handleError(error);
    }
  }

  async activateProduct(userId, codigo) {
    try {
      const response = await this.api.axios.post(`/profile/${userId}/activate`, { codigo }, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw this.api.handleError(error);
    }
  }

  // =========================
  // MODELOS
  // =========================
  async executarModelo(tipo, dados, parametros) {
    return this.api.executarModelo(tipo, dados, parametros);
  }

  async getModelosDisponiveis() {
    return this.api.getModelosDisponiveis();
  }

  async testConnection() {
    return this.api.testConnection();
  }

  // =========================
  // MODELOS ATUARIAIS
  // =========================
  async executarMonteCarlo(dados, parametros) {
    return this.api.executarMonteCarlo(dados, parametros);
  }

  async executarMarkov(dados, parametros) {
    return this.api.executarMarkov(dados, parametros);
  }

  async criarTabuaMortalidade(parametros) {
    return this.api.criarTabuaMortalidade(parametros);
  }

  async executarCredibilidadeAPosteriori(dados, parametros) {
    return this.api.executarCredibilidadeAPosteriori(dados, parametros);
  }

  // =========================
  // DATA MINING
  // =========================
  async executarDataMining(tipo, dados, parametros) {
    return this.api.executarDataMining(tipo, dados, parametros);
  }
}

export default new ApiClient();
