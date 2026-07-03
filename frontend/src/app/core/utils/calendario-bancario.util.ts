export interface CalendarioBancarioContexto {
  /** Feriados adicionais (yyyy-MM-dd), ex.: calendário específico do banco. */
  feriadosExtrasIso?: string[];
}

const FERIADOS_FIXOS = [
  [1, 1],
  [4, 21],
  [5, 1],
  [9, 7],
  [10, 12],
  [11, 2],
  [11, 15],
  [12, 25],
] as const;

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher). */
export function domingoPascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

function deslocarDias(data: Date, dias: number): Date {
  const copia = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  copia.setDate(copia.getDate() + dias);
  return copia;
}

function feriadosMoveisPascoa(ano: number): Date[] {
  const pascoa = domingoPascoa(ano);
  return [
    deslocarDias(pascoa, -48), // segunda de carnaval
    deslocarDias(pascoa, -47), // terça de carnaval
    deslocarDias(pascoa, -2), // sexta-feira santa
    deslocarDias(pascoa, 60), // corpus christi
  ];
}

export function diasNoMes(ano: number, mes: number): number {
  return new Date(ano, mes, 0).getDate();
}

export function dataNoMes(ano: number, mes: number, dia: number): Date {
  const ultimo = diasNoMes(ano, mes);
  return new Date(ano, mes - 1, Math.min(Math.max(1, dia), ultimo));
}

export function dataIsoDeDate(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function mesmaData(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isFimDeSemana(data: Date): boolean {
  const dia = data.getDay();
  return dia === 0 || dia === 6;
}

export function feriadosNacionaisDoAno(ano: number): Date[] {
  const fixos = FERIADOS_FIXOS.map(([mes, dia]) => new Date(ano, mes - 1, dia));
  return [...fixos, ...feriadosMoveisPascoa(ano)];
}

export function isFeriadoBancario(
  data: Date,
  contexto: CalendarioBancarioContexto = {},
): boolean {
  const extras = new Set(
    (contexto.feriadosExtrasIso ?? []).map((d) => d.slice(0, 10)),
  );
  const iso = dataIsoDeDate(data);
  if (extras.has(iso)) return true;

  return feriadosNacionaisDoAno(data.getFullYear()).some((feriado) =>
    mesmaData(feriado, data),
  );
}

export function isDiaUtil(
  data: Date,
  contexto: CalendarioBancarioContexto = {},
): boolean {
  return !isFimDeSemana(data) && !isFeriadoBancario(data, contexto);
}

/**
 * Posterga vencimento para o próximo dia útil.
 * Enquanto a data for sábado, domingo ou feriado, avança 1 dia.
 * Dia útil (seg–sex, não feriado) permanece no mesmo dia.
 */
export function ajustarParaProximoDiaUtil(
  data: Date,
  contexto: CalendarioBancarioContexto = {},
): Date {
  let atual = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  while (!isDiaUtil(atual, contexto)) {
    atual = deslocarDias(atual, 1);
  }
  return atual;
}

/** Dia útil anterior (fechamento antecipado). */
export function ajustarParaDiaUtilAnterior(
  data: Date,
  contexto: CalendarioBancarioContexto = {},
): Date {
  let atual = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  while (!isDiaUtil(atual, contexto)) {
    atual = deslocarDias(atual, -1);
  }
  return atual;
}
