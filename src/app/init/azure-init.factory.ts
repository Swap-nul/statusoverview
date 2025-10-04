import { 
  MsalService, 
  MsalGuardConfiguration, 
  MsalInterceptorConfiguration,
  MSAL_GUARD_CONFIG,
  MSAL_INTERCEPTOR_CONFIG
} from '@azure/msal-angular';
import { 
  IPublicClientApplication, 
  PublicClientApplication,
  InteractionType,
  BrowserCacheLocation,
  LogLevel
} from '@azure/msal-browser';
import { environment } from '../../environments/environment';
import { AppConfigService } from '../app-config.service';

export function initializeAzureMsal(
  configService: AppConfigService
): () => Promise<boolean> {
  return async () => {
    console.log('Initializing Azure MSAL...');
    
    try {
      // Get Azure configuration with fallback
      let azureConfig;
      try {
        azureConfig = configService.get('azure');
      } catch (error) {
        console.warn('Config not ready during Azure MSAL init, using environment defaults');
        azureConfig = environment.azure;
      }

      if (!azureConfig || !azureConfig.clientId) {
        console.warn('Azure configuration not found, skipping MSAL initialization');
        return false;
      }

      console.log('Azure MSAL configuration loaded successfully');
      return true;
    } catch (error) {
      console.error('Azure MSAL initialization failed:', error);
      return false;
    }
  };
}

export function MSALInstanceFactory(configService: AppConfigService): IPublicClientApplication {
  // Get Azure configuration
  let azureConfig;
  try {
    azureConfig = configService.get('azure') || environment.azure;
  } catch (error) {
    azureConfig = environment.azure;
  }

  return new PublicClientApplication({
    auth: {
      clientId: azureConfig.clientId,
      authority: azureConfig.authority,
      redirectUri: azureConfig.redirectUri,
      postLogoutRedirectUri: azureConfig.postLogoutRedirectUri,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.SessionStorage,
      storeAuthStateInCookie: false, // Set to true for IE11 or Edge
    },
    system: {
      loggerOptions: {
        loggerCallback: (level: LogLevel, message: string) => {
          if (level === LogLevel.Error) {
            console.error(message);
          }
        },
        logLevel: LogLevel.Warning,
        piiLoggingEnabled: false
      }
    }
  });
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return { 
    interactionType: InteractionType.Popup,
    authRequest: {
      scopes: ['user.read']
    },
    loginFailedRoute: '/login'
  };
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  
  // Add Microsoft Graph API
  protectedResourceMap.set('https://graph.microsoft.com/v1.0/me', ['user.read']);
  
  return {
    interactionType: InteractionType.Popup,
    protectedResourceMap
  };
}