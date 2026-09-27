import { FormBuilder } from '@angular/forms';

import { HttpErrorResponse } from '@angular/common/http';

import { of, throwError } from 'rxjs';

import { Cartao } from '@core/interfaces/cartoes/cartoes';

import { Divida } from '@core/interfaces/dividas/dividas';

import { compraNoPeriodoFatura } from '@core/utils/fatura-cartao.util';

import { AdicionarParcelamentoDialogComponent } from './adicionar-parcelamento-dialog.component';

jest.mock('@core/utils/fatura-cartao.util', () => {
  const actual = jest.requireActual('@core/utils/fatura-cartao.util');
  return {
    ...actual,
    compraNoPeriodoFatura: jest.fn(actual.compraNoPeriodoFatura),
  };
});

describe('AdicionarParcelamentoDialogComponent', () => {
  const cartao: Cartao = {
    id: 1,

    nome: 'C6',

    banco: 'C6',

    limite: 21000,

    valorUtilizado: 0,

    valorDisponivel: 21000,

    diaMelhorCompra: 28,

    diaVencimento: 6,

    diaFechamento: 27,
  };

  const parcelamento: Divida = {
    id: 10,

    objetivo: 'Notebook',

    tipoDivida: 'parcelamento',

    valorTotal: 600,

    valorPago: 200,

    valorRestante: 400,

    parcelaMensal: 200,

    quantidadeParcelas: 3,

    parcelasRestantes: 2,

    percentualQuitado: 33.33,

    statusDivida: 'pagando',

    cartaoId: 1,

    ano: 2026,

    dataInicio: '2026-05-01T00:00:00.000Z',

    observacoes: 'Compra',
  };

  const dialogRef = { close: jest.fn() };

  const dividasService = {
    createDivida: jest.fn(),

    updateDivida: jest.fn(),

    getDividas: jest.fn(),
  };

  function criar(
    data = {
      cartao,

      ano: 2023,

      mes: 8,

      parcelamento: undefined as Divida | undefined,
    },
  ) {
    return new AdicionarParcelamentoDialogComponent(
      data,

      dialogRef as any,

      new FormBuilder(),

      dividasService as any,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();

    dividasService.createDivida.mockReturnValue(of({}));

    dividasService.updateDivida.mockReturnValue(of({}));

    dividasService.getDividas.mockReturnValue(
      of([
        { objetivo: 'Netflix', tipoDivida: 'parcelamento', cartaoId: 1 },
        { objetivo: 'Ifood', tipoDivida: 'parcelamento', cartaoId: 1 },
        { objetivo: 'netflix', tipoDivida: 'parcelamento', cartaoId: 1 },
        { objetivo: 'Mercado', tipoDivida: 'parcelamento', cartaoId: 2 },
      ]),
    );
  });

  it('deve sugerir compras cadastradas e opção de criar', () => {
    const component = criar();
    component.comprasAutocompleteOptions = ['Ifood', 'Netflix'];
    component.onCompraFieldFocus();

    expect(component['filtrarCompras']('net')).toEqual([
      { label: 'Netflix', value: 'Netflix', criar: false },
    ]);
  });

  it('deve oferecer criar compra quando não houver sugestão', () => {
    const component = criar();
    component.comprasAutocompleteOptions = ['Ifood', 'Netflix'];
    component.onCompraFieldFocus();

    expect(component['filtrarCompras']('Uber Eats')).toEqual([
      {
        label: "+ Criar 'Uber Eats'",
        value: 'Uber Eats',
        criar: true,
      },
    ]);
  });

  it('deve carregar compras cadastradas do cartão ao iniciar', () => {
    const component = criar();
    component.ngOnInit();

    expect(dividasService.getDividas).toHaveBeenCalledWith(2023);
    expect(dividasService.getDividas).toHaveBeenCalledWith(2022);
    expect(component.comprasAutocompleteOptions).toEqual(['Ifood', 'Netflix']);
  });

  it('deve criar formulário com data da compra no fim do período da fatura', () => {
    const component = criar();

    expect(component.editando).toBe(false);

    expect(component.form.get('quantidadeParcelas')?.value).toBe(1);

    expect(component.form.get('dataCompra')?.value).toBe('2023-07-27');

    expect(component.primeiraParcelaLabel).toBe('Agosto 2023');
  });

  it('deve preencher formulário quando estiver editando', () => {
    const component = criar({ cartao, ano: 2026, mes: 5, parcelamento });

    expect(component.editando).toBe(true);

    expect(component.form.get('objetivo')?.value).toBe('Notebook');

    expect(component.form.get('dataCompra')?.value).toBe('2026-05-01');

    expect(component.parcelaCalculada).toBe(200);
  });

  it('deve fechar com false', () => {
    const component = criar();

    component.fechar();

    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });

  it('deve bloquear formulário inválido', () => {
    const component = criar();

    component.salvar();

    expect(component.erro).toBe(
      'Preencha descrição, valor e quantidade de parcelas.',
    );

    expect(dividasService.createDivida).not.toHaveBeenCalled();
  });

  it('deve calcular parcela como zero quando valores estão vazios', () => {
    const component = criar();

    expect(component.parcelaCalculada).toBe(0);
  });

  it('deve permitir editar compra à vista (1 parcela)', () => {
    const compraAvista: Divida = {
      ...parcelamento,

      quantidadeParcelas: 1,
    };

    const component = criar({
      cartao,

      ano: 2026,

      mes: 5,

      parcelamento: compraAvista,
    });

    expect(component.minQuantidadeParcelas).toBe(1);

    expect(component.form.get('quantidadeParcelas')?.value).toBe(1);
  });

  it('deve permitir criar compra à vista com 1 parcela', () => {
    const component = criar();

    component.form.patchValue({
      objetivo: 'Microsoft',
      valorTotal: 45,
      quantidadeParcelas: 1,
      dataCompra: '2023-07-15',
    });

    component.salvar();

    expect(dividasService.createDivida).toHaveBeenCalledWith(
      expect.objectContaining({
        objetivo: 'Microsoft',
        quantidadeParcelas: 1,
        dataCompra: '2023-07-15',
        dataInicio: '2023-08-01',
        diaMelhorCompra: 28,
        diaVencimento: 6,
      }),
    );
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('deve bloquear salvar quando já estiver salvando', () => {
    const component = criar();

    component.form.patchValue({
      objetivo: 'Roupa',

      valorTotal: 300,

      quantidadeParcelas: 3,

      dataCompra: '2023-07-15',
    });

    component.saving = true;

    component.salvar();

    expect(component.erro).toBe(
      'Preencha descrição, valor e quantidade de parcelas.',
    );

    expect(dividasService.createDivida).not.toHaveBeenCalled();
  });

  it('deve criar parcelamento com 1ª parcela na fatura de agosto', () => {
    const component = criar();

    component.form.patchValue({
      objetivo: ' Roupa ',

      valorTotal: 300,

      quantidadeParcelas: 3,

      dataCompra: '2023-07-15',

      observacoes: ' Loja ',
    });

    component.salvar();

    expect(dividasService.createDivida).toHaveBeenCalledWith({
      objetivo: 'Roupa',

      tipoDivida: 'parcelamento',

      valorTotal: 300,

      quantidadeParcelas: 3,

      cartaoId: 1,

      diaMelhorCompra: 28,
      diaVencimento: 6,

      ano: 2023,

      dataCompra: '2023-07-15',
      dataInicio: '2023-08-01',

      observacoes: 'Loja',

      valorPago: 0,
    });

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('deve bloquear compra fora do período da fatura', () => {
    const component = criar();

    component.form.patchValue({
      objetivo: 'TV',
      valorTotal: 500,
      quantidadeParcelas: 2,
      dataCompra: '2023-10-15',
    });

    component.salvar();

    expect(dividasService.createDivida).not.toHaveBeenCalled();
    expect(component.erro).toContain('período desta fatura');
  });

  it('deve atualizar parcelamento', () => {
    const component = criar({ cartao, ano: 2026, mes: 5, parcelamento });

    component.form.patchValue({
      objetivo: 'Notebook novo',
      valorTotal: 900,
      quantidadeParcelas: 3,
    });

    component.salvar();

    expect(dividasService.updateDivida).toHaveBeenCalledTimes(1);

    const [id, payload] = dividasService.updateDivida.mock.calls[0];

    expect(id).toBe(10);

    expect(payload.objetivo).toBe('Notebook novo');

    expect(payload.valorTotal).toBe(900);

    expect(payload.quantidadeParcelas).toBe(3);

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('deve tratar erro HTTP e erro genérico', () => {
    const component = criar();

    dividasService.createDivida.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 0,
          }),
      ),
    );

    component.form.patchValue({
      objetivo: 'Roupa',

      valorTotal: 300,

      quantidadeParcelas: 3,

      dataCompra: '2023-07-15',
    });

    component.salvar();

    expect(component.erro).toContain('Servidor indisponível');

    expect(component.saving).toBe(false);

    expect(
      component['mensagemErroHttp'](
        new HttpErrorResponse({ status: 400, error: { error: 'Erro API' } }),
      ),
    ).toBe('Erro API');

    expect(
      component['mensagemErroHttp'](
        new HttpErrorResponse({ status: 400, error: {} }),
      ),
    ).toBe('Não foi possível salvar o parcelamento.');

    expect(
      component['mensagemErroHttp'](
        new HttpErrorResponse({ status: 400, error: 'erro' }),
      ),
    ).toBe('Não foi possível salvar o parcelamento.');

    expect(component['mensagemErroHttp'](new Error('erro'))).toBe(
      'Não foi possível salvar o parcelamento.',
    );
  });

  it('deve calcular parcela como zero quando quantidade de parcelas estiver vazia', () => {
    const component = criar();
    component.form.patchValue({ valorTotal: 300, quantidadeParcelas: null });

    expect(component.parcelaCalculada).toBe(0);
  });

  it('deve exibir labels e limites do período da fatura', () => {
    const component = criar();

    expect(component.faturaLabel).toBe('Agosto 2023');
    expect(component.periodoCompraLabel).toMatch(/^\d{2}\/\d{2} até \d{2}\/\d{2}$/);
    expect(component.periodoCompraCompleto).toMatch(
      /^\d{2}\/\d{2}\/\d{4} a \d{2}\/\d{2}\/\d{4}$/,
    );
    expect(component.dataCompraMin).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(component.dataCompraMax).toBe('2023-07-27');
  });

  it('deve retornar nulos de período quando o cartão não tiver dias configurados', () => {
    const component = criar({
      cartao: { ...cartao, diaMelhorCompra: null, diaVencimento: null },
      ano: 2023,
      mes: 8,
      parcelamento: undefined,
    });

    expect(component.periodoCompraLabel).toBeNull();
    expect(component.periodoCompraCompleto).toBeNull();
    expect(component.dataCompraMin).toBeNull();
    expect(component.dataCompraMax).toBeNull();
  });

  it('deve usar label da fatura como primeira parcela quando não houver data da compra', () => {
    const component = criar();

    component.form.patchValue({ dataCompra: '' });
    expect(component.primeiraParcelaLabel).toBe('Agosto 2023');

    component.form.removeControl('dataCompra');
    expect(component.primeiraParcelaLabel).toBe('Agosto 2023');
  });

  it('deve usar dataCompra do parcelamento em edição', () => {
    const component = criar({
      cartao,
      ano: 2026,
      mes: 5,
      parcelamento: { ...parcelamento, dataCompra: '2026-04-10T12:00:00.000Z' },
    });

    expect(component.form.get('dataCompra')?.value).toBe('2026-04-10');
  });

  it('deve usar data padrão da fatura quando parcelamento não tiver datas', () => {
    const component = criar({
      cartao,
      ano: 2023,
      mes: 8,
      parcelamento: {
        ...parcelamento,
        dataCompra: undefined,
        dataInicio: undefined as any,
      },
    });

    expect(component.form.get('dataCompra')?.value).toBe('2023-07-27');
  });

  it('deve usar fallbacks do formulário quando parcelamento tiver campos vazios', () => {
    const component = criar({
      cartao,
      ano: 2026,
      mes: 5,
      parcelamento: {
        ...parcelamento,
        objetivo: undefined as any,
        valorTotal: undefined as any,
        quantidadeParcelas: undefined as any,
        observacoes: undefined,
      },
    });

    expect(component.form.get('objetivo')?.value).toBe('');
    expect(component.form.get('valorTotal')?.value).toBeNull();
    expect(component.form.get('quantidadeParcelas')?.value).toBe(1);
    expect(component.form.get('observacoes')?.value).toBe('');
  });

  it('deve ignorar foco repetido no campo de compra', () => {
    const component = criar();
    const nextSpy = jest.spyOn(component['comprasOpcoesAtualizadas$'], 'next');

    component.onCompraFieldFocus();
    component.onCompraFieldFocus();

    expect(component.listaAutocompleteCompraAtiva).toBe(true);
    expect(nextSpy).toHaveBeenCalledTimes(1);
  });

  it('deve filtrar sugestões ao digitar e ao atualizar opções', () => {
    const component = criar();
    component.ngOnInit();
    const emissoes: unknown[][] = [];
    const sub = component.filteredCompras$.subscribe((v) => emissoes.push(v));

    expect(emissoes[0]).toEqual([]);

    component.onCompraFieldFocus();
    component.form.get('objetivo')?.setValue('if');

    expect(emissoes[emissoes.length - 1]).toEqual([
      { label: 'Ifood', value: 'Ifood', criar: false },
    ]);

    sub.unsubscribe();
    component.ngOnDestroy();
  });

  it('deve retornar lista vazia quando o autocomplete não estiver ativo', () => {
    const component = criar();
    component.comprasAutocompleteOptions = ['Ifood'];

    expect(component['filtrarCompras']('if')).toEqual([]);
  });

  it('deve tratar valor nulo ou ausente no filtro de objetivo', () => {
    const component = criar();

    component.form.get('objetivo')?.setValue(null);
    expect(component['getObjetivoFiltroValue']()).toBe('');

    component.form.removeControl('objetivo');
    expect(component['getObjetivoFiltroValue']()).toBe('');
  });

  it('deve limpar sugestões quando falhar ao carregar compras', () => {
    dividasService.getDividas.mockReturnValue(
      throwError(() => new Error('falha')),
    );
    const component = criar();
    component.comprasAutocompleteOptions = ['Antigo'];

    component.ngOnInit();

    expect(component.comprasAutocompleteOptions).toEqual([]);
  });

  it('deve encerrar assinaturas ao destruir com ou sem carregamento', () => {
    const semInit = criar();
    expect(() => semInit.ngOnDestroy()).not.toThrow();

    const component = criar();
    component.ngOnInit();
    const unsubscribeSpy = jest.spyOn(
      component['comprasApiSub']!,
      'unsubscribe',
    );
    const completeSpy = jest.spyOn(
      component['comprasOpcoesAtualizadas$'],
      'complete',
    );

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('deve criar parcelamento sem dias do cartão no payload', () => {
    const component = criar({
      cartao: { ...cartao, diaMelhorCompra: null, diaVencimento: null },
      ano: 2023,
      mes: 8,
      parcelamento: undefined,
    });
    component.form.patchValue({
      objetivo: 'Livro',
      valorTotal: 90,
      quantidadeParcelas: 1,
      dataCompra: '2023-01-01',
    });

    component.salvar();

    const payload = dividasService.createDivida.mock.calls[0][0];
    expect(payload).not.toHaveProperty('diaMelhorCompra');
    expect(payload).not.toHaveProperty('diaVencimento');
    expect(payload.dataInicio).toBe('2023-08-01');
    expect(payload.observacoes).toBe('');
  });

  it('deve exibir erro genérico de período quando não houver label do período', () => {
    (compraNoPeriodoFatura as jest.Mock).mockReturnValueOnce(false);
    const component = criar({
      cartao: { ...cartao, diaMelhorCompra: null, diaVencimento: null },
      ano: 2023,
      mes: 8,
      parcelamento: undefined,
    });
    component.form.patchValue({
      objetivo: 'Livro',
      valorTotal: 90,
      quantidadeParcelas: 1,
      dataCompra: '2023-01-01',
    });

    component.salvar();

    expect(component.erro).toBe(
      'A data da compra deve estar no período desta fatura.',
    );
    expect(dividasService.createDivida).not.toHaveBeenCalled();
  });

  it('deve recalcular início das parcelas pela data da compra ao editar', () => {
    const component = criar({ cartao, ano: 2026, mes: 5, parcelamento });
    component.form.patchValue({ dataCompra: '2026-03-10', observacoes: '' });

    component.salvar();

    const [, payload] = dividasService.updateDivida.mock.calls[0];
    expect(payload.dataCompra).toBe('2026-03-10');
    expect(payload.dataInicio).toMatch(/^\d{4}-\d{2}-01$/);
    expect(payload.observacoes).toBe('');
    expect(compraNoPeriodoFatura).not.toHaveBeenCalled();
  });

  it('deve exibir mensagem da API ao falhar atualização', () => {
    dividasService.updateDivida.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: { error: 'Parcelamento inválido' },
          }),
      ),
    );
    const component = criar({ cartao, ano: 2026, mes: 5, parcelamento });

    component.salvar();

    expect(component.saving).toBe(false);
    expect(component.erro).toBe('Parcelamento inválido');
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('deve usar mensagem padrão quando erro da API estiver vazio ou nulo', () => {
    const component = criar();

    expect(
      component['mensagemErroHttp'](
        new HttpErrorResponse({ status: 400, error: { error: '' } }),
      ),
    ).toBe('Não foi possível salvar o parcelamento.');
    expect(
      component['mensagemErroHttp'](
        new HttpErrorResponse({ status: 400, error: null }),
      ),
    ).toBe('Não foi possível salvar o parcelamento.');
  });
});
