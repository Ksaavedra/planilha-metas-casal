import { TestBed } from '@angular/core/testing';
import { HttpRequest } from '@angular/common/http';
import { LoaderService } from './loader.service';

describe('LoaderService', () => {
  let service: LoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoaderService],
    });
    service = TestBed.inject(LoaderService);
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  it('loading$ deve iniciar como false', () => {
    expect(service.loading$.getValue()).toBe(false);
  });

  it('onRequestStarted deve adicionar a request e setar loading$ para true', () => {
    const request = new HttpRequest('GET', '/api/test');
    service.onRequestStarted(request);
    expect(service.loading$.getValue()).toBe(true);
  });

  it('onRequestFinished deve remover a request e setar loading$ para false quando não houver mais requests', () => {
    const request = new HttpRequest('GET', '/api/test');
    service.onRequestStarted(request);
    expect(service.loading$.getValue()).toBe(true);
    service.onRequestFinished(request);
    expect(service.loading$.getValue()).toBe(false);
  });

  it('onRequestFinished com request não registrada não deve alterar loading$ para false se houver outras requests', () => {
    const req1 = new HttpRequest('GET', '/api/one');
    const req2 = new HttpRequest('GET', '/api/two');
    service.onRequestStarted(req1);
    service.onRequestStarted(req2);
    service.onRequestFinished(req1);
    expect(service.loading$.getValue()).toBe(true);
    service.onRequestFinished(req2);
    expect(service.loading$.getValue()).toBe(false);
  });

  it('onRequestFinished com request que não está na lista não deve quebrar e deve setar loading$ false apenas quando length === 0', () => {
    const req1 = new HttpRequest('GET', '/api/one');
    const reqUnknown = new HttpRequest('GET', '/api/unknown');
    service.onRequestStarted(req1);
    service.onRequestFinished(reqUnknown);
    expect(service.loading$.getValue()).toBe(true);
    service.onRequestFinished(req1);
    expect(service.loading$.getValue()).toBe(false);
  });
});
