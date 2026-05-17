import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, NgForm, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  AdicionarMetaModalComponent,
  MyErrorStateMatcher,
} from './adicionar-meta-modal.component';

describe('AdicionarMetaModalComponent', () => {
  let fixture: ComponentFixture<AdicionarMetaModalComponent>;
  let component: AdicionarMetaModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, NoopAnimationsModule],
      declarations: [AdicionarMetaModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdicionarMetaModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('parseNumeroBR converte string pt-BR e retorna 0 se vazio/inválido', () => {
    expect(component.parseNumeroBR('')).toBe(0);
    // O parser actual só troca a primeira vírgula; milhares com ponto+ vírgula não normaliza
    expect(component.parseNumeroBR('1000,50')).toBeCloseTo(1000.5, 2);
    expect(component.parseNumeroBR('  10,5  ')).toBeCloseTo(10.5, 2);
  });

  it('onSave emite save quando o formulário é válido', () => {
    const saveSpy = jest.fn();
    component.save.subscribe(saveSpy);
    component.nomeFormControl.setValue('Minha meta');
    component.valorMetaFormControl.setValue('1000,00');
    component.valorPorMesFormControl.setValue('100,00');
    component.temValorAtual = false;
    component.onSave();
    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Minha meta' }),
    );
  });

  it('onSave não emite save quando faltar campos obrigatórios', () => {
    const saveSpy = jest.fn();
    component.save.subscribe(saveSpy);
    component.nomeFormControl.setValue('');
    component.onSave();
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('onCancel emite cancel', () => {
    const spy = jest.fn();
    component.cancel.subscribe(spy);
    component.onCancel();
    expect(spy).toHaveBeenCalled();
  });

  it('onTemValorAtualChange habilita e valida valor atual quando true', () => {
    const emitSpy = jest.fn();
    component.temValorAtualChange.subscribe(emitSpy);
    component.onTemValorAtualChange(true);
    expect(emitSpy).toHaveBeenCalledWith(true);
    expect(component.valorAtualFormControl.enabled).toBe(true);
  });

  it('onTemValorAtualChange desabilita e limpa valor atual quando false', () => {
    component.onTemValorAtualChange(true);
    component.valorAtualFormControl.setValue('50,00');
    component.onTemValorAtualChange(false);
    expect(component.valorAtualFormControl.disabled).toBe(true);
    expect(component.valorAtualFormControl.value).toBe('');
  });

  it('validarApenasNumeros impede letras (keydown)', () => {
    const ev = new KeyboardEvent('keydown', { key: 'a' });
    Object.defineProperty(ev, 'which', { value: 65 });
    jest.spyOn(ev, 'preventDefault');
    component.validarApenasNumeros(ev);
    expect(ev.preventDefault).toHaveBeenCalled();
  });

  it('stop chama stopPropagation', () => {
    const ev = new Event('click');
    jest.spyOn(ev, 'stopPropagation');
    component.stop(ev);
    expect(ev.stopPropagation).toHaveBeenCalled();
  });

  it('ngOnDestroy chama unsubscribe em cada subscrição', () => {
    const list = (
      component as unknown as { subscriptions: { unsubscribe: () => void }[] }
    ).subscriptions;
    const spies = list.map((s) => jest.spyOn(s, 'unsubscribe'));
    component.ngOnDestroy();
    spies.forEach((spy) => expect(spy).toHaveBeenCalled());
  });

  it('emite outputs ao alterar FormControls (ngOnInit subscriptions)', () => {
    const nomeSpy = jest.fn();
    const vmSpy = jest.fn();
    const vpmSpy = jest.fn();
    const vaSpy = jest.fn();
    component.nomeChange.subscribe(nomeSpy);
    component.valorMetaChange.subscribe(vmSpy);
    component.valorPorMesChange.subscribe(vpmSpy);
    component.valorAtualChange.subscribe(vaSpy);

    component.nomeFormControl.setValue('Meta X');
    component.valorMetaFormControl.setValue('100,00');
    component.valorPorMesFormControl.setValue('10,00');
    component.onTemValorAtualChange(true);
    component.valorAtualFormControl.setValue('5,00');

    expect(nomeSpy).toHaveBeenCalledWith('Meta X');
    expect(vmSpy).toHaveBeenCalledWith('100,00');
    expect(vpmSpy).toHaveBeenCalledWith('10,00');
    expect(vaSpy).toHaveBeenCalledWith('5,00');
  });

  it('valorMaiorQueZeroValidator: vazio, zero e positivo', () => {
    const v = component.valorMaiorQueZeroValidator();
    expect(v(new FormControl(''))).toEqual({ required: true });
    expect(v(new FormControl('0'))).toEqual({ mustBeGreaterThanZero: true });
    expect(v(new FormControl('0,01'))).toBeNull();
  });

  it('valorMaiorOuIgualZeroValidator: vazio depende de temValorAtual', () => {
    component.temValorAtual = false;
    let fn = component.valorMaiorOuIgualZeroValidator();
    expect(fn(new FormControl('   '))).toBeNull();
    component.temValorAtual = true;
    fn = component.valorMaiorOuIgualZeroValidator();
    expect(fn(new FormControl('   '))).toEqual({ required: true });
  });

  it('valorMaiorOuIgualZeroValidator: valor negativo', () => {
    component.temValorAtual = true;
    const fn = component.valorMaiorOuIgualZeroValidator();
    expect(fn(new FormControl('-1'))).toEqual({
      mustBeGreaterOrEqualZero: true,
    });
  });

  it('onIconChange emite iconChange', () => {
    const spy = jest.fn();
    component.iconChange.subscribe(spy);
    component.onIconChange('bi-house');
    expect(spy).toHaveBeenCalledWith('bi-house');
  });

  it('onValorMetaChangeEvent / onValorPorMesChangeEvent / onValorAtualChangeEvent reencaminham o evento', () => {
    const e = { type: 'input' } as Event;
    const a = jest.fn();
    const b = jest.fn();
    const c = jest.fn();
    component.valorMetaChangeEvent.subscribe(a);
    component.valorPorMesChangeEvent.subscribe(b);
    component.valorAtualChangeEvent.subscribe(c);
    component.onValorMetaChangeEvent(e);
    component.onValorPorMesChangeEvent(e);
    component.onValorAtualChangeEvent(e);
    expect(a).toHaveBeenCalledWith(e);
    expect(b).toHaveBeenCalledWith(e);
    expect(c).toHaveBeenCalledWith(e);
  });

  it('onSave com temValorAtual exige valor atual válido e emite save quando ok', () => {
    const saveSpy = jest.fn();
    const vaSpy = jest.fn();
    component.save.subscribe(saveSpy);
    component.valorAtualChange.subscribe(vaSpy);

    component.temValorAtual = true;
    component.onTemValorAtualChange(true);
    component.nomeFormControl.setValue('M');
    component.valorMetaFormControl.setValue('100,00');
    component.valorPorMesFormControl.setValue('10,00');
    component.valorAtualFormControl.setValue('1,00');
    component.onSave();

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'M' }),
    );
  });

  it('onSave não conclui se temValorAtual e valor atual inválido', () => {
    const saveSpy = jest.fn();
    component.save.subscribe(saveSpy);
    component.temValorAtual = true;
    component.onTemValorAtualChange(true);
    component.nomeFormControl.setValue('M');
    component.valorMetaFormControl.setValue('100,00');
    component.valorPorMesFormControl.setValue('10,00');
    component.valorAtualFormControl.setValue('');
    component.onSave();
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('onSave emite valorAtual vazio no output quando temValorAtual é false', () => {
    const vaSpy = jest.fn();
    component.valorAtualChange.subscribe(vaSpy);
    component.temValorAtual = false;
    component.nomeFormControl.setValue('A');
    component.valorMetaFormControl.setValue('10,00');
    component.valorPorMesFormControl.setValue('1,00');
    vaSpy.mockClear();
    component.onSave();
    expect(vaSpy).toHaveBeenCalledWith('');
  });

  it('ngOnChanges isOpen true bloqueia scroll e isOpen true→false repõe', () => {
    const prev = document.body.style.overflow;
    component.isOpen = true;
    component.ngOnChanges({ isOpen: new SimpleChange(false, true, true) });
    expect(document.body.style.overflow).toBe('hidden');
    component.isOpen = false;
    component.ngOnChanges({ isOpen: new SimpleChange(true, false, false) });
    expect(document.body.style.overflow).toBe('');
    document.body.style.overflow = prev;
  });

  it('ngOnChanges sincroniza @Input nome e raws com FormControls', () => {
    component.nome = 'Novo Nome';
    component.ngOnChanges({
      nome: new SimpleChange('a', 'Novo Nome', false),
    });
    expect(component.nomeFormControl.value).toBe('Novo Nome');
    component.valorMetaRaw = '500,00';
    component.ngOnChanges({
      valorMetaRaw: new SimpleChange('', '500,00', false),
    });
    expect(component.valorMetaFormControl.value).toBe('500,00');
    component.valorPorMesRaw = '50,00';
    component.ngOnChanges({
      valorPorMesRaw: new SimpleChange('', '50,00', false),
    });
    expect(component.valorPorMesFormControl.value).toBe('50,00');
  });

  it('ngOnChanges temValorAtual no input ajusta control do valor atual', () => {
    component.temValorAtual = true;
    component.ngOnChanges({ temValorAtual: new SimpleChange(false, true, false) });
    expect(component.valorAtualFormControl.enabled).toBe(true);
    component.temValorAtual = false;
    component.ngOnChanges({ temValorAtual: new SimpleChange(true, false, false) });
    expect(component.valorAtualFormControl.disabled).toBe(true);
  });

  it('onBackdropClick não dispara onCancel (no-op)', () => {
    const spy = jest.fn();
    component.cancel.subscribe(spy);
    component.onBackdropClick(new MouseEvent('click'));
    expect(spy).not.toHaveBeenCalled();
  });

  it('validarApenasNumeros não impede teclas numéricas', () => {
    const ev = new KeyboardEvent('keydown', { key: '5' });
    Object.defineProperty(ev, 'which', { value: 53 });
    jest.spyOn(ev, 'preventDefault');
    component.validarApenasNumeros(ev);
    expect(ev.preventDefault).not.toHaveBeenCalled();
  });

  it('parseNumeroBR com resultado NaN devolve 0', () => {
    expect(
      component.parseNumeroBR('não-é-número-com-vírgula,x'),
    ).toBe(0);
  });

  it('expor lista de ícones disponíveis (constante partilhada)', () => {
    expect(component.availableIcons.length).toBeGreaterThan(0);
    expect(component.availableIcons[0].value).toBeTruthy();
  });
});

describe('MyErrorStateMatcher', () => {
  it('isErrorState retorna true quando control inválido e dirty', () => {
    const m = new MyErrorStateMatcher();
    const c = new FormControl('', { nonNullable: true });
    c.setErrors({ required: true });
    c.markAsDirty();
    expect(m.isErrorState(c, null)).toBe(true);
  });

  it('isErrorState considera form.submitted', () => {
    const m = new MyErrorStateMatcher();
    const c = new FormControl('', { nonNullable: true });
    c.setErrors({ required: true });
    const form = { submitted: true } as NgForm;
    expect(m.isErrorState(c, form)).toBe(true);
  });

  it('isErrorState retorna false quando o control é válido', () => {
    const m = new MyErrorStateMatcher();
    const c = new FormControl('ok', { nonNullable: true });
    c.markAsDirty();
    expect(m.isErrorState(c, null)).toBe(false);
  });

  it('isErrorState retorna false quando inválido mas sem dirty/touched e form não submetido', () => {
    const m = new MyErrorStateMatcher();
    const c = new FormControl('', { nonNullable: true });
    c.setErrors({ required: true });
    expect(m.isErrorState(c, { submitted: false } as NgForm)).toBe(false);
  });
});
