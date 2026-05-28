import { HttpHandler, HttpRequest } from '@angular/common/http';
import { of } from 'rxjs';
import { AuthInterceptor } from './auth.interceptor';

describe('AuthInterceptor', () => {
  const authService = {
    getToken: jest.fn(),
  };
  const next: HttpHandler = {
    handle: jest.fn().mockReturnValue(of({})),
  };

  let interceptor: AuthInterceptor;

  beforeEach(() => {
    jest.clearAllMocks();
    interceptor = new AuthInterceptor(authService as any);
  });

  it('deve adicionar Authorization quando houver token', () => {
    authService.getToken.mockReturnValue('abc');
    const req = new HttpRequest('GET', '/api/metas');

    interceptor.intercept(req, next).subscribe();

    const handledReq = (next.handle as jest.Mock).mock.calls[0][0] as HttpRequest<unknown>;
    expect(handledReq.headers.get('Authorization')).toBe('Bearer abc');
  });

  it('não deve adicionar token em login/registro ou quando não houver token', () => {
    authService.getToken.mockReturnValue('abc');
    const loginReq = new HttpRequest('POST', '/api/auth/login', {});

    interceptor.intercept(loginReq, next).subscribe();
    expect((next.handle as jest.Mock).mock.calls[0][0]).toBe(loginReq);

    jest.clearAllMocks();
    authService.getToken.mockReturnValue(null);
    const req = new HttpRequest('GET', '/api/metas');
    interceptor.intercept(req, next).subscribe();
    expect((next.handle as jest.Mock).mock.calls[0][0]).toBe(req);
  });

  it('não deve sobrescrever Authorization existente', () => {
    authService.getToken.mockReturnValue('abc');
    const req = new HttpRequest('GET', '/api/metas', {
      headers: undefined,
    }).clone({
      setHeaders: { Authorization: 'Bearer custom' },
    });

    interceptor.intercept(req, next).subscribe();

    expect((next.handle as jest.Mock).mock.calls[0][0]).toBe(req);
  });
});
