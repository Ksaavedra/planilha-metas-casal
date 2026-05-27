import { FormBuilder } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Divida } from '@core/interfaces/dividas/dividas';
import {
  AdicionarDividaDialogComponent,
  AdicionarDividaDialogData,
} from './adicionar-divida-dialog.component';

describe('AdicionarDividaDialogComponent', () => {
  const divida: Divida = {
    id: 1,
    objetivo: 'Empréstimo',
    tipoDivida: 'emprestimo',
    valorTotal: 300,
    valorPago: 100,
    valorRestante: 200,
    parcelaMensal: 100,
    quantidadeParcelas: 3,
    parcelasRestantes: 2,
    percentualQuitado: 33.33,
    statusDivida: 'pagando',
    cartaoId: null,
    ano: 2026,
    dataInicio: '2026-05-01',
    observacoes: 'Teste',
  };

  const dialogRef = { close: jest.fn() };
  const dividasService = {
    createDivida: jest.fn(),
    updateDivida: jest.fn(),
  };
  const cartoesService = {
    getCartoes: jest.fn(),
  };
  const cdr = { markForCheck: jest.fn() };

  function criar(
    data: AdicionarDividaDialogData = {
      divida: null,
      ano: 2026,
      mes: 5,
      contexto: 'emprestimos',
    },
  ) {
    return new AdicionarDividaDialogComponent(
      data,
      dialogRef as any,
      new FormBuilder(),
      dividasService as any,
      cartoesService as any,
      cdr as any,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    dividasService.createDivida.mockReturnValue(of({}));
    dividasService.updateDivida.mockReturnValue(of({}));
    cartoesService.getCartoes.mockReturnValue(of([{ id: 1, nome: 'Roxo' }]));
  });

  it('deve iniciar inclusão de empréstimo com data e tipo padrão', () => {
    const component = criar();

    component.ngOnInit();

    expect(component.isEdicao).toBe(false);
    expect(component.tituloDialog).toBe('Adicionar empréstimo');
    expect(component.tipos.map((t) => t.value)).toEqual(['emprestimo']);
    expect(component.labelValorPago).toBe('Pago neste mês (R$)');
    expect(component.form.get('tipoDivida')?.value).toBe('emprestimo');
    expect(component.form.get('dataInicio')?.value).toMatch(/^2026-05-\d{2}$/);
    expect(component.cartoes).toEqual([{ id: 1, nome: 'Roxo' }]);
  });

  it('deve iniciar inclusão de financiamento', () => {
    const component = criar({ divida: null, ano: 2026, mes: undefined, contexto: 'financiamentos' });

    component.ngOnInit();

    expect(component.tituloDialog).toBe('Adicionar financiamento');
    expect(component.tipos.map((t) => t.value)).toEqual(['financiamento']);
    expect(component.labelValorPago).toBe('Valor já pago (R$)');
    expect(component.form.get('tipoDivida')?.value).toBe('financiamento');
  });

  it('deve preencher formulário em edição usando projeção do mês', () => {
    const component = criar({ divida, ano: 2026, mes: 5, contexto: 'emprestimos' });

    component.ngOnInit();

    expect(component.isEdicao).toBe(true);
    expect(component.tituloDialog).toBe('Editar empréstimo');
    expect(component.form.get('objetivo')?.value).toBe('Empréstimo');
    expect(component.form.get('valorPago')?.value).toBe(100);
    expect(component.parcelaCalculada).toBe(100);
    expect(component.valorTotalForm).toBe(300);
    expect(component.quantidadeParcelasForm).toBe(3);
  });

  it('deve atualizar parcela calculada ao mudar valores', () => {
    const component = criar();
    component.ngOnInit();

    component.form.patchValue({ valorTotal: 600, quantidadeParcelas: 6 });

    expect(component.parcelaCalculada).toBe(100);
    expect(cdr.markForCheck).toHaveBeenCalled();
  });

  it('deve fechar com false e limpar inscrição no destroy', () => {
    const component = criar();
    component.ngOnInit();
    const spy = jest.spyOn(component['formSub']!, 'unsubscribe');

    component.fechar();
    component.ngOnDestroy();

    expect(dialogRef.close).toHaveBeenCalledWith(false);
    expect(spy).toHaveBeenCalled();
  });

  it('deve bloquear formulário inválido', () => {
    const component = criar();

    component.salvar();

    expect(component.erro).toContain('Preencha objetivo');
    expect(dividasService.createDivida).not.toHaveBeenCalled();
  });

  it('deve criar dívida calculando parcela e valor pago acumulado no mês', () => {
    const component = criar();
    component.ngOnInit();
    component.form.patchValue({
      objetivo: ' Empréstimo novo ',
      tipoDivida: 'emprestimo',
      valorTotal: 300,
      valorPago: 100,
      quantidadeParcelas: 3,
      dataInicio: '2026-05-01',
      cartaoId: '',
      observacoes: ' Banco ',
    });

    component.salvar();

    expect(dividasService.createDivida).toHaveBeenCalledWith({
      objetivo: 'Empréstimo novo',
      tipoDivida: 'emprestimo',
      valorTotal: 300,
      valorPago: 100,
      parcelaMensal: 100,
      quantidadeParcelas: 3,
      cartaoId: null,
      ano: 2026,
      dataInicio: '2026-05-01',
      observacoes: 'Banco',
    });
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('deve atualizar dívida existente', () => {
    const component = criar({ divida, ano: 2026, mes: undefined, contexto: 'emprestimos' });
    component.ngOnInit();
    component.form.patchValue({
      objetivo: 'Empréstimo editado',
      valorTotal: 600,
      valorPago: 200,
      quantidadeParcelas: 6,
    });

    component.salvar();

    expect(dividasService.updateDivida).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        objetivo: 'Empréstimo editado',
        valorTotal: 600,
        valorPago: 200,
        parcelaMensal: 100,
      }),
    );
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('deve tratar erro de salvar e erro ao carregar cartões', () => {
    cartoesService.getCartoes.mockReturnValueOnce(throwError(() => new Error('erro')));
    dividasService.createDivida.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 404 })),
    );
    const component = criar();

    component.ngOnInit();
    component.form.patchValue({
      objetivo: 'Teste',
      tipoDivida: 'emprestimo',
      valorTotal: 300,
      valorPago: 0,
      quantidadeParcelas: 3,
      dataInicio: '2026-05-01',
    });
    component.salvar();

    expect(component.cartoes).toEqual([]);
    expect(component.erro).toContain('Rota de dívidas');
    expect(component.saving).toBe(false);
  });

  it('deve retornar mensagens amigáveis de erro', () => {
    const component = criar();

    expect(component['mensagemErroHttp'](new HttpErrorResponse({ status: 0 }))).toContain('Servidor indisponível');
    expect(component['mensagemErroHttp'](new HttpErrorResponse({ status: 400, error: { error: 'Erro API' } }))).toBe('Erro API');
    expect(component['mensagemErroHttp'](new Error('erro'))).toBe('Não foi possível salvar. Tente novamente.');
  });
});
