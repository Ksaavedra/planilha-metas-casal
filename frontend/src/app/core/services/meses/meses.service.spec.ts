import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MesesService, Mes } from './meses.service';
import { ApiService } from '../api/api.service';

const mockMeses: Mes[] = [
  { id: '1', nome: 'Janeiro', numero: 1 },
  { id: '2', nome: 'Fevereiro', numero: 2 },
  { id: '3', nome: 'Março', numero: 3 },
  { id: '4', nome: 'Abril', numero: 4 },
  { id: '5', nome: 'Maio', numero: 5 },
  { id: '6', nome: 'Junho', numero: 6 },
  { id: '7', nome: 'Julho', numero: 7 },
  { id: '8', nome: 'Agosto', numero: 8 },
  { id: '9', nome: 'Setembro', numero: 9 },
  { id: '10', nome: 'Outubro', numero: 10 },
  { id: '11', nome: 'Novembro', numero: 11 },
  { id: '12', nome: 'Dezembro', numero: 12 },
];

describe('MesesService', () => {
  let service: MesesService;
  let apiService: jest.Mocked<Pick<ApiService, 'get'>>;

  beforeEach(() => {
    apiService = {
      get: jest.fn().mockReturnValue(of(mockMeses)),
    };
    TestBed.configureTestingModule({
      providers: [
        MesesService,
        { provide: ApiService, useValue: apiService },
      ],
    });
    service = TestBed.inject(MesesService);
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  describe('getMeses', () => {
    it('deve chamar apiService.get com /meses', () => {
      service.getMeses().subscribe();
      expect(apiService.get).toHaveBeenCalledWith('/meses');
    });

    it('deve retornar a lista de meses da API', (done) => {
      service.getMeses().subscribe((meses) => {
        expect(meses).toEqual(mockMeses);
        done();
      });
    });
  });

  describe('getMes', () => {
    beforeEach(() => {
      (apiService.get as jest.Mock).mockReturnValue(of(mockMeses[0]));
    });

    it('deve chamar apiService.get com /meses/:id', () => {
      service.getMes('1').subscribe();
      expect(apiService.get).toHaveBeenCalledWith('/meses/1');
    });

    it('deve retornar o mês correspondente ao id', (done) => {
      service.getMes('1').subscribe((mes) => {
        expect(mes).toEqual(mockMeses[0]);
        done();
      });
    });
  });

  describe('getMesPorNumero', () => {
    it('deve retornar o mês quando existe com o número informado', (done) => {
      service.getMesPorNumero(3).subscribe((mes) => {
        expect(mes).toEqual(mockMeses[2]);
        done();
      });
    });

    it('deve retornar undefined quando não existe mês com o número', (done) => {
      service.getMesPorNumero(99).subscribe((mes) => {
        expect(mes).toBeUndefined();
        done();
      });
    });
  });

  describe('getMesAtual', () => {
    it('deve chamar getMesPorNumero com o número do mês atual', (done) => {
      const mesAtual = new Date().getMonth() + 1;
      service.getMesAtual().subscribe((mes) => {
        expect(apiService.get).toHaveBeenCalledWith('/meses');
        expect(mes?.numero).toBe(mesAtual);
        done();
      });
    });
  });

  describe('getNomeMes', () => {
    it('deve retornar o nome do mês para número válido (1-12)', () => {
      expect(service.getNomeMes(1)).toBe('Janeiro');
      expect(service.getNomeMes(6)).toBe('Junho');
      expect(service.getNomeMes(12)).toBe('Dezembro');
    });

    it('deve retornar "Mês inválido" para número fora do intervalo', () => {
      expect(service.getNomeMes(0)).toBe('Mês inválido');
      expect(service.getNomeMes(13)).toBe('Mês inválido');
    });
  });

  describe('getNumeroMes', () => {
    it('deve retornar o número do mês para nome válido', () => {
      expect(service.getNumeroMes('Janeiro')).toBe(1);
      expect(service.getNumeroMes('Junho')).toBe(6);
      expect(service.getNumeroMes('Dezembro')).toBe(12);
    });

    it('deve retornar 0 para nome inexistente', () => {
      expect(service.getNumeroMes('Invalid')).toBe(0);
    });
  });
});
