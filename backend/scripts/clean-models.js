// backend/scripts/clean-models.js
const mongoose = require('mongoose');
require('dotenv').config();

const modeloSchema = new mongoose.Schema({
  nome: String,
  tipo: String,
  timestamp: Date,
  resultado: mongoose.Schema.Types.Mixed
}, { collection: 'modelos' });

const Modelo = mongoose.model('Modelo', modeloSchema);

async function cleanModels() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado ao MongoDB');

    // Remover modelos com timestamp inválido
    const result = await Modelo.deleteMany({
      $or: [
        { timestamp: { $exists: false } },
        { timestamp: null },
        { timestamp: { $lt: new Date('2020-01-01') } },
        { timestamp: { $gt: new Date('2030-01-01') } }
      ]
    });

    console.log(`🗑️ Removidos ${result.deletedCount} modelos com timestamp inválido`);

    // Remover modelos sem previsões
    const result2 = await Modelo.deleteMany({
      'resultado.previsoes': { $size: 0 }
    });

    console.log(`🗑️ Removidos ${result2.deletedCount} modelos sem previsões`);

    // Listar modelos restantes
    const restantes = await Modelo.countDocuments();
    console.log(`📊 Modelos restantes: ${restantes}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

cleanModels();