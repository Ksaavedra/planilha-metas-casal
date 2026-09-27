import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { FeedbackService } from '@core/services/feedback/feedback.service';
import { FeedbackModalComponent } from './feedback-modal.component';

describe('FeedbackModalComponent', () => {
  let fixture: ComponentFixture<FeedbackModalComponent>;
  let component: FeedbackModalComponent;
  let feedbackService: { enviar: jest.Mock };
  let dialogRef: { close: jest.Mock };

  async function criar(data: unknown = { pagina: '/despesas' }) {
    feedbackService = { enviar: jest.fn().mockReturnValue(of({ id: 1 })) };
    dialogRef = { close: jest.fn() };

    await TestBed.configureTestingModule({
      declarations: [FeedbackModalComponent],
      imports: [FormsModule],
      providers: [
        { provide: FeedbackService, useValue: feedbackService },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const el = () => fixture.nativeElement as HTMLElement;
  const botaoEnviar = () => el().querySelector('.btn-enviar') as HTMLButtonElement;

  beforeEach(async () => {
    await criar();
  });

  it('mostra 5 opções de nota e começa sem nota selecionada', () => {
    expect(el().querySelectorAll('.nota').length).toBe(5);
    expect(component.nota).toBeNull();
    expect(el().querySelector('.nota-label')?.textContent).toContain('Escolha uma carinha');
  });

  it('desabilita Enviar e esconde o comentário até escolher uma nota', () => {
    expect(botaoEnviar().disabled).toBe(true);
    expect(el().querySelector('.comentario')).toBeNull();
  });

  it('selecionar nota destaca a opção, mostra o rótulo e libera o envio', () => {
    (el().querySelectorAll('.nota')[3] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(component.nota).toBe(4);
    expect(component.labelNotaSelecionada).toBe('Bom');
    expect(el().querySelectorAll('.nota.is-active').length).toBe(1);
    expect(el().querySelector('.comentario')).toBeTruthy();
    expect(botaoEnviar().disabled).toBe(false);
  });

  it('já vem com a tela atual selecionada', () => {
    const select = el().querySelector('.tela-select') as HTMLSelectElement;

    expect(component.tela.label).toBe('Despesas');
    expect(select.options[select.selectedIndex].textContent?.trim()).toBe('Despesas');
  });

  it('permite trocar a tela do feedback', async () => {
    const select = el().querySelector('.tela-select') as HTMLSelectElement;
    const indiceMetas = component.telas.findIndex((t) => t.label === 'Metas');

    select.value = select.options[indiceMetas].value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();

    component.selecionarNota(4);
    component.enviar();

    expect(feedbackService.enviar).toHaveBeenCalledWith(
      expect.objectContaining({ pagina: 'Metas' }),
    );
  });

  it('enviar manda nota, comentário sem espaços e nome da tela, e fecha como enviado', () => {
    component.selecionarNota(5);
    component.comentario = '  Muito bom!  ';

    component.enviar();

    expect(feedbackService.enviar).toHaveBeenCalledWith({
      nota: 5,
      comentario: 'Muito bom!',
      pagina: 'Despesas',
    });
    expect(dialogRef.close).toHaveBeenCalledWith('enviado');
    expect(component.enviando).toBe(false);
  });

  it('enviar sem comentário não manda texto vazio', () => {
    component.selecionarNota(2);
    component.comentario = '   ';

    component.enviar();

    expect(feedbackService.enviar).toHaveBeenCalledWith({
      nota: 2,
      comentario: undefined,
      pagina: 'Despesas',
    });
  });

  it('enviar não faz nada sem nota', () => {
    component.enviar();

    expect(feedbackService.enviar).not.toHaveBeenCalled();
  });

  it('enviar não duplica o envio enquanto está enviando', () => {
    component.selecionarNota(3);
    component.enviando = true;

    component.enviar();

    expect(feedbackService.enviar).not.toHaveBeenCalled();
  });

  it('mostra erro e mantém o modal aberto se o envio falhar', () => {
    feedbackService.enviar.mockReturnValue(throwError(() => new Error('offline')));
    component.selecionarNota(1);

    component.enviar();
    fixture.detectChanges();

    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.enviando).toBe(false);
    expect(el().querySelector('.erro')?.textContent).toContain('Não foi possível enviar');
  });

  it('escolher outra nota limpa a mensagem de erro', () => {
    component.erro = 'falhou';

    component.selecionarNota(4);

    expect(component.erro).toBeNull();
  });

  it('Agora não e o X fecham como adiado', () => {
    (el().querySelector('.btn-cancelar') as HTMLButtonElement).click();
    (el().querySelector('.modal-close') as HTMLButtonElement).click();

    expect(dialogRef.close).toHaveBeenCalledTimes(2);
    expect(dialogRef.close).toHaveBeenCalledWith('adiado');
  });

  it('clicar fora do modal adia, clicar dentro não', () => {
    const overlay = el().querySelector('.modal-overlay') as HTMLElement;
    const conteudo = el().querySelector('.modal-content') as HTMLElement;

    component.onOverlayClick({ target: conteudo, currentTarget: overlay } as unknown as Event);
    expect(dialogRef.close).not.toHaveBeenCalled();

    component.onOverlayClick({ target: overlay, currentTarget: overlay } as unknown as Event);
    expect(dialogRef.close).toHaveBeenCalledWith('adiado');
  });

  it('sem dados do dialog usa "Sistema em geral"', async () => {
    TestBed.resetTestingModule();
    await criar(null);
    component.selecionarNota(5);

    component.enviar();

    expect(feedbackService.enviar).toHaveBeenCalledWith({
      nota: 5,
      comentario: undefined,
      pagina: 'Sistema em geral',
    });
  });
});
