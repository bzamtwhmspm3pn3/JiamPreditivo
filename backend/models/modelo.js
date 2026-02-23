// backend/models/Modelo.js
const mongoose = require('mongoose');

const modeloSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  userId: { 
    type: String, 
    required: true,
    index: true 
  },
  nome: { 
    type: String, 
    required: true 
  },
  tipo: { 
    type: String, 
    required: true,
    default: 'desconhecido' 
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  resultado: { 
    type: mongoose.Schema.Types.Mixed,
    default: {} 
  },
  parametros: { 
    type: mongoose.Schema.Types.Mixed,
    default: {} 
  },
  pontuacao: { 
    type: Number, 
    default: 0.5,
    min: 0,
    max: 1 
  },
  classificacao: { 
    type: String, 
    enum: ['EXCELENTE', 'BOA', 'MODERADA', 'FRACA'],
    default: 'MODERADA' 
  },
  arquivado: { 
    type: Boolean, 
    default: false,
    index: true 
  },
  dataArquivamento: { 
    type: Date,
    default: null 
  },
  anomalias: { 
    type: Array, 
    default: [] 
  },
  fraudes: { 
    type: Array, 
    default: [] 
  },
  paradoxos: { 
    type: Array, 
    default: [] 
  }
}, {
  timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

// Índices compostos para consultas rápidas
modeloSchema.index({ userId: 1, arquivado: 1, timestamp: -1 });
modeloSchema.index({ userId: 1, classificacao: 1 });
modeloSchema.index({ userId: 1, tipo: 1 });

module.exports = mongoose.model('Modelo', modeloSchema);
