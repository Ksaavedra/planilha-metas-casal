import { UrlTree } from '@angular/router';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  const loginTree = {} as UrlTree;
  const authService = {
    isAuthenticated: jest.fn(),
  };
  const router = {
    createUrlTree: jest.fn().mockReturnValue(loginTree),
  };

  let guard: AuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new AuthGuard(authService as any, router as any);
  });

  it('deve permitir acesso quando autenticado', () => {
    authService.isAuthenticated.mockReturnValue(true);

    expect(guard.canActivate({} as any, { url: '/dashboard' } as any)).toBe(true);
  });

  it('deve redirecionar para login quando não autenticado', () => {
    authService.isAuthenticated.mockReturnValue(false);

    expect(guard.canActivate({} as any, { url: '/metas' } as any)).toBe(loginTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/metas' },
    });
  });

  it('deve aplicar a mesma regra em rotas filhas', () => {
    authService.isAuthenticated.mockReturnValue(true);

    expect(guard.canActivateChild({} as any, { url: '/receitas' } as any)).toBe(true);
  });
});
