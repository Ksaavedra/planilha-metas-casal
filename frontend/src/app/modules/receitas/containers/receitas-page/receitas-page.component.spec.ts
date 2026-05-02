import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { ReceitasPageComponent } from './receitas-page.component';
import { ReceitasService } from '../../../../core/services/receitas/receitas.service';
import { Receita } from '@app/core/interfaces/receitas/receitas';

describe('ReceitasPageComponent', () => {
  let component: ReceitasPageComponent;
  let fixture: ComponentFixture<ReceitasPageComponent>;

  const mockReceita: Receita = {
    id: 1,
    pessoa: 'Kelly',
    natureza: 'fixa',
    categoria: 'Fixa',
    valor: 2000,
    data: '2026-01-01',
    ano: 2026,
    mes: 1,
  };

  const receitasServiceMock = {
    getReceitas: jest.fn(),
    deleteReceita: jest.fn(),
    calcularTotalReceitas: jest.fn(),
  };

  const dialogMock = {
    open: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    receitasServiceMock.getReceitas.mockReturnValue(of([mockReceita]));
    receitasServiceMock.deleteReceita.mockReturnValue(of(void 0));
    receitasServiceMock.calcularTotalReceitas.mockImplementation(
      (receitas: Receita[]) =>
        receitas.reduce((total, item) => total + Number(item.valor || 0), 0),
    );

    dialogMock.open.mockReturnValue({
      afterClosed: () => of(false),
    });

    await TestBed.configureTestingModule({
      declarations: [ReceitasPageComponent],
      imports: [NoopAnimationsModule],
      providers: [
        { provide: ReceitasService, useValue: receitasServiceMock },
        { provide: MatDialog, useValue: dialogMock },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ReceitasPageComponent);
    component = fixture.componentInstance;
  });

  describe('Inicialização', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('ngOnInit', () => {
    it('ngOnInit deve carregar receitas', () => {
      component.ngOnInit();

      expect(receitasServiceMock.getReceitas).toHaveBeenCalledWith({
        ano: component.anoRef,
        mes: component.mesRef,
      });
    });

    it('deve retornar nomeMesAtual', () => {
      component.mesAtual = new Date(2025, 0, 1);

      expect(component.nomeMesAtual).toBe('Janeiro 2025');
    });
  });

  describe('Getters de receitas', () => {
    it('deve filtrar receitas fixas e variáveis', () => {
      component.receitas = [
        mockReceita,
        { ...mockReceita, id: 2, natureza: 'variavel' },
      ];
      expect(component.receitasFixas.length).toBe(1);
      expect(component.receitasVariaveis.length).toBe(1);
    });

    it('deve calcular totais', () => {
      component.receitas = [
        mockReceita,
        { ...mockReceita, id: 2, natureza: 'variavel', valor: 20 },
        { ...mockReceita, id: 3, natureza: 'variavel', valor: 30 },
      ];
      expect(component.totalFixas).toBe(2000);
      expect(component.totalVariaveis).toBe(50);
      expect(component.totalGeral).toBe(2050);
    });

    it('deve retornar anoRef e mesRef', () => {
      component.mesAtual = new Date(2025, 4, 1);

      expect(component.anoRef).toBe(2025);
      expect(component.mesRef).toBe(5);
    });

    it('deve chamar calcularTotalReceitas para totalVariaveis e totalGeral', () => {
      const receitaFixa = mockReceita;
      const receitaVariavel = {
        ...mockReceita,
        id: 2,
        natureza: 'variavel' as const,
        valor: 50,
      };

      component.receitas = [receitaFixa, receitaVariavel];

      const totalVariaveis = component.totalVariaveis;
      const totalGeral = component.totalGeral;

      expect(totalVariaveis).toBe(50);
      expect(totalGeral).toBe(2050);

      expect(receitasServiceMock.calcularTotalReceitas).toHaveBeenCalledWith([
        receitaVariavel,
      ]);

      expect(receitasServiceMock.calcularTotalReceitas).toHaveBeenCalledWith([
        receitaFixa,
        receitaVariavel,
      ]);
      expect(receitasServiceMock.calcularTotalReceitas).toHaveBeenCalledWith([
        receitaFixa,
        receitaVariavel,
      ]);
    });
  });

  describe('Carregar receitas', () => {
    it('deve carregar receitas com sucesso', () => {
      receitasServiceMock.getReceitas.mockReturnValue(of([mockReceita]));

      component.carregar();

      expect(component.loading).toBe(false);
      expect(component.erroCarregar).toBeNull();
      expect(component.receitas).toEqual([mockReceita]);
    });

    it('carregar deve tratar erro da API com error.error', () => {
      receitasServiceMock.getReceitas.mockReturnValue(
        throwError(() => ({ error: { error: 'Erro Message' } })),
      );

      component.carregar();

      expect(component.loading).toBe(false);
      expect(component.receitas).toEqual([]);
      expect(component.erroCarregar).toBe('Erro Message');
    });

    it('deve tratar erro da API com message', () => {
      receitasServiceMock.getReceitas.mockReturnValue(
        throwError(() => ({ error: { error: 'Erro Message' } })),
      );

      component.carregar();

      expect(component.erroCarregar).toBe('Erro Message');
    });

    it('deve usar mensagem padrão quando erro não tiver mensagem', () => {
      receitasServiceMock.getReceitas.mockReturnValue(throwError(() => ({})));

      component.carregar();

      expect(component.erroCarregar).toBe(
        'Não foi possível carregar receitas.',
      );
    });
  });

  describe('Navegação de mês', () => {
    it('mesAnterior deve voltar um mês e carregar', () => {
      const carregarSpy = jest.spyOn(component, 'carregar');
      component.mesAtual = new Date(2025, 1, 1);

      component.mesAnterior();

      expect(component.mesAtual.getMonth()).toBe(0);
      expect(carregarSpy).toHaveBeenCalled();
    });

    it('proximoMes deve avançar um mês e carregar', () => {
      const carregarSpy = jest.spyOn(component, 'carregar');
      component.mesAtual = new Date(2025, 0, 1);

      component.proximoMes();

      expect(component.mesAtual.getMonth()).toBe(1);
      expect(carregarSpy).toHaveBeenCalled();
    });
  });

  describe('Visão', () => {
    it('selecionarVisao deve alternar visão', () => {
      expect(component.visaoReceitas).toBe('lista');

      component.selecionarVisao('exemplos');
      expect(component.visaoReceitas).toBe('exemplos');

      component.selecionarVisao('lista');
      expect(component.visaoReceitas).toBe('lista');
    });
  });

  describe('Dialog de adicionar/editar', () => {
    it('abrirModalAdicionarReceita deve abrir dialog', () => {
      component.abrirModalAdicionarReceita();

      expect(dialogMock.open).toHaveBeenCalled();
    });

    it('editar deve abrir dialog com receita', () => {
      component.editar(mockReceita);

      expect(dialogMock.open).toHaveBeenCalled();
    });

    it('deve carregar quando dialog fechar com saved true', () => {
      dialogMock.open.mockReturnValue({
        afterClosed: () => of(true),
      });

      const carregarSpy = jest.spyOn(component, 'carregar');

      component.abrirModalAdicionarReceita();

      expect(carregarSpy).toHaveBeenCalled();
    });
  });

  describe('abrirModalSucesso', () => {
    it('deve abrir modal com mensagem de edição', () => {
      component['abrirModalSucesso'](true);

      expect(dialogMock.open).toHaveBeenCalled();

      const call = dialogMock.open.mock.calls[0][1];

      expect(call.data.title).toBe('Receita atualizada!');
      expect(call.data.message).toBe('A receita foi atualizada com sucesso.');
    });

    it('deve abrir modal com mensagem de criação', () => {
      component['abrirModalSucesso'](false);

      expect(dialogMock.open).toHaveBeenCalled();

      const call = dialogMock.open.mock.calls[0][1];

      expect(call.data.title).toBe('Receita adicionada!');
      expect(call.data.message).toBe('A receita foi adicionada com sucesso.');
    });
  });

  describe('Excluir com MatDialog', () => {
    it('abrirConfirmExcluir deve abrir modal de confirmação', () => {
      component.abrirConfirmExcluir(mockReceita);

      expect(dialogMock.open).toHaveBeenCalled();
    });

    it('deve excluir quando confirmado', () => {
      dialogMock.open.mockReturnValueOnce({
        afterClosed: () => of(true),
      });

      const carregarSpy = jest.spyOn(component, 'carregar');

      component.abrirConfirmExcluir(mockReceita);

      expect(receitasServiceMock.deleteReceita).toHaveBeenCalledWith(1);
      expect(carregarSpy).toHaveBeenCalled();
      expect(dialogMock.open).toHaveBeenCalledTimes(2);
    });

    it('não deve excluir quando não confirmado', () => {
      dialogMock.open.mockReturnValue({
        afterClosed: () => of(false),
      });

      component.abrirConfirmExcluir(mockReceita);

      expect(receitasServiceMock.deleteReceita).not.toHaveBeenCalled();
    });

    it('deve tratar erro ao excluir', () => {
      dialogMock.open.mockReturnValueOnce({
        afterClosed: () => of(true),
      });

      receitasServiceMock.deleteReceita.mockReturnValue(
        throwError(() => ({ error: { error: 'Erro excluir' } })),
      );

      component.abrirConfirmExcluir(mockReceita);

      expect(component.erroCarregar).toBe('Erro excluir');
    });

    it('deve usar mensagem padrão ao excluir (abrirConfirmExcluir)', () => {
      dialogMock.open.mockReturnValueOnce({
        afterClosed: () => of(true),
      });

      receitasServiceMock.deleteReceita.mockReturnValue(throwError(() => ({})));

      component.abrirConfirmExcluir(mockReceita);

      expect(component.erroCarregar).toBe('Erro ao excluir.');
    });
  });

  describe('Labels', () => {
    it('deve retornar pessoa preenchida', () => {
      expect(component.labelPessoa(mockReceita)).toBe('Kelly');
    });

    it('deve retornar traço quando pessoa vazia', () => {
      expect(component.labelPessoa({ ...mockReceita, pessoa: '  ' })).toBe('—');
    });

    it('deve retornar traço quando pessoa undefined', () => {
      expect(component.labelPessoa({ ...mockReceita, pessoa: undefined })).toBe(
        '—',
      );
    });

    it('deve retornar Fixa', () => {
      expect(component.labelNatureza('fixa')).toBe('Fixa');
    });

    it('deve retornar Variável', () => {
      expect(component.labelNatureza('variavel')).toBe('Variável');
    });
  });
});
