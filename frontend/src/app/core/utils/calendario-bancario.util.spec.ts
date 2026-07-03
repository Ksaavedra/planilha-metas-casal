import {
  ajustarParaDiaUtilAnterior,
  ajustarParaProximoDiaUtil,
  dataIsoDeDate,
  dataNoMes,
  domingoPascoa,
  feriadosNacionaisDoAno,
  isDiaUtil,
  isFeriadoBancario,
} from './calendario-bancario.util';

describe('calendario-bancario.util', () => {
  it('calcula Páscoa e feriados móveis de 2026', () => {
    const pascoa = domingoPascoa(2026);
    expect(pascoa.getFullYear()).toBe(2026);
    expect(pascoa.getMonth()).toBe(3);
    expect(pascoa.getDate()).toBe(5);

    const feriados = feriadosNacionaisDoAno(2026).map(
      (d) => `${d.getDate()}/${d.getMonth() + 1}`,
    );
    expect(feriados).toContain('17/2'); // carnaval
    expect(feriados).toContain('3/4'); // sexta-feira santa
    expect(feriados).toContain('4/6'); // corpus christi
  });

  it('mantém vencimento em dia útil (segunda a sexta)', () => {
    const quarta = dataNoMes(2026, 3, 11);
    expect(quarta.getDay()).toBe(3);
    expect(dataIsoDeDate(ajustarParaProximoDiaUtil(quarta))).toBe('2026-03-11');
  });

  it('posterga vencimentos conforme regra bancária (exemplos 2026)', () => {
    const casos: Array<{ mes: number; dia: number; esperado: string }> = [
      { mes: 7, dia: 5, esperado: '2026-07-06' }, // domingo → segunda
      { mes: 9, dia: 7, esperado: '2026-09-08' }, // feriado (7/set) → terça
      { mes: 10, dia: 12, esperado: '2026-10-13' }, // feriado (12/out) → terça
      { mes: 11, dia: 15, esperado: '2026-11-16' }, // domingo → segunda
      { mes: 12, dia: 25, esperado: '2026-12-28' }, // feriado (sex) → segunda
    ];

    for (const { mes, dia, esperado } of casos) {
      const ajustado = ajustarParaProximoDiaUtil(dataNoMes(2026, mes, dia));
      expect(dataIsoDeDate(ajustado)).toBe(esperado);
    }
  });

  it('posterga vencimento de sábado para segunda-feira', () => {
    const sabado = dataNoMes(2026, 3, 7);
    expect(ajustarParaProximoDiaUtil(sabado).getDate()).toBe(9);
  });

  it('identifica fim de semana e feriado nacional', () => {
    expect(isDiaUtil(new Date(2026, 1, 26))).toBe(true); // qui 26/02
    expect(isDiaUtil(new Date(2026, 1, 28))).toBe(false); // sáb
    expect(isFeriadoBancario(new Date(2026, 0, 1))).toBe(true);
  });

  it('posterga vencimento e antecipa fechamento para dia útil', () => {
    const sabado = dataNoMes(2026, 3, 7);
    expect(ajustarParaProximoDiaUtil(sabado).getDate()).toBe(9);
    expect(ajustarParaDiaUtilAnterior(sabado).getDate()).toBe(6);
  });

  it('aceita feriados extras por banco', () => {
    const data = dataNoMes(2026, 5, 11);
    expect(isDiaUtil(data)).toBe(true);
    expect(
      isDiaUtil(data, { feriadosExtrasIso: ['2026-05-11'] }),
    ).toBe(false);
  });
});
