import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatorioResumoTableComponent } from './relatorio-resumo-table.component';

describe('RelatorioResumoTableComponent', () => {
  let component: RelatorioResumoTableComponent;
  let fixture: ComponentFixture<RelatorioResumoTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RelatorioResumoTableComponent],
      imports: [CommonModule],
    }).compileComponents();

    fixture = TestBed.createComponent(RelatorioResumoTableComponent);
    component = fixture.componentInstance;
  });

  it('deve criar com valores padrão vazios', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.meses).toEqual([]);
    expect(component.dadosReceitas).toEqual([]);
    expect(component.dadosDespesas).toEqual([]);
    expect(component.dadosCartaoCredito).toEqual([]);
    expect(component.dadosTotal).toEqual([]);
    expect(component.saldoTotal).toBe(0);
  });

  it('deve renderizar cabeçalhos, linhas e totais recebidos por input', () => {
    component.meses = ['Janeiro', 'Fevereiro'];
    component.dadosReceitas = [1000, 1200];
    component.dadosDespesas = [400, 500];
    component.dadosCartaoCredito = [100, 200];
    component.dadosTotal = [500, 500];
    component.totalReceitas = 2200;
    component.totalDespesas = 900;
    component.totalCartaoCredito = 300;
    component.saldoTotal = 1000;

    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const headers = Array.from(el.querySelectorAll('th')).map((th) =>
      th.textContent?.trim(),
    );

    expect(headers).toEqual(['Categoria', 'Janeiro', 'Fevereiro', 'Total']);
    expect(el.querySelector('.receitas-row')?.textContent).toContain('Receitas');
    expect(el.querySelector('.despesas-row')?.textContent).toContain('Despesas');
    expect(el.querySelector('.cartao-credito-row')?.textContent).toContain(
      'Cartão de crédito',
    );
    expect(el.querySelector('.total-row')?.textContent).toContain('Total');
  });

  it('deve aplicar classes positive e negative nos totais mensais e saldo final', () => {
    component.meses = ['Janeiro', 'Fevereiro'];
    component.dadosTotal = [-10, 20];
    component.saldoTotal = -30;

    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const totalCells = el.querySelectorAll('.total-row td');

    expect(totalCells[1].classList).toContain('negative');
    expect(totalCells[2].classList).toContain('positive');
    expect(totalCells[3].classList).toContain('negative');
  });
});
