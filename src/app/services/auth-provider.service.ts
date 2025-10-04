import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo, AuthenticationResult } from '@azure/msal-browser';
import { AppConfigService } from '../app-config.service';

export type AuthProvider = 'keycloak' | 'azure' | 'both';

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  roles: string[];
  provider: AuthProvider;
}

@Injectable({
  providedIn: 'root'
})
export class AuthProviderService {
  private currentProvider: AuthProvider = 'keycloak';
  
  constructor(
    private keycloakService: KeycloakService,
    private msalService: MsalService,
    private configService: AppConfigService
  ) {
    this.initializeCurrentProvider();
  }

  private initializeCurrentProvider(): void {
    const configProvider = this.configService.get('authProvider') || 'keycloak';
    this.currentProvider = configProvider;
  }

  /**
   * Set the active authentication provider
   */
  setProvider(provider: AuthProvider): void {
    this.currentProvider = provider;
    localStorage.setItem('authProvider', provider);
  }

  /**
   * Get the current authentication provider
   */
  getCurrentProvider(): AuthProvider {
    const stored = localStorage.getItem('authProvider') as AuthProvider;
    return stored || this.currentProvider;
  }

  /**
   * Check if user is authenticated with any provider
   */
  async isAuthenticated(): Promise<boolean> {
    const provider = this.getCurrentProvider();
    
    switch (provider) {
      case 'keycloak':
        return this.isKeycloakAuthenticated();
      case 'azure':
        return this.isAzureAuthenticated();
      case 'both':
        // Check if authenticated with either provider
        const keycloakAuth = this.isKeycloakAuthenticated();
        const azureAuth = this.isAzureAuthenticated();
        return keycloakAuth || azureAuth;
      default:
        return false;
    }
  }

  /**
   * Login with specified provider
   */
  async login(provider?: AuthProvider): Promise<void> {
    const targetProvider = provider || this.getCurrentProvider();
    this.setProvider(targetProvider);

    switch (targetProvider) {
      case 'keycloak':
        return this.loginWithKeycloak();
      case 'azure':
        return this.loginWithAzure();
      default:
        throw new Error(`Unsupported provider: ${targetProvider}`);
    }
  }

  /**
   * Logout from current provider
   */
  async logout(): Promise<void> {
    const provider = this.getCurrentProvider();

    switch (provider) {
      case 'keycloak':
        return this.logoutFromKeycloak();
      case 'azure':
        return this.logoutFromAzure();
      case 'both':
        // Logout from both providers
        await this.logoutFromKeycloak();
        await this.logoutFromAzure();
        break;
    }

    localStorage.removeItem('authProvider');
  }

  /**
   * Get access token from current provider
   */
  async getAccessToken(): Promise<string | null> {
    const provider = this.getCurrentProvider();

    switch (provider) {
      case 'keycloak':
        return this.getKeycloakToken();
      case 'azure':
        return this.getAzureToken();
      case 'both':
        // Try to get token from the provider that has an active session
        const keycloakToken = await this.getKeycloakToken();
        if (keycloakToken) return keycloakToken;
        
        const azureToken = await this.getAzureToken();
        if (azureToken) return azureToken;
        
        return null;
      default:
        return null;
    }
  }

  /**
   * Get user information from current provider
   */
  async getUserInfo(): Promise<UserInfo | null> {
    const provider = this.getCurrentProvider();

    switch (provider) {
      case 'keycloak':
        return this.getKeycloakUserInfo();
      case 'azure':
        return this.getAzureUserInfo();
      case 'both':
        // Try to get user info from the provider that has an active session
        if (this.isKeycloakAuthenticated()) {
          return this.getKeycloakUserInfo();
        }
        if (this.isAzureAuthenticated()) {
          return this.getAzureUserInfo();
        }
        return null;
      default:
        return null;
    }
  }

  /**
   * Get available authentication providers based on configuration
   */
  getAvailableProviders(): AuthProvider[] {
    const configProvider = this.configService.get('authProvider') || 'keycloak';
    
    switch (configProvider) {
      case 'both':
        return ['keycloak', 'azure'];
      case 'keycloak':
        return ['keycloak'];
      case 'azure':
        return ['azure'];
      default:
        return ['keycloak'];
    }
  }

  // Keycloak specific methods
  private isKeycloakAuthenticated(): boolean {
    try {
      return this.keycloakService.isLoggedIn();
    } catch (error) {
      console.warn('Error checking Keycloak authentication:', error);
      return false;
    }
  }

  private async loginWithKeycloak(): Promise<void> {
    try {
      await this.keycloakService.login();
    } catch (error) {
      console.error('Keycloak login failed:', error);
      throw error;
    }
  }

  private async logoutFromKeycloak(): Promise<void> {
    try {
      if (this.isKeycloakAuthenticated()) {
        await this.keycloakService.logout();
      }
    } catch (error) {
      console.warn('Error during Keycloak logout:', error);
    }
  }

  private async getKeycloakToken(): Promise<string | null> {
    try {
      if (this.isKeycloakAuthenticated()) {
        return await this.keycloakService.getToken();
      }
      return null;
    } catch (error) {
      console.warn('Error getting Keycloak token:', error);
      return null;
    }
  }

  private async getKeycloakUserInfo(): Promise<UserInfo | null> {
    try {
      if (!this.isKeycloakAuthenticated()) return null;

      const userProfile = await this.keycloakService.loadUserProfile();
      const roles = this.keycloakService.getUserRoles();

      return {
        id: userProfile.id || '',
        name: `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim(),
        email: userProfile.email || '',
        roles: roles,
        provider: 'keycloak'
      };
    } catch (error) {
      console.warn('Error getting Keycloak user info:', error);
      return null;
    }
  }

  // Azure MSAL specific methods
  private isAzureAuthenticated(): boolean {
    try {
      const accounts = this.msalService.instance.getAllAccounts();
      return accounts.length > 0;
    } catch (error) {
      console.warn('Error checking Azure authentication:', error);
      return false;
    }
  }

  private async loginWithAzure(): Promise<void> {
    try {
      const result = await this.msalService.loginPopup({
        scopes: ['user.read']
      }).toPromise();
      if (result?.account) {
        this.msalService.instance.setActiveAccount(result.account);
      }
    } catch (error) {
      console.error('Azure login failed:', error);
      throw error;
    }
  }

  private async logoutFromAzure(): Promise<void> {
    try {
      if (this.isAzureAuthenticated()) {
        await this.msalService.logoutPopup();
      }
    } catch (error) {
      console.warn('Error during Azure logout:', error);
    }
  }

  private async getAzureToken(): Promise<string | null> {
    try {
      if (!this.isAzureAuthenticated()) return null;

      const accounts = this.msalService.instance.getAllAccounts();
      if (accounts.length === 0) return null;

      const result = await this.msalService.acquireTokenSilent({
        scopes: ['user.read'],
        account: accounts[0]
      }).toPromise();

      return result?.accessToken || null;
    } catch (error) {
      console.warn('Error getting Azure token:', error);
      return null;
    }
  }

  private async getAzureUserInfo(): Promise<UserInfo | null> {
    try {
      if (!this.isAzureAuthenticated()) return null;

      const accounts = this.msalService.instance.getAllAccounts();
      if (accounts.length === 0) return null;

      const account = accounts[0];
      return {
        id: account.homeAccountId,
        name: account.name || '',
        email: account.username || '',
        roles: [], // Azure roles would need to be fetched from additional API calls
        provider: 'azure'
      };
    } catch (error) {
      console.warn('Error getting Azure user info:', error);
      return null;
    }
  }
}