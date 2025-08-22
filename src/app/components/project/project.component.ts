import { HttpClient } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Sort } from '@angular/material/sort';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import { Entity } from 'src/app/models/data-model/entity';
import { AppDataSource } from 'src/app/models/data-source/app-dataSource';
import { App } from 'src/app/models/tag-version/app';
import { ApplicationsService } from 'src/app/services/applications.service';
import { EnvDetailsDialogComponent, EnvDetailsDialogData } from '../env-details-dialog/env-details-dialog.component';
import { BulkDeployDialogComponent, BulkDeployDialogData } from '../bulk-deploy-dialog/bulk-deploy-dialog.component';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrl: './project.component.scss',
})
export class ProjectComponent implements OnInit, OnDestroy {
  @Input() projectName: string;
  constructor(public dialog: MatDialog, private applicationService: ApplicationsService, private http: HttpClient) {}

  isLoading = true;
  columnDef: string[] = ['position', 'name'];

  selectedProject: Entity | undefined;

  envs: string[] = [];
  envForm: FormControl;
  environmentsFilterForProject: Entity[];

  dataTableApps: App[] = [];
  dataSource: AppDataSource;
  dataApp = new BehaviorSubject<App[]>([]);

  displayedColumns: string[];
  displayedColumnsSubject = new BehaviorSubject<string[]>(this.columnDef);
  displayedColumnsSubject$ = this.displayedColumnsSubject.asObservable();

  componentDestroyed$: Subject<boolean> = new Subject();

  ngOnInit() {
    this.dataSource = new AppDataSource(this.dataApp);
    this.loadProjects();
  }

  loadProjects() {
    this.http.get<{ projects: Entity[]; environments: Entity[] }>('/assets/config.json').subscribe((data) => {
      let allEnvironmentsFromConfig = data.environments;

      // Find the selected project configuration
      this.selectedProject = data.projects.find((project) => project.name === this.projectName);

      if (!this.selectedProject) {
        console.error(`Project ${this.projectName} not found in config.json`);
        return;
      }

      this.fetchAppsAndFilterForSelectedProject(allEnvironmentsFromConfig);
    });
  }

  fetchAppsAndFilterForSelectedProject(allEnvironmentsFromConfig: Entity[]) {
    this.applicationService
      .getFilteredAppsByProjectAndDeployments(this.selectedProject!.displayName)
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((apps) => {
        let projectEnvironments = new Set<string>();

        // Collect all promises from fillLatestBuildTagForEachEnv
        let updatePromises = apps.map((app) => {
          return this.applicationService.fillLatestBuildTagForEachEnv(app).then((updatedApp) => {
            this.dataTableApps.push(updatedApp);
            this.dataApp.next(this.dataTableApps);

            // Collect unique environments (ignore null values)
            Object.keys(updatedApp).forEach((key) => {
              if ((updatedApp as Record<string, any>)[key] != null) {
                projectEnvironments.add(key);
              }
            });
          });
        });

        // Wait for all promises to complete
        Promise.all(updatePromises).then(() => {
          this.isLoading = false;

          // Filter environments dynamically based on the project
          this.environmentsFilterForProject = allEnvironmentsFromConfig.filter((e) => projectEnvironments.has(e.name));

          // Update `envs` and `displayedColumns`
          this.envs = this.environmentsFilterForProject.map((e) => e.name);
          this.envForm = new FormControl(this.envs);

          // Subscribe to envForm changes for automatic filtering
          this.envForm.valueChanges
            .pipe(takeUntil(this.componentDestroyed$))
            .subscribe(() => {
              this.filterSelectedColumns();
            });

          this.resetColumns();
        });
      });

    // Subscribe to column updates
    this.getDisplayedColumns()
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((columnsToDisplay) => {
        this.displayedColumns = columnsToDisplay;
      });
  }

  ngOnDestroy() {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  onSortData(sort: Sort) {
    let data = this.dataTableApps.slice();
    data = this.applicationService.sortByAppName(sort, data);
    this.dataApp.next(data);
  }

  sortTableBy(sort: Sort, env: string) {
    let data = this.dataTableApps.slice();
    data = this.applicationService.sortTableBy(sort, data, env);
    this.dataApp.next(data);
  }

  openEnvInfoDialog(parent: string, env: string) {
    const data: EnvDetailsDialogData = { parent: parent, env: env };
    this.dialog.open(EnvDetailsDialogComponent, { data });
  }

  goToRepos(githubUrl: string) {
    window.open(githubUrl);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    let data = this.dataTableApps.slice();
    data = data.filter((app) => app.app_name.includes(filterValue.trim().toLowerCase()));
    this.dataApp.next(data);
  }

  filterColumn(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;

    if (filterValue != '') {
      let columnsToDisplay: string[] = ['position', 'name'];
      let filteredColumns: string[] = this.envs.slice();
      filteredColumns = filteredColumns.filter((columnName) => columnName.includes(filterValue.trim().toLowerCase()));
      filteredColumns.forEach((c) => columnsToDisplay.push(c));
      this.displayedColumnsSubject.next(columnsToDisplay);
    } else {
      this.resetColumns();
    }
  }

  resetColumns() {
    let columnsToDisplay: string[] = ['position', 'name'];
    this.envs.forEach((e) => columnsToDisplay.push(e));
    this.displayedColumnsSubject.next(columnsToDisplay);
  }

  filterSelectedColumns() {
    let selectedColumns = this.envForm.value;
    if (selectedColumns != '') {
      let columnsToDisplay: string[] = ['position', 'name'];
      let filteredColumns: string[] = selectedColumns;
      filteredColumns.forEach((c) => columnsToDisplay.push(c));
      this.displayedColumnsSubject.next(columnsToDisplay);
    } else {
      this.resetColumns();
    }
  }

  getDisplayedColumns(): Observable<string[]> {
    return this.displayedColumnsSubject$;
  }

  downloadCSV(environment: string) {
    let data = this.dataTableApps.slice();
    this.applicationService.downloadCSV(environment, data);
  }

  toggleSelectAll() {
    if (this.isAllSelected()) {
      // If all are selected, deselect all
      this.envForm.setValue([]);
    } else {
      // If not all are selected, select all
      this.envForm.setValue([...this.envs]);
    }
    // Filtering will be triggered automatically by valueChanges subscription
  }

  isAllSelected(): boolean {
    const selectedValues = this.envForm.value || [];
    return selectedValues.length === this.envs.length;
  }

  isIndeterminate(): boolean {
    const selectedValues = this.envForm.value || [];
    return selectedValues.length > 0 && selectedValues.length < this.envs.length;
  }

  openBulkDeployDialog() {
    const dialogData: BulkDeployDialogData = {
      projectName: this.projectName,
      environments: this.environmentsFilterForProject,
      apps: this.dataTableApps
    };

    const dialogRef = this.dialog.open(BulkDeployDialogComponent, {
      width: '1000px',
      maxWidth: '95vw',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        // Optionally refresh the data or show a success message
        console.log('Bulk deployment initiated successfully', result.response);
        
        // You might want to refresh the data to reflect any changes
        // this.loadProjects();
      }
    });
  }
}
