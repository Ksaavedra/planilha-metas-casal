const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');
const { enviarBoasVindas } = require('../utils/email.service');

const SMTP_VARS = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM'];

const usuarioBase = {
   usuario: 'maria1',
   nomeCompleto: 'Maria da Silva',
   apelido: 'Maria',
   email: 'maria@email.com',
};

describe('enviarBoasVindas', () => {
   let envOriginal;
   let sendMail;
   let createTransport;

   beforeEach(() => {
      envOriginal = Object.fromEntries(
         SMTP_VARS.map((nome) => [nome, process.env[nome]]),
      );
      process.env.SMTP_HOST = 'smtp.teste.com';
      process.env.SMTP_USER = 'orbis@teste.com';
      process.env.SMTP_PASS = 'senha';
      delete process.env.MAIL_FROM;

      sendMail = mock.fn(async () => ({ messageId: 'id-teste' }));
      createTransport = mock.method(nodemailer, 'createTransport', () => ({
         sendMail,
      }));
      mock.method(console, 'log', () => {});
      mock.method(console, 'error', () => {});
   });

   afterEach(() => {
      mock.restoreAll();
      for (const [nome, valor] of Object.entries(envOriginal)) {
         if (valor === undefined) delete process.env[nome];
         else process.env[nome] = valor;
      }
   });

   it('envia o email de parabéns para o email cadastrado', async () => {
      await enviarBoasVindas(usuarioBase);

      assert.equal(sendMail.mock.callCount(), 1);
      const mensagem = sendMail.mock.calls[0].arguments[0];
      assert.equal(mensagem.to, 'maria@email.com');
      assert.equal(mensagem.from, 'orbis@teste.com');
      assert.match(mensagem.subject, /Parabéns/);
      assert.match(mensagem.text, /Olá, Maria!/);
      assert.match(mensagem.text, /Seu usuário de acesso é: maria1/);
      assert.match(mensagem.html, /Parabéns, Maria!/);
      assert.match(mensagem.html, /maria1/);
   });

   it('usa MAIL_FROM como remetente quando definido', async () => {
      process.env.MAIL_FROM = 'ORBIS <nao-responda@orbis.com>';

      await enviarBoasVindas(usuarioBase);

      const mensagem = sendMail.mock.calls[0].arguments[0];
      assert.equal(mensagem.from, 'ORBIS <nao-responda@orbis.com>');
   });

   it('usa o nome completo quando não há apelido', async () => {
      await enviarBoasVindas({ ...usuarioBase, apelido: '' });

      const mensagem = sendMail.mock.calls[0].arguments[0];
      assert.match(mensagem.text, /Olá, Maria da Silva!/);
   });

   it('usa o usuário quando não há apelido nem nome completo', async () => {
      await enviarBoasVindas({ ...usuarioBase, apelido: '', nomeCompleto: '' });

      const mensagem = sendMail.mock.calls[0].arguments[0];
      assert.match(mensagem.text, /Olá, maria1!/);
   });

   it('escapa HTML do nome e do usuário no corpo do email', async () => {
      await enviarBoasVindas({
         ...usuarioBase,
         usuario: 'a"b',
         apelido: '<script>x</script> & cia',
      });

      const { html } = sendMail.mock.calls[0].arguments[0];
      assert.doesNotMatch(html, /<script>/);
      assert.match(html, /&lt;script&gt;x&lt;\/script&gt; &amp; cia/);
      assert.match(html, /a&quot;b/);
   });

   it('não envia nada quando o usuário não tem email', async () => {
      await enviarBoasVindas({ ...usuarioBase, email: '' });
      await enviarBoasVindas(null);

      assert.equal(createTransport.mock.callCount(), 0);
      assert.equal(sendMail.mock.callCount(), 0);
   });

   it('só registra no log quando o SMTP não está configurado', async () => {
      delete process.env.SMTP_PASS;

      await enviarBoasVindas(usuarioBase);

      assert.equal(createTransport.mock.callCount(), 0);
      assert.equal(sendMail.mock.callCount(), 0);
      assert.equal(console.log.mock.callCount(), 1);
   });

   it('registra o erro e repassa quando o envio falha', async () => {
      sendMail.mock.mockImplementation(async () => {
         throw new Error('SMTP fora do ar');
      });

      await assert.rejects(enviarBoasVindas(usuarioBase), /SMTP fora do ar/);
      assert.equal(console.error.mock.callCount(), 1);
   });
});
