import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditarValorModalComponent } from './editar-valor-modal.component';
import { MetaExtended } from '../../../core/interfaces/metas/mes-meta';

describe('EditarValorModalComponent', () => {
  let fixture: ComponentFixture<EditarValorModalComponent>;
  let component: EditarValorModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditarValorModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditarValorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnChanges com valor 0 deixa valorInput vazio', () => {
    component.valor = 0;
    component.ngOnChanges({
      valor: new SimpleChange(undefined, 0, true),
    });
    expect(component.valorInput).toBe('');
  });

  it('ngOnChanges com isOpen também atualiza valorInput', () => {
    component.valor = 100;
    component.isOpen = true;
    component.ngOnChanges({
      isOpen: new SimpleChange(false, true, false),
    });
    expect(component.valorInput).toBe('100');
  });

  it('ngOnChanges com valor diferente de 0 preenche valorInput', () => {
    component.valor = 42.5;
    component.ngOnChanges({
      valor: new SimpleChange(undefined, 42.5, true),
    });
    expect(component.valorInput).toBe('42.5');
  });

  it('onValorChange emite valor numérico parseado (formato 1.234,56 → BR)', () => {
    const spy = jest.fn();
    component.valorChange.subscribe(spy);
    component.onValorChange('1.234,56');
    expect((spy.mock.calls[0][0] as number)).toBeCloseTo(1234.56, 2);
    expect(component.valorInput).toBe('1.234,56');
  });

  it('onValorBlur emite o valor e normaliza valorInput (10,5 → string do número)', () => {
    const spy = jest.fn();
    component.valorChange.subscribe(spy);
    component.valorInput = '10,5';
    component.onValorBlur();
    expect((spy.mock.calls[0][0] as number)).toBeCloseTo(10.5, 2);
    expect(component.valorInput).toBe('10.5');
  });

  it('formatarMoeda usa pt-BR e BRL', () => {
    const s = component.formatarMoeda(1234.56);
    expect(s).toContain('R$');
  });

  it('handleClose e onCancel emitem cancel', () => {
    const spy = jest.fn();
    component.cancel.subscribe(spy);
    component.handleClose();
    expect(spy).toHaveBeenCalledTimes(1);
    component.onCancel();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('onSave emite save', () => {
    const spy = jest.fn();
    component.save.subscribe(spy);
    component.onSave();
    expect(spy).toHaveBeenCalled();
  });

  it('onBackdropClick chama handleClose (cancel)', () => {
    const spy = jest.fn();
    component.cancel.subscribe(spy);
    component.onBackdropClick();
    expect(spy).toHaveBeenCalled();
  });

  it('validarApenasNumeros permite Numpad', () => {
    const ev = new KeyboardEvent('keydown', { key: '1', code: 'Numpad1' });
    jest.spyOn(ev, 'preventDefault');
    component.validarApenasNumeros(ev);
    expect(ev.preventDefault).not.toHaveBeenCalled();
  });

  it('validarApenasNumeros impede letras (defensive)', () => {
    const ev = new KeyboardEvent('keydown', { key: 'x', code: 'KeyX' });
    jest.spyOn(ev, 'preventDefault');
    component.validarApenasNumeros(ev);
    expect(ev.preventDefault).toHaveBeenCalled();
  });

  it('stop chama stopPropagation', () => {
    const e = new Event('click');
    jest.spyOn(e, 'stopPropagation');
    component.stop(e);
    expect(e.stopPropagation).toHaveBeenCalled();
  });

  it('mesNome lê o nome a partir de meta.meses', () => {
    const meta = {
      id: 1,
      nome: 'M',
      valorMeta: 0,
      valorPorMes: 0,
      mesesNecessarios: 0,
      valorAtual: 0,
      meses: [{ id: 3, nome: 'Março', valor: 0, status: 'Vazio' }],
    } as MetaExtended;
    component.meta = meta;
    component.mesId = 3;
    expect(component.mesNome).toBe('Março');
  });

  it('mesNome usa array meses como fallback', () => {
    component.meta = {
      id: 1,
      nome: 'M',
      valorMeta: 0,
      valorPorMes: 0,
      mesesNecessarios: 0,
      valorAtual: 0,
      meses: [],
    } as MetaExtended;
    component.meses = ['Jan', 'Fev'];
    component.mesId = 2;
    expect(component.mesNome).toBe('Fev');
  });

  it('mesNome vazio se meta nula, mesId -1 ou mês inexistente em meta', () => {
    component.meta = null;
    component.mesId = 1;
    expect(component.mesNome).toBe('');

    component.meta = {
      id: 1,
      nome: 'M',
      valorMeta: 0,
      valorPorMes: 0,
      mesesNecessarios: 0,
      valorAtual: 0,
      meses: [],
    } as MetaExtended;
    component.mesId = -1;
    expect(component.mesNome).toBe('');

    component.mesId = 99;
    expect(component.mesNome).toBe('');
  });
});
