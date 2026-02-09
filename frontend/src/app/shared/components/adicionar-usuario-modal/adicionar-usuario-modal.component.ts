import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ModalAdicionarUsuarioService } from '../../../core/services/modal-adicionar-usuario.service';
import { ReceitasMensaisService } from '../../../core/services/receitas-mensais/receitas-mensais.service';

@Component({
  selector: 'app-adicionar-usuario-modal',
  templateUrl: './adicionar-usuario-modal.component.html',
  styleUrls: ['./adicionar-usuario-modal.component.scss'],
  standalone: false,
})
export class AdicionarUsuarioModalComponent implements OnInit, OnDestroy {
  isOpen = false;
  isEditMode = false;
  receitaId: number | undefined;
  nomeUsuario = '';
  valorSalarioRaw = '';
  mesesSelecionados: number[] = [];
  ano: number = new Date().getFullYear();

  nomeFormControl = new FormControl('', [
    Validators.required,
    Validators.minLength(2),
  ]);

  /** Sugestões só da API (pessoas que existem em receitas). Campo aceita qualquer nome digitado. */
  options: string[] = [];
  filteredOptions!: Observable<string[]>;

  valorSalarioFormControl = new FormControl('', [
    Validators.required,
    this.valorGreaterThanZero,
  ]);

  meses = [
    { numero: 1, nome: 'Janeiro' },
    { numero: 2, nome: 'Fevereiro' },
    { numero: 3, nome: 'Março' },
    { numero: 4, nome: 'Abril' },
    { numero: 5, nome: 'Maio' },
    { numero: 6, nome: 'Junho' },
    { numero: 7, nome: 'Julho' },
    { numero: 8, nome: 'Agosto' },
    { numero: 9, nome: 'Setembro' },
    { numero: 10, nome: 'Outubro' },
    { numero: 11, nome: 'Novembro' },
    { numero: 12, nome: 'Dezembro' },
  ];

  anosDisponiveis: number[] = [];

  /** No modo editar: valor ao abrir o modal; o botão Atualizar só habilita se o valor mudar. */
  private initialValorEdit = '';
  private editInitialsCaptured = false;

  private subscriptions = new Subscription();

  constructor(
    private modalService: ModalAdicionarUsuarioService,
    private receitasMensaisService: ReceitasMensaisService,
    private cdr: ChangeDetectorRef,
  ) {
    // Padrão Angular Material: Observable + startWith para exibir opções ao focar
    this.filteredOptions = this.nomeFormControl.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value || '')),
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.options.filter((option) =>
      option.toLowerCase().includes(filterValue),
    );
  }

  /** Title Case: primeira letra de cada palavra maiúscula. Ex: "Kelly Silva". */
  private toTitleCase(value: string): string {
    if (!value || !value.trim()) return value;
    return value
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private carregarPessoasDaApi(): void {
    // Não usar cache antigo: quem apagou os dados não deve ver nomes que não existem mais.
    // Mostra o cache primeiro (inclui quem acabou de adicionar); a API atualiza a lista em seguida.
    this.options = this.receitasMensaisService.getPessoasCache();
    const valorAtual = this.nomeFormControl.value || '';
    this.nomeFormControl.setValue(valorAtual, { emitEvent: false });
    this.cdr.markForCheck();

    this.receitasMensaisService.loadPessoasDistintas().subscribe((pessoas) => {
      const nomes = (pessoas || [])
        .map((p) => this.toTitleCase((p || '').trim()))
        .filter(Boolean);
      // Remove duplicatas por nome normalizado (ex.: "kelly" e "Kelly" da API → só "Kelly")
      const vistos = new Set<string>();
      this.options = nomes
        .filter((n) => {
          const key = n.toLowerCase();
          if (vistos.has(key)) return false;
          vistos.add(key);
          return true;
        })
        .sort((a, b) => a.localeCompare(b));
      this.nomeFormControl.setValue(this.nomeFormControl.value || '', {
        emitEvent: false,
      });
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    // Gerar lista de anos (ano atual - 3 até ano atual + 3)
    const anoAtual = new Date().getFullYear();
    for (let i = anoAtual - 3; i <= anoAtual + 3; i++) {
      this.anosDisponiveis.push(i);
    }

    // Pré-carregar pessoas da API (autocomplete já tem lista ao abrir o modal)
    this.carregarPessoasDaApi();

    // Sincroniza valor com o modal ao digitar/selecionar
    this.subscriptions.add(
      this.nomeFormControl.valueChanges.subscribe((value) => {
        this.modalService.updateNomeUsuario(value || '');
      }),
    );

    this.subscriptions.add(
      this.modalService.state$.subscribe((state) => {
        this.isOpen = state.isOpen;
        this.isEditMode = state.isEditMode;
        this.receitaId = state.receitaId;
        this.nomeUsuario = state.nomeUsuario;
        this.valorSalarioRaw = state.valorSalarioRaw;
        this.mesesSelecionados = state.mesesSelecionados;
        this.ano = state.ano;

        if (state.isOpen) {
          this.nomeFormControl.setValue(state.nomeUsuario, {
            emitEvent: false,
          });
          this.valorSalarioFormControl.setValue(state.valorSalarioRaw, {
            emitEvent: false,
          });
          if (state.isEditMode && !this.editInitialsCaptured) {
            this.initialValorEdit = state.valorSalarioRaw;
            this.editInitialsCaptured = true;
          }
          // Modal Adicionar: atualizar lista da API (ex.: se excluiu Carla, ela some)
          if (!state.isEditMode) this.carregarPessoasDaApi();
        } else {
          this.nomeFormControl.reset('', { emitEvent: false });
          this.valorSalarioFormControl.reset('', { emitEvent: false });
          this.editInitialsCaptured = false;
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  valorGreaterThanZero(control: FormControl): { [key: string]: any } | null {
    if (!control.value) return null;
    const valor = parseFloat(String(control.value).replace(',', '.'));
    return valor > 0 ? null : { mustBeGreaterThanZero: true };
  }

  onNomeBlur(): void {
    const valor = this.nomeFormControl.value || '';
    const formatado = this.toTitleCase(valor);
    if (formatado !== valor) {
      this.nomeFormControl.setValue(formatado);
    }
  }

  onValorSalarioChange(valor: string): void {
    const valorLimpo = String(valor || '').replace(/[^0-9,\.]/g, '');
    this.modalService.updateValorSalarioRaw(valorLimpo);
    this.valorSalarioFormControl.setValue(valorLimpo);
  }

  validarApenasNumeros(event: KeyboardEvent): void {
    const teclasControle = [
      'Backspace',
      'Delete',
      'Tab',
      'Enter',
      'Escape',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
      'Ctrl',
      'Alt',
      'Shift',
      'Meta',
      'Cmd',
    ];

    if (teclasControle.includes(event.key)) {
      return;
    }

    if (event.code.startsWith('Numpad')) {
      if (
        event.code.includes('Comma') ||
        event.code.includes('Period') ||
        (event.code >= 'Numpad0' && event.code <= 'Numpad9')
      ) {
        return;
      }
    }

    const teclasPermitidas = /^[0-9,\.]$/;
    if (!teclasPermitidas.test(event.key)) {
      event.preventDefault();
    }
  }

  toggleMes(mes: number): void {
    this.modalService.toggleMes(mes);
  }

  isMesSelecionado(mes: number): boolean {
    return this.mesesSelecionados.includes(mes);
  }

  selecionarTodosMeses(): void {
    this.modalService.selecionarTodosMeses();
  }

  desmarcarTodosMeses(): void {
    this.modalService.desmarcarTodosMeses();
  }

  getTodosMesesSelecionados(): boolean {
    return this.mesesSelecionados.length === 12;
  }

  parseNumeroBR(valor: string): number {
    if (!valor || valor.trim() === '') return 0;

    let limpo = String(valor)
      .trim()
      .replace(/[^\d,\.]/g, '');

    if (!limpo) return 0;

    if (limpo.includes(',')) {
      limpo = limpo.replace(/\./g, '');
      limpo = limpo.replace(',', '.');
      const resultado = parseFloat(limpo);
      return isNaN(resultado) ? 0 : resultado;
    }

    if (limpo.includes('.')) {
      const partes = limpo.split('.');
      if (partes.length > 2) {
        const decimal = partes.pop();
        limpo = partes.join('') + '.' + decimal;
      }
      const resultado = parseFloat(limpo);
      return isNaN(resultado) ? 0 : resultado;
    }

    const resultado = parseFloat(limpo);
    return isNaN(resultado) ? 0 : resultado;
  }

  onAnoChange(ano: number): void {
    this.modalService.updateAno(ano);
  }

  /** No adicionar: nome, valor e meses válidos. No editar: só valor válido e valor alterado. */
  get podeSalvar(): boolean {
    if (this.isEditMode) {
      const valorValido = this.valorSalarioFormControl.valid;
      const valorMudou = this.valorSalarioRaw !== this.initialValorEdit;
      return valorValido && valorMudou;
    }
    const valorEMesesOk =
      this.valorSalarioFormControl.valid && this.mesesSelecionados.length > 0;
    return this.nomeFormControl.valid && valorEMesesOk;
  }

  onSave(): void {
    if (this.nomeFormControl.invalid || this.valorSalarioFormControl.invalid) {
      this.nomeFormControl.markAllAsTouched();
      this.valorSalarioFormControl.markAllAsTouched();
      return;
    }

    if (!this.isEditMode && this.mesesSelecionados.length === 0) {
      alert('Por favor, selecione pelo menos um mês.');
      return;
    }

    const nomeUsuario = this.toTitleCase(this.nomeUsuario.trim());
    const valorSalario = this.parseNumeroBR(this.valorSalarioRaw);

    this.modalService.triggerSave(
      nomeUsuario,
      valorSalario,
      this.mesesSelecionados,
      this.ano,
      this.isEditMode ? this.receitaId : undefined,
    );
    this.modalService.close();
    this.modalService.reset();
  }

  onCancel(): void {
    this.modalService.close();
    this.modalService.reset();
  }

  stop(event: Event): void {
    event.stopPropagation();
  }
}
