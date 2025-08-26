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

  it('should update mes valor', () => {
    service.updateMes(1, 1, 150).subscribe((meta) => {
      expect(meta).toEqual(mockMeta);
    });

    const req = httpMock.expectOne('http://localhost:3000/metas/1/meses/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ valor: 150 });
    req.flush(mockMeta);
  });

  it('should update mes status', () => {
    service.updateStatusMes(1, 1, 'Pago').subscribe((meta) => {
      expect(meta).toEqual(mockMeta);
    });

    const req = httpMock.expectOne(
      'http://localhost:3000/metas/1/meses/1/status'
    );
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ status: 'Pago' });
    req.flush(mockMeta);
  });

  it('should delete meta', () => {
    service.deleteMeta(1).subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne('http://localhost:3000/metas/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
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
});
