import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { RelatorioCategoriasComponent } from './relatorio-categorias.component';

describe('RelatorioCategoriasComponent', () => {
  let component: RelatorioCategoriasComponent;
  let fixture: ComponentFixture<RelatorioCategoriasComponent>;

  const meses = ['Janeiro', 'Fevereiro'];
  const zerosDois = [0, 0];

  function montarDadosCompletos(): void {
    component.anoSelecionado = 2026;
    component.meses = meses;
    component.naturezaReceitaLinhas = [
      {
        id: 'fixa',
        label: 'Receitas fixas',
        valores: [100, 200],
        total: 300,
      },
      {
        id: 'variavel',
        label: 'Receitas variáveis',
        valores: [50, 50],
        total: 100,
      },
    ];
    component.receitasPorTipoLinhas = [
      {
        tipo: 'Salário',
        valores: [100, 150],
        total: 250,
      },
    ];
    component.naturezaDespesaLinhas = [
      {
        id: 'fixa',
        label: 'Despesas fixas',
        valores: [80, 80],
        total: 160,
      },
      {
        id: 'variavel',
        label: 'Despesas variáveis',
        valores: [20, 30],
        total: 50,
      },
    ];
    component.despesasPorCategoriaLinhas = [
      {
        categoria: 'Moradia',
        valores: [80, 90],
        total: 170,
      },
    ];
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [RelatorioCategoriasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RelatorioCategoriasComponent);
    component = fixture.componentInstance;
    component.anoSelecionado = 2026;
    component.meses = meses;
    component.naturezaReceitaLinhas = [
      {
        id: 'fixa',
        label: 'Receitas fixas',
        valores: zerosDois,
        total: 0,
      },
    ];
    component.receitasPorTipoLinhas = [];
    component.naturezaDespesaLinhas = [
      {
        id: 'fixa',
        label: 'Despesas fixas',
        valores: zerosDois,
        total: 0,
      },
    ];
    component.despesasPorCategoriaLinhas = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve expor ano e meses via @Input', () => {
    expect(component.anoSelecionado).toBe(2026);
    expect(component.meses).toEqual(meses);
  });

  it('deve definir aria-label da seção com o exercício', () => {
    const section = (fixture.nativeElement as HTMLElement).querySelector(
      'section.relatorio-categorias',
    );
    expect(section?.getAttribute('aria-label')).toContain('2026');
    expect(section?.getAttribute('aria-label')).toContain('Receitas e despesas');
  });

  it('deve renderizar intro de receitas e de despesas com o exercício', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('2026');
    expect(el.textContent).toContain('página Receitas');
    expect(el.textContent).toContain('página Despesas');
  });

  it('deve renderizar os quatro títulos h2 esperados', () => {
    montarDadosCompletos();
    fixture.detectChanges();
    const titles = (
      fixture.nativeElement as HTMLElement
    ).querySelectorAll('h2.relatorio-categorias__h2');
    expect(titles.length).toBe(4);
    const text = Array.from(titles).map((h) => h.textContent?.trim() ?? '');
    expect(text.some((t) => t.includes('Receitas') && t.includes('natureza'))).toBe(
      true,
    );
    expect(text.some((t) => t.includes('Receitas') && t.includes('tipo'))).toBe(
      true,
    );
    expect(text.some((t) => t.includes('Despesas') && t.includes('natureza'))).toBe(
      true,
    );
    expect(
      text.some((t) => t.includes('Despesas') && t.includes('categoria')),
    ).toBe(true);
  });

  it('com dados completos deve exibir linhas de natureza e totais formatados', () => {
    montarDadosCompletos();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Receitas fixas');
    expect(el.textContent).toContain('Salário');
    expect(el.textContent).toContain('Despesas variáveis');
    expect(el.textContent).toContain('Moradia');
    expect(el.textContent).toMatch(/R\$/);
  });

  it('sem tipos de receita deve exibir mensagem vazia e ocultar tabela de tipos', () => {
    component.receitasPorTipoLinhas = [];
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(
      el.querySelector('.relatorio-categorias__vazio')?.textContent,
    ).toContain('receita');
    expect(
      el.querySelectorAll('.data-table--categorias table').length,
    ).toBeLessThan(4);
  });

  it('sem valores de natureza deve exibir mensagens vazias em vez de linhas zeradas', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const mensagens = Array.from(
      el.querySelectorAll('.relatorio-categorias__vazio'),
    ).map((item) => item.textContent ?? '');

    expect(el.querySelector('tr.natureza-receita--fixa')).toBeFalsy();
    expect(el.querySelector('tr.natureza-despesa--fixa')).toBeFalsy();
    expect(
      mensagens.some((texto) =>
        texto.includes('Nenhum lançamento de receita com valor'),
      ),
    ).toBe(true);
    expect(
      mensagens.some((texto) =>
        texto.includes('Nenhum lançamento de despesa com valor'),
      ),
    ).toBe(true);
  });

  it('com tipos de receita deve renderizar tabela de tipos', () => {
    component.receitasPorTipoLinhas = [
      {
        tipo: 'Freela',
        valores: zerosDois,
        total: 10,
      },
    ];
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Freela');
    expect(
      el.querySelectorAll(
        'h2.relatorio-categorias__h2 + .data-table--categorias',
      ).length,
    ).toBeGreaterThan(0);
  });

  it('sem categorias de despesa deve exibir segunda mensagem vazia sobre despesas', () => {
    component.despesasPorCategoriaLinhas = [];
    fixture.detectChanges();
    const vagas = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.relatorio-categorias__vazio',
    );
    const textos = Array.from(vagas).map((p) => p.textContent ?? '');
    expect(textos.some((t) => /despesa|categorias agregadas/i.test(t))).toBe(true);
  });

  it('com categorias de despesa deve listar a categoria nas células', () => {
    component.despesasPorCategoriaLinhas = [
      {
        categoria: 'Alimentação',
        valores: [10, 20],
        total: 30,
      },
    ];
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Alimentação',
    );
  });

  it('deve aplicar classes de natureza fixa/variável nas linhas de receita e despesa', () => {
    montarDadosCompletos();
    fixture.detectChanges();
    const recFixa = (
      fixture.nativeElement as HTMLElement
    ).querySelector('tr.natureza-receita--fixa');
    const despVar = (
      fixture.nativeElement as HTMLElement
    ).querySelector('tr.natureza-despesa--variavel');
    expect(recFixa).toBeTruthy();
    expect(despVar).toBeTruthy();
  });
});
