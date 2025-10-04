import { Component, EventEmitter, HostBinding, Output, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { AuthService } from '../../services/keycloak.service';

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

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Initialize the dark mode state immediately
    this.cssRefreshDarkMode.emit(this.toggleControl.value!);
    
    this.toggleControl.valueChanges.subscribe((darkMode) => {
      this.cssRefreshDarkMode.emit(darkMode!);
      this.mode = !this.mode;
      this.addCssDarkmode = this.mode;
    });

    // Check authentication status
    this.isAuthenticated = this.authService.isAuthenticated();
    if (this.isAuthenticated) {
      this.username = this.authService.getUsername();
      this.userRoles = this.authService.getUserRoles();
    }
  }

  logout(): void {
    this.authService.logout();
  }

  goToAccountManagement(): void {
    this.authService.redirectToAccountManagement();
  }
}
