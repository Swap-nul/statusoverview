import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Sort } from '@angular/material/sort';
import { BehaviorSubject, Subject, takeUntil, Observable } from 'rxjs';
import { AppDataSource } from 'src/app/models/dataSource/AppDataSource';
import { PROJECT_ALPHA } from 'src/app/models/ELEMENT_DATA';
import { App } from 'src/app/models/tagsVersionModels/App';
import { ApplicationsService } from 'src/app/services/applications.service';
import {
  EnvDetailsDialogData,
  EnvDetailsDialogComponent,
} from '../../env-details-dialog/env-details-dialog.component';

@Component({
  selector: 'app-project-alpha',
  templateUrl: './project-alpha.component.html',
  styleUrl: './project-alpha.component.scss',
})
export class ProjectAlphaComponent implements OnInit, OnDestroy {
  constructor(
    public dialog: MatDialog,
    private applicationService: ApplicationsService
  ) {}

  isLoading = true;
  displayedColumns: string[];
  columnDef: string[] = [
    'position',
    'name',
    'alpha',
    'qa',
    'qa2',
    'uat',
    'staging',
    'staging1',
    'staging2',
    'prod',
    'dr',
  ];
  envs: string[];
  selectedEnvs: string[];
  envForm: FormControl;

  environments = [
    { name: 'alpha', displayName: 'ALPHA' },
    { name: 'qa', displayName: 'QA' },
    { name: 'qa2', displayName: 'QA2' },
    { name: 'uat', displayName: 'UAT' },
    { name: 'staging', displayName: 'STG' },
    { name: 'staging1', displayName: 'STG1' },
    { name: 'staging2', displayName: 'STG2' },
    { name: 'prod', displayName: 'PROD' },
    { name: 'dr', displayName: 'DR' },
  ];

  dataTableApps: App[] = [];
  dataSource: AppDataSource;
  dataApp = new BehaviorSubject<App[]>([]);
  displayedColumnsSubject = new BehaviorSubject<string[]>(this.columnDef);
  displayedColumnsSubject$ = this.displayedColumnsSubject.asObservable();
  componentDestroyed$: Subject<boolean> = new Subject();

  ngOnInit() {
    this.dataSource = new AppDataSource(this.dataApp);
    this.applicationService
      .getAppDeployments()
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((apps) => {
        apps.forEach((app) => {
          if (PROJECT_ALPHA.includes(app.app_name)) {
            this.applicationService
              .fillLatestBuildTagForEachEnv(app)
              .then((updateApp) => {
                this.dataTableApps.push(updateApp);
                this.dataApp.next(this.dataTableApps);
              });
          }
        });
        this.isLoading = false;
      });
    this.getDisplayedColumns()
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((columnsToDisplay) => {
        this.displayedColumns = columnsToDisplay;
      });
    this.envs = this.displayedColumns.slice();
    this.envs = this.envs
      .filter((col) => !col.includes('position'))
      .filter((col) => !col.includes('name'));
    this.envForm = new FormControl(this.envs);
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
    data = data.filter((app) =>
      app.app_name.includes(filterValue.trim().toLowerCase())
    );
    this.dataApp.next(data);
  }

  filterColumn(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;

    if (filterValue != '') {
      let columnsToDisplay: string[] = ['position', 'name'];
      let filteredColumns: string[] = this.columnDef.slice();
      filteredColumns = filteredColumns.filter((columnName) =>
        columnName.includes(filterValue.trim().toLowerCase())
      );
      filteredColumns.forEach((c) => columnsToDisplay.push(c));
      this.displayedColumnsSubject.next(columnsToDisplay);
    } else {
      this.displayedColumnsSubject.next(this.columnDef);
    }
  }

  filterSelectedColumns() {
    let selectedColumns = this.envForm.value;
    if (selectedColumns != '') {
      let columnsToDisplay: string[] = ['position', 'name'];
      let filteredColumns: string[] = selectedColumns;
      filteredColumns.forEach((c) => columnsToDisplay.push(c));
      this.displayedColumnsSubject.next(columnsToDisplay);
    } else {
      this.displayedColumnsSubject.next(this.columnDef);
    }
  }

  getDisplayedColumns(): Observable<string[]> {
    return this.displayedColumnsSubject$;
  }

  downloadCSV(environment: string) {
    let data = this.dataTableApps.slice();
    this.applicationService.downloadCSV(environment, data);
  }
}
