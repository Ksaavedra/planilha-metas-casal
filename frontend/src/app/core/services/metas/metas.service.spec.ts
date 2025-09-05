import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { MetasService } from './metas.service';
import { Meta } from '../../interfaces/mes-meta';

describe('MetasService', () => {
  let service: MetasService;
  let httpMock: HttpTestingController;

  const mockMeta: Meta = {
    id: 1,
    nome: 'Test Meta',
    valorMeta: 10000,
    valorAtual: 5000,
    valorPorMes: 1000,
    mesesNecessarios: 10,
    meses: [],
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
    const { id, ...newMeta } = mockMeta;

    service.createMeta(newMeta).subscribe((meta) => {
      expect(meta).toEqual(mockMeta);
    });

    const req = httpMock.expectOne('http://localhost:3000/metas');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newMeta);
    req.flush(mockMeta);
  });

  it('should update meta with patch', () => {
    const updateData = { valorAtual: 6000 };

    service.updateMeta(1, updateData).subscribe((meta) => {
      expect(meta).toEqual({ ...mockMeta, ...updateData });
    });

    const req = httpMock.expectOne('http://localhost:3000/metas/1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(updateData);
    req.flush({ ...mockMeta, ...updateData });
  });

  it('should delete meta', () => {
    service.deleteMeta(1).subscribe(() => {
      // Success
    });

    const req = httpMock.expectOne('http://localhost:3000/metas/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should update meta with PUT', () => {
    const updatedMeta = { ...mockMeta, valorAtual: 7000 };

    service.updateMeta(1, updatedMeta).subscribe((meta: any) => {
      expect(meta).toEqual(updatedMeta);
    });

    const req = httpMock.expectOne('http://localhost:3000/metas/1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(updatedMeta);
    req.flush(updatedMeta);
  });

  it('should handle error when getting metas', () => {
    service.getMetas().subscribe({
      next: () => fail('should have failed with 404 error'),
      error: (error) => {
        expect(error.status).toBe(404);
        expect(error.statusText).toBe('Not Found');
      },
    });

    const req = httpMock.expectOne('http://localhost:3000/metas');
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });
  });
});
