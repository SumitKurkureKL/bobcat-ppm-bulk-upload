import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: any) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          try {
            localStorage.removeItem('userDetails');
            localStorage.removeItem('projectDetails');
            localStorage.removeItem('droppedItems');
            localStorage.removeItem('appConfig');
            localStorage.removeItem('user_type');
            localStorage.removeItem('activeEvent');
            localStorage.removeItem('activeType');    
            // const baseUrl = window.location.origin;
            // window.location.href = `${baseUrl}/#/p/login`;
            if (window.parent?.location.href) {
                const mainUrl = window.location.href.split('/#/');
                window.parent.location.href = mainUrl[0] + '/#/p/login';
              }
          } catch (e) {
            console.error('Error clearing localStorage on 401:', e);
          }
        }
        return throwError(() => error);
      })
    );
  }
} 