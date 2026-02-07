const Profile = require('../models/profile');
const Activity = require('../models/activity');

exports.getDashboardStats = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil não encontrado'
      });
    }

    // Buscar atividades recentes
    const activities = await Activity.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('tipo descricao createdAt');

    const stats = {
      profile: {
        nome: profile.nome,
        tipo: profile.tipo,
        status: profile.status,
        produtoAtivo: profile.produtoAtivo,
        execucoesUsadas: profile.execucoesUsadas,
        limiteExecucoes: profile.limiteExecucoes,
        dataRegistro: profile.createdAt
      },
      usage: {
        execucoesRestantes: profile.produtoAtivo ? 'Ilimitado' : profile.limiteExecucoes - profile.execucoesUsadas,
        percentualUso: profile.produtoAtivo ? 0 : (profile.execucoesUsadas / profile.limiteExecucoes) * 100
      },
      models: {
        total: 6,
        disponiveis: ['Inflação', 'PIB', 'Desemprego', 'Câmbio', 'Juros', 'Balança Comercial']
      },
      activities: activities
    };

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor. Tente novamente.'
    });
  }
};

exports.getRecentActivities = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const activities = await Activity.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('tipo descricao createdAt metadata');

    res.status(200).json({
      success: true,
      activities
    });
  } catch (error) {
    console.error('Erro ao buscar atividades:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor. Tente novamente.'
    });
  }
};

exports.getAvailableModels = async (req, res) => {
  try {
    const models = [
      {
        id: 1,
        nome: 'Inflação',
        descricao: 'Previsão da taxa de inflação para os próximos 12 meses',
        tipo: 'série_temporal',
        precisa_treinamento: false,
        ultima_execucao: null,
        precisao: 0.92
      },
      {
        id: 2,
        nome: 'PIB',
        descricao: 'Previsão do Produto Interno Bruto trimestral',
        tipo: 'regressao',
        precisa_treinamento: false,
        ultima_execucao: null,
        precisao: 0.88
      },
      {
        id: 3,
        nome: 'Taxa de Desemprego',
        descricao: 'Previsão da taxa de desemprego',
        tipo: 'série_temporal',
        precisa_treinamento: false,
        ultima_execucao: null,
        precisao: 0.85
      },
      {
        id: 4,
        nome: 'Taxa de Câmbio',
        descricao: 'Previsão da taxa de câmbio USD/AOA',
        tipo: 'série_temporal',
        precisa_treinamento: false,
        ultima_execucao: null,
        precisao: 0.78
      },
      {
        id: 5,
        nome: 'Taxa de Juros',
        descricao: 'Previsão da taxa básica de juros',
        tipo: 'regressao',
        precisa_treinamento: false,
        ultima_execucao: null,
        precisao: 0.82
      },
      {
        id: 6,
        nome: 'Balança Comercial',
        descricao: 'Previsão do saldo da balança comercial',
        tipo: 'regressao',
        precisa_treinamento: false,
        ultima_execucao: null,
        precisao: 0.76
      }
    ];

    res.status(200).json({
      success: true,
      models
    });
  } catch (error) {
    console.error('Erro ao buscar modelos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor. Tente novamente.'
    });
  }
};

exports.getReports = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil não encontrado'
      });
    }

    const reports = [
      {
        id: 1,
        titulo: 'Relatório de Uso',
        descricao: 'Resumo das execuções e atividades',
        tipo: 'uso',
        data: new Date().toISOString(),
        downloadUrl: `/api/reports/usage/${profile._id}`
      },
      {
        id: 2,
        titulo: 'Relatório de Previsões',
        descricao: 'Histórico de previsões executadas',
        tipo: 'previsoes',
        data: new Date().toISOString(),
        downloadUrl: `/api/reports/predictions/${profile._id}`
      }
    ];

    res.status(200).json({
      success: true,
      reports
    });
  } catch (error) {
    console.error('Erro ao buscar relatórios:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor. Tente novamente.'
    });
  }
};