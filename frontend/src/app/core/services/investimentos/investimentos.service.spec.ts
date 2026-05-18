import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { InvestimentosService } from './investimentos.service';
import { Investimento } from '@core/interfaces/investimentos/investimentos';
import { environment } from 'src/environments';

describe('InvestimentosService', () => {
  let service: InvestimentosService;
  let httpMock: HttpTestingController;

  const baseUrl = `${environment.apiUrl}/investimentos`;

  const mockInvestimento: Investimento = {
    id: 1,
    descricao: 'Reserva',
    tipoInvestimento: 'cdb',
    valorInvestido: 2000,
    valorAtual: 2300,
    aporteMensal: 200,
    rentabilidade: 300,
    rentabilidadePercentual: 15,
    statusInvestimento: 'crescendo',
    ano: 2026,
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [InvestimentosService],
    });
    service = TestBed.inject(InvestimentosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('deve instanciar', () => {
    expect(service).toBeTruthy();
  });

  describe('ano selecionado', () => {
    it('getAnoSelecionado retorna ano atual quando storage vazio', () => {
      expect(service.getAnoSelecionado()).toBe(new Date().getFullYear());
    });

    it('setAnoSelecionado persiste no localStorage', () => {
      service.setAnoSelecionado(2024);
      expect(service.getAnoSelecionado()).toBe(2024);
    });

    it('getAnoSelecionado ignora valor inválido no storage', () => {
      localStorage.setItem('investimentos_ano_selecionado', 'abc');
      expect(service.getAnoSelecionado()).toBe(new Date().getFullYear());
    });
  });

  describe('getInvestimento', () => {
    it('chama API por id', () => {
      service.getInvestimento(5).subscribe((r) => {
        expect(r.id).toBe(5);
      });

      const req = httpMock.expectOne(`${baseUrl}/5`);
      expect(req.request.method).toBe('GET');
      req.flush({ ...mockInvestimento, id: 5 });
    });
  });

  describe('getInvestimentos', () => {
    it('chama API com ano', () => {
      service.getInvestimentos({ ano: 2026 }).subscribe((r) => {
        expect(r).toEqual([mockInvestimento]);
      });

      const req = httpMock.expectOne(`${baseUrl}?ano=2026`);
      expect(req.request.method).toBe('GET');
      req.flush([mockInvestimento]);
    });

    it('inclui tipo quando informado', () => {
      service.getInvestimentos({ ano: 2026, tipo: 'cdb' }).subscribe();

      const req = httpMock.expectOne(`${baseUrl}?ano=2026&tipo=cdb`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('createInvestimento', () => {
    it('envia POST', () => {
      const body = {
        descricao: 'Novo',
        tipoInvestimento: 'cdb',
        valorInvestido: 1000,
        valorAtual: 1000,
        ano: 2026,
      };

      service.createInvestimento(body).subscribe((r) => {
        expect(r.id).toBe(2);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ ...mockInvestimento, id: 2, descricao: 'Novo' });
    });
  });

  describe('updateInvestimento', () => {
    it('envia PATCH', () => {
      service
        .updateInvestimento(1, { descricao: 'Atualizado' })
        .subscribe((r) => {
          expect(r.descricao).toBe('Atualizado');
        });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('PATCH');
      req.flush({ ...mockInvestimento, descricao: 'Atualizado' });
    });
  });

  describe('deleteInvestimento', () => {
    it('envia DELETE', () => {
      service.deleteInvestimento(1).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
