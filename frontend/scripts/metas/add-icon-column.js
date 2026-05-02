const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "../../metas.db");

console.log("🔧 Adicionando coluna 'icon' à tabela 'metas'...");

const db = new Database(DB_PATH);

try {
  // Verificar se a coluna já existe
  const tableInfo = db.prepare("PRAGMA table_info(metas)").all();
  const hasIconColumn = tableInfo.some((col) => col.name === "icon");

  if (hasIconColumn) {
    console.log("✅ Coluna 'icon' já existe na tabela 'metas'");
  } else {
    // Adicionar coluna icon
    db.exec(`
      ALTER TABLE metas
      ADD COLUMN icon TEXT DEFAULT 'bi-bullseye'
    `);
    console.log("✅ Coluna 'icon' adicionada com sucesso!");

    // Atualizar todas as metas existentes para ter o ícone padrão
    const updateCount = db
      .prepare(
        `
      UPDATE metas
      SET icon = 'bi-bullseye'
      WHERE icon IS NULL
    `
      )
      .run();

    console.log(
      `✅ ${updateCount.changes} meta(s) atualizada(s) com ícone padrão`
    );
  }

  // Verificar estrutura final
  const finalTableInfo = db.prepare("PRAGMA table_info(metas)").all();
  console.log("\n📊 Estrutura final da tabela 'metas':");
  finalTableInfo.forEach((col) => {
    console.log(`   - ${col.name} (${col.type})`);
  });
} catch (error) {
  console.error("❌ Erro ao adicionar coluna:", error);
  process.exit(1);
} finally {
  db.close();
}

console.log("\n✅ Migration concluída!");
