import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService', () => {
  let service: UsuariosService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UsuariosService],
    });
    service = TestBed.inject(UsuariosService);
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });
});
