import {
  TELA_FEEDBACK_GERAL,
  TELAS_FEEDBACK,
  telaFeedbackDaUrl,
} from './feedback-telas.constant';

describe('feedback-telas.constant', () => {
  it('começa com "Sistema em geral" e tem as telas do menu', () => {
    expect(TELAS_FEEDBACK[0]).toBe(TELA_FEEDBACK_GERAL);
    expect(TELAS_FEEDBACK.map((t) => t.label)).toEqual(
      expect.arrayContaining(['Dashboard', 'Faturas', 'Metas', 'Despesas', 'Receitas']),
    );
  });

  it.each([
    ['/despesas', 'Despesas'],
    ['/faturas?mes=9', 'Faturas'],
    ['/metas#topo', 'Metas'],
    ['/financiamentos/detalhe/3', 'Financiamentos'],
    ['/rotaDinheiro', 'Rota do dinheiro'],
  ])('telaFeedbackDaUrl(%s) → %s', (url, label) => {
    expect(telaFeedbackDaUrl(url).label).toBe(label);
  });

  it.each(['/', '', '/tela-que-nao-existe', null, undefined])(
    'telaFeedbackDaUrl(%s) cai em "Sistema em geral"',
    (url) => {
      expect(telaFeedbackDaUrl(url)).toBe(TELA_FEEDBACK_GERAL);
    },
  );

  it('devolve o mesmo objeto da lista, para o select reconhecer a opção', () => {
    expect(TELAS_FEEDBACK).toContain(telaFeedbackDaUrl('/receitas'));
  });
});
