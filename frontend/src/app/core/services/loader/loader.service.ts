import { HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  public loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );

  private requests: HttpRequest<unknown>[] = [];

  onRequestStarted(request: HttpRequest<unknown>) {
    this.requests.push(request);
    this.loading$.next(true);
  }

  onRequestFinished(request: HttpRequest<unknown>) {
    const indes = this.requests.indexOf(request);
    if (indes !== -1) {
      this.requests.splice(indes, 1);
    }
    if (this.requests.length === 0) {
      this.loading$.next(false);
    }
  }
}
