// frontend/src/services/api/r-api.js

const R_API_URL = process.env.REACT_APP_R_API_URL || "http://localhost:8000";

class RAPIClient {
  constructor() {
    this.baseURL = R_API_URL;
    this.token = localStorage.getItem('jiam_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('jiam_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('jiam_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`
        }));
        throw new Error(error.message || 'Erro na requisição');
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/api/health');
  }

  // Auth
  async login(email, password) {
    const result = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (result.success && result.token) {
      this.setToken(result.token);
      localStorage.setItem('jiam_user', JSON.stringify(result.user));
    }

    return result;
  }

  async verifyToken() {
    if (!this.token) return { success: false, message: 'No token' };
    
    try {
      return await this.request('/api/auth/verify');
    } catch {
      this.clearToken();
      return { success: false, message: 'Token inválido' };
    }
  }

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
      localStorage.removeItem('jiam_user');
    }
  }

  // Data operations
  async uploadData(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/api/data/upload`, {
      method: 'POST',
      body: formData,
      headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {},
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `Upload failed: ${response.status}`
      }));
      throw new Error(error.message);
    }

    return await response.json();
  }

  async getDataInfo(dataId) {
    return this.request(`/api/data/${dataId}/info`);
  }

  async getDataPreview(dataId, rows = 10) {
    return this.request(`/api/data/${dataId}/preview?rows=${rows}`);
  }

  async getDataStats(dataId) {
    return this.request(`/api/data/${dataId}/stats`);
  }

  // Actuarial models
  async runActuarialModel(data) {
    return this.request('/api/models/actuarial/run', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async predictWithModel(modelId, newData) {
    return this.request(`/api/models/${modelId}/predict`, {
      method: 'POST',
      body: JSON.stringify({ new_data: newData })
    });
  }

  async calculatePremium(data) {
    return this.request('/api/actuarial/premium', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Charts
  async generateChart(data) {
    return this.request('/api/charts/generate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

// Singleton instance
const rAPI = new RAPIClient();
export default rAPI;