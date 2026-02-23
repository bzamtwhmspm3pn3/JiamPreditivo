const express = require('express');
const router = express.Router();
const Profile = require('../models/profile');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// =========================
// GET /api/profile/:userId - Buscar perfil
// =========================
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificar se o usuário está acessando seu próprio perfil
    if (req.user.id !== userId && req.user.userId !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    let profile = await Profile.findOne({ user: userId });
    
    if (!profile) {
      // Criar perfil básico se não existir
      const user = await User.findById(userId);
      profile = new Profile({
        user: userId,
        nome: user?.username || '',
        email: user?.email || '',
        tipo: 'individual',
        status: 'incompleto'
      });
      await profile.save();
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
// PUT /api/profile/:userId - Atualizar perfil
// =========================
router.put('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificar permissão
    if (req.user.id !== userId && req.user.userId !== userId && req.user._id !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    console.log('📥 Recebendo atualização:', req.body);
    
    // Preparar dados para atualização
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    // Remover campos que não devem ser atualizados diretamente
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    
    // Atualizar ou criar perfil
    const profile = await Profile.findOneAndUpdate(
      { user: userId },
      updateData,
      { 
        new: true,           // Retorna o documento atualizado
        upsert: true,        // Cria se não existir
        runValidators: true,  // Executa validações
        setDefaultsOnInsert: true
      }
    );
    
    console.log('✅ Perfil atualizado:', profile._id);
    res.json(profile);
    
  } catch (error) {
    console.error('❌ Erro ao atualizar perfil:', error);
    
    // Tratar erro de validação
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Erro de validação', 
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// =========================
// POST /api/profile/:userId/image - Upload de imagem
// =========================
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Apenas imagens são permitidas'));
  }
});

router.post('/:userId/image', authenticateToken, upload.single('imagemPerfil'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user.id !== userId && req.user.userId !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    
    const profile = await Profile.findOneAndUpdate(
      { user: userId },
      { 
        imagemPerfil: { url: imageUrl },
        updatedAt: Date.now()
      },
      { new: true, upsert: true }
    );
    
    res.json({ 
      success: true, 
      imageUrl,
      profile 
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
// POST /api/profile/:userId/activate - Ativar produto
// =========================
router.post('/:userId/activate', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { codigo } = req.body;
    
    const codigosValidos = ['JIAM2025', 'JIAM2024', 'JIAM2023'];
    
    if (!codigosValidos.includes(codigo)) {
      return res.status(400).json({ error: 'Código de ativação inválido' });
    }
    
    const profile = await Profile.findOneAndUpdate(
      { user: userId },
      { 
        produtoAtivo: true,
        dataAtivacao: new Date(),
        expiracaoAtivacao: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      { new: true, upsert: true }
    );
    
    res.json({ success: true, profile });
  } catch (error) {
    console.error('Erro ao ativar produto:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;