const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Verificar se o token está no header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado. Faça login para acessar.'
      });
    }
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }
    
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Conta não ativa. Verifique seu email ou entre em contato com o suporte.'
      });
    }
    
    // Verificar se a conta está bloqueada
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Conta temporariamente bloqueada. Tente novamente mais tarde.'
      });
    }
    
    // Adicionar usuário ao request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido ou expirado.'
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acesso negado. Apenas ${roles.join(', ')} podem acessar este recurso.`
      });
    }
    next();
  };
};

exports.generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};