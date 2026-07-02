import { Component, OnInit, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { OverlayContainer } from '@angular/cdk/overlay';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  currentView: 'projects' | 'calendar' = 'projects';

  constructor(
    private overlay: OverlayContainer,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    this.applyDarkTheme();
  }

  private applyDarkTheme() {
    const darkClassName = 'darkMode';
    this.overlay.getContainerElement().classList.add(darkClassName);
    this.document.body.classList.add(darkClassName);
  }

  setDashboardView(view: 'projects' | 'calendar') {
    this.currentView = view;
  }
}
