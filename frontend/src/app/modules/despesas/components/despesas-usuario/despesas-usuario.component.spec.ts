import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DespesasUsuarioComponent } from './despesas-usuario.component';
import { Despesa } from '@app/core/interfaces/despesas/despesas';

describe('DespesasUsuarioComponent', () => {
  let component: DespesasUsuarioComponent;
  let fixture: ComponentFixture<DespesasUsuarioComponent>;

  function despesa(
    partial: Partial<Despesa> & Pick<Despesa, 'valor' | 'natureza'>,
  ): Despesa {
    return {
      id: partial.id ?? 1,
      pessoa: partial.pessoa,
      natureza: partial.natureza,
      categoria: partial.categoria ?? 'Cat',
      descricao: partial.descricao ?? 'd',
      valor: partial.valor,
      data: partial.data ?? null,
      ano: partial.ano ?? 2026,
      mes: partial.mes ?? 4,
    };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule],
      declarations: [DespesasUsuarioComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DespesasUsuarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Inicialização', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('ngOnChanges', () => {
    it('deve chamar reconciliarSelecaoAposMudancaLista quando despesas mudar', () => {
      const spy = jest.spyOn(
        component as any,
        'reconciliarSelecaoAposMudancaLista',
      );

      component.ngOnChanges({
        despesas: {
          currentValue: [],
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(spy).toHaveBeenCalled();
    });

    it('não deve chamar reconciliarSelecaoAposMudancaLista quando despesas não mudar', () => {
      const spy = jest.spyOn(
        component as any,
        'reconciliarSelecaoAposMudancaLista',
      );

      component.ngOnChanges({});

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('reconciliarSelecaoAposMudancaLista', () => {
    it('deve limpar usuarioFiltro quando atualValido for false', () => {
      component.usuarioFiltro = 'Kelly';

      Object.defineProperty(component, 'linhasPorUsuario', {
        get: jest
          .fn()
          .mockReturnValue([
            { usuario: 'Ana', fixa: 10, variavel: 0, total: 10 },
          ]),
      });

      component['reconciliarSelecaoAposMudancaLista']();

      expect(component.usuarioFiltro).toBe('');
    });

    it('deve manter usuarioFiltro quando atualValido for true', () => {
      component.usuarioFiltro = 'Kelly';

      Object.defineProperty(component, 'linhasPorUsuario', {
        get: jest
          .fn()
          .mockReturnValue([
            { usuario: 'Kelly', fixa: 10, variavel: 0, total: 10 },
          ]),
      });

      component['reconciliarSelecaoAposMudancaLista']();

      expect(component.usuarioFiltro).toBe('Kelly');
    });

    it('deve limpar usuarioFiltro quando não houver linhas', () => {
      component.usuarioFiltro = 'Kelly';

      Object.defineProperty(component, 'linhasPorUsuario', {
        get: jest.fn().mockReturnValue([]),
      });

      component['reconciliarSelecaoAposMudancaLista']();

      expect(component.usuarioFiltro).toBe('');
    });

    it('deve retornar sem alterar quando não houver usuarioFiltro', () => {
      component.usuarioFiltro = '';

      Object.defineProperty(component, 'linhasPorUsuario', {
        get: jest
          .fn()
          .mockReturnValue([
            { usuario: 'Kelly', fixa: 10, variavel: 0, total: 10 },
          ]),
      });

      component['reconciliarSelecaoAposMudancaLista']();

      expect(component.usuarioFiltro).toBe('');
    });
  });

  describe('linhasPorUsuario', () => {
    it('deve somar fixas e variáveis por pessoa no mês', () => {
      fixture.componentRef.setInput('despesas', [
        despesa({ id: 1, pessoa: 'Kelly', natureza: 'fixa', valor: 247 }),
        despesa({ id: 2, pessoa: 'Kelly', natureza: 'variavel', valor: 100 }),
        despesa({ id: 3, pessoa: 'Ana', natureza: 'fixa', valor: 50 }),
      ]);
      fixture.detectChanges();

      const linhas = component.linhasPorUsuario;
      const kelly = linhas.find((r) => r.usuario === 'Kelly');

      expect(linhas.length).toBe(2);
      expect(kelly?.fixa).toBe(247);
      expect(kelly?.variavel).toBe(100);
      expect(kelly?.total).toBe(347);
    });

    it('deve agrupar sem pessoa em (Sem usuário)', () => {
      fixture.componentRef.setInput('despesas', [
        despesa({ id: 1, pessoa: '', natureza: 'fixa', valor: 10 }),
      ]);
      fixture.detectChanges();

      expect(component.linhasPorUsuario[0].usuario).toBe('(Sem usuário)');
    });

    it('deve considerar valor inválido como 0', () => {
      fixture.componentRef.setInput('despesas', [
        despesa({
          id: 1,
          pessoa: 'Kelly',
          natureza: 'fixa',
          valor: undefined as any,
        }),
        despesa({
          id: 2,
          pessoa: 'Kelly',
          natureza: 'variavel',
          valor: 'abc' as any,
        }),
      ]);

      fixture.detectChanges();

      const kelly = component.linhasPorUsuario.find(
        (r) => r.usuario === 'Kelly',
      );

      expect(kelly?.fixa).toBe(0);
      expect(kelly?.variavel).toBe(0);
      expect(kelly?.total).toBe(0);
    });
  });

  describe('linhasVisiveis', () => {
    it('não deve selecionar usuário automaticamente após carregar despesas', () => {
      fixture.componentRef.setInput('despesas', [
        despesa({ id: 1, pessoa: 'Kelly', natureza: 'fixa', valor: 1 }),
        despesa({ id: 2, pessoa: 'Ana', natureza: 'fixa', valor: 2 }),
      ]);

      fixture.detectChanges();

      expect(component.usuarioFiltro).toBe('');
      expect(component.linhasVisiveis.length).toBe(0);
    });

    it('deve restringir linhasVisiveis pelo usuarioFiltro', () => {
      fixture.componentRef.setInput('despesas', [
        despesa({ id: 1, pessoa: 'Kelly', natureza: 'fixa', valor: 247 }),
        despesa({ id: 2, pessoa: 'Ana', natureza: 'variavel', valor: 10 }),
      ]);

      fixture.detectChanges();

      component.usuarioFiltro = 'Kelly';

      expect(component.linhasVisiveis.length).toBe(1);
      expect(component.linhasVisiveis[0].usuario).toBe('Kelly');
    });
  });

  describe('despesasDetalhesFiltradas', () => {
    it('deve listar só do usuário selecionado', () => {
      fixture.componentRef.setInput('despesas', [
        despesa({
          id: 1,
          pessoa: 'Kelly',
          natureza: 'fixa',
          valor: 10,
          descricao: 'a',
        }),
        despesa({
          id: 2,
          pessoa: 'Ana',
          natureza: 'variavel',
          valor: 5,
          descricao: 'b',
        }),
      ]);
      fixture.detectChanges();

      component.usuarioFiltro = 'Kelly';

      expect(component.despesasDetalhesFiltradas.length).toBe(1);
      expect(component.despesasDetalhesFiltradas[0].pessoa).toBe('Kelly');
    });

    it('deve retornar vazio quando usuarioFiltro não estiver preenchido', () => {
      component.usuarioFiltro = '';

      expect(component.despesasDetalhesFiltradas).toEqual([]);
    });

    it('deve ordenar por data quando datas forem diferentes', () => {
      fixture.componentRef.setInput('despesas', [
        despesa({
          id: 1,
          pessoa: 'Kelly',
          natureza: 'fixa',
          valor: 10,
          descricao: 'B',
          data: '2026-04-20',
        }),
        despesa({
          id: 2,
          pessoa: 'Kelly',
          natureza: 'fixa',
          valor: 20,
          descricao: 'A',
          data: '2026-04-10',
        }),
      ]);

      fixture.detectChanges();

      component.usuarioFiltro = 'Kelly';

      const result = component.despesasDetalhesFiltradas;

      expect(result[0].id).toBe(2);
      expect(result[1].id).toBe(1);
    });

    it('deve ordenar por descrição quando datas forem iguais ou vazias', () => {
      fixture.componentRef.setInput('despesas', [
        despesa({
          id: 1,
          pessoa: 'Kelly',
          natureza: 'fixa',
          categoria: 'Outras',
          descricao: 'qualquer',
          valor: 10,
          data: null,
        }),
        despesa({
          id: 2,
          pessoa: 'Kelly',
          natureza: 'fixa',
          categoria: '',
          descricao: 'qualquer',
          valor: 20,
          data: null,
        }),
        despesa({
          id: 3,
          pessoa: 'Kelly',
          natureza: 'fixa',
          categoria: 'Teste',
          descricao: 'Abacaxi',
          valor: 30,
          data: null,
        }),
      ]);

      fixture.detectChanges();

      component.usuarioFiltro = 'Kelly';

      const result = component.despesasDetalhesFiltradas;

      expect(result.map((d) => d.id)).toEqual([2, 1, 3]);
    });
  });

  describe('despesasFixasUsuario e despesasVariaveisUsuario', () => {
    it('deve separar despesas por natureza', () => {
      fixture.componentRef.setInput('despesas', [
        despesa({ id: 1, pessoa: 'Kelly', natureza: 'fixa', valor: 10 }),
        despesa({ id: 2, pessoa: 'Kelly', natureza: 'variavel', valor: 5 }),
      ]);

      fixture.detectChanges();

      component.usuarioFiltro = 'Kelly';

      expect(component.despesasFixasUsuario.length).toBe(1);
      expect(component.despesasVariaveisUsuario.length).toBe(1);
      expect(component.totalGeralUsuario).toBe(15);
    });
  });

  describe('Subtotais do usuário', () => {
    it('deve retornar 0 quando não houver linha visível', () => {
      component.usuarioFiltro = '';

      expect(component.linhasVisiveis).toEqual([]);
      expect(component.subtotalFixasUsuario).toBe(0);
      expect(component.subtotalVariaveisUsuario).toBe(0);
      expect(component.totalGeralUsuario).toBe(0);
    });

    it('deve retornar valores da linha visível', () => {
      fixture.componentRef.setInput('despesas', [
        despesa({ id: 1, pessoa: 'Kelly', natureza: 'fixa', valor: 10 }),
        despesa({ id: 2, pessoa: 'Kelly', natureza: 'variavel', valor: 5 }),
      ]);

      fixture.detectChanges();

      component.usuarioFiltro = 'Kelly';

      expect(component.subtotalFixasUsuario).toBe(10);
      expect(component.subtotalVariaveisUsuario).toBe(5);
      expect(component.totalGeralUsuario).toBe(15);
    });
  });

  describe('Mudança de lista', () => {
    it('deve limpar seleção se o usuário não existir mais', () => {
      fixture.componentRef.setInput('despesas', [
        despesa({ id: 1, pessoa: 'Kelly', natureza: 'fixa', valor: 1 }),
      ]);
      fixture.detectChanges();

      component.usuarioFiltro = 'Kelly';

      fixture.componentRef.setInput('despesas', [
        despesa({ id: 2, pessoa: 'Outro', natureza: 'fixa', valor: 2 }),
      ]);

      fixture.detectChanges();

      expect(component.usuarioFiltro).toBe('');
    });
  });

  describe('Template', () => {
    it('deve renderizar Quem comprou, título da pessoa e blocos como na lista do mês', () => {
      fixture.componentRef.setInput('despesas', [
        despesa({ id: 1, pessoa: 'Kelly', natureza: 'fixa', valor: 247 }),
      ]);
      fixture.componentRef.setInput('nomeMesReferencia', 'Abril 2026');

      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;

      expect(el.textContent).toContain('Quem comprou');
      expect(el.querySelector('#despesasUsuarioSelect')).toBeTruthy();

      component.usuarioFiltro = 'Kelly';
      fixture.detectChanges();

      expect(el.textContent).toContain('Despesas - Kelly');
      expect(el.textContent).toContain('Despesas fixas');
      expect(el.textContent).toContain('Despesas variáveis');
      expect(el.textContent).toContain('Subtotal fixas');
      expect(el.textContent).toContain('Total do mês');

      const ths = el.querySelectorAll('.despesas-table thead th');

      expect(
        Array.from(ths).some((h) => h.textContent?.trim() === 'Data'),
      ).toBe(true);

      expect(
        Array.from(ths).some((h) => h.textContent?.trim() === 'Descrição'),
      ).toBe(true);
    });
  });

  describe('normalizarUsuario', () => {
    it('deve retornar pessoa sem espaços', () => {
      const result = component.normalizarUsuario(
        despesa({
          pessoa: ' Kelly ',
          natureza: 'fixa',
          valor: 10,
        }),
      );

      expect(result).toBe('Kelly');
    });

    it('deve retornar (Sem usuário) quando pessoa for vazia', () => {
      const result = component.normalizarUsuario(
        despesa({
          pessoa: '',
          natureza: 'fixa',
          valor: 10,
        }),
      );

      expect(result).toBe('(Sem usuário)');
    });
  });
});
