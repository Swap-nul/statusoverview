import { Component, OnInit, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AuthService } from '../../services/keycloak.service';
import { OverlayContainer } from '@angular/cdk/overlay';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  constructor(
    private overlay: OverlayContainer,
    @Inject(DOCUMENT) private document: Document
  ) {}
  addCss = true; // set 'initial state' based on your needs

  ngOnInit() {
    // Initialize the theme on component load
    this.refreshCss(this.addCss);
  }

  refreshCss(darkMode: boolean) {
    const darkClassName = 'darkMode';
    this.addCss = darkMode;
    
    // Apply to overlay container (for dialogs, menus, etc.)
    if (darkMode) {
      this.overlay.getContainerElement().classList.add(darkClassName);
    } else {
      this.overlay.getContainerElement().classList.remove(darkClassName);
    }
    
    // Apply to body element for global theming
    if (darkMode) {
      this.document.body.classList.add(darkClassName);
    } else {
      this.document.body.classList.remove(darkClassName);
    }
  }
}
