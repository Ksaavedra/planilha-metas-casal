import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DividasPageComponent } from './dividas-page.component';

describe('DividasPageComponent', () => {
  let component: DividasPageComponent;
  let fixture: ComponentFixture<DividasPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DividasPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DividasPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
