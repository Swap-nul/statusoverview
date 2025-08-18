import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(private keycloakService: KeycloakService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip token injection for certain URLs
    const skipUrls = ['/assets/', '/login', '/silent-check-sso.html', 'keycloak', '/realms/', 'localhost:3000'];
    const shouldSkip = skipUrls.some(url => req.url.includes(url));
    
    if (shouldSkip) {
      return next.handle(req);
    }

    // Check if Keycloak is initialized and user is authenticated
    try {
      const keycloakInstance = this.keycloakService.getKeycloakInstance();
      
      // Ensure Keycloak instance exists and has a token
      if (keycloakInstance && keycloakInstance.token && this.keycloakService.isLoggedIn()) {
        // Clone the request and add the authorization header
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${keycloakInstance.token}`
          }
        });
        return next.handle(authReq);
      }
    } catch (error) {
      // If there's an error accessing Keycloak, just proceed without token
      console.warn('Keycloak not ready, proceeding without token:', error);
    }
    
    // Proceed without token if Keycloak is not ready or user is not authenticated
    return next.handle(req);
  }
}
