export interface TipoInvestimentoOpcao {
  value: string;
  label: string;
  icon: string;
}

/** Tipos exibidos na tela de investimentos do casal. */
export const TIPOS_INVESTIMENTO_OPCOES: TipoInvestimentoOpcao[] = [
  { value: 'tesouro_direto', label: 'Tesouro Direto', icon: 'account_balance' },
  { value: 'cdb', label: 'CDB', icon: 'savings' },
  { value: 'cdi', label: 'CDI', icon: 'percent' },
  { value: 'fii', label: 'Fundo imobiliário', icon: 'apartment' },
  { value: 'acao', label: 'Ações', icon: 'trending_up' },
  { value: 'crypto', label: 'Criptomoedas', icon: 'currency_bitcoin' },
  { value: 'reserva_emergencia', label: 'Reserva emergência', icon: 'shield' },
  { value: 'previdencia', label: 'Previdência', icon: 'elderly' },
  { value: 'etf', label: 'ETF', icon: 'pie_chart' },
];

export function labelTipoInvestimento(value: string): string {
  return (
    TIPOS_INVESTIMENTO_OPCOES.find((t) => t.value === value)?.label ?? value
  );
}

export function iconTipoInvestimento(value: string): string {
  return (
    TIPOS_INVESTIMENTO_OPCOES.find((t) => t.value === value)?.icon ??
    'savings'
  );
}
