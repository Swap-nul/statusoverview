import { Component } from '@angular/core';
import { AuthService } from '../../services/keycloak.service';
import { OverlayContainer } from '@angular/cdk/overlay';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  constructor(private overlay: OverlayContainer) {}
  addCss = true; // set 'initial state' based on your needs

  refreshCss(darkMode: boolean) {
    const darkClassName = 'darkMode';
    this.addCss = darkMode;
    if (darkMode) {
      this.overlay.getContainerElement().classList.add(darkClassName);
    } else {
      this.overlay.getContainerElement().classList.remove(darkClassName);
    }
  }
}
