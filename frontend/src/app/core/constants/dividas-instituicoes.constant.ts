export interface InstituicaoOpcao {
  value: string;
  label: string;
  icon: string;
}

export const INSTITUICOES_DIVIDA_OPCOES: InstituicaoOpcao[] = [
  { value: 'Nubank', label: 'Nubank', icon: 'credit_card' },
  { value: 'Itaú', label: 'Itaú', icon: 'account_balance' },
  { value: 'Santander', label: 'Santander', icon: 'account_balance' },
  { value: 'Inter', label: 'Inter', icon: 'credit_card' },
  { value: 'C6', label: 'C6 Bank', icon: 'credit_card' },
  { value: 'Bradesco', label: 'Bradesco', icon: 'account_balance' },
  { value: 'Caixa', label: 'Caixa', icon: 'account_balance' },
  { value: 'Outro', label: 'Outro', icon: 'payments' },
];

export function iconInstituicao(nome?: string | null): string {
  if (!nome?.trim()) return 'credit_card';
  const n = nome.trim();
  const op = INSTITUICOES_DIVIDA_OPCOES.find(
    (i) => i.value.toLowerCase() === n.toLowerCase(),
  );
  return op?.icon ?? 'credit_card';
}
