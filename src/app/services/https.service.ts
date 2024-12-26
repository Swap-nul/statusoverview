import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError } from 'rxjs';
import { ErrorHandlerService } from './error-handler.service';

const ENDPOINT_PREFIX = 'https://';

@Injectable({
  providedIn: 'root'
})
export class HttpsService {

  constructor(private http: HttpClient, private errorHandlerService: ErrorHandlerService) { }

  get<T = any>(endpoint: string, options?: object): Observable<T> {
    return this.http.get<T>(`${ENDPOINT_PREFIX}${endpoint}`, options).pipe(catchError(this.errorHandlerService.handleError));
  }

  post<T = any>(endpoint: string, data: any, options?: object): Observable<T> {
    return this.http.post<T>(`${ENDPOINT_PREFIX}${endpoint}`, data, options);
  }
}
