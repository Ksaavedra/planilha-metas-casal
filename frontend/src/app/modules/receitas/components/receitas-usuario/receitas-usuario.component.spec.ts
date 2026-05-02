import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReceitasUsuarioComponent } from './receitas-usuario.component';

describe('ReceitasUsuarioComponent', () => {
  let component: ReceitasUsuarioComponent;
  let fixture: ComponentFixture<ReceitasUsuarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReceitasUsuarioComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReceitasUsuarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
