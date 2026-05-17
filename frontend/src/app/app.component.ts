import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MetasService } from './core/services/metas/metas.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
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

  confirmarExcluirReceitaState = {
    isOpen: false,
    message: '',
  };

  sucessoExcluirReceitaState = {
    isOpen: false,
  };

  private sucessoSubscription?: Subscription;
  private confirmarDeleteSubscription?: Subscription;
  private sucessoDeleteSubscription?: Subscription;
  private confirmarExcluirReceitaSubscription?: Subscription;
  private sucessoExcluirReceitaSubscription?: Subscription;

  constructor(private metasService: MetasService) {}

  ngOnInit(): void {
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

  }

  ngOnDestroy(): void {
    this.sucessoSubscription?.unsubscribe();
    this.confirmarDeleteSubscription?.unsubscribe();
    this.sucessoDeleteSubscription?.unsubscribe();
    this.confirmarExcluirReceitaSubscription?.unsubscribe();
    this.sucessoExcluirReceitaSubscription?.unsubscribe();
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

}
