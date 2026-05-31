/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatorioGraficosComponent } from './relatorio-graficos.component';

describe('RelatorioGraficosComponent', () => {
  let component: RelatorioGraficosComponent;
  let fixture: ComponentFixture<RelatorioGraficosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RelatorioGraficosComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RelatorioGraficosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
