import { FormBuilder } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Cartao } from '@core/interfaces/cartoes/cartoes';
import { AdicionarCartaoDialogComponent } from './adicionar-cartao-dialog.component';

describe('AdicionarCartaoDialogComponent', () => {
  const cartao: Cartao = {
    id: 1,
    nome: 'Roxo',
    banco: 'Nubank',
    limite: 1000,
    valorUtilizado: 0,
    valorDisponivel: 1000,
    faturaPaga: false,
    valorFaturaPaga: 0,
    diaFechamento: 10,
    diaVencimento: 20,
    diaMelhorCompra: 11,
    pessoa: 'Kelly',
  };

  const dialogRef = { close: jest.fn() };
  const cartoesService = {
    createCartao: jest.fn(),
    updateCartao: jest.fn(),
  };
  const usuariosService = {
    getUsuarios: jest.fn(),
  };
  const cdr = {
    markForCheck: jest.fn(),
  };

  function criar(data = { cartao: null as Cartao | null }) {
    return new AdicionarCartaoDialogComponent(
      data,
      dialogRef as any,
      new FormBuilder(),
      cartoesService as any,
      usuariosService as any,
      cdr as any,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    cartoesService.createCartao.mockReturnValue(of({}));
    cartoesService.updateCartao.mockReturnValue(of({}));
    usuariosService.getUsuarios.mockReturnValue(of([{ id: 1, nome: 'Kelly' }]));
  });

  it('deve iniciar em modo inclusão e carregar usuários', () => {
    const component = criar();

    component.ngOnInit();

    expect(component.isEdicao).toBe(false);
    expect(component.tituloDialog).toBe('Adicionar cartão');
    expect(component.usuarios).toEqual([{ id: 1, nome: 'Kelly' }]);
    expect(cdr.markForCheck).toHaveBeenCalled();
  });

  it('deve preencher formulário em edição', () => {
    const component = criar({ cartao });

    component.ngOnInit();

    expect(component.isEdicao).toBe(true);
    expect(component.tituloDialog).toBe('Editar cartão');
    expect(component.form.get('nome')?.value).toBe('Roxo');
    expect(component.form.get('pessoa')?.value).toBe('Kelly');
    expect(component.form.get('diaMelhorCompra')?.value).toBe(11);
  });

  it('deve fechar com false', () => {
    const component = criar();

    component.fechar();

    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });

  it('deve validar formulário inválido', () => {
    const component = criar();

    component.salvar();

    expect(component.erro).toBe('Preencha nome, banco e limite do cartão.');
    expect(cartoesService.createCartao).not.toHaveBeenCalled();
  });

  it('deve criar cartão com pessoa selecionada', () => {
    const component = criar();
    component.form.patchValue({
      nome: ' Black ',
      banco: ' C6 ',
      pessoa: ' David ',
      limite: 2000,
      diaFechamento: 5,
      diaVencimento: 15,
      diaMelhorCompra: 6,
    });

    component.salvar();

    expect(cartoesService.createCartao).toHaveBeenCalledWith({
      nome: 'Black',
      banco: 'C6',
      limite: 2000,
      faturaPaga: false,
      valorFaturaPaga: 0,
      diaFechamento: 5,
      diaVencimento: 15,
      diaMelhorCompra: 6,
      pessoa: 'David',
    });
    expect(dialogRef.close).toHaveBeenCalledWith(true);
    expect(component.saving).toBe(false);
  });

  it('deve atualizar cartão e preservar status pago quando não houver valor utilizado no formulário', () => {
    const component = criar({
      cartao: { ...cartao, faturaPaga: true, valorFaturaPaga: 300 },
    });
    component.ngOnInit();
    component.form.patchValue({ nome: 'Roxo 2', banco: 'Nubank', limite: 1200, pessoa: '' });

    component.salvar();

    expect(cartoesService.updateCartao).toHaveBeenCalledTimes(1);
    const [id, payload] = cartoesService.updateCartao.mock.calls[0];
    expect(id).toBe(1);
    expect(payload.nome).toBe('Roxo 2');
    expect(payload.pessoa).toBeNull();
    expect(payload.faturaPaga).toBe(true);
    expect(payload.valorFaturaPaga).toBe(300);
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('deve tratar erro do serviço e erro ao carregar usuários', () => {
    usuariosService.getUsuarios.mockReturnValueOnce(throwError(() => new Error('erro')));
    cartoesService.createCartao.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { error: 'Limite inválido' },
          }),
      ),
    );
    const component = criar();

    component.ngOnInit();
    component.form.patchValue({ nome: 'Roxo', banco: 'Nubank', limite: 1000 });
    component.salvar();

    expect(component.usuarios).toEqual([]);
    expect(component.erro).toBe('Limite inválido');
    expect(component.saving).toBe(false);
  });

  it('deve retornar mensagens amigáveis para erros HTTP', () => {
    const component = criar();

    expect(component['mensagemErroHttp'](new HttpErrorResponse({ status: 0 }))).toContain('Servidor indisponível');
    expect(component['mensagemErroHttp'](new Error('erro'))).toBe('Não foi possível salvar. Tente novamente.');
  });
});
