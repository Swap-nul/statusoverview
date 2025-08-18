import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private config: any;

  constructor(private http: HttpClient) {}

  loadConfig() {
    return this.http
      .get('/assets/config.json')
      .toPromise()
      .then((config) => (this.config = config));
  }

  get(key: string) {
    if (!this.config) {
      console.warn(`Config not loaded yet, cannot access key: ${key}`);
      return null;
    }
    return this.config[key];
  }
}
