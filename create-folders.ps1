# Script para criar todas as pastas da estrutura do projeto

$folders = @(
    "src/app/features/relatorio-financeiro/components/resumo-cards",
    "src/app/features/relatorio-financeiro/components/tabela-resumo",
    "src/app/features/rota-do-dinheiro/containers/rota-page",
    "src/app/features/rota-do-dinheiro/components/grafico-fluxo",
    "src/app/features/rota-do-dinheiro/components/filtro-periodo",
    "src/app/features/dividas/containers/dividas-page",
    "src/app/features/dividas/components/lista-dividas",
    "src/app/features/dividas/components/form-divida",
    "src/app/features/receitas/containers/receitas-page",
    "src/app/features/receitas/components/tabela-receitas",
    "src/app/features/receitas/components/form-receita",
    "src/app/features/despesas/containers/despesas-page",
    "src/app/features/despesas/components/tabela-despesas",
    "src/app/features/despesas/components/form-despesa",
    "src/app/features/investimentos/containers/investimentos-page",
    "src/app/features/investimentos/components/lista-investimentos",
    "src/app/features/investimentos/components/form-investimento",
    "src/app/features/metas-investimento/containers/metas-page",
    "src/app/features/metas-investimento/components/lista-metas",
    "src/app/features/metas-investimento/components/form-meta"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Path $folder -Force
    Write-Host "Criada pasta: $folder"
}
