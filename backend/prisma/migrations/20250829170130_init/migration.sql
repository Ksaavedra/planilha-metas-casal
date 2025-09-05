-- CreateTable
CREATE TABLE "Meta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "valorMeta" DECIMAL NOT NULL DEFAULT 0,
    "valorPorMes" DECIMAL NOT NULL DEFAULT 0,
    "mesesNecessarios" INTEGER NOT NULL DEFAULT 0,
    "valorAtual" DECIMAL NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "MesesMeta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "metaId" INTEGER NOT NULL,
    "mes_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "valor" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Vazio',
    CONSTRAINT "MesesMeta_metaId_fkey" FOREIGN KEY ("metaId") REFERENCES "Meta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MesesMeta_metaId_mes_id_key" ON "MesesMeta"("metaId", "mes_id");
