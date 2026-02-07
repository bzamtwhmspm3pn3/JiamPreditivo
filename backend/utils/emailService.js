// utils/emailService.js
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    }
  }

  async sendEmail(options) {
    try {
      if (!this.transporter) {
        console.warn('Email service not configured. Email not sent:', options);
        return { success: false, message: 'Email service not configured' };
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@jiam.com',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      };

      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(user) {
    return this.sendEmail({
      to: user.email,
      subject: 'Bem-vindo ao JIAM Preditivo',
      text: `Olá ${user.name},\n\nBem-vindo ao JIAM Preditivo!`,
      html: `<h1>Bem-vindo ao JIAM Preditivo</h1><p>Olá ${user.name},</p>`
    });
  }

  async sendAnalysisReport(email, reportData) {
    return this.sendEmail({
      to: email,
      subject: 'Relatório de Análise - JIAM Preditivo',
      text: `Seu relatório de análise está pronto.\n\nResultados: ${JSON.stringify(reportData, null, 2)}`,
      html: `<h1>Relatório de Análise</h1><pre>${JSON.stringify(reportData, null, 2)}</pre>`
    });
  }
}

module.exports = new EmailService();