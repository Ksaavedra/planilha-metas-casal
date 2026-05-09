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
  };

  const dialogMock = {
    open: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    receitasServiceMock.getReceitas.mockReturnValue(of([mockReceita]));
    receitasServiceMock.deleteReceita.mockReturnValue(of(void 0));

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

  describe('receitasVariaveisPaginadas', () => {
    beforeEach(() => {
      component.tamanhoPagina = 1;
      component.receitas = [
        { ...mockReceita, id: 1, natureza: 'fixa' },
        { ...mockReceita, id: 2, natureza: 'fixa' },
        { ...mockReceita, id: 3, natureza: 'fixa' },
        { ...mockReceita, id: 4, natureza: 'fixa' },
        { ...mockReceita, id: 5, natureza: 'variavel' },
        { ...mockReceita, id: 6, natureza: 'variavel' },
        { ...mockReceita, id: 7, natureza: 'variavel' },
        { ...mockReceita, id: 8, natureza: 'variavel' },
      ];
    });

    it('deve retornar itens de página atual', () => {
      component.paginaVariaveis = 2;

      const result = component.receitasVariaveisPaginadas;

      expect(result.map((r) => r.id)).toEqual([6]);
    });
  });

  describe('Paginação de receitas', () => {
    beforeEach(() => {
      component.tamanhoPagina = 2;
      component.receitas = [
        { ...mockReceita, id: 1, natureza: 'fixa', valor: 100 },
        { ...mockReceita, id: 2, natureza: 'fixa', valor: 200 },
        { ...mockReceita, id: 3, natureza: 'fixa', valor: 300 },
        { ...mockReceita, id: 4, natureza: 'variavel', valor: 400 },
        { ...mockReceita, id: 5, natureza: 'variavel', valor: 500 },
        { ...mockReceita, id: 6, natureza: 'variavel', valor: 600 },
      ];
    });

    it('receitasVariaveisPaginadas deve retornar itens da página atual', () => {
      component.paginaVariaveis = 2;

      const result = component.receitasVariaveisPaginadas;

      expect(result.map((r) => r.id)).toEqual([6]);
    });

    it('totalPaginasFixas deve retornar 0 quando não houver receitas fixas', () => {
      component.receitas = [
        { ...mockReceita, id: 1, natureza: 'variavel', valor: 100 },
      ];

      expect(component.totalPaginasFixas).toBe(0);
    });

    it('totalPaginasFixas deve calcular total de páginas', () => {
      expect(component.totalPaginasFixas).toBe(2);
    });

    it('totalPaginasVariaveis deve retornar 0 quando não houver receitas variáveis', () => {
      component.receitas = [
        { ...mockReceita, id: 1, natureza: 'fixa', valor: 100 },
      ];

      expect(component.totalPaginasVariaveis).toBe(0);
    });

    it('totalPaginasVariaveis deve calcular total de páginas', () => {
      expect(component.totalPaginasVariaveis).toBe(2);
    });

    it('exibindoDeFixas deve retornar 0 quando não houver receitas fixas', () => {
      component.receitas = [
        { ...mockReceita, id: 1, natureza: 'variavel', valor: 100 },
      ];

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

    it('exibindoDeVariaveis deve retornar 0 quando não houver receitas variáveis', () => {
      component.receitas = [
        { ...mockReceita, id: 1, natureza: 'fixa', valor: 100 },
      ];

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

    it('aplicarResultadoCarregar deve atualizar receitas e resetar paginação', () => {
      component.paginaFixas = 3;
      component.paginaVariaveis = 3;

      component['aplicarResultadoCarregar']([mockReceita], null);

      expect(component.receitas).toEqual([mockReceita]);
      expect(component.paginaFixas).toBe(1);
      expect(component.paginaVariaveis).toBe(1);
      expect(component.loading).toBe(false);
      expect(component.erroCarregar).toBeNull();
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

  describe('calcularTotalReceitas', () => {
    it('soma valores', () => {
      const total = component.calcularTotalReceitas([
        mockReceita,
        { ...mockReceita, id: 2, valor: 200 },
      ]);
      expect(total).toBe(2200);
    });

    it('retorna 0 para array vazio', () => {
      expect(component.calcularTotalReceitas([])).toBe(0);
    });

    it('deve considerar valor null como 0', () => {
      const total = component.calcularTotalReceitas([
        { ...mockReceita, valor: null as any },
      ]);
      expect(total).toBe(0);
    });

    it('deve considerar valor undefined como 0', () => {
      const total = component.calcularTotalReceitas([
        { ...mockReceita, valor: undefined as any },
      ]);
      expect(total).toBe(0);
    });

    it('deve considerar valor inválido como 0', () => {
      const total = component.calcularTotalReceitas([
        { ...mockReceita, valor: 'abc' as any },
      ]);
      expect(total).toBe(0);
    });

    it('deve somar ignorando valores inválidos', () => {
      const total = component.calcularTotalReceitas([
        mockReceita,
        { ...mockReceita, id: 2, valor: 'abc' as any },
        { ...mockReceita, id: 3, valor: 100 },
      ]);
      expect(total).toBe(100);
    });
  });
});
