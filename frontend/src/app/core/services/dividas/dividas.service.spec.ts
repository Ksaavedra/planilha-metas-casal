import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { environment } from 'src/environments';
import { Divida, CreateDividaRequest } from '../../interfaces/dividas/dividas';
import { DividasService } from './dividas.service';

describe('DividasService', () => {
  let service: DividasService;
  let httpMock: HttpTestingController;

  const baseUrl = `${environment.apiUrl}/dividas`;
  const divida: Divida = {
    id: 1,
    objetivo: 'Empréstimo',
    tipoDivida: 'emprestimo',
    valorTotal: 300,
    valorPago: 100,
    valorRestante: 200,
    parcelaMensal: 100,
    quantidadeParcelas: 3,
    parcelasRestantes: 2,
    percentualQuitado: 33.33,
    statusDivida: 'pagando',
    ano: 2026,
    dataInicio: '2026-05-01',
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DividasService],
    });

    service = TestBed.inject(DividasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('deve instanciar', () => {
    expect(service).toBeTruthy();
  });

  it('deve persistir e recuperar mês de referência válido', () => {
    service.setMesReferencia(new Date(2026, 4, 15));

    const result = service.getMesReferencia();

    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(4);
    expect(result.getDate()).toBe(1);
  });

  it('deve ignorar mês de referência inválido no localStorage', () => {
    localStorage.setItem('dividas_mes_referencia', '2026-99');

    const result = service.getMesReferencia();

    expect(result).toBeInstanceOf(Date);
    expect(result.getDate()).toBe(1);
    expect(result.getMonth()).not.toBe(98);
  });

  it('deve buscar dívidas por ano', () => {
    service.getDividas(2026).subscribe((result) => {
      expect(result).toEqual([divida]);
    });

    const req = httpMock.expectOne(`${baseUrl}?ano=2026`);
    expect(req.request.method).toBe('GET');
    req.flush([divida]);
  });

  it('deve buscar dívida por id', () => {
    service.getDivida(1).subscribe((result) => {
      expect(result).toEqual(divida);
    });

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(divida);
  });

  it('deve criar dívida', () => {
    const body: CreateDividaRequest = {
      objetivo: 'Novo empréstimo',
      tipoDivida: 'emprestimo',
      valorTotal: 600,
      quantidadeParcelas: 6,
      ano: 2026,
    };

    service.createDivida(body).subscribe((result) => {
      expect(result.objetivo).toBe('Novo empréstimo');
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ ...divida, ...body, id: 2 });
  });

  it('deve atualizar dívida', () => {
    const body = { valorPago: 200 };

    service.updateDivida(1, body).subscribe((result) => {
      expect(result.valorPago).toBe(200);
    });

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(body);
    req.flush({ ...divida, ...body });
  });

  it('deve excluir dívida', () => {
    service.deleteDivida(1).subscribe((result) => {
      expect(result).toBeNull();
    });

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
