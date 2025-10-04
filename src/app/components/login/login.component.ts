import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthProviderService, AuthProvider } from '../../services/auth-provider.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  
  availableProviders: AuthProvider[] = [];
  isLoading = false;
  errorMessage = '';
  returnUrl = '/dashboard';
  
  constructor(
    private authProviderService: AuthProviderService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get return URL from query parameters
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    
    // Check if already authenticated
    this.checkExistingAuthentication();
    
    // Get available authentication providers
    this.availableProviders = this.authProviderService.getAvailableProviders();
  }

  private async checkExistingAuthentication(): Promise<void> {
    try {
      const isAuthenticated = await this.authProviderService.isAuthenticated();
      if (isAuthenticated) {
        this.router.navigate([this.returnUrl]);
      }
    } catch (error) {
      console.warn('Error checking authentication:', error);
    }
  }

  async login(provider: AuthProvider): Promise<void> {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.clearError();
    
    try {
      await this.authProviderService.login(provider);
      // Successful login will redirect automatically
      this.router.navigate([this.returnUrl]);
    } catch (error) {
      console.error('Login failed:', error);
      this.errorMessage = `Login failed with ${this.getProviderDisplayName(provider)}. Please try again.`;
    } finally {
      this.isLoading = false;
    }
  }

  getProviderDisplayName(provider: AuthProvider): string {
    switch (provider) {
      case 'keycloak':
        return 'Keycloak';
      case 'azure':
        return 'Microsoft Azure';
      default:
        return 'Unknown Provider';
    }
  }

  getProviderIcon(provider: AuthProvider): string {
    switch (provider) {
      case 'keycloak':
        return 'login';
      case 'azure':
        return 'cloud';
      default:
        return 'login';
    }
  }

  getProviderColor(provider: AuthProvider): string {
    switch (provider) {
      case 'keycloak':
        return 'primary';
      case 'azure':
        return 'accent';
      default:
        return 'primary';
    }
  }

  clearError(): void {
    this.errorMessage = '';
  }
}
