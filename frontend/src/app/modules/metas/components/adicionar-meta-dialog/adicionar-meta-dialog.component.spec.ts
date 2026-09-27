import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { AdicionarMetaDialogComponent } from './adicionar-meta-dialog.component';
import { MetasService } from '../../../../core/services/metas/metas.service';

describe('AdicionarMetaDialogComponent', () => {
  let component: AdicionarMetaDialogComponent;
  let fixture: ComponentFixture<AdicionarMetaDialogComponent>;

  const dialogRefMock = {
    close: jest.fn(),
  };

  const metasServiceMock = {
    createMeta: jest.fn(),
    getAnoSelecionado: jest.fn().mockReturnValue(2026),
  };

  function preencherFormularioValido(): void {
    component.form.patchValue({
      nome: 'Viagem Europa',
      valorMeta: '10000,00',
      valorPorMes: '1000,00',
      temValorAtual: false,
      icon: 'bi-bullseye',
    });
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    metasServiceMock.createMeta.mockReturnValue(of({ id: 1 }));

    await TestBed.configureTestingModule({
      declarations: [AdicionarMetaDialogComponent],
      imports: [
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatDialogModule,
      ],
      providers: [
        FormBuilder,
        ChangeDetectorRef,
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: MetasService, useValue: metasServiceMock },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AdicionarMetaDialogComponent);
    component = fixture.componentInstance;
  });

  describe('Inicialização', () => {
    it('deve criar', () => {
      expect(component).toBeTruthy();
    });

    it('deve expor título e ícones disponíveis', () => {
      expect(component.tituloDialog).toBe('Incluir meta');
      expect(component.availableIcons.length).toBeGreaterThan(0);
    });

    it('deve iniciar formulário com valores padrão', () => {
      expect(component.form.get('nome')?.value).toBe('');
      expect(component.form.get('valorMeta')?.value).toBe('');
      expect(component.form.get('valorPorMes')?.value).toBe('');
      expect(component.form.get('temValorAtual')?.value).toBe(false);
      expect(component.form.get('icon')?.value).toBe('bi-bullseye');
      expect(component.form.get('valorAtual')?.disabled).toBe(true);
    });

    it('ngOnInit deve marcar para checagem', () => {
      const markSpy = jest.spyOn(component['cdr'], 'markForCheck');
      component.ngOnInit();
      expect(markSpy).toHaveBeenCalled();
    });

    it('ngOnDestroy deve cancelar subscription de temValorAtual', () => {
      component.ngOnInit();
      const sub = component['temValorAtualSub'];
      const unsubSpy = jest.spyOn(sub!, 'unsubscribe');
      component.ngOnDestroy();
      expect(unsubSpy).toHaveBeenCalled();
    });
  });

  describe('Getters e seleção de ícone', () => {
    it('temValorAtual reflete o checkbox', () => {
      component.form.get('temValorAtual')?.setValue(true);
      expect(component.temValorAtual).toBe(true);
    });

    it('iconSelecionado retorna valor do form ou padrão', () => {
      expect(component.iconSelecionado).toBe('bi-bullseye');
      component.form.get('icon')?.setValue('bi-house');
      expect(component.iconSelecionado).toBe('bi-house');
    });

    it('selecionarIcon atualiza o form', () => {
      component.selecionarIcon('bi-star');
      expect(component.form.get('icon')?.value).toBe('bi-star');
    });
  });

  describe('fechar', () => {
    it('deve fechar o dialog sem valor de retorno', () => {
      component.fechar();
      expect(dialogRefMock.close).toHaveBeenCalledWith();
    });
  });

  describe('parseNumeroBR', () => {
    it('retorna 0 para vazio ou inválido', () => {
      expect(component.parseNumeroBR('')).toBe(0);
      expect(component.parseNumeroBR('abc')).toBe(0);
    });

    it('converte formato pt-BR', () => {
      expect(component.parseNumeroBR('1000,50')).toBeCloseTo(1000.5, 2);
      expect(component.parseNumeroBR('  10,5  ')).toBeCloseTo(10.5, 2);
    });
  });

  describe('validarApenasNumeros', () => {
    it('impede letras', () => {
      const ev = { which: 65, preventDefault: jest.fn() } as unknown as KeyboardEvent;
      component.validarApenasNumeros(ev);
      expect(ev.preventDefault).toHaveBeenCalled();
    });

    it('permite dígitos e vírgula/ponto', () => {
      const ev = { which: 53, preventDefault: jest.fn() } as unknown as KeyboardEvent;
      component.validarApenasNumeros(ev);
      expect(ev.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('temValorAtual no formulário', () => {
    beforeEach(() => component.ngOnInit());

    it('habilita valorAtual quando checkbox marcado', () => {
      component.form.get('temValorAtual')?.setValue(true);
      const ctrl = component.form.get('valorAtual');
      expect(ctrl?.enabled).toBe(true);
    });

    it('desabilita e limpa valorAtual quando checkbox desmarcado', () => {
      component.form.get('temValorAtual')?.setValue(true);
      component.form.get('valorAtual')?.setValue('100,00');
      component.form.get('temValorAtual')?.setValue(false);
      const ctrl = component.form.get('valorAtual');
      expect(ctrl?.disabled).toBe(true);
      expect(ctrl?.value).toBe('');
    });
  });

  describe('salvar', () => {
    beforeEach(() => {
      component.ngOnInit();
      metasServiceMock.createMeta.mockReturnValue(of({ id: 1 }));
    });

    it('marca touched e não chama API quando form inválido', () => {
      const markSpy = jest.spyOn(component.form, 'markAllAsTouched');
      component.salvar();
      expect(markSpy).toHaveBeenCalled();
      expect(metasServiceMock.createMeta).not.toHaveBeenCalled();
    });

    it('cria meta e fecha dialog com true', () => {
      preencherFormularioValido();
      component.salvar();

      expect(metasServiceMock.createMeta).toHaveBeenCalledTimes(1);
      const payload = metasServiceMock.createMeta.mock.calls[0][0];
      expect(payload.nome).toBe('Viagem Europa');
      expect(payload.valorMeta).toBe(10000);
      expect(payload.valorPorMes).toBe(1000);
      expect(payload.mesesNecessarios).toBe(10);
      expect(payload.valorAtual).toBe(0);
      expect(payload.icon).toBe('bi-bullseye');
      expect(payload.meses?.length).toBe(10);
      expect(payload.meses![0].nome).toMatch(/\/\d{4}$/);
      expect(payload.meses![0].status).toBe('Programado');
      expect(dialogRefMock.close).toHaveBeenCalledWith(true);
      expect(component.saving).toBe(false);
    });

    it('envia valorAtual quando temValorAtual está marcado', () => {
      preencherFormularioValido();
      component.form.patchValue({ temValorAtual: true, valorAtual: '500,00' });
      component.salvar();

      const payload = metasServiceMock.createMeta.mock.calls[0][0];
      expect(payload.valorAtual).toBe(500);
    });

    it('usa bi-bullseye quando icon está vazio no payload', () => {
      preencherFormularioValido();
      component.form.patchValue({ icon: '   ' });
      component.salvar();

      const payload = metasServiceMock.createMeta.mock.calls[0][0];
      expect(payload.icon).toBe('bi-bullseye');
    });

    it('exibe erro de conexão quando status é 0', () => {
      preencherFormularioValido();
      metasServiceMock.createMeta.mockReturnValue(
        throwError(() => ({
          status: 0,
          statusText: 'Unknown Error',
          message: 'Conexão recusada',
        })),
      );

      component.salvar();

      expect(component.erro).toContain('Não foi possível conectar ao servidor');
      expect(component.saving).toBe(false);
      expect(dialogRefMock.close).not.toHaveBeenCalledWith(true);
    });

    it('exibe mensagem genérica em outros erros', () => {
      preencherFormularioValido();
      metasServiceMock.createMeta.mockReturnValue(
        throwError(() => ({ status: 400, message: 'Erro API' })),
      );

      component.salvar();

      expect(component.erro).toBe('Erro API');
    });

    it('usa fallback quando erro não traz message', () => {
      preencherFormularioValido();
      metasServiceMock.createMeta.mockReturnValue(
        throwError(() => ({ status: 500 })),
      );

      component.salvar();

      expect(component.erro).toBe('Não foi possível criar a meta.');
    });
  });

  describe('buildDadosMetaParaEnviar (validações internas)', () => {
    beforeEach(() => component.ngOnInit());

    it('retorna null e define erro quando nome está vazio após trim', () => {
      component.form.patchValue({
        nome: '   ',
        valorMeta: '100,00',
        valorPorMes: '10,00',
      });
      component.form.get('nome')?.setErrors(null);
      component.form.updateValueAndValidity();

      const result = (component as any).buildDadosMetaParaEnviar();
      expect(result).toBeNull();
      expect(component.erro).toBe('Por favor, preencha o nome da meta.');
    });

    it('retorna null quando temValorAtual sem valor preenchido', () => {
      component.form.patchValue({
        nome: 'Meta',
        valorMeta: '1000,00',
        valorPorMes: '100,00',
        temValorAtual: true,
        valorAtual: '',
      });
      component.form.get('valorAtual')?.enable();

      const result = (component as any).buildDadosMetaParaEnviar();
      expect(result).toBeNull();
      expect(component.erro).toBe('Preencha o valor já guardado.');
    });

    it('salvar retorna quando build interno falha mesmo com form válido', () => {
      component.form.patchValue({
        nome: '   ',
        valorMeta: '1000,00',
        valorPorMes: '100,00',
      });
      component.form.get('nome')?.setErrors(null);

      component.salvar();

      expect(component.erro).toBe('Por favor, preencha o nome da meta.');
      expect(metasServiceMock.createMeta).not.toHaveBeenCalled();
    });

    it('cobre erros de valor meta, valor por mês e valor atual negativo', () => {
      component.form.patchValue({
        nome: 'Meta',
        valorMeta: '0',
        valorPorMes: '100,00',
      });
      component.form.get('valorMeta')?.setErrors(null);
      expect((component as any).buildDadosMetaParaEnviar()).toBeNull();
      expect(component.erro).toBe('O valor da meta deve ser maior que zero.');

      component.form.patchValue({
        valorMeta: '1000,00',
        valorPorMes: '0',
      });
      component.form.get('valorPorMes')?.setErrors(null);
      expect((component as any).buildDadosMetaParaEnviar()).toBeNull();
      expect(component.erro).toBe('O valor por mês deve ser maior que zero.');

      component.form.patchValue({
        valorPorMes: '100,00',
        temValorAtual: true,
        valorAtual: '-1',
      });
      component.form.get('valorAtual')?.enable();
      component.form.get('valorAtual')?.setErrors(null);
      expect((component as any).buildDadosMetaParaEnviar()).toBeNull();
      expect(component.erro).toBe(
        'O valor já guardado deve ser maior ou igual a zero.',
      );
    });

    it('cobre fallbacks de controles ausentes, ícone e buildMeses', () => {
      component.form.removeControl('icon');
      expect(component.iconSelecionado).toBe('bi-bullseye');

      component.form.removeControl('valorAtual');
      (component as any).onTemValorAtualChange(true);

      expect((component as any).buildMeses(100, 0).length).toBe(12);
    });

    it('usa string vazia quando controles numéricos não existem', () => {
      component.form.removeControl('nome');
      component.form.removeControl('valorMeta');
      component.form.removeControl('valorPorMes');

      const result = (component as any).buildDadosMetaParaEnviar();

      expect(result).toBeNull();
      expect(component.erro).toBe('Por favor, preencha o nome da meta.');
    });

    it('usa string vazia quando valorAtual não existe e checkbox está marcado', () => {
      component.form.patchValue({
        nome: 'Meta',
        valorMeta: '1000,00',
        valorPorMes: '100,00',
        temValorAtual: true,
      });
      component.form.removeControl('valorAtual');

      const result = (component as any).buildDadosMetaParaEnviar();

      expect(result).toBeNull();
      expect(component.erro).toBe('Preencha o valor já guardado.');
    });
  });

  describe('Validators', () => {
    it('valorMaiorQueZeroValidator: vazio, zero e positivo', () => {
      const fn = (component as any).valorMaiorQueZeroValidator();
      expect(fn({ value: '' })).toEqual({ required: true });
      expect(fn({ value: '0' })).toEqual({ mustBeGreaterThanZero: true });
      expect(fn({ value: '0,01' })).toBeNull();
    });

    it('valorMaiorOuIgualZeroValidator depende de temValorAtual', () => {
      component.form.get('temValorAtual')?.setValue(false);
      let fn = (component as any).valorMaiorOuIgualZeroValidator();
      expect(fn({ value: '   ' })).toBeNull();

      component.form.get('temValorAtual')?.setValue(true);
      fn = (component as any).valorMaiorOuIgualZeroValidator();
      expect(fn({ value: '   ' })).toEqual({ required: true });
      expect(fn({ value: '-1' })).toEqual({
        mustBeGreaterOrEqualZero: true,
      });
    });
  });
});
