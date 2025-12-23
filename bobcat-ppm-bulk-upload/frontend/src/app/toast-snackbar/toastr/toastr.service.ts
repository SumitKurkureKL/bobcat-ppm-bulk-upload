import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { ToastrState } from './toastr-state';

@Injectable({
  providedIn: 'root',
})
export class ToastrService {
  private loaderSubject = new Subject<ToastrState>();
  public loaderState = this.loaderSubject.asObservable();

  toast(Type: string, Title: string, Body: string, Close: boolean, time_out ?: number) {
    this.loaderSubject.next(<ToastrState>{
      type: Type,
      title: Title,
      body: Body,
      close: Close,
      timeOut: time_out ? time_out : null,
    });
  }
}
