import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RelatorioPageComponent } from './relatorio-page.component';

describe('RelatorioPageComponent', () => {
  let component: RelatorioPageComponent;
  let fixture: ComponentFixture<RelatorioPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelatorioPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RelatorioPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
