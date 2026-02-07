const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const profileController = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const { upload } = require('../utils/uploadService');
const { validate } = require('../middleware/validation');

// Validações
const updateProfileValidation = [
  body('nome').optional().trim().notEmpty(),
  body('telefone').optional().trim().notEmpty(),
  body('endereco.provincia').optional().trim(),
  body('endereco.municipio').optional().trim(),
  body('endereco.bairro').optional().trim(),
  body('dadosAdicionais.areaAtuacao').optional().trim(),
  body('configuracoes.privacidadePerfil').optional().isIn(['publico', 'privado', 'somente_contatos'])
];

const activateProductValidation = [
  body('codigo').notEmpty().trim()
];

const executeModelValidation = [
  body('modelo').notEmpty().trim()
];

// Todas as rotas requerem autenticação
router.use(protect);

// Rotas de perfil
router.get('/', profileController.getProfile);
router.put('/', 
  upload.single('imagemPerfil'), // agora funciona
  validate(updateProfileValidation),
  profileController.updateProfile
);
// Rotas de produto
router.post('/activate-product', 
  validate(activateProductValidation),
  profileController.activateProduct
);

// Rotas de modelos
router.post('/execute-model',
  validate(executeModelValidation),
  profileController.executeModel
);

module.exports = router;