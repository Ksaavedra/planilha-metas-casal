import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimpleChange } from '@angular/core';
import { Cartao } from '@core/interfaces/cartoes/cartoes';
import { DividaNoMes } from '@core/interfaces/dividas/dividas';
import { CartoesUsuarioComponent } from './cartoes-usuario.component';

describe('CartoesUsuarioComponent', () => {
  let component: CartoesUsuarioComponent;
  let fixture: ComponentFixture<CartoesUsuarioComponent>;

  const cartao = (partial: Partial<Cartao> = {}): Cartao => ({
    id: partial.id ?? 1,
    nome: partial.nome ?? 'Roxo',
    banco: partial.banco ?? 'Nubank',
    limite: partial.limite ?? 1000,
    valorUtilizado: partial.valorUtilizado ?? 200,
    valorDisponivel: partial.valorDisponivel ?? 800,
    diaFechamento: partial.diaFechamento ?? 20,
    diaVencimento: partial.diaVencimento ?? 25,
    diaMelhorCompra: partial.diaMelhorCompra ?? 21,
    faturaPaga: partial.faturaPaga,
    valorFaturaPaga: partial.valorFaturaPaga,
    pessoa: partial.pessoa,
    observacaoAtraso: partial.observacaoAtraso,
    previsaoPagamento: partial.previsaoPagamento,
  });

  const parcela = (partial: Partial<DividaNoMes> = {}): DividaNoMes => ({
    id: partial.id ?? 1,
    objetivo: partial.objetivo ?? 'Compra',
    tipoDivida: partial.tipoDivida ?? 'parcelamento',
    valorTotal: partial.valorTotal ?? 300,
    valorPago: partial.valorPago ?? 100,
    valorRestante: partial.valorRestante ?? 200,
    parcelaMensal: partial.parcelaMensal ?? 100,
    quantidadeParcelas: partial.quantidadeParcelas ?? 3,
    parcelasRestantes: partial.parcelasRestantes ?? 2,
    percentualQuitado: partial.percentualQuitado ?? 33.33,
    statusDivida: partial.statusDivida ?? 'pagando',
    cartaoId: partial.cartaoId ?? 1,
    ano: partial.ano ?? 2026,
    dataInicio: partial.dataInicio ?? '2026-05-01',
    indiceParcelaMes: partial.indiceParcelaMes ?? 1,
    valorPagoNoMes: partial.valorPagoNoMes ?? 0,
    parcelaMesPaga: partial.parcelaMesPaga ?? false,
    statusParcelaMes: partial.statusParcelaMes ?? 'pendente',
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule],
      declarations: [CartoesUsuarioComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CartoesUsuarioComponent);
    component = fixture.componentInstance;
    component.mesReferencia = new Date(2026, 4, 1);
    fixture.detectChanges();
  });

  it('deve criar', () => {
    expect(component).toBeTruthy();
  });

  it('deve reconciliar seleção quando cartoes mudarem', () => {
    const spy = jest.spyOn(component as any, 'reconciliarSelecaoAposMudancaLista');

    component.ngOnChanges({
      cartoes: new SimpleChange([], [], false),
      parcelamentos: new SimpleChange([], [], false),
    });

    expect(spy).toHaveBeenCalledTimes(1);

    component.ngOnChanges({});
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('deve limpar filtro e expansão quando não houver linhas', () => {
    component.usuarioFiltro = 'Kelly';
    component.cartaoExpandidoId = 1;
    component.cartoes = [];

    component['reconciliarSelecaoAposMudancaLista']();

    expect(component.usuarioFiltro).toBe('');
    expect(component.cartaoExpandidoId).toBeNull();
  });

  it('deve limpar seleção inválida e manter seleção válida', () => {
    component.cartoes = [cartao({ pessoa: 'Kelly' })];
    component.usuarioFiltro = 'David';
    component.cartaoExpandidoId = 1;

    component['reconciliarSelecaoAposMudancaLista']();
    expect(component.usuarioFiltro).toBe('');
    expect(component.cartaoExpandidoId).toBeNull();

    component.usuarioFiltro = 'Kelly';
    component['reconciliarSelecaoAposMudancaLista']();
    expect(component.usuarioFiltro).toBe('Kelly');
  });

  it('deve manter filtro vazio sem reconciliar para usuário', () => {
    component.cartoes = [cartao({ pessoa: 'Kelly' })];
    component.usuarioFiltro = '';

    component['reconciliarSelecaoAposMudancaLista']();

    expect(component.usuarioFiltro).toBe('');
  });

  it('deve agrupar cartões por pessoa e calcular totais', () => {
    component.cartoes = [
      cartao({ id: 1, pessoa: 'Kelly', limite: 1000, valorUtilizado: 100 }),
      cartao({ id: 2, banco: 'C6', pessoa: 'Kelly', limite: 500, valorUtilizado: 200 }),
      cartao({ id: 3, pessoa: '', limite: 300, valorUtilizado: 50 }),
    ];
    component.parcelamentos = [
      parcela({
        cartaoId: 2,
        valorTotal: 250,
        quantidadeParcelas: 2,
        valorRestante: 125,
      }),
    ];

    const linhas = component.linhasPorUsuario;
    const kelly = linhas.find((l) => l.usuario === 'Kelly');

    expect(linhas.map((l) => l.usuario)).toEqual(['(Sem usuário)', 'Kelly']);
    expect(kelly?.limite).toBe(1500);
    expect(kelly?.utilizado).toBe(225);
    expect(kelly?.disponivel).toBe(1275);
    expect(kelly?.totalCartoes).toBe(2);
  });

  it('deve filtrar cartões e totais do usuário selecionado', () => {
    component.cartoes = [
      cartao({ id: 1, pessoa: 'Kelly', banco: 'Nubank', limite: 1000, valorUtilizado: 100, diaVencimento: 20 }),
      cartao({ id: 2, pessoa: 'Kelly', banco: 'C6', limite: 500, valorUtilizado: 200, diaVencimento: 10 }),
      cartao({ id: 3, pessoa: 'David', banco: 'Itaú', limite: 300, valorUtilizado: 50 }),
    ];
    component.usuarioFiltro = 'Kelly';

    expect(component.linhasVisiveis.length).toBe(1);
    expect(component.cartoesUsuario.map((c) => c.banco)).toEqual(['C6', 'Nubank']);
    expect(component.totalLimiteUsuario).toBe(1500);
    expect(component.totalUtilizadoUsuario).toBe(300);
    expect(component.totalDisponivelUsuario).toBe(1200);
    expect(component.proximoVencimentoUsuario).toBe('Dia 10');
  });

  it('deve retornar vazio quando nenhum usuário estiver selecionado', () => {
    component.cartoes = [cartao({ pessoa: 'Kelly' })];
    component.usuarioFiltro = '';

    expect(component.linhasVisiveis).toEqual([]);
    expect(component.cartoesUsuario).toEqual([]);
    expect(component.totalLimiteUsuario).toBe(0);
    expect(component.proximoVencimentoUsuario).toBe('-');
  });

  it('deve alternar cartão expandido e resetar ao trocar usuário', () => {
    const c = cartao({ id: 10 });

    component.alternarCartao(c);
    expect(component.cartaoExpandido(c)).toBe(true);

    component.alternarCartao(c);
    expect(component.cartaoExpandido(c)).toBe(false);

    component.cartaoExpandidoId = 10;
    component.onUsuarioChange();
    expect(component.cartaoExpandidoId).toBeNull();
  });

  it('deve calcular valores da fatura por parcelamentos ou pelo cartão', () => {
    const c = cartao({ id: 1, limite: 1000, valorUtilizado: 250 });
    component.parcelamentos = [
      parcela({
        cartaoId: 1,
        valorTotal: 300,
        quantidadeParcelas: 2,
        valorRestante: 150,
      }),
      parcela({
        cartaoId: 1,
        valorTotal: -10,
        parcelaMensal: 0,
        valorRestante: -10,
      }),
      parcela({ cartaoId: 2, valorRestante: 999 }),
    ];

    expect(component.parcelamentosDoCartao(c).length).toBe(2);
    expect(component.valorUtilizadoFatura(c)).toBe(150);
    expect(component.valorDisponivelFatura(c)).toBe(850);

    component.parcelamentos = [];
    expect(component.valorUtilizadoFatura(c)).toBe(250);

    const semValores = {
      ...cartao({ id: 5 }),
      limite: undefined as any,
      valorUtilizado: undefined as any,
    };
    expect(component.valorUtilizadoFatura(semValores)).toBe(0);
    expect(component.valorDisponivelFatura(semValores)).toBe(0);
  });

  it('deve calcular status da linha com prioridade de fatura e parcelas', () => {
    const c = cartao({ id: 1, valorUtilizado: 100, diaVencimento: 10 });
    component.mesReferencia = new Date(2026, 4, 1);
    component.parcelamentos = [parcela({ cartaoId: 1, statusParcelaMes: 'atrasada' })];

    expect(component.faturaAtrasada(c)).toBe(true);
    expect(component.statusLinhaLabel(c)).toContain('Fatura');
    expect(component.statusLinhaClasse(c)).toContain('atrasado');

    component.mesReferencia = new Date(2026, 6, 1);
    const emDia = cartao({ id: 1, valorUtilizado: 100, diaFechamento: 31, diaVencimento: 30 });
    component.parcelamentos = [parcela({ cartaoId: 1, statusParcelaMes: 'pendente' })];
    expect(component.statusLinhaLabel(emDia)).toContain('Pendente');

    component.parcelamentos = [parcela({ cartaoId: 1, statusParcelaMes: 'paga' })];
    expect(component.statusLinhaLabel(c)).toContain('Parcela paga');

    const pago = cartao({ id: 2, faturaPaga: true, valorUtilizado: 0 });
    expect(component.statusLinhaLabel(pago)).toContain('Fatura paga');

    component.parcelamentos = [];
    expect(component.statusLinhaLabel(emDia)).toContain('Fatura em dia');
    expect(component.statusLinhaClasse(emDia)).toBe('status--em-dia');
    expect(component.statusLinhaClasse(pago)).toBe('status--fatura-paga');
  });
});
