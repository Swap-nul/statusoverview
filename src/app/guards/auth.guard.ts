import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { KeycloakAuthGuard, KeycloakService } from 'keycloak-angular';
import { AuthProviderService } from '../services/auth-provider.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
    private keycloakService: KeycloakService,
    private authProviderService: AuthProviderService
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    
    // Check if user is authenticated with any provider
    const isAuthenticated = await this.authProviderService.isAuthenticated();
    
    if (!isAuthenticated) {
      // Redirect to login page instead of directly to provider
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: state.url } 
      });
      return false;
    }

    // Get the roles required from the route.
    const requiredRoles = route.data['roles'];

    // Allow the user to proceed if no additional roles are required to access the route.
    if (!(requiredRoles instanceof Array) || requiredRoles.length === 0) {
      return true;
    }

    // Check roles based on current provider
    return this.checkUserRoles(requiredRoles);
  }

  private async checkUserRoles(requiredRoles: string[]): Promise<boolean> {
    try {
      const userInfo = await this.authProviderService.getUserInfo();
      
      if (!userInfo || !userInfo.roles) {
        return false;
      }

      // Allow the user to proceed if all the required roles are present.
      return requiredRoles.every((role) => userInfo.roles.includes(role));
    } catch (error) {
      console.warn('Error checking user roles:', error);
      return false;
    }
  }
}