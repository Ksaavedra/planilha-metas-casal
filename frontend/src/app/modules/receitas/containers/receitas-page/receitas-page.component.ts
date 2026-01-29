import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalAdicionarUsuarioService } from '../../../../core/services/modal-adicionar-usuario.service';

export type PessoaReceita = 'Kelly' | 'David' | 'Casal';
export type TipoReceita =
  | 'Salário'
  | 'Bônus'
  | 'Freela'
  | 'Renda extra'
  | 'Aluguel'
  | 'Outras rendas compartilhadas';
export type CategoriaReceita = 'Fixa' | 'Variável';

export interface ReceitaMensal {
  id?: string | number;
  pessoa: PessoaReceita;
  tipo: TipoReceita;
  categoria: CategoriaReceita;
  valor: number;
  mes?: string;
}

@Component({
  selector: 'app-receitas-page',
  templateUrl: './receitas-page.component.html',
  styleUrls: ['./receitas-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ReceitasPageComponent implements OnInit, OnDestroy {
  mesAtual: Date = new Date();

  // Receitas do mês atual (podem variar por mês)
  receitasMensal: ReceitaMensal[] = [];

  private saveSubscription?: Subscription;

  meses = [
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

  get nomeMesAtual(): string {
    const mes = this.mesAtual.getMonth();
    const ano = this.mesAtual.getFullYear();
    return `${this.meses[mes]} ${ano}`;
  }

  get receitasKelly(): ReceitaMensal[] {
    return this.receitasMensal.filter((r) => r.pessoa === 'Kelly');
  }

  get receitasDavid(): ReceitaMensal[] {
    return this.receitasMensal.filter((r) => r.pessoa === 'David');
  }

  get receitasCasal(): ReceitaMensal[] {
    return this.receitasMensal.filter((r) => r.pessoa === 'Casal');
  }

  get totalKelly(): number {
    return this.receitasKelly.reduce(
      (total, receita) => total + receita.valor,
      0
    );
  }

  get totalDavid(): number {
    return this.receitasDavid.reduce(
      (total, receita) => total + receita.valor,
      0
    );
  }

  get totalCasal(): number {
    return this.receitasCasal.reduce(
      (total, receita) => total + receita.valor,
      0
    );
  }

  get totalMensal(): number {
    return this.receitasMensal.reduce(
      (total, receita) => total + receita.valor,
      0
    );
  }

  constructor(
    private modalAdicionarUsuarioService: ModalAdicionarUsuarioService
  ) {}

  ngOnInit(): void {
    this.carregarReceitasDoMes();

    // Escutar evento de save do modal
    this.saveSubscription = this.modalAdicionarUsuarioService.save$.subscribe(
      (data: {
        nomeUsuario: string;
        valorSalario: number;
        meses: number[];
        ano: number;
      }) => {
        this.salvarUsuario(data);
      }
    );
  }

  ngOnDestroy(): void {
    this.saveSubscription?.unsubscribe();
  }

  abrirModalAdicionarUsuario(): void {
    this.modalAdicionarUsuarioService.open();
  }

  salvarUsuario(data: {
    nomeUsuario: string;
    valorSalario: number;
    meses: number[];
    ano: number;
  }): void {
    // TODO: Salvar no backend
    // Por enquanto, apenas adicionar à lista local
    console.log('Salvando usuário:', data);

    // Aqui você pode adicionar lógica para salvar no backend
    // e atualizar a lista de receitas mensais
    alert(
      `Usuário ${
        data.nomeUsuario
      } adicionado com salário de R$ ${data.valorSalario.toFixed(
        2
      )} para os meses selecionados no ano ${data.ano}.`
    );
  }

  carregarReceitasDoMes(): void {
    // TODO: Buscar receitas do backend para o mês atual
    // Por enquanto, usando dados de exemplo
    // Os valores podem ser diferentes para cada mês (13º, bonificações, etc)
    // Em produção, isso virá do backend com os valores reais do mês selecionado

    const ano = this.mesAtual.getFullYear();
    const mes = this.mesAtual.getMonth() + 1; // 1-12

    // Função auxiliar para obter valores por mês e ano
    const obterValoresPorMes = (
      ano: number,
      mes: number
    ): { kelly: any[]; david: any[]; casal: any[] } => {
      // Valores base por ano (usados quando não há valores específicos do mês)
      const valoresBase: {
        [key: number]: { kelly: any[]; david: any[]; casal: any[] };
      } = {
        2024: {
          kelly: [
            {
              tipo: 'Salário',
              categoria: 'Fixa' as CategoriaReceita,
              valor: 6000,
            },
            {
              tipo: 'Bônus',
              categoria: 'Variável' as CategoriaReceita,
              valor: 800,
            },
            {
              tipo: 'Freela',
              categoria: 'Variável' as CategoriaReceita,
              valor: 700,
            },
            {
              tipo: 'Renda extra',
              categoria: 'Variável' as CategoriaReceita,
              valor: 250,
            },
          ],
          david: [
            {
              tipo: 'Salário',
              categoria: 'Fixa' as CategoriaReceita,
              valor: 5200,
            },
            {
              tipo: 'Bônus',
              categoria: 'Variável' as CategoriaReceita,
              valor: 400,
            },
            {
              tipo: 'Renda extra',
              categoria: 'Variável' as CategoriaReceita,
              valor: 350,
            },
          ],
          casal: [
            {
              tipo: 'Aluguel',
              categoria: 'Fixa' as CategoriaReceita,
              valor: 1100,
            },
          ],
        },
        2025: {
          kelly: [
            {
              tipo: 'Salário',
              categoria: 'Fixa' as CategoriaReceita,
              valor: 6100,
            },
            {
              tipo: 'Bônus',
              categoria: 'Variável' as CategoriaReceita,
              valor: 900,
            },
            {
              tipo: 'Freela',
              categoria: 'Variável' as CategoriaReceita,
              valor: 750,
            },
            {
              tipo: 'Renda extra',
              categoria: 'Variável' as CategoriaReceita,
              valor: 280,
            },
          ],
          david: [
            {
              tipo: 'Salário',
              categoria: 'Fixa' as CategoriaReceita,
              valor: 5350,
            },
            {
              tipo: 'Bônus',
              categoria: 'Variável' as CategoriaReceita,
              valor: 450,
            },
            {
              tipo: 'Renda extra',
              categoria: 'Variável' as CategoriaReceita,
              valor: 380,
            },
          ],
          casal: [
            {
              tipo: 'Aluguel',
              categoria: 'Fixa' as CategoriaReceita,
              valor: 1150,
            },
          ],
        },
        2026: {
          kelly: [
            {
              tipo: 'Salário',
              categoria: 'Fixa' as CategoriaReceita,
              valor: 6200,
            },
            {
              tipo: 'Bônus',
              categoria: 'Variável' as CategoriaReceita,
              valor: 1000,
            },
            {
              tipo: 'Freela',
              categoria: 'Variável' as CategoriaReceita,
              valor: 800,
            },
            {
              tipo: 'Renda extra',
              categoria: 'Variável' as CategoriaReceita,
              valor: 300,
            },
          ],
          david: [
            {
              tipo: 'Salário',
              categoria: 'Fixa' as CategoriaReceita,
              valor: 5500,
            },
            {
              tipo: 'Bônus',
              categoria: 'Variável' as CategoriaReceita,
              valor: 500,
            },
            {
              tipo: 'Renda extra',
              categoria: 'Variável' as CategoriaReceita,
              valor: 400,
            },
          ],
          casal: [
            {
              tipo: 'Aluguel',
              categoria: 'Fixa' as CategoriaReceita,
              valor: 1200,
            },
          ],
        },
      };

      // Valores específicos por mês (sobrescrevem os valores base quando definidos)
      const valoresPorMes: {
        [ano: number]: {
          [mes: number]: { kelly?: any[]; david?: any[]; casal?: any[] };
        };
      } = {
        2026: {
          // Janeiro 2026 - valores diferentes
          1: {
            kelly: [
              {
                tipo: 'Salário',
                categoria: 'Fixa' as CategoriaReceita,
                valor: 6200,
              },
              {
                tipo: 'Bônus',
                categoria: 'Variável' as CategoriaReceita,
                valor: 1200,
              }, // Bônus maior em janeiro
              {
                tipo: 'Freela',
                categoria: 'Variável' as CategoriaReceita,
                valor: 900,
              },
              {
                tipo: 'Renda extra',
                categoria: 'Variável' as CategoriaReceita,
                valor: 350,
              },
            ],
            david: [
              {
                tipo: 'Salário',
                categoria: 'Fixa' as CategoriaReceita,
                valor: 5500,
              },
              {
                tipo: 'Bônus',
                categoria: 'Variável' as CategoriaReceita,
                valor: 600,
              }, // Bônus maior em janeiro
              {
                tipo: 'Renda extra',
                categoria: 'Variável' as CategoriaReceita,
                valor: 450,
              },
            ],
          },
          // Fevereiro 2026
          2: {
            kelly: [
              {
                tipo: 'Salário',
                categoria: 'Fixa' as CategoriaReceita,
                valor: 6200,
              },
              {
                tipo: 'Bônus',
                categoria: 'Variável' as CategoriaReceita,
                valor: 800,
              }, // Bônus menor
              {
                tipo: 'Freela',
                categoria: 'Variável' as CategoriaReceita,
                valor: 750,
              },
              {
                tipo: 'Renda extra',
                categoria: 'Variável' as CategoriaReceita,
                valor: 280,
              },
            ],
          },
          // Março 2026
          3: {
            kelly: [
              {
                tipo: 'Salário',
                categoria: 'Fixa' as CategoriaReceita,
                valor: 6200,
              },
              {
                tipo: 'Bônus',
                categoria: 'Variável' as CategoriaReceita,
                valor: 1100,
              },
              {
                tipo: 'Freela',
                categoria: 'Variável' as CategoriaReceita,
                valor: 850,
              },
              {
                tipo: 'Renda extra',
                categoria: 'Variável' as CategoriaReceita,
                valor: 320,
              },
            ],
            david: [
              {
                tipo: 'Salário',
                categoria: 'Fixa' as CategoriaReceita,
                valor: 5500,
              },
              {
                tipo: 'Bônus',
                categoria: 'Variável' as CategoriaReceita,
                valor: 550,
              },
              {
                tipo: 'Renda extra',
                categoria: 'Variável' as CategoriaReceita,
                valor: 420,
              },
            ],
          },
          // Junho 2026 - meio do ano, pode ter bônus maior
          6: {
            kelly: [
              {
                tipo: 'Salário',
                categoria: 'Fixa' as CategoriaReceita,
                valor: 6200,
              },
              {
                tipo: 'Bônus',
                categoria: 'Variável' as CategoriaReceita,
                valor: 1500,
              }, // Bônus de meio de ano
              {
                tipo: 'Freela',
                categoria: 'Variável' as CategoriaReceita,
                valor: 900,
              },
              {
                tipo: 'Renda extra',
                categoria: 'Variável' as CategoriaReceita,
                valor: 400,
              },
            ],
            david: [
              {
                tipo: 'Salário',
                categoria: 'Fixa' as CategoriaReceita,
                valor: 5500,
              },
              {
                tipo: 'Bônus',
                categoria: 'Variável' as CategoriaReceita,
                valor: 800,
              }, // Bônus de meio de ano
              {
                tipo: 'Renda extra',
                categoria: 'Variável' as CategoriaReceita,
                valor: 500,
              },
            ],
          },
          // Dezembro 2026 - fim do ano
          12: {
            kelly: [
              {
                tipo: 'Salário',
                categoria: 'Fixa' as CategoriaReceita,
                valor: 6200,
              },
              {
                tipo: 'Bônus',
                categoria: 'Variável' as CategoriaReceita,
                valor: 2000,
              }, // Bônus de fim de ano maior
              {
                tipo: 'Freela',
                categoria: 'Variável' as CategoriaReceita,
                valor: 1000,
              },
              {
                tipo: 'Renda extra',
                categoria: 'Variável' as CategoriaReceita,
                valor: 500,
              },
            ],
            david: [
              {
                tipo: 'Salário',
                categoria: 'Fixa' as CategoriaReceita,
                valor: 5500,
              },
              {
                tipo: 'Bônus',
                categoria: 'Variável' as CategoriaReceita,
                valor: 1000,
              }, // Bônus de fim de ano maior
              {
                tipo: 'Renda extra',
                categoria: 'Variável' as CategoriaReceita,
                valor: 600,
              },
            ],
          },
        },
      };

      // Obter valores base do ano
      const base = valoresBase[ano] || valoresBase[2026];

      // Verificar se há valores específicos para este mês
      const especifico = valoresPorMes[ano]?.[mes];

      // Mesclar valores: específicos do mês sobrescrevem os valores base
      return {
        kelly: especifico?.kelly || base.kelly,
        david: especifico?.david || base.david,
        casal: especifico?.casal || base.casal,
      };
    };

    const valores = obterValoresPorMes(ano, mes);
    const temDecimoTerceiro = mes === 12;

    this.receitasMensal = [
      // Receitas da Kelly
      ...valores.kelly.map((r, index) => ({
        id: `kelly-${ano}-${mes}-${index + 1}`,
        pessoa: 'Kelly' as PessoaReceita,
        tipo: r.tipo as TipoReceita,
        categoria: r.categoria,
        valor: r.valor,
      })),
      ...(temDecimoTerceiro
        ? [
            {
              id: `kelly-${ano}-${mes}-13`,
              pessoa: 'Kelly' as PessoaReceita,
              tipo: 'Salário' as TipoReceita,
              categoria: 'Fixa' as CategoriaReceita,
              valor:
                valores.kelly.find((r) => r.tipo === 'Salário')?.valor || 6200,
            },
          ]
        : []),

      // Receitas do David
      ...valores.david.map((r, index) => ({
        id: `david-${ano}-${mes}-${index + 1}`,
        pessoa: 'David' as PessoaReceita,
        tipo: r.tipo as TipoReceita,
        categoria: r.categoria,
        valor: r.valor,
      })),
      ...(temDecimoTerceiro
        ? [
            {
              id: `david-${ano}-${mes}-13`,
              pessoa: 'David' as PessoaReceita,
              tipo: 'Salário' as TipoReceita,
              categoria: 'Fixa' as CategoriaReceita,
              valor:
                valores.david.find((r) => r.tipo === 'Salário')?.valor || 5500,
            },
          ]
        : []),

      // Receitas do Casal
      ...valores.casal.map((r, index) => ({
        id: `casal-${ano}-${mes}-${index + 1}`,
        pessoa: 'Casal' as PessoaReceita,
        tipo: r.tipo as TipoReceita,
        categoria: r.categoria,
        valor: r.valor,
      })),
    ];
  }

  mesAnterior(): void {
    const novaData = new Date(this.mesAtual);
    novaData.setMonth(novaData.getMonth() - 1);
    this.mesAtual = novaData;
    this.carregarReceitasDoMes();
  }

  proximoMes(): void {
    const novaData = new Date(this.mesAtual);
    novaData.setMonth(novaData.getMonth() + 1);
    this.mesAtual = novaData;
    this.carregarReceitasDoMes();
  }

  onDateChange(event: any): void {
    if (event && event.value) {
      this.mesAtual = event.value;
      this.carregarReceitasDoMes();
    }
  }
}
