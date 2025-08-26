const mysql = require('mysql2/promise');

const pool = mysql.createPool({
   host: '127.0.0.1',
   user: 'user_planilha',
   password: 'SenhaPlanilha123!',
   database: 'planilha_organizacao',
   charset: 'utf8mb4',
   // Configurar para retornar números como números
   typeCast: function (field, next) {
      if (field.type === 'DECIMAL' || field.type === 'NEWDECIMAL') {
         const value = field.string();
         return value === null ? null : Number(value);
      }
      if (
         field.type === 'INT24' ||
         field.type === 'LONG' ||
         field.type === 'LONGLONG'
      ) {
         const value = field.string();
         return value === null ? null : Number(value);
      }
      return next();
   },
});

module.exports = pool;
