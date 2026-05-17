import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { MetasExemplosComponent } from './metas-exemplos.component';

describe('MetasExemplosComponent', () => {
  let component: MetasExemplosComponent;
  let fixture: ComponentFixture<MetasExemplosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MetasExemplosComponent],
      imports: [CommonModule],
    }).compileComponents();

    fixture = TestBed.createComponent(MetasExemplosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose example lists', () => {
    expect(component.exemplosSonhos.length).toBeGreaterThan(0);
    expect(component.exemplosFinanceiros.length).toBeGreaterThan(0);
  });

  it('should render guide sections and example items in template', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.metas-exemplos__h2')?.textContent).toContain(
      'Como funcionam as metas',
    );
    expect(el.querySelectorAll('.metas-exemplos__bloco').length).toBe(3);
    expect(el.querySelectorAll('.metas-exemplos__lista li').length).toBe(
      component.exemplosSonhos.length + component.exemplosFinanceiros.length,
    );
    expect(el.textContent).toContain('Elaborando as metas');
    expect(el.textContent).toContain('Enter');
    expect(el.textContent).toContain('Esc');
  });
});
