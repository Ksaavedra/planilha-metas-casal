import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RotaPageComponent } from './rota-page.component';

describe('RotaPageComponent', () => {
  let component: RotaPageComponent;
  let fixture: ComponentFixture<RotaPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RotaPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RotaPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
