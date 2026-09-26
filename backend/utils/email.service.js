const nodemailer = require('nodemailer');

function smtpConfigurado() {
   return Boolean(
      process.env.SMTP_HOST &&
         process.env.SMTP_USER &&
         process.env.SMTP_PASS,
   );
}

function criarTransportador() {
   if (!smtpConfigurado()) return null;

   return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
         user: process.env.SMTP_USER,
         pass: process.env.SMTP_PASS,
      },
   });
}

function logCodigoDev(email, codigo) {
   console.log('Código de recuperação para', email, ':', codigo);
}

async function enviarCodigoRecuperacaoSenha(email, codigo) {
   if (!smtpConfigurado()) {
      logCodigoDev(email, codigo);
      return;
   }

   const assunto = 'Código de recuperação de senha - ORBIS';
   const texto = [
      'Você solicitou a recuperação de senha da sua conta ORBIS.',
      '',
      `Seu código de verificação é: ${codigo}`,
      '',
      'Este código expira em 15 minutos e só pode ser usado uma vez.',
      '',
      'Se você não solicitou esta recuperação, ignore este email.',
   ].join('\n');

   const transportador = criarTransportador();
   const remetente = process.env.MAIL_FROM || process.env.SMTP_USER;

   try {
      const info = await transportador.sendMail({
         from: remetente,
         to: email,
         subject: assunto,
         text: texto,
      });
      console.log(
         'Email de recuperação enviado para',
         email,
         '- messageId:',
         info.messageId,
      );
   } catch (error) {
      console.error('Erro ao enviar email de recuperação via SMTP:', error);
      logCodigoDev(email, codigo);
      throw error;
   }
}

module.exports = {
   enviarCodigoRecuperacaoSenha,
   smtpConfigurado,
};
