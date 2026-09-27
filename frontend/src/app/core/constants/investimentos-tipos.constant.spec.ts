import {
  iconTipoInvestimento,
  labelTipoInvestimento,
  TIPOS_INVESTIMENTO_OPCOES,
} from './investimentos-tipos.constant';

describe('investimentos-tipos.constant', () => {
  it('TIPOS_INVESTIMENTO_OPCOES possui entradas conhecidas', () => {
    expect(TIPOS_INVESTIMENTO_OPCOES.length).toBeGreaterThanOrEqual(9);
    expect(TIPOS_INVESTIMENTO_OPCOES.some((t) => t.value === 'cdb')).toBe(true);
  });

  it('labelTipoInvestimento retorna label ou valor', () => {
    expect(labelTipoInvestimento('cdb')).toBe('CDB');
    expect(labelTipoInvestimento('tipo_desconhecido')).toBe('tipo_desconhecido');
  });

  it('iconTipoInvestimento retorna ícone ou padrão savings', () => {
    expect(iconTipoInvestimento('fii')).toBe('apartment');
    expect(iconTipoInvestimento('xyz')).toBe('savings');
  });
});
