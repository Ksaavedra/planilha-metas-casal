import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  AdicionarReceitaDialogComponent,
  AdicionarReceitaDialogData,
} from './adicionar-receita-dialog.component';
import { ReceitasService } from '../../../../core/services/receitas/receitas.service';
import { UsuariosService } from '@app/core/services/usuarios/usuarios.service';

describe('AdicionarReceitaDialogComponent', () => {
  let component: AdicionarReceitaDialogComponent;
  let fixture: ComponentFixture<AdicionarReceitaDialogComponent>;

  const dataMock: AdicionarReceitaDialogData = {
    receita: null,
    ano: 2026,
    mes: 4,
  };

  const dialogRefMock = { close: jest.fn() };

  const receitasServiceMock = {
    createReceita: jest.fn(),
    updateReceita: jest.fn(),
  };

  const usuariosServiceMock = {
    getUsuarios: jest.fn(),
    createUsuario: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    receitasServiceMock.createReceita.mockReturnValue(of({}));
    receitasServiceMock.updateReceita.mockReturnValue(of({}));
    usuariosServiceMock.getUsuarios.mockReturnValue(of([]));
    usuariosServiceMock.createUsuario.mockReturnValue(
      of({ id: 1, nome: 'Teste' }),
    );

    await TestBed.configureTestingModule({
      declarations: [AdicionarReceitaDialogComponent],
      imports: [
        CommonModule,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
      ],
      providers: [
        FormBuilder,
        { provide: MAT_DIALOG_DATA, useValue: dataMock },
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: ReceitasService, useValue: receitasServiceMock },
        { provide: UsuariosService, useValue: usuariosServiceMock },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AdicionarReceitaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
