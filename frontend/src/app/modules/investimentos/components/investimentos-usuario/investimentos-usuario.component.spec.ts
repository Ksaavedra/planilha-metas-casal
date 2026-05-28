import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { InvestimentosUsuarioComponent } from './investimentos-usuario.component';
import { Investimento } from '@core/interfaces/investimentos/investimentos';

describe('InvestimentosUsuarioComponent', () => {
  let component: InvestimentosUsuarioComponent;
  let fixture: ComponentFixture<InvestimentosUsuarioComponent>;

  const inv = (
    pessoa: string,
    status: Investimento['statusInvestimento'],
    partial: Partial<Investimento> = {},
  ): Investimento => ({
    id: partial.id ?? 1,
    descricao: partial.descricao ?? 'Reserva',
    tipoInvestimento: partial.tipoInvestimento ?? 'cdb',
    valorInvestido: partial.valorInvestido ?? 1000,
    valorAtual: partial.valorAtual ?? 1100,
    aporteMensal: partial.aporteMensal ?? 100,
    rentabilidade: partial.rentabilidade ?? 100,
    rentabilidadePercentual: partial.rentabilidadePercentual ?? 10,
    statusInvestimento: status,
    ano: partial.ano ?? 2026,
    pessoa,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule],
      declarations: [InvestimentosUsuarioComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InvestimentosUsuarioComponent);
    component = fixture.componentInstance;
    component.investimentos = [
      inv('Kelly', 'crescendo'),
      inv('David', 'finalizado'),
    ];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve agrupar por pessoa', () => {
    expect(component.linhasPorUsuario.length).toBe(2);
    expect(component.linhasPorUsuario.map((l) => l.usuario)).toContain('Kelly');
  });

  it('deve reconciliar seleção quando investimentos mudarem', () => {
    const spy = jest.spyOn(component as any, 'reconciliarSelecaoAposMudancaLista');

    component.ngOnChanges({
      investimentos: {
        currentValue: [],
        previousValue: [],
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(spy).toHaveBeenCalled();
  });

  it('não deve reconciliar quando investimentos não mudarem', () => {
    const spy = jest.spyOn(component as any, 'reconciliarSelecaoAposMudancaLista');

    component.ngOnChanges({});

    expect(spy).not.toHaveBeenCalled();
  });

  it('deve limpar filtro quando não houver linhas ou usuário não existir', () => {
    component.usuarioFiltro = 'Kelly';
    component.investimentos = [];
    component['reconciliarSelecaoAposMudancaLista']();
    expect(component.usuarioFiltro).toBe('');

    component.investimentos = [inv('David', 'crescendo')];
    component.usuarioFiltro = 'Kelly';
    component['reconciliarSelecaoAposMudancaLista']();
    expect(component.usuarioFiltro).toBe('');
  });

  it('deve manter filtro vazio ou válido', () => {
    component.investimentos = [inv('Kelly', 'crescendo')];

    component.usuarioFiltro = '';
    component['reconciliarSelecaoAposMudancaLista']();
    expect(component.usuarioFiltro).toBe('');

    component.usuarioFiltro = 'Kelly';
    component['reconciliarSelecaoAposMudancaLista']();
    expect(component.usuarioFiltro).toBe('Kelly');
  });

  it('deve somar em andamento, finalizados e patrimônio', () => {
    component.investimentos = [
      inv('Kelly', 'crescendo', { valorInvestido: 1000, valorAtual: 1200, descricao: 'B' }),
      inv('Kelly', 'finalizado', { valorInvestido: 500, valorAtual: 550, descricao: 'A' }),
      inv('', 'crescendo', { valorInvestido: undefined as any, valorAtual: 'abc' as any }),
    ];

    const kelly = component.linhasPorUsuario.find((l) => l.usuario === 'Kelly');
    const sem = component.linhasPorUsuario.find((l) => l.usuario === '(Sem responsável)');

    expect(kelly?.emAndamento).toBe(1000);
    expect(kelly?.finalizado).toBe(500);
    expect(kelly?.patrimonio).toBe(1750);
    expect(sem?.patrimonio).toBe(0);
  });

  it('deve filtrar investimentos por usuário e calcular subtotais', () => {
    component.investimentos = [
      inv('Kelly', 'crescendo', { descricao: 'Tesouro' }),
      inv('Kelly', 'finalizado', { descricao: 'CDB' }),
      inv('David', 'crescendo', { descricao: 'Fundo' }),
    ];
    component.usuarioFiltro = 'Kelly';

    expect(component.linhaSelecionada?.usuario).toBe('Kelly');
    expect(component.investimentosEmAndamentoUsuario.map((i) => i.descricao)).toEqual(['Tesouro']);
    expect(component.investimentosFinalizadosUsuario.map((i) => i.descricao)).toEqual(['CDB']);
    expect(component.subtotalEmAndamento).toBe(1000);
    expect(component.subtotalFinalizado).toBe(1000);
    expect(component.patrimonioTotalUsuario).toBe(2200);

    component.usuarioFiltro = '';
    expect(component.linhaSelecionada).toBeUndefined();
    expect(component.investimentosEmAndamentoUsuario).toEqual([]);
    expect(component.subtotalEmAndamento).toBe(0);
    expect(component.subtotalFinalizado).toBe(0);
    expect(component.patrimonioTotalUsuario).toBe(0);
  });
});
