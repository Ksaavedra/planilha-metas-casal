import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DespesasUsuarioComponent } from './despesas-usuario.component';
import { Despesa } from 'app/core/services/despesas/despesas.service';

describe('DespesasUsuarioComponent', () => {
  let component: DespesasUsuarioComponent;
  let fixture: ComponentFixture<DespesasUsuarioComponent>;

  function despesa(partial: Partial<Despesa> & Pick<Despesa, 'valor' | 'natureza'>): Despesa {
    return {
      id: partial.id ?? 1,
      pessoa: partial.pessoa,
      natureza: partial.natureza,
      categoria: partial.categoria ?? 'Cat',
      descricao: partial.descricao ?? 'd',
      valor: partial.valor,
      data: partial.data ?? null,
      ano: partial.ano ?? 2026,
      mes: partial.mes ?? 4,
    };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule],
      declarations: [DespesasUsuarioComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DespesasUsuarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('linhasPorUsuario deve somar fixas e variáveis por pessoa no mês', () => {
    fixture.componentRef.setInput('despesas', [
      despesa({ id: 1, pessoa: 'Kelly', natureza: 'fixa', valor: 247 }),
      despesa({ id: 2, pessoa: 'Kelly', natureza: 'variavel', valor: 100 }),
      despesa({ id: 3, pessoa: 'Ana', natureza: 'fixa', valor: 50 }),
    ]);
    fixture.detectChanges();
    const linhas = component.linhasPorUsuario;
    expect(linhas.length).toBe(2);
    const kelly = linhas.find((r) => r.usuario === 'Kelly');
    expect(kelly?.fixa).toBe(247);
    expect(kelly?.variavel).toBe(100);
    expect(kelly?.total).toBe(347);
  });

  it('sem pessoa deve agrupar em (Sem usuário)', () => {
    fixture.componentRef.setInput('despesas', [
      despesa({ id: 1, pessoa: '', natureza: 'fixa', valor: 10 }),
    ]);
    fixture.detectChanges();
    expect(component.linhasPorUsuario[0].usuario).toBe('(Sem usuário)');
  });

  it('após carregar despesas não seleciona usuário automaticamente', () => {
    fixture.componentRef.setInput('despesas', [
      despesa({ id: 1, pessoa: 'Kelly', natureza: 'fixa', valor: 1 }),
      despesa({ id: 2, pessoa: 'Ana', natureza: 'fixa', valor: 2 }),
    ]);
    fixture.detectChanges();
    expect(component.usuarioFiltro).toBe('');
    expect(component.linhasVisiveis.length).toBe(0);
  });

  it('despesasFixasUsuario e despesasVariaveisUsuario separam por natureza', () => {
    fixture.componentRef.setInput('despesas', [
      despesa({ id: 1, pessoa: 'Kelly', natureza: 'fixa', valor: 10 }),
      despesa({ id: 2, pessoa: 'Kelly', natureza: 'variavel', valor: 5 }),
    ]);
    fixture.detectChanges();
    component.usuarioFiltro = 'Kelly';
    fixture.detectChanges();
    expect(component.despesasFixasUsuario.length).toBe(1);
    expect(component.despesasVariaveisUsuario.length).toBe(1);
    expect(component.totalGeralUsuario).toBe(15);
  });

  it('usuarioFiltro deve restringir linhasVisiveis ao escolher no select', () => {
    fixture.componentRef.setInput('despesas', [
      despesa({ id: 1, pessoa: 'Kelly', natureza: 'fixa', valor: 247 }),
      despesa({ id: 2, pessoa: 'Ana', natureza: 'variavel', valor: 10 }),
    ]);
    fixture.detectChanges();
    component.usuarioFiltro = 'Kelly';
    fixture.detectChanges();
    expect(component.linhasVisiveis.length).toBe(1);
    expect(component.linhasVisiveis[0].usuario).toBe('Kelly');
  });

  it('despesasDetalhesFiltradas deve listar só do usuário selecionado', () => {
    fixture.componentRef.setInput('despesas', [
      despesa({ id: 1, pessoa: 'Kelly', natureza: 'fixa', valor: 10, descricao: 'a' }),
      despesa({ id: 2, pessoa: 'Ana', natureza: 'variavel', valor: 5, descricao: 'b' }),
    ]);
    fixture.detectChanges();
    component.usuarioFiltro = 'Kelly';
    fixture.detectChanges();
    expect(component.despesasDetalhesFiltradas.length).toBe(1);
    expect(component.despesasDetalhesFiltradas[0].pessoa).toBe('Kelly');
  });

  it('ao mudar lista deve limpar seleção se o usuário não existir mais', () => {
    fixture.componentRef.setInput('despesas', [
      despesa({ id: 1, pessoa: 'Kelly', natureza: 'fixa', valor: 1 }),
    ]);
    fixture.detectChanges();
    component.usuarioFiltro = 'Kelly';
    fixture.detectChanges();

    fixture.componentRef.setInput('despesas', [
      despesa({ id: 2, pessoa: 'Outro', natureza: 'fixa', valor: 2 }),
    ]);
    fixture.detectChanges();
    expect(component.usuarioFiltro).toBe('');
  });

  it('deve renderizar Quem comprou, título da pessoa e blocos como na lista do mês', () => {
    fixture.componentRef.setInput('despesas', [
      despesa({ id: 1, pessoa: 'Kelly', natureza: 'fixa', valor: 247 }),
    ]);
    fixture.componentRef.setInput('nomeMesReferencia', 'Abril 2026');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Quem comprou');
    expect(el.querySelector('#despesasUsuarioSelect')).toBeTruthy();

    component.usuarioFiltro = 'Kelly';
    fixture.detectChanges();
    expect(el.textContent).toContain('Despesas - Kelly');
    expect(el.textContent).toContain('Despesas fixas');
    expect(el.textContent).toContain('Despesas variáveis');
    expect(el.textContent).toContain('Subtotal fixas');
    expect(el.textContent).toContain('Total do mês');
    const ths = el.querySelectorAll('.despesas-table thead th');
    expect(Array.from(ths).some((h) => h.textContent?.trim() === 'Data')).toBe(true);
    expect(Array.from(ths).some((h) => h.textContent?.trim() === 'Descrição')).toBe(true);
  });
});
