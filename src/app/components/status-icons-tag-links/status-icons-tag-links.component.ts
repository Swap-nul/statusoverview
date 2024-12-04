import { Clipboard } from '@angular/cdk/clipboard';
import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { App } from 'src/app/models/tagsVersionModels/App';
import { DialogData } from 'src/app/models/tagsVersionModels/DailogData';
import { DeployDetails } from 'src/app/models/tagsVersionModels/DeployDetails';
import { ApplicationsService } from 'src/app/services/applications.service';
import { DetailsDialogComponent } from '../details-dialog/details-dialog.component';

@Component({
  selector: 'app-status-icons-tag-links',
  templateUrl: './status-icons-tag-links.component.html',
  styleUrls: ['./status-icons-tag-links.component.scss'],
})
export class StatusIconsTagLinksComponent {
  @Input() appDeployDetails: DeployDetails = {
    tag: '',
    branch: '',
    status: 'Degarded',
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
    this.dialog.open(DetailsDialogComponent, { data });
  }

  copyToClipboard(tag: string) {
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
}
