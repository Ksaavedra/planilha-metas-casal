import { Component, OnInit } from '@angular/core';
import { MetasService } from '../../../../core/services/metas/metas.service';
import {
  Meta,
  MetaExtended,
  ModalEdicao,
} from '../../../../core/interfaces/mes-meta';

type StatusMeta = 'Programado' | 'Pago' | 'Vazio' | 'Finalizado';

@Component({
  selector: 'app-metas-page',
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

  constructor(private metasService: MetasService) {}

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
      console.log('metas', metas);

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
    this.metasService.getMetas().subscribe((metas: Meta[]) => {
      const metasValidas = metas.filter((meta) => {
        const idValido =
          meta.id && meta.id !== 0 && String(meta.id).trim() !== '';
        const nomeValido =
          meta.nome && meta.nome.trim().length > 0 && meta.nome !== 'undefined';
        return idValido && nomeValido;
      });

      this.metas = metasValidas.map((m) => {
        const metaExtended: MetaExtended = {
          ...m,
          id: m.id,
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

  private toNum(v: any): number {
    return typeof v === 'number' ? v : Number(v ?? 0) || 0;
  }

  setHeaderMesesFromData(): void {
    const nomes = this.metas.flatMap((m) => m.meses?.map((x) => x.nome) ?? []);
    const unicos = Array.from(new Set(nomes));
    this.meses = unicos.length ? unicos : [...this.MESES_PADRAO];
  }

  private normalizeMeses(meta: MetaExtended): void {
    const header = this.meses.length ? this.meses : this.MESES_PADRAO;
    const byName = new Map((meta.meses ?? []).map((m) => [m.nome, m]));
    meta.meses = header.map(
      (nome, i) =>
        byName.get(nome) ?? { id: i + 1, nome, valor: 0, status: 'Vazio' }
    );
  }

  private recalcResumo(): void {
    // Calcular todos os totais de uma vez
    this.totalValorMetaView = this.metas.reduce(
      (t, m) => t + (Number(m.valorMeta) || 0),
      0
    );

    this.totalValorPorMesView = this.metas.reduce(
      (t, m) => t + (Number(m.valorPorMes) || 0),
      0
    );

    this.totalMesesNecessariosView = this.metas.reduce(
      (t, m) => t + (Number(m.mesesNecessarios) || 0),
      0
    );

    this.totalValorAtualView = this.metas.reduce(
      (t, m) => t + (Number(m.valorAtual) || 0),
      0
    );

    this.totalContribuicoesView = this.metas.reduce(
      (total, meta) => total + this.getTotalContribuicoesMeta(meta as any),
      0
    );

    // Calcular percentual pago (considerando "quanto já temos" + "quanto já pagamos")
    const totalRealizado = this.metas.reduce((t, m) => {
      const valorAtual = Number(m.valorAtual) || 0; // "Quanto já temos"
      const valorPago = (m.meses ?? [])
        .filter((x) => x.status === 'Pago')
        .reduce((s, x) => s + (Number(x.valor) || 0), 0); // "Quanto já pagamos"
      return t + valorAtual + valorPago;
    }, 0);

    this.percentualPagoView =
      this.totalValorMetaView > 0
        ? Number(((totalRealizado * 100) / this.totalValorMetaView).toFixed(2))
        : 0;
  }

  getTotalContribuicoesMeta(meta: Meta): number {
    if (!meta.meses) return 0;
    return meta.meses.reduce((total, mes) => total + mes.valor, 0);
  }

  // Calcular progresso real de uma meta (quanto já temos + quanto já pagamos)
  getProgressoRealMeta(meta: MetaExtended): number {
    const valorMeta = Number(meta.valorMeta) || 0;
    if (valorMeta <= 0) return 0;

    const valorAtual = Number(meta.valorAtual) || 0; // "Quanto já temos"
    const valorPago = (meta.meses ?? [])
      .filter((x) => x.status === 'Pago')
      .reduce((s, x) => s + (Number(x.valor) || 0), 0); // "Quanto já pagamos"

    const totalRealizado = valorAtual + valorPago;
    return Number(((totalRealizado * 100) / valorMeta).toFixed(2));
  }

  // Calcular valor que ainda falta pagar
  getValorFaltanteMeta(meta: MetaExtended): number {
    const valorMeta = Number(meta.valorMeta) || 0;
    const valorAtual = Number(meta.valorAtual) || 0; // "Quanto já temos"
    const valorPago = (meta.meses ?? [])
      .filter((x) => x.status === 'Pago')
      .reduce((s, x) => s + (Number(x.valor) || 0), 0); // "Quanto já pagamos"

    const totalRealizado = valorAtual + valorPago;
    return Math.max(0, valorMeta - totalRealizado);
  }

  // Calcular valor total realizado (quanto já temos + quanto já pagamos)
  getValorRealizadoMeta(meta: MetaExtended): number {
    const valorAtual = Number(meta.valorAtual) || 0; // "Quanto já temos"
    const valorPago = (meta.meses ?? [])
      .filter((x) => x.status === 'Pago')
      .reduce((s, x) => s + (Number(x.valor) || 0), 0); // "Quanto já pagamos"

    return valorAtual + valorPago;
  }

  adicionarMeta(): void {
    if (this.metas.length >= 15) return;

    const header = this.meses.length ? this.meses : this.MESES_PADRAO;

    // Gerar nome padrão para a nova meta
    const proximoNumero = this.metas.length + 1;
    const nomePadrao = `Sua ${proximoNumero}ª Meta aqui`;

    const body = {
      nome: nomePadrao, // Usar nome padrão em vez de vazio
      valorMeta: 0,
      valorPorMes: 0,
      mesesNecessarios: 0,
      valorAtual: 0,
      meses: header.map((nome, i) => ({
        id: i + 1,
        nome,
        valor: 0,
        status: 'Vazio' as StatusMeta,
      })),
    };

    // Usar POST simples para deixar o json-server gerar o ID
    this.metasService.createMeta(body).subscribe({
      next: (_created) => {
        // Recarregar as metas do servidor para ter o ID correto
        this.reloadMetas();
      },
      error: (_e) => {
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
        error: (_e) => {
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
      error: (_e) => {
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
      error: (_e) => {
        // Erro ao remover meta
      },
    });
  }

  onAlterarStatus(e: {
    metaId: number | string;
    mesId: number;
    status: StatusMeta;
  }) {
    const meta = this.metas.find((m) => String(m.id) === String(e.metaId));
    if (!meta) return;
    const mes = meta.meses.find((m) => m.id === e.mesId);
    if (!mes) return;

    mes.status = e.status;
    this.metasService
      .updateMeta(meta.id, { meses: meta.meses.map((m) => ({ ...m })) })
      .subscribe(() => {
        this.recalcResumo();
      });
  }

  onSalvarValorMes(e: {
    metaId: number | string;
    mesId: number;
    valor: number;
  }) {
    const meta = this.metas.find((m) => String(m.id) === String(e.metaId));
    if (!meta) return;
    const i = meta.meses.findIndex((m) => m.id === e.mesId);
    if (i < 0) return;

    meta.meses[i].valor = e.valor;
    meta.meses[i].status = e.valor > 0 ? 'Programado' : 'Vazio';
    this.metasService
      .updateMeta(meta.id, { meses: meta.meses.map((m) => ({ ...m })) })
      .subscribe(() => {
        this.recalcResumo();
      });
  }

  // Receber evento quando uma meta for completada (atingir 100%)
  onMetaCompleta(_event: {
    metaId: string | number;
    metaNome: string;
    valorMeta: number;
  }): void {
    // Aqui você pode adicionar lógica adicional se necessário
    // Por exemplo, mostrar uma notificação, salvar estatísticas, etc.
  }
}
