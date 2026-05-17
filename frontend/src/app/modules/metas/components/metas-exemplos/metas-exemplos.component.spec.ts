import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetasExemplosComponent } from './metas-exemplos.component';

describe('MetasExemplosComponent', () => {
  let component: MetasExemplosComponent;
  let fixture: ComponentFixture<MetasExemplosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MetasExemplosComponent],
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
});
