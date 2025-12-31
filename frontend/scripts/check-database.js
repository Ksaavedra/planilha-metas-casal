const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "../../metas.db");

const db = new Database(DB_PATH);

console.log("📊 Verificando dados no banco SQLite...\n");

// Contar metas
const metasCount = db.prepare("SELECT COUNT(*) as count FROM metas").get();
console.log(`✅ Total de Metas: ${metasCount.count}`);

// Listar todas as metas
const metas = db.prepare("SELECT * FROM metas ORDER BY id").all();
console.log("\n📋 Lista de Metas:");
metas.forEach((meta) => {
  console.log(`   ID ${meta.id}: ${meta.nome}`);
  console.log(
    `      Valor Meta: R$ ${meta.valorMeta.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}`
  );
  console.log(
    `      Valor por Mês: R$ ${meta.valorPorMes.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}`
  );
  console.log(
    `      Valor Atual: R$ ${meta.valorAtual.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}`
  );

  // Contar meses desta meta
  const mesesCount = db
    .prepare("SELECT COUNT(*) as count FROM meses WHERE metaId = ?")
    .get(meta.id);
  console.log(`      Meses cadastrados: ${mesesCount.count}\n`);
});

// Contar total de meses
const mesesCount = db.prepare("SELECT COUNT(*) as count FROM meses").get();
console.log(`✅ Total de Meses: ${mesesCount.count}`);

db.close();

console.log("\n✅ Verificação concluída!");
