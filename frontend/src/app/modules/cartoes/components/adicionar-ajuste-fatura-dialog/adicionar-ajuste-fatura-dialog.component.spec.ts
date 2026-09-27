import { FormBuilder } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Cartao } from '@core/interfaces/cartoes/cartoes';
import { Divida } from '@core/interfaces/dividas/dividas';
import {
  AdicionarAjusteFaturaDialogComponent,
  AdicionarAjusteFaturaDialogData,
} from './adicionar-ajuste-fatura-dialog.component';

describe('AdicionarAjusteFaturaDialogComponent', () => {
  const cartao: Cartao = {
    id: 1,
    nome: 'C6',
    banco: 'C6 Bank',
    limite: 5000,
    valorUtilizado: 0,
    valorDisponivel: 5000,
    diaMelhorCompra: 28,
    diaVencimento: 6,
    diaFechamento: 27,
  };

  const ajuste: Divida = {
    id: 50,
    objetivo: 'juros',
    tipoDivida: 'ajuste_fatura',
    valorTotal: 45.5,
    valorPago: 0,
    valorRestante: 0,
    parcelaMensal: 45.5,
    quantidadeParcelas: 1,
    parcelasRestantes: 0,
    percentualQuitado: 100,
    statusDivida: 'quitada',
    cartaoId: 1,
    ano: 2026,
    dataInicio: '2026-05-01',
    observacoes: 'Juros do rotativo',
  };

  const dialogRef = { close: jest.fn() };
  const dividasService = {
    createDivida: jest.fn(),
    updateDivida: jest.fn(),
    deleteDivida: jest.fn(),
  };

  function criar(
    data: AdicionarAjusteFaturaDialogData = { cartao, ano: 2026, mes: 5 },
  ) {
    return new AdicionarAjusteFaturaDialogComponent(
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
    dividasService.deleteDivida.mockReturnValue(of(undefined));
  });

  it('deve iniciar em modo inclusão com valores padrão', () => {
    const component = criar();

    expect(component.editando).toBe(false);
    expect(component.saving).toBe(false);
    expect(component.erro).toBeNull();
    expect(component.categorias.length).toBeGreaterThan(0);
    expect(component.form.getRawValue()).toEqual({
      categoria: 'credito_fatura_anterior',
      valor: null,
      observacoes: '',
    });
    expect(component.form.invalid).toBe(true);
  });

  it('deve preencher formulário em edição com valor absoluto', () => {
    const component = criar({
      cartao,
      ano: 2026,
      mes: 5,
      ajuste: { ...ajuste, objetivo: 'estorno', valorTotal: -130 },
    });

    expect(component.editando).toBe(true);
    expect(component.form.getRawValue()).toEqual({
      categoria: 'estorno',
      valor: 130,
      observacoes: 'Juros do rotativo',
    });
  });

  it('deve usar fallbacks em edição quando campos do ajuste estiverem vazios', () => {
    const component = criar({
      cartao,
      ano: 2026,
      mes: 5,
      ajuste: {
        ...ajuste,
        objetivo: undefined as any,
        valorTotal: 0,
        observacoes: undefined,
      },
    });

    expect(component.form.getRawValue()).toEqual({
      categoria: 'credito_fatura_anterior',
      valor: 0,
      observacoes: '',
    });
  });

  it('deve calcular preview negativo para crédito e positivo para débito', () => {
    const component = criar();

    component.form.patchValue({ categoria: 'estorno', valor: 100 });
    expect(component.valorAssinadoPreview).toBe(-100);

    component.form.patchValue({ categoria: 'juros', valor: -80 });
    expect(component.valorAssinadoPreview).toBe(80);
  });

  it('deve retornar preview zero sem valor ou com categoria desconhecida', () => {
    const component = criar();

    component.form.patchValue({ categoria: 'juros', valor: null });
    expect(component.valorAssinadoPreview).toBe(0);

    component.form.patchValue({ categoria: 'juros', valor: 'abc' });
    expect(component.valorAssinadoPreview).toBe(0);

    component.form.patchValue({ categoria: 'inexistente', valor: 50 });
    expect(component.valorAssinadoPreview).toBe(0);
  });

  it('deve retornar label da categoria ou o próprio id', () => {
    const component = criar();

    expect(component.labelCategoria('juros')).toBe('Juros');
    expect(component.labelCategoria('xyz')).toBe('xyz');
  });

  it('deve fechar com false', () => {
    const component = criar();

    component.fechar();

    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });

  describe('salvar', () => {
    it('deve bloquear formulário inválido', () => {
      const component = criar();

      component.salvar();

      expect(component.erro).toBe('Preencha categoria e valor.');
      expect(component.form.get('valor')?.touched).toBe(true);
      expect(dividasService.createDivida).not.toHaveBeenCalled();
    });

    it('deve bloquear quando já estiver salvando', () => {
      const component = criar();
      component.form.patchValue({ categoria: 'juros', valor: 10 });
      component.saving = true;

      component.salvar();

      expect(component.erro).toBe('Preencha categoria e valor.');
      expect(dividasService.createDivida).not.toHaveBeenCalled();
    });

    it('deve criar ajuste de crédito com valor negativo arredondado', () => {
      const component = criar();
      component.form.patchValue({
        categoria: 'credito_fatura_anterior',
        valor: 130.456,
        observacoes: '  Crédito janeiro  ',
      });

      component.salvar();

      expect(dividasService.createDivida).toHaveBeenCalledWith({
        objetivo: 'credito_fatura_anterior',
        tipoDivida: 'ajuste_fatura',
        valorTotal: -130.46,
        quantidadeParcelas: 1,
        cartaoId: 1,
        diaMelhorCompra: 28,
        diaVencimento: 6,
        ano: 2026,
        dataInicio: '2026-05-01',
        observacoes: 'Crédito janeiro',
        statusDivida: 'quitada',
        valorPago: 0,
      });
      expect(dividasService.updateDivida).not.toHaveBeenCalled();
      expect(component.saving).toBe(false);
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('deve criar ajuste sem dias do cartão e sem observações', () => {
      const component = criar({
        cartao: { ...cartao, diaMelhorCompra: null, diaVencimento: null },
        ano: 2025,
        mes: 12,
      });
      component.form.patchValue({ categoria: 'iof', valor: 12 });

      component.salvar();

      const payload = dividasService.createDivida.mock.calls[0][0];
      expect(payload.diaMelhorCompra).toBeUndefined();
      expect(payload.diaVencimento).toBeUndefined();
      expect(payload.valorTotal).toBe(12);
      expect(payload.dataInicio).toBe('2025-12-01');
      expect(payload.observacoes).toBe('');
    });

    it('deve atualizar ajuste existente', () => {
      const component = criar({ cartao, ano: 2026, mes: 5, ajuste });
      component.form.patchValue({ valor: 60 });

      component.salvar();

      expect(dividasService.updateDivida).toHaveBeenCalledTimes(1);
      const [id, payload] = dividasService.updateDivida.mock.calls[0];
      expect(id).toBe(50);
      expect(payload.objetivo).toBe('juros');
      expect(payload.valorTotal).toBe(60);
      expect(payload).not.toHaveProperty('valorPago');
      expect(dividasService.createDivida).not.toHaveBeenCalled();
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('deve exibir erro quando servidor estiver indisponível', () => {
      dividasService.createDivida.mockReturnValueOnce(
        throwError(() => new HttpErrorResponse({ status: 0 })),
      );
      const component = criar();
      component.form.patchValue({ categoria: 'juros', valor: 10 });

      component.salvar();

      expect(component.saving).toBe(false);
      expect(component.erro).toBe('Servidor indisponível. Inicie o backend.');
      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('excluir', () => {
    it('não deve excluir quando não estiver editando', () => {
      const component = criar();

      component.excluir();

      expect(dividasService.deleteDivida).not.toHaveBeenCalled();
    });

    it('não deve excluir quando já estiver salvando', () => {
      const component = criar({ cartao, ano: 2026, mes: 5, ajuste });
      component.saving = true;

      component.excluir();

      expect(dividasService.deleteDivida).not.toHaveBeenCalled();
    });

    it('deve excluir ajuste e fechar com true', () => {
      const component = criar({ cartao, ano: 2026, mes: 5, ajuste });
      component.erro = 'erro anterior';

      component.excluir();

      expect(dividasService.deleteDivida).toHaveBeenCalledWith(50);
      expect(component.erro).toBeNull();
      expect(component.saving).toBe(false);
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('deve exibir mensagem da API quando exclusão falhar', () => {
      dividasService.deleteDivida.mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              error: { error: 'Ajuste não encontrado' },
            }),
        ),
      );
      const component = criar({ cartao, ano: 2026, mes: 5, ajuste });

      component.excluir();

      expect(component.saving).toBe(false);
      expect(component.erro).toBe('Ajuste não encontrado');
      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  it('deve retornar mensagens amigáveis para erros HTTP', () => {
    const component = criar();
    const msgPadrao = 'Não foi possível salvar o ajuste.';

    expect(
      component['mensagemErroHttp'](new HttpErrorResponse({ status: 0 })),
    ).toBe('Servidor indisponível. Inicie o backend.');
    expect(
      component['mensagemErroHttp'](
        new HttpErrorResponse({ status: 500, error: { error: 'Falhou' } }),
      ),
    ).toBe('Falhou');
    expect(
      component['mensagemErroHttp'](
        new HttpErrorResponse({ status: 500, error: { error: '' } }),
      ),
    ).toBe(msgPadrao);
    expect(
      component['mensagemErroHttp'](
        new HttpErrorResponse({ status: 500, error: {} }),
      ),
    ).toBe(msgPadrao);
    expect(
      component['mensagemErroHttp'](
        new HttpErrorResponse({ status: 500, error: null }),
      ),
    ).toBe(msgPadrao);
    expect(
      component['mensagemErroHttp'](
        new HttpErrorResponse({ status: 500, error: 'texto' }),
      ),
    ).toBe(msgPadrao);
    expect(component['mensagemErroHttp'](new Error('x'))).toBe(msgPadrao);
  });
});
