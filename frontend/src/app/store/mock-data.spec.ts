import {
  CATEGORIAS_EXEMPLO,
  RECEITAS_EXEMPLO,
  DESPESAS_EXEMPLO,
  DIVIDAS_EXEMPLO,
  INVESTIMENTOS_EXEMPLO,
  METAS_EXEMPLO,
} from './mock-data';

describe('Mock Data', () => {
  it('should have categorias exemplo', () => {
    expect(CATEGORIAS_EXEMPLO).toBeDefined();
    expect(Array.isArray(CATEGORIAS_EXEMPLO)).toBe(true);
    expect(CATEGORIAS_EXEMPLO.length).toBeGreaterThan(0);
  });

  it('should have receitas exemplo', () => {
    expect(RECEITAS_EXEMPLO).toBeDefined();
    expect(Array.isArray(RECEITAS_EXEMPLO)).toBe(true);
    expect(RECEITAS_EXEMPLO.length).toBeGreaterThan(0);
  });

  it('should have despesas exemplo', () => {
    expect(DESPESAS_EXEMPLO).toBeDefined();
    expect(Array.isArray(DESPESAS_EXEMPLO)).toBe(true);
    expect(DESPESAS_EXEMPLO.length).toBeGreaterThan(0);
  });

  it('should have dividas exemplo', () => {
    expect(DIVIDAS_EXEMPLO).toBeDefined();
    expect(Array.isArray(DIVIDAS_EXEMPLO)).toBe(true);
    expect(DIVIDAS_EXEMPLO.length).toBeGreaterThan(0);
  });

  it('should have investimentos exemplo', () => {
    expect(INVESTIMENTOS_EXEMPLO).toBeDefined();
    expect(Array.isArray(INVESTIMENTOS_EXEMPLO)).toBe(true);
    expect(INVESTIMENTOS_EXEMPLO.length).toBeGreaterThan(0);
  });

  it('should have metas exemplo', () => {
    expect(METAS_EXEMPLO).toBeDefined();
    expect(Array.isArray(METAS_EXEMPLO)).toBe(true);
    expect(METAS_EXEMPLO.length).toBeGreaterThan(0);
  });

  it('should have consistent data structure', () => {
    // Test categorias structure
    CATEGORIAS_EXEMPLO.forEach((categoria) => {
      expect(categoria.id).toBeDefined();
      expect(categoria.nome).toBeDefined();
      expect(categoria.cor).toBeDefined();
      expect(categoria.icone).toBeDefined();
    });

    // Test receitas structure
    RECEITAS_EXEMPLO.forEach((receita) => {
      expect(receita.id).toBeDefined();
      expect(receita.descricao).toBeDefined();
      expect(receita.valor).toBeDefined();
      expect(receita.data).toBeInstanceOf(Date);
      expect(receita.categoria).toBeDefined();
      expect(receita.tipoReceita).toBeDefined();
      expect(receita.recorrente).toBeDefined();
    });

    // Test despesas structure
    DESPESAS_EXEMPLO.forEach((despesa) => {
      expect(despesa.id).toBeDefined();
      expect(despesa.descricao).toBeDefined();
      expect(despesa.valor).toBeDefined();
      expect(despesa.data).toBeInstanceOf(Date);
      expect(despesa.categoria).toBeDefined();
      expect(despesa.tipoDespesa).toBeDefined();
      expect(despesa.recorrente).toBeDefined();
      expect(despesa.parcelada).toBeDefined();
    });

    // Test dividas structure
    DIVIDAS_EXEMPLO.forEach((divida) => {
      expect(divida.id).toBeDefined();
      expect(divida.descricao).toBeDefined();
      expect(divida.credor).toBeDefined();
      expect(divida.valorOriginal).toBeDefined();
      expect(divida.valorAtual).toBeDefined();
      expect(divida.dataVencimento).toBeInstanceOf(Date);
      expect(divida.status).toBeDefined();
      expect(divida.tipoDivida).toBeDefined();
      expect(divida.parcelada).toBeDefined();
    });

    // Test investimentos structure
    INVESTIMENTOS_EXEMPLO.forEach((investimento) => {
      expect(investimento.id).toBeDefined();
      expect(investimento.descricao).toBeDefined();
      expect(investimento.tipoInvestimento).toBeDefined();
      expect(investimento.valorInvestido).toBeDefined();
      expect(investimento.valorAtual).toBeDefined();
      expect(investimento.rentabilidade).toBeDefined();
      expect(investimento.rentabilidadePercentual).toBeDefined();
      expect(investimento.dataInicio).toBeInstanceOf(Date);
      expect(investimento.status).toBeDefined();
      expect(investimento.instituicao).toBeDefined();
      expect(investimento.risco).toBeDefined();
      expect(investimento.liquidez).toBeDefined();
    });

    // Test metas structure
    METAS_EXEMPLO.forEach((meta) => {
      expect(meta.id).toBeDefined();
      expect(meta.descricao).toBeDefined();
      expect(meta.valorMeta).toBeDefined();
      expect(meta.valorAtual).toBeDefined();
      expect(meta.percentualConcluido).toBeDefined();
      expect(meta.dataInicio).toBeInstanceOf(Date);
      expect(meta.dataLimite).toBeInstanceOf(Date);
      expect(meta.status).toBeDefined();
      expect(meta.tipoMeta).toBeDefined();
      expect(meta.prioridade).toBeDefined();
    });
  });
});
