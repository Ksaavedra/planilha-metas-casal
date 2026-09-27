import { FaturasExemplosComponent } from './faturas-exemplos.component';

describe('FaturasExemplosComponent', () => {
  it('deve expor exemplos e conceitos para a tela', () => {
    const component = new FaturasExemplosComponent();

    expect(component.exemplos.length).toBe(3);
    expect(component.exemplos[0].banco).toBe('Nubank');
    expect(component.exemplos.some((e) => e.compraParcelada.includes('6x'))).toBe(true);
    expect(component.conceitos.map((c) => c.titulo)).toEqual([
      'Limite utilizado',
      'Limite disponível',
      'Vencimento',
      'Melhor compra',
    ]);
  });
});
