import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppInfo } from 'src/app/models/data-model/app-info';
import { EnvAppInfoByParent } from 'src/app/models/data-model/env-app-info-data';
import { Clipboard } from '@angular/cdk/clipboard';
import { EnvironmentByParent } from 'src/app/models/data-model/env-info';

export interface EnvDetailsDialogData {
  parent: string;
  env: string;
}

@Component({
  selector: 'app-env-details-dialog',
  templateUrl: './env-details-dialog.component.html',
  styleUrls: ['./env-details-dialog.component.scss'],
})
export class EnvDetailsDialogComponent {
  displayedColumns: string[] = ['position', 'name', 'type', 'url'];

  filteredData: EnvironmentByParent;
  dataSource: AppInfo[];
  envName: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public filterParam: EnvDetailsDialogData,
    private clipboard: Clipboard,
    private snackBar: MatSnackBar
  ) {
    this.filteredData = EnvAppInfoByParent.filter(
      (e) => e.parent === filterParam.parent
    )[0];
    const envObjects = Object.values(this.filteredData.envs);
    Object.keys(this.filteredData.envs).forEach((appKey, index) => {
      if (appKey === filterParam.env) {
        this.envName = appKey.toUpperCase();
        this.dataSource = envObjects[index];
      }
    });
  }

  goToLink(url: string) {
    window.open(url);
  }

  copyToClipboard(tag: string) {
    this.clipboard.copy(tag);
    this.snackBar.open('Copied to clipboard', tag, { duration: 1000 });
  }
}
