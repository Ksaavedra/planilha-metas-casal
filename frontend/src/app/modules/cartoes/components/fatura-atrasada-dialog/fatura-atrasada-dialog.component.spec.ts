import { FormBuilder } from '@angular/forms';
import { Cartao } from '@core/interfaces/cartoes/cartoes';
import { FaturaAtrasadaDialogComponent } from './fatura-atrasada-dialog.component';

describe('FaturaAtrasadaDialogComponent', () => {
  const cartao: Cartao = {
    id: 1,
    nome: 'Roxo',
    banco: 'Nubank',
    limite: 1000,
    valorUtilizado: 250,
    valorDisponivel: 750,
    observacaoAtraso: 'Combinar pagamento',
    previsaoPagamento: '2026-05-30',
  };
  const dialogRef = { close: jest.fn() };

  function criar(c: Cartao = cartao) {
    return new FaturaAtrasadaDialogComponent(
      { cartao: c },
      dialogRef as any,
      new FormBuilder(),
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve iniciar com valor em aberto e previsão preenchida', () => {
    const component = criar();

    expect(component.valorEmAberto).toBe(250);
    expect(component.form.get('valorPago')?.value).toBe(250);
    expect(component.form.get('observacaoAtraso')?.value).toBe('Combinar pagamento');
    expect(component.podePagarDepois).toBe(true);
    expect(component.podePagarAgora).toBe(true);
  });

  it('deve usar fallbacks quando cartão não tiver valores opcionais', () => {
    const component = criar({
      ...cartao,
      valorUtilizado: undefined as any,
      observacaoAtraso: undefined,
      previsaoPagamento: undefined,
    });

    expect(component.valorEmAberto).toBe(0);
    expect(component.form.get('valorPago')?.value).toBe(0);
    expect(component.form.get('observacaoAtraso')?.value).toBe('');
    expect(component.form.get('previsaoPagamento')?.value).toBe('');
    expect(component.podePagarAgora).toBe(false);
  });

  it('deve bloquear pagamento agora sem previsão ou valor suficiente', () => {
    const component = criar({ ...cartao, previsaoPagamento: '', observacaoAtraso: null });

    component.pagarAgora();
    expect(component.erro).toBe('Informe a previsão de pagamento.');

    component.form.patchValue({ previsaoPagamento: '2026-05-30', valorPago: 100 });
    component.pagarAgora();
    expect(component.erro).toBe('Informe o valor total em aberto para regularizar a fatura.');
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('deve confirmar pagamento agora', () => {
    const component = criar();
    component.form.patchValue({ valorPago: 300, previsaoPagamento: '2026-05-30' });

    component.pagarAgora();

    expect(dialogRef.close).toHaveBeenCalledWith({
      acao: 'pagar',
      valorPago: 300,
      previsaoPagamento: '2026-05-30',
    });
  });

  it('deve bloquear pagar depois sem previsão', () => {
    const component = criar({ ...cartao, previsaoPagamento: '' });

    component.pagarDepois();

    expect(component.erro).toBe('Informe a previsão de pagamento para pagar depois.');
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('deve confirmar pagar depois com observação aparada', () => {
    const component = criar();
    component.form.patchValue({
      observacaoAtraso: ' Pagar após receber ',
      previsaoPagamento: '2026-06-01',
    });

    component.pagarDepois();

    expect(dialogRef.close).toHaveBeenCalledWith({
      acao: 'depois',
      observacaoAtraso: 'Pagar após receber',
      previsaoPagamento: '2026-06-01',
    });
  });

  it('deve confirmar pagar depois sem observação', () => {
    const component = criar();
    component.form.patchValue({
      observacaoAtraso: '',
      previsaoPagamento: '2026-06-01',
    });

    component.pagarDepois();

    expect(dialogRef.close).toHaveBeenCalledWith({
      acao: 'depois',
      observacaoAtraso: undefined,
      previsaoPagamento: '2026-06-01',
    });
  });

  it('podePagarAgora deve ser false quando valor em aberto é zero', () => {
    const component = criar({ ...cartao, valorUtilizado: 0, previsaoPagamento: '2026-06-01' });
    component.form.patchValue({ valorPago: 100 });

    expect(component.podePagarDepois).toBe(true);
    expect(component.podePagarAgora).toBe(false);
  });

  it('deve fechar sem resultado', () => {
    const component = criar({ ...cartao, valorUtilizado: -50 });

    expect(component.valorEmAberto).toBe(0);
    component.fechar();

    expect(dialogRef.close).toHaveBeenCalledWith();
  });

  describe('com valor em aberto informado', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    function criarComValor(valorEmAberto: number) {
      return new FaturaAtrasadaDialogComponent(
        { cartao, valorEmAberto },
        dialogRef as any,
        new FormBuilder(),
      );
    }

    it('deve priorizar valor informado arredondado', () => {
      const component = criarComValor(123.456);

      expect(component.valorEmAberto).toBe(123.46);
      expect(component.form.get('valorPago')?.value).toBe(123.46);
    });

    it('deve zerar valor informado negativo', () => {
      expect(criarComValor(-10).valorEmAberto).toBe(0);
    });

    it('deve ignorar valor informado não finito e usar valor utilizado do cartão', () => {
      expect(criarComValor(Number.NaN).valorEmAberto).toBe(250);
      expect(criarComValor(Number.POSITIVE_INFINITY).valorEmAberto).toBe(250);
    });

    it('deve tratar valor pago vazio como zero', () => {
      const component = criar();
      component.form.patchValue({ valorPago: null });

      expect(component.podePagarAgora).toBe(false);

      component.pagarAgora();
      expect(component.erro).toBe(
        'Informe o valor total em aberto para regularizar a fatura.',
      );
    });

    it('deve tratar controles ausentes do formulário', () => {
      const component = criar();
      component.form.removeControl('valorPago');

      expect(component.podePagarAgora).toBe(false);
      component.pagarAgora();
      expect(component.erro).toBe(
        'Informe o valor total em aberto para regularizar a fatura.',
      );

      component.form.removeControl('previsaoPagamento');
      expect(component.podePagarDepois).toBe(false);

      component.pagarAgora();
      expect(component.erro).toBe('Informe a previsão de pagamento.');

      component.pagarDepois();
      expect(component.erro).toBe(
        'Informe a previsão de pagamento para pagar depois.',
      );
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('deve enviar previsão vazia quando o valor não estiver disponível ao pagar', () => {
      const component = criar();
      jest
        .spyOn(component, 'podePagarDepois', 'get')
        .mockReturnValue(true);
      jest.spyOn(component, 'podePagarAgora', 'get').mockReturnValue(true);
      component.form.removeControl('previsaoPagamento');

      component.pagarAgora();

      expect(dialogRef.close).toHaveBeenCalledWith({
        acao: 'pagar',
        valorPago: 250,
        previsaoPagamento: '',
      });
    });

    it('deve enviar previsão undefined ao pagar depois sem valor de previsão', () => {
      const component = criar();
      jest
        .spyOn(component, 'podePagarDepois', 'get')
        .mockReturnValue(true);
      component.form.patchValue({ previsaoPagamento: '', observacaoAtraso: '' });

      component.pagarDepois();

      expect(dialogRef.close).toHaveBeenCalledWith({
        acao: 'depois',
        observacaoAtraso: undefined,
        previsaoPagamento: undefined,
      });
    });
  });
});
