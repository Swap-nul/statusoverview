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

interface ExpiryConfigEntry {
  appName: string;
  appType: string;
  expiryDate: string;
}

interface CountdownAlertThreshold {
  months?: number;
  days?: number;
}

interface ParentExpiryConfig {
  parent: string;
  expiryTime?: Record<string, ExpiryConfigEntry[]>;
}

interface CountdownRow {
  id: string;
  label: string;
  appName: string;
  appType: string;
  [env: string]: string | ExpiryConfigEntry;
}

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
  currentView: 'status' | 'countdown' = 'status';
  currentTime = Date.now();
  countdownTimerId?: ReturnType<typeof setInterval>;
  countdownViewSwitchTimerId?: ReturnType<typeof setTimeout>;
  appFilterValue = '';
  countdownAlertThreshold: CountdownAlertThreshold = { months: 1, days: 0 };
  isCountdownLoading = false;

  selectedProject: Entity | undefined;

  envs: string[] = [];
  envForm: FormControl;
  environmentsFilterForProject: Entity[];

  dataTableApps: App[] = [];
  dataSource: AppDataSource;
  dataApp = new BehaviorSubject<App[]>([]);
  filteredStatusApps: App[] = [];
  countdownRows: CountdownRow[] = [];
  filteredCountdownRows: CountdownRow[] = [];

  displayedColumns: string[];
  displayedColumnsSubject = new BehaviorSubject<string[]>(this.columnDef);
  displayedColumnsSubject$ = this.displayedColumnsSubject.asObservable();

  componentDestroyed$: Subject<boolean> = new Subject();

  ngOnInit() {
    this.dataSource = new AppDataSource(this.dataApp);
    this.loadProjects();
  }

  loadProjects() {
    this.http
      .get<{
        projects: Entity[];
        environments: Entity[];
        EnvAppInfoByParent: ParentExpiryConfig[];
        countdownAlertThreshold?: CountdownAlertThreshold;
      }>('/assets/config.json')
      .subscribe((data) => {
      let allEnvironmentsFromConfig = data.environments;
      this.countdownAlertThreshold = this.normalizeCountdownAlertThreshold(data.countdownAlertThreshold);

      // Find the selected project configuration
      this.selectedProject = data.projects.find((project) => project.name === this.projectName);

      if (!this.selectedProject) {
        console.error(`Project ${this.projectName} not found in config.json`);
        return;
      }

      this.initializeCountdownRows(data.EnvAppInfoByParent || []);
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
          this.applyAppFilter();
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
    if (this.countdownTimerId) {
      clearInterval(this.countdownTimerId);
    }
    if (this.countdownViewSwitchTimerId) {
      clearTimeout(this.countdownViewSwitchTimerId);
    }
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
    this.appFilterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.applyAppFilter();
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

  setView(view: 'status' | 'countdown') {
    if (view === this.currentView) {
      return;
    }

    if (this.countdownViewSwitchTimerId) {
      clearTimeout(this.countdownViewSwitchTimerId);
    }

    this.isCountdownLoading = true;
    this.countdownViewSwitchTimerId = setTimeout(() => {
      this.currentView = view;
      this.ensureCountdownTimer();
      this.applyAppFilter();
      this.isCountdownLoading = false;
    }, 0);
  }

  isCountdownView(): boolean {
    return this.currentView === 'countdown';
  }

  formatCountdownLabel(row: CountdownRow): string {
    return `${this.formatAppType(row.appType)} / ${row.appName}`;
  }

  formatAppType(appType: string): string {
    switch (appType) {
      case 'AppCertificate':
        return 'Certificate';
      case 'AppReg':
        return 'App Reg';
      default:
        return appType;
    }
  }

  getCountdownEntry(row: CountdownRow, env: string): ExpiryConfigEntry | null {
    const value = row[env];
    return value && typeof value !== 'string' ? (value as ExpiryConfigEntry) : null;
  }

  getCountdownDisplay(expiryDate: string): string {
    const remainingMs = this.getRemainingMs(expiryDate);
    if (remainingMs <= 0) {
      return '0m 0d';
    }

    const startDate = new Date(this.currentTime);
    const targetDate = new Date(`${expiryDate} 23:59:59`);
    const breakdown = this.getDurationBreakdown(startDate, targetDate);

    return `${breakdown.months}m ${breakdown.days}d`;
  }

  getCountdownMeta(expiryDate: string): string {
    const remainingMs = this.getRemainingMs(expiryDate);
    if (remainingMs <= 0) {
      return `Expired on ${expiryDate}`;
    }

    return `Expires on ${expiryDate}`;
  }

  isExpired(expiryDate: string): boolean {
    return this.getRemainingMs(expiryDate) <= 0;
  }

  isUrgent(expiryDate: string): boolean {
    if (this.isExpired(expiryDate)) {
      return false;
    }

    const threshold = this.countdownAlertThreshold;
    const thresholdDate = new Date(this.currentTime);
    thresholdDate.setMonth(thresholdDate.getMonth() + (threshold.months || 0));
    thresholdDate.setDate(thresholdDate.getDate() + (threshold.days || 0));

    return new Date(`${expiryDate} 23:59:59`) <= thresholdDate;
  }

  trackByCountdownRow(_: number, row: CountdownRow): string {
    return row.id;
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

  private initializeCountdownRows(parentConfigs: ParentExpiryConfig[]) {
    const parentExpiry = parentConfigs.find((item) => item.parent === this.projectName)?.expiryTime || {};
    const countdownMap = new Map<string, CountdownRow>();

    Object.entries(parentExpiry).forEach(([envName, entries]) => {
      entries.forEach((entry) => {
        const rowId = `${entry.appType}::${entry.appName}`;
        const existingRow = countdownMap.get(rowId);

        if (existingRow) {
          existingRow[envName] = entry;
          return;
        }

        countdownMap.set(rowId, {
          id: rowId,
          label: `${this.formatAppType(entry.appType)} / ${entry.appName}`,
          appName: entry.appName,
          appType: entry.appType,
          [envName]: entry,
        });
      });
    });

    this.countdownRows = Array.from(countdownMap.values()).sort((a, b) => a.label.localeCompare(b.label));
    this.filteredCountdownRows = this.countdownRows.slice();
    this.ensureCountdownTimer();
  }

  private ensureCountdownTimer() {
    if (!this.isCountdownView() || this.countdownTimerId) {
      return;
    }

    this.countdownTimerId = setInterval(() => {
      this.currentTime = Date.now();
    }, 1000);
  }

  private applyAppFilter() {
    const filterValue = this.appFilterValue;

    this.filteredStatusApps = this.dataTableApps.filter((app) => app.app_name.toLowerCase().includes(filterValue));
    this.dataApp.next(this.filteredStatusApps);

    this.filteredCountdownRows = this.countdownRows.filter((row) => row.label.toLowerCase().includes(filterValue));
  }

  private getRemainingMs(expiryDate: string): number {
    const target = new Date(`${expiryDate} 23:59:59`).getTime();
    return target - this.currentTime;
  }

  private getDurationBreakdown(startDate: Date, endDate: Date): { months: number; days: number; hours: number } {
    const cursor = new Date(startDate);
    let months = 0;

    while (true) {
      const nextMonth = new Date(cursor);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      if (nextMonth <= endDate) {
        months++;
        cursor.setMonth(cursor.getMonth() + 1);
      } else {
        break;
      }
    }

    const remainingMs = endDate.getTime() - cursor.getTime();
    const totalHours = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    return { months, days, hours };
  }

  private normalizeCountdownAlertThreshold(threshold?: CountdownAlertThreshold): CountdownAlertThreshold {
    return {
      months: Math.max(0, Number(threshold?.months || 0)),
      days: Math.max(0, Number(threshold?.days || 0)),
    };
  }
}
