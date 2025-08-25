import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElaborandoMetasComponent } from './elaborando-metas.component';

describe('ElaborandoMetasComponent', () => {
  let component: ElaborandoMetasComponent;
  let fixture: ComponentFixture<ElaborandoMetasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElaborandoMetasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ElaborandoMetasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
