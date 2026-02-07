// services/dataviz-service.js
class DataVizService {
  analisarPadroes(dados) {
    return {
      success: true,
      padroes: [],
      insights: []
    };
  }
}
module.exports = new DataVizService();