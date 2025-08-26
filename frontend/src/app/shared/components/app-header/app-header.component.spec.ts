import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppHeaderComponent } from './app-header.component';

describe('AppHeaderComponent', () => {
  let component: AppHeaderComponent;
  let fixture: ComponentFixture<AppHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit sidebarToggle event when toggleSidebar is called', () => {
    const spy = jest.spyOn(component.sidebarToggle, 'emit');

    component.toggleSidebar();

    expect(spy).toHaveBeenCalled();
  });
});
