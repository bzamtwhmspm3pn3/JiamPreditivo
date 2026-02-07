const User = require('../models/user');
const Profile = require('../models/profile');
const Activity = require('../models/activity');
const { generateToken } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const crypto = require('crypto');

exports.register = async (req, res) => {
  try {
    const {
      email,
      password,
      nome,
      tipo,
      nomeOrganizacao,
      identificacao,
      data,
      telefone,
      imagemPerfil
    } = req.body;

    // Verificar se email já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Este email já está registrado'
      });
    }

    // Verificar se identificação já existe
    const existingProfile = await Profile.findOne({ identificacao });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: tipo === 'individual' ? 'Este BI já está registrado' : 'Este NIF já está registrado'
      });
    }

    // Criar usuário
    const username = email.split('@')[0];
    const user = await User.create({
      username,
      email,
      password,
      role: tipo === 'organizacao' ? 'organizacao' : 'user'
    });

    // Determinar tipo de identificação
    const tipoIdentificacao = tipo === 'individual' ? 'BI' : 'NIF';
    
    // Preparar dados do perfil
    const profileData = {
      user: user._id,
      tipo,
      nome,
      identificacao,
      tipoIdentificacao,
      telefone,
      imagemPerfil: imagemPerfil || null
    };

    if (tipo === 'individual') {
      profileData.dataNascimento = data;
    } else {
      profileData.dataFundacao = data;
      profileData.nomeOrganizacao = nomeOrganizacao;
    }

    // Criar perfil
    const profile = await Profile.create(profileData);

    // Gerar token de verificação
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Enviar email de verificação
    await sendVerificationEmail(user.email, verificationToken);

    // Registrar atividade
    await Activity.create({
      user: user._id,
      tipo: 'register',
      descricao: 'Novo usuário registrado',
      metadata: { tipo, email }
    });

    // Gerar token JWT
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registro realizado com sucesso! Verifique seu email para confirmar a conta.',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status
      },
      profile: {
        nome: profile.nome,
        tipo: profile.tipo,
        status: profile.status
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor. Tente novamente.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Buscar usuário por email ou username
    const user = await User.findOne({
      $or: [{ email: username }, { username: username }]
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Verificar se a conta está bloqueada
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Conta temporariamente bloqueada. Tente novamente em 1 hora.'
      });
    }

    // Verificar senha
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Incrementar tentativas falhas
      await user.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Resetar tentativas de login após sucesso
    await user.updateOne({
      loginAttempts: 0,
      $unset: { lockUntil: 1 }
    });

    // Atualizar último login
    user.lastLogin = new Date();
    await user.save();

    // Buscar perfil
    const profile = await Profile.findOne({ user: user._id });

    // Gerar token
    const token = generateToken(user);

    // Registrar atividade
    await Activity.create({
      user: user._id,
      tipo: 'login',
      descricao: 'Login realizado',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        nome: profile?.nome,
        tipo: profile?.tipo,
        imagem_perfil: profile?.imagemPerfil?.url
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor. Tente novamente.'
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Hash do token recebido
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Buscar usuário com token válido
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    // Atualizar usuário
    user.emailVerified = true;
    user.status = 'active';
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Atualizar status do perfil
    await Profile.findOneAndUpdate(
      { user: user._id },
      { $set: { status: 'completo' } }
    );

    // Registrar atividade
    await Activity.create({
      user: user._id,
      tipo: 'email_verification',
      descricao: 'Email verificado',
      metadata: { email: user.email }
    });

    res.status(200).json({
      success: true,
      message: 'Email verificado com sucesso! Agora você pode fazer login.'
    });

  } catch (error) {
    console.error('Erro na verificação de email:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor. Tente novamente.'
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email não encontrado'
      });
    }

    // Gerar token de reset
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Enviar email de reset
    await sendPasswordResetEmail(user.email, resetToken);

    // Registrar atividade
    await Activity.create({
      user: user._id,
      tipo: 'password_reset',
      descricao: 'Solicitação de reset de senha',
      metadata: { email: user.email }
    });

    res.status(200).json({
      success: true,
      message: 'Email de recuperação enviado com sucesso'
    });

  } catch (error) {
    console.error('Erro no forgot password:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor. Tente novamente.'
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash do token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Buscar usuário
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    // Atualizar senha
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Registrar atividade
    await Activity.create({
      user: user._id,
      tipo: 'password_reset',
      descricao: 'Senha redefinida com sucesso',
      metadata: { email: user.email }
    });

    res.status(200).json({
      success: true,
      message: 'Senha redefinida com sucesso! Faça login com a nova senha.'
    });

  } catch (error) {
    console.error('Erro no reset password:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor. Tente novamente.'
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const profile = await Profile.findOne({ user: req.user.id });

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        nome: profile?.nome,
        tipo: profile?.tipo,
        imagem_perfil: profile?.imagemPerfil?.url,
        produtoAtivo: profile?.produtoAtivo,
        execucoesUsadas: profile?.execucoesUsadas
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor. Tente novamente.'
    });
  }
};