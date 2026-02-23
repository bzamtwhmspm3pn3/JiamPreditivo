// backend/routes/modelos.js (NOVO ARQUIVO)
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Modelo = require('../models/modelo'); // Vamos criar este modelo

// ============ SALVAR MODELO ============
router.post('/salvar', async (req, res) => {
  try {
    const { userId, modelo } = req.body;
    
    if (!userId || !modelo) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId e modelo são obrigatórios' 
      });
    }

    // Calcular performance automaticamente
    const performance = calcularPerformance(modelo);
    
    const modeloData = {
      id: modelo.id || uuidv4(),
      userId,
      nome: modelo.nome || 'Modelo sem nome',
      tipo: modelo.tipo || 'desconhecido',
      timestamp: modelo.timestamp || new Date(),
      resultado: modelo.resultado || {},
      parametros: modelo.parametros || {},
      pontuacao: performance.pontuacao,
      classificacao: performance.classificacao,
      arquivado: modelo.arquivado || false,
      dataArquivamento: modelo.dataArquivamento || null,
      anomalias: modelo.anomalias || [],
      fraudes: modelo.fraudes || [],
      paradoxos: modelo.paradoxos || []
    };

    // Upsert: atualiza se existir, cria se não
    const resultado = await Modelo.findOneAndUpdate(
      { id: modeloData.id, userId },
      modeloData,
      { upsert: true, new: true }
    );

    res.json({ 
      success: true, 
      id: resultado.id,
      pontuacao: resultado.pontuacao,
      classificacao: resultado.classificacao
    });

  } catch (error) {
    console.error('❌ Erro ao salvar modelo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ LISTAR MODELOS DO USUÁRIO ============
router.get('/listar/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { arquivados } = req.query; // 'true' ou 'false'

    const query = { 
      userId,
      arquivado: arquivados === 'true' 
    };

    const modelos = await Modelo.find(query)
      .select('id nome tipo timestamp classificacao pontuacao arquivado dataArquivamento')
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      total: modelos.length,
      modelos
    });

  } catch (error) {
    console.error('❌ Erro ao listar modelos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ CARREGAR MODELO COMPLETO ============
router.get('/carregar/:userId/:modeloId', async (req, res) => {
  try {
    const { userId, modeloId } = req.params;

    const modelo = await Modelo.findOne({ 
      id: modeloId, 
      userId 
    });

    if (!modelo) {
      return res.status(404).json({ 
        success: false, 
        error: 'Modelo não encontrado' 
      });
    }

    res.json({ success: true, modelo });

  } catch (error) {
    console.error('❌ Erro ao carregar modelo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ ATUALIZAR STATUS (ARQUIVAR/RESTAURAR) ============
router.put('/status/:userId/:modeloId', async (req, res) => {
  try {
    const { userId, modeloId } = req.params;
    const { arquivar } = req.body;

    const update = {
      arquivado: arquivar
    };

    if (arquivar) {
      update.dataArquivamento = new Date();
    } else {
      update.dataArquivamento = null;
    }

    const modelo = await Modelo.findOneAndUpdate(
      { id: modeloId, userId },
      update,
      { new: true }
    );

    if (!modelo) {
      return res.status(404).json({ 
        success: false, 
        error: 'Modelo não encontrado' 
      });
    }

    res.json({ 
      success: true, 
      mensagem: arquivar ? 'Modelo arquivado' : 'Modelo restaurado' 
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ ELIMINAR MODELO ============
router.delete('/eliminar/:userId/:modeloId', async (req, res) => {
  try {
    const { userId, modeloId } = req.params;

    const resultado = await Modelo.deleteOne({ 
      id: modeloId, 
      userId 
    });

    if (resultado.deletedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Modelo não encontrado' 
      });
    }

    res.json({ 
      success: true, 
      mensagem: 'Modelo eliminado com sucesso' 
    });

  } catch (error) {
    console.error('❌ Erro ao eliminar modelo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ ESTATÍSTICAS DO USUÁRIO ============
router.get('/estatisticas/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Total de modelos
    const total = await Modelo.countDocuments({ userId });
    
    // Modelos por classificação
    const porClassificacao = await Modelo.aggregate([
      { $match: { userId } },
      { $group: { _id: '$classificacao', count: { $sum: 1 } } }
    ]);

    // Modelos por tipo
    const porTipo = await Modelo.aggregate([
      { $match: { userId } },
      { $group: { _id: '$tipo', count: { $sum: 1 } } }
    ]);

    // Performance média
    const performanceMedia = await Modelo.aggregate([
      { $match: { userId } },
      { $group: { _id: null, media: { $avg: '$pontuacao' } } }
    ]);

    // Melhor e pior modelo
    const melhorModelo = await Modelo.findOne({ userId })
      .sort({ pontuacao: -1 })
      .limit(1);

    const piorModelo = await Modelo.findOne({ userId })
      .sort({ pontuacao: 1 })
      .limit(1);

    // Espaço ocupado (estimativa)
    const todosModelos = await Modelo.find({ userId });
    const espacoBytes = new Blob([JSON.stringify(todosModelos)]).size;

    res.json({
      success: true,
      estatisticas: {
        total,
        porClassificacao: porClassificacao.reduce((acc, item) => {
          acc[item._id || 'SEM_CLASSIFICACAO'] = item.count;
          return acc;
        }, {}),
        porTipo: porTipo.reduce((acc, item) => {
          acc[item._id || 'desconhecido'] = item.count;
          return acc;
        }, {}),
        performanceMedia: performanceMedia[0]?.media || 0,
        melhorModelo,
        piorModelo,
        espacoBytes
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ BACKUP COMPLETO ============
router.get('/backup/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const modelos = await Modelo.find({ userId }).sort({ timestamp: -1 });

    const backup = {
      userId,
      data: new Date(),
      totalModelos: modelos.length,
      modelos
    };

    res.json({
      success: true,
      backup
    });

  } catch (error) {
    console.error('❌ Erro ao gerar backup:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ ARQUIVAR MODELOS ANTIGOS AUTOMATICAMENTE ============
router.post('/arquivar-antigos/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { dias = 90 } = req.body; // Padrão: 90 dias

    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - dias);

    const resultado = await Modelo.updateMany(
      { 
        userId, 
        timestamp: { $lt: dataLimite },
        arquivado: false 
      },
      { 
        arquivado: true, 
        dataArquivamento: new Date() 
      }
    );

    res.json({
      success: true,
      arquivados: resultado.modifiedCount,
      mensagem: `${resultado.modifiedCount} modelos arquivados`
    });

  } catch (error) {
    console.error('❌ Erro ao arquivar modelos antigos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Função auxiliar para calcular performance
function calcularPerformance(modelo) {
  if (!modelo || !modelo.resultado) {
    return { pontuacao: 0.5, classificacao: 'MODERADA' };
  }

  const resultado = modelo.resultado;
  const metricas = [];

  // REGRESSÃO LINEAR
  if (modelo.tipo === 'linear_simples' || modelo.tipo === 'linear_multipla') {
    if (resultado.r2 !== undefined) metricas.push(resultado.r2);
    if (resultado.qualidade?.R2 !== undefined) metricas.push(resultado.qualidade.R2);
    if (resultado.qualidade?.R2ajustado !== undefined) metricas.push(resultado.qualidade.R2ajustado);
  }

  // CLASSIFICAÇÃO
  if (['regressao_logistica', 'random_forest', 'xgboost'].includes(modelo.tipo)) {
    if (resultado.acuracia !== undefined) metricas.push(resultado.acuracia);
    if (resultado.qualidade?.accuracy !== undefined) metricas.push(resultado.qualidade.accuracy);
    if (resultado.qualidade?.auc !== undefined) metricas.push(resultado.qualidade.auc);
  }

  // SÉRIES TEMPORAIS
  if (['arima', 'sarima', 'prophet'].includes(modelo.tipo)) {
    if (resultado.mape !== undefined) {
      metricas.push(Math.max(0, 1 - (resultado.mape / 100)));
    }
    if (resultado.qualidade?.MAPE !== undefined) {
      metricas.push(Math.max(0, 1 - (resultado.qualidade.MAPE / 100)));
    }
  }

  // Se não houver métricas, usar valor padrão
  if (metricas.length === 0) {
    return { pontuacao: 0.6, classificacao: 'MODERADA' };
  }

  const pontuacao = metricas.reduce((a, b) => a + b, 0) / metricas.length;

  let classificacao = 'MODERADA';
  if (pontuacao >= 0.8) classificacao = 'EXCELENTE';
  else if (pontuacao >= 0.6) classificacao = 'BOA';
  else if (pontuacao < 0.4) classificacao = 'FRACA';

  return {
    pontuacao: Number(pontuacao.toFixed(2)),
    classificacao
  };
}

module.exports = router;