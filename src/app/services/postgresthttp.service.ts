import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../app-config.service';

@Injectable({
  providedIn: 'root',
})
export class PostgRestHttpService {
  constructor(
    private http: HttpClient,
    private configService: AppConfigService
  ) {}
  ENDPOINT_PREFIX = this.configService.get('database_hostname_port');

  get<T = any>(endpoint: string, options?: object): Observable<T> {
    return this.http.get<T>(`${this.ENDPOINT_PREFIX}${endpoint}`, options);
  }

  post<T = any>(endpoint: string, data: any, options?: object): Observable<T> {
    return this.http.post<T>(
      `${this.ENDPOINT_PREFIX}${endpoint}`,
      data,
      options
    );
  }
}
