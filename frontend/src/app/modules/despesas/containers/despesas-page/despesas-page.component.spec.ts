import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { DespesasPageComponent } from './despesas-page.component';
import { Despesa } from '@app/core/interfaces/despesas/despesas';
import { DespesasService } from '@app/core/services/despesas/despesas.service';

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
  });

  describe('ngOnInit', () => {
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

  describe('despesasVariaveisPaginadas', () => {
    beforeEach(() => {
      component.tamanhoPagina = 1;
      component.despesas = [
        { ...mockDespesa, id: 1, natureza: 'fixa' },
        { ...mockDespesa, id: 2, natureza: 'fixa' },
        { ...mockDespesa, id: 3, natureza: 'fixa' },
        { ...mockDespesa, id: 4, natureza: 'fixa' },
        { ...mockDespesa, id: 5, natureza: 'variavel' },
        { ...mockDespesa, id: 6, natureza: 'variavel' },
        { ...mockDespesa, id: 7, natureza: 'variavel' },
        { ...mockDespesa, id: 8, natureza: 'variavel' },
      ];
    });

    it('deve retornar itens da página atual', () => {
      component.paginaVariaveis = 2;

      const result = component.despesasVariaveisPaginadas;

      expect(result.map((d) => d.id)).toEqual([6]);
    });
  });

  describe('Paginação de despesas', () => {
    beforeEach(() => {
      component.tamanhoPagina = 2;
      component.despesas = [
        { ...mockDespesa, id: 1, natureza: 'fixa', valor: 100 },
        { ...mockDespesa, id: 2, natureza: 'fixa', valor: 200 },
        { ...mockDespesa, id: 3, natureza: 'fixa', valor: 300 },
        { ...mockDespesa, id: 4, natureza: 'variavel', valor: 400 },
        { ...mockDespesa, id: 5, natureza: 'variavel', valor: 500 },
        { ...mockDespesa, id: 6, natureza: 'variavel', valor: 600 },
      ];
    });

    it('despesasVariaveisPaginadas deve retornar itens da página atual', () => {
      component.paginaVariaveis = 2;

      const result = component.despesasVariaveisPaginadas;

      expect(result.map((d) => d.id)).toEqual([6]);
    });

    it('totalPaginasFixas deve retornar 0 quando não houver despesas fixas', () => {
      component.despesas = [
        { ...mockDespesa, id: 1, natureza: 'variavel', valor: 100 },
      ];

      expect(component.totalPaginasFixas).toBe(0);
    });

    it('totalPaginasFixas deve calcular total de páginas', () => {
      expect(component.totalPaginasFixas).toBe(2);
    });

    it('totalPaginasVariaveis deve retornar 0 quando não houver despesas variáveis', () => {
      component.despesas = [{ ...mockDespesa, id: 1, natureza: 'fixa', valor: 100 }];

      expect(component.totalPaginasVariaveis).toBe(0);
    });

    it('totalPaginasVariaveis deve calcular total de páginas', () => {
      expect(component.totalPaginasVariaveis).toBe(2);
    });

    it('exibindoDeFixas deve retornar 0 quando não houver despesas fixas', () => {
      component.despesas = [{ ...mockDespesa, id: 1, natureza: 'variavel', valor: 100 }];

      expect(component.exibindoDeFixas).toBe(0);
    });

    it('exibindoDeFixas deve retornar início da página atual', () => {
      component.paginaFixas = 2;

      expect(component.exibindoDeFixas).toBe(3);
    });

    it('exibindoAteFixas deve retornar até da página atual', () => {
      component.paginaFixas = 2;

      expect(component.exibindoAteFixas).toBe(3);
    });

    it('exibindoDeVariaveis deve retornar 0 quando não houver despesas variáveis', () => {
      component.despesas = [{ ...mockDespesa, id: 1, natureza: 'fixa', valor: 100 }];

      expect(component.exibindoDeVariaveis).toBe(0);
    });

    it('exibindoDeVariaveis deve retornar início da página atual', () => {
      component.paginaVariaveis = 2;

      expect(component.exibindoDeVariaveis).toBe(3);
    });

    it('exibindoAteVariaveis deve retornar até da página atual', () => {
      component.paginaVariaveis = 2;

      expect(component.exibindoAteVariaveis).toBe(3);
    });

    it('paginaAnteriorFixas deve voltar página quando maior que 1', () => {
      component.paginaFixas = 2;

      component.paginaAnteriorFixas();

      expect(component.paginaFixas).toBe(1);
    });

    it('paginaAnteriorFixas não deve voltar quando já estiver na página 1', () => {
      component.paginaFixas = 1;

      component.paginaAnteriorFixas();

      expect(component.paginaFixas).toBe(1);
    });

    it('paginaProximaFixas deve avançar página quando menor que total', () => {
      component.paginaFixas = 1;

      component.paginaProximaFixas();

      expect(component.paginaFixas).toBe(2);
    });

    it('paginaProximaFixas NÃO deve avançar quando já estiver na última página', () => {
      component.paginaFixas = component.totalPaginasFixas;

      component.paginaProximaFixas();

      expect(component.paginaFixas).toBe(component.totalPaginasFixas);
    });

    it('paginaAnteriorVariaveis deve voltar página quando maior que 1', () => {
      component.paginaVariaveis = 2;

      component.paginaAnteriorVariaveis();

      expect(component.paginaVariaveis).toBe(1);
    });

    it('paginaAnteriorVariaveis não deve voltar quando já estiver na página 1', () => {
      component.paginaVariaveis = 1;

      component.paginaAnteriorVariaveis();

      expect(component.paginaVariaveis).toBe(1);
    });

    it('paginaProximaVariaveis deve avançar página quando menor que total', () => {
      component.paginaVariaveis = 1;

      component.paginaProximaVariaveis();

      expect(component.paginaVariaveis).toBe(2);
    });

    it('paginaProximaVariaveis NÃO deve avançar quando já estiver na última página', () => {
      component.paginaVariaveis = component.totalPaginasVariaveis;

      component.paginaProximaVariaveis();

      expect(component.paginaVariaveis).toBe(component.totalPaginasVariaveis);
    });

    it('normalizarIndicesPagina deve ajustar paginaFixas quando maior que total', () => {
      component.paginaFixas = 10;

      component['normalizarIndicesPagina']();

      expect(component.paginaFixas).toBe(component.totalPaginasFixas);
    });

    it('normalizarIndicesPagina deve ajustar paginaVariaveis quando maior que total', () => {
      component.paginaVariaveis = 10;

      component['normalizarIndicesPagina']();

      expect(component.paginaVariaveis).toBe(component.totalPaginasVariaveis);
    });

    it('aplicarResultadoCarregar deve atualizar despesas e resetar paginação', () => {
      component.paginaFixas = 3;
      component.paginaVariaveis = 3;

      component['aplicarResultadoCarregar']([mockDespesa], null);

      expect(component.despesas).toEqual([mockDespesa]);
      expect(component.paginaFixas).toBe(1);
      expect(component.paginaVariaveis).toBe(1);
      expect(component.loading).toBe(false);
      expect(component.erroCarregar).toBeNull();
    });
  });

  describe('Carregar despesas', () => {
    it('deve preencher despesas com sucesso', () => {
      despesasServiceMock.getDespesas.mockReturnValue(of([mockDespesa]));

      component.carregar();

      expect(component.loading).toBe(false);
      expect(component.erroCarregar).toBeNull();
      expect(component.despesas).toEqual([mockDespesa]);
    });

    it('deve tratar erro da API com error.error', () => {
      despesasServiceMock.getDespesas.mockReturnValue(
        throwError(() => ({ error: { error: 'Erro API' } })),
      );

      component.carregar();

      expect(component.loading).toBe(false);
      expect(component.despesas).toEqual([]);
      expect(component.erroCarregar).toBe('Erro API');
    });

    it('deve tratar erro da API com message', () => {
      despesasServiceMock.getDespesas.mockReturnValue(
        throwError(() => ({ error: { error: 'Erro Message' } })),
      );

      component.carregar();

      expect(component.erroCarregar).toBe('Erro Message');
    });

    it('deve usar mensagem padrão quando erro não tiver mensagem', () => {
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

  describe('abrirModalSucesso', () => {
    it('deve abrir modal com mensagem de edição', () => {
      component['abrirModalSucesso'](true);

      expect(dialogMock.open).toHaveBeenCalled();

      const call = dialogMock.open.mock.calls[0][1];

      expect(call.data.title).toBe('Despesa atualizada!');
      expect(call.data.message).toBe('A despesa foi atualizada com sucesso.');
    });

    it('deve abrir modal com mensagem de criação', () => {
      component['abrirModalSucesso'](false);

      expect(dialogMock.open).toHaveBeenCalled();

      const call = dialogMock.open.mock.calls[0][1];

      expect(call.data.title).toBe('Despesa adicionada!');
      expect(call.data.message).toBe('A despesa foi adicionada com sucesso.');
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

  describe('Labels', () => {
    it('deve retornar pessoa preenchida', () => {
      expect(component.labelPessoa(mockDespesa)).toBe('Kelly');
    });

    it('deve retornar traço quando pessoa vazia', () => {
      expect(component.labelPessoa({ ...mockDespesa, pessoa: '  ' })).toBe('—');
    });

    it('deve retornar traço quando pessoa undefined', () => {
      expect(component.labelPessoa({ ...mockDespesa, pessoa: undefined })).toBe(
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
