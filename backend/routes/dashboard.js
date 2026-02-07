const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

// Todas as rotas requerem autenticação
router.use(protect);

// Dashboard
router.get('/stats', dashboardController.getDashboardStats);
router.get('/activities', dashboardController.getRecentActivities);
router.get('/models', dashboardController.getAvailableModels);
router.get('/reports', dashboardController.getReports);

module.exports = router;