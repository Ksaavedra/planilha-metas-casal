import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { MetasService } from './metas.service';
import { Meta } from '../../../core/interfaces/mes-meta';

describe('MetasService', () => {
  let service: MetasService;
  let httpMock: HttpTestingController;

  const mockMeta: Meta = {
    id: 1,
    nome: 'Teste Meta',
    valorMeta: 1000,
    valorPorMes: 100,
    mesesNecessarios: 10,
    valorAtual: 500,
    meses: [
      {
        id: 1,
        nome: 'Janeiro',
        valor: 100,
        status: 'Pago',
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MetasService],
    });
    service = TestBed.inject(MetasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get metas', () => {
    const mockMetas: Meta[] = [mockMeta];

    service.getMetas().subscribe((metas) => {
      expect(metas).toEqual(mockMetas);
    });

    const req = httpMock.expectOne('http://localhost:3000/metas');
    expect(req.request.method).toBe('GET');
    req.flush(mockMetas);
  });

  it('should create meta', () => {
    const newMeta = {
      nome: 'Nova Meta',
      valorMeta: 2000,
      valorPorMes: 200,
      mesesNecessarios: 10,
      valorAtual: 0,
    };

    service.createMeta(newMeta).subscribe((meta) => {
      expect(meta).toEqual(mockMeta);
    });

    const req = httpMock.expectOne('http://localhost:3000/metas');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newMeta);
    req.flush(mockMeta);
  });

  it('should create meta with id (should be removed)', () => {
    const newMetaWithId = {
      id: 999,
      nome: 'Nova Meta com ID',
      valorMeta: 2000,
      valorPorMes: 200,
      mesesNecessarios: 10,
      valorAtual: 0,
    };

    service.createMeta(newMetaWithId).subscribe((meta) => {
      expect(meta).toEqual(mockMeta);
    });

    const req = httpMock.expectOne('http://localhost:3000/metas');
    expect(req.request.method).toBe('POST');
    // Verificar que o ID foi removido do body
    const { id, ...expectedBody } = newMetaWithId;
    expect(req.request.body).toEqual(expectedBody);
    req.flush(mockMeta);
  });

  it('should update meta with patch', () => {
    const patch = { valorAtual: 600 };

    service.updateMeta(1, patch).subscribe((meta) => {
      expect(meta).toEqual(mockMeta);
    });

    const req = httpMock.expectOne('http://localhost:3000/metas/1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(patch);
    req.flush(mockMeta);
  });

  it('should update meta with multiple patch fields', () => {
    const patch = { 
      valorAtual: 600,
      nome: 'Meta Atualizada',
      valorPorMes: 150
    };

    service.updateMeta(1, patch).subscribe((meta) => {
      expect(meta).toEqual(mockMeta);
    });

    const req = httpMock.expectOne('http://localhost:3000/metas/1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(patch);
    req.flush(mockMeta);
  });

  it('should update meta with PUT', () => {
    service.updateMetaFull(1, mockMeta).subscribe((meta) => {
      expect(meta).toEqual(mockMeta);
    });

    const req = httpMock.expectOne('http://localhost:3000/metas/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(mockMeta);
    req.flush(mockMeta);
  });

  it('should delete meta', () => {
    service.deleteMeta(1).subscribe(() => {
      expect(true).toBe(true); // Verificar que não há erro
    });

    const req = httpMock.expectOne('http://localhost:3000/metas/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should handle error in getMetas', () => {
    const errorMessage = 'Erro ao buscar metas';

    service.getMetas().subscribe({
      next: () => fail('should have failed with 404 error'),
      error: (error) => {
        expect(error.status).toBe(404);
        expect(error.error).toBe(errorMessage);
      }
    });

    const req = httpMock.expectOne('http://localhost:3000/metas');
    req.flush(errorMessage, { status: 404, statusText: 'Not Found' });
  });

  it('should handle error in createMeta', () => {
    const errorMessage = 'Erro ao criar meta';
    const newMeta = { nome: 'Nova Meta', valorMeta: 1000 };

    service.createMeta(newMeta).subscribe({
      next: () => fail('should have failed with 400 error'),
      error: (error) => {
        expect(error.status).toBe(400);
        expect(error.error).toBe(errorMessage);
      }
    });

    const req = httpMock.expectOne('http://localhost:3000/metas');
    req.flush(errorMessage, { status: 400, statusText: 'Bad Request' });
  });

  it('should handle error in updateMeta', () => {
    const errorMessage = 'Erro ao atualizar meta';
    const patch = { valorAtual: 600 };

    service.updateMeta(1, patch).subscribe({
      next: () => fail('should have failed with 404 error'),
      error: (error) => {
        expect(error.status).toBe(404);
        expect(error.error).toBe(errorMessage);
      }
    });

    const req = httpMock.expectOne('http://localhost:3000/metas/1');
    req.flush(errorMessage, { status: 404, statusText: 'Not Found' });
  });

  it('should handle error in deleteMeta', () => {
    const errorMessage = 'Erro ao deletar meta';

    service.deleteMeta(1).subscribe({
      next: () => fail('should have failed with 404 error'),
      error: (error) => {
        expect(error.status).toBe(404);
        expect(error.error).toBe(errorMessage);
      }
    });

    const req = httpMock.expectOne('http://localhost:3000/metas/1');
    req.flush(errorMessage, { status: 404, statusText: 'Not Found' });
  });
});
