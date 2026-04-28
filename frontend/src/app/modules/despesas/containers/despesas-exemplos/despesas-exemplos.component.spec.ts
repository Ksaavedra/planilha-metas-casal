import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DespesasExemplosComponent } from './despesas-exemplos.component';

describe('DespesasExemplosComponent', () => {
  let component: DespesasExemplosComponent;
  let fixture: ComponentFixture<DespesasExemplosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DespesasExemplosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DespesasExemplosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
