import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceitasExemplosComponent } from './receitas-exemplos.component';

describe('ReceitasExemplosComponent', () => {
  let component: ReceitasExemplosComponent;
  let fixture: ComponentFixture<ReceitasExemplosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceitasExemplosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceitasExemplosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
