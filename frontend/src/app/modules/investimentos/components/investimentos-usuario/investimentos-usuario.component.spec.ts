import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { InvestimentosUsuarioComponent } from './investimentos-usuario.component';
import { Investimento } from '@core/interfaces/investimentos/investimentos';

describe('InvestimentosUsuarioComponent', () => {
  let component: InvestimentosUsuarioComponent;
  let fixture: ComponentFixture<InvestimentosUsuarioComponent>;

  const inv = (pessoa: string, status: Investimento['statusInvestimento']): Investimento => ({
    id: 1,
    descricao: 'Reserva',
    tipoInvestimento: 'cdb',
    valorInvestido: 1000,
    valorAtual: 1100,
    aporteMensal: 100,
    rentabilidade: 100,
    rentabilidadePercentual: 10,
    statusInvestimento: status,
    ano: 2026,
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
});
