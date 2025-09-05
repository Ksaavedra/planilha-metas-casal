import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('get', () => {
    it('should make GET request without params', () => {
      const mockData = { id: 1, name: 'Test' };
      const endpoint = '/test';

      service.get(endpoint).subscribe((data) => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl || 'http://localhost:3000'}${endpoint}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should make GET request with params', () => {
      const mockData = { id: 1, name: 'Test' };
      const endpoint = '/test';
      const params = { page: 1, limit: 10 };

      service.get(endpoint, params).subscribe((data) => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(
        `${
          environment.apiUrl || 'http://localhost:3000'
        }${endpoint}?page=1&limit=10`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should handle params with null values', () => {
      const mockData = { id: 1, name: 'Test' };
      const endpoint = '/test';
      const params = { page: 1, limit: null, search: undefined };

      service.get(endpoint, params).subscribe((data) => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl || 'http://localhost:3000'}${endpoint}?page=1`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should handle params with zero values', () => {
      const mockData = { id: 1, name: 'Test' };
      const endpoint = '/test';
      const params = { page: 0, limit: 10 };

      service.get(endpoint, params).subscribe((data) => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(
        `${
          environment.apiUrl || 'http://localhost:3000'
        }${endpoint}?page=0&limit=10`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should handle params with empty string values', () => {
      const mockData = { id: 1, name: 'Test' };
      const endpoint = '/test';
      const params = { page: 1, search: '' };

      service.get(endpoint, params).subscribe((data) => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(
        `${
          environment.apiUrl || 'http://localhost:3000'
        }${endpoint}?page=1&search=`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should handle HTTP error', () => {
      const endpoint = '/test';
      const errorMessage = 'Server error';

      service.get(endpoint).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe(errorMessage);
        },
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl || 'http://localhost:3000'}${endpoint}`
      );
      req.flush(errorMessage, { status: 500, statusText: errorMessage });
    });
  });

  describe('post', () => {
    it('should make POST request', () => {
      const mockData = { id: 1, name: 'Test' };
      const endpoint = '/test';
      const requestData = { name: 'New Test' };

      service.post(endpoint, requestData).subscribe((data) => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl || 'http://localhost:3000'}${endpoint}`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(requestData);
      req.flush(mockData);
    });

    it('should handle POST request with empty body', () => {
      const mockData = { id: 1, name: 'Test' };
      const endpoint = '/test';

      service.post(endpoint, {}).subscribe((data) => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl || 'http://localhost:3000'}${endpoint}`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockData);
    });

    it('should handle POST HTTP error', () => {
      const endpoint = '/test';
      const requestData = { name: 'New Test' };
      const errorMessage = 'Bad Request';

      service.post(endpoint, requestData).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          expect(error.statusText).toBe(errorMessage);
        },
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl || 'http://localhost:3000'}${endpoint}`
      );
      req.flush(errorMessage, { status: 400, statusText: errorMessage });
    });
  });

  describe('put', () => {
    it('should make PUT request', () => {
      const mockData = { id: 1, name: 'Updated Test' };
      const endpoint = '/test/1';
      const requestData = { name: 'Updated Test' };

      service.put(endpoint, requestData).subscribe((data) => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl || 'http://localhost:3000'}${endpoint}`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(requestData);
      req.flush(mockData);
    });

    it('should handle PUT HTTP error', () => {
      const endpoint = '/test/1';
      const requestData = { name: 'Updated Test' };
      const errorMessage = 'Not Found';

      service.put(endpoint, requestData).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          expect(error.statusText).toBe(errorMessage);
        },
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl || 'http://localhost:3000'}${endpoint}`
      );
      req.flush(errorMessage, { status: 404, statusText: errorMessage });
    });
  });

  describe('patch', () => {
    it('should make PATCH request', () => {
      const mockData = { id: 1, name: 'Patched Test' };
      const endpoint = '/test/1';
      const requestData = { name: 'Patched Test' };

      service.patch(endpoint, requestData).subscribe((data) => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl || 'http://localhost:3000'}${endpoint}`
      );
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(requestData);
      req.flush(mockData);
    });

    it('should handle PATCH HTTP error', () => {
      const endpoint = '/test/1';
      const requestData = { name: 'Patched Test' };
      const errorMessage = 'Unauthorized';

      service.patch(endpoint, requestData).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
          expect(error.statusText).toBe(errorMessage);
        },
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl || 'http://localhost:3000'}${endpoint}`
      );
      req.flush(errorMessage, { status: 401, statusText: errorMessage });
    });
  });

  describe('delete', () => {
    it('should make DELETE request', () => {
      const endpoint = '/test/1';

      service.delete(endpoint).subscribe((data) => {
        expect(data).toBeUndefined();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl || 'http://localhost:3000'}${endpoint}`
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle DELETE request with response', () => {
      const mockData = { message: 'Deleted successfully' };
      const endpoint = '/test/1';

      service.delete(endpoint).subscribe((data) => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl || 'http://localhost:3000'}${endpoint}`
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(mockData);
    });

    it('should handle DELETE HTTP error', () => {
      const endpoint = '/test/1';
      const errorMessage = 'Forbidden';

      service.delete(endpoint).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(403);
          expect(error.statusText).toBe(errorMessage);
        },
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl || 'http://localhost:3000'}${endpoint}`
      );
      req.flush(errorMessage, { status: 403, statusText: errorMessage });
    });
  });

});
