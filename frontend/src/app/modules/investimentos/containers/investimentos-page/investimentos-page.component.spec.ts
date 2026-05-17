import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { InvestimentosPageComponent } from './investimentos-page.component';
import { InvestimentosService } from '@core/services/investimentos/investimentos.service';
import { Investimento } from '@core/interfaces/investimentos/investimentos';
import { MatDialog } from '@angular/material/dialog';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('InvestimentosPageComponent', () => {
  let component: InvestimentosPageComponent;
  let fixture: ComponentFixture<InvestimentosPageComponent>;
  let service: InvestimentosService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InvestimentosPageComponent],
      imports: [HttpClientTestingModule, FormsModule],
      providers: [
        InvestimentosService,
        {
          provide: MatDialog,
          useValue: { open: jest.fn().mockReturnValue({ afterClosed: () => of(undefined) }) },
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(InvestimentosPageComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(InvestimentosService);
    jest.spyOn(service, 'getInvestimentos').mockReturnValue(of([]));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load investimentos on init', () => {
    expect(service.getInvestimentos).toHaveBeenCalled();
  });

  const criarInvestimento = (id: number): Investimento => ({
    id,
    descricao: `Inv ${id}`,
    tipoInvestimento: 'cdb',
    valorInvestido: 1000,
    valorAtual: 1100,
    aporteMensal: 100,
    rentabilidade: 100,
    rentabilidadePercentual: 10,
    statusInvestimento: 'crescendo',
    ano: 2026,
  });

  it('não exibe paginação com até 5 investimentos', () => {
    component.investimentos = Array.from({ length: 5 }, (_, i) =>
      criarInvestimento(i + 1),
    );
    component.paginaTabela = 1;

    expect(component.exibirPaginacaoTabela).toBe(false);
    expect(component.investimentosPaginados.length).toBe(5);
  });

  it('exibe paginação com 6 ou mais investimentos', () => {
    component.investimentos = Array.from({ length: 6 }, (_, i) =>
      criarInvestimento(i + 1),
    );
    component.paginaTabela = 1;

    expect(component.exibirPaginacaoTabela).toBe(true);
    expect(component.investimentosPaginados.length).toBe(5);
    expect(component.totalPaginasTabela).toBe(2);
  });

  it('paginaProximaTabela avança e paginaAnteriorTabela volta', () => {
    component.investimentos = Array.from({ length: 7 }, (_, i) =>
      criarInvestimento(i + 1),
    );
    component.paginaTabela = 1;

    component.paginaProximaTabela();
    expect(component.paginaTabela).toBe(2);
    expect(component.investimentosPaginados.length).toBe(2);

    component.paginaAnteriorTabela();
    expect(component.paginaTabela).toBe(1);
  });

  it('progressoPatrimonio calcula percentual', () => {
    expect(
      component.progressoPatrimonio({
        id: 1,
        descricao: 'Teste',
        tipoInvestimento: 'cdb',
        valorInvestido: 1000,
        valorAtual: 500,
        aporteMensal: 0,
        rentabilidade: -500,
        rentabilidadePercentual: -50,
        statusInvestimento: 'estavel',
        ano: 2026,
      }),
    ).toBe(50);
  });
});
