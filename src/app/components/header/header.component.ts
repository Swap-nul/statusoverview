import { Component, EventEmitter, HostBinding, Output, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { AuthProviderService, UserInfo } from '../../services/auth-provider.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @HostBinding('class') className = '';
  @Output() cssRefreshDarkMode = new EventEmitter<boolean>();
  toggleControl = new FormControl(true);
  mode: boolean = true; 
  addCssDarkmode = true;

  // Authentication properties
  isAuthenticated = false;
  username: string = '';
  userRoles: string[] = [];
  authProvider: string = '';
  userInfo: UserInfo | null = null;

  constructor(private authProviderService: AuthProviderService) {}

  async ngOnInit(): Promise<void> {
    // Initialize the dark mode state immediately
    this.cssRefreshDarkMode.emit(this.toggleControl.value!);
    
    this.toggleControl.valueChanges.subscribe((darkMode) => {
      this.cssRefreshDarkMode.emit(darkMode!);
      this.mode = !this.mode;
      this.addCssDarkmode = this.mode;
    });

    // Check authentication status for multi-provider
    await this.updateAuthenticationStatus();
    
    // Set up a periodic check for authentication status changes
    setInterval(() => {
      this.updateAuthenticationStatus();
    }, 5000); // Check every 5 seconds
  }

  private async updateAuthenticationStatus(): Promise<void> {
    try {
      this.isAuthenticated = await this.authProviderService.isAuthenticated();
      
      if (this.isAuthenticated) {
        this.userInfo = await this.authProviderService.getUserInfo();
        this.authProvider = this.authProviderService.getCurrentProvider();
        
        if (this.userInfo) {
          this.username = this.userInfo.name || this.userInfo.email || 'User';
          this.userRoles = this.userInfo.roles || [];
        }
      }
    } catch (error) {
      console.error('Error checking authentication status:', error);
      this.isAuthenticated = false;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.authProviderService.logout();
      // Reset authentication state
      this.isAuthenticated = false;
      this.username = '';
      this.userRoles = [];
      this.userInfo = null;
      this.authProvider = '';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  goToAccountManagement(): void {
    // Handle account management based on provider
    if (this.authProvider === 'azure') {
      // For Azure, we can redirect to Azure portal or show a message
      window.open('https://portal.azure.com', '_blank');
    } else if (this.authProvider === 'keycloak') {
      // For Keycloak, use the existing redirect (if available)
      try {
        // Try to use the old AuthService method if it exists
        const keycloakService = (window as any).keycloakService;
        if (keycloakService && keycloakService.redirectToAccountManagement) {
          keycloakService.redirectToAccountManagement();
        } else {
          console.warn('Keycloak account management not available');
        }
      } catch (error) {
        console.warn('Error accessing Keycloak account management:', error);
      }
    }
  }

  getProviderDisplayName(): string {
    switch (this.authProvider) {
      case 'azure':
        return 'Azure AD';
      case 'keycloak':
        return 'Keycloak';
      default:
        return 'Unknown';
    }
  }

  /**
   * Manually refresh authentication status
   * Can be called from other components when authentication state changes
   */
  async refreshAuthenticationStatus(): Promise<void> {
    await this.updateAuthenticationStatus();
  }
}
