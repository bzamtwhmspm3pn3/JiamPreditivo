// middleware/validation.js
const { body, validationResult } = require('express-validator');

// Middleware de validação de requisição genérica
exports.validateRequest = (req, res, next) => {
  // Validação básica para POST requests
  if (req.method === 'POST' || req.method === 'PUT') {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Corpo da requisição não pode ser vazio'
      });
    }
  }
  next();
};

// Middleware para validação de arquivo
exports.validateFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Nenhum arquivo enviado'
    });
  }
  
  // Validações adicionais do arquivo
  const allowedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json'
  ];
  
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'Tipo de arquivo não suportado'
    });
  }
  
  next();
};

// Middleware genérico para validar arrays de validações
exports.validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));
    
    return res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors: extractedErrors
    });
  };
};

// Validações específicas para o registro de utilizador
exports.registerValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password')
    .isLength({ min: 8 }).withMessage('Senha deve ter pelo menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter letras maiúsculas, minúsculas e números'),
  body('nome').notEmpty().withMessage('Nome é obrigatório'),
  body('tipo').isIn(['individual', 'organizacao']).withMessage('Tipo inválido'),
  body('identificacao').notEmpty().withMessage('Identificação é obrigatória'),
  body('telefone').notEmpty().withMessage('Telefone é obrigatório'),
  body('data').notEmpty().withMessage('Data é obrigatória')
];