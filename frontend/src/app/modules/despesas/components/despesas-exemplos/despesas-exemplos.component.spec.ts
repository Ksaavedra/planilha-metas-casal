import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';

import { DespesasExemplosComponent } from './despesas-exemplos.component';

describe('DespesasExemplosComponent', () => {
  let component: DespesasExemplosComponent;
  let fixture: ComponentFixture<DespesasExemplosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [DespesasExemplosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DespesasExemplosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
