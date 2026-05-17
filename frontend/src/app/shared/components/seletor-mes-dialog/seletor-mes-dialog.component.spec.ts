import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  SeletorMesDialogComponent,
  SeletorMesDialogData,
} from './seletor-mes-dialog.component';

describe('SeletorMesDialogComponent', () => {
  let fixture: ComponentFixture<SeletorMesDialogComponent>;
  let component: SeletorMesDialogComponent;
  const selectedDate = new Date(2026, 2, 15);
  const data: SeletorMesDialogData = { selectedDate };

  const dialogRefMock = {
    close: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SeletorMesDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    })
      .overrideComponent(SeletorMesDialogComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(SeletorMesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('injeta MAT_DIALOG_DATA com selectedDate', () => {
    expect(component.data.selectedDate).toEqual(selectedDate);
  });

  it('expor dialogRef do MatDialog', () => {
    expect(component.dialogRef).toBe(dialogRefMock);
  });

  it('dateClass: vista month — par/ímpar; outras vistas devolvem string vazia', () => {
    const par = new Date(2026, 0, 2);
    const impar = new Date(2026, 0, 1);
    expect(component.dateClass(par, 'month')).toBe('even-date');
    expect(component.dateClass(impar, 'month')).toBe('odd-date');
    expect(component.dateClass(par, 'year')).toBe('');
    expect(component.dateClass(par, 'multi-year')).toBe('');
  });
});
