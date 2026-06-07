import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { UsuariosService } from './usuarios.service';
import { environment } from 'src/environments/environment';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let httpMock: HttpTestingController;

  const baseUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UsuariosService],
    });
    service = TestBed.inject(UsuariosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  describe('getUsuarios', () => {
    it('deve fazer GET/usuarios', () => {
      const mockUsuarios = [{ id: 1, nome: 'David' }];

      service.getUsuarios().subscribe((usuarios) => {
        expect(usuarios).toEqual(mockUsuarios);
      });

      const req = httpMock.expectOne(`${baseUrl}/usuarios`);
      expect(req.request.method).toBe('GET');

      req.flush(mockUsuarios);
    });

    it('deve tratar erro', () => {
      service.getUsuarios().subscribe({
        error: (error) => {
          expect(error).toBe(500);
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/usuarios`);
      req.flush('Erro', { status: 500, statusText: 'Erro' });
    });
  });

  describe('createUsuario', () => {
    it('deve fazer POST/usuarios com payload', () => {
      const mockUsuario = { id: 1, nome: 'David' };

      service.createUsuario('David').subscribe((usuario) => {
        expect(usuario).toEqual(mockUsuario);
      });

      const req = httpMock.expectOne(`${baseUrl}/usuarios`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ nome: 'David' });

      req.flush(mockUsuario);
    });

    it('deve tratar erro no POST', () => {
      service.createUsuario('David').subscribe({
        error: (error) => {
          expect(error).toBe(400);
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/usuarios`);
      req.flush('Erro', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateUsuario', () => {
    it('deve fazer PUT/usuarios/:id com payload', () => {
      const mockUsuario = { id: 1, nome: 'Kelly Silva' };

      service.updateUsuario(1, 'Kelly Silva').subscribe((usuario) => {
        expect(usuario).toEqual(mockUsuario);
      });

      const req = httpMock.expectOne(`${baseUrl}/usuarios/1`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ nome: 'Kelly Silva' });

      req.flush(mockUsuario);
    });

    it('deve tratar erro no PUT', () => {
      service.updateUsuario(1, 'Kelly').subscribe({
        error: (error) => {
          expect(error).toBe(404);
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/usuarios/1`);
      req.flush('Erro', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('deleteUsuario', () => {
    it('deve fazer DELETE/usuarios/:id', () => {
      service.deleteUsuario(1).subscribe((response) => {
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne(`${baseUrl}/usuarios/1`);

      expect(req.request.method).toBe('DELETE');

      req.flush(null);
    });

    it('deve tratar erro no DELETE', () => {
      service.deleteUsuario(1).subscribe({
        error: (error) => {
          expect(error).toBe(404);
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/usuarios/1`);
      req.flush('Erro', { status: 404, statusText: 'Not Found' });
    });
  });
});
