const Profile = require('../models/Profile');
const Activity = require('../models/Activity');
const cloudinary = require('../utils/uploadService');

exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor. Tente novamente.'
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    
    // Remover campos que não podem ser atualizados
    delete updates._id;
    delete updates.user;
    delete updates.tipo;
    delete updates.identificacao;
    delete updates.tipoIdentificacao;

    // Upload de imagem se existir
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'jiam/profiles',
        width: 500,
        height: 500,
        crop: 'fill'
      });

      updates.imagemPerfil = {
        public_id: result.public_id,
        url: result.secure_url,
        secure_url: result.secure_url
      };
    }

    // Atualizar perfil
    const profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $set: updates, status: 'completo' },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil não encontrado'
      });
    }

    // Registrar atividade
    await Activity.create({
      user: req.user.id,
      tipo: 'profile_update',
      descricao: 'Perfil atualizado',
      metadata: { campos: Object.keys(updates) }
    });

    res.status(200).json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      profile
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor. Tente novamente.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.activateProduct = async (req, res) => {
  try {
    const { codigo } = req.body;
    
    const profile = await Profile.findOne({ user: req.user.id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil não encontrado'
      });
    }

    if (profile.produtoAtivo) {
      return res.status(400).json({
        success: false,
        message: 'Produto já está ativo'
      });
    }

    // Ativar produto
    await profile.ativarProduto(codigo);

    // Registrar atividade
    await Activity.create({
      user: req.user.id,
      tipo: 'product_activation',
      descricao: 'Produto ativado',
      metadata: { codigo }
    });

    res.status(200).json({
      success: true,
      message: 'Produto ativado com sucesso!',
      profile: {
        produtoAtivo: profile.produtoAtivo,
        dataAtivacao: profile.dataAtivacao,
        expiracaoAtivacao: profile.expiracaoAtivacao
      }
    });
  } catch (error) {
    console.error('Erro ao ativar produto:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.executeModel = async (req, res) => {
  try {
    const { modelo } = req.body;
    
    const profile = await Profile.findOne({ user: req.user.id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil não encontrado'
      });
    }

    // Verificar se pode executar
    if (!profile.podeExecutar()) {
      return res.status(400).json({
        success: false,
        message: 'Limite de execuções atingido. Ative o produto para continuar.'
      });
    }

    // Registrar execução
    await profile.registrarExecucao();

    // Registrar atividade
    await Activity.create({
      user: req.user.id,
      tipo: 'model_execution',
      descricao: `Execução do modelo: ${modelo}`,
      metadata: { modelo, execucoesUsadas: profile.execucoesUsadas }
    });

    // Simular execução do modelo (substituir por lógica real)
    const resultado = {
      modelo,
      data: new Date().toISOString(),
      previsao: Math.random() * 100,
      intervaloConfianca: [Math.random() * 80, Math.random() * 120],
      metricas: {
        precisao: Math.random(),
        recall: Math.random(),
        f1Score: Math.random()
      }
    };

    res.status(200).json({
      success: true,
      message: 'Modelo executado com sucesso',
      resultado,
      profile: {
        execucoesUsadas: profile.execucoesUsadas,
        limiteExecucoes: profile.limiteExecucoes,
        produtoAtivo: profile.produtoAtivo
      }
    });
  } catch (error) {
    console.error('Erro ao executar modelo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao executar modelo. Tente novamente.'
    });
  }
};