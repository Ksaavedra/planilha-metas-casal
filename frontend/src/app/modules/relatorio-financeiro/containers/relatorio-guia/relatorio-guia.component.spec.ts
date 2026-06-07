import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatorioGuiaComponent } from './relatorio-guia.component';

describe('RelatorioGuiaComponent', () => {
  let component: RelatorioGuiaComponent;
  let fixture: ComponentFixture<RelatorioGuiaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RelatorioGuiaComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RelatorioGuiaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
