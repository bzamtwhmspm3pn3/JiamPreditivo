const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log para desenvolvimento
  console.error("❌ Erro:", err);

  // Erros do Mongoose
  if (err.name === "CastError") {
    const message = "Recurso não encontrado";
    error = { message, statusCode: 404 };
  }

  // Duplicação de chave única
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `${field} já está em uso`;
    error = { message, statusCode: 400 };
  }

  // Erros de validação
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map(val => val.message).join(", ");
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Token inválido";
    error = { message, statusCode: 401 };
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expirado";
    error = { message, statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Erro no servidor",
    stack: process.env.NODE_ENV === "production" ? null : err.stack
  });
};

module.exports = errorHandler;