require('dotenv').config();
const { sendVerificationEmail } = require('./utils/emailService');

(async () => {
  try {
    await sendVerificationEmail('seuemailteste@gmail.com', 'TOKEN_TESTE');
    console.log('Teste concluído! Email enviado.');
  } catch (err) {
    console.error('Erro no teste de envio:', err);
  }
})();
