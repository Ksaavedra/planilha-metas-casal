import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { DespesasPageComponent } from './despesas-page.component';
import {
  Despesa,
  DespesasService,
} from 'app/core/services/despesas/despesas.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
describe('DespesasPageComponent', () => {
  let component: DespesasPageComponent;
  let fixture: ComponentFixture<DespesasPageComponent>;
  const mock: Despesa = {
    id: 1,
    natureza: 'fixa',
    categoria: 'Casa',
    descricao: 'Teste',
    valor: 100,
    data: '2025-01-15',
    ano: 2025,
    mes: 1,
  };

  const despesasService = {
    getDespesas: jest.fn().mockReturnValue(of([])),
    deleteDespesa: jest.fn().mockReturnValue(of(void 0)),
    calcularTotalDespesas: jest
      .fn()
      .mockImplementation((d: Despesa[]) =>
        d.reduce((s, x) => s + (Number(x.valor) || 0), 0),
      ),
  };

  const dialog = {
    open: jest.fn().mockReturnValue({ afterClosed: () => of(false) }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    despesasService.getDespesas.mockReturnValue(of([]));
    await TestBed.configureTestingModule({
      declarations: [DespesasPageComponent],
      imports: [MatDialogModule, NoopAnimationsModule],
      providers: [
        { provide: DespesasService, useValue: despesasService },
        { provide: MatDialog, useValue: dialog },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DespesasPageComponent);
    component = fixture.componentInstance;
  });

  it('deve criar', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit carrega despesas do mês', () => {
    fixture.detectChanges();
    expect(despesasService.getDespesas).toHaveBeenCalled();
  });

  it('despesasFixas e despesasVariaveis filtram por natureza', () => {
    component.despesas = [
      mock,
      { ...mock, id: 2, natureza: 'variavel', descricao: 'V' },
    ];
    expect(component.despesasFixas.length).toBe(1);
    expect(component.despesasVariaveis.length).toBe(1);
  });

  it('erro de API exibe mensagem', () => {
    despesasService.getDespesas.mockReturnValue(
      throwError(() => ({ error: { error: 'X' } })),
    );
    component.ngOnInit();
    expect(component.erroCarregar).toBe('X');
  });

  it('labelNatureza', () => {
    expect(component.labelNatureza('fixa')).toBe('Fixa');
    expect(component.labelNatureza('variavel')).toBe('Variável');
  });

  it('abrirModalAdicionarDespesa abre o MatDialog', () => {
    component.abrirModalAdicionarDespesa();
    expect(dialog.open).toHaveBeenCalled();
  });

  it('selecionarVisao alterna entre lista e exemplos', () => {
    expect(component.visaoDespesas).toBe('lista');
    component.selecionarVisao('exemplos');
    expect(component.visaoDespesas).toBe('exemplos');
    expect(component.exemplosCategoriasFixas.length).toBeGreaterThan(0);
    expect(component.exemplosCategoriasVariaveis.length).toBeGreaterThan(0);
    component.selecionarVisao('lista');
    expect(component.visaoDespesas).toBe('lista');
  });
});
