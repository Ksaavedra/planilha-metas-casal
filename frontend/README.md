# 💰 Planilha Organização Financeira

Uma aplicação web moderna para controle financeiro pessoal, desenvolvida em Angular com foco em organização, planejamento e acompanhamento de metas financeiras.

## 🚀 Funcionalidades

### 📊 Relatório Financeiro

- Visão geral das finanças
- Resumo de receitas, despesas e saldo
- Análise por período
- Dashboard com cards informativos

### 💸 Gestão de Receitas

- Cadastro de diferentes tipos de receita
- Controle de receitas recorrentes
- Categorização e observações
- Histórico completo

### 💳 Gestão de Despesas

- Registro de despesas por categoria
- Controle de despesas parceladas
- Acompanhamento de despesas recorrentes
- Análise de gastos

### 🏦 Controle de Dívidas

- Cadastro de dívidas e financiamentos
- Controle de vencimentos
- Acompanhamento de pagamentos
- Alertas de dívidas vencidas

### 📈 Investimentos

- Registro de diferentes tipos de investimento
- Acompanhamento de rentabilidade
- Controle de aportes
- Análise de risco e liquidez

### 🎯 Metas Financeiras

- Definição de metas de investimento
- Acompanhamento de progresso
- Controle de prazos
- Priorização de objetivos

## 🛠️ Tecnologias Utilizadas

- **Angular 17** - Framework principal
- **Angular Signals** - Gerenciamento de estado
- **TypeScript** - Linguagem de programação
- **CSS3** - Estilização com variáveis CSS
- **Material Icons** - Ícones da interface
- **Responsive Design** - Layout adaptável

## 📁 Estrutura do Projeto

```
frontend/
├─ src/
│  ├─ app/
│  │  ├─ core/                       # Serviços globais
│  │  ├─ shared/                     # Componentes reutilizáveis
│  │  ├─ store/                      # Estado global (Signals)
│  │  │  ├─ app.store.ts
│  │  │  └─ models/
│  │  │     ├─ common.ts            # Interfaces comuns
│  │  │     ├─ receita.ts           # Modelo de Receita
│  │  │     ├─ despesa.ts           # Modelo de Despesa
│  │  │     ├─ divida.ts            # Modelo de Dívida
│  │  │     ├─ investimento.ts      # Modelo de Investimento
│  │  │     └─ meta.ts              # Modelo de Meta
│  │  ├─ features/                   # Módulos de funcionalidades
│  │  │  ├─ relatorio-financeiro/   # Dashboard principal
│  │  │  ├─ rota-do-dinheiro/       # Fluxo de caixa
│  │  │  ├─ receitas/               # Gestão de receitas
│  │  │  ├─ despesas/               # Gestão de despesas
│  │  │  ├─ dividas/                # Controle de dívidas
│  │  │  ├─ investimentos/          # Gestão de investimentos
│  │  │  └─ metas-investimento/     # Metas financeiras
│  │  ├─ app.routes.ts              # Configuração de rotas
│  │  └─ app.component.*            # Componente principal
│  └─ index.html / main.ts / styles.css
```

## 🚀 Como Executar

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn

### Instalação

1. **Clone o repositório**

```bash
git clone <url-do-repositorio>
cd planilha-organizacao/frontend
```

2. **Instale as dependências**

```bash
npm install
```

3. **Execute o projeto**

```bash
npm start
```

4. **Acesse a aplicação**

```
http://localhost:4200
```

### Comandos Úteis

```bash
# Desenvolvimento
npm start

# Build para produção
npm run build

# Testes
npm test

# Lint
npm run lint
```

## 📱 Funcionalidades por Módulo

### Relatório Financeiro

- Dashboard com visão geral
- Cards de resumo financeiro
- Gráficos de evolução
- Filtros por período

### Rota do Dinheiro

- Fluxo de caixa mensal
- Gráficos de receitas vs despesas
- Projeções financeiras
- Análise de tendências

### Receitas

- Cadastro de receitas
- Categorização
- Controle de recorrência
- Histórico e relatórios

### Despesas

- Registro de despesas
- Categorização automática
- Controle de parcelas
- Análise de gastos

### Dívidas

- Cadastro de dívidas
- Controle de vencimentos
- Alertas automáticos
- Histórico de pagamentos

### Investimentos

- Registro de investimentos
- Acompanhamento de rentabilidade
- Controle de aportes
- Análise de risco

### Metas

- Definição de metas
- Acompanhamento de progresso
- Alertas de prazo
- Priorização

## 🎨 Design System

### Cores

- **Primária**: #2563eb (Azul)
- **Sucesso**: #10b981 (Verde)
- **Aviso**: #f59e0b (Amarelo)
- **Erro**: #ef4444 (Vermelho)
- **Info**: #06b6d4 (Ciano)

### Tipografia

- **Fonte**: Inter
- **Tamanhos**: 0.875rem a 2.5rem
- **Pesos**: 400, 500, 600, 700

### Componentes

- Cards informativos
- Botões com estados
- Formulários responsivos
- Tabelas de dados
- Gráficos interativos

## 🔧 Arquitetura

### Estado Global (Signals)

- Gerenciamento centralizado
- Reatividade automática
- Performance otimizada
- Fácil debugging

### Lazy Loading

- Carregamento sob demanda
- Melhor performance
- Redução do bundle inicial
- Navegação fluida

### Componentes Standalone

- Independência de módulos
- Reutilização facilitada
- Testes isolados
- Manutenção simplificada

## 📊 Modelos de Dados

### Receita

```typescript
interface Receita {
  id: string;
  descricao: string;
  valor: number;
  data: Date;
  categoria: Categoria;
  tipoReceita: TipoReceita;
  recorrente: boolean;
  frequencia?: FrequenciaRecorrencia;
  observacoes?: string;
}
```

### Despesa

```typescript
interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  data: Date;
  categoria: Categoria;
  tipoDespesa: TipoDespesa;
  parcelada: boolean;
  numeroParcelas?: number;
  parcelaAtual?: number;
}
```

### Investimento

```typescript
interface Investimento {
  id: string;
  descricao: string;
  valorInvestido: number;
  valorAtual: number;
  rentabilidade: number;
  tipoInvestimento: TipoInvestimento;
  risco: NivelRisco;
  liquidez: NivelLiquidez;
}
```

## 🚀 Roadmap

### Versão 1.0 (Atual)

- ✅ Estrutura base
- ✅ Modelos de dados
- ✅ Store com Signals
- ✅ Layout responsivo
- ✅ Página de relatório

### Versão 1.1 (Próxima)

- 🔄 Formulários de cadastro
- 🔄 Tabelas de dados
- 🔄 Filtros avançados
- 🔄 Gráficos interativos

### Versão 1.2 (Futura)

- 📋 Exportação de relatórios
- 📋 Backup automático
- 📋 Notificações
- 📋 Temas personalizáveis

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para dúvidas ou sugestões, entre em contato:

- Email: [seu-email@exemplo.com]
- Issues: [GitHub Issues]

---

**Desenvolvido com ❤️ para ajudar na organização financeira pessoal**
