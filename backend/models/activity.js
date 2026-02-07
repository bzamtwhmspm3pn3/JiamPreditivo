const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tipo: {
    type: String,
    required: true,
    enum: [
      'login', 'logout', 'register', 'email_verification', 
      'password_reset', 'profile_update', 'model_execution',
      'product_activation', 'data_export', 'settings_change'
    ]
  },
  descricao: {
    type: String,
    required: true
  },
  ipAddress: String,
  userAgent: String,
  metadata: mongoose.Schema.Types.Mixed,
  sucesso: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 90 * 24 * 60 * 60 // Expira após 90 dias
  }
});

// Índices
activitySchema.index({ user: 1 });
activitySchema.index({ tipo: 1 });
activitySchema.index({ createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.models.Activity || mongoose.model("Activity", activitySchema);
