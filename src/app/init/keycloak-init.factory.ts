import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../environments/environment';

export function initializeKeycloak(
  keycloak: KeycloakService
): () => Promise<boolean> {
  return () => {
    console.log('Initializing Keycloak...');
    
    return keycloak.init({
      config: {
        url: environment.keycloak.url,
        realm: environment.keycloak.realm,
        clientId: environment.keycloak.clientId
      },
      initOptions: {
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri:
          window.location.origin + '/assets/silent-check-sso.html',
        pkceMethod: 'S256',
        flow: 'standard',
        checkLoginIframe: false
      },
      enableBearerInterceptor: false, // Disable built-in interceptor, we'll use our own
      bearerExcludedUrls: ['/assets', '/login', '/realms/', 'keycloak'],
      bearerPrefix: 'Bearer',
      loadUserProfileAtStartUp: false // Load profile only when needed
    }).then((authenticated) => {
      console.log('Keycloak initialization completed. Authenticated:', authenticated);
      return authenticated;
    }).catch((error) => {
      console.warn('Keycloak initialization failed:', error);
      // Return false to allow app to continue without authentication
      console.error('Keycloak initialization failed:', error);
      window.alert('Authentication service is unavailable. Please try again later.');
      throw new Error('Keycloak initialization failed: ' + error);
    });
  };
}
