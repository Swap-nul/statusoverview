import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { firstValueFrom, Observable } from 'rxjs';
import { AppConfigService } from '../app-config.service';
import { App } from '../models/tag-version/app';
import { Builds } from '../models/tag-version/builds';
import { DeployDetails } from '../models/tag-version/deploy-details';
import { HttpsService } from './https.service';
import { PostgRestHttpService } from './postgrest-http.service';

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  private envList: string[];

  constructor(
    private postgrestHttpService: PostgRestHttpService,
    private httpsService: HttpsService,
    private configService: AppConfigService,
    private http: HttpClient
  ) {}

  private async getEnvList(): Promise<string[]> {
    if (this.envList) {
      return this.envList!;
    }
    const config: any = await firstValueFrom(this.http.get('/assets/config.json'));
    this.envList = config.EnvList;
    return this.envList;
  }

  async fillLatestBuildTagForEachEnv(app: App): Promise<App> {
    return new Promise<App>(async (resolve, reject) => {
      const config: any = await firstValueFrom(this.http.get('/assets/config.json'));
      const envKeys: string[] = config.EnvList;
      const appKeys = Object.keys(app);
      const appObjects = Object.values(app);
      appKeys.forEach((appKey, index) => {
        if (envKeys.includes(appKey.toString()) && appObjects[index] != undefined) {
          if (!(appObjects[index].branch == undefined)) {
            const branch = appObjects[index].branch.replace(/\//g, '%2F');
            const endpoint =
              '/builds?branch=like.*' + branch + '*&image=like.*' + app.app_name + '*&order=build_id.desc';
            this.postgrestHttpService.get(endpoint).subscribe((builds: Builds[]) => {
              if (builds.length != 0) {
                appObjects[index].latest_build_tag = builds[0].tag;
              }
            });
          }
        }
      });
      app.app_repo = config.Repository[app.app_name];
      resolve(app);
    });
  }

  getFilteredAppsByProjectAndDeployments(projectName: string): Observable<App[]> {
    const endpoint = this.configService.get('database_baseUrl') + '?parent=eq.' + projectName;

    return this.postgrestHttpService.get(endpoint);
  }

  getAllBuildsForAppAndBranch(appId: string, branch: string): Observable<Builds[]> {
    branch = branch.replace(/\//g, '%2F');
    const endpoint = '/builds?app_id=eq.' + appId + '&branch=eq.' + branch + '&order=build_id.desc';
    return this.postgrestHttpService.get(endpoint);
  }

  getApplicationAppId(appName: string): Observable<{ id: string }[]> {
    const endpoint = '/apps?select=id&app_name=eq.' + appName;
    return this.postgrestHttpService.get(endpoint);
  }

  getStatus(hostname: string, endpoint: string): Observable<string> {
    const requestOptions = {
      headers: new HttpHeaders({}),
      responseType: 'text',
    };
    return this.httpsService.get(hostname + endpoint, requestOptions);
  }

  public sortByAppName(sort: Sort, data: App[]) {
    if (sort.active && sort.direction !== '') {
      data = data.sort((a: App, b: App) => {
        const isAsc = sort.direction === 'asc';
        switch (sort.active) {
          case 'name':
            return this.compare(a.app_name, b.app_name, isAsc);
          default:
            return 0;
        }
      });
    }
    return data;
  }

  private compare(a: string | number, b: string | number, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  public sortTableBy(sort: Sort, data: App[], env: string) {
    if (sort.active && sort.direction !== '') {
      data = data.sort((a: App, b: App) => {
        const isAsc = sort.direction === 'asc';
        return this.compareEnvApps(a, b, env, sort.active, isAsc);
      });
    }
    return data;
  }

  private compareEnvApps(a: App, b: App, env: string, sortBy: string, isAsc: boolean) {
    let aEnvDetail: DeployDetails = {
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

    let bEnvDetail: DeployDetails = {
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

    const envAObjects = Object.values(a);
    Object.keys(a).forEach((appKey, index) => {
      if (appKey === env) {
        aEnvDetail = envAObjects[index];
      }
    });
    const envBObjects = Object.values(b);
    Object.keys(b).forEach((appKey, index) => {
      if (appKey === env) {
        bEnvDetail = envBObjects[index];
      }
    });

    if (aEnvDetail === null && bEnvDetail === null) {
      return 0;
    } else if (aEnvDetail === null) {
      return isAsc ? 1 : -1;
    } else if (bEnvDetail === null) {
      return isAsc ? -1 : 1;
    } else {
      switch (sortBy) {
        case 'tag':
          return (aEnvDetail.tag < bEnvDetail.tag ? -1 : 1) * (isAsc ? 1 : -1);
        case 'branch':
          return (aEnvDetail.branch < bEnvDetail.branch ? -1 : 1) * (isAsc ? 1 : -1);
        case 'status':
          return (aEnvDetail.status < bEnvDetail.status ? -1 : 1) * (isAsc ? 1 : -1);
        case 'cluster':
          return (aEnvDetail.cluster < bEnvDetail.cluster ? -1 : 1) * (isAsc ? 1 : -1);
        case 'commitby':
          return (aEnvDetail.commitby < bEnvDetail.commitby ? -1 : 1) * (isAsc ? 1 : -1);
        case 'commit_id':
          return (aEnvDetail.commit_id < bEnvDetail.commit_id ? -1 : 1) * (isAsc ? 1 : -1);
        case 'namespace':
          return (aEnvDetail.namespace < bEnvDetail.namespace ? -1 : 1) * (isAsc ? 1 : -1);
        case 'previous_tag':
          return (aEnvDetail.previous_tag < bEnvDetail.previous_tag ? -1 : 1) * (isAsc ? 1 : -1);
        case 'commitmessage':
          return (aEnvDetail.commitmessage < bEnvDetail.commitmessage ? -1 : 1) * (isAsc ? 1 : -1);
        case 'image_created_at':
          return this.compareImageCreatedAtDateField(aEnvDetail, bEnvDetail, isAsc);
        case 'image_deployed_at':
          return this.compareImageDeployedAtDateField(aEnvDetail, bEnvDetail, isAsc);
        case 'image_deployed_by':
          return (aEnvDetail.image_deployed_by < bEnvDetail.image_deployed_by ? -1 : 1) * (isAsc ? 1 : -1);
        case 'latest_build_tag':
          return (aEnvDetail.latest_build_tag < bEnvDetail.latest_build_tag ? -1 : 1) * (isAsc ? 1 : -1);
        default:
          return 0;
      }
    }
  }

  compareImageCreatedAtDateField(a: DeployDetails, b: DeployDetails, isAsc: boolean) {
    if (
      (a.image_created_at === null || this.isEmptyOrWhitespace(a.image_created_at)) &&
      (b.image_created_at === null || this.isEmptyOrWhitespace(b.image_created_at))
    ) {
      return 0;
    } else if (a.image_created_at === null || this.isEmptyOrWhitespace(a.image_created_at)) {
      return isAsc ? 1 : -1; // Place null values at the end for ascending order, and vice versa
    } else if (b.image_created_at === null || this.isEmptyOrWhitespace(b.image_created_at)) {
      return isAsc ? -1 : 1; // Place null values at the end for ascending order, and vice versa
    } else {
      // Compare non-null values as usual
      const dateA = new Date(a.image_created_at);
      const dateB = new Date(b.image_created_at);
      return (isAsc ? 1 : -1) * (dateA < dateB ? -1 : 1);
    }
  }

  compareImageDeployedAtDateField(a: DeployDetails, b: DeployDetails, isAsc: boolean) {
    if (
      (a.image_deployed_at === null || this.isEmptyOrWhitespace(a.image_deployed_at)) &&
      (b.image_deployed_at === null || this.isEmptyOrWhitespace(b.image_deployed_at))
    ) {
      return 0;
    } else if (a.image_deployed_at === null || this.isEmptyOrWhitespace(a.image_deployed_at)) {
      return isAsc ? 1 : -1; // Place null values at the end for ascending order, and vice versa
    } else if (b.image_deployed_at === null || this.isEmptyOrWhitespace(b.image_deployed_at)) {
      return isAsc ? -1 : 1; // Place null values at the end for ascending order, and vice versa
    } else {
      const dateA = new Date(a.image_deployed_at);
      const dateB = new Date(b.image_deployed_at);
      return (isAsc ? 1 : -1) * (dateA < dateB ? -1 : 1);
    }
  }

  isEmptyOrWhitespace(str: string): boolean {
    if (str != null) {
      return str.trim() === '';
    } else {
      return true;
    }
  }

  downloadCSV(environment: string, data: App[]) {
    const jsonCSVData = this.extractCSVData(environment, data);
    const csvData = this.convertJsonToCsv(jsonCSVData);
    this.downloadAsCsv(csvData, environment);
  }

  private downloadAsCsv(csvData: string, environment: string) {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', environment + '.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private extractCSVData(environment: string, data: App[]) {
    const jsonCSVData: {
      appName: string;
      tag: string;
      branch: string;
      status: string;
      cluster: string;
      commitBy: string;
      commitId: string;
      namespace: string;
      commitMessage: string;
      imageCreatedAt: string;
      imageDeployedAt: string;
      imageDeployedBy: string;
      latestBuildTag: string;
    }[] = [];

    data.forEach((app) => {
      let a: DeployDetails = {
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

      if (app.hasOwnProperty(environment)) {
        const envBObjects = Object.values(app);
        Object.keys(app).forEach((appKey, index) => {
          if (appKey === environment) {
            a = envBObjects[index];
          }
        });

        if (a) {
          jsonCSVData.push({
            appName: app.app_name ? `'${app.app_name.replace(/\n/g, '')}'` : app.app_name,
            tag: a.tag ? `'${a.tag.replace(/\n/g, '')}'` : a.tag,
            branch: a.branch ? `'${a.branch.replace(/\n/g, '')}'` : a.branch,
            status: a.status ? `'${a.status.replace(/\n/g, '')}'` : a.status,
            cluster: a.cluster ? `'${a.cluster.replace(/\n/g, '')}'` : a.cluster,
            commitBy: a.commitby ? `'${a.commitby.replace(/\n/g, '')}'` : a.commitby,
            commitId: a.commit_id ? `'${a.commit_id.replace(/\n/g, '')}'` : a.commit_id,
            namespace: a.namespace ? `'${a.namespace.replace(/\n/g, '')}'` : a.namespace,
            commitMessage: a.commitmessage ? `'${a.commitmessage.replace(/\n/g, '')}'` : a.commitmessage,
            imageCreatedAt: a.image_created_at ? `'${a.image_created_at.replace(/\n/g, '')}'` : a.image_created_at,
            imageDeployedAt: a.image_deployed_at ? `'${a.image_deployed_at.replace(/\n/g, '')}'` : a.image_deployed_at,
            imageDeployedBy: a.image_deployed_by ? `'${a.image_deployed_by.replace(/\n/g, '')}'` : a.image_deployed_by,
            latestBuildTag: a.latest_build_tag ? `'${a.latest_build_tag.replace(/\n/g, '')}'` : a.latest_build_tag,
          });
        }
      }
    });
    return jsonCSVData;
  }

  private convertJsonToCsv(jsonData: any[]): string {
    const headers = Object.keys(jsonData[0]);
    const csvRows = [];

    csvRows.push(headers.join(','));

    jsonData.forEach((item) => {
      const values = headers.map((header) => item[header]);
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  goToArgoCD(appName: string, env: string) {
    if (env.includes('prod')) {
      window.open(this.configService.get('argoCD_prod_Url') + appName + '-' + env);
    } else if (env.includes('dr')) {
      window.open(this.configService.get('argoCD_dr_Url') + appName + '-prod');
    } else {
      window.open(this.configService.get('argoCD_nonprod_Url') + appName + '-' + env);
    }
  }

  goToKibana(appName: string, env: string, portfolio: string) {
    let filterEndpoint: string = this.configService.get('kibanaFilterUrl');

    filterEndpoint = filterEndpoint
      .replaceAll('APP_NAME', appName)
      .replaceAll('ENVIRONMENT', env)
      .replaceAll('PARENT', portfolio);

    if (env.includes('prod') || env.includes('dr')) {
      filterEndpoint = filterEndpoint.replace('HOSTNAME', this.configService.get('KibanaHOSTNAME_PROD_DR'));
    } else {
      filterEndpoint = filterEndpoint.replace('HOSTNAME', this.configService.get('KibanaHOSTNAME_NONPROD'));
    }
    window.open(filterEndpoint);
  }
}
