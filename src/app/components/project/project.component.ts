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

interface ReleaseConfigEvent {
  type: string;
  version: string;
  releaseDate: string;
  Note?: string;
}

interface ReleaseConfigApp {
  appName: string;
  Events: ReleaseConfigEvent[];
}

interface ReleaseCalendarEvent {
  id: string;
  appName: string;
  type: string;
  version: string;
  note: string;
  releaseDate: string;
  date: Date;
  dateKey: string;
}

interface CalendarDayCell {
  id: string;
  date: Date | null;
  dayNumber: number | null;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: ReleaseCalendarEvent[];
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
  currentView: 'status' | 'countdown' | 'calendar' = 'status';
  currentTime = Date.now();
  countdownTimerId?: ReturnType<typeof setInterval>;
  countdownViewSwitchTimerId?: ReturnType<typeof setTimeout>;
  appFilterValue = '';
  countdownAlertThreshold: CountdownAlertThreshold = { months: 1, days: 0 };
  isCountdownLoading = false;
  selectedCalendarDate = this.createDateOnly(new Date());
  calendarActiveDate = this.createMonthStart(new Date());
  releaseEvents: ReleaseCalendarEvent[] = [];
  filteredReleaseEvents: ReleaseCalendarEvent[] = [];
  releaseEventsByDate = new Map<string, ReleaseCalendarEvent[]>();
  calendarWeeks: CalendarDayCell[][] = [];
  readonly calendarWeekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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
        Releases?: ReleaseConfigApp[];
      }>('/assets/config.json')
      .subscribe((data) => {
      let allEnvironmentsFromConfig = data.environments;
      this.countdownAlertThreshold = this.normalizeCountdownAlertThreshold(data.countdownAlertThreshold);
      this.initializeReleaseEvents(data.Releases || []);

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

  setView(view: 'status' | 'countdown' | 'calendar') {
    if (view === this.currentView) {
      return;
    }

    if (this.countdownViewSwitchTimerId) {
      clearTimeout(this.countdownViewSwitchTimerId);
    }
    if (view !== 'countdown' && this.countdownTimerId) {
      clearInterval(this.countdownTimerId);
      this.countdownTimerId = undefined;
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

  isCalendarView(): boolean {
    return this.currentView === 'calendar';
  }

  selectCalendarDate(day: CalendarDayCell) {
    if (!day.date) {
      return;
    }

    this.selectedCalendarDate = this.createDateOnly(day.date);
    this.buildCalendarWeeks();
  }

  getCalendarMonthLabel(): string {
    return this.calendarActiveDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  goToPreviousMonth() {
    this.syncCalendarMonth(new Date(this.calendarActiveDate.getFullYear(), this.calendarActiveDate.getMonth() - 1, 1));
  }

  goToNextMonth() {
    this.syncCalendarMonth(new Date(this.calendarActiveDate.getFullYear(), this.calendarActiveDate.getMonth() + 1, 1));
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
    this.filteredReleaseEvents = this.releaseEvents.filter((event) => {
      const searchableText = `${event.appName} ${event.type} ${event.version} ${event.note}`.toLowerCase();
      return searchableText.includes(filterValue);
    });
    this.rebuildReleaseEventLookup();
    this.buildCalendarWeeks();
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

  private initializeReleaseEvents(releaseConfigs: ReleaseConfigApp[]) {
    this.releaseEvents = releaseConfigs
      .flatMap((releaseApp, appIndex) =>
        (releaseApp.Events || [])
          .map((event, eventIndex) => this.mapReleaseEvent(releaseApp.appName, event, appIndex, eventIndex))
          .filter((event): event is ReleaseCalendarEvent => event !== null)
      )
      .sort((first, second) => first.date.getTime() - second.date.getTime() || first.appName.localeCompare(second.appName));

    this.filteredReleaseEvents = this.releaseEvents.slice();
    this.rebuildReleaseEventLookup();
  }

  private mapReleaseEvent(appName: string, event: ReleaseConfigEvent, appIndex: number, eventIndex: number): ReleaseCalendarEvent | null {
    const parsedDate = this.parseConfigDate(event.releaseDate);

    if (!parsedDate) {
      console.warn(`Invalid releaseDate "${event.releaseDate}" for ${appName}`);
      return null;
    }

    return {
      id: `${appIndex}-${eventIndex}-${this.toDateKey(parsedDate)}`,
      appName,
      type: event.type,
      version: event.version,
      note: event.Note || '',
      releaseDate: event.releaseDate,
      date: parsedDate,
      dateKey: this.toDateKey(parsedDate),
    };
  }

  private parseConfigDate(rawDate: string): Date | null {
    const dateParts = rawDate?.split('/').map((value) => Number(value));

    if (!dateParts || dateParts.length !== 3 || dateParts.some((value) => Number.isNaN(value))) {
      return null;
    }

    const [month, day, year] = dateParts;
    const parsedDate = new Date(year, month - 1, day);

    if (parsedDate.getFullYear() !== year || parsedDate.getMonth() !== month - 1 || parsedDate.getDate() !== day) {
      return null;
    }

    return this.createDateOnly(parsedDate);
  }

  private rebuildReleaseEventLookup() {
    const lookup = new Map<string, ReleaseCalendarEvent[]>();

    this.filteredReleaseEvents.forEach((event) => {
      const existingEvents = lookup.get(event.dateKey) || [];
      existingEvents.push(event);
      lookup.set(event.dateKey, existingEvents);
    });

    this.releaseEventsByDate = lookup;
  }

  private syncCalendarMonth(activeDate: Date) {
    const normalizedDate = this.createMonthStart(activeDate);

    if (
      normalizedDate.getFullYear() === this.calendarActiveDate.getFullYear() &&
      normalizedDate.getMonth() === this.calendarActiveDate.getMonth()
    ) {
      return;
    }

    this.calendarActiveDate = normalizedDate;
    this.buildCalendarWeeks();
  }

  private buildCalendarWeeks() {
    const year = this.calendarActiveDate.getFullYear();
    const month = this.calendarActiveDate.getMonth();
    const monthStart = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingEmptyDays = monthStart.getDay();
    const selectedDateKey = this.toDateKey(this.selectedCalendarDate);
    const todayDateKey = this.toDateKey(this.createDateOnly(new Date()));
    const calendarCells: CalendarDayCell[] = [];

    for (let index = 0; index < leadingEmptyDays; index++) {
      calendarCells.push({
        id: `empty-start-${index}`,
        date: null,
        dayNumber: null,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        events: [],
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = this.toDateKey(date);

      calendarCells.push({
        id: dateKey,
        date,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateKey === todayDateKey,
        isSelected: dateKey === selectedDateKey,
        events: this.releaseEventsByDate.get(dateKey) || [],
      });
    }

    while (calendarCells.length % 7 !== 0) {
      calendarCells.push({
        id: `empty-end-${calendarCells.length}`,
        date: null,
        dayNumber: null,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        events: [],
      });
    }

    this.calendarWeeks = [];
    for (let index = 0; index < calendarCells.length; index += 7) {
      this.calendarWeeks.push(calendarCells.slice(index, index + 7));
    }
  }

  private createDateOnly(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private createMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
