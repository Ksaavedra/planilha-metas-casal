export interface TelaFeedback {
  rota: string;
  label: string;
}

export const TELA_FEEDBACK_GERAL: TelaFeedback = {
  rota: '',
  label: 'Sistema em geral',
};

/** Mesma ordem do menu lateral. */
export const TELAS_FEEDBACK: TelaFeedback[] = [
  TELA_FEEDBACK_GERAL,
  { rota: 'dashboard', label: 'Dashboard' },
  { rota: 'faturas', label: 'Faturas' },
  { rota: 'emprestimos', label: 'Empréstimos' },
  { rota: 'financiamentos', label: 'Financiamentos' },
  { rota: 'investimentos', label: 'Investimentos' },
  { rota: 'metas', label: 'Metas' },
  { rota: 'despesas', label: 'Despesas' },
  { rota: 'receitas', label: 'Receitas' },
  { rota: 'rotaDinheiro', label: 'Rota do dinheiro' },
];

export function telaFeedbackDaUrl(url: string | null | undefined): TelaFeedback {
  const rota = String(url ?? '')
    .split(/[?#]/)[0]
    .split('/')
    .filter(Boolean)[0];

  return TELAS_FEEDBACK.find((t) => t.rota && t.rota === rota) ?? TELA_FEEDBACK_GERAL;
}
