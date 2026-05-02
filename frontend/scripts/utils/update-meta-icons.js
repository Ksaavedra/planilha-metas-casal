const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "../../metas.db");

console.log("🔧 Atualizando ícones das metas baseado no nome...");

const db = new Database(DB_PATH);

// Função para detectar ícone pelo nome (mesma lógica do frontend)
function detectIconByNome(nome) {
  const nomeLower = nome.toLowerCase();

  if (nomeLower.includes("casa")) return "bi-house";
  if (
    nomeLower.includes("carro") ||
    nomeLower.includes("automóvel") ||
    nomeLower.includes("veículo")
  )
    return "bi-car-front";
  if (
    nomeLower.includes("viajar") ||
    nomeLower.includes("viagem") ||
    nomeLower.includes("europa") ||
    nomeLower.includes("turismo") ||
    nomeLower.includes("aviao") ||
    nomeLower.includes("avião")
  )
    return "bi-airplane";
  if (
    nomeLower.includes("casamento") ||
    nomeLower.includes("noivado") ||
    nomeLower.includes("festa")
  )
    return "bi-heart";
  if (
    nomeLower.includes("educação") ||
    nomeLower.includes("educacao") ||
    nomeLower.includes("curso") ||
    nomeLower.includes("faculdade") ||
    nomeLower.includes("universidade")
  )
    return "bi-mortarboard";
  if (
    nomeLower.includes("bicicleta") ||
    nomeLower.includes("bike") ||
    nomeLower.includes("ciclo")
  )
    return "bi-bicycle";
  if (
    nomeLower.includes("presente") ||
    nomeLower.includes("aniversário") ||
    nomeLower.includes("aniversario")
  )
    return "bi-gift";
  if (
    nomeLower.includes("compras") ||
    nomeLower.includes("shopping") ||
    nomeLower.includes("mercado")
  )
    return "bi-bag";
  if (
    nomeLower.includes("câmera") ||
    nomeLower.includes("camera") ||
    nomeLower.includes("foto") ||
    nomeLower.includes("fotografia")
  )
    return "bi-camera";
  if (
    nomeLower.includes("notebook") ||
    nomeLower.includes("laptop") ||
    nomeLower.includes("computador")
  )
    return "bi-laptop";
  if (
    nomeLower.includes("celular") ||
    nomeLower.includes("smartphone") ||
    nomeLower.includes("telefone") ||
    nomeLower.includes("iphone")
  )
    return "bi-phone";

  return "bi-bullseye";
}

try {
  // Buscar todas as metas
  const metas = db.prepare("SELECT * FROM metas").all();

  console.log(`\n📊 Encontradas ${metas.length} meta(s) para processar\n`);

  let updatedCount = 0;

  metas.forEach((meta) => {
    // Se a meta não tem ícone ou tem o padrão, detectar pelo nome
    if (!meta.icon || meta.icon === "bi-bullseye" || meta.icon === null) {
      const detectedIcon = detectIconByNome(meta.nome);

      if (detectedIcon !== meta.icon) {
        db.prepare("UPDATE metas SET icon = ? WHERE id = ?").run(
          detectedIcon,
          meta.id
        );
        console.log(
          `✅ Meta "${meta.nome}" (ID: ${meta.id}): ${
            meta.icon || "null"
          } → ${detectedIcon}`
        );
        updatedCount++;
      } else {
        console.log(
          `⏭️  Meta "${meta.nome}" (ID: ${meta.id}): já tem ícone correto (${meta.icon})`
        );
      }
    } else {
      console.log(
        `⏭️  Meta "${meta.nome}" (ID: ${meta.id}): já tem ícone personalizado (${meta.icon})`
      );
    }
  });

  console.log(
    `\n✅ Processo concluído! ${updatedCount} meta(s) atualizada(s).`
  );
} catch (error) {
  console.error("❌ Erro ao atualizar ícones:", error);
  process.exit(1);
} finally {
  db.close();
}

console.log("\n✅ Script finalizado!");
