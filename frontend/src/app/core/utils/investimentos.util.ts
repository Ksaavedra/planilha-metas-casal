import {
  Investimento,
  ResumoInvestimentosView,
  StatusInvestimento,
} from '../interfaces/investimentos/investimentos';

export function calcularResumoInvestimentos(
  lista: Investimento[],
): ResumoInvestimentosView {
  const ativos = lista.filter((i) => i.statusInvestimento !== 'finalizado');
  const totalInvestido = lista.reduce((s, i) => s + (i.valorInvestido || 0), 0);
  const patrimonioAtual = lista.reduce((s, i) => s + (i.valorAtual || 0), 0);
  const lucroAcumulado = patrimonioAtual - totalInvestido;
  const rentabilidadePercentual =
    totalInvestido > 0 ? (lucroAcumulado / totalInvestido) * 100 : 0;

  return {
    totalInvestido,
    patrimonioAtual,
    lucroAcumulado,
    rentabilidadePercentual,
    quantidadeAtivos: ativos.length,
  };
}

export function statusInvestimentoLabel(status: StatusInvestimento): string {
  const map: Record<StatusInvestimento, string> = {
    crescendo: 'Crescendo 📈',
    estavel: 'Estável 🟡',
    finalizado: 'Finalizado ✅',
  };
  return map[status] ?? status;
}

export function statusInvestimentoClasse(status: StatusInvestimento): string {
  const map: Record<StatusInvestimento, string> = {
    crescendo: 'status--crescendo',
    estavel: 'status--estavel',
    finalizado: 'status--finalizado',
  };
  return map[status] ?? '';
}

export function inferirStatusPorRentabilidade(
  pct: number,
  atual?: StatusInvestimento,
): StatusInvestimento {
  if (atual === 'finalizado') return 'finalizado';
  if (pct > 0.5) return 'crescendo';
  if (pct < -0.5) return 'estavel';
  return 'estavel';
}
