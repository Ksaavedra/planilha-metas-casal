import { DividasExemplosComponent } from './dividas-exemplos.component';

describe('DividasExemplosComponent', () => {
  it('deve retornar textos e exemplos de empréstimos', () => {
    const component = new DividasExemplosComponent();

    component.contexto = 'emprestimos';

    expect(component.titulo).toBe('Exemplos de empréstimos');
    expect(component.introducao).toContain('empréstimos pessoais');
    expect(component.exemplos.length).toBe(3);
    expect(component.exemplos[0].titulo).toBe('Empréstimo pessoal');
    expect(component.dica).toContain('dinheiro tomado emprestado');
  });

  it('deve retornar textos e exemplos de financiamentos', () => {
    const component = new DividasExemplosComponent();

    component.contexto = 'financiamentos';

    expect(component.titulo).toBe('Exemplos de financiamentos');
    expect(component.introducao).toContain('bens financiados');
    expect(component.exemplos.length).toBe(3);
    expect(component.exemplos[0].titulo).toBe('Financiamento imobiliário');
    expect(component.dica).toContain('bem de longo prazo');
  });
});
