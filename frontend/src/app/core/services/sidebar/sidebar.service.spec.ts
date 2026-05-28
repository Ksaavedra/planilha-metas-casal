import { TestBed } from '@angular/core/testing';
import { SidebarService } from './sidebar.service';

describe('SidebarService', () => {
  let service: SidebarService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SidebarService]
    });
    service = TestBed.inject(SidebarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial status as false', (done) => {
    service.getStatus().subscribe((status) => {
      expect(status).toBe(false);
      done();
    });
  });

  it('should toggle status when changeStatus is called', (done) => {
    service.changeStatus();
    service.getStatus().subscribe((status) => {
      expect(status).toBe(true);
      done();
    });
  });

  it('should toggle status back to false when changeStatus is called twice', (done) => {
    service.changeStatus();
    service.changeStatus();
    service.getStatus().subscribe((status) => {
      expect(status).toBe(false);
      done();
    });
  });

  it('should detect mobile screen size', (done) => {
    service.isMobile().subscribe((isMobile) => {
      expect(typeof isMobile).toBe('boolean');
      done();
    });
  });

  it('should have getStatus method that returns observable', () => {
    const status$ = service.getStatus();
    expect(status$).toBeDefined();
    expect(typeof status$.subscribe).toBe('function');
  });

  it('should have isMobile method that returns observable', () => {
    const mobile$ = service.isMobile();
    expect(mobile$).toBeDefined();
    expect(typeof mobile$.subscribe).toBe('function');
  });
});
