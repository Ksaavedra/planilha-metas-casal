export interface TipoDividaOpcao {
  value: string;
  label: string;
  icon: string;
}

export const TIPOS_DIVIDA_OPCOES: TipoDividaOpcao[] = [
  { value: 'cartao_credito', label: 'Cartão de crédito', icon: 'credit_card' },
  { value: 'emprestimo', label: 'Empréstimo', icon: 'account_balance' },
  { value: 'financiamento', label: 'Financiamento', icon: 'real_estate_agent' },
  { value: 'veiculo', label: 'Veículo', icon: 'directions_car' },
  { value: 'casa', label: 'Casa', icon: 'home' },
  { value: 'faculdade', label: 'Faculdade', icon: 'school' },
  { value: 'parcelamento', label: 'Parcelamento', icon: 'payments' },
];

export function labelTipoDivida(value: string): string {
  return TIPOS_DIVIDA_OPCOES.find((t) => t.value === value)?.label ?? value;
}

export function iconTipoDivida(value: string): string {
  return TIPOS_DIVIDA_OPCOES.find((t) => t.value === value)?.icon ?? 'credit_card';
}
