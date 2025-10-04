import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { KeycloakService } from 'keycloak-angular';
import { AppConfigService } from '../app-config.service';
import { AuthProviderService } from '../services/auth-provider.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(
    private keycloakService: KeycloakService,
    private configService: AppConfigService,
    private authProviderService: AuthProviderService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Always skip the config.json request to avoid circular dependency
    if (req.url.includes('/assets/config.json')) {
      return next.handle(req);
    }
    
    // Get skip URLs and domains from configuration with fallback for when config isn't loaded yet
    let authConfig;
    try {
      authConfig = this.configService.get('authentication');
    } catch (error) {
      // Config not loaded yet, use defaults
      authConfig = null;
    }
    
    // Use fallback values if config is not available or authentication section is missing
    const skipUrls = authConfig?.skipUrls || ['/assets/', '/login', '/silent-check-sso.html', 'keycloak', '/realms/'];
    const skipDomains = authConfig?.skipDomains || ['localhost:3000'];
    
    // Combine skipUrls and skipDomains for checking
    const allSkipPatterns = [...skipUrls, ...skipDomains];
    const shouldSkip = allSkipPatterns.some(pattern => req.url.includes(pattern));
    
    if (shouldSkip) {
      return next.handle(req);
    }

    // Get token from the current authentication provider
    return from(this.authProviderService.getAccessToken()).pipe(
      switchMap(token => {
        if (token) {
          const authReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
          return next.handle(authReq);
        }

        // Fallback: Check Keycloak directly for backward compatibility
        return this.handleKeycloakFallback(req, next);
      })
    );
  }

  private handleKeycloakFallback(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
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
    
    // Proceed without token if no auth provider is ready or user is not authenticated
    return next.handle(req);
  }
}
