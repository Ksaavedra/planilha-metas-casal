import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { EditarValorDialogComponent } from './editar-valor-dialog.component';
import { EditarValorDialogData } from '@core/interfaces/metas/editar-modal';
import { MetaExtended } from '@core/interfaces/metas/mes-meta';

describe('EditarValorDialogComponent', () => {
  let component: EditarValorDialogComponent;
  let fixture: ComponentFixture<EditarValorDialogComponent>;
  const dialogRefMock = { close: jest.fn() };

  const meta: MetaExtended = {
    id: 1,
    nome: 'Viagem',
    valorMeta: 5000,
    valorPorMes: 500,
    mesesNecessarios: 10,
    valorAtual: 0,
    meses: [{ id: 3, nome: 'Março', valor: 100, status: 'Programado' }],
  } as MetaExtended;

  const data: EditarValorDialogData = {
    meta,
    mesId: 3,
    meses: ['Janeiro', 'Fevereiro', 'Março'],
  };

  async function setupDialog(dialogData: EditarValorDialogData): Promise<void> {
    dialogRefMock.close.mockClear();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      declarations: [EditarValorDialogComponent],
      imports: [CommonModule, FormsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditarValorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await setupDialog(data);
  });

  it('deve criar e inicializar valor do mês', () => {
    expect(component).toBeTruthy();
    expect(component.valor).toBe(100);
    expect(component.mesNome).toBe('Março');
    expect(component.valorFaltanteParaConcluir).toBe(5000);
  });

  it('deve exibir falta para concluir no template', () => {
    const faltaEl = fixture.debugElement.query(By.css('.falta-concluir'));
    expect(faltaEl.nativeElement.textContent).toContain('Falta para concluir');
    expect(faltaEl.nativeElement.textContent).toContain('R$');
    expect(faltaEl.nativeElement.textContent).toContain('5.000,00');
  });

  it('fechar deve fechar o dialog sem resultado', () => {
    component.fechar();
    expect(dialogRefMock.close).toHaveBeenCalledWith();
  });

  it('salvar deve fechar o dialog com payload quando válido', () => {
    component.valor = 250;
    component.salvar();
    expect(dialogRefMock.close).toHaveBeenCalledWith({
      metaId: 1,
      mesId: 3,
      valor: 250,
    });
  });

  it('não deve salvar quando valor ultrapassa o limite', () => {
    component.onValorChange('6000');
    fixture.detectChanges();

    expect(component.podeSalvar).toBe(false);
    component.salvar();
    expect(dialogRefMock.close).not.toHaveBeenCalled();

    const erro = fixture.debugElement.query(By.css('.validacao-erro'));
    expect(erro).toBeTruthy();
    expect(erro.nativeElement.textContent).toContain('valor máximo permitido neste mês');

    const btnSalvar = fixture.debugElement.query(
      By.css('button[color="primary"]'),
    );
    expect(btnSalvar.nativeElement.disabled).toBe(true);
  });

  it('deve parsear números no formato brasileiro', () => {
    component.onValorChange('1.234,56');
    expect(component.valor).toBe(1234.56);

    component.onValorBlur();
    expect(component.valorInput).toBe('1234.56');
  });

  it('onValorBlur deve limpar input quando valor é zero', () => {
    component.onValorChange('0');
    component.onValorBlur();
    expect(component.valorInput).toBe('');
  });

  it('validarApenasNumeros deve bloquear teclas inválidas', () => {
    const event = new KeyboardEvent('keypress', { key: 'a' });
    jest.spyOn(event, 'preventDefault');
    component.validarApenasNumeros(event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('validarApenasNumeros deve permitir teclas do numpad', () => {
    const event = {
      code: 'Numpad1',
      key: '1',
      preventDefault: jest.fn(),
    } as unknown as KeyboardEvent;
    component.validarApenasNumeros(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('mesNome deve usar lista de meses quando mês não tem nome', async () => {
    const metaSemNome = {
      ...meta,
      meses: [{ id: 2, nome: '', valor: 0, status: 'Programado' }],
    } as MetaExtended;
    await setupDialog({ meta: metaSemNome, mesId: 2, meses: data.meses });
    expect(component.mesNome).toBe('Fevereiro');
  });

  it('deve limitar valor ao restante da meta (jan pago 4000, meta 4124)', async () => {
    const metaComJaneiroPago: MetaExtended = {
      id: 2,
      nome: 'teste3',
      valorMeta: 4124,
      valorAtual: 0,
      meses: [
        { id: 1, nome: 'Janeiro', valor: 4000, status: 'Pago' },
        { id: 2, nome: 'Fevereiro', valor: 0, status: 'Programado' },
      ],
    } as MetaExtended;

    await setupDialog({
      meta: metaComJaneiroPago,
      mesId: 2,
      meses: ['Janeiro', 'Fevereiro'],
    });

    expect(component.valorFaltanteParaConcluir).toBe(124);
    expect(component.valorMaximoPermitido).toBe(124);

    component.onValorChange('2000');
    expect(component.valorUltrapassaLimite).toBe(true);
    expect(component.podeSalvar).toBe(false);

    component.salvar();
    expect(dialogRefMock.close).not.toHaveBeenCalled();

    component.onValorChange('124');
    expect(component.podeSalvar).toBe(true);
    component.salvar();
    expect(dialogRefMock.close).toHaveBeenCalledWith({
      metaId: 2,
      mesId: 2,
      valor: 124,
    });
  });

  it('deve exibir falta global e permitir até falta + valor do mês já pago', async () => {
    const metaCarro: MetaExtended = {
      id: 3,
      nome: 'Comprar um carro',
      valorMeta: 80000,
      valorAtual: 22000,
      meses: [{ id: 6, nome: 'Junho', valor: 1000, status: 'Pago' }],
    } as MetaExtended;

    await setupDialog({
      meta: metaCarro,
      mesId: 6,
      meses: ['Junho'],
    });

    expect(component.valorFaltanteParaConcluir).toBe(57000);
    expect(component.valorMaximoPermitido).toBe(58000);

    component.onValorChange('58000');
    expect(component.podeSalvar).toBe(true);

    component.onValorChange('58001');
    expect(component.podeSalvar).toBe(false);
  });
});
