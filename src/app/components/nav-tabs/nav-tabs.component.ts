import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Entity } from 'src/app/models/data-model/entity';

@Component({
  selector: 'app-nav-tabs',
  templateUrl: './nav-tabs.component.html',
  styleUrls: ['./nav-tabs.component.scss'],
})
export class NavTabsComponent {
  projects: Entity[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadProjects();
  }

  private loadProjects() {
    this.http
      .get<{ projects: Entity[] }>('/assets/config.json')
      .subscribe((data) => {
        this.projects = data.projects;
      });
  }
}
