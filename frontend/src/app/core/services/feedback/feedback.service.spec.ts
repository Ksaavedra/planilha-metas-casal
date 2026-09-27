import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../api/api.service';
import { FEEDBACK_INTERVALO_DIAS, FeedbackService } from './feedback.service';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let apiService: { post: jest.Mock };

  const DIA_MS = 24 * 60 * 60 * 1000;
  const agora = new Date('2026-09-26T12:00:00.000Z');
  const chave = 'feedback_proximo_7';

  beforeEach(() => {
    localStorage.clear();
    apiService = { post: jest.fn() };

    TestBed.configureTestingModule({
      providers: [FeedbackService, { provide: ApiService, useValue: apiService }],
    });

    service = TestBed.inject(FeedbackService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it('enviar faz POST em /feedback', () => {
    const resposta = { id: 1, nota: 5, comentario: null, pagina: null, createdAt: '' };
    apiService.post.mockReturnValue(of(resposta));

    let recebido: unknown;
    service.enviar({ nota: 5 }).subscribe((r) => (recebido = r));

    expect(apiService.post).toHaveBeenCalledWith('/feedback', { nota: 5 });
    expect(recebido).toEqual(resposta);
  });

  describe('deveExibir', () => {
    it('no primeiro acesso não exibe e agenda para daqui a 15 dias', () => {
      expect(service.deveExibir(7, agora)).toBe(false);

      const esperado = new Date(agora.getTime() + FEEDBACK_INTERVALO_DIAS * DIA_MS);
      expect(localStorage.getItem(chave)).toBe(esperado.toISOString());
    });

    it('não exibe antes da data agendada', () => {
      localStorage.setItem(chave, new Date(agora.getTime() + DIA_MS).toISOString());

      expect(service.deveExibir(7, agora)).toBe(false);
    });

    it('exibe quando a data agendada chegou', () => {
      localStorage.setItem(chave, agora.toISOString());

      expect(service.deveExibir(7, agora)).toBe(true);
    });

    it('trata valor inválido salvo como primeiro acesso', () => {
      localStorage.setItem(chave, 'abc');

      expect(service.deveExibir(7, agora)).toBe(false);
      expect(Date.parse(localStorage.getItem(chave)!)).toBeGreaterThan(agora.getTime());
    });

    it('guarda a data separada por usuário', () => {
      localStorage.setItem(chave, agora.toISOString());

      expect(service.deveExibir(7, agora)).toBe(true);
      expect(service.deveExibir(8, agora)).toBe(false);
    });

    it('não exibe se o localStorage falhar', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('bloqueado');
      });
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('bloqueado');
      });

      expect(service.deveExibir(7, agora)).toBe(false);
    });
  });

  it('adiar reagenda para daqui a 15 dias', () => {
    service.adiar(7, agora);

    const esperado = new Date(agora.getTime() + FEEDBACK_INTERVALO_DIAS * DIA_MS);
    expect(localStorage.getItem(chave)).toBe(esperado.toISOString());
  });

  it('usa a data atual quando nenhuma é informada', () => {
    const antes = Date.now();

    service.adiar(7);
    expect(service.deveExibir(7)).toBe(false);

    expect(Date.parse(localStorage.getItem(chave)!)).toBeGreaterThanOrEqual(
      antes + FEEDBACK_INTERVALO_DIAS * DIA_MS,
    );
  });
});
