import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  AdicionarInvestimentoDialogComponent,
  AdicionarInvestimentoDialogData,
} from './adicionar-investimento-dialog.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { InvestimentosService } from '@core/services/investimentos/investimentos.service';
import { UsuariosService } from '@core/services/usuarios/usuarios.service';
import { Investimento } from '@core/interfaces/investimentos/investimentos';

describe('AdicionarInvestimentoDialogComponent', () => {
  let component: AdicionarInvestimentoDialogComponent;
  let fixture: ComponentFixture<AdicionarInvestimentoDialogComponent>;

  const mockInvestimento: Investimento = {
    id: 10,
    descricao: 'Reserva',
    tipoInvestimento: 'cdb',
    valorInvestido: 2000,
    valorAtual: 2300,
    aporteMensal: 200,
    rentabilidade: 300,
    rentabilidadePercentual: 15,
    statusInvestimento: 'crescendo',
    ano: 2026,
  };

  const dataMock: AdicionarInvestimentoDialogData = {
    investimento: null,
    ano: 2026,
  };

  const dialogRefMock = { close: jest.fn() };
  const investimentosServiceMock = {
    createInvestimento: jest.fn(),
    updateInvestimento: jest.fn(),
  };

  const usuariosServiceMock = {
    getUsuarios: jest.fn(),
    createUsuario: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    dataMock.investimento = null;
    investimentosServiceMock.createInvestimento.mockReturnValue(
      of(mockInvestimento),
    );
    investimentosServiceMock.updateInvestimento.mockReturnValue(
      of(mockInvestimento),
    );
    usuariosServiceMock.getUsuarios.mockReturnValue(
      of([{ id: 1, nome: 'Kelly' }]),
    );
    usuariosServiceMock.createUsuario.mockReturnValue(
      of({ id: 1, nome: 'Kelly' }),
    );

    await TestBed.configureTestingModule({
      declarations: [AdicionarInvestimentoDialogComponent],
      imports: [
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatDialogModule,
        MatAutocompleteModule,
      ],
      providers: [
        FormBuilder,
        { provide: MAT_DIALOG_DATA, useValue: dataMock },
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: InvestimentosService, useValue: investimentosServiceMock },
        { provide: UsuariosService, useValue: usuariosServiceMock },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AdicionarInvestimentoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar', () => {
    expect(component).toBeTruthy();
    expect(component.tituloDialog).toBe('Incluir investimento');
  });

  it('fechar fecha o dialog com false', () => {
    component.fechar();
    expect(dialogRefMock.close).toHaveBeenCalledWith(false);
  });

  it('salvar inválido marca touched e exibe erro', () => {
    component.form.reset();
    component.salvar();

    expect(component.erro).toContain('obrigatórios');
    expect(investimentosServiceMock.createInvestimento).not.toHaveBeenCalled();
  });

  it('salvar cria investimento quando formulário válido', () => {
    component.form.patchValue({
      descricao: 'Novo CDB',
      tipoInvestimento: 'cdb',
      valorInvestido: 1000,
      valorAtual: 1100,
      aporteMensal: 50,
      statusInvestimento: 'crescendo',
    });

    component.salvar();

    expect(investimentosServiceMock.createInvestimento).toHaveBeenCalled();
    const payload = investimentosServiceMock.createInvestimento.mock.calls[0][0];
    expect(payload.descricao).toBe('Novo CDB');
    expect(payload.ano).toBe(2026);
    expect(dialogRefMock.close).toHaveBeenCalledWith(true);
  });

  it('salvar atualiza quando em modo edição', () => {
    component.data.investimento = mockInvestimento;
    component.ngOnInit();
    component.form.patchValue({ descricao: 'Reserva atualizada' });

    component.salvar();

    expect(investimentosServiceMock.updateInvestimento).toHaveBeenCalled();
    const payload =
      investimentosServiceMock.updateInvestimento.mock.calls[0][1];
    expect(payload.descricao).toBe('Reserva atualizada');
    expect(investimentosServiceMock.createInvestimento).not.toHaveBeenCalled();
  });

  it('salvar exibe erro da API', () => {
    component.data.investimento = null;
    component.saving = false;
    investimentosServiceMock.createInvestimento.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404 })),
    );

    component.form.patchValue({
      descricao: 'Teste',
      tipoInvestimento: 'cdb',
      valorInvestido: 100,
      valorAtual: 100,
      statusInvestimento: 'crescendo',
    });

    component.salvar();
    fixture.detectChanges();

    expect(component.erro).toContain('Rota de investimentos');
    expect(dialogRefMock.close).not.toHaveBeenCalledWith(true);
  });

  it('ngOnInit preenche formulário em edição', () => {
    component.data.investimento = mockInvestimento;
    component.ngOnInit();

    expect(component.form.get('descricao')?.value).toBe('Reserva');
    expect(component.tituloDialog).toBe('Editar investimento');
  });

  it('ngOnInit em modo criação zera valorAtual', () => {
    component.data.investimento = null;
    component.ngOnInit();
    expect(component.form.get('valorAtual')?.value).toBeNull();
  });

  it('ngOnInit usa aporteMensal zero quando ausente na edição', () => {
    component.data.investimento = {
      ...mockInvestimento,
      aporteMensal: undefined as unknown as number,
    };
    component.ngOnInit();
    expect(component.form.get('aporteMensal')?.value).toBe(0);
  });

  it('salvar não envia quando já está saving', () => {
    component.form.patchValue({
      descricao: 'Teste',
      tipoInvestimento: 'cdb',
      valorInvestido: 100,
      valorAtual: 100,
      statusInvestimento: 'crescendo',
    });
    component.saving = true;
    component.salvar();
    expect(investimentosServiceMock.createInvestimento).not.toHaveBeenCalled();
  });

  it('salvar usa valorAtual igual ao investido quando vazio', () => {
    component.form.patchValue({
      descricao: 'Sem patrimônio',
      tipoInvestimento: 'cdb',
      valorInvestido: 500,
      statusInvestimento: 'crescendo',
    });
    const valorAtualCtrl = component.form.get('valorAtual');
    valorAtualCtrl?.clearValidators();
    valorAtualCtrl?.setValue(null);
    valorAtualCtrl?.updateValueAndValidity();

    component.salvar();

    expect(investimentosServiceMock.createInvestimento).toHaveBeenCalled();
    const payload = investimentosServiceMock.createInvestimento.mock.calls[0][0];
    expect(payload.valorAtual).toBe(500);
  });

  it('salvar envia campos opcionais trimados', () => {
    component.form.patchValue({
      descricao: '  Fundo  ',
      tipoInvestimento: 'fii',
      valorInvestido: 1000,
      valorAtual: 1200,
      aporteMensal: 0,
      statusInvestimento: 'estavel',
      instituicao: '  Banco X  ',
      dataInicio: '2026-01-15',
      observacoes: '  obs  ',
    });

    component.salvar();

    const payload = investimentosServiceMock.createInvestimento.mock.calls[0][0];
    expect(payload.descricao).toBe('Fundo');
    expect(payload.instituicao).toBe('Banco X');
    expect(payload.observacoes).toBe('obs');
    expect(payload.aporteMensal).toBe(0);
  });

  it('salvar exibe erro de servidor indisponível', () => {
    component.data.investimento = null;
    component.saving = false;
    investimentosServiceMock.createInvestimento.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 0 })),
    );

    component.form.patchValue({
      descricao: 'Teste',
      tipoInvestimento: 'cdb',
      valorInvestido: 100,
      valorAtual: 100,
      statusInvestimento: 'crescendo',
    });

    component.salvar();
    fixture.detectChanges();

    expect(component.erro).toContain('Servidor indisponível');
  });

  it('salvar exibe mensagem retornada pela API', () => {
    component.data.investimento = null;
    component.saving = false;
    investimentosServiceMock.createInvestimento.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { error: 'Dados inválidos' },
          }),
      ),
    );

    component.form.patchValue({
      descricao: 'Teste',
      tipoInvestimento: 'cdb',
      valorInvestido: 100,
      valorAtual: 100,
      statusInvestimento: 'crescendo',
    });

    component.salvar();
    fixture.detectChanges();

    expect(component.erro).toBe('Dados inválidos');
  });

  it('salvar omite campos opcionais quando vazios', () => {
    component.form.patchValue({
      descricao: 'Básico',
      tipoInvestimento: 'cdb',
      valorInvestido: 1000,
      valorAtual: 1000,
      statusInvestimento: 'crescendo',
      instituicao: '',
      dataInicio: '',
      observacoes: '',
    });

    component.salvar();

    const payload = investimentosServiceMock.createInvestimento.mock.calls[0][0];
    expect(payload.instituicao).toBeUndefined();
    expect(payload.dataInicio).toBeUndefined();
    expect(payload.observacoes).toBeUndefined();
  });

  it('mensagemErroHttp retorna texto de carregar', () => {
    const msg = (
      component as unknown as {
        mensagemErroHttp: (err: unknown, acao: string) => string;
      }
    ).mensagemErroHttp(new Error('x'), 'carregar');
    expect(msg).toContain('carregar');
  });

  it('salvar erro HTTP sem corpo estruturado usa mensagem genérica', () => {
    component.data.investimento = null;
    component.saving = false;
    investimentosServiceMock.createInvestimento.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 500, error: 'texto simples' }),
      ),
    );

    component.form.patchValue({
      descricao: 'Teste',
      tipoInvestimento: 'cdb',
      valorInvestido: 100,
      valorAtual: 100,
      statusInvestimento: 'crescendo',
    });

    component.salvar();
    fixture.detectChanges();

    expect(component.erro).toBe('Não foi possível salvar. Tente novamente.');
  });

  it('salvar exibe mensagem genérica em erro desconhecido', () => {
    component.data.investimento = null;
    component.saving = false;
    investimentosServiceMock.createInvestimento.mockReturnValue(
      throwError(() => new Error('falha')),
    );

    component.form.patchValue({
      descricao: 'Teste',
      tipoInvestimento: 'cdb',
      valorInvestido: 100,
      valorAtual: 100,
      statusInvestimento: 'crescendo',
    });

    component.salvar();
    fixture.detectChanges();

    expect(component.erro).toBe('Não foi possível salvar. Tente novamente.');
  });

  it('autocomplete retorna vazio até ativar e filtra nomes normalizados', () => {
    component.pessoasAutocompleteOptions = ['Ana Maria', 'João'];
    component.listaAutocompletePessoaAtiva = false;
    component.form.get('pessoa')?.setValue('ana');

    expect((component as any)._filterPessoa('ana')).toEqual([]);

    component.onPessoaFieldFocus();

    expect((component as any)._filterPessoa('ana')).toEqual(['Ana Maria']);
  });

  it('focus não reativa autocomplete quando já está ativo', () => {
    const nextSpy = jest.spyOn((component as any).pessoasOpcoesAtualizadas$, 'next');
    component.listaAutocompletePessoaAtiva = true;

    component.onPessoaFieldFocus();

    expect(nextSpy).not.toHaveBeenCalled();
  });

  it('blur mantém pessoa quando já está formatada ou vazia', () => {
    const ctrl = component.form.get('pessoa');
    ctrl?.setValue('Kelly');
    component.onPessoaBlur();
    expect(ctrl?.value).toBe('Kelly');

    ctrl?.setValue('');
    component.onPessoaBlur();
    expect(ctrl?.value).toBe('');
  });

  it('normalizarListaNomes remove vazios, duplica por case e ordena', () => {
    expect(
      (component as any).normalizarListaNomes([
        ' maria ',
        null,
        undefined,
        'Maria',
        'ana clara',
      ]),
    ).toEqual(['Ana Clara', 'Maria']);
  });

  it('salvar com pessoa continua mesmo quando criação de usuário falha', () => {
    usuariosServiceMock.createUsuario.mockReturnValue(throwError(() => new Error('erro')));
    component.form.patchValue({
      descricao: 'Tesouro',
      pessoa: ' maria ',
      tipoInvestimento: 'tesouro',
      valorInvestido: 100,
      valorAtual: '',
      statusInvestimento: 'crescendo',
    });
    component.form.get('valorAtual')?.clearValidators();
    component.form.get('valorAtual')?.updateValueAndValidity();

    component.salvar();

    expect(usuariosServiceMock.createUsuario).toHaveBeenCalledWith('Maria');
    expect(investimentosServiceMock.createInvestimento).toHaveBeenCalled();
    const payload = investimentosServiceMock.createInvestimento.mock.calls[0][0];
    expect(payload.pessoa).toBe('Maria');
    expect(payload.valorAtual).toBe(100);
  });
});
