import { FormBuilder } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Cartao } from '@core/interfaces/cartoes/cartoes';
import { Divida } from '@core/interfaces/dividas/dividas';
import { AdicionarParcelamentoDialogComponent } from './adicionar-parcelamento-dialog.component';

describe('AdicionarParcelamentoDialogComponent', () => {
  const cartao: Cartao = {
    id: 1,
    nome: 'Roxo',
    banco: 'Nubank',
    limite: 1000,
    valorUtilizado: 0,
    valorDisponivel: 1000,
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
  };

  function criar(data = { cartao, ano: 2026, mes: 5, parcelamento: undefined as Divida | undefined }) {
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
  });

  it('deve criar formulário vazio com data padrão', () => {
    const component = criar();

    expect(component.editando).toBe(false);
    expect(component.form.get('objetivo')?.value).toBe('');
    expect(component.form.get('valorTotal')?.value).toBeNull();
    expect(component.form.get('dataInicio')?.value).toMatch(/^2026-05-\d{2}$/);
  });

  it('deve preencher formulário quando estiver editando', () => {
    const component = criar({ cartao, ano: 2026, mes: 5, parcelamento });

    expect(component.editando).toBe(true);
    expect(component.form.get('objetivo')?.value).toBe('Notebook');
    expect(component.form.get('dataInicio')?.value).toBe('2026-05-01');
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

    expect(component.erro).toBe('Preencha descrição, valor e quantidade de parcelas.');
    expect(dividasService.createDivida).not.toHaveBeenCalled();
  });

  it('deve calcular parcela como zero quando valores estão vazios', () => {
    const component = criar();

    expect(component.parcelaCalculada).toBe(0);
  });

  it('deve bloquear salvar quando já estiver salvando', () => {
    const component = criar();
    component.form.patchValue({
      objetivo: 'Roupa',
      valorTotal: 300,
      quantidadeParcelas: 3,
      dataInicio: '2026-05-10',
    });
    component.saving = true;

    component.salvar();

    expect(component.erro).toBe('Preencha descrição, valor e quantidade de parcelas.');
    expect(dividasService.createDivida).not.toHaveBeenCalled();
  });

  it('deve criar parcelamento', () => {
    const component = criar();
    component.form.patchValue({
      objetivo: ' Roupa ',
      valorTotal: 300,
      quantidadeParcelas: 3,
      dataInicio: '2026-05-10',
      observacoes: ' Loja ',
    });

    component.salvar();

    expect(dividasService.createDivida).toHaveBeenCalledWith({
      objetivo: 'Roupa',
      tipoDivida: 'parcelamento',
      valorTotal: 300,
      quantidadeParcelas: 3,
      cartaoId: 1,
      ano: 2026,
      dataInicio: '2026-05-10',
      observacoes: 'Loja',
      valorPago: 0,
    });
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('deve atualizar parcelamento', () => {
    const component = criar({ cartao, ano: 2026, mes: 5, parcelamento });
    component.form.patchValue({ objetivo: 'Notebook novo', valorTotal: 900, quantidadeParcelas: 3 });

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
      dataInicio: '2026-05-10',
    });

    component.salvar();

    expect(component.erro).toContain('Servidor indisponível');
    expect(component.saving).toBe(false);
    expect(component['mensagemErroHttp'](new HttpErrorResponse({ status: 400, error: { error: 'Erro API' } }))).toBe('Erro API');
    expect(component['mensagemErroHttp'](new HttpErrorResponse({ status: 400, error: {} }))).toBe('Não foi possível salvar o parcelamento.');
    expect(component['mensagemErroHttp'](new HttpErrorResponse({ status: 400, error: 'erro' }))).toBe('Não foi possível salvar o parcelamento.');
    expect(component['mensagemErroHttp'](new Error('erro'))).toBe('Não foi possível salvar o parcelamento.');
  });
});
