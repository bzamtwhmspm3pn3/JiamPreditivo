// models/Profile.js
const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  tipo: {
    type: String,
    enum: ["individual", "organizacao"],
    required: [true, "Tipo de cadastro é obrigatório"]
  },
  nome: {
    type: String,
    required: [true, "Nome é obrigatório"],
    trim: true
  },
  nomeOrganizacao: {
    type: String,
    required: function() {
      return this.tipo === "organizacao";
    },
    trim: true
  },
  identificacao: {
    type: String,
    required: [true, "Identificação é obrigatória"],
    unique: true,
    trim: true
  },
  tipoIdentificacao: {
    type: String,
    enum: ["BI", "NIF", "PASSAPORTE"],
    required: [true, "Tipo de identificação é obrigatório"]
  },
  dataNascimento: {
    type: Date,
    required: function() {
      return this.tipo === "individual";
    }
  },
  dataFundacao: {
    type: Date,
    required: function() {
      return this.tipo === "organizacao";
    }
  },
  telefone: {
    type: String,
    required: [true, "Telefone é obrigatório"]
  },
  imagemPerfil: {
    public_id: String,
    url: String,
    secure_url: String
  },
  status: {
    type: String,
    enum: ["incompleto", "completo", "verificado", "pendente"],
    default: "incompleto"
  },
  produtoAtivo: {
    type: Boolean,
    default: false
  },
  codigoAtivacao: String,
  dataAtivacao: Date,
  expiracaoAtivacao: Date,
  execucoesUsadas: {
    type: Number,
    default: 0,
    min: 0
  },
  limiteExecucoes: {
    type: Number,
    default: 3
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Método para verificar se pode executar mais previsões
profileSchema.methods.podeExecutar = function() {
  return this.produtoAtivo || this.execucoesUsadas < this.limiteExecucoes;
};

// Método para registrar execução
profileSchema.methods.registrarExecucao = function() {
  if (!this.produtoAtivo) {
    this.execucoesUsadas += 1;
  }
  return this.save();
};

// Método para ativar produto
profileSchema.methods.ativarProduto = function(codigo) {
  const codigosValidos = ["JIAM2025", "JIAM2024", "JIAM2023"];
  if (codigosValidos.includes(codigo)) {
    this.produtoAtivo = true;
    this.dataAtivacao = new Date();
    // Expiração em 1 ano por exemplo
    const expiracao = new Date();
    expiracao.setFullYear(expiracao.getFullYear() + 1);
    this.expiracaoAtivacao = expiracao;
    return this.save();
  } else {
    throw new Error("Código de ativação inválido");
  }
};

module.exports = mongoose.models.Profile || mongoose.model("Profile", profileSchema);
