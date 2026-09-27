import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { ParabensDialogComponent } from './parabens-dialog.component';
import { ParabensDialogData } from '@core/interfaces/metas/metas-parabens';

describe('ParabensDialogComponent', () => {
  let component: ParabensDialogComponent;
  let fixture: ComponentFixture<ParabensDialogComponent>;
  const dialogRefMock = { close: jest.fn() };

  const data: ParabensDialogData = {
    metaNome: 'Comprar um carro',
    valorMeta: 80000,
    valorRealizado: 80000,
  };

  beforeEach(async () => {
    dialogRefMock.close.mockClear();

    await TestBed.configureTestingModule({
      declarations: [ParabensDialogComponent],
      imports: [CommonModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ParabensDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
    expect(component.data).toEqual(data);
  });

  it('deve exibir nome da meta e valores no template', () => {
    const el: HTMLElement = fixture.nativeElement;

    expect(el.textContent).toContain('PARABÉNS');
    expect(el.textContent).toContain('Meta Concluída com Sucesso');
    expect(el.textContent).toContain(data.metaNome);
    expect(el.textContent).toContain('Valor da meta');
    expect(el.textContent).toContain('Atual');
    expect(el.textContent).toMatch(/80[.,]000/);
  });

  it('deve exibir mensagem de conquista', () => {
    const mensagem = fixture.debugElement.query(By.css('.achievement-message'));
    expect(mensagem.nativeElement.textContent).toContain('100% realizada');
    expect(mensagem.nativeElement.textContent).toContain('sonhos');
  });

  it('fechar deve fechar o dialog', () => {
    component.fechar();
    expect(dialogRefMock.close).toHaveBeenCalledWith();
  });

  it('botão Fechar deve chamar fechar()', () => {
    const btn = fixture.debugElement.query(By.css('.btn-close'));
    btn.triggerEventHandler('click', null);
    expect(dialogRefMock.close).toHaveBeenCalledWith();
  });
});
