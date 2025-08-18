import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  constructor(private keycloakService: KeycloakService) {}

  /**
   * Check if Keycloak is initialized
   */
  private isKeycloakReady(): boolean {
    try {
      return !!this.keycloakService.getKeycloakInstance();
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    try {
      return this.isKeycloakReady() && this.keycloakService.isLoggedIn();
    } catch (error) {
      console.warn('Error checking authentication status:', error);
      return false;
    }
  }

  /**
   * Get user profile information
   */
  getUserProfile() {
    if (!this.isKeycloakReady()) {
      return Promise.reject('Keycloak not initialized');
    }
    return this.keycloakService.loadUserProfile();
  }

  /**
   * Get username
   */
  getUsername(): string {
    try {
      return this.isKeycloakReady() ? this.keycloakService.getUsername() : '';
    } catch (error) {
      console.warn('Error getting username:', error);
      return '';
    }
  }

  /**
   * Get user roles
   */
  getUserRoles(): string[] {
    try {
      return this.isKeycloakReady() ? this.keycloakService.getUserRoles() : [];
    } catch (error) {
      console.warn('Error getting user roles:', error);
      return [];
    }
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    try {
      return this.isKeycloakReady() && this.keycloakService.isUserInRole(role);
    } catch (error) {
      console.warn('Error checking user role:', error);
      return false;
    }
  }

  /**
   * Get access token
   */
  getToken(): Promise<string> {
    if (!this.isKeycloakReady()) {
      return Promise.reject('Keycloak not initialized');
    }
    return this.keycloakService.getToken();
  }

  /**
   * Login user
   */
  login(): Promise<void> {
    if (!this.isKeycloakReady()) {
      return Promise.reject('Keycloak not initialized');
    }
    return this.keycloakService.login();
  }

  /**
   * Logout user
   */
  logout(): void {
    try {
      if (this.isKeycloakReady()) {
        this.keycloakService.logout();
      }
    } catch (error) {
      console.warn('Error during logout:', error);
    }
  }

  /**
   * Redirect to account management
   */
  redirectToAccountManagement(): void {
    try {
      if (this.isKeycloakReady()) {
        this.keycloakService.getKeycloakInstance().accountManagement();
      }
    } catch (error) {
      console.warn('Error redirecting to account management:', error);
    }
  }

  /**
   * Update token
   */
  updateToken(minValidity: number = 30): Promise<boolean> {
    if (!this.isKeycloakReady()) {
      return Promise.reject('Keycloak not initialized');
    }
    return this.keycloakService.updateToken(minValidity);
  }
}
