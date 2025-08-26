import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParabensModalComponent } from './parabens-modal.component';

describe('ParabensModalComponent', () => {
  let component: ParabensModalComponent;
  let fixture: ComponentFixture<ParabensModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParabensModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ParabensModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit close event when onClose is called', () => {
    const spy = jest.spyOn(component.close, 'emit');

    component.onClose();

    expect(spy).toHaveBeenCalled();
  });

  it('should have default input values', () => {
    expect(component.isOpen).toBe(false);
    expect(component.metaNome).toBe('');
    expect(component.valorMeta).toBe(0);
  });

  it('should accept custom input values', () => {
    component.isOpen = true;
    component.metaNome = 'Teste Meta';
    component.valorMeta = 1000;

    expect(component.isOpen).toBe(true);
    expect(component.metaNome).toBe('Teste Meta');
    expect(component.valorMeta).toBe(1000);
  });
});
