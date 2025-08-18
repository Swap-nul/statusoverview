import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { AuthService } from '../services/keycloak.service';

@Directive({
  selector: '[appHasRole]'
})
export class HasRoleDirective implements OnInit {
  @Input() appHasRole!: string | string[];

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const hasRole = this.checkRole();
    if (hasRole) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }

  private checkRole(): boolean {
    if (!this.authService.isAuthenticated()) {
      return false;
    }

    const userRoles = this.authService.getUserRoles();
    
    if (Array.isArray(this.appHasRole)) {
      return this.appHasRole.some(role => userRoles.includes(role));
    } else {
      return userRoles.includes(this.appHasRole);
    }
  }
}
