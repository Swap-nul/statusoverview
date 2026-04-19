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

function createNoopMsalInstance(): IPublicClientApplication {
  return {
    initialize: async () => undefined,
    getAllAccounts: () => [],
    getActiveAccount: () => null,
    setActiveAccount: () => undefined,
    acquireTokenSilent: async () => {
      throw new Error('MSAL is disabled for demo mode');
    },
    acquireTokenPopup: async () => {
      throw new Error('MSAL is disabled for demo mode');
    },
    acquireTokenRedirect: async () => {
      throw new Error('MSAL is disabled for demo mode');
    },
    loginPopup: async () => {
      throw new Error('MSAL is disabled for demo mode');
    },
    loginRedirect: async () => {
      throw new Error('MSAL is disabled for demo mode');
    },
    logoutPopup: async () => undefined,
    logoutRedirect: async () => undefined,
    handleRedirectPromise: async () => null,
    addEventCallback: () => null,
    removeEventCallback: () => undefined,
    addPerformanceCallback: () => '',
    removePerformanceCallback: () => false,
    enableAccountStorageEvents: () => undefined,
    disableAccountStorageEvents: () => undefined,
    getTokenCache: () => {
      throw new Error('MSAL is disabled for demo mode');
    },
    getLogger: () => {
      throw new Error('MSAL is disabled for demo mode');
    },
    setLogger: () => undefined,
    setNavigationClient: () => undefined,
    getConfiguration: () => {
      throw new Error('MSAL is disabled for demo mode');
    },
    hydrateCache: async () => undefined,
    clearCache: async () => undefined,
    initializeWrapperLibrary: () => undefined,
    setActiveBroker: () => undefined,
  } as unknown as IPublicClientApplication;
}

export function initializeAzureMsal(
  configService: AppConfigService
): () => Promise<boolean> {
  return async () => {
    const authProvider = (configService.get('authProvider') || (await configService.loadConfig().then(() => configService.get('authProvider')))) ?? 'none';
    if (authProvider === 'none' || authProvider === 'keycloak') {
      console.log('Skipping Azure MSAL initialization for authProvider:', authProvider);
      return false;
    }

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

      // Create and initialize MSAL instance
      const msalInstance = new PublicClientApplication({
        auth: {
          clientId: azureConfig.clientId,
          authority: azureConfig.authority,
          redirectUri: azureConfig.redirectUri,
          postLogoutRedirectUri: azureConfig.postLogoutRedirectUri,
        },
        cache: {
          cacheLocation: BrowserCacheLocation.SessionStorage,
          storeAuthStateInCookie: false,
        },
        system: {
          loggerOptions: {
            loggerCallback: (level: LogLevel, message: string) => {
              if (level === LogLevel.Error) {
                console.error('MSAL:', message);
              }
            },
            logLevel: LogLevel.Warning,
            piiLoggingEnabled: false
          }
        }
      });

      // Initialize the MSAL instance
      await msalInstance.initialize();
      console.log('Azure MSAL instance initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Azure MSAL initialization failed:', error);
      return false;
    }
  };
}

export function MSALInstanceFactory(configService: AppConfigService): IPublicClientApplication {
  const authProvider = (configService.get('authProvider') || 'none') as string;

  if (authProvider === 'none' || authProvider === 'keycloak') {
    return createNoopMsalInstance();
  }

  // Get Azure configuration
  let azureConfig;
  try {
    azureConfig = configService.get('azure') || environment.azure;
  } catch (error) {
    azureConfig = environment.azure;
  }

  const msalInstance = new PublicClientApplication({
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
            console.error('MSAL:', message);
          }
        },
        logLevel: LogLevel.Warning,
        piiLoggingEnabled: false
      }
    }
  });

  // Initialize the instance immediately
  msalInstance.initialize().catch(error => {
    console.error('MSAL instance initialization failed:', error);
  });

  return msalInstance;
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
