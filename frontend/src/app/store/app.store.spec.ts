import { TestBed } from '@angular/core/testing';
import { Receita, TipoReceita, FrequenciaRecorrencia } from './models/receita';
import { Despesa, TipoDespesa } from './models/despesa';
import { Divida, TipoDivida } from './models/divida';
import {
  Investimento,
  TipoInvestimento,
  NivelRisco,
  NivelLiquidez,
} from './models/investimento';
import { AppStore } from './app.store';
import { STATUS_ATIVO, STATUS_PENDENTE } from './models/common';

describe('AppStore', () => {
  let store: AppStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppStore],
    });
    store = TestBed.inject(AppStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  describe('Receitas', () => {
    it('should add receita', () => {
      const receita: Receita = {
        id: '999',
        descricao: 'Nova Receita',
        valor: 1000,
        data: new Date(2024, 0, 1),
        categoria: { id: '1', nome: 'Trabalho', cor: '#10b981', icone: 'work' },
        tipoReceita: TipoReceita.SALARIO,
        recorrente: true,
        frequencia: FrequenciaRecorrencia.MENSAL,
        observacoes: 'Nova receita de teste',
        createdAt: new Date(2024, 0, 1),
        updatedAt: new Date(2024, 0, 1),
      };

      store.adicionarReceita(receita);
      const receitas = store.receitas();
      expect(receitas).toContain(receita);
    });

    it('should update receita', () => {
      const receita: Receita = {
        id: '999',
        descricao: 'Receita Atualizada',
        valor: 2000,
        data: new Date(2024, 0, 1),
        categoria: { id: '1', nome: 'Trabalho', cor: '#10b981', icone: 'work' },
        tipoReceita: TipoReceita.SALARIO,
        recorrente: true,
        frequencia: FrequenciaRecorrencia.MENSAL,
        observacoes: 'Receita atualizada',
        createdAt: new Date(2024, 0, 1),
        updatedAt: new Date(2024, 0, 1),
      };

      store.adicionarReceita(receita);
      store.atualizarReceita(receita);
      const receitas = store.receitas();
      expect(receitas.find((r) => r.id === '999')).toEqual(receita);
    });

    it('should delete receita', () => {
      const receita: Receita = {
        id: '999',
        descricao: 'Receita para Deletar',
        valor: 1000,
        data: new Date(2024, 0, 1),
        categoria: { id: '1', nome: 'Trabalho', cor: '#10b981', icone: 'work' },
        tipoReceita: TipoReceita.SALARIO,
        recorrente: true,
        frequencia: FrequenciaRecorrencia.MENSAL,
        observacoes: 'Receita para deletar',
        createdAt: new Date(2024, 0, 1),
        updatedAt: new Date(2024, 0, 1),
      };

      store.adicionarReceita(receita);
      store.removerReceita('999');
      const receitas = store.receitas();
      expect(receitas.find((r) => r.id === '999')).toBeUndefined();
    });
  });

  describe('Despesas', () => {
    it('should add despesa', () => {
      const despesa: Despesa = {
        id: '999',
        descricao: 'Nova Despesa',
        valor: 500,
        data: new Date(2024, 0, 1),
        categoria: {
          id: '4',
          nome: 'Alimentação',
          cor: '#f59e0b',
          icone: 'restaurant',
        },
        tipoDespesa: TipoDespesa.ALIMENTACAO,
        recorrente: true,
        parcelada: false,
        observacoes: 'Nova despesa de teste',
        createdAt: new Date(2024, 0, 1),
        updatedAt: new Date(2024, 0, 1),
      };

      store.adicionarDespesa(despesa);
      const despesas = store.despesas();
      expect(despesas).toContain(despesa);
    });

    it('should update despesa', () => {
      const despesa: Despesa = {
        id: '999',
        descricao: 'Despesa Atualizada',
        valor: 600,
        data: new Date(2024, 0, 1),
        categoria: {
          id: '4',
          nome: 'Alimentação',
          cor: '#f59e0b',
          icone: 'restaurant',
        },
        tipoDespesa: TipoDespesa.ALIMENTACAO,
        recorrente: true,
        parcelada: false,
        observacoes: 'Despesa atualizada',
        createdAt: new Date(2024, 0, 1),
        updatedAt: new Date(2024, 0, 1),
      };

      store.adicionarDespesa(despesa);
      store.atualizarDespesa(despesa);
      const despesas = store.despesas();
      expect(despesas.find((d) => d.id === '999')).toEqual(despesa);
    });

    it('should delete despesa', () => {
      const despesa: Despesa = {
        id: '999',
        descricao: 'Despesa para Deletar',
        valor: 500,
        data: new Date(2024, 0, 1),
        categoria: {
          id: '4',
          nome: 'Alimentação',
          cor: '#f59e0b',
          icone: 'restaurant',
        },
        tipoDespesa: TipoDespesa.ALIMENTACAO,
        recorrente: true,
        parcelada: false,
        observacoes: 'Despesa para deletar',
        createdAt: new Date(2024, 0, 1),
        updatedAt: new Date(2024, 0, 1),
      };

      store.adicionarDespesa(despesa);
      store.removerDespesa('999');
      const despesas = store.despesas();
      expect(despesas.find((d) => d.id === '999')).toBeUndefined();
    });
  });

  describe('Dívidas', () => {
    it('should add divida', () => {
      const divida: Divida = {
        id: '999',
        descricao: 'Nova Dívida',
        credor: 'Banco Teste',
        valorOriginal: 1000,
        valorAtual: 1000,
        dataVencimento: new Date(2024, 1, 1),
        status: STATUS_PENDENTE,
        tipoDivida: TipoDivida.CARTAO_CREDITO,
        parcelada: false,
        categoria: {
          id: '1',
          nome: 'Cartão de Crédito',
          cor: '#ff0000',
          icone: 'credit_card',
        },
        data: new Date(2024, 0, 1),
        observacoes: 'Nova dívida de teste',
        createdAt: new Date(2024, 0, 1),
        updatedAt: new Date(2024, 0, 1),
        valor: 0,
      };

      store.adicionarDivida(divida);
      const dividas = store.dividas();
      expect(dividas).toContain(divida);
    });

    it('should update divida', () => {
      const divida: Divida = {
        id: '999',
        descricao: 'Dívida Atualizada',
        credor: 'Banco Teste',
        valorOriginal: 1000,
        valorAtual: 800,
        dataVencimento: new Date(2024, 1, 1),
        status: STATUS_PENDENTE,
        tipoDivida: TipoDivida.CARTAO_CREDITO,
        parcelada: false,
        categoria: {
          id: '1',
          nome: 'Cartão de Crédito',
          cor: '#ff0000',
          icone: 'credit_card',
        },
        data: new Date(2024, 0, 1),
        observacoes: 'Dívida atualizada',
        createdAt: new Date(2024, 0, 1),
        updatedAt: new Date(2024, 0, 1),
        valor: 0,
      };

      store.adicionarDivida(divida);
      store.atualizarDivida(divida);
      const dividas = store.dividas();
      expect(dividas.find((d) => d.id === '999')).toEqual(divida);
    });

    it('should delete divida', () => {
      const divida: Divida = {
        id: '999',
        descricao: 'Dívida para Deletar',
        credor: 'Banco Teste',
        valorOriginal: 1000,
        valorAtual: 1000,
        dataVencimento: new Date(2024, 1, 1),
        status: STATUS_PENDENTE,
        tipoDivida: TipoDivida.CARTAO_CREDITO,
        parcelada: false,
        categoria: {
          id: '1',
          nome: 'Cartão de Crédito',
          cor: '#ff0000',
          icone: 'credit_card',
        },
        data: new Date(2024, 0, 1),
        observacoes: 'Dívida para deletar',
        createdAt: new Date(2024, 0, 1),
        updatedAt: new Date(2024, 0, 1),
        valor: 0,
      };

      store.adicionarDivida(divida);
      store.removerDivida('999');
      const dividas = store.dividas();
      expect(dividas.find((d) => d.id === '999')).toBeUndefined();
    });
  });

  describe('Investimentos', () => {
    it('should add investimento', () => {
      const investimento: Investimento = {
        id: '999',
        descricao: 'Novo Investimento',
        tipoInvestimento: TipoInvestimento.POUPANCA,
        valorInvestido: 5000,
        valorAtual: 5100,
        rentabilidade: 100,
        rentabilidadePercentual: 2.0,
        dataInicio: new Date(2024, 0, 1),
        status: STATUS_ATIVO,
        instituicao: 'Banco Teste',
        risco: NivelRisco.BAIXO,
        liquidez: NivelLiquidez.DIARIA,
        categoria: {
          id: '2',
          nome: 'Investimentos',
          cor: '#8b5cf6',
          icone: 'trending_up',
        },
        data: new Date(2024, 0, 1),
        observacoes: 'Novo investimento de teste',
        createdAt: new Date(2024, 0, 1),
        updatedAt: new Date(2024, 0, 1),
        valor: 0,
      };

      store.adicionarInvestimento(investimento);
      const investimentos = store.investimentos();
      expect(investimentos).toContain(investimento);
    });

    it('should update investimento', () => {
      const investimento: Investimento = {
        id: '999',
        descricao: 'Investimento Atualizado',
        tipoInvestimento: TipoInvestimento.POUPANCA,
        valorInvestido: 5000,
        valorAtual: 5200,
        rentabilidade: 200,
        rentabilidadePercentual: 4.0,
        dataInicio: new Date(2024, 0, 1),
        status: STATUS_ATIVO,
        instituicao: 'Banco Teste',
        risco: NivelRisco.BAIXO,
        liquidez: NivelLiquidez.DIARIA,
        categoria: {
          id: '2',
          nome: 'Investimentos',
          cor: '#8b5cf6',
          icone: 'trending_up',
        },
        data: new Date(2024, 0, 1),
        observacoes: 'Investimento atualizado',
        createdAt: new Date(2024, 0, 1),
        updatedAt: new Date(2024, 0, 1),
        valor: 0,
      };

      store.adicionarInvestimento(investimento);
      store.atualizarInvestimento(investimento);
      const investimentos = store.investimentos();
      expect(investimentos.find((i) => i.id === '999')).toEqual(investimento);
    });

    it('should delete investimento', () => {
      const investimento: Investimento = {
        id: '999',
        descricao: 'Investimento para Deletar',
        tipoInvestimento: TipoInvestimento.POUPANCA,
        valorInvestido: 5000,
        valorAtual: 5100,
        rentabilidade: 100,
        rentabilidadePercentual: 2.0,
        dataInicio: new Date(2024, 0, 1),
        status: STATUS_ATIVO,
        instituicao: 'Banco Teste',
        risco: NivelRisco.BAIXO,
        liquidez: NivelLiquidez.DIARIA,
        categoria: {
          id: '2',
          nome: 'Investimentos',
          cor: '#8b5cf6',
          icone: 'trending_up',
        },
        data: new Date(2024, 0, 1),
        observacoes: 'Investimento para deletar',
        createdAt: new Date(2024, 0, 1),
        updatedAt: new Date(2024, 0, 1),
        valor: 0,
      };

      store.adicionarInvestimento(investimento);
      store.removerInvestimento('999');
      const investimentos = store.investimentos();
      expect(investimentos.find((i) => i.id === '999')).toBeUndefined();
    });
  });
});
