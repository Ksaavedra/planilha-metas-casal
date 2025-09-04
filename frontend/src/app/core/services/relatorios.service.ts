import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { DespesasService } from './despesas.service';
import { ReceitasService } from './receitas.service';

export interface ResumoFinanceiro {
  receitas: number;
  despesas: number;
  saldo: number;
  mes_id?: number;
}

export interface ResumoDetalhado extends ResumoFinanceiro {
  receitasPorCategoria: { [key: string]: number };
  despesasPorCategoria: { [key: string]: number };
  receitasPorTipo: { [key: string]: number };
  totalReceitas: number;
  totalDespesas: number;
  saldoPositivo: boolean;
  percentualReceitas: number;
  percentualDespesas: number;
}

@Injectable({
  providedIn: 'root',
})
export class RelatoriosService {
  constructor(
    private apiService: ApiService,
    private despesasService: DespesasService,
    private receitasService: ReceitasService
  ) {}

  // Obter resumo básico
  getResumo(params?: { mes_id?: number }): Observable<ResumoFinanceiro> {
    return this.apiService.get<ResumoFinanceiro>('/relatorios/resumo', params);
  }

  // Obter resumo detalhado
  getResumoDetalhado(params?: {
    mes_id?: number;
  }): Observable<ResumoDetalhado> {
    return forkJoin({
      resumo: this.getResumo(params),
      receitas: this.receitasService.getReceitas(params),
      despesas: this.despesasService.getDespesas(params),
    }).pipe(
      map(({ resumo, receitas, despesas }) => {
        const receitasPorCategoria =
          this.receitasService.agruparPorCategoria(receitas);
        const despesasPorCategoria =
          this.despesasService.agruparPorCategoria(despesas);
        const receitasPorTipo = this.receitasService.agruparPorTipo(receitas);

        const totalReceitas =
          this.receitasService.calcularTotalReceitas(receitas);
        const totalDespesas =
          this.despesasService.calcularTotalDespesas(despesas);
        const saldo = totalReceitas - totalDespesas;

        return {
          ...resumo,
          receitasPorCategoria,
          despesasPorCategoria,
          receitasPorTipo,
          totalReceitas,
          totalDespesas,
          saldo,
          saldoPositivo: saldo >= 0,
          percentualReceitas:
            totalReceitas > 0
              ? (totalReceitas / (totalReceitas + totalDespesas)) * 100
              : 0,
          percentualDespesas:
            totalDespesas > 0
              ? (totalDespesas / (totalReceitas + totalDespesas)) * 100
              : 0,
        };
      })
    );
  }

  // Obter resumo por mês
  getResumoPorMes(mesId: number): Observable<ResumoDetalhado> {
    return this.getResumoDetalhado({ mes_id: mesId });
  }

  // Calcular indicadores financeiros
  calcularIndicadores(resumo: ResumoDetalhado) {
    const { totalReceitas, totalDespesas, saldo } = resumo;

    return {
      saldo: saldo,
      saldoPositivo: saldo >= 0,
      percentualReceitas:
        totalReceitas > 0
          ? (totalReceitas / (totalReceitas + totalDespesas)) * 100
          : 0,
      percentualDespesas:
        totalDespesas > 0
          ? (totalDespesas / (totalReceitas + totalDespesas)) * 100
          : 0,
      razaoReceitaDespesa:
        totalDespesas > 0 ? totalReceitas / totalDespesas : 0,
      margemLucro: totalReceitas > 0 ? (saldo / totalReceitas) * 100 : 0,
    };
  }

  // Gerar relatório mensal
  gerarRelatorioMensal(mesId: number): Observable<any> {
    return this.getResumoDetalhado({ mes_id: mesId }).pipe(
      map((resumo) => ({
        mes: mesId,
        periodo: this.getNomeMes(mesId),
        resumo: resumo,
        indicadores: this.calcularIndicadores(resumo),
        timestamp: new Date().toISOString(),
      }))
    );
  }

  // Obter nome do mês
  private getNomeMes(mesId: number): string {
    const meses = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    return meses[mesId - 1] || 'Mês desconhecido';
  }
}
