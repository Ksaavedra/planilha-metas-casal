import {
  Component,
  HostListener,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MetasService } from '../../services/metas.service';
import {
  Meta,
  MetaExtended,
  ModalEdicao,
  ModalEdicaoNome,
} from '../../../../core/interfaces/mes-meta';
import { ElaborandoMetasComponent } from '../../components/lista-metas/elaborando-metas/elaborando-metas.component';
import { ExecutandoMetasComponent } from '../../components/lista-metas/executando-metas/executando-metas.component';
import { ProgressTableComponent } from '../../components/progress-table/progress-table.component';

type StatusMeta = 'Programado' | 'Pago' | 'Vazio' | 'Finalizado';

@Component({
  selector: 'app-metas-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ElaborandoMetasComponent,
    ExecutandoMetasComponent,
    ProgressTableComponent,
  ],
  templateUrl: './metas-page.component.html',
  styleUrls: ['./metas-page.component.scss'],
})
export class MetasPageComponent implements OnInit {
  meses: string[] = [];
  modalEdicao: ModalEdicao = {
    meta: {} as MetaExtended,
    mesId: -1,
    valor: 0,
    isOpen: false,
  };

  metas: MetaExtended[] = [];
  percentualPagoView = 0;
  isProcessingEdit = false;
  totalValorMetaView = 0;
  totalValorPorMesView = 0;
  totalMesesNecessariosView = 0;
  totalValorAtualView = 0;
  totalContribuicoesView = 0;
  camposProcessados = new Set<string>();

  constructor(
    private metasService: MetasService,
    private cdr: ChangeDetectorRef
  ) {}

  private readonly MESES_PADRAO = [
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

  ngOnInit(): void {
    this.metasService.getMetas().subscribe((metas: Meta[]) => {
      console.log('📥 Todas as metas recebidas do servidor:', metas);

      // Filtrar apenas metas válidas (com ID válido e nome não vazio)
      const metasValidas = metas.filter((meta) => {
        // Aceitar qualquer ID válido (não vazio, não 0, não undefined)
        const idValido =
          meta.id && meta.id !== 0 && String(meta.id).trim() !== '';

        // Aceitar nomes válidos (não vazios, não undefined)
        const nomeValido =
          meta.nome && meta.nome.trim().length > 0 && meta.nome !== 'undefined';

        return idValido && nomeValido;
      });

      this.metas = metasValidas.map((m) => {
        const metaExtended: MetaExtended = {
          ...m,
          id: m.id, // Padronizar todos os IDs como string
          valorMeta: this.toNum(m.valorMeta),
          valorPorMes: this.toNum(m.valorPorMes),
          valorAtual: this.toNum(m.valorAtual),
          mesesNecessarios: this.toNum(m.mesesNecessarios),
          editandoNome: false,
          nomeTemp: '',
          savingNome: false,
          savedTick: false,
          editandoValorMeta: false,
          editandoValorPorMes: false,
          editandoValorAtual: false,
          savedTickCampo: false,
          dropdownOpen: undefined,
        };
        return metaExtended;
      });

      this.setHeaderMesesFromData();
      this.metas.forEach((m) => this.normalizeMeses(m));
      this.recalcResumo();
    });
  }

  reloadMetas(): void {
    const cacheTela = new Map<number | string, number>();
    this.metas.forEach((m) => cacheTela.set(m.id, this.toNum(m.valorAtual)));

    this.metasService.getMetas().subscribe({
      next: (metas) => {
        const metasValidas = metas.filter((m) => {
          const idValido = m.id && m.id > 0;
          const nomeValido = m.nome && m.nome.trim().length > 0;
          return idValido && nomeValido;
        });

        this.metas = metasValidas.map((m) => {
          const doPai = this.valorAtualCache.get(m.id);
          const daTela = cacheTela.get(m.id);
          const doServidor = this.toNum(m.valorAtual);

          return {
            ...m,
            valorMeta: this.toNum(m.valorMeta),
            valorPorMes: this.toNum(m.valorPorMes),
            mesesNecessarios: this.toNum(m.mesesNecessarios),
            valorAtual: doPai ?? daTela ?? doServidor,
            meses: m.meses ?? [],
          } as MetaExtended;
        });

        this.setHeaderMesesFromData();
        this.metas.forEach((m) => this.normalizeMeses(m));
        this.recalcResumo();
      },
      error: (error) => {
        console.error('❌ Erro ao carregar metas:', error);
      },
    });
  }

  private toNum(v: any): number {
    if (v === null || v === undefined) return 0;

    // Se já é número, retorna
    if (typeof v === 'number') return v;

    // Converte string para número
    const num = parseFloat(String(v));
    return isNaN(num) ? 0 : num;
  }

  setHeaderMesesFromData(): void {
    const nomes = this.metas.flatMap((m) => m.meses?.map((x) => x.nome) ?? []);
    const unicos = Array.from(new Set(nomes));
    this.meses = unicos.length ? unicos : [...this.MESES_PADRAO];
  }

  private normalizeMeses(meta: MetaExtended): void {
    const header = this.meses.length ? this.meses : this.MESES_PADRAO;
    const byName = new Map((meta.meses ?? []).map((m) => [m.nome, m]));

    meta.meses = header.map((nome, i) => {
      const existing = byName.get(nome);
      if (existing) {
        return existing;
      } else {
        return {
          id: i + 1,
          nome,
          valor: 0,
          status: 'Vazio',
          mes_id: i + 1,
        };
      }
    });

    // Normalizar valores numéricos
    meta.meses.forEach((mes) => {
      mes.valor = this.toNum(mes.valor);
    });
  }

  private recalcResumo(): void {
    // Calcular todos os totais de uma vez
    this.totalValorMetaView = this.metas.reduce(
      (t, m) => t + this.toNum(m.valorMeta),
      0
    );

    this.totalValorPorMesView = this.metas.reduce(
      (t, m) => t + this.toNum(m.valorPorMes),
      0
    );

    this.totalMesesNecessariosView = this.metas.reduce(
      (t, m) => t + this.toNum(m.mesesNecessarios),
      0
    );

    this.totalValorAtualView = this.metas.reduce(
      (t, m) => t + this.toNum(m.valorAtual),
      0
    );

    this.totalContribuicoesView = this.metas.reduce(
      (total, meta) => total + this.getTotalContribuicoesMeta(meta as any),
      0
    );

    // Calcular percentual pago (considerando "quanto já temos" + "quanto já pagamos")
    const totalRealizado = this.metas.reduce((t, m) => {
      const valorPago = (m.meses ?? [])
        .filter((x) => x.status === 'Pago')
        .reduce((s, x) => s + this.toNum(x.valor), 0);
      const valorGuardado = this.toNum(m.valorAtual);
      return t + valorPago + valorGuardado;
    }, 0);

    this.percentualPagoView =
      this.totalValorMetaView > 0
        ? Number(((totalRealizado * 100) / this.totalValorMetaView).toFixed(2))
        : 0;
  }

  getTotalContribuicoesMeta(meta: Meta): number {
    if (!meta.meses) return 0;
    return meta.meses
      .filter((mes) => mes.status === 'Pago') // CORREÇÃO: Somar apenas meses Pago
      .reduce((total, mes) => {
        const valor =
          typeof mes.valor === 'number'
            ? mes.valor
            : parseFloat(String(mes.valor)) || 0;
        return total + valor;
      }, 0);
  }

  // Calcular progresso real de uma meta (quanto já temos + quanto já pagamos)
  getProgressoRealMeta(meta: MetaExtended): number {
    const valorMeta = this.toNum(meta.valorMeta);
    if (valorMeta <= 0) return 0;

    // CORREÇÃO: Usar apenas a soma dos meses com status "Pago"
    const valorPago = (meta.meses ?? [])
      .filter((x) => x.status === 'Pago')
      .reduce((s, x) => s + this.toNum(x.valor), 0); // "Quanto já pagamos"

    const totalRealizado = valorPago;
    const progresso = Number(((totalRealizado * 100) / valorMeta).toFixed(2));

    // DEBUG: Log detalhado para debugar o problema
    console.log(
      `🔍 DEBUG getProgressoRealMeta para meta ${meta.id} (${meta.nome}):`,
      {
        valorMeta: valorMeta,
        valorAtual: meta.valorAtual,
        mesesPagos: (meta.meses ?? [])
          .filter((x) => x.status === 'Pago')
          .map((m) => ({
            nome: m.nome,
            valor: m.valor,
            status: m.status,
          })),
        valorPago: valorPago,
        totalRealizado: totalRealizado,
        progresso: progresso,
      }
    );

    return progresso;
  }

  // Calcular valor que ainda falta pagar
  getValorFaltanteMeta(meta: MetaExtended): number {
    const valorMeta = this.toNum(meta.valorMeta || 0);

    // Somar somente meses com status Pago
    const valorPago = (meta.meses ?? [])
      .filter((x) => x.status === 'Pago')
      .reduce((s, x) => s + this.toNum(x.valor), 0);

    // Dinheiro guardado (Quanto já temos)
    const valorGuardado = this.toNum(meta.valorAtual || 0);

    // Total realizado = meses pagos + guardado
    const valorTotal = valorPago + valorGuardado;

    // Faltante
    const faltante = Math.max(0, valorMeta - valorTotal);

    return faltante;
  }

  // ja pago
  getValorRealizadoMeta(meta: MetaExtended): number {
    // CORREÇÃO: Usar apenas a soma dos meses com status "Pago"
    // O valorAtual (quanto já temos) é dinheiro guardado separadamente
    // Para o progresso, contamos apenas o que foi efetivamente pago nos meses
    // const valorPago = (meta.meses ?? [])
    //   .filter((x) => x.status === 'Pago')
    //   .reduce((s, x) => s + this.toNum(x.valor), 0); // "Quanto já pagamos"

    // DEBUG: Log detalhado para debugar o problema
    // console.log(
    //   `🔍 DEBUG getValorRealizadoMeta para meta ${meta.id} (${meta.nome}):`,
    //   {
    //     valorAtual: meta.valorAtual,
    //     mesesPagos: (meta.meses ?? [])
    //       .filter((x) => x.status === 'Pago')
    //       .map((m) => ({
    //         nome: m.nome,
    //         valor: m.valor,
    //         status: m.status,
    //       })),
    //     valorPago: valorPago,
    //     resultado: valorPago,
    //   }
    // );

    return (meta.meses ?? [])
      .filter((x) => x.status === 'Pago')
      .reduce((s, x) => s + this.toNum(x.valor), 0);
  }

  // ja pago + guardado
  getValorTotalComGuardado(meta: MetaExtended): number {
    return this.getValorRealizadoMeta(meta) + (meta.valorAtual || 0);
  }

  adicionarMeta(): void {
    if (this.metas.length >= 15) return;

    const header = this.meses.length ? this.meses : this.MESES_PADRAO;

    // Gerar nome padrão para a nova meta
    const proximoNumero = this.metas.length + 1;
    const nomePadrao = `Sua ${proximoNumero}ª Meta aqui`;

    const body: Partial<Meta> = {
      nome: nomePadrao, // Usar nome padrão em vez de vazio
      valorMeta: 0,
      valorPorMes: 0,
      mesesNecessarios: 0,
      valorAtual: 0,
      meses: header.map((nome, i) => ({
        id: i + 1,
        nome,
        valor: 0,
        status: 'Vazio',
      })),
    };

    // Usar POST simples para deixar o json-server gerar o ID
    this.metasService.createMeta(body).subscribe({
      next: (created) => {
        // Recarregar as metas do servidor para ter o ID correto
        this.reloadMetas();
      },
      error: (e) => {
        alert('Erro ao criar meta. Tente novamente.');
      },
    });
  }

  onConfirmarCampo(event: {
    meta: MetaExtended;
    campo: 'nome' | 'valorMeta' | 'valorPorMes' | 'valorAtual';
    withEvent?: Event;
  }): void {
    if (event.withEvent) {
      this.confirmarCampoComValor(event.meta, event.campo, event.withEvent);
    } else {
      this.confirmarCampo(event.meta, event.campo);
    }
  }

  confirmarCampoComValor(
    meta: MetaExtended,
    campo: 'valorMeta' | 'valorPorMes' | 'valorAtual' | 'nome',
    ev: Event
  ) {
    // Prevenir comportamento padrão do Enter
    ev.preventDefault();
    ev.stopPropagation();

    // Marcar como processado
    const chave = `${meta.id}-${campo}`;
    this.camposProcessados.add(chave);

    // Chamar confirmarCampo diretamente
    this.confirmarCampo(meta, campo);
  }

  confirmarCampo(
    meta: MetaExtended,
    campo: 'valorMeta' | 'valorPorMes' | 'valorAtual' | 'nome'
  ) {
    // valida ID (string do json-server)
    if (!meta.id || String(meta.id).trim() === '') {
      alert('Erro: Meta sem ID válido. Recarregue a página e tente novamente.');
      return;
    }

    const flag = `editando${campo.charAt(0).toUpperCase() + campo.slice(1)}` as
      | 'editandoNome'
      | 'editandoValorMeta'
      | 'editandoValorPorMes'
      | 'editandoValorAtual';

    const tempKey = `${campo}Temp` as
      | 'nomeTemp'
      | 'valorMetaTemp'
      | 'valorPorMesTemp'
      | 'valorAtualTemp';

    const tempVal = (meta as any)[tempKey];

    // ====== 1) Atualização de NOME ======
    if (campo === 'nome') {
      const novoNome = String(tempVal ?? '').trim();
      if (!novoNome || novoNome === meta.nome) {
        this.cancelarCampo(meta, 'nome');
        return;
      }

      // aplica localmente
      meta.nome = novoNome;

      // salva (PATCH parcial)
      this.metasService.updateMeta(meta.id, { nome: novoNome }).subscribe({
        next: () => {
          meta.savedTickCampo = true;
          setTimeout(() => (meta.savedTickCampo = false), 1200);
          this.reloadMetas();
        },
        error: (e) => {
          alert('Erro ao salvar. Tente novamente.');
        },
      });

      // encerra estado de edição
      (meta as any)[flag] = false;
      (meta as any)[tempKey] = undefined;
      return;
    }

    // ====== 2) Atualização de CAMPOS NUMÉRICOS ======
    // Sempre parsear (suporta "3.123,00", "3123.00", "200")
    const novo = this.parseNumeroBR(tempVal);
    const atual = Number((meta as any)[campo]) || 0;

    if (novo === atual) {
      this.cancelarCampo(meta, campo);
      return;
    }

    // aplica localmente
    (meta as any)[campo] = novo;

    // monta patch; se mudar valorPorMes, recalc mesesNecessarios
    const patch: any = { [campo]: novo };
    if (campo === 'valorPorMes') {
      patch.mesesNecessarios =
        novo > 0 ? Math.ceil((meta.valorMeta || 0) / novo) : 0;
    }

    this.metasService.updateMeta(meta.id, patch).subscribe({
      next: () => {
        meta.savedTickCampo = true;
        setTimeout(() => (meta.savedTickCampo = false), 1200);
        this.recalcResumo();
        this.reloadMetas();
      },
      error: (e) => {
        alert('Erro ao salvar. Tente novamente.');
      },
    });

    // encerra estado de edição
    (meta as any)[flag] = false;
    (meta as any)[tempKey] = undefined;
  }

  cancelarCampo(
    meta: MetaExtended,
    campo: 'valorMeta' | 'valorPorMes' | 'valorAtual' | 'nome'
  ) {
    const flag = `editando${campo.charAt(0).toUpperCase() + campo.slice(1)}` as
      | 'editandoNome'
      | 'editandoValorMeta'
      | 'editandoValorPorMes'
      | 'editandoValorAtual';
    const temp = `${campo}Temp` as
      | 'nomeTemp'
      | 'valorMetaTemp'
      | 'valorPorMesTemp'
      | 'valorAtualTemp';

    (meta as any)[flag] = false;
    (meta as any)[temp] = undefined;
  }

  private parseNumeroBR(v: any): number {
    if (v === null || v === undefined) return 0;

    // para garantir: transforma em string e tira espaços (inclui NBSP)
    let s = String(v).trim();
    if (!s) return 0;

    // remove tudo que não for dígito, vírgula, ponto ou sinal
    // (tira "R$", letras, etc.)
    s = s.replace(/\s+/g, '').replace(/[^\d.,-]+/g, '');

    // Se tem vírgula, tratamos vírgula como decimal e removemos pontos de milhar
    if (s.includes(',')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // sem vírgula: mantemos ponto como decimal (e se tiver só números, ok)
      // (se vier "2.000.000" com vários pontos, você pode remover todos menos o último)
      const parts = s.split('.');
      if (parts.length > 2) {
        const dec = parts.pop(); // último ponto vira decimal
        s = parts.join('') + '.' + dec; // remove pontos de milhar
      }
    }

    const n = parseFloat(s);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
  }

  removerMeta(id: any): void {
    this.metasService.deleteMeta(id).subscribe({
      next: () => {
        this.reloadMetas();
      },
      error: (e) => {
        // Erro ao remover meta
      },
    });
  }

  onAlterarStatus(e: {
    metaId: number | string;
    mesId: number;
    status: StatusMeta;
  }) {
    console.log('🎯 onAlterarStatus recebido:', e);

    const meta = this.metas.find((m) => String(m.id) === String(e.metaId));
    if (!meta) {
      console.error('❌ Meta não encontrada:', e.metaId);
      return;
    }
    // Corrigir: usar mes_id em vez de id
    const mes = meta.meses.find((m) => (m as any).mes_id === e.mesId);
    if (!mes) {
      console.error('❌ Mês não encontrado:', e.mesId);
      return;
    }

    console.log('📊 Meta e mês encontrados:', {
      metaId: meta.id,
      mesId: e.mesId,
      statusAtual: mes.status,
    });

    // Atualizar localmente primeiro
    mes.status = e.status;

    // Usar o endpoint específico para atualizar o status
    console.log('📤 Chamando updateStatusMes:', {
      metaId: Number(meta.id),
      mesId: e.mesId,
      status: e.status,
    });
    this.metasService
      .updateStatusMes(Number(meta.id), e.mesId, e.status)
      .subscribe({
        next: (metaAtualizada) => {
          console.log('✅ updateStatusMes sucesso:', metaAtualizada);
          // Recarregar todas as metas para garantir sincronização
          this.reloadMetas();
        },
        error: (error) => {
          console.error('❌ Erro ao alterar status:', error);
          alert('Erro ao alterar status. Tente novamente.');
        },
      });
  }

  onSalvarValorMes(e: {
    metaId: number | string;
    mesId: number;
    valor: number;
  }) {
    // console.log('🔍 DEBUG: onSalvarValorMes - INÍCIO:', {
    //   metaId: e.metaId,
    //   mesId: e.mesId,
    //   valor: e.valor,
    // });

    const meta = this.metas.find((m) => m.id == e.metaId);
    if (!meta) return;

    // console.log('🔍 DEBUG: onSalvarValorMes - META ENCONTRADA:', {
    //   metaId: meta.id,
    //   metaNome: meta.nome,
    //   valorAtualAntes: meta.valorAtual,
    // });

    const i = meta.meses.findIndex((m) => (m as any).mes_id === e.mesId);
    if (i === -1) return;

    // Determinar o novo status baseado no valor
    const novoStatus = e.valor > 0 ? 'Programado' : 'Vazio';

    // Atualizar localmente primeiro
    meta.meses[i].valor = e.valor;
    meta.meses[i].status = novoStatus;

    // console.log('🔍 DEBUG: onSalvarValorMes - ANTES DE CHAMAR updateMes:', {
    //   metaId: meta.id,
    //   metaNome: meta.nome,
    //   valorAtualAntes: meta.valorAtual,
    //   mesId: e.mesId,
    //   valorNovo: e.valor,
    //   novoStatus: novoStatus,
    // });

    // Usar o endpoint específico para atualizar o valor do mês
    this.metasService.updateMes(Number(meta.id), e.mesId, e.valor).subscribe({
      next: (metaAtualizada) => {
        // console.log('🔍 DEBUG: onSalvarValorMes - updateMes SUCESSO:', {
        //   metaId: metaAtualizada.id,
        //   metaNome: metaAtualizada.nome,
        //   valorAtualRetornado: metaAtualizada.valorAtual,
        // });

        // Também atualizar o status se necessário
        if (novoStatus !== 'Vazio') {
          this.metasService
            .updateStatusMes(Number(meta.id), e.mesId, novoStatus)
            .subscribe({
              next: (statusAtualizado) => {
                // console.log(
                //   '🔍 DEBUG: onSalvarValorMes - updateStatusMes SUCESSO:',
                //   {
                //     metaId: statusAtualizado.id,
                //     metaNome: statusAtualizado.nome,
                //     valorAtualRetornado: statusAtualizado.valorAtual,
                //   }
                // );
                this.reloadMetas();
              },
              error: (error) => {
                console.error('❌ Erro ao atualizar status:', error);
                this.reloadMetas();
              },
            });
        } else {
          this.reloadMetas();
        }
      },
      error: (error) => {
        console.error('❌ Erro ao salvar valor do mês:', error);
        alert('Erro ao salvar valor. Tente novamente.');
      },
    });
  }

  // Receber evento quando uma meta for completada (atingir 100%)
  onMetaCompleta(event: {
    metaId: string | number;
    metaNome: string;
    valorMeta: number;
  }): void {
    // Aqui você pode adicionar lógica adicional se necessário
    // Por exemplo, mostrar uma notificação, salvar estatísticas, etc.
  }

  private valorAtualCache = new Map<number | string, number>();

  onValorAtualFixado(e: { id: string | number; valor: number }) {
    this.valorAtualCache.set(e.id, e.valor);
  }
}
