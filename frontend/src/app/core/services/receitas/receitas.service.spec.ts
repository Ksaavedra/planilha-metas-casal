import { TestBed } from '@angular/core/testing';
import { ReceitasService } from './receitas.service';
import { Receita } from '@app/core/interfaces/receitas/receitas';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { environment } from 'src/environments';

describe('ReceitasService', () => {
  let service: ReceitasService;
  let httpMock: HttpTestingController;

  const baseUrl = environment.apiUrl;

  const mockReceitas: Receita = {
    id: 1,
    pessoa: 'Kelly',
    natureza: 'fixa',
    categoria: 'Fixa',
    valor: 2000,
    data: '2026-01-01',
    ano: 2026,
    mes: 1,
  };

  const mockCreate = {
    pessoa: 'Casal',
    natureza: 'fixa' as const,
    categoria: 'Salário',
    valor: 2000,
    data: null as string | null,
    ano: 2026,
    mes: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReceitasService],
    });
    service = TestBed.inject(ReceitasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Inicialização', () => {
    it('deve instanciar', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('getReceitas', () => {
    it('deve fazer GET com params', () => {
      const rows = [mockReceitas];

      service.getReceitas({ ano: 2026, mes: 1 }).subscribe((r) => {
        expect(r).toEqual(rows);
      });

      const req = httpMock.expectOne(`${baseUrl}/receitas?ano=2026&mes=1`);

      expect(req.request.method).toBe('GET');

      req.flush(rows);
    });

    it('deve propagar erro', () => {
      service.getReceitas({ ano: 2026, mes: 1 }).subscribe({
        error: (e) => {
          expect(e).toBe(500);
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/receitas?ano=2026&mes=1`);

      req.flush('Erro', { status: 500, statusText: 'Erro' });
    });
  });

  describe('getReceita', () => {
    it('deve fazer GET por id', () => {
      service.getReceita(1).subscribe((r) => {
        expect(r).toEqual(mockReceitas);
      });

      const req = httpMock.expectOne(`${baseUrl}/receitas/1`);

      expect(req.request.method).toBe('GET');

      req.flush(mockReceitas);
    });
  });

  describe('createReceita', () => {
    it('deve fazer POST', () => {
      const created = { ...mockReceitas, id: 2 };

      service.createReceita(mockCreate).subscribe((r) => {
        expect(r).toEqual(created);
      });

      const req = httpMock.expectOne(`${baseUrl}/receitas`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockCreate);

      req.flush(created);
    });
  });

  describe('updateReceita', () => {
    it('deve fazer PATCH', () => {
      const up = { valor: 100 };

      service.updateReceita(1, up).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/receitas/1`);

      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(up);

      req.flush({});
    });
  });

  describe('deleteReceita', () => {
    it('deve fazer DELETE', () => {
      service.deleteReceita(1).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/receitas/1`);

      expect(req.request.method).toBe('DELETE');

      req.flush(null);
    });
  });
});
