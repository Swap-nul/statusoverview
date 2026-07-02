import { Clipboard } from '@angular/cdk/clipboard';
import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { App } from 'src/app/models/tag-version/app';
import { DialogData } from 'src/app/models/tag-version/dialog-data';
import { DeployDetails } from 'src/app/models/tag-version/deploy-details';
import { ApplicationsService } from 'src/app/services/applications.service';
import { DetailsDialogComponent } from '../details-dialog/details-dialog.component';

@Component({
  selector: 'app-status-icons-tag-links',
  templateUrl: './status-icons-tag-links.component.html',
  styleUrls: ['./status-icons-tag-links.component.scss'],
})
export class StatusIconsTagLinksComponent {
  private readonly emptyDeployDetails: DeployDetails = {
    tag: '',
    branch: '',
    status: '',
    cluster: '',
    commitby: '',
    commit_id: '',
    namespace: '',
    previous_tag: '',
    commitmessage: '',
    image_created_at: '',
    image_deployed_at: '',
    image_deployed_by: '',
    latest_build_tag: '',
  };
  private _appDeployDetails: DeployDetails = { ...this.emptyDeployDetails };

  @Input() set appDeployDetails(value: DeployDetails | null | undefined) {
    this._appDeployDetails = value || { ...this.emptyDeployDetails };
    this.normalizeDeployDetails(this._appDeployDetails);
  }
  get appDeployDetails(): DeployDetails {
    return this._appDeployDetails;
  }

  @Input() env: string = '';
  @Input() app: App = {
    portfolio: '',
    parent: '',
    app_name: '',
    app_repo: '',
    envs: {},
    updated_on: '',
  };

  constructor(
    public dialog: MatDialog,
    private clipboard: Clipboard,
    private snackBar: MatSnackBar,
    private applicationService: ApplicationsService
  ) {}

  openDetailsDialog(envName: string, deployDetails: DeployDetails, app: App) {
    const data: DialogData = {
      envName: envName,
      portfolio: app.portfolio,
      app_name: app.app_name,
      deployDetails: deployDetails,
    };
    this.dialog.open(DetailsDialogComponent, {
      data,
      width: '1080px',
      height: '92vh',
      maxWidth: '96vw',
      maxHeight: 'calc(100vh - 24px)',
      panelClass: 'refined-details-dialog',
    });
  }

  copyToClipboard(tag: string) {
    if (!tag) {
      return;
    }
    this.clipboard.copy(tag);
    this.snackBar.open('Copied to clipboard', tag, {
      duration: 1000,
      verticalPosition: 'top',
      horizontalPosition: 'right',
    });
  }

  goToArgoCD(appName: string, env: string) {
    this.applicationService.goToArgoCD(appName, env);
  }

  goToKibana(appName: string, env: string, portfolio: string) {
    this.applicationService.goToKibana(appName, env, portfolio);
  }

  private normalizeDeployDetails(value: DeployDetails): void {
    if (!value) {
      return;
    }

    value.tag = this.normalizeText(value.tag);
    value.branch = this.normalizeText(value.branch);
    value.status = this.normalizeText(value.status);
    value.cluster = this.normalizeText(value.cluster);
    value.commitby = this.normalizeText(value.commitby);
    value.commit_id = this.normalizeText(value.commit_id);
    value.namespace = this.normalizeText(value.namespace);
    value.previous_tag = this.normalizeText(value.previous_tag);
    value.commitmessage = this.normalizeText(value.commitmessage);
    value.image_created_at = this.normalizeText(value.image_created_at);
    value.image_deployed_at = this.normalizeText(value.image_deployed_at);
    value.image_deployed_by = this.normalizeText(value.image_deployed_by);
    value.latest_build_tag = this.normalizeText(value.latest_build_tag);
  }

  private normalizeText(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    const normalized = String(value).trim();
    return normalized.toLowerCase() === 'null' ? '' : normalized;
  }
}
