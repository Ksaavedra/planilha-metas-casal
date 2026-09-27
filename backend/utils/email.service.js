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

const FEEDBACK_DESTINATARIO_PADRAO = 'kellymichelesaavedra@gmail.com';

const LABELS_NOTA = {
   1: 'Muito ruim',
   2: 'Ruim',
   3: 'Ok',
   4: 'Bom',
   5: 'Adorei',
};

async function enviarFeedback(feedback, usuario) {
   const destinatario =
      process.env.CONTACT_MAIL_TO || FEEDBACK_DESTINATARIO_PADRAO;
   const tela = feedback.pagina || 'Não informada';
   const assunto = `Novo feedback (${feedback.nota}/5) - ${tela} - ORBIS`;
   const texto = [
      `Nota: ${feedback.nota}/5 (${LABELS_NOTA[feedback.nota]})`,
      `Tela: ${tela}`,
      `Usuário: ${usuario.usuario || '-'} (${usuario.email || 'sem email'})`,
      `Data: ${feedback.createdAt}`,
      '',
      'Comentário:',
      feedback.comentario || '(sem comentário)',
   ].join('\n');

   if (!smtpConfigurado()) {
      console.log(
         'Feedback recebido (email não enviado: configure SMTP_HOST, SMTP_USER e SMTP_PASS):\n' +
            texto,
      );
      return;
   }

   try {
      const info = await criarTransportador().sendMail({
         from: process.env.MAIL_FROM || process.env.SMTP_USER,
         to: destinatario,
         replyTo: usuario.email || undefined,
         subject: assunto,
         text: texto,
      });
      console.log(
         'Email de feedback enviado para',
         destinatario,
         '- messageId:',
         info.messageId,
      );
   } catch (error) {
      console.error('Erro ao enviar email de feedback via SMTP:', error);
      throw error;
   }
}

module.exports = {
   enviarCodigoRecuperacaoSenha,
   enviarFeedback,
   smtpConfigurado,
};
