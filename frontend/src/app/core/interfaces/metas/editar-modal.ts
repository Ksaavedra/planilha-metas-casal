import { MetaExtended } from './mes-meta';

export interface EditarValorDialogData {
  meta: MetaExtended;
  mesId: number;
  meses: string[];
}

export interface EditarValorDialogResult {
  metaId: number | string;
  mesId: number;
  valor: number;
}
