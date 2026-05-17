import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MetasService } from './core/services/metas/metas.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
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

  confirmarExcluirReceitaState = {
    isOpen: false,
    message: '',
  };

  sucessoExcluirReceitaState = {
    isOpen: false,
  };

  private subscription?: Subscription;
  private sucessoSubscription?: Subscription;
  private confirmarDeleteSubscription?: Subscription;
  private sucessoDeleteSubscription?: Subscription;
  private editarValorSubscription?: Subscription;
  private confirmarExcluirReceitaSubscription?: Subscription;
  private sucessoExcluirReceitaSubscription?: Subscription;

  constructor(private metasService: MetasService) {}

  ngOnInit(): void {
    this.subscription = this.metasService.state$.subscribe((state) => {
      this.modalState = { ...state };
    });

    this.sucessoSubscription = this.metasService.sucessoState$.subscribe(
      (state) => {
        this.sucessoState = { ...state };
      },
    );

    this.confirmarDeleteSubscription =
      this.metasService.confirmarDeleteState$.subscribe((state) => {
        this.confirmarDeleteState = { ...state };
      });

    this.sucessoDeleteSubscription =
      this.metasService.sucessoDeleteState$.subscribe((state) => {
        this.sucessoDeleteState = { ...state };
      });

    this.editarValorSubscription =
      this.metasService.editarValorState$.subscribe((state) => {
        this.editarValorState = { ...state };
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.sucessoSubscription?.unsubscribe();
    this.confirmarDeleteSubscription?.unsubscribe();
    this.sucessoDeleteSubscription?.unsubscribe();
    this.editarValorSubscription?.unsubscribe();
    this.confirmarExcluirReceitaSubscription?.unsubscribe();
    this.sucessoExcluirReceitaSubscription?.unsubscribe();
  }

  onNomeChange(value: string): void {
    this.metasService.updateNome(value);
  }

  onValorMetaChange(value: string): void {
    this.metasService.updateValorMetaRaw(value);
  }

  onValorPorMesChange(value: string): void {
    this.metasService.updateValorPorMesRaw(value);
  }

  onValorAtualChange(value: string): void {
    this.metasService.updateValorAtualRaw(value);
  }

  onTemValorAtualChange(value: boolean): void {
    this.metasService.updateTemValorAtual(value);
  }

  onIconChange(value: string): void {
    this.metasService.updateIcon(value);
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
    this.metasService.triggerSave();
  }

  onCancel(): void {
    this.metasService.close();
    this.metasService.reset();
  }

  onCloseSucesso(): void {
    this.metasService.closeSucesso();
  }

  onConfirmDelete(): void {
    this.metasService.confirmDelete();
  }

  onCancelDelete(): void {
    this.metasService.closeConfirmarDelete();
  }

  onCloseSucessoDelete(): void {
    this.metasService.closeSucessoDelete();
  }

  onValorChange(value: number): void {
    this.metasService.updateValorEditarValor(value);
  }

  onSaveEditarValor(): void {
    this.metasService.triggerSaveEditarValor();
  }

  onCancelEditarValor(): void {
    this.metasService.closeEditarValor();
    this.metasService.resetEditarValor();
  }
}
