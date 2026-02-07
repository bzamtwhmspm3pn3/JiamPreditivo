// services/export-service.js
class ExportService {
  exportarGrafico(config, formato) {
    return {
      success: true,
      formato: formato,
      mensagem: 'Exportação simulada'
    };
  }
}
module.exports = new ExportService();