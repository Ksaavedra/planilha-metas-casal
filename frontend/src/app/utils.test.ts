// Funções utilitárias para testar
export function soma(a: number, b: number): number {
  return a + b;
}

export function multiplica(a: number, b: number): number {
  return a * b;
}

export function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Divisão por zero não é permitida');
  }
  return a / b;
}

export function calculaPercentual(valor: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return (valor / total) * 100;
}

export function formataMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

// Testes
describe('Funções Utilitárias', () => {
  describe('soma', () => {
    it('deve somar dois números positivos', () => {
      expect(soma(2, 3)).toBe(5);
    });

    it('deve somar números negativos', () => {
      expect(soma(-2, -3)).toBe(-5);
    });

    it('deve somar zero', () => {
      expect(soma(5, 0)).toBe(5);
    });
  });

  describe('multiplica', () => {
    it('deve multiplicar dois números positivos', () => {
      expect(multiplica(2, 3)).toBe(6);
    });

    it('deve multiplicar por zero', () => {
      expect(multiplica(5, 0)).toBe(0);
    });

    it('deve multiplicar números negativos', () => {
      expect(multiplica(-2, 3)).toBe(-6);
    });
  });

  describe('divide', () => {
    it('deve dividir dois números positivos', () => {
      expect(divide(6, 2)).toBe(3);
    });

    it('deve lançar erro ao dividir por zero', () => {
      expect(() => divide(5, 0)).toThrow('Divisão por zero não é permitida');
    });

    it('deve dividir números negativos', () => {
      expect(divide(-6, 2)).toBe(-3);
    });
  });

  describe('calculaPercentual', () => {
    it('deve calcular percentual correto', () => {
      expect(calculaPercentual(25, 100)).toBe(25);
    });

    it('deve retornar 0 quando total é zero', () => {
      expect(calculaPercentual(25, 0)).toBe(0);
    });

    it('deve calcular percentual decimal', () => {
      expect(calculaPercentual(1, 3)).toBeCloseTo(33.33, 1);
    });
  });

  describe('formataMoeda', () => {
    it('deve formatar valor em reais', () => {
      expect(formataMoeda(1234.56)).toContain('R$');
      expect(formataMoeda(1234.56)).toContain('1.234,56');
    });

    it('deve formatar valor zero', () => {
      expect(formataMoeda(0)).toContain('R$');
      expect(formataMoeda(0)).toContain('0,00');
    });

    it('deve formatar valor negativo', () => {
      expect(formataMoeda(-1234.56)).toContain('R$');
      expect(formataMoeda(-1234.56)).toContain('1.234,56');
    });
  });
});
