import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { of, throwError } from 'rxjs';
import {
  ChangeDetectorRef,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
} from '@angular/core';
import {
  AdicionarDespesaDialogComponent,
  AdicionarDespesaDialogData,
} from './adicionar-despesa-dialog.component';
import {
  Despesa,
  DespesasService,
} from 'app/core/services/despesas/despesas.service';
import { ReceitasService } from 'app/core/services/receitas/receitas.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

describe('AdicionarDespesaDialogComponent', () => {
  let component: AdicionarDespesaDialogComponent;
  let fixture: ComponentFixture<AdicionarDespesaDialogComponent>;

  const mockDespesa: Despesa = {
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

  const dataMock: AdicionarDespesaDialogData = {
    despesa: null,
    ano: 2026,
    mes: 4,
  };

  const dialogRefMock = {
    close: jest.fn(),
  };

  const despesasServiceMock = {
    createDespesa: jest.fn(),
    updateDespesa: jest.fn(),
  };

  const receitasServiceMock = {
    getPessoasCache: jest.fn(),
    loadPessoasDistintas: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    despesasServiceMock.createDespesa.mockReturnValue(of({}));
    despesasServiceMock.updateDespesa.mockReturnValue(of({}));

    receitasServiceMock.getPessoasCache.mockReturnValue(['Kelly', 'David']);
    receitasServiceMock.loadPessoasDistintas.mockReturnValue(
      of(['Kelly', 'David', 'Kelly']),
    );

    await TestBed.configureTestingModule({
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
        FormBuilder,
        ChangeDetectorRef,
        { provide: MAT_DIALOG_DATA, useValue: dataMock },
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: DespesasService, useValue: despesasServiceMock },
        { provide: ReceitasService, useValue: receitasServiceMock },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    fixture = TestBed.createComponent(AdicionarDespesaDialogComponent);
    component = fixture.componentInstance;
  });

  describe('Inicialização', () => {
    it('deve criar', () => {
      expect(component).toBeTruthy();
    });

    it('deve iniciar como inclusão', () => {
      component.ngOnInit();

      expect(component.isEdicao).toBe(false);
      expect(component.tituloDialog).toBe('Incluir despesa');
    });

    it('deve preencher form vazio quando não for edição', () => {
      component.ngOnInit();

      expect(component.form.get('pessoa')?.value).toBe('');
      expect(component.form.get('natureza')?.value).toBe('');
      expect(component.form.get('categoria')?.value).toBe('');
      expect(component.form.get('descricao')?.value).toBe('');
      expect(component.form.get('valor')?.value).toBeNull();
      expect(component.form.get('data')?.value).toBeTruthy();
    });

    it('deve carregar pessoas do cache e da API', () => {
      component.ngOnInit();

      expect(receitasServiceMock.getPessoasCache).toHaveBeenCalled();
      expect(receitasServiceMock.loadPessoasDistintas).toHaveBeenCalled();
      expect(component.pessoasAutocompleteOptions).toEqual(['David', 'Kelly']);
    });
  });

  describe('ngOnInit', () => {
    it('ngOnInit define data padrão no formato ISO quando não há despesa', () => {
      component.ngOnInit();
      const d = component.form.get('data')?.value;
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('Inicialização em edição', () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();

      await TestBed.configureTestingModule({
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
          FormBuilder,
          ChangeDetectorRef,
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              despesa: mockDespesa,
              ano: 2025,
              mes: 1,
            },
          },
          { provide: MatDialogRef, useValue: dialogRefMock },
          { provide: DespesasService, useValue: despesasServiceMock },
          { provide: ReceitasService, useValue: receitasServiceMock },
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      }).compileComponents();

      fixture = TestBed.createComponent(AdicionarDespesaDialogComponent);
      component = fixture.componentInstance;

      receitasServiceMock.getPessoasCache.mockReturnValue([]);
      receitasServiceMock.loadPessoasDistintas.mockReturnValue(of([]));
    });

    it('deve iniciar como edição', () => {
      component.ngOnInit();

      expect(component.isEdicao).toBe(true);
      expect(component.tituloDialog).toBe('Editar despesa');
    });

    it('deve preencher form com despesa existente', () => {
      component.ngOnInit();

      expect(component.form.get('pessoa')?.value).toBe('David');
      expect(component.form.get('natureza')?.value).toBe('variavel');
      expect(component.form.get('categoria')?.value).toBe('Mercado');
      expect(component.form.get('descricao')?.value).toBe('Luz');
      expect(component.form.get('valor')?.value).toBe(88.5);
      expect(component.form.get('data')?.value).toBe('2026-02-10');
    });

    it('deve usar fallback quando pessoa e data forem null', () => {
      const despesa = {
        ...mockDespesa,
        pessoa: undefined,
        data: null,
      };

      component.data = {
        despesa,
        ano: 2025,
        mes: 1,
      };

      component.ngOnInit();

      expect(component.form.get('pessoa')?.value).toBe('');
      expect(component.form.get('data')?.value).toBe('');
    });
  });

  describe('configurarFiltroPessoas', () => {
    it('deve iniciar filteredPessoas$ com valor inicial usando startWith', () => {
      component.pessoasAutocompleteOptions = ['Kelly', 'David'];
      component.listaAutocompletePessoaAtiva = true;
      component.form.get('pessoa')?.setValue('ke', { emitEvent: false });

      component['configurarFiltroPessoas']();

      component.filteredPessoas$.subscribe((result) => {
        expect(result).toEqual(['Kelly']);
      });
    });

    it('deve reagir a mudanças no valueChanges', () => {
      component.pessoasAutocompleteOptions = ['Kelly', 'David'];
      component.listaAutocompletePessoaAtiva = true;

      component['configurarFiltroPessoas']();

      const resultados: string[][] = [];

      component.filteredPessoas$.subscribe((result) => {
        resultados.push(result);
      });

      component.form.get('pessoa')?.setValue('da');

      expect(resultados[resultados.length - 1]).toEqual(['David']);
    });

    it('deve emitir quando pessoasOpcoesAtualizadas$ for chamado', () => {
      component.pessoasAutocompleteOptions = ['Kelly', 'David'];
      component.listaAutocompletePessoaAtiva = true;
      component.form.get('pessoa')?.setValue('ke', { emitEvent: false });

      component['configurarFiltroPessoas']();

      const resultados: string[][] = [];

      component.filteredPessoas$.subscribe((result) => {
        resultados.push(result);
      });

      component['pessoasOpcoesAtualizadas$'].next();

      expect(resultados[resultados.length - 1]).toEqual(['Kelly']);
    });

    it('deve retornar vazio quando lista não estiver ativa', () => {
      component.pessoasAutocompleteOptions = ['Kelly', 'David'];
      component.listaAutocompletePessoaAtiva = false;
      component.form.get('pessoa')?.setValue('ke', { emitEvent: false });

      component['configurarFiltroPessoas']();

      component.filteredPessoas$.subscribe((result) => {
        expect(result).toEqual([]);
      });
    });

    it('deve usar string vazia quando pessoa for null', () => {
      component.pessoasAutocompleteOptions = ['Kelly', 'David'];
      component.listaAutocompletePessoaAtiva = true;
      component.form.get('pessoa')?.setValue(null, { emitEvent: false });

      component['configurarFiltroPessoas']();

      const resultados: string[][] = [];

      component.filteredPessoas$.subscribe((result) => {
        resultados.push(result);
      });

      expect(resultados[0]).toEqual(['Kelly', 'David']);
    });

    it('deve usar string vazia quando pessoa for undefined', () => {
      component.pessoasAutocompleteOptions = ['Kelly', 'David'];
      component.listaAutocompletePessoaAtiva = true;
      component.form.get('pessoa')?.setValue(undefined, { emitEvent: false });

      component['configurarFiltroPessoas']();

      const resultados: string[][] = [];

      component.filteredPessoas$.subscribe((result) => {
        resultados.push(result);
      });

      expect(resultados[0]).toEqual(['Kelly', 'David']);
    });

    it('deve retornar todas as opções quando pessoa for string vazia', () => {
      component.pessoasAutocompleteOptions = ['Kelly', 'David'];
      component.listaAutocompletePessoaAtiva = true;

      component.form.get('pessoa')?.setValue('', { emitEvent: false });

      component['configurarFiltroPessoas']();

      const resultados: string[][] = [];

      component.filteredPessoas$.subscribe((result) => {
        resultados.push(result);
      });

      expect(resultados[0]).toEqual(['Kelly', 'David']);
    });

    it('deve aplicar filtro vazio via valueChanges quando pessoa vira string vazia', () => {
      component.pessoasAutocompleteOptions = ['Kelly', 'David'];
      component.listaAutocompletePessoaAtiva = true;
      component.form.get('pessoa')?.setValue('ke', { emitEvent: false });

      component['configurarFiltroPessoas']();

      const resultados: string[][] = [];

      component.filteredPessoas$.subscribe((result) => {
        resultados.push(result);
      });

      component.form.get('pessoa')?.setValue('');

      expect(resultados[resultados.length - 1]).toEqual(['Kelly', 'David']);
    });

    it('deve tratar espaços como vazio (trim)', () => {
      component.pessoasAutocompleteOptions = ['Kelly', 'David'];
      component.listaAutocompletePessoaAtiva = true;

      component.form.get('pessoa')?.setValue('   ', { emitEvent: false });

      component['configurarFiltroPessoas']();

      const resultados: string[][] = [];

      component.filteredPessoas$.subscribe((result) => {
        resultados.push(result);
      });
      expect(resultados[0]).toEqual(['Kelly', 'David']);
    });
  });

  describe('tratarMudancaNatureza', () => {
    it('deve tratar natureza como string vazia', () => {
      component.form.get('natureza')?.setValue('');
      component.form.get('categoria')?.setValue('');

      component['tratarMudancaNatureza']();

      expect(component.form.get('categoria')?.value).toBe('');
    });

    it('deve tratar natureza null como vazia', () => {
      component.form.get('natureza')?.setValue(null);
      component.form.get('categoria')?.setValue('Teste');

      component['tratarMudancaNatureza']();

      expect(component.form.get('categoria')?.value).toBe('');
    });

    it('deve tratar natureza undefined como vazia', () => {
      component.form.get('natureza')?.setValue(undefined);
      component.form.get('categoria')?.setValue('Teste');

      component['tratarMudancaNatureza']();

      expect(component.form.get('categoria')?.value).toBe('');
    });

    it('deve tratar natureza com espaços como vazia (trim)', () => {
      component.form.get('natureza')?.setValue('   ');
      component.form.get('categoria')?.setValue('Teste');

      component['tratarMudancaNatureza']();

      expect(component.form.get('categoria')?.value).toBe('');
    });
  });

  describe('toTitleCase', () => {
    it('deve formatar texto para title case', () => {
      const result = component['toTitleCase']('  kelly saavedra  ');

      expect(result).toBe('Kelly Saavedra');
    });

    it('deve retornar valor original quando vazio', () => {
      expect(component['toTitleCase']('')).toBe('');
      expect(component['toTitleCase']('   ')).toBe('   ');
    });
  });

  describe('Autocomplete pessoa', () => {
    it('deve retornar vazio quando lista não estiver ativa', () => {
      component.pessoasAutocompleteOptions = ['Kelly', 'David'];
      component.listaAutocompletePessoaAtiva = false;

      const result = component['_filterPessoa']('ke');

      expect(result).toEqual([]);
    });

    it('deve filtrar pessoas quando lista estiver ativa', () => {
      component.pessoasAutocompleteOptions = ['Kelly', 'David'];
      component.listaAutocompletePessoaAtiva = true;

      const result = component['_filterPessoa']('ke');

      expect(result).toEqual(['Kelly']);
    });

    it('onPessoaFieldFocus deve ativar autocomplete', () => {
      component.listaAutocompletePessoaAtiva = false;

      component.onPessoaFieldFocus();

      expect(component.listaAutocompletePessoaAtiva).toBe(true);
    });

    it('onPessoaFieldFocus deve retornar se já estiver ativo', () => {
      component.listaAutocompletePessoaAtiva = true;

      component.onPessoaFieldFocus();

      expect(component.listaAutocompletePessoaAtiva).toBe(true);
    });
  });

  describe('normalizarListaNomes', () => {
    it('deve normalizar, remover duplicados e ordenar nomes', () => {
      const result = component['normalizarListaNomes']([
        'kelly',
        'DAVID',
        'kelly',
        null,
        undefined,
        '',
      ]);

      expect(result).toEqual(['David', 'Kelly']);
    });
  });

  describe('carregarPessoasOpcoes', () => {
    it('deve usar array vazio quando API retornar null', () => {
      receitasServiceMock.getPessoasCache.mockReturnValue([]);
      receitasServiceMock.loadPessoasDistintas.mockReturnValue(of(null));

      component['carregarPessoasOpcoes']();

      expect(component.pessoasAutocompleteOptions).toEqual([]);
    });

    it('deve usar array vazio quando API retornar undefined', () => {
      receitasServiceMock.getPessoasCache.mockReturnValue([]);
      receitasServiceMock.loadPessoasDistintas.mockReturnValue(of(undefined));

      component['carregarPessoasOpcoes']();

      expect(component.pessoasAutocompleteOptions).toEqual([]);
    });
  });

  describe('Pessoa blur e texto para salvar', () => {
    it('onPessoaBlur deve formatar pessoa', () => {
      component.form.get('pessoa')?.setValue('kelly saavedra');

      component.onPessoaBlur();

      expect(component.form.get('pessoa')?.value).toBe('Kelly Saavedra');
    });

    it('onPessoaBlur deve tratar null como string vazia', () => {
      component.form.get('pessoa')?.setValue(null);

      component.onPessoaBlur();

      expect(component.form.get('pessoa')?.value).toBe(null);
    });

    it('onPessoaBlur não deve alterar quando valor já estiver formatado', () => {
      component.form.get('pessoa')?.setValue('Kelly');

      component.onPessoaBlur();

      expect(component.form.get('pessoa')?.value).toBe('Kelly');
    });

    it('onPessoaBlur não deve alterar quando valor for vazio', () => {
      component.form.get('pessoa')?.setValue('');

      component.onPessoaBlur();

      expect(component.form.get('pessoa')?.value).toBe('');
    });

    it('pessoaTextoParaSalvar deve pegar valor do form', () => {
      component.form.get('pessoa')?.setValue(' Kelly ');

      const result = component['pessoaTextoParaSalvar']();

      expect(result).toBe('Kelly');
    });

    it('pessoaTextoParaSalvar deve pegar valor do input quando form estiver vazio', () => {
      component.form.get('pessoa')?.setValue('');

      component['pessoaInputRef'] = {
        nativeElement: {
          value: ' David ',
        },
      } as ElementRef<HTMLInputElement>;

      const result = component['pessoaTextoParaSalvar']();

      expect(result).toBe('David');
    });

    it('pessoaTextoParaSalvar deve tratar null como vazio', () => {
      component.form.get('pessoa')?.setValue(null);

      const result = component['pessoaTextoParaSalvar']();

      expect(result).toBe('');
    });

    it('deve retornar array vazio quando bruto for null', () => {
      const result = component['normalizarListaNomes'](null as any);

      expect(result).toEqual([]);
    });

    it('deve retornar array vazio quando bruto for undefined', () => {
      const result = component['normalizarListaNomes'](undefined as any);

      expect(result).toEqual([]);
    });
  });

  describe('Categorias', () => {
    it('deve manter categoria atual quando natureza inválida e categoria preenchida', () => {
      component.form.patchValue({
        natureza: '',
        categoria: 'Outra',
      });

      component['atualizarCategoriasOpcoes']();

      expect(component.categoriasOpcoes).toEqual(['Outra']);
    });

    it('deve deixar categorias vazias quando natureza inválida e categoria vazia', () => {
      component.form.patchValue({
        natureza: '',
        categoria: '',
      });

      component['atualizarCategoriasOpcoes']();

      expect(component.categoriasOpcoes).toEqual([]);
    });

    it('deve carregar categorias de natureza fixa', () => {
      component.form.patchValue({
        natureza: 'fixa',
        categoria: '',
      });

      component['atualizarCategoriasOpcoes']();

      expect(component.categoriasOpcoes.length).toBeGreaterThan(0);
    });

    it('deve incluir categoria atual quando ela não existir na lista', () => {
      component.form.patchValue({
        natureza: 'fixa',
        categoria: 'Categoria Customizada',
      });

      component['atualizarCategoriasOpcoes']();

      expect(component.categoriasOpcoes[0]).toBe('Categoria Customizada');
    });

    it('valueChanges de natureza inválida deve limpar categoria', () => {
      component.ngOnInit();

      component.form.patchValue({
        categoria: 'Casa',
      });

      component.form.get('natureza')?.setValue('abc');

      expect(component.form.get('categoria')?.value).toBe('');
    });
  });

  describe('Fechar', () => {
    it('fechar deve fechar dialog', () => {
      component.fechar();

      expect(dialogRefMock.close).toHaveBeenCalled();
    });
  });

  describe('Salvar inclusão', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('deve marcar form como touched quando inválido', () => {
      const markSpy = jest.spyOn(component.form, 'markAllAsTouched');

      component.salvar();

      expect(markSpy).toHaveBeenCalled();
      expect(despesasServiceMock.createDespesa).not.toHaveBeenCalled();
    });

    it('deve criar despesa com sucesso', () => {
      component.form.patchValue({
        pessoa: 'kelly',
        natureza: 'fixa',
        categoria: 'Casa',
        descricao: ' Aluguel ',
        valor: 100,
        data: '2025-01-10',
      });

      component.salvar();

      expect(despesasServiceMock.createDespesa).toHaveBeenCalledWith({
        pessoa: 'Kelly',
        natureza: 'fixa',
        categoria: 'Casa',
        descricao: 'Aluguel',
        valor: 100,
        data: '2025-01-10',
        ano: 2026,
        mes: 4,
      });

      expect(dialogRefMock.close).toHaveBeenCalledWith(true);
      expect(component.saving).toBe(false);
    });

    it('deve enviar data null quando data estiver vazia', () => {
      component.form.patchValue({
        pessoa: 'Kelly',
        natureza: 'fixa',
        categoria: 'Casa',
        descricao: 'Aluguel',
        valor: 100,
        data: '',
      });

      component.salvar();

      const payload = despesasServiceMock.createDespesa.mock.calls[0][0];
      expect(payload.data).toBeNull();
    });

    it('deve tratar erro ao criar com error.error', () => {
      despesasServiceMock.createDespesa.mockReturnValue(
        throwError(() => ({ error: { error: 'Erro API' } })),
      );

      component.form.patchValue({
        pessoa: 'Kelly',
        natureza: 'fixa',
        categoria: 'Casa',
        descricao: 'Aluguel',
        valor: 100,
        data: '',
      });

      component.salvar();

      expect(component.saving).toBe(false);
      expect(component.erro).toBe('Erro API');
    });

    it('deve tratar erro ao criar com message', () => {
      despesasServiceMock.createDespesa.mockReturnValue(
        throwError(() => ({ message: 'Erro message' })),
      );

      component.form.patchValue({
        pessoa: 'Kelly',
        natureza: 'fixa',
        categoria: 'Casa',
        descricao: 'Aluguel',
        valor: 100,
        data: '',
      });

      component.salvar();

      expect(component.erro).toBe('Erro message');
    });

    it('deve usar mensagem padrão quando erro não tiver mensagem', () => {
      despesasServiceMock.createDespesa.mockReturnValue(throwError(() => ({})));

      component.form.patchValue({
        pessoa: 'Kelly',
        natureza: 'fixa',
        categoria: 'Casa',
        descricao: 'Aluguel',
        valor: 100,
        data: '',
      });

      component.salvar();

      expect(component.erro).toBe('Não foi possível salvar.');
    });
  });

  describe('Salvar edição', () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();

      await TestBed.configureTestingModule({
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
          FormBuilder,
          ChangeDetectorRef,
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              despesa: mockDespesa,
              ano: 2025,
              mes: 1,
            },
          },
          { provide: MatDialogRef, useValue: dialogRefMock },
          { provide: DespesasService, useValue: despesasServiceMock },
          { provide: ReceitasService, useValue: receitasServiceMock },
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      }).compileComponents();

      fixture = TestBed.createComponent(AdicionarDespesaDialogComponent);
      component = fixture.componentInstance;

      despesasServiceMock.updateDespesa.mockReturnValue(of({}));
      receitasServiceMock.getPessoasCache.mockReturnValue([]);
      receitasServiceMock.loadPessoasDistintas.mockReturnValue(of([]));

      component.ngOnInit();
    });

    it('deve atualizar despesa com sucesso', () => {
      component.form.patchValue({
        pessoa: 'Kelly',
        natureza: 'fixa',
        categoria: 'Casa',
        descricao: 'Aluguel editado',
        valor: 200,
        data: '2025-01-20',
      });

      component.salvar();

      const [id, payload] = despesasServiceMock.updateDespesa.mock.calls[0];

      expect(id).toBe(mockDespesa.id);
      expect(payload.pessoa).toBe('Kelly');
      expect(payload.descricao).toBe('Aluguel editado');
      expect(payload.valor).toBe(200);

      expect(dialogRefMock.close).toHaveBeenCalledWith(true);
    });

    it('deve tratar erro ao atualizar', () => {
      despesasServiceMock.updateDespesa.mockReturnValue(
        throwError(() => ({ message: 'Erro update' })),
      );

      component.form.patchValue({
        pessoa: 'Kelly',
        natureza: 'fixa',
        categoria: 'Casa',
        descricao: 'Aluguel editado',
        valor: 200,
        data: '2025-01-20',
      });

      component.salvar();

      expect(component.erro).toBe('Erro update');
    });
  });

  describe('Destroy', () => {
    it('ngOnDestroy deve cancelar subscriptions', () => {
      component.ngOnInit();

      const naturezaSpy = jest.spyOn(component['naturezaSub']!, 'unsubscribe');
      const pessoasSpy = jest.spyOn(component['pessoasApiSub']!, 'unsubscribe');
      const completeSpy = jest.spyOn(
        component['pessoasOpcoesAtualizadas$'],
        'complete',
      );

      component.ngOnDestroy();

      expect(naturezaSpy).toHaveBeenCalled();
      expect(pessoasSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
