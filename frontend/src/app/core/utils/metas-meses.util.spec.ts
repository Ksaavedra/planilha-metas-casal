import {
  buildAnosComparacaoParaMetas,
  filtrarMesesPorAno,
  formatMesAno,
  gerarMesesPlanejamento,
  mesesTotaisDoPlano,
  metaVisivelNoExercicio,
  migrarMesesLegado,
  ordenarNomesMeses,
  regenerarMesesMeta,
} from './metas-meses.util';

describe('metas-meses.util', () => {
  it('gera 18 meses cruzando 2026 e 2027', () => {
    const meses = gerarMesesPlanejamento(2026, 18, 2000);
    expect(meses).toHaveLength(18);
    expect(meses[0].nome).toBe('Janeiro/2026');
    expect(meses[11].nome).toBe('Dezembro/2026');
    expect(meses[12].nome).toBe('Janeiro/2027');
    expect(meses[17].nome).toBe('Junho/2027');
  });

  it('filtra colunas pelo ano do exercício', () => {
    const nomes = gerarMesesPlanejamento(2026, 18, 0).map((m) => m.nome);
    expect(filtrarMesesPorAno(nomes, 2026)).toHaveLength(12);
    expect(filtrarMesesPorAno(nomes, 2027)).toHaveLength(6);
  });

  it('ordena meses cronologicamente', () => {
    const ordenados = ordenarNomesMeses([
      'Março/2027',
      'Janeiro/2026',
      'Fevereiro/2026',
    ]);
    expect(ordenados[0]).toBe('Janeiro/2026');
    expect(ordenados[2]).toBe('Março/2027');
  });

  it('migra meses legados sem ano no nome', () => {
    const meta = {
      ano: 2026,
      mesesNecessarios: 18,
      meses: [
        { id: 1, nome: 'Janeiro', valor: 100, status: 'Pago' as const },
        { id: 2, nome: 'Fevereiro', valor: 0, status: 'Vazio' as const },
      ],
    };
    migrarMesesLegado(meta, 2026);
    expect(meta.meses[0].nome).toBe('Janeiro/2026');
    expect(meta.meses[0].valor).toBe(100);
    expect(meta.meses).toHaveLength(18);
  });

  it('preserva pagamentos ao regenerar meses', () => {
    const meta = {
      meses: [
        { id: 1, nome: 'Janeiro/2026', valor: 500, status: 'Pago' as const },
        { id: 2, nome: 'Fevereiro/2026', valor: 2000, status: 'Programado' as const },
      ],
    };
    const novos = regenerarMesesMeta(meta, 2026, 3, 2000);
    expect(novos[0].status).toBe('Pago');
    expect(novos[0].valor).toBe(500);
    expect(novos[1].valor).toBe(2000);
    expect(novos[2].nome).toBe('Março/2026');
  });

  it('formatMesAno usa nomes em português', () => {
    expect(formatMesAno(0, 2027)).toBe('Janeiro/2027');
  });

  it('metaVisivelNoExercicio inclui meta de 2026 com meses em 2027', () => {
    const meta = {
      ano: 2026,
      meses: gerarMesesPlanejamento(2026, 18, 0),
    };
    expect(metaVisivelNoExercicio(meta, 2026, 2026)).toBe(true);
    expect(metaVisivelNoExercicio(meta, 2027, 2026)).toBe(true);
    expect(metaVisivelNoExercicio(meta, 2025, 2026)).toBe(false);
  });

  it('metaAlcancaAnoCalendario usa mesesNecessarios mesmo sem /ano no nome', () => {
    const meta = {
      ano: 2026,
      mesesNecessarios: 18,
      meses: [
        { id: 1, nome: 'Janeiro', valor: 0, status: 'Vazio' as const },
        { id: 2, nome: 'Fevereiro', valor: 0, status: 'Vazio' as const },
      ],
    };
    expect(metaVisivelNoExercicio(meta, 2027, 2026)).toBe(true);
    expect(metaVisivelNoExercicio(meta, 2024, 2026)).toBe(false);
  });

  it('buildAnosComparacaoParaMetas estende ate o fim do plano de 100 meses', () => {
    const anos = buildAnosComparacaoParaMetas(
      [{ ano: 2026, mesesNecessarios: 100 }],
      2026,
    );
    expect(anos[0]).toBe(2020);
    expect(anos[anos.length - 1]).toBe(2034);
    expect(metaVisivelNoExercicio({ ano: 2026, mesesNecessarios: 100 }, 2034, 2026)).toBe(
      true,
    );
  });

  it('buildAnosComparacaoParaMetas nao limita ano fim (meta longa além de 2034)', () => {
    const anos = buildAnosComparacaoParaMetas(
      [{ ano: 2026, mesesNecessarios: 200 }],
      2026,
    );
    expect(anos[anos.length - 1]).toBeGreaterThan(2034);
    expect(metaVisivelNoExercicio({ ano: 2026, mesesNecessarios: 200 }, 2042, 2026)).toBe(
      true,
    );
  });

  it('mesesTotaisDoPlano calcula 100 para 500000 e 5000 por mes', () => {
    expect(
      mesesTotaisDoPlano({ valorMeta: 500_000, valorPorMes: 5_000 }),
    ).toBe(100);
  });

  it('meta com mesesNecessarios 0 nao aparece em anos futuros', () => {
    const meta = {
      ano: 2026,
      mesesNecessarios: 0,
      meses: [{ id: 1, nome: 'Janeiro/2026', valor: 0, status: 'Vazio' as const }],
    };
    expect(metaVisivelNoExercicio(meta, 2027, 2026)).toBe(false);
  });
});
