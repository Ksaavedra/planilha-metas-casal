const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../../../metas.db");
const JSON_PATH = path.join(__dirname, "../../../db.json");

// Verificar se o banco existe
if (!fs.existsSync(DB_PATH)) {
  console.error("❌ Banco de dados não encontrado!");
  console.log("💡 Execute primeiro: npm run db:create");
  process.exit(1);
}

// Verificar se o JSON existe
if (!fs.existsSync(JSON_PATH)) {
  console.error("❌ Arquivo db.json não encontrado!");
  process.exit(1);
}

// Ler dados do JSON
console.log("📖 Lendo dados do db.json...");
const jsonData = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));

if (!jsonData.metas || !Array.isArray(jsonData.metas)) {
  console.error("❌ Formato inválido no db.json!");
  process.exit(1);
}

console.log(`📊 Encontradas ${jsonData.metas.length} meta(s) para migrar\n`);

// Conectar ao banco
const db = new Database(DB_PATH);

// Preparar statements SQL
const insertMeta = db.prepare(`
  INSERT INTO metas (id, nome, valorMeta, valorPorMes, mesesNecessarios, valorAtual, icon)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertMes = db.prepare(`
  INSERT INTO meses (metaId, nome, valor, status)
  VALUES (?, ?, ?, ?)
`);

// Transação para garantir que tudo ou nada seja inserido
const insertMetaWithMeses = db.transaction((meta) => {
  // Inserir meta
  insertMeta.run(
    meta.id,
    meta.nome,
    meta.valorMeta || 0,
    meta.valorPorMes || 0,
    meta.mesesNecessarios || 0,
    meta.valorAtual || 0,
    meta.icon || "bi-bullseye"
  );

  // Inserir meses da meta
  if (meta.meses && Array.isArray(meta.meses)) {
    meta.meses.forEach((mes) => {
      insertMes.run(meta.id, mes.nome, mes.valor || 0, mes.status || "Vazio");
    });
  }

  return meta.id;
});

// Migrar dados
console.log("🚀 Iniciando migração...\n");

let successCount = 0;
let errorCount = 0;

jsonData.metas.forEach((meta, index) => {
  try {
    const metaId = insertMetaWithMeses(meta);
    console.log(
      `✅ Meta ${index + 1}: "${meta.nome}" (ID: ${metaId}) - ${
        meta.meses?.length || 0
      } meses`
    );
    successCount++;
  } catch (error) {
    console.error(`❌ Erro ao migrar meta ${index + 1}: "${meta.nome}"`);
    console.error(`   Erro: ${error.message}`);
    errorCount++;
  }
});

console.log("\n" + "=".repeat(50));
console.log("📊 Resumo da Migração:");
console.log(`   ✅ Sucesso: ${successCount}`);
console.log(`   ❌ Erros: ${errorCount}`);
console.log(`   📁 Total: ${jsonData.metas.length}`);
console.log("=".repeat(50));

// Validar migração
console.log("\n🔍 Validando migração...");

const metasCount = db.prepare("SELECT COUNT(*) as count FROM metas").get();
const mesesCount = db.prepare("SELECT COUNT(*) as count FROM meses").get();

console.log(`   Metas no banco: ${metasCount.count}`);
console.log(`   Meses no banco: ${mesesCount.count}`);

const expectedMeses = jsonData.metas.reduce((total, meta) => {
  return total + (meta.meses?.length || 0);
}, 0);

if (
  metasCount.count === jsonData.metas.length &&
  mesesCount.count === expectedMeses
) {
  console.log("\n✅ Migração concluída com sucesso!");
  console.log("💡 Todos os dados foram migrados corretamente.");
} else {
  console.log("\n⚠️  Aviso: Números não coincidem!");
  console.log("   Verifique os dados manualmente.");
}

db.close();

console.log("\n✅ Script de migração finalizado!");
