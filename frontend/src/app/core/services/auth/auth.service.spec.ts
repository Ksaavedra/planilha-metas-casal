import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiService } from '../api/api.service';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Usuario,
} from 'auths/auth';

const mockUsuario: Usuario = {
  id: 1,
  usuario: 'usuario1',
  nomeCompleto: 'Usuário Teste',
  apelido: 'Teste',
  email: 'teste@exemplo.com',
  tipoUso: 'individual',
};

const mockAuthResponse: AuthResponse = {
  message: 'Sucesso',
  token: 'token-123',
  usuario: mockUsuario,
};

describe('AuthService', () => {
  let service: AuthService;
  let apiService: jest.Mocked<Pick<ApiService, 'post' | 'get' | 'put'>>;
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    jest
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation((key: string) => localStorageMock[key] ?? null);
    jest
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation((key: string, value: string) => {
        localStorageMock[key] = value;
      });
    jest
      .spyOn(Storage.prototype, 'removeItem')
      .mockImplementation((key: string) => {
        delete localStorageMock[key];
      });

    apiService = {
      post: jest.fn().mockReturnValue(of(mockAuthResponse)),
      get: jest.fn().mockReturnValue(of(mockUsuario)),
      put: jest
        .fn()
        .mockReturnValue(of({ ...mockUsuario, tipoUso: 'familia' })),
    };

    TestBed.configureTestingModule({
      providers: [AuthService, { provide: ApiService, useValue: apiService }],
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  describe('constructor / loadStoredAuth', () => {
    it('ao iniciar sem dados no localStorage, currentUser$ emite null', () => {
      expect(service.getCurrentUser()).toBeNull();
    });

    it('ao iniciar com token e user no localStorage, restaura currentUser$', () => {
      localStorageMock['auth_token'] = 'stored-token';
      localStorageMock['current_user'] = JSON.stringify(mockUsuario);
      const s = new AuthService(apiService as unknown as ApiService);
      expect(s.getCurrentUser()).toEqual(mockUsuario);
    });

    it('ao iniciar com JSON inválido em current_user, limpa auth', () => {
      localStorageMock['auth_token'] = 'x';
      localStorageMock['current_user'] = 'invalid-json';
      const s = new AuthService(apiService as unknown as ApiService);
      expect(s.getCurrentUser()).toBeNull();
      expect(localStorageMock['auth_token']).toBeUndefined();
    });
  });

  describe('login', () => {
    it('deve chamar api.post /auth/login e ao sucesso setar token, user e currentUser$', (done) => {
      const credentials: LoginRequest = {
        usuarioOuEmail: 'usuario1',
        senha: '123',
      };
      service.login(credentials).subscribe((response) => {
        expect(response).toEqual(mockAuthResponse);
        expect(apiService.post).toHaveBeenCalledWith(
          '/auth/login',
          credentials,
        );
        expect(localStorageMock['auth_token']).toBe('token-123');
        expect(localStorageMock['current_user']).toBe(
          JSON.stringify(mockUsuario),
        );
        expect(service.getCurrentUser()).toEqual(mockUsuario);
        done();
      });
    });

    it('em erro deve repassar o erro', (done) => {
      const err = new Error('Unauthorized');
      (apiService.post as jest.Mock).mockReturnValue(throwError(() => err));
      service.login({ usuarioOuEmail: 'x', senha: 'y' }).subscribe({
        next: () => fail('deveria falhar'),
        error: (e) => {
          expect(e).toBe(err);
          done();
        },
      });
    });
  });

  describe('register', () => {
    it('deve chamar api.post /auth/registrar e ao sucesso setar auth', (done) => {
      const userData: RegisterRequest = {
        usuario: 'usuario1',
        nomeCompleto: 'A',
        apelido: 'A',
        email: 'a@b.com',
        senha: '123',
      };
      service.register(userData).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          '/auth/registrar',
          userData,
        );
        expect(service.getCurrentUser()).toEqual(mockUsuario);
        done();
      });
    });

    it('em erro deve repassar o erro', (done) => {
      (apiService.post as jest.Mock).mockReturnValue(
        throwError(() => new Error('Conflict')),
      );
      service
        .register({
          usuario: 'x',
          nomeCompleto: 'X',
          apelido: 'X',
          email: 'x@x.com',
          senha: '1',
        })
        .subscribe({
          next: () => fail('deveria falhar'),
          error: (e) => {
            expect(e.message).toBe('Conflict');
            done();
          },
        });
    });
  });

  describe('logout', () => {
    it('deve limpar token, user e currentUser$', () => {
      localStorageMock['auth_token'] = 't';
      localStorageMock['current_user'] = JSON.stringify(mockUsuario);
      const s = new AuthService(apiService as unknown as ApiService);
      s.logout();
      expect(s.getCurrentUser()).toBeNull();
      expect(localStorageMock['auth_token']).toBeUndefined();
      expect(localStorageMock['current_user']).toBeUndefined();
    });
  });

  describe('isAuthenticated', () => {
    it('retorna false quando não há token', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('retorna true quando há token', () => {
      localStorageMock['auth_token'] = 'any';
      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('getToken', () => {
    it('retorna null quando não há token', () => {
      expect(service.getToken()).toBeNull();
    });

    it('retorna o token armazenado', () => {
      localStorageMock['auth_token'] = 'my-token';
      expect(service.getToken()).toBe('my-token');
    });
  });

  describe('getCurrentUser', () => {
    it('retorna null quando não há usuário', () => {
      expect(service.getCurrentUser()).toBeNull();
    });

    it('retorna o usuário após login', (done) => {
      service.login({ usuarioOuEmail: 'a@b.com', senha: '1' }).subscribe(() => {
        expect(service.getCurrentUser()).toEqual(mockUsuario);
        done();
      });
    });
  });

  describe('getProfile', () => {
    it('busca perfil na API e atualiza currentUser$', (done) => {
      service.login({ usuarioOuEmail: 'a@b.com', senha: '1' }).subscribe(() => {
        service.getProfile().subscribe((user) => {
          expect(user).toEqual(mockUsuario);
          expect(apiService.get).toHaveBeenCalledWith('/auth/perfil');
          expect(service.getCurrentUser()).toEqual(mockUsuario);
          done();
        });
      });
    });

    it('limpa autenticação quando perfil retorna 401', (done) => {
      localStorageMock['auth_token'] = 't';
      localStorageMock['current_user'] = JSON.stringify(mockUsuario);
      (apiService.get as jest.Mock).mockReturnValue(
        throwError(() => ({ status: 401 })),
      );
      const s = new AuthService(apiService as unknown as ApiService);

      s.getProfile().subscribe({
        next: () => fail('deveria falhar'),
        error: (err) => {
          expect(err.status).toBe(401);
          expect(s.getCurrentUser()).toBeNull();
          expect(localStorageMock['auth_token']).toBeUndefined();
          done();
        },
      });
    });

    it('mantém autenticação quando perfil retorna erro diferente de 401', (done) => {
      localStorageMock['auth_token'] = 't';
      localStorageMock['current_user'] = JSON.stringify(mockUsuario);
      (apiService.get as jest.Mock).mockReturnValue(
        throwError(() => ({ status: 500 })),
      );
      const s = new AuthService(apiService as unknown as ApiService);

      s.getProfile().subscribe({
        next: () => fail('deveria falhar'),
        error: (err) => {
          expect(err.status).toBe(500);
          expect(s.getCurrentUser()).toEqual(mockUsuario);
          expect(localStorageMock['auth_token']).toBe('t');
          done();
        },
      });
    });
  });

  describe('atualizarTipoUso', () => {
    it('atualiza tipo de uso e currentUser$', (done) => {
      service.atualizarTipoUso('familia').subscribe((usuario) => {
        expect(apiService.put).toHaveBeenCalledWith('/auth/tipo-uso', {
          tipoUso: 'familia',
        });
        expect(usuario.tipoUso).toBe('familia');
        expect(service.getCurrentUser()?.tipoUso).toBe('familia');
        done();
      });
    });
  });
});
