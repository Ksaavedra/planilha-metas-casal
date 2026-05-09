import { TestBed } from '@angular/core/testing';
import { DespesasService } from './despesas.service';
import { Despesa } from '@app/core/interfaces/despesas/despesas';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { environment } from 'src/environments';

describe('DespesasService', () => {
  let service: DespesasService;
  let httpMock: HttpTestingController;

  const baseUrl = environment.apiUrl;

  const mockDespesa: Despesa = {
    id: 1,
    pessoa: 'Kelly',
    natureza: 'fixa',
    categoria: 'Casa',
    descricao: 'Aluguel',
    valor: 1500,
    data: '2025-01-10',
    ano: 2025,
    mes: 1,
  };

  const mockCreate = {
    pessoa: 'Casal',
    natureza: 'fixa' as const,
    categoria: 'Casa',
    descricao: 'Condomínio',
    valor: 400,
    data: null as string | null,
    ano: 2025,
    mes: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DespesasService],
    });
    service = TestBed.inject(DespesasService);
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

  describe('getDespesas', () => {
    it('chama API com ano e mês', () => {
      const rows = [mockDespesa];
      service.getDespesas({ ano: 2025, mes: 3 }).subscribe((r) => {
        expect(r).toEqual(rows);
      });

      const req = httpMock.expectOne(`${baseUrl}/despesas?ano=2025&mes=3`);
      expect(req.request.method).toBe('GET');
      req.flush(rows);
    });

    it('propaga erro', () => {
      service.getDespesas({ ano: 2025, mes: 1 }).subscribe({
        error: (e) => {
          expect(e).toBe(500);
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/despesas?ano=2025&mes=1`);
      req.flush('Erro', { status: 500, statusText: 'Erro' });
    });
  });

  describe('getDespesa', () => {
    it('chama /despesas/:id', () => {
      service.getDespesa(1).subscribe((r) => expect(r).toEqual(mockDespesa));

      const req = httpMock.expectOne(`${baseUrl}/despesas/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDespesa);
    });
  });

  describe('createDespesa', () => {
    it('deve fazer POST', () => {
      const created = { ...mockDespesa, id: 2 };

      service
        .createDespesa(mockCreate)
        .subscribe((r) => expect(r).toEqual(created));

      const req = httpMock.expectOne(`${baseUrl}/despesas`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockCreate);
      req.flush(created);
    });
  });

  describe('updateDespesa', () => {
    it('deve fazer UPDATE PATCH', () => {
      const up = { valor: 100 };

      service.updateDespesa(1, up).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/despesas/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(up);
      req.flush({});
    });
  });

  describe('deleteDespesa', () => {
    it('deve fazer DELETE', () => {
      service.deleteDespesa(1).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/despesas/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
