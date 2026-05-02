import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarReceitaDialogComponent } from './adicionar-receita-dialog.component';

describe('AdicionarReceitaDialogDataComponent', () => {
  let component: AdicionarReceitaDialogComponent;
  let fixture: ComponentFixture<AdicionarReceitaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdicionarReceitaDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdicionarReceitaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
