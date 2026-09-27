const nodemailer = require('nodemailer');

function smtpConfigurado() {
   return Boolean(
      process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
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

function escaparHtml(valor) {
   return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
}

async function enviarBoasVindas(usuario) {
   const email = usuario?.email;
   if (!email) return;

   const nome = usuario.apelido || usuario.nomeCompleto || usuario.usuario;

   if (!smtpConfigurado()) {
      console.log('Email de boas-vindas (SMTP não configurado) para', email);
      return;
   }

   const assunto = 'Parabéns, sua conta ORBIS foi criada!';
   const texto = [
      `Olá, ${nome}!`,
      '',
      'Parabéns! Sua conta no ORBIS foi criada com sucesso.',
      '',
      `Seu usuário de acesso é: ${usuario.usuario}`,
      '',
      'Agora você já pode organizar receitas, despesas, cartões, metas e investimentos em um só lugar.',
      '',
      'Se você não criou esta conta, ignore este email.',
      '',
      'Equipe ORBIS - Planejamento Financeiro',
   ].join('\n');

   const html = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #334155;">
        <div style="background: linear-gradient(135deg, #6d28d9 0%, #a855f7 100%); padding: 24px; border-radius: 14px 14px 0 0; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 26px; letter-spacing: 2px;">ORBIS</h1>
          <p style="margin: 4px 0 0; color: #ede9fe; font-size: 13px;">Planejamento Financeiro</p>
        </div>
        <div style="background: #ffffff; padding: 28px 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 14px 14px;">
          <h2 style="margin: 0 0 12px; color: #0f172a; font-size: 20px;">Parabéns, ${escaparHtml(nome)}! 🎉</h2>
          <p style="margin: 0 0 12px; line-height: 1.5;">Sua conta no <strong>ORBIS</strong> foi criada com sucesso.</p>
          <p style="margin: 0 0 16px; line-height: 1.5;">Seu usuário de acesso é: <strong>${escaparHtml(usuario.usuario)}</strong></p>
          <p style="margin: 0 0 20px; line-height: 1.5;">Agora você já pode organizar receitas, despesas, cartões, metas e investimentos em um só lugar.</p>
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">Se você não criou esta conta, ignore este email.</p>
        </div>
      </div>
   `;

   const transportador = criarTransportador();
   const remetente = process.env.MAIL_FROM || process.env.SMTP_USER;

   try {
      const info = await transportador.sendMail({
         from: remetente,
         to: email,
         subject: assunto,
         text: texto,
         html,
      });
      console.log(
         'Email de boas-vindas enviado para',
         email,
         '- messageId:',
         info.messageId,
      );
   } catch (error) {
      console.error('Erro ao enviar email de boas-vindas via SMTP:', error);
      throw error;
   }
}

module.exports = {
   enviarCodigoRecuperacaoSenha,
   enviarFeedback,
   enviarBoasVindas,
   smtpConfigurado,
};
