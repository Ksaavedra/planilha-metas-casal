import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';

import { InvestimentosExemplosComponent } from './investimentos-exemplos.component';

describe('InvestimentosExemplosComponent', () => {
  let component: InvestimentosExemplosComponent;
  let fixture: ComponentFixture<InvestimentosExemplosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [InvestimentosExemplosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InvestimentosExemplosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
