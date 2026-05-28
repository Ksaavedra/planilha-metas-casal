import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { environment } from 'src/environments';
import { Cartao, CreateCartaoRequest } from '../../interfaces/cartoes/cartoes';
import { CartoesService } from './cartoes.service';

describe('CartoesService', () => {
  let service: CartoesService;
  let httpMock: HttpTestingController;

  const baseUrl = `${environment.apiUrl}/cartoes`;
  const cartao: Cartao = {
    id: 1,
    nome: 'Roxo',
    banco: 'Nubank',
    limite: 1000,
    valorUtilizado: 250,
    valorDisponivel: 750,
    diaFechamento: 10,
    diaVencimento: 20,
    diaMelhorCompra: 11,
    pessoa: 'Kelly',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CartoesService],
    });

    service = TestBed.inject(CartoesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve instanciar', () => {
    expect(service).toBeTruthy();
  });

  it('deve buscar cartões', () => {
    service.getCartoes().subscribe((result) => {
      expect(result).toEqual([cartao]);
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush([cartao]);
  });

  it('deve buscar cartão por id', () => {
    service.getCartao(1).subscribe((result) => {
      expect(result).toEqual(cartao);
    });

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(cartao);
  });

  it('deve criar cartão', () => {
    const body: CreateCartaoRequest = {
      nome: 'Black',
      banco: 'C6',
      limite: 2000,
      pessoa: 'David',
    };

    service.createCartao(body).subscribe((result) => {
      expect(result).toEqual({ ...cartao, ...body, id: 2 });
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ ...cartao, ...body, id: 2 });
  });

  it('deve atualizar cartão', () => {
    const body = { limite: 1500, pessoa: null };

    service.updateCartao(1, body).subscribe((result) => {
      expect(result.limite).toBe(1500);
      expect(result.pessoa).toBeNull();
    });

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(body);
    req.flush({ ...cartao, ...body });
  });

  it('deve excluir cartão', () => {
    service.deleteCartao(1).subscribe((result) => {
      expect(result).toBeNull();
    });

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
