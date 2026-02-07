// services/r-service.js
const axios = require('axios');

class RService {
  constructor() {
    this.baseURL = process.env.R_API_URL || 'http://localhost:8000';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000
    });
  }

  async checkHealth() {
    try {
      const response = await this.client.get('/health');
      return {
        ok: true,
        data: response.data
      };
    } catch (error) {
      return {
        ok: false,
        error: error.message
      };
    }
  }

  async interpretModel(model, data) {
    try {
      const response = await this.client.post('/interpretar', {
        modelo: model,
        dados: data
      });
      return response.data;
    } catch (error) {
      console.error('R service error:', error.message);
      throw new Error(`R service unavailable: ${error.message}`);
    }
  }

  async processWithR(endpoint, data) {
    try {
      const response = await this.client.post(endpoint, data);
      return response.data;
    } catch (error) {
      throw new Error(`R processing failed: ${error.message}`);
    }
  }

  isAvailable() {
    return process.env.USE_R_PLUMBER === 'true';
  }
}

module.exports = new RService();