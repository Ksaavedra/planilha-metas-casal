import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { DespesasPageComponent } from './despesas-page.component';
import {
  Despesa,
  DespesasService,
} from 'app/core/services/despesas/despesas.service';

describe('DespesasPageComponent', () => {
  let component: DespesasPageComponent;
  let fixture: ComponentFixture<DespesasPageComponent>;

  const mockDespesa: Despesa = {
    id: 1,
    pessoa: 'Kelly',
    natureza: 'fixa',
    categoria: 'Casa',
    descricao: 'Teste',
    valor: 100,
    data: '2025-01-15',
    ano: 2025,
    mes: 1,
  };

  const despesasServiceMock = {
    getDespesas: jest.fn(),
    deleteDespesa: jest.fn(),
    calcularTotalDespesas: jest.fn(),
  };

  const dialogMock = {
    open: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    despesasServiceMock.getDespesas.mockReturnValue(of([]));
    despesasServiceMock.deleteDespesa.mockReturnValue(of(void 0));
    despesasServiceMock.calcularTotalDespesas.mockImplementation(
      (despesas: Despesa[]) =>
        despesas.reduce((total, item) => total + Number(item.valor || 0), 0),
    );

    dialogMock.open.mockReturnValue({
      afterClosed: () => of(false),
    });

    await TestBed.configureTestingModule({
      declarations: [DespesasPageComponent],
      imports: [NoopAnimationsModule],
      providers: [
        { provide: DespesasService, useValue: despesasServiceMock },
        { provide: MatDialog, useValue: dialogMock },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DespesasPageComponent);
    component = fixture.componentInstance;
  });

  describe('Inicialização', () => {
    it('deve criar', () => {
      expect(component).toBeTruthy();
    });

    it('ngOnInit deve carregar despesas', () => {
      component.ngOnInit();

      expect(despesasServiceMock.getDespesas).toHaveBeenCalledWith({
        ano: component.anoRef,
        mes: component.mesRef,
      });
    });

    it('deve retornar nomeMesAtual', () => {
      component.mesAtual = new Date(2025, 0, 1);

      expect(component.nomeMesAtual).toBe('Janeiro 2025');
    });
  });

  describe('Getters de despesas', () => {
    it('deve filtar despesas fixas e variáveis', () => {
      component.despesas = [
        mockDespesa,
        { ...mockDespesa, id: 2, natureza: 'variavel' },
      ];
      expect(component.despesasFixas.length).toBe(1);
      expect(component.despesasVariaveis.length).toBe(1);
    });

    it('deve calcular totais', () => {
      component.despesas = [
        mockDespesa,
        { ...mockDespesa, id: 2, natureza: 'variavel', valor: 20 },
        { ...mockDespesa, id: 3, natureza: 'variavel', valor: 30 },
      ];

      expect(component.totalFixas).toBe(100);
      expect(component.totalVariaveis).toBe(50);
      expect(component.totalGeral).toBe(150);
    });

    it('deve retornar anoRef e mesRef', () => {
      component.mesAtual = new Date(2025, 4, 1);

      expect(component.anoRef).toBe(2025);
      expect(component.mesRef).toBe(5);
    });

    it('deve chamar calcularTotalDespesas para totalVariaveis e totalGeral', () => {
      const despesaFixa = mockDespesa;
      const despesaVariavel = {
        ...mockDespesa,
        id: 2,
        natureza: 'variavel' as const,
        valor: 50,
      };

      component.despesas = [despesaFixa, despesaVariavel];

      const totalVariaveis = component.totalVariaveis;
      const totalGeral = component.totalGeral;

      expect(totalVariaveis).toBe(50);
      expect(totalGeral).toBe(150);

      expect(despesasServiceMock.calcularTotalDespesas).toHaveBeenCalledWith([
        despesaVariavel,
      ]);

      expect(despesasServiceMock.calcularTotalDespesas).toHaveBeenCalledWith([
        despesaFixa,
        despesaVariavel,
      ]);
    });
  });

  describe('Carregar despesas', () => {
    it('carregar deve preencher despesas com sucesso', () => {
      despesasServiceMock.getDespesas.mockReturnValue(of([mockDespesa]));

      component.carregar();

      expect(component.loading).toBe(false);
      expect(component.erroCarregar).toBeNull();
      expect(component.despesas).toEqual([mockDespesa]);
    });

    it('carregar deve tratar erro da API com error.error', () => {
      despesasServiceMock.getDespesas.mockReturnValue(
        throwError(() => ({ error: { error: 'Erro API' } })),
      );

      component.carregar();

      expect(component.loading).toBe(false);
      expect(component.despesas).toEqual([]);
      expect(component.erroCarregar).toBe('Erro API');
    });

    it('carregar deve tratar erro da API com message', () => {
      despesasServiceMock.getDespesas.mockReturnValue(
        throwError(() => ({ error: { error: 'Erro Message' } })),
      );

      component.carregar();

      expect(component.erroCarregar).toBe('Erro Message');
    });

    it('carregar deve usar mensagem padrão quando erro não tiver mensagem', () => {
      despesasServiceMock.getDespesas.mockReturnValue(throwError(() => ({})));

      component.carregar();

      expect(component.erroCarregar).toBe(
        'Não foi possível carregar despesas.',
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
      expect(component.visaoDespesas).toBe('lista');

      component.selecionarVisao('exemplos');
      expect(component.visaoDespesas).toBe('exemplos');

      component.selecionarVisao('lista');
      expect(component.visaoDespesas).toBe('lista');
    });
  });

  describe('Dialog de adicionar/editar', () => {
    it('abrirModalAdicionarDespesa deve abrir dialog', () => {
      component.abrirModalAdicionarDespesa();

      expect(dialogMock.open).toHaveBeenCalled();
    });

    it('editar deve abrir dialog com despesa', () => {
      component.editar(mockDespesa);

      expect(dialogMock.open).toHaveBeenCalled();
    });

    it('deve carregar quando dialog fechar com saved true', () => {
      dialogMock.open.mockReturnValue({
        afterClosed: () => of(true),
      });

      const carregarSpy = jest.spyOn(component, 'carregar');

      component.abrirModalAdicionarDespesa();

      expect(carregarSpy).toHaveBeenCalled();
    });
  });

  describe('Excluir com MatDialog', () => {
    it('abrirConfirmExcluir deve abrir modal de confirmação', () => {
      component.abrirConfirmExcluir(mockDespesa);

      expect(dialogMock.open).toHaveBeenCalled();
    });

    it('deve excluir quando confirmado', () => {
      dialogMock.open.mockReturnValueOnce({
        afterClosed: () => of(true),
      });

      const carregarSpy = jest.spyOn(component, 'carregar');

      component.abrirConfirmExcluir(mockDespesa);

      expect(despesasServiceMock.deleteDespesa).toHaveBeenCalledWith(1);
      expect(carregarSpy).toHaveBeenCalled();
      expect(dialogMock.open).toHaveBeenCalledTimes(2);
    });

    it('não deve excluir quando não confirmado', () => {
      dialogMock.open.mockReturnValue({
        afterClosed: () => of(false),
      });

      component.abrirConfirmExcluir(mockDespesa);

      expect(despesasServiceMock.deleteDespesa).not.toHaveBeenCalled();
    });

    it('deve tratar erro ao excluir', () => {
      dialogMock.open.mockReturnValue({
        afterClosed: () => of(true),
      });

      despesasServiceMock.deleteDespesa.mockReturnValue(
        throwError(() => ({ error: { error: 'Erro excluir' } })),
      );

      component.abrirConfirmExcluir(mockDespesa);

      expect(component.erroCarregar).toBe('Erro excluir');
    });

    it('deve usar mensagem padrão ao excluir (abrirConfirmExcluir)', () => {
      dialogMock.open.mockReturnValueOnce({
        afterClosed: () => of(true),
      });

      despesasServiceMock.deleteDespesa.mockReturnValue(throwError(() => ({})));

      component.abrirConfirmExcluir(mockDespesa);

      expect(component.erroCarregar).toBe('Erro ao excluir.');
    });
  });

  describe('Excluir legado', () => {
    it('cancelarExcluir deve limpar estado', () => {
      component.confirmExcluirOpen = true;
      component.despesaParaExcluir = mockDespesa;

      component.cancelarExcluir();

      expect(component.confirmExcluirOpen).toBe(false);
      expect(component.despesaParaExcluir).toBeNull();
    });

    it('confirmarExcluir deve retornar quando não houver despesa', () => {
      component.despesaParaExcluir = null;

      component.confirmarExcluir();

      expect(despesasServiceMock.deleteDespesa).not.toHaveBeenCalled();
    });

    it('confirmarExcluir deve excluir despesa', () => {
      component.despesaParaExcluir = mockDespesa;
      const carregarSpy = jest.spyOn(component, 'carregar');

      component.confirmarExcluir();

      expect(despesasServiceMock.deleteDespesa).toHaveBeenCalledWith(1);
      expect(component.confirmExcluirOpen).toBe(false);
      expect(component.despesaParaExcluir).toBeNull();
      expect(carregarSpy).toHaveBeenCalled();
    });

    it('confirmarExcluir deve tratar erro', () => {
      component.despesaParaExcluir = mockDespesa;
      despesasServiceMock.deleteDespesa.mockReturnValue(
        throwError(() => ({ message: 'Erro ao deletar' })),
      );

      component.confirmarExcluir();

      expect(component.confirmExcluirOpen).toBe(false);
      expect(component.erroCarregar).toBe('Erro ao deletar');
    });

    it('confirmarExcluir deve usar fallback de erro', () => {
      component.despesaParaExcluir = mockDespesa;

      despesasServiceMock.deleteDespesa.mockReturnValue(throwError(() => ({})));

      component.confirmarExcluir();

      expect(component.erroCarregar).toBe('Erro ao excluir.');
    });
  });

  describe('Labels', () => {
    it('labelPessoa deve retornar pessoa preenchida', () => {
      expect(component.labelPessoa(mockDespesa)).toBe('Kelly');
    });

    it('labelPessoa deve retornar traço quando pessoa vazia', () => {
      expect(component.labelPessoa({ ...mockDespesa, pessoa: '  ' })).toBe('—');
    });

    it('labelPessoa deve retornar traço quando pessoa undefined', () => {
      expect(component.labelPessoa({ ...mockDespesa, pessoa: undefined })).toBe(
        '—',
      );
    });

    it('labelNatureza deve retornar Fixa', () => {
      expect(component.labelNatureza('fixa')).toBe('Fixa');
    });

    it('labelNatureza deve retornar Variável', () => {
      expect(component.labelNatureza('variavel')).toBe('Variável');
    });
  });
});
