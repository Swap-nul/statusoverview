import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SelectionModel } from '@angular/cdk/collections';
import { App } from 'src/app/models/tag-version/app';
import { DeployDetails } from 'src/app/models/tag-version/deploy-details';
import { Entity } from 'src/app/models/data-model/entity';
import { ApplicationsService } from 'src/app/services/applications.service';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface BulkDeployDialogData {
  projectName: string;
  environments: Entity[];
  apps: App[];
}

export interface BulkDeployApp {
  appName: string;
  currentVersion: string;
  currentBranch: string;
  toEnvVersion: string;
  toEnvBranch: string;
  selected: boolean;
}

@Component({
  selector: 'app-bulk-deploy-dialog',
  templateUrl: './bulk-deploy-dialog.component.html',
  styleUrls: ['./bulk-deploy-dialog.component.scss']
})
export class BulkDeployDialogComponent implements OnInit {
  fromEnvControl = new FormControl('');
  toEnvControl = new FormControl('');
  
  availableEnvironments: Entity[] = [];
  bulkDeployApps: BulkDeployApp[] = [];
  filteredApps: BulkDeployApp[] = [];
  
  displayedColumns: string[] = ['select', 'appName', 'currentVersion', 'currentBranch', 'toEnvVersion', 'toEnvBranch'];
  selection = new SelectionModel<BulkDeployApp>(true, []);
  
  isLoading = false;
  showAppsTable = false;

  constructor(
    public dialogRef: MatDialogRef<BulkDeployDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BulkDeployDialogData,
    private applicationsService: ApplicationsService,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.availableEnvironments = data.environments;
  }

  ngOnInit() {
    // Subscribe to FROM environment changes
    this.fromEnvControl.valueChanges.subscribe((fromEnv) => {
      if (fromEnv && this.toEnvControl.value) {
        this.loadAppsFromEnvironment(fromEnv);
      } else {
        this.showAppsTable = false;
        this.bulkDeployApps = [];
        this.selection.clear();
      }
    });

    // Subscribe to TO environment changes
    this.toEnvControl.valueChanges.subscribe((toEnv) => {
      if (this.fromEnvControl.value && toEnv) {
        this.loadAppsFromEnvironment(this.fromEnvControl.value);
      } else if (this.fromEnvControl.value) {
        // Reload to clear TO environment data
        this.loadAppsFromEnvironment(this.fromEnvControl.value);
      } else {
        this.showAppsTable = false;
        this.bulkDeployApps = [];
        this.selection.clear();
      }
    });
  }

  loadAppsFromEnvironment(fromEnv: string) {
    this.isLoading = true;
    this.bulkDeployApps = [];
    this.selection.clear();

    const toEnv = this.toEnvControl.value;

    // Filter apps that have deployment data for the selected FROM environment
    this.data.apps.forEach(app => {
      const fromEnvData = (app as any)[fromEnv] as DeployDetails;
      if (fromEnvData && fromEnvData.tag) {
        // Get TO environment data if available
        const toEnvData = toEnv ? (app as any)[toEnv] as DeployDetails : null;
        
        this.bulkDeployApps.push({
          appName: app.app_name,
          currentVersion: fromEnvData.tag,
          currentBranch: fromEnvData.branch || 'N/A',
          toEnvVersion: toEnvData?.tag || 'N/A',
          toEnvBranch: toEnvData?.branch || 'N/A',
          selected: false
        });
      }
    });

    this.filteredApps = [...this.bulkDeployApps];
    this.showAppsTable = this.bulkDeployApps.length > 0;
    this.isLoading = false;

    if (this.bulkDeployApps.length === 0) {
      this.snackBar.open(`No applications found in ${fromEnv.toUpperCase()} environment`, 'Close', {
        duration: 3000
      });
    }
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.filteredApps.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      this.filteredApps.forEach(app => app.selected = false);
    } else {
      this.selection.select(...this.filteredApps);
      this.filteredApps.forEach(app => app.selected = true);
    }
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: BulkDeployApp): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row`;
  }

  toggleAppSelection(app: BulkDeployApp) {
    this.selection.toggle(app);
    app.selected = this.selection.isSelected(app);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredApps = this.bulkDeployApps.filter(app => 
      app.appName.toLowerCase().includes(filterValue)
    );
    
    // Update selection to only include visible apps
    const currentlySelected = this.selection.selected;
    this.selection.clear();
    
    currentlySelected.forEach(selectedApp => {
      if (this.filteredApps.includes(selectedApp)) {
        this.selection.select(selectedApp);
      }
    });
  }

  canDeploy(): boolean {
    return this.fromEnvControl.value !== '' && 
           this.toEnvControl.value !== '' && 
           this.fromEnvControl.value !== this.toEnvControl.value &&
           this.selection.selected.length > 0;
  }

  onDeploy() {
    if (!this.canDeploy()) {
      return;
    }

    const fromEnv = this.fromEnvControl.value!;
    const toEnv = this.toEnvControl.value!;
    const selectedApps = this.selection.selected;

    this.isLoading = true;

    // Create deployment payload
    const deploymentPayload = {
      projectName: this.data.projectName,
      fromEnvironment: fromEnv,
      toEnvironment: toEnv,
      applications: selectedApps.map(app => ({
        appName: app.appName,
        version: app.currentVersion,
        branch: app.currentBranch
      }))
    };

    // Call Jenkins service to trigger bulk deployment
    // For now, we'll use a mock implementation
    this.triggerMockDeployment(deploymentPayload).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.snackBar.open(
          `Bulk deployment initiated for ${selectedApps.length} applications from ${fromEnv.toUpperCase()} to ${toEnv.toUpperCase()}`,
          'Close',
          { duration: 5000 }
        );
        this.dialogRef.close({ success: true, response });
      },
      error: (error: any) => {
        this.isLoading = false;
        this.snackBar.open(
          `Failed to initiate bulk deployment: ${error.message || 'Unknown error'}`,
          'Close',
          { duration: 5000 }
        );
      }
    });
  }

  onCancel() {
    this.dialogRef.close({ success: false });
  }

  getFromEnvironmentDisplayName(): string {
    const fromEnv = this.availableEnvironments.find(env => env.name === this.fromEnvControl.value);
    return fromEnv ? fromEnv.displayName : '';
  }

  getToEnvironmentDisplayName(): string {
    const toEnv = this.availableEnvironments.find(env => env.name === this.toEnvControl.value);
    return toEnv ? toEnv.displayName : '';
  }

  // Mock method for triggering deployment - replace with actual Jenkins service call
  private triggerMockDeployment(payload: any): Observable<any> {
    // Simulate API call delay
    return new Observable(observer => {
      setTimeout(() => {
        // Simulate successful response
        observer.next({
          jobId: `mock-job-${Date.now()}`,
          status: 'TRIGGERED',
          message: 'Mock deployment triggered successfully'
        });
        observer.complete();
      }, 2000);
    });
  }
}
