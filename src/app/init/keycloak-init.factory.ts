import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../environments/environment';
import { AppConfigService } from '../app-config.service';

export function initializeKeycloak(
  keycloak: KeycloakService,
  configService: AppConfigService
): () => Promise<boolean> {
  return () => {
    console.log('Initializing Keycloak...');
    
    // Get authentication configuration with fallback
    let authConfig;
    try {
      authConfig = configService.get('authentication');
    } catch (error) {
      console.warn('Config not ready during Keycloak init, using defaults');
      authConfig = null;
    }
    
    // Use fallback values if config is not available
    const skipUrls = authConfig?.skipUrls || ['/assets', '/login', '/realms/', 'keycloak'];
    const skipDomains = authConfig?.skipDomains || ['localhost:3000'];
    
    // Combine skip patterns for bearer excluded URLs
    const bearerExcludedUrls = [...skipUrls, ...skipDomains];
    
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
      bearerExcludedUrls: bearerExcludedUrls,
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
