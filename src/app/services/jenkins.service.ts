import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AppConfigService } from '../app-config.service';

export interface BulkDeploymentPayload {
  projectName: string;
  fromEnvironment: string;
  toEnvironment: string;
  applications: {
    appName: string;
    version: string;
    branch: string;
  }[];
}

export interface SingleAppDeploymentPayload {
  projectName: string;
  appName: string;
  fromEnvironment: string;
  toEnvironment: string;
  version: string;
  branch: string;
  triggerUser?: string;
  bulkJobId?: string;
}

export interface JenkinsJobResponse {
  jobId: string;
  status: string;
  message: string;
  queueId?: number;
}

export interface TriggeredJob {
  jobId: string;
  appName: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  buildNumber?: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class JenkinsService {
  private jenkinsBaseUrl: string;
  private jenkinsApiUser: string;
  private jenkinsApiToken: string;

  constructor(
    private http: HttpClient,
    private configService: AppConfigService
  ) {
    // Initialize Jenkins configuration
    this.jenkinsBaseUrl = this.configService.get('jenkinsBaseUrl') || 'http://localhost:8082';
    this.jenkinsApiUser = this.configService.get('jenkinsApiUser') || 'admin';
    this.jenkinsApiToken = this.configService.get('jenkinsApiToken') || 'admin123';
  }

  /**
   * Triggers a bulk deployment by creating individual Jenkins jobs for each application
   * @param payload The deployment configuration
   * @returns Observable with the Jenkins job response
   */
  triggerBulkDeployment(payload: BulkDeploymentPayload): Observable<JenkinsJobResponse> {
    const jenkinsJobName = 'bulk-deployment-trigger'; // Updated to use the new trigger job
    const url = `${this.jenkinsBaseUrl}/job/${jenkinsJobName}/buildWithParameters`;

    // Create URL parameters
    const params = new URLSearchParams();
    params.append('PROJECT_NAME', payload.projectName);
    params.append('FROM_ENVIRONMENT', payload.fromEnvironment);
    params.append('TO_ENVIRONMENT', payload.toEnvironment);
    params.append('APPLICATIONS_JSON', JSON.stringify(payload.applications));
    params.append('TRIGGER_USER', this.getCurrentUser());

    // Add authentication headers
    const headers = new HttpHeaders({
      'Authorization': `Basic ${btoa(`${this.jenkinsApiUser}:${this.jenkinsApiToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post(url, params.toString(), { 
      headers, 
      observe: 'response',
      responseType: 'text'
    }).pipe(
      map((response: HttpResponse<string>) => {
        // Jenkins returns a 201 status code for successful job creation
        if (response.status === 201) {
          // Extract queue ID from Location header if available
          const locationHeader = response.headers.get('Location');
          const queueId = this.extractQueueIdFromLocation(locationHeader);
          
          return {
            jobId: this.generateJobId(),
            status: 'TRIGGERED',
            message: `Bulk deployment trigger initiated for ${payload.applications.length} applications. Individual jobs will be created for each app.`,
            queueId: queueId
          };
        } else {
          throw new Error(`Unexpected response status: ${response.status}`);
        }
      }),
      catchError(error => {
        console.error('Jenkins API Error:', error);
        
        let errorMessage = 'Failed to trigger bulk deployment job';
        if (error.status === 401) {
          errorMessage = 'Authentication failed. Please check Jenkins credentials.';
        } else if (error.status === 403) {
          errorMessage = 'Permission denied. User does not have access to trigger Jenkins jobs.';
        } else if (error.status === 404) {
          errorMessage = 'Jenkins bulk deployment trigger job not found. Please check job configuration.';
        } else if (error.error) {
          errorMessage = `Jenkins error: ${error.error}`;
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Triggers a single application deployment
   * @param payload The single app deployment configuration
   * @returns Observable with the Jenkins job response
   */
  triggerSingleAppDeployment(payload: SingleAppDeploymentPayload): Observable<JenkinsJobResponse> {
    const jenkinsJobName = 'single-app-deployment';
    const url = `${this.jenkinsBaseUrl}/job/${jenkinsJobName}/buildWithParameters`;

    // Create URL parameters
    const params = new URLSearchParams();
    params.append('PROJECT_NAME', payload.projectName);
    params.append('APP_NAME', payload.appName);
    params.append('FROM_ENVIRONMENT', payload.fromEnvironment);
    params.append('TO_ENVIRONMENT', payload.toEnvironment);
    params.append('VERSION', payload.version);
    params.append('BRANCH', payload.branch);
    params.append('TRIGGER_USER', payload.triggerUser || this.getCurrentUser());
    if (payload.bulkJobId) {
      params.append('BULK_JOB_ID', payload.bulkJobId);
    }

    // Add authentication headers
    const headers = new HttpHeaders({
      'Authorization': `Basic ${btoa(`${this.jenkinsApiUser}:${this.jenkinsApiToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post(url, params.toString(), { 
      headers, 
      observe: 'response',
      responseType: 'text'
    }).pipe(
      map((response: HttpResponse<string>) => {
        if (response.status === 201) {
          const locationHeader = response.headers.get('Location');
          const queueId = this.extractQueueIdFromLocation(locationHeader);
          
          return {
            jobId: this.generateJobId(),
            status: 'TRIGGERED',
            message: `Deployment job triggered for ${payload.appName}`,
            queueId: queueId
          };
        } else {
          throw new Error(`Unexpected response status: ${response.status}`);
        }
      }),
      catchError(error => {
        console.error('Jenkins Single App Deployment Error:', error);
        
        let errorMessage = `Failed to trigger deployment for ${payload.appName}`;
        if (error.status === 401) {
          errorMessage = 'Authentication failed. Please check Jenkins credentials.';
        } else if (error.status === 403) {
          errorMessage = 'Permission denied. User does not have access to trigger Jenkins jobs.';
        } else if (error.status === 404) {
          errorMessage = 'Jenkins single app deployment job not found. Please check job configuration.';
        } else if (error.error) {
          errorMessage = `Jenkins error: ${error.error}`;
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Gets the detailed status of a specific job
   * @param jobName The Jenkins job name
   * @param buildNumber The build number (optional, uses last build if not specified)
   * @returns Observable with detailed job status
   */
  getJobStatus(jobName: string, buildNumber?: number): Observable<any> {
    let url = `${this.jenkinsBaseUrl}/job/${jobName}/`;
    
    if (buildNumber) {
      url += `${buildNumber}/`;
    } else {
      url += 'lastBuild/';
    }
    
    url += 'api/json';

    const headers = new HttpHeaders({
      'Authorization': `Basic ${btoa(`${this.jenkinsApiUser}:${this.jenkinsApiToken}`)}`
    });

    return this.http.get(url, { headers }).pipe(
      catchError(error => {
        console.error('Failed to get job status:', error);
        return throwError(() => new Error(`Failed to get status for job ${jobName}`));
      })
    );
  }

  /**
   * Gets Jenkins console output for a specific job build
   * @param jobName The Jenkins job name
   * @param buildNumber The build number
   * @returns Observable with console output
   */
  getConsoleOutput(jobName: string, buildNumber: number): Observable<string> {
    const url = `${this.jenkinsBaseUrl}/job/${jobName}/${buildNumber}/consoleText`;

    const headers = new HttpHeaders({
      'Authorization': `Basic ${btoa(`${this.jenkinsApiUser}:${this.jenkinsApiToken}`)}`
    });

    return this.http.get(url, { 
      headers, 
      responseType: 'text' 
    }).pipe(
      catchError(error => {
        console.error('Error fetching Jenkins console output:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Gets the status of triggered jobs from a bulk deployment
   * @param bulkJobId The bulk job ID to track
   * @returns Observable with array of triggered job statuses
   */
  getTriggeredJobsStatus(bulkJobId: string): Observable<TriggeredJob[]> {
    // This method would poll Jenkins API to get status of individual jobs
    // For now, returning a mock implementation
    console.log(`Getting status for bulk job: ${bulkJobId}`);
    
    // In a real implementation, this would:
    // 1. Query Jenkins for all jobs with the bulk job ID parameter
    // 2. Get their current status
    // 3. Return aggregated results
    
    return of([]);
  }

  /**
   * Gets all builds for the bulk deployment trigger job
   * @returns Observable with build information
   */
  getBulkDeploymentBuilds(): Observable<any> {
    const url = `${this.jenkinsBaseUrl}/job/bulk-deployment-trigger/api/json?tree=builds[number,timestamp,result,actions[parameters[name,value]]]`;

    const headers = new HttpHeaders({
      'Authorization': `Basic ${btoa(`${this.jenkinsApiUser}:${this.jenkinsApiToken}`)}`
    });

    return this.http.get(url, { headers }).pipe(
      catchError(error => {
        console.error('Failed to get bulk deployment builds:', error);
        return throwError(() => new Error('Failed to get bulk deployment history'));
      })
    );
  }

  private extractQueueIdFromLocation(locationHeader: string | null): number | undefined {
    if (!locationHeader) return undefined;
    
    const queueMatch = locationHeader.match(/\/queue\/item\/(\d+)\//);
    return queueMatch ? parseInt(queueMatch[1], 10) : undefined;
  }

  private generateJobId(): string {
    return `bulk-deploy-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  private getCurrentUser(): string {
    // This should get the current user from your authentication service
    // For now, returning a placeholder
    return 'status-overview-user';
  }

  /**
   * Validates Jenkins connectivity and authentication
   * @returns Observable boolean indicating if Jenkins is accessible
   */
  validateJenkinsConnection(): Observable<boolean> {
    const url = `${this.jenkinsBaseUrl}/api/json`;
    
    const headers = new HttpHeaders({
      'Authorization': `Basic ${btoa(`${this.jenkinsApiUser}:${this.jenkinsApiToken}`)}`
    });

    return this.http.get(url, { headers }).pipe(
      map(() => true),
      catchError(() => {
        return of(false);
      })
    );
  }
}
