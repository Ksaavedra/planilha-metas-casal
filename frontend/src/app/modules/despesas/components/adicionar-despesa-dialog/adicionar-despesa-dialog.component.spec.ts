import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { of, throwError } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  AdicionarDespesaDialogComponent,
  AdicionarDespesaDialogData,
} from './adicionar-despesa-dialog.component';
import { Despesa, DespesasService } from 'app/core/services/despesas/despesas.service';
import { ReceitasService } from 'app/core/services/receitas/receitas.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

describe('AdicionarDespesaDialogComponent', () => {
  const despesaExemplo: Despesa = {
    id: 42,
    pessoa: 'David',
    natureza: 'variavel',
    categoria: 'Mercado',
    descricao: 'Luz',
    valor: 88.5,
    data: '2026-02-10',
    ano: 2026,
    mes: 2,
  };

  const closeMock = jest.fn();

  function create(
    data: AdicionarDespesaDialogData,
    service: {
      createDespesa: jest.Mock;
      updateDespesa: jest.Mock;
    },
  ) {
    const receitasMock = {
      getPessoasCache: jest.fn().mockReturnValue([]),
      loadPessoasDistintas: jest.fn().mockReturnValue(of<string[]>([])),
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      declarations: [AdicionarDespesaDialogComponent],
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
        { provide: MAT_DIALOG_DATA, useValue: data },
        {
          provide: MatDialogRef,
          useValue: { close: closeMock },
        },
        { provide: DespesasService, useValue: service },
        { provide: ReceitasService, useValue: receitasMock },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
    return TestBed.createComponent(AdicionarDespesaDialogComponent);
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('modo incluir (nova despesa)', () => {
    let fixture: ComponentFixture<AdicionarDespesaDialogComponent>;
    let component: AdicionarDespesaDialogComponent;
    let createDespesa: jest.Mock;
    let updateDespesa: jest.Mock;

    const data: AdicionarDespesaDialogData = {
      despesa: null,
      ano: 2026,
      mes: 4,
    };

    beforeEach(() => {
      createDespesa = jest.fn().mockReturnValue(of(despesaExemplo));
      updateDespesa = jest.fn();
      fixture = create(data, { createDespesa, updateDespesa });
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('deve criar', () => {
      expect(component).toBeTruthy();
    });

    it('isEdicao e tituloDialog indicam inclusão', () => {
      expect(component.isEdicao).toBe(false);
      expect(component.tituloDialog).toBe('Incluir despesa');
    });

    it('ngOnInit define data padrão no formato ISO quando não há despesa', () => {
      const d = component.form.get('data')?.value;
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('categoriasOpcoes reflete sugestões fixa/variável', () => {
      expect(component.categoriasOpcoes.length).toBeGreaterThan(0);
      component.form.patchValue({ natureza: 'variavel' });
      fixture.detectChanges();
      expect(
        component.categoriasOpcoes.includes('Mercado'),
      ).toBe(true);
    });

    it('salvar com formulário inválido não chama a API e marca touched', () => {
      component.form.patchValue({
        categoria: '',
        descricao: 'x',
        valor: 10,
      });
      component.salvar();
      expect(createDespesa).not.toHaveBeenCalled();
      expect(component.form.touched).toBe(true);
    });

    it('salvar com formulário válido chama createDespesa e fecha com true', () => {
      component.form.patchValue({
        pessoa: 'Kelly',
        natureza: 'fixa',
        categoria: 'Aluguel',
        descricao: '  Aluguel  ',
        valor: 1500,
        data: '2026-04-12',
      });
      component.salvar();
      expect(createDespesa).toHaveBeenCalledWith({
        pessoa: 'Kelly',
        natureza: 'fixa',
        categoria: 'Aluguel',
        descricao: 'Aluguel',
        valor: 1500,
        data: '2026-04-12',
        ano: 2026,
        mes: 4,
      });
      expect(closeMock).toHaveBeenCalledWith(true);
    });

    it('data vazia vira null no payload', () => {
      component.form.patchValue({
        pessoa: 'Casal',
        natureza: 'fixa',
        categoria: 'Condomínio e IPTU',
        descricao: 'X',
        valor: 1,
        data: '   ',
      });
      component.salvar();
      expect(createDespesa).toHaveBeenCalledWith(
        expect.objectContaining({ data: null }),
      );
    });

    it('erro da API exibe mensagem e não fecha', () => {
      createDespesa.mockReturnValue(throwError(() => ({ error: { error: 'Falha X' } })));
      component.form.patchValue({
        pessoa: 'Casal',
        natureza: 'fixa',
        categoria: 'Internet / celular',
        descricao: 'A',
        valor: 5,
        data: '',
      });
      component.salvar();
      expect(component.erro).toBe('Falha X');
      expect(closeMock).not.toHaveBeenCalled();
    });
  });

  describe('modo editar', () => {
    let fixture: ComponentFixture<AdicionarDespesaDialogComponent>;
    let component: AdicionarDespesaDialogComponent;
    let createDespesa: jest.Mock;
    let updateDespesa: jest.Mock;

    const data: AdicionarDespesaDialogData = {
      despesa: { ...despesaExemplo },
      ano: 2026,
      mes: 2,
    };

    beforeEach(() => {
      createDespesa = jest.fn();
      updateDespesa = jest.fn().mockReturnValue(of(despesaExemplo));
      fixture = create(data, { createDespesa, updateDespesa });
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('isEdicao e tituloDialog indicam edição', () => {
      expect(component.isEdicao).toBe(true);
      expect(component.tituloDialog).toBe('Editar despesa');
    });

    it('ngOnInit preenche o formulário com a despesa', () => {
      expect(component.form.get('pessoa')?.value).toBe('David');
      expect(component.form.get('descricao')?.value).toBe('Luz');
      expect(component.form.get('natureza')?.value).toBe('variavel');
      expect(component.form.get('valor')?.value).toBe(88.5);
    });

    it('salvar chama updateDespesa e fecha com true', () => {
      component.form.patchValue({ valor: 90 });
      component.salvar();
      expect(createDespesa).not.toHaveBeenCalled();
      expect(updateDespesa).toHaveBeenCalledWith(
        42,
        expect.objectContaining({
          descricao: 'Luz',
          valor: 90,
          ano: 2026,
          mes: 2,
        }),
      );
      expect(closeMock).toHaveBeenCalledWith(true);
    });
  });

  it('fechar() chama MatDialogRef.close sem argumento', () => {
    const createDespesa = jest.fn();
    const updateDespesa = jest.fn();
    const fixture = create(
      { despesa: null, ano: 2025, mes: 1 },
      { createDespesa, updateDespesa },
    );
    const component = fixture.componentInstance;
    fixture.detectChanges();
    closeMock.mockClear();
    component.fechar();
    expect(closeMock).toHaveBeenCalledWith();
  });
});
