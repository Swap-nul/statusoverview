import { Clipboard } from '@angular/cdk/clipboard';
import { DatePipe } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { BuildsDataSource } from 'src/app/models/data-source/builds-dataSource';
import { Builds } from 'src/app/models/tag-version/builds';
import { DialogData } from 'src/app/models/tag-version/dialog-data';
import { ApplicationsService } from 'src/app/services/applications.service';

@Component({
  selector: 'app-details-dialog',
  templateUrl: './details-dialog.component.html',
  styleUrls: ['./details-dialog.component.scss'],
})
export class DetailsDialogComponent implements OnInit, OnDestroy {
  dialogData: DialogData;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private clipboard: Clipboard,
    private snackBar: MatSnackBar,
    private applicationService: ApplicationsService,
    private datePipe: DatePipe
  ) {
    this.dialogData = data;
  }

  displayedColumns: string[] = [
    'position',
    'version',
    'created_at',
    'commitby',
    'commitmessage',
  ];

  dataTableBuilds: Builds[] = [];
  dataSource: BuildsDataSource;
  dataApp = new BehaviorSubject<Builds[]>([]);
  componentDestroyed$: Subject<boolean> = new Subject();

  ngOnInit() {
    this.dataSource = new BuildsDataSource(this.dataApp);
    this.applicationService
      .getApplicationAppId(this.dialogData.app_name)
      .subscribe((appIds) => {
        if (!appIds?.length || !this.dialogData.deployDetails.branch) {
          this.dataApp.next([]);
          return;
        }

        this.applicationService
          .getAllBuildsForAppAndBranch(
            appIds[0].id,
            this.dialogData.deployDetails.branch
          )
          .pipe(takeUntil(this.componentDestroyed$))
          .subscribe((builds) => {
            this.dataTableBuilds = builds.map((build) => ({
              ...build,
              created_at: this.formatDateTime(build.created_at),
            }));
            this.dataApp.next(this.dataTableBuilds);
          });
      });
  }

  ngOnDestroy() {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  copyToClipboard(tag: string) {
    if (!tag) {
      return;
    }
    this.clipboard.copy(tag);
    this.snackBar.open('Copied to clipboard', tag, { duration: 1000 });
  }

  goToLink(appName: string, env: string) {
    this.applicationService.goToArgoCD(appName, env);
  }

  safe(value: unknown, fallback: string = '--'): string {
    if (value === null || value === undefined) {
      return fallback;
    }

    const text = String(value).trim();
    if (!text || text.toLowerCase() === 'null' || text.toLowerCase() === 'undefined') {
      return fallback;
    }

    return text;
  }

  formatDateTime(value: string): string {
    const sanitized = this.safe(value, '');
    if (!sanitized) {
      return '--';
    }

    const parsedDate = new Date(sanitized);
    if (Number.isNaN(parsedDate.getTime())) {
      return this.safe(value);
    }

    return this.datePipe.transform(parsedDate, 'yyyy-MM-dd HH:mm:ss') || this.safe(value);
  }
}
