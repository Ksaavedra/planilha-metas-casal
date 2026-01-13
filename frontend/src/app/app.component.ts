import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalAdicionarMetaService } from './core/services/modal-adicionar-meta.service';
import { ModalEditarValorService } from './core/services/modal-editar-valor.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    standalone: false
})
export class AppComponent implements OnInit, OnDestroy {
  modalState = {
    isOpen: false,
    nome: '',
    valorMetaRaw: '',
    valorPorMesRaw: '',
    valorAtualRaw: '',
    temValorAtual: false,
    icon: 'bi-bullseye',
  };

  sucessoState = {
    isOpen: false,
    title: '',
    message: '',
  };

  confirmarDeleteState = {
    isOpen: false,
    message: '',
    metaId: null as number | null,
    metaNome: '',
  };

  sucessoDeleteState = {
    isOpen: false,
  };

  editarValorState = {
    isOpen: false,
    meta: null as any,
    mesId: -1,
    valor: 0,
    meses: [] as string[],
  };

  private subscription?: Subscription;
  private sucessoSubscription?: Subscription;
  private confirmarDeleteSubscription?: Subscription;
  private sucessoDeleteSubscription?: Subscription;
  private editarValorSubscription?: Subscription;

  constructor(
    private modalService: ModalAdicionarMetaService,
    private modalEditarValorService: ModalEditarValorService
  ) {}

  ngOnInit(): void {
    this.subscription = this.modalService.state$.subscribe((state) => {
      this.modalState = { ...state };
    });

    this.sucessoSubscription = this.modalService.sucessoState$.subscribe(
      (state) => {
        this.sucessoState = { ...state };
      }
    );

    this.confirmarDeleteSubscription =
      this.modalService.confirmarDeleteState$.subscribe((state) => {
        this.confirmarDeleteState = { ...state };
      });

    this.sucessoDeleteSubscription =
      this.modalService.sucessoDeleteState$.subscribe((state) => {
        this.sucessoDeleteState = { ...state };
      });

    this.editarValorSubscription =
      this.modalEditarValorService.state$.subscribe((state) => {
        this.editarValorState = { ...state };
      });

    // O elaborando-metas já está escutando confirmDelete$ diretamente
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.sucessoSubscription?.unsubscribe();
    this.confirmarDeleteSubscription?.unsubscribe();
    this.sucessoDeleteSubscription?.unsubscribe();
    this.editarValorSubscription?.unsubscribe();
  }

  onNomeChange(value: string): void {
    this.modalService.updateNome(value);
  }

  onValorMetaChange(value: string): void {
    this.modalService.updateValorMetaRaw(value);
  }

  onValorPorMesChange(value: string): void {
    this.modalService.updateValorPorMesRaw(value);
  }

  onValorAtualChange(value: string): void {
    this.modalService.updateValorAtualRaw(value);
  }

  onTemValorAtualChange(value: boolean): void {
    this.modalService.updateTemValorAtual(value);
  }

  onIconChange(value: string): void {
    this.modalService.updateIcon(value);
  }

  onValorMetaChangeEvent(_event: Event): void {
    // Evento change - pode ser usado para formatação se necessário
  }

  onValorPorMesChangeEvent(_event: Event): void {
    // Evento change - pode ser usado para formatação se necessário
  }

  onValorAtualChangeEvent(_event: Event): void {
    // Evento change - pode ser usado para formatação se necessário
  }

  onSave(): void {
    // Emite evento de save - o elaborando-metas vai escutar e processar
    this.modalService.triggerSave();
  }

  onCancel(): void {
    this.modalService.close();
    this.modalService.reset();
  }

  onCloseSucesso(): void {
    // O serviço já fecha e reseta o modal de adicionar automaticamente
    this.modalService.closeSucesso();
  }

  onConfirmDelete(): void {
    console.log('🟢 AppComponent.onConfirmDelete() chamado!');
    this.modalService.confirmDelete();
  }

  onCancelDelete(): void {
    this.modalService.closeConfirmarDelete();
  }

  onCloseSucessoDelete(): void {
    this.modalService.closeSucessoDelete();
  }

  onValorChange(value: number): void {
    this.modalEditarValorService.updateValor(value);
  }

  onSaveEditarValor(): void {
    this.modalEditarValorService.triggerSave();
  }

  onCancelEditarValor(): void {
    this.modalEditarValorService.close();
    this.modalEditarValorService.reset();
  }
}
