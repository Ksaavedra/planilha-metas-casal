/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { RelatoriosService } from './relatorios.service';

describe('Service: Relatorios', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RelatoriosService]
    });
  });

  it('should ...', inject([RelatoriosService], (service: RelatoriosService) => {
    expect(service).toBeTruthy();
  }));
});
